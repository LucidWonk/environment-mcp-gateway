import { GitAdapter } from '../adapters/git-adapter.js';
import { GitDomainAnalyzer } from '../domain/git-domain-analyzer.js';
import { AzureDevOpsToolRegistry } from './azure-devops-tool-registry.js';
import { SemanticAnalysisService } from '../services/semantic-analysis.js';
import { BusinessConceptExtractor } from '../services/business-concept-extractor.js';
import { CSharpParser } from '../services/csharp-parser.js';
import { ContextGenerator } from '../services/context-generator.js';
import { contextGenerationTools, contextGenerationHandlers } from '../tools/context-generation.js';
import { 
    executeHolisticContextUpdateTool,
    getHolisticUpdateStatusTool,
    rollbackHolisticUpdateTool,
    validateHolisticUpdateConfigTool,
    performHolisticUpdateMaintenanceTool,
    handleExecuteHolisticContextUpdate,
    handleGetHolisticUpdateStatus,
    handleRollbackHolisticUpdate,
    handleValidateHolisticUpdateConfig,
    handlePerformHolisticUpdateMaintenance
} from '../tools/holistic-context-updates.js';
import {
    getCrossDomainImpactAnalysisTools,
    getCrossDomainImpactAnalysisHandlers
} from '../tools/cross-domain-impact-analysis.js';
import {
    getUpdateIntegrationTools,
    getUpdateIntegrationHandlers
} from '../tools/update-integration.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { Environment } from '../domain/config/environment.js';

const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    handler: (args: any) => Promise<{ content: Array<{ type: string; text: string }> }>;
}

export class ToolRegistry {
    private gitAdapter: GitAdapter;
    private azureDevOpsToolRegistry: AzureDevOpsToolRegistry;
    private semanticAnalysisService: SemanticAnalysisService;
    private businessConceptExtractor: BusinessConceptExtractor;
    private csharpParser: CSharpParser;
    private contextGenerator: ContextGenerator;

    constructor() {
        this.gitAdapter = new GitAdapter();
        this.azureDevOpsToolRegistry = new AzureDevOpsToolRegistry();
        this.semanticAnalysisService = new SemanticAnalysisService();
        this.businessConceptExtractor = new BusinessConceptExtractor();
        this.csharpParser = new CSharpParser();
        this.contextGenerator = new ContextGenerator();
    }

    public getAllTools(): ToolDefinition[] {
        return [
            ...this.getGitTools(),
            ...this.getAzureDevOpsTools(),
            ...this.getSemanticAnalysisTools(),
            ...this.getContextGenerationTools(),
            ...this.getHolisticContextUpdateTools(),
            ...this.getCrossDomainImpactAnalysisTools(),
            ...this.getUpdateIntegrationTools()
        ];
    }

    public getGitTools(): ToolDefinition[] {
        return [
            {
                name: 'list-branches',
                description: 'Show all branches with status, recent activity, and domain context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeDomainContext: {
                            type: 'boolean',
                            description: 'Include domain-specific context analysis',
                            default: true
                        }
                    }
                },
                handler: this.listBranches.bind(this)
            },
            {
                name: 'create-feature-branch',
                description: 'Create branches following DDD naming (feature/analysis/*, feature/data/*, feature/messaging/*)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        branchName: {
                            type: 'string',
                            description: 'Branch name with domain prefix (e.g., feature/analysis/fractal-improvements)'
                        },
                        baseBranch: {
                            type: 'string',
                            description: 'Base branch to create from',
                            default: 'master'
                        }
                    },
                    required: ['branchName']
                },
                handler: this.createFeatureBranch.bind(this)
            },
            {
                name: 'analyze-recent-commits',
                description: 'Show recent commits with impact analysis on trading domains',
                inputSchema: {
                    type: 'object',
                    properties: {
                        count: {
                            type: 'number',
                            description: 'Number of recent commits to analyze',
                            default: 10
                        },
                        includeDomainAnalysis: {
                            type: 'boolean',
                            description: 'Include domain impact analysis',
                            default: true
                        }
                    }
                },
                handler: this.analyzeRecentCommits.bind(this)
            },
            {
                name: 'get-commit-details',
                description: 'Detailed commit info with affected projects/domains',
                inputSchema: {
                    type: 'object',
                    properties: {
                        commitHash: {
                            type: 'string',
                            description: 'Git commit hash (full or short)'
                        }
                    },
                    required: ['commitHash']
                },
                handler: this.getCommitDetails.bind(this)
            },
            {
                name: 'merge-branch',
                description: 'Safe branch merging with conflict detection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourceBranch: {
                            type: 'string',
                            description: 'Source branch to merge from'
                        },
                        targetBranch: {
                            type: 'string',
                            description: 'Target branch to merge into',
                            default: 'master'
                        },
                        analyzeOnly: {
                            type: 'boolean',
                            description: 'Only analyze merge, do not execute',
                            default: false
                        }
                    },
                    required: ['sourceBranch']
                },
                handler: this.mergeBranch.bind(this)
            },
            {
                name: 'analyze-code-impact',
                description: 'Map file changes to DDD domains (Analysis, Data, Messaging)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePaths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of file paths to analyze'
                        },
                        baseBranch: {
                            type: 'string',
                            description: 'Base branch for comparison',
                            default: 'master'
                        },
                        targetBranch: {
                            type: 'string',
                            description: 'Target branch for comparison (current if not specified)'
                        }
                    }
                },
                handler: this.analyzeCodeImpact.bind(this)
            },
            {
                name: 'validate-git-workflow',
                description: 'Ensure proper Git workflow compliance',
                inputSchema: {
                    type: 'object',
                    properties: {
                        strict: {
                            type: 'boolean',
                            description: 'Enable strict workflow validation',
                            default: false
                        }
                    }
                },
                handler: this.validateGitWorkflow.bind(this)
            }
        ];
    }

    private async listBranches(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { includeDomainContext = true } = args;
        
        logger.info('Listing branches with domain context', { includeDomainContext });
        
        try {
            const branches = await this.gitAdapter.listBranches();
            
            // Add domain context if requested
            if (includeDomainContext) {
                for (const branch of branches) {
                    branch.domainContext = GitDomainAnalyzer.analyzeBranchDomainContext(branch);
                }
            }

            const result = {
                timestamp: new Date().toISOString(),
                totalBranches: branches.length,
                currentBranch: branches.find(b => b.current)?.name || 'unknown',
                branches: branches.map(b => ({
                    name: b.name,
                    current: b.current,
                    remote: b.remote,
                    lastCommit: {
                        hash: b.lastCommit.hash.substring(0, 7),
                        date: b.lastCommit.date,
                        message: b.lastCommit.message,
                        author: b.lastCommit.author
                    },
                    ahead: b.ahead,
                    behind: b.behind,
                    domainContext: b.domainContext
                })),
                summary: {
                    upToDate: branches.filter(b => b.ahead === 0 && b.behind === 0).length,
                    needsPush: branches.filter(b => b.ahead > 0).length,
                    needsPull: branches.filter(b => b.behind > 0).length
                }
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to list branches', { error });
            throw new McpError(ErrorCode.InternalError, `Failed to list branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async createFeatureBranch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { branchName, baseBranch = 'master' } = args;
        
        if (!branchName) {
            throw new McpError(ErrorCode.InvalidParams, 'Branch name is required');
        }

        logger.info('Creating feature branch', { branchName, baseBranch });
        
        try {
            const success = await this.gitAdapter.createFeatureBranch(branchName, baseBranch);
            
            // Analyze domain context
            const domainContext = GitDomainAnalyzer.analyzeBranchDomainContext({
                name: branchName,
                current: true,
                remote: null,
                lastCommit: { hash: '', date: new Date(), message: '', author: '' },
                ahead: 0,
                behind: 0
            });

            const result = {
                timestamp: new Date().toISOString(),
                success,
                branchName,
                baseBranch,
                domainContext,
                message: success ? `Successfully created feature branch: ${branchName}` : `Failed to create branch: ${branchName}`,
                nextSteps: [
                    'Start implementing your feature',
                    'Follow domain-driven design patterns',
                    'Run tests before committing',
                    'Push to remote when ready for review'
                ]
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to create feature branch', { branchName, baseBranch, error });
            throw new McpError(ErrorCode.InternalError, `Failed to create feature branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async analyzeRecentCommits(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { count = 10, includeDomainAnalysis = true } = args;
        
        logger.info('Analyzing recent commits', { count, includeDomainAnalysis });
        
        try {
            const commits = await this.gitAdapter.analyzeRecentCommits(count);
            
            // Add domain analysis if requested
            const analyzedCommits = commits.map(commit => {
                const analysis = includeDomainAnalysis ? 
                    GitDomainAnalyzer.analyzeCommitDomainImpact(commit) : 
                    null;
                
                return {
                    hash: commit.hash.substring(0, 7),
                    date: commit.date,
                    message: commit.message,
                    author: commit.author,
                    filesChanged: commit.files.length,
                    domainAnalysis: analysis ? {
                        domains: analysis.domains,
                        primaryDomain: analysis.primaryDomain,
                        crossDomainImpact: analysis.crossDomainImpact,
                        businessImpact: analysis.businessImpact,
                        riskLevel: analysis.riskLevel,
                        affectedProjects: analysis.affectedProjects
                    } : null,
                    files: commit.files.map(f => ({
                        path: f.path,
                        status: f.status,
                        domain: f.domain
                    }))
                };
            });

            const result = {
                timestamp: new Date().toISOString(),
                totalCommits: commits.length,
                commits: analyzedCommits,
                summary: {
                    totalFilesChanged: commits.reduce((sum, c) => sum + c.files.length, 0),
                    domainDistribution: this.calculateDomainDistribution(commits),
                    riskDistribution: this.calculateRiskDistribution(commits)
                }
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to analyze recent commits', { error });
            throw new McpError(ErrorCode.InternalError, `Failed to analyze recent commits: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async getCommitDetails(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { commitHash } = args;
        
        if (!commitHash) {
            throw new McpError(ErrorCode.InvalidParams, 'Commit hash is required');
        }

        logger.info('Getting commit details', { commitHash });
        
        try {
            const commit = await this.gitAdapter.getCommitDetails(commitHash);
            const domainAnalysis = GitDomainAnalyzer.analyzeCommitDomainImpact(commit);

            const result = {
                timestamp: new Date().toISOString(),
                commit: {
                    hash: commit.hash,
                    shortHash: commit.shortHash,
                    date: commit.date,
                    message: commit.message,
                    author: commit.author,
                    email: commit.email,
                    filesChanged: commit.files.length
                },
                domainAnalysis: {
                    domains: domainAnalysis.domains,
                    primaryDomain: domainAnalysis.primaryDomain,
                    crossDomainImpact: domainAnalysis.crossDomainImpact,
                    businessImpact: domainAnalysis.businessImpact,
                    riskLevel: domainAnalysis.riskLevel,
                    affectedProjects: domainAnalysis.affectedProjects
                },
                files: commit.files.map(f => ({
                    path: f.path,
                    status: f.status,
                    domain: f.domain || GitDomainAnalyzer.mapFileToDomain(f.path)
                })),
                recommendations: this.generateCommitRecommendations(domainAnalysis)
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to get commit details', { commitHash, error });
            throw new McpError(ErrorCode.InternalError, `Failed to get commit details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async mergeBranch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { sourceBranch, targetBranch = 'master', analyzeOnly = false } = args;
        
        if (!sourceBranch) {
            throw new McpError(ErrorCode.InvalidParams, 'Source branch is required');
        }

        logger.info('Analyzing/performing branch merge', { sourceBranch, targetBranch, analyzeOnly });
        
        try {
            if (analyzeOnly) {
                const analysis = await this.gitAdapter.analyzeMerge(sourceBranch, targetBranch);
                
                // Add domain analysis for merge changes
                const filePaths = analysis.previewChanges.map(c => c.path);
                const codeImpact = GitDomainAnalyzer.analyzeCodeImpact(filePaths);

                const result = {
                    timestamp: new Date().toISOString(),
                    mergeAnalysis: {
                        canMerge: analysis.canMerge,
                        conflicts: analysis.conflicts,
                        conflictFiles: analysis.conflictFiles,
                        baseBranch: analysis.baseBranch,
                        targetBranch: analysis.targetBranch,
                        ahead: analysis.ahead,
                        behind: analysis.behind,
                        changesCount: analysis.previewChanges.length
                    },
                    domainImpact: {
                        domainBreakdown: Array.from(codeImpact.domainBreakdown.entries()),
                        crossDomainFiles: codeImpact.crossDomainFiles,
                        riskAssessment: codeImpact.riskAssessment,
                        recommendations: codeImpact.recommendations
                    },
                    previewChanges: analysis.previewChanges.map(c => ({
                        path: c.path,
                        status: c.status,
                        domain: GitDomainAnalyzer.mapFileToDomain(c.path)
                    }))
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            } else {
                const mergeResult = await this.gitAdapter.mergeBranch(sourceBranch, targetBranch);
                
                const result = {
                    timestamp: new Date().toISOString(),
                    mergeResult: {
                        success: mergeResult.canMerge,
                        conflicts: mergeResult.conflicts,
                        conflictFiles: mergeResult.conflictFiles,
                        sourceBranch,
                        targetBranch,
                        changesCount: mergeResult.previewChanges.length
                    },
                    message: mergeResult.canMerge ? 
                        `Successfully merged ${sourceBranch} into ${targetBranch}` : 
                        'Merge failed due to conflicts',
                    nextSteps: mergeResult.canMerge ? [
                        'Verify merge was successful',
                        'Run tests to ensure functionality',
                        'Consider deleting feature branch if complete'
                    ] : [
                        'Resolve merge conflicts',
                        'Test conflict resolution',
                        'Retry merge'
                    ]
                };

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
        } catch (error) {
            logger.error('Failed to merge branch', { sourceBranch, targetBranch, error });
            throw new McpError(ErrorCode.InternalError, `Failed to merge branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async analyzeCodeImpact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { filePaths, baseBranch = 'master', targetBranch } = args;
        
        logger.info('Analyzing code impact', { filePaths, baseBranch, targetBranch });
        
        try {
            let pathsToAnalyze = filePaths;
            
            // If no specific file paths provided, get changed files from git
            if (!pathsToAnalyze || pathsToAnalyze.length === 0) {
                const commits = await this.gitAdapter.analyzeRecentCommits(1);
                if (commits.length > 0) {
                    pathsToAnalyze = commits[0].files.map(f => f.path);
                }
            }

            const codeImpact = GitDomainAnalyzer.analyzeCodeImpact(pathsToAnalyze || []);
            
            const result = {
                timestamp: new Date().toISOString(),
                analyzedFiles: pathsToAnalyze?.length || 0,
                domainImpact: {
                    domainBreakdown: Array.from(codeImpact.domainBreakdown.entries()).map(([domain, count]) => ({
                        domain,
                        filesAffected: count,
                        description: GitDomainAnalyzer.getDomainDescription(domain)
                    })),
                    crossDomainFiles: codeImpact.crossDomainFiles,
                    riskAssessment: codeImpact.riskAssessment,
                    recommendations: codeImpact.recommendations
                },
                fileAnalysis: pathsToAnalyze?.map((path: string) => ({
                    path,
                    domain: GitDomainAnalyzer.mapFileToDomain(path),
                    project: this.extractProjectFromPath(path)
                })) || []
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to analyze code impact', { error });
            throw new McpError(ErrorCode.InternalError, `Failed to analyze code impact: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async validateGitWorkflow(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { strict = false } = args;
        
        logger.info('Validating Git workflow', { strict });
        
        try {
            const validation = await this.gitAdapter.validateGitWorkflow();
            
            const result = {
                timestamp: new Date().toISOString(),
                workflow: {
                    currentBranch: validation.currentBranch,
                    isClean: validation.isClean,
                    hasUncommitted: validation.hasUncommitted,
                    hasUntracked: validation.hasUntracked,
                    branchUpToDate: validation.branchUpToDate,
                    followsNamingConvention: validation.followsNamingConvention
                },
                validation: {
                    overallStatus: validation.issues.length === 0 ? 'PASS' : 
                        validation.issues.every(i => i.type !== 'error') ? 'PASS_WITH_WARNINGS' : 'FAIL',
                    issues: validation.issues,
                    strictMode: strict
                },
                recommendations: this.generateWorkflowRecommendations(validation, strict)
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to validate Git workflow', { error });
            throw new McpError(ErrorCode.InternalError, `Failed to validate Git workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private calculateDomainDistribution(commits: any[]): Record<string, number> {
        const distribution: Record<string, number> = {};
        
        for (const commit of commits) {
            const analysis = GitDomainAnalyzer.analyzeCommitDomainImpact(commit);
            for (const domain of analysis.domains) {
                distribution[domain] = (distribution[domain] || 0) + 1;
            }
        }
        
        return distribution;
    }

    private calculateRiskDistribution(commits: any[]): Record<string, number> {
        const distribution: Record<string, number> = {};
        
        for (const commit of commits) {
            const analysis = GitDomainAnalyzer.analyzeCommitDomainImpact(commit);
            distribution[analysis.riskLevel] = (distribution[analysis.riskLevel] || 0) + 1;
        }
        
        return distribution;
    }

    private generateCommitRecommendations(analysis: any): string[] {
        const recommendations: string[] = [];
        
        if (analysis.riskLevel === 'high') {
            recommendations.push('High risk commit - ensure comprehensive testing');
            recommendations.push('Consider breaking into smaller commits');
        }
        
        if (analysis.crossDomainImpact) {
            recommendations.push('Cross-domain changes detected - run full integration tests');
        }
        
        if (analysis.domains.includes('Analysis')) {
            recommendations.push('Analysis domain affected - validate trading algorithm accuracy');
        }
        
        return recommendations;
    }

    private generateWorkflowRecommendations(validation: any, strict: boolean): string[] {
        const recommendations: string[] = [];
        
        if (!validation.isClean) {
            recommendations.push('Commit or stash pending changes');
        }
        
        if (!validation.branchUpToDate) {
            recommendations.push('Pull latest changes from remote');
        }
        
        if (!validation.followsNamingConvention && strict) {
            recommendations.push('Use domain-specific branch naming (feature/analysis/*, feature/data/*, etc.)');
        }
        
        return recommendations;
    }

    private extractProjectFromPath(filePath: string): string {
        const parts = filePath.split('/');
        return parts[0] || 'unknown';
    }

    public getAzureDevOpsTools(): ToolDefinition[] {
        return this.azureDevOpsToolRegistry.getAzureDevOpsTools();
    }

    public getSemanticAnalysisTools(): ToolDefinition[] {
        return [
            {
                name: 'analyze-code-changes-for-context',
                description: 'Analyze code changes for semantic meaning and business concepts',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePaths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of file paths to analyze'
                        },
                        includeBusinessRules: {
                            type: 'boolean',
                            description: 'Include business rule extraction',
                            default: true
                        }
                    },
                    required: ['filePaths']
                },
                handler: this.analyzeCodeChangesForContext.bind(this)
            },
            {
                name: 'extract-business-concepts',
                description: 'Extract business concepts and domain relationships from code',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePaths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of file paths to analyze'
                        },
                        clusterConcepts: {
                            type: 'boolean',
                            description: 'Group concepts into domain clusters',
                            default: true
                        }
                    },
                    required: ['filePaths']
                },
                handler: this.extractBusinessConcepts.bind(this)
            },
            {
                name: 'identify-business-rules',
                description: 'Identify business rules from code comments and validation methods',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePaths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of file paths to analyze'
                        },
                        confidenceThreshold: {
                            type: 'number',
                            description: 'Minimum confidence level for rules (0.0-1.0)',
                            default: 0.6
                        }
                    },
                    required: ['filePaths']
                },
                handler: this.identifyBusinessRules.bind(this)
            }
        ];
    }

    public getContextGenerationTools(): ToolDefinition[] {
        return contextGenerationTools.map(tool => ({
            name: tool.name,
            description: tool.description || 'Context generation tool',
            inputSchema: tool.inputSchema as any,
            handler: async (args: any) => {
                const handlerFn = contextGenerationHandlers[tool.name as keyof typeof contextGenerationHandlers];
                if (!handlerFn) {
                    throw new McpError(ErrorCode.MethodNotFound, `Handler not found for tool: ${tool.name}`);
                }
                
                const result = await handlerFn(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
        }));
    }

    private async analyzeCodeChangesForContext(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { filePaths, includeBusinessRules = true } = args;
        
        logger.info('Analyzing code changes for context', { filePaths, includeBusinessRules });
        
        try {
            const results = await this.semanticAnalysisService.analyzeCodeChanges(filePaths);
            
            const analysis = {
                timestamp: new Date().toISOString(),
                filesAnalyzed: results.length,
                totalAnalysisTime: results.reduce((sum, r) => sum + r.analysisTime, 0),
                results: results.map(result => ({
                    filePath: result.filePath,
                    language: result.language,
                    domainContext: result.domainContext,
                    businessConcepts: result.businessConcepts.map(concept => ({
                        name: concept.name,
                        type: concept.type,
                        domain: concept.domain,
                        confidence: concept.confidence
                    })),
                    businessRules: includeBusinessRules ? result.businessRules.map(rule => ({
                        id: rule.id,
                        description: rule.description,
                        domain: rule.domain,
                        confidence: rule.confidence
                    })) : [],
                    analysisTime: result.analysisTime
                })),
                summary: this.generateAnalysisSummary(results)
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(analysis, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to analyze code changes for context', { error, filePaths });
            throw new McpError(ErrorCode.InternalError, `Failed to analyze code changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async extractBusinessConcepts(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { filePaths, clusterConcepts = true } = args;
        
        logger.info('Extracting business concepts', { filePaths, clusterConcepts });
        
        try {
            const semanticResults = await this.semanticAnalysisService.analyzeCodeChanges(filePaths);
            
            // Collect all concepts and rules
            const allConcepts = semanticResults.flatMap(r => r.businessConcepts);
            const allRules = semanticResults.flatMap(r => r.businessRules);
            
            let extraction;
            if (clusterConcepts) {
                extraction = this.businessConceptExtractor.extractBusinessConcepts(allConcepts, allRules);
            } else {
                extraction = {
                    clusters: [{
                        domain: 'All',
                        concepts: allConcepts,
                        rules: allRules,
                        relationships: [],
                        confidence: allConcepts.length > 0 ? allConcepts.reduce((sum, c) => sum + c.confidence, 0) / allConcepts.length : 0
                    }],
                    summary: `Extracted ${allConcepts.length} concepts and ${allRules.length} rules`,
                    domainBoundaries: [...new Set(allConcepts.map(c => c.domain))],
                    crossDomainRelationships: []
                };
            }

            const result = {
                timestamp: new Date().toISOString(),
                filesAnalyzed: filePaths.length,
                extraction
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to extract business concepts', { error, filePaths });
            throw new McpError(ErrorCode.InternalError, `Failed to extract business concepts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async identifyBusinessRules(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { filePaths, confidenceThreshold = 0.6 } = args;
        
        logger.info('Identifying business rules', { filePaths, confidenceThreshold });
        
        try {
            const semanticResults = await this.semanticAnalysisService.analyzeCodeChanges(filePaths);
            
            // Collect and filter business rules
            const allRules = semanticResults.flatMap(r => r.businessRules);
            const filteredRules = allRules.filter(rule => rule.confidence >= confidenceThreshold);
            
            // Group rules by domain
            const rulesByDomain = filteredRules.reduce((acc, rule) => {
                const domain = rule.domain || 'Unknown';
                if (!acc[domain]) acc[domain] = [];
                acc[domain].push(rule);
                return acc;
            }, {} as Record<string, typeof filteredRules>);

            const result = {
                timestamp: new Date().toISOString(),
                filesAnalyzed: filePaths.length,
                totalRulesFound: allRules.length,
                rulesAboveThreshold: filteredRules.length,
                confidenceThreshold,
                rulesByDomain,
                summary: `Found ${filteredRules.length} business rules above confidence threshold ${confidenceThreshold} across ${Object.keys(rulesByDomain).length} domains`
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to identify business rules', { error, filePaths });
            throw new McpError(ErrorCode.InternalError, `Failed to identify business rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private generateAnalysisSummary(results: any[]): string {
        const totalConcepts = results.reduce((sum: number, r: any) => sum + r.businessConcepts.length, 0);
        const totalRules = results.reduce((sum: number, r: any) => sum + r.businessRules.length, 0);
        const domains = [...new Set(results.flatMap((r: any) => r.businessConcepts.map((c: any) => c.domain)))];
        const avgConfidence = results.length > 0 
            ? results.reduce((sum: number, r: any) => sum + (r.businessConcepts.reduce((cSum: number, c: any) => cSum + c.confidence, 0) / Math.max(r.businessConcepts.length, 1)), 0) / results.length 
            : 0;

        return `Analyzed ${results.length} files, extracted ${totalConcepts} business concepts and ${totalRules} business rules across ${domains.length} domains (${domains.join(', ')}). Average confidence: ${(avgConfidence * 100).toFixed(1)}%`;
    }

    public getHolisticContextUpdateTools(): ToolDefinition[] {
        const holisticTools = [
            executeHolisticContextUpdateTool,
            getHolisticUpdateStatusTool,
            rollbackHolisticUpdateTool,
            validateHolisticUpdateConfigTool,
            performHolisticUpdateMaintenanceTool
        ];

        return holisticTools.map(tool => ({
            name: tool.name,
            description: tool.description || 'Holistic context update tool',
            inputSchema: tool.inputSchema as any,
            handler: async (args: any) => {
                let result;
                
                switch (tool.name) {
                case 'execute-holistic-context-update':
                    result = await handleExecuteHolisticContextUpdate(args);
                    break;
                case 'get-holistic-update-status':
                    result = await handleGetHolisticUpdateStatus(args);
                    break;
                case 'rollback-holistic-update':
                    result = await handleRollbackHolisticUpdate(args);
                    break;
                case 'validate-holistic-update-config':
                    result = await handleValidateHolisticUpdateConfig(args);
                    break;
                case 'perform-holistic-update-maintenance':
                    result = await handlePerformHolisticUpdateMaintenance(args);
                    break;
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Handler not found for tool: ${tool.name}`);
                }
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
        }));
    }

    public getCrossDomainImpactAnalysisTools(): ToolDefinition[] {
        const crossDomainTools = getCrossDomainImpactAnalysisTools();
        const handlers = getCrossDomainImpactAnalysisHandlers();

        return crossDomainTools.map(tool => ({
            name: tool.name,
            description: tool.description || 'Cross-domain impact analysis tool',
            inputSchema: tool.inputSchema as any,
            handler: async (args: any) => {
                const handlerFn = handlers.get(tool.name);
                if (!handlerFn) {
                    throw new McpError(ErrorCode.MethodNotFound, `Handler not found for tool: ${tool.name}`);
                }
                
                const result = await handlerFn(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
        }));
    }

    public getUpdateIntegrationTools(): ToolDefinition[] {
        const integrationTools = getUpdateIntegrationTools();
        const handlers = getUpdateIntegrationHandlers();

        return integrationTools.map(tool => ({
            name: tool.name,
            description: tool.description || 'Update integration tool',
            inputSchema: tool.inputSchema as any,
            handler: async (args: any) => {
                const handlerFn = handlers.get(tool.name);
                if (!handlerFn) {
                    throw new McpError(ErrorCode.MethodNotFound, `Handler not found for tool: ${tool.name}`);
                }
                
                const result = await handlerFn(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
        }));
    }
}

// Export GitToolRegistry as an alias for backward compatibility
export const GitToolRegistry = ToolRegistry;
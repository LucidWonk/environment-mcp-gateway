import { GitAdapter } from '../adapters/git-adapter.js';
import { GitDomainAnalyzer } from '../domain/git-domain-analyzer.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { Environment } from '../config/environment.js';

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

export class GitToolRegistry {
    private gitAdapter: GitAdapter;

    constructor() {
        this.gitAdapter = new GitAdapter();
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
                        `Merge failed due to conflicts`,
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
}
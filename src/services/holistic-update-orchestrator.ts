import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { AtomicFileManager, FileOperation } from './atomic-file-manager.js';
import { RollbackManager, HolisticRollbackData } from './rollback-manager.js';
import { SemanticAnalysisService, SemanticAnalysisResult } from './semantic-analysis.js';
import { ContextGenerator, ContextFileContent, SemanticAnalysisResult as ContextGeneratorSemanticResult } from './context-generator.js';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'holistic-update-orchestrator.log' })
    ]
});

export interface HolisticUpdateRequest {
    changedFiles: string[];
    gitCommitHash?: string;
    triggerType: 'git-hook' | 'manual' | 'scheduled';
    performanceTimeout?: number; // in seconds, default 15
}

export interface DomainUpdatePlan {
    domain: string;
    contextPath: string;
    requiredUpdates: { filePath: string; content: string }[];
    dependentDomains: string[];
    updateReason: string;
}

export interface HolisticUpdateResult {
    success: boolean;
    updateId: string;
    executionTime: number;
    affectedDomains: string[];
    updatedFiles: string[];
    performanceMetrics: {
        semanticAnalysisTime: number;
        domainAnalysisTime: number;
        contextGenerationTime: number;
        fileOperationTime: number;
    };
    error?: Error;
    rollbackData?: HolisticRollbackData;
}

/**
 * Orchestrates holistic context updates across all affected domains
 * Ensures atomic, consistent updates with full rollback capability
 */
export class HolisticUpdateOrchestrator {
    private readonly atomicFileManager: AtomicFileManager;
    private readonly rollbackManager: RollbackManager;
    private readonly semanticAnalysis: SemanticAnalysisService;
    private readonly contextGenerator: ContextGenerator;
    private readonly projectRoot: string;

    constructor(projectRoot: string = '.') {
        this.projectRoot = path.resolve(projectRoot);
        this.atomicFileManager = new AtomicFileManager(path.join(projectRoot, '.atomic-ops'));
        this.rollbackManager = new RollbackManager(path.join(projectRoot, '.holistic-rollback'));
        this.semanticAnalysis = new SemanticAnalysisService();
        this.contextGenerator = new ContextGenerator();
        
        // Ensure .holistic-ops directory exists for operational metadata
        const _holisticOpsDir = path.join(projectRoot, '.holistic-ops');
        
        logger.info(`Holistic Update Orchestrator initialized for project: ${this.projectRoot}`);
    }

    /**
     * Execute holistic context update for changed files
     */
    async executeHolisticUpdate(request: HolisticUpdateRequest): Promise<HolisticUpdateResult> {
        const updateId = this.generateUpdateId();
        const startTime = Date.now();
        const performanceTimeout = (request.performanceTimeout ?? 15) * 1000; // Convert to milliseconds
        
        logger.info(`Starting holistic update ${updateId} for ${request.changedFiles.length} files`);
        
        const metrics = {
            semanticAnalysisTime: 0,
            domainAnalysisTime: 0,
            contextGenerationTime: 0,
            fileOperationTime: 0
        };

        try {
            // Phase 1: Semantic Analysis of Changed Files
            const semanticStartTime = Date.now();
            const semanticResults = await this.performSemanticAnalysis(request.changedFiles);
            metrics.semanticAnalysisTime = Date.now() - semanticStartTime;

            if (Date.now() - startTime > performanceTimeout) {
                throw new Error(`Performance timeout exceeded during semantic analysis (>${request.performanceTimeout ?? 15}s)`);
            }

            // Phase 2: Domain Impact Analysis
            const domainStartTime = Date.now();
            const affectedDomains = await this.identifyAffectedDomains(semanticResults, request.changedFiles);
            const updatePlan = await this.createDomainUpdatePlan(affectedDomains, semanticResults);
            metrics.domainAnalysisTime = Date.now() - domainStartTime;

            if (Date.now() - startTime > performanceTimeout) {
                throw new Error(`Performance timeout exceeded during domain analysis (>${request.performanceTimeout ?? 15}s)`);
            }

            // Phase 3: Create Rollback Snapshot
            const rollbackData = await this.rollbackManager.createHolisticSnapshot(
                updateId,
                affectedDomains,
                this.projectRoot
            );

            // Phase 4: Generate Context Content
            const contextStartTime = Date.now();
            const allContextUpdates = await this.generateAllContextUpdates(updatePlan, semanticResults);
            metrics.contextGenerationTime = Date.now() - contextStartTime;

            if (Date.now() - startTime > performanceTimeout) {
                throw new Error(`Performance timeout exceeded during context generation (>${request.performanceTimeout ?? 15}s)`);
            }

            // Phase 5: Execute Atomic File Operations
            const fileOpStartTime = Date.now();
            const fileOperations = this.createFileOperations(allContextUpdates);
            const operationResult = await this.atomicFileManager.executeAtomicOperations(fileOperations);
            metrics.fileOperationTime = Date.now() - fileOpStartTime;

            if (!operationResult.success) {
                throw new Error(`Atomic file operations failed: ${operationResult.error?.message}`);
            }

            const totalTime = Date.now() - startTime;
            
            logger.info(`Holistic update ${updateId} completed successfully in ${totalTime}ms`);
            
            return {
                success: true,
                updateId,
                executionTime: totalTime,
                affectedDomains,
                updatedFiles: fileOperations.map(op => op.targetPath),
                performanceMetrics: metrics,
                rollbackData
            };

        } catch (error) {
            logger.error(`Holistic update ${updateId} failed:`, error);
            
            // Attempt rollback
            try {
                const rollbackSuccess = await this.rollbackManager.executeHolisticRollback(updateId);
                if (rollbackSuccess) {
                    logger.info(`Successfully rolled back failed holistic update ${updateId}`);
                } else {
                    logger.error(`Failed to rollback holistic update ${updateId}`);
                }
            } catch (rollbackError) {
                logger.error(`Rollback failed for holistic update ${updateId}:`, rollbackError);
            }

            return {
                success: false,
                updateId,
                executionTime: Date.now() - startTime,
                affectedDomains: [],
                updatedFiles: [],
                performanceMetrics: metrics,
                error: error as Error
            };
        }
    }

    /**
     * Perform semantic analysis on changed files
     */
    private async performSemanticAnalysis(changedFiles: string[]): Promise<SemanticAnalysisResult[]> {
        logger.debug(`Performing semantic analysis on ${changedFiles.length} files`);
        
        const relevantFiles = changedFiles.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.cs', '.ts', '.js'].includes(ext);
        });

        if (relevantFiles.length === 0) {
            logger.info('No relevant files for semantic analysis');
            return [];
        }

        return await this.semanticAnalysis.analyzeCodeChanges(relevantFiles);
    }

    /**
     * Identify all domains affected by the changes
     */
    private async identifyAffectedDomains(
        semanticResults: SemanticAnalysisResult[],
        changedFiles: string[]
    ): Promise<string[]> {
        const domains = new Set<string>();

        // Extract domains from semantic analysis results
        for (const result of semanticResults) {
            if (result.domainContext && result.domainContext !== 'Unknown') {
                domains.add(result.domainContext);
            }

            // Also check business concepts for domain information
            for (const concept of result.businessConcepts) {
                if (concept.domain && concept.domain !== 'Unknown') {
                    domains.add(concept.domain);
                }
            }
        }

        // Infer domains from file paths if semantic analysis didn't identify them
        for (const filePath of changedFiles) {
            const inferredDomain = this.inferDomainFromPath(filePath);
            if (inferredDomain) {
                domains.add(inferredDomain);
            }
        }

        // Always include cross-cutting concerns
        const crossCuttingDomains = await this.identifyCrossCuttingDomains(changedFiles);
        crossCuttingDomains.forEach(domain => domains.add(domain));

        const result = Array.from(domains);
        logger.info(`Identified ${result.length} affected domains: ${result.join(', ')}`);
        
        return result;
    }

    /**
     * Infer domain from file path patterns
     */
    private inferDomainFromPath(filePath: string): string | null {
        const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
        
        // Define domain patterns
        const domainPatterns = [
            { pattern: /\/Utility\/Analysis\//, domain: 'Analysis' },
            { pattern: /\/Utility\/Data\//, domain: 'Data' },
            { pattern: /\/Utility\/Messaging\//, domain: 'Messaging' },
            { pattern: /\/Console\//, domain: 'Console' },
            { pattern: /\/CyphyrRecon\//, domain: 'CyphyrRecon' },
            { pattern: /\/TestSuite\//, domain: 'TestSuite' },
            { pattern: /\/EnvironmentMCPGateway\//, domain: 'EnvironmentMCPGateway' },
            { pattern: /\/Services\//, domain: 'Services' },
            { pattern: /\/Documentation\//, domain: 'Documentation' }
        ];

        for (const { pattern, domain } of domainPatterns) {
            if (pattern.test(normalizedPath)) {
                return domain;
            }
        }

        return null;
    }

    /**
     * Identify cross-cutting domains that might be affected
     */
    private async identifyCrossCuttingDomains(changedFiles: string[]): Promise<string[]> {
        const crossCuttingDomains: string[] = [];

        // Check for configuration changes that affect multiple domains
        const hasConfigChanges = changedFiles.some(file => 
            file.includes('appsettings') || 
            file.includes('config') ||
            file.includes('.json') ||
            file.includes('.env')
        );

        if (hasConfigChanges) {
            crossCuttingDomains.push('Configuration');
        }

        // Check for infrastructure changes
        const hasInfraChanges = changedFiles.some(file =>
            file.includes('docker') ||
            file.includes('deployment') ||
            file.includes('infrastructure') ||
            file.includes('.yml') ||
            file.includes('.yaml')
        );

        if (hasInfraChanges) {
            crossCuttingDomains.push('Infrastructure');
        }

        // Check for test changes that might affect multiple domains
        const hasTestChanges = changedFiles.some(file =>
            file.includes('test') ||
            file.includes('spec') ||
            file.includes('Test')
        );

        if (hasTestChanges) {
            crossCuttingDomains.push('Testing');
        }

        return crossCuttingDomains;
    }

    /**
     * Create update plan for all affected domains
     */
    private async createDomainUpdatePlan(
        affectedDomains: string[],
        semanticResults: SemanticAnalysisResult[]
    ): Promise<DomainUpdatePlan[]> {
        const plans: DomainUpdatePlan[] = [];

        for (const domain of affectedDomains) {
            const contextPath = path.join(this.projectRoot, domain, '.context');
            const domainSemanticResults = semanticResults.filter(result => 
                result.domainContext === domain ||
                result.businessConcepts.some(concept => concept.domain === domain)
            );

            const plan: DomainUpdatePlan = {
                domain,
                contextPath,
                requiredUpdates: [], // Will be populated by context generator
                dependentDomains: await this.identifyDomainDependencies(domain, affectedDomains),
                updateReason: this.determineUpdateReason(domain, domainSemanticResults)
            };

            plans.push(plan);
        }

        // Sort plans by dependency order (dependencies first)
        return this.sortPlansByDependencies(plans);
    }

    /**
     * Identify dependencies between domains
     */
    private async identifyDomainDependencies(domain: string, allDomains: string[]): Promise<string[]> {
        // Define known domain dependencies
        const dependencies: { [domain: string]: string[] } = {
            'Analysis': ['Data', 'Messaging'],
            'Console': ['Analysis', 'Data'],
            'CyphyrRecon': ['Analysis', 'Data'],
            'Services': ['Analysis', 'Data', 'Messaging'],
            'TestSuite': ['Analysis', 'Data', 'Console'], // Tests depend on core domains
            'EnvironmentMCPGateway': ['Documentation'] // MCP Gateway depends on docs
        };

        const domainDeps = dependencies[domain] || [];
        return domainDeps.filter(dep => allDomains.includes(dep));
    }

    /**
     * Sort plans by dependencies (dependencies first)
     */
    private sortPlansByDependencies(plans: DomainUpdatePlan[]): DomainUpdatePlan[] {
        const sorted: DomainUpdatePlan[] = [];
        const remaining = [...plans];
        const processed = new Set<string>();

        while (remaining.length > 0) {
            const canProcess = remaining.filter(plan => 
                plan.dependentDomains.every(dep => processed.has(dep))
            );

            if (canProcess.length === 0) {
                // No more dependencies can be resolved, add remaining in original order
                sorted.push(...remaining);
                break;
            }

            // Add the first resolvable plan
            const plan = canProcess[0];
            sorted.push(plan);
            processed.add(plan.domain);
            remaining.splice(remaining.indexOf(plan), 1);
        }

        return sorted;
    }

    /**
     * Determine why a domain needs updating
     */
    private determineUpdateReason(domain: string, semanticResults: SemanticAnalysisResult[]): string {
        if (semanticResults.length === 0) {
            return 'Cross-domain dependency update';
        }

        const reasons = semanticResults.map(result => {
            const concepts = result.businessConcepts.length;
            const rules = result.businessRules.length;
            // Note: integrationPatterns would be inferred from business rules
            return `${concepts} business concepts, ${rules} business rules (integrationPatterns derived)`;
        });

        return `Direct changes: ${reasons.join('; ')}`;
    }

    /**
     * Convert semantic analysis results to context generator format
     */
    private convertToContextGeneratorFormat(results: SemanticAnalysisResult[]): ContextGeneratorSemanticResult[] {
        return results.map(result => ({
            filePath: result.filePath,
            language: result.language,
            businessConcepts: result.businessConcepts,
            businessRules: result.businessRules.map(rule => ({
                description: rule.description,
                category: 'business-logic' as const,
                confidence: rule.confidence,
                sourceLocation: rule.sourceLocation
            })),
            domainAnalysis: {
                primaryDomain: result.domainContext,
                confidence: 0.8,
                crossDomainDependencies: []
            },
            changeAnalysis: {
                changeType: 'modified' as const,
                impactLevel: 'medium' as const,
                affectedComponents: []
            }
        }));
    }

    /**
     * Generate context content for all domains
     */
    private async generateAllContextUpdates(
        plans: DomainUpdatePlan[],
        semanticResults: SemanticAnalysisResult[]
    ): Promise<{ filePath: string; content: string }[]> {
        const allUpdates: { filePath: string; content: string }[] = [];

        for (const plan of plans) {
            logger.debug(`Generating context updates for domain: ${plan.domain}`);
            
            const domainSemanticResults = semanticResults.filter(result => 
                result.domainContext === plan.domain ||
                result.businessConcepts.some(concept => concept.domain === plan.domain)
            );

            // Convert to context generator format
            const convertedResults = this.convertToContextGeneratorFormat(domainSemanticResults);
            const contextUpdates = await this.contextGenerator.generateContextFiles(convertedResults);
            
            // Convert ContextFileContent to file paths and create domain updates
            const domainUpdates = contextUpdates.map((contextContent, _index) => {
                const fileName = `domain-overview-${plan.domain.toLowerCase()}.context`;
                return {
                    filePath: path.join(plan.contextPath, fileName),
                    content: this.serializeContextContent(contextContent)
                };
            });

            allUpdates.push(...domainUpdates);
            plan.requiredUpdates = domainUpdates;
        }

        logger.info(`Generated ${allUpdates.length} context file updates across ${plans.length} domains`);
        return allUpdates;
    }

    /**
     * Serialize context content to markdown format
     */
    private serializeContextContent(contextContent: ContextFileContent): string {
        return `# Domain Context

## Domain Overview
${contextContent.domainOverview}

## Current Implementation
${contextContent.currentImplementation}

## Business Rules
${contextContent.businessRules}

## Integration Points
${contextContent.integrationPoints}

## Recent Changes
${contextContent.recentChanges}
`;
    }

    /**
     * Create file operations for atomic execution
     */
    private createFileOperations(contextUpdates: { filePath: string; content: string }[]): FileOperation[] {
        const operations: FileOperation[] = [];

        for (const update of contextUpdates) {
            const operation: FileOperation = fs.existsSync(update.filePath)
                ? { type: 'update', targetPath: update.filePath, content: update.content }
                : { type: 'create', targetPath: update.filePath, content: update.content };
            
            operations.push(operation);
        }

        return operations;
    }

    /**
     * Generate unique update ID
     */
    private generateUpdateId(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `holistic_${timestamp}_${random}`;
    }

    /**
     * Get status of recent holistic updates
     */
    async getRecentUpdateStatus(limitCount: number = 10): Promise<any[]> {
        // This could be expanded to track update history
        const pendingRollbacks = await this.rollbackManager.getPendingRollbacks();
        
        return pendingRollbacks.slice(0, limitCount).map(rollback => ({
            updateId: rollback.contextUpdateId,
            timestamp: rollback.timestamp,
            status: rollback.status,
            affectedDomains: rollback.affectedDomains
        }));
    }

    /**
     * Cleanup old update data
     */
    async performMaintenance(): Promise<void> {
        logger.info('Performing holistic update orchestrator maintenance');
        
        try {
            // Cleanup old rollback data (older than 1 week)
            await this.rollbackManager.cleanupCompletedRollbacks(168);
            
            // Cleanup old atomic operation data (older than 1 day)
            await this.atomicFileManager.cleanupOldTransactions(24);
            
            logger.info('Maintenance completed successfully');
        } catch (error) {
            logger.error('Maintenance failed:', error);
        }
    }
}
import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { AtomicFileManager } from './atomic-file-manager.js';
import { RollbackManager } from './rollback-manager.js';
import { SemanticAnalysisService } from './semantic-analysis.js';
import { ContextGenerator } from './context-generator.js';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'holistic-update-orchestrator.log' })
    ]
});
/**
 * Orchestrates holistic context updates across all affected domains
 * Ensures atomic, consistent updates with full rollback capability
 */
export class HolisticUpdateOrchestrator {
    atomicFileManager;
    rollbackManager;
    semanticAnalysis;
    contextGenerator;
    projectRoot;
    constructor(projectRoot = '.') {
        this.projectRoot = path.resolve(projectRoot);
        // Use environment-specific paths for data directories in containerized environments
        const atomicOpsDir = process.env.ATOMIC_OPS_DIR || path.join(projectRoot, '.atomic-ops');
        const rollbackDir = process.env.HOLISTIC_ROLLBACK_DIR || path.join(projectRoot, '.holistic-rollback');
        this.atomicFileManager = new AtomicFileManager(atomicOpsDir);
        this.rollbackManager = new RollbackManager(rollbackDir);
        this.semanticAnalysis = new SemanticAnalysisService();
        this.contextGenerator = new ContextGenerator();
        // Ensure .holistic-ops directory exists for operational metadata
        const _holisticOpsDir = path.join(projectRoot, '.holistic-ops');
        logger.info(`Holistic Update Orchestrator initialized for project: ${this.projectRoot}`);
    }
    /**
     * Execute holistic context update for changed files
     */
    async executeHolisticUpdate(request) {
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
            const rollbackData = await this.rollbackManager.createHolisticSnapshot(updateId, affectedDomains, this.projectRoot);
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
        }
        catch (error) {
            logger.error(`Holistic update ${updateId} failed:`, error);
            // Attempt rollback
            try {
                const rollbackSuccess = await this.rollbackManager.executeHolisticRollback(updateId);
                if (rollbackSuccess) {
                    logger.info(`Successfully rolled back failed holistic update ${updateId}`);
                }
                else {
                    logger.error(`Failed to rollback holistic update ${updateId}`);
                }
            }
            catch (rollbackError) {
                logger.error(`Rollback failed for holistic update ${updateId}:`, rollbackError);
            }
            return {
                success: false,
                updateId,
                executionTime: Date.now() - startTime,
                affectedDomains: [],
                updatedFiles: [],
                performanceMetrics: metrics,
                error: error
            };
        }
    }
    /**
     * Perform semantic analysis on changed files
     */
    async performSemanticAnalysis(changedFiles) {
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
    async identifyAffectedDomains(semanticResults, changedFiles) {
        const domains = new Set();
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
    inferDomainFromPath(filePath) {
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
    async identifyCrossCuttingDomains(changedFiles) {
        const crossCuttingDomains = [];
        // Check for configuration changes that affect multiple domains
        const hasConfigChanges = changedFiles.some(file => file.includes('appsettings') ||
            file.includes('config') ||
            file.includes('.json') ||
            file.includes('.env'));
        if (hasConfigChanges) {
            crossCuttingDomains.push('Configuration');
        }
        // Check for infrastructure changes
        const hasInfraChanges = changedFiles.some(file => file.includes('docker') ||
            file.includes('deployment') ||
            file.includes('infrastructure') ||
            file.includes('.yml') ||
            file.includes('.yaml'));
        if (hasInfraChanges) {
            crossCuttingDomains.push('Infrastructure');
        }
        // Check for test changes that might affect multiple domains
        const hasTestChanges = changedFiles.some(file => file.includes('test') ||
            file.includes('spec') ||
            file.includes('Test'));
        if (hasTestChanges) {
            crossCuttingDomains.push('Testing');
        }
        return crossCuttingDomains;
    }
    /**
     * Consolidate subdomains into their parent domains to avoid context file fragmentation
     * E.g., Analysis.Indicator, Analysis.Pattern -> Analysis
     * Data.Provider, Data.Repository -> Data
     */
    consolidateSubdomains(domains) {
        const parentDomains = new Set();
        for (const domain of domains) {
            // Extract parent domain (everything before the first dot)
            const parentDomain = domain.includes('.') ? domain.split('.')[0] : domain;
            parentDomains.add(parentDomain);
        }
        return Array.from(parentDomains);
    }
    /**
     * Create update plan for all affected domains
     */
    async createDomainUpdatePlan(affectedDomains, semanticResults) {
        const plans = [];
        // Consolidate subdomains into parent domains to avoid fragmented context files
        // E.g., Analysis.Indicator should be consolidated into Analysis
        const consolidatedDomains = this.consolidateSubdomains(affectedDomains);
        for (const domain of consolidatedDomains) {
            // Enhanced hierarchical context path creation
            const contextPath = this.determineHierarchicalContextPath(domain, semanticResults);
            const domainSemanticResults = semanticResults.filter(result => result.domainContext === domain ||
                result.businessConcepts.some(concept => concept.domain === domain));
            const plan = {
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
     * Determine hierarchical context path based on semantic analysis
     * Implements BR-CEE-001: Context placement logic must support hierarchical directory structures
     */
    determineHierarchicalContextPath(domain, semanticResults) {
        // For now, use domain-level paths to maintain backward compatibility
        // Future enhancement will implement semantic boundary detection for granular paths
        const basePath = path.join(this.projectRoot, domain, '.context');
        // Check if this is a semantic subdirectory that should have its own context
        const semanticSubdirectories = this.detectSemanticSubdirectories(domain, semanticResults);
        if (semanticSubdirectories.length > 0) {
            // For Phase 1, create contexts at both domain level and semantic subdirectories
            // This ensures backward compatibility while enabling granular context creation
            logger.info(`Detected ${semanticSubdirectories.length} semantic subdirectories in ${domain}: ${semanticSubdirectories.join(', ')}`);
            // Return the base path for now - Phase 2 will implement multi-level creation
            return basePath;
        }
        return basePath;
    }
    /**
     * Detect semantic subdirectories that warrant their own context files
     * Implements BR-CEE-002: Domain detection must recognize semantic subdirectories with business content
     */
    detectSemanticSubdirectories(domain, semanticResults) {
        const semanticSubdirs = [];
        // Known semantic subdirectories that should have granular context
        const knownSemanticSubdirs = {
            'Analysis': ['Fractal', 'Indicator', 'Pattern', 'Algorithm'],
            'Data': ['Provider', 'Repository', 'Cache', 'Transform'],
            'Messaging': ['Event', 'Command', 'Handler', 'Publisher']
        };
        const domainSubdirs = knownSemanticSubdirs[domain] || [];
        for (const subdir of domainSubdirs) {
            // Check if any semantic results indicate files in this subdirectory
            const hasSemanticContent = semanticResults.some(result => {
                const normalizedPath = path.normalize(result.filePath).replace(/\\/g, '/');
                return normalizedPath.includes(`/${domain}/${subdir}/`) &&
                    (result.businessConcepts.length > 0 || result.businessRules.length > 0);
            });
            if (hasSemanticContent) {
                semanticSubdirs.push(subdir);
                logger.debug(`Detected semantic subdirectory: ${domain}/${subdir} with business content`);
            }
        }
        return semanticSubdirs;
    }
    /**
     * Identify dependencies between domains
     */
    async identifyDomainDependencies(domain, allDomains) {
        // Define known domain dependencies
        const dependencies = {
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
    sortPlansByDependencies(plans) {
        const sorted = [];
        const remaining = [...plans];
        const processed = new Set();
        while (remaining.length > 0) {
            const canProcess = remaining.filter(plan => plan.dependentDomains.every(dep => processed.has(dep)));
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
    determineUpdateReason(domain, semanticResults) {
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
     * Fixed: Enhanced mapping to properly handle business rules from XML documentation parser
     */
    convertToContextGeneratorFormat(results) {
        return results.map(result => ({
            filePath: result.filePath,
            language: result.language,
            businessConcepts: result.businessConcepts,
            businessRules: result.businessRules.map(rule => {
                // Enhanced business rule mapping with proper categorization
                let category = 'business-logic';
                // Map XML documentation rule types to context generator categories
                if (rule.id && rule.id.startsWith('XML-')) {
                    // Enhanced rules from XML documentation parser - categorize based on description
                    const desc = rule.description.toLowerCase();
                    if (desc.includes('validation') || desc.includes('validate') || desc.includes('constraint')) {
                        category = 'validation';
                    }
                    else if (desc.includes('workflow') || desc.includes('process') || desc.includes('sequence')) {
                        category = 'workflow';
                    }
                    else if (desc.includes('constraint') || desc.includes('limit') || desc.includes('requirement')) {
                        category = 'constraint';
                    }
                    else {
                        category = 'business-logic';
                    }
                }
                else {
                    // Legacy rules - use simple mapping
                    category = 'business-logic';
                }
                return {
                    description: rule.description,
                    category,
                    confidence: rule.confidence,
                    sourceLocation: rule.sourceLocation
                };
            }),
            domainAnalysis: {
                primaryDomain: result.domainContext || 'Unknown',
                confidence: this.calculateDomainConfidence(result),
                crossDomainDependencies: this.extractCrossDomainDependencies(result)
            },
            changeAnalysis: {
                changeType: 'modified',
                impactLevel: this.calculateImpactLevel(result),
                affectedComponents: this.extractAffectedComponents(result)
            }
        }));
    }
    /**
     * Calculate domain confidence based on semantic analysis results
     */
    calculateDomainConfidence(result) {
        if (result.businessConcepts.length === 0)
            return 0.5;
        const avgConceptConfidence = result.businessConcepts.reduce((sum, concept) => sum + concept.confidence, 0) / result.businessConcepts.length;
        const hasBusinessRules = result.businessRules.length > 0;
        const hasStrongDomainContext = result.domainContext !== 'Unknown';
        let confidence = avgConceptConfidence;
        if (hasBusinessRules)
            confidence += 0.1;
        if (hasStrongDomainContext)
            confidence += 0.1;
        return Math.min(confidence, 0.95);
    }
    /**
     * Extract cross-domain dependencies from semantic analysis results
     */
    extractCrossDomainDependencies(result) {
        const dependencies = new Set();
        // Extract dependencies from business concepts
        for (const concept of result.businessConcepts) {
            if (concept.dependencies) {
                concept.dependencies.forEach(dep => {
                    const domain = this.extractDomainFromDependency(dep);
                    if (domain && domain !== result.domainContext) {
                        dependencies.add(domain);
                    }
                });
            }
        }
        return Array.from(dependencies);
    }
    /**
     * Calculate impact level based on semantic analysis results
     */
    calculateImpactLevel(result) {
        const conceptCount = result.businessConcepts.length;
        const ruleCount = result.businessRules.length;
        const totalImpact = conceptCount + ruleCount;
        if (totalImpact >= 10)
            return 'high';
        if (totalImpact >= 5)
            return 'medium';
        return 'low';
    }
    /**
     * Extract affected components from semantic analysis results
     */
    extractAffectedComponents(result) {
        const components = new Set();
        // Add business concepts as affected components
        result.businessConcepts.forEach(concept => {
            components.add(`${concept.type}:${concept.name}`);
        });
        return Array.from(components);
    }
    /**
     * Extract domain from dependency string
     */
    extractDomainFromDependency(dependency) {
        const domainPatterns = ['Analysis', 'Data', 'Messaging', 'Trading', 'Market'];
        for (const domain of domainPatterns) {
            if (dependency.includes(domain)) {
                return domain;
            }
        }
        return null;
    }
    /**
     * Generate context content for all domains
     */
    async generateAllContextUpdates(plans, semanticResults) {
        const allUpdates = [];
        for (const plan of plans) {
            logger.debug(`Generating context updates for domain: ${plan.domain}`);
            // Enhanced domain filtering to consolidate subdomains into parent domains
            // E.g., Analysis.Indicator should contribute to Analysis domain context
            const domainSemanticResults = semanticResults.filter(result => {
                // Direct domain match
                if (result.domainContext === plan.domain)
                    return true;
                // Subdomain consolidation: Analysis.Indicator -> Analysis
                if (result.domainContext && result.domainContext.startsWith(plan.domain + '.'))
                    return true;
                // Business concept domain match
                if (result.businessConcepts.some(concept => concept.domain === plan.domain))
                    return true;
                // Business concept subdomain consolidation
                if (result.businessConcepts.some(concept => concept.domain && concept.domain.startsWith(plan.domain + '.')))
                    return true;
                return false;
            });
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
    serializeContextContent(contextContent) {
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
    createFileOperations(contextUpdates) {
        const operations = [];
        for (const update of contextUpdates) {
            const operation = fs.existsSync(update.filePath)
                ? { type: 'update', targetPath: update.filePath, content: update.content }
                : { type: 'create', targetPath: update.filePath, content: update.content };
            operations.push(operation);
        }
        return operations;
    }
    /**
     * Generate unique update ID
     */
    generateUpdateId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `holistic_${timestamp}_${random}`;
    }
    /**
     * Get status of recent holistic updates
     */
    async getRecentUpdateStatus(limitCount = 10) {
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
    async performMaintenance() {
        logger.info('Performing holistic update orchestrator maintenance');
        try {
            // Cleanup old rollback data (older than 1 week)
            await this.rollbackManager.cleanupCompletedRollbacks(168);
            // Cleanup old atomic operation data (older than 1 day)
            await this.atomicFileManager.cleanupOldTransactions(24);
            logger.info('Maintenance completed successfully');
        }
        catch (error) {
            logger.error('Maintenance failed:', error);
        }
    }
}
//# sourceMappingURL=holistic-update-orchestrator.js.map
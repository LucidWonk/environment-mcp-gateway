import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { AtomicFileManager } from './atomic-file-manager.js';
import { RollbackManager } from './rollback-manager.js';
import { SemanticAnalysisService } from './semantic-analysis.js';
import { ContextGenerator } from './context-generator.js';
import { PathUtilities } from './path-utilities.js';
import { TimeoutManager } from './timeout-manager.js';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logString = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            logString += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return logString;
    })),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        }),
        new winston.transports.File({
            filename: 'holistic-update-orchestrator.log',
            format: winston.format.json()
        })
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
    timeoutManager;
    projectRoot;
    constructor(projectRoot) {
        // Initialize project root asynchronously in a separate method
        this.projectRoot = projectRoot ? path.resolve(projectRoot) : process.cwd();
        this.initializeAsync();
        // Use environment-specific paths for data directories in containerized environments
        const atomicOpsDir = process.env.ATOMIC_OPS_DIR || path.join(this.projectRoot, '.atomic-ops');
        const rollbackDir = process.env.HOLISTIC_ROLLBACK_DIR || path.join(this.projectRoot, '.holistic-rollback');
        const holisticOpsDir = process.env.HOLISTIC_OPS_DIR || path.join(this.projectRoot, '.holistic-ops');
        // Enhanced rollback configuration for automatic cleanup
        const rollbackConfig = {
            maxAge: 24, // Clean up after 24 hours
            maxCount: 10, // Keep max 10 rollbacks
            cleanupTriggers: ['full-reindex', 'startup', 'holistic-update-failure'],
            aggressiveCleanup: false
        };
        this.atomicFileManager = new AtomicFileManager(atomicOpsDir);
        this.rollbackManager = new RollbackManager(rollbackDir, rollbackConfig);
        this.semanticAnalysis = new SemanticAnalysisService();
        this.contextGenerator = new ContextGenerator();
        // Ensure holistic operations directory exists for coordination files
        if (!fs.existsSync(holisticOpsDir)) {
            fs.mkdirSync(holisticOpsDir, { recursive: true });
        }
        // Initialize timeout manager with environment-specific configuration
        const timeoutConfig = {
            semanticAnalysis: parseInt(process.env.SEMANTIC_ANALYSIS_TIMEOUT || '60000'),
            domainAnalysis: parseInt(process.env.DOMAIN_ANALYSIS_TIMEOUT || '30000'),
            contextGeneration: parseInt(process.env.CONTEXT_GENERATION_TIMEOUT || '45000'),
            fileOperations: parseInt(process.env.FILE_OPERATIONS_TIMEOUT || '30000'),
            fullReindex: parseInt(process.env.FULL_REINDEX_TIMEOUT || '300000'),
            singleFileAnalysis: parseInt(process.env.SINGLE_FILE_TIMEOUT || '10000')
        };
        this.timeoutManager = new TimeoutManager(timeoutConfig);
        logger.info(`Holistic Update Orchestrator initialized for project: ${this.projectRoot}`);
    }
    /**
     * Initialize project root with proper path resolution
     */
    async initializeAsync() {
        try {
            const resolvedRoot = await PathUtilities.getProjectRoot();
            if (resolvedRoot !== this.projectRoot) {
                logger.info(`Project root updated from ${this.projectRoot} to ${resolvedRoot}`);
                this.projectRoot = resolvedRoot;
            }
        }
        catch (error) {
            logger.warn(`Could not resolve project root, using: ${this.projectRoot}`, error);
        }
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
            const semanticResults = await this.timeoutManager.executeWithTimeout(this.performSemanticAnalysis(request.changedFiles), 'semanticAnalysis', {
                fileCount: request.changedFiles.length,
                updateId,
                triggerType: request.triggerType
            });
            metrics.semanticAnalysisTime = Date.now() - semanticStartTime;
            // Phase 2: Domain Impact Analysis
            const domainStartTime = Date.now();
            const domainAnalysisOperation = async () => {
                const affectedDomains = await this.identifyAffectedDomains(semanticResults, request.changedFiles);
                const updatePlan = await this.createDomainUpdatePlan(affectedDomains, semanticResults);
                return { affectedDomains, updatePlan };
            };
            const { affectedDomains, updatePlan } = await this.timeoutManager.executeWithTimeout(domainAnalysisOperation(), 'domainAnalysis', {
                semanticResultsCount: semanticResults.length,
                changedFilesCount: request.changedFiles.length,
                updateId
            });
            metrics.domainAnalysisTime = Date.now() - domainStartTime;
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
            const totalTime = Date.now() - startTime;
            const errorDetails = {
                updateId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                executionTime: totalTime,
                request: {
                    changedFiles: request.changedFiles,
                    gitCommitHash: request.gitCommitHash,
                    triggerType: request.triggerType,
                    performanceTimeout: request.performanceTimeout
                },
                performanceMetrics: metrics,
                phase: this.determineFailurePhase(metrics, totalTime),
                projectRoot: this.projectRoot,
                timestamp: new Date().toISOString()
            };
            logger.error(`❌ Holistic update ${updateId} failed`, errorDetails);
            // Mark rollback as failed with comprehensive context
            try {
                await this.rollbackManager.markRollbackFailed(updateId, error, errorDetails);
                // Note: For manual rollback recovery, use executeHolisticRollback(updateId)
            }
            catch (markError) {
                logger.error(`Failed to mark rollback as failed for update ${updateId}:`, markError);
            }
            // Trigger cleanup after failure
            try {
                await this.rollbackManager.triggerCleanup('holistic-update-failure');
            }
            catch (cleanupError) {
                logger.warn(`Cleanup after failure could not be triggered:`, cleanupError);
            }
            return {
                success: false,
                updateId,
                executionTime: totalTime,
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
        logger.info(`🔍 Starting semantic analysis on ${changedFiles.length} files`);
        const relevantFiles = changedFiles.filter(file => {
            const ext = path.extname(file).toLowerCase();
            const isRelevant = ['.cs', '.ts', '.js'].includes(ext);
            logger.debug(`File: ${file}, Extension: ${ext}, Relevant: ${isRelevant}`);
            return isRelevant;
        });
        logger.info(`📊 Filtered to ${relevantFiles.length} relevant files for semantic analysis`);
        if (relevantFiles.length === 0) {
            logger.warn('❌ No relevant files found for semantic analysis - this may explain why no context files are generated');
            return [];
        }
        logger.info(`🚀 Analyzing ${relevantFiles.length} files: ${relevantFiles.join(', ')}`);
        const results = await this.semanticAnalysis.analyzeCodeChanges(relevantFiles);
        logger.info(`✅ Semantic analysis completed, found ${results.length} analysis results`);
        return results;
    }
    /**
     * Identify all domains affected by the changes
     */
    async identifyAffectedDomains(semanticResults, changedFiles) {
        logger.info(`🎯 Identifying affected domains from ${semanticResults.length} semantic results and ${changedFiles.length} changed files`);
        const domains = new Set();
        // Extract domains from semantic analysis results
        logger.info('🔍 Extracting domains from semantic analysis results...');
        for (const result of semanticResults) {
            logger.debug(`Processing semantic result for file: ${result.filePath}`);
            if (result.domainContext && result.domainContext !== 'Unknown') {
                logger.info(`✅ Found domain from semantic analysis: ${result.domainContext} for file ${result.filePath}`);
                domains.add(result.domainContext);
            }
            else {
                logger.debug(`❌ No valid domain context found in semantic result for ${result.filePath} (context: ${result.domainContext})`);
            }
            // Also check business concepts for domain information
            for (const concept of result.businessConcepts) {
                if (concept.domain && concept.domain !== 'Unknown') {
                    logger.info(`✅ Found domain from business concept: ${concept.domain} (concept: ${concept.name})`);
                    domains.add(concept.domain);
                }
                else {
                    logger.debug(`❌ No valid domain in business concept: ${concept.name} (domain: ${concept.domain})`);
                }
            }
        }
        // Infer domains from file paths if semantic analysis didn't identify them
        logger.info('🗂️ Inferring domains from file paths...');
        for (const filePath of changedFiles) {
            const inferredDomain = this.inferDomainFromPath(filePath);
            if (inferredDomain) {
                logger.info(`✅ Inferred domain from path: ${inferredDomain} for file ${filePath}`);
                domains.add(inferredDomain);
            }
            else {
                logger.debug(`❌ Could not infer domain from path: ${filePath}`);
            }
        }
        // Always include cross-cutting concerns
        logger.info('⚡ Identifying cross-cutting domains...');
        const crossCuttingDomains = await this.identifyCrossCuttingDomains(changedFiles);
        crossCuttingDomains.forEach(domain => {
            logger.info(`✅ Added cross-cutting domain: ${domain}`);
            domains.add(domain);
        });
        const result = Array.from(domains);
        logger.info(`🎯 Final result: Identified ${result.length} affected domains: ${result.join(', ')}`);
        if (result.length === 0) {
            logger.error('❌ CRITICAL: No domains identified! This explains why no context files are generated.');
        }
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
        logger.info(`🏗️ Starting context generation for ${plans.length} domain plans with ${semanticResults.length} semantic results`);
        const allUpdates = [];
        if (plans.length === 0) {
            logger.error('❌ CRITICAL: No domain plans provided for context generation!');
            return allUpdates;
        }
        for (const plan of plans) {
            logger.info(`📝 Generating context updates for domain: ${plan.domain}`);
            logger.debug(`Domain plan: contextPath=${plan.contextPath}, updateReason=${plan.updateReason}`);
            // Enhanced domain filtering to consolidate subdomains into parent domains
            // E.g., Analysis.Indicator should contribute to Analysis domain context
            const domainSemanticResults = semanticResults.filter(result => {
                // Direct domain match
                if (result.domainContext === plan.domain) {
                    logger.debug(`✅ Direct domain match: ${result.filePath} -> ${plan.domain}`);
                    return true;
                }
                // Subdomain consolidation: Analysis.Indicator -> Analysis
                if (result.domainContext && result.domainContext.startsWith(plan.domain + '.')) {
                    logger.debug(`✅ Subdomain match: ${result.filePath} (${result.domainContext}) -> ${plan.domain}`);
                    return true;
                }
                // Business concept domain match
                if (result.businessConcepts.some(concept => concept.domain === plan.domain)) {
                    logger.debug(`✅ Business concept domain match: ${result.filePath} -> ${plan.domain}`);
                    return true;
                }
                // Business concept subdomain consolidation
                if (result.businessConcepts.some(concept => concept.domain && concept.domain.startsWith(plan.domain + '.'))) {
                    logger.debug(`✅ Business concept subdomain match: ${result.filePath} -> ${plan.domain}`);
                    return true;
                }
                return false;
            });
            logger.info(`📊 Found ${domainSemanticResults.length} semantic results for domain ${plan.domain}`);
            // Convert to context generator format
            logger.debug('🔄 Converting semantic results to context generator format...');
            const convertedResults = this.convertToContextGeneratorFormat(domainSemanticResults);
            logger.info(`✅ Converted ${convertedResults.length} results for context generation`);
            logger.debug('🎯 Calling context generator...');
            const contextUpdates = await this.contextGenerator.generateContextFiles(convertedResults);
            logger.info(`📄 Context generator produced ${contextUpdates.length} context updates for domain ${plan.domain}`);
            if (contextUpdates.length === 0) {
                logger.warn(`⚠️ Context generator returned 0 updates for domain ${plan.domain} - investigating...`);
                logger.debug(`Input to context generator: ${JSON.stringify(convertedResults, null, 2)}`);
            }
            // Convert ContextFileContent to file paths and create domain updates
            const domainUpdates = contextUpdates.map((contextContent, _index) => {
                const fileName = `domain-overview-${plan.domain.toLowerCase()}.context`;
                const filePath = path.join(plan.contextPath, fileName);
                const content = this.serializeContextContent(contextContent);
                logger.info(`📁 Created context file: ${filePath} (${content.length} bytes)`);
                logger.debug(`Context content preview: ${content.substring(0, 200)}...`);
                return {
                    filePath,
                    content
                };
            });
            logger.info(`✅ Generated ${domainUpdates.length} domain updates for ${plan.domain}`);
            allUpdates.push(...domainUpdates);
            plan.requiredUpdates = domainUpdates;
        }
        logger.info(`🎉 Context generation complete: Generated ${allUpdates.length} context file updates across ${plans.length} domains`);
        if (allUpdates.length === 0) {
            logger.error('❌ CRITICAL: No context updates generated! This explains the 0 context files result.');
            logger.debug(`Debug info - Plans: ${JSON.stringify(plans.map(p => ({ domain: p.domain, contextPath: p.contextPath })), null, 2)}`);
        }
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
     * Determine which phase the failure occurred in based on metrics
     */
    determineFailurePhase(metrics, totalTime) {
        if (metrics.semanticAnalysisTime > 0 && metrics.domainAnalysisTime === 0) {
            return 'semantic-analysis';
        }
        else if (metrics.domainAnalysisTime > 0 && metrics.contextGenerationTime === 0) {
            return 'domain-analysis';
        }
        else if (metrics.contextGenerationTime > 0 && metrics.fileOperationTime === 0) {
            return 'context-generation';
        }
        else if (metrics.fileOperationTime > 0) {
            return 'file-operations';
        }
        else if (totalTime < 1000) {
            return 'initialization';
        }
        else {
            return 'unknown';
        }
    }
    /**
     * Create timeout wrapper for operations with detailed timeout context
     */
    async withTimeout(operation, timeoutMs, operationName, context) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const timeoutError = new Error(`⏰ ${operationName} timed out after ${timeoutMs}ms`);
                logger.error(`Timeout in ${operationName}`, {
                    timeoutMs,
                    operationName,
                    context: context || {},
                    timestamp: new Date().toISOString()
                });
                reject(timeoutError);
            }, timeoutMs);
            operation
                .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
                .catch((error) => {
                clearTimeout(timer);
                logger.error(`Error in ${operationName}`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    context: context || {},
                    timestamp: new Date().toISOString()
                });
                reject(error);
            });
        });
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
            // Trigger automatic rollback cleanup
            await this.rollbackManager.triggerCleanup('maintenance');
            logger.info('Maintenance completed successfully');
        }
        catch (error) {
            logger.error('Maintenance failed:', error);
        }
    }
}
//# sourceMappingURL=holistic-update-orchestrator.js.map
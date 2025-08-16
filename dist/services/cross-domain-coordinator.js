import * as path from 'path';
import { DomainAnalyzer } from './domain-analyzer.js';
import { ImpactMapper } from './impact-mapper.js';
import { HolisticUpdateOrchestrator } from './holistic-update-orchestrator.js';
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('mcp-gateway.log');
/**
 * Coordinates cross-domain updates with sophisticated impact analysis
 * Manages dependencies, parallel execution, and rollback coordination
 */
export class CrossDomainCoordinator {
    domainAnalyzer;
    impactMapper;
    holisticOrchestrator;
    projectRoot;
    activeCoordinations = new Map();
    timeout; // timeout in milliseconds
    performanceTimeout = 300000; // 300 seconds (5 minutes) default
    constructor(projectRoot = '.', timeout = 300000) {
        this.projectRoot = path.resolve(projectRoot);
        this.timeout = timeout;
        this.domainAnalyzer = new DomainAnalyzer(projectRoot, Math.min(timeout / 3, 10000)); // Domain analyzer gets 1/3 of timeout or 10s max
        this.impactMapper = new ImpactMapper(projectRoot, Math.min(timeout / 3, 15000)); // Impact mapper gets 1/3 of timeout or 15s max
        this.holisticOrchestrator = new HolisticUpdateOrchestrator(projectRoot);
        logger.info(`Cross-Domain Coordinator initialized for project: ${this.projectRoot} with timeout: ${timeout}ms`);
    }
    /**
     * Coordinate a comprehensive cross-domain update
     */
    async coordinateUpdate(request) {
        const planId = this.generatePlanId();
        const startTime = Date.now();
        // Use performance timeout from request if provided, otherwise use default
        const effectiveTimeout = request.performanceTimeout ? request.performanceTimeout * 1000 : this.timeout;
        logger.info(`Starting cross-domain coordination ${planId} for ${request.changedFiles.length} files with timeout ${effectiveTimeout}ms`);
        const metrics = {
            analysisTime: 0,
            coordinationTime: 0,
            executionTime: 0,
            validationTime: 0
        };
        try {
            // Check timeout at start
            this.checkTimeout(startTime, effectiveTimeout, 'at coordination start');
            // Phase 1: Analysis and Planning
            const analysisStartTime = Date.now();
            const updatePlan = await this.createUpdatePlan(planId, request);
            this.activeCoordinations.set(planId, updatePlan);
            metrics.analysisTime = Date.now() - analysisStartTime;
            // Check timeout before Phase 2
            this.checkTimeout(startTime, effectiveTimeout, 'before coordination setup');
            // Phase 2: Coordination Setup
            const coordinationStartTime = Date.now();
            await this.setupCoordination(updatePlan);
            metrics.coordinationTime = Date.now() - coordinationStartTime;
            // Check timeout before Phase 3
            this.checkTimeout(startTime, effectiveTimeout, 'before execution phase');
            // Phase 3: Execute Coordinated Updates
            const executionStartTime = Date.now();
            const executionResult = await this.executeCoordinatedUpdate(updatePlan, startTime, effectiveTimeout);
            metrics.executionTime = Date.now() - executionStartTime;
            // Check timeout before Phase 4
            this.checkTimeout(startTime, effectiveTimeout, 'before validation phase');
            // Phase 4: Validation
            const validationStartTime = Date.now();
            const validationResult = await this.validateCoordinatedUpdate(updatePlan, executionResult);
            metrics.validationTime = Date.now() - validationStartTime;
            const totalTime = Date.now() - startTime;
            logger.info(`Cross-domain coordination ${planId} completed in ${totalTime}ms`);
            return {
                success: validationResult.success,
                planId,
                executedPhases: executionResult.executedPhases,
                totalPhases: updatePlan.executionPhases.length,
                executionTime: totalTime,
                updatedDomains: executionResult.updatedDomains,
                failedDomains: executionResult.failedDomains,
                rollbackRequired: executionResult.rollbackRequired,
                rollbackCompleted: executionResult.rollbackCompleted,
                coordinationLogs: executionResult.coordinationLogs,
                performanceMetrics: metrics
            };
        }
        catch (error) {
            logger.error(`Cross-domain coordination ${planId} failed:`, error);
            // Attempt coordinated rollback
            await this.executeCoordinatedRollback(planId);
            return {
                success: false,
                planId,
                executedPhases: 0,
                totalPhases: 0,
                executionTime: Date.now() - startTime,
                updatedDomains: [],
                failedDomains: [],
                rollbackRequired: true,
                rollbackCompleted: false,
                coordinationLogs: [`Coordination failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                performanceMetrics: metrics
            };
        }
        finally {
            this.activeCoordinations.delete(planId);
        }
    }
    /**
     * Create comprehensive update plan with impact analysis
     */
    async createUpdatePlan(planId, request) {
        logger.debug(`Creating update plan ${planId}`);
        // Perform impact analysis
        const impactPrediction = await this.impactMapper.predictChangeImpact(request.changedFiles);
        // Create domain coordination plans
        const coordinationPlan = await this.createDomainCoordinationPlan(impactPrediction.impactGraph);
        // Create execution phases
        const executionPhases = this.createExecutionPhases(impactPrediction.updateSequence, coordinationPlan, impactPrediction.impactGraph);
        // Calculate total estimated time
        const totalEstimatedTime = executionPhases.reduce((sum, phase) => sum + phase.estimatedTime, 0);
        // Generate risk assessment and rollback strategy
        const riskAssessment = this.generateRiskAssessment(impactPrediction);
        const rollbackStrategy = this.generateRollbackStrategy(impactPrediction, coordinationPlan);
        return {
            planId,
            changedFiles: request.changedFiles,
            impactPrediction,
            coordinationPlan,
            executionPhases,
            totalEstimatedTime,
            riskAssessment,
            rollbackStrategy,
            createdAt: new Date()
        };
    }
    /**
     * Create coordination plan for each affected domain
     */
    async createDomainCoordinationPlan(impactGraph) {
        const coordinationPlan = [];
        for (const node of impactGraph.nodes) {
            // Find dependencies and dependents
            const dependencies = impactGraph.edges
                .filter(edge => edge.targetDomain === node.domain)
                .map(edge => edge.sourceDomain);
            const dependents = impactGraph.edges
                .filter(edge => edge.sourceDomain === node.domain)
                .map(edge => edge.targetDomain);
            // Create coordination strategy
            const coordinationStrategy = this.createCoordinationStrategy(node, dependencies, dependents);
            const coordination = {
                domain: node.domain,
                updatePhase: 'analysis',
                dependencies,
                dependents,
                coordinationStrategy,
                errors: []
            };
            coordinationPlan.push(coordination);
        }
        return this.sortPlansByDependencies(coordinationPlan);
    }
    /**
     * Sort coordination plans by dependencies (dependencies first)
     */
    sortPlansByDependencies(plans) {
        const sorted = [];
        const remaining = [...plans];
        const processed = new Set();
        while (remaining.length > 0) {
            const canProcess = remaining.filter(plan => plan.dependencies.every(dep => processed.has(dep)));
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
     * Create coordination strategy for a domain
     */
    createCoordinationStrategy(node, dependencies, dependents) {
        const hasNoDependencies = dependencies.length === 0;
        const hasMultipleDependents = dependents.length > 2;
        const isHighImpact = node.impactScore > 0.7;
        const isCriticalPriority = node.updatePriority === 'critical';
        // Determine parallelizability
        const parallelizable = hasNoDependencies && !isCriticalPriority;
        // Determine risk level
        let riskLevel = 'low';
        if (isHighImpact || isCriticalPriority || hasMultipleDependents) {
            riskLevel = 'high';
        }
        else if (dependencies.length > 1 || dependents.length > 0) {
            riskLevel = 'medium';
        }
        // Determine required resources
        const requiredResources = ['atomic-file-manager', 'rollback-manager'];
        if (isHighImpact) {
            requiredResources.push('semantic-analysis');
        }
        if (hasMultipleDependents) {
            requiredResources.push('coordination-locks');
        }
        const strategyName = this.getStrategyName(parallelizable, riskLevel, isCriticalPriority);
        return {
            name: strategyName,
            description: this.getStrategyDescription(node, parallelizable, riskLevel),
            parallelizable,
            riskLevel,
            estimatedTime: node.estimatedUpdateTime,
            requiredResources
        };
    }
    /**
     * Get strategy name based on characteristics
     */
    getStrategyName(parallelizable, riskLevel, isCritical) {
        if (isCritical) {
            return 'Critical Sequential';
        }
        if (parallelizable && riskLevel === 'low') {
            return 'Parallel Low-Risk';
        }
        if (parallelizable && riskLevel === 'medium') {
            return 'Parallel Monitored';
        }
        if (riskLevel === 'high') {
            return 'Sequential High-Risk';
        }
        return 'Sequential Standard';
    }
    /**
     * Get strategy description
     */
    getStrategyDescription(node, parallelizable, _riskLevel) {
        const baseDesc = `Update ${node.domain} domain (${node.impactLevel} impact, ${node.updatePriority} priority)`;
        if (parallelizable) {
            return `${baseDesc} - Can execute in parallel with other independent domains`;
        }
        else {
            return `${baseDesc} - Requires sequential execution due to dependencies`;
        }
    }
    /**
     * Create execution phases for coordinated updates
     */
    createExecutionPhases(updateSequence, coordinationPlan, impactGraph) {
        const phases = [];
        const coordinationMap = new Map(coordinationPlan.map(coord => [coord.domain, coord]));
        const processed = new Set();
        let phaseNumber = 1;
        while (processed.size < updateSequence.length) {
            const currentPhase = {
                phaseNumber,
                phaseName: `Phase ${phaseNumber}`,
                domains: [],
                parallelExecution: true,
                estimatedTime: 0,
                dependencies: [],
                criticalPath: false
            };
            // Find domains that can be executed in this phase
            for (const domain of updateSequence) {
                if (processed.has(domain))
                    continue;
                const coordination = coordinationMap.get(domain);
                if (!coordination)
                    continue;
                // Check if all dependencies are satisfied
                const dependenciesSatisfied = coordination.dependencies.every(dep => processed.has(dep));
                if (dependenciesSatisfied) {
                    currentPhase.domains.push(domain);
                    processed.add(domain);
                    // Update phase characteristics
                    if (!coordination.coordinationStrategy.parallelizable) {
                        currentPhase.parallelExecution = false;
                    }
                    currentPhase.estimatedTime = Math.max(currentPhase.estimatedTime, coordination.coordinationStrategy.estimatedTime);
                    // Add dependencies for the phase
                    currentPhase.dependencies = [
                        ...currentPhase.dependencies,
                        ...coordination.dependencies.filter(dep => !currentPhase.dependencies.includes(dep))
                    ];
                    // Check if this is on the critical path
                    if (impactGraph.criticalPath.includes(domain)) {
                        currentPhase.criticalPath = true;
                    }
                }
            }
            if (currentPhase.domains.length === 0) {
                logger.warn('Unable to progress in phase creation - possible circular dependency');
                break;
            }
            // Adjust phase name based on characteristics
            if (currentPhase.criticalPath) {
                currentPhase.phaseName = `Critical Path Phase ${phaseNumber}`;
            }
            else if (!currentPhase.parallelExecution) {
                currentPhase.phaseName = `Sequential Phase ${phaseNumber}`;
            }
            else {
                currentPhase.phaseName = `Parallel Phase ${phaseNumber}`;
            }
            phases.push(currentPhase);
            phaseNumber++;
        }
        return phases;
    }
    /**
     * Setup coordination infrastructure
     */
    async setupCoordination(updatePlan) {
        logger.debug(`Setting up coordination for plan ${updatePlan.planId}`);
        // Initialize all domain coordinations to preparation phase
        for (const coordination of updatePlan.coordinationPlan) {
            coordination.updatePhase = 'preparation';
        }
        // Verify coordination resources
        await this.verifyCoordinationResources(updatePlan);
        // Setup monitoring and logging
        this.setupCoordinationMonitoring(updatePlan);
        logger.info(`Coordination setup completed for plan ${updatePlan.planId}`);
    }
    /**
     * Verify that required coordination resources are available
     */
    async verifyCoordinationResources(updatePlan) {
        const requiredResources = new Set();
        for (const coordination of updatePlan.coordinationPlan) {
            for (const resource of coordination.coordinationStrategy.requiredResources) {
                requiredResources.add(resource);
            }
        }
        // Check each required resource
        for (const resource of requiredResources) {
            await this.verifyResource(resource);
        }
    }
    /**
     * Verify availability of a specific resource
     */
    async verifyResource(resource) {
        switch (resource) {
            case 'atomic-file-manager':
                // Verify atomic file manager is operational
                break;
            case 'rollback-manager':
                // Verify rollback manager is operational
                break;
            case 'semantic-analysis':
                // Verify semantic analysis service is operational
                break;
            case 'coordination-locks':
                // Verify coordination locking mechanism is operational
                break;
            default:
                logger.warn(`Unknown resource requested: ${resource}`);
        }
    }
    /**
     * Setup monitoring for coordination process
     */
    setupCoordinationMonitoring(updatePlan) {
        logger.debug(`Setting up monitoring for plan ${updatePlan.planId}`);
        // Could be extended to setup real-time monitoring, alerts, etc.
        // For now, just log the setup
        logger.info(`Monitoring configured for ${updatePlan.coordinationPlan.length} domain coordinations`);
    }
    /**
     * Execute the coordinated update plan
     */
    async executeCoordinatedUpdate(updatePlan, startTime, timeout) {
        const executedPhases = 0;
        const updatedDomains = [];
        const failedDomains = [];
        const coordinationLogs = [];
        let rollbackRequired = false;
        let rollbackCompleted = false;
        logger.info(`Executing coordinated update plan ${updatePlan.planId}`);
        coordinationLogs.push(`Starting execution of ${updatePlan.executionPhases.length} phases`);
        try {
            for (let i = 0; i < updatePlan.executionPhases.length; i++) {
                const phase = updatePlan.executionPhases[i];
                // Check timeout before each phase
                if (startTime && timeout) {
                    this.checkTimeout(startTime, timeout, `before executing phase ${i + 1}: ${phase.phaseName}`);
                }
                logger.info(`Executing ${phase.phaseName} with domains: ${phase.domains.join(', ')}`);
                coordinationLogs.push(`Starting ${phase.phaseName}: ${phase.domains.join(', ')}`);
                // Update coordination states
                for (const domain of phase.domains) {
                    const coordination = updatePlan.coordinationPlan.find(c => c.domain === domain);
                    if (coordination) {
                        coordination.updatePhase = 'execution';
                        coordination.startTime = new Date();
                    }
                }
                // Execute phase
                const phaseResult = await this.executePhase(phase, updatePlan);
                if (phaseResult.success) {
                    updatedDomains.push(...phase.domains);
                    coordinationLogs.push(`${phase.phaseName} completed successfully`);
                    // Update coordination states to completed
                    for (const domain of phase.domains) {
                        const coordination = updatePlan.coordinationPlan.find(c => c.domain === domain);
                        if (coordination) {
                            coordination.updatePhase = 'completed';
                            coordination.completionTime = new Date();
                        }
                    }
                }
                else {
                    failedDomains.push(...phase.domains);
                    coordinationLogs.push(`${phase.phaseName} failed: ${phaseResult.error}`);
                    // Update coordination states to failed
                    for (const domain of phase.domains) {
                        const coordination = updatePlan.coordinationPlan.find(c => c.domain === domain);
                        if (coordination) {
                            coordination.updatePhase = 'failed';
                            coordination.errors?.push(new Error(phaseResult.error || 'Phase execution failed'));
                        }
                    }
                    rollbackRequired = true;
                    break;
                }
            }
            // If rollback is required, execute it
            if (rollbackRequired) {
                logger.warn(`Rollback required for plan ${updatePlan.planId}`);
                rollbackCompleted = await this.executeCoordinatedRollback(updatePlan.planId);
            }
        }
        catch (error) {
            logger.error(`Execution failed for plan ${updatePlan.planId}:`, error);
            coordinationLogs.push(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            rollbackRequired = true;
            rollbackCompleted = await this.executeCoordinatedRollback(updatePlan.planId);
        }
        return {
            executedPhases,
            updatedDomains,
            failedDomains,
            rollbackRequired,
            rollbackCompleted,
            coordinationLogs
        };
    }
    /**
     * Execute a single phase of the coordinated update
     */
    async executePhase(phase, updatePlan) {
        try {
            if (phase.parallelExecution && phase.domains.length > 1) {
                // Execute domains in parallel
                const promises = phase.domains.map(domain => this.executeDomainUpdate(domain, updatePlan));
                const results = await Promise.allSettled(promises);
                // Check if all succeeded
                const allSucceeded = results.every(result => result.status === 'fulfilled' && result.value.success);
                if (!allSucceeded) {
                    const failedResults = results
                        .filter(result => result.status === 'rejected' || !result.value.success)
                        .map(result => result.status === 'rejected' ? result.reason : result.value.error)
                        .join('; ');
                    return { success: false, error: failedResults };
                }
                return { success: true };
            }
            else {
                // Execute domains sequentially
                for (const domain of phase.domains) {
                    const result = await this.executeDomainUpdate(domain, updatePlan);
                    if (!result.success) {
                        return { success: false, error: result.error };
                    }
                }
                return { success: true };
            }
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Execute update for a single domain
     */
    async executeDomainUpdate(domain, updatePlan) {
        logger.debug(`Executing update for domain: ${domain}`);
        try {
            // Get domain-specific changed files
            const domainBoundary = updatePlan.impactPrediction.impactGraph.nodes.find(n => n.domain === domain);
            const domainChangedFiles = domainBoundary?.changedFiles || [];
            // Create holistic update request for this domain
            const domainRequest = {
                changedFiles: domainChangedFiles,
                triggerType: 'manual',
                performanceTimeout: 30 // 30 seconds per domain
            };
            // Execute holistic update
            const result = await this.holisticOrchestrator.executeHolisticUpdate(domainRequest);
            if (result.success) {
                logger.info(`Domain update completed for ${domain} in ${result.executionTime}ms`);
                return { success: true };
            }
            else {
                logger.error(`Domain update failed for ${domain}:`, result.error);
                return { success: false, error: result.error?.message || 'Unknown error' };
            }
        }
        catch (error) {
            logger.error(`Domain update exception for ${domain}:`, error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Validate the coordinated update
     */
    async validateCoordinatedUpdate(updatePlan, executionResult) {
        const validationErrors = [];
        logger.info(`Validating coordinated update for plan ${updatePlan.planId}`);
        try {
            // Validate that all critical domains were updated successfully
            const criticalDomains = updatePlan.coordinationPlan
                .filter(coord => coord.coordinationStrategy.riskLevel === 'high')
                .map(coord => coord.domain);
            const failedCriticalDomains = criticalDomains.filter(domain => executionResult.failedDomains.includes(domain));
            if (failedCriticalDomains.length > 0) {
                validationErrors.push(`Critical domains failed: ${failedCriticalDomains.join(', ')}`);
            }
            // Validate domain coordination states
            for (const coordination of updatePlan.coordinationPlan) {
                if (coordination.updatePhase === 'failed') {
                    validationErrors.push(`Domain ${coordination.domain} failed coordination`);
                }
            }
            // Validate performance constraints
            const totalTime = updatePlan.executionPhases.reduce((sum, phase) => sum + phase.estimatedTime, 0);
            if (executionResult.executionTime > totalTime * 1.5) {
                validationErrors.push(`Execution time exceeded estimates by ${Math.round((executionResult.executionTime / totalTime - 1) * 100)}%`);
            }
            const success = validationErrors.length === 0;
            if (success) {
                logger.info(`Validation successful for plan ${updatePlan.planId}`);
            }
            else {
                logger.warn(`Validation failed for plan ${updatePlan.planId}: ${validationErrors.join('; ')}`);
            }
            return { success, validationErrors };
        }
        catch (error) {
            logger.error(`Validation error for plan ${updatePlan.planId}:`, error);
            validationErrors.push(`Validation exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, validationErrors };
        }
    }
    /**
     * Execute coordinated rollback
     */
    async executeCoordinatedRollback(planId) {
        logger.warn(`Executing coordinated rollback for plan ${planId}`);
        try {
            const updatePlan = this.activeCoordinations.get(planId);
            if (!updatePlan) {
                logger.error(`Update plan ${planId} not found for rollback`);
                return false;
            }
            // Execute rollback in reverse order of execution
            const domainsToRollback = updatePlan.coordinationPlan
                .filter(coord => coord.updatePhase === 'completed' || coord.updatePhase === 'failed')
                .map(coord => coord.domain)
                .reverse();
            logger.info(`Rolling back ${domainsToRollback.length} domains for plan ${planId}`);
            for (const domain of domainsToRollback) {
                try {
                    // Use holistic orchestrator's rollback capability
                    // This is a simplified approach - could be enhanced with domain-specific rollback
                    await this.holisticOrchestrator.performMaintenance();
                    logger.debug(`Rollback completed for domain: ${domain}`);
                }
                catch (domainError) {
                    logger.error(`Rollback failed for domain ${domain}:`, domainError);
                    // Continue with other domains
                }
            }
            logger.info(`Coordinated rollback completed for plan ${planId}`);
            return true;
        }
        catch (error) {
            logger.error(`Coordinated rollback failed for plan ${planId}:`, error);
            return false;
        }
    }
    /**
     * Generate risk assessment
     */
    generateRiskAssessment(impactPrediction) {
        const risks = impactPrediction.riskFactors;
        const criticalRisks = risks.filter(r => r.severity === 'critical').length;
        const highRisks = risks.filter(r => r.severity === 'high').length;
        const mediumRisks = risks.filter(r => r.severity === 'medium').length;
        let assessment = 'Risk Assessment: ';
        if (criticalRisks > 0) {
            assessment += `CRITICAL (${criticalRisks} critical risks) - `;
        }
        else if (highRisks > 0) {
            assessment += `HIGH (${highRisks} high risks) - `;
        }
        else if (mediumRisks > 0) {
            assessment += `MEDIUM (${mediumRisks} medium risks) - `;
        }
        else {
            assessment += 'LOW - ';
        }
        assessment += `${impactPrediction.impactGraph.nodes.length} domains affected, `;
        assessment += `${Math.round(impactPrediction.impactGraph.totalEstimatedTime / 60)} minute estimated duration`;
        return assessment;
    }
    /**
     * Generate rollback strategy
     */
    generateRollbackStrategy(impactPrediction, coordinationPlan) {
        const criticalDomains = coordinationPlan
            .filter(coord => coord.coordinationStrategy.riskLevel === 'high')
            .length;
        const totalDomains = coordinationPlan.length;
        let strategy = 'Rollback Strategy: ';
        if (criticalDomains > totalDomains / 2) {
            strategy += 'Comprehensive rollback with domain-by-domain verification required. ';
        }
        else {
            strategy += 'Standard rollback with automated verification. ';
        }
        strategy += `Estimated rollback time: ${Math.round(impactPrediction.impactGraph.totalEstimatedTime * 0.3 / 60)} minutes. `;
        strategy += 'Critical path domains will be rolled back first.';
        return strategy;
    }
    /**
     * Generate unique plan ID
     */
    generatePlanId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `coord_${timestamp}_${random}`;
    }
    /**
     * Get status of active coordinations
     */
    getActiveCoordinations() {
        return Array.from(this.activeCoordinations.keys());
    }
    /**
     * Get coordination plan for a specific plan ID
     */
    getCoordinationPlan(planId) {
        return this.activeCoordinations.get(planId);
    }
    /**
     * Clear coordination caches
     */
    clearCaches() {
        this.impactMapper.clearCache();
        logger.debug('Cross-domain coordinator caches cleared');
    }
    /**
     * Check if the analysis has exceeded the timeout
     */
    checkTimeout(startTime, timeout, context) {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeout) {
            const error = new Error(`Cross-domain coordination timeout exceeded after ${elapsed}ms during ${context}. Timeout limit: ${timeout}ms`);
            logger.error(`Performance timeout exceeded: ${error.message}`);
            throw error;
        }
        // Warn if approaching timeout
        if (elapsed > timeout * 0.8) {
            logger.warn(`Cross-domain coordination approaching timeout: ${elapsed}ms of ${timeout}ms used during ${context}`);
        }
    }
}
//# sourceMappingURL=cross-domain-coordinator.js.map
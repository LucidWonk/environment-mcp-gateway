import { ChangeImpactPrediction } from './impact-mapper.js';
import { HolisticUpdateRequest, HolisticUpdateResult } from './holistic-update-orchestrator.js';
export interface CoordinationStrategy {
    name: string;
    description: string;
    parallelizable: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedTime: number;
    requiredResources: string[];
}
export interface DomainUpdateCoordination {
    domain: string;
    updatePhase: 'analysis' | 'preparation' | 'execution' | 'validation' | 'completed' | 'failed';
    dependencies: string[];
    dependents: string[];
    coordinationStrategy: CoordinationStrategy;
    startTime?: Date;
    completionTime?: Date;
    result?: HolisticUpdateResult;
    errors?: Error[];
}
export interface CrossDomainUpdatePlan {
    planId: string;
    changedFiles: string[];
    impactPrediction: ChangeImpactPrediction;
    coordinationPlan: DomainUpdateCoordination[];
    executionPhases: ExecutionPhase[];
    totalEstimatedTime: number;
    riskAssessment: string;
    rollbackStrategy: string;
    createdAt: Date;
}
export interface ExecutionPhase {
    phaseNumber: number;
    phaseName: string;
    domains: string[];
    parallelExecution: boolean;
    estimatedTime: number;
    dependencies: string[];
    criticalPath: boolean;
}
export interface CoordinationResult {
    success: boolean;
    planId: string;
    executedPhases: number;
    totalPhases: number;
    executionTime: number;
    updatedDomains: string[];
    failedDomains: string[];
    rollbackRequired: boolean;
    rollbackCompleted: boolean;
    coordinationLogs: string[];
    performanceMetrics: {
        analysisTime: number;
        coordinationTime: number;
        executionTime: number;
        validationTime: number;
    };
}
/**
 * Coordinates cross-domain updates with sophisticated impact analysis
 * Manages dependencies, parallel execution, and rollback coordination
 */
export declare class CrossDomainCoordinator {
    private readonly domainAnalyzer;
    private readonly impactMapper;
    private readonly holisticOrchestrator;
    private readonly projectRoot;
    private activeCoordinations;
    private readonly timeout;
    private readonly performanceTimeout;
    constructor(projectRoot?: string, timeout?: number);
    /**
     * Coordinate a comprehensive cross-domain update
     */
    coordinateUpdate(request: HolisticUpdateRequest): Promise<CoordinationResult>;
    /**
     * Create comprehensive update plan with impact analysis
     */
    private createUpdatePlan;
    /**
     * Create coordination plan for each affected domain
     */
    private createDomainCoordinationPlan;
    /**
     * Sort coordination plans by dependencies (dependencies first)
     */
    private sortPlansByDependencies;
    /**
     * Create coordination strategy for a domain
     */
    private createCoordinationStrategy;
    /**
     * Get strategy name based on characteristics
     */
    private getStrategyName;
    /**
     * Get strategy description
     */
    private getStrategyDescription;
    /**
     * Create execution phases for coordinated updates
     */
    private createExecutionPhases;
    /**
     * Setup coordination infrastructure
     */
    private setupCoordination;
    /**
     * Verify that required coordination resources are available
     */
    private verifyCoordinationResources;
    /**
     * Verify availability of a specific resource
     */
    private verifyResource;
    /**
     * Setup monitoring for coordination process
     */
    private setupCoordinationMonitoring;
    /**
     * Execute the coordinated update plan
     */
    private executeCoordinatedUpdate;
    /**
     * Execute a single phase of the coordinated update
     */
    private executePhase;
    /**
     * Execute update for a single domain
     */
    private executeDomainUpdate;
    /**
     * Validate the coordinated update
     */
    private validateCoordinatedUpdate;
    /**
     * Execute coordinated rollback
     */
    private executeCoordinatedRollback;
    /**
     * Generate risk assessment
     */
    private generateRiskAssessment;
    /**
     * Generate rollback strategy
     */
    private generateRollbackStrategy;
    /**
     * Generate unique plan ID
     */
    private generatePlanId;
    /**
     * Get status of active coordinations
     */
    getActiveCoordinations(): string[];
    /**
     * Get coordination plan for a specific plan ID
     */
    getCoordinationPlan(planId: string): CrossDomainUpdatePlan | undefined;
    /**
     * Clear coordination caches
     */
    clearCaches(): void;
    /**
     * Check if the analysis has exceeded the timeout
     */
    private checkTimeout;
}
//# sourceMappingURL=cross-domain-coordinator.d.ts.map
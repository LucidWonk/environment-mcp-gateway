/**
 * Update Integration Service
 * Coordinates holistic context updates with cross-domain impact analysis
 * Implements TEMP-CONTEXT-ENGINE-a7b3 capability
 */
export interface UpdateIntegrationRequest {
    changedFiles: string[];
    triggerType: 'git-hook' | 'manual' | 'scheduled';
    performanceTimeout?: number;
    projectRoot?: string;
}
export interface UpdateIntegrationResult {
    success: boolean;
    integrationId: string;
    impactAnalysisResult: any;
    coordinationResult: any;
    holisticUpdateResult: any;
    executionMetrics: {
        impactAnalysisTime: number;
        coordinationTime: number;
        holisticUpdateTime: number;
        totalTime: number;
    };
    affectedDomains: string[];
    errors: string[];
    warnings: string[];
}
/**
 * Orchestrates the complete update integration workflow
 * 1. Perform cross-domain impact analysis
 * 2. Coordinate multi-domain update sequencing
 * 3. Execute holistic context updates
 * 4. Handle event coordination
 */
export declare class UpdateIntegrationOrchestrator {
    private impactMapper;
    private crossDomainCoordinator;
    private holisticOrchestrator;
    private eventManager;
    private activeIntegrations;
    constructor(projectRoot?: string);
    /**
     * Execute integrated update workflow
     * Coordinates impact analysis, cross-domain coordination, and holistic updates
     */
    executeIntegratedUpdate(request: UpdateIntegrationRequest): Promise<UpdateIntegrationResult>;
    /**
     * Get status of active integrations
     */
    getActiveIntegrations(): string[];
    /**
     * Get integration result by ID
     */
    getIntegrationResult(integrationId: string): UpdateIntegrationResult | null;
    /**
     * Attempt rollback of failed integration
     */
    private attemptRollback;
    /**
     * Generate unique integration ID
     */
    private generateIntegrationId;
    /**
     * Validate integration prerequisites
     */
    validatePrerequisites(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
}
//# sourceMappingURL=update-integration.d.ts.map
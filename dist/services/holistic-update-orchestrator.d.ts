import { HolisticRollbackData } from './rollback-manager.js';
export interface HolisticUpdateRequest {
    changedFiles: string[];
    gitCommitHash?: string;
    triggerType: 'git-hook' | 'manual' | 'scheduled';
    performanceTimeout?: number;
}
export interface DomainUpdatePlan {
    domain: string;
    contextPath: string;
    requiredUpdates: {
        filePath: string;
        content: string;
    }[];
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
export declare class HolisticUpdateOrchestrator {
    private readonly atomicFileManager;
    private readonly rollbackManager;
    private readonly semanticAnalysis;
    private readonly contextGenerator;
    private readonly projectRoot;
    constructor(projectRoot?: string);
    /**
     * Execute holistic context update for changed files
     */
    executeHolisticUpdate(request: HolisticUpdateRequest): Promise<HolisticUpdateResult>;
    /**
     * Perform semantic analysis on changed files
     */
    private performSemanticAnalysis;
    /**
     * Identify all domains affected by the changes
     */
    private identifyAffectedDomains;
    /**
     * Infer domain from file path patterns
     */
    private inferDomainFromPath;
    /**
     * Identify cross-cutting domains that might be affected
     */
    private identifyCrossCuttingDomains;
    /**
     * Create update plan for all affected domains
     */
    private createDomainUpdatePlan;
    /**
     * Identify dependencies between domains
     */
    private identifyDomainDependencies;
    /**
     * Sort plans by dependencies (dependencies first)
     */
    private sortPlansByDependencies;
    /**
     * Determine why a domain needs updating
     */
    private determineUpdateReason;
    /**
     * Convert semantic analysis results to context generator format
     */
    private convertToContextGeneratorFormat;
    /**
     * Generate context content for all domains
     */
    private generateAllContextUpdates;
    /**
     * Serialize context content to markdown format
     */
    private serializeContextContent;
    /**
     * Create file operations for atomic execution
     */
    private createFileOperations;
    /**
     * Generate unique update ID
     */
    private generateUpdateId;
    /**
     * Get status of recent holistic updates
     */
    getRecentUpdateStatus(limitCount?: number): Promise<any[]>;
    /**
     * Cleanup old update data
     */
    performMaintenance(): Promise<void>;
}
//# sourceMappingURL=holistic-update-orchestrator.d.ts.map
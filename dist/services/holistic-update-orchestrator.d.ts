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
    private readonly timeoutManager;
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Initialize project root with proper path resolution
     */
    private initializeAsync;
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
     * Consolidate subdomains into their parent domains to avoid context file fragmentation
     * E.g., Analysis.Indicator, Analysis.Pattern -> Analysis
     * Data.Provider, Data.Repository -> Data
     */
    private consolidateSubdomains;
    /**
     * Create update plan for all affected domains
     */
    private createDomainUpdatePlan;
    /**
     * Determine hierarchical context path based on semantic analysis
     * Implements BR-CEE-001: Context placement logic must support hierarchical directory structures
     */
    private determineHierarchicalContextPath;
    /**
     * Detect semantic subdirectories that warrant their own context files
     * Implements BR-CEE-002: Domain detection must recognize semantic subdirectories with business content
     */
    private detectSemanticSubdirectories;
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
     * Fixed: Enhanced mapping to properly handle business rules from XML documentation parser
     */
    private convertToContextGeneratorFormat;
    /**
     * Calculate domain confidence based on semantic analysis results
     */
    private calculateDomainConfidence;
    /**
     * Extract cross-domain dependencies from semantic analysis results
     */
    private extractCrossDomainDependencies;
    /**
     * Calculate impact level based on semantic analysis results
     */
    private calculateImpactLevel;
    /**
     * Extract affected components from semantic analysis results
     */
    private extractAffectedComponents;
    /**
     * Extract domain from dependency string
     */
    private extractDomainFromDependency;
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
     * Determine which phase the failure occurred in based on metrics
     */
    private determineFailurePhase;
    /**
     * Create timeout wrapper for operations with detailed timeout context
     */
    private withTimeout;
    /**
     * Cleanup old update data
     */
    performMaintenance(): Promise<void>;
}
//# sourceMappingURL=holistic-update-orchestrator.d.ts.map
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
export interface GranularContextQualification {
    qualifiesForGranularContext: boolean;
    confidenceScore: number;
    businessConceptCount: number;
    businessRuleCount: number;
    hasAlgorithmicComplexity: boolean;
    hasSemanticCoherence: boolean;
    hasAIAssistanceValue: boolean;
}
export interface MultiLevelContextCoordination {
    parentContexts: ContextHierarchyEntry[];
    childContexts: ContextHierarchyEntry[];
    relationships: ParentChildRelationship[];
    contentDistribution: Map<string, ContentDistributionStrategy>;
    consistencyValidation: ConsistencyValidationResult;
}
export interface ContextHierarchyEntry {
    contextPath: string;
    domain: string;
    hierarchyLevel: 'parent' | 'child';
    content: string;
    businessConceptCount: number;
    businessRuleCount: number;
    specialization: string;
    parentReference?: string;
}
export interface ParentChildRelationship {
    parentPath: string;
    childPath: string;
    contentSpecialization: ContentSpecialization;
    crossReferences: CrossContextReferences;
}
export interface ContentSpecialization {
    parentFocus: string;
    childFocus: string;
    contentDistribution: {
        parent: string[];
        child: string[];
    };
    duplicationAvoidance: {
        preventDuplication: boolean;
        specializedContent: boolean;
        crossReferencesEnabled: boolean;
    };
}
export interface CrossContextReferences {
    parentToChild: {
        reference: string;
        navigationHint: string;
    };
    childToParent: {
        reference: string;
        navigationHint: string;
    };
}
export interface HierarchyPlanGroups {
    parentPlans: DomainUpdatePlan[];
    childPlans: DomainUpdatePlan[];
}
export interface ContentDistributionStrategy {
    parentContent: string[];
    childContent: string[];
    sharedContent: string[];
    exclusiveContent: Map<string, string[]>;
}
export interface ConsistencyValidationResult {
    valid: boolean;
    issues: string[];
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
     * Execute holistic context update for changed files with comprehensive logging
     */
    executeHolisticUpdate(request: HolisticUpdateRequest): Promise<HolisticUpdateResult>;
    /**
     * Perform semantic analysis on changed files to extract business concepts and rules
     *
     * This method filters files to only those with relevant extensions (.cs, .ts, .js),
     * then calls the SemanticAnalysisService to extract:
     * - Business concepts (classes, interfaces, key abstractions)
     * - Business rules (validation logic, constraints, workflows)
     * - Domain context (which domain the file belongs to)
     *
     * @param changedFiles Array of file paths that have been modified
     * @returns Array of semantic analysis results, one per successfully analyzed file
     *
     * Critical: If this returns an empty array, no context files will be generated!
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
     * Enhanced hierarchical context path generation with granular context intelligence
     * Implements TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F001: Dynamic granular context path creation
     */
    private determineHierarchicalContextPath;
    /**
     * Generate granular context paths based on semantic boundary detection
     * Supports arbitrary directory depth based on semantic content analysis
     */
    private generateGranularContextPaths;
    /**
     * Group semantic analysis results by granular domain patterns
     */
    private groupResultsByGranularDomain;
    /**
     * Evaluate granular context qualification using enhanced criteria
     */
    private evaluateGranularContextQualification;
    /**
     * Assess algorithmic complexity for granular context qualification
     */
    private assessAlgorithmicComplexity;
    /**
     * Assess semantic coherence for granular context qualification
     */
    private assessSemanticCoherence;
    /**
     * Assess AI assistance value for granular context qualification
     */
    private assessAIAssistanceValue;
    /**
     * Construct granular context path from qualified domain
     */
    private constructGranularContextPath;
    /**
     * Get confidence score for a specific granular path
     */
    private getPathConfidenceScore;
    /**
     * Track additional granular paths for multi-level coordination
     */
    private trackAdditionalGranularPaths;
    private additionalGranularPaths?;
    /**
     * Multi-Level Context Generation Coordination Infrastructure
     * Implements TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F001: Parent-child context coordination
     */
    /**
     * Coordinate multi-level context generation ensuring parent-child consistency
     */
    private coordinateMultiLevelContextGeneration;
    /**
     * Group update plans by hierarchy level (parent vs child)
     */
    private groupPlansByHierarchyLevel;
    /**
     * Check if plan is domain-level (parent) context
     */
    private isDomainLevelPlan;
    /**
     * Check if plan is granular subdomain (child) context
     */
    private isGranularSubdomainPlan;
    /**
     * Find child plans that belong to a specific parent
     */
    private findChildPlansForParent;
    /**
     * Generate parent context with content distribution strategy
     */
    private generateParentContextWithDistribution;
    /**
     * Generate child context with specialization for specific algorithms
     */
    private generateChildContextWithSpecialization;
    /**
     * Generate parent context content focusing on broad domain understanding
     */
    private generateParentContextContent;
    /**
     * Generate child context content focusing on algorithm-specific details
     */
    private generateChildContextContent;
    /**
     * Extract subdomains from semantic results
     */
    private extractSubdomains;
    /**
     * Identify cross-subdomain integration patterns
     */
    private identifyCrossSubdomainPatterns;
    /**
     * Extract algorithm-specific concepts for child contexts
     */
    private extractAlgorithmSpecificConcepts;
    /**
     * Check if concept is algorithm-specific
     */
    private isAlgorithmSpecificConcept;
    /**
     * Extract implementation details for child contexts
     */
    private extractImplementationDetails;
    /**
     * Define content specialization between parent and child
     */
    private defineContentSpecialization;
    /**
     * Generate cross-references between parent and child contexts
     */
    private generateCrossReferences;
    /**
     * Validate consistency across context hierarchy
     */
    private validateHierarchyConsistency;
    /**
     * Detect content overlaps between parent and child contexts
     */
    private detectContentOverlaps;
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
export interface DomainBoundary {
    domain: string;
    rootPath: string;
    subDomains: string[];
    businessConcepts: string[];
    keyInterfaces: string[];
    dependencies: DomainDependency[];
    confidence: number;
}
export interface DomainDependency {
    targetDomain: string;
    dependencyType: 'strong' | 'weak' | 'interface' | 'data' | 'event';
    dependencyPath: string[];
    bidirectional: boolean;
    confidence: number;
}
export interface CrossDomainRelationship {
    sourceDomain: string;
    targetDomain: string;
    relationshipType: 'aggregation' | 'composition' | 'association' | 'dependency' | 'inheritance';
    strength: number;
    evidenceFiles: string[];
    businessJustification: string;
}
export interface DomainMap {
    domains: DomainBoundary[];
    relationships: CrossDomainRelationship[];
    isolatedDomains: string[];
    crossCuttingConcerns: string[];
    analysisTimestamp: Date;
    analysisVersion: string;
}
/**
 * Analyzes domain boundaries and cross-domain relationships
 * Implements Domain-Driven Design (DDD) boundary detection
 */
export declare class DomainAnalyzer {
    private readonly semanticAnalysis;
    private readonly projectRoot;
    private readonly knownDomainPatterns;
    private readonly timeout;
    private readonly performanceThreshold;
    constructor(projectRoot?: string, timeout?: number);
    /**
     * Initialize known domain patterns for the Lucidwonks platform
     * Sets up domainPatterns mapping for path-based domain inference
     */
    private initializeDomainPatterns;
    /**
     * Analyze complete domain map for the project
     */
    analyzeDomainMap(changedFiles?: string[]): Promise<DomainMap>;
    /**
     * Discover domain boundaries using file structure and semantic analysis
     */
    private discoverDomainBoundaries;
    /**
     * Analyze a specific domain boundary
     */
    private analyzeDomainBoundary;
    /**
     * Find files matching domain patterns
     */
    private findDomainFiles;
    /**
     * Recursively search for files matching patterns
     */
    private recursiveFileSearch;
    /**
     * Extract business concepts from semantic analysis
     */
    private extractBusinessConcepts;
    /**
     * Extract business rules from semantic analysis
     */
    private extractBusinessRules;
    /**
     * Extract key interfaces and public contracts
     */
    private extractKeyInterfaces;
    /**
     * Identify sub-domains within a domain
     */
    private identifySubDomains;
    /**
     * Determine the root path for a domain
     */
    private determineDomainRootPath;
    /**
     * Calculate confidence score for domain boundary detection
     */
    private calculateDomainConfidence;
    /**
     * Discover unknown domains through directory analysis
     */
    private discoverUnknownDomains;
    /**
     * Analyze relationships between domains
     */
    private analyzeRelationships;
    /**
     * Analyze relationship between two specific domains
     */
    private analyzeRelationshipBetween;
    /**
     * Find files that reference across domains
     */
    private findCrossDomainReferences;
    /**
     * Check if file content references target domain
     */
    private checkForCrossDomainReference;
    /**
     * Determine the type of relationship between domains
     */
    private determineRelationshipType;
    /**
     * Calculate strength of relationship (0-1 scale)
     */
    private calculateRelationshipStrength;
    /**
     * Generate business justification for relationship
     */
    private generateBusinessJustification;
    /**
     * Identify domains with no relationships
     */
    private identifyIsolatedDomains;
    /**
     * Identify cross-cutting concerns
     */
    private identifyCrossCuttingConcerns;
    /**
     * Get domain analysis for specific changed files
     */
    analyzeChangedFileImpacts(changedFiles: string[]): Promise<{
        affectedDomains: string[];
        impactedRelationships: CrossDomainRelationship[];
        propagationPaths: string[][];
    }>;
    /**
     * Build paths showing how changes propagate through domains
     */
    private buildPropagationPaths;
    /**
     * Recursively find propagation paths
     */
    private findPropagationPaths;
    /**
     * Infer domain from file path
     */
    inferDomainFromPath(filePath: string): string | null;
    /**
     * Check if the analysis has exceeded the timeout
     */
    private checkTimeout;
}
//# sourceMappingURL=domain-analyzer.d.ts.map
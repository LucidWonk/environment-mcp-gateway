export interface ImpactNode {
    domain: string;
    impactLevel: 'direct' | 'indirect' | 'cascade';
    impactScore: number;
    changedFiles: string[];
    affectedComponents: string[];
    propagationDepth: number;
    estimatedUpdateTime: number;
    updatePriority: 'critical' | 'high' | 'medium' | 'low';
}
export interface ImpactEdge {
    sourceDomain: string;
    targetDomain: string;
    propagationType: 'interface' | 'data' | 'event' | 'dependency' | 'configuration';
    strength: number;
    bidirectional: boolean;
    propagationDelay: number;
}
export interface ImpactGraph {
    nodes: ImpactNode[];
    edges: ImpactEdge[];
    rootChanges: string[];
    analysisTimestamp: Date;
    totalEstimatedTime: number;
    criticalPath: string[];
}
export interface ChangeImpactPrediction {
    impactGraph: ImpactGraph;
    updateSequence: string[];
    riskFactors: RiskFactor[];
    confidenceScore: number;
    recommendations: string[];
}
export interface RiskFactor {
    type: 'circular-dependency' | 'high-coupling' | 'missing-tests' | 'performance' | 'rollback-complexity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedDomains: string[];
    mitigation: string;
}
/**
 * Maps and analyzes the impact of changes across domain boundaries
 * Provides prediction and visualization of cross-domain propagation
 */
export declare class ImpactMapper {
    private readonly domainAnalyzer;
    private readonly semanticAnalysis;
    private readonly projectRoot;
    private cachedDomainMap?;
    private cacheTimestamp?;
    private readonly timeout;
    private readonly performanceThreshold;
    private readonly maxPropagationDepth;
    constructor(projectRoot?: string, timeout?: number);
    /**
     * Predict the complete impact of proposed changes
     */
    predictChangeImpact(changedFiles: string[]): Promise<ChangeImpactPrediction>;
    /**
     * Get or refresh the domain map
     */
    private getDomainMap;
    /**
     * Build the impact graph showing all affected domains and relationships
     */
    private buildImpactGraph;
    /**
     * Identify domains directly affected by file changes
     */
    private identifyDirectlyAffectedDomains;
    /**
     * Create an impact node for a domain
     */
    private createImpactNode;
    /**
     * Analyze semantic changes within a domain
     */
    private analyzeSemanticChanges;
    /**
     * Calculate impact score for a domain
     */
    private calculateImpactScore;
    /**
     * Identify components affected within a domain
     */
    private identifyAffectedComponents;
    /**
     * Estimate time required to update a domain
     */
    private estimateUpdateTime;
    /**
     * Determine update priority for a domain
     */
    private determineUpdatePriority;
    /**
     * Propagate impact through domain relationships
     */
    private propagateImpact;
    /**
     * Create an impact edge from a cross-domain relationship
     */
    private createImpactEdge;
    /**
     * Calculate the critical path through the impact graph
     */
    private calculateCriticalPath;
    /**
     * Calculate optimal update sequence
     */
    private calculateUpdateSequence;
    /**
     * Identify risk factors in the impact analysis
     */
    private identifyRiskFactors;
    /**
     * Detect circular dependencies in the impact graph
     */
    private detectCircularDependencies;
    /**
     * Detect domains with high coupling
     */
    private detectHighCoupling;
    /**
     * Detect performance risks
     */
    private detectPerformanceRisks;
    /**
     * Assess rollback complexity
     */
    private assessRollbackComplexity;
    /**
     * Calculate confidence score for the prediction
     */
    private calculateConfidenceScore;
    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations;
    /**
     * Clear domain map cache
     */
    clearCache(): void;
    /**
     * Check if the analysis has exceeded the timeout
     */
    private checkTimeout;
}
//# sourceMappingURL=impact-mapper.d.ts.map
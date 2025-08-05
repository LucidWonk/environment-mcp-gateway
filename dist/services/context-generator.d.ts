/**
 * Context Generator Service
 * Generates enhanced .context files using semantic analysis results
 * Part of Context Engineering Enhancement system (TEMP-CONTEXT-ENGINE-a7b3)
 */
export interface SemanticAnalysisResult {
    filePath: string;
    language: string;
    businessConcepts: BusinessConcept[];
    businessRules: BusinessRule[];
    domainAnalysis: {
        primaryDomain: string;
        confidence: number;
        crossDomainDependencies: string[];
    };
    changeAnalysis: {
        changeType: 'new' | 'modified' | 'deleted';
        impactLevel: 'low' | 'medium' | 'high';
        affectedComponents: string[];
    };
}
export interface BusinessConcept {
    name: string;
    type: 'Entity' | 'ValueObject' | 'Service' | 'Repository' | 'Event' | 'Command';
    domain: string;
    confidence: number;
    context: string;
}
export interface BusinessRule {
    description: string;
    category: 'validation' | 'business-logic' | 'constraint' | 'workflow';
    confidence: number;
    sourceLocation: string;
}
export interface ContextFileContent {
    domainOverview: string;
    currentImplementation: string;
    businessRules: string;
    integrationPoints: string;
    recentChanges: string;
}
export declare class ContextGenerator {
    private readonly projectRoot;
    private readonly cacheDir;
    constructor();
    /**
     * Generate enhanced context files from semantic analysis results
     * Business Rule: Context files must include semantic information and business rules
     * Performance Requirement: Context generation must complete within 5 seconds
     */
    generateContextFiles(analysisResults: SemanticAnalysisResult[]): Promise<ContextFileContent[]>;
    /**
     * Generate context content for a specific domain
     */
    private generateDomainContext;
    /**
     * Generate domain overview from semantic analysis
     * Business Rule: Domain overview must reflect actual business concepts found in code
     */
    private generateDomainOverview;
    /**
     * Generate current implementation summary
     */
    private generateCurrentImplementation;
    /**
     * Generate business rules documentation
     * Business Rule: All business rules must be extracted and documented with confidence levels
     */
    private generateBusinessRules;
    /**
     * Generate integration points documentation
     */
    private generateIntegrationPoints;
    /**
     * Generate recent changes summary
     */
    private generateRecentChanges;
    /**
     * Group analysis results by primary domain
     */
    private groupByDomain;
    /**
     * Group business concepts by type
     */
    private groupConceptsByType;
    /**
     * Load semantic analysis results from cache
     * Business Rule: Must handle missing or invalid cache files gracefully
     */
    loadSemanticAnalysisFromCache(): Promise<SemanticAnalysisResult[]>;
    /**
     * Convert cached analysis format to semantic result format
     */
    private convertCachedToSemanticResult;
    /**
     * Write context files to appropriate domain directories
     * Business Rule: Context files must be written to domain-specific .context directories
     */
    writeContextFiles(contextFiles: ContextFileContent[], targetDomain: string): Promise<void>;
    /**
     * Determine appropriate path for domain context files
     */
    private getDomainPath;
}
//# sourceMappingURL=context-generator.d.ts.map
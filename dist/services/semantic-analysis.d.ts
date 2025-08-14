export interface BusinessConcept {
    name: string;
    type: 'Entity' | 'ValueObject' | 'Service' | 'Repository' | 'Event' | 'Command';
    domain: string;
    confidence: number;
    context: string;
    filePath?: string;
    properties?: Array<{
        name: string;
        type: string;
    }>;
    methods?: Array<{
        name: string;
        returnType: string;
    }>;
    dependencies?: string[];
    namespace?: string;
}
export interface BusinessRule {
    id: string;
    description: string;
    domain: string;
    sourceLocation: string;
    conditions: string[];
    actions: string[];
    confidence: number;
}
export interface SemanticAnalysisResult {
    filePath: string;
    language: string;
    businessConcepts: BusinessConcept[];
    businessRules: BusinessRule[];
    domainContext: string;
    analysisTime: number;
}
export interface GranularBoundaryDetectionResult {
    shouldCreateGranularContext: boolean;
    confidence: number;
    granularDomain: string;
    businessConceptDensity: number;
    algorithmicComplexity: number;
    semanticCoherence: number;
    aiAssistanceValue: number;
}
export declare class SemanticAnalysisService {
    private readonly maxAnalysisTime;
    private readonly cacheDir;
    private readonly xmlRuleParser;
    constructor();
    /**
     * Analyze code changes for semantic meaning
     */
    analyzeCodeChanges(filePaths: string[]): Promise<SemanticAnalysisResult[]>;
    /**
     * Analyze a single file for business concepts and rules
     */
    private analyzeFile;
    /**
     * Extract business concepts from C# code with deep analysis
     */
    private extractCSharpBusinessConcepts;
    /**
     * Extract business rules from C# code using enhanced XML documentation parser
     * Step 3.1 & 3.2: Enhanced Business Rule Mining
     * BR-CEE-009: Extract 15+ rules from Fractal Analysis domain
     * BR-CEE-010: Extract 10+ rules from Indicator domain
     * BR-CEE-011: >80% accuracy in classification
     * BR-CEE-012: Focus on semantic value for AI development
     */
    private extractCSharpBusinessRules;
    /**
     * Legacy business rule extraction for compatibility and fallback
     */
    private extractLegacyCSharpBusinessRules;
    /**
     * Extract business concepts from TypeScript/JavaScript code
     */
    private extractTypeScriptBusinessConcepts;
    /**
     * Extract business rules from TypeScript/JavaScript code
     */
    private extractTypeScriptBusinessRules;
    private detectLanguage;
    private extractDomainFromNamespace;
    /**
     * Extract properties from class body content
     */
    private extractProperties;
    /**
     * Extract methods from class body content
     */
    private extractMethods;
    /**
     * Extract dependencies from using statements and constructor parameters
     */
    private extractDependencies;
    /**
     * Determine the purpose of a class/service based on name and content
     */
    private determinePurpose;
    /**
     * Calculate confidence level for business concept identification
     */
    private calculateConceptConfidence;
    /**
     * Generate rich context description for business concept
     */
    private generateContext;
    /**
     * Enhanced domain detection with granular context intelligence
     * Implements multi-criteria boundary detection for 95% repository coverage
     * BR-CEE-002: Domain detection must recognize semantic subdirectories with business content
     */
    private extractDomainFromPath;
    /**
     * Advanced granular context boundary detection using multi-criteria analysis
     * Implements business concept density, algorithmic complexity, and semantic coherence measurement
     */
    private detectGranularContextBoundary;
    /**
     * Analyze business concept density for semantic boundary qualification
     */
    private analyzeBusinessConceptDensity;
    /**
     * Analyze algorithmic complexity for boundary qualification
     */
    private analyzeAlgorithmicComplexity;
    /**
     * Analyze semantic coherence for domain boundary qualification
     */
    private analyzeSemanticCoherence;
    /**
     * Evaluate AI assistance potential for granular context value
     */
    private evaluateAIAssistancePotential;
    /**
     * Calculate granular boundary confidence using weighted scoring
     */
    private calculateGranularBoundaryConfidence;
    /**
     * Determine granular domain path for qualified boundaries
     */
    private determineGranularDomainPath;
    /**
     * Enhanced semantic subdirectory qualification analysis
     */
    private analyzeSemanticSubdirectoryQualification;
    private extractContext;
    private getLineNumber;
    private extractConditions;
    private extractMethodConditions;
    private extractActions;
    private humanizeMethodName;
    private inferTypeFromName;
    private determineDomainContext;
}
//# sourceMappingURL=semantic-analysis.d.ts.map
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
export declare class SemanticAnalysisService {
    private readonly maxAnalysisTime;
    private readonly cacheDir;
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
     * Extract business rules from C# code
     */
    private extractCSharpBusinessRules;
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
    private extractDomainFromPath;
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
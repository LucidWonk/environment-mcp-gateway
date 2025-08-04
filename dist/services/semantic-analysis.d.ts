export interface BusinessConcept {
    name: string;
    type: 'Entity' | 'ValueObject' | 'Service' | 'Repository' | 'Event' | 'Command';
    domain: string;
    confidence: number;
    context: string;
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
     * Extract business concepts from C# code
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
import { SemanticAnalysisResult } from './semantic-analysis.js';
export interface XmlDocumentationRule {
    rule: string;
    description: string;
    source: string;
    type: XmlRuleType;
    confidence: number;
    parameters?: string[];
    constraints?: string[];
    context?: string;
}
export declare enum XmlRuleType {
    ValidationRule = "validation",
    ConstraintRule = "constraint",
    CalculationRule = "calculation",
    ConfigurationRule = "configuration",
    BusinessLogicRule = "business-logic",
    AlgorithmRule = "algorithm",
    PerformanceRule = "performance"
}
export interface XmlDocumentationParsingResult {
    filePath: string;
    extractedRules: XmlDocumentationRule[];
    totalRulesFound: number;
    classificationAccuracy: number;
    parsingDurationMs: number;
}
/**
 * Enhanced XML documentation parser for systematic business rule extraction
 * Implements BR-CEE-009: Extract 15+ business rules from Fractal Analysis domain
 * Implements BR-CEE-010: Extract 10+ business rules from Indicator domain
 * Implements BR-CEE-011: Achieve >80% accuracy in business rule classification
 * Implements BR-CEE-012: Focus on semantic value for AI development assistance
 */
export declare class XmlDocumentationRuleParser {
    private businessRulePatterns;
    private constraintPatterns;
    private validationPatterns;
    private calculationPatterns;
    private algorithmPatterns;
    private performancePatterns;
    constructor();
    /**
     * Initialize pattern recognition for different types of business rules
     * BR-CEE-012: Focus on semantic value for AI development assistance
     */
    private initializePatterns;
    /**
     * Parse XML documentation from C# source files to extract business rules
     * BR-CEE-009, BR-CEE-010: Extract comprehensive business rules from domain files
     */
    parseXmlDocumentation(filePath: string): Promise<XmlDocumentationParsingResult>;
    /**
     * Extract XML documentation comments from C# source code
     */
    private extractXmlComments;
    /**
     * Clean XML comment content by removing extra whitespace and formatting
     */
    private cleanXmlComment;
    /**
     * Parse individual XML comment for business rules using pattern matching
     * BR-CEE-011: Achieve >80% accuracy in business rule classification
     */
    private parseXmlComment;
    /**
     * Apply pattern matching to extract rules of specific type
     */
    private applyPatterns;
    /**
     * Enhanced business rule extraction from C# attributes (Step 3.2 Enhancement)
     * BR-CEE-010: Extract 10+ business rules from Indicator domain covering parameter validation,
     * calculation constraints, and signal generation logic
     * BR-CEE-011: Achieve >80% accuracy in business rule classification and confidence scoring
     */
    private extractAttributeRules;
    /**
     * Enhanced extraction of IndicatorParameter attribute rules with semantic analysis
     * Step 3.2: C# Attribute Metadata Analysis
     */
    private extractIndicatorParameterRules;
    /**
     * Enhanced extraction of IndicatorDefinition attribute rules
     * Step 3.2: C# Attribute Metadata Analysis
     */
    private extractIndicatorDefinitionRules;
    /**
     * Enhanced validation attribute analysis
     * Step 3.2: C# Attribute Metadata Analysis
     */
    private extractValidationAttributeRules;
    /**
     * New: Extract business rules from attribute combinations
     * Step 3.2: Advanced attribute analysis
     */
    private extractAttributeCombinationRules;
    /**
     * New: Extract business rules from property-attribute relationships
     * Step 3.2: Semantic relationship analysis
     */
    private extractPropertyAttributeRules;
    /**
     * Enhanced semantic analysis of parameter attributes
     * Step 3.2: Advanced parameter constraint analysis
     */
    private analyzeParameterSemantics;
    /**
     * Enhanced semantic analysis of indicator definition attributes
     * Step 3.2: Indicator classification and business logic analysis
     */
    private analyzeIndicatorDefinitionSemantics;
    /**
     * Calculate confidence score for attribute-based rules
     * Step 3.2: Enhanced confidence scoring for attribute analysis
     */
    private calculateAttributeConfidence;
    /**
     * Extract constraints from attribute content for enhanced rule context
     * Step 3.2: Detailed constraint analysis
     */
    private extractConstraintsFromAttribute;
    /**
     * Parse IndicatorParameter attribute for business rules
     */
    private parseIndicatorParameterAttribute;
    /**
     * Parse IndicatorDefinition attribute for business rules
     */
    private parseIndicatorDefinitionAttribute;
    /**
     * Extract validation method rules from method implementations
     * BR-CEE-009: Extract validation constraints and algorithmic requirements
     */
    private extractValidationMethodRules;
    /**
     * Infer validation rule from code pattern
     */
    private inferValidationRule;
    /**
     * Validate if extracted text represents a meaningful business rule
     * BR-CEE-012: Focus on semantic value for AI development assistance
     */
    private isValidRule;
    /**
     * Calculate confidence score for extracted rule
     * BR-CEE-011: Achieve >80% accuracy in business rule classification
     */
    private calculateRuleConfidence;
    /**
     * Generate detailed description for business rule
     * BR-CEE-012: Focus on semantic value for AI development assistance
     */
    private generateRuleDescription;
    /**
     * Calculate overall classification accuracy for extracted rules
     * BR-CEE-011: Achieve >80% accuracy in business rule classification
     */
    private calculateClassificationAccuracy;
    /**
     * Integrate XML documentation rules into semantic analysis results
     * BR-CEE-009, BR-CEE-010: Extract comprehensive business rules for AI assistance
     */
    enhanceSemanticAnalysisWithXmlRules(semanticResult: SemanticAnalysisResult, xmlResults: XmlDocumentationParsingResult[]): Promise<SemanticAnalysisResult>;
    /**
     * Map XML rule types to semantic analysis business rule types
     */
    private mapXmlRuleTypeToBusinessRuleType;
    /**
     * Find related business concepts for XML rules
     */
    private findRelatedConcepts;
}
//# sourceMappingURL=xml-documentation-rule-parser.d.ts.map
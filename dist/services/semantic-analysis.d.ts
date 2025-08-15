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
export interface AlgorithmDomainData {
    baseConceptCount: number;
    sophisticationLevel: 'high' | 'medium' | 'low';
    coreConcepts: string[];
    advancedConcepts: string[];
}
export interface AlgorithmComplexityPattern {
    patterns: string[];
    complexityWeight: number;
    indicator: string;
}
export interface AccuracyValidationMetrics {
    overallAccuracy: number;
    granularDetectionRate: number;
    falsePositiveRate: number;
    domainSpecificAccuracy: Map<string, number>;
    expertValidationScore?: number;
    confidenceDistribution: number[];
    totalValidations: number;
    detectionThresholds: {
        high: number;
        medium: number;
        low: number;
    };
}
export interface HumanExpertFeedback {
    fileId: string;
    expectedDomain: string;
    actualDomain: string;
    isCorrect: boolean;
    expertConfidence: number;
    improvementSuggestions: string[];
    timestamp: Date;
    validationType: 'granular' | 'domain-level';
    complexityAssessment: 'high' | 'medium' | 'low';
}
export interface BoundaryDetectionConfig {
    businessConceptWeight: number;
    algorithmComplexityWeight: number;
    semanticCoherenceWeight: number;
    granularThreshold: number;
    domainThreshold: number;
    mathematicalComplexityMultiplier: number;
    tradingAlgorithmBonus: number;
    designPatternWeight: number;
    enableAdaptiveTuning: boolean;
    learningRate: number;
    minimumFeedbackCount: number;
    maxAnalysisTimeMs: number;
    cacheExpirationHours: number;
}
export declare class SemanticAnalysisService {
    private readonly maxAnalysisTime;
    private readonly cacheDir;
    private readonly xmlRuleParser;
    private config;
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
     * Advanced business concept density analysis for semantic boundary qualification
     * Implements TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F002: Enhanced semantic analysis
     */
    private analyzeBusinessConceptDensity;
    /**
     * Get algorithm domain mappings with sophistication levels
     */
    private getAlgorithmDomainMappings;
    /**
     * Analyze trading-specific concepts for additional concept density
     */
    private analyzeTradingSpecificConcepts;
    /**
     * Enhanced algorithmic complexity analysis for boundary qualification
     * Implements TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F002: Advanced complexity detection
     */
    private analyzeAlgorithmicComplexity;
    /**
     * Get sophisticated algorithm patterns with complexity weights
     */
    private getSophisticatedAlgorithmPatterns;
    /**
     * Check if file/directory matches algorithm pattern
     */
    private matchesAlgorithmPattern;
    /**
     * Detect mathematical complexity indicators
     */
    private detectMathematicalComplexity;
    /**
     * Analyze business logic complexity
     */
    private analyzeBusinessLogicComplexity;
    /**
     * Analyze trading algorithm specific complexity
     */
    private analyzeTradingAlgorithmComplexity;
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
    /**
     * Calculate accuracy validation metrics for boundary detection
     * Step 2.2: Accuracy Validation and Human Expert Integration
     */
    calculateAccuracyMetrics(analysisResults: SemanticAnalysisResult[], expertFeedback: HumanExpertFeedback[]): AccuracyValidationMetrics;
    /**
     * Store human expert feedback for continuous learning
     * Step 2.2: Human Expert Integration
     */
    storeExpertFeedback(feedback: HumanExpertFeedback): void;
    /**
     * Load historical expert feedback for analysis
     * Step 2.2: Expert Integration Infrastructure
     */
    loadExpertFeedback(): HumanExpertFeedback[];
    /**
     * Generate accuracy validation report
     * Step 2.2: Reporting and Analysis
     */
    generateAccuracyReport(): string;
    /**
     * Load boundary detection configuration
     * Step 2.3: Configuration and Adaptive Tuning
     */
    private loadConfiguration;
    /**
     * Save boundary detection configuration
     * Step 2.3: Configuration Management
     */
    saveConfiguration(config: BoundaryDetectionConfig): void;
    /**
     * Get current configuration
     * Step 2.3: Configuration Access
     */
    getConfiguration(): BoundaryDetectionConfig;
    /**
     * Update configuration with adaptive tuning based on expert feedback
     * Step 2.3: Adaptive Tuning
     */
    adaptivelyTuneConfiguration(): BoundaryDetectionConfig;
    /**
     * Generate configuration tuning report
     * Step 2.3: Configuration Analysis and Reporting
     */
    generateConfigurationReport(): string;
}
//# sourceMappingURL=semantic-analysis.d.ts.map
import { SemanticAnalysisResult } from './semantic-analysis.js';
import { BoundaryDetectionConfigManager, ConfigValidationResult } from './boundary-detection-config-manager.js';
export interface BoundaryDetectionConfig {
    minBusinessConceptDensity: number;
    minAlgorithmComplexityScore: number;
    minSemanticCoherenceScore: number;
    businessConceptWeight: number;
    algorithmComplexityWeight: number;
    semanticCoherenceWeight: number;
    boundaryDetectionThreshold: number;
    maxDirectoriesToAnalyze: number;
    excludePatterns: string[];
    trivialDirectoryPatterns: string[];
    maxAnalysisTimeMs: number;
}
export interface BoundaryAnalysisResult {
    directoryPath: string;
    shouldCreateContext: boolean;
    confidence: number;
    metrics: {
        businessConceptDensity: number;
        algorithmComplexityScore: number;
        semanticCoherenceScore: number;
        overallScore: number;
    };
    reasoning: string[];
    detectionDurationMs: number;
}
export interface SemanticBoundaryDetectionResult {
    detectedBoundaries: BoundaryAnalysisResult[];
    analysisMetrics: {
        totalDirectoriesAnalyzed: number;
        boundariesDetected: number;
        averageConfidence: number;
        totalAnalysisTimeMs: number;
    };
    config: BoundaryDetectionConfig;
}
/**
 * Intelligent semantic boundary detector for granular context creation
 * Implements BR-CEE-005: Boundary detection algorithm must achieve >85% accuracy
 * Implements BR-CEE-006: Detection must consider business concept density, algorithm complexity, and semantic coherence
 */
export declare class SemanticBoundaryDetector {
    private readonly config;
    private readonly configManager;
    constructor(config?: Partial<BoundaryDetectionConfig>, configManager?: BoundaryDetectionConfigManager);
    /**
     * Detect semantic boundaries in a directory structure based on semantic analysis results
     * BR-CEE-005: Must achieve >85% accuracy when validated against human domain expert judgment
     */
    detectSemanticBoundaries(projectRoot: string, semanticResults: SemanticAnalysisResult[]): Promise<SemanticBoundaryDetectionResult>;
    /**
     * Group semantic analysis results by directory path
     */
    private groupSemanticResultsByDirectory;
    /**
     * Normalize directory path for consistent grouping
     */
    private normalizeDirectoryPath;
    /**
     * Check if directory should be skipped based on exclusion patterns
     * Implements BR-CEE-008: Must avoid creating contexts for trivial directories
     */
    private shouldSkipDirectory;
    /**
     * Analyze boundary potential for a specific directory
     * Implements BR-CEE-006: Detection must consider business concept density, algorithm complexity, and semantic coherence
     */
    private analyzeBoundaryPotential;
    /**
     * Calculate business concept density score
     * BR-CEE-006: Business concept density (3+ distinct business concepts qualify)
     */
    private calculateBusinessConceptDensity;
    /**
     * Calculate algorithm complexity score based on semantic patterns
     * BR-CEE-006: Algorithm complexity (sophisticated algorithmic implementations)
     */
    private calculateAlgorithmComplexityScore;
    /**
     * Calculate semantic coherence score based on domain consistency
     * BR-CEE-006: Semantic coherence as primary criteria
     */
    private calculateSemanticCoherenceScore;
    /**
     * Generate human-readable reasoning for boundary detection decision
     */
    private generateBoundaryReasoning;
    /**
     * Update detection configuration for tuning
     * BR-CEE-007: Algorithm must be configurable for different repository types
     */
    updateConfiguration(newConfig: Partial<BoundaryDetectionConfig>): void;
    /**
     * Get current configuration
     */
    getConfiguration(): BoundaryDetectionConfig;
    /**
     * Auto-configure detector for project repository type
     * BR-CEE-007: Algorithm must be configurable for different repository types
     */
    autoConfigureForProject(projectRoot: string): Promise<string>;
    /**
     * Apply configuration recommendations to improve accuracy
     * BR-CEE-005: Support >85% accuracy requirement
     */
    private applyConfigurationRecommendations;
    /**
     * Update detector configuration with validation
     * BR-CEE-007: Runtime configuration updates for tuning
     */
    updateConfigurationWithValidation(updates: Partial<BoundaryDetectionConfig>): ConfigValidationResult;
    /**
     * Get current configuration with validation status
     * BR-CEE-007: Configuration introspection and validation
     */
    getCurrentConfigurationStatus(): {
        config: BoundaryDetectionConfig;
        validation: ConfigValidationResult;
        repositoryTypes: string[];
    };
    /**
     * Switch to predefined repository configuration
     * BR-CEE-007: Easy switching between repository configurations
     * Supports algorithm-heavy, enterprise, and utility repository types with tuned thresholds
     */
    switchToRepositoryConfiguration(repositoryType: string): boolean;
    /**
     * Create and save custom configuration for repository type
     * BR-CEE-007: Custom configuration creation and persistence
     */
    createCustomRepositoryConfiguration(typeName: string, description: string, baseType: string, overrides: Partial<BoundaryDetectionConfig>): Promise<boolean>;
    /**
     * Validate detection accuracy against ground truth data
     * BR-CEE-005: Must achieve >85% accuracy when validated against human domain expert judgment
     */
    validateDetectionAccuracy(groundTruthBoundaries: {
        directoryPath: string;
        shouldHaveContext: boolean;
    }[], detectionResults: BoundaryAnalysisResult[]): Promise<{
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
    }>;
}
//# sourceMappingURL=semantic-boundary-detector.d.ts.map
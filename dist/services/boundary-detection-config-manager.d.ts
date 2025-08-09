import { BoundaryDetectionConfig } from './semantic-boundary-detector.js';
export interface RepositoryTypeConfig {
    name: string;
    description: string;
    config: BoundaryDetectionConfig;
    detectionPatterns: {
        algorithmHeavy: RegExp[];
        enterprisePatterns: RegExp[];
        utilityPatterns: RegExp[];
    };
}
export interface ConfigValidationResult {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    estimatedAccuracy?: number;
}
/**
 * Configuration management system for semantic boundary detection
 * Implements BR-CEE-005: Configuration must support >85% accuracy requirement
 * Implements BR-CEE-007: Algorithm must be configurable for different repository types
 * Implements BR-CEE-008: Must avoid creating contexts for trivial directories
 */
export declare class BoundaryDetectionConfigManager {
    private readonly configPath;
    private repositoryConfigs;
    private defaultConfig;
    constructor(configPath?: string);
    /**
     * Initialize predefined repository type configurations
     * BR-CEE-007: Support for different repository types and coding organization patterns
     */
    private initializeRepositoryConfigs;
    /**
     * Detect repository type based on project structure and content patterns
     * BR-CEE-007: Automatic configuration selection for different repository types
     */
    detectRepositoryType(projectRoot: string): Promise<string>;
    /**
     * Analyze repository characteristics for type detection
     */
    private analyzeRepositoryCharacteristics;
    /**
     * Get directories recursively up to specified depth
     */
    private getDirectoriesRecursively;
    /**
     * Get configuration for repository type
     * BR-CEE-007: Configurable algorithm for different repository types
     */
    getConfigurationForType(repositoryType: string): BoundaryDetectionConfig;
    /**
     * Update configuration for repository type
     * BR-CEE-007: Runtime configuration updates for tuning
     */
    updateConfiguration(repositoryType: string, updates: Partial<BoundaryDetectionConfig>): void;
    /**
     * Validate boundary detection configuration
     * BR-CEE-005: Ensure configuration supports >85% accuracy requirement
     */
    validateConfiguration(config: BoundaryDetectionConfig): ConfigValidationResult;
    /**
     * Estimate configuration accuracy based on threshold balance
     * BR-CEE-005: Support >85% accuracy requirement validation
     */
    private estimateConfigurationAccuracy;
    /**
     * Save configuration to persistent storage
     */
    saveConfiguration(): Promise<void>;
    /**
     * Load configuration from persistent storage
     */
    loadConfiguration(): Promise<void>;
    /**
     * Get all available repository type configurations
     */
    getAvailableRepositoryTypes(): RepositoryTypeConfig[];
    /**
     * Create custom repository configuration
     * BR-CEE-007: Support for custom repository patterns and configurations
     */
    createCustomRepositoryConfig(typeName: string, description: string, baseType: string, overrides: Partial<BoundaryDetectionConfig>): void;
}
//# sourceMappingURL=boundary-detection-config-manager.d.ts.map
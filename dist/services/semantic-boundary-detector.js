import * as path from 'path';
import winston from 'winston';
import { BoundaryDetectionConfigManager } from './boundary-detection-config-manager.js';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'semantic-boundary-detector.log' })
    ]
});
/**
 * Intelligent semantic boundary detector for granular context creation
 * Implements BR-CEE-005: Boundary detection algorithm must achieve >85% accuracy
 * Implements BR-CEE-006: Detection must consider business concept density, algorithm complexity, and semantic coherence
 */
export class SemanticBoundaryDetector {
    config;
    configManager;
    constructor(config, configManager) {
        this.configManager = configManager || new BoundaryDetectionConfigManager();
        this.config = {
            // BR-CEE-006: Business concept density criteria (3+ distinct business concepts)
            minBusinessConceptDensity: 3.0,
            minAlgorithmComplexityScore: 0.7,
            minSemanticCoherenceScore: 0.6,
            // Weighted scoring system for multi-criteria analysis
            businessConceptWeight: 0.4,
            algorithmComplexityWeight: 0.35,
            semanticCoherenceWeight: 0.25,
            // BR-CEE-005: Detection threshold tuned for >85% accuracy
            boundaryDetectionThreshold: 0.75,
            maxDirectoriesToAnalyze: 50,
            // BR-CEE-008: Avoid trivial directories
            excludePatterns: ['bin', 'obj', 'node_modules', '.git', 'packages', 'logs'],
            trivialDirectoryPatterns: [
                'Properties', 'obj', 'bin', 'packages', 'wwwroot', 'lib',
                'migrations', 'seeds', 'images', 'assets', 'static'
            ],
            // Performance constraints - 10 seconds per BR-CEE requirements
            maxAnalysisTimeMs: 10000,
            ...config
        };
        logger.info(`Semantic Boundary Detector initialized with threshold: ${this.config.boundaryDetectionThreshold}`);
    }
    /**
     * Detect semantic boundaries in a directory structure based on semantic analysis results
     * BR-CEE-005: Must achieve >85% accuracy when validated against human domain expert judgment
     */
    async detectSemanticBoundaries(projectRoot, semanticResults) {
        const startTime = Date.now();
        const detectedBoundaries = [];
        logger.info(`Starting semantic boundary detection for ${semanticResults.length} semantic results`);
        try {
            // Group semantic results by directory path
            const directoryGroups = this.groupSemanticResultsByDirectory(semanticResults);
            // Analyze each directory for boundary potential
            let directoriesAnalyzed = 0;
            for (const [directoryPath, dirResults] of directoryGroups.entries()) {
                if (directoriesAnalyzed >= this.config.maxDirectoriesToAnalyze) {
                    logger.warn(`Reached maximum directory analysis limit: ${this.config.maxDirectoriesToAnalyze}`);
                    break;
                }
                if (Date.now() - startTime > this.config.maxAnalysisTimeMs) {
                    logger.warn(`Analysis timeout reached: ${this.config.maxAnalysisTimeMs}ms`);
                    break;
                }
                // Skip excluded patterns and trivial directories
                if (this.shouldSkipDirectory(directoryPath)) {
                    logger.debug(`Skipping directory: ${directoryPath} (excluded or trivial)`);
                    continue;
                }
                const boundaryAnalysis = await this.analyzeBoundaryPotential(directoryPath, dirResults);
                detectedBoundaries.push(boundaryAnalysis);
                directoriesAnalyzed++;
                logger.debug(`Analyzed boundary potential for ${directoryPath}: score=${boundaryAnalysis.metrics.overallScore}, shouldCreate=${boundaryAnalysis.shouldCreateContext}`);
            }
            // Calculate analysis metrics
            const totalAnalysisTime = Date.now() - startTime;
            const boundariesDetected = detectedBoundaries.filter(b => b.shouldCreateContext).length;
            const averageConfidence = detectedBoundaries.length > 0
                ? detectedBoundaries.reduce((sum, b) => sum + b.confidence, 0) / detectedBoundaries.length
                : 0;
            logger.info(`Semantic boundary detection completed: ${boundariesDetected}/${directoriesAnalyzed} boundaries detected in ${totalAnalysisTime}ms`);
            return {
                detectedBoundaries,
                analysisMetrics: {
                    totalDirectoriesAnalyzed: directoriesAnalyzed,
                    boundariesDetected,
                    averageConfidence,
                    totalAnalysisTimeMs: totalAnalysisTime
                },
                config: this.config
            };
        }
        catch (error) {
            logger.error('Semantic boundary detection failed:', error);
            throw new Error(`Semantic boundary detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Group semantic analysis results by directory path
     */
    groupSemanticResultsByDirectory(semanticResults) {
        const directoryGroups = new Map();
        for (const result of semanticResults) {
            const directoryPath = path.dirname(result.filePath);
            const normalizedPath = this.normalizeDirectoryPath(directoryPath);
            if (!directoryGroups.has(normalizedPath)) {
                directoryGroups.set(normalizedPath, []);
            }
            directoryGroups.get(normalizedPath).push(result);
        }
        return directoryGroups;
    }
    /**
     * Normalize directory path for consistent grouping
     */
    normalizeDirectoryPath(directoryPath) {
        return path.normalize(directoryPath).replace(/\\/g, '/');
    }
    /**
     * Check if directory should be skipped based on exclusion patterns
     * Implements BR-CEE-008: Must avoid creating contexts for trivial directories
     */
    shouldSkipDirectory(directoryPath) {
        const normalizedPath = directoryPath.toLowerCase();
        // Check exclusion patterns
        for (const pattern of this.config.excludePatterns) {
            if (normalizedPath.includes(pattern.toLowerCase())) {
                return true;
            }
        }
        // Check trivial directory patterns
        const dirName = path.basename(directoryPath).toLowerCase();
        for (const pattern of this.config.trivialDirectoryPatterns) {
            if (dirName === pattern.toLowerCase()) {
                return true;
            }
        }
        return false;
    }
    /**
     * Analyze boundary potential for a specific directory
     * Implements BR-CEE-006: Detection must consider business concept density, algorithm complexity, and semantic coherence
     */
    async analyzeBoundaryPotential(directoryPath, semanticResults) {
        const analysisStart = Date.now();
        // Calculate individual metrics
        const businessConceptDensity = this.calculateBusinessConceptDensity(semanticResults);
        const algorithmComplexityScore = this.calculateAlgorithmComplexityScore(semanticResults);
        const semanticCoherenceScore = this.calculateSemanticCoherenceScore(semanticResults);
        // Calculate weighted overall score
        const overallScore = (businessConceptDensity * this.config.businessConceptWeight +
            algorithmComplexityScore * this.config.algorithmComplexityWeight +
            semanticCoherenceScore * this.config.semanticCoherenceWeight);
        // Determine if boundary should be created
        const shouldCreateContext = overallScore >= this.config.boundaryDetectionThreshold &&
            businessConceptDensity >= this.config.minBusinessConceptDensity &&
            algorithmComplexityScore >= this.config.minAlgorithmComplexityScore &&
            semanticCoherenceScore >= this.config.minSemanticCoherenceScore;
        // Generate reasoning
        const reasoning = this.generateBoundaryReasoning(directoryPath, businessConceptDensity, algorithmComplexityScore, semanticCoherenceScore, overallScore, shouldCreateContext);
        // Calculate confidence score (0-1)
        const confidence = Math.min(overallScore, 1.0);
        return {
            directoryPath,
            shouldCreateContext,
            confidence,
            metrics: {
                businessConceptDensity,
                algorithmComplexityScore,
                semanticCoherenceScore,
                overallScore
            },
            reasoning,
            detectionDurationMs: Date.now() - analysisStart
        };
    }
    /**
     * Calculate business concept density score
     * BR-CEE-006: Business concept density (3+ distinct business concepts qualify)
     */
    calculateBusinessConceptDensity(semanticResults) {
        const allConcepts = [];
        // Collect all business concepts
        for (const result of semanticResults) {
            allConcepts.push(...result.businessConcepts);
        }
        if (allConcepts.length === 0) {
            return 0;
        }
        // Count unique business concepts by name and type
        const uniqueConcepts = new Map();
        for (const concept of allConcepts) {
            const key = `${concept.name}:${concept.type}`;
            if (!uniqueConcepts.has(key)) {
                uniqueConcepts.set(key, concept);
            }
        }
        const conceptCount = uniqueConcepts.size;
        const density = Math.min(conceptCount / this.config.minBusinessConceptDensity, 1.0);
        logger.debug(`Business concept density: ${conceptCount} unique concepts, density=${density}`);
        return density;
    }
    /**
     * Calculate algorithm complexity score based on semantic patterns
     * BR-CEE-006: Algorithm complexity (sophisticated algorithmic implementations)
     */
    calculateAlgorithmComplexityScore(semanticResults) {
        let complexityIndicators = 0;
        let totalFiles = semanticResults.length;
        if (totalFiles === 0)
            return 0;
        // Complex algorithm indicators
        const complexityPatterns = [
            // Algorithmic terms
            /calculation|algorithm|analyze|process|compute|evaluate|detect|generate/i,
            // Mathematical operations
            /mathematics|statistic|formula|equation|coefficient|regression/i,
            // Technical indicators patterns
            /moving.?average|rsi|stochastic|macd|fractal|fibonacci|bollinger/i,
            // Data processing patterns
            /transform|filter|aggregate|accumulate|reduce|map|sort|search/i,
            // Pattern recognition
            /pattern|recognition|classification|clustering|neural|learning/i
        ];
        for (const result of semanticResults) {
            // Check business concepts for complexity indicators
            for (const concept of result.businessConcepts) {
                const conceptText = `${concept.name} ${concept.context}`.toLowerCase();
                for (const pattern of complexityPatterns) {
                    if (pattern.test(conceptText)) {
                        complexityIndicators++;
                        break; // Only count once per concept
                    }
                }
            }
            // Check business rules for algorithmic logic
            for (const rule of result.businessRules) {
                const ruleText = rule.description.toLowerCase();
                for (const pattern of complexityPatterns) {
                    if (pattern.test(ruleText)) {
                        complexityIndicators++;
                        break; // Only count once per rule
                    }
                }
            }
        }
        const complexityScore = Math.min(complexityIndicators / (totalFiles * 2), 1.0); // Normalize by expected indicators per file
        logger.debug(`Algorithm complexity score: ${complexityIndicators} indicators in ${totalFiles} files, score=${complexityScore}`);
        return complexityScore;
    }
    /**
     * Calculate semantic coherence score based on domain consistency
     * BR-CEE-006: Semantic coherence as primary criteria
     */
    calculateSemanticCoherenceScore(semanticResults) {
        if (semanticResults.length === 0)
            return 0;
        // Analyze domain consistency
        const domainCounts = new Map();
        let totalFiles = semanticResults.length;
        for (const result of semanticResults) {
            const domain = result.domainContext || 'Unknown';
            domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
        }
        // Calculate coherence based on dominant domain percentage
        const dominantDomain = Array.from(domainCounts.entries())
            .reduce((max, [domain, count]) => count > max[1] ? [domain, count] : max, ['', 0]);
        const domainCoherence = dominantDomain[1] / totalFiles;
        // Analyze business concept coherence
        const conceptTypes = new Map();
        let totalConcepts = 0;
        for (const result of semanticResults) {
            for (const concept of result.businessConcepts) {
                conceptTypes.set(concept.type, (conceptTypes.get(concept.type) || 0) + 1);
                totalConcepts++;
            }
        }
        const conceptCoherence = totalConcepts > 0
            ? Math.max(...Array.from(conceptTypes.values())) / totalConcepts
            : 0;
        // Combined coherence score (weighted average)
        const coherenceScore = (domainCoherence * 0.6) + (conceptCoherence * 0.4);
        logger.debug(`Semantic coherence: domain=${domainCoherence}, concepts=${conceptCoherence}, combined=${coherenceScore}`);
        return coherenceScore;
    }
    /**
     * Generate human-readable reasoning for boundary detection decision
     */
    generateBoundaryReasoning(directoryPath, businessConceptDensity, algorithmComplexityScore, semanticCoherenceScore, overallScore, shouldCreateContext) {
        const reasoning = [];
        const dirName = path.basename(directoryPath);
        reasoning.push(`Analysis of directory: ${dirName}`);
        // Business concept density reasoning
        if (businessConceptDensity >= this.config.minBusinessConceptDensity) {
            reasoning.push(`✅ Business concept density: ${(businessConceptDensity * this.config.minBusinessConceptDensity).toFixed(1)} concepts (threshold: ${this.config.minBusinessConceptDensity})`);
        }
        else {
            reasoning.push(`❌ Business concept density: ${(businessConceptDensity * this.config.minBusinessConceptDensity).toFixed(1)} concepts (below threshold: ${this.config.minBusinessConceptDensity})`);
        }
        // Algorithm complexity reasoning
        if (algorithmComplexityScore >= this.config.minAlgorithmComplexityScore) {
            reasoning.push(`✅ Algorithm complexity: ${(algorithmComplexityScore * 100).toFixed(1)}% (threshold: ${(this.config.minAlgorithmComplexityScore * 100).toFixed(1)}%)`);
        }
        else {
            reasoning.push(`❌ Algorithm complexity: ${(algorithmComplexityScore * 100).toFixed(1)}% (below threshold: ${(this.config.minAlgorithmComplexityScore * 100).toFixed(1)}%)`);
        }
        // Semantic coherence reasoning
        if (semanticCoherenceScore >= this.config.minSemanticCoherenceScore) {
            reasoning.push(`✅ Semantic coherence: ${(semanticCoherenceScore * 100).toFixed(1)}% (threshold: ${(this.config.minSemanticCoherenceScore * 100).toFixed(1)}%)`);
        }
        else {
            reasoning.push(`❌ Semantic coherence: ${(semanticCoherenceScore * 100).toFixed(1)}% (below threshold: ${(this.config.minSemanticCoherenceScore * 100).toFixed(1)}%)`);
        }
        reasoning.push(`Overall weighted score: ${(overallScore * 100).toFixed(1)}% (threshold: ${(this.config.boundaryDetectionThreshold * 100).toFixed(1)}%)`);
        if (shouldCreateContext) {
            reasoning.push('🎯 DECISION: Create .context directory - meets all criteria for semantic boundary');
        }
        else {
            reasoning.push('🚫 DECISION: Skip .context creation - insufficient semantic density or complexity');
        }
        return reasoning;
    }
    /**
     * Update detection configuration for tuning
     * BR-CEE-007: Algorithm must be configurable for different repository types
     */
    updateConfiguration(newConfig) {
        Object.assign(this.config, newConfig);
        logger.info('Semantic boundary detector configuration updated', newConfig);
    }
    /**
     * Get current configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
    /**
     * Auto-configure detector for project repository type
     * BR-CEE-007: Algorithm must be configurable for different repository types
     */
    async autoConfigureForProject(projectRoot) {
        const repositoryType = await this.configManager.detectRepositoryType(projectRoot);
        const detectedConfig = this.configManager.getConfigurationForType(repositoryType);
        // Validate the detected configuration
        const validation = this.configManager.validateConfiguration(detectedConfig);
        if (!validation.isValid) {
            logger.warn(`Auto-detected configuration has issues: ${validation.issues.join(', ')}`);
            logger.info('Using default configuration with recommendations applied');
            // Apply recommendations to default config
            Object.assign(this.config, this.applyConfigurationRecommendations(detectedConfig, validation.recommendations));
        }
        else {
            Object.assign(this.config, detectedConfig);
            logger.info(`Auto-configured for repository type: ${repositoryType} (estimated accuracy: ${((validation.estimatedAccuracy || 0) * 100).toFixed(1)}%)`);
        }
        return repositoryType;
    }
    /**
     * Apply configuration recommendations to improve accuracy
     * BR-CEE-005: Support >85% accuracy requirement
     */
    applyConfigurationRecommendations(config, recommendations) {
        const improvedConfig = { ...config };
        for (const recommendation of recommendations) {
            if (recommendation.includes('accuracy requirement')) {
                // Adjust thresholds to improve accuracy
                improvedConfig.boundaryDetectionThreshold = Math.max(improvedConfig.boundaryDetectionThreshold, 0.75);
                improvedConfig.minBusinessConceptDensity = Math.max(improvedConfig.minBusinessConceptDensity, 2.5);
                improvedConfig.minAlgorithmComplexityScore = Math.max(improvedConfig.minAlgorithmComplexityScore, 0.65);
                improvedConfig.minSemanticCoherenceScore = Math.max(improvedConfig.minSemanticCoherenceScore, 0.55);
            }
        }
        return improvedConfig;
    }
    /**
     * Update detector configuration with validation
     * BR-CEE-007: Runtime configuration updates for tuning
     */
    updateConfigurationWithValidation(updates) {
        const newConfig = { ...this.config, ...updates };
        const validation = this.configManager.validateConfiguration(newConfig);
        if (validation.isValid) {
            Object.assign(this.config, updates);
            logger.info('Configuration updated successfully:', updates);
        }
        else {
            logger.warn(`Configuration update rejected due to validation issues: ${validation.issues.join(', ')}`);
        }
        return validation;
    }
    /**
     * Get current configuration with validation status
     * BR-CEE-007: Configuration introspection and validation
     */
    getCurrentConfigurationStatus() {
        const validation = this.configManager.validateConfiguration(this.config);
        const repositoryTypes = this.configManager.getAvailableRepositoryTypes().map(rt => rt.name);
        return {
            // { config: provides current boundary detection configuration
            config: { ...this.config },
            // validation: provides current validation status  
            validation,
            // repositoryTypes: provides available repository configuration types
            repositoryTypes
        };
    }
    /**
     * Switch to predefined repository configuration
     * BR-CEE-007: Easy switching between repository configurations
     * Supports algorithm-heavy, enterprise, and utility repository types with tuned thresholds
     */
    switchToRepositoryConfiguration(repositoryType) {
        try {
            const newConfig = this.configManager.getConfigurationForType(repositoryType);
            const validation = this.configManager.validateConfiguration(newConfig);
            if (validation.isValid || validation.issues.length === 0) {
                Object.assign(this.config, newConfig);
                logger.info(`Switched to ${repositoryType} configuration (estimated accuracy: ${((validation.estimatedAccuracy || 0) * 100).toFixed(1)}%)`);
                // Log repository type specific tuning characteristics
                if (repositoryType === 'algorithm-heavy') {
                    logger.debug('Algorithm-heavy configuration: lower concept threshold, prioritizes algorithmic complexity');
                }
                else if (repositoryType === 'enterprise') {
                    logger.debug('Enterprise configuration: higher concept threshold, emphasizes business logic');
                }
                else if (repositoryType === 'utility') {
                    logger.debug('Utility configuration: lowest thresholds for infrastructure repositories');
                }
                return true;
            }
            else {
                logger.warn(`Cannot switch to ${repositoryType} configuration: ${validation.issues.join(', ')}`);
                return false;
            }
        }
        catch (error) {
            logger.error(`Failed to switch to ${repositoryType} configuration:`, error);
            return false;
        }
    }
    /**
     * Create and save custom configuration for repository type
     * BR-CEE-007: Custom configuration creation and persistence
     */
    async createCustomRepositoryConfiguration(typeName, description, baseType, overrides) {
        try {
            this.configManager.createCustomRepositoryConfig(typeName, description, baseType, overrides);
            await this.configManager.saveConfiguration();
            logger.info(`Created and saved custom repository configuration: ${typeName}`);
            return true;
        }
        catch (error) {
            logger.error(`Failed to create custom repository configuration '${typeName}':`, error);
            return false;
        }
    }
    /**
     * Validate detection accuracy against ground truth data
     * BR-CEE-005: Must achieve >85% accuracy when validated against human domain expert judgment
     */
    async validateDetectionAccuracy(groundTruthBoundaries, detectionResults) {
        const detectionMap = new Map(detectionResults.map(r => [r.directoryPath, r.shouldCreateContext]));
        let truePositives = 0;
        let falsePositives = 0;
        let falseNegatives = 0;
        let trueNegatives = 0;
        for (const groundTruth of groundTruthBoundaries) {
            const predicted = detectionMap.get(groundTruth.directoryPath) || false;
            const actual = groundTruth.shouldHaveContext;
            if (predicted && actual)
                truePositives++;
            else if (predicted && !actual)
                falsePositives++;
            else if (!predicted && actual)
                falseNegatives++;
            else
                trueNegatives++;
        }
        const accuracy = (truePositives + trueNegatives) / groundTruthBoundaries.length;
        const precision = truePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
        const recall = truePositives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
        const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
        logger.info(`Detection accuracy validation: accuracy=${(accuracy * 100).toFixed(1)}%, precision=${(precision * 100).toFixed(1)}%, recall=${(recall * 100).toFixed(1)}%, f1=${(f1Score * 100).toFixed(1)}%`);
        return { accuracy, precision, recall, f1Score };
    }
}
//# sourceMappingURL=semantic-boundary-detector.js.map
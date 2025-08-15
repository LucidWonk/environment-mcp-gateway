import { SemanticAnalysisResult } from './semantic-analysis.js';
export interface ContextTemplate {
    templateId: string;
    name: string;
    domainPattern: string;
    complexityLevel: 'high' | 'medium' | 'low';
    sections: ContextSection[];
    metadata: TemplateMetadata;
}
export interface ContextSection {
    sectionId: string;
    title: string;
    priority: number;
    contentGenerators: ContentGenerator[];
    required: boolean;
    aiOptimizationHints: string[];
}
export interface ContentGenerator {
    generatorId: string;
    type: 'business-concepts' | 'business-rules' | 'implementation-details' | 'integration-points' | 'recent-changes' | 'hierarchical-context';
    template: string;
    filters: ContentFilter[];
    enhancementRules: EnhancementRule[];
}
export interface ContentFilter {
    filterId: string;
    condition: string;
    operation: 'include' | 'exclude' | 'transform';
    parameters: Record<string, any>;
}
export interface EnhancementRule {
    ruleId: string;
    trigger: string;
    enhancement: string;
    priority: number;
}
export interface TemplateMetadata {
    version: string;
    aiOptimizationLevel: 'basic' | 'enhanced' | 'advanced';
    estimatedTokens: number;
    lastUpdated: Date;
    performanceMetrics: {
        generationTimeMs: number;
        compressionRatio: number;
        aiComprehensionScore: number;
    };
}
export interface GeneratedContextContent {
    contextId: string;
    domainPath: string;
    templateUsed: string;
    content: string;
    metadata: {
        generationTime: number;
        tokenCount: number;
        sections: string[];
        hierarchicalReferences: string[];
        optimizationLevel: string;
    };
    aiOptimizations: {
        structuralEnhancements: string[];
        semanticMarkers: string[];
        crossReferences: string[];
    };
}
/**
 * Advanced template-based context content generator
 * Step 3.1: Template-Based Context Content Generation
 */
export declare class ContextTemplateGenerator {
    private readonly templates;
    private readonly cacheDir;
    constructor(cacheDir?: string);
    /**
     * Generate context content using intelligent template selection
     * Step 3.1: Core Content Generation
     */
    generateContextContent(domainPath: string, semanticResults: SemanticAnalysisResult[], complexityLevel: 'high' | 'medium' | 'low'): Promise<GeneratedContextContent>;
    /**
     * Select the optimal template based on domain characteristics
     * Step 3.1: Intelligent Template Selection
     */
    private selectOptimalTemplate;
    /**
     * Generate content for a specific section
     * Step 3.1: Section-Specific Content Generation
     */
    private generateSection;
    /**
     * Generate content using specific content generators
     * Step 3.1: Content Generator Implementation
     */
    private generateSectionContent;
    /**
     * Generate business concepts section with AI optimization
     * Step 3.1: Business Concepts Content Generation
     */
    private generateBusinessConceptsContent;
    /**
     * Generate business rules section with sophisticated organization
     * Step 3.1: Business Rules Content Generation
     */
    private generateBusinessRulesContent;
    /**
     * Generate implementation details with complexity-aware content
     * Step 3.1: Implementation Details Generation
     */
    private generateImplementationDetailsContent;
    /**
     * Generate integration points with cross-domain analysis
     * Step 3.1: Integration Points Generation
     */
    private generateIntegrationPointsContent;
    /**
     * Generate recent changes analysis
     * Step 3.1: Recent Changes Content Generation
     */
    private generateRecentChangesContent;
    /**
     * Generate hierarchical context references
     * Step 3.1: Hierarchical Context Generation
     */
    private generateHierarchicalContextContent;
    /**
     * Apply AI optimizations to content
     * Step 3.1: AI Optimization Layer
     */
    private applyAIOptimizations;
    /**
     * Apply content filters to semantic results
     * Step 3.1: Content Filtering
     */
    private applyContentFilters;
    /**
     * Evaluate filter conditions
     * Step 3.1: Filter Condition Evaluation
     */
    private evaluateFilterCondition;
    /**
     * Calculate implementation impact level
     * Step 3.1: Impact Assessment
     */
    private calculateImplementationImpact;
    /**
     * Assemble final content from sections
     * Step 3.1: Content Assembly
     */
    private assembleContent;
    /**
     * Estimate token count for content
     * Step 3.1: Token Estimation
     */
    private estimateTokenCount;
    /**
     * Cache generated content for performance
     * Step 3.1: Content Caching
     */
    private cacheGeneratedContent;
    /**
     * Initialize default templates for different domains and complexity levels
     * Step 3.1: Template Initialization
     */
    private initializeDefaultTemplates;
    /**
     * Get fallback template for unknown patterns
     * Step 3.1: Fallback Template Handling
     */
    private getFallbackTemplate;
}
//# sourceMappingURL=context-template-generator.d.ts.map
import { SemanticAnalysisResult } from './semantic-analysis.js';
import { GeneratedContextContent } from './context-template-generator.js';
export interface HierarchicalRelationship {
    relationshipId: string;
    parentContextId: string;
    childContextId: string;
    relationshipType: 'parent-child' | 'sibling' | 'cross-domain';
    strength: number;
    contentSpecialization: ContentSpecialization;
    crossReferences: CrossReference[];
    metadata: RelationshipMetadata;
}
export interface ContentSpecialization {
    parentFocus: string[];
    childFocus: string[];
    sharedConcepts: string[];
    uniqueToParent: string[];
    uniqueToChild: string[];
    contentDistribution: {
        parentSections: string[];
        childSections: string[];
        sharedSections: string[];
    };
}
export interface CrossReference {
    referenceId: string;
    sourceContextId: string;
    targetContextId: string;
    referenceType: 'concept' | 'rule' | 'implementation' | 'navigation';
    sourceSection: string;
    targetSection: string;
    description: string;
    bidirectional: boolean;
}
export interface RelationshipMetadata {
    createdAt: Date;
    lastUpdated: Date;
    semanticStrength: number;
    conceptualOverlap: number;
    implementationCoupling: number;
    navigationValue: number;
    aiOptimizationScore: number;
}
export interface HierarchyMap {
    contextHierarchy: Map<string, HierarchyNode>;
    relationshipGraph: Map<string, HierarchicalRelationship[]>;
    crossDomainConnections: Map<string, string[]>;
    navigationPaths: Map<string, NavigationPath[]>;
}
export interface HierarchyNode {
    contextId: string;
    domainPath: string;
    level: number;
    parent?: string;
    children: string[];
    siblings: string[];
    crossDomainLinks: string[];
    contentSummary: ContextContentSummary;
}
export interface ContextContentSummary {
    primaryConcepts: string[];
    keyRules: string[];
    implementationAreas: string[];
    integrationPoints: string[];
    complexityLevel: 'high' | 'medium' | 'low';
    tokenCount: number;
}
export interface NavigationPath {
    pathId: string;
    fromContextId: string;
    toContextId: string;
    pathType: 'up' | 'down' | 'sibling' | 'cross-domain';
    navigationHint: string;
    relevanceScore: number;
}
/**
 * Advanced hierarchical relationship manager for context coordination
 * Step 3.2: Hierarchical Relationship Management
 */
export declare class HierarchicalRelationshipManager {
    private hierarchyMap;
    private readonly cacheDir;
    constructor(cacheDir?: string);
    /**
     * Build comprehensive hierarchy map from generated contexts
     * Step 3.2: Hierarchy Map Construction
     */
    buildHierarchyMap(generatedContexts: GeneratedContextContent[], semanticResults: SemanticAnalysisResult[]): HierarchyMap;
    /**
     * Generate parent-child content specialization
     * Step 3.2: Content Specialization Analysis
     */
    generateContentSpecialization(parentContext: GeneratedContextContent, childContext: GeneratedContextContent, semanticResults: SemanticAnalysisResult[]): ContentSpecialization;
    /**
     * Create sophisticated cross-references between contexts
     * Step 3.2: Cross-Reference Generation
     */
    createCrossReferences(sourceContext: GeneratedContextContent, targetContext: GeneratedContextContent, relationshipType: 'parent-child' | 'sibling' | 'cross-domain', semanticResults: SemanticAnalysisResult[]): CrossReference[];
    /**
     * Validate hierarchy consistency and detect issues
     * Step 3.2: Hierarchy Consistency Validation
     */
    validateHierarchyConsistency(): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Generate hierarchy visualization for debugging
     * Step 3.2: Hierarchy Visualization
     */
    generateHierarchyVisualization(): string;
    private resetHierarchyMap;
    private createHierarchyNodes;
    private calculateHierarchyLevel;
    private createContentSummary;
    private determineComplexityFromContent;
    private establishParentChildRelationships;
    private identifySiblingRelationships;
    private detectCrossDomainConnections;
    private generateHierarchicalRelationships;
    private createHierarchicalRelationship;
    private calculateRelationshipStrength;
    private createNavigationPaths;
    private optimizeForAIComprehension;
    private buildHierarchyTree;
    private detectCircularReferences;
    private detectMissingCrossReferences;
    private detectInconsistentSpecialization;
    private extractConceptsFromSemantics;
    private conceptsSimilar;
    private determineContentDistribution;
    private createNavigationReference;
    private createConceptReferences;
    private createImplementationReferences;
    private createRuleReferences;
}
//# sourceMappingURL=hierarchical-relationship-manager.d.ts.map
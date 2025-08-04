import { BusinessConcept, BusinessRule } from './semantic-analysis.js';
export interface ConceptCluster {
    domain: string;
    concepts: BusinessConcept[];
    rules: BusinessRule[];
    relationships: ConceptRelationship[];
    confidence: number;
}
export interface ConceptRelationship {
    from: string;
    to: string;
    type: 'uses' | 'contains' | 'references' | 'implements' | 'extends';
    confidence: number;
}
export interface ConceptExtractionResult {
    clusters: ConceptCluster[];
    summary: string;
    domainBoundaries: string[];
    crossDomainRelationships: ConceptRelationship[];
}
export declare class BusinessConceptExtractor {
    /**
     * Extract and cluster business concepts from semantic analysis results
     */
    extractBusinessConcepts(concepts: BusinessConcept[], rules: BusinessRule[]): ConceptExtractionResult;
    /**
     * Group concepts and rules by domain
     */
    private groupByDomain;
    /**
     * Build concept clusters from domain groups
     */
    private buildClusters;
    /**
     * Identify relationships between concepts within a domain
     */
    private identifyRelationships;
    /**
     * Detect relationship between two concepts
     */
    private detectRelationship;
    /**
     * Check if two concept names are related
     */
    private areNamesRelated;
    /**
     * Identify cross-domain relationships
     */
    private identifyCrossDomainRelationships;
    /**
     * Check if a service might handle an event based on naming
     */
    private mightHandleEvent;
    /**
     * Generate a summary of the extracted concepts
     */
    private generateSummary;
}
//# sourceMappingURL=business-concept-extractor.d.ts.map
import { BusinessConcept, BusinessRule } from './semantic-analysis.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('mcp-gateway.log');

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

export class BusinessConceptExtractor {
    
    /**
     * Extract and cluster business concepts from semantic analysis results
     */
    public extractBusinessConcepts(
        concepts: BusinessConcept[],
        rules: BusinessRule[]
    ): ConceptExtractionResult {
        logger.info(`Extracting business concepts from ${concepts.length} concepts and ${rules.length} rules`);
        
        // Group concepts by domain
        const domainGroups = this.groupByDomain(concepts, rules);
        
        // Build concept clusters
        const clusters = this.buildClusters(domainGroups);
        
        // Identify cross-domain relationships
        const crossDomainRelationships = this.identifyCrossDomainRelationships(clusters);
        
        // Generate summary
        const summary = this.generateSummary(clusters, crossDomainRelationships);
        
        // Extract domain boundaries
        const domainBoundaries = [...new Set(clusters.map(c => c.domain))];
        
        return {
            clusters,
            summary,
            domainBoundaries,
            crossDomainRelationships
        };
    }

    /**
     * Group concepts and rules by domain
     */
    private groupByDomain(
        concepts: BusinessConcept[],
        rules: BusinessRule[]
    ): Map<string, { concepts: BusinessConcept[], rules: BusinessRule[] }> {
        const groups = new Map<string, { concepts: BusinessConcept[], rules: BusinessRule[] }>();
        
        // Group concepts
        for (const concept of concepts) {
            const domain = concept.domain || 'Unknown';
            if (!groups.has(domain)) {
                groups.set(domain, { concepts: [], rules: [] });
            }
            groups.get(domain)!.concepts.push(concept);
        }
        
        // Group rules
        for (const rule of rules) {
            const domain = rule.domain || 'Unknown';
            if (!groups.has(domain)) {
                groups.set(domain, { concepts: [], rules: [] });
            }
            groups.get(domain)!.rules.push(rule);
        }
        
        return groups;
    }

    /**
     * Build concept clusters from domain groups
     */
    private buildClusters(
        domainGroups: Map<string, { concepts: BusinessConcept[], rules: BusinessRule[] }>
    ): ConceptCluster[] {
        const clusters: ConceptCluster[] = [];
        
        for (const [domain, group] of domainGroups) {
            const relationships = this.identifyRelationships(group.concepts);
            
            // Calculate cluster confidence
            const avgConceptConfidence = group.concepts.length > 0
                ? group.concepts.reduce((sum, c) => sum + c.confidence, 0) / group.concepts.length
                : 0;
            const avgRuleConfidence = group.rules.length > 0
                ? group.rules.reduce((sum, r) => sum + r.confidence, 0) / group.rules.length
                : 0;
            const confidence = (avgConceptConfidence + avgRuleConfidence) / 2 || avgConceptConfidence || 0;
            
            clusters.push({
                domain,
                concepts: group.concepts,
                rules: group.rules,
                relationships,
                confidence
            });
        }
        
        return clusters;
    }

    /**
     * Identify relationships between concepts within a domain
     */
    private identifyRelationships(concepts: BusinessConcept[]): ConceptRelationship[] {
        const relationships: ConceptRelationship[] = [];
        
        for (let i = 0; i < concepts.length; i++) {
            for (let j = i + 1; j < concepts.length; j++) {
                const relation = this.detectRelationship(concepts[i], concepts[j]);
                if (relation) {
                    relationships.push(relation);
                }
            }
        }
        
        return relationships;
    }

    /**
     * Detect relationship between two concepts
     */
    private detectRelationship(
        concept1: BusinessConcept,
        concept2: BusinessConcept
    ): ConceptRelationship | null {
        // Check for service-repository relationship
        if (concept1.type === 'Service' && concept2.type === 'Repository') {
            return {
                from: concept1.name,
                to: concept2.name,
                type: 'uses',
                confidence: 0.8
            };
        }
        
        // Check for entity-value object relationship
        if (concept1.type === 'Entity' && concept2.type === 'ValueObject') {
            return {
                from: concept1.name,
                to: concept2.name,
                type: 'contains',
                confidence: 0.7
            };
        }
        
        // Check for command-event relationship
        if (concept1.type === 'Command' && concept2.type === 'Event') {
            // Commands often trigger events
            return {
                from: concept1.name,
                to: concept2.name,
                type: 'references',
                confidence: 0.75
            };
        }
        
        // Check for repository-entity relationship
        if (concept1.type === 'Repository' && concept2.type === 'Entity') {
            return {
                from: concept1.name,
                to: concept2.name,
                type: 'references',
                confidence: 0.85
            };
        }
        
        // Check name-based relationships
        if (this.areNamesRelated(concept1.name, concept2.name)) {
            return {
                from: concept1.name,
                to: concept2.name,
                type: 'references',
                confidence: 0.6
            };
        }
        
        return null;
    }

    /**
     * Check if two concept names are related
     */
    private areNamesRelated(name1: string, name2: string): boolean {
        // Remove common suffixes
        const base1 = name1.replace(/(Service|Repository|Entity|Event|Command|VO|ValueObject)$/, '');
        const base2 = name2.replace(/(Service|Repository|Entity|Event|Command|VO|ValueObject)$/, '');
        
        // Check if bases are similar
        return base1 === base2 || 
               base1.includes(base2) || 
               base2.includes(base1);
    }

    /**
     * Identify cross-domain relationships
     */
    private identifyCrossDomainRelationships(clusters: ConceptCluster[]): ConceptRelationship[] {
        const relationships: ConceptRelationship[] = [];
        
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                if (clusters[i].domain !== clusters[j].domain) {
                    // Look for events that might cross domains
                    const events1 = clusters[i].concepts.filter(c => c.type === 'Event');
                    const events2 = clusters[j].concepts.filter(c => c.type === 'Event');
                    
                    // Check if domain 2 might be listening to domain 1's events
                    for (const event of events1) {
                        for (const concept of clusters[j].concepts) {
                            if (concept.type === 'Service' && this.mightHandleEvent(concept.name, event.name)) {
                                relationships.push({
                                    from: `${clusters[i].domain}.${event.name}`,
                                    to: `${clusters[j].domain}.${concept.name}`,
                                    type: 'references',
                                    confidence: 0.65
                                });
                            }
                        }
                    }
                    
                    // Check the reverse
                    for (const event of events2) {
                        for (const concept of clusters[i].concepts) {
                            if (concept.type === 'Service' && this.mightHandleEvent(concept.name, event.name)) {
                                relationships.push({
                                    from: `${clusters[j].domain}.${event.name}`,
                                    to: `${clusters[i].domain}.${concept.name}`,
                                    type: 'references',
                                    confidence: 0.65
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return relationships;
    }

    /**
     * Check if a service might handle an event based on naming
     */
    private mightHandleEvent(serviceName: string, eventName: string): boolean {
        const eventBase = eventName.replace(/Event$/, '');
        return serviceName.toLowerCase().includes(eventBase.toLowerCase());
    }

    /**
     * Generate a summary of the extracted concepts
     */
    private generateSummary(
        clusters: ConceptCluster[],
        crossDomainRelationships: ConceptRelationship[]
    ): string {
        const totalConcepts = clusters.reduce((sum, c) => sum + c.concepts.length, 0);
        const totalRules = clusters.reduce((sum, c) => sum + c.rules.length, 0);
        const domains = clusters.map(c => c.domain).join(', ');
        
        let summary = `Extracted ${totalConcepts} business concepts and ${totalRules} business rules across ${clusters.length} domains: ${domains}.`;
        
        if (crossDomainRelationships.length > 0) {
            summary += ` Identified ${crossDomainRelationships.length} cross-domain relationships.`;
        }
        
        // Add high-confidence insights
        const highConfidenceClusters = clusters.filter(c => c.confidence > 0.8);
        if (highConfidenceClusters.length > 0) {
            const domains = highConfidenceClusters.map(c => c.domain).join(', ');
            summary += ` High confidence in domain identification for: ${domains}.`;
        }
        
        return summary;
    }
}
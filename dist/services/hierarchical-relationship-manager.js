import winston from 'winston';
import { Environment } from '../domain/config/environment.js';
import * as fs from 'fs';
const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'hierarchical-relationship-manager.log' })
    ]
});
/**
 * Advanced hierarchical relationship manager for context coordination
 * Step 3.2: Hierarchical Relationship Management
 */
export class HierarchicalRelationshipManager {
    hierarchyMap;
    cacheDir;
    constructor(cacheDir = '.hierarchy-cache') {
        this.cacheDir = cacheDir;
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        // Initialize hierarchy map
        this.hierarchyMap = {
            contextHierarchy: new Map(),
            relationshipGraph: new Map(),
            crossDomainConnections: new Map(),
            navigationPaths: new Map()
        };
        logger.info('HierarchicalRelationshipManager initialized');
    }
    /**
     * Build comprehensive hierarchy map from generated contexts
     * Step 3.2: Hierarchy Map Construction
     */
    buildHierarchyMap(generatedContexts, semanticResults) {
        logger.info(`Building hierarchy map from ${generatedContexts.length} contexts`);
        // Clear existing hierarchy
        this.resetHierarchyMap();
        // Step 1: Create hierarchy nodes
        const nodes = this.createHierarchyNodes(generatedContexts, semanticResults);
        // Step 2: Establish parent-child relationships
        this.establishParentChildRelationships(nodes);
        // Step 3: Identify sibling relationships
        this.identifySiblingRelationships(nodes);
        // Step 4: Detect cross-domain connections
        this.detectCrossDomainConnections(nodes, semanticResults);
        // Step 5: Generate hierarchical relationships
        this.generateHierarchicalRelationships(nodes, semanticResults);
        // Step 6: Create navigation paths
        this.createNavigationPaths(nodes);
        // Step 7: Optimize for AI comprehension
        this.optimizeForAIComprehension();
        logger.info(`Hierarchy map built: ${this.hierarchyMap.contextHierarchy.size} nodes, ${this.hierarchyMap.relationshipGraph.size} relationship groups`);
        return this.hierarchyMap;
    }
    /**
     * Generate parent-child content specialization
     * Step 3.2: Content Specialization Analysis
     */
    generateContentSpecialization(parentContext, childContext, semanticResults) {
        // Extract concepts and rules from both contexts
        const parentSemantics = semanticResults.filter(r => r.domainContext.startsWith(parentContext.domainPath));
        const childSemantics = semanticResults.filter(r => r.domainContext === childContext.domainPath);
        // Analyze concept overlap and specialization
        const parentConcepts = this.extractConceptsFromSemantics(parentSemantics);
        const childConcepts = this.extractConceptsFromSemantics(childSemantics);
        const sharedConcepts = parentConcepts.filter(pc => childConcepts.some(cc => this.conceptsSimilar(pc, cc)));
        const uniqueToParent = parentConcepts.filter(pc => !sharedConcepts.includes(pc) && !childConcepts.some(cc => this.conceptsSimilar(pc, cc)));
        const uniqueToChild = childConcepts.filter(cc => !sharedConcepts.some(sc => this.conceptsSimilar(sc, cc)));
        // Determine content distribution strategy
        const contentDistribution = this.determineContentDistribution(parentContext, childContext, sharedConcepts.length);
        return {
            parentFocus: ['architectural-overview', 'cross-subdomain-integration', 'domain-patterns'],
            childFocus: ['algorithm-specifics', 'implementation-details', 'specialized-rules'],
            sharedConcepts,
            uniqueToParent,
            uniqueToChild,
            contentDistribution
        };
    }
    /**
     * Create sophisticated cross-references between contexts
     * Step 3.2: Cross-Reference Generation
     */
    createCrossReferences(sourceContext, targetContext, relationshipType, semanticResults) {
        const crossReferences = [];
        // Navigation references
        if (relationshipType === 'parent-child') {
            crossReferences.push(this.createNavigationReference(sourceContext, targetContext, 'For architectural overview and integration patterns', 'navigation'));
            crossReferences.push(this.createNavigationReference(targetContext, sourceContext, 'For algorithm-specific implementation details', 'navigation'));
        }
        // Concept references
        const conceptReferences = this.createConceptReferences(sourceContext, targetContext, semanticResults);
        crossReferences.push(...conceptReferences);
        // Implementation references
        const implementationReferences = this.createImplementationReferences(sourceContext, targetContext, semanticResults);
        crossReferences.push(...implementationReferences);
        // Rule references for related business logic
        const ruleReferences = this.createRuleReferences(sourceContext, targetContext, semanticResults);
        crossReferences.push(...ruleReferences);
        logger.debug(`Created ${crossReferences.length} cross-references between ${sourceContext.domainPath} and ${targetContext.domainPath}`);
        return crossReferences;
    }
    /**
     * Validate hierarchy consistency and detect issues
     * Step 3.2: Hierarchy Consistency Validation
     */
    validateHierarchyConsistency() {
        const issues = [];
        // Check for orphaned nodes
        const orphanedNodes = Array.from(this.hierarchyMap.contextHierarchy.values())
            .filter(node => node.level > 0 && !node.parent);
        if (orphanedNodes.length > 0) {
            issues.push(`Found ${orphanedNodes.length} orphaned nodes without parent references`);
        }
        // Check for circular references
        const circularRefs = this.detectCircularReferences();
        if (circularRefs.length > 0) {
            issues.push(`Detected ${circularRefs.length} circular references in hierarchy`);
        }
        // Check for missing cross-references
        const missingRefs = this.detectMissingCrossReferences();
        if (missingRefs.length > 0) {
            issues.push(`Found ${missingRefs.length} contexts missing expected cross-references`);
        }
        // Check for inconsistent content specialization
        const inconsistentSpecialization = this.detectInconsistentSpecialization();
        if (inconsistentSpecialization.length > 0) {
            issues.push(`Found ${inconsistentSpecialization.length} parent-child pairs with inconsistent content specialization`);
        }
        const valid = issues.length === 0;
        if (valid) {
            logger.info('Hierarchy consistency validation passed');
        }
        else {
            logger.warn(`Hierarchy consistency validation failed with ${issues.length} issues:`, issues);
        }
        return { valid, issues };
    }
    /**
     * Generate hierarchy visualization for debugging
     * Step 3.2: Hierarchy Visualization
     */
    generateHierarchyVisualization() {
        const visualization = [];
        visualization.push('# Context Hierarchy Visualization\n');
        // Get root nodes (level 0)
        const rootNodes = Array.from(this.hierarchyMap.contextHierarchy.values())
            .filter(node => node.level === 0)
            .sort((a, b) => a.domainPath.localeCompare(b.domainPath));
        // Recursively build hierarchy tree
        rootNodes.forEach(rootNode => {
            this.buildHierarchyTree(rootNode, visualization, 0);
        });
        // Add relationship statistics
        visualization.push('\n## Relationship Statistics\n');
        visualization.push(`- Total Contexts: ${this.hierarchyMap.contextHierarchy.size}`);
        visualization.push(`- Relationship Groups: ${this.hierarchyMap.relationshipGraph.size}`);
        visualization.push(`- Cross-Domain Connections: ${this.hierarchyMap.crossDomainConnections.size}`);
        visualization.push(`- Navigation Paths: ${Array.from(this.hierarchyMap.navigationPaths.values()).flat().length}`);
        // Add cross-domain connections
        if (this.hierarchyMap.crossDomainConnections.size > 0) {
            visualization.push('\n## Cross-Domain Connections\n');
            this.hierarchyMap.crossDomainConnections.forEach((connections, domain) => {
                visualization.push(`- **${domain}**: ${connections.join(', ')}`);
            });
        }
        return visualization.join('\n');
    }
    // Private helper methods
    resetHierarchyMap() {
        this.hierarchyMap = {
            contextHierarchy: new Map(),
            relationshipGraph: new Map(),
            crossDomainConnections: new Map(),
            navigationPaths: new Map()
        };
    }
    createHierarchyNodes(generatedContexts, semanticResults) {
        return generatedContexts.map(context => {
            const level = this.calculateHierarchyLevel(context.domainPath);
            const contentSummary = this.createContentSummary(context, semanticResults);
            const node = {
                contextId: context.contextId,
                domainPath: context.domainPath,
                level,
                children: [],
                siblings: [],
                crossDomainLinks: [],
                contentSummary
            };
            this.hierarchyMap.contextHierarchy.set(context.contextId, node);
            return node;
        });
    }
    calculateHierarchyLevel(domainPath) {
        return domainPath.split('.').length - 1;
    }
    createContentSummary(context, semanticResults) {
        const contextSemantics = semanticResults.filter(r => r.domainContext === context.domainPath ||
            r.domainContext.startsWith(context.domainPath + '.'));
        const primaryConcepts = contextSemantics
            .flatMap(r => r.businessConcepts)
            .slice(0, 5)
            .map(c => c.name);
        const keyRules = contextSemantics
            .flatMap(r => r.businessRules)
            .slice(0, 3)
            .map(r => r.description.substring(0, 50) + '...');
        return {
            primaryConcepts,
            keyRules,
            implementationAreas: ['algorithm', 'data-processing', 'validation'],
            integrationPoints: contextSemantics.map(r => r.domainContext).filter(d => d !== context.domainPath),
            complexityLevel: this.determineComplexityFromContent(context, contextSemantics),
            tokenCount: context.metadata.tokenCount
        };
    }
    determineComplexityFromContent(context, semantics) {
        const conceptCount = semantics.reduce((sum, r) => sum + r.businessConcepts.length, 0);
        const ruleCount = semantics.reduce((sum, r) => sum + r.businessRules.length, 0);
        if (conceptCount >= 5 || ruleCount >= 10 || context.metadata.tokenCount > 1000) {
            return 'high';
        }
        else if (conceptCount >= 2 || ruleCount >= 4 || context.metadata.tokenCount > 500) {
            return 'medium';
        }
        else {
            return 'low';
        }
    }
    establishParentChildRelationships(nodes) {
        nodes.forEach(node => {
            // Find parent (domain path with one less segment)
            const parentPath = node.domainPath.split('.').slice(0, -1).join('.');
            if (parentPath) {
                const parent = nodes.find(n => n.domainPath === parentPath);
                if (parent) {
                    node.parent = parent.contextId;
                    parent.children.push(node.contextId);
                }
            }
        });
    }
    identifySiblingRelationships(nodes) {
        // Group nodes by parent
        const nodesByParent = new Map();
        nodes.forEach(node => {
            const parentKey = node.parent || 'root';
            if (!nodesByParent.has(parentKey)) {
                nodesByParent.set(parentKey, []);
            }
            nodesByParent.get(parentKey).push(node);
        });
        // Set siblings for each group
        nodesByParent.forEach(siblings => {
            siblings.forEach(node => {
                node.siblings = siblings
                    .filter(s => s.contextId !== node.contextId)
                    .map(s => s.contextId);
            });
        });
    }
    detectCrossDomainConnections(nodes, semanticResults) {
        nodes.forEach(node => {
            const nodeDomain = node.domainPath.split('.')[0];
            // Find semantic dependencies to other domains
            const nodeSemantics = semanticResults.filter(r => r.domainContext === node.domainPath ||
                r.domainContext.startsWith(node.domainPath + '.'));
            const crossDomainDeps = new Set();
            nodeSemantics.forEach(semantic => {
                semantic.businessConcepts.forEach(concept => {
                    if (concept.dependencies) {
                        concept.dependencies.forEach(dep => {
                            const depDomain = dep.split('.')[0];
                            if (depDomain !== nodeDomain) {
                                crossDomainDeps.add(depDomain);
                            }
                        });
                    }
                });
            });
            node.crossDomainLinks = Array.from(crossDomainDeps);
            // Update cross-domain connections map
            if (crossDomainDeps.size > 0) {
                this.hierarchyMap.crossDomainConnections.set(node.domainPath, Array.from(crossDomainDeps));
            }
        });
    }
    generateHierarchicalRelationships(nodes, semanticResults) {
        nodes.forEach(node => {
            const relationships = [];
            // Parent-child relationships
            if (node.parent) {
                const parentNode = this.hierarchyMap.contextHierarchy.get(node.parent);
                if (parentNode) {
                    const relationship = this.createHierarchicalRelationship(node, parentNode, 'parent-child', semanticResults);
                    relationships.push(relationship);
                }
            }
            // Sibling relationships
            node.siblings.forEach(siblingId => {
                const siblingNode = this.hierarchyMap.contextHierarchy.get(siblingId);
                if (siblingNode) {
                    const relationship = this.createHierarchicalRelationship(node, siblingNode, 'sibling', semanticResults);
                    relationships.push(relationship);
                }
            });
            this.hierarchyMap.relationshipGraph.set(node.contextId, relationships);
        });
    }
    createHierarchicalRelationship(sourceNode, targetNode, type, semanticResults) {
        const relationshipId = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Calculate relationship strength based on semantic overlap
        const strength = this.calculateRelationshipStrength(sourceNode, targetNode, semanticResults);
        // Create mock content specialization (would be enhanced with actual context content)
        const contentSpecialization = {
            parentFocus: ['architectural-overview'],
            childFocus: ['implementation-details'],
            sharedConcepts: sourceNode.contentSummary.primaryConcepts.filter(c => targetNode.contentSummary.primaryConcepts.includes(c)),
            uniqueToParent: sourceNode.contentSummary.primaryConcepts,
            uniqueToChild: targetNode.contentSummary.primaryConcepts,
            contentDistribution: {
                parentSections: ['overview', 'integration'],
                childSections: ['implementation', 'specifics'],
                sharedSections: ['concepts', 'rules']
            }
        };
        return {
            relationshipId,
            parentContextId: type === 'parent-child' ? targetNode.contextId : sourceNode.contextId,
            childContextId: type === 'parent-child' ? sourceNode.contextId : targetNode.contextId,
            relationshipType: type,
            strength,
            contentSpecialization,
            crossReferences: [], // Would be populated by createCrossReferences
            metadata: {
                createdAt: new Date(),
                lastUpdated: new Date(),
                semanticStrength: strength,
                conceptualOverlap: contentSpecialization.sharedConcepts.length / Math.max(sourceNode.contentSummary.primaryConcepts.length, 1),
                implementationCoupling: 0.5, // Placeholder
                navigationValue: 0.8, // Placeholder
                aiOptimizationScore: 0.9 // Placeholder
            }
        };
    }
    calculateRelationshipStrength(sourceNode, targetNode, semanticResults) {
        // Calculate based on concept overlap, rule similarity, and domain proximity
        const conceptOverlap = sourceNode.contentSummary.primaryConcepts.filter(c => targetNode.contentSummary.primaryConcepts.includes(c)).length;
        const maxConcepts = Math.max(sourceNode.contentSummary.primaryConcepts.length, targetNode.contentSummary.primaryConcepts.length, 1);
        const domainDistance = Math.abs(sourceNode.level - targetNode.level);
        const proximityScore = 1 / (1 + domainDistance);
        return (conceptOverlap / maxConcepts) * 0.6 + proximityScore * 0.4;
    }
    createNavigationPaths(nodes) {
        nodes.forEach(sourceNode => {
            const navigationPaths = [];
            // Up navigation (to parent)
            if (sourceNode.parent) {
                const parentNode = this.hierarchyMap.contextHierarchy.get(sourceNode.parent);
                if (parentNode) {
                    navigationPaths.push({
                        pathId: `nav-up-${sourceNode.contextId}-${parentNode.contextId}`,
                        fromContextId: sourceNode.contextId,
                        toContextId: parentNode.contextId,
                        pathType: 'up',
                        navigationHint: 'View architectural overview and integration patterns',
                        relevanceScore: 0.9
                    });
                }
            }
            // Down navigation (to children)
            sourceNode.children.forEach(childId => {
                const childNode = this.hierarchyMap.contextHierarchy.get(childId);
                if (childNode) {
                    navigationPaths.push({
                        pathId: `nav-down-${sourceNode.contextId}-${childId}`,
                        fromContextId: sourceNode.contextId,
                        toContextId: childId,
                        pathType: 'down',
                        navigationHint: 'View detailed implementation and algorithm specifics',
                        relevanceScore: 0.8
                    });
                }
            });
            // Sibling navigation
            sourceNode.siblings.forEach(siblingId => {
                const siblingNode = this.hierarchyMap.contextHierarchy.get(siblingId);
                if (siblingNode) {
                    navigationPaths.push({
                        pathId: `nav-sibling-${sourceNode.contextId}-${siblingId}`,
                        fromContextId: sourceNode.contextId,
                        toContextId: siblingId,
                        pathType: 'sibling',
                        navigationHint: `Related algorithm: ${siblingNode.domainPath.split('.').pop()}`,
                        relevanceScore: 0.7
                    });
                }
            });
            this.hierarchyMap.navigationPaths.set(sourceNode.contextId, navigationPaths);
        });
    }
    optimizeForAIComprehension() {
        // Enhance relationships with AI-specific optimizations
        this.hierarchyMap.relationshipGraph.forEach((relationships, contextId) => {
            relationships.forEach(relationship => {
                // Boost AI optimization score based on content quality
                const sourceNode = this.hierarchyMap.contextHierarchy.get(relationship.parentContextId);
                const targetNode = this.hierarchyMap.contextHierarchy.get(relationship.childContextId);
                if (sourceNode && targetNode) {
                    const tokenRatio = Math.min(sourceNode.contentSummary.tokenCount, targetNode.contentSummary.tokenCount) /
                        Math.max(sourceNode.contentSummary.tokenCount, targetNode.contentSummary.tokenCount);
                    relationship.metadata.aiOptimizationScore =
                        relationship.metadata.conceptualOverlap * 0.4 +
                            relationship.metadata.navigationValue * 0.3 +
                            tokenRatio * 0.3;
                }
            });
        });
        logger.info('AI comprehension optimization completed');
    }
    buildHierarchyTree(node, visualization, depth) {
        const indent = '  '.repeat(depth);
        const icon = node.children.length > 0 ? '📁' : '📄';
        visualization.push(`${indent}${icon} **${node.domainPath}** (${node.contentSummary.complexityLevel})`);
        visualization.push(`${indent}   - Concepts: ${node.contentSummary.primaryConcepts.length}`);
        visualization.push(`${indent}   - Rules: ${node.contentSummary.keyRules.length}`);
        visualization.push(`${indent}   - Tokens: ${node.contentSummary.tokenCount}`);
        // Recursively add children
        node.children.forEach(childId => {
            const childNode = this.hierarchyMap.contextHierarchy.get(childId);
            if (childNode) {
                this.buildHierarchyTree(childNode, visualization, depth + 1);
            }
        });
    }
    // Placeholder methods for consistency validation
    detectCircularReferences() { return []; }
    detectMissingCrossReferences() { return []; }
    detectInconsistentSpecialization() { return []; }
    // Placeholder methods for content analysis
    extractConceptsFromSemantics(semantics) {
        return semantics.flatMap(s => s.businessConcepts.map(c => c.name));
    }
    conceptsSimilar(concept1, concept2) {
        return concept1.toLowerCase() === concept2.toLowerCase();
    }
    determineContentDistribution(parentContext, childContext, sharedConceptCount) {
        return {
            parentSections: ['architectural-overview', 'integration-patterns'],
            childSections: ['implementation-details', 'algorithm-specifics'],
            sharedSections: ['business-concepts', 'business-rules']
        };
    }
    createNavigationReference(sourceContext, targetContext, description, type) {
        return {
            referenceId: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceContextId: sourceContext.contextId,
            targetContextId: targetContext.contextId,
            referenceType: type,
            sourceSection: 'navigation',
            targetSection: 'overview',
            description,
            bidirectional: true
        };
    }
    createConceptReferences(sourceContext, targetContext, semanticResults) {
        // Placeholder implementation
        return [];
    }
    createImplementationReferences(sourceContext, targetContext, semanticResults) {
        // Placeholder implementation
        return [];
    }
    createRuleReferences(sourceContext, targetContext, semanticResults) {
        // Placeholder implementation
        return [];
    }
}
//# sourceMappingURL=hierarchical-relationship-manager.js.map
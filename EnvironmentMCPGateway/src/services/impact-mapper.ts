import * as path from 'path';
import { DomainAnalyzer, DomainMap, CrossDomainRelationship, DomainBoundary } from './domain-analyzer.js';
import { SemanticAnalysisService, SemanticAnalysisResult } from './semantic-analysis.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('mcp-gateway.log');

export interface ImpactNode {
    domain: string;
    impactLevel: 'direct' | 'indirect' | 'cascade';
    impactScore: number; // 0-1 scale
    changedFiles: string[];
    affectedComponents: string[];
    propagationDepth: number;
    estimatedUpdateTime: number; // in seconds
    updatePriority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ImpactEdge {
    sourceDomain: string;
    targetDomain: string;
    propagationType: 'interface' | 'data' | 'event' | 'dependency' | 'configuration';
    strength: number; // 0-1 scale
    bidirectional: boolean;
    propagationDelay: number; // estimated seconds
}

export interface ImpactGraph {
    nodes: ImpactNode[];
    edges: ImpactEdge[];
    rootChanges: string[];
    analysisTimestamp: Date;
    totalEstimatedTime: number;
    criticalPath: string[];
}

export interface ChangeImpactPrediction {
    impactGraph: ImpactGraph;
    updateSequence: string[];
    riskFactors: RiskFactor[];
    confidenceScore: number;
    recommendations: string[];
}

export interface RiskFactor {
    type: 'circular-dependency' | 'high-coupling' | 'missing-tests' | 'performance' | 'rollback-complexity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedDomains: string[];
    mitigation: string;
}

/**
 * Maps and analyzes the impact of changes across domain boundaries
 * Provides prediction and visualization of cross-domain propagation
 */
export class ImpactMapper {
    private readonly domainAnalyzer: DomainAnalyzer;
    private readonly semanticAnalysis: SemanticAnalysisService;
    private readonly projectRoot: string;
    private cachedDomainMap?: DomainMap;
    private cacheTimestamp?: Date;
    private readonly timeout: number; // timeout in milliseconds
    private readonly performanceThreshold: number = 15000; // 15 seconds default
    private readonly maxPropagationDepth: number = 5; // Maximum depth for impact propagation

    constructor(projectRoot: string = '.', timeout: number = 15000) {
        this.projectRoot = path.resolve(projectRoot);
        this.domainAnalyzer = new DomainAnalyzer(projectRoot, timeout);
        this.semanticAnalysis = new SemanticAnalysisService();
        this.timeout = timeout;
        
        logger.info(`Impact Mapper initialized for project: ${this.projectRoot} with timeout: ${timeout}ms`);
    }

    /**
     * Predict the complete impact of proposed changes
     */
    async predictChangeImpact(changedFiles: string[]): Promise<ChangeImpactPrediction> {
        logger.info(`Predicting impact for ${changedFiles.length} changed files`);
        const startTime = Date.now();
        const performanceMetrics = {
            domainMapTime: 0,
            impactGraphTime: 0,
            analysisTime: 0
        };

        try {
            // Check timeout at start
            this.checkTimeout(startTime, 'at start of impact prediction');
            
            // Get or refresh domain map
            const domainMapStart = Date.now();
            const domainMap = await this.getDomainMap(changedFiles);
            performanceMetrics.domainMapTime = Date.now() - domainMapStart;
            
            // Check timeout before building impact graph
            this.checkTimeout(startTime, 'before building impact graph');
            
            // Build impact graph
            const impactGraphStart = Date.now();
            const impactGraph = await this.buildImpactGraph(changedFiles, domainMap, startTime);
            performanceMetrics.impactGraphTime = Date.now() - impactGraphStart;
            
            // Check timeout before analysis
            this.checkTimeout(startTime, 'before update sequence calculation');
            
            // Determine optimal update sequence
            const updateSequence = this.calculateUpdateSequence(impactGraph);
            
            // Identify risk factors
            const riskFactors = await this.identifyRiskFactors(impactGraph, domainMap);
            
            // Calculate confidence score
            const confidenceScore = this.calculateConfidenceScore(impactGraph, domainMap);
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(impactGraph, riskFactors);

            const prediction: ChangeImpactPrediction = {
                impactGraph,
                updateSequence,
                riskFactors,
                confidenceScore,
                recommendations
            };

            const analysisTime = Date.now() - startTime;
            logger.info(`Impact prediction completed in ${analysisTime}ms. Found ${impactGraph.nodes.length} affected domains`);
            logger.info(`Performance metrics - Domain map: ${performanceMetrics.domainMapTime}ms, Impact graph: ${performanceMetrics.impactGraphTime}ms`);

            return prediction;

        } catch (error) {
            logger.error('Impact prediction failed:', error);
            throw error;
        }
    }

    /**
     * Get or refresh the domain map
     */
    private async getDomainMap(changedFiles: string[]): Promise<DomainMap> {
        const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
        
        if (this.cachedDomainMap && 
            this.cacheTimestamp && 
            (Date.now() - this.cacheTimestamp.getTime()) < cacheMaxAge) {
            return this.cachedDomainMap;
        }

        logger.debug('Refreshing domain map');
        this.cachedDomainMap = await this.domainAnalyzer.analyzeDomainMap(changedFiles);
        this.cacheTimestamp = new Date();
        
        return this.cachedDomainMap;
    }

    /**
     * Build the impact graph showing all affected domains and relationships
     */
    private async buildImpactGraph(changedFiles: string[], domainMap: DomainMap, analysisStartTime?: number): Promise<ImpactGraph> {
        const impactNodes: ImpactNode[] = [];
        const impactEdges: ImpactEdge[] = [];
        
        // Identify directly affected domains
        const directlyAffectedDomains = this.identifyDirectlyAffectedDomains(changedFiles, domainMap);
        
        // Build nodes for directly affected domains
        for (const domain of directlyAffectedDomains) {
            // Check timeout during node building
            if (analysisStartTime) {
                this.checkTimeout(analysisStartTime, `while building impact node for ${domain}`);
            }
            
            const domainBoundary = domainMap.domains.find(d => d.domain === domain);
            if (!domainBoundary) continue;

            const domainChangedFiles = changedFiles.filter(file => 
                file.startsWith(domainBoundary.rootPath)
            );

            const node = await this.createImpactNode(
                domain, 
                'direct', 
                domainChangedFiles, 
                domainBoundary
            );
            impactNodes.push(node);
        }

        // Check timeout before propagation
        if (analysisStartTime) {
            this.checkTimeout(analysisStartTime, 'before impact propagation');
        }

        // Propagate impact through relationships
        await this.propagateImpact(
            directlyAffectedDomains,
            domainMap,
            impactNodes,
            impactEdges,
            1, // Starting depth
            analysisStartTime
        );

        // Calculate critical path
        const criticalPath = this.calculateCriticalPath(impactNodes, impactEdges);

        // Calculate total estimated time
        const totalEstimatedTime = impactNodes.reduce((sum, node) => sum + node.estimatedUpdateTime, 0);

        return {
            nodes: impactNodes,
            edges: impactEdges,
            rootChanges: changedFiles,
            analysisTimestamp: new Date(),
            totalEstimatedTime,
            criticalPath
        };
    }

    /**
     * Identify domains directly affected by file changes
     */
    private identifyDirectlyAffectedDomains(changedFiles: string[], domainMap: DomainMap): string[] {
        const affectedDomains = new Set<string>();

        for (const file of changedFiles) {
            for (const domain of domainMap.domains) {
                if (file.startsWith(domain.rootPath)) {
                    affectedDomains.add(domain.domain);
                }
            }
        }

        return Array.from(affectedDomains);
    }

    /**
     * Create an impact node for a domain
     */
    private async createImpactNode(
        domain: string,
        impactLevel: ImpactNode['impactLevel'],
        changedFiles: string[],
        domainBoundary: DomainBoundary,
        propagationDepth: number = 0
    ): Promise<ImpactNode> {
        
        // Analyze semantic changes for the domain
        const semanticResults = await this.analyzeSemanticChanges(changedFiles, domainBoundary);
        
        // Calculate impact score
        const impactScore = this.calculateImpactScore(
            impactLevel,
            changedFiles.length,
            semanticResults,
            domainBoundary,
            propagationDepth
        );

        // Identify affected components
        const affectedComponents = this.identifyAffectedComponents(semanticResults, domainBoundary);

        // Estimate update time
        const estimatedUpdateTime = this.estimateUpdateTime(
            impactLevel,
            changedFiles.length,
            affectedComponents.length,
            domainBoundary.businessConcepts.length
        );

        // Determine update priority
        const updatePriority = this.determineUpdatePriority(impactScore, propagationDepth, domain);

        return {
            domain,
            impactLevel,
            impactScore,
            changedFiles,
            affectedComponents,
            propagationDepth,
            estimatedUpdateTime,
            updatePriority
        };
    }

    /**
     * Analyze semantic changes within a domain
     */
    private async analyzeSemanticChanges(
        changedFiles: string[],
        domainBoundary: DomainBoundary
    ): Promise<SemanticAnalysisResult[]> {
        const relevantFiles = changedFiles.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.cs', '.ts', '.js'].includes(ext) && file.startsWith(domainBoundary.rootPath);
        });

        if (relevantFiles.length === 0) {
            return [];
        }

        try {
            return await this.semanticAnalysis.analyzeCodeChanges(relevantFiles);
        } catch (error) {
            logger.warn(`Semantic analysis failed for domain ${domainBoundary.domain}:`, error);
            return [];
        }
    }

    /**
     * Calculate impact score for a domain
     */
    private calculateImpactScore(
        impactLevel: ImpactNode['impactLevel'],
        changedFileCount: number,
        semanticResults: SemanticAnalysisResult[],
        domainBoundary: DomainBoundary,
        propagationDepth: number
    ): number {
        let score = 0;

        // Base score by impact level
        const baseScores = {
            'direct': 0.8,
            'indirect': 0.5,
            'cascade': 0.3
        };
        score += baseScores[impactLevel];

        // File count factor
        const fileCountFactor = Math.min(changedFileCount / 10, 1) * 0.2;
        score += fileCountFactor;

        // Semantic complexity factor
        if (semanticResults.length > 0) {
            const avgComplexity = semanticResults.reduce((sum, result) => 
                sum + result.businessConcepts.length + result.businessRules.length, 0
            ) / semanticResults.length;
            
            const complexityFactor = Math.min(avgComplexity / 10, 1) * 0.2;
            score += complexityFactor;
        }

        // Domain importance factor (more business concepts = more important)
        const importanceFactor = Math.min(domainBoundary.businessConcepts.length / 20, 1) * 0.2;
        score += importanceFactor;

        // Depth penalty (deeper propagation = lower direct impact)
        const depthPenalty = Math.max(0, propagationDepth * 0.1);
        score = Math.max(0, score - depthPenalty);

        return Math.min(Math.max(score, 0), 1);
    }

    /**
     * Identify components affected within a domain
     */
    private identifyAffectedComponents(
        semanticResults: SemanticAnalysisResult[],
        domainBoundary: DomainBoundary
    ): string[] {
        const components = new Set<string>();

        // From semantic analysis
        for (const result of semanticResults) {
            for (const concept of result.businessConcepts) {
                components.add(concept.name);
            }
        }

        // From domain boundary analysis
        for (const concept of domainBoundary.businessConcepts) {
            components.add(concept);
        }

        for (const interface_ of domainBoundary.keyInterfaces) {
            components.add(interface_);
        }

        return Array.from(components);
    }

    /**
     * Estimate time required to update a domain
     */
    private estimateUpdateTime(
        impactLevel: ImpactNode['impactLevel'],
        changedFileCount: number,
        componentCount: number,
        businessConceptCount: number
    ): number {
        // Base time by impact level (in seconds)
        const baseTimes = {
            'direct': 120,     // 2 minutes
            'indirect': 60,    // 1 minute  
            'cascade': 30      // 30 seconds
        };
        
        let estimatedTime = baseTimes[impactLevel];

        // Add time for file complexity
        estimatedTime += changedFileCount * 15; // 15 seconds per file

        // Add time for component complexity
        estimatedTime += componentCount * 10; // 10 seconds per component

        // Add time for business concept complexity
        estimatedTime += businessConceptCount * 5; // 5 seconds per concept

        return Math.max(estimatedTime, 10); // Minimum 10 seconds
    }

    /**
     * Determine update priority for a domain
     */
    private determineUpdatePriority(
        impactScore: number,
        propagationDepth: number,
        domain: string
    ): ImpactNode['updatePriority'] {
        // Critical domains always get high priority
        const criticalDomains = ['Data', 'Analysis', 'Messaging'];
        if (criticalDomains.includes(domain)) {
            return impactScore > 0.7 ? 'critical' : 'high';
        }

        // Priority based on impact score and depth
        if (impactScore > 0.8 && propagationDepth <= 1) {
            return 'critical';
        }
        
        if (impactScore > 0.6 && propagationDepth <= 2) {
            return 'high';
        }
        
        if (impactScore > 0.4 || propagationDepth <= 3) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Propagate impact through domain relationships
     */
    private async propagateImpact(
        sourceDomainsToProcess: string[],
        domainMap: DomainMap,
        impactNodes: ImpactNode[],
        impactEdges: ImpactEdge[],
        currentDepth: number,
        analysisStartTime?: number,
        maxDepth: number = 4
    ): Promise<void> {
        if (currentDepth > maxDepth || sourceDomainsToProcess.length === 0) {
            return;
        }

        // Check timeout at each propagation level
        if (analysisStartTime) {
            this.checkTimeout(analysisStartTime, `during impact propagation at depth ${currentDepth}`);
        }

        const nextLevelDomains = new Set<string>();
        const processedNodes = new Set(impactNodes.map(node => node.domain));

        for (const sourceDomain of sourceDomainsToProcess) {
            // Find all relationships where this domain is the source
            const outgoingRelationships = domainMap.relationships.filter(rel =>
                rel.sourceDomain === sourceDomain
            );

            for (const relationship of outgoingRelationships) {
                const targetDomain = relationship.targetDomain;

                // Create impact edge
                const edge = this.createImpactEdge(relationship, currentDepth);
                impactEdges.push(edge);

                // Create or update target domain node if not already processed
                if (!processedNodes.has(targetDomain)) {
                    const targetBoundary = domainMap.domains.find(d => d.domain === targetDomain);
                    if (targetBoundary) {
                        const impactLevel = currentDepth === 1 ? 'indirect' : 'cascade';
                        const node = await this.createImpactNode(
                            targetDomain,
                            impactLevel,
                            [], // No direct file changes
                            targetBoundary,
                            currentDepth
                        );

                        impactNodes.push(node);
                        processedNodes.add(targetDomain);
                        nextLevelDomains.add(targetDomain);
                    }
                }
            }
        }

        // Recurse to next level
        if (nextLevelDomains.size > 0) {
            await this.propagateImpact(
                Array.from(nextLevelDomains),
                domainMap,
                impactNodes,
                impactEdges,
                currentDepth + 1,
                analysisStartTime,
                maxDepth
            );
        }
    }

    /**
     * Create an impact edge from a cross-domain relationship
     */
    private createImpactEdge(
        relationship: CrossDomainRelationship,
        propagationDepth: number
    ): ImpactEdge {
        // Map relationship type to propagation type
        const propagationTypeMap = {
            'dependency': 'dependency' as const,
            'association': 'interface' as const,
            'composition': 'data' as const,
            'aggregation': 'data' as const,
            'inheritance': 'interface' as const
        };

        const propagationType = propagationTypeMap[relationship.relationshipType];

        // Calculate propagation delay based on type and depth
        const baseDelays = {
            'interface': 30,
            'data': 60,
            'event': 20,
            'dependency': 45,
            'configuration': 90
        };

        const propagationDelay = baseDelays[propagationType] * (1 + propagationDepth * 0.5);

        return {
            sourceDomain: relationship.sourceDomain,
            targetDomain: relationship.targetDomain,
            propagationType,
            strength: relationship.strength,
            bidirectional: relationship.strength > 0.7, // High strength relationships are often bidirectional
            propagationDelay: Math.round(propagationDelay)
        };
    }

    /**
     * Calculate the critical path through the impact graph
     */
    private calculateCriticalPath(nodes: ImpactNode[], edges: ImpactEdge[]): string[] {
        // Use topological sort with longest path algorithm
        const inDegree = new Map<string, number>();
        const outEdges = new Map<string, ImpactEdge[]>();
        
        // Initialize
        for (const node of nodes) {
            inDegree.set(node.domain, 0);
            outEdges.set(node.domain, []);
        }

        // Build graph structure
        for (const edge of edges) {
            inDegree.set(edge.targetDomain, (inDegree.get(edge.targetDomain) || 0) + 1);
            const sourceEdges = outEdges.get(edge.sourceDomain) || [];
            sourceEdges.push(edge);
            outEdges.set(edge.sourceDomain, sourceEdges);
        }

        // Find longest path (critical path)
        const distances = new Map<string, number>();
        const predecessors = new Map<string, string>();
        const queue: string[] = [];

        // Initialize distances and find starting nodes (no incoming edges)
        for (const node of nodes) {
            const degree = inDegree.get(node.domain) || 0;
            distances.set(node.domain, node.estimatedUpdateTime);
            
            if (degree === 0) {
                queue.push(node.domain);
            }
        }

        // Process queue
        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentDistance = distances.get(current) || 0;
            const currentEdges = outEdges.get(current) || [];

            for (const edge of currentEdges) {
                const target = edge.targetDomain;
                const targetNode = nodes.find(n => n.domain === target);
                const newDistance = currentDistance + (targetNode?.estimatedUpdateTime || 0);
                
                if (newDistance > (distances.get(target) || 0)) {
                    distances.set(target, newDistance);
                    predecessors.set(target, current);
                }

                // Reduce in-degree and add to queue if ready
                const newInDegree = (inDegree.get(target) || 0) - 1;
                inDegree.set(target, newInDegree);
                
                if (newInDegree === 0) {
                    queue.push(target);
                }
            }
        }

        // Find the node with maximum distance (end of critical path)
        let maxDistance = 0;
        let endNode = '';
        
        for (const [domain, distance] of distances) {
            if (distance > maxDistance) {
                maxDistance = distance;
                endNode = domain;
            }
        }

        // Reconstruct critical path
        const criticalPath: string[] = [];
        let current = endNode;
        
        while (current) {
            criticalPath.unshift(current);
            current = predecessors.get(current) || '';
        }

        return criticalPath;
    }

    /**
     * Calculate optimal update sequence
     */
    private calculateUpdateSequence(impactGraph: ImpactGraph): string[] {
        // Sort by dependency order and priority
        const nodeMap = new Map(impactGraph.nodes.map(node => [node.domain, node]));
        const inDegree = new Map<string, number>();
        const adjList = new Map<string, string[]>();

        // Initialize
        for (const node of impactGraph.nodes) {
            inDegree.set(node.domain, 0);
            adjList.set(node.domain, []);
        }

        // Build dependency graph
        for (const edge of impactGraph.edges) {
            inDegree.set(edge.targetDomain, (inDegree.get(edge.targetDomain) || 0) + 1);
            const sourceList = adjList.get(edge.sourceDomain) || [];
            sourceList.push(edge.targetDomain);
            adjList.set(edge.sourceDomain, sourceList);
        }

        // Topological sort with priority consideration
        const sequence: string[] = [];
        const queue: string[] = [];

        // Find starting nodes
        for (const [domain, degree] of inDegree) {
            if (degree === 0) {
                queue.push(domain);
            }
        }

        // Sort queue by priority and impact score
        queue.sort((a, b) => {
            const nodeA = nodeMap.get(a)!;
            const nodeB = nodeMap.get(b)!;
            
            const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            const priorityDiff = priorityOrder[nodeB.updatePriority] - priorityOrder[nodeA.updatePriority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            return nodeB.impactScore - nodeA.impactScore;
        });

        while (queue.length > 0) {
            const current = queue.shift()!;
            sequence.push(current);

            const neighbors = adjList.get(current) || [];
            for (const neighbor of neighbors) {
                const newDegree = (inDegree.get(neighbor) || 0) - 1;
                inDegree.set(neighbor, newDegree);

                if (newDegree === 0) {
                    // Insert in sorted position
                    const neighborNode = nodeMap.get(neighbor)!;
                    let insertIndex = queue.length;
                    
                    for (let i = 0; i < queue.length; i++) {
                        const queueNode = nodeMap.get(queue[i])!;
                        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                        
                        if (priorityOrder[neighborNode.updatePriority] > priorityOrder[queueNode.updatePriority] ||
                            (priorityOrder[neighborNode.updatePriority] === priorityOrder[queueNode.updatePriority] &&
                             neighborNode.impactScore > queueNode.impactScore)) {
                            insertIndex = i;
                            break;
                        }
                    }
                    
                    queue.splice(insertIndex, 0, neighbor);
                }
            }
        }

        return sequence;
    }

    /**
     * Identify risk factors in the impact analysis
     */
    private async identifyRiskFactors(impactGraph: ImpactGraph, _domainMap: DomainMap): Promise<RiskFactor[]> {
        const riskFactors: RiskFactor[] = [];

        // Check for circular dependencies
        const circularDeps = this.detectCircularDependencies(impactGraph);
        if (circularDeps.length > 0) {
            riskFactors.push({
                type: 'circular-dependency',
                severity: 'high',
                description: `Circular dependencies detected between domains: ${circularDeps.join(' -> ')}`,
                affectedDomains: circularDeps,
                mitigation: 'Break circular dependencies by introducing abstractions or event-driven communication'
            });
        }

        // Check for high coupling
        const highCouplingDomains = this.detectHighCoupling(impactGraph);
        if (highCouplingDomains.length > 0) {
            riskFactors.push({
                type: 'high-coupling',
                severity: 'medium',
                description: `High coupling detected in domains: ${highCouplingDomains.join(', ')}`,
                affectedDomains: highCouplingDomains,
                mitigation: 'Reduce coupling by introducing interfaces and dependency injection'
            });
        }

        // Check for performance risks
        const performanceRisks = this.detectPerformanceRisks(impactGraph);
        if (performanceRisks.length > 0) {
            riskFactors.push({
                type: 'performance',
                severity: 'medium',
                description: `Performance risks in domains with high impact: ${performanceRisks.join(', ')}`,
                affectedDomains: performanceRisks,
                mitigation: 'Consider parallel updates where possible and optimize critical path'
            });
        }

        // Check for rollback complexity
        const rollbackComplexity = this.assessRollbackComplexity(impactGraph);
        if (rollbackComplexity.severity !== 'low') {
            riskFactors.push(rollbackComplexity);
        }

        return riskFactors;
    }

    /**
     * Detect circular dependencies in the impact graph
     */
    private detectCircularDependencies(impactGraph: ImpactGraph): string[] {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const adjList = new Map<string, string[]>();

        // Build adjacency list
        for (const node of impactGraph.nodes) {
            adjList.set(node.domain, []);
        }

        for (const edge of impactGraph.edges) {
            const sourceList = adjList.get(edge.sourceDomain) || [];
            sourceList.push(edge.targetDomain);
            adjList.set(edge.sourceDomain, sourceList);
        }

        // DFS to detect cycles
        const findCycle = (domain: string, path: string[]): string[] => {
            if (recursionStack.has(domain)) {
                const cycleStart = path.indexOf(domain);
                return path.slice(cycleStart).concat([domain]);
            }

            if (visited.has(domain)) {
                return [];
            }

            visited.add(domain);
            recursionStack.add(domain);
            path.push(domain);

            const neighbors = adjList.get(domain) || [];
            for (const neighbor of neighbors) {
                const cycle = findCycle(neighbor, [...path]);
                if (cycle.length > 0) {
                    return cycle;
                }
            }

            recursionStack.delete(domain);
            return [];
        };

        for (const node of impactGraph.nodes) {
            if (!visited.has(node.domain)) {
                const cycle = findCycle(node.domain, []);
                if (cycle.length > 0) {
                    return cycle;
                }
            }
        }

        return [];
    }

    /**
     * Detect domains with high coupling
     */
    private detectHighCoupling(impactGraph: ImpactGraph): string[] {
        const couplingScores = new Map<string, number>();

        // Initialize coupling scores
        for (const node of impactGraph.nodes) {
            couplingScores.set(node.domain, 0);
        }

        // Calculate coupling based on edge strength and count
        for (const edge of impactGraph.edges) {
            const sourceScore = couplingScores.get(edge.sourceDomain) || 0;
            const targetScore = couplingScores.get(edge.targetDomain) || 0;
            
            couplingScores.set(edge.sourceDomain, sourceScore + edge.strength);
            couplingScores.set(edge.targetDomain, targetScore + edge.strength);
        }

        // Find domains with high coupling (threshold: 3.0)
        const highCouplingThreshold = 3.0;
        return Array.from(couplingScores.entries())
            .filter(([_, score]) => score > highCouplingThreshold)
            .map(([domain, _]) => domain);
    }

    /**
     * Detect performance risks
     */
    private detectPerformanceRisks(impactGraph: ImpactGraph): string[] {
        const performanceThreshold = 300; // 5 minutes
        
        return impactGraph.nodes
            .filter(node => node.estimatedUpdateTime > performanceThreshold)
            .map(node => node.domain);
    }

    /**
     * Assess rollback complexity
     */
    private assessRollbackComplexity(impactGraph: ImpactGraph): RiskFactor {
        const totalNodes = impactGraph.nodes.length;
        const totalTime = impactGraph.totalEstimatedTime;
        const criticalPathLength = impactGraph.criticalPath.length;

        let severity: RiskFactor['severity'] = 'low';
        
        if (totalNodes > 8 || totalTime > 900 || criticalPathLength > 5) {
            severity = 'high';
        } else if (totalNodes > 5 || totalTime > 600 || criticalPathLength > 3) {
            severity = 'medium';
        }

        return {
            type: 'rollback-complexity',
            severity,
            description: `Rollback complexity: ${totalNodes} domains, ${Math.round(totalTime/60)} minute estimated time`,
            affectedDomains: impactGraph.nodes.map(n => n.domain),
            mitigation: 'Ensure comprehensive rollback testing and consider incremental rollback strategy'
        };
    }

    /**
     * Calculate confidence score for the prediction
     */
    private calculateConfidenceScore(impactGraph: ImpactGraph, domainMap: DomainMap): number {
        let confidence = 0;

        // Domain map quality factor
        const avgDomainConfidence = domainMap.domains.reduce((sum, domain) => 
            sum + domain.confidence, 0) / domainMap.domains.length;
        confidence += avgDomainConfidence * 0.4;

        // Relationship quality factor
        const avgRelationshipStrength = domainMap.relationships.reduce((sum, rel) => 
            sum + rel.strength, 0) / Math.max(domainMap.relationships.length, 1);
        confidence += avgRelationshipStrength * 0.3;

        // Impact analysis completeness
        const directImpactNodes = impactGraph.nodes.filter(n => n.impactLevel === 'direct').length;
        const completenessScore = Math.min(directImpactNodes / 3, 1); // Expect at least 3 direct impacts
        confidence += completenessScore * 0.3;

        return Math.min(Math.max(confidence, 0), 1);
    }

    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations(impactGraph: ImpactGraph, riskFactors: RiskFactor[]): string[] {
        const recommendations: string[] = [];

        // Critical path recommendations
        if (impactGraph.criticalPath.length > 0) {
            recommendations.push(
                `Focus on critical path: ${impactGraph.criticalPath.join(' -> ')} for optimal update sequencing`
            );
        }

        // High-priority domain recommendations
        const criticalNodes = impactGraph.nodes.filter(n => n.updatePriority === 'critical');
        if (criticalNodes.length > 0) {
            recommendations.push(
                `Prioritize critical domains: ${criticalNodes.map(n => n.domain).join(', ')}`
            );
        }

        // Performance recommendations
        if (impactGraph.totalEstimatedTime > 600) {
            recommendations.push(
                'Consider parallel execution for independent domains to reduce total update time'
            );
        }

        // Risk-based recommendations
        for (const risk of riskFactors) {
            if (risk.severity === 'high' || risk.severity === 'critical') {
                recommendations.push(risk.mitigation);
            }
        }

        // Rollback recommendations
        if (impactGraph.nodes.length > 5) {
            recommendations.push(
                'Create comprehensive rollback snapshots before executing updates'
            );
        }

        return recommendations;
    }

    /**
     * Clear domain map cache
     */
    clearCache(): void {
        this.cachedDomainMap = undefined;
        this.cacheTimestamp = undefined;
        logger.debug('Domain map cache cleared');
    }

    /**
     * Check if the analysis has exceeded the timeout
     */
    private checkTimeout(startTime: number, context: string): void {
        const elapsed = Date.now() - startTime;
        if (elapsed > this.timeout) {
            const error = new Error(`Impact mapping timeout exceeded after ${elapsed}ms during ${context}. Timeout limit: ${this.timeout}ms`);
            logger.error(`Performance timeout exceeded: ${error.message}`);
            throw error;
        }
        
        // Warn if approaching timeout
        if (elapsed > this.timeout * 0.8) {
            logger.warn(`Impact mapping approaching timeout: ${elapsed}ms of ${this.timeout}ms used during ${context}`);
        }
    }
}

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { DomainAnalyzer } from '../services/domain-analyzer.js';
import { ImpactMapper } from '../services/impact-mapper.js';
import { CrossDomainCoordinator } from '../services/cross-domain-coordinator.js';
import { HolisticUpdateRequest } from '../services/holistic-update-orchestrator.js';

/**
 * MCP Tools for Cross-Domain Impact Analysis
 * Provides comprehensive impact analysis and coordination capabilities
 */

export const analyzedomainmapTool: Tool = {
    name: 'analyze-domain-map',
    description: 'Analyze the complete domain map including boundaries, relationships, and cross-cutting concerns',
    inputSchema: {
        type: 'object',
        properties: {
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project to analyze'
            },
            changedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional list of changed files to focus analysis on'
            },
            includeVisualization: {
                type: 'boolean',
                description: 'Whether to include visualization data in the response',
                default: false
            }
        }
    }
};

export const predictchangeimpactTool: Tool = {
    name: 'predict-change-impact',
    description: 'Predict the complete impact of proposed changes across all domains',
    inputSchema: {
        type: 'object',
        properties: {
            changedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of files that have been or will be changed',
                minItems: 1
            },
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project'
            },
            includeRiskAnalysis: {
                type: 'boolean',
                description: 'Whether to include detailed risk analysis',
                default: true
            },
            includeRecommendations: {
                type: 'boolean',
                description: 'Whether to include actionable recommendations',
                default: true
            }
        },
        required: ['changedFiles']
    }
};

export const coordinatecrossdomainupdateTool: Tool = {
    name: 'coordinate-cross-domain-update',
    description: 'Coordinate a comprehensive cross-domain update with impact analysis and dependency management',
    inputSchema: {
        type: 'object',
        properties: {
            changedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of files that have been changed',
                minItems: 1
            },
            triggerType: {
                type: 'string',
                enum: ['git-hook', 'manual', 'scheduled'],
                description: 'Type of trigger that initiated the update',
                default: 'manual'
            },
            performanceTimeout: {
                type: 'number',
                description: 'Timeout in seconds for the entire coordination process',
                default: 300,
                minimum: 30,
                maximum: 1800
            },
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project'
            },
            dryRun: {
                type: 'boolean',
                description: 'Whether to perform a dry run without making actual changes',
                default: false
            }
        },
        required: ['changedFiles']
    }
};

export const analyzespecificdomainsimpactTool: Tool = {
    name: 'analyze-specific-domains-impact',
    description: 'Analyze impact between specific domains and their relationships',
    inputSchema: {
        type: 'object',
        properties: {
            sourceDomains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Source domains to analyze from',
                minItems: 1
            },
            targetDomains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Target domains to analyze impact on (optional - if not provided, analyzes all connected domains)'
            },
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project'
            },
            includeTransitiveImpacts: {
                type: 'boolean',
                description: 'Whether to include transitive impacts beyond direct relationships',
                default: true
            },
            maxPropagationDepth: {
                type: 'number',
                description: 'Maximum depth for impact propagation analysis',
                default: 4,
                minimum: 1,
                maximum: 10
            }
        },
        required: ['sourceDomains']
    }
};

export const getcrossdomaincoordinationstatusTool: Tool = {
    name: 'get-cross-domain-coordination-status',
    description: 'Get status of active cross-domain coordinations and their progress',
    inputSchema: {
        type: 'object',
        properties: {
            planId: {
                type: 'string',
                description: 'Specific plan ID to get status for (optional - if not provided, returns all active coordinations)'
            },
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project'
            },
            includeDetailedMetrics: {
                type: 'boolean',
                description: 'Whether to include detailed performance metrics',
                default: false
            }
        }
    }
};

/**
 * Tool handlers for cross-domain impact analysis
 */

export async function handleAnalyzeDomainMap(args: any): Promise<any> {
    const { projectRoot = '.', changedFiles, includeVisualization = false } = args;
    
    try {
        const domainAnalyzer = new DomainAnalyzer(projectRoot);
        const domainMap = await domainAnalyzer.analyzeDomainMap(changedFiles);
        
        const response = {
            success: true,
            domainMap: {
                domains: domainMap.domains.map(domain => ({
                    name: domain.domain,
                    rootPath: domain.rootPath,
                    subDomains: domain.subDomains,
                    businessConcepts: domain.businessConcepts,
                    keyInterfaces: domain.keyInterfaces,
                    confidence: domain.confidence,
                    dependencyCount: domain.dependencies.length
                })),
                relationships: domainMap.relationships.map(rel => ({
                    source: rel.sourceDomain,
                    target: rel.targetDomain,
                    type: rel.relationshipType,
                    strength: rel.strength,
                    evidenceFiles: rel.evidenceFiles.length,
                    justification: rel.businessJustification
                })),
                isolatedDomains: domainMap.isolatedDomains,
                crossCuttingConcerns: domainMap.crossCuttingConcerns,
                analysisTimestamp: domainMap.analysisTimestamp,
                totalDomains: domainMap.domains.length,
                totalRelationships: domainMap.relationships.length
            }
        };
        
        if (includeVisualization) {
            (response.domainMap as any).visualization = {
                nodes: domainMap.domains.map(domain => ({
                    id: domain.domain,
                    label: domain.domain,
                    size: Math.max(10, domain.businessConcepts.length * 2),
                    confidence: domain.confidence,
                    color: getNodeColor(domain.confidence)
                })),
                edges: domainMap.relationships.map(rel => ({
                    source: rel.sourceDomain,
                    target: rel.targetDomain,
                    weight: rel.strength,
                    type: rel.relationshipType,
                    color: getEdgeColor(rel.strength)
                }))
            };
        }
        
        return response;
        
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

export async function handlePredictChangeImpact(args: any): Promise<any> {
    const { 
        changedFiles, 
        projectRoot = '.', 
        includeRiskAnalysis = true, 
        includeRecommendations = true 
    } = args;
    
    try {
        const impactMapper = new ImpactMapper(projectRoot);
        const prediction = await impactMapper.predictChangeImpact(changedFiles);
        
        const response = {
            success: true,
            prediction: {
                impactSummary: {
                    totalAffectedDomains: prediction.impactGraph.nodes.length,
                    directlyAffectedDomains: prediction.impactGraph.nodes.filter(n => n.impactLevel === 'direct').length,
                    indirectlyAffectedDomains: prediction.impactGraph.nodes.filter(n => n.impactLevel === 'indirect').length,
                    cascadeAffectedDomains: prediction.impactGraph.nodes.filter(n => n.impactLevel === 'cascade').length,
                    totalEstimatedTime: Math.round(prediction.impactGraph.totalEstimatedTime / 60),
                    criticalPath: prediction.impactGraph.criticalPath,
                    confidenceScore: prediction.confidenceScore
                },
                affectedDomains: prediction.impactGraph.nodes.map(node => ({
                    domain: node.domain,
                    impactLevel: node.impactLevel,
                    impactScore: node.impactScore,
                    updatePriority: node.updatePriority,
                    estimatedUpdateTime: Math.round(node.estimatedUpdateTime / 60),
                    changedFilesCount: node.changedFiles.length,
                    affectedComponentsCount: node.affectedComponents.length,
                    propagationDepth: node.propagationDepth
                })),
                updateSequence: prediction.updateSequence,
                analysisTimestamp: prediction.impactGraph.analysisTimestamp
            }
        };
        
        if (includeRiskAnalysis) {
            (response.prediction as any).riskAnalysis = {
                riskFactors: prediction.riskFactors.map(risk => ({
                    type: risk.type,
                    severity: risk.severity,
                    description: risk.description,
                    affectedDomains: risk.affectedDomains,
                    mitigation: risk.mitigation
                })),
                totalRisks: prediction.riskFactors.length,
                criticalRisks: prediction.riskFactors.filter(r => r.severity === 'critical').length,
                highRisks: prediction.riskFactors.filter(r => r.severity === 'high').length
            };
        }
        
        if (includeRecommendations) {
            (response.prediction as any).recommendations = prediction.recommendations;
        }
        
        return response;
        
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

export async function handleCoordinateCrossDomainUpdate(args: any): Promise<any> {
    const { 
        changedFiles, 
        triggerType = 'manual', 
        performanceTimeout = 300, 
        projectRoot = '.', 
        dryRun = false 
    } = args;
    
    try {
        const coordinator = new CrossDomainCoordinator(projectRoot);
        
        const request: HolisticUpdateRequest = {
            changedFiles,
            triggerType,
            performanceTimeout
        };
        
        if (dryRun) {
            // For dry run, we just create the coordination plan without executing
            const impactMapper = new ImpactMapper(projectRoot);
            const prediction = await impactMapper.predictChangeImpact(changedFiles);
            
            return {
                success: true,
                dryRun: true,
                coordinationPlan: {
                    totalAffectedDomains: prediction.impactGraph.nodes.length,
                    estimatedTotalTime: Math.round(prediction.impactGraph.totalEstimatedTime / 60),
                    updateSequence: prediction.updateSequence,
                    riskFactors: prediction.riskFactors.length,
                    recommendations: prediction.recommendations
                },
                timestamp: new Date().toISOString()
            };
        }
        
        const result = await coordinator.coordinateUpdate(request);
        
        return {
            success: result.success,
            coordination: {
                planId: result.planId,
                executedPhases: result.executedPhases,
                totalPhases: result.totalPhases,
                executionTime: Math.round(result.executionTime / 1000),
                updatedDomains: result.updatedDomains,
                failedDomains: result.failedDomains,
                rollbackRequired: result.rollbackRequired,
                rollbackCompleted: result.rollbackCompleted,
                performanceMetrics: {
                    analysisTime: Math.round(result.performanceMetrics.analysisTime / 1000),
                    coordinationTime: Math.round(result.performanceMetrics.coordinationTime / 1000),
                    executionTime: Math.round(result.performanceMetrics.executionTime / 1000),
                    validationTime: Math.round(result.performanceMetrics.validationTime / 1000)
                }
            },
            coordinationLogs: result.coordinationLogs.slice(-10), // Last 10 log entries
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

export async function handleAnalyzeSpecificDomainsImpact(args: any): Promise<any> {
    const { 
        sourceDomains, 
        targetDomains, 
        projectRoot = '.', 
        includeTransitiveImpacts = true, 
        maxPropagationDepth = 4 
    } = args;
    
    try {
        const domainAnalyzer = new DomainAnalyzer(projectRoot);
        
        // Get the domain map first
        const domainMap = await domainAnalyzer.analyzeDomainMap();
        
        // Filter relationships based on source domains
        const relevantRelationships = domainMap.relationships.filter(rel =>
            sourceDomains.includes(rel.sourceDomain) ||
            (targetDomains && targetDomains.includes(rel.targetDomain))
        );
        
        // Build impact analysis
        const directImpacts = new Set<string>();
        const transitiveImpacts = new Map<string, number>(); // domain -> depth
        
        // Add direct impacts
        for (const rel of relevantRelationships) {
            if (sourceDomains.includes(rel.sourceDomain)) {
                directImpacts.add(rel.targetDomain);
            }
        }
        
        // Add transitive impacts if requested
        if (includeTransitiveImpacts) {
            const visited = new Set<string>();
            const queue: { domain: string; depth: number }[] = [];
            
            // Initialize queue with direct impacts
            for (const directDomain of directImpacts) {
                queue.push({ domain: directDomain, depth: 1 });
                transitiveImpacts.set(directDomain, 1);
            }
            
            while (queue.length > 0) {
                const { domain: currentDomain, depth } = queue.shift()!;
                
                if (depth >= maxPropagationDepth || visited.has(currentDomain)) {
                    continue;
                }
                
                visited.add(currentDomain);
                
                // Find domains this one impacts
                const nextLevel = domainMap.relationships
                    .filter(rel => rel.sourceDomain === currentDomain)
                    .map(rel => rel.targetDomain);
                
                for (const nextDomain of nextLevel) {
                    if (!transitiveImpacts.has(nextDomain) || transitiveImpacts.get(nextDomain)! > depth + 1) {
                        transitiveImpacts.set(nextDomain, depth + 1);
                        queue.push({ domain: nextDomain, depth: depth + 1 });
                    }
                }
            }
        }
        
        // Build propagation paths
        const propagationPaths: string[][] = [];
        for (const sourceDomain of sourceDomains) {
            const paths = findPropagationPaths(sourceDomain, domainMap.relationships, maxPropagationDepth);
            propagationPaths.push(...paths);
        }
        
        return {
            success: true,
            impactAnalysis: {
                sourceDomains,
                targetDomains: targetDomains || Array.from(directImpacts),
                directImpacts: Array.from(directImpacts),
                transitiveImpacts: includeTransitiveImpacts ? 
                    Array.from(transitiveImpacts.entries()).map(([domain, depth]) => ({ domain, depth })) : [],
                propagationPaths,
                totalImpactedDomains: transitiveImpacts.size,
                maxPropagationDepth: Math.max(...Array.from(transitiveImpacts.values()), 0),
                relevantRelationships: relevantRelationships.map(rel => ({
                    source: rel.sourceDomain,
                    target: rel.targetDomain,
                    type: rel.relationshipType,
                    strength: rel.strength
                }))
            },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

export async function handleGetCrossDomainCoordinationStatus(args: any): Promise<any> {
    const { planId, projectRoot = '.', includeDetailedMetrics = false } = args;
    
    try {
        const coordinator = new CrossDomainCoordinator(projectRoot);
        
        if (planId) {
            // Get specific plan status
            const plan = coordinator.getCoordinationPlan(planId);
            
            if (!plan) {
                return {
                    success: false,
                    error: `Coordination plan ${planId} not found`,
                    timestamp: new Date().toISOString()
                };
            }
            
            const response = {
                success: true,
                plan: {
                    planId: plan.planId,
                    createdAt: plan.createdAt,
                    totalDomains: plan.coordinationPlan.length,
                    executionPhases: plan.executionPhases.length,
                    totalEstimatedTime: Math.round(plan.totalEstimatedTime / 60),
                    riskAssessment: plan.riskAssessment,
                    rollbackStrategy: plan.rollbackStrategy,
                    domainStatuses: plan.coordinationPlan.map(coord => ({
                        domain: coord.domain,
                        phase: coord.updatePhase,
                        strategy: coord.coordinationStrategy.name,
                        riskLevel: coord.coordinationStrategy.riskLevel,
                        dependencies: coord.dependencies,
                        dependents: coord.dependents,
                        hasErrors: coord.errors && coord.errors.length > 0
                    }))
                },
                timestamp: new Date().toISOString()
            };
            
            if (includeDetailedMetrics) {
                (response.plan as any).detailedMetrics = {
                    impactNodes: plan.impactPrediction.impactGraph.nodes.length,
                    impactEdges: plan.impactPrediction.impactGraph.edges.length,
                    criticalPath: plan.impactPrediction.impactGraph.criticalPath,
                    confidenceScore: plan.impactPrediction.confidenceScore,
                    riskFactors: plan.impactPrediction.riskFactors.map(risk => ({
                        type: risk.type,
                        severity: risk.severity,
                        affectedDomains: risk.affectedDomains.length
                    }))
                };
            }
            
            return response;
            
        } else {
            // Get all active coordinations
            const activeCoordinations = coordinator.getActiveCoordinations();
            
            return {
                success: true,
                activeCoordinations: {
                    count: activeCoordinations.length,
                    planIds: activeCoordinations,
                    hasActiveCoordinations: activeCoordinations.length > 0
                },
                timestamp: new Date().toISOString()
            };
        }
        
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Get all cross-domain impact analysis tools
 */
export function getCrossDomainImpactAnalysisTools(): Tool[] {
    return [
        analyzedomainmapTool,
        predictchangeimpactTool,
        coordinatecrossdomainupdateTool,
        analyzespecificdomainsimpactTool,
        getcrossdomaincoordinationstatusTool
    ];
}

/**
 * Get tool handlers map
 */
export function getCrossDomainImpactAnalysisHandlers(): Map<string, (args: any) => Promise<any>> {
    return new Map([
        ['analyze-domain-map', handleAnalyzeDomainMap],
        ['predict-change-impact', handlePredictChangeImpact],
        ['coordinate-cross-domain-update', handleCoordinateCrossDomainUpdate],
        ['analyze-specific-domains-impact', handleAnalyzeSpecificDomainsImpact],
        ['get-cross-domain-coordination-status', handleGetCrossDomainCoordinationStatus]
    ]);
}

/**
 * Helper functions
 */

function getNodeColor(confidence: number): string {
    if (confidence > 0.8) return '#4CAF50'; // Green
    if (confidence > 0.6) return '#FF9800'; // Orange
    if (confidence > 0.4) return '#FFC107'; // Amber
    return '#F44336'; // Red
}

function getEdgeColor(strength: number): string {
    if (strength > 0.7) return '#2196F3'; // Blue
    if (strength > 0.5) return '#9C27B0'; // Purple
    if (strength > 0.3) return '#607D8B'; // Blue Grey
    return '#9E9E9E'; // Grey
}

function findPropagationPaths(
    sourceDomain: string,
    relationships: any[],
    maxDepth: number,
    currentPath: string[] = [],
    visited: Set<string> = new Set()
): string[][] {
    if (currentPath.length >= maxDepth || visited.has(sourceDomain)) {
        return currentPath.length > 1 ? [currentPath] : [];
    }
    
    const paths: string[][] = [];
    const newPath = [...currentPath, sourceDomain];
    const newVisited = new Set(visited);
    newVisited.add(sourceDomain);
    
    // Find all domains this one directly impacts
    const directTargets = relationships
        .filter(rel => rel.sourceDomain === sourceDomain)
        .map(rel => rel.targetDomain);
    
    if (directTargets.length === 0) {
        // End of path
        if (newPath.length > 1) {
            paths.push(newPath);
        }
        return paths;
    }
    
    for (const target of directTargets) {
        const subPaths = findPropagationPaths(target, relationships, maxDepth, newPath, newVisited);
        paths.push(...subPaths);
    }
    
    return paths;
}
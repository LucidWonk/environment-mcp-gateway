import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * MCP Tools for Cross-Domain Impact Analysis
 * Provides comprehensive impact analysis and coordination capabilities
 */
export declare const analyzedomainmapTool: Tool;
export declare const predictchangeimpactTool: Tool;
export declare const coordinatecrossdomainupdateTool: Tool;
export declare const analyzespecificdomainsimpactTool: Tool;
export declare const getcrossdomaincoordinationstatusTool: Tool;
/**
 * Tool handlers for cross-domain impact analysis
 */
export declare function handleAnalyzeDomainMap(args: any): Promise<any>;
export declare function handlePredictChangeImpact(args: any): Promise<any>;
export declare function handleCoordinateCrossDomainUpdate(args: any): Promise<any>;
export declare function handleAnalyzeSpecificDomainsImpact(args: any): Promise<any>;
export declare function handleGetCrossDomainCoordinationStatus(args: any): Promise<any>;
/**
 * Get all cross-domain impact analysis tools
 */
export declare function getCrossDomainImpactAnalysisTools(): Tool[];
/**
 * Get tool handlers map
 */
export declare function getCrossDomainImpactAnalysisHandlers(): Map<string, (args: any) => Promise<any>>;
//# sourceMappingURL=cross-domain-impact-analysis.d.ts.map
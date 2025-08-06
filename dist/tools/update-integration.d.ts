/**
 * MCP Tools for Update Integration
 * Coordinates holistic context updates with cross-domain impact analysis
 * Implements TEMP-CONTEXT-ENGINE-a7b3 integration capabilities
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Execute integrated update workflow tool
 */
export declare const executeIntegratedUpdateTool: Tool;
/**
 * Get integration status tool
 */
export declare const getIntegrationStatusTool: Tool;
/**
 * Validate integration prerequisites tool
 */
export declare const validateIntegrationPrerequisitesTool: Tool;
/**
 * Get event statistics tool
 */
export declare const getEventStatisticsTool: Tool;
/**
 * Tool handlers for update integration
 */
export declare function handleExecuteIntegratedUpdate(args: any): Promise<any>;
export declare function handleGetIntegrationStatus(args: any): Promise<any>;
export declare function handleValidateIntegrationPrerequisites(args: any): Promise<any>;
export declare function handleGetEventStatistics(args: any): Promise<any>;
/**
 * Get all update integration tools
 */
export declare function getUpdateIntegrationTools(): Tool[];
/**
 * Get tool handlers map
 */
export declare function getUpdateIntegrationHandlers(): Map<string, (args: any) => Promise<any>>;
//# sourceMappingURL=update-integration.d.ts.map
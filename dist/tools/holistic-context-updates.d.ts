import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * MCP Tool: Execute holistic context update across all affected domains
 */
export declare const executeHolisticContextUpdateTool: Tool;
/**
 * MCP Tool: Execute full repository re-indexing with cleanup
 */
export declare const executeFullRepositoryReindexTool: Tool;
/**
 * MCP Tool: Get holistic update status and history
 */
export declare const getHolisticUpdateStatusTool: Tool;
/**
 * MCP Tool: Execute rollback for failed holistic update
 */
export declare const rollbackHolisticUpdateTool: Tool;
/**
 * MCP Tool: Validate holistic update configuration
 */
export declare const validateHolisticUpdateConfigTool: Tool;
/**
 * MCP Tool: Perform holistic update maintenance
 */
export declare const performHolisticUpdateMaintenanceTool: Tool;
/**
 * Tool implementations
 */
export declare function handleExecuteHolisticContextUpdate(args: any): Promise<any>;
export declare function handleGetHolisticUpdateStatus(args: any): Promise<any>;
export declare function handleRollbackHolisticUpdate(args: any): Promise<any>;
export declare function handleValidateHolisticUpdateConfig(args: any): Promise<any>;
export declare function handlePerformHolisticUpdateMaintenance(args: any): Promise<any>;
/**
 * Handler for full repository re-indexing with cleanup
 */
export declare function handleExecuteFullRepositoryReindex(args: any): Promise<any>;
//# sourceMappingURL=holistic-context-updates.d.ts.map
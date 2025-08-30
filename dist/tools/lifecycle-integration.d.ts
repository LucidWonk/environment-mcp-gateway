/**
 * Lifecycle Integration MCP Tools
 * MCP tools for coordinated lifecycle operations between document and registry systems
 * Implements TEMP-CONTEXT-ENGINE-a7b3 lifecycle integration capability
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Create coordination plan for lifecycle operation
 */
export declare const createLifecycleCoordinationPlan: Tool;
export declare function handleCreateLifecycleCoordinationPlan(args: any): Promise<any>;
/**
 * Execute coordinated lifecycle operation
 */
export declare const executeCoordinatedOperation: Tool;
export declare function handleExecuteCoordinatedOperation(args: any): Promise<any>;
/**
 * Get coordination operation status
 */
export declare const getCoordinationStatus: Tool;
export declare function handleGetCoordinationStatus(args: any): Promise<any>;
/**
 * Rollback coordinated operation
 */
export declare const rollbackCoordinatedOperation: Tool;
export declare function handleRollbackCoordinatedOperation(args: any): Promise<any>;
/**
 * Discover NewConcepts ready for migration
 */
export declare const discoverNewConcepts: Tool;
export declare function handleDiscoverNewConcepts(args: any): Promise<any>;
/**
 * Initiate NewConcepts migration
 */
export declare const initiateNewConceptsMigration: Tool;
export declare function handleInitiateNewConceptsMigration(args: any): Promise<any>;
/**
 * Get NewConcepts migration status
 */
export declare const getNewConceptsMigrationStatus: Tool;
export declare function handleGetNewConceptsMigrationStatus(args: any): Promise<any>;
/**
 * List all active coordinations
 */
export declare const listActiveCoordinations: Tool;
export declare function handleListActiveCoordinations(args: any): Promise<any>;
export declare const lifecycleIntegrationTools: {
    'create-lifecycle-coordination-plan': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'execute-coordinated-operation': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'get-coordination-status': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'rollback-coordinated-operation': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'discover-newconcepts': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'initiate-newconcepts-migration': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'get-newconcepts-migration-status': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
    'list-active-coordinations': {
        [x: string]: unknown;
        name: string;
        inputSchema: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        };
        description?: string | undefined;
        title?: string | undefined;
        outputSchema?: {
            [x: string]: unknown;
            type: "object";
            required?: string[] | undefined;
            properties?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
        annotations?: {
            [x: string]: unknown;
            title?: string | undefined;
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    };
};
export declare const lifecycleIntegrationHandlers: {
    'create-lifecycle-coordination-plan': typeof handleCreateLifecycleCoordinationPlan;
    'execute-coordinated-operation': typeof handleExecuteCoordinatedOperation;
    'get-coordination-status': typeof handleGetCoordinationStatus;
    'rollback-coordinated-operation': typeof handleRollbackCoordinatedOperation;
    'discover-newconcepts': typeof handleDiscoverNewConcepts;
    'initiate-newconcepts-migration': typeof handleInitiateNewConceptsMigration;
    'get-newconcepts-migration-status': typeof handleGetNewConceptsMigrationStatus;
    'list-active-coordinations': typeof handleListActiveCoordinations;
};
//# sourceMappingURL=lifecycle-integration.d.ts.map
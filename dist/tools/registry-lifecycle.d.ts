/**
 * Registry Lifecycle MCP Tools
 * MCP tools for registry management, placeholder tracking, and validation
 * Implements TEMP-CONTEXT-ENGINE-a7b3 registry lifecycle capability
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Generate new placeholder ID
 */
export declare const generatePlaceholderID: Tool;
export declare function handleGeneratePlaceholderID(args: any): Promise<any>;
/**
 * Track placeholder lifecycle transition
 */
export declare const transitionPlaceholderLifecycle: Tool;
export declare function handleTransitionPlaceholderLifecycle(args: any): Promise<any>;
/**
 * Propose capability conversion
 */
export declare const proposeCapabilityConversion: Tool;
export declare function handleProposeCapabilityConversion(args: any): Promise<any>;
/**
 * Execute approved capability conversion
 */
export declare const executeCapabilityConversion: Tool;
export declare function handleExecuteCapabilityConversion(args: any): Promise<any>;
/**
 * Validate registry consistency
 */
export declare const validateRegistryConsistency: Tool;
export declare function handleValidateRegistryConsistency(args: any): Promise<any>;
/**
 * Get registry statistics
 */
export declare const getRegistryStatistics: Tool;
export declare function handleGetRegistryStatistics(args: any): Promise<any>;
/**
 * Get placeholder information
 */
export declare const getPlaceholderInfo: Tool;
export declare function handleGetPlaceholderInfo(args: any): Promise<any>;
export declare const registryLifecycleTools: {
    'generate-placeholder-id': {
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
    'transition-placeholder-lifecycle': {
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
    'propose-capability-conversion': {
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
    'execute-capability-conversion': {
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
    'validate-registry-consistency': {
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
    'get-registry-statistics': {
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
    'get-placeholder-info': {
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
export declare const registryLifecycleHandlers: {
    'generate-placeholder-id': typeof handleGeneratePlaceholderID;
    'transition-placeholder-lifecycle': typeof handleTransitionPlaceholderLifecycle;
    'propose-capability-conversion': typeof handleProposeCapabilityConversion;
    'execute-capability-conversion': typeof handleExecuteCapabilityConversion;
    'validate-registry-consistency': typeof handleValidateRegistryConsistency;
    'get-registry-statistics': typeof handleGetRegistryStatistics;
    'get-placeholder-info': typeof handleGetPlaceholderInfo;
};
//# sourceMappingURL=registry-lifecycle.d.ts.map
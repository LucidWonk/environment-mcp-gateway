/**
 * Document Lifecycle MCP Tools
 * MCP tools for document migration, approval workflow, and archive management
 * Implements TEMP-CONTEXT-ENGINE-a7b3 document lifecycle capability
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Analyze document for migration readiness
 */
export declare const analyzeDocumentMigrationReadiness: Tool;
export declare function handleAnalyzeDocumentMigrationReadiness(args: any): Promise<any>;
/**
 * Generate migration proposal for human approval
 */
export declare const generateMigrationProposal: Tool;
export declare function handleGenerateMigrationProposal(args: any): Promise<any>;
/**
 * Check approval status and execute migration if approved
 */
export declare const executeMigrationIfApproved: Tool;
export declare function handleExecuteMigrationIfApproved(args: any): Promise<any>;
/**
 * Get approval workflow status and details
 */
export declare const getApprovalWorkflowStatus: Tool;
export declare function handleGetApprovalWorkflowStatus(args: any): Promise<any>;
/**
 * Submit approval response
 */
export declare const submitApprovalResponse: Tool;
export declare function handleSubmitApprovalResponse(args: any): Promise<any>;
/**
 * Search archived documents
 */
export declare const searchArchivedDocuments: Tool;
export declare function handleSearchArchivedDocuments(args: any): Promise<any>;
/**
 * Retrieve archived document content
 */
export declare const retrieveArchivedDocument: Tool;
export declare function handleRetrieveArchivedDocument(args: any): Promise<any>;
export declare const documentLifecycleTools: {
    'analyze-document-migration-readiness': {
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
    'generate-migration-proposal': {
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
    'execute-migration-if-approved': {
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
    'get-approval-workflow-status': {
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
    'submit-approval-response': {
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
    'search-archived-documents': {
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
    'retrieve-archived-document': {
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
export declare const documentLifecycleHandlers: {
    'analyze-document-migration-readiness': typeof handleAnalyzeDocumentMigrationReadiness;
    'generate-migration-proposal': typeof handleGenerateMigrationProposal;
    'execute-migration-if-approved': typeof handleExecuteMigrationIfApproved;
    'get-approval-workflow-status': typeof handleGetApprovalWorkflowStatus;
    'submit-approval-response': typeof handleSubmitApprovalResponse;
    'search-archived-documents': typeof handleSearchArchivedDocuments;
    'retrieve-archived-document': typeof handleRetrieveArchivedDocument;
};
//# sourceMappingURL=document-lifecycle.d.ts.map
import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * MCP Tools for Context Generation
 * Part of Context Engineering Enhancement system (TEMP-CONTEXT-ENGINE-a7b3)
 * Integrates semantic analysis results with context file generation
 */
/**
 * Generate enhanced context files from semantic analysis results
 * Business Rule: Context files must include semantic information and business rules
 * Performance Requirement: Must complete within 5 seconds for typical usage
 */
export declare const generateContextFilesTool: Tool;
export declare function handleGenerateContextFiles(args: any): Promise<any>;
/**
 * Preview context file generation without writing files
 * Business Rule: Must provide preview capability for validation before generation
 */
export declare const previewContextFilesTool: Tool;
export declare function handlePreviewContextFiles(args: any): Promise<any>;
/**
 * Validate existing context files for quality and completeness
 * Business Rule: Must provide validation of context file quality and accuracy
 */
export declare const validateContextFilesTool: Tool;
export declare function handleValidateContextFiles(args: any): Promise<any>;
export declare const contextGenerationTools: {
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
}[];
export declare const contextGenerationHandlers: {
    'generate-context-files': typeof handleGenerateContextFiles;
    'preview-context-files': typeof handlePreviewContextFiles;
    'validate-context-files': typeof handleValidateContextFiles;
};
//# sourceMappingURL=context-generation.d.ts.map
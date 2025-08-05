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
export declare const contextGenerationTools: import("zod").objectOutputType<{
    name: import("zod").ZodString;
    description: import("zod").ZodOptional<import("zod").ZodString>;
    inputSchema: import("zod").ZodObject<{
        type: import("zod").ZodLiteral<"object">;
        properties: import("zod").ZodOptional<import("zod").ZodObject<{}, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{}, import("zod").ZodTypeAny, "passthrough">>>;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        type: import("zod").ZodLiteral<"object">;
        properties: import("zod").ZodOptional<import("zod").ZodObject<{}, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{}, import("zod").ZodTypeAny, "passthrough">>>;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        type: import("zod").ZodLiteral<"object">;
        properties: import("zod").ZodOptional<import("zod").ZodObject<{}, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{}, import("zod").ZodTypeAny, "passthrough">>>;
    }, import("zod").ZodTypeAny, "passthrough">>;
}, import("zod").ZodTypeAny, "passthrough">[];
export declare const contextGenerationHandlers: {
    'generate-context-files': typeof handleGenerateContextFiles;
    'preview-context-files': typeof handlePreviewContextFiles;
    'validate-context-files': typeof handleValidateContextFiles;
};
//# sourceMappingURL=context-generation.d.ts.map
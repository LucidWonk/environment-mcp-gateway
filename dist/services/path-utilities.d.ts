export interface PathResolutionResult {
    resolvedPath: string;
    exists: boolean;
    isDirectory: boolean;
    caseMatchIssues: string[];
    alternativePaths: string[];
}
export interface PathValidationOptions {
    requireExists?: boolean;
    requireDirectory?: boolean;
    caseSensitive?: boolean;
    createIfMissing?: boolean;
    logIssues?: boolean;
}
/**
 * Comprehensive path utilities for handling cross-platform path issues,
 * case sensitivity problems, and Docker volume mount inconsistencies
 */
export declare class PathUtilities {
    private static readonly COMMON_PATH_MAPPINGS;
    /**
     * Resolve path with comprehensive fallback handling
     */
    static resolvePath(inputPath: string, options?: PathValidationOptions): Promise<PathResolutionResult>;
    /**
     * Find alternative paths based on common mappings
     */
    private static findAlternativePaths;
    /**
     * Generate environment-specific path alternatives
     */
    private static generateEnvironmentAlternatives;
    /**
     * Find case variations of a path
     */
    private static findCaseVariations;
    /**
     * Check if path exists with proper error handling
     */
    private static pathExists;
    /**
     * Normalize path separators for cross-platform compatibility
     */
    static normalizePath(inputPath: string): string;
    /**
     * Get project root path with fallback resolution
     */
    static getProjectRoot(): Promise<string>;
    /**
     * Validate and resolve domain context path
     */
    static resolveDomainContextPath(domain: string, projectRoot?: string): Promise<string>;
    /**
     * Get comprehensive path diagnostic information
     */
    static getDiagnostics(inputPath: string): Promise<Record<string, any>>;
}
//# sourceMappingURL=path-utilities.d.ts.map
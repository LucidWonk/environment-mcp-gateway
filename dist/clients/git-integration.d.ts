import { SemanticAnalysisResult } from '../services/semantic-analysis.js';
export interface GitChangeAnalysis {
    changedFiles: string[];
    semanticAnalysisResults: SemanticAnalysisResult[];
    affectedDomains: string[];
    analysisTime: number;
    cacheHit: boolean;
}
export interface AnalysisCache {
    fileHash: string;
    lastModified: number;
    analysisResult: SemanticAnalysisResult;
}
export declare class GitIntegrationClient {
    private readonly semanticAnalysis;
    private readonly cacheDir;
    private readonly maxCacheAge;
    private readonly analysisTimeLimit;
    constructor();
    /**
     * Analyze git changes for semantic meaning and context updates
     */
    analyzeGitChanges(): Promise<GitChangeAnalysis>;
    /**
     * Get list of files changed in the current git staging area
     */
    private getChangedFiles;
    /**
     * Filter files for semantic analysis (C#, TypeScript, JavaScript)
     */
    private filterRelevantFiles;
    /**
     * Perform semantic analysis with caching for performance
     */
    private performSemanticAnalysisWithCache;
    /**
     * Get cached analysis result if valid
     */
    private getCachedAnalysis;
    /**
     * Cache analysis result for future use
     */
    private cacheAnalysis;
    /**
     * Determine affected domains from semantic analysis results
     */
    private determineAffectedDomains;
    /**
     * Clean up old cache files
     */
    cleanupCache(): Promise<void>;
    /**
     * Get cache file path for a source file
     */
    private getCacheFilePath;
    /**
     * Generate a hash for file path to use as cache key
     */
    private generateFileHash;
    /**
     * Ensure cache directory exists
     */
    private ensureCacheDirectory;
    /**
     * Check if analysis should run based on performance constraints
     */
    shouldRunAnalysis(changedFiles: string[]): boolean;
}
//# sourceMappingURL=git-integration.d.ts.map
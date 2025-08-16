import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { SemanticAnalysisService, SemanticAnalysisResult } from '../services/semantic-analysis.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('mcp-gateway.log');

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

export class GitIntegrationClient {
    private readonly semanticAnalysis: SemanticAnalysisService;
    private readonly cacheDir = '.semantic-cache';
    private readonly maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    private readonly analysisTimeLimit = 30 * 1000; // 30 seconds total

    constructor() {
        this.semanticAnalysis = new SemanticAnalysisService();
        this.ensureCacheDirectory();
    }

    /**
     * Analyze git changes for semantic meaning and context updates
     */
    public async analyzeGitChanges(): Promise<GitChangeAnalysis> {
        const startTime = Date.now();
        logger.info('Starting git change analysis');

        try {
            // Get changed files from git
            const changedFiles = this.getChangedFiles();
            logger.info(`Found ${changedFiles.length} changed files`);

            if (changedFiles.length === 0) {
                return {
                    changedFiles: [],
                    semanticAnalysisResults: [],
                    affectedDomains: [],
                    analysisTime: Date.now() - startTime,
                    cacheHit: false
                };
            }

            // Filter for relevant files (C#, TypeScript)
            const relevantFiles = this.filterRelevantFiles(changedFiles);
            logger.info(`Analyzing ${relevantFiles.length} relevant files`);

            // Perform semantic analysis with caching
            const { results, cacheHit } = await this.performSemanticAnalysisWithCache(relevantFiles);

            // Determine affected domains
            const affectedDomains = this.determineAffectedDomains(results);

            const analysisTime = Date.now() - startTime;
            logger.info(`Git change analysis completed in ${analysisTime}ms`);

            return {
                changedFiles,
                semanticAnalysisResults: results,
                affectedDomains,
                analysisTime,
                cacheHit
            };

        } catch (error) {
            logger.error('Error during git change analysis:', error);
            throw error;
        }
    }

    /**
     * Get list of files changed in the current git staging area
     */
    private getChangedFiles(): string[] {
        try {
            // Get staged files
            const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
                .trim()
                .split('\n')
                .filter(file => file.length > 0);

            // Get modified but unstaged files
            const modifiedFiles = execSync('git diff --name-only', { encoding: 'utf-8' })
                .trim()
                .split('\n')
                .filter(file => file.length > 0);

            // Combine and deduplicate
            const allFiles = [...new Set([...stagedFiles, ...modifiedFiles])];
            
            // Convert to absolute paths
            const rootDir = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
            return allFiles.map(file => path.resolve(rootDir, file));

        } catch (error) {
            logger.error('Error getting changed files from git:', error);
            return [];
        }
    }

    /**
     * Filter files for semantic analysis (C#, TypeScript, JavaScript)
     */
    private filterRelevantFiles(files: string[]): string[] {
        const relevantExtensions = ['.cs', '.ts', '.js'];
        
        return files.filter(file => {
            if (!fs.existsSync(file)) {
                logger.warn(`File no longer exists: ${file}`);
                return false;
            }

            const ext = path.extname(file).toLowerCase();
            return relevantExtensions.includes(ext);
        });
    }

    /**
     * Perform semantic analysis with caching for performance
     */
    private async performSemanticAnalysisWithCache(files: string[]): Promise<{
        results: SemanticAnalysisResult[];
        cacheHit: boolean;
    }> {
        const results: SemanticAnalysisResult[] = [];
        let totalCacheHits = 0;

        for (const file of files) {
            // Check if we have a valid cached result
            const cachedResult = await this.getCachedAnalysis(file);
            
            if (cachedResult) {
                results.push(cachedResult.analysisResult);
                totalCacheHits++;
                logger.debug(`Using cached analysis for ${file}`);
            } else {
                // Perform fresh analysis
                try {
                    const analysisResults = await this.semanticAnalysis.analyzeCodeChanges([file]);
                    if (analysisResults.length > 0) {
                        results.push(analysisResults[0]);
                        // Cache the result
                        await this.cacheAnalysis(file, analysisResults[0]);
                        logger.debug(`Fresh analysis completed for ${file}`);
                    }
                } catch (error) {
                    logger.error(`Failed to analyze ${file}:`, error);
                    // Continue with other files
                }
            }
        }

        return {
            results,
            cacheHit: totalCacheHits > 0
        };
    }

    /**
     * Get cached analysis result if valid
     */
    private async getCachedAnalysis(filePath: string): Promise<AnalysisCache | null> {
        try {
            const cacheFile = this.getCacheFilePath(filePath);
            
            if (!fs.existsSync(cacheFile)) {
                return null;
            }

            const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as AnalysisCache;
            
            // Check if cache is still valid
            const fileStats = fs.statSync(filePath);
            const cacheAge = Date.now() - cachedData.lastModified;
            
            if (fileStats.mtime.getTime() <= cachedData.lastModified && cacheAge < this.maxCacheAge) {
                return cachedData;
            }

            // Cache is stale, remove it
            fs.unlinkSync(cacheFile);
            return null;

        } catch (error) {
            logger.warn(`Error reading cache for ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Cache analysis result for future use
     */
    private async cacheAnalysis(filePath: string, result: SemanticAnalysisResult): Promise<void> {
        try {
            const cacheFile = this.getCacheFilePath(filePath);
            const _fileStats = fs.statSync(filePath);
            
            const cacheData: AnalysisCache = {
                fileHash: this.generateFileHash(filePath),
                lastModified: Date.now(),
                analysisResult: result
            };

            fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
            logger.debug(`Cached analysis result for ${filePath}`);

        } catch (error) {
            logger.warn(`Error caching analysis for ${filePath}:`, error);
        }
    }

    /**
     * Determine affected domains from semantic analysis results
     */
    private determineAffectedDomains(results: SemanticAnalysisResult[]): string[] {
        const domains = new Set<string>();

        for (const result of results) {
            if (result.domainContext && result.domainContext !== 'Unknown') {
                domains.add(result.domainContext);
            }

            // Also extract domains from business concepts
            for (const concept of result.businessConcepts) {
                if (concept.domain && concept.domain !== 'Unknown') {
                    domains.add(concept.domain);
                }
            }
        }

        return Array.from(domains);
    }

    /**
     * Clean up old cache files
     */
    public async cleanupCache(): Promise<void> {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                return;
            }

            const files = fs.readdirSync(this.cacheDir);
            const now = Date.now();
            let cleanedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > this.maxCacheAge) {
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                logger.info(`Cleaned up ${cleanedCount} expired cache files`);
            }

        } catch (error) {
            logger.warn('Error during cache cleanup:', error);
        }
    }

    /**
     * Get cache file path for a source file
     */
    private getCacheFilePath(filePath: string): string {
        const hash = this.generateFileHash(filePath);
        return path.join(this.cacheDir, `${hash}.json`);
    }

    /**
     * Generate a hash for file path to use as cache key
     */
    private generateFileHash(filePath: string): string {
        // Simple hash function for file path
        let hash = 0;
        for (let i = 0; i < filePath.length; i++) {
            const char = filePath.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Ensure cache directory exists
     */
    private ensureCacheDirectory(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Check if analysis should run based on performance constraints
     */
    public shouldRunAnalysis(changedFiles: string[]): boolean {
        // Don't run if too many files changed (likely a merge or major refactor)
        if (changedFiles.length > 50) {
            logger.info(`Skipping analysis - too many files changed (${changedFiles.length})`);
            return false;
        }

        // Don't run if git is in middle of rebase, merge, etc.
        try {
            const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
            const conflictMarkers = [
                path.join(gitDir, 'MERGE_HEAD'),
                path.join(gitDir, 'REBASE_HEAD'),
                path.join(gitDir, 'CHERRY_PICK_HEAD')
            ];

            for (const marker of conflictMarkers) {
                if (fs.existsSync(marker)) {
                    logger.info('Skipping analysis - git operation in progress');
                    return false;
                }
            }

            return true;

        } catch (error) {
            logger.warn('Error checking git state:', error);
            return false;
        }
    }
}
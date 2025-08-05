"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitIntegrationClient = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const winston_1 = __importDefault(require("winston"));
const environment_js_1 = require("../domain/config/environment.js");
const semantic_analysis_js_1 = require("../services/semantic-analysis.js");
const logger = winston_1.default.createLogger({
    level: environment_js_1.Environment.mcpLogLevel,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'git-integration.log' })
    ]
});
class GitIntegrationClient {
    semanticAnalysis;
    cacheDir = '.semantic-cache';
    maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    analysisTimeLimit = 30 * 1000; // 30 seconds total
    constructor() {
        this.semanticAnalysis = new semantic_analysis_js_1.SemanticAnalysisService();
        this.ensureCacheDirectory();
    }
    /**
     * Analyze git changes for semantic meaning and context updates
     */
    async analyzeGitChanges() {
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
        }
        catch (error) {
            logger.error('Error during git change analysis:', error);
            throw error;
        }
    }
    /**
     * Get list of files changed in the current git staging area
     */
    getChangedFiles() {
        try {
            // Get staged files
            const stagedFiles = (0, child_process_1.execSync)('git diff --cached --name-only', { encoding: 'utf-8' })
                .trim()
                .split('\n')
                .filter(file => file.length > 0);
            // Get modified but unstaged files
            const modifiedFiles = (0, child_process_1.execSync)('git diff --name-only', { encoding: 'utf-8' })
                .trim()
                .split('\n')
                .filter(file => file.length > 0);
            // Combine and deduplicate
            const allFiles = [...new Set([...stagedFiles, ...modifiedFiles])];
            // Convert to absolute paths
            const rootDir = (0, child_process_1.execSync)('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
            return allFiles.map(file => path.resolve(rootDir, file));
        }
        catch (error) {
            logger.error('Error getting changed files from git:', error);
            return [];
        }
    }
    /**
     * Filter files for semantic analysis (C#, TypeScript, JavaScript)
     */
    filterRelevantFiles(files) {
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
    async performSemanticAnalysisWithCache(files) {
        const results = [];
        let totalCacheHits = 0;
        for (const file of files) {
            // Check if we have a valid cached result
            const cachedResult = await this.getCachedAnalysis(file);
            if (cachedResult) {
                results.push(cachedResult.analysisResult);
                totalCacheHits++;
                logger.debug(`Using cached analysis for ${file}`);
            }
            else {
                // Perform fresh analysis
                try {
                    const analysisResults = await this.semanticAnalysis.analyzeCodeChanges([file]);
                    if (analysisResults.length > 0) {
                        results.push(analysisResults[0]);
                        // Cache the result
                        await this.cacheAnalysis(file, analysisResults[0]);
                        logger.debug(`Fresh analysis completed for ${file}`);
                    }
                }
                catch (error) {
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
    async getCachedAnalysis(filePath) {
        try {
            const cacheFile = this.getCacheFilePath(filePath);
            if (!fs.existsSync(cacheFile)) {
                return null;
            }
            const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
            // Check if cache is still valid
            const fileStats = fs.statSync(filePath);
            const cacheAge = Date.now() - cachedData.lastModified;
            if (fileStats.mtime.getTime() <= cachedData.lastModified && cacheAge < this.maxCacheAge) {
                return cachedData;
            }
            // Cache is stale, remove it
            fs.unlinkSync(cacheFile);
            return null;
        }
        catch (error) {
            logger.warn(`Error reading cache for ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Cache analysis result for future use
     */
    async cacheAnalysis(filePath, result) {
        try {
            const cacheFile = this.getCacheFilePath(filePath);
            const _fileStats = fs.statSync(filePath);
            const cacheData = {
                fileHash: this.generateFileHash(filePath),
                lastModified: Date.now(),
                analysisResult: result
            };
            fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
            logger.debug(`Cached analysis result for ${filePath}`);
        }
        catch (error) {
            logger.warn(`Error caching analysis for ${filePath}:`, error);
        }
    }
    /**
     * Determine affected domains from semantic analysis results
     */
    determineAffectedDomains(results) {
        const domains = new Set();
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
    async cleanupCache() {
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
        }
        catch (error) {
            logger.warn('Error during cache cleanup:', error);
        }
    }
    /**
     * Get cache file path for a source file
     */
    getCacheFilePath(filePath) {
        const hash = this.generateFileHash(filePath);
        return path.join(this.cacheDir, `${hash}.json`);
    }
    /**
     * Generate a hash for file path to use as cache key
     */
    generateFileHash(filePath) {
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
    ensureCacheDirectory() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
    /**
     * Check if analysis should run based on performance constraints
     */
    shouldRunAnalysis(changedFiles) {
        // Don't run if too many files changed (likely a merge or major refactor)
        if (changedFiles.length > 50) {
            logger.info(`Skipping analysis - too many files changed (${changedFiles.length})`);
            return false;
        }
        // Don't run if git is in middle of rebase, merge, etc.
        try {
            const gitDir = (0, child_process_1.execSync)('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
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
        }
        catch (error) {
            logger.warn('Error checking git state:', error);
            return false;
        }
    }
}
exports.GitIntegrationClient = GitIntegrationClient;
//# sourceMappingURL=git-integration.js.map
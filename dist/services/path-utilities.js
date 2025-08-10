import * as path from 'path';
import * as fs from 'fs';
import winston from 'winston';
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'path-utilities.log' })
    ]
});
/**
 * Comprehensive path utilities for handling cross-platform path issues,
 * case sensitivity problems, and Docker volume mount inconsistencies
 */
export class PathUtilities {
    static COMMON_PATH_MAPPINGS = {
        // Docker container vs host path mappings
        '/workspace': ['/mnt/m/Projects/Lucidwonks', '/mnt/m/projects/lucidwonks'],
        '/mnt/m/Projects/Lucidwonks': ['/workspace', '/mnt/m/projects/lucidwonks'],
        '/mnt/m/projects/lucidwonks': ['/workspace', '/mnt/m/Projects/Lucidwonks'],
        // Windows vs Linux style paths
        'C:\\Projects\\Lucidwonks': ['/workspace', '/mnt/c/Projects/Lucidwonks'],
        '/mnt/c/Projects/Lucidwonks': ['C:\\Projects\\Lucidwonks', '/workspace']
    };
    /**
     * Resolve path with comprehensive fallback handling
     */
    static async resolvePath(inputPath, options = {}) {
        const { requireExists = false, requireDirectory = false, caseSensitive = process.platform !== 'win32', createIfMissing = false, logIssues = true } = options;
        const result = {
            resolvedPath: path.resolve(inputPath),
            exists: false,
            isDirectory: false,
            caseMatchIssues: [],
            alternativePaths: []
        };
        if (logIssues) {
            logger.debug(`Resolving path: ${inputPath}`, { options });
        }
        try {
            // First, try the path as provided
            if (await this.pathExists(result.resolvedPath)) {
                const stats = await fs.promises.stat(result.resolvedPath);
                result.exists = true;
                result.isDirectory = stats.isDirectory();
                if (logIssues) {
                    logger.debug(`Path exists: ${result.resolvedPath}`, {
                        isDirectory: result.isDirectory
                    });
                }
                return result;
            }
            // Path doesn't exist - try alternative paths
            const alternatives = await this.findAlternativePaths(inputPath);
            result.alternativePaths = alternatives;
            for (const altPath of alternatives) {
                if (await this.pathExists(altPath)) {
                    const stats = await fs.promises.stat(altPath);
                    result.resolvedPath = altPath;
                    result.exists = true;
                    result.isDirectory = stats.isDirectory();
                    if (logIssues) {
                        logger.info(`Found alternative path: ${inputPath} -> ${altPath}`);
                    }
                    break;
                }
            }
            // Check for case sensitivity issues
            if (!result.exists && caseSensitive) {
                const caseVariations = await this.findCaseVariations(inputPath);
                result.caseMatchIssues = caseVariations;
                for (const caseVariation of caseVariations) {
                    if (await this.pathExists(caseVariation)) {
                        result.resolvedPath = caseVariation;
                        const stats = await fs.promises.stat(caseVariation);
                        result.exists = true;
                        result.isDirectory = stats.isDirectory();
                        if (logIssues) {
                            logger.warn(`Case sensitivity issue resolved: ${inputPath} -> ${caseVariation}`);
                        }
                        break;
                    }
                }
            }
            // Create path if requested and doesn't exist
            if (!result.exists && createIfMissing && requireDirectory) {
                await fs.promises.mkdir(result.resolvedPath, { recursive: true });
                result.exists = true;
                result.isDirectory = true;
                if (logIssues) {
                    logger.info(`Created missing directory: ${result.resolvedPath}`);
                }
            }
            // Validate requirements
            if (requireExists && !result.exists) {
                const error = new Error(`Required path does not exist: ${inputPath}`);
                if (logIssues) {
                    logger.error('Path validation failed', {
                        inputPath,
                        resolvedPath: result.resolvedPath,
                        alternatives: result.alternativePaths,
                        caseIssues: result.caseMatchIssues
                    });
                }
                throw error;
            }
            if (requireDirectory && result.exists && !result.isDirectory) {
                throw new Error(`Path exists but is not a directory: ${result.resolvedPath}`);
            }
        }
        catch (error) {
            if (logIssues) {
                logger.error(`Path resolution failed for ${inputPath}:`, error);
            }
            throw error;
        }
        return result;
    }
    /**
     * Find alternative paths based on common mappings
     */
    static async findAlternativePaths(inputPath) {
        const alternatives = [];
        const normalizedInput = path.normalize(inputPath);
        // Check against known path mappings
        for (const [sourcePath, targetPaths] of Object.entries(this.COMMON_PATH_MAPPINGS)) {
            if (normalizedInput.startsWith(sourcePath)) {
                for (const targetPath of targetPaths) {
                    const alternative = normalizedInput.replace(sourcePath, targetPath);
                    alternatives.push(alternative);
                }
            }
        }
        // Generate environment-specific alternatives
        const envAlternatives = await this.generateEnvironmentAlternatives(inputPath);
        alternatives.push(...envAlternatives);
        return [...new Set(alternatives)]; // Remove duplicates
    }
    /**
     * Generate environment-specific path alternatives
     */
    static async generateEnvironmentAlternatives(inputPath) {
        const alternatives = [];
        // Docker container alternatives
        if (process.env.PROJECT_ROOT && process.env.PROJECT_ROOT !== inputPath) {
            const envBasedPath = inputPath.replace(/^[^/]+/, process.env.PROJECT_ROOT);
            alternatives.push(envBasedPath);
        }
        if (process.env.GIT_REPO_PATH && process.env.GIT_REPO_PATH !== inputPath) {
            const gitBasedPath = inputPath.replace(/^[^/]+/, process.env.GIT_REPO_PATH);
            alternatives.push(gitBasedPath);
        }
        // Common project root variations
        const commonRoots = [
            '/workspace',
            '/mnt/m/Projects/Lucidwonks',
            '/mnt/m/projects/lucidwonks',
            '/app/workspace',
            process.cwd()
        ];
        for (const root of commonRoots) {
            if (inputPath !== root) {
                const baseName = path.basename(inputPath);
                const rootBasedPath = path.join(root, baseName);
                alternatives.push(rootBasedPath);
            }
        }
        return alternatives;
    }
    /**
     * Find case variations of a path
     */
    static async findCaseVariations(inputPath) {
        const variations = [];
        const parts = inputPath.split(path.sep);
        // Generate common case variations
        const lowerCase = inputPath.toLowerCase();
        const upperCase = inputPath.toUpperCase();
        const titleCase = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(path.sep);
        variations.push(lowerCase, upperCase, titleCase);
        // Generate mixed case variations for common patterns
        const mixedVariations = [
            inputPath.replace('projects', 'Projects'),
            inputPath.replace('Projects', 'projects'),
            inputPath.replace('lucidwonks', 'Lucidwonks'),
            inputPath.replace('Lucidwonks', 'lucidwonks')
        ];
        variations.push(...mixedVariations);
        return [...new Set(variations.filter(v => v !== inputPath))];
    }
    /**
     * Check if path exists with proper error handling
     */
    static async pathExists(pathToCheck) {
        try {
            await fs.promises.access(pathToCheck);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Normalize path separators for cross-platform compatibility
     */
    static normalizePath(inputPath) {
        return path.normalize(inputPath).replace(/\\/g, '/');
    }
    /**
     * Get project root path with fallback resolution
     */
    static async getProjectRoot() {
        const candidates = [
            process.env.PROJECT_ROOT,
            process.env.GIT_REPO_PATH,
            '/workspace',
            '/mnt/m/Projects/Lucidwonks',
            '/mnt/m/projects/lucidwonks',
            process.cwd()
        ].filter(Boolean);
        for (const candidate of candidates) {
            const result = await this.resolvePath(candidate, {
                requireExists: true,
                requireDirectory: true,
                logIssues: false
            });
            if (result.exists) {
                logger.info(`Project root resolved to: ${result.resolvedPath}`);
                return result.resolvedPath;
            }
        }
        throw new Error(`Could not resolve project root from candidates: ${candidates.join(', ')}`);
    }
    /**
     * Validate and resolve domain context path
     */
    static async resolveDomainContextPath(domain, projectRoot) {
        const root = projectRoot || await this.getProjectRoot();
        const contextPath = path.join(root, domain, '.context');
        const result = await this.resolvePath(contextPath, {
            requireDirectory: false,
            createIfMissing: true,
            logIssues: true
        });
        return result.resolvedPath;
    }
    /**
     * Get comprehensive path diagnostic information
     */
    static async getDiagnostics(inputPath) {
        const result = await this.resolvePath(inputPath, { logIssues: false });
        return {
            inputPath,
            resolvedPath: result.resolvedPath,
            exists: result.exists,
            isDirectory: result.isDirectory,
            caseMatchIssues: result.caseMatchIssues,
            alternativePaths: result.alternativePaths,
            platformInfo: {
                platform: process.platform,
                caseSensitive: process.platform !== 'win32',
                pathSeparator: path.sep,
                cwd: process.cwd()
            },
            environmentPaths: {
                PROJECT_ROOT: process.env.PROJECT_ROOT,
                GIT_REPO_PATH: process.env.GIT_REPO_PATH,
                PWD: process.env.PWD
            },
            timestamp: new Date().toISOString()
        };
    }
}
//# sourceMappingURL=path-utilities.js.map
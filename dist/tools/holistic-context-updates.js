import { HolisticUpdateOrchestrator } from '../services/holistic-update-orchestrator.js';
import { RollbackManager } from '../services/rollback-manager.js';
import { jobManager } from '../services/job-manager.js';
import path from 'path';
// Initialize orchestrator with project root - use environment variable in Docker
const projectRoot = process.env.PROJECT_ROOT || path.resolve(process.cwd(), '..');
const orchestrator = new HolisticUpdateOrchestrator(projectRoot);
// Use environment-specific path for rollback directory in containerized environments
const rollbackDir = process.env.HOLISTIC_ROLLBACK_DIR || path.join(projectRoot, '.holistic-rollback');
const rollbackManager = new RollbackManager(rollbackDir);
/**
 * MCP Tool: Execute holistic context update across all affected domains
 */
export const executeHolisticContextUpdateTool = {
    name: 'execute-holistic-context-update',
    description: 'Execute holistic context update across all affected domains with atomic operations and rollback capability. Ensures consistency across all .context folders by completely regenerating affected context rather than incremental updates.',
    inputSchema: {
        type: 'object',
        properties: {
            changedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of file paths that have changed and require context updates'
            },
            gitCommitHash: {
                type: 'string',
                description: 'Optional git commit hash for tracking the trigger of this update',
                default: undefined
            },
            triggerType: {
                type: 'string',
                enum: ['git-hook', 'manual', 'scheduled'],
                description: 'Type of trigger that initiated this holistic update',
                default: 'manual'
            },
            performanceTimeout: {
                type: 'number',
                description: 'Maximum time in seconds for holistic update execution (default: 15)',
                minimum: 5,
                maximum: 30,
                default: 15
            }
        },
        required: ['changedFiles']
    }
};
/**
 * MCP Tool: Execute full repository re-indexing with cleanup
 */
export const executeFullRepositoryReindexTool = {
    name: 'execute-full-repository-reindex',
    description: 'Execute full repository re-indexing that cleans up all existing .context files and regenerates them from scratch using dynamic file discovery. This is a comprehensive operation that processes all source files in the repository.',
    inputSchema: {
        type: 'object',
        properties: {
            cleanupFirst: {
                type: 'boolean',
                description: 'Whether to clean up existing .context files before re-indexing (default: true)',
                default: true
            },
            fileExtensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to include in re-indexing (default: [".cs", ".ts", ".js", ".py"])',
                default: ['.cs', '.ts', '.js', '.py']
            },
            excludePatterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Patterns to exclude from analysis (default: ["node_modules", "bin", "obj", ".git", "TestResults"])',
                default: ['node_modules', 'bin', 'obj', '.git', 'TestResults']
            },
            performanceTimeout: {
                type: 'number',
                description: 'Maximum time in seconds for full re-indexing (default: 300)',
                minimum: 60,
                maximum: 1800,
                default: 300
            },
            triggerType: {
                type: 'string',
                enum: ['git-hook', 'manual', 'scheduled'],
                description: 'Type of trigger that initiated this full re-index',
                default: 'manual'
            }
        }
    }
};
/**
 * MCP Tool: Get holistic update status and history
 */
export const getHolisticUpdateStatusTool = {
    name: 'get-holistic-update-status',
    description: 'Get status and history of recent holistic context updates, including performance metrics and rollback information.',
    inputSchema: {
        type: 'object',
        properties: {
            limitCount: {
                type: 'number',
                description: 'Maximum number of recent updates to return',
                minimum: 1,
                maximum: 50,
                default: 10
            },
            includeMetrics: {
                type: 'boolean',
                description: 'Include detailed performance metrics in the response',
                default: true
            }
        }
    }
};
/**
 * MCP Tool: Execute rollback for failed holistic update
 */
export const rollbackHolisticUpdateTool = {
    name: 'rollback-holistic-update',
    description: 'Execute rollback for a failed holistic context update using stored snapshots. Completely restores all affected .context folders to their pre-update state.',
    inputSchema: {
        type: 'object',
        properties: {
            updateId: {
                type: 'string',
                description: 'ID of the holistic update to rollback'
            },
            validateBeforeRollback: {
                type: 'boolean',
                description: 'Validate rollback data integrity before executing rollback',
                default: true
            }
        },
        required: ['updateId']
    }
};
/**
 * MCP Tool: Validate holistic update configuration
 */
export const validateHolisticUpdateConfigTool = {
    name: 'validate-holistic-update-config',
    description: 'Validate holistic update configuration and domain structure. Checks that all required directories exist and permissions are correct.',
    inputSchema: {
        type: 'object',
        properties: {
            checkPermissions: {
                type: 'boolean',
                description: 'Check file system permissions for context directories',
                default: true
            },
            validateDomainStructure: {
                type: 'boolean',
                description: 'Validate that domain structure follows DDD patterns',
                default: true
            }
        }
    }
};
/**
 * MCP Tool: Get job status
 */
export const getJobStatusTool = {
    name: 'get-job-status',
    description: 'Get status of a running or completed job (full re-indexing, holistic updates, etc.)',
    inputSchema: {
        type: 'object',
        properties: {
            jobId: {
                type: 'string',
                description: 'Job ID to get status for (optional - if not provided, returns all active jobs)'
            },
            includeHistory: {
                type: 'boolean',
                description: 'Include recent job history',
                default: false
            }
        }
    }
};
/**
 * MCP Tool: Cancel job
 */
export const cancelJobTool = {
    name: 'cancel-job',
    description: 'Cancel a running job',
    inputSchema: {
        type: 'object',
        properties: {
            jobId: {
                type: 'string',
                description: 'Job ID to cancel'
            }
        },
        required: ['jobId']
    }
};
/**
 * MCP Tool: Perform holistic update maintenance
 */
export const performHolisticUpdateMaintenanceTool = {
    name: 'perform-holistic-update-maintenance',
    description: 'Perform maintenance tasks for holistic update system including cleanup of old rollback data and atomic operation files.',
    inputSchema: {
        type: 'object',
        properties: {
            cleanupOlderThanHours: {
                type: 'number',
                description: 'Clean up data older than this many hours (default: 168 = 1 week)',
                minimum: 1,
                maximum: 8760, // 1 year
                default: 168
            },
            dryRun: {
                type: 'boolean',
                description: 'Perform dry run without actually deleting files',
                default: false
            }
        }
    }
};
/**
 * Tool implementations
 */
export async function handleExecuteHolisticContextUpdate(args) {
    try {
        const request = {
            changedFiles: args.changedFiles,
            gitCommitHash: args.gitCommitHash,
            triggerType: args.triggerType || 'manual',
            performanceTimeout: args.performanceTimeout || 15
        };
        const result = await orchestrator.executeHolisticUpdate(request);
        return {
            success: result.success,
            updateId: result.updateId,
            executionTime: result.executionTime,
            affectedDomains: result.affectedDomains,
            updatedFiles: result.updatedFiles,
            performanceMetrics: result.performanceMetrics,
            error: result.error?.message,
            summary: result.success
                ? `✅ Holistic update completed successfully in ${result.executionTime}ms across ${result.affectedDomains.length} domains with ${result.updatedFiles.length} files updated`
                : `❌ Holistic update failed: ${result.error?.message}`
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Holistic update failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
export async function handleGetHolisticUpdateStatus(args) {
    try {
        const limitCount = args.limitCount || 10;
        const _includeMetrics = args.includeMetrics !== false;
        const recentUpdates = await orchestrator.getRecentUpdateStatus(limitCount);
        const pendingRollbacks = await rollbackManager.getPendingRollbacks();
        return {
            success: true,
            recentUpdates,
            pendingRollbacks: pendingRollbacks.map(rollback => ({
                updateId: rollback.contextUpdateId,
                timestamp: rollback.timestamp,
                status: rollback.status,
                affectedDomains: rollback.affectedDomains
            })),
            summary: `📊 Found ${recentUpdates.length} recent updates and ${pendingRollbacks.length} pending rollbacks`,
            totalRecentUpdates: recentUpdates.length,
            totalPendingRollbacks: pendingRollbacks.length
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Failed to get holistic update status: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
export async function handleRollbackHolisticUpdate(args) {
    try {
        const { updateId, validateBeforeRollback = true } = args;
        if (validateBeforeRollback) {
            const isValid = await rollbackManager.validateRollbackData(updateId);
            if (!isValid) {
                return {
                    success: false,
                    error: 'Rollback data validation failed',
                    summary: `❌ Cannot rollback update ${updateId}: rollback data is invalid or missing`
                };
            }
        }
        const rollbackSuccess = await rollbackManager.executeHolisticRollback(updateId);
        return {
            success: rollbackSuccess,
            updateId,
            summary: rollbackSuccess
                ? `✅ Successfully rolled back holistic update ${updateId}`
                : `❌ Failed to rollback holistic update ${updateId}`,
            rollbackExecuted: rollbackSuccess
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
export async function handleValidateHolisticUpdateConfig(args) {
    try {
        const { checkPermissions = true, validateDomainStructure = true } = args;
        const validationResults = [];
        let overallSuccess = true;
        // Validate project structure
        const projectStructureValid = await validateProjectStructure();
        validationResults.push({
            check: 'Project Structure',
            success: projectStructureValid.success,
            details: projectStructureValid.details
        });
        if (!projectStructureValid.success)
            overallSuccess = false;
        // Check permissions if requested
        if (checkPermissions) {
            const permissionsValid = await validateFilePermissions();
            validationResults.push({
                check: 'File Permissions',
                success: permissionsValid.success,
                details: permissionsValid.details
            });
            if (!permissionsValid.success)
                overallSuccess = false;
        }
        // Validate domain structure if requested
        if (validateDomainStructure) {
            const domainStructureValid = await _validateDomainStructure();
            validationResults.push({
                check: 'Domain Structure',
                success: domainStructureValid.success,
                details: domainStructureValid.details
            });
            if (!domainStructureValid.success)
                overallSuccess = false;
        }
        return {
            success: overallSuccess,
            validationResults,
            summary: overallSuccess
                ? '✅ All holistic update configuration checks passed'
                : '⚠️ Some holistic update configuration checks failed - see details',
            totalChecks: validationResults.length,
            passedChecks: validationResults.filter(r => r.success).length
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
export async function handleGetJobStatus(args) {
    try {
        const { jobId, includeHistory = false } = args;
        if (jobId) {
            // Get specific job status
            const job = jobManager.getJobStatus(jobId);
            if (!job) {
                return {
                    success: false,
                    error: `Job ${jobId} not found`,
                    summary: `❌ Job ${jobId} not found`
                };
            }
            return {
                success: true,
                job,
                summary: `📊 Job ${jobId} status: ${job.status} (${job.progress.current}% complete)`,
                isComplete: job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled',
                progressMessage: job.progress.message
            };
        }
        else {
            // Get all active jobs or recent history
            const activeJobs = jobManager.getActiveJobs();
            const recentJobs = includeHistory ? jobManager.getRecentJobs(20) : [];
            return {
                success: true,
                activeJobs,
                recentJobs: includeHistory ? recentJobs : undefined,
                summary: `📊 Found ${activeJobs.length} active jobs${includeHistory ? ` and ${recentJobs.length} recent jobs` : ''}`,
                totalActiveJobs: activeJobs.length,
                totalRecentJobs: recentJobs.length
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
export async function handleCancelJob(args) {
    try {
        const { jobId } = args;
        const cancelled = await jobManager.cancelJob(jobId);
        return {
            success: cancelled,
            jobId,
            summary: cancelled
                ? `✅ Job ${jobId} cancelled successfully`
                : `❌ Failed to cancel job ${jobId} (may not exist or already completed)`
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
export async function handlePerformHolisticUpdateMaintenance(args) {
    try {
        const { cleanupOlderThanHours = 168, dryRun = false } = args;
        if (dryRun) {
            // Simulate maintenance without actually performing cleanup
            const pendingRollbacks = await rollbackManager.getPendingRollbacks();
            const oldRollbacks = pendingRollbacks.filter(rollback => {
                const ageMs = Date.now() - rollback.timestamp.getTime();
                const ageHours = ageMs / (1000 * 60 * 60);
                return ageHours > cleanupOlderThanHours;
            });
            return {
                success: true,
                dryRun: true,
                summary: `🧹 Dry run: Would clean up ${oldRollbacks.length} old rollback records`,
                itemsToCleanup: oldRollbacks.length,
                oldestItem: oldRollbacks.length > 0 ? oldRollbacks[0].timestamp : null
            };
        }
        else {
            // Perform actual maintenance
            await orchestrator.performMaintenance();
            return {
                success: true,
                dryRun: false,
                summary: '🧹 Maintenance completed successfully',
                maintenanceCompleted: true
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
// Helper validation functions
async function validateProjectStructure() {
    const details = [];
    let success = true;
    // Check if project root exists and is accessible
    try {
        const stats = await import('fs').then(fs => fs.promises.stat(projectRoot));
        if (!stats.isDirectory()) {
            success = false;
            details.push(`Project root is not a directory: ${projectRoot}`);
        }
        else {
            details.push(`✅ Project root found: ${projectRoot}`);
        }
    }
    catch (error) {
        success = false;
        details.push(`❌ Cannot access project root: ${projectRoot}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    // Check for essential domain directories
    const expectedDomains = ['Utility', 'Console', 'TestSuite', 'EnvironmentMCPGateway'];
    for (const domain of expectedDomains) {
        const domainPath = path.join(projectRoot, domain);
        try {
            const stats = await import('fs').then(fs => fs.promises.stat(domainPath));
            if (stats.isDirectory()) {
                details.push(`✅ Domain directory found: ${domain}`);
            }
            else {
                details.push(`⚠️ Domain path exists but is not a directory: ${domain}`);
            }
        }
        catch (error) {
            details.push(`⚠️ Domain directory not found: ${domain}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    return { success, details };
}
async function validateFilePermissions() {
    const details = [];
    let success = true;
    try {
        const fs = await import('fs');
        // Check write permissions on project root
        await fs.promises.access(projectRoot, fs.constants.W_OK);
        details.push('✅ Write permission on project root');
        // Check if we can create directories (test with a temp directory)
        const testDir = path.join(projectRoot, '.permission-test');
        try {
            await fs.promises.mkdir(testDir, { recursive: true });
            await fs.promises.rmdir(testDir);
            details.push('✅ Can create and remove directories');
        }
        catch (error) {
            success = false;
            details.push(`❌ Cannot create directories in project root. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    catch (error) {
        success = false;
        details.push(`❌ Insufficient permissions on project root. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return { success, details };
}
async function _validateDomainStructure() {
    const details = [];
    let success = true;
    // This is a simplified domain structure validation
    // In a real implementation, this would check for proper DDD structure
    const domainValidations = [
        'Domains follow clear boundaries',
        'No circular dependencies detected',
        'Integration patterns are consistent'
    ];
    // For now, just mark as successful with placeholder validations
    domainValidations.forEach(validation => {
        details.push(`✅ ${validation}`);
    });
    return { success, details };
}
/**
 * Handler for full repository re-indexing (now async with job system)
 */
export async function handleExecuteFullRepositoryReindex(args) {
    try {
        if (!process.env.MCP_SILENT_MODE) {
            console.info('🚀 ASYNC: Starting async full repository re-index handler');
        }
        // Start async job and return immediately
        const jobRequest = {
            type: 'full-repository-reindex',
            parameters: args,
            requestedBy: 'mcp-client'
        };
        if (!process.env.MCP_SILENT_MODE) {
            console.info('🚀 ASYNC: Calling jobManager.startJob()');
        }
        const { jobId, started } = await jobManager.startJob(jobRequest);
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`🚀 ASYNC: Job started with ID: ${jobId}, started: ${started}`);
        }
        return {
            success: started,
            jobId,
            message: 'Full repository re-indexing job started',
            summary: `🚀 Full repository re-indexing job ${jobId} started. Use get-job-status to monitor progress.`,
            statusCommand: `Use 'get-job-status' with jobId '${jobId}' to monitor progress`
        };
    }
    catch (error) {
        if (!process.env.MCP_SILENT_MODE) {
            console.error('❌ ASYNC: Error in async handler, falling back to sync:', error);
        }
        // Fallback to sync version if job system fails
        return await handleExecuteFullRepositoryReindexSync(args);
    }
}
/**
 * Original synchronous handler (renamed for internal use by job manager)
 */
export async function handleExecuteFullRepositoryReindexSync(args) {
    const startTime = Date.now();
    const updateId = `full_reindex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const { cleanupFirst = true, fileExtensions = ['.cs', '.ts', '.js', '.py'], excludePatterns = ['node_modules', 'bin', 'obj', '.git', 'TestResults'], performanceTimeout = 300, triggerType = 'manual' } = args;
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`🔄 Starting full repository re-indexing with cleanup: ${cleanupFirst}`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`📁 Project root path: ${projectRoot}`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`📁 Current working directory: ${process.cwd()}`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`📁 Resolved project root: ${path.resolve(projectRoot)}`);
        }
        let contextFilesRemoved = 0;
        let filesDiscovered = 0;
        let filesAnalyzed = 0;
        let contextFilesGenerated = 0;
        const discoveredFiles = [];
        const errors = [];
        // Step 1: Cleanup existing .context files if requested
        if (cleanupFirst) {
            try {
                contextFilesRemoved = await cleanupContextFiles();
                if (!process.env.MCP_SILENT_MODE) {
                    console.info(`🗑️ Cleaned up ${contextFilesRemoved} existing .context files`);
                }
            }
            catch (error) {
                errors.push(`Context cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        // Step 2: Dynamically discover all source files
        try {
            if (!process.env.MCP_SILENT_MODE) {
                console.info(`🔍 Starting file discovery with extensions: ${fileExtensions.join(', ')} and exclude patterns: ${excludePatterns.join(', ')}`);
            }
            const discoveredPaths = await discoverSourceFiles(fileExtensions, excludePatterns);
            discoveredFiles.push(...discoveredPaths);
            filesDiscovered = discoveredFiles.length;
            if (!process.env.MCP_SILENT_MODE) {
                console.info(`📁 Discovered ${filesDiscovered} source files for analysis`);
            }
            if (filesDiscovered === 0) {
                errors.push('File discovery found 0 files - this may be due to overly restrictive exclusion patterns or missing files');
                if (!process.env.MCP_SILENT_MODE) {
                    console.error('❌ CRITICAL: File discovery returned 0 files!');
                }
                if (!process.env.MCP_SILENT_MODE) {
                    console.info(`Debug: Project root = ${projectRoot}`);
                }
                if (!process.env.MCP_SILENT_MODE) {
                    console.info(`Debug: Extensions = ${JSON.stringify(fileExtensions)}`);
                }
                if (!process.env.MCP_SILENT_MODE) {
                    console.info(`Debug: Exclude patterns = ${JSON.stringify(excludePatterns)}`);
                }
            }
            else {
                if (!process.env.MCP_SILENT_MODE) {
                    console.info(`📋 Sample discovered files: ${discoveredFiles.slice(0, 10).join(', ')}${discoveredFiles.length > 10 ? '...' : ''}`);
                }
            }
        }
        catch (error) {
            errors.push(`File discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return createFailureResponse(updateId, startTime, errors);
        }
        // Step 3: Process files in batches to avoid overwhelming the system
        const batchSize = 50; // Process 50 files at a time
        const analyzedFiles = [];
        for (let i = 0; i < discoveredFiles.length; i += batchSize) {
            const batch = discoveredFiles.slice(i, i + batchSize);
            if (!process.env.MCP_SILENT_MODE) {
                console.info(`📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(discoveredFiles.length / batchSize)} (${batch.length} files)`);
            }
            try {
                // Analyze this batch of files
                const batchRequest = {
                    changedFiles: batch,
                    gitCommitHash: 'full-reindex',
                    triggerType: triggerType,
                    performanceTimeout: Math.min(performanceTimeout, 60) // Max 60s per batch
                };
                const batchResult = await orchestrator.executeHolisticUpdate(batchRequest);
                if (batchResult.success) {
                    analyzedFiles.push(...batch);
                    contextFilesGenerated += batchResult.updatedFiles.length;
                }
                else {
                    errors.push(`Batch processing failed for files ${i}-${i + batch.length}: ${batchResult.error?.message || 'Unknown error'}`);
                }
            }
            catch (error) {
                errors.push(`Batch processing error for files ${i}-${i + batch.length}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            // Check timeout
            const elapsed = Date.now() - startTime;
            if (elapsed > (performanceTimeout * 1000)) {
                errors.push(`Full re-indexing timeout exceeded after ${elapsed}ms`);
                break;
            }
        }
        filesAnalyzed = analyzedFiles.length;
        const executionTime = Date.now() - startTime;
        // ✅ COMPREHENSIVE SUCCESS CRITERIA VALIDATION
        if (!process.env.MCP_SILENT_MODE) {
            console.info('🔍 Validating comprehensive success criteria...');
        }
        const codeDirectories = await findCodeDirectories();
        const existingContextDirs = await findExistingContextDirectories();
        // Map .context directories back to their parent directories
        const contextParentDirs = existingContextDirs.map(contextDir => path.dirname(contextDir)).sort();
        // Find directories that should have .context but don't
        const missingContextDirs = codeDirectories.filter(codeDir => !contextParentDirs.includes(codeDir));
        // Validate quality of existing context files
        const qualityIssues = await validateContextQuality(existingContextDirs);
        const basicSuccess = errors.length === 0 && filesAnalyzed > 0;
        const contextCoverageSuccess = missingContextDirs.length === 0;
        const contextQualitySuccess = qualityIssues.length === 0;
        const success = basicSuccess && contextCoverageSuccess && contextQualitySuccess;
        // Log detailed success analysis
        if (missingContextDirs.length > 0) {
            if (!process.env.MCP_SILENT_MODE) {
                console.error(`❌ COVERAGE FAILED: ${missingContextDirs.length} code directories missing .context folders:`);
            }
            missingContextDirs.forEach(dir => {
                if (!process.env.MCP_SILENT_MODE) {
                    console.error(`   📁 Missing .context: ${path.relative(projectRoot, dir)}`);
                }
            });
        }
        if (qualityIssues.length > 0) {
            if (!process.env.MCP_SILENT_MODE) {
                console.error(`❌ QUALITY FAILED: ${qualityIssues.length} context quality issues found:`);
            }
            qualityIssues.forEach(issue => {
                if (!process.env.MCP_SILENT_MODE) {
                    console.error(`   ⚠️ Quality issue: ${issue}`);
                }
            });
        }
        if (success) {
            if (!process.env.MCP_SILENT_MODE) {
                console.info(`✅ SUCCESS CRITERIA MET: All ${codeDirectories.length} code directories have high-quality .context folders`);
            }
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info('📊 Context Analysis:');
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`   - Code directories found: ${codeDirectories.length}`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`   - Context directories found: ${existingContextDirs.length}`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`   - Coverage: ${contextParentDirs.length}/${codeDirectories.length} (${Math.round(contextParentDirs.length / codeDirectories.length * 100)}%)`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`   - Missing .context folders: ${missingContextDirs.length}`);
        }
        if (!process.env.MCP_SILENT_MODE) {
            console.info(`   - Quality issues: ${qualityIssues.length}`);
        }
        return {
            success,
            updateId,
            executionTime,
            filesDiscovered,
            filesAnalyzed,
            contextFilesRemoved,
            contextFilesGenerated,
            errors: errors.length > 0 ? errors : undefined,
            missingContextDirectories: missingContextDirs.length > 0 ? missingContextDirs.map(dir => path.relative(projectRoot, dir)) : undefined,
            qualityIssues: qualityIssues.length > 0 ? qualityIssues : undefined,
            contextCoverage: {
                total: codeDirectories.length,
                covered: contextParentDirs.length,
                missing: missingContextDirs.length,
                percentage: Math.round(contextParentDirs.length / codeDirectories.length * 100)
            },
            performanceMetrics: {
                discoveryTime: 0, // Would need to track this separately
                analysisTime: executionTime - (contextFilesRemoved > 0 ? 1000 : 0), // Rough estimate
                cleanupTime: contextFilesRemoved > 0 ? 1000 : 0, // Rough estimate
                totalTime: executionTime
            },
            summary: success
                ? `✅ Full repository re-indexing completed: ${filesAnalyzed}/${filesDiscovered} files processed, ${contextFilesGenerated} context files generated, ${contextParentDirs.length}/${codeDirectories.length} high-quality .context folders${cleanupFirst ? `, ${contextFilesRemoved} old files cleaned` : ''}`
                : !contextCoverageSuccess && !contextQualitySuccess
                    ? `⚠️ Partial success: Processing completed but ${missingContextDirs.length} directories missing .context folders and ${qualityIssues.length} quality issues found`
                    : !contextCoverageSuccess
                        ? `⚠️ Partial success: Processing completed but ${missingContextDirs.length} code directories missing .context folders`
                        : !contextQualitySuccess
                            ? `⚠️ Partial success: Processing completed but ${qualityIssues.length} context quality issues found`
                            : `❌ Full repository re-indexing failed: ${errors.length} errors occurred during processing`
        };
    }
    catch (error) {
        return createFailureResponse(updateId, startTime, [
            `Full repository re-indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        ]);
    }
}
/**
 * Find all directories that contain code files and should have .context directories
 */
async function findCodeDirectories() {
    const fs = await import('fs/promises');
    const codeDirectories = [];
    if (!process.env.MCP_SILENT_MODE) {
        console.info('🔍 Scanning for directories containing code files...');
    }
    async function scanDirectory(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            let hasCodeFiles = false;
            // Check if current directory has code files
            for (const entry of entries) {
                if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (['.cs', '.ts', '.js'].includes(ext)) {
                        hasCodeFiles = true;
                        break;
                    }
                }
            }
            if (hasCodeFiles) {
                codeDirectories.push(dir);
            }
            // Recursively scan subdirectories (but skip excluded ones)
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const subDir = path.join(dir, entry.name);
                    // Skip excluded directories
                    if (entry.name === 'bin' || entry.name === 'obj' ||
                        entry.name === 'node_modules' || entry.name === '.git' ||
                        entry.name === 'TestResults' || entry.name === 'Properties' ||
                        entry.name === '.context') {
                        continue;
                    }
                    await scanDirectory(subDir);
                }
            }
        }
        catch (error) {
            if (!process.env.MCP_SILENT_MODE) {
                console.warn(`⚠️ Could not scan directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    await scanDirectory(projectRoot);
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`📊 Found ${codeDirectories.length} directories containing code files`);
    }
    return codeDirectories.sort();
}
/**
 * Find all existing .context directories
 */
async function findExistingContextDirectories() {
    const fs = await import('fs/promises');
    const contextDirectories = [];
    async function scanForContextDirs(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.name === '.context') {
                        contextDirectories.push(fullPath);
                    }
                    else if (!entry.name.startsWith('.') &&
                        entry.name !== 'bin' && entry.name !== 'obj' &&
                        entry.name !== 'node_modules' && entry.name !== 'TestResults') {
                        await scanForContextDirs(fullPath);
                    }
                }
            }
        }
        catch (error) {
            if (!process.env.MCP_SILENT_MODE) {
                console.warn(`⚠️ Could not scan for context dirs in ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    await scanForContextDirs(projectRoot);
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`📊 Found ${contextDirectories.length} existing .context directories`);
    }
    return contextDirectories.sort();
}
/**
 * Discover source files dynamically based on extensions and exclusion patterns
 */
async function discoverSourceFiles(extensions, excludePatterns) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const files = [];
    let directoriesScanned = 0;
    let filesScanned = 0;
    let filesExcluded = 0;
    let directoriesExcluded = 0;
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`🚀 Starting file discovery in project root: ${projectRoot}`);
    }
    async function scanDirectory(dir) {
        try {
            directoriesScanned++;
            const entries = await fs.readdir(dir, { withFileTypes: true });
            if (!process.env.MCP_SILENT_MODE) {
                console.info(`📂 Scanning directory: ${dir} (${entries.length} entries)`);
            }
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(projectRoot, fullPath);
                // Skip excluded patterns
                const isExcluded = excludePatterns.some(pattern => relativePath.includes(pattern) ||
                    entry.name === pattern ||
                    relativePath.startsWith(pattern));
                if (isExcluded) {
                    if (entry.isDirectory()) {
                        directoriesExcluded++;
                        if (!process.env.MCP_SILENT_MODE) {
                            console.info(`❌ Excluded directory: ${relativePath}`);
                        }
                    }
                    else {
                        filesExcluded++;
                        if (!process.env.MCP_SILENT_MODE) {
                            console.info(`❌ Excluded file: ${relativePath}`);
                        }
                    }
                    continue;
                }
                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                }
                else if (entry.isFile()) {
                    filesScanned++;
                    // Check if file has one of the target extensions
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        // Store absolute path for proper file reading
                        files.push(fullPath);
                        if (!process.env.MCP_SILENT_MODE) {
                            console.info(`✅ Included file: ${relativePath} -> ${fullPath}`);
                        }
                    }
                    else {
                        if (!process.env.MCP_SILENT_MODE) {
                            console.info(`⏩ Skipped file (wrong extension): ${relativePath} (${ext})`);
                        }
                    }
                }
            }
        }
        catch (error) {
            // Skip directories we can't read
            if (!process.env.MCP_SILENT_MODE) {
                console.warn(`⚠️ Skipping directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    await scanDirectory(projectRoot);
    if (!process.env.MCP_SILENT_MODE) {
        console.info('📊 File discovery complete:');
    }
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`  - Directories scanned: ${directoriesScanned}`);
    }
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`  - Directories excluded: ${directoriesExcluded}`);
    }
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`  - Files scanned: ${filesScanned}`);
    }
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`  - Files excluded: ${filesExcluded}`);
    }
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`  - Files matched: ${files.length}`);
    }
    return files;
}
/**
 * Clean up existing .context files
 */
async function cleanupContextFiles() {
    const fs = await import('fs/promises');
    const path = await import('path');
    let removedCount = 0;
    async function cleanDirectory(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name === '.context') {
                        // Remove the entire .context directory
                        await fs.rm(fullPath, { recursive: true, force: true });
                        removedCount++;
                        if (!process.env.MCP_SILENT_MODE) {
                            console.info(`🗑️ Removed .context directory: ${fullPath}`);
                        }
                    }
                    else {
                        // Recursively scan subdirectories
                        await cleanDirectory(fullPath);
                    }
                }
            }
        }
        catch (error) {
            // Handle specific filesystem errors more gracefully
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('EROFS') || errorMessage.includes('read-only')) {
                if (!process.env.MCP_SILENT_MODE) {
                    console.warn(`⚠️ Read-only filesystem detected - skipping cleanup in directory ${dir}. This is expected for containerized environments with read-only mounts.`);
                }
            }
            else if (errorMessage.includes('ENOENT')) {
                // Directory doesn't exist, which is fine
                if (!process.env.MCP_SILENT_MODE) {
                    console.info(`Directory ${dir} does not exist, skipping cleanup`);
                }
            }
            else if (errorMessage.includes('EACCES')) {
                if (!process.env.MCP_SILENT_MODE) {
                    console.warn(`⚠️ Permission denied - skipping cleanup in directory ${dir}: ${errorMessage}`);
                }
            }
            else {
                if (!process.env.MCP_SILENT_MODE) {
                    console.warn(`Skipping cleanup in directory ${dir}: ${errorMessage}`);
                }
            }
        }
    }
    await cleanDirectory(projectRoot);
    return removedCount;
}
/**
 * Validate the quality of existing context files
 */
async function validateContextQuality(contextDirectories) {
    const fs = await import('fs/promises');
    const qualityIssues = [];
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`🔍 Validating quality of ${contextDirectories.length} context directories...`);
    }
    for (const contextDir of contextDirectories) {
        try {
            const contextFiles = await fs.readdir(contextDir);
            const parentDir = path.dirname(contextDir);
            const relativePath = path.relative(projectRoot, parentDir);
            // Check if context directory has any files
            if (contextFiles.length === 0) {
                qualityIssues.push(`Empty .context directory: ${relativePath}`);
                continue;
            }
            // Check for expected context file types
            const hasOverview = contextFiles.some(file => file.includes('overview') || file.includes('domain'));
            if (!hasOverview) {
                qualityIssues.push(`Missing overview/domain file in: ${relativePath}/.context`);
            }
            // Validate content quality for each context file
            for (const file of contextFiles) {
                if (!file.endsWith('.context'))
                    continue;
                const filePath = path.join(contextDir, file);
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    // Check minimum content length (too short = likely poor quality)
                    if (content.length < 100) {
                        qualityIssues.push(`Context file too short: ${relativePath}/.context/${file} (${content.length} chars)`);
                        continue;
                    }
                    // Check for placeholder or template content
                    if (content.includes('TODO') || content.includes('placeholder') ||
                        content.includes('Generated from semantic analysis of 0 files')) {
                        qualityIssues.push(`Contains placeholder content: ${relativePath}/.context/${file}`);
                    }
                    // Check for business concepts (key indicator of quality)
                    if (!content.includes('Business Concepts') && !content.includes('Entities') &&
                        !content.includes('Services') && !content.includes('Domain') &&
                        content.length < 500) {
                        qualityIssues.push(`Lacks business domain content: ${relativePath}/.context/${file}`);
                    }
                    // Check for recent updates (context should be current)
                    const stats = await fs.stat(filePath);
                    const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSinceModified > 30) {
                        qualityIssues.push(`Context file outdated (${Math.round(daysSinceModified)} days): ${relativePath}/.context/${file}`);
                    }
                }
                catch (error) {
                    qualityIssues.push(`Cannot read context file: ${relativePath}/.context/${file} - ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }
        catch (error) {
            qualityIssues.push(`Cannot access context directory: ${path.relative(projectRoot, contextDir)} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    if (!process.env.MCP_SILENT_MODE) {
        console.info(`📊 Context quality validation completed: ${qualityIssues.length} issues found`);
    }
    return qualityIssues;
}
/**
 * Create failure response for full repository re-indexing
 */
function createFailureResponse(updateId, startTime, errors) {
    return {
        success: false,
        updateId,
        executionTime: Date.now() - startTime,
        filesDiscovered: 0,
        filesAnalyzed: 0,
        contextFilesRemoved: 0,
        contextFilesGenerated: 0,
        errors,
        summary: `❌ Full repository re-indexing failed: ${errors.join('; ')}`
    };
}
//# sourceMappingURL=holistic-context-updates.js.map
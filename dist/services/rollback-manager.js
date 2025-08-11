import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { AtomicFileManager } from './atomic-file-manager.js';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'rollback-manager.log' })
    ]
});
/**
 * Manages rollback operations for holistic context updates
 * Provides recovery mechanisms for failed context updates across multiple domains
 */
export class RollbackManager {
    stateDir;
    snapshotDir;
    atomicFileManager;
    cleanupConfig;
    constructor(baseDir = '.rollback-state', cleanupConfig) {
        this.stateDir = path.join(baseDir, 'state');
        this.snapshotDir = path.join(baseDir, 'snapshots');
        this.atomicFileManager = new AtomicFileManager(path.join(baseDir, 'atomic'));
        // Default cleanup configuration
        this.cleanupConfig = {
            maxAge: 24, // 24 hours
            maxCount: 10, // Keep max 10 rollbacks
            cleanupTriggers: ['full-reindex', 'startup'],
            aggressiveCleanup: false,
            ...cleanupConfig
        };
        this.ensureDirectories();
        // Auto-cleanup on startup if configured
        if (this.cleanupConfig.cleanupTriggers.includes('startup')) {
            this.performAutomaticCleanup('startup').catch(error => {
                logger.warn('Startup cleanup failed:', error);
            });
        }
    }
    /**
     * Create a comprehensive snapshot before holistic update
     */
    async createHolisticSnapshot(updateId, affectedDomains, contextBasePath = '.') {
        logger.info(`Creating holistic snapshot for update ${updateId} affecting ${affectedDomains.length} domains`);
        const snapshots = [];
        const allFileOperations = [];
        for (const domain of affectedDomains) {
            const domainContextPath = path.join(contextBasePath, domain, '.context');
            if (fs.existsSync(domainContextPath)) {
                const snapshot = await this.createDomainSnapshot(domain, domainContextPath);
                snapshots.push(snapshot);
                // Create file operations for potential rollback
                for (const [filePath, content] of Object.entries(snapshot.files)) {
                    allFileOperations.push({
                        type: 'update',
                        targetPath: filePath,
                        content,
                        originalContent: content
                    });
                }
            }
            else {
                logger.warn(`Domain context path does not exist: ${domainContextPath}`);
                // Create empty snapshot for domains without existing context
                snapshots.push({
                    domainPath: domainContextPath,
                    files: {},
                    timestamp: new Date()
                });
            }
        }
        const rollbackData = {
            updateId,
            timestamp: new Date(),
            affectedDomains,
            snapshots,
            fileOperations: allFileOperations
        };
        // Save rollback data to persistent storage
        await this.saveRollbackData(rollbackData);
        logger.info(`Created holistic snapshot with ${snapshots.length} domain snapshots and ${allFileOperations.length} file operations`);
        return rollbackData;
    }
    /**
     * Create snapshot of a single domain's context
     */
    async createDomainSnapshot(domain, domainContextPath) {
        const files = {};
        if (fs.existsSync(domainContextPath)) {
            const contextFiles = await this.getAllContextFiles(domainContextPath);
            for (const filePath of contextFiles) {
                try {
                    const content = await fs.promises.readFile(filePath, 'utf8');
                    files[filePath] = content;
                }
                catch (error) {
                    logger.warn(`Failed to read context file ${filePath}:`, error);
                }
            }
        }
        return {
            domainPath: domainContextPath,
            files,
            timestamp: new Date()
        };
    }
    /**
     * Execute holistic rollback using snapshot data
     */
    async executeHolisticRollback(updateId) {
        logger.info(`Executing holistic rollback for update ${updateId}`);
        try {
            // Load rollback data
            const rollbackData = await this.loadRollbackData(updateId);
            if (!rollbackData) {
                throw new Error(`No rollback data found for update ${updateId}`);
            }
            // Prepare file operations for atomic execution
            const restoreOperations = [];
            for (const snapshot of rollbackData.snapshots) {
                // First, delete any files that might have been created during the failed update
                if (fs.existsSync(snapshot.domainPath)) {
                    const currentFiles = await this.getAllContextFiles(snapshot.domainPath);
                    for (const currentFile of currentFiles) {
                        if (!snapshot.files[currentFile]) {
                            // File exists now but didn't exist in snapshot - delete it
                            restoreOperations.push({
                                type: 'delete',
                                targetPath: currentFile
                            });
                        }
                    }
                }
                // Restore files from snapshot
                for (const [filePath, content] of Object.entries(snapshot.files)) {
                    const operation = fs.existsSync(filePath)
                        ? { type: 'update', targetPath: filePath, content }
                        : { type: 'create', targetPath: filePath, content };
                    restoreOperations.push(operation);
                }
            }
            // Execute all restore operations atomically
            const result = await this.atomicFileManager.executeAtomicOperations(restoreOperations);
            if (result.success) {
                logger.info(`Successfully rolled back holistic update ${updateId} with ${restoreOperations.length} operations`);
                // Mark rollback as completed
                await this.markRollbackCompleted(updateId);
                return true;
            }
            else {
                logger.error(`Failed to execute atomic rollback for update ${updateId}:`, result.error);
                return false;
            }
        }
        catch (error) {
            logger.error(`Holistic rollback failed for update ${updateId}:`, error);
            return false;
        }
    }
    /**
     * Save rollback data to persistent storage
     */
    async saveRollbackData(rollbackData) {
        const stateFilePath = path.join(this.stateDir, `${rollbackData.updateId}.rollback.json`);
        const snapshotFilePath = path.join(this.snapshotDir, `${rollbackData.updateId}.snapshot.json`);
        // Save lightweight state information
        const stateInfo = {
            updateId: rollbackData.updateId,
            timestamp: rollbackData.timestamp,
            affectedDomains: rollbackData.affectedDomains,
            status: 'pending',
            snapshotPath: snapshotFilePath
        };
        await fs.promises.writeFile(stateFilePath, JSON.stringify(stateInfo, null, 2));
        // Save complete snapshot data
        await fs.promises.writeFile(snapshotFilePath, JSON.stringify(rollbackData, null, 2));
        logger.debug(`Saved rollback data for update ${rollbackData.updateId}`);
    }
    /**
     * Load rollback data from persistent storage
     */
    async loadRollbackData(updateId) {
        const snapshotFilePath = path.join(this.snapshotDir, `${updateId}.snapshot.json`);
        if (!fs.existsSync(snapshotFilePath)) {
            return null;
        }
        try {
            const content = await fs.promises.readFile(snapshotFilePath, 'utf8');
            const rollbackData = JSON.parse(content);
            // Convert timestamp back to Date object
            rollbackData.timestamp = new Date(rollbackData.timestamp);
            rollbackData.snapshots.forEach(snapshot => {
                snapshot.timestamp = new Date(snapshot.timestamp);
            });
            return rollbackData;
        }
        catch (error) {
            logger.error(`Failed to load rollback data for update ${updateId}:`, error);
            return null;
        }
    }
    /**
     * Mark rollback as completed
     */
    async markRollbackCompleted(updateId) {
        const stateFilePath = path.join(this.stateDir, `${updateId}.rollback.json`);
        if (fs.existsSync(stateFilePath)) {
            const content = await fs.promises.readFile(stateFilePath, 'utf8');
            const stateInfo = JSON.parse(content);
            stateInfo.status = 'completed';
            stateInfo.completedAt = new Date().toISOString();
            await fs.promises.writeFile(stateFilePath, JSON.stringify(stateInfo, null, 2));
        }
    }
    /**
     * Get all context files recursively from a domain's .context directory
     */
    async getAllContextFiles(contextPath) {
        const files = [];
        if (!fs.existsSync(contextPath)) {
            return files;
        }
        const entries = await fs.promises.readdir(contextPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(contextPath, entry.name);
            if (entry.isDirectory()) {
                // Recursively get files from subdirectories
                const subFiles = await this.getAllContextFiles(fullPath);
                files.push(...subFiles);
            }
            else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
        return files;
    }
    /**
     * List all pending rollbacks
     */
    async getPendingRollbacks() {
        const states = [];
        if (!fs.existsSync(this.stateDir)) {
            return states;
        }
        const stateFiles = await fs.promises.readdir(this.stateDir);
        for (const stateFile of stateFiles) {
            if (stateFile.endsWith('.rollback.json')) {
                try {
                    const content = await fs.promises.readFile(path.join(this.stateDir, stateFile), 'utf8');
                    const stateInfo = JSON.parse(content);
                    if (stateInfo.status === 'pending') {
                        states.push({
                            transactionId: stateInfo.updateId,
                            timestamp: new Date(stateInfo.timestamp),
                            operations: [], // Loaded on demand
                            status: stateInfo.status,
                            contextUpdateId: stateInfo.updateId,
                            affectedDomains: stateInfo.affectedDomains,
                            failureReason: stateInfo.failureReason,
                            cleanupEligible: stateInfo.cleanupEligible || false
                        });
                    }
                }
                catch (error) {
                    logger.warn(`Failed to parse rollback state file ${stateFile}:`, error);
                }
            }
        }
        return states;
    }
    /**
     * Clean up completed rollback data
     */
    async cleanupCompletedRollbacks(olderThanHours = 168) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        if (fs.existsSync(this.stateDir)) {
            const stateFiles = await fs.promises.readdir(this.stateDir);
            for (const stateFile of stateFiles) {
                if (stateFile.endsWith('.rollback.json')) {
                    const stateFilePath = path.join(this.stateDir, stateFile);
                    const stats = await fs.promises.stat(stateFilePath);
                    if (stats.mtime.getTime() < cutoffTime) {
                        try {
                            const content = await fs.promises.readFile(stateFilePath, 'utf8');
                            const stateInfo = JSON.parse(content);
                            if (stateInfo.status === 'completed') {
                                // Remove state file
                                await fs.promises.unlink(stateFilePath);
                                // Remove snapshot file
                                const snapshotFile = path.join(this.snapshotDir, `${stateInfo.updateId}.snapshot.json`);
                                if (fs.existsSync(snapshotFile)) {
                                    await fs.promises.unlink(snapshotFile);
                                }
                                logger.info(`Cleaned up completed rollback data for update ${stateInfo.updateId}`);
                            }
                        }
                        catch (error) {
                            logger.warn(`Failed to cleanup rollback file ${stateFile}:`, error);
                        }
                    }
                }
            }
        }
    }
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.stateDir)) {
            fs.mkdirSync(this.stateDir, { recursive: true });
        }
        if (!fs.existsSync(this.snapshotDir)) {
            fs.mkdirSync(this.snapshotDir, { recursive: true });
        }
    }
    /**
     * Perform automatic cleanup based on trigger
     */
    async performAutomaticCleanup(trigger) {
        const startTime = Date.now();
        logger.info(`Performing automatic rollback cleanup triggered by: ${trigger}`);
        let removedCount = 0;
        const errors = [];
        try {
            // Age-based cleanup
            const ageCleanupResult = await this.cleanupByAge(this.cleanupConfig.maxAge);
            removedCount += ageCleanupResult.removedCount;
            errors.push(...ageCleanupResult.errors);
            // Count-based cleanup (keep only the most recent maxCount)
            const countCleanupResult = await this.cleanupByCount(this.cleanupConfig.maxCount);
            removedCount += countCleanupResult.removedCount;
            errors.push(...countCleanupResult.errors);
            // Cleanup failed rollbacks older than 1 hour
            const failedCleanupResult = await this.cleanupFailedRollbacks(1);
            removedCount += failedCleanupResult.removedCount;
            errors.push(...failedCleanupResult.errors);
            const executionTime = Date.now() - startTime;
            logger.info(`Automatic cleanup completed: ${removedCount} rollbacks removed in ${executionTime}ms`);
            return {
                removedCount,
                errors,
                cleanupTrigger: trigger,
                executionTime
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            logger.error('Automatic cleanup failed:', error);
            errors.push(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                removedCount,
                errors,
                cleanupTrigger: trigger,
                executionTime
            };
        }
    }
    /**
     * Clean up rollbacks older than specified hours
     */
    async cleanupByAge(olderThanHours) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        let removedCount = 0;
        const errors = [];
        if (!fs.existsSync(this.stateDir)) {
            return { removedCount: 0, errors: [], cleanupTrigger: 'age-based', executionTime: 0 };
        }
        const stateFiles = await fs.promises.readdir(this.stateDir);
        for (const stateFile of stateFiles) {
            if (stateFile.endsWith('.rollback.json')) {
                try {
                    const stateFilePath = path.join(this.stateDir, stateFile);
                    const content = await fs.promises.readFile(stateFilePath, 'utf8');
                    const stateInfo = JSON.parse(content);
                    const rollbackTime = new Date(stateInfo.timestamp).getTime();
                    if (rollbackTime < cutoffTime) {
                        await this.removeRollbackData(stateInfo.updateId);
                        removedCount++;
                        logger.debug(`Cleaned up aged rollback: ${stateInfo.updateId}`);
                    }
                }
                catch (error) {
                    const errorMsg = `Failed to cleanup aged rollback ${stateFile}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    logger.warn(errorMsg);
                }
            }
        }
        return { removedCount, errors, cleanupTrigger: 'age-based', executionTime: 0 };
    }
    /**
     * Clean up excess rollbacks, keeping only the most recent count
     */
    async cleanupByCount(maxCount) {
        let removedCount = 0;
        const errors = [];
        try {
            const rollbacks = await this.getPendingRollbacks();
            if (rollbacks.length <= maxCount) {
                return { removedCount: 0, errors: [], cleanupTrigger: 'count-based', executionTime: 0 };
            }
            // Sort by timestamp (oldest first)
            const sortedRollbacks = rollbacks.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            // Remove oldest rollbacks to keep only maxCount
            const toRemove = sortedRollbacks.slice(0, rollbacks.length - maxCount);
            for (const rollback of toRemove) {
                try {
                    await this.removeRollbackData(rollback.transactionId);
                    removedCount++;
                    logger.debug(`Cleaned up excess rollback: ${rollback.transactionId}`);
                }
                catch (error) {
                    const errorMsg = `Failed to remove rollback ${rollback.transactionId}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    logger.warn(errorMsg);
                }
            }
        }
        catch (error) {
            const errorMsg = `Count-based cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            logger.error(errorMsg);
        }
        return { removedCount, errors, cleanupTrigger: 'count-based', executionTime: 0 };
    }
    /**
     * Clean up failed rollbacks older than specified hours
     */
    async cleanupFailedRollbacks(olderThanHours) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        let removedCount = 0;
        const errors = [];
        if (!fs.existsSync(this.stateDir)) {
            return { removedCount: 0, errors: [], cleanupTrigger: 'failed-rollback', executionTime: 0 };
        }
        const stateFiles = await fs.promises.readdir(this.stateDir);
        for (const stateFile of stateFiles) {
            if (stateFile.endsWith('.rollback.json')) {
                try {
                    const stateFilePath = path.join(this.stateDir, stateFile);
                    const content = await fs.promises.readFile(stateFilePath, 'utf8');
                    const stateInfo = JSON.parse(content);
                    const rollbackTime = new Date(stateInfo.timestamp).getTime();
                    if (stateInfo.status === 'failed' && rollbackTime < cutoffTime) {
                        await this.removeRollbackData(stateInfo.updateId);
                        removedCount++;
                        logger.debug(`Cleaned up failed rollback: ${stateInfo.updateId}`);
                    }
                }
                catch (error) {
                    const errorMsg = `Failed to cleanup failed rollback ${stateFile}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    logger.warn(errorMsg);
                }
            }
        }
        return { removedCount, errors, cleanupTrigger: 'failed-rollback', executionTime: 0 };
    }
    /**
     * Remove rollback data completely
     */
    async removeRollbackData(updateId) {
        const stateFilePath = path.join(this.stateDir, `${updateId}.rollback.json`);
        const snapshotFilePath = path.join(this.snapshotDir, `${updateId}.snapshot.json`);
        // Remove state file
        if (fs.existsSync(stateFilePath)) {
            await fs.promises.unlink(stateFilePath);
        }
        // Remove snapshot file
        if (fs.existsSync(snapshotFilePath)) {
            await fs.promises.unlink(snapshotFilePath);
        }
        logger.debug(`Removed rollback data for update ${updateId}`);
    }
    /**
     * Mark rollback as failed with detailed error information
     */
    async markRollbackFailed(updateId, error, contextDetails) {
        const stateFilePath = path.join(this.stateDir, `${updateId}.rollback.json`);
        if (fs.existsSync(stateFilePath)) {
            const content = await fs.promises.readFile(stateFilePath, 'utf8');
            const stateInfo = JSON.parse(content);
            stateInfo.status = 'failed';
            stateInfo.failedAt = new Date().toISOString();
            stateInfo.failureReason = error instanceof Error ? error.message : String(error);
            stateInfo.errorStack = error instanceof Error ? error.stack : undefined;
            stateInfo.contextDetails = contextDetails;
            stateInfo.cleanupEligible = true;
            await fs.promises.writeFile(stateFilePath, JSON.stringify(stateInfo, null, 2));
            logger.error(`Marked rollback ${updateId} as failed:`, {
                error: stateInfo.failureReason,
                context: contextDetails
            });
        }
    }
    /**
     * Trigger cleanup based on event
     */
    async triggerCleanup(trigger) {
        if (this.cleanupConfig.cleanupTriggers.includes(trigger) || trigger === 'manual-cleanup') {
            return await this.performAutomaticCleanup(trigger);
        }
        logger.debug(`Cleanup trigger '${trigger}' not configured - skipping cleanup`);
        return {
            removedCount: 0,
            errors: [],
            cleanupTrigger: trigger,
            executionTime: 0
        };
    }
    /**
     * Validate rollback data integrity
     */
    async validateRollbackData(updateId) {
        const rollbackData = await this.loadRollbackData(updateId);
        if (!rollbackData) {
            return false;
        }
        // Validate that all referenced files exist in snapshots
        for (const snapshot of rollbackData.snapshots) {
            for (const filePath of Object.keys(snapshot.files)) {
                if (!path.isAbsolute(filePath)) {
                    logger.warn(`Invalid relative path in snapshot: ${filePath}`);
                    return false;
                }
            }
        }
        logger.debug(`Rollback data validation passed for update ${updateId}`);
        return true;
    }
    /**
     * Get cleanup statistics
     */
    async getCleanupStatistics() {
        const pendingRollbacks = await this.getPendingRollbacks();
        const oldestRollback = pendingRollbacks.length > 0
            ? new Date(Math.min(...pendingRollbacks.map(r => r.timestamp.getTime())))
            : null;
        return {
            totalPendingRollbacks: pendingRollbacks.length,
            oldestRollbackAge: oldestRollback ? Date.now() - oldestRollback.getTime() : 0,
            cleanupConfig: this.cleanupConfig,
            rollbacksByAge: {
                lessThan1Hour: pendingRollbacks.filter(r => Date.now() - r.timestamp.getTime() < 3600000).length,
                lessThan24Hours: pendingRollbacks.filter(r => Date.now() - r.timestamp.getTime() < 86400000).length,
                moreThan24Hours: pendingRollbacks.filter(r => Date.now() - r.timestamp.getTime() >= 86400000).length
            }
        };
    }
}
//# sourceMappingURL=rollback-manager.js.map
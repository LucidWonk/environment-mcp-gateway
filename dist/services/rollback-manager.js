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
    constructor(baseDir = '.rollback-state') {
        this.stateDir = path.join(baseDir, 'state');
        this.snapshotDir = path.join(baseDir, 'snapshots');
        this.atomicFileManager = new AtomicFileManager(path.join(baseDir, 'atomic'));
        this.ensureDirectories();
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
                            affectedDomains: stateInfo.affectedDomains
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
}
//# sourceMappingURL=rollback-manager.js.map
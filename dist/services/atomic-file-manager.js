import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import winston from 'winston';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'atomic-file-manager.log' })
    ]
});
/**
 * Manages atomic file operations with full rollback capability
 * Ensures all file operations either complete successfully or are completely reverted
 */
export class AtomicFileManager {
    tempDir;
    backupDir;
    constructor(baseDir = '.atomic-ops') {
        this.tempDir = path.join(baseDir, 'temp');
        this.backupDir = path.join(baseDir, 'backup');
        this.ensureDirectories();
    }
    /**
     * Execute multiple file operations atomically
     * All operations succeed or all are rolled back
     */
    async executeAtomicOperations(operations) {
        const transactionId = this.generateTransactionId();
        const executedOperations = [];
        logger.info(`Starting atomic operation transaction ${transactionId} with ${operations.length} operations`);
        try {
            // Phase 1: Validate all operations can be performed
            await this.validateOperations(operations);
            // Phase 2: Create backups for existing files
            const rollbackData = await this.createBackups(operations, transactionId);
            // Phase 3: Execute operations in order
            for (const operation of operations) {
                await this.executeOperation(operation);
                executedOperations.push(operation);
                logger.debug(`Executed operation: ${operation.type} on ${operation.targetPath}`);
            }
            // Phase 4: Cleanup temporary data
            await this.cleanupTransaction(transactionId);
            logger.info(`Atomic operation transaction ${transactionId} completed successfully`);
            return {
                success: true,
                operationsExecuted: executedOperations,
                rollbackData
            };
        }
        catch (error) {
            logger.error(`Atomic operation transaction ${transactionId} failed:`, error);
            // Attempt rollback of executed operations
            try {
                await this.rollbackOperations(executedOperations, transactionId);
                logger.info(`Successfully rolled back ${executedOperations.length} operations`);
            }
            catch (rollbackError) {
                logger.error(`Rollback failed for transaction ${transactionId}:`, rollbackError);
            }
            return {
                success: false,
                operationsExecuted: executedOperations,
                error: error
            };
        }
    }
    /**
     * Validate that all operations can be performed
     */
    async validateOperations(operations) {
        for (const operation of operations) {
            switch (operation.type) {
                case 'create':
                    // Check that target directory exists or can be created
                    const targetDir = path.dirname(operation.targetPath);
                    if (!fs.existsSync(targetDir)) {
                        await fs.promises.mkdir(targetDir, { recursive: true });
                    }
                    // Check that file doesn't already exist (for create operations)
                    if (fs.existsSync(operation.targetPath)) {
                        throw new Error(`Cannot create file - already exists: ${operation.targetPath}`);
                    }
                    break;
                case 'update':
                    // Check that file exists for update
                    if (!fs.existsSync(operation.targetPath)) {
                        throw new Error(`Cannot update file - does not exist: ${operation.targetPath}`);
                    }
                    // Check write permissions
                    try {
                        await fs.promises.access(operation.targetPath, fs.constants.W_OK);
                    }
                    catch {
                        throw new Error(`No write permission for file: ${operation.targetPath}`);
                    }
                    break;
                case 'delete':
                    // Check that file exists for deletion
                    if (!fs.existsSync(operation.targetPath)) {
                        throw new Error(`Cannot delete file - does not exist: ${operation.targetPath}`);
                    }
                    break;
            }
        }
    }
    /**
     * Create backups for existing files that will be modified or deleted
     */
    async createBackups(operations, transactionId) {
        const rollbackOperations = [];
        const backupTransactionDir = path.join(this.backupDir, transactionId);
        await fs.promises.mkdir(backupTransactionDir, { recursive: true });
        for (const operation of operations) {
            if (operation.type === 'update' || operation.type === 'delete') {
                if (fs.existsSync(operation.targetPath)) {
                    const backupPath = path.join(backupTransactionDir, this.generateBackupFileName(operation.targetPath));
                    const originalContent = await fs.promises.readFile(operation.targetPath, 'utf8');
                    await fs.promises.writeFile(backupPath, originalContent);
                    // Store rollback information
                    rollbackOperations.push({
                        type: operation.type === 'delete' ? 'create' : 'update',
                        targetPath: operation.targetPath,
                        content: originalContent,
                        backupPath
                    });
                }
            }
        }
        return {
            operations: rollbackOperations,
            timestamp: new Date(),
            transactionId
        };
    }
    /**
     * Execute a single file operation
     */
    async executeOperation(operation) {
        switch (operation.type) {
            case 'create':
            case 'update':
                if (operation.content === undefined) {
                    throw new Error(`Content required for ${operation.type} operation on ${operation.targetPath}`);
                }
                // Ensure target directory exists
                const targetDir = path.dirname(operation.targetPath);
                await fs.promises.mkdir(targetDir, { recursive: true });
                await fs.promises.writeFile(operation.targetPath, operation.content, 'utf8');
                break;
            case 'delete':
                await fs.promises.unlink(operation.targetPath);
                break;
        }
    }
    /**
     * Rollback executed operations
     */
    async rollbackOperations(executedOperations, transactionId) {
        logger.info(`Rolling back ${executedOperations.length} operations for transaction ${transactionId}`);
        const backupTransactionDir = path.join(this.backupDir, transactionId);
        // Rollback in reverse order
        for (let i = executedOperations.length - 1; i >= 0; i--) {
            const operation = executedOperations[i];
            try {
                switch (operation.type) {
                    case 'create':
                        // Delete the created file
                        if (fs.existsSync(operation.targetPath)) {
                            await fs.promises.unlink(operation.targetPath);
                        }
                        break;
                    case 'update':
                        // Restore from backup
                        const backupPath = path.join(backupTransactionDir, this.generateBackupFileName(operation.targetPath));
                        if (fs.existsSync(backupPath)) {
                            const originalContent = await fs.promises.readFile(backupPath, 'utf8');
                            await fs.promises.writeFile(operation.targetPath, originalContent, 'utf8');
                        }
                        break;
                    case 'delete':
                        // Restore deleted file from backup
                        const deletedBackupPath = path.join(backupTransactionDir, this.generateBackupFileName(operation.targetPath));
                        if (fs.existsSync(deletedBackupPath)) {
                            const originalContent = await fs.promises.readFile(deletedBackupPath, 'utf8');
                            const targetDir = path.dirname(operation.targetPath);
                            await fs.promises.mkdir(targetDir, { recursive: true });
                            await fs.promises.writeFile(operation.targetPath, originalContent, 'utf8');
                        }
                        break;
                }
                logger.debug(`Rolled back operation: ${operation.type} on ${operation.targetPath}`);
            }
            catch (error) {
                logger.error(`Failed to rollback operation ${operation.type} on ${operation.targetPath}:`, error);
                throw error;
            }
        }
    }
    /**
     * Cleanup transaction data after successful completion
     */
    async cleanupTransaction(transactionId) {
        const backupTransactionDir = path.join(this.backupDir, transactionId);
        if (fs.existsSync(backupTransactionDir)) {
            await fs.promises.rm(backupTransactionDir, { recursive: true, force: true });
        }
        logger.debug(`Cleaned up transaction ${transactionId}`);
    }
    /**
     * Generate unique transaction ID
     */
    generateTransactionId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `tx_${timestamp}_${random}`;
    }
    /**
     * Generate backup file name from target path
     */
    generateBackupFileName(targetPath) {
        const hash = createHash('md5').update(targetPath).digest('hex').substring(0, 8);
        const basename = path.basename(targetPath);
        return `${basename}_${hash}`;
    }
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    /**
     * Get pending transactions (for recovery)
     */
    async getPendingTransactions() {
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }
        const entries = await fs.promises.readdir(this.backupDir, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .filter(name => name.startsWith('tx_'));
    }
    /**
     * Clean up old transactions (manual cleanup for failed transactions)
     */
    async cleanupOldTransactions(olderThanHours = 24) {
        const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        const transactions = await this.getPendingTransactions();
        for (const transactionId of transactions) {
            const transactionPath = path.join(this.backupDir, transactionId);
            const stats = await fs.promises.stat(transactionPath);
            if (stats.mtime.getTime() < cutoffTime) {
                await fs.promises.rm(transactionPath, { recursive: true, force: true });
                logger.info(`Cleaned up old transaction: ${transactionId}`);
            }
        }
    }
}
//# sourceMappingURL=atomic-file-manager.js.map
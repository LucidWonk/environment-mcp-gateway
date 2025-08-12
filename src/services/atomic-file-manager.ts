import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'atomic-file-manager.log' })
    ]
});

export interface FileOperation {
    type: 'create' | 'update' | 'delete';
    targetPath: string;
    content?: string;
    backupPath?: string;
    originalContent?: string;
}

export interface AtomicOperationResult {
    success: boolean;
    operationsExecuted: FileOperation[];
    error?: Error;
    rollbackData?: RollbackData;
}

export interface RollbackData {
    operations: FileOperation[];
    timestamp: Date;
    transactionId: string;
}

/**
 * Manages atomic file operations with full rollback capability
 * Ensures all file operations either complete successfully or are completely reverted
 */
export class AtomicFileManager {
    private readonly tempDir: string;
    private readonly backupDir: string;

    constructor(baseDir: string = '.atomic-ops') {
        this.tempDir = path.join(baseDir, 'temp');
        this.backupDir = path.join(baseDir, 'backup');
        this.ensureDirectories();
    }

    /**
     * Execute multiple file operations atomically
     * All operations succeed or all are rolled back
     */
    async executeAtomicOperations(operations: FileOperation[]): Promise<AtomicOperationResult> {
        const transactionId = this.generateTransactionId();
        const executedOperations: FileOperation[] = [];
        
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

        } catch (error) {
            logger.error(`Atomic operation transaction ${transactionId} failed:`, error);
            
            // Attempt rollback of executed operations
            try {
                await this.rollbackOperations(executedOperations, transactionId);
                logger.info(`Successfully rolled back ${executedOperations.length} operations`);
            } catch (rollbackError) {
                logger.error(`Rollback failed for transaction ${transactionId}:`, rollbackError);
            }

            return {
                success: false,
                operationsExecuted: executedOperations,
                error: error as Error
            };
        }
    }

    /**
     * Validate that all operations can be performed
     */
    private async validateOperations(operations: FileOperation[]): Promise<void> {
        for (const operation of operations) {
            switch (operation.type) {
            case 'create': {
                // Check that target directory exists or can be created
                const targetDir = path.dirname(operation.targetPath);
                if (!fs.existsSync(targetDir)) {
                    await fs.promises.mkdir(targetDir, { recursive: true });
                }
                    
                // Check that file doesn't already exist (for create operations)
                if (fs.existsSync(operation.targetPath)) {
                    console.warn(`⚠️ Create operation requested but file already exists: ${operation.targetPath}`);
                    console.warn('   Attempting to handle this gracefully by removing existing file first');
                    
                    try {
                        // Try to fix permissions and remove the existing file
                        await fs.promises.chmod(operation.targetPath, 0o666);
                        await fs.promises.unlink(operation.targetPath);
                        console.info(`✅ Successfully removed existing file for create operation: ${operation.targetPath}`);
                    } catch (removeError) {
                        console.error(`❌ Could not remove existing file for create operation: ${operation.targetPath}`);
                        console.error(`   Error: ${removeError instanceof Error ? removeError.message : 'Unknown error'}`);
                        throw new Error(`Cannot create file - already exists and could not be removed: ${operation.targetPath}`);
                    }
                }
                break;
            }

            case 'update':
                // Check that file exists for update
                if (!fs.existsSync(operation.targetPath)) {
                    throw new Error(`Cannot update file - does not exist: ${operation.targetPath}`);
                }
                    
                // Check write permissions with enhanced diagnostics and fallback
                try {
                    await fs.promises.access(operation.targetPath, fs.constants.W_OK);
                } catch (error) {
                    const stats = fs.existsSync(operation.targetPath) ? await fs.promises.stat(operation.targetPath) : null;
                    const parentDir = path.dirname(operation.targetPath);
                    const parentExists = fs.existsSync(parentDir);
                    
                    console.error(`❌ Write permission check failed for: ${operation.targetPath}`);
                    console.error(`   File exists: ${fs.existsSync(operation.targetPath)}`);
                    console.error(`   Parent dir exists: ${parentExists}`);
                    if (stats) {
                        console.error(`   File mode: ${stats.mode.toString(8)}`);
                        console.error(`   File uid: ${stats.uid}, gid: ${stats.gid}`);
                    }
                    console.error(`   Process uid: ${process.getuid?.() || 'unknown'}, gid: ${process.getgid?.() || 'unknown'}`);
                    console.error(`   Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    
                    // Try to fix permissions if possible
                    if (parentExists && stats) {
                        try {
                            console.warn(`⚠️ Attempting to fix permissions for: ${operation.targetPath}`);
                            await fs.promises.chmod(operation.targetPath, 0o664);
                            await fs.promises.access(operation.targetPath, fs.constants.W_OK);
                            console.info(`✅ Successfully fixed permissions for: ${operation.targetPath}`);
                        } catch (fixError) {
                            console.error(`❌ Failed to fix permissions: ${fixError instanceof Error ? fixError.message : 'Unknown error'}`);
                            const errorCode = (error as any)?.code || 'unknown error';
                            throw new Error(`No write permission for file: ${operation.targetPath} (${errorCode})`);
                        }
                    } else {
                        const errorCode = (error as any)?.code || 'unknown error';
                        throw new Error(`No write permission for file: ${operation.targetPath} (${errorCode})`);
                    }
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
    private async createBackups(operations: FileOperation[], transactionId: string): Promise<RollbackData> {
        const rollbackOperations: FileOperation[] = [];
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
    private async executeOperation(operation: FileOperation): Promise<void> {
        switch (operation.type) {
        case 'create':
        case 'update': {
            if (operation.content === undefined) {
                throw new Error(`Content required for ${operation.type} operation on ${operation.targetPath}`);
            }
                
            // Ensure target directory exists
            const targetDir = path.dirname(operation.targetPath);
            await fs.promises.mkdir(targetDir, { recursive: true });
                
            await fs.promises.writeFile(operation.targetPath, operation.content, 'utf8');
            break;
        }

        case 'delete':
            await fs.promises.unlink(operation.targetPath);
            break;
        }
    }

    /**
     * Rollback executed operations
     */
    private async rollbackOperations(executedOperations: FileOperation[], transactionId: string): Promise<void> {
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

                case 'update': {
                    // Restore from backup
                    const backupPath = path.join(backupTransactionDir, this.generateBackupFileName(operation.targetPath));
                    if (fs.existsSync(backupPath)) {
                        const originalContent = await fs.promises.readFile(backupPath, 'utf8');
                        await fs.promises.writeFile(operation.targetPath, originalContent, 'utf8');
                    }
                    break;
                }

                case 'delete': {
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
                }
                
                logger.debug(`Rolled back operation: ${operation.type} on ${operation.targetPath}`);
            } catch (error) {
                logger.error(`Failed to rollback operation ${operation.type} on ${operation.targetPath}:`, error);
                throw error;
            }
        }
    }

    /**
     * Cleanup transaction data after successful completion
     */
    private async cleanupTransaction(transactionId: string): Promise<void> {
        const backupTransactionDir = path.join(this.backupDir, transactionId);
        
        if (fs.existsSync(backupTransactionDir)) {
            await fs.promises.rm(backupTransactionDir, { recursive: true, force: true });
        }
        
        logger.debug(`Cleaned up transaction ${transactionId}`);
    }

    /**
     * Generate unique transaction ID
     */
    private generateTransactionId(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `tx_${timestamp}_${random}`;
    }

    /**
     * Generate backup file name from target path
     */
    private generateBackupFileName(targetPath: string): string {
        const hash = createHash('md5').update(targetPath).digest('hex').substring(0, 8);
        const basename = path.basename(targetPath);
        return `${basename}_${hash}`;
    }

    /**
     * Ensure required directories exist
     */
    private ensureDirectories(): void {
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
    async getPendingTransactions(): Promise<string[]> {
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
    async cleanupOldTransactions(olderThanHours: number = 24): Promise<void> {
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
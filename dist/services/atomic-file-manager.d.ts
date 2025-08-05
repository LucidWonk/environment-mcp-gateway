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
export declare class AtomicFileManager {
    private readonly tempDir;
    private readonly backupDir;
    constructor(baseDir?: string);
    /**
     * Execute multiple file operations atomically
     * All operations succeed or all are rolled back
     */
    executeAtomicOperations(operations: FileOperation[]): Promise<AtomicOperationResult>;
    /**
     * Validate that all operations can be performed
     */
    private validateOperations;
    /**
     * Create backups for existing files that will be modified or deleted
     */
    private createBackups;
    /**
     * Execute a single file operation
     */
    private executeOperation;
    /**
     * Rollback executed operations
     */
    private rollbackOperations;
    /**
     * Cleanup transaction data after successful completion
     */
    private cleanupTransaction;
    /**
     * Generate unique transaction ID
     */
    private generateTransactionId;
    /**
     * Generate backup file name from target path
     */
    private generateBackupFileName;
    /**
     * Ensure required directories exist
     */
    private ensureDirectories;
    /**
     * Get pending transactions (for recovery)
     */
    getPendingTransactions(): Promise<string[]>;
    /**
     * Clean up old transactions (manual cleanup for failed transactions)
     */
    cleanupOldTransactions(olderThanHours?: number): Promise<void>;
}
//# sourceMappingURL=atomic-file-manager.d.ts.map
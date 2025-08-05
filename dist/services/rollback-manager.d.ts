import { FileOperation } from './atomic-file-manager.js';
export interface RollbackState {
    transactionId: string;
    timestamp: Date;
    operations: FileOperation[];
    status: 'pending' | 'completed' | 'failed';
    contextUpdateId?: string;
    affectedDomains: string[];
}
export interface ContextSnapshot {
    domainPath: string;
    files: {
        [filePath: string]: string;
    };
    timestamp: Date;
}
export interface HolisticRollbackData {
    updateId: string;
    timestamp: Date;
    affectedDomains: string[];
    snapshots: ContextSnapshot[];
    fileOperations: FileOperation[];
}
/**
 * Manages rollback operations for holistic context updates
 * Provides recovery mechanisms for failed context updates across multiple domains
 */
export declare class RollbackManager {
    private readonly stateDir;
    private readonly snapshotDir;
    private readonly atomicFileManager;
    constructor(baseDir?: string);
    /**
     * Create a comprehensive snapshot before holistic update
     */
    createHolisticSnapshot(updateId: string, affectedDomains: string[], contextBasePath?: string): Promise<HolisticRollbackData>;
    /**
     * Create snapshot of a single domain's context
     */
    private createDomainSnapshot;
    /**
     * Execute holistic rollback using snapshot data
     */
    executeHolisticRollback(updateId: string): Promise<boolean>;
    /**
     * Save rollback data to persistent storage
     */
    private saveRollbackData;
    /**
     * Load rollback data from persistent storage
     */
    private loadRollbackData;
    /**
     * Mark rollback as completed
     */
    private markRollbackCompleted;
    /**
     * Get all context files recursively from a domain's .context directory
     */
    private getAllContextFiles;
    /**
     * List all pending rollbacks
     */
    getPendingRollbacks(): Promise<RollbackState[]>;
    /**
     * Clean up completed rollback data
     */
    cleanupCompletedRollbacks(olderThanHours?: number): Promise<void>;
    /**
     * Ensure required directories exist
     */
    private ensureDirectories;
    /**
     * Validate rollback data integrity
     */
    validateRollbackData(updateId: string): Promise<boolean>;
}
//# sourceMappingURL=rollback-manager.d.ts.map
import { FileOperation } from './atomic-file-manager.js';
export interface RollbackState {
    transactionId: string;
    timestamp: Date;
    operations: FileOperation[];
    status: 'pending' | 'completed' | 'failed';
    contextUpdateId?: string;
    affectedDomains: string[];
    failureReason?: string;
    cleanupEligible: boolean;
}
export interface RollbackCleanupConfig {
    maxAge: number;
    maxCount: number;
    cleanupTriggers: string[];
    aggressiveCleanup: boolean;
}
export interface RollbackCleanupResult {
    removedCount: number;
    errors: string[];
    cleanupTrigger: string;
    executionTime: number;
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
    private readonly cleanupConfig;
    constructor(baseDir?: string, cleanupConfig?: Partial<RollbackCleanupConfig>);
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
     * Perform automatic cleanup based on trigger
     */
    performAutomaticCleanup(trigger: string): Promise<RollbackCleanupResult>;
    /**
     * Clean up rollbacks older than specified hours
     */
    cleanupByAge(olderThanHours: number): Promise<RollbackCleanupResult>;
    /**
     * Clean up excess rollbacks, keeping only the most recent count
     */
    cleanupByCount(maxCount: number): Promise<RollbackCleanupResult>;
    /**
     * Clean up failed rollbacks older than specified hours
     */
    cleanupFailedRollbacks(olderThanHours: number): Promise<RollbackCleanupResult>;
    /**
     * Remove rollback data completely
     */
    removeRollbackData(updateId: string): Promise<void>;
    /**
     * Mark rollback as failed with detailed error information
     */
    markRollbackFailed(updateId: string, error: Error | string, contextDetails?: Record<string, any>): Promise<void>;
    /**
     * Trigger cleanup based on event
     */
    triggerCleanup(trigger: string): Promise<RollbackCleanupResult>;
    /**
     * Validate rollback data integrity
     */
    validateRollbackData(updateId: string): Promise<boolean>;
    /**
     * Get cleanup statistics
     */
    getCleanupStatistics(): Promise<Record<string, any>>;
}
//# sourceMappingURL=rollback-manager.d.ts.map
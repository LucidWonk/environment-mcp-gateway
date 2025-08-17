import { EventEmitter } from 'events';
export interface ContextEntry {
    key: string;
    value: any;
    version: number;
    timestamp: string;
    lastModifiedBy: string;
    checksum: string;
    metadata?: Record<string, any>;
}
export interface ContextSync {
    conversationId: string;
    syncId: string;
    entries: Map<string, ContextEntry>;
    version: number;
    lastSyncTimestamp: string;
    participants: string[];
}
export interface ContextConflict {
    conflictId: string;
    conversationId: string;
    contextKey: string;
    conflictType: 'concurrent-modification' | 'version-mismatch' | 'data-corruption' | 'schema-mismatch';
    conflictingVersions: ContextEntry[];
    detectedAt: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolutionStrategy?: 'auto-merge' | 'manual-resolve' | 'last-write-wins' | 'custom';
}
export interface SyncOperation {
    operationId: string;
    conversationId: string;
    agentId: string;
    operationType: 'update' | 'delete' | 'merge' | 'rollback';
    contextKey: string;
    beforeValue?: ContextEntry;
    afterValue?: ContextEntry;
    timestamp: string;
    applied: boolean;
    conflicts?: ContextConflict[];
}
export interface ContextVersion {
    versionId: string;
    conversationId: string;
    version: number;
    snapshot: Map<string, ContextEntry>;
    createdAt: string;
    createdBy: string;
    description: string;
    rollbackTarget?: boolean;
}
export interface SyncMetrics {
    conversationId: string;
    totalSyncOperations: number;
    successfulSyncs: number;
    conflictCount: number;
    averageSyncLatency: number;
    dataConsistencyScore: number;
    lastSyncTimestamp: string;
}
export declare class ContextSynchronizer extends EventEmitter {
    private conversationContexts;
    private contextVersions;
    private pendingOperations;
    private activeConflicts;
    private syncMetrics;
    constructor();
    initializeConversationSync(conversationId: string, participants: string[], initialContext?: Record<string, any>): Promise<string>;
    updateContext(conversationId: string, agentId: string, contextKey: string, contextValue: any, options?: {
        mergeStrategy?: 'replace' | 'merge' | 'append';
        requiresConsensus?: boolean;
        priority?: 'low' | 'normal' | 'high' | 'critical';
    }): Promise<string>;
    syncContext(conversationId: string, targetAgents?: string[]): Promise<void>;
    getContextStatus(conversationId: string): Promise<any>;
    createVersionSnapshot(conversationId: string, description: string, createdBy: string): Promise<string>;
    rollbackToVersion(conversationId: string, versionId: string): Promise<void>;
    private startSyncMonitoring;
    private performSyncHealthCheck;
    private cleanupExpiredData;
    private calculateChecksum;
    private applyMergeStrategy;
    private detectConflicts;
    private handleConflicts;
    private attemptConflictResolution;
    private syncToAgent;
    private updateSyncMetrics;
    private calculateSyncHealth;
    getActiveConversations(): string[];
    getConflictHistory(conversationId: string): Promise<ContextConflict[]>;
    getVersionHistory(conversationId: string): Promise<ContextVersion[]>;
    getSystemMetrics(): Promise<Record<string, any>>;
    private calculateAverageConsistencyScore;
}
export declare const contextSynchronizer: ContextSynchronizer;
//# sourceMappingURL=context-synchronizer.d.ts.map
import { createMCPLogger } from '../utils/mcp-logger.js';
import { performanceMonitor, performanceMonitored } from './performance-monitor.js';
import { expertCache, ExpertCacheKeys, cached } from './expert-cache.js';
import { expertErrorHandler, ExpertErrorUtils } from './error-handler.js';
import { EventEmitter } from 'events';

const logger = createMCPLogger('context-synchronizer.log');

// Context Synchronization Types
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

// Context Synchronizer Service
export class ContextSynchronizer extends EventEmitter {
    private conversationContexts: Map<string, ContextSync> = new Map();
    private contextVersions: Map<string, ContextVersion[]> = new Map();
    private pendingOperations: Map<string, SyncOperation[]> = new Map();
    private activeConflicts: Map<string, ContextConflict[]> = new Map();
    private syncMetrics: Map<string, SyncMetrics> = new Map();

    constructor() {
        super();
        this.startSyncMonitoring();
        
        logger.info('🔄 Context Synchronizer initialized', {
            syncMonitoringEnabled: true,
            conflictDetectionActive: true
        });
    }

    @performanceMonitored('context-sync-initialization', performanceMonitor)
    public async initializeConversationSync(
        conversationId: string,
        participants: string[],
        initialContext?: Record<string, any>
    ): Promise<string> {
        return await expertErrorHandler.executeWithErrorHandling(
            'initializeConversationSync',
            'ContextSynchronizer',
            async () => {
                const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                logger.info('🚀 Initializing conversation context synchronization', {
                    conversationId,
                    syncId,
                    participantCount: participants.length,
                    hasInitialContext: !!initialContext
                });

                // Initialize context entries from initial context
                const entries = new Map<string, ContextEntry>();
                if (initialContext) {
                    for (const [key, value] of Object.entries(initialContext)) {
                        const entry: ContextEntry = {
                            key,
                            value,
                            version: 1,
                            timestamp: new Date().toISOString(),
                            lastModifiedBy: 'system',
                            checksum: this.calculateChecksum(value),
                            metadata: {
                                created: new Date().toISOString(),
                                dataType: typeof value
                            }
                        };
                        entries.set(key, entry);
                    }
                }

                // Create context sync object
                const contextSync: ContextSync = {
                    conversationId,
                    syncId,
                    entries,
                    version: 1,
                    lastSyncTimestamp: new Date().toISOString(),
                    participants
                };

                // Store conversation context
                this.conversationContexts.set(conversationId, contextSync);
                this.pendingOperations.set(conversationId, []);
                this.activeConflicts.set(conversationId, []);

                // Create initial version snapshot
                await this.createVersionSnapshot(conversationId, 'Initial context state', 'system');

                // Initialize metrics
                this.syncMetrics.set(conversationId, {
                    conversationId,
                    totalSyncOperations: 0,
                    successfulSyncs: 0,
                    conflictCount: 0,
                    averageSyncLatency: 0,
                    dataConsistencyScore: 100,
                    lastSyncTimestamp: new Date().toISOString()
                });

                // Cache context sync for quick access
                const cacheKey = ExpertCacheKeys.contextTransfer(conversationId, 'context-sync');
                expertCache.set(cacheKey, contextSync, 60 * 60 * 1000); // Cache for 1 hour

                // Emit initialization event
                this.emit('contextSyncInitialized', {
                    conversationId,
                    syncId,
                    participantCount: participants.length,
                    initialEntries: entries.size
                });

                logger.info('✅ Conversation context synchronization initialized', {
                    conversationId,
                    syncId,
                    entriesCount: entries.size,
                    participantCount: participants.length
                });

                return syncId;
            },
            // Fallback for sync initialization
            async () => {
                logger.warn('🔄 Using fallback for context sync initialization', { conversationId });
                
                const fallbackSyncId = `fallback-sync-${Date.now()}`;
                
                // Create minimal fallback sync
                const fallbackSync: ContextSync = {
                    conversationId,
                    syncId: fallbackSyncId,
                    entries: new Map(),
                    version: 1,
                    lastSyncTimestamp: new Date().toISOString(),
                    participants
                };

                this.conversationContexts.set(conversationId, fallbackSync);
                return fallbackSyncId;
            }
        );
    }

    @performanceMonitored('context-update', performanceMonitor)
    public async updateContext(
        conversationId: string,
        agentId: string,
        contextKey: string,
        contextValue: any,
        options?: {
            mergeStrategy?: 'replace' | 'merge' | 'append';
            requiresConsensus?: boolean;
            priority?: 'low' | 'normal' | 'high' | 'critical';
        }
    ): Promise<string> {
        return await expertErrorHandler.executeWithErrorHandling(
            'updateContext',
            'ContextSynchronizer',
            async () => {
                const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                logger.info('📝 Updating conversation context', {
                    conversationId,
                    agentId,
                    contextKey,
                    operationId,
                    mergeStrategy: options?.mergeStrategy || 'replace'
                });

                const contextSync = this.conversationContexts.get(conversationId);
                if (!contextSync) {
                    throw ExpertErrorUtils.createValidationError(
                        'ContextSynchronizer',
                        'updateContext',
                        `Context sync not found for conversation ${conversationId}`
                    );
                }

                // Validate agent is participant
                if (!contextSync.participants.includes(agentId)) {
                    throw ExpertErrorUtils.createValidationError(
                        'ContextSynchronizer',
                        'updateContext',
                        `Agent ${agentId} is not a participant in conversation ${conversationId}`
                    );
                }

                const existingEntry = contextSync.entries.get(contextKey);
                const newVersion = existingEntry ? existingEntry.version + 1 : 1;
                const timestamp = new Date().toISOString();

                // Calculate checksum for integrity verification
                const checksum = this.calculateChecksum(contextValue);

                // Apply merge strategy if existing entry exists
                let finalValue = contextValue;
                if (existingEntry && options?.mergeStrategy) {
                    finalValue = await this.applyMergeStrategy(
                        existingEntry.value,
                        contextValue,
                        options.mergeStrategy
                    );
                }

                // Create new context entry
                const newEntry: ContextEntry = {
                    key: contextKey,
                    value: finalValue,
                    version: newVersion,
                    timestamp,
                    lastModifiedBy: agentId,
                    checksum,
                    metadata: {
                        mergeStrategy: options?.mergeStrategy || 'replace',
                        priority: options?.priority || 'normal',
                        requiresConsensus: options?.requiresConsensus || false,
                        originalValue: existingEntry?.value
                    }
                };

                // Detect potential conflicts
                const conflicts = await this.detectConflicts(conversationId, contextKey, newEntry, existingEntry);

                // Create sync operation
                const syncOperation: SyncOperation = {
                    operationId,
                    conversationId,
                    agentId,
                    operationType: 'update',
                    contextKey,
                    beforeValue: existingEntry,
                    afterValue: newEntry,
                    timestamp,
                    applied: conflicts.length === 0,
                    conflicts: conflicts.length > 0 ? conflicts : undefined
                };

                if (conflicts.length > 0) {
                    // Handle conflicts
                    await this.handleConflicts(conversationId, conflicts);
                    
                    // Add to pending operations for conflict resolution
                    const pendingOps = this.pendingOperations.get(conversationId) || [];
                    pendingOps.push(syncOperation);
                    this.pendingOperations.set(conversationId, pendingOps);

                    logger.warn('⚠️ Context update has conflicts', {
                        operationId,
                        contextKey,
                        conflictCount: conflicts.length
                    });
                } else {
                    // Apply update immediately
                    contextSync.entries.set(contextKey, newEntry);
                    contextSync.version++;
                    contextSync.lastSyncTimestamp = timestamp;

                    // Update metrics
                    await this.updateSyncMetrics(conversationId, true);

                    // Update cache
                    const cacheKey = ExpertCacheKeys.contextTransfer(conversationId, 'context-sync');
                    expertCache.set(cacheKey, contextSync, 60 * 60 * 1000);

                    // Emit context updated event
                    this.emit('contextUpdated', {
                        conversationId,
                        agentId,
                        contextKey,
                        operationId,
                        version: newEntry.version
                    });

                    logger.info('✅ Context updated successfully', {
                        operationId,
                        contextKey,
                        version: newEntry.version,
                        agentId
                    });
                }

                return operationId;
            }
        );
    }

    @performanceMonitored('context-sync', performanceMonitor)
    public async syncContext(conversationId: string, targetAgents?: string[]): Promise<void> {
        return await expertErrorHandler.executeWithErrorHandling(
            'syncContext',
            'ContextSynchronizer',
            async () => {
                logger.info('🔄 Synchronizing conversation context', {
                    conversationId,
                    targetAgentCount: targetAgents?.length || 'all'
                });

                const contextSync = this.conversationContexts.get(conversationId);
                if (!contextSync) {
                    throw ExpertErrorUtils.createValidationError(
                        'ContextSynchronizer',
                        'syncContext',
                        `Context sync not found for conversation ${conversationId}`
                    );
                }

                const syncTargets = targetAgents || contextSync.participants;
                const syncResults = new Map<string, boolean>();

                // Process pending operations
                const pendingOps = this.pendingOperations.get(conversationId) || [];
                const resolvedOps: SyncOperation[] = [];

                for (const operation of pendingOps) {
                    if (operation.conflicts && operation.conflicts.length > 0) {
                        // Attempt automatic conflict resolution
                        const resolved = await this.attemptConflictResolution(operation.conflicts);
                        if (resolved) {
                            operation.applied = true;
                            operation.conflicts = undefined;
                            resolvedOps.push(operation);
                        }
                    }
                }

                // Apply resolved operations
                for (const operation of resolvedOps) {
                    if (operation.afterValue) {
                        contextSync.entries.set(operation.contextKey, operation.afterValue);
                        contextSync.version++;
                    }
                }

                // Remove resolved operations from pending
                const remainingPending = pendingOps.filter(op => !resolvedOps.includes(op));
                this.pendingOperations.set(conversationId, remainingPending);

                // Update sync timestamp
                contextSync.lastSyncTimestamp = new Date().toISOString();

                // Simulate sync to target agents (in real implementation, this would use network calls)
                for (const agentId of syncTargets) {
                    try {
                        await this.syncToAgent(conversationId, agentId, contextSync);
                        syncResults.set(agentId, true);
                    } catch (error) {
                        syncResults.set(agentId, false);
                        logger.warn('⚠️ Failed to sync context to agent', {
                            conversationId,
                            agentId,
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                }

                // Update metrics
                const successfulSyncs = Array.from(syncResults.values()).filter(success => success).length;
                await this.updateSyncMetrics(conversationId, successfulSyncs > 0);

                // Update cache
                const cacheKey = ExpertCacheKeys.contextTransfer(conversationId, 'context-sync');
                expertCache.set(cacheKey, contextSync, 60 * 60 * 1000);

                // Emit sync completed event
                this.emit('contextSynced', {
                    conversationId,
                    syncedAgents: syncTargets.length,
                    successfulSyncs,
                    resolvedConflicts: resolvedOps.length,
                    pendingConflicts: remainingPending.length
                });

                logger.info('✅ Context synchronization completed', {
                    conversationId,
                    syncedAgents: syncTargets.length,
                    successfulSyncs,
                    resolvedConflicts: resolvedOps.length
                });
            }
        );
    }

    @cached(expertCache, (conversationId: string) => `context-status:${conversationId}`, 30 * 1000)
    public async getContextStatus(conversationId: string): Promise<any> {
        logger.info('📊 Getting context synchronization status', { conversationId });

        const contextSync = this.conversationContexts.get(conversationId);
        if (!contextSync) {
            return null;
        }

        const pendingOps = this.pendingOperations.get(conversationId) || [];
        const activeConflicts = this.activeConflicts.get(conversationId) || [];
        const metrics = this.syncMetrics.get(conversationId);
        const versions = this.contextVersions.get(conversationId) || [];

        const status = {
            conversationId,
            syncId: contextSync.syncId,
            version: contextSync.version,
            entriesCount: contextSync.entries.size,
            participantCount: contextSync.participants.length,
            lastSyncTimestamp: contextSync.lastSyncTimestamp,
            pendingOperations: pendingOps.length,
            activeConflicts: activeConflicts.length,
            availableVersions: versions.length,
            metrics: metrics || null,
            healthStatus: this.calculateSyncHealth(conversationId)
        };

        logger.info('✅ Context status retrieved', {
            conversationId,
            entriesCount: status.entriesCount,
            pendingOperations: status.pendingOperations,
            activeConflicts: status.activeConflicts
        });

        return status;
    }

    public async createVersionSnapshot(
        conversationId: string,
        description: string,
        createdBy: string
    ): Promise<string> {
        const contextSync = this.conversationContexts.get(conversationId);
        if (!contextSync) {
            throw new Error(`Context sync not found for conversation ${conversationId}`);
        }

        const versionId = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const snapshot = new Map(contextSync.entries);

        const version: ContextVersion = {
            versionId,
            conversationId,
            version: contextSync.version,
            snapshot,
            createdAt: new Date().toISOString(),
            createdBy,
            description
        };

        const versions = this.contextVersions.get(conversationId) || [];
        versions.push(version);
        this.contextVersions.set(conversationId, versions);

        logger.info('📸 Context version snapshot created', {
            conversationId,
            versionId,
            description,
            entriesCount: snapshot.size
        });

        return versionId;
    }

    public async rollbackToVersion(conversationId: string, versionId: string): Promise<void> {
        const versions = this.contextVersions.get(conversationId) || [];
        const targetVersion = versions.find(v => v.versionId === versionId);

        if (!targetVersion) {
            throw new Error(`Version ${versionId} not found for conversation ${conversationId}`);
        }

        const contextSync = this.conversationContexts.get(conversationId);
        if (!contextSync) {
            throw new Error(`Context sync not found for conversation ${conversationId}`);
        }

        // Create rollback operation
        const rollbackOperation: SyncOperation = {
            operationId: `rollback-${Date.now()}`,
            conversationId,
            agentId: 'system',
            operationType: 'rollback',
            contextKey: '*',
            beforeValue: undefined,
            afterValue: undefined,
            timestamp: new Date().toISOString(),
            applied: true
        };

        // Restore context from snapshot
        contextSync.entries = new Map(targetVersion.snapshot);
        contextSync.version = targetVersion.version;
        contextSync.lastSyncTimestamp = new Date().toISOString();

        // Clear pending operations and conflicts
        this.pendingOperations.set(conversationId, []);
        this.activeConflicts.set(conversationId, []);

        this.emit('contextRolledBack', {
            conversationId,
            versionId,
            rollbackOperation: rollbackOperation.operationId
        });

        logger.info('🔄 Context rolled back to version', {
            conversationId,
            versionId,
            targetVersion: targetVersion.version
        });
    }

    // Private helper methods
    private startSyncMonitoring(): void {
        // Monitor sync health and perform cleanup
        setInterval(() => {
            this.performSyncHealthCheck();
            this.cleanupExpiredData();
        }, 60000); // Check every minute
    }

    private async performSyncHealthCheck(): Promise<void> {
        for (const [conversationId] of this.conversationContexts) {
            const health = this.calculateSyncHealth(conversationId);
            
            if (health.overallHealth < 70) {
                logger.warn('⚠️ Poor context sync health detected', {
                    conversationId,
                    overallHealth: health.overallHealth,
                    issues: health.issues
                });

                this.emit('syncHealthAlert', {
                    conversationId,
                    health,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    private cleanupExpiredData(): void {
        const now = new Date().getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Clean up old versions (keep latest 10)
        for (const [conversationId, versions] of this.contextVersions) {
            if (versions.length > 10) {
                const sortedVersions = versions.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                this.contextVersions.set(conversationId, sortedVersions.slice(0, 10));
            }
        }

        // Clean up old conflicts
        for (const [conversationId, conflicts] of this.activeConflicts) {
            const recentConflicts = conflicts.filter(conflict => 
                now - new Date(conflict.detectedAt).getTime() < maxAge
            );
            this.activeConflicts.set(conversationId, recentConflicts);
        }
    }

    private calculateChecksum(value: any): string {
        // Simple checksum calculation for data integrity
        const jsonString = JSON.stringify(value, Object.keys(value).sort());
        let hash = 0;
        for (let i = 0; i < jsonString.length; i++) {
            const char = jsonString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    private async applyMergeStrategy(existingValue: any, newValue: any, strategy: string): Promise<any> {
        switch (strategy) {
        case 'replace':
            return newValue;
        case 'merge':
            if (typeof existingValue === 'object' && typeof newValue === 'object') {
                return { ...existingValue, ...newValue };
            }
            return newValue;
        case 'append':
            if (Array.isArray(existingValue) && Array.isArray(newValue)) {
                return [...existingValue, ...newValue];
            }
            return newValue;
        default:
            return newValue;
        }
    }

    private async detectConflicts(
        conversationId: string,
        contextKey: string,
        newEntry: ContextEntry,
        existingEntry?: ContextEntry
    ): Promise<ContextConflict[]> {
        const conflicts: ContextConflict[] = [];

        if (!existingEntry) {
            return conflicts; // No conflicts for new entries
        }

        // Check for concurrent modifications
        const timeDiff = new Date(newEntry.timestamp).getTime() - new Date(existingEntry.timestamp).getTime();
        if (timeDiff < 1000 && existingEntry.lastModifiedBy !== newEntry.lastModifiedBy) {
            conflicts.push({
                conflictId: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                conversationId,
                contextKey,
                conflictType: 'concurrent-modification',
                conflictingVersions: [existingEntry, newEntry],
                detectedAt: new Date().toISOString(),
                severity: 'medium',
                resolutionStrategy: 'auto-merge'
            });
        }

        // Check for data corruption
        if (newEntry.checksum === existingEntry.checksum && 
            JSON.stringify(newEntry.value) !== JSON.stringify(existingEntry.value)) {
            conflicts.push({
                conflictId: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                conversationId,
                contextKey,
                conflictType: 'data-corruption',
                conflictingVersions: [existingEntry, newEntry],
                detectedAt: new Date().toISOString(),
                severity: 'critical',
                resolutionStrategy: 'manual-resolve'
            });
        }

        return conflicts;
    }

    private async handleConflicts(conversationId: string, conflicts: ContextConflict[]): Promise<void> {
        const activeConflicts = this.activeConflicts.get(conversationId) || [];
        activeConflicts.push(...conflicts);
        this.activeConflicts.set(conversationId, activeConflicts);

        for (const conflict of conflicts) {
            this.emit('conflictDetected', {
                conversationId,
                conflict,
                timestamp: new Date().toISOString()
            });

            logger.warn('⚠️ Context conflict detected', {
                conversationId,
                conflictId: conflict.conflictId,
                conflictType: conflict.conflictType,
                severity: conflict.severity
            });
        }
    }

    private async attemptConflictResolution(conflicts: ContextConflict[]): Promise<boolean> {
        for (const conflict of conflicts) {
            if (conflict.resolutionStrategy === 'auto-merge') {
                // Attempt automatic resolution
                return true; // Simplified resolution for demo
            }
        }
        return false;
    }

    private async syncToAgent(conversationId: string, agentId: string, contextSync: ContextSync): Promise<void> {
        // Simulate network sync operation
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms simulated latency
        
        // In real implementation, this would send context to the agent via network
        logger.debug('📡 Context synced to agent', {
            conversationId,
            agentId,
            entriesCount: contextSync.entries.size
        });
    }

    private async updateSyncMetrics(conversationId: string, success: boolean): Promise<void> {
        const metrics = this.syncMetrics.get(conversationId);
        if (!metrics) return;

        metrics.totalSyncOperations++;
        if (success) {
            metrics.successfulSyncs++;
        }
        metrics.lastSyncTimestamp = new Date().toISOString();

        // Calculate data consistency score
        const pendingOps = this.pendingOperations.get(conversationId) || [];
        const activeConflicts = this.activeConflicts.get(conversationId) || [];
        const consistencyPenalty = (pendingOps.length * 5) + (activeConflicts.length * 10);
        metrics.dataConsistencyScore = Math.max(0, 100 - consistencyPenalty);

        this.syncMetrics.set(conversationId, metrics);
    }

    private calculateSyncHealth(conversationId: string): any {
        const metrics = this.syncMetrics.get(conversationId);
        const pendingOps = this.pendingOperations.get(conversationId) || [];
        const activeConflicts = this.activeConflicts.get(conversationId) || [];

        const issues: string[] = [];
        let healthScore = 100;

        if (pendingOps.length > 5) {
            healthScore -= 20;
            issues.push(`${pendingOps.length} pending operations`);
        }

        if (activeConflicts.length > 0) {
            healthScore -= activeConflicts.length * 15;
            issues.push(`${activeConflicts.length} active conflicts`);
        }

        if (metrics && metrics.dataConsistencyScore < 80) {
            healthScore -= 25;
            issues.push('Low data consistency score');
        }

        return {
            overallHealth: Math.max(0, healthScore),
            dataConsistency: metrics?.dataConsistencyScore || 100,
            pendingOperations: pendingOps.length,
            activeConflicts: activeConflicts.length,
            issues
        };
    }

    // Public utility methods
    public getActiveConversations(): string[] {
        return Array.from(this.conversationContexts.keys());
    }

    public async getConflictHistory(conversationId: string): Promise<ContextConflict[]> {
        return this.activeConflicts.get(conversationId) || [];
    }

    public async getVersionHistory(conversationId: string): Promise<ContextVersion[]> {
        return this.contextVersions.get(conversationId) || [];
    }

    public async getSystemMetrics(): Promise<Record<string, any>> {
        const totalConversations = this.conversationContexts.size;
        const totalEntries = Array.from(this.conversationContexts.values())
            .reduce((sum, sync) => sum + sync.entries.size, 0);
        const totalConflicts = Array.from(this.activeConflicts.values())
            .reduce((sum, conflicts) => sum + conflicts.length, 0);
        const totalVersions = Array.from(this.contextVersions.values())
            .reduce((sum, versions) => sum + versions.length, 0);

        return {
            timestamp: new Date().toISOString(),
            conversations: {
                total: totalConversations,
                totalEntries,
                averageEntriesPerConversation: totalConversations > 0 ? totalEntries / totalConversations : 0
            },
            conflicts: {
                active: totalConflicts,
                averagePerConversation: totalConversations > 0 ? totalConflicts / totalConversations : 0
            },
            versions: {
                total: totalVersions,
                averagePerConversation: totalConversations > 0 ? totalVersions / totalConversations : 0
            },
            performance: {
                averageConsistencyScore: this.calculateAverageConsistencyScore()
            }
        };
    }

    private calculateAverageConsistencyScore(): number {
        const allMetrics = Array.from(this.syncMetrics.values());
        if (allMetrics.length === 0) return 100;

        return allMetrics.reduce((sum, metrics) => sum + metrics.dataConsistencyScore, 0) / allMetrics.length;
    }
}

// Export singleton instance
export const contextSynchronizer = new ContextSynchronizer();
/**
 * Memory Optimization Service for Context Engineering Enhancement System
 * Implements intelligent memory management for large-scale context operations
 * Part of Step 4.2: Performance Optimization
 */
import { EventEmitter } from 'events';
export interface MemoryPool<T> {
    id: string;
    maxSize: number;
    currentSize: number;
    items: Map<string, T>;
    lastAccessed: Map<string, number>;
    accessCount: Map<string, number>;
}
export interface MemoryMetrics {
    totalAllocated: number;
    totalReleased: number;
    currentUsage: number;
    peakUsage: number;
    pools: Map<string, {
        size: number;
        utilization: number;
        hitRate: number;
    }>;
    gcTriggered: number;
    memoryLeaks: number;
}
export interface StreamingBuffer<T> {
    id: string;
    items: T[];
    maxItems: number;
    onFlush: (items: T[]) => Promise<void>;
    flushThreshold: number;
    lastFlush: number;
}
export interface MemoryConfig {
    maxMemoryUsage: number;
    gcThreshold: number;
    poolSizes: Map<string, number>;
    streamingEnabled: boolean;
    compressionEnabled: boolean;
    monitoringInterval: number;
    enableMetrics?: boolean;
}
/**
 * Advanced memory optimization system for Context Engineering operations
 * Features:
 * - Object pooling for frequently used objects
 * - Streaming processing for large datasets
 * - Intelligent garbage collection triggering
 * - Memory leak detection and prevention
 * - Compression for large text objects
 * - Real-time memory monitoring
 */
export declare class MemoryOptimizer extends EventEmitter {
    private pools;
    private streamingBuffers;
    private metrics;
    private readonly config;
    private monitoringTimer?;
    private lastGCTime;
    private memoryPressure;
    constructor(config?: Partial<MemoryConfig>);
    /**
     * Object pooling for frequently used Context Engineering objects
     */
    getFromPool<T>(poolId: string, factory: () => T): Promise<T>;
    returnToPool<T>(poolId: string, item: T, key?: string): Promise<void>;
    /**
     * Streaming processing for large datasets to minimize memory usage
     */
    createStreamingBuffer<T>(bufferId: string, options: {
        maxItems: number;
        flushThreshold: number;
        onFlush: (items: T[]) => Promise<void>;
    }): Promise<void>;
    addToStream<T>(bufferId: string, item: T): Promise<void>;
    flushStreamingBuffer(bufferId: string): Promise<void>;
    flushAllStreams(): Promise<void>;
    /**
     * Context Engineering specific optimizations
     */
    /**
     * Optimize context file processing with streaming and compression
     */
    processLargeContextFile(filePath: string, processor: (chunk: string) => Promise<any>, options?: {
        chunkSize?: number;
        compress?: boolean;
        useStreaming?: boolean;
    }): Promise<any[]>;
    /**
     * Batch process multiple context files with memory optimization
     */
    processBatchContextFiles(filePaths: string[], processor: (filePath: string, content: string) => Promise<any>): Promise<Map<string, any>>;
    /**
     * Optimize semantic analysis data structures
     */
    optimizeSemanticData(analysisData: any[]): any[];
    /**
     * Memory monitoring and garbage collection
     */
    private startMemoryMonitoring;
    private updateMemoryMetrics;
    private shouldTriggerGC;
    private performGarbageCollection;
    private cleanupUnusedPoolItems;
    private checkMemoryLeaks;
    private isMemoryPressureHigh;
    private waitForMemoryStabilization;
    /**
     * Utility methods
     */
    private initializeMemoryPools;
    private canReuse;
    private resetObject;
    private findLRUItem;
    private generateKey;
    private estimateObjectSize;
    private calculateOptimalBatchSize;
    private calculatePoolHitRate;
    private getCurrentMemoryUsage;
    private updateCurrentUsage;
    private loadFileContent;
    private compressText;
    getMetrics(): MemoryMetrics;
    dispose(): Promise<void>;
}
//# sourceMappingURL=memory-optimizer.d.ts.map
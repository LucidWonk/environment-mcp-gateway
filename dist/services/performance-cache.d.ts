/**
 * High-Performance Context Caching System
 * Implements intelligent caching for Context Engineering Enhancement System
 * Part of Step 4.2: Performance Optimization
 */
import { EventEmitter } from 'events';
export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
    dependencies?: string[];
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
    hitRate: number;
}
export interface CacheConfig {
    maxSize: number;
    maxEntries: number;
    defaultTtl: number;
    cleanupInterval: number;
    enableMetrics: boolean;
}
/**
 * Multi-level caching system optimized for Context Engineering operations
 * Features:
 * - LRU eviction with size-based management
 * - Dependency-based cache invalidation
 * - Performance metrics and monitoring
 * - Async/await support with background cleanup
 * - Memory-efficient storage with compression hints
 */
export declare class PerformanceCache extends EventEmitter {
    private cache;
    private sizeTracker;
    private dependencyGraph;
    private metrics;
    private cleanupTimer?;
    private readonly config;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get value from cache with automatic TTL and dependency checking
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Set value in cache with optional TTL and dependencies
     */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        dependencies?: string[];
        compress?: boolean;
    }): Promise<void>;
    /**
     * Delete entry from cache and clean up dependencies
     */
    delete(key: string): boolean;
    /**
     * Invalidate cache entries based on dependencies
     * Critical for maintaining context consistency across domains
     */
    invalidateByDependency(dependency: string): Promise<number>;
    /**
     * Bulk operations for improved performance during context updates
     */
    setMany<T>(entries: Array<{
        key: string;
        value: T;
        dependencies?: string[];
    }>): Promise<void>;
    getMany<T>(keys: string[]): Promise<Map<string, T>>;
    /**
     * Performance metrics and monitoring
     */
    getMetrics(): CacheMetrics;
    getDetailedMetrics(): {
        entryCount: number;
        averageEntrySize: number;
        memoryUsage: {
            totalBytes: number;
            totalMB: number;
            utilizationPercent: number;
        };
        topKeys: {
            key: string;
            accessCount: number;
        }[];
        hits: number;
        misses: number;
        evictions: number;
        totalSize: number;
        hitRate: number;
    };
    /**
     * Cache warming strategies for predictable performance
     */
    warmCache(warmingStrategies: Array<{
        pattern: string;
        loader: () => Promise<any>;
        dependencies?: string[];
    }>): Promise<void>;
    /**
     * Memory management and cleanup
     */
    private ensureSpace;
    private evictLRU;
    private startCleanupTimer;
    private performCleanup;
    private calculateSize;
    private updateDependencyGraph;
    private cleanupDependencies;
    private recordHit;
    private recordMiss;
    private getTopAccessedKeys;
    /**
     * Cleanup and resource management
     */
    dispose(): Promise<void>;
}
/**
 * Context-specific cache implementations
 */
export declare class SemanticAnalysisCache extends PerformanceCache {
    constructor();
    cacheAnalysisResult(filePath: string, analysisResult: any): Promise<void>;
    getCachedAnalysis(filePath: string): Promise<any | undefined>;
    private hashPath;
}
export declare class CrossDomainCache extends PerformanceCache {
    constructor();
    cacheDomainMapping(sourceFiles: string[], mappingResult: any): Promise<void>;
    getCachedDomainMapping(sourceFiles: string[]): Promise<any | undefined>;
    private hashFileList;
}
//# sourceMappingURL=performance-cache.d.ts.map
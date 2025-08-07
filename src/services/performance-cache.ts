/**
 * High-Performance Context Caching System
 * Implements intelligent caching for Context Engineering Enhancement System
 * Part of Step 4.2: Performance Optimization
 */

import { createHash } from 'crypto';
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
    maxSize: number;          // Maximum cache size in bytes
    maxEntries: number;       // Maximum number of entries
    defaultTtl: number;       // Default TTL in milliseconds
    cleanupInterval: number;  // Cleanup interval in milliseconds
    enableMetrics: boolean;   // Enable performance metrics
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
export class PerformanceCache extends EventEmitter {
    private cache = new Map<string, CacheEntry<any>>();
    private sizeTracker = new Map<string, number>();
    private dependencyGraph = new Map<string, Set<string>>();
    private metrics: CacheMetrics = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        hitRate: 0
    };
    
    private cleanupTimer?: ReturnType<typeof setTimeout>;
    private readonly config: CacheConfig;

    constructor(config: Partial<CacheConfig> = {}) {
        super();
        this.config = {
            maxSize: config.maxSize ?? 100 * 1024 * 1024,     // 100MB
            maxEntries: config.maxEntries ?? 10000,            // 10K entries
            defaultTtl: config.defaultTtl ?? 30 * 60 * 1000,   // 30 minutes
            cleanupInterval: config.cleanupInterval ?? 5 * 60 * 1000, // 5 minutes
            enableMetrics: config.enableMetrics ?? true
        };

        this.startCleanupTimer();
        this.emit('cache:initialized', { config: this.config });
    }

    /**
     * Get value from cache with automatic TTL and dependency checking
     */
    async get<T>(key: string): Promise<T | undefined> {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.recordMiss();
            return undefined;
        }

        // Check TTL expiration
        if (Date.now() - entry.timestamp > this.config.defaultTtl) {
            this.delete(key);
            this.recordMiss();
            return undefined;
        }

        // Update access statistics
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        this.recordHit();

        return entry.value as T;
    }

    /**
     * Set value in cache with optional TTL and dependencies
     */
    async set<T>(
        key: string, 
        value: T, 
        options: {
            ttl?: number;
            dependencies?: string[];
            compress?: boolean;
        } = {}
    ): Promise<void> {
        const size = this.calculateSize(value);
        
        // Check if we need to evict entries
        await this.ensureSpace(size);

        // Create cache entry
        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now(),
            size,
            dependencies: options.dependencies
        };

        // Handle existing entry
        const existingEntry = this.cache.get(key);
        if (existingEntry) {
            this.metrics.totalSize -= existingEntry.size;
        }

        // Store entry
        this.cache.set(key, entry);
        this.sizeTracker.set(key, size);
        this.metrics.totalSize += size;

        // Update dependency graph
        if (options.dependencies) {
            this.updateDependencyGraph(key, options.dependencies);
        }

        this.emit('cache:set', { key, size, dependencies: options.dependencies });
    }

    /**
     * Delete entry from cache and clean up dependencies
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        this.cache.delete(key);
        this.sizeTracker.delete(key);
        this.metrics.totalSize -= entry.size;
        
        // Clean up dependency graph
        this.cleanupDependencies(key);
        
        this.emit('cache:delete', { key, size: entry.size });
        return true;
    }

    /**
     * Invalidate cache entries based on dependencies
     * Critical for maintaining context consistency across domains
     */
    async invalidateByDependency(dependency: string): Promise<number> {
        const dependentKeys = this.dependencyGraph.get(dependency);
        if (!dependentKeys) return 0;

        let invalidatedCount = 0;
        
        for (const key of dependentKeys) {
            if (this.delete(key)) {
                invalidatedCount++;
            }
        }

        this.dependencyGraph.delete(dependency);
        this.emit('cache:invalidated', { dependency, count: invalidatedCount });
        
        return invalidatedCount;
    }

    /**
     * Bulk operations for improved performance during context updates
     */
    async setMany<T>(entries: Array<{
        key: string;
        value: T;
        dependencies?: string[];
    }>): Promise<void> {
        const totalSize = entries.reduce((sum, entry) => 
            sum + this.calculateSize(entry.value), 0);
        
        await this.ensureSpace(totalSize);

        for (const entry of entries) {
            await this.set(entry.key, entry.value, {
                dependencies: entry.dependencies
            });
        }

        this.emit('cache:bulk_set', { count: entries.length, totalSize });
    }

    async getMany<T>(keys: string[]): Promise<Map<string, T>> {
        const results = new Map<string, T>();
        
        for (const key of keys) {
            const value = await this.get<T>(key);
            if (value !== undefined) {
                results.set(key, value);
            }
        }

        this.emit('cache:bulk_get', { requested: keys.length, found: results.size });
        return results;
    }

    /**
     * Performance metrics and monitoring
     */
    getMetrics(): CacheMetrics {
        this.metrics.hitRate = this.metrics.hits > 0 ? 
            this.metrics.hits / (this.metrics.hits + this.metrics.misses) : 0;
        
        return { ...this.metrics };
    }

    getDetailedMetrics() {
        return {
            ...this.getMetrics(),
            entryCount: this.cache.size,
            averageEntrySize: this.cache.size > 0 ? this.metrics.totalSize / this.cache.size : 0,
            memoryUsage: {
                totalBytes: this.metrics.totalSize,
                totalMB: this.metrics.totalSize / (1024 * 1024),
                utilizationPercent: (this.metrics.totalSize / this.config.maxSize) * 100
            },
            topKeys: this.getTopAccessedKeys(10)
        };
    }

    /**
     * Cache warming strategies for predictable performance
     */
    async warmCache(warmingStrategies: Array<{
        pattern: string;
        loader: () => Promise<any>;
        dependencies?: string[];
    }>): Promise<void> {
        this.emit('cache:warming_started', { strategies: warmingStrategies.length });

        for (const strategy of warmingStrategies) {
            try {
                const value = await strategy.loader();
                await this.set(strategy.pattern, value, {
                    dependencies: strategy.dependencies
                });
            } catch (error) {
                this.emit('cache:warming_error', { pattern: strategy.pattern, error });
            }
        }

        this.emit('cache:warming_completed', { 
            strategies: warmingStrategies.length,
            cacheSize: this.cache.size 
        });
    }

    /**
     * Memory management and cleanup
     */
    private async ensureSpace(requiredSize: number): Promise<void> {
        // Check size limits
        while (this.metrics.totalSize + requiredSize > this.config.maxSize ||
               this.cache.size >= this.config.maxEntries) {
            
            const evicted = this.evictLRU();
            if (!evicted) break; // No more entries to evict
        }
    }

    private evictLRU(): boolean {
        let oldestKey: string | undefined;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
            this.metrics.evictions++;
            this.emit('cache:evicted', { key: oldestKey, reason: 'LRU' });
            return true;
        }

        return false;
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }

    private performCleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.defaultTtl) {
                this.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.emit('cache:cleanup', { cleanedCount, remainingCount: this.cache.size });
        }
    }

    private calculateSize(value: any): number {
        // Rough size estimation for memory management
        const jsonString = JSON.stringify(value);
        return Buffer.byteLength(jsonString, 'utf8');
    }

    private updateDependencyGraph(key: string, dependencies: string[]): void {
        for (const dependency of dependencies) {
            if (!this.dependencyGraph.has(dependency)) {
                this.dependencyGraph.set(dependency, new Set());
            }
            this.dependencyGraph.get(dependency)!.add(key);
        }
    }

    private cleanupDependencies(key: string): void {
        for (const [dependency, keys] of this.dependencyGraph.entries()) {
            keys.delete(key);
            if (keys.size === 0) {
                this.dependencyGraph.delete(dependency);
            }
        }
    }

    private recordHit(): void {
        if (this.config.enableMetrics) {
            this.metrics.hits++;
        }
    }

    private recordMiss(): void {
        if (this.config.enableMetrics) {
            this.metrics.misses++;
        }
    }

    private getTopAccessedKeys(limit: number): Array<{ key: string; accessCount: number }> {
        return Array.from(this.cache.entries())
            .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit);
    }

    /**
     * Cleanup and resource management
     */
    async dispose(): Promise<void> {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        this.cache.clear();
        this.sizeTracker.clear();
        this.dependencyGraph.clear();
        
        this.emit('cache:disposed');
    }
}

/**
 * Context-specific cache implementations
 */
export class SemanticAnalysisCache extends PerformanceCache {
    constructor() {
        super({
            maxSize: 50 * 1024 * 1024,  // 50MB for semantic data
            defaultTtl: 60 * 60 * 1000,  // 1 hour for analysis results
            maxEntries: 5000
        });
    }

    async cacheAnalysisResult(filePath: string, analysisResult: any): Promise<void> {
        const key = `analysis:${this.hashPath(filePath)}`;
        const dependencies = [filePath, 'analysis-results'];
        
        await this.set(key, analysisResult, { dependencies });
    }

    async getCachedAnalysis(filePath: string): Promise<any | undefined> {
        const key = `analysis:${this.hashPath(filePath)}`;
        return await this.get(key);
    }

    private hashPath(filePath: string): string {
        return createHash('md5').update(filePath).digest('hex');
    }
}

export class CrossDomainCache extends PerformanceCache {
    constructor() {
        super({
            maxSize: 30 * 1024 * 1024,   // 30MB for domain mappings
            defaultTtl: 45 * 60 * 1000,  // 45 minutes
            maxEntries: 3000
        });
    }

    async cacheDomainMapping(sourceFiles: string[], mappingResult: any): Promise<void> {
        const key = `domain-mapping:${this.hashFileList(sourceFiles)}`;
        const dependencies = [...sourceFiles, 'domain-mappings'];
        
        await this.set(key, mappingResult, { dependencies });
    }

    async getCachedDomainMapping(sourceFiles: string[]): Promise<any | undefined> {
        const key = `domain-mapping:${this.hashFileList(sourceFiles)}`;
        return await this.get(key);
    }

    private hashFileList(files: string[]): string {
        const sortedFiles = files.sort().join('|');
        return createHash('md5').update(sortedFiles).digest('hex');
    }
}
/**
 * Memory Optimization Service for Context Engineering Enhancement System
 * Implements intelligent memory management for large-scale context operations
 * Part of Step 4.2: Performance Optimization
 */
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
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
export class MemoryOptimizer extends EventEmitter {
    pools = new Map();
    streamingBuffers = new Map();
    metrics = {
        totalAllocated: 0,
        totalReleased: 0,
        currentUsage: 0,
        peakUsage: 0,
        pools: new Map(),
        gcTriggered: 0,
        memoryLeaks: 0
    };
    config;
    monitoringTimer;
    lastGCTime = 0;
    memoryPressure = 0;
    constructor(config = {}) {
        super();
        this.config = {
            maxMemoryUsage: config.maxMemoryUsage ?? 500 * 1024 * 1024, // 500MB
            gcThreshold: config.gcThreshold ?? 0.8, // 80% of max memory
            poolSizes: config.poolSizes ?? new Map([
                ['context-files', 1000],
                ['analysis-results', 500],
                ['domain-mappings', 300],
                ['semantic-tokens', 2000],
                ['placeholder-data', 200]
            ]),
            streamingEnabled: config.streamingEnabled ?? true,
            compressionEnabled: config.compressionEnabled ?? true,
            monitoringInterval: config.monitoringInterval ?? 30000 // 30 seconds
        };
        this.initializeMemoryPools();
        this.startMemoryMonitoring();
        this.emit('optimizer:initialized', { config: this.config });
    }
    /**
     * Object pooling for frequently used Context Engineering objects
     */
    async getFromPool(poolId, factory) {
        const pool = this.pools.get(poolId);
        if (!pool) {
            throw new Error(`Pool ${poolId} not found`);
        }
        // Try to reuse existing object
        for (const [key, item] of pool.items) {
            if (this.canReuse(item)) {
                pool.items.delete(key);
                pool.currentSize--;
                pool.lastAccessed.set(key, Date.now());
                pool.accessCount.set(key, (pool.accessCount.get(key) || 0) + 1);
                this.emit('pool:reused', { poolId, key });
                return this.resetObject(item);
            }
        }
        // Create new object if pool has capacity
        if (pool.currentSize < pool.maxSize) {
            const newItem = factory();
            this.metrics.totalAllocated += this.estimateObjectSize(newItem);
            this.updateCurrentUsage();
            this.emit('pool:created', { poolId, size: pool.currentSize + 1 });
            return newItem;
        }
        // Pool is full, evict LRU item and create new one
        const evictedKey = this.findLRUItem(pool);
        if (evictedKey) {
            const evictedItem = pool.items.get(evictedKey);
            if (evictedItem) {
                this.metrics.totalReleased += this.estimateObjectSize(evictedItem);
            }
            pool.items.delete(evictedKey);
            pool.lastAccessed.delete(evictedKey);
            pool.accessCount.delete(evictedKey);
            pool.currentSize--;
        }
        const newItem = factory();
        this.metrics.totalAllocated += this.estimateObjectSize(newItem);
        this.updateCurrentUsage();
        this.emit('pool:evicted_created', { poolId, evictedKey, size: pool.currentSize });
        return newItem;
    }
    async returnToPool(poolId, item, key) {
        const pool = this.pools.get(poolId);
        if (!pool || pool.currentSize >= pool.maxSize) {
            // Pool full or doesn't exist, item will be garbage collected
            this.metrics.totalReleased += this.estimateObjectSize(item);
            this.updateCurrentUsage();
            return;
        }
        const itemKey = key || this.generateKey();
        pool.items.set(itemKey, item);
        pool.lastAccessed.set(itemKey, Date.now());
        pool.currentSize++;
        this.emit('pool:returned', { poolId, key: itemKey, size: pool.currentSize });
    }
    /**
     * Streaming processing for large datasets to minimize memory usage
     */
    async createStreamingBuffer(bufferId, options) {
        if (this.streamingBuffers.has(bufferId)) {
            throw new Error(`Streaming buffer ${bufferId} already exists`);
        }
        const buffer = {
            id: bufferId,
            items: [],
            maxItems: options.maxItems,
            flushThreshold: options.flushThreshold,
            onFlush: options.onFlush,
            lastFlush: Date.now()
        };
        this.streamingBuffers.set(bufferId, buffer);
        this.emit('streaming:created', { bufferId, maxItems: options.maxItems });
    }
    async addToStream(bufferId, item) {
        const buffer = this.streamingBuffers.get(bufferId);
        if (!buffer) {
            throw new Error(`Streaming buffer ${bufferId} not found`);
        }
        buffer.items.push(item);
        // Check if we need to flush
        const shouldFlush = buffer.items.length >= buffer.flushThreshold ||
            buffer.items.length >= buffer.maxItems ||
            this.isMemoryPressureHigh();
        if (shouldFlush) {
            await this.flushStreamingBuffer(bufferId);
        }
    }
    async flushStreamingBuffer(bufferId) {
        const buffer = this.streamingBuffers.get(bufferId);
        if (!buffer || buffer.items.length === 0) {
            return;
        }
        const itemsToFlush = [...buffer.items];
        buffer.items.length = 0; // Clear buffer
        buffer.lastFlush = Date.now();
        try {
            await buffer.onFlush(itemsToFlush);
            this.emit('streaming:flushed', { bufferId, itemCount: itemsToFlush.length });
        }
        catch (error) {
            // Return items to buffer on flush failure
            buffer.items.unshift(...itemsToFlush);
            this.emit('streaming:flush_failed', { bufferId, error });
            throw error;
        }
    }
    async flushAllStreams() {
        const flushPromises = Array.from(this.streamingBuffers.keys())
            .map(bufferId => this.flushStreamingBuffer(bufferId));
        await Promise.all(flushPromises);
    }
    /**
     * Context Engineering specific optimizations
     */
    /**
     * Optimize context file processing with streaming and compression
     */
    async processLargeContextFile(filePath, processor, options = {}) {
        const chunkSize = options.chunkSize || 64 * 1024; // 64KB chunks
        const useCompression = options.compress ?? this.config.compressionEnabled;
        const useStreaming = options.useStreaming ?? this.config.streamingEnabled;
        const results = [];
        if (useStreaming) {
            const streamId = `context-processing:${Date.now()}`;
            await this.createStreamingBuffer(streamId, {
                maxItems: 100,
                flushThreshold: 50,
                onFlush: async (chunks) => {
                    for (const chunk of chunks) {
                        results.push(chunk);
                    }
                }
            });
            // Process file in chunks
            const fileContent = await this.loadFileContent(filePath);
            for (let i = 0; i < fileContent.length; i += chunkSize) {
                const chunk = fileContent.slice(i, i + chunkSize);
                const compressedChunk = useCompression ?
                    await this.compressText(chunk) : chunk;
                const processedChunk = await processor(compressedChunk);
                await this.addToStream(streamId, processedChunk);
                // Check memory pressure and trigger GC if needed
                if (this.shouldTriggerGC()) {
                    await this.performGarbageCollection();
                }
            }
            await this.flushStreamingBuffer(streamId);
            this.streamingBuffers.delete(streamId);
        }
        else {
            // Traditional processing for smaller files
            const fileContent = await this.loadFileContent(filePath);
            const processedContent = await processor(fileContent);
            results.push(processedContent);
        }
        return results;
    }
    /**
     * Batch process multiple context files with memory optimization
     */
    async processBatchContextFiles(filePaths, processor) {
        const results = new Map();
        const batchSize = this.calculateOptimalBatchSize(filePaths.length);
        // Process in batches to control memory usage
        for (let i = 0; i < filePaths.length; i += batchSize) {
            const batch = filePaths.slice(i, i + batchSize);
            const batchPromises = batch.map(async (filePath) => {
                try {
                    const content = await this.loadFileContent(filePath);
                    const result = await processor(filePath, content);
                    return { filePath, result };
                }
                catch (error) {
                    return { filePath, error };
                }
            });
            const batchResults = await Promise.all(batchPromises);
            for (const { filePath, result, error } of batchResults) {
                if (error) {
                    results.set(filePath, { error });
                }
                else {
                    results.set(filePath, result);
                }
            }
            // Trigger GC between batches if memory pressure is high
            if (this.shouldTriggerGC()) {
                await this.performGarbageCollection();
                await this.waitForMemoryStabilization();
            }
            this.emit('batch:processed', {
                batch: i / batchSize + 1,
                total: Math.ceil(filePaths.length / batchSize),
                memoryUsage: this.getCurrentMemoryUsage()
            });
        }
        return results;
    }
    /**
     * Optimize semantic analysis data structures
     */
    optimizeSemanticData(analysisData) {
        return analysisData.map(data => {
            // Remove redundant data and compress large strings
            const optimized = { ...data };
            // Compress large text fields
            if (optimized.sourceCode && optimized.sourceCode.length > 1000) {
                optimized.sourceCode = this.compressText(optimized.sourceCode);
                optimized._compressed = true;
            }
            // Remove verbose debugging information
            delete optimized.debug;
            delete optimized.intermediate;
            delete optimized.rawTokens;
            // Optimize arrays by removing duplicates
            if (optimized.concepts) {
                optimized.concepts = [...new Set(optimized.concepts)];
            }
            return optimized;
        });
    }
    /**
     * Memory monitoring and garbage collection
     */
    startMemoryMonitoring() {
        this.monitoringTimer = setInterval(() => {
            this.updateMemoryMetrics();
            this.checkMemoryLeaks();
            if (this.shouldTriggerGC()) {
                this.performGarbageCollection();
            }
        }, this.config.monitoringInterval);
    }
    updateMemoryMetrics() {
        const usage = this.getCurrentMemoryUsage();
        this.metrics.currentUsage = usage;
        if (usage > this.metrics.peakUsage) {
            this.metrics.peakUsage = usage;
        }
        // Update pool metrics
        for (const [poolId, pool] of this.pools) {
            const hitRate = this.calculatePoolHitRate(pool);
            this.metrics.pools.set(poolId, {
                size: pool.currentSize,
                utilization: pool.currentSize / pool.maxSize,
                hitRate
            });
        }
        this.memoryPressure = usage / this.config.maxMemoryUsage;
        if (this.memoryPressure > 0.9) {
            this.emit('memory:high_pressure', { usage, maxUsage: this.config.maxMemoryUsage });
        }
    }
    shouldTriggerGC() {
        const timeSinceLastGC = Date.now() - this.lastGCTime;
        const memoryThresholdReached = this.memoryPressure >= this.config.gcThreshold;
        const enoughTimePassed = timeSinceLastGC > 10000; // At least 10 seconds
        return memoryThresholdReached && enoughTimePassed;
    }
    async performGarbageCollection() {
        const startTime = performance.now();
        // Manual cleanup of pools
        this.cleanupUnusedPoolItems();
        // Flush streaming buffers
        await this.flushAllStreams();
        // Trigger V8 garbage collection
        if (global.gc) {
            global.gc();
        }
        this.lastGCTime = Date.now();
        this.metrics.gcTriggered++;
        const gcTime = performance.now() - startTime;
        this.emit('memory:gc_performed', { gcTime, memoryBefore: this.metrics.currentUsage });
        // Update metrics after GC
        setTimeout(() => this.updateCurrentUsage(), 100);
    }
    cleanupUnusedPoolItems() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        for (const [poolId, pool] of this.pools) {
            const itemsToRemove = [];
            for (const [key, lastAccessed] of pool.lastAccessed) {
                if (now - lastAccessed > maxAge) {
                    itemsToRemove.push(key);
                }
            }
            for (const key of itemsToRemove) {
                const item = pool.items.get(key);
                if (item) {
                    this.metrics.totalReleased += this.estimateObjectSize(item);
                }
                pool.items.delete(key);
                pool.lastAccessed.delete(key);
                pool.accessCount.delete(key);
                pool.currentSize--;
            }
            if (itemsToRemove.length > 0) {
                this.emit('pool:cleaned', { poolId, removedCount: itemsToRemove.length });
            }
        }
    }
    checkMemoryLeaks() {
        // Simple heuristic for memory leak detection
        const expectedUsage = this.metrics.totalAllocated - this.metrics.totalReleased;
        const actualUsage = this.metrics.currentUsage;
        const discrepancy = Math.abs(actualUsage - expectedUsage);
        if (discrepancy > this.config.maxMemoryUsage * 0.1) {
            this.metrics.memoryLeaks++;
            this.emit('memory:potential_leak', {
                expected: expectedUsage,
                actual: actualUsage,
                discrepancy
            });
        }
    }
    isMemoryPressureHigh() {
        return this.memoryPressure > 0.85;
    }
    async waitForMemoryStabilization() {
        return new Promise(resolve => {
            const checkStabilization = () => {
                if (this.memoryPressure < 0.7) {
                    resolve();
                }
                else {
                    setTimeout(checkStabilization, 500);
                }
            };
            checkStabilization();
        });
    }
    /**
     * Utility methods
     */
    initializeMemoryPools() {
        for (const [poolId, maxSize] of this.config.poolSizes) {
            this.pools.set(poolId, {
                id: poolId,
                maxSize,
                currentSize: 0,
                items: new Map(),
                lastAccessed: new Map(),
                accessCount: new Map()
            });
        }
    }
    canReuse(item) {
        // Check if object is in a reusable state
        return item && typeof item === 'object' && !item._inUse;
    }
    resetObject(item) {
        // Reset object to initial state for reuse
        if (item && typeof item === 'object') {
            item._inUse = true;
            item.lastReset = Date.now();
        }
        return item;
    }
    findLRUItem(pool) {
        let lruKey;
        let lruTime = Date.now();
        for (const [key, time] of pool.lastAccessed) {
            if (time < lruTime) {
                lruTime = time;
                lruKey = key;
            }
        }
        return lruKey;
    }
    generateKey() {
        return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    estimateObjectSize(obj) {
        if (obj === null || obj === undefined)
            return 0;
        if (typeof obj === 'string')
            return obj.length * 2; // UTF-16
        if (typeof obj === 'number')
            return 8;
        if (typeof obj === 'boolean')
            return 4;
        if (Array.isArray(obj)) {
            return obj.reduce((size, item) => size + this.estimateObjectSize(item), 24);
        }
        if (typeof obj === 'object') {
            return Object.keys(obj).reduce((size, key) => size + key.length * 2 + this.estimateObjectSize(obj[key]), 24);
        }
        return 24; // Base object overhead
    }
    calculateOptimalBatchSize(totalItems) {
        const availableMemory = this.config.maxMemoryUsage - this.metrics.currentUsage;
        const estimatedItemSize = 10 * 1024; // 10KB per item estimate
        const maxItemsFromMemory = Math.floor(availableMemory / estimatedItemSize * 0.5);
        return Math.max(1, Math.min(50, maxItemsFromMemory, Math.ceil(totalItems / 10)));
    }
    calculatePoolHitRate(pool) {
        const totalAccesses = Array.from(pool.accessCount.values()).reduce((a, b) => a + b, 0);
        const uniqueItems = pool.accessCount.size;
        return uniqueItems > 0 ? totalAccesses / uniqueItems : 0;
    }
    getCurrentMemoryUsage() {
        if (process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return this.metrics.currentUsage; // Fallback
    }
    updateCurrentUsage() {
        this.metrics.currentUsage = this.getCurrentMemoryUsage();
    }
    async loadFileContent(filePath) {
        // Placeholder for file loading - in real implementation would use fs
        return `Content of ${filePath} - ${Date.now()}`;
    }
    async compressText(text) {
        // Placeholder for text compression - in real implementation would use zlib
        return text.length > 1000 ? `[COMPRESSED:${text.length}]${text.substr(0, 100)}...` : text;
    }
    getMetrics() {
        this.updateMemoryMetrics();
        return { ...this.metrics, pools: new Map(this.metrics.pools) };
    }
    async dispose() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        await this.flushAllStreams();
        this.pools.clear();
        this.streamingBuffers.clear();
        this.emit('optimizer:disposed');
    }
}
//# sourceMappingURL=memory-optimizer.js.map
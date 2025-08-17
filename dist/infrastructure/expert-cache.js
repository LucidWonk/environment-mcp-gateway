import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('expert-cache.log');
// Default cache configuration optimized for VET operations
export const DEFAULT_CACHE_CONFIG = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000, // 1000 entries
    cleanupInterval: 2 * 60 * 1000, // 2 minutes
    enableLRU: true
};
// Specialized cache for expert system operations
export class ExpertCache {
    cache = new Map();
    config;
    cleanupTimer = null;
    hits = 0;
    misses = 0;
    constructor(config = DEFAULT_CACHE_CONFIG) {
        this.config = config;
        this.startCleanupTimer();
        logger.info('🗄️ Expert Cache initialized', {
            config: this.config,
            maxSize: this.config.maxSize,
            defaultTTL: `${this.config.defaultTTL}ms`
        });
    }
    // Set cache entry with optional TTL override
    set(key, value, ttl) {
        const now = Date.now();
        const entryTTL = ttl || this.config.defaultTTL;
        // Check if we need to evict entries to make space
        if (this.cache.size >= this.config.maxSize) {
            this.evictEntries();
        }
        const entry = {
            value,
            timestamp: now,
            ttl: entryTTL,
            accessCount: 0,
            lastAccess: now
        };
        this.cache.set(key, entry);
        logger.debug('📝 Cache entry set', {
            key,
            ttl: entryTTL,
            cacheSize: this.cache.size,
            valueType: typeof value
        });
    }
    // Get cache entry
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            logger.debug('❌ Cache miss', { key, hitRate: this.getHitRate() });
            return null;
        }
        const now = Date.now();
        // Check if entry has expired
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.misses++;
            logger.debug('⏰ Cache entry expired', {
                key,
                age: `${now - entry.timestamp}ms`,
                ttl: `${entry.ttl}ms`
            });
            return null;
        }
        // Update access statistics
        entry.accessCount++;
        entry.lastAccess = now;
        this.hits++;
        logger.debug('✅ Cache hit', {
            key,
            accessCount: entry.accessCount,
            hitRate: this.getHitRate()
        });
        return entry.value;
    }
    // Check if key exists and is not expired
    has(key) {
        return this.get(key) !== null;
    }
    // Delete cache entry
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug('🗑️ Cache entry deleted', { key, cacheSize: this.cache.size });
        }
        return deleted;
    }
    // Clear all cache entries
    clear() {
        const previousSize = this.cache.size;
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        logger.info('🧹 Cache cleared', { previousSize });
    }
    // Get cache statistics
    getStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.values());
        const stats = {
            size: this.cache.size,
            maxSize: this.config.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.getHitRate(),
            totalRequests: this.hits + this.misses,
            averageAccessCount: entries.length > 0 ?
                entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length : 0,
            expiredEntries: entries.filter(entry => now - entry.timestamp > entry.ttl).length,
            utilizationPercentage: (this.cache.size / this.config.maxSize) * 100
        };
        logger.debug('📊 Cache statistics requested', stats);
        return stats;
    }
    // Get hit rate percentage
    getHitRate() {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total) * 100 : 0;
    }
    // Evict entries when cache is full
    evictEntries() {
        const entriesToEvict = Math.ceil(this.config.maxSize * 0.1); // Evict 10% of entries
        if (this.config.enableLRU) {
            this.evictLRU(entriesToEvict);
        }
        else {
            this.evictOldest(entriesToEvict);
        }
    }
    // Evict least recently used entries
    evictLRU(count) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        const evicted = [];
        for (let i = 0; i < Math.min(count, entries.length); i++) {
            const [key] = entries[i];
            this.cache.delete(key);
            evicted.push(key);
        }
        logger.debug('🔄 LRU eviction completed', {
            evictedCount: evicted.length,
            remainingSize: this.cache.size
        });
    }
    // Evict oldest entries
    evictOldest(count) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const evicted = [];
        for (let i = 0; i < Math.min(count, entries.length); i++) {
            const [key] = entries[i];
            this.cache.delete(key);
            evicted.push(key);
        }
        logger.debug('🔄 Oldest entry eviction completed', {
            evictedCount: evicted.length,
            remainingSize: this.cache.size
        });
    }
    // Start automatic cleanup timer
    startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
        logger.debug('⏲️ Cleanup timer started', {
            interval: `${this.config.cleanupInterval}ms`
        });
    }
    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            this.cache.delete(key);
        }
        if (expiredKeys.length > 0) {
            logger.debug('🧹 Cleanup completed', {
                expiredEntries: expiredKeys.length,
                remainingSize: this.cache.size
            });
        }
    }
    // Update cache configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Restart cleanup timer if interval changed
        if (newConfig.cleanupInterval) {
            this.startCleanupTimer();
        }
        logger.info('⚙️ Cache configuration updated', { config: this.config });
    }
    // Get entries matching a pattern
    getByPattern(pattern) {
        const matches = [];
        for (const [key, entry] of this.cache.entries()) {
            if (pattern.test(key)) {
                const now = Date.now();
                if (now - entry.timestamp <= entry.ttl) {
                    matches.push({ key, value: entry.value });
                }
            }
        }
        logger.debug('🔍 Pattern search completed', {
            pattern: pattern.source,
            matches: matches.length
        });
        return matches;
    }
    // Destroy cache and cleanup resources
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        logger.info('💥 Expert Cache destroyed');
    }
}
// Specialized cache keys for expert operations
export class ExpertCacheKeys {
    // Expert selection cache keys
    static expertSelection(workflowDescription, filePaths) {
        const pathsHash = filePaths.sort().join('|');
        return `expert-selection:${this.hash(workflowDescription + pathsHash)}`;
    }
    // Workflow classification cache keys
    static workflowClassification(description, filePaths) {
        const pathsHash = filePaths.sort().join('|');
        return `workflow-classification:${this.hash(description + pathsHash)}`;
    }
    // Agent coordination cache keys
    static agentCoordination(context, expertType, subtask) {
        return `agent-coordination:${this.hash(context + expertType + subtask)}`;
    }
    // Context transfer cache keys
    static contextTransfer(handoffId, scope) {
        return `context-transfer:${handoffId}:${scope}`;
    }
    // Expert status cache keys
    static expertStatus(expertType) {
        return `expert-status:${expertType}`;
    }
    // Implementation validation cache keys
    static implementationValidation(implementationPath, experts) {
        const expertsHash = experts.sort().join('|');
        return `implementation-validation:${this.hash(implementationPath + expertsHash)}`;
    }
    // Simple hash function for cache keys
    static hash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
}
// Cache performance decorator
export function cached(cache, keyGenerator, ttl) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheKey = keyGenerator(...args);
            // Try to get from cache first
            const cachedResult = cache.get(cacheKey);
            if (cachedResult !== null) {
                return cachedResult;
            }
            // Execute original method if not in cache
            const result = await originalMethod.apply(this, args);
            // Cache the result
            cache.set(cacheKey, result, ttl);
            return result;
        };
        return descriptor;
    };
}
// Export singleton instance
export const expertCache = new ExpertCache();
//# sourceMappingURL=expert-cache.js.map
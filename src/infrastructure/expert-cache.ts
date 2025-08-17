import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('expert-cache.log');

// Cache entry interface
interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
    accessCount: number;
    lastAccess: number;
}

// Cache configuration
export interface ExpertCacheConfig {
    defaultTTL: number; // Default time to live in milliseconds
    maxSize: number; // Maximum number of entries
    cleanupInterval: number; // Cleanup interval in milliseconds
    enableLRU: boolean; // Enable Least Recently Used eviction
}

// Default cache configuration optimized for VET operations
export const DEFAULT_CACHE_CONFIG: ExpertCacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000, // 1000 entries
    cleanupInterval: 2 * 60 * 1000, // 2 minutes
    enableLRU: true
};

// Specialized cache for expert system operations
export class ExpertCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private config: ExpertCacheConfig;
    private cleanupTimer: ReturnType<typeof setTimeout> | null = null;
    private hits: number = 0;
    private misses: number = 0;

    constructor(config: ExpertCacheConfig = DEFAULT_CACHE_CONFIG) {
        this.config = config;
        this.startCleanupTimer();
        logger.info('🗄️ Expert Cache initialized', { 
            config: this.config,
            maxSize: this.config.maxSize,
            defaultTTL: `${this.config.defaultTTL}ms`
        });
    }

    // Set cache entry with optional TTL override
    public set<T>(key: string, value: T, ttl?: number): void {
        const now = Date.now();
        const entryTTL = ttl || this.config.defaultTTL;
        
        // Check if we need to evict entries to make space
        if (this.cache.size >= this.config.maxSize) {
            this.evictEntries();
        }

        const entry: CacheEntry<T> = {
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
    public get<T>(key: string): T | null {
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

        return entry.value as T;
    }

    // Check if key exists and is not expired
    public has(key: string): boolean {
        return this.get(key) !== null;
    }

    // Delete cache entry
    public delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug('🗑️ Cache entry deleted', { key, cacheSize: this.cache.size });
        }
        return deleted;
    }

    // Clear all cache entries
    public clear(): void {
        const previousSize = this.cache.size;
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        logger.info('🧹 Cache cleared', { previousSize });
    }

    // Get cache statistics
    public getStats(): Record<string, any> {
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
    private getHitRate(): number {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total) * 100 : 0;
    }

    // Evict entries when cache is full
    private evictEntries(): void {
        const entriesToEvict = Math.ceil(this.config.maxSize * 0.1); // Evict 10% of entries
        
        if (this.config.enableLRU) {
            this.evictLRU(entriesToEvict);
        } else {
            this.evictOldest(entriesToEvict);
        }
    }

    // Evict least recently used entries
    private evictLRU(count: number): void {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        const evicted: string[] = [];
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
    private evictOldest(count: number): void {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const evicted: string[] = [];
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
    private startCleanupTimer(): void {
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
    public cleanup(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

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
    public updateConfig(newConfig: Partial<ExpertCacheConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // Restart cleanup timer if interval changed
        if (newConfig.cleanupInterval) {
            this.startCleanupTimer();
        }

        logger.info('⚙️ Cache configuration updated', { config: this.config });
    }

    // Get entries matching a pattern
    public getByPattern(pattern: RegExp): Array<{ key: string; value: any }> {
        const matches: Array<{ key: string; value: any }> = [];
        
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
    public destroy(): void {
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
    static expertSelection(workflowDescription: string, filePaths: string[]): string {
        const pathsHash = filePaths.sort().join('|');
        return `expert-selection:${this.hash(workflowDescription + pathsHash)}`;
    }

    // Workflow classification cache keys
    static workflowClassification(description: string, filePaths: string[]): string {
        const pathsHash = filePaths.sort().join('|');
        return `workflow-classification:${this.hash(description + pathsHash)}`;
    }

    // Agent coordination cache keys
    static agentCoordination(context: string, expertType: string, subtask: string): string {
        return `agent-coordination:${this.hash(context + expertType + subtask)}`;
    }

    // Context transfer cache keys
    static contextTransfer(handoffId: string, scope: string): string {
        return `context-transfer:${handoffId}:${scope}`;
    }

    // Expert status cache keys
    static expertStatus(expertType: string): string {
        return `expert-status:${expertType}`;
    }

    // Implementation validation cache keys
    static implementationValidation(implementationPath: string, experts: string[]): string {
        const expertsHash = experts.sort().join('|');
        return `implementation-validation:${this.hash(implementationPath + expertsHash)}`;
    }

    // Simple hash function for cache keys
    private static hash(input: string): string {
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
export function cached<T>(
    cache: ExpertCache,
    keyGenerator: (...args: any[]) => string,
    ttl?: number
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]): Promise<T> {
            const cacheKey = keyGenerator(...args);
            
            // Try to get from cache first
            const cachedResult = cache.get<T>(cacheKey);
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
/**
 * Service Discovery Cache
 * Manages TTL-based caching of service discovery results
 */

import { ServiceDiscoveryResult, ServiceDiscoveryCacheEntry } from './types.js';

/**
 * TTL-based cache for service discovery results
 */
export class ServiceDiscoveryCache {
    private readonly cache = new Map<string, ServiceDiscoveryCacheEntry>();
    private readonly ttlCleanupInterval: NodeJS.Timeout;
    
    constructor(
        private readonly defaultTtl: number = 300000, // 5 minutes
        private readonly cleanupInterval: number = 60000 // 1 minute
    ) {
        // Start periodic cleanup of expired entries
        this.ttlCleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, cleanupInterval);
    }
    
    /**
     * Get cached discovery result for an environment
     */
    get(environmentId: string): ServiceDiscoveryResult | null {
        const entry = this.cache.get(environmentId);
        
        if (!entry) {
            return null;
        }
        
        // Check if expired
        if (Date.now() > entry.expiresAt.getTime()) {
            this.cache.delete(environmentId);
            return null;
        }
        
        return entry.result;
    }
    
    /**
     * Store discovery result in cache with TTL
     */
    set(environmentId: string, result: ServiceDiscoveryResult, ttl?: number): void {
        const actualTtl = ttl ?? this.defaultTtl;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + actualTtl);
        
        const entry: ServiceDiscoveryCacheEntry = {
            result,
            cachedAt: now,
            expiresAt
        };
        
        this.cache.set(environmentId, entry);
    }
    
    /**
     * Remove cached result for an environment
     */
    delete(environmentId: string): boolean {
        return this.cache.delete(environmentId);
    }
    
    /**
     * Clear all cached results
     */
    clear(): void {
        this.cache.clear();
    }
    
    /**
     * Check if environment has valid cached result
     */
    has(environmentId: string): boolean {
        return this.get(environmentId) !== null;
    }
    
    /**
     * Get cache statistics
     */
    getStats(): {
        totalEntries: number;
        expiredEntries: number;
        validEntries: number;
        oldestEntry?: Date;
        newestEntry?: Date;
    } {
        const now = Date.now();
        let expiredCount = 0;
        let validCount = 0;
        let oldestEntry: Date | undefined;
        let newestEntry: Date | undefined;
        
        for (const entry of this.cache.values()) {
            if (now > entry.expiresAt.getTime()) {
                expiredCount++;
            } else {
                validCount++;
            }
            
            if (!oldestEntry || entry.cachedAt < oldestEntry) {
                oldestEntry = entry.cachedAt;
            }
            
            if (!newestEntry || entry.cachedAt > newestEntry) {
                newestEntry = entry.cachedAt;
            }
        }
        
        return {
            totalEntries: this.cache.size,
            expiredEntries: expiredCount,
            validEntries: validCount,
            oldestEntry,
            newestEntry
        };
    }
    
    /**
     * Get all valid cached results
     */
    getAllValid(): Map<string, ServiceDiscoveryResult> {
        const results = new Map<string, ServiceDiscoveryResult>();
        
        for (const [environmentId] of this.cache) {
            const result = this.get(environmentId); // This handles expiry check
            if (result) {
                results.set(environmentId, result);
            }
        }
        
        return results;
    }
    
    /**
     * Remove expired entries from cache
     */
    private cleanupExpired(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];
        
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt.getTime()) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.cache.delete(key));
        
        if (expiredKeys.length > 0) {
            // Optional: emit cleanup event or log
            console.debug(`Service discovery cache: cleaned up ${expiredKeys.length} expired entries`);
        }
    }
    
    /**
     * Cleanup resources
     */
    dispose(): void {
        clearInterval(this.ttlCleanupInterval);
        this.clear();
    }
}
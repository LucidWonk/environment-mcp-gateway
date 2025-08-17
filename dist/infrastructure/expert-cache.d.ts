export interface ExpertCacheConfig {
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
    enableLRU: boolean;
}
export declare const DEFAULT_CACHE_CONFIG: ExpertCacheConfig;
export declare class ExpertCache {
    private cache;
    private config;
    private cleanupTimer;
    private hits;
    private misses;
    constructor(config?: ExpertCacheConfig);
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): Record<string, any>;
    private getHitRate;
    private evictEntries;
    private evictLRU;
    private evictOldest;
    private startCleanupTimer;
    cleanup(): void;
    updateConfig(newConfig: Partial<ExpertCacheConfig>): void;
    getByPattern(pattern: RegExp): Array<{
        key: string;
        value: any;
    }>;
    destroy(): void;
}
export declare class ExpertCacheKeys {
    static expertSelection(workflowDescription: string, filePaths: string[]): string;
    static workflowClassification(description: string, filePaths: string[]): string;
    static agentCoordination(context: string, expertType: string, subtask: string): string;
    static contextTransfer(handoffId: string, scope: string): string;
    static expertStatus(expertType: string): string;
    static implementationValidation(implementationPath: string, experts: string[]): string;
    private static hash;
}
export declare function cached<T>(cache: ExpertCache, keyGenerator: (...args: any[]) => string, ttl?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const expertCache: ExpertCache;
//# sourceMappingURL=expert-cache.d.ts.map
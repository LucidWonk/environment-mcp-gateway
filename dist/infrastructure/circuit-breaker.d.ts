import { EventEmitter } from 'events';
export declare enum CircuitBreakerState {
    CLOSED = "closed",// Normal operation
    OPEN = "open",// Circuit is open, requests fail fast
    HALF_OPEN = "half-open"
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
    halfOpenMaxCalls: number;
    timeoutDuration: number;
    enableHealthCheck: boolean;
    healthCheckInterval: number;
}
export declare const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig;
export interface CircuitBreakerStats {
    state: CircuitBreakerState;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    circuitOpenCount: number;
    lastFailureTime: number | null;
    recentFailures: number;
    successRate: number;
    averageResponseTime: number;
}
export declare class ExpertCircuitBreaker extends EventEmitter {
    private state;
    private config;
    private failures;
    private totalRequests;
    private successfulRequests;
    private failedRequests;
    private circuitOpenCount;
    private lastFailureTime;
    private halfOpenCallsCount;
    private nextRetryTime;
    private responseTimes;
    private healthCheckTimer;
    readonly expertType: string;
    constructor(expertType: string, config?: CircuitBreakerConfig);
    execute<T>(operation: string, fn: () => Promise<T>): Promise<T>;
    private canExecute;
    private executeWithTimeout;
    private onSuccess;
    private onFailure;
    private shouldOpenCircuit;
    private openCircuit;
    private getRecentFailureCount;
    private cleanupOldFailures;
    getStats(): CircuitBreakerStats;
    forceState(newState: CircuitBreakerState): void;
    reset(): void;
    private startHealthChecking;
    private performHealthCheck;
    private checkExpertHealth;
    updateConfig(newConfig: Partial<CircuitBreakerConfig>): void;
    destroy(): void;
}
export declare class CircuitBreakerManager {
    private circuitBreakers;
    private globalConfig;
    constructor(config?: CircuitBreakerConfig);
    getCircuitBreaker(expertType: string, config?: CircuitBreakerConfig): ExpertCircuitBreaker;
    getAllStats(): Record<string, CircuitBreakerStats>;
    getSystemHealth(): Record<string, any>;
    resetAll(): void;
    destroyAll(): void;
    private eventEmitter;
    on: <K>(eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter<[never]>;
    emit: <K>(eventName: string | symbol, ...args: any[]) => boolean;
    removeListener: <K>(eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter<[never]>;
    removeAllListeners: (eventName?: string | symbol | undefined) => EventEmitter<[never]>;
}
export declare const circuitBreakerManager: CircuitBreakerManager;
//# sourceMappingURL=circuit-breaker.d.ts.map
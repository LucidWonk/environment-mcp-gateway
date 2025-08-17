export declare enum ErrorCategory {
    NETWORK_ERROR = "network-error",
    TIMEOUT_ERROR = "timeout-error",
    AUTHENTICATION_ERROR = "authentication-error",
    RATE_LIMIT_ERROR = "rate-limit-error",
    VALIDATION_ERROR = "validation-error",
    EXPERT_UNAVAILABLE = "expert-unavailable",
    RESOURCE_EXHAUSTION = "resource-exhaustion",
    CONFIGURATION_ERROR = "configuration-error",
    UNKNOWN_ERROR = "unknown-error"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorHandlingStrategy {
    RETRY = "retry",
    FAIL_FAST = "fail-fast",
    FALLBACK = "fallback",
    CIRCUIT_BREAK = "circuit-break",
    IGNORE = "ignore"
}
export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitterEnabled: boolean;
}
export interface ErrorHandlingConfig {
    enableRetries: boolean;
    enableCircuitBreaker: boolean;
    enableFallbacks: boolean;
    enableMetrics: boolean;
    defaultRetryConfig: RetryConfig;
    categoryConfigs: Map<ErrorCategory, {
        strategy: ErrorHandlingStrategy;
        severity: ErrorSeverity;
        retryConfig?: RetryConfig;
    }>;
}
export declare const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig;
export declare class ExpertError extends Error {
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly expertType?: string;
    readonly operation?: string;
    readonly timestamp: number;
    readonly context?: Record<string, any>;
    readonly isRetryable: boolean;
    readonly originalError?: Error;
    constructor(message: string, category: ErrorCategory, severity: ErrorSeverity, options?: {
        expertType?: string;
        operation?: string;
        context?: Record<string, any>;
        isRetryable?: boolean;
        originalError?: Error;
    });
}
export interface ErrorStats {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByExpert: Record<string, number>;
    recentErrors: ExpertError[];
    errorRate: number;
    mtbf: number;
}
export declare class ExpertErrorHandler {
    private config;
    private errorHistory;
    private fallbackHandlers;
    private errorCount;
    private startTime;
    constructor(config?: ErrorHandlingConfig);
    executeWithErrorHandling<T>(operation: string, expertType: string, fn: () => Promise<T>, fallbackFn?: () => Promise<T>): Promise<T>;
    private executeWithRetry;
    private classifyError;
    private getRetryConfig;
    private calculateRetryDelay;
    private sleep;
    private recordError;
    registerFallback(operationKey: string, fallbackFn: () => Promise<any>): void;
    getErrorStats(): ErrorStats;
    updateConfig(newConfig: Partial<ErrorHandlingConfig>): void;
    clearHistory(): void;
    getHealthStatus(): Record<string, any>;
    private generateHealthRecommendations;
}
export declare class ExpertErrorUtils {
    static createTimeoutError(expertType: string, operation: string, timeoutMs: number): ExpertError;
    static createUnavailableError(expertType: string, operation: string): ExpertError;
    static createValidationError(expertType: string, operation: string, details: string): ExpertError;
    static createNetworkError(expertType: string, operation: string, originalError: Error): ExpertError;
    static isTransientError(error: ExpertError): boolean;
    static isUrgentError(error: ExpertError): boolean;
}
export declare const expertErrorHandler: ExpertErrorHandler;
//# sourceMappingURL=error-handler.d.ts.map
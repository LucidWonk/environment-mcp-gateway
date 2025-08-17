import { createMCPLogger } from '../utils/mcp-logger.js';
import { circuitBreakerManager } from './circuit-breaker.js';
import { performanceMonitor } from './performance-monitor.js';

const logger = createMCPLogger('error-handler.log');

// Error categories for classification
export enum ErrorCategory {
    NETWORK_ERROR = 'network-error',
    TIMEOUT_ERROR = 'timeout-error',
    AUTHENTICATION_ERROR = 'authentication-error',
    RATE_LIMIT_ERROR = 'rate-limit-error',
    VALIDATION_ERROR = 'validation-error',
    EXPERT_UNAVAILABLE = 'expert-unavailable',
    RESOURCE_EXHAUSTION = 'resource-exhaustion',
    CONFIGURATION_ERROR = 'configuration-error',
    UNKNOWN_ERROR = 'unknown-error'
}

// Error severity levels
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

// Error handling strategy
export enum ErrorHandlingStrategy {
    RETRY = 'retry',
    FAIL_FAST = 'fail-fast',
    FALLBACK = 'fallback',
    CIRCUIT_BREAK = 'circuit-break',
    IGNORE = 'ignore'
}

// Retry configuration
export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;          // Base delay in milliseconds
    maxDelay: number;           // Maximum delay in milliseconds
    backoffMultiplier: number;  // Exponential backoff multiplier
    jitterEnabled: boolean;     // Add random jitter to delays
}

// Error handling configuration
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

// Default error handling configuration
export const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
    enableRetries: true,
    enableCircuitBreaker: true,
    enableFallbacks: true,
    enableMetrics: true,
    defaultRetryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,       // 1 second
        maxDelay: 30000,       // 30 seconds
        backoffMultiplier: 2,
        jitterEnabled: true
    },
    categoryConfigs: new Map([
        [ErrorCategory.NETWORK_ERROR, {
            strategy: ErrorHandlingStrategy.RETRY,
            severity: ErrorSeverity.MEDIUM
        }],
        [ErrorCategory.TIMEOUT_ERROR, {
            strategy: ErrorHandlingStrategy.RETRY,
            severity: ErrorSeverity.MEDIUM
        }],
        [ErrorCategory.AUTHENTICATION_ERROR, {
            strategy: ErrorHandlingStrategy.FAIL_FAST,
            severity: ErrorSeverity.HIGH
        }],
        [ErrorCategory.RATE_LIMIT_ERROR, {
            strategy: ErrorHandlingStrategy.RETRY,
            severity: ErrorSeverity.MEDIUM,
            retryConfig: {
                maxAttempts: 5,
                baseDelay: 5000,   // 5 seconds for rate limits
                maxDelay: 60000,   // 1 minute
                backoffMultiplier: 1.5,
                jitterEnabled: true
            }
        }],
        [ErrorCategory.VALIDATION_ERROR, {
            strategy: ErrorHandlingStrategy.FAIL_FAST,
            severity: ErrorSeverity.LOW
        }],
        [ErrorCategory.EXPERT_UNAVAILABLE, {
            strategy: ErrorHandlingStrategy.CIRCUIT_BREAK,
            severity: ErrorSeverity.HIGH
        }],
        [ErrorCategory.RESOURCE_EXHAUSTION, {
            strategy: ErrorHandlingStrategy.CIRCUIT_BREAK,
            severity: ErrorSeverity.CRITICAL
        }],
        [ErrorCategory.CONFIGURATION_ERROR, {
            strategy: ErrorHandlingStrategy.FAIL_FAST,
            severity: ErrorSeverity.HIGH
        }],
        [ErrorCategory.UNKNOWN_ERROR, {
            strategy: ErrorHandlingStrategy.RETRY,
            severity: ErrorSeverity.MEDIUM
        }]
    ])
};

// Enhanced error class with additional context
export class ExpertError extends Error {
    public readonly category: ErrorCategory;
    public readonly severity: ErrorSeverity;
    public readonly expertType?: string;
    public readonly operation?: string;
    public readonly timestamp: number;
    public readonly context?: Record<string, any>;
    public readonly isRetryable: boolean;
    public readonly originalError?: Error;

    constructor(
        message: string,
        category: ErrorCategory,
        severity: ErrorSeverity,
        options?: {
            expertType?: string;
            operation?: string;
            context?: Record<string, any>;
            isRetryable?: boolean;
            originalError?: Error;
        }
    ) {
        super(message);
        this.name = 'ExpertError';
        this.category = category;
        this.severity = severity;
        this.expertType = options?.expertType;
        this.operation = options?.operation;
        this.timestamp = Date.now();
        this.context = options?.context;
        this.isRetryable = options?.isRetryable ?? true;
        this.originalError = options?.originalError;

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ExpertError);
        }
    }
}

// Error statistics
export interface ErrorStats {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByExpert: Record<string, number>;
    recentErrors: ExpertError[];
    errorRate: number;
    mtbf: number; // Mean Time Between Failures
}

// Comprehensive error handler for expert system operations
export class ExpertErrorHandler {
    private config: ErrorHandlingConfig;
    private errorHistory: ExpertError[] = [];
    private fallbackHandlers: Map<string, () => Promise<any>> = new Map();
    private errorCount: number = 0;
    private startTime: number = Date.now();

    constructor(config: ErrorHandlingConfig = DEFAULT_ERROR_CONFIG) {
        this.config = config;
        logger.info('🛡️ Expert Error Handler initialized', {
            enableRetries: this.config.enableRetries,
            enableCircuitBreaker: this.config.enableCircuitBreaker,
            enableFallbacks: this.config.enableFallbacks
        });
    }

    // Execute operation with comprehensive error handling
    public async executeWithErrorHandling<T>(
        operation: string,
        expertType: string,
        fn: () => Promise<T>,
        fallbackFn?: () => Promise<T>
    ): Promise<T> {
        const operationId = `${operation}-${expertType}-${Date.now()}`;
        
        if (this.config.enableMetrics) {
            performanceMonitor.startTiming(operationId, `error-handled-${operation}`);
        }

        try {
            if (this.config.enableCircuitBreaker) {
                const circuitBreaker = circuitBreakerManager.getCircuitBreaker(expertType);
                return await circuitBreaker.execute(operation, fn);
            } else {
                return await this.executeWithRetry(operation, expertType, fn);
            }
        } catch (error) {
            const expertError = this.classifyError(error as Error, expertType, operation);
            this.recordError(expertError);

            // Try fallback if available and configured
            if (this.config.enableFallbacks && fallbackFn) {
                try {
                    logger.info('🔄 Attempting fallback for failed operation', {
                        operation,
                        expertType,
                        errorCategory: expertError.category
                    });
                    
                    const result = await fallbackFn();
                    
                    logger.info('✅ Fallback succeeded', { operation, expertType });
                    return result;
                } catch (fallbackError) {
                    logger.warn('❌ Fallback also failed', {
                        operation,
                        expertType,
                        fallbackError: (fallbackError as Error).message
                    });
                    throw expertError; // Throw original error, not fallback error
                }
            }

            throw expertError;
        } finally {
            if (this.config.enableMetrics) {
                performanceMonitor.endTiming(operationId, `error-handled-${operation}`);
            }
        }
    }

    // Execute operation with retry logic
    private async executeWithRetry<T>(
        operation: string,
        expertType: string,
        fn: () => Promise<T>
    ): Promise<T> {
        let lastError: Error | null = null;
        const retryConfig = this.getRetryConfig(ErrorCategory.UNKNOWN_ERROR);
        
        for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                const expertError = this.classifyError(lastError, expertType, operation);
                
                // Check if error is retryable
                if (!expertError.isRetryable || attempt >= retryConfig.maxAttempts) {
                    throw expertError;
                }

                // Calculate delay with exponential backoff and jitter
                const delay = this.calculateRetryDelay(attempt, retryConfig);
                
                logger.warn('🔄 Operation failed, retrying', {
                    operation,
                    expertType,
                    attempt,
                    maxAttempts: retryConfig.maxAttempts,
                    delay,
                    errorCategory: expertError.category,
                    error: lastError.message
                });

                await this.sleep(delay);
            }
        }

        // If we get here, all retries failed
        throw this.classifyError(lastError!, expertType, operation);
    }

    // Classify error into appropriate category
    private classifyError(error: Error, expertType: string, operation: string): ExpertError {
        let category = ErrorCategory.UNKNOWN_ERROR;
        let isRetryable = true;

        // Classify based on error message and type
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
            category = ErrorCategory.TIMEOUT_ERROR;
        } else if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('enotfound')) {
            category = ErrorCategory.NETWORK_ERROR;
        } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
            category = ErrorCategory.AUTHENTICATION_ERROR;
            isRetryable = false;
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
            category = ErrorCategory.RATE_LIMIT_ERROR;
        } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
            category = ErrorCategory.VALIDATION_ERROR;
            isRetryable = false;
        } else if (errorMessage.includes('unavailable') || errorMessage.includes('service')) {
            category = ErrorCategory.EXPERT_UNAVAILABLE;
        } else if (errorMessage.includes('resource') || errorMessage.includes('memory') || errorMessage.includes('limit')) {
            category = ErrorCategory.RESOURCE_EXHAUSTION;
        } else if (errorMessage.includes('configuration') || errorMessage.includes('config')) {
            category = ErrorCategory.CONFIGURATION_ERROR;
            isRetryable = false;
        }

        const categoryConfig = this.config.categoryConfigs.get(category);
        const severity = categoryConfig?.severity || ErrorSeverity.MEDIUM;

        return new ExpertError(
            error.message,
            category,
            severity,
            {
                expertType,
                operation,
                isRetryable: isRetryable && categoryConfig?.strategy === ErrorHandlingStrategy.RETRY,
                originalError: error,
                context: {
                    stack: error.stack,
                    timestamp: Date.now()
                }
            }
        );
    }

    // Get retry configuration for error category
    private getRetryConfig(category: ErrorCategory): RetryConfig {
        const categoryConfig = this.config.categoryConfigs.get(category);
        return categoryConfig?.retryConfig || this.config.defaultRetryConfig;
    }

    // Calculate retry delay with exponential backoff and jitter
    private calculateRetryDelay(attempt: number, config: RetryConfig): number {
        let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        delay = Math.min(delay, config.maxDelay);

        if (config.jitterEnabled) {
            // Add ±25% jitter
            const jitter = delay * 0.25 * (Math.random() * 2 - 1);
            delay += jitter;
        }

        return Math.max(delay, 0);
    }

    // Sleep for specified duration
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Record error for statistics and monitoring
    private recordError(error: ExpertError): void {
        this.errorCount++;
        this.errorHistory.push(error);

        // Keep only recent errors (last 1000)
        if (this.errorHistory.length > 1000) {
            this.errorHistory = this.errorHistory.slice(-500);
        }

        logger.error('❌ Expert operation error recorded', {
            category: error.category,
            severity: error.severity,
            expertType: error.expertType,
            operation: error.operation,
            message: error.message,
            isRetryable: error.isRetryable
        });
    }

    // Register fallback handler for specific operations
    public registerFallback(operationKey: string, fallbackFn: () => Promise<any>): void {
        this.fallbackHandlers.set(operationKey, fallbackFn);
        logger.info('📋 Fallback handler registered', { operationKey });
    }

    // Get comprehensive error statistics
    public getErrorStats(): ErrorStats {
        const now = Date.now();
        const recentCutoff = now - (24 * 60 * 60 * 1000); // Last 24 hours
        const recentErrors = this.errorHistory.filter(e => e.timestamp > recentCutoff);

        const errorsByCategory = Object.values(ErrorCategory).reduce((acc, category) => {
            acc[category] = recentErrors.filter(e => e.category === category).length;
            return acc;
        }, {} as Record<ErrorCategory, number>);

        const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
            acc[severity] = recentErrors.filter(e => e.severity === severity).length;
            return acc;
        }, {} as Record<ErrorSeverity, number>);

        const errorsByExpert = recentErrors.reduce((acc, error) => {
            const expert = error.expertType || 'unknown';
            acc[expert] = (acc[expert] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const runTime = now - this.startTime;
        const errorRate = this.errorCount / (runTime / 1000); // Errors per second
        const mtbf = this.errorCount > 0 ? runTime / this.errorCount : runTime; // Mean time between failures

        return {
            totalErrors: this.errorCount,
            errorsByCategory,
            errorsBySeverity,
            errorsByExpert,
            recentErrors: recentErrors.slice(-10), // Last 10 errors
            errorRate,
            mtbf
        };
    }

    // Update error handling configuration
    public updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
        this.config = { ...this.config, ...newConfig };
        logger.info('⚙️ Error handling configuration updated', { config: this.config });
    }

    // Clear error history
    public clearHistory(): void {
        this.errorHistory = [];
        this.errorCount = 0;
        this.startTime = Date.now();
        logger.info('🧹 Error history cleared');
    }

    // Get health status based on error patterns
    public getHealthStatus(): Record<string, any> {
        const stats = this.getErrorStats();
        const criticalErrors = stats.recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
        const highErrors = stats.recentErrors.filter(e => e.severity === ErrorSeverity.HIGH).length;
        
        const isHealthy = criticalErrors === 0 && highErrors < 5 && stats.errorRate < 0.1;

        return {
            healthy: isHealthy,
            errorRate: stats.errorRate,
            criticalErrors,
            highErrors,
            totalRecentErrors: stats.recentErrors.length,
            timestamp: new Date().toISOString(),
            recommendations: this.generateHealthRecommendations(stats)
        };
    }

    // Generate health recommendations based on error patterns
    private generateHealthRecommendations(stats: ErrorStats): string[] {
        const recommendations: string[] = [];

        if (stats.errorRate > 0.1) {
            recommendations.push('High error rate detected - consider reviewing expert configurations');
        }

        if (stats.errorsByCategory[ErrorCategory.TIMEOUT_ERROR] > 5) {
            recommendations.push('Multiple timeout errors - consider increasing timeout thresholds');
        }

        if (stats.errorsByCategory[ErrorCategory.RATE_LIMIT_ERROR] > 3) {
            recommendations.push('Rate limit errors detected - consider implementing better rate limiting');
        }

        if (stats.errorsByCategory[ErrorCategory.RESOURCE_EXHAUSTION] > 0) {
            recommendations.push('Resource exhaustion detected - scale up resources or implement load balancing');
        }

        if (stats.recentErrors.some(e => e.severity === ErrorSeverity.CRITICAL)) {
            recommendations.push('Critical errors detected - immediate investigation required');
        }

        return recommendations;
    }
}

// Expert-specific error utilities
export class ExpertErrorUtils {
    // Create standardized error for common scenarios
    static createTimeoutError(expertType: string, operation: string, timeoutMs: number): ExpertError {
        return new ExpertError(
            `Operation timeout after ${timeoutMs}ms`,
            ErrorCategory.TIMEOUT_ERROR,
            ErrorSeverity.MEDIUM,
            { expertType, operation, isRetryable: true }
        );
    }

    static createUnavailableError(expertType: string, operation: string): ExpertError {
        return new ExpertError(
            `Expert ${expertType} is currently unavailable`,
            ErrorCategory.EXPERT_UNAVAILABLE,
            ErrorSeverity.HIGH,
            { expertType, operation, isRetryable: false }
        );
    }

    static createValidationError(expertType: string, operation: string, details: string): ExpertError {
        return new ExpertError(
            `Validation failed: ${details}`,
            ErrorCategory.VALIDATION_ERROR,
            ErrorSeverity.LOW,
            { expertType, operation, isRetryable: false }
        );
    }

    static createNetworkError(expertType: string, operation: string, originalError: Error): ExpertError {
        return new ExpertError(
            `Network error: ${originalError.message}`,
            ErrorCategory.NETWORK_ERROR,
            ErrorSeverity.MEDIUM,
            { expertType, operation, isRetryable: true, originalError }
        );
    }

    // Check if error is transient (retryable)
    static isTransientError(error: ExpertError): boolean {
        return error.isRetryable && [
            ErrorCategory.NETWORK_ERROR,
            ErrorCategory.TIMEOUT_ERROR,
            ErrorCategory.RATE_LIMIT_ERROR,
            ErrorCategory.EXPERT_UNAVAILABLE
        ].includes(error.category);
    }

    // Check if error requires immediate attention
    static isUrgentError(error: ExpertError): boolean {
        return error.severity === ErrorSeverity.CRITICAL || 
               error.category === ErrorCategory.RESOURCE_EXHAUSTION;
    }
}

// Export singleton instance
export const expertErrorHandler = new ExpertErrorHandler();
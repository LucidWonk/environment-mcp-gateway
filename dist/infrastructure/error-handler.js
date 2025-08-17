import { createMCPLogger } from '../utils/mcp-logger.js';
import { circuitBreakerManager } from './circuit-breaker.js';
import { performanceMonitor } from './performance-monitor.js';
const logger = createMCPLogger('error-handler.log');
// Error categories for classification
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK_ERROR"] = "network-error";
    ErrorCategory["TIMEOUT_ERROR"] = "timeout-error";
    ErrorCategory["AUTHENTICATION_ERROR"] = "authentication-error";
    ErrorCategory["RATE_LIMIT_ERROR"] = "rate-limit-error";
    ErrorCategory["VALIDATION_ERROR"] = "validation-error";
    ErrorCategory["EXPERT_UNAVAILABLE"] = "expert-unavailable";
    ErrorCategory["RESOURCE_EXHAUSTION"] = "resource-exhaustion";
    ErrorCategory["CONFIGURATION_ERROR"] = "configuration-error";
    ErrorCategory["UNKNOWN_ERROR"] = "unknown-error";
})(ErrorCategory || (ErrorCategory = {}));
// Error severity levels
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
// Error handling strategy
export var ErrorHandlingStrategy;
(function (ErrorHandlingStrategy) {
    ErrorHandlingStrategy["RETRY"] = "retry";
    ErrorHandlingStrategy["FAIL_FAST"] = "fail-fast";
    ErrorHandlingStrategy["FALLBACK"] = "fallback";
    ErrorHandlingStrategy["CIRCUIT_BREAK"] = "circuit-break";
    ErrorHandlingStrategy["IGNORE"] = "ignore";
})(ErrorHandlingStrategy || (ErrorHandlingStrategy = {}));
// Default error handling configuration
export const DEFAULT_ERROR_CONFIG = {
    enableRetries: true,
    enableCircuitBreaker: true,
    enableFallbacks: true,
    enableMetrics: true,
    defaultRetryConfig: {
        maxAttempts: 3,
        baseDelay: 1000, // 1 second
        maxDelay: 30000, // 30 seconds
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
                    baseDelay: 5000, // 5 seconds for rate limits
                    maxDelay: 60000, // 1 minute
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
    category;
    severity;
    expertType;
    operation;
    timestamp;
    context;
    isRetryable;
    originalError;
    constructor(message, category, severity, options) {
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
// Comprehensive error handler for expert system operations
export class ExpertErrorHandler {
    config;
    errorHistory = [];
    fallbackHandlers = new Map();
    errorCount = 0;
    startTime = Date.now();
    constructor(config = DEFAULT_ERROR_CONFIG) {
        this.config = config;
        logger.info('🛡️ Expert Error Handler initialized', {
            enableRetries: this.config.enableRetries,
            enableCircuitBreaker: this.config.enableCircuitBreaker,
            enableFallbacks: this.config.enableFallbacks
        });
    }
    // Execute operation with comprehensive error handling
    async executeWithErrorHandling(operation, expertType, fn, fallbackFn) {
        const operationId = `${operation}-${expertType}-${Date.now()}`;
        if (this.config.enableMetrics) {
            performanceMonitor.startTiming(operationId, `error-handled-${operation}`);
        }
        try {
            if (this.config.enableCircuitBreaker) {
                const circuitBreaker = circuitBreakerManager.getCircuitBreaker(expertType);
                return await circuitBreaker.execute(operation, fn);
            }
            else {
                return await this.executeWithRetry(operation, expertType, fn);
            }
        }
        catch (error) {
            const expertError = this.classifyError(error, expertType, operation);
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
                }
                catch (fallbackError) {
                    logger.warn('❌ Fallback also failed', {
                        operation,
                        expertType,
                        fallbackError: fallbackError.message
                    });
                    throw expertError; // Throw original error, not fallback error
                }
            }
            throw expertError;
        }
        finally {
            if (this.config.enableMetrics) {
                performanceMonitor.endTiming(operationId, `error-handled-${operation}`);
            }
        }
    }
    // Execute operation with retry logic
    async executeWithRetry(operation, expertType, fn) {
        let lastError = null;
        const retryConfig = this.getRetryConfig(ErrorCategory.UNKNOWN_ERROR);
        for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
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
        throw this.classifyError(lastError, expertType, operation);
    }
    // Classify error into appropriate category
    classifyError(error, expertType, operation) {
        let category = ErrorCategory.UNKNOWN_ERROR;
        let isRetryable = true;
        // Classify based on error message and type
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
            category = ErrorCategory.TIMEOUT_ERROR;
        }
        else if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('enotfound')) {
            category = ErrorCategory.NETWORK_ERROR;
        }
        else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
            category = ErrorCategory.AUTHENTICATION_ERROR;
            isRetryable = false;
        }
        else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
            category = ErrorCategory.RATE_LIMIT_ERROR;
        }
        else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
            category = ErrorCategory.VALIDATION_ERROR;
            isRetryable = false;
        }
        else if (errorMessage.includes('unavailable') || errorMessage.includes('service')) {
            category = ErrorCategory.EXPERT_UNAVAILABLE;
        }
        else if (errorMessage.includes('resource') || errorMessage.includes('memory') || errorMessage.includes('limit')) {
            category = ErrorCategory.RESOURCE_EXHAUSTION;
        }
        else if (errorMessage.includes('configuration') || errorMessage.includes('config')) {
            category = ErrorCategory.CONFIGURATION_ERROR;
            isRetryable = false;
        }
        const categoryConfig = this.config.categoryConfigs.get(category);
        const severity = categoryConfig?.severity || ErrorSeverity.MEDIUM;
        return new ExpertError(error.message, category, severity, {
            expertType,
            operation,
            isRetryable: isRetryable && categoryConfig?.strategy === ErrorHandlingStrategy.RETRY,
            originalError: error,
            context: {
                stack: error.stack,
                timestamp: Date.now()
            }
        });
    }
    // Get retry configuration for error category
    getRetryConfig(category) {
        const categoryConfig = this.config.categoryConfigs.get(category);
        return categoryConfig?.retryConfig || this.config.defaultRetryConfig;
    }
    // Calculate retry delay with exponential backoff and jitter
    calculateRetryDelay(attempt, config) {
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
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Record error for statistics and monitoring
    recordError(error) {
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
    registerFallback(operationKey, fallbackFn) {
        this.fallbackHandlers.set(operationKey, fallbackFn);
        logger.info('📋 Fallback handler registered', { operationKey });
    }
    // Get comprehensive error statistics
    getErrorStats() {
        const now = Date.now();
        const recentCutoff = now - (24 * 60 * 60 * 1000); // Last 24 hours
        const recentErrors = this.errorHistory.filter(e => e.timestamp > recentCutoff);
        const errorsByCategory = Object.values(ErrorCategory).reduce((acc, category) => {
            acc[category] = recentErrors.filter(e => e.category === category).length;
            return acc;
        }, {});
        const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
            acc[severity] = recentErrors.filter(e => e.severity === severity).length;
            return acc;
        }, {});
        const errorsByExpert = recentErrors.reduce((acc, error) => {
            const expert = error.expertType || 'unknown';
            acc[expert] = (acc[expert] || 0) + 1;
            return acc;
        }, {});
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
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger.info('⚙️ Error handling configuration updated', { config: this.config });
    }
    // Clear error history
    clearHistory() {
        this.errorHistory = [];
        this.errorCount = 0;
        this.startTime = Date.now();
        logger.info('🧹 Error history cleared');
    }
    // Get health status based on error patterns
    getHealthStatus() {
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
    generateHealthRecommendations(stats) {
        const recommendations = [];
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
    static createTimeoutError(expertType, operation, timeoutMs) {
        return new ExpertError(`Operation timeout after ${timeoutMs}ms`, ErrorCategory.TIMEOUT_ERROR, ErrorSeverity.MEDIUM, { expertType, operation, isRetryable: true });
    }
    static createUnavailableError(expertType, operation) {
        return new ExpertError(`Expert ${expertType} is currently unavailable`, ErrorCategory.EXPERT_UNAVAILABLE, ErrorSeverity.HIGH, { expertType, operation, isRetryable: false });
    }
    static createValidationError(expertType, operation, details) {
        return new ExpertError(`Validation failed: ${details}`, ErrorCategory.VALIDATION_ERROR, ErrorSeverity.LOW, { expertType, operation, isRetryable: false });
    }
    static createNetworkError(expertType, operation, originalError) {
        return new ExpertError(`Network error: ${originalError.message}`, ErrorCategory.NETWORK_ERROR, ErrorSeverity.MEDIUM, { expertType, operation, isRetryable: true, originalError });
    }
    // Check if error is transient (retryable)
    static isTransientError(error) {
        return error.isRetryable && [
            ErrorCategory.NETWORK_ERROR,
            ErrorCategory.TIMEOUT_ERROR,
            ErrorCategory.RATE_LIMIT_ERROR,
            ErrorCategory.EXPERT_UNAVAILABLE
        ].includes(error.category);
    }
    // Check if error requires immediate attention
    static isUrgentError(error) {
        return error.severity === ErrorSeverity.CRITICAL ||
            error.category === ErrorCategory.RESOURCE_EXHAUSTION;
    }
}
// Export singleton instance
export const expertErrorHandler = new ExpertErrorHandler();
//# sourceMappingURL=error-handler.js.map
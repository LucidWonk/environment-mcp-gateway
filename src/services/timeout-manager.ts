import winston from 'winston';

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'timeout-manager.log' })
    ]
});

export interface TimeoutConfig {
    semanticAnalysis: number;      // Default: 60 seconds
    domainAnalysis: number;        // Default: 30 seconds
    contextGeneration: number;     // Default: 45 seconds
    fileOperations: number;        // Default: 30 seconds
    fullReindex: number;          // Default: 300 seconds (5 minutes)
    singleFileAnalysis: number;   // Default: 10 seconds
}

export interface OperationMetrics {
    operationName: string;
    startTime: number;
    timeoutMs: number;
    context: Record<string, any>;
    completed: boolean;
    timedOut: boolean;
    error?: Error;
}

export class TimeoutManager {
    private static readonly DEFAULT_CONFIG: TimeoutConfig = {
        semanticAnalysis: 60000,     // 60 seconds
        domainAnalysis: 30000,       // 30 seconds
        contextGeneration: 45000,    // 45 seconds
        fileOperations: 30000,       // 30 seconds
        fullReindex: 300000,         // 5 minutes
        singleFileAnalysis: 10000    // 10 seconds
    };

    private readonly config: TimeoutConfig;
    private readonly activeOperations: Map<string, OperationMetrics> = new Map();

    constructor(config?: Partial<TimeoutConfig>) {
        this.config = { ...TimeoutManager.DEFAULT_CONFIG, ...config };
        logger.info('TimeoutManager initialized', { config: this.config });
    }

    /**
     * Execute operation with intelligent timeout based on context
     */
    async executeWithTimeout<T>(
        operation: Promise<T>,
        operationType: keyof TimeoutConfig,
        context: Record<string, any> = {},
        customTimeout?: number
    ): Promise<T> {
        const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const baseTimeout = customTimeout ?? this.config[operationType];
        
        // Apply dynamic timeout scaling based on context
        const scaledTimeout = this.calculateDynamicTimeout(baseTimeout, operationType, context);
        
        const metrics: OperationMetrics = {
            operationName: operationType,
            startTime: Date.now(),
            timeoutMs: scaledTimeout,
            context,
            completed: false,
            timedOut: false
        };

        this.activeOperations.set(operationId, metrics);

        logger.debug(`Starting operation ${operationType} with timeout ${scaledTimeout}ms`, {
            operationId,
            context,
            baseTimeout,
            scaledTimeout
        });

        return new Promise<T>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout>;
            let operationCompleted = false;

            // Create timeout with progressive warnings
            const createTimeout = () => {
                // Warning at 50% of timeout
                const warningTimer = setTimeout(() => {
                    if (!operationCompleted) {
                        logger.warn(`Operation ${operationType} is taking longer than expected`, {
                            operationId,
                            elapsed: Date.now() - metrics.startTime,
                            timeoutIn: scaledTimeout * 0.5,
                            context
                        });
                    }
                }, scaledTimeout * 0.5);

                // Final timeout
                timer = setTimeout(() => {
                    if (!operationCompleted) {
                        operationCompleted = true;
                        clearTimeout(warningTimer);
                        
                        metrics.timedOut = true;
                        metrics.error = new Error(`Operation ${operationType} timed out after ${scaledTimeout}ms`);
                        
                        logger.error(`⏰ Operation ${operationType} timed out`, {
                            operationId,
                            timeoutMs: scaledTimeout,
                            elapsed: Date.now() - metrics.startTime,
                            context,
                            suggestion: this.getTimeoutSuggestion(operationType, context)
                        });

                        this.activeOperations.delete(operationId);
                        reject(metrics.error);
                    }
                }, scaledTimeout);

                return warningTimer;
            };

            const warningTimer = createTimeout();

            // Execute the operation
            operation
                .then((result) => {
                    if (!operationCompleted) {
                        operationCompleted = true;
                        clearTimeout(timer);
                        clearTimeout(warningTimer);
                        
                        metrics.completed = true;
                        const duration = Date.now() - metrics.startTime;
                        
                        logger.debug(`✅ Operation ${operationType} completed`, {
                            operationId,
                            duration,
                            timeoutMs: scaledTimeout,
                            efficiency: (duration / scaledTimeout * 100).toFixed(1) + '%',
                            context
                        });

                        this.activeOperations.delete(operationId);
                        resolve(result);
                    }
                })
                .catch((error) => {
                    if (!operationCompleted) {
                        operationCompleted = true;
                        clearTimeout(timer);
                        clearTimeout(warningTimer);
                        
                        metrics.error = error;
                        const duration = Date.now() - metrics.startTime;
                        
                        logger.error(`❌ Operation ${operationType} failed`, {
                            operationId,
                            duration,
                            error: error.message,
                            stack: error.stack,
                            context,
                            wasTimeout: false
                        });

                        this.activeOperations.delete(operationId);
                        reject(error);
                    }
                });
        });
    }

    /**
     * Calculate dynamic timeout based on operation context
     */
    private calculateDynamicTimeout(
        baseTimeout: number, 
        operationType: keyof TimeoutConfig, 
        context: Record<string, any>
    ): number {
        let scaleFactor = 1;
        
        // Scale based on file count for analysis operations
        if (['semanticAnalysis', 'domainAnalysis'].includes(operationType)) {
            const fileCount = context.fileCount || context.changedFiles || 1;
            if (fileCount > 10) {
                scaleFactor *= 1 + Math.log10(fileCount / 10);
            }
        }

        // Scale based on domain count for context generation
        if (operationType === 'contextGeneration') {
            const domainCount = context.domainCount || context.affectedDomains || 1;
            if (domainCount > 3) {
                scaleFactor *= 1 + (domainCount - 3) * 0.2;
            }
        }

        // Scale for full reindex based on project size
        if (operationType === 'fullReindex') {
            const totalFiles = context.totalFiles || 100;
            if (totalFiles > 500) {
                scaleFactor *= 1 + Math.log10(totalFiles / 500);
            }
        }

        // Apply maximum scale limit (don't exceed 3x base timeout)
        scaleFactor = Math.min(scaleFactor, 3);
        
        const scaledTimeout = Math.round(baseTimeout * scaleFactor);
        
        if (scaleFactor > 1) {
            logger.debug('Applied timeout scaling', {
                operationType,
                baseTimeout,
                scaleFactor,
                scaledTimeout,
                context
            });
        }

        return scaledTimeout;
    }

    /**
     * Get timeout suggestion for failed operations
     */
    private getTimeoutSuggestion(
        operationType: keyof TimeoutConfig, 
        context: Record<string, any>
    ): string {
        const suggestions: Record<string, string> = {
            semanticAnalysis: 'Consider reducing the number of files analyzed or increasing timeout for large codebases',
            domainAnalysis: 'Domain analysis timeout - may need to optimize domain detection algorithms',
            contextGeneration: 'Context generation taking too long - consider chunked processing or template optimization',
            fileOperations: 'File operations timeout - check disk I/O performance or reduce batch size',
            fullReindex: 'Full reindex timeout - consider processing files in smaller batches',
            singleFileAnalysis: 'Single file analysis should be fast - investigate file size or complexity'
        };

        let suggestion = suggestions[operationType] || 'Consider increasing timeout or optimizing operation';
        
        // Add context-specific suggestions
        if (context.fileCount && context.fileCount > 50) {
            suggestion += '. Large file count detected - consider parallel processing.';
        }
        
        if (context.totalFiles && context.totalFiles > 1000) {
            suggestion += '. Very large project detected - consider incremental processing.';
        }

        return suggestion;
    }

    /**
     * Get metrics for all active operations
     */
    getActiveOperations(): OperationMetrics[] {
        return Array.from(this.activeOperations.values());
    }

    /**
     * Cancel all active operations (emergency stop)
     */
    cancelAllOperations(reason: string = 'Manual cancellation'): number {
        const count = this.activeOperations.size;
        
        for (const [operationId, metrics] of this.activeOperations) {
            logger.warn(`Cancelling active operation: ${metrics.operationName}`, {
                operationId,
                reason,
                elapsed: Date.now() - metrics.startTime
            });
        }

        this.activeOperations.clear();
        
        if (count > 0) {
            logger.info(`Cancelled ${count} active operations`, { reason });
        }

        return count;
    }

    /**
     * Get timeout configuration
     */
    getConfig(): TimeoutConfig {
        return { ...this.config };
    }

    /**
     * Update timeout configuration
     */
    updateConfig(updates: Partial<TimeoutConfig>): void {
        Object.assign(this.config, updates);
        logger.info('Timeout configuration updated', { 
            updates, 
            newConfig: this.config 
        });
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(): Record<string, any> {
        const active = Array.from(this.activeOperations.values());
        
        return {
            activeOperations: active.length,
            longestRunningOperation: active.length > 0 
                ? Math.max(...active.map(op => Date.now() - op.startTime))
                : 0,
            operationsByType: active.reduce((acc, op) => {
                acc[op.operationName] = (acc[op.operationName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            currentConfig: this.config,
            recommendations: this.generatePerformanceRecommendations(active)
        };
    }

    /**
     * Generate performance recommendations based on active operations
     */
    private generatePerformanceRecommendations(active: OperationMetrics[]): string[] {
        const recommendations: string[] = [];
        
        if (active.length > 5) {
            recommendations.push('High number of concurrent operations - consider implementing operation queuing');
        }

        const longRunning = active.filter(op => Date.now() - op.startTime > op.timeoutMs * 0.8);
        if (longRunning.length > 0) {
            recommendations.push(`${longRunning.length} operations are near timeout - consider increasing timeouts or optimizing performance`);
        }

        const semanticOps = active.filter(op => op.operationName === 'semanticAnalysis');
        if (semanticOps.length > 2) {
            recommendations.push('Multiple semantic analysis operations running - consider batching files together');
        }

        return recommendations;
    }
}
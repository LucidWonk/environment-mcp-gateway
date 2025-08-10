export interface TimeoutConfig {
    semanticAnalysis: number;
    domainAnalysis: number;
    contextGeneration: number;
    fileOperations: number;
    fullReindex: number;
    singleFileAnalysis: number;
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
export declare class TimeoutManager {
    private static readonly DEFAULT_CONFIG;
    private readonly config;
    private readonly activeOperations;
    constructor(config?: Partial<TimeoutConfig>);
    /**
     * Execute operation with intelligent timeout based on context
     */
    executeWithTimeout<T>(operation: Promise<T>, operationType: keyof TimeoutConfig, context?: Record<string, any>, customTimeout?: number): Promise<T>;
    /**
     * Calculate dynamic timeout based on operation context
     */
    private calculateDynamicTimeout;
    /**
     * Get timeout suggestion for failed operations
     */
    private getTimeoutSuggestion;
    /**
     * Get metrics for all active operations
     */
    getActiveOperations(): OperationMetrics[];
    /**
     * Cancel all active operations (emergency stop)
     */
    cancelAllOperations(reason?: string): number;
    /**
     * Get timeout configuration
     */
    getConfig(): TimeoutConfig;
    /**
     * Update timeout configuration
     */
    updateConfig(updates: Partial<TimeoutConfig>): void;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): Record<string, any>;
    /**
     * Generate performance recommendations based on active operations
     */
    private generatePerformanceRecommendations;
}
//# sourceMappingURL=timeout-manager.d.ts.map
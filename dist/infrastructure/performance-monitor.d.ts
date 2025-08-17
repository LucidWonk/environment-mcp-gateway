export interface PerformanceMetrics {
    operationName: string;
    duration: number;
    startTime: number;
    endTime: number;
    metadata?: Record<string, any>;
}
export interface PerformanceThresholds {
    coordinationOverhead: number;
    contextTransferTime: number;
    expertSelectionTime: number;
    handoffInitiationTime: number;
}
export declare const DEFAULT_THRESHOLDS: PerformanceThresholds;
export declare class PerformanceMonitor {
    private metrics;
    private activeOperations;
    private thresholds;
    constructor(thresholds?: PerformanceThresholds);
    startTiming(operationId: string, operationName: string, metadata?: Record<string, any>): void;
    endTiming(operationId: string, operationName: string): PerformanceMetrics | null;
    private checkThresholds;
    private getThresholdStatus;
    private getRelevantThreshold;
    getPerformanceReport(): Record<string, any>;
    private analyzeOperationMetrics;
    private calculateCoordinationOverhead;
    getActiveOperationsCount(): number;
    clearMetrics(): void;
    updateThresholds(newThresholds: Partial<PerformanceThresholds>): void;
    getMetricsInTimeRange(operationName: string, startTime: number, endTime: number): PerformanceMetrics[];
    exportMetrics(): Record<string, PerformanceMetrics[]>;
}
export declare function performanceMonitored(operationName: string, monitor: PerformanceMonitor): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const performanceMonitor: PerformanceMonitor;
//# sourceMappingURL=performance-monitor.d.ts.map
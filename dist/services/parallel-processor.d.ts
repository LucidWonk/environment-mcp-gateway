/**
 * Parallel Processing Engine for Context Engineering Enhancement System
 * Implements high-performance concurrent operations for multi-domain processing
 * Part of Step 4.2: Performance Optimization
 */
import { EventEmitter } from 'events';
export interface ProcessingTask<T = any, _R = any> {
    id: string;
    type: string;
    payload: T;
    priority: number;
    timeout?: number;
    retries?: number;
    dependencies?: string[];
}
export interface ProcessingResult<_R = any> {
    taskId: string;
    success: boolean;
    result?: _R;
    error?: string;
    processingTime: number;
    workerId?: number;
}
export interface ProcessorMetrics {
    tasksProcessed: number;
    tasksSucceeded: number;
    tasksFailed: number;
    averageProcessingTime: number;
    currentQueueSize: number;
    activeWorkers: number;
    totalProcessingTime: number;
}
export interface ProcessorConfig {
    maxWorkers: number;
    queueCapacity: number;
    defaultTimeout: number;
    retryAttempts: number;
    enableMetrics: boolean;
    workerScript?: string;
}
/**
 * High-performance parallel processor for Context Engineering operations
 * Features:
 * - Worker thread pool for CPU-intensive tasks
 * - Priority-based task scheduling
 * - Automatic retry with backoff
 * - Dependency-aware processing
 * - Real-time performance monitoring
 * - Memory-efficient batching
 */
export declare class ParallelProcessor extends EventEmitter {
    private workers;
    private taskQueue;
    private activeTasks;
    private taskResults;
    private workerAvailability;
    private metrics;
    private readonly config;
    private isShuttingDown;
    constructor(config?: Partial<ProcessorConfig>);
    /**
     * Submit a task for parallel processing
     */
    submitTask<T, R>(task: ProcessingTask<T, R>): Promise<string>;
    /**
     * Get result of a processed task
     */
    getResult<R>(taskId: string, timeout?: number): Promise<ProcessingResult<R>>;
    /**
     * Process multiple related tasks in batch for improved efficiency
     */
    submitBatch<T, R>(tasks: ProcessingTask<T, R>[]): Promise<Map<string, ProcessingResult<R>>>;
    /**
     * Specialized methods for Context Engineering operations
     */
    /**
     * Process semantic analysis across multiple files in parallel
     */
    processSemanticAnalysisBatch(filePaths: string[]): Promise<Map<string, any>>;
    /**
     * Process cross-domain impact analysis with dependency awareness
     */
    processCrossDomainAnalysis(domainFiles: Map<string, string[]>): Promise<Map<string, any>>;
    /**
     * Process holistic context updates with parallel domain processing
     */
    processHolisticContextUpdate(updateRequest: {
        changedFiles: string[];
        targetDomains: string[];
        updateType: string;
    }): Promise<any>;
    /**
     * Performance monitoring and metrics
     */
    getMetrics(): ProcessorMetrics;
    getDetailedMetrics(): {
        successRate: number;
        queueUtilization: number;
        workerUtilization: number;
        tasksByType: Record<string, number>;
        averageQueueTime: number;
        tasksProcessed: number;
        tasksSucceeded: number;
        tasksFailed: number;
        averageProcessingTime: number;
        currentQueueSize: number;
        activeWorkers: number;
        totalProcessingTime: number;
    };
    /**
     * Worker pool management
     */
    private initializeWorkerPool;
    private createWorker;
    private setupWorkerHandlers;
    private processNextTasks;
    private assignTaskToWorker;
    private handleWorkerMessage;
    private handleTaskCompletion;
    private handleTaskFailure;
    private handleWorkerError;
    private handleTaskTimeout;
    private getTaskDistributionByType;
    private calculateAverageQueueTime;
    /**
     * Cleanup and shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=parallel-processor.d.ts.map
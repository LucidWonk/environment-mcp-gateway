/**
 * Performance Orchestrator for Context Engineering Enhancement System
 * Integrates all performance optimization components for maximum efficiency
 * Part of Step 4.2: Performance Optimization - Main Integration Point
 */
import { EventEmitter } from 'events';
export interface OrchestrationConfig {
    caching: {
        enabled: boolean;
        maxCacheSize: number;
        defaultTtl: number;
    };
    parallelProcessing: {
        enabled: boolean;
        maxWorkers: number;
        queueCapacity: number;
    };
    memoryOptimization: {
        enabled: boolean;
        maxMemoryUsage: number;
        gcThreshold: number;
    };
    performance: {
        enableMetrics: boolean;
        metricsInterval: number;
        alertThresholds: {
            responseTime: number;
            memoryUsage: number;
            queueSize: number;
        };
    };
}
export interface ContextEngineeringRequest {
    id: string;
    type: 'semantic-analysis' | 'cross-domain-analysis' | 'holistic-update' | 'registry-validation';
    payload: any;
    priority: number;
    timeout?: number;
    cacheKey?: string;
    cacheDependencies?: string[];
}
export interface OrchestrationResult<T = any> {
    requestId: string;
    success: boolean;
    result?: T;
    error?: string;
    metrics: {
        totalTime: number;
        cacheHit: boolean;
        parallelTasks: number;
        memoryUsed: number;
        optimizationsApplied: string[];
    };
}
export interface PerformanceMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    caching: {
        hitRate: number;
        totalSize: number;
        evictions: number;
    };
    parallelProcessing: {
        activeWorkers: number;
        queueSize: number;
        tasksProcessed: number;
        averageTaskTime: number;
    };
    memory: {
        currentUsage: number;
        peakUsage: number;
        gcTriggered: number;
        optimizations: number;
    };
    performance: {
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        throughputPerSecond: number;
    };
}
/**
 * Main orchestration system that coordinates all performance optimization components
 * Provides a unified high-performance interface for Context Engineering operations
 */
export declare class PerformanceOrchestrator extends EventEmitter {
    private cache;
    private semanticCache;
    private crossDomainCache;
    private parallelProcessor;
    private memoryOptimizer;
    private responseTimeHistory;
    private requestCounter;
    private successCounter;
    private failureCounter;
    private startTime;
    private readonly config;
    private metricsTimer?;
    constructor(config?: Partial<OrchestrationConfig>);
    /**
     * High-level Context Engineering operations with full optimization
     */
    /**
     * Process semantic analysis with caching and parallel processing
     */
    processSemanticAnalysis(request: {
        filePaths: string[];
        includeBusinessRules?: boolean;
        priority?: number;
        requestId?: string;
    }): Promise<OrchestrationResult>;
    /**
     * Process cross-domain analysis with advanced optimization
     */
    processCrossDomainAnalysis(request: {
        changedFiles: string[];
        targetDomains?: string[];
        includeRiskAnalysis?: boolean;
        requestId?: string;
    }): Promise<OrchestrationResult>;
    /**
     * Process holistic context update with full optimization pipeline
     */
    processHolisticContextUpdate(request: {
        changedFiles: string[];
        gitCommitHash?: string;
        triggerType: string;
        performanceTimeout?: number;
        requestId?: string;
    }): Promise<OrchestrationResult>;
    /**
     * Performance monitoring and metrics
     */
    getPerformanceMetrics(): PerformanceMetrics;
    /**
     * Health check and performance validation
     */
    performHealthCheck(): Promise<{
        healthy: boolean;
        components: Record<string, boolean>;
        metrics: PerformanceMetrics;
        warnings: string[];
    }>;
    /**
     * Private helper methods
     */
    private initializeComponents;
    private startPerformanceMonitoring;
    private checkPerformanceAlerts;
    private getCachedSemanticResults;
    private cacheSemanticResults;
    private processSemanticSequential;
    private consolidateSemanticResults;
    private groupFilesByDomain;
    private processCrossDomainSequential;
    private performCrossDomainCoordination;
    private performRiskAnalysis;
    private inferDomainsFromFiles;
    private optimizeHolisticResults;
    private getApproximateMemoryUsage;
    private recordSuccess;
    private recordFailure;
    private createResult;
    private calculatePercentile;
    private calculateThroughput;
    /**
     * Cleanup and shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=performance-orchestrator.d.ts.map
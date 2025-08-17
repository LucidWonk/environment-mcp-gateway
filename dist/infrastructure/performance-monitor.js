import { createMCPLogger } from '../utils/mcp-logger.js';
import { performance } from 'perf_hooks';
const logger = createMCPLogger('performance-monitor.log');
// Default performance thresholds for VET operations
export const DEFAULT_THRESHOLDS = {
    coordinationOverhead: 5.0, // Target: <5% overhead
    contextTransferTime: 10000, // 10 seconds
    expertSelectionTime: 3000, // 3 seconds
    handoffInitiationTime: 2000 // 2 seconds
};
// Performance monitor class for VET infrastructure
export class PerformanceMonitor {
    metrics = new Map();
    activeOperations = new Map();
    thresholds;
    constructor(thresholds = DEFAULT_THRESHOLDS) {
        this.thresholds = thresholds;
        logger.info('🚀 Performance Monitor initialized', { thresholds });
    }
    // Start timing an operation
    startTiming(operationId, operationName, metadata) {
        const startTime = performance.now();
        this.activeOperations.set(operationId, { startTime, metadata });
        logger.debug('⏱️ Started timing operation', {
            operationId,
            operationName,
            startTime,
            metadata
        });
    }
    // End timing an operation and record metrics
    endTiming(operationId, operationName) {
        const activeOp = this.activeOperations.get(operationId);
        if (!activeOp) {
            logger.warn('⚠️ Attempted to end timing for unknown operation', { operationId, operationName });
            return null;
        }
        const endTime = performance.now();
        const duration = endTime - activeOp.startTime;
        const metric = {
            operationName,
            duration,
            startTime: activeOp.startTime,
            endTime,
            metadata: activeOp.metadata
        };
        // Store metrics
        if (!this.metrics.has(operationName)) {
            this.metrics.set(operationName, []);
        }
        this.metrics.get(operationName).push(metric);
        // Clean up active operation
        this.activeOperations.delete(operationId);
        // Check against thresholds
        this.checkThresholds(metric);
        logger.debug('✅ Completed timing operation', {
            operationId,
            operationName,
            duration: `${duration.toFixed(2)}ms`,
            thresholdCheck: this.getThresholdStatus(metric)
        });
        return metric;
    }
    // Check if metrics meet performance thresholds
    checkThresholds(metric) {
        let thresholdViolation = false;
        const violations = [];
        switch (metric.operationName) {
            case 'context-transfer':
                if (metric.duration > this.thresholds.contextTransferTime) {
                    thresholdViolation = true;
                    violations.push(`Context transfer exceeded ${this.thresholds.contextTransferTime}ms: ${metric.duration.toFixed(2)}ms`);
                }
                break;
            case 'expert-selection':
                if (metric.duration > this.thresholds.expertSelectionTime) {
                    thresholdViolation = true;
                    violations.push(`Expert selection exceeded ${this.thresholds.expertSelectionTime}ms: ${metric.duration.toFixed(2)}ms`);
                }
                break;
            case 'handoff-initiation':
                if (metric.duration > this.thresholds.handoffInitiationTime) {
                    thresholdViolation = true;
                    violations.push(`Handoff initiation exceeded ${this.thresholds.handoffInitiationTime}ms: ${metric.duration.toFixed(2)}ms`);
                }
                break;
        }
        if (thresholdViolation) {
            logger.warn('🔴 Performance threshold violation detected', {
                operationName: metric.operationName,
                duration: metric.duration,
                violations,
                metadata: metric.metadata
            });
        }
    }
    // Get threshold status for a metric
    getThresholdStatus(metric) {
        const relevantThreshold = this.getRelevantThreshold(metric.operationName);
        if (!relevantThreshold)
            return 'no-threshold';
        return metric.duration <= relevantThreshold ? 'within-threshold' : 'exceeded-threshold';
    }
    // Get relevant threshold for operation
    getRelevantThreshold(operationName) {
        switch (operationName) {
            case 'context-transfer': return this.thresholds.contextTransferTime;
            case 'expert-selection': return this.thresholds.expertSelectionTime;
            case 'handoff-initiation': return this.thresholds.handoffInitiationTime;
            default: return null;
        }
    }
    // Get comprehensive performance report
    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            thresholds: this.thresholds,
            operations: {},
            summary: {
                totalOperations: 0,
                averageOverhead: 0,
                thresholdViolations: 0
            }
        };
        let totalOperations = 0;
        let totalThresholdViolations = 0;
        for (const [operationName, metrics] of this.metrics.entries()) {
            const operationReport = this.analyzeOperationMetrics(operationName, metrics);
            report.operations[operationName] = operationReport;
            totalOperations += metrics.length;
            totalThresholdViolations += operationReport.thresholdViolations;
        }
        // Calculate overall coordination overhead
        const coordinationOverhead = this.calculateCoordinationOverhead();
        report.summary = {
            totalOperations,
            averageOverhead: coordinationOverhead,
            thresholdViolations: totalThresholdViolations,
            overheadWithinTarget: coordinationOverhead <= this.thresholds.coordinationOverhead
        };
        logger.info('📊 Performance report generated', {
            totalOperations,
            coordinationOverhead: `${coordinationOverhead.toFixed(2)}%`,
            thresholdViolations: totalThresholdViolations,
            overheadTarget: `<${this.thresholds.coordinationOverhead}%`
        });
        return report;
    }
    // Analyze metrics for a specific operation
    analyzeOperationMetrics(operationName, metrics) {
        if (metrics.length === 0) {
            return {
                count: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                thresholdViolations: 0
            };
        }
        const durations = metrics.map(m => m.duration);
        const relevantThreshold = this.getRelevantThreshold(operationName);
        const thresholdViolations = relevantThreshold
            ? durations.filter(d => d > relevantThreshold).length
            : 0;
        return {
            count: metrics.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            thresholdViolations,
            thresholdViolationRate: metrics.length > 0 ? (thresholdViolations / metrics.length) * 100 : 0
        };
    }
    // Calculate overall coordination overhead percentage
    calculateCoordinationOverhead() {
        // This is a simplified calculation - in a real implementation,
        // this would compare VET-enhanced operations against baseline operations
        const allMetrics = Array.from(this.metrics.values()).flat();
        if (allMetrics.length === 0)
            return 0;
        // Simulate overhead calculation based on operation complexity
        const baselineTime = 100; // Simulated baseline operation time
        const averageVETTime = allMetrics.reduce((sum, m) => sum + m.duration, 0) / allMetrics.length;
        return ((averageVETTime - baselineTime) / baselineTime) * 100;
    }
    // Get active operations count
    getActiveOperationsCount() {
        return this.activeOperations.size;
    }
    // Clear all metrics (useful for testing)
    clearMetrics() {
        this.metrics.clear();
        this.activeOperations.clear();
        logger.info('🧹 Performance metrics cleared');
    }
    // Update performance thresholds
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        logger.info('🎯 Performance thresholds updated', { thresholds: this.thresholds });
    }
    // Get performance statistics for specific time range
    getMetricsInTimeRange(operationName, startTime, endTime) {
        const operationMetrics = this.metrics.get(operationName) || [];
        return operationMetrics.filter(m => m.startTime >= startTime && m.endTime <= endTime);
    }
    // Export metrics for external analysis
    exportMetrics() {
        const exported = {};
        for (const [operationName, metrics] of this.metrics.entries()) {
            exported[operationName] = [...metrics]; // Create copy
        }
        return exported;
    }
}
// Performance decorator for automatic timing
export function performanceMonitored(operationName, monitor) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            monitor.startTiming(operationId, operationName, {
                method: propertyKey,
                argumentCount: args.length
            });
            try {
                const result = await originalMethod.apply(this, args);
                monitor.endTiming(operationId, operationName);
                return result;
            }
            catch (error) {
                monitor.endTiming(operationId, operationName);
                throw error;
            }
        };
        return descriptor;
    };
}
// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
//# sourceMappingURL=performance-monitor.js.map
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { createMCPLogger } from '../utils/mcp-logger.js';
import { performanceMonitor, performanceMonitored } from '../infrastructure/performance-monitor.js';
import { expertCache, ExpertCacheKeys, cached } from '../infrastructure/expert-cache.js';
import { expertConnectionPool } from '../infrastructure/expert-connection-pool.js';
const logger = createMCPLogger('task-tool-vet-integration.log');
// Task Tool VET Integration Service
export class TaskToolVETIntegration {
    async assignExperts(taskId, workflowDescription, expertSelection) {
        logger.info('🎯 Assigning experts with Task Tool VET integration', {
            taskId,
            primaryExpert: expertSelection.primaryExpert,
            secondaryExpertCount: expertSelection.secondaryExperts.length
        });
        // Try to acquire connection from pool for primary expert
        const connection = await expertConnectionPool.acquireConnection(expertSelection.primaryExpert, `task-${taskId}`);
        const sessionId = connection.sessionId;
        const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Determine coordination pattern based on expert configuration
        let coordinationPattern;
        if (expertSelection.secondaryExperts.length === 0) {
            coordinationPattern = 'direct';
        }
        else if (expertSelection.secondaryExperts.length === 1) {
            coordinationPattern = 'primary-secondary';
        }
        else {
            coordinationPattern = 'sequential-handoff';
        }
        // Determine allocation strategy
        const allocationStrategy = expertSelection.confidence >= 0.8 ? 'high-confidence' :
            expertSelection.confidence >= 0.6 ? 'standard' :
                'enhanced-validation';
        const assignment = {
            coordinationPattern,
            taskPersistence: {
                enabled: true,
                sessionId,
                crossSessionAccess: true
            },
            expertAllocation: {
                primaryExpert: expertSelection.primaryExpert,
                secondaryExperts: expertSelection.secondaryExperts,
                allocationStrategy
            },
            trackingMetadata: {
                assignmentId,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        // Cache the assignment for faster retrieval
        const cacheKey = ExpertCacheKeys.expertSelection(workflowDescription, []);
        expertCache.set(cacheKey, assignment, 5 * 60 * 1000); // Cache for 5 minutes
        logger.info('✅ Expert assignment completed', {
            assignmentId,
            coordinationPattern,
            allocationStrategy,
            sessionId,
            connectionId: connection.id
        });
        return assignment;
    }
    async initiateHandoff(request) {
        logger.info('🤝 Initiating Task Tool VET handoff', {
            taskId: request.taskId,
            sourceAgent: request.sourceAgent,
            targetExpert: request.targetExpert,
            urgency: request.urgency
        });
        // Acquire connection for target expert
        const expertConnection = await expertConnectionPool.acquireConnection(request.targetExpert, `handoff-${request.taskId}`);
        const handoffId = `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Store handoff context for cross-session persistence
        const handoffData = {
            handoffId,
            taskId: request.taskId,
            sourceAgent: request.sourceAgent,
            targetExpert: request.targetExpert,
            contextScope: request.contextScope,
            subtaskDescription: request.subtaskDescription,
            urgency: request.urgency,
            initiatedAt: new Date().toISOString(),
            status: 'initiated',
            connectionId: expertConnection.id
        };
        // Cache handoff data for fast retrieval
        const cacheKey = ExpertCacheKeys.contextTransfer(handoffId, request.contextScope);
        expertCache.set(cacheKey, handoffData, 30 * 60 * 1000); // Cache for 30 minutes
        logger.info('🔗 Handoff data stored for persistence', {
            handoffId,
            taskId: request.taskId,
            targetExpert: request.targetExpert,
            contextLength: request.contextPayload.length,
            connectionId: expertConnection.id
        });
        logger.info('✅ Task Tool VET handoff initiated successfully', {
            handoffId,
            taskId: request.taskId
        });
        return handoffId;
    }
    async getHandoffStatus(handoffId) {
        logger.info('📊 Getting handoff status', { handoffId });
        // Mock status for now - would be retrieved from persistent storage
        const status = {
            handoffId,
            status: 'active',
            progress: 'in-progress',
            estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            lastActivity: new Date().toISOString()
        };
        logger.info('✅ Handoff status retrieved', { handoffId, status: status.status });
        return status;
    }
    async completeHandoff(handoffId, results) {
        logger.info('✅ Completing Task Tool VET handoff', { handoffId });
        // In a real implementation, this would update persistent storage
        // and notify relevant systems of completion
        logger.info('🎯 Handoff completed successfully', {
            handoffId,
            hasResults: !!results,
            completedAt: new Date().toISOString()
        });
    }
    // Get comprehensive performance and health metrics
    getPerformanceMetrics() {
        const performanceReport = performanceMonitor.getPerformanceReport();
        const cacheStats = expertCache.getStats();
        const poolStats = expertConnectionPool.getStatistics();
        const poolHealth = expertConnectionPool.getHealthStatus();
        const metrics = {
            timestamp: new Date().toISOString(),
            performance: performanceReport,
            caching: cacheStats,
            connectionPool: {
                statistics: poolStats,
                health: poolHealth
            },
            overallHealth: {
                healthy: poolHealth.healthy && cacheStats.hitRate > 60,
                issues: [],
                recommendations: []
            }
        };
        // Add health checks and recommendations
        if (performanceReport.summary.coordinationOverhead > 8) {
            metrics.overallHealth.healthy = false;
            metrics.overallHealth.issues.push('Coordination overhead exceeds 8%');
            metrics.overallHealth.recommendations.push('Consider increasing cache TTL or connection pool size');
        }
        if (cacheStats.hitRate < 60) {
            metrics.overallHealth.issues.push('Cache hit rate below 60%');
            metrics.overallHealth.recommendations.push('Review caching strategy and TTL settings');
        }
        if (poolStats.poolUtilization > 85) {
            metrics.overallHealth.issues.push('Connection pool utilization above 85%');
            metrics.overallHealth.recommendations.push('Consider increasing pool size');
        }
        logger.info('📊 Performance metrics compiled', {
            coordinationOverhead: `${performanceReport.summary.averageOverhead}%`,
            cacheHitRate: `${cacheStats.hitRate.toFixed(1)}%`,
            poolUtilization: `${poolStats.poolUtilization.toFixed(1)}%`,
            healthy: metrics.overallHealth.healthy
        });
        return metrics;
    }
    // Release resources and cleanup
    async cleanup() {
        logger.info('🧹 Starting VET integration cleanup');
        expertCache.clear();
        performanceMonitor.clearMetrics();
        // Note: Connection pool cleanup would be handled by the pool itself
        logger.info('✅ VET integration cleanup completed');
    }
}
__decorate([
    performanceMonitored('expert-assignment', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TaskToolVETIntegration.prototype, "assignExperts", null);
__decorate([
    performanceMonitored('handoff-initiation', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaskToolVETIntegration.prototype, "initiateHandoff", null);
__decorate([
    cached(expertCache, (handoffId) => `handoff-status:${handoffId}`, 2 * 60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaskToolVETIntegration.prototype, "getHandoffStatus", null);
// Export singleton instance
export const taskToolVETIntegration = new TaskToolVETIntegration();
//# sourceMappingURL=task-tool-vet-integration.js.map
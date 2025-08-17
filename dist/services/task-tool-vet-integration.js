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
import { expertErrorHandler, ExpertErrorUtils } from '../infrastructure/error-handler.js';
import { circuitBreakerManager } from '../infrastructure/circuit-breaker.js';
const logger = createMCPLogger('task-tool-vet-integration.log');
// Task Tool VET Integration Service
export class TaskToolVETIntegration {
    async assignExperts(taskId, workflowDescription, expertSelection) {
        return await expertErrorHandler.executeWithErrorHandling('assignExperts', expertSelection.primaryExpert, async () => {
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
        }, 
        // Fallback function for expert assignment
        async () => {
            logger.warn('🔄 Using fallback for expert assignment', { taskId, expertType: expertSelection.primaryExpert });
            // Fallback: use basic assignment without connection pooling
            const fallbackSessionId = `fallback-session-${Date.now()}`;
            const fallbackAssignmentId = `fallback-assignment-${Date.now()}`;
            return {
                coordinationPattern: 'direct',
                taskPersistence: {
                    enabled: true,
                    sessionId: fallbackSessionId,
                    crossSessionAccess: true
                },
                expertAllocation: {
                    primaryExpert: expertSelection.primaryExpert,
                    secondaryExperts: expertSelection.secondaryExperts || [],
                    allocationStrategy: 'fallback'
                },
                trackingMetadata: {
                    assignmentId: fallbackAssignmentId,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0-fallback'
                }
            };
        });
    }
    async initiateHandoff(request) {
        return await expertErrorHandler.executeWithErrorHandling('initiateHandoff', request.targetExpert, async () => {
            logger.info('🤝 Initiating Task Tool VET handoff', {
                taskId: request.taskId,
                sourceAgent: request.sourceAgent,
                targetExpert: request.targetExpert,
                urgency: request.urgency
            });
            // Validate request parameters
            if (!request.taskId || !request.targetExpert) {
                throw ExpertErrorUtils.createValidationError(request.targetExpert || 'unknown', 'initiateHandoff', 'Missing required parameters: taskId or targetExpert');
            }
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
        }, 
        // Fallback function for handoff initiation
        async () => {
            logger.warn('🔄 Using fallback for handoff initiation', {
                taskId: request.taskId,
                targetExpert: request.targetExpert
            });
            // Fallback: create basic handoff without connection pooling
            const fallbackHandoffId = `fallback-handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Still cache the fallback handoff for consistency
            const fallbackHandoffData = {
                handoffId: fallbackHandoffId,
                taskId: request.taskId,
                sourceAgent: request.sourceAgent,
                targetExpert: request.targetExpert,
                contextScope: request.contextScope,
                subtaskDescription: request.subtaskDescription,
                urgency: request.urgency,
                initiatedAt: new Date().toISOString(),
                status: 'initiated-fallback',
                connectionId: 'fallback-connection'
            };
            const fallbackCacheKey = ExpertCacheKeys.contextTransfer(fallbackHandoffId, request.contextScope);
            expertCache.set(fallbackCacheKey, fallbackHandoffData, 30 * 60 * 1000);
            return fallbackHandoffId;
        });
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
        const errorStats = expertErrorHandler.getErrorStats();
        const errorHealth = expertErrorHandler.getHealthStatus();
        const circuitBreakerHealth = circuitBreakerManager.getSystemHealth();
        const metrics = {
            timestamp: new Date().toISOString(),
            performance: performanceReport,
            caching: cacheStats,
            connectionPool: {
                statistics: poolStats,
                health: poolHealth
            },
            errorHandling: {
                statistics: errorStats,
                health: errorHealth
            },
            circuitBreakers: circuitBreakerHealth,
            overallHealth: {
                healthy: poolHealth.healthy &&
                    cacheStats.hitRate > 60 &&
                    errorHealth.healthy &&
                    circuitBreakerHealth.systemHealthy,
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
        // Add error handling health checks
        if (!errorHealth.healthy) {
            metrics.overallHealth.issues.push('Error handling system showing degraded performance');
            metrics.overallHealth.recommendations.push(...errorHealth.recommendations);
        }
        if (errorStats.errorRate > 0.1) {
            metrics.overallHealth.issues.push(`High error rate detected: ${errorStats.errorRate.toFixed(3)} errors/second`);
            metrics.overallHealth.recommendations.push('Review expert configurations and network connectivity');
        }
        // Add circuit breaker health checks
        if (!circuitBreakerHealth.systemHealthy) {
            metrics.overallHealth.issues.push(`${circuitBreakerHealth.faultedExperts} expert(s) have circuit breakers open`);
            metrics.overallHealth.recommendations.push('Investigate and resolve expert service issues');
        }
        if (circuitBreakerHealth.overallSuccessRate < 90) {
            metrics.overallHealth.issues.push(`Low overall success rate: ${circuitBreakerHealth.overallSuccessRate.toFixed(1)}%`);
            metrics.overallHealth.recommendations.push('Review expert service reliability and network conditions');
        }
        logger.info('📊 Performance metrics compiled', {
            coordinationOverhead: `${performanceReport.summary.averageOverhead}%`,
            cacheHitRate: `${cacheStats.hitRate.toFixed(1)}%`,
            poolUtilization: `${poolStats.poolUtilization.toFixed(1)}%`,
            errorRate: `${errorStats.errorRate.toFixed(3)}/sec`,
            circuitBreakerHealth: circuitBreakerHealth.systemHealthy,
            healthy: metrics.overallHealth.healthy
        });
        return metrics;
    }
    // Release resources and cleanup
    async cleanup() {
        logger.info('🧹 Starting VET integration cleanup');
        expertCache.clear();
        performanceMonitor.clearMetrics();
        expertErrorHandler.clearHistory();
        circuitBreakerManager.resetAll();
        // Note: Connection pool cleanup would be handled by the pool itself
        logger.info('✅ VET integration cleanup completed');
    }
    // Get detailed error and circuit breaker status
    getErrorAndCircuitStatus() {
        const errorStats = expertErrorHandler.getErrorStats();
        const errorHealth = expertErrorHandler.getHealthStatus();
        const circuitBreakerHealth = circuitBreakerManager.getSystemHealth();
        return {
            timestamp: new Date().toISOString(),
            errorHandling: {
                totalErrors: errorStats.totalErrors,
                errorRate: errorStats.errorRate,
                errorsByCategory: errorStats.errorsByCategory,
                errorsBySeverity: errorStats.errorsBySeverity,
                errorsByExpert: errorStats.errorsByExpert,
                recentErrorCount: errorStats.recentErrors.length,
                meanTimeBetweenFailures: errorStats.mtbf,
                healthy: errorHealth.healthy,
                recommendations: errorHealth.recommendations
            },
            circuitBreakers: {
                totalExperts: circuitBreakerHealth.totalExperts,
                healthyExperts: circuitBreakerHealth.healthyExperts,
                faultedExperts: circuitBreakerHealth.faultedExperts,
                overallSuccessRate: circuitBreakerHealth.overallSuccessRate,
                systemHealthy: circuitBreakerHealth.systemHealthy,
                expertDetails: circuitBreakerHealth.expertStats
            },
            summary: {
                overallHealthy: errorHealth.healthy && circuitBreakerHealth.systemHealthy,
                criticalIssues: errorHealth.criticalErrors + circuitBreakerHealth.faultedExperts,
                recommendedActions: [
                    ...errorHealth.recommendations,
                    ...(circuitBreakerHealth.faultedExperts > 0 ? ['Investigate faulted expert services'] : [])
                ]
            }
        };
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
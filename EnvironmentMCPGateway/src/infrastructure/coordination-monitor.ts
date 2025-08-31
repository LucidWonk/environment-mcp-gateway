import { createMCPLogger } from '../utils/mcp-logger.js';
import { performanceMonitor, performanceMonitored } from './performance-monitor.js';
import { expertCache, ExpertCacheKeys, cached } from './expert-cache.js';
import { expertErrorHandler } from './error-handler.js';
import { EventEmitter } from 'events';

const logger = createMCPLogger('coordination-monitor.log');

// Real-time Monitoring Types
export interface CoordinationMetrics {
    coordinationId: string;
    coordinationType: 'workflow' | 'conversation' | 'context-sync' | 'conflict-resolution';
    startTime: string;
    endTime?: string;
    duration?: number;
    status: 'active' | 'completed' | 'failed' | 'paused' | 'cancelled';
    participantCount: number;
    stepCount?: number;
    completedSteps?: number;
    errorCount: number;
    throughput: number; // operations per second
    latency: number; // average response time in ms
    resourceUtilization: {
        cpu: number;
        memory: number;
        network: number;
    };
    qualityMetrics: {
        successRate: number;
        consensusRate?: number;
        conflictResolutionRate?: number;
        dataConsistencyScore?: number;
    };
}

export interface SystemMetrics {
    timestamp: string;
    activeCoordinations: number;
    totalCoordinations: number;
    averageLatency: number;
    systemThroughput: number;
    errorRate: number;
    resourceUtilization: {
        cpu: number;
        memory: number;
        network: number;
        storage: number;
    };
    capacityMetrics: {
        maxConcurrentCoordinations: number;
        currentUtilization: number;
        scalingRecommendation: 'scale-up' | 'scale-down' | 'maintain';
    };
}

export interface AlertConfiguration {
    alertId: string;
    metricType: 'latency' | 'error-rate' | 'throughput' | 'resource-utilization' | 'success-rate';
    threshold: number;
    comparison: 'greater-than' | 'less-than' | 'equals';
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
    cooldownPeriod: number; // seconds
    notificationChannels: string[];
}

export interface AlertEvent {
    alertId: string;
    triggeredAt: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    metricType: string;
    currentValue: number;
    threshold: number;
    coordinationId?: string;
    message: string;
    acknowledged: boolean;
    resolvedAt?: string;
}

export interface PerformanceTrend {
    metricName: string;
    timeRange: string;
    dataPoints: Array<{
        timestamp: string;
        value: number;
    }>;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    trendStrength: number; // 0-1
    prediction?: {
        nextHour: number;
        nextDay: number;
        confidence: number;
    };
}

export interface CoordinationHealthReport {
    coordinationId: string;
    overallHealth: number; // 0-100
    healthFactors: {
        performance: number;
        reliability: number;
        efficiency: number;
        quality: number;
    };
    issues: Array<{
        type: 'performance' | 'reliability' | 'efficiency' | 'quality';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        recommendation: string;
    }>;
    recommendations: string[];
}

export interface MonitoringDashboard {
    dashboardId: string;
    name: string;
    description: string;
    widgets: Array<{
        widgetId: string;
        type: 'metric-chart' | 'alert-panel' | 'health-status' | 'trend-analysis';
        title: string;
        configuration: Record<string, any>;
        position: { x: number; y: number; width: number; height: number };
    }>;
    refreshInterval: number; // seconds
    autoRefresh: boolean;
}

// Real-time Coordination Monitor Service
export class CoordinationMonitor extends EventEmitter {
    private activeCoordinations: Map<string, CoordinationMetrics> = new Map();
    private historicalMetrics: Map<string, CoordinationMetrics[]> = new Map();
    private systemMetricsHistory: SystemMetrics[] = [];
    private alertConfigurations: Map<string, AlertConfiguration> = new Map();
    private activeAlerts: Map<string, AlertEvent> = new Map();
    private performanceTrends: Map<string, PerformanceTrend> = new Map();
    private dashboards: Map<string, MonitoringDashboard> = new Map();
    private monitoringInterval: any = null;
    private metricsCollectionInterval: any = null;

    constructor() {
        super();
        this.initializeDefaultAlerts();
        this.startRealTimeMonitoring();
        this.startMetricsCollection();
        
        logger.info('📊 Coordination Monitor initialized', {
            realTimeMonitoringEnabled: true,
            metricsCollectionActive: true,
            alertingEnabled: true
        });
    }

    @performanceMonitored('coordination-monitoring-start', performanceMonitor)
    public async startCoordinationMonitoring(
        coordinationId: string,
        coordinationType: 'workflow' | 'conversation' | 'context-sync' | 'conflict-resolution',
        participantCount: number,
        metadata?: Record<string, any>
    ): Promise<void> {
        return await expertErrorHandler.executeWithErrorHandling(
            'startCoordinationMonitoring',
            'CoordinationMonitor',
            async () => {
                logger.info('🎯 Starting coordination monitoring', {
                    coordinationId,
                    coordinationType,
                    participantCount
                });

                const metrics: CoordinationMetrics = {
                    coordinationId,
                    coordinationType,
                    startTime: new Date().toISOString(),
                    status: 'active',
                    participantCount,
                    stepCount: metadata?.stepCount || 0,
                    completedSteps: 0,
                    errorCount: 0,
                    throughput: 0,
                    latency: 0,
                    resourceUtilization: {
                        cpu: 0,
                        memory: 0,
                        network: 0
                    },
                    qualityMetrics: {
                        successRate: 0,
                        consensusRate: coordinationType === 'conflict-resolution' ? 0 : undefined,
                        conflictResolutionRate: coordinationType === 'conflict-resolution' ? 0 : undefined,
                        dataConsistencyScore: coordinationType === 'context-sync' ? 100 : undefined
                    }
                };

                this.activeCoordinations.set(coordinationId, metrics);

                // Cache coordination metrics for quick access
                const cacheKey = ExpertCacheKeys.contextTransfer(coordinationId, 'coordination-metrics');
                expertCache.set(cacheKey, metrics, 60 * 60 * 1000); // Cache for 1 hour

                // Emit monitoring started event
                this.emit('coordinationMonitoringStarted', {
                    coordinationId,
                    coordinationType,
                    participantCount,
                    startTime: metrics.startTime
                });

                logger.info('✅ Coordination monitoring started', {
                    coordinationId,
                    coordinationType,
                    activeCoordinations: this.activeCoordinations.size
                });
            }
        );
    }

    @performanceMonitored('coordination-metrics-update', performanceMonitor)
    public async updateCoordinationMetrics(
        coordinationId: string,
        updates: Partial<CoordinationMetrics>
    ): Promise<void> {
        const metrics = this.activeCoordinations.get(coordinationId);
        if (!metrics) {
            logger.warn('⚠️ Attempted to update metrics for unknown coordination', { coordinationId });
            return;
        }

        // Update metrics
        Object.assign(metrics, updates);

        // Calculate derived metrics
        if (metrics.startTime && !metrics.endTime && metrics.status === 'active') {
            metrics.duration = Date.now() - new Date(metrics.startTime).getTime();
        }

        // Update quality metrics
        if (metrics.stepCount && metrics.completedSteps) {
            metrics.qualityMetrics.successRate = (metrics.completedSteps / metrics.stepCount) * 100;
        }

        // Update cache
        const cacheKey = ExpertCacheKeys.contextTransfer(coordinationId, 'coordination-metrics');
        expertCache.set(cacheKey, metrics, 60 * 60 * 1000);

        // Check for alerts
        await this.checkAlerts(coordinationId, metrics);

        // Emit metrics updated event
        this.emit('coordinationMetricsUpdated', {
            coordinationId,
            metrics: { ...metrics },
            timestamp: new Date().toISOString()
        });

        logger.debug('📈 Coordination metrics updated', {
            coordinationId,
            status: metrics.status,
            completedSteps: metrics.completedSteps,
            errorCount: metrics.errorCount
        });
    }

    @performanceMonitored('coordination-monitoring-stop', performanceMonitor)
    public async stopCoordinationMonitoring(
        coordinationId: string,
        finalStatus: 'completed' | 'failed' | 'cancelled'
    ): Promise<void> {
        const metrics = this.activeCoordinations.get(coordinationId);
        if (!metrics) {
            logger.warn('⚠️ Attempted to stop monitoring for unknown coordination', { coordinationId });
            return;
        }

        // Finalize metrics
        metrics.status = finalStatus;
        metrics.endTime = new Date().toISOString();
        metrics.duration = Date.now() - new Date(metrics.startTime).getTime();

        // Calculate final quality metrics
        if (metrics.stepCount && metrics.completedSteps) {
            metrics.qualityMetrics.successRate = (metrics.completedSteps / metrics.stepCount) * 100;
        }

        // Move to historical metrics
        const history = this.historicalMetrics.get(coordinationId) || [];
        history.push({ ...metrics });
        this.historicalMetrics.set(coordinationId, history);

        // Remove from active monitoring
        this.activeCoordinations.delete(coordinationId);

        // Generate health report
        const healthReport = await this.generateHealthReport(coordinationId, metrics);

        // Emit monitoring stopped event
        this.emit('coordinationMonitoringStopped', {
            coordinationId,
            finalStatus,
            duration: metrics.duration,
            healthReport
        });

        logger.info('🏁 Coordination monitoring stopped', {
            coordinationId,
            finalStatus,
            duration: metrics.duration,
            successRate: metrics.qualityMetrics.successRate
        });
    }

    @cached(expertCache, (_timeRange?: string) => `system-metrics:${_timeRange || 'current'}`, 30 * 1000)
    public async getSystemMetrics(_timeRange?: string): Promise<SystemMetrics> {
        logger.info('📊 Getting system metrics', { timeRange: _timeRange });

        const now = new Date();
        const activeCoordinations = this.activeCoordinations.size;
        const totalCoordinations = Array.from(this.historicalMetrics.values())
            .reduce((sum, history) => sum + history.length, 0) + activeCoordinations;

        // Calculate average latency from active coordinations
        const activeMetrics = Array.from(this.activeCoordinations.values());
        const averageLatency = activeMetrics.length > 0
            ? activeMetrics.reduce((sum, m) => sum + m.latency, 0) / activeMetrics.length
            : 0;

        // Calculate system throughput (operations per second)
        const systemThroughput = activeMetrics.reduce((sum, m) => sum + m.throughput, 0);

        // Calculate error rate
        const totalErrors = activeMetrics.reduce((sum, m) => sum + m.errorCount, 0);
        const errorRate = totalCoordinations > 0 ? (totalErrors / totalCoordinations) * 100 : 0;

        // Simulate resource utilization (in production, these would be real system metrics)
        const resourceUtilization = await this.collectResourceMetrics();

        // Calculate capacity metrics
        const maxConcurrentCoordinations = 100; // Configurable limit
        const currentUtilization = (activeCoordinations / maxConcurrentCoordinations) * 100;
        const scalingRecommendation = this.determineScalingRecommendation(currentUtilization);

        const systemMetrics: SystemMetrics = {
            timestamp: now.toISOString(),
            activeCoordinations,
            totalCoordinations,
            averageLatency,
            systemThroughput,
            errorRate,
            resourceUtilization,
            capacityMetrics: {
                maxConcurrentCoordinations,
                currentUtilization,
                scalingRecommendation
            }
        };

        // Store in history
        this.systemMetricsHistory.push(systemMetrics);
        
        // Keep only last 1000 entries
        if (this.systemMetricsHistory.length > 1000) {
            this.systemMetricsHistory = this.systemMetricsHistory.slice(-1000);
        }

        logger.info('✅ System metrics collected', {
            activeCoordinations,
            averageLatency,
            errorRate: errorRate.toFixed(2) + '%'
        });

        return systemMetrics;
    }

    public async createAlert(alertConfig: AlertConfiguration): Promise<string> {
        this.alertConfigurations.set(alertConfig.alertId, alertConfig);
        
        logger.info('🚨 Alert configuration created', {
            alertId: alertConfig.alertId,
            metricType: alertConfig.metricType,
            threshold: alertConfig.threshold,
            severity: alertConfig.severity
        });

        return alertConfig.alertId;
    }

    public async getActiveAlerts(): Promise<AlertEvent[]> {
        return Array.from(this.activeAlerts.values())
            .filter(alert => !alert.acknowledged);
    }

    public async acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<void> {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            
            this.emit('alertAcknowledged', {
                alertId,
                acknowledgedBy,
                acknowledgedAt: new Date().toISOString()
            });

            logger.info('✅ Alert acknowledged', { alertId, acknowledgedBy });
        }
    }

    public async createDashboard(dashboard: MonitoringDashboard): Promise<string> {
        this.dashboards.set(dashboard.dashboardId, dashboard);
        
        logger.info('📊 Monitoring dashboard created', {
            dashboardId: dashboard.dashboardId,
            name: dashboard.name,
            widgetCount: dashboard.widgets.length
        });

        return dashboard.dashboardId;
    }

    public async getDashboard(dashboardId: string): Promise<MonitoringDashboard | null> {
        return this.dashboards.get(dashboardId) || null;
    }

    public async getPerformanceTrends(metricName?: string, _timeRange?: string): Promise<PerformanceTrend[]> {
        // Update trends first to ensure latest data
        await this.updatePerformanceTrends();
        
        const trends = Array.from(this.performanceTrends.values());
        return metricName ? trends.filter(t => t.metricName === metricName) : trends;
    }

    // Public method to manually trigger performance trends update
    public async updatePerformanceTrendsManually(): Promise<void> {
        await this.updatePerformanceTrends();
    }

    // Private helper methods
    private initializeDefaultAlerts(): void {
        const defaultAlerts: AlertConfiguration[] = [
            {
                alertId: 'high-latency',
                metricType: 'latency',
                threshold: 5000, // 5 seconds
                comparison: 'greater-than',
                severity: 'warning',
                enabled: true,
                cooldownPeriod: 300, // 5 minutes
                notificationChannels: ['log', 'event']
            },
            {
                alertId: 'high-error-rate',
                metricType: 'error-rate',
                threshold: 10, // 10%
                comparison: 'greater-than',
                severity: 'error',
                enabled: true,
                cooldownPeriod: 180, // 3 minutes
                notificationChannels: ['log', 'event']
            },
            {
                alertId: 'low-success-rate',
                metricType: 'success-rate',
                threshold: 80, // 80%
                comparison: 'less-than',
                severity: 'warning',
                enabled: true,
                cooldownPeriod: 600, // 10 minutes
                notificationChannels: ['log', 'event']
            }
        ];

        defaultAlerts.forEach(alert => {
            this.alertConfigurations.set(alert.alertId, alert);
        });

        logger.info('🚨 Default alerts initialized', { 
            alertCount: defaultAlerts.length 
        });
    }

    private startRealTimeMonitoring(): void {
        this.monitoringInterval = setInterval(async () => {
            await this.performRealTimeChecks();
        }, 5000); // Check every 5 seconds

        logger.info('🔄 Real-time monitoring started');
    }

    private startMetricsCollection(): void {
        this.metricsCollectionInterval = setInterval(async () => {
            await this.collectSystemMetrics();
            await this.updatePerformanceTrends();
        }, 30000); // Collect every 30 seconds

        logger.info('📈 Metrics collection started');
    }

    private async performRealTimeChecks(): Promise<void> {
        // Update resource utilization for active coordinations
        for (const [_coordinationId, metrics] of this.activeCoordinations) {
            const resourceMetrics = await this.collectResourceMetrics();
            metrics.resourceUtilization = resourceMetrics;
            
            // Update latency based on recent performance
            // Note: In production, this would use actual performance monitoring data
            if (metrics.latency === 0) {
                metrics.latency = Math.random() * 1000 + 500; // Simulate latency
            }
        }

        // Check for alerts
        for (const [coordinationId, metrics] of this.activeCoordinations) {
            await this.checkAlerts(coordinationId, metrics);
        }
    }

    private async collectSystemMetrics(): Promise<void> {
        try {
            await this.getSystemMetrics();
        } catch (error) {
            logger.error('❌ Failed to collect system metrics', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    private async updatePerformanceTrends(): Promise<void> {
        const now = new Date().toISOString();
        
        // Update latency trend
        const averageLatency = Array.from(this.activeCoordinations.values())
            .reduce((sum, m, _, arr) => sum + m.latency / arr.length, 0);
        
        await this.updateTrend('average-latency', now, averageLatency);

        // Update throughput trend
        const systemThroughput = Array.from(this.activeCoordinations.values())
            .reduce((sum, m) => sum + m.throughput, 0);
        
        await this.updateTrend('system-throughput', now, systemThroughput);

        // Update active coordinations trend
        await this.updateTrend('active-coordinations', now, this.activeCoordinations.size);
    }

    private async updateTrend(metricName: string, timestamp: string, value: number): Promise<void> {
        let trend = this.performanceTrends.get(metricName);
        
        if (!trend) {
            trend = {
                metricName,
                timeRange: '24h',
                dataPoints: [],
                trend: 'stable',
                trendStrength: 0
            };
            this.performanceTrends.set(metricName, trend);
        }

        // Add data point
        trend.dataPoints.push({ timestamp, value });

        // Keep only last 24 hours of data (assuming 30-second intervals)
        const maxDataPoints = 2880; // 24 * 60 * 2
        if (trend.dataPoints.length > maxDataPoints) {
            trend.dataPoints = trend.dataPoints.slice(-maxDataPoints);
        }

        // Calculate trend direction and strength
        if (trend.dataPoints.length >= 10) {
            const recent = trend.dataPoints.slice(-10);
            const older = trend.dataPoints.slice(-20, -10);
            
            if (older.length >= 10) {
                const recentAvg = recent.reduce((sum, dp) => sum + dp.value, 0) / recent.length;
                const olderAvg = older.reduce((sum, dp) => sum + dp.value, 0) / older.length;
                
                const change = (recentAvg - olderAvg) / olderAvg;
                
                if (Math.abs(change) < 0.05) {
                    trend.trend = 'stable';
                    trend.trendStrength = 0;
                } else if (change > 0.05) {
                    trend.trend = 'increasing';
                    trend.trendStrength = Math.min(Math.abs(change), 1);
                } else {
                    trend.trend = 'decreasing';
                    trend.trendStrength = Math.min(Math.abs(change), 1);
                }
            }
        }
    }

    private async checkAlerts(coordinationId: string, metrics: CoordinationMetrics): Promise<void> {
        for (const [alertId, config] of this.alertConfigurations) {
            if (!config.enabled) continue;

            let metricValue: number | undefined;
            
            switch (config.metricType) {
            case 'latency':
                metricValue = metrics.latency;
                break;
            case 'error-rate':
                metricValue = metrics.stepCount ? (metrics.errorCount / metrics.stepCount) * 100 : 0;
                break;
            case 'success-rate':
                metricValue = metrics.qualityMetrics.successRate;
                break;
            case 'throughput':
                metricValue = metrics.throughput;
                break;
            case 'resource-utilization':
                metricValue = Math.max(
                    metrics.resourceUtilization.cpu,
                    metrics.resourceUtilization.memory,
                    metrics.resourceUtilization.network
                );
                break;
            }

            if (metricValue !== undefined && this.shouldTriggerAlert(config, metricValue)) {
                await this.triggerAlert(alertId, config, metricValue, coordinationId);
            }
        }
    }

    private shouldTriggerAlert(config: AlertConfiguration, value: number): boolean {
        switch (config.comparison) {
        case 'greater-than':
            return value > config.threshold;
        case 'less-than':
            return value < config.threshold;
        case 'equals':
            return Math.abs(value - config.threshold) < 0.01;
        default:
            return false;
        }
    }

    private async triggerAlert(
        alertId: string, 
        config: AlertConfiguration, 
        currentValue: number, 
        coordinationId?: string
    ): Promise<void> {
        // Check cooldown period
        const existingAlert = this.activeAlerts.get(alertId);
        if (existingAlert && !existingAlert.acknowledged) {
            const timeSinceTriggered = Date.now() - new Date(existingAlert.triggeredAt).getTime();
            if (timeSinceTriggered < config.cooldownPeriod * 1000) {
                return; // Still in cooldown period
            }
        }

        const alert: AlertEvent = {
            alertId,
            triggeredAt: new Date().toISOString(),
            severity: config.severity,
            metricType: config.metricType,
            currentValue,
            threshold: config.threshold,
            coordinationId,
            message: `${config.metricType} ${config.comparison} ${config.threshold} (current: ${currentValue})`,
            acknowledged: false
        };

        this.activeAlerts.set(alertId, alert);

        // Emit alert event
        this.emit('alertTriggered', alert);

        logger.warn('🚨 Alert triggered', {
            alertId,
            severity: config.severity,
            metricType: config.metricType,
            currentValue,
            threshold: config.threshold,
            coordinationId
        });
    }

    private async collectResourceMetrics(): Promise<{ cpu: number; memory: number; network: number; storage: number }> {
        // In production, these would be real system metrics
        // For now, simulate realistic values
        return {
            cpu: Math.random() * 50 + 20, // 20-70%
            memory: Math.random() * 40 + 30, // 30-70%
            network: Math.random() * 30 + 10, // 10-40%
            storage: Math.random() * 60 + 20 // 20-80%
        };
    }

    private determineScalingRecommendation(utilization: number): 'scale-up' | 'scale-down' | 'maintain' {
        if (utilization > 80) {
            return 'scale-up';
        } else if (utilization < 30) {
            return 'scale-down';
        } else {
            return 'maintain';
        }
    }

    private async generateHealthReport(coordinationId: string, metrics: CoordinationMetrics): Promise<CoordinationHealthReport> {
        const issues: CoordinationHealthReport['issues'] = [];
        const recommendations: string[] = [];

        // Performance assessment
        const performance = this.assessPerformance(metrics);
        if (performance < 70) {
            issues.push({
                type: 'performance',
                severity: performance < 50 ? 'high' : 'medium',
                description: `High latency detected (${metrics.latency}ms average)`,
                recommendation: 'Consider optimizing workflow steps or increasing resources'
            });
            recommendations.push('Optimize coordination workflow for better performance');
        }

        // Reliability assessment
        const reliability = this.assessReliability(metrics);
        if (reliability < 80) {
            issues.push({
                type: 'reliability',
                severity: reliability < 60 ? 'high' : 'medium',
                description: `High error rate detected (${metrics.errorCount} errors)`,
                recommendation: 'Review error handling and add more resilience mechanisms'
            });
            recommendations.push('Improve error handling and recovery mechanisms');
        }

        // Efficiency assessment
        const efficiency = this.assessEfficiency(metrics);
        if (efficiency < 75) {
            issues.push({
                type: 'efficiency',
                severity: 'medium',
                description: 'Low resource utilization efficiency',
                recommendation: 'Optimize resource allocation and coordination patterns'
            });
            recommendations.push('Review resource allocation strategy');
        }

        // Quality assessment
        const quality = metrics.qualityMetrics.successRate;
        if (quality < 90) {
            issues.push({
                type: 'quality',
                severity: quality < 70 ? 'high' : 'medium',
                description: `Low success rate (${quality}%)`,
                recommendation: 'Review coordination logic and participant readiness'
            });
            recommendations.push('Improve coordination success rate');
        }

        const overallHealth = (performance + reliability + efficiency + quality) / 4;

        return {
            coordinationId,
            overallHealth,
            healthFactors: {
                performance,
                reliability,
                efficiency,
                quality
            },
            issues,
            recommendations
        };
    }

    private assessPerformance(metrics: CoordinationMetrics): number {
        // Score based on latency (lower is better)
        if (metrics.latency < 1000) return 100;
        if (metrics.latency < 3000) return 80;
        if (metrics.latency < 5000) return 60;
        if (metrics.latency < 10000) return 40;
        return 20;
    }

    private assessReliability(metrics: CoordinationMetrics): number {
        // Score based on error rate (lower is better)
        if (!metrics.stepCount) return 100;
        const errorRate = (metrics.errorCount / metrics.stepCount) * 100;
        if (errorRate === 0) return 100;
        if (errorRate < 5) return 90;
        if (errorRate < 10) return 70;
        if (errorRate < 20) return 50;
        return 30;
    }

    private assessEfficiency(metrics: CoordinationMetrics): number {
        // Score based on resource utilization balance
        const avgUtilization = (
            metrics.resourceUtilization.cpu +
            metrics.resourceUtilization.memory +
            metrics.resourceUtilization.network
        ) / 3;
        
        // Optimal range is 40-80%
        if (avgUtilization >= 40 && avgUtilization <= 80) return 100;
        if (avgUtilization >= 30 && avgUtilization <= 90) return 80;
        if (avgUtilization >= 20 && avgUtilization <= 95) return 60;
        return 40;
    }

    // Public utility methods
    public getActiveCoordinations(): string[] {
        return Array.from(this.activeCoordinations.keys());
    }

    public async getCoordinationMetrics(coordinationId: string): Promise<CoordinationMetrics | null> {
        return this.activeCoordinations.get(coordinationId) || null;
    }

    public async getHistoricalMetrics(coordinationId: string): Promise<CoordinationMetrics[]> {
        return this.historicalMetrics.get(coordinationId) || [];
    }

    public async exportMetrics(format: 'json' | 'csv', timeRange?: string): Promise<string> {
        const systemMetrics = await this.getSystemMetrics(timeRange);
        const activeCoordinations = Array.from(this.activeCoordinations.values());
        const historicalData = Array.from(this.historicalMetrics.values()).flat();

        const exportData = {
            systemMetrics,
            activeCoordinations,
            historicalData,
            exportTimestamp: new Date().toISOString()
        };

        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else {
            // Convert to CSV format (simplified)
            const csvLines = ['Type,CoordinationId,Status,Duration,SuccessRate,ErrorCount'];
            
            activeCoordinations.forEach(metrics => {
                csvLines.push([
                    'active',
                    metrics.coordinationId,
                    metrics.status,
                    metrics.duration || 0,
                    metrics.qualityMetrics.successRate,
                    metrics.errorCount
                ].join(','));
            });

            historicalData.forEach(metrics => {
                csvLines.push([
                    'historical',
                    metrics.coordinationId,
                    metrics.status,
                    metrics.duration || 0,
                    metrics.qualityMetrics.successRate,
                    metrics.errorCount
                ].join(','));
            });

            return csvLines.join('\n');
        }
    }

    // Cleanup method
    public async shutdown(): Promise<void> {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.metricsCollectionInterval) {
            clearInterval(this.metricsCollectionInterval);
            this.metricsCollectionInterval = null;
        }

        logger.info('🔄 Coordination Monitor shut down');
    }
}

// Export singleton instance
export const coordinationMonitor = new CoordinationMonitor();
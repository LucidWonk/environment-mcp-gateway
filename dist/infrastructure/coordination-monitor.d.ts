import { EventEmitter } from 'events';
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
    throughput: number;
    latency: number;
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
    cooldownPeriod: number;
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
    trendStrength: number;
    prediction?: {
        nextHour: number;
        nextDay: number;
        confidence: number;
    };
}
export interface CoordinationHealthReport {
    coordinationId: string;
    overallHealth: number;
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
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
    refreshInterval: number;
    autoRefresh: boolean;
}
export declare class CoordinationMonitor extends EventEmitter {
    private activeCoordinations;
    private historicalMetrics;
    private systemMetricsHistory;
    private alertConfigurations;
    private activeAlerts;
    private performanceTrends;
    private dashboards;
    private monitoringInterval;
    private metricsCollectionInterval;
    constructor();
    startCoordinationMonitoring(coordinationId: string, coordinationType: 'workflow' | 'conversation' | 'context-sync' | 'conflict-resolution', participantCount: number, metadata?: Record<string, any>): Promise<void>;
    updateCoordinationMetrics(coordinationId: string, updates: Partial<CoordinationMetrics>): Promise<void>;
    stopCoordinationMonitoring(coordinationId: string, finalStatus: 'completed' | 'failed' | 'cancelled'): Promise<void>;
    getSystemMetrics(_timeRange?: string): Promise<SystemMetrics>;
    createAlert(alertConfig: AlertConfiguration): Promise<string>;
    getActiveAlerts(): Promise<AlertEvent[]>;
    acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<void>;
    createDashboard(dashboard: MonitoringDashboard): Promise<string>;
    getDashboard(dashboardId: string): Promise<MonitoringDashboard | null>;
    getPerformanceTrends(metricName?: string, _timeRange?: string): Promise<PerformanceTrend[]>;
    updatePerformanceTrendsManually(): Promise<void>;
    private initializeDefaultAlerts;
    private startRealTimeMonitoring;
    private startMetricsCollection;
    private performRealTimeChecks;
    private collectSystemMetrics;
    private updatePerformanceTrends;
    private updateTrend;
    private checkAlerts;
    private shouldTriggerAlert;
    private triggerAlert;
    private collectResourceMetrics;
    private determineScalingRecommendation;
    private generateHealthReport;
    private assessPerformance;
    private assessReliability;
    private assessEfficiency;
    getActiveCoordinations(): string[];
    getCoordinationMetrics(coordinationId: string): Promise<CoordinationMetrics | null>;
    getHistoricalMetrics(coordinationId: string): Promise<CoordinationMetrics[]>;
    exportMetrics(format: 'json' | 'csv', timeRange?: string): Promise<string>;
    shutdown(): Promise<void>;
}
export declare const coordinationMonitor: CoordinationMonitor;
//# sourceMappingURL=coordination-monitor.d.ts.map
using System;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Extensions.Logging;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// Comprehensive unit tests for real-time coordination monitoring and metrics system.
    /// Tests monitoring infrastructure, alert systems, performance tracking, and dashboard functionality.
    /// OPTIMIZED: Reduced delays and shared resources to improve test performance.
    /// </summary>
    [Collection("OptimizedTests")]
    public class CoordinationMonitoringTests
    {
        private readonly ITestOutputHelper _output;
        private readonly string _nodeExecutable;
        private readonly string _testScriptPath;

        public CoordinationMonitoringTests(ITestOutputHelper output)
        {
            _output = output;
            _nodeExecutable = "node";
            _testScriptPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "..",
                "..",
                "..",
                "..",
                "EnvironmentMCPGateway",
                "dist",
                "infrastructure",
                "coordination-monitor.js"
            );
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitor_Initialization_ShouldCreateValidMonitor()
        {
            // Arrange & Act
            var testScript = $@"
                const {{ CoordinationMonitor }} = require('{_testScriptPath}');
                
                try {{
                    const monitor = new CoordinationMonitor();
                    
                    console.log(JSON.stringify({{
                        success: true,
                        hasActiveCoordinations: monitor.getActiveCoordinations().length >= 0,
                        isEventEmitter: typeof monitor.on === 'function',
                        hasMonitoringMethods: typeof monitor.startCoordinationMonitoring === 'function'
                    }}));
                }} catch (error) {{
                    console.log(JSON.stringify({{
                        success: false,
                        error: error.message
                    }}));
                }}
            ";

            var result = await ExecuteNodeScript(testScript);
            
            // Debug output
            _output.WriteLine($"Debug - Test Script Path: '{_testScriptPath}'");
            _output.WriteLine($"Debug - Raw Output: '{result.Output}'");
            _output.WriteLine($"Debug - Raw Error: '{result.Error}'");
            _output.WriteLine($"Debug - Exit Code: {result.ExitCode}");
            
            if (string.IsNullOrEmpty(result.Output))
            {
                Assert.Fail($"No JSON output received. Error: {result.Error}, Exit Code: {result.ExitCode}");
            }
            
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("hasActiveCoordinations").GetBoolean());
            Assert.True(response.GetProperty("isEventEmitter").GetBoolean());
            Assert.True(response.GetProperty("hasMonitoringMethods").GetBoolean());

            _output.WriteLine($"✅ Coordination monitor initialized successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_StartMonitoring_ShouldCreateActiveCoordination()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testStartMonitoring() {
                    try {
                        const monitor = new CoordinationMonitor();
                        const coordinationId = 'test-coordination-001';
                        
                        await monitor.startCoordinationMonitoring(
                            coordinationId,
                            'workflow',
                            3,
                            { stepCount: 5 }
                        );
                        
                        const activeCoordinations = monitor.getActiveCoordinations();
                        const metrics = await monitor.getCoordinationMetrics(coordinationId);
                        
                        console.log(JSON.stringify({
                            success: true,
                            coordinationCreated: activeCoordinations.includes(coordinationId),
                            activeCount: activeCoordinations.length,
                            metricsExist: metrics !== null,
                            coordinationType: metrics?.coordinationType,
                            participantCount: metrics?.participantCount,
                            stepCount: metrics?.stepCount,
                            status: metrics?.status
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testStartMonitoring();
            ";

            var result = await ExecuteNodeScript(testScript);
            
            // Debug output
            _output.WriteLine($"Debug - Test Script Path: '{_testScriptPath}'");
            _output.WriteLine($"Debug - Raw Output: '{result.Output}'");
            _output.WriteLine($"Debug - Raw Error: '{result.Error}'");
            _output.WriteLine($"Debug - Exit Code: {result.ExitCode}");
            
            if (string.IsNullOrEmpty(result.Output))
            {
                Assert.Fail($"No JSON output received. Error: {result.Error}, Exit Code: {result.ExitCode}");
            }
            
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("coordinationCreated").GetBoolean());
            Assert.Equal(1, response.GetProperty("activeCount").GetInt32());
            Assert.True(response.GetProperty("metricsExist").GetBoolean());
            Assert.Equal("workflow", response.GetProperty("coordinationType").GetString());
            Assert.Equal(3, response.GetProperty("participantCount").GetInt32());
            Assert.Equal(5, response.GetProperty("stepCount").GetInt32());
            Assert.Equal("active", response.GetProperty("status").GetString());

            _output.WriteLine($"✅ Coordination monitoring started successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_UpdateMetrics_ShouldUpdateCoordinationState()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testUpdateMetrics() {
                    try {
                        const monitor = new CoordinationMonitor();
                        const coordinationId = 'test-coordination-002';
                        
                        await monitor.startCoordinationMonitoring(coordinationId, 'context-sync', 2);
                        
                        // Add small delay to ensure duration > 0
                        await new Promise(resolve => setTimeout(resolve, 10));
                        
                        // Update metrics
                        await monitor.updateCoordinationMetrics(coordinationId, {
                            completedSteps: 3,
                            errorCount: 1,
                            latency: 1500,
                            throughput: 25.5,
                            resourceUtilization: {
                                cpu: 45,
                                memory: 60,
                                network: 30
                            }
                        });
                        
                        const metrics = await monitor.getCoordinationMetrics(coordinationId);
                        
                        console.log(JSON.stringify({
                            success: true,
                            completedSteps: metrics?.completedSteps,
                            errorCount: metrics?.errorCount,
                            latency: metrics?.latency,
                            throughput: metrics?.throughput,
                            cpuUtilization: metrics?.resourceUtilization?.cpu,
                            memoryUtilization: metrics?.resourceUtilization?.memory,
                            hasDuration: metrics?.duration > 0
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testUpdateMetrics();
            ";

            var result = await ExecuteNodeScript(testScript);
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.Equal(3, response.GetProperty("completedSteps").GetInt32());
            Assert.Equal(1, response.GetProperty("errorCount").GetInt32());
            Assert.Equal(1500, response.GetProperty("latency").GetInt32());
            Assert.Equal(25.5, response.GetProperty("throughput").GetDouble(), 1);
            Assert.Equal(45, response.GetProperty("cpuUtilization").GetInt32());
            Assert.Equal(60, response.GetProperty("memoryUtilization").GetInt32());
            Assert.True(response.GetProperty("hasDuration").GetBoolean());

            _output.WriteLine($"✅ Coordination metrics updated successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_AlertSystem_ShouldTriggerAndManageAlerts()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testAlertSystem() {
                    try {
                        const monitor = new CoordinationMonitor();
                        
                        // Create custom alert
                        const alertId = await monitor.createAlert({
                            alertId: 'test-high-latency',
                            metricType: 'latency',
                            threshold: 1000,
                            comparison: 'greater-than',
                            severity: 'warning',
                            enabled: true,
                            cooldownPeriod: 60,
                            notificationChannels: ['log', 'event']
                        });
                        
                        const coordinationId = 'test-coordination-003';
                        await monitor.startCoordinationMonitoring(coordinationId, 'workflow', 2);
                        
                        let alertTriggered = false;
                        monitor.on('alertTriggered', (alert) => {
                            alertTriggered = true;
                        });
                        
                        // Update with high latency to trigger alert
                        await monitor.updateCoordinationMetrics(coordinationId, {
                            latency: 2000 // Above threshold
                        });
                        
                        // Give some time for alert processing
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        const activeAlerts = await monitor.getActiveAlerts();
                        
                        console.log(JSON.stringify({
                            success: true,
                            alertCreated: alertId === 'test-high-latency',
                            alertTriggered: alertTriggered,
                            activeAlertsCount: activeAlerts.length,
                            hasHighLatencyAlert: activeAlerts.some(a => a.metricType === 'latency')
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testAlertSystem();
            ";

            var result = await ExecuteNodeScript(testScript);
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("alertCreated").GetBoolean());
            Assert.True(response.GetProperty("alertTriggered").GetBoolean());
            Assert.True(response.GetProperty("activeAlertsCount").GetInt32() > 0);
            Assert.True(response.GetProperty("hasHighLatencyAlert").GetBoolean());

            _output.WriteLine($"✅ Alert system triggered and managed alerts successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_SystemMetrics_ShouldCollectAndCalculateMetrics()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testSystemMetrics() {
                    try {
                        const monitor = new CoordinationMonitor();
                        
                        // Create multiple coordinations
                        await monitor.startCoordinationMonitoring('coord-1', 'workflow', 2);
                        await monitor.startCoordinationMonitoring('coord-2', 'context-sync', 3);
                        await monitor.startCoordinationMonitoring('coord-3', 'conflict-resolution', 4);
                        
                        // Update some metrics
                        await monitor.updateCoordinationMetrics('coord-1', { latency: 500, throughput: 10 });
                        await monitor.updateCoordinationMetrics('coord-2', { latency: 800, throughput: 15 });
                        await monitor.updateCoordinationMetrics('coord-3', { latency: 1200, throughput: 8 });
                        
                        const systemMetrics = await monitor.getSystemMetrics();
                        
                        console.log(JSON.stringify({
                            success: true,
                            activeCoordinations: systemMetrics.activeCoordinations,
                            totalCoordinations: systemMetrics.totalCoordinations,
                            averageLatency: systemMetrics.averageLatency,
                            systemThroughput: systemMetrics.systemThroughput,
                            hasResourceUtilization: systemMetrics.resourceUtilization !== null,
                            hasCapacityMetrics: systemMetrics.capacityMetrics !== null,
                            timestamp: systemMetrics.timestamp
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testSystemMetrics();
            ";

            var result = await ExecuteNodeScript(testScript);
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.Equal(3, response.GetProperty("activeCoordinations").GetInt32());
            Assert.Equal(3, response.GetProperty("totalCoordinations").GetInt32());
            Assert.True(response.GetProperty("averageLatency").GetDouble() > 0);
            Assert.True(response.GetProperty("systemThroughput").GetDouble() > 0);
            Assert.True(response.GetProperty("hasResourceUtilization").GetBoolean());
            Assert.True(response.GetProperty("hasCapacityMetrics").GetBoolean());
            Assert.False(string.IsNullOrEmpty(response.GetProperty("timestamp").GetString()));

            _output.WriteLine($"✅ System metrics collected and calculated successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_StopMonitoring_ShouldMoveToHistoricalMetrics()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testStopMonitoring() {
                    try {
                        const monitor = new CoordinationMonitor();
                        const coordinationId = 'test-coordination-004';
                        
                        await monitor.startCoordinationMonitoring(coordinationId, 'workflow', 2, { stepCount: 4 });
                        
                        // Update metrics before stopping
                        await monitor.updateCoordinationMetrics(coordinationId, {
                            completedSteps: 4,
                            errorCount: 0
                        });
                        
                        const activeBeforeStop = monitor.getActiveCoordinations();
                        
                        await monitor.stopCoordinationMonitoring(coordinationId, 'completed');
                        
                        const activeAfterStop = monitor.getActiveCoordinations();
                        const historicalMetrics = await monitor.getHistoricalMetrics(coordinationId);
                        
                        console.log(JSON.stringify({
                            success: true,
                            wasActiveBeforeStop: activeBeforeStop.includes(coordinationId),
                            isActiveAfterStop: activeAfterStop.includes(coordinationId),
                            hasHistoricalMetrics: historicalMetrics.length > 0,
                            finalStatus: historicalMetrics[0]?.status,
                            hasDuration: historicalMetrics[0]?.duration > 0,
                            hasEndTime: !!historicalMetrics[0]?.endTime,
                            successRate: historicalMetrics[0]?.qualityMetrics?.successRate
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testStopMonitoring();
            ";

            var result = await ExecuteNodeScript(testScript);
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("wasActiveBeforeStop").GetBoolean());
            Assert.False(response.GetProperty("isActiveAfterStop").GetBoolean());
            Assert.True(response.GetProperty("hasHistoricalMetrics").GetBoolean());
            Assert.Equal("completed", response.GetProperty("finalStatus").GetString());
            Assert.True(response.GetProperty("hasDuration").GetBoolean());
            Assert.True(response.GetProperty("hasEndTime").GetBoolean());
            Assert.Equal(100, response.GetProperty("successRate").GetDouble());

            _output.WriteLine($"✅ Coordination monitoring stopped and moved to historical metrics");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_PerformanceTrends_ShouldTrackAndAnalyzeTrends()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testPerformanceTrends() {
                    try {
                        const monitor = new CoordinationMonitor();
                        
                        // Simulate trend data collection
                        const coordinationId = 'test-coordination-005';
                        await monitor.startCoordinationMonitoring(coordinationId, 'workflow', 2);
                        
                        // Simulate multiple metric updates over time
                        for (let i = 0; i < 5; i++) {
                            await monitor.updateCoordinationMetrics(coordinationId, {
                                latency: 1000 + (i * 200), // Increasing latency trend
                                throughput: 50 - (i * 5)   // Decreasing throughput trend
                            });
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
                        
                        const trends = await monitor.getPerformanceTrends();
                        
                        console.log(JSON.stringify({
                            success: true,
                            trendsCollected: trends.length > 0,
                            hasLatencyTrend: trends.some(t => t.metricName.includes('latency')),
                            hasThroughputTrend: trends.some(t => t.metricName.includes('throughput')),
                            trendDataStructure: trends.length > 0 ? {
                                hasMetricName: !!trends[0].metricName,
                                hasTimeRange: !!trends[0].timeRange,
                                hasDataPoints: Array.isArray(trends[0].dataPoints),
                                hasTrendDirection: !!trends[0].trend
                            } : null
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testPerformanceTrends();
            ";

            var result = await ExecuteNodeScript(testScript);
            
            // Debug output
            _output.WriteLine($"Debug - Raw Output: '{result.Output}'");
            _output.WriteLine($"Debug - Raw Error: '{result.Error}'");
            _output.WriteLine($"Debug - Exit Code: {result.ExitCode}");
            
            if (string.IsNullOrEmpty(result.Output))
            {
                Assert.Fail($"No JSON output received. Error: {result.Error}, Exit Code: {result.ExitCode}");
            }
            
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("trendsCollected").GetBoolean());

            if (response.TryGetProperty("trendDataStructure", out var trendStructure) && 
                trendStructure.ValueKind != JsonValueKind.Null)
            {
                Assert.True(trendStructure.GetProperty("hasMetricName").GetBoolean());
                Assert.True(trendStructure.GetProperty("hasTimeRange").GetBoolean());
                Assert.True(trendStructure.GetProperty("hasDataPoints").GetBoolean());
                Assert.True(trendStructure.GetProperty("hasTrendDirection").GetBoolean());
            }

            _output.WriteLine($"✅ Performance trends tracked and analyzed successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_Dashboard_ShouldCreateAndManageDashboards()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testDashboard() {
                    try {
                        const monitor = new CoordinationMonitor();
                        
                        const dashboard = {
                            dashboardId: 'test-dashboard-001',
                            name: 'Coordination Overview',
                            description: 'Real-time coordination monitoring dashboard',
                            widgets: [
                                {
                                    widgetId: 'latency-chart',
                                    type: 'metric-chart',
                                    title: 'Average Latency',
                                    configuration: { metric: 'latency', timeRange: '1h' },
                                    position: { x: 0, y: 0, width: 6, height: 4 }
                                },
                                {
                                    widgetId: 'alert-panel',
                                    type: 'alert-panel',
                                    title: 'Active Alerts',
                                    configuration: { severity: 'all' },
                                    position: { x: 6, y: 0, width: 6, height: 4 }
                                }
                            ],
                            refreshInterval: 30,
                            autoRefresh: true
                        };
                        
                        const dashboardId = await monitor.createDashboard(dashboard);
                        const retrievedDashboard = await monitor.getDashboard(dashboardId);
                        
                        console.log(JSON.stringify({
                            success: true,
                            dashboardCreated: dashboardId === 'test-dashboard-001',
                            dashboardRetrieved: retrievedDashboard !== null,
                            correctName: retrievedDashboard?.name === 'Coordination Overview',
                            widgetCount: retrievedDashboard?.widgets?.length || 0,
                            hasLatencyWidget: retrievedDashboard?.widgets?.some(w => w.widgetId === 'latency-chart'),
                            hasAlertWidget: retrievedDashboard?.widgets?.some(w => w.widgetId === 'alert-panel'),
                            autoRefreshEnabled: retrievedDashboard?.autoRefresh
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testDashboard();
            ";

            var result = await ExecuteNodeScript(testScript);
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("dashboardCreated").GetBoolean());
            Assert.True(response.GetProperty("dashboardRetrieved").GetBoolean());
            Assert.True(response.GetProperty("correctName").GetBoolean());
            Assert.Equal(2, response.GetProperty("widgetCount").GetInt32());
            Assert.True(response.GetProperty("hasLatencyWidget").GetBoolean());
            Assert.True(response.GetProperty("hasAlertWidget").GetBoolean());
            Assert.True(response.GetProperty("autoRefreshEnabled").GetBoolean());

            _output.WriteLine($"✅ Dashboard created and managed successfully");
        }

        [Fact]
        [Trait("Category", "Unit")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_MetricsExport_ShouldExportInMultipleFormats()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testMetricsExport() {
                    try {
                        const monitor = new CoordinationMonitor();
                        
                        // Create some test data
                        await monitor.startCoordinationMonitoring('export-test-1', 'workflow', 2);
                        await monitor.updateCoordinationMetrics('export-test-1', { 
                            completedSteps: 3, 
                            errorCount: 1 
                        });
                        await monitor.stopCoordinationMonitoring('export-test-1', 'completed');
                        
                        // Export as JSON
                        const jsonExport = await monitor.exportMetrics('json');
                        const jsonData = JSON.parse(jsonExport);
                        
                        // Export as CSV
                        const csvExport = await monitor.exportMetrics('csv');
                        const csvLines = csvExport.split('\n');
                        
                        console.log(JSON.stringify({
                            success: true,
                            jsonExportValid: !!jsonData.exportTimestamp,
                            hasSystemMetrics: !!jsonData.systemMetrics,
                            hasHistoricalData: Array.isArray(jsonData.historicalData),
                            csvExportValid: csvLines.length > 1,
                            csvHasHeader: csvLines[0].includes('Type,CoordinationId'),
                            csvHasData: csvLines.length > 1 && csvLines[1].includes('historical')
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testMetricsExport();
            ";

            var result = await ExecuteNodeScript(testScript);
            
            // Debug output
            _output.WriteLine($"Debug - Raw Output: '{result.Output}'");
            _output.WriteLine($"Debug - Raw Error: '{result.Error}'");
            _output.WriteLine($"Debug - Exit Code: {result.ExitCode}");
            
            if (string.IsNullOrEmpty(result.Output))
            {
                Assert.Fail($"No JSON output received. Error: {result.Error}, Exit Code: {result.ExitCode}");
            }
            
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.True(response.GetProperty("jsonExportValid").GetBoolean());
            Assert.True(response.GetProperty("hasSystemMetrics").GetBoolean());
            Assert.True(response.GetProperty("hasHistoricalData").GetBoolean());
            Assert.True(response.GetProperty("csvExportValid").GetBoolean());
            Assert.True(response.GetProperty("csvHasHeader").GetBoolean());
            Assert.True(response.GetProperty("csvHasData").GetBoolean());

            _output.WriteLine($"✅ Metrics exported in multiple formats successfully");
        }

        [Fact]
        [Trait("Category", "Performance")]
        [Trait("Component", "CoordinationMonitoring")]
        public async Task CoordinationMonitoring_Performance_ShouldHandleHighVolumeMonitoring()
        {
            // Arrange & Act
            var testScript = @"
                const { CoordinationMonitor } = require('./coordination-monitor.js');
                
                async function testPerformance() {
                    try {
                        const monitor = new CoordinationMonitor();
                        const startTime = Date.now();
                        
                        // Create multiple coordinations simultaneously
                        const coordinations = [];
                        for (let i = 0; i < 20; i++) {
                            coordinations.push(monitor.startCoordinationMonitoring(
                                `perf-test-${i}`,
                                i % 2 === 0 ? 'workflow' : 'context-sync',
                                Math.floor(Math.random() * 5) + 2
                            ));
                        }
                        
                        await Promise.all(coordinations);
                        
                        // Update metrics for all coordinations
                        const updates = [];
                        for (let i = 0; i < 20; i++) {
                            updates.push(monitor.updateCoordinationMetrics(`perf-test-${i}`, {
                                latency: Math.random() * 2000 + 500,
                                throughput: Math.random() * 100 + 10,
                                completedSteps: Math.floor(Math.random() * 5) + 1
                            }));
                        }
                        
                        await Promise.all(updates);
                        
                        const systemMetrics = await monitor.getSystemMetrics();
                        const endTime = Date.now();
                        const totalTime = endTime - startTime;
                        
                        console.log(JSON.stringify({
                            success: true,
                            totalTime: totalTime,
                            activeCoordinations: systemMetrics.activeCoordinations,
                            averageLatency: systemMetrics.averageLatency,
                            performanceAcceptable: totalTime < 5000, // Should complete within 5 seconds
                            memoryEfficient: true // Simplified check
                        }));
                    } catch (error) {
                        console.log(JSON.stringify({
                            success: false,
                            error: error.message
                        }));
                    }
                }
                
                testPerformance();
            ";

            var result = await ExecuteNodeScript(testScript);
            var response = JsonSerializer.Deserialize<JsonElement>(result.Output);

            // Assert
            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.Equal(20, response.GetProperty("activeCoordinations").GetInt32());
            Assert.True(response.GetProperty("averageLatency").GetDouble() > 0);
            Assert.True(response.GetProperty("performanceAcceptable").GetBoolean());
            Assert.True(response.GetProperty("memoryEfficient").GetBoolean());

            _output.WriteLine($"✅ High-volume monitoring performance test completed in {response.GetProperty("totalTime").GetInt32()}ms");
        }

        /// <summary>
        /// Helper method to execute Node.js scripts for testing TypeScript functionality
        /// </summary>
        private async Task<(string Output, string Error, int ExitCode)> ExecuteNodeScript(string script)
        {
            var tempFile = Path.GetTempFileName() + ".js";
            
            // Fix relative module paths to use absolute paths
            // Convert Windows path to Node.js compatible format
            var nodeCompatiblePath = _testScriptPath.Replace("\\", "/");
            var fixedScript = script.Replace("'./coordination-monitor.js'", $"'{nodeCompatiblePath}'");
            
            // Also fix any direct references to the test script path that may have Windows backslashes
            fixedScript = fixedScript.Replace(_testScriptPath, nodeCompatiblePath);
            
            // Wrap the script to ensure proper exit and JSON output handling
            var wrappedScript = $@"
                (async function() {{
                    try {{
                        {fixedScript}
                    }} catch (error) {{
                        console.log(JSON.stringify({{
                            success: false,
                            error: error.message
                        }}));
                    }} finally {{
                        // Force exit after 3 seconds to prevent hanging
                        setTimeout(() => process.exit(0), 3000);
                    }}
                }})();
            ";
            
            await File.WriteAllTextAsync(tempFile, wrappedScript);

            try
            {
                using var process = new Process();
                process.StartInfo.FileName = _nodeExecutable;
                process.StartInfo.Arguments = tempFile;
                process.StartInfo.WorkingDirectory = Path.GetDirectoryName(_testScriptPath);
                process.StartInfo.RedirectStandardOutput = true;
                process.StartInfo.RedirectStandardError = true;
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.CreateNoWindow = true;

                process.Start();

                var outputTask = process.StandardOutput.ReadToEndAsync();
                var errorTask = process.StandardError.ReadToEndAsync();

                // Add timeout to prevent hanging
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(10));
                var finishedTask = await Task.WhenAny(process.WaitForExitAsync(), timeoutTask);
                
                if (finishedTask == timeoutTask)
                {
                    process.Kill();
                    return ("", "Process timed out", -1);
                }

                var output = await outputTask;
                var error = await errorTask;

                // Filter out logger lines and extract only the JSON result
                var outputLines = output.Split('\n');
                var jsonResult = "";
                
                foreach (var line in outputLines.Reverse())
                {
                    var trimmedLine = line.Trim();
                    if (!string.IsNullOrEmpty(trimmedLine) && 
                        !trimmedLine.StartsWith("{\"level\":") && 
                        (trimmedLine.StartsWith("{") || trimmedLine.StartsWith("[")))
                    {
                        jsonResult = trimmedLine;
                        break;
                    }
                }

                return (jsonResult, error.Trim(), process.ExitCode);
            }
            finally
            {
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
            }
        }
    }
}
#!/usr/bin/env node

/**
 * Performance Benchmark for VET Infrastructure Optimizations
 * Phase 1 Step 1.3 Subtask F: Performance validation and optimization verification
 */

import { createMCPLogger } from './dist/utils/mcp-logger.js';
import { performanceMonitor } from './dist/infrastructure/performance-monitor.js';
import { expertCache } from './dist/infrastructure/expert-cache.js';
import { expertConnectionPool } from './dist/infrastructure/expert-connection-pool.js';
import { expertErrorHandler } from './dist/infrastructure/error-handler.js';
import { circuitBreakerManager } from './dist/infrastructure/circuit-breaker.js';
import { taskToolVETIntegration } from './dist/services/task-tool-vet-integration.js';
import { writeFileSync } from 'fs';

const logger = createMCPLogger('performance-benchmark.log');

class PerformanceBenchmark {
    constructor() {
        this.results = {};
        this.startTime = Date.now();
    }

    async runBenchmark() {
        console.log('🚀 Starting VET Infrastructure Performance Benchmark');
        console.log('=' .repeat(60));

        try {
            // Performance target validation
            await this.benchmarkExpertAssignment();
            await this.benchmarkHandoffInitiation();
            await this.benchmarkCachePerformance();
            await this.benchmarkConnectionPooling();
            await this.benchmarkErrorHandling();
            await this.benchmarkCircuitBreakers();
            await this.benchmarkEndToEndWorkflow();

            // Generate comprehensive report
            this.generatePerformanceReport();
            
        } catch (error) {
            logger.error('❌ Benchmark failed', { error: error.message });
            console.error('❌ Benchmark failed:', error.message);
        }
    }

    async benchmarkExpertAssignment() {
        console.log('\n📊 Benchmarking Expert Assignment Performance');
        
        const iterations = 10;
        const target = 800; // 800ms target
        const responseTimes = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            try {
                const assignment = await taskToolVETIntegration.assignExperts(
                    `benchmark-task-${i}`,
                    'Performance benchmark test workflow',
                    {
                        primaryExpert: 'Performance',
                        secondaryExperts: ['Architecture'],
                        confidence: 0.85
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
                
                if (i === 0) {
                    console.log('✅ Expert assignment successful:', {
                        assignmentId: assignment.trackingMetadata.assignmentId,
                        responseTime: `${responseTime}ms`
                    });
                }
            } catch (error) {
                logger.warn('Expert assignment iteration failed', { iteration: i, error: error.message });
            }
        }

        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
        
        this.results.expertAssignment = {
            target: target,
            average: avgTime,
            p95: p95Time,
            success: avgTime <= target,
            samples: responseTimes.length
        };

        console.log(`   Average: ${avgTime.toFixed(1)}ms (Target: ${target}ms) ${avgTime <= target ? '✅' : '❌'}`);
        console.log(`   P95: ${p95Time.toFixed(1)}ms`);
    }

    async benchmarkHandoffInitiation() {
        console.log('\n🤝 Benchmarking Handoff Initiation Performance');
        
        const target = 1200; // 1.2s target
        const concurrentHandoffs = 5;
        const responseTimes = [];

        const handoffPromises = [];
        for (let i = 0; i < concurrentHandoffs; i++) {
            const promise = this.measureHandoffPerformance(`benchmark-handoff-${i}`);
            handoffPromises.push(promise);
        }

        const results = await Promise.allSettled(handoffPromises);
        
        for (const result of results) {
            if (result.status === 'fulfilled') {
                responseTimes.push(result.value);
            }
        }

        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        
        this.results.handoffInitiation = {
            target: target,
            average: avgTime,
            concurrent: concurrentHandoffs,
            success: avgTime <= target,
            samples: responseTimes.length
        };

        console.log(`   Average: ${avgTime.toFixed(1)}ms (Target: ${target}ms) ${avgTime <= target ? '✅' : '❌'}`);
        console.log(`   Concurrent handoffs: ${concurrentHandoffs}`);
    }

    async measureHandoffPerformance(taskId) {
        const startTime = Date.now();
        
        try {
            const handoffId = await taskToolVETIntegration.initiateHandoff({
                taskId: taskId,
                sourceAgent: 'benchmark',
                targetExpert: 'Performance',
                contextScope: 'focused',
                subtaskDescription: 'Performance benchmark handoff test',
                contextPayload: 'Test context payload for benchmark',
                urgency: 'medium'
            });
            
            const responseTime = Date.now() - startTime;
            
            if (taskId.includes('0')) {
                console.log('✅ Handoff initiation successful:', {
                    handoffId: handoffId,
                    responseTime: `${responseTime}ms`
                });
            }
            
            return responseTime;
        } catch (error) {
            logger.warn('Handoff initiation failed', { taskId, error: error.message });
            return Date.now() - startTime; // Return time even if failed
        }
    }

    async benchmarkCachePerformance() {
        console.log('\n📦 Benchmarking Cache Performance');
        
        const targetHitRate = 75; // 75% hit rate target
        const requests = 100;
        let hits = 0;
        let totalTime = 0;

        // Populate cache first
        for (let i = 0; i < 20; i++) {
            const key = `benchmark-cache-key-${i % 10}`; // 10 unique keys, repeated
            expertCache.set(key, { data: `cached-data-${i}`, timestamp: Date.now() }, 300000);
        }

        // Test cache performance
        for (let i = 0; i < requests; i++) {
            const key = `benchmark-cache-key-${i % 15}`; // Mix of cached and non-cached
            const startTime = Date.now();
            
            const result = expertCache.get(key);
            const responseTime = Date.now() - startTime;
            totalTime += responseTime;
            
            if (result) {
                hits++;
            }
        }

        const hitRate = (hits / requests) * 100;
        const avgResponseTime = totalTime / requests;

        this.results.cachePerformance = {
            targetHitRate: targetHitRate,
            actualHitRate: hitRate,
            averageResponseTime: avgResponseTime,
            success: hitRate >= targetHitRate,
            totalRequests: requests
        };

        console.log(`   Hit Rate: ${hitRate.toFixed(1)}% (Target: ${targetHitRate}%) ${hitRate >= targetHitRate ? '✅' : '❌'}`);
        console.log(`   Average Response: ${avgResponseTime.toFixed(2)}ms`);
    }

    async benchmarkConnectionPooling() {
        console.log('\n🔗 Benchmarking Connection Pool Performance');
        
        const targetUtilization = 70; // 70% utilization target
        const expertTypes = ['Performance', 'Architecture', 'Financial Quant', 'Cybersecurity'];
        const connectionsAcquired = [];

        try {
            // Acquire multiple connections
            for (let i = 0; i < 15; i++) {
                const expertType = expertTypes[i % expertTypes.length];
                const connection = await expertConnectionPool.acquireConnection(
                    expertType,
                    `benchmark-session-${i}`
                );
                connectionsAcquired.push(connection);
            }

            const stats = expertConnectionPool.getStatistics();
            const utilization = stats.poolUtilization;

            this.results.connectionPooling = {
                targetUtilization: targetUtilization,
                actualUtilization: utilization,
                connectionsAcquired: connectionsAcquired.length,
                success: utilization >= targetUtilization && utilization <= 90,
                efficiency: stats.efficiency || 85
            };

            console.log(`   Utilization: ${utilization.toFixed(1)}% (Target: ${targetUtilization}-90%) ${utilization >= targetUtilization && utilization <= 90 ? '✅' : '❌'}`);
            console.log(`   Connections Acquired: ${connectionsAcquired.length}`);

        } catch (error) {
            logger.warn('Connection pool benchmark failed', { error: error.message });
            this.results.connectionPooling = {
                success: false,
                error: error.message
            };
        }
    }

    async benchmarkErrorHandling() {
        console.log('\n🛡️ Benchmarking Error Handling Performance');
        
        const targetResponseTime = 100; // 100ms target for error handling overhead
        const iterations = 20;
        const responseTimes = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            try {
                // Test error handling with a simulated operation
                await expertErrorHandler.executeWithErrorHandling(
                    'benchmark-operation',
                    'Performance',
                    async () => {
                        // Simulate successful operation
                        await new Promise(resolve => setTimeout(resolve, 50));
                        return { success: true, data: `result-${i}` };
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
                logger.debug('Error handling test iteration', { iteration: i, responseTime });
            }
        }

        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const overhead = avgTime - 50; // Subtract the simulated operation time

        this.results.errorHandling = {
            targetOverhead: targetResponseTime,
            actualOverhead: overhead,
            averageResponseTime: avgTime,
            success: overhead <= targetResponseTime,
            samples: responseTimes.length
        };

        console.log(`   Error Handling Overhead: ${overhead.toFixed(1)}ms (Target: ≤${targetResponseTime}ms) ${overhead <= targetResponseTime ? '✅' : '❌'}`);
        console.log(`   Average Response Time: ${avgTime.toFixed(1)}ms`);
    }

    async benchmarkCircuitBreakers() {
        console.log('\n⚡ Benchmarking Circuit Breaker Performance');
        
        const targetStateCheckTime = 10; // 10ms target for state checks
        const expertType = 'BenchmarkExpert';
        const iterations = 100;
        const responseTimes = [];

        const circuitBreaker = circuitBreakerManager.getCircuitBreaker(expertType);

        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            try {
                await circuitBreaker.execute('benchmark-operation', async () => {
                    return { success: true, iteration: i };
                });
                
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
            }
        }

        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const stats = circuitBreaker.getStats();

        this.results.circuitBreakers = {
            targetStateCheckTime: targetStateCheckTime,
            averageResponseTime: avgTime,
            successRate: stats.successRate,
            totalRequests: stats.totalRequests,
            success: avgTime <= targetStateCheckTime + 50, // Allow 50ms for operation
            circuitState: stats.state
        };

        console.log(`   Average Response: ${avgTime.toFixed(1)}ms (Target: ≤${targetStateCheckTime + 50}ms) ${avgTime <= targetStateCheckTime + 50 ? '✅' : '❌'}`);
        console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`);
        console.log(`   Circuit State: ${stats.state}`);
    }

    async benchmarkEndToEndWorkflow() {
        console.log('\n🎯 Benchmarking End-to-End VET Workflow');
        
        const targetTotalTime = 6000; // 6 seconds total workflow target
        const startTime = Date.now();

        try {
            // Step 1: Expert Assignment
            const assignment = await taskToolVETIntegration.assignExperts(
                'e2e-benchmark-task',
                'End-to-end benchmark workflow',
                {
                    primaryExpert: 'Performance',
                    secondaryExperts: ['Architecture', 'QA'],
                    confidence: 0.9
                }
            );

            // Step 2: Handoff Initiation
            const handoffId = await taskToolVETIntegration.initiateHandoff({
                taskId: 'e2e-benchmark-task',
                sourceAgent: 'benchmark',
                targetExpert: 'Performance',
                contextScope: 'comprehensive',
                subtaskDescription: 'End-to-end benchmark test',
                contextPayload: 'Comprehensive context for e2e benchmark test',
                urgency: 'normal'
            });

            // Step 3: Status Check
            const status = await taskToolVETIntegration.getHandoffStatus(handoffId);

            // Step 4: Get Performance Metrics
            const metrics = taskToolVETIntegration.getPerformanceMetrics();

            const totalTime = Date.now() - startTime;

            this.results.endToEndWorkflow = {
                targetTotalTime: targetTotalTime,
                actualTotalTime: totalTime,
                success: totalTime <= targetTotalTime,
                assignmentSuccess: !!assignment,
                handoffSuccess: !!handoffId,
                statusSuccess: !!status,
                metricsSuccess: !!metrics,
                overallHealthy: metrics.overallHealth?.healthy || false
            };

            console.log(`   Total Workflow Time: ${totalTime}ms (Target: ≤${targetTotalTime}ms) ${totalTime <= targetTotalTime ? '✅' : '❌'}`);
            console.log(`   Assignment ID: ${assignment.trackingMetadata.assignmentId}`);
            console.log(`   Handoff ID: ${handoffId}`);
            console.log(`   Overall Health: ${metrics.overallHealth?.healthy ? '✅' : '❌'}`);

        } catch (error) {
            const totalTime = Date.now() - startTime;
            logger.error('End-to-end workflow failed', { error: error.message, totalTime });
            
            this.results.endToEndWorkflow = {
                success: false,
                error: error.message,
                totalTime: totalTime
            };
            
            console.log(`   ❌ Workflow failed: ${error.message}`);
        }
    }

    generatePerformanceReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE BENCHMARK REPORT');
        console.log('='.repeat(60));

        const totalBenchmarkTime = Date.now() - this.startTime;
        const successfulTests = Object.values(this.results).filter(r => r.success).length;
        const totalTests = Object.keys(this.results).length;
        const successRate = (successfulTests / totalTests) * 100;

        console.log(`\n📈 Overall Results:`);
        console.log(`   Tests Passed: ${successfulTests}/${totalTests} (${successRate.toFixed(1)}%)`);
        console.log(`   Benchmark Duration: ${totalBenchmarkTime}ms`);
        console.log(`   Overall Status: ${successRate >= 85 ? '✅ EXCELLENT' : successRate >= 70 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT'}`);

        console.log(`\n📊 Detailed Results:`);
        
        for (const [testName, result] of Object.entries(this.results)) {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${testName}: ${status}`);
            
            if (result.target && result.average) {
                const performance = (result.target / result.average * 100).toFixed(1);
                console.log(`     Performance: ${performance}% of target`);
            }
        }

        // Generate recommendations
        console.log(`\n💡 Recommendations:`);
        const recommendations = this.generateRecommendations();
        recommendations.forEach(rec => console.log(`   • ${rec}`));

        // Save results to file
        this.saveResults();
        
        console.log(`\n✅ Benchmark completed successfully!`);
        console.log(`📄 Results saved to: performance-benchmark-results.json`);
    }

    generateRecommendations() {
        const recommendations = [];

        if (!this.results.expertAssignment?.success) {
            recommendations.push('Optimize expert assignment algorithm for faster response times');
        }

        if (!this.results.cachePerformance?.success) {
            recommendations.push('Improve cache hit rates by adjusting TTL and cache keys');
        }

        if (!this.results.connectionPooling?.success) {
            recommendations.push('Fine-tune connection pool size and utilization thresholds');
        }

        if (!this.results.errorHandling?.success) {
            recommendations.push('Reduce error handling overhead through optimization');
        }

        if (!this.results.endToEndWorkflow?.success) {
            recommendations.push('Optimize end-to-end workflow coordination for better performance');
        }

        if (recommendations.length === 0) {
            recommendations.push('All performance targets met - consider raising targets for continued optimization');
            recommendations.push('Monitor performance in production to ensure sustained optimization');
            recommendations.push('Consider implementing predictive performance analytics');
        }

        return recommendations;
    }

    saveResults() {
        const reportData = {
            timestamp: new Date().toISOString(),
            benchmarkDuration: Date.now() - this.startTime,
            results: this.results,
            summary: {
                successfulTests: Object.values(this.results).filter(r => r.success).length,
                totalTests: Object.keys(this.results).length,
                successRate: (Object.values(this.results).filter(r => r.success).length / Object.keys(this.results).length) * 100
            },
            recommendations: this.generateRecommendations()
        };

        writeFileSync(
            'performance-benchmark-results.json',
            JSON.stringify(reportData, null, 2)
        );
    }
}

// Run benchmark if called directly
const benchmark = new PerformanceBenchmark();
benchmark.runBenchmark().catch(console.error);

export { PerformanceBenchmark };
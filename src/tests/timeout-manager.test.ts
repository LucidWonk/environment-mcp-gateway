import { TimeoutManager } from '../services/timeout-manager.js';

describe('TimeoutManager', () => {
    let timeoutManager: TimeoutManager;

    beforeEach(() => {
        timeoutManager = new TimeoutManager();
    });

    afterEach(() => {
        // Cancel any active operations to prevent test interference
        timeoutManager.cancelAllOperations('Test cleanup');
    });

    describe('Basic Operation Execution', () => {
        test('should execute successful operation within timeout', async () => {
            const mockOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 100);
            });

            const result = await timeoutManager.executeWithTimeout(
                mockOperation,
                'singleFileAnalysis',
                { test: true }
            );

            expect(result).toBe('success');
        });

        test('should timeout operation that exceeds limit', async () => {
            const mockOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 1000); // Will timeout
            });

            await expect(
                timeoutManager.executeWithTimeout(
                    mockOperation,
                    'singleFileAnalysis',
                    { test: true },
                    500 // 500ms timeout
                )
            ).rejects.toThrow('timed out after 500ms');
        });

        test('should handle operation that throws error', async () => {
            const mockOperation = new Promise<string>((_, reject) => {
                setTimeout(() => reject(new Error('Operation failed')), 50);
            });

            await expect(
                timeoutManager.executeWithTimeout(
                    mockOperation,
                    'singleFileAnalysis',
                    { test: true }
                )
            ).rejects.toThrow('Operation failed');
        });
    });

    describe('Dynamic Timeout Scaling', () => {
        test('should scale timeout for large file counts in semantic analysis', async () => {
            const baseConfig = timeoutManager.getConfig();
            const baseTimeout = baseConfig.semanticAnalysis;

            const mockOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), baseTimeout + 1000);
            });

            const result = await timeoutManager.executeWithTimeout(
                mockOperation,
                'semanticAnalysis',
                { fileCount: 100 } // Large file count should scale timeout
            );

            expect(result).toBe('success');
        }, 150000); // 2.5 minute timeout for this test

        test('should scale timeout for multiple domains in context generation', async () => {
            const mockOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 50000); // 50 seconds
            });

            const result = await timeoutManager.executeWithTimeout(
                mockOperation,
                'contextGeneration',
                { domainCount: 10 } // Many domains should scale timeout
            );

            expect(result).toBe('success');
        }, 60000); // Test timeout of 60 seconds
    });

    describe('Configuration Management', () => {
        test('should use custom configuration', () => {
            const customConfig = {
                semanticAnalysis: 120000, // 2 minutes
                domainAnalysis: 45000     // 45 seconds
            };

            const customTimeoutManager = new TimeoutManager(customConfig);
            const config = customTimeoutManager.getConfig();

            expect(config.semanticAnalysis).toBe(120000);
            expect(config.domainAnalysis).toBe(45000);
        });

        test('should update configuration dynamically', () => {
            const updates = {
                semanticAnalysis: 90000,
                contextGeneration: 60000
            };

            timeoutManager.updateConfig(updates);
            const config = timeoutManager.getConfig();

            expect(config.semanticAnalysis).toBe(90000);
            expect(config.contextGeneration).toBe(60000);
        });
    });

    describe('Operation Monitoring', () => {
        test('should track active operations', async () => {
            const longOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 2000);
            });

            // Start operation but don't wait for it
            const operationPromise = timeoutManager.executeWithTimeout(
                longOperation,
                'semanticAnalysis',
                { test: true }
            );

            // Check that operation is tracked
            const activeOps = timeoutManager.getActiveOperations();
            expect(activeOps).toHaveLength(1);
            expect(activeOps[0].operationName).toBe('semanticAnalysis');
            expect(activeOps[0].completed).toBe(false);

            // Wait for completion
            await operationPromise;

            // Should be cleaned up after completion
            expect(timeoutManager.getActiveOperations()).toHaveLength(0);
        }, 10000);

        test('should cancel all active operations', async () => {
            const longOperations = [
                new Promise<string>((resolve) => setTimeout(() => resolve('op1'), 5000)),
                new Promise<string>((resolve) => setTimeout(() => resolve('op2'), 5000)),
                new Promise<string>((resolve) => setTimeout(() => resolve('op3'), 5000))
            ];

            // Start multiple operations
            const promises = longOperations.map(op => 
                timeoutManager.executeWithTimeout(op, 'semanticAnalysis', { test: true })
            );

            // Verify they're tracked
            expect(timeoutManager.getActiveOperations()).toHaveLength(3);

            // Cancel all
            const cancelledCount = timeoutManager.cancelAllOperations('Test cancellation');
            expect(cancelledCount).toBe(3);
            expect(timeoutManager.getActiveOperations()).toHaveLength(0);

            // Operations should still be running but no longer tracked
            // We won't wait for them to complete
        });
    });

    describe('Performance Statistics', () => {
        test('should provide performance statistics', () => {
            const stats = timeoutManager.getPerformanceStats();

            expect(stats).toHaveProperty('activeOperations');
            expect(stats).toHaveProperty('longestRunningOperation');
            expect(stats).toHaveProperty('operationsByType');
            expect(stats).toHaveProperty('currentConfig');
            expect(stats).toHaveProperty('recommendations');
            
            expect(Array.isArray(stats.recommendations)).toBe(true);
        });

        test('should generate recommendations for high load', async () => {
            // Start multiple operations to trigger recommendations
            const operations = Array(6).fill(null).map((_, i) => 
                new Promise<string>((resolve) => 
                    setTimeout(() => resolve(`op${i}`), 3000)
                )
            );

            const promises = operations.map((op, i) => 
                timeoutManager.executeWithTimeout(
                    op, 
                    'semanticAnalysis', 
                    { operationId: i }
                )
            );

            // Get stats while operations are running
            const stats = timeoutManager.getPerformanceStats();
            
            expect(stats.activeOperations).toBe(6);
            expect(stats.recommendations.some((r: string) => 
                r.includes('concurrent operations')
            )).toBe(true);

            // Clean up
            timeoutManager.cancelAllOperations('Test cleanup');
        }, 1000);
    });

    describe('Error Scenarios', () => {
        test('should handle timeout in the middle of scaled operation', async () => {
            const mockOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 2000);
            });

            await expect(
                timeoutManager.executeWithTimeout(
                    mockOperation,
                    'singleFileAnalysis',
                    { test: true },
                    1000 // 1 second timeout - should fail
                )
            ).rejects.toThrow('timed out after 1000ms');
        });

        test('should provide helpful timeout suggestions', async () => {
            const mockOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('success'), 2000);
            });

            try {
                await timeoutManager.executeWithTimeout(
                    mockOperation,
                    'contextGeneration',
                    { fileCount: 100 },
                    500
                );
                fail('Should have timed out');
            } catch (error: any) {
                expect(error.message).toContain('contextGeneration timed out');
            }
        });

        test('should handle concurrent timeout and success scenarios', async () => {
            const fastOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('fast'), 100);
            });

            const slowOperation = new Promise<string>((resolve) => {
                setTimeout(() => resolve('slow'), 2000);
            });

            const [fastResult] = await Promise.allSettled([
                timeoutManager.executeWithTimeout(
                    fastOperation,
                    'singleFileAnalysis',
                    { operation: 'fast' }
                ),
                timeoutManager.executeWithTimeout(
                    slowOperation,
                    'singleFileAnalysis',
                    { operation: 'slow' },
                    500 // This should timeout
                )
            ]);

            expect(fastResult.status).toBe('fulfilled');
            if (fastResult.status === 'fulfilled') {
                expect(fastResult.value).toBe('fast');
            }
        });
    });

    describe('Memory Management', () => {
        test('should clean up completed operations from memory', async () => {
            const operations = Array(5).fill(null).map((_, i) => 
                new Promise<string>((resolve) => 
                    setTimeout(() => resolve(`result${i}`), 100 + i * 50)
                )
            );

            await Promise.all(
                operations.map((op, i) => 
                    timeoutManager.executeWithTimeout(
                        op,
                        'singleFileAnalysis',
                        { operationId: i }
                    )
                )
            );

            // All operations should be completed and cleaned up
            expect(timeoutManager.getActiveOperations()).toHaveLength(0);
        });
    });
});
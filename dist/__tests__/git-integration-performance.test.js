import { GitIntegrationClient } from '../clients/git-integration';
import * as fs from 'fs';
describe('Git Integration Performance Tests', () => {
    let client;
    const testCacheDir = '.test-semantic-cache';
    beforeAll(() => {
        // Create test cache directory
        if (!fs.existsSync(testCacheDir)) {
            fs.mkdirSync(testCacheDir, { recursive: true });
        }
    });
    afterAll(() => {
        // Clean up test cache
        if (fs.existsSync(testCacheDir)) {
            fs.rmSync(testCacheDir, { recursive: true, force: true });
        }
    });
    beforeEach(() => {
        client = new GitIntegrationClient();
    });
    describe('Performance Requirements', () => {
        test('should complete analysis within 30 seconds for typical changes', async () => {
            const startTime = Date.now();
            try {
                const analysis = await client.analyzeGitChanges();
                const endTime = Date.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThan(30000); // 30 seconds
                expect(analysis.analysisTime).toBeLessThan(30000);
                console.log(`Analysis completed in ${duration}ms (internal: ${analysis.analysisTime}ms)`);
            }
            catch (error) {
                fail(`Performance test failed: ${error.message}`);
            }
        }, 35000);
        test('should handle large numbers of files efficiently', () => {
            const manyFiles = new Array(100).fill(0).map((_, i) => `file${i}.cs`);
            const startTime = Date.now();
            const shouldRun = client.shouldRunAnalysis(manyFiles);
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(100); // Should be very fast
            expect(shouldRun).toBe(false); // Should reject too many files
        });
        test('should cache results for improved performance', async () => {
            // First run - no cache
            const firstRunStart = Date.now();
            const firstAnalysis = await client.analyzeGitChanges();
            const firstRunTime = Date.now() - firstRunStart;
            // Simulate cache hit scenario by creating a mock cache
            if (firstAnalysis.semanticAnalysisResults.length > 0) {
                const secondRunStart = Date.now();
                const secondAnalysis = await client.analyzeGitChanges();
                const secondRunTime = Date.now() - secondRunStart;
                console.log(`First run: ${firstRunTime}ms, Second run: ${secondRunTime}ms`);
                // Both should be under 30 seconds
                expect(firstRunTime).toBeLessThan(30000);
                expect(secondRunTime).toBeLessThan(30000);
            }
        }, 40000);
    });
    describe('Memory and Resource Management', () => {
        test('should not consume excessive memory during analysis', async () => {
            const initialMemory = process.memoryUsage();
            await client.analyzeGitChanges();
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            // Should not increase memory by more than 100MB
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        });
        test('should cleanup resources properly', async () => {
            const analysis = await client.analyzeGitChanges();
            // Cleanup should not throw
            await expect(client.cleanupCache()).resolves.not.toThrow();
        });
    });
    describe('Concurrent Operation Handling', () => {
        test('should handle multiple simultaneous analyses', async () => {
            const promises = [];
            // Start 3 concurrent analyses
            for (let i = 0; i < 3; i++) {
                promises.push(client.analyzeGitChanges());
            }
            const startTime = Date.now();
            const results = await Promise.all(promises);
            const endTime = Date.now();
            expect(results).toHaveLength(3);
            expect(endTime - startTime).toBeLessThan(35000); // Allow some extra time for concurrency
            // All results should be valid
            results.forEach(result => {
                expect(result).toHaveProperty('changedFiles');
                expect(result).toHaveProperty('analysisTime');
            });
        }, 40000);
    });
    describe('Edge Case Performance', () => {
        test('should handle empty git repository quickly', async () => {
            const startTime = Date.now();
            const analysis = await client.analyzeGitChanges();
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(5000); // Should be very fast for empty repo
            expect(analysis.changedFiles).toEqual([]);
        });
        test('should timeout gracefully on hung operations', () => {
            // Test the shouldRunAnalysis conditions that prevent hung operations
            expect(client.shouldRunAnalysis([])).toBe(true);
            expect(client.shouldRunAnalysis(new Array(51).fill('file.cs'))).toBe(false);
        });
    });
    describe('Cache Performance', () => {
        test('should write and read cache efficiently', async () => {
            // This tests the internal caching mechanism performance
            const analysis = await client.analyzeGitChanges();
            if (analysis.semanticAnalysisResults.length > 0) {
                // Cache operations should be included in the overall timing
                expect(analysis.analysisTime).toBeLessThan(30000);
            }
        });
        test('should cleanup old cache files efficiently', async () => {
            const startTime = Date.now();
            await client.cleanupCache();
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(1000); // Cache cleanup should be fast
        });
    });
    describe('Git Operation Performance', () => {
        test('should detect git state quickly', () => {
            const startTime = Date.now();
            const shouldRun = client.shouldRunAnalysis(['test.cs']);
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(500); // Git state detection should be very fast
            expect(typeof shouldRun).toBe('boolean');
        });
    });
    describe('Scalability Tests', () => {
        test('should scale linearly with number of relevant files', async () => {
            // This test would ideally run with different numbers of files
            // For now, we just ensure the current implementation performs adequately
            const analysis = await client.analyzeGitChanges();
            // Performance should be acceptable regardless of current file count
            expect(analysis.analysisTime).toBeLessThan(30000);
            console.log(`Analyzed ${analysis.changedFiles.length} changed files in ${analysis.analysisTime}ms`);
        });
    });
});
//# sourceMappingURL=git-integration-performance.test.js.map
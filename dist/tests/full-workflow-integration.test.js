import { HolisticUpdateOrchestrator } from '../services/holistic-update-orchestrator.js';
import { PathUtilities } from '../services/path-utilities.js';
import { RollbackManager } from '../services/rollback-manager.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
describe('Full Workflow Integration Tests', () => {
    let testProjectRoot;
    let orchestrator;
    let originalEnv;
    beforeAll(() => {
        originalEnv = { ...process.env };
    });
    beforeEach(() => {
        // Create unique test project structure
        testProjectRoot = path.join(os.tmpdir(), `integration-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        createTestProjectStructure(testProjectRoot);
        // Set up environment for testing
        process.env.PROJECT_ROOT = testProjectRoot;
        process.env.ATOMIC_OPS_DIR = path.join(testProjectRoot, '.test-atomic-ops');
        process.env.HOLISTIC_ROLLBACK_DIR = path.join(testProjectRoot, '.test-rollback');
        process.env.SEMANTIC_CACHE_DIR = path.join(testProjectRoot, '.test-semantic-cache');
        // Shorter timeouts for testing
        process.env.SEMANTIC_ANALYSIS_TIMEOUT = '5000';
        process.env.DOMAIN_ANALYSIS_TIMEOUT = '3000';
        process.env.CONTEXT_GENERATION_TIMEOUT = '4000';
        orchestrator = new HolisticUpdateOrchestrator(testProjectRoot);
    });
    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testProjectRoot)) {
            fs.rmSync(testProjectRoot, { recursive: true, force: true });
        }
        // Restore environment
        process.env = { ...originalEnv };
    });
    describe('End-to-End Context Generation', () => {
        test('should successfully process single file change', async () => {
            const testFile = path.join(testProjectRoot, 'Utility', 'Analysis', 'Fractal', 'TestAnalysis.cs');
            createTestCSharpFile(testFile, 'Analysis', 'Fractal analysis component');
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: [testFile],
                triggerType: 'manual',
                gitCommitHash: 'test-commit-123',
                performanceTimeout: 15
            });
            expect(result.success).toBe(true);
            expect(result.affectedDomains).toContain('Analysis');
            expect(result.executionTime).toBeGreaterThan(0);
            expect(result.performanceMetrics.semanticAnalysisTime).toBeGreaterThan(0);
        }, 20000);
        test('should handle multiple domain changes', async () => {
            const analysisFile = path.join(testProjectRoot, 'Utility', 'Analysis', 'Fractal', 'FractalAnalysis.cs');
            const dataFile = path.join(testProjectRoot, 'Utility', 'Data', 'Provider', 'DataProvider.cs');
            const messagingFile = path.join(testProjectRoot, 'Utility', 'Messaging', 'MessageHandler.cs');
            createTestCSharpFile(analysisFile, 'Analysis', 'Fractal analysis');
            createTestCSharpFile(dataFile, 'Data', 'Data provider');
            createTestCSharpFile(messagingFile, 'Messaging', 'Message handling');
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: [analysisFile, dataFile, messagingFile],
                triggerType: 'manual',
                performanceTimeout: 20
            });
            expect(result.success).toBe(true);
            expect(result.affectedDomains).toEqual(expect.arrayContaining(['Analysis', 'Data', 'Messaging']));
            expect(result.affectedDomains.length).toBe(3);
        }, 30000);
        test('should generate context files in correct locations', async () => {
            const testFile = path.join(testProjectRoot, 'Utility', 'Analysis', 'Indicator', 'RSI.cs');
            createTestCSharpFile(testFile, 'Analysis', 'RSI indicator implementation');
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: [testFile],
                triggerType: 'manual',
                performanceTimeout: 15
            });
            expect(result.success).toBe(true);
            // Check that context directory exists
            const expectedContextDir = await PathUtilities.resolveDomainContextPath('Analysis', testProjectRoot);
            expect(fs.existsSync(expectedContextDir)).toBe(true);
            // Verify at least some context files were created or updated
            expect(result.updatedFiles.length).toBeGreaterThan(0);
        }, 20000);
    });
    describe('Error Handling and Recovery', () => {
        test('should handle timeout gracefully', async () => {
            // Create a large number of files to trigger timeout
            const files = [];
            for (let i = 0; i < 50; i++) {
                const filePath = path.join(testProjectRoot, 'Utility', 'Analysis', `TestFile${i}.cs`);
                createTestCSharpFile(filePath, 'Analysis', `Test file ${i} with complex analysis code`);
                files.push(filePath);
            }
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: files,
                triggerType: 'manual',
                performanceTimeout: 2 // Very short timeout
            });
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.message).toContain('timed out');
        }, 10000);
        test('should create and manage rollback data', async () => {
            const testFile = path.join(testProjectRoot, 'Utility', 'Data', 'TestService.cs');
            createTestCSharpFile(testFile, 'Data', 'Test data service');
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: [testFile],
                triggerType: 'manual',
                performanceTimeout: 15
            });
            expect(result.success).toBe(true);
            expect(result.rollbackData).toBeDefined();
            expect(result.rollbackData?.updateId).toBe(result.updateId);
        }, 15000);
        test('should clean up rollbacks automatically', async () => {
            // Create rollback manager to test cleanup
            const rollbackManager = new RollbackManager(path.join(testProjectRoot, '.test-rollback'), {
                maxAge: 0.001, // 1ms for immediate cleanup
                maxCount: 1,
                cleanupTriggers: ['test-trigger'],
                aggressiveCleanup: false
            });
            // Create test rollback data
            await rollbackManager.createHolisticSnapshot('test-update-1', ['Analysis'], testProjectRoot);
            await rollbackManager.createHolisticSnapshot('test-update-2', ['Data'], testProjectRoot);
            // Wait a bit and then trigger cleanup
            await new Promise(resolve => setTimeout(resolve, 10));
            const cleanupResult = await rollbackManager.triggerCleanup('test-trigger');
            expect(cleanupResult.removedCount).toBeGreaterThan(0);
        }, 10000);
    });
    describe('Performance and Scalability', () => {
        test('should handle reasonable file counts efficiently', async () => {
            const files = [];
            const domains = ['Analysis', 'Data', 'Messaging'];
            // Create 15 files across 3 domains (5 each)
            for (let domain of domains) {
                for (let i = 0; i < 5; i++) {
                    const filePath = path.join(testProjectRoot, 'Utility', domain, `Service${i}.cs`);
                    createTestCSharpFile(filePath, domain, `${domain} service ${i}`);
                    files.push(filePath);
                }
            }
            const startTime = Date.now();
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: files,
                triggerType: 'manual',
                performanceTimeout: 30
            });
            const totalTime = Date.now() - startTime;
            expect(result.success).toBe(true);
            expect(result.affectedDomains).toEqual(expect.arrayContaining(domains));
            expect(totalTime).toBeLessThan(25000); // Should complete in under 25 seconds
        }, 35000);
        test('should provide meaningful performance metrics', async () => {
            const testFile = path.join(testProjectRoot, 'Utility', 'Analysis', 'PerformanceTest.cs');
            createTestCSharpFile(testFile, 'Analysis', 'Performance testing component');
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: [testFile],
                triggerType: 'manual',
                performanceTimeout: 15
            });
            expect(result.success).toBe(true);
            expect(result.performanceMetrics).toBeDefined();
            expect(result.performanceMetrics.semanticAnalysisTime).toBeGreaterThan(0);
            expect(result.performanceMetrics.domainAnalysisTime).toBeGreaterThan(0);
            // Verify metrics add up reasonably
            const totalMetricsTime = Object.values(result.performanceMetrics).reduce((sum, time) => sum + time, 0);
            expect(totalMetricsTime).toBeLessThanOrEqual(result.executionTime * 1.1); // Allow 10% variance
        }, 20000);
    });
    describe('Path Resolution Integration', () => {
        test('should handle mixed case paths correctly', async () => {
            // Create file with mixed case path
            const mixedCaseFile = path.join(testProjectRoot, 'UTILITY', 'analysis', 'FRACTAL', 'MixedCase.cs');
            // Ensure directory exists with mixed case
            fs.mkdirSync(path.dirname(mixedCaseFile), { recursive: true });
            createTestCSharpFile(mixedCaseFile, 'Analysis', 'Mixed case path test');
            const result = await orchestrator.executeHolisticUpdate({
                changedFiles: [mixedCaseFile],
                triggerType: 'manual',
                performanceTimeout: 15
            });
            // Should still work despite case differences
            expect(result.success).toBe(true);
        }, 15000);
        test('should resolve project root correctly', async () => {
            const resolvedRoot = await PathUtilities.getProjectRoot();
            expect(resolvedRoot).toBe(testProjectRoot);
        });
    });
    describe('Configuration Integration', () => {
        test('should respect environment timeout configurations', async () => {
            // Set very short timeout for semantic analysis
            process.env.SEMANTIC_ANALYSIS_TIMEOUT = '100'; // 100ms
            const orchestratorWithShortTimeout = new HolisticUpdateOrchestrator(testProjectRoot);
            const testFile = path.join(testProjectRoot, 'Utility', 'Analysis', 'TimeoutTest.cs');
            createTestCSharpFile(testFile, 'Analysis', 'Timeout test file');
            const result = await orchestratorWithShortTimeout.executeHolisticUpdate({
                changedFiles: [testFile],
                triggerType: 'manual',
                performanceTimeout: 5
            });
            // Should timeout due to very short semantic analysis timeout
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('timed out');
        }, 10000);
    });
    // Helper functions for creating test data
    function createTestProjectStructure(rootPath) {
        const directories = [
            'Utility/Analysis/Fractal',
            'Utility/Analysis/Indicator',
            'Utility/Analysis/Inflection',
            'Utility/Data/Provider',
            'Utility/Data/Ticker',
            'Utility/Messaging',
            'Console',
            'TestSuite'
        ];
        for (const dir of directories) {
            fs.mkdirSync(path.join(rootPath, dir), { recursive: true });
        }
        // Create basic project files
        fs.writeFileSync(path.join(rootPath, 'Lucidwonks.sln'), 'Microsoft Visual Studio Solution File, Format Version 12.00\n');
        fs.writeFileSync(path.join(rootPath, 'Directory.Packages.props'), '<?xml version="1.0" encoding="utf-8"?>\n<Project></Project>\n');
    }
    function createTestCSharpFile(filePath, domain, description) {
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        const className = path.basename(filePath, '.cs');
        const namespaceName = `Lucidwonks.${domain}`;
        const content = `using System;

namespace ${namespaceName}
{
    /// <summary>
    /// ${description}
    /// Business Rule: This component handles ${domain} domain operations
    /// Integration Point: Connects with ${domain} data layer
    /// </summary>
    public class ${className}
    {
        /// <summary>
        /// Process ${domain} data
        /// </summary>
        /// <returns>Processing result</returns>
        public string Process()
        {
            // ${description}
            return "Processed ${domain} data";
        }
        
        /// <summary>
        /// Validate ${domain} input
        /// Business Rule: All ${domain} inputs must be validated before processing
        /// </summary>
        /// <param name="input">Input to validate</param>
        /// <returns>True if valid</returns>
        public bool Validate(string input)
        {
            return !string.IsNullOrEmpty(input);
        }
    }
}`;
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
//# sourceMappingURL=full-workflow-integration.test.js.map
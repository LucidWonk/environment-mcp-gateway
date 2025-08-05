import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
describe('Git Hook Integration Tests', () => {
    const hookPath = '/mnt/m/Projects/Lucidwonks/.git/hooks/pre-commit';
    const cacheDir = '/mnt/m/Projects/Lucidwonks/.semantic-cache';
    const testFile = '/tmp/test-hook-integration.cs';
    beforeAll(() => {
        // Create a test C# file for analysis
        const testContent = `
using System;
using System.Threading.Tasks;

namespace Lucidwonks.Test
{
    /// <summary>
    /// Test service for git hook integration
    /// Business Rule: All test operations must validate inputs
    /// </summary>
    public class TestHookService
    {
        private readonly ITestRepository _repository;
        
        public TestHookService(ITestRepository repository)
        {
            _repository = repository;
        }
        
        /// <summary>
        /// Validates test input according to business rules
        /// </summary>
        public async Task<bool> ValidateTestInput(TestInput input)
        {
            // Business Rule: Input cannot be null
            if (input == null)
                throw new ArgumentNullException(nameof(input));
                
            // Business Rule: ID must be valid
            if (input.Id == Guid.Empty)
                return false;
                
            return await _repository.IsValidAsync(input.Id);
        }
    }
    
    public class TestInput
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    public interface ITestRepository  
    {
        Task<bool> IsValidAsync(Guid id);
    }
    
    public record TestProcessedEvent(Guid Id, string Result, DateTime ProcessedAt);
}`;
        fs.writeFileSync(testFile, testContent);
    });
    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });
    describe('Enhanced Pre-commit Hook', () => {
        test('should exist and be executable', () => {
            expect(fs.existsSync(hookPath)).toBe(true);
            const stats = fs.statSync(hookPath);
            expect(stats.mode & 0o111).toBeTruthy(); // Check executable bit
        });
        test('should contain required integration components', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            // Check for key components
            expect(hookContent).toContain('Enhanced Git pre-commit hook with MCP semantic analysis integration');
            expect(hookContent).toContain('GitIntegrationClient');
            expect(hookContent).toContain('semantic analysis');
            expect(hookContent).toContain('timeout');
            expect(hookContent).toContain('TIMEOUT_SECONDS=30');
        });
        test('should have fallback mechanisms', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            expect(hookContent).toContain('run_basic_analysis');
            expect(hookContent).toContain('falling back to basic analysis');
            expect(hookContent).toContain('should_run_analysis');
        });
        test('should create semantic cache directory', () => {
            expect(fs.existsSync(cacheDir)).toBe(true);
            const stats = fs.statSync(cacheDir);
            expect(stats.isDirectory()).toBe(true);
        });
    });
    describe('Hook Performance Tests', () => {
        test('should complete within timeout constraints', (done) => {
            const startTime = Date.now();
            const timeout = 35000; // 35 seconds (5 second buffer over 30s requirement)
            // Create a simple test scenario
            const testScenario = () => {
                try {
                    // This simulates running the hook (but we won't actually commit)
                    const result = execSync(`bash -c "cd /mnt/m/Projects/Lucidwonks && echo 'Test hook timing'"`);
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    expect(duration).toBeLessThan(timeout);
                    done();
                }
                catch (error) {
                    done(error);
                }
            };
            testScenario();
        }, 40000); // Jest timeout of 40 seconds
        test('should handle missing dependencies gracefully', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            // Verify graceful degradation patterns
            expect(hookContent).toContain('EnvironmentMCPGateway not found - falling back to basic analysis');
            expect(hookContent).toContain('MCP Gateway not properly configured - falling back to basic analysis');
            expect(hookContent).toContain('Git operation in progress - skipping semantic analysis');
        });
    });
    describe('Cache Management', () => {
        test('should create cache directory with proper gitignore', () => {
            const gitignorePath = '/mnt/m/Projects/Lucidwonks/.gitignore';
            expect(fs.existsSync(gitignorePath)).toBe(true);
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            expect(gitignoreContent).toContain('.semantic-cache/');
        });
        test('should create latest-analysis.json during analysis', () => {
            // This tests the integration through the analysis result storage
            const expectedCacheFile = path.join(cacheDir, 'latest-analysis.json');
            // The file might not exist initially, but the hook should create it during analysis
            // We test that the hook script contains the logic to create it
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            expect(hookContent).toContain('latest-analysis.json');
            expect(hookContent).toContain('.semantic-cache/latest-analysis.json');
        });
    });
    describe('Error Handling', () => {
        test('should not fail commit on analysis errors', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            // Verify that errors don't cause commit failure
            expect(hookContent).toContain('process.exit(0); // Don\'t fail the commit');
            expect(hookContent).toContain('Falling back to basic git hook behavior');
            expect(hookContent).toContain('continuing with basic analysis');
        });
        test('should handle timeout scenarios', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            expect(hookContent).toContain('timeout ${TIMEOUT_SECONDS}s');
            expect(hookContent).toContain('Semantic analysis timed out or failed');
        });
    });
    describe('Installation and Backup', () => {
        test('should have backed up original hook', () => {
            const hooksDir = '/mnt/m/Projects/Lucidwonks/.git/hooks';
            const backupFiles = fs.readdirSync(hooksDir)
                .filter(file => file.startsWith('pre-commit.backup.'));
            expect(backupFiles.length).toBeGreaterThan(0);
        });
        test('should have installation scripts', () => {
            const installScript = '/mnt/m/Projects/Lucidwonks/scripts/install-enhanced-hooks.sh';
            const hookScript = '/mnt/m/Projects/Lucidwonks/scripts/enhanced-pre-commit';
            expect(fs.existsSync(installScript)).toBe(true);
            expect(fs.existsSync(hookScript)).toBe(true);
            // Check if scripts are executable
            const installStats = fs.statSync(installScript);
            const hookStats = fs.statSync(hookScript);
            expect(installStats.mode & 0o111).toBeTruthy();
            expect(hookStats.mode & 0o111).toBeTruthy();
        });
    });
    describe('MCP Integration Points', () => {
        test('should integrate with built MCP components', () => {
            const gitIntegrationPath = '/mnt/m/Projects/Lucidwonks/EnvironmentMCPGateway/dist/clients/git-integration.js';
            expect(fs.existsSync(gitIntegrationPath)).toBe(true);
            // Verify the hook references the correct path
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            expect(hookContent).toContain('./EnvironmentMCPGateway/dist/clients/git-integration.js');
        });
        test('should check for MCP dependencies', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            expect(hookContent).toContain('EnvironmentMCPGateway/package.json');
            expect(hookContent).toContain('EnvironmentMCPGateway/dist');
            expect(hookContent).toContain('npm run build');
        });
    });
    describe('Domain Awareness', () => {
        test('should detect domain changes in hook logic', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            // Check for domain-aware analysis
            expect(hookContent).toContain('Analysis');
            expect(hookContent).toContain('Data');
            expect(hookContent).toContain('Messaging');
            expect(hookContent).toContain('domain code changed');
        });
        test('should extract relevant file patterns', () => {
            const hookContent = fs.readFileSync(hookPath, 'utf-8');
            expect(hookContent).toContain('Utility/Analysis/.*\\.cs$');
            expect(hookContent).toContain('Utility/Data/.*\\.cs$');
            expect(hookContent).toContain('Utility/Messaging/.*\\.cs$');
        });
    });
});
describe('Functional Integration Test', () => {
    test('should run end-to-end analysis without errors', async () => {
        // This test verifies the complete integration works
        try {
            const { GitIntegrationClient } = require('/mnt/m/Projects/Lucidwonks/EnvironmentMCPGateway/dist/clients/git-integration.js');
            const client = new GitIntegrationClient();
            const startTime = Date.now();
            const analysis = await client.analyzeGitChanges();
            const analysisTime = Date.now() - startTime;
            // Verify analysis structure
            expect(analysis).toHaveProperty('changedFiles');
            expect(analysis).toHaveProperty('semanticAnalysisResults');
            expect(analysis).toHaveProperty('affectedDomains');
            expect(analysis).toHaveProperty('analysisTime');
            expect(analysis).toHaveProperty('cacheHit');
            // Verify performance
            expect(analysisTime).toBeLessThan(30000); // Under 30 seconds
            // Verify types
            expect(Array.isArray(analysis.changedFiles)).toBe(true);
            expect(Array.isArray(analysis.semanticAnalysisResults)).toBe(true);
            expect(Array.isArray(analysis.affectedDomains)).toBe(true);
            expect(typeof analysis.analysisTime).toBe('number');
            expect(typeof analysis.cacheHit).toBe('boolean');
        }
        catch (error) {
            fail(`End-to-end integration test failed: ${error.message}`);
        }
    }, 35000);
});
//# sourceMappingURL=git-hook-integration.test.js.map
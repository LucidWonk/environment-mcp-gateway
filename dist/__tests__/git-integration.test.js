import { GitIntegrationClient } from '../clients/git-integration';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
// Mock the child_process module
jest.mock('child_process');
const mockExecSync = execSync;
// Mock the fs module
jest.mock('fs');
const mockFs = fs;
// Mock winston logger
jest.mock('winston', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
    format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        errors: jest.fn(),
        json: jest.fn(),
    },
    transports: {
        Console: jest.fn(),
        File: jest.fn(),
    },
}));
// Mock the semantic analysis service
jest.mock('../services/semantic-analysis', () => ({
    SemanticAnalysisService: jest.fn().mockImplementation(() => ({
        analyzeCodeChanges: jest.fn(),
    })),
}));
describe('GitIntegrationClient', () => {
    let client;
    let mockSemanticAnalysis;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        mockFs.existsSync.mockReturnValue(true);
        mockFs.mkdirSync.mockReturnValue(undefined);
        mockFs.readFileSync.mockReturnValue('mock file content');
        mockFs.writeFileSync.mockReturnValue(undefined);
        mockFs.readdirSync.mockReturnValue([]);
        mockFs.statSync.mockReturnValue({
            mtime: new Date(),
            mode: 0o755
        });
        mockExecSync.mockReturnValue('test.cs\ntest.ts\n');
        client = new GitIntegrationClient();
        mockSemanticAnalysis = client.semanticAnalysis;
    });
    describe('constructor', () => {
        test('should create instance and ensure cache directory exists', () => {
            expect(client).toBeDefined();
            expect(mockFs.existsSync).toHaveBeenCalledWith('.semantic-cache');
            expect(mockFs.mkdirSync).toHaveBeenCalledWith('.semantic-cache', { recursive: true });
        });
    });
    describe('analyzeGitChanges', () => {
        test('should return empty analysis when no files changed', async () => {
            mockExecSync.mockReturnValue('');
            const result = await client.analyzeGitChanges();
            expect(result.changedFiles).toEqual([]);
            expect(result.semanticAnalysisResults).toEqual([]);
            expect(result.affectedDomains).toEqual([]);
            expect(result.analysisTime).toBeGreaterThan(0);
            expect(result.cacheHit).toBe(false);
        });
        test('should analyze changed files and return results', async () => {
            // Mock git commands
            mockExecSync
                .mockReturnValueOnce('test.cs\ntest.ts\n') // staged files
                .mockReturnValueOnce('test2.js\n') // modified files
                .mockReturnValueOnce('/mnt/m/Projects/Lucidwonks'); // git root
            // Mock semantic analysis results
            const mockAnalysisResult = {
                filePath: '/mnt/m/Projects/Lucidwonks/test.cs',
                language: 'C#',
                businessConcepts: [{
                        name: 'TestService',
                        type: 'Service',
                        domain: 'Analysis',
                        confidence: 0.85,
                        context: 'public class TestService'
                    }],
                businessRules: [{
                        id: 'BR-test-1',
                        description: 'Test validation rule',
                        domain: 'Analysis',
                        sourceLocation: 'test.cs:10',
                        conditions: ['input != null'],
                        actions: ['throw exception'],
                        confidence: 0.75
                    }],
                domainContext: 'Analysis',
                analysisTime: 100
            };
            mockSemanticAnalysis.analyzeCodeChanges.mockResolvedValue([mockAnalysisResult]);
            const result = await client.analyzeGitChanges();
            expect(result.changedFiles).toHaveLength(3); // test.cs, test.ts, test2.js
            expect(result.semanticAnalysisResults).toHaveLength(1);
            expect(result.affectedDomains).toContain('Analysis');
            expect(result.analysisTime).toBeGreaterThan(0);
        });
        test('should handle semantic analysis errors gracefully', async () => {
            mockExecSync
                .mockReturnValueOnce('test.cs\n')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('/mnt/m/Projects/Lucidwonks');
            mockSemanticAnalysis.analyzeCodeChanges.mockRejectedValue(new Error('Analysis failed'));
            const result = await client.analyzeGitChanges();
            expect(result.changedFiles).toHaveLength(1);
            expect(result.semanticAnalysisResults).toHaveLength(0);
            expect(result.analysisTime).toBeGreaterThan(0);
        });
    });
    describe('shouldRunAnalysis', () => {
        test('should return false for too many files', () => {
            const manyFiles = new Array(60).fill('file.cs');
            expect(client.shouldRunAnalysis(manyFiles)).toBe(false);
        });
        test('should return true for reasonable number of files', () => {
            const reasonableFiles = ['file1.cs', 'file2.ts', 'file3.js'];
            expect(client.shouldRunAnalysis(reasonableFiles)).toBe(true);
        });
        test('should return false during git operations', () => {
            mockFs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('MERGE_HEAD'))
                    return true;
                return false;
            });
            mockExecSync.mockReturnValue('/mnt/m/Projects/Lucidwonks/.git');
            const result = client.shouldRunAnalysis(['file1.cs']);
            expect(result).toBe(false);
        });
    });
    describe('caching functionality', () => {
        test('should cache analysis results', async () => {
            const mockResult = {
                filePath: '/test/file.cs',
                language: 'C#',
                businessConcepts: [],
                businessRules: [],
                domainContext: 'Test',
                analysisTime: 50
            };
            // Test the private cacheAnalysis method through analyzeGitChanges
            mockExecSync
                .mockReturnValueOnce('file.cs\n')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('/test');
            mockSemanticAnalysis.analyzeCodeChanges.mockResolvedValue([mockResult]);
            await client.analyzeGitChanges();
            expect(mockFs.writeFileSync).toHaveBeenCalled();
        });
        test('should use cached results when available', async () => {
            const mockCacheData = {
                fileHash: 'testhash',
                lastModified: Date.now(),
                analysisResult: {
                    filePath: '/test/file.cs',
                    language: 'C#',
                    businessConcepts: [],
                    businessRules: [],
                    domainContext: 'Test',
                    analysisTime: 50
                }
            };
            mockFs.readFileSync.mockReturnValue(JSON.stringify(mockCacheData));
            mockFs.statSync.mockReturnValue({
                mtime: new Date(mockCacheData.lastModified - 1000)
            });
            mockExecSync
                .mockReturnValueOnce('file.cs\n')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('/test');
            const result = await client.analyzeGitChanges();
            expect(result.cacheHit).toBe(true);
            expect(mockSemanticAnalysis.analyzeCodeChanges).not.toHaveBeenCalled();
        });
    });
    describe('cleanupCache', () => {
        test('should clean up expired cache files', async () => {
            const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            mockFs.readdirSync.mockReturnValue(['old-cache.json', 'new-cache.json']);
            mockFs.statSync
                .mockReturnValueOnce({ mtime: new Date(oldTime) }) // old file
                .mockReturnValueOnce({ mtime: new Date() }); // new file
            await client.cleanupCache();
            expect(mockFs.unlinkSync).toHaveBeenCalledTimes(1);
            expect(mockFs.unlinkSync).toHaveBeenCalledWith(path.join('.semantic-cache', 'old-cache.json'));
        });
        test('should handle cleanup errors gracefully', async () => {
            mockFs.readdirSync.mockImplementation(() => {
                throw new Error('Directory read failed');
            });
            await expect(client.cleanupCache()).resolves.not.toThrow();
        });
    });
    describe('file filtering', () => {
        test('should filter relevant files correctly', async () => {
            const testFiles = [
                '/path/test.cs',
                '/path/test.ts',
                '/path/test.js',
                '/path/test.txt', // should be filtered out
                '/path/test.md' // should be filtered out
            ];
            mockExecSync
                .mockReturnValueOnce(testFiles.join('\n'))
                .mockReturnValueOnce('')
                .mockReturnValueOnce('/path');
            // Mock file existence for relevant files only
            mockFs.existsSync.mockImplementation((filePath) => {
                const relevantExtensions = ['.cs', '.ts', '.js'];
                return relevantExtensions.some(ext => filePath.endsWith(ext)) ||
                    filePath === '.semantic-cache';
            });
            mockSemanticAnalysis.analyzeCodeChanges.mockResolvedValue([]);
            const result = await client.analyzeGitChanges();
            // Should analyze 3 relevant files, not all 5
            expect(mockSemanticAnalysis.analyzeCodeChanges).toHaveBeenCalledWith(expect.arrayContaining([
                expect.stringContaining('.cs'),
                expect.stringContaining('.ts'),
                expect.stringContaining('.js')
            ]));
        });
    });
    describe('domain detection', () => {
        test('should detect affected domains from analysis results', async () => {
            const mockResults = [
                {
                    filePath: '/test/analysis.cs',
                    language: 'C#',
                    businessConcepts: [{
                            name: 'AnalysisService',
                            type: 'Service',
                            domain: 'Analysis',
                            confidence: 0.9,
                            context: 'analysis service'
                        }],
                    businessRules: [],
                    domainContext: 'Analysis',
                    analysisTime: 50
                },
                {
                    filePath: '/test/data.cs',
                    language: 'C#',
                    businessConcepts: [{
                            name: 'DataRepository',
                            type: 'Repository',
                            domain: 'Data',
                            confidence: 0.85,
                            context: 'data repository'
                        }],
                    businessRules: [],
                    domainContext: 'Data',
                    analysisTime: 75
                }
            ];
            mockExecSync
                .mockReturnValueOnce('analysis.cs\ndata.cs\n')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('/test');
            mockSemanticAnalysis.analyzeCodeChanges.mockResolvedValue(mockResults);
            const result = await client.analyzeGitChanges();
            expect(result.affectedDomains).toContain('Analysis');
            expect(result.affectedDomains).toContain('Data');
            expect(result.affectedDomains).toHaveLength(2);
        });
    });
});
//# sourceMappingURL=git-integration.test.js.map
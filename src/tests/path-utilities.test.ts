import { PathUtilities } from '../services/path-utilities.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PathUtilities', () => {
    let testDir: string;
    const originalEnv = process.env;

    beforeEach(() => {
        // Create unique test directory
        testDir = path.join(os.tmpdir(), `path-utils-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        fs.mkdirSync(testDir, { recursive: true });
        
        // Reset environment
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        
        // Restore environment
        process.env = originalEnv;
    });

    describe('Path Resolution', () => {
        test('should resolve existing path correctly', async () => {
            const existingPath = testDir;
            
            const result = await PathUtilities.resolvePath(existingPath);
            
            expect(result.exists).toBe(true);
            expect(result.isDirectory).toBe(true);
            expect(result.resolvedPath).toBe(path.resolve(existingPath));
            expect(result.caseMatchIssues).toHaveLength(0);
        });

        test('should handle non-existent path', async () => {
            const nonExistentPath = path.join(testDir, 'does-not-exist');
            
            const result = await PathUtilities.resolvePath(nonExistentPath);
            
            expect(result.exists).toBe(false);
            expect(result.resolvedPath).toBe(path.resolve(nonExistentPath));
        });

        test('should throw when requireExists is true for non-existent path', async () => {
            const nonExistentPath = path.join(testDir, 'does-not-exist');
            
            await expect(
                PathUtilities.resolvePath(nonExistentPath, { requireExists: true })
            ).rejects.toThrow('Required path does not exist');
        });

        test('should create missing directory when createIfMissing is true', async () => {
            const newDirPath = path.join(testDir, 'new-directory');
            
            const result = await PathUtilities.resolvePath(newDirPath, {
                requireDirectory: true,
                createIfMissing: true
            });
            
            expect(result.exists).toBe(true);
            expect(result.isDirectory).toBe(true);
            expect(fs.existsSync(newDirPath)).toBe(true);
        });
    });

    describe('Alternative Path Discovery', () => {
        test('should find alternative paths using environment variables', async () => {
            process.env.PROJECT_ROOT = '/workspace';
            process.env.GIT_REPO_PATH = '/mnt/m/Projects/Lucidwonks';
            
            const inputPath = '/non-existent/path';
            
            const result = await PathUtilities.resolvePath(inputPath, { logIssues: false });
            
            expect(result.alternativePaths.length).toBeGreaterThan(0);
            expect(result.alternativePaths).toContain('/workspace/path');
        });

        test('should handle common path mappings', async () => {
            const workspacePath = '/workspace/some/subpath';
            
            const result = await PathUtilities.resolvePath(workspacePath, { logIssues: false });
            
            expect(result.alternativePaths).toContain('/mnt/m/Projects/Lucidwonks/some/subpath');
            expect(result.alternativePaths).toContain('/mnt/m/projects/lucidwonks/some/subpath');
        });
    });

    describe('Case Sensitivity Handling', () => {
        test('should find case variations on case-sensitive platforms', async () => {
            // Create directory with specific casing
            const correctCasePath = path.join(testDir, 'TestDirectory');
            fs.mkdirSync(correctCasePath);
            
            // Try to access with different casing
            const wrongCasePath = path.join(testDir, 'testdirectory');
            
            const result = await PathUtilities.resolvePath(wrongCasePath, { 
                caseSensitive: true,
                logIssues: false 
            });
            
            if (process.platform !== 'win32') {
                expect(result.caseMatchIssues.length).toBeGreaterThan(0);
            }
        });

        test('should handle mixed case project names', async () => {
            const variations = await PathUtilities['findCaseVariations']('/test/lucidwonks/project');
            
            expect(variations).toContain('/test/Lucidwonks/project');
            expect(variations).toContain('/test/LUCIDWONKS/project');
        });
    });

    describe('Project Root Resolution', () => {
        test('should resolve project root from environment variables', async () => {
            // Create mock project structure
            const mockProjectRoot = path.join(testDir, 'mock-project');
            fs.mkdirSync(mockProjectRoot, { recursive: true });
            
            process.env.PROJECT_ROOT = mockProjectRoot;
            
            const projectRoot = await PathUtilities.getProjectRoot();
            
            expect(projectRoot).toBe(mockProjectRoot);
        });

        test('should fallback through project root candidates', async () => {
            // Clear environment variables that might interfere
            delete process.env.PROJECT_ROOT;
            delete process.env.GIT_REPO_PATH;
            
            // Should fallback to process.cwd() which should exist
            const projectRoot = await PathUtilities.getProjectRoot();
            
            expect(fs.existsSync(projectRoot)).toBe(true);
        });

        test('should throw when no valid project root found', async () => {
            // Mock all potential paths to not exist
            const originalMethods = {
                resolvePath: PathUtilities.resolvePath
            };
            
            // Mock resolvePath to always return non-existent
            jest.spyOn(PathUtilities, 'resolvePath').mockImplementation(async () => ({
                resolvedPath: '/non-existent',
                exists: false,
                isDirectory: false,
                caseMatchIssues: [],
                alternativePaths: []
            }));
            
            await expect(PathUtilities.getProjectRoot()).rejects.toThrow('Could not resolve project root');
            
            // Restore original methods
            jest.restoreAllMocks();
        });
    });

    describe('Domain Context Path Resolution', () => {
        test('should resolve domain context path correctly', async () => {
            const mockProjectRoot = testDir;
            const domain = 'Analysis';
            
            const contextPath = await PathUtilities.resolveDomainContextPath(domain, mockProjectRoot);
            
            expect(contextPath).toBe(path.join(mockProjectRoot, domain, '.context'));
            expect(fs.existsSync(contextPath)).toBe(true); // Should be created
        });

        test('should use project root when not provided', async () => {
            process.env.PROJECT_ROOT = testDir;
            const domain = 'Data';
            
            const contextPath = await PathUtilities.resolveDomainContextPath(domain);
            
            expect(contextPath).toContain(testDir);
            expect(contextPath).toContain(path.join(domain, '.context'));
        });
    });

    describe('Path Normalization', () => {
        test('should normalize Windows-style paths', () => {
            const windowsPath = 'C:\\Projects\\Lucidwonks\\file.txt';
            const normalized = PathUtilities.normalizePath(windowsPath);
            
            expect(normalized).toBe('C:/Projects/Lucidwonks/file.txt');
        });

        test('should handle mixed separators', () => {
            const mixedPath = '/workspace\\subfolder/file.txt';
            const normalized = PathUtilities.normalizePath(mixedPath);
            
            expect(normalized).toBe('/workspace/subfolder/file.txt');
        });

        test('should handle relative paths', () => {
            const relativePath = '../parent/./current/../file.txt';
            const normalized = PathUtilities.normalizePath(relativePath);
            
            expect(normalized).toBe('../parent/file.txt');
        });
    });

    describe('Path Diagnostics', () => {
        test('should provide comprehensive diagnostic information', async () => {
            const diagnostics = await PathUtilities.getDiagnostics(testDir);
            
            expect(diagnostics).toHaveProperty('inputPath', testDir);
            expect(diagnostics).toHaveProperty('resolvedPath');
            expect(diagnostics).toHaveProperty('exists', true);
            expect(diagnostics).toHaveProperty('isDirectory', true);
            expect(diagnostics).toHaveProperty('platformInfo');
            expect(diagnostics).toHaveProperty('environmentPaths');
            expect(diagnostics).toHaveProperty('timestamp');
            
            expect(diagnostics.platformInfo).toHaveProperty('platform');
            expect(diagnostics.platformInfo).toHaveProperty('caseSensitive');
            expect(diagnostics.platformInfo).toHaveProperty('pathSeparator');
        });

        test('should include environment path information', async () => {
            process.env.PROJECT_ROOT = '/workspace';
            process.env.GIT_REPO_PATH = '/git/repo';
            
            const diagnostics = await PathUtilities.getDiagnostics('/test/path');
            
            expect(diagnostics.environmentPaths.PROJECT_ROOT).toBe('/workspace');
            expect(diagnostics.environmentPaths.GIT_REPO_PATH).toBe('/git/repo');
        });
    });

    describe('Error Handling', () => {
        test('should handle permission errors gracefully', async () => {
            // This test might be platform-specific
            const restrictedPath = '/root/restricted'; // Typically not accessible
            
            const result = await PathUtilities.resolvePath(restrictedPath, { 
                logIssues: false 
            });
            
            expect(result.exists).toBe(false);
            // Should not throw, should handle gracefully
        });

        test('should throw appropriate errors for validation failures', async () => {
            const filePath = path.join(testDir, 'test-file.txt');
            fs.writeFileSync(filePath, 'test content');
            
            await expect(
                PathUtilities.resolvePath(filePath, { 
                    requireDirectory: true,
                    requireExists: true 
                })
            ).rejects.toThrow('Path exists but is not a directory');
        });
    });

    describe('Docker Environment Handling', () => {
        test('should handle Docker volume mount paths', async () => {
            process.env.PROJECT_ROOT = '/workspace';
            
            const hostPath = '/mnt/m/Projects/Lucidwonks/some/file';
            
            const result = await PathUtilities.resolvePath(hostPath, { logIssues: false });
            
            expect(result.alternativePaths).toContain('/workspace/some/file');
        });

        test('should map between container and host paths', async () => {
            const containerPath = '/workspace/Analysis/.context';
            
            const result = await PathUtilities.resolvePath(containerPath, { logIssues: false });
            
            expect(result.alternativePaths).toContain('/mnt/m/Projects/Lucidwonks/Analysis/.context');
            expect(result.alternativePaths).toContain('/mnt/m/projects/lucidwonks/Analysis/.context');
        });
    });
});
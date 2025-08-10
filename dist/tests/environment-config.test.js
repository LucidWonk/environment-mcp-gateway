import { Environment } from '../domain/config/environment.js';
describe('Environment Configuration', () => {
    const originalEnv = process.env;
    beforeEach(() => {
        // Reset process.env for each test
        process.env = { ...originalEnv };
    });
    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });
    describe('Project Root Path Resolution', () => {
        test('should use PROJECT_ROOT when available (Docker environment)', () => {
            process.env.PROJECT_ROOT = '/workspace';
            delete process.env.GIT_REPO_PATH;
            expect(Environment.projectRoot).toBe('/workspace');
            expect(Environment.gitRepoPath).toBe('/workspace');
        });
        test('should fallback to GIT_REPO_PATH when PROJECT_ROOT not available', () => {
            delete process.env.PROJECT_ROOT;
            process.env.GIT_REPO_PATH = '/mnt/m/projects/lucidwonks';
            expect(Environment.projectRoot).toBe('/mnt/m/projects/lucidwonks');
            expect(Environment.gitRepoPath).toBe('/mnt/m/projects/lucidwonks');
        });
        test('should use default path when neither PROJECT_ROOT nor GIT_REPO_PATH available', () => {
            delete process.env.PROJECT_ROOT;
            delete process.env.GIT_REPO_PATH;
            const expectedDefault = '/mnt/m/Projects/Lucidwonks';
            expect(Environment.projectRoot).toBe(expectedDefault);
            expect(Environment.gitRepoPath).toBe(expectedDefault);
        });
        test('should prefer PROJECT_ROOT over GIT_REPO_PATH when both available', () => {
            process.env.PROJECT_ROOT = '/workspace';
            process.env.GIT_REPO_PATH = '/mnt/m/projects/lucidwonks';
            expect(Environment.projectRoot).toBe('/workspace');
            expect(Environment.gitRepoPath).toBe('/workspace');
        });
    });
    describe('Path Consistency', () => {
        test('solution path should use consistent project root', () => {
            process.env.PROJECT_ROOT = '/workspace';
            expect(Environment.solutionPath).toBe('/workspace/Lucidwonks.sln');
        });
        test('docker compose path should use consistent project root', () => {
            process.env.PROJECT_ROOT = '/workspace';
            expect(Environment.dockerComposeFile).toBe('/workspace/docker-compose.yml');
        });
        test('all paths should be consistent across getters', () => {
            process.env.PROJECT_ROOT = '/test/path';
            const projectRoot = Environment.projectRoot;
            const gitRepoPath = Environment.gitRepoPath;
            const solutionPath = Environment.solutionPath;
            const dockerComposePath = Environment.dockerComposeFile;
            // All should use the same root
            expect(gitRepoPath).toBe(projectRoot);
            expect(solutionPath).toBe(`${projectRoot}/Lucidwonks.sln`);
            expect(dockerComposePath).toBe(`${projectRoot}/docker-compose.yml`);
        });
    });
    describe('Environment Info', () => {
        test('should include projectRoot in environment info', () => {
            process.env.PROJECT_ROOT = '/workspace';
            const info = Environment.getEnvironmentInfo();
            expect(info.projectRoot).toBe('/workspace');
            expect(info.gitRepoPath).toBe('/workspace');
            expect(info.solutionPath).toBe('/workspace/Lucidwonks.sln');
            expect(info.dockerComposeFile).toBe('/workspace/docker-compose.yml');
        });
    });
    describe('Path Case Sensitivity Handling', () => {
        test('should handle mixed case paths consistently', () => {
            process.env.PROJECT_ROOT = '/WorkSpace';
            // Should preserve the case provided
            expect(Environment.projectRoot).toBe('/WorkSpace');
            expect(Environment.solutionPath).toBe('/WorkSpace/Lucidwonks.sln');
        });
        test('should handle Windows-style paths in environment variables', () => {
            process.env.PROJECT_ROOT = 'C:\\Projects\\Lucidwonks';
            expect(Environment.projectRoot).toBe('C:\\Projects\\Lucidwonks');
            expect(Environment.solutionPath).toContain('C:\\Projects\\Lucidwonks');
        });
    });
});
//# sourceMappingURL=environment-config.test.js.map
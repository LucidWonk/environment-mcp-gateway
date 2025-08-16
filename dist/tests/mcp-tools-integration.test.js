import { describe, test, expect } from '@jest/globals';
import { spawn } from 'child_process';
import { join } from 'path';
/**
 * Integration tests for the 3 previously broken MCP tools:
 * 1. get-development-environment-status
 * 2. restart-development-service
 * 3. test-adapter-configuration
 */
describe('MCP Tools Integration', () => {
    const PROJECT_ROOT = '/mnt/m/projects/lucidwonks';
    const DIST_PATH = join(PROJECT_ROOT, 'EnvironmentMCPGateway', 'dist', 'server.js');
    const TIMEOUT_MS = 10000;
    /**
     * Helper function to call an MCP tool via JSON-RPC
     */
    async function callMCPTool(toolName, args = {}) {
        return new Promise((resolve, reject) => {
            const mcp = spawn('node', [DIST_PATH], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: join(PROJECT_ROOT, 'EnvironmentMCPGateway'),
                env: { ...process.env, MCP_SILENT_MODE: 'true' }
            });
            let stdout = '';
            let stderr = '';
            mcp.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            mcp.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            const request = {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/call",
                params: {
                    name: toolName,
                    arguments: args
                }
            };
            mcp.stdin.write(JSON.stringify(request) + '\n');
            const timeout = setTimeout(() => {
                mcp.kill('SIGTERM');
                reject(new Error(`Tool ${toolName} timed out after ${TIMEOUT_MS}ms`));
            }, TIMEOUT_MS);
            mcp.on('close', (code) => {
                clearTimeout(timeout);
                try {
                    // Look for valid JSON response
                    const lines = stdout.split('\n').filter(line => line.trim());
                    const responseLine = lines.find(line => {
                        try {
                            const parsed = JSON.parse(line);
                            return parsed.jsonrpc === "2.0" && parsed.id === 1;
                        }
                        catch {
                            return false;
                        }
                    });
                    if (responseLine) {
                        const response = JSON.parse(responseLine);
                        if (response.error) {
                            reject(new Error(`Tool error: ${JSON.stringify(response.error)}`));
                        }
                        else {
                            resolve(response.result);
                        }
                    }
                    else {
                        reject(new Error(`No valid JSON-RPC response found. Stdout: ${stdout.slice(0, 500)}`));
                    }
                }
                catch (parseError) {
                    reject(new Error(`Failed to parse response: ${parseError}. Stdout: ${stdout.slice(0, 500)}`));
                }
            });
            mcp.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    describe('get-development-environment-status', () => {
        test('should return environment status with required fields', async () => {
            const result = await callMCPTool('get-development-environment-status', {
                checkDatabase: true,
                checkDocker: true,
                checkGit: true
            });
            expect(result).toHaveProperty('content');
            expect(Array.isArray(result.content)).toBe(true);
            expect(result.content.length).toBeGreaterThan(0);
            const content = JSON.parse(result.content[0].text);
            expect(content).toHaveProperty('timestamp');
            expect(content).toHaveProperty('environment');
            expect(content).toHaveProperty('database');
            expect(content).toHaveProperty('docker');
            expect(content).toHaveProperty('git');
            expect(content).toHaveProperty('solution');
        });
        test('should work with selective checks', async () => {
            const result = await callMCPTool('get-development-environment-status', {
                checkDatabase: false,
                checkDocker: true,
                checkGit: false
            });
            expect(result).toHaveProperty('content');
            const content = JSON.parse(result.content[0].text);
            expect(content.database).toBeNull();
            expect(content.git).toBeNull();
            expect(content.docker).not.toBeNull();
        });
    });
    describe('restart-development-service', () => {
        test('should restart redpanda-console service', async () => {
            const result = await callMCPTool('restart-development-service', {
                serviceName: 'redpanda-console'
            });
            expect(result).toHaveProperty('content');
            expect(Array.isArray(result.content)).toBe(true);
            const content = JSON.parse(result.content[0].text);
            expect(content).toHaveProperty('timestamp');
            expect(content).toHaveProperty('serviceName');
            expect(content).toHaveProperty('success');
            expect(content).toHaveProperty('message');
            expect(content.serviceName).toBe('redpanda-console');
        });
        test('should fail with invalid service name', async () => {
            await expect(callMCPTool('restart-development-service', {
                serviceName: 'invalid-service'
            })).rejects.toThrow();
        });
        test('should require serviceName parameter', async () => {
            await expect(callMCPTool('restart-development-service', {})).rejects.toThrow();
        });
    });
    describe('test-adapter-configuration', () => {
        test('should test all adapter configurations', async () => {
            const result = await callMCPTool('test-adapter-configuration', {});
            expect(result).toHaveProperty('content');
            expect(Array.isArray(result.content)).toBe(true);
            const content = JSON.parse(result.content[0].text);
            expect(content).toHaveProperty('timestamp');
            expect(content).toHaveProperty('testResults');
            expect(content).toHaveProperty('summary');
            expect(content.testResults).toHaveProperty('azureDevOps');
            expect(content.testResults).toHaveProperty('docker');
            expect(content.testResults.azureDevOps).toHaveProperty('healthy');
            expect(content.testResults.docker).toHaveProperty('healthy');
            expect(content.summary).toHaveProperty('azureDevOpsHealthy');
            expect(content.summary).toHaveProperty('dockerHealthy');
            expect(content.summary).toHaveProperty('allHealthy');
        });
    });
    describe('JSON-RPC Response Format', () => {
        test('all tools should return properly formatted MCP responses', async () => {
            const tools = [
                { name: 'get-development-environment-status', args: {} },
                { name: 'test-adapter-configuration', args: {} },
                { name: 'restart-development-service', args: { serviceName: 'redpanda-console' } }
            ];
            for (const tool of tools) {
                const result = await callMCPTool(tool.name, tool.args);
                // Validate MCP response structure
                expect(result).toHaveProperty('content');
                expect(Array.isArray(result.content)).toBe(true);
                expect(result.content.length).toBeGreaterThan(0);
                // Each content item should have type and text
                for (const item of result.content) {
                    expect(item).toHaveProperty('type');
                    expect(item).toHaveProperty('text');
                    expect(item.type).toBe('text');
                    // Text should be valid JSON
                    expect(() => JSON.parse(item.text)).not.toThrow();
                }
            }
        });
    });
});
//# sourceMappingURL=mcp-tools-integration.test.js.map
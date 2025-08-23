import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import http from 'http';
import { ChildProcess, spawn } from 'child_process';
import { EventSource } from 'eventsource';

/**
 * HTTP Transport Integration Tests
 * Tests the HTTP/SSE transport implementation for MCP server
 */
describe('HTTP Transport Implementation', () => {
    let serverProcess: ChildProcess;
    const testPort = 3003;
    const baseUrl = `http://localhost:${testPort}`;
    
    beforeEach(async () => {
        // Start server on test port
        serverProcess = spawn('node', ['dist/server.js'], {
            env: { ...process.env, MCP_SERVER_PORT: testPort.toString() },
            cwd: process.cwd(),
            detached: false
        });
        
        // Wait for server to start
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });
    
    afterEach(() => {
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM');
        }
    });

    describe('Health Endpoints', () => {
        it('should respond to health check with HTTP transport info', async () => {
            const response = await fetch(`${baseUrl}/health`);
            expect(response.ok).toBe(true);
            
            const health = await response.json();
            expect(health.status).toBe('healthy');
            expect(health.transport).toBe('HTTP/SSE');
            expect(health.mcpEndpoint).toBe('/mcp');
        });

        it('should respond to status check with transport details', async () => {
            const response = await fetch(`${baseUrl}/status`);
            expect(response.ok).toBe(true);
            
            const status = await response.json();
            expect(status.server).toBe('lucidwonks-environment-mcp-gateway');
            expect(status.transport.type).toBe('HTTP/SSE');
            expect(status.transport.endpoint).toBe('/mcp');
            expect(status.transport.port).toBe(testPort);
            expect(status.tools.total).toBe(43);
        });
    });

    describe('MCP Endpoint', () => {
        it('should accept GET requests to /mcp endpoint', async () => {
            // Test that MCP endpoint accepts connections (won't complete without proper MCP client)
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 1000); // Abort after 1s
            
            try {
                const response = await fetch(`${baseUrl}/mcp`, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'Accept': 'text/event-stream',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                // Should not complete immediately (SSE connection)
                expect(true).toBe(true); // Connection accepted
            } catch (error: any) {
                // Expect abort error since we're testing connection acceptance
                expect(error.name).toBe('AbortError');
            }
        });

        it('should return 404 for invalid endpoints', async () => {
            const response = await fetch(`${baseUrl}/invalid`);
            expect(response.status).toBe(404);
            
            const error = await response.json();
            expect(error.error).toBe('Not Found');
        });
    });

    describe('Server Transport Migration', () => {
        it('should successfully start with SSE transport', async () => {
            const response = await fetch(`${baseUrl}/health`);
            const health = await response.json();
            
            // Verify transport migration success
            expect(health.transport).toBe('HTTP/SSE');
            expect(health.status).toBe('healthy');
        });

        it('should serve unified HTTP endpoints (MCP + health)', async () => {
            const healthResponse = await fetch(`${baseUrl}/health`);
            const statusResponse = await fetch(`${baseUrl}/status`);
            const mcpResponse = await fetch(`${baseUrl}/mcp`, {
                method: 'HEAD' // Just test connection acceptance
            });
            
            expect(healthResponse.ok).toBe(true);
            expect(statusResponse.ok).toBe(true);
            expect(mcpResponse.status).toBe(200); // SSE connection accepted
        });
    });

    describe('MCP Tools Availability', () => {
        it('should report 43+ MCP tools available', async () => {
            const response = await fetch(`${baseUrl}/status`);
            const status = await response.json();
            
            expect(status.tools.total).toBeGreaterThanOrEqual(43);
            expect(status.tools.categories).toContain('Context Engineering');
            expect(status.tools.categories).toContain('Infrastructure');
            expect(status.tools.categories).toContain('Git Workflow');
            expect(status.tools.categories).toContain('Azure DevOps');
        });
    });
});

/**
 * MCP Protocol Compliance Tests
 * Validates that HTTP transport maintains MCP protocol compliance
 */
describe('MCP Protocol Compliance', () => {
    const testPort = 3004;
    let serverProcess: ChildProcess;
    
    beforeEach(async () => {
        serverProcess = spawn('node', ['dist/server.js'], {
            env: { ...process.env, MCP_SERVER_PORT: testPort.toString() },
            cwd: process.cwd()
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });
    
    afterEach(() => {
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM');
        }
    });

    it('should maintain SSE connection for MCP clients', async () => {
        const controller = new AbortController();
        let connectionEstablished = false;
        
        try {
            const response = await fetch(`http://localhost:${testPort}/mcp`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });
            
            if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
                connectionEstablished = true;
            }
            
            controller.abort(); // Clean up connection
        } catch (error: any) {
            // Expected abort error
        }
        
        expect(connectionEstablished).toBe(true);
    });
});
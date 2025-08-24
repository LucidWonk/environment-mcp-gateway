import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TransportFactory, TransportType, StdioTransportHandler, HttpTransportHandler } from '../src/transport/transport-factory';
import { Environment } from '../src/domain/config/environment';
import { SessionManager } from '../src/session/session-manager';
import { SessionAwareToolExecutor } from '../src/session/session-context';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Transport Configuration Unit Tests
 * Tests the transport factory and dual transport support for backward compatibility
 */
describe('Transport Configuration', () => {
    let transportFactory: TransportFactory;
    let mockServer: Server;
    let sessionManager: SessionManager;
    let sessionExecutor: SessionAwareToolExecutor;
    
    beforeEach(() => {
        transportFactory = TransportFactory.getInstance();
        mockServer = new Server(
            { name: 'test-server', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );
        sessionManager = new SessionManager();
        sessionExecutor = new SessionAwareToolExecutor();
    });

    afterEach(() => {
        if (sessionManager) {
            sessionManager.stop();
        }
    });

    describe('Environment Configuration', () => {
        it('should read transport type from environment', () => {
            // Test default HTTP transport
            const originalEnv = process.env.MCP_TRANSPORT_TYPE;
            delete process.env.MCP_TRANSPORT_TYPE;
            
            expect(Environment.mcpTransportType).toBe('http');
            
            // Test STDIO transport
            process.env.MCP_TRANSPORT_TYPE = 'stdio';
            expect(Environment.mcpTransportType).toBe('stdio');
            
            // Test case insensitive
            process.env.MCP_TRANSPORT_TYPE = 'HTTP';
            expect(Environment.mcpTransportType).toBe('http');
            
            // Restore
            if (originalEnv) {
                process.env.MCP_TRANSPORT_TYPE = originalEnv;
            } else {
                delete process.env.MCP_TRANSPORT_TYPE;
            }
        });

        it('should read server port configuration', () => {
            const originalPort = process.env.MCP_SERVER_PORT;
            
            // Test default port
            delete process.env.MCP_SERVER_PORT;
            expect(Environment.mcpServerPort).toBe(3001);
            
            // Test custom port
            process.env.MCP_SERVER_PORT = '8080';
            expect(Environment.mcpServerPort).toBe(8080);
            
            // Restore
            if (originalPort) {
                process.env.MCP_SERVER_PORT = originalPort;
            } else {
                delete process.env.MCP_SERVER_PORT;
            }
        });

        it('should read dual transport configuration', () => {
            const originalDual = process.env.MCP_ENABLE_DUAL_TRANSPORT;
            
            // Test default (false)
            delete process.env.MCP_ENABLE_DUAL_TRANSPORT;
            expect(Environment.mcpEnableDualTransport).toBe(false);
            
            // Test enabled
            process.env.MCP_ENABLE_DUAL_TRANSPORT = 'true';
            expect(Environment.mcpEnableDualTransport).toBe(true);
            
            // Test disabled
            process.env.MCP_ENABLE_DUAL_TRANSPORT = 'false';
            expect(Environment.mcpEnableDualTransport).toBe(false);
            
            // Restore
            if (originalDual) {
                process.env.MCP_ENABLE_DUAL_TRANSPORT = originalDual;
            } else {
                delete process.env.MCP_ENABLE_DUAL_TRANSPORT;
            }
        });

        it('should read log level configuration', () => {
            const originalLogLevel = process.env.MCP_LOG_LEVEL;
            
            // Test default
            delete process.env.MCP_LOG_LEVEL;
            expect(Environment.mcpLogLevel).toBe('info');
            
            // Test custom level
            process.env.MCP_LOG_LEVEL = 'debug';
            expect(Environment.mcpLogLevel).toBe('debug');
            
            // Restore
            if (originalLogLevel) {
                process.env.MCP_LOG_LEVEL = originalLogLevel;
            } else {
                delete process.env.MCP_LOG_LEVEL;
            }
        });
    });

    describe('TransportFactory', () => {
        it('should be a singleton', () => {
            const factory1 = TransportFactory.getInstance();
            const factory2 = TransportFactory.getInstance();
            
            expect(factory1).toBe(factory2);
        });

        it('should create STDIO transport handler', () => {
            const config = { type: 'stdio' as TransportType };
            const handler = transportFactory.createTransportHandler(
                config,
                mockServer
            );
            
            expect(handler).toBeInstanceOf(StdioTransportHandler);
        });

        it('should create HTTP transport handler', () => {
            const config = { 
                type: 'http' as TransportType,
                port: 3002
            };
            const handler = transportFactory.createTransportHandler(
                config,
                mockServer,
                sessionManager,
                sessionExecutor
            );
            
            expect(handler).toBeInstanceOf(HttpTransportHandler);
        });

        it('should require session components for HTTP transport', () => {
            const config = { type: 'http' as TransportType };
            
            expect(() => {
                transportFactory.createTransportHandler(config, mockServer);
            }).toThrow('SessionManager and SessionAwareToolExecutor are required for HTTP transport');
        });

        it('should throw error for unsupported transport type', () => {
            const config = { type: 'invalid' as any };
            
            expect(() => {
                transportFactory.createTransportHandler(config, mockServer);
            }).toThrow('Unsupported transport type: invalid');
        });

        it('should get transport config from environment', () => {
            const originalType = process.env.MCP_TRANSPORT_TYPE;
            const originalPort = process.env.MCP_SERVER_PORT;
            const originalDual = process.env.MCP_ENABLE_DUAL_TRANSPORT;
            
            process.env.MCP_TRANSPORT_TYPE = 'stdio';
            process.env.MCP_SERVER_PORT = '4001';
            process.env.MCP_ENABLE_DUAL_TRANSPORT = 'true';
            
            const config = transportFactory.getTransportConfigFromEnvironment();
            
            expect(config.type).toBe('stdio');
            expect(config.port).toBe(4001);
            expect(config.enableDualMode).toBe(true);
            
            // Restore
            if (originalType) process.env.MCP_TRANSPORT_TYPE = originalType;
            else delete process.env.MCP_TRANSPORT_TYPE;
            if (originalPort) process.env.MCP_SERVER_PORT = originalPort;
            else delete process.env.MCP_SERVER_PORT;
            if (originalDual) process.env.MCP_ENABLE_DUAL_TRANSPORT = originalDual;
            else delete process.env.MCP_ENABLE_DUAL_TRANSPORT;
        });
    });

    describe('StdioTransportHandler', () => {
        let handler: StdioTransportHandler;
        
        beforeEach(() => {
            handler = new StdioTransportHandler(mockServer);
        });

        it('should provide basic metrics', () => {
            const metrics = handler.getMetrics();
            
            expect(metrics.type).toBe('stdio');
            expect(metrics.connected).toBe(false);
            expect(typeof metrics.timestamp).toBe('string');
        });

        it('should start and stop gracefully', async () => {
            await expect(handler.stop()).resolves.not.toThrow();
        });
    });

    describe('HttpTransportHandler', () => {
        let handler: HttpTransportHandler;
        const testPort = 3003;
        
        beforeEach(() => {
            handler = new HttpTransportHandler(
                mockServer,
                sessionManager,
                sessionExecutor,
                testPort
            );
        });

        afterEach(async () => {
            if (handler) {
                await handler.stop();
            }
        });

        it('should provide comprehensive metrics', () => {
            const metrics = handler.getMetrics();
            
            expect(metrics.type).toBe('http');
            expect(metrics.port).toBe(testPort);
            expect(typeof metrics.sessions).toBe('object');
            expect(typeof metrics.activeServers).toBe('number');
            expect(typeof metrics.activeRequests).toBe('object');
            expect(typeof metrics.httpServer).toBe('object');
            expect(typeof metrics.timestamp).toBe('string');
        });

        it('should start HTTP server on specified port', async () => {
            await expect(handler.start()).resolves.not.toThrow();
            
            const metrics = handler.getMetrics();
            expect(metrics.httpServer.listening).toBe(true);
        });

        it('should stop HTTP server gracefully', async () => {
            await handler.start();
            await expect(handler.stop()).resolves.not.toThrow();
        });

        it('should handle port conflicts gracefully', async () => {
            await handler.start();
            
            // Try to start another handler on same port
            const conflictHandler = new HttpTransportHandler(
                mockServer,
                sessionManager,
                sessionExecutor,
                testPort
            );
            
            await expect(conflictHandler.start()).rejects.toThrow();
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain STDIO transport behavior', () => {
            const stdioConfig = { type: 'stdio' as TransportType };
            const stdioHandler = transportFactory.createTransportHandler(
                stdioConfig,
                mockServer
            );
            
            expect(stdioHandler).toBeInstanceOf(StdioTransportHandler);
            
            const metrics = stdioHandler.getMetrics();
            expect(metrics.type).toBe('stdio');
        });

        it('should provide HTTP transport with enhanced features', () => {
            const httpConfig = { 
                type: 'http' as TransportType,
                port: 3004
            };
            const httpHandler = transportFactory.createTransportHandler(
                httpConfig,
                mockServer,
                sessionManager,
                sessionExecutor
            );
            
            expect(httpHandler).toBeInstanceOf(HttpTransportHandler);
            
            const metrics = httpHandler.getMetrics();
            expect(metrics.type).toBe('http');
            expect(metrics.sessions).toBeDefined();
            expect(metrics.activeRequests).toBeDefined();
        });

        it('should allow transport selection at runtime', () => {
            const originalType = process.env.MCP_TRANSPORT_TYPE;
            
            // Test STDIO selection
            process.env.MCP_TRANSPORT_TYPE = 'stdio';
            let config = transportFactory.getTransportConfigFromEnvironment();
            expect(config.type).toBe('stdio');
            
            // Test HTTP selection
            process.env.MCP_TRANSPORT_TYPE = 'http';
            config = transportFactory.getTransportConfigFromEnvironment();
            expect(config.type).toBe('http');
            
            // Restore
            if (originalType) {
                process.env.MCP_TRANSPORT_TYPE = originalType;
            } else {
                delete process.env.MCP_TRANSPORT_TYPE;
            }
        });
    });

    describe('Migration Support', () => {
        it('should default to HTTP transport for new installations', () => {
            const originalType = process.env.MCP_TRANSPORT_TYPE;
            delete process.env.MCP_TRANSPORT_TYPE;
            
            expect(Environment.mcpTransportType).toBe('http');
            
            // Restore
            if (originalType) {
                process.env.MCP_TRANSPORT_TYPE = originalType;
            }
        });

        it('should preserve explicit STDIO configuration', () => {
            const originalType = process.env.MCP_TRANSPORT_TYPE;
            process.env.MCP_TRANSPORT_TYPE = 'stdio';
            
            expect(Environment.mcpTransportType).toBe('stdio');
            
            // Restore
            if (originalType) {
                process.env.MCP_TRANSPORT_TYPE = originalType;
            } else {
                delete process.env.MCP_TRANSPORT_TYPE;
            }
        });

        it('should support dual transport configuration', () => {
            const originalDual = process.env.MCP_ENABLE_DUAL_TRANSPORT;
            
            process.env.MCP_ENABLE_DUAL_TRANSPORT = 'true';
            const config = transportFactory.getTransportConfigFromEnvironment();
            expect(config.enableDualMode).toBe(true);
            
            process.env.MCP_ENABLE_DUAL_TRANSPORT = 'false';
            const config2 = transportFactory.getTransportConfigFromEnvironment();
            expect(config2.enableDualMode).toBe(false);
            
            // Restore
            if (originalDual) {
                process.env.MCP_ENABLE_DUAL_TRANSPORT = originalDual;
            } else {
                delete process.env.MCP_ENABLE_DUAL_TRANSPORT;
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle missing session components gracefully', () => {
            const config = { type: 'http' as TransportType };
            
            expect(() => {
                transportFactory.createTransportHandler(config, mockServer);
            }).toThrow('SessionManager and SessionAwareToolExecutor are required for HTTP transport');
        });

        it('should handle transport startup failures', async () => {
            const handler = new HttpTransportHandler(
                mockServer,
                sessionManager,
                sessionExecutor,
                -1 // Invalid port
            );
            
            await expect(handler.start()).rejects.toThrow();
        });

        it('should provide meaningful error messages', () => {
            const config = { type: 'unknown-transport' as any };
            
            expect(() => {
                transportFactory.createTransportHandler(config, mockServer);
            }).toThrow('Unsupported transport type: unknown-transport');
        });
    });
});
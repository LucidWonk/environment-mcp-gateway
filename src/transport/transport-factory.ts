/**
 * Transport factory for MCP server supporting both STDIO and HTTP transports
 * Enables backward compatibility and gradual migration from STDIO to HTTP
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';
import { Environment } from '../domain/config/environment.js';
import { SessionManager } from '../session/session-manager.js';
import { SessionAwareToolExecutor, SessionContext } from '../session/session-context.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('transport-factory.log');

export type TransportType = 'stdio' | 'http';

export interface TransportConfig {
    type: TransportType;
    port?: number;
    enableDualMode?: boolean;
}

export interface TransportHandler {
    start(): Promise<void>;
    stop(): Promise<void>;
    getMetrics(): any;
}

/**
 * STDIO Transport Handler - maintains existing single-client behavior
 */
export class StdioTransportHandler implements TransportHandler {
    private server: Server;
    private transport?: StdioServerTransport;

    constructor(
        server: Server,
        private sessionManager?: SessionManager,
        private sessionExecutor?: SessionAwareToolExecutor
    ) {
        this.server = server;
    }

    async start(): Promise<void> {
        logger.info('Starting STDIO transport handler');
        
        this.transport = new StdioServerTransport();
        await this.server.connect(this.transport);
        
        logger.info('✅ STDIO transport connected successfully');
    }

    async stop(): Promise<void> {
        logger.info('Stopping STDIO transport handler');
        
        if (this.transport) {
            // STDIO transport cleanup handled by MCP SDK
            this.transport = undefined;
        }
        
        logger.info('✅ STDIO transport stopped');
    }

    getMetrics(): any {
        return {
            type: 'stdio',
            connected: !!this.transport,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * HTTP Transport Handler - supports multi-client sessions
 */
export class HttpTransportHandler implements TransportHandler {
    private httpServer?: http.Server;
    private sessionServers = new Map<string, Server>();

    constructor(
        private baseServer: Server,
        private sessionManager: SessionManager,
        private sessionExecutor: SessionAwareToolExecutor,
        private port: number = 3001
    ) {}

    async start(): Promise<void> {
        logger.info('Starting HTTP transport handler', { port: this.port });
        
        this.httpServer = http.createServer();
        
        this.httpServer.on('request', (req, res) => {
            if (req.url === '/mcp' && req.method === 'GET') {
                this.handleMCPConnection(req, res);
            } else if (req.url === '/health' && req.method === 'GET') {
                this.handleHealthCheck(res);
            } else if (req.url === '/metrics' && req.method === 'GET') {
                this.handleMetrics(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });

        return new Promise((resolve, reject) => {
            this.httpServer!.listen(this.port, (err?: Error) => {
                if (err) {
                    logger.error('Failed to start HTTP server', { port: this.port, error: err });
                    reject(err);
                } else {
                    logger.info('✅ HTTP transport server started successfully', { port: this.port });
                    resolve();
                }
            });
        });
    }

    async stop(): Promise<void> {
        logger.info('Stopping HTTP transport handler');
        
        if (this.httpServer) {
            return new Promise((resolve) => {
                this.httpServer!.close(() => {
                    logger.info('✅ HTTP transport server stopped');
                    resolve();
                });
            });
        }
    }

    private async handleMCPConnection(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        let sessionId: string | undefined;
        
        try {
            // Generate unique session ID for this connection
            sessionId = this.sessionManager.generateSessionId();
            
            logger.info('🔌 New MCP client connection (HTTP)', {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress
            });
            
            // Create session context for this connection
            const sessionContext: SessionContext = {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress,
                startedAt: new Date()
            };
            
            // Create session for this client connection
            this.sessionManager.addSession(
                sessionId,
                req.headers['user-agent'],
                req.socket?.remoteAddress
            );
            
            // Create session-specific MCP server for isolated multi-client support
            const sessionServer = this.createSessionServer(sessionContext);
            this.sessionServers.set(sessionId, sessionServer);
            
            // Create SSE transport for this specific connection
            const transport = new SSEServerTransport('/mcp', res);
            
            // Update session state to connecting
            this.sessionManager.updateSessionState(sessionId, 'connecting');
            
            // Connect the session-specific MCP server to this transport
            await sessionServer.connect(transport);
            
            // Update session state to connected
            this.sessionManager.updateSessionState(sessionId, 'connected');
            
            logger.info('✅ MCP client connected via HTTP/SSE transport', {
                sessionId,
                totalSessions: this.sessionManager.getMetrics().totalSessions,
                activeSessions: this.sessionManager.getMetrics().activeSessions
            });
            
            // Handle connection cleanup when client disconnects
            res.on('close', () => {
                if (sessionId) {
                    logger.info('🔌 MCP client disconnected (HTTP)', { sessionId });
                    this.sessionManager.updateSessionState(sessionId, 'disconnected');
                    this.sessionManager.removeSession(sessionId);
                    
                    // Clean up session-specific server and cancel active requests
                    this.sessionServers.delete(sessionId);
                    const canceledRequests = this.sessionExecutor.cancelSessionRequests(sessionId);
                    if (canceledRequests > 0) {
                        logger.info('Canceled active requests for disconnected session', {
                            sessionId,
                            canceledRequests
                        });
                    }
                }
            });
            
        } catch (error) {
            logger.error('❌ Failed to establish HTTP MCP connection', { 
                sessionId,
                error: error instanceof Error ? error.message : String(error)
            });
            
            if (sessionId) {
                this.sessionManager.removeSession(sessionId);
                this.sessionServers.delete(sessionId);
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Failed to establish MCP connection',
                details: error instanceof Error ? error.message : String(error)
            }));
        }
    }

    private createSessionServer(sessionContext: SessionContext): Server {
        logger.debug('Creating session-specific MCP server', { sessionId: sessionContext.sessionId });
        
        const sessionServer = new Server(
            {
                name: 'lucidwonks-environment-mcp-gateway',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );
        
        // For now, copy handlers from base server
        // In a full implementation, this would use the same handler setup as the main server
        // But with session-aware execution context
        
        logger.debug('Session-specific MCP server created', { sessionId: sessionContext.sessionId });
        return sessionServer;
    }

    private handleHealthCheck(res: http.ServerResponse): void {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy',
            transport: 'http',
            timestamp: new Date().toISOString()
        }));
    }

    private handleMetrics(res: http.ServerResponse): void {
        const metrics = this.getMetrics();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics, null, 2));
    }

    getMetrics(): any {
        const sessionMetrics = this.sessionManager.getMetrics();
        const activeRequests = this.sessionExecutor.getAllActiveRequests();
        
        return {
            type: 'http',
            port: this.port,
            sessions: sessionMetrics,
            activeServers: this.sessionServers.size,
            activeRequests: {
                total: activeRequests.length,
                bySession: activeRequests.reduce((acc, req) => {
                    acc[req.sessionContext.sessionId] = (acc[req.sessionContext.sessionId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            },
            httpServer: {
                listening: !!this.httpServer?.listening
            },
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Transport Factory - creates and manages transport handlers based on configuration
 */
export class TransportFactory {
    private static instance?: TransportFactory;
    private currentHandler?: TransportHandler;
    
    private constructor() {}
    
    static getInstance(): TransportFactory {
        if (!this.instance) {
            this.instance = new TransportFactory();
        }
        return this.instance;
    }
    
    /**
     * Create transport handler based on configuration
     */
    createTransportHandler(
        config: TransportConfig,
        server: Server,
        sessionManager?: SessionManager,
        sessionExecutor?: SessionAwareToolExecutor
    ): TransportHandler {
        logger.info('Creating transport handler', { 
            type: config.type, 
            port: config.port,
            dualMode: config.enableDualMode 
        });
        
        switch (config.type) {
        case 'stdio':
            return new StdioTransportHandler(server, sessionManager, sessionExecutor);
            
        case 'http':
            if (!sessionManager || !sessionExecutor) {
                throw new Error('SessionManager and SessionAwareToolExecutor are required for HTTP transport');
            }
            return new HttpTransportHandler(
                server, 
                sessionManager, 
                sessionExecutor, 
                config.port || Environment.mcpServerPort
            );
            
        default:
            throw new Error(`Unsupported transport type: ${config.type}`);
        }
    }
    
    /**
     * Get transport configuration from environment
     */
    getTransportConfigFromEnvironment(): TransportConfig {
        return {
            type: Environment.mcpTransportType,
            port: Environment.mcpServerPort,
            enableDualMode: Environment.mcpEnableDualTransport
        };
    }
    
    /**
     * Set the current active transport handler
     */
    setCurrentHandler(handler: TransportHandler): void {
        this.currentHandler = handler;
    }
    
    /**
     * Get metrics from current transport handler
     */
    getCurrentMetrics(): any {
        if (!this.currentHandler) {
            return { error: 'No active transport handler' };
        }
        
        return this.currentHandler.getMetrics();
    }
}
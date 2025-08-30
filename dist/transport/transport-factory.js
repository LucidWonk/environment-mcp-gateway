/**
 * Transport factory for MCP server supporting both STDIO and HTTP transports
 * Enables backward compatibility and gradual migration from STDIO to HTTP
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';
import { Environment } from '../domain/config/environment.js';
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('transport-factory.log');
/**
 * STDIO Transport Handler - maintains existing single-client behavior
 */
export class StdioTransportHandler {
    sessionManager;
    sessionExecutor;
    server;
    transport;
    constructor(server, sessionManager, sessionExecutor) {
        this.sessionManager = sessionManager;
        this.sessionExecutor = sessionExecutor;
        this.server = server;
    }
    async start() {
        logger.info('Starting STDIO transport handler');
        this.transport = new StdioServerTransport();
        await this.server.connect(this.transport);
        logger.info('✅ STDIO transport connected successfully');
    }
    async stop() {
        logger.info('Stopping STDIO transport handler');
        if (this.transport) {
            // STDIO transport cleanup handled by MCP SDK
            this.transport = undefined;
        }
        logger.info('✅ STDIO transport stopped');
    }
    getMetrics() {
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
export class HttpTransportHandler {
    baseServer;
    sessionManager;
    sessionExecutor;
    port;
    httpServer;
    sessionServers = new Map();
    sseTransports = new Map();
    constructor(baseServer, sessionManager, sessionExecutor, port = 3001) {
        this.baseServer = baseServer;
        this.sessionManager = sessionManager;
        this.sessionExecutor = sessionExecutor;
        this.port = port;
    }
    async start() {
        logger.info('Starting HTTP transport handler', { port: this.port });
        this.httpServer = http.createServer();
        this.httpServer.on('request', (req, res) => {
            // Handle CORS preflight for all endpoints
            if (req.method === 'OPTIONS') {
                this.handleCORSPreflight(res);
                return;
            }
            if (req.url === '/mcp') {
                if (req.method === 'GET') {
                    this.handleMCPConnection(req, res);
                }
                else if (req.method === 'POST') {
                    // Check if this POST is for an existing SSE session
                    this.handleMCPPOSTRequest(req, res);
                }
                else {
                    res.writeHead(405, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                }
            }
            else if (req.url === '/health' && req.method === 'GET') {
                this.handleHealthCheck(res);
            }
            else if (req.url === '/status' && req.method === 'GET') {
                this.handleStatusCheck(res);
            }
            else if (req.url === '/metrics' && req.method === 'GET') {
                this.handleMetrics(res);
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });
        return new Promise((resolve, reject) => {
            // Handle server errors (like EADDRINUSE) before attempting to listen
            this.httpServer.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    logger.error(`❌ Port ${this.port} is already in use. Please stop the existing process or use a different port.`, {
                        port: this.port,
                        error: err.message,
                        suggestion: `Run: lsof -i :${this.port} to find the process using this port`
                    });
                }
                else {
                    logger.error('HTTP server error', { port: this.port, error: err });
                }
                reject(err);
            });
            this.httpServer.listen(this.port, '0.0.0.0', (err) => {
                if (err) {
                    logger.error('Failed to start HTTP server', { port: this.port, error: err });
                    reject(err);
                }
                else {
                    logger.info('✅ HTTP transport server started successfully', { port: this.port });
                    resolve();
                }
            });
        });
    }
    async stop() {
        logger.info('Stopping HTTP transport handler');
        if (this.httpServer) {
            return new Promise((resolve) => {
                this.httpServer.close(() => {
                    logger.info('✅ HTTP transport server stopped');
                    resolve();
                });
            });
        }
    }
    async handleMCPConnection(req, res) {
        let sessionId;
        try {
            // Generate unique session ID for this connection
            sessionId = this.sessionManager.generateSessionId();
            logger.info('🔌 New MCP client connection (HTTP)', {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress
            });
            // Create session context for this connection
            const sessionContext = {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress,
                startedAt: new Date()
            };
            // Create session for this client connection
            this.sessionManager.addSession(sessionId, req.headers['user-agent'], req.socket?.remoteAddress);
            // Create session-specific MCP server for isolated multi-client support
            const sessionServer = this.createSessionServer(sessionContext);
            this.sessionServers.set(sessionId, sessionServer);
            // Create SSE transport for this specific connection
            const transport = new SSEServerTransport('/mcp', res);
            // The SSE transport generates its own session ID - we need to use that
            const sseSessionId = transport.sessionId;
            logger.debug('SSE transport created', {
                ourSessionId: sessionId,
                sseSessionId: sseSessionId
            });
            // Store the SSE transport using its own session ID for POST message routing
            this.sseTransports.set(sseSessionId, transport);
            // Also store it using our session ID for cleanup
            this.sseTransports.set(sessionId, transport);
            // Update session state to connecting
            this.sessionManager.updateSessionState(sessionId, 'connecting');
            // Connect the session-specific MCP server to this transport
            try {
                logger.debug('Attempting to connect MCP server to SSE transport', { sessionId });
                await sessionServer.connect(transport);
                // Update session state to connected
                this.sessionManager.updateSessionState(sessionId, 'connected');
                logger.info('✅ MCP client connected via HTTP/SSE transport', {
                    sessionId,
                    totalSessions: this.sessionManager.getMetrics().totalSessions,
                    activeSessions: this.sessionManager.getMetrics().activeSessions
                });
            }
            catch (connectError) {
                logger.error('❌ Failed to connect MCP server to SSE transport', {
                    sessionId,
                    error: connectError instanceof Error ? connectError.message : String(connectError),
                    stack: connectError instanceof Error ? connectError.stack : undefined
                });
                // Clean up on connection failure
                this.sessionManager.updateSessionState(sessionId, 'disconnected');
                this.sessionManager.removeSession(sessionId);
                this.sessionServers.delete(sessionId);
                // Close the response with error
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to establish MCP connection' }));
                return;
            }
            // Handle connection cleanup when client disconnects
            res.on('close', () => {
                if (sessionId) {
                    logger.info('🔌 MCP client disconnected (HTTP)', { sessionId });
                    this.sessionManager.updateSessionState(sessionId, 'disconnected');
                    this.sessionManager.removeSession(sessionId);
                    // Clean up session-specific server and cancel active requests
                    this.sessionServers.delete(sessionId);
                    this.sseTransports.delete(sessionId);
                    const canceledRequests = this.sessionExecutor.cancelSessionRequests(sessionId);
                    if (canceledRequests > 0) {
                        logger.info('Canceled active requests for disconnected session', {
                            sessionId,
                            canceledRequests
                        });
                    }
                }
            });
        }
        catch (error) {
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
    createSessionServer(sessionContext) {
        logger.debug('Creating session-specific MCP server', { sessionId: sessionContext.sessionId });
        const sessionServer = new Server({
            name: 'lucidwonks-environment-mcp-gateway',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });
        // For now, copy handlers from base server
        // In a full implementation, this would use the same handler setup as the main server
        // But with session-aware execution context
        logger.debug('Session-specific MCP server created', { sessionId: sessionContext.sessionId });
        return sessionServer;
    }
    handleHealthCheck(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            transport: 'HTTP/SSE',
            mcpEndpoint: '/mcp'
        }));
    }
    handleStatusCheck(res) {
        const sessionMetrics = this.sessionManager.getMetrics();
        const statusInfo = {
            server: 'lucidwonks-environment-mcp-gateway',
            version: '1.0.0',
            status: 'running',
            transport: {
                type: 'HTTP/SSE',
                endpoint: '/mcp',
                port: this.port
            },
            sessions: {
                total: sessionMetrics.totalSessions,
                active: sessionMetrics.activeSessions,
                firstConnection: sessionMetrics.connectionTime,
                lastActivity: sessionMetrics.lastActivity
            },
            tools: {
                total: 2, // Current tools available
                categories: ['Infrastructure Analysis', 'Development Environment']
            },
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            timestamp: new Date().toISOString()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statusInfo, null, 2));
    }
    handleCORSPreflight(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.writeHead(200);
        res.end();
    }
    handleMetrics(res) {
        const metrics = this.getMetrics();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics, null, 2));
    }
    async handleMCPHTTPRequest(req, res) {
        let sessionId;
        try {
            // Validate Origin header as required by MCP spec
            const origin = req.headers['origin'];
            const allowedOrigins = [
                'null', // For local file:// origins
                'http://localhost:3002',
                'http://127.0.0.1:3002'
            ];
            // Set CORS headers
            if (!origin || origin === 'null' || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
            else {
                logger.warn('❌ Rejected request from unauthorized origin', {
                    sessionId,
                    origin,
                    allowedOrigins
                });
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Forbidden origin' }));
                return;
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
            // Generate unique session ID for this request
            sessionId = this.sessionManager.generateSessionId();
            logger.info('🔌 New MCP HTTP request', {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress,
                origin: req.headers['origin'],
                accept: req.headers['accept'],
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length']
            });
            // Read request body
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    logger.debug('Raw request body received', {
                        sessionId,
                        bodyLength: body.length,
                        bodyPreview: body.substring(0, 100),
                        contentType: req.headers['content-type']
                    });
                    const jsonRpcRequest = JSON.parse(body);
                    logger.debug('Parsed JSON-RPC request', {
                        sessionId,
                        method: jsonRpcRequest.method,
                        id: jsonRpcRequest.id
                    });
                    // Create session context for this request
                    const sessionContext = {
                        sessionId: sessionId,
                        userAgent: req.headers['user-agent'] || 'unknown',
                        remoteAddress: req.socket?.remoteAddress,
                        startedAt: new Date()
                    };
                    // Process the JSON-RPC request 
                    let response;
                    let hasError = false;
                    if (jsonRpcRequest.method === 'initialize') {
                        response = {
                            protocolVersion: '2024-11-05',
                            capabilities: {
                                tools: {}
                            },
                            serverInfo: {
                                name: 'lucidwonks-environment-mcp-gateway',
                                version: '1.0.0'
                            }
                        };
                    }
                    else if (jsonRpcRequest.method === 'tools/list') {
                        // Return tools list directly (simplified for HTTP transport)
                        response = {
                            tools: [
                                {
                                    name: 'analyze-solution-structure',
                                    description: 'Parse and analyze the Lucidwonks solution structure, dependencies, and projects',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            includeDependencies: {
                                                type: 'boolean',
                                                description: 'Include dependency analysis',
                                                default: true
                                            }
                                        }
                                    }
                                },
                                {
                                    name: 'get-development-environment-status',
                                    description: 'Get comprehensive status of development environment (database, docker, git, solution)',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            checkDatabase: { type: 'boolean', default: true },
                                            checkDocker: { type: 'boolean', default: true },
                                            checkGit: { type: 'boolean', default: true }
                                        }
                                    }
                                }
                            ]
                        };
                    }
                    else if (jsonRpcRequest.method === 'tools/call') {
                        // For now, return a simple success response for tools/call
                        hasError = true;
                        response = {
                            error: {
                                code: -32603,
                                message: 'Tool execution not yet implemented for HTTP transport'
                            }
                        };
                    }
                    else if (jsonRpcRequest.method === 'notifications/initialized') {
                        // Handle the initialized notification - this is sent after successful initialize
                        // Notifications don't expect a response (no id field), just return success
                        logger.info('✅ MCP client sent initialized notification', { sessionId });
                        response = null; // No response needed for notifications
                        hasError = false;
                    }
                    else {
                        hasError = true;
                        response = {
                            error: {
                                code: -32601,
                                message: `Method not found: ${jsonRpcRequest.method}`
                            }
                        };
                    }
                    // Handle notifications (no response needed)
                    if (response === null && !hasError) {
                        // Notification - send empty 200 response
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end();
                    }
                    else {
                        // Regular request - send JSON-RPC response
                        const jsonRpcResponse = {
                            jsonrpc: '2.0',
                            id: jsonRpcRequest.id,
                            ...(hasError || (response && response.error) ? { error: (response && response.error) || response } : { result: response })
                        };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(jsonRpcResponse));
                    }
                    logger.info('✅ MCP HTTP request completed', {
                        sessionId,
                        method: jsonRpcRequest.method,
                        success: !hasError && !(response && response.error)
                    });
                }
                catch (parseError) {
                    logger.error('❌ Failed to parse JSON-RPC request', {
                        sessionId,
                        error: parseError instanceof Error ? parseError.message : String(parseError)
                    });
                    const errorResponse = {
                        jsonrpc: '2.0',
                        id: null,
                        error: {
                            code: -32700,
                            message: 'Parse error'
                        }
                    };
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(errorResponse));
                }
            });
        }
        catch (error) {
            logger.error('❌ Failed to handle MCP HTTP request', {
                sessionId,
                error: error instanceof Error ? error.message : String(error)
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }
    /**
     * Handle MCP POST requests - could be for SSE session or standalone HTTP
     */
    async handleMCPPOSTRequest(req, res) {
        try {
            // Check if this POST is for an existing SSE session
            const sessionId = this.extractSessionIdFromRequest(req);
            if (sessionId && this.sseTransports.has(sessionId)) {
                // Route to existing SSE transport
                const sseTransport = this.sseTransports.get(sessionId);
                if (sseTransport) {
                    logger.debug('Routing POST to SSE transport', { sessionId });
                    await sseTransport.handlePostMessage(req, res);
                    return;
                }
            }
            // Otherwise handle as regular HTTP request
            logger.debug('Handling POST as standalone HTTP request', {
                sessionId,
                hasSession: sessionId ? this.sseTransports.has(sessionId) : false
            });
            await this.handleMCPHTTPRequest(req, res);
        }
        catch (error) {
            logger.error('❌ Failed to handle MCP POST request', {
                error: error instanceof Error ? error.message : String(error)
            });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }
    /**
     * Extract session ID from request for SSE POST message routing
     */
    extractSessionIdFromRequest(req) {
        // Try to extract session ID from query parameters
        const url = new URL(req.url || '', `http://localhost:${this.port}`);
        const sessionId = url.searchParams.get('sessionId');
        if (sessionId) {
            return sessionId;
        }
        // Try to extract from headers
        const sessionHeader = req.headers['x-mcp-session-id'];
        if (sessionHeader) {
            return sessionHeader;
        }
        // For SSE transport, the session ID should be in the URL or headers
        // If not found, this POST request is likely a standalone HTTP request
        return null;
    }
    getMetrics() {
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
                }, {})
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
    static instance;
    currentHandler;
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new TransportFactory();
        }
        return this.instance;
    }
    /**
     * Create transport handler based on configuration
     */
    createTransportHandler(config, server, sessionManager, sessionExecutor) {
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
                return new HttpTransportHandler(server, sessionManager, sessionExecutor, config.port || Environment.mcpServerPort);
            default:
                throw new Error(`Unsupported transport type: ${config.type}`);
        }
    }
    /**
     * Get transport configuration from environment
     */
    getTransportConfigFromEnvironment() {
        return {
            type: Environment.mcpTransportType,
            port: Environment.mcpServerPort,
            enableDualMode: Environment.mcpEnableDualTransport
        };
    }
    /**
     * Set the current active transport handler
     */
    setCurrentHandler(handler) {
        this.currentHandler = handler;
    }
    /**
     * Get metrics from current transport handler
     */
    getCurrentMetrics() {
        if (!this.currentHandler) {
            return { error: 'No active transport handler' };
        }
        return this.currentHandler.getMetrics();
    }
}
//# sourceMappingURL=transport-factory.js.map
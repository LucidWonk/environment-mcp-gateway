/**
 * Session-aware MCP server wrapper that provides session context to tool handlers
 * Enables multi-client support with proper request routing and isolation
 */
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('session-aware-server.log');
/**
 * Maps MCP transports to session contexts for multi-client support
 */
export class SessionAwareMCPServer {
    baseServer;
    sessionExecutor;
    transportToSession = new Map();
    sessionToTransport = new Map();
    constructor(baseServer, sessionExecutor) {
        this.baseServer = baseServer;
        this.sessionExecutor = sessionExecutor;
    }
    /**
     * Connect a transport with associated session context
     */
    async connect(transport, sessionContext) {
        logger.info('Connecting transport with session context', {
            sessionId: sessionContext.sessionId,
            userAgent: sessionContext.userAgent,
            remoteAddress: sessionContext.remoteAddress
        });
        // Store the transport-session mapping
        this.transportToSession.set(transport, sessionContext);
        this.sessionToTransport.set(sessionContext.sessionId, transport);
        // Handle transport disconnection cleanup
        transport.onclose = () => {
            this.cleanupSession(sessionContext.sessionId);
        };
        // Connect the base server to the transport
        await this.baseServer.connect(transport);
        logger.info('Transport connected successfully', {
            sessionId: sessionContext.sessionId,
            totalSessions: this.sessionToTransport.size
        });
    }
    /**
     * Get session context for a given transport
     */
    getSessionContext(transport) {
        return this.transportToSession.get(transport);
    }
    /**
     * Get session context by session ID
     */
    getSessionContextById(sessionId) {
        const transport = this.sessionToTransport.get(sessionId);
        return transport ? this.transportToSession.get(transport) : undefined;
    }
    /**
     * Disconnect a specific session
     */
    disconnectSession(sessionId) {
        logger.info('Disconnecting session', { sessionId });
        this.cleanupSession(sessionId);
    }
    /**
     * Get all active session contexts
     */
    getActiveSessions() {
        return Array.from(this.transportToSession.values());
    }
    /**
     * Execute tool with session context awareness
     */
    async executeToolWithSession(sessionId, toolName, params, handler) {
        const sessionContext = this.getSessionContextById(sessionId);
        if (!sessionContext) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        return this.sessionExecutor.executeWithSession(sessionContext, toolName, params, handler);
    }
    cleanupSession(sessionId) {
        logger.info('Cleaning up session resources', { sessionId });
        const transport = this.sessionToTransport.get(sessionId);
        if (transport) {
            this.transportToSession.delete(transport);
            this.sessionToTransport.delete(sessionId);
        }
        // Cancel any active requests for this session
        const canceledRequests = this.sessionExecutor.cancelSessionRequests(sessionId);
        if (canceledRequests > 0) {
            logger.info('Canceled active requests for disconnected session', {
                sessionId,
                canceledRequests
            });
        }
        logger.info('Session cleanup completed', {
            sessionId,
            remainingSessions: this.sessionToTransport.size
        });
    }
}
//# sourceMappingURL=session-aware-server.js.map
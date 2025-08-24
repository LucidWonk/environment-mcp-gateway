/**
 * Session-aware MCP server wrapper that provides session context to tool handlers
 * Enables multi-client support with proper request routing and isolation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { SessionContext, SessionAwareToolExecutor } from './session-context.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('session-aware-server.log');

export interface SessionAwareServer {
    connect(transport: Transport, sessionContext: SessionContext): Promise<void>;
    getSessionContext(transportId: string): SessionContext | undefined;
    disconnectSession(sessionId: string): void;
}

/**
 * Maps MCP transports to session contexts for multi-client support
 */
export class SessionAwareMCPServer {
    private baseServer: Server;
    private sessionExecutor: SessionAwareToolExecutor;
    private transportToSession = new Map<Transport, SessionContext>();
    private sessionToTransport = new Map<string, Transport>();
    
    constructor(baseServer: Server, sessionExecutor: SessionAwareToolExecutor) {
        this.baseServer = baseServer;
        this.sessionExecutor = sessionExecutor;
    }
    
    /**
     * Connect a transport with associated session context
     */
    async connect(transport: Transport, sessionContext: SessionContext): Promise<void> {
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
    getSessionContext(transport: Transport): SessionContext | undefined {
        return this.transportToSession.get(transport);
    }
    
    /**
     * Get session context by session ID
     */
    getSessionContextById(sessionId: string): SessionContext | undefined {
        const transport = this.sessionToTransport.get(sessionId);
        return transport ? this.transportToSession.get(transport) : undefined;
    }
    
    /**
     * Disconnect a specific session
     */
    disconnectSession(sessionId: string): void {
        logger.info('Disconnecting session', { sessionId });
        this.cleanupSession(sessionId);
    }
    
    /**
     * Get all active session contexts
     */
    getActiveSessions(): SessionContext[] {
        return Array.from(this.transportToSession.values());
    }
    
    /**
     * Execute tool with session context awareness
     */
    async executeToolWithSession<T, R>(
        sessionId: string,
        toolName: string,
        params: T,
        handler: (params: T, context: SessionContext) => Promise<R>
    ): Promise<R> {
        const sessionContext = this.getSessionContextById(sessionId);
        if (!sessionContext) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        
        return this.sessionExecutor.executeWithSession(
            sessionContext,
            toolName,
            params,
            handler
        );
    }
    
    private cleanupSession(sessionId: string): void {
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
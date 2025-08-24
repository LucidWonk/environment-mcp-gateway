/**
 * Session-aware MCP server wrapper that provides session context to tool handlers
 * Enables multi-client support with proper request routing and isolation
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { SessionContext, SessionAwareToolExecutor } from './session-context.js';
export interface SessionAwareServer {
    connect(transport: Transport, sessionContext: SessionContext): Promise<void>;
    getSessionContext(transportId: string): SessionContext | undefined;
    disconnectSession(sessionId: string): void;
}
/**
 * Maps MCP transports to session contexts for multi-client support
 */
export declare class SessionAwareMCPServer {
    private baseServer;
    private sessionExecutor;
    private transportToSession;
    private sessionToTransport;
    constructor(baseServer: Server, sessionExecutor: SessionAwareToolExecutor);
    /**
     * Connect a transport with associated session context
     */
    connect(transport: Transport, sessionContext: SessionContext): Promise<void>;
    /**
     * Get session context for a given transport
     */
    getSessionContext(transport: Transport): SessionContext | undefined;
    /**
     * Get session context by session ID
     */
    getSessionContextById(sessionId: string): SessionContext | undefined;
    /**
     * Disconnect a specific session
     */
    disconnectSession(sessionId: string): void;
    /**
     * Get all active session contexts
     */
    getActiveSessions(): SessionContext[];
    /**
     * Execute tool with session context awareness
     */
    executeToolWithSession<T, R>(sessionId: string, toolName: string, params: T, handler: (params: T, context: SessionContext) => Promise<R>): Promise<R>;
    private cleanupSession;
}
//# sourceMappingURL=session-aware-server.d.ts.map
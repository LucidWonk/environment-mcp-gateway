/**
 * Session-aware context for multi-client MCP operations
 * Provides request routing and client isolation
 */
export interface SessionContext {
    sessionId: string;
    userAgent?: string;
    remoteAddress?: string;
    startedAt: Date;
    metadata?: Record<string, any>;
}
export interface SessionAwareRequest<T = any> {
    sessionContext: SessionContext;
    params: T;
    requestId: string;
}
/**
 * Session-aware tool execution context
 * Ensures tool operations are properly isolated per client session
 */
export declare class SessionAwareToolExecutor {
    private activeRequests;
    /**
     * Execute tool with session context for proper client isolation
     */
    executeWithSession<T, R>(sessionContext: SessionContext, toolName: string, params: T, handler: (params: T, context: SessionContext) => Promise<R>): Promise<R>;
    /**
     * Get active requests for a specific session
     */
    getSessionRequests(sessionId: string): SessionAwareRequest[];
    /**
     * Get all active requests across all sessions
     */
    getAllActiveRequests(): SessionAwareRequest[];
    /**
     * Cancel all requests for a specific session (on disconnect)
     */
    cancelSessionRequests(sessionId: string): number;
    private generateRequestId;
}
//# sourceMappingURL=session-context.d.ts.map
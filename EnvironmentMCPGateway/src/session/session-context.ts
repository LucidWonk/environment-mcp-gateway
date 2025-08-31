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
export class SessionAwareToolExecutor {
    private activeRequests = new Map<string, SessionAwareRequest>();
    
    /**
     * Execute tool with session context for proper client isolation
     */
    async executeWithSession<T, R>(
        sessionContext: SessionContext,
        toolName: string,
        params: T,
        handler: (params: T, context: SessionContext) => Promise<R>
    ): Promise<R> {
        const requestId = this.generateRequestId();
        const sessionRequest: SessionAwareRequest<T> = {
            sessionContext,
            params,
            requestId
        };
        
        this.activeRequests.set(requestId, sessionRequest);
        
        try {
            const result = await handler(params, sessionContext);
            return result;
        } finally {
            this.activeRequests.delete(requestId);
        }
    }
    
    /**
     * Get active requests for a specific session
     */
    getSessionRequests(sessionId: string): SessionAwareRequest[] {
        return Array.from(this.activeRequests.values())
            .filter(req => req.sessionContext.sessionId === sessionId);
    }
    
    /**
     * Get all active requests across all sessions
     */
    getAllActiveRequests(): SessionAwareRequest[] {
        return Array.from(this.activeRequests.values());
    }
    
    /**
     * Cancel all requests for a specific session (on disconnect)
     */
    cancelSessionRequests(sessionId: string): number {
        const sessionRequests = this.getSessionRequests(sessionId);
        sessionRequests.forEach(req => {
            this.activeRequests.delete(req.requestId);
        });
        return sessionRequests.length;
    }
    
    private generateRequestId(): string {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
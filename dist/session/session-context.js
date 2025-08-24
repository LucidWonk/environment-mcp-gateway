/**
 * Session-aware context for multi-client MCP operations
 * Provides request routing and client isolation
 */
/**
 * Session-aware tool execution context
 * Ensures tool operations are properly isolated per client session
 */
export class SessionAwareToolExecutor {
    activeRequests = new Map();
    /**
     * Execute tool with session context for proper client isolation
     */
    async executeWithSession(sessionContext, toolName, params, handler) {
        const requestId = this.generateRequestId();
        const sessionRequest = {
            sessionContext,
            params,
            requestId
        };
        this.activeRequests.set(requestId, sessionRequest);
        try {
            const result = await handler(params, sessionContext);
            return result;
        }
        finally {
            this.activeRequests.delete(requestId);
        }
    }
    /**
     * Get active requests for a specific session
     */
    getSessionRequests(sessionId) {
        return Array.from(this.activeRequests.values())
            .filter(req => req.sessionContext.sessionId === sessionId);
    }
    /**
     * Get all active requests across all sessions
     */
    getAllActiveRequests() {
        return Array.from(this.activeRequests.values());
    }
    /**
     * Cancel all requests for a specific session (on disconnect)
     */
    cancelSessionRequests(sessionId) {
        const sessionRequests = this.getSessionRequests(sessionId);
        sessionRequests.forEach(req => {
            this.activeRequests.delete(req.requestId);
        });
        return sessionRequests.length;
    }
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=session-context.js.map
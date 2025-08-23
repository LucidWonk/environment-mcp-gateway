import { ClientSession, SessionMetrics, SessionManagerConfig } from '../types/session-types.js';
/**
 * SessionManager handles client session lifecycle and coordination
 * Supports single and multi-client session management
 */
export declare class SessionManager {
    private sessions;
    private cleanupInterval;
    private config;
    constructor(config?: SessionManagerConfig);
    /**
     * Create a new client session
     */
    addSession(sessionId: string, userAgent?: string, remoteAddress?: string): ClientSession;
    /**
     * Remove a client session
     */
    removeSession(sessionId: string): boolean;
    /**
     * Update session activity timestamp
     */
    updateSessionActivity(sessionId: string): boolean;
    /**
     * Update session connection state
     */
    updateSessionState(sessionId: string, state: ClientSession['connectionState']): boolean;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): ClientSession | undefined;
    /**
     * Get all active sessions
     */
    getActiveSessions(): ClientSession[];
    /**
     * Get session metrics
     */
    getMetrics(): SessionMetrics;
    /**
     * Generate unique session ID
     */
    generateSessionId(): string;
    /**
     * Cleanup expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Start automatic cleanup process
     */
    private startCleanupProcess;
    /**
     * Stop session manager and cleanup
     */
    stop(): void;
}
//# sourceMappingURL=session-manager.d.ts.map
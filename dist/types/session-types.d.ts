/**
 * Session management types for HTTP/SSE transport
 */
export interface ClientSession {
    id: string;
    connectedAt: Date;
    lastActivity: Date;
    userAgent?: string;
    remoteAddress?: string;
    connectionState: 'connecting' | 'connected' | 'disconnected';
}
export interface SessionMetrics {
    totalSessions: number;
    activeSessions: number;
    connectionTime: Date;
    lastActivity: Date;
}
export interface SessionManagerConfig {
    maxSessions?: number;
    sessionTimeout?: number;
    cleanupInterval?: number;
}
//# sourceMappingURL=session-types.d.ts.map
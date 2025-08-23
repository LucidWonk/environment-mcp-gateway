import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('session-manager.log');
/**
 * SessionManager handles client session lifecycle and coordination
 * Supports single and multi-client session management
 */
export class SessionManager {
    sessions = new Map();
    cleanupInterval = null;
    config;
    constructor(config = {}) {
        this.config = {
            maxSessions: config.maxSessions || 10,
            sessionTimeout: config.sessionTimeout || 5 * 60 * 1000, // 5 minutes
            cleanupInterval: config.cleanupInterval || 60 * 1000 // 1 minute
        };
        this.startCleanupProcess();
        logger.info('SessionManager initialized', {
            maxSessions: this.config.maxSessions,
            sessionTimeout: this.config.sessionTimeout,
            cleanupInterval: this.config.cleanupInterval
        });
    }
    /**
     * Create a new client session
     */
    addSession(sessionId, userAgent, remoteAddress) {
        if (this.sessions.has(sessionId)) {
            logger.warn('Session already exists, updating existing session', { sessionId });
            this.updateSessionActivity(sessionId);
            return this.sessions.get(sessionId);
        }
        if (this.sessions.size >= this.config.maxSessions) {
            logger.error('Maximum session limit reached', {
                current: this.sessions.size,
                max: this.config.maxSessions
            });
            throw new Error(`Maximum session limit (${this.config.maxSessions}) reached`);
        }
        const session = {
            id: sessionId,
            connectedAt: new Date(),
            lastActivity: new Date(),
            userAgent,
            remoteAddress,
            connectionState: 'connecting'
        };
        this.sessions.set(sessionId, session);
        logger.info('Client session created', {
            sessionId,
            userAgent,
            remoteAddress,
            totalSessions: this.sessions.size
        });
        return session;
    }
    /**
     * Remove a client session
     */
    removeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            logger.warn('Attempted to remove non-existent session', { sessionId });
            return false;
        }
        this.sessions.delete(sessionId);
        logger.info('Client session removed', {
            sessionId,
            duration: Date.now() - session.connectedAt.getTime(),
            totalSessions: this.sessions.size
        });
        return true;
    }
    /**
     * Update session activity timestamp
     */
    updateSessionActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            logger.warn('Attempted to update non-existent session', { sessionId });
            return false;
        }
        session.lastActivity = new Date();
        return true;
    }
    /**
     * Update session connection state
     */
    updateSessionState(sessionId, state) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            logger.warn('Attempted to update state for non-existent session', { sessionId });
            return false;
        }
        const previousState = session.connectionState;
        session.connectionState = state;
        session.lastActivity = new Date();
        logger.info('Session state updated', {
            sessionId,
            previousState,
            newState: state
        });
        return true;
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(session => session.connectionState === 'connected');
    }
    /**
     * Get session metrics
     */
    getMetrics() {
        const activeSessions = this.getActiveSessions();
        const allSessions = Array.from(this.sessions.values());
        return {
            totalSessions: this.sessions.size,
            activeSessions: activeSessions.length,
            connectionTime: allSessions.length > 0
                ? new Date(Math.min(...allSessions.map(s => s.connectedAt.getTime())))
                : new Date(),
            lastActivity: allSessions.length > 0
                ? new Date(Math.max(...allSessions.map(s => s.lastActivity.getTime())))
                : new Date()
        };
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredSessions = [];
        for (const [sessionId, session] of this.sessions) {
            const lastActivity = session.lastActivity.getTime();
            if (now - lastActivity > this.config.sessionTimeout) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            logger.info('Cleaning up expired session', { sessionId });
            this.removeSession(sessionId);
        }
        if (expiredSessions.length > 0) {
            logger.info('Session cleanup completed', {
                expiredSessions: expiredSessions.length,
                remainingSessions: this.sessions.size
            });
        }
    }
    /**
     * Start automatic cleanup process
     */
    startCleanupProcess() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.config.cleanupInterval);
    }
    /**
     * Stop session manager and cleanup
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        const sessionCount = this.sessions.size;
        this.sessions.clear();
        logger.info('SessionManager stopped', {
            cleanedUpSessions: sessionCount
        });
    }
}
//# sourceMappingURL=session-manager.js.map
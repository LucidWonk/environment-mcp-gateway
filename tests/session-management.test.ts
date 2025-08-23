import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SessionManager } from '../src/session/session-manager';
import { ClientSession } from '../src/types/session-types';

/**
 * Session Management Unit Tests
 * Tests the SessionManager functionality for client session lifecycle
 */
describe('SessionManager', () => {
    let sessionManager: SessionManager;
    
    beforeEach(() => {
        sessionManager = new SessionManager({
            maxSessions: 5,
            sessionTimeout: 1000, // 1 second for testing
            cleanupInterval: 500   // 0.5 seconds for testing
        });
    });
    
    afterEach(() => {
        sessionManager.stop();
    });

    describe('Session Creation', () => {
        it('should create a new session with unique ID', () => {
            const sessionId = sessionManager.generateSessionId();
            const session = sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            
            expect(session.id).toBe(sessionId);
            expect(session.userAgent).toBe('test-agent');
            expect(session.remoteAddress).toBe('127.0.0.1');
            expect(session.connectionState).toBe('connecting');
            expect(session.connectedAt).toBeInstanceOf(Date);
            expect(session.lastActivity).toBeInstanceOf(Date);
        });

        it('should generate unique session IDs', () => {
            const id1 = sessionManager.generateSessionId();
            const id2 = sessionManager.generateSessionId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^session-\d+-[a-z0-9]+$/);
            expect(id2).toMatch(/^session-\d+-[a-z0-9]+$/);
        });

        it('should handle duplicate session creation', () => {
            const sessionId = 'test-session-1';
            const session1 = sessionManager.addSession(sessionId, 'agent1', '127.0.0.1');
            const session2 = sessionManager.addSession(sessionId, 'agent2', '127.0.0.2');
            
            // Should return existing session, not create new one
            expect(session1.id).toBe(session2.id);
            expect(sessionManager.getMetrics().totalSessions).toBe(1);
        });

        it('should enforce maximum session limit', () => {
            // Add maximum allowed sessions
            for (let i = 0; i < 5; i++) {
                sessionManager.addSession(`session-${i}`, `agent-${i}`, '127.0.0.1');
            }
            
            // Attempt to add one more session
            expect(() => {
                sessionManager.addSession('session-overflow', 'agent-overflow', '127.0.0.1');
            }).toThrow('Maximum session limit (5) reached');
        });
    });

    describe('Session Management', () => {
        it('should update session activity', () => {
            const sessionId = 'test-session';
            const session = sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            const originalActivity = session.lastActivity;
            
            // Wait a bit then update activity
            setTimeout(() => {
                const updated = sessionManager.updateSessionActivity(sessionId);
                expect(updated).toBe(true);
                
                const updatedSession = sessionManager.getSession(sessionId);
                expect(updatedSession!.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
            }, 10);
        });

        it('should update session connection state', () => {
            const sessionId = 'test-session';
            sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            
            const updated = sessionManager.updateSessionState(sessionId, 'connected');
            expect(updated).toBe(true);
            
            const session = sessionManager.getSession(sessionId);
            expect(session!.connectionState).toBe('connected');
        });

        it('should remove session', () => {
            const sessionId = 'test-session';
            sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            
            expect(sessionManager.getMetrics().totalSessions).toBe(1);
            
            const removed = sessionManager.removeSession(sessionId);
            expect(removed).toBe(true);
            expect(sessionManager.getMetrics().totalSessions).toBe(0);
            expect(sessionManager.getSession(sessionId)).toBeUndefined();
        });

        it('should handle removal of non-existent session', () => {
            const removed = sessionManager.removeSession('non-existent');
            expect(removed).toBe(false);
        });
    });

    describe('Session Metrics', () => {
        it('should provide accurate session metrics', () => {
            // Add sessions with different states
            sessionManager.addSession('session-1', 'agent-1', '127.0.0.1');
            sessionManager.addSession('session-2', 'agent-2', '127.0.0.1');
            sessionManager.addSession('session-3', 'agent-3', '127.0.0.1');
            
            // Update states
            sessionManager.updateSessionState('session-1', 'connected');
            sessionManager.updateSessionState('session-2', 'connected');
            sessionManager.updateSessionState('session-3', 'disconnected');
            
            const metrics = sessionManager.getMetrics();
            expect(metrics.totalSessions).toBe(3);
            expect(metrics.activeSessions).toBe(2); // Only connected sessions
            expect(metrics.connectionTime).toBeInstanceOf(Date);
            expect(metrics.lastActivity).toBeInstanceOf(Date);
        });

        it('should return default metrics when no sessions', () => {
            const metrics = sessionManager.getMetrics();
            expect(metrics.totalSessions).toBe(0);
            expect(metrics.activeSessions).toBe(0);
            expect(metrics.connectionTime).toBeInstanceOf(Date);
            expect(metrics.lastActivity).toBeInstanceOf(Date);
        });
    });

    describe('Session Cleanup', () => {
        it('should clean up expired sessions', (done) => {
            // Add a session
            const sessionId = 'test-session';
            sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            
            expect(sessionManager.getMetrics().totalSessions).toBe(1);
            
            // Wait for session to expire and cleanup to run
            setTimeout(() => {
                expect(sessionManager.getMetrics().totalSessions).toBe(0);
                done();
            }, 1500); // Wait longer than sessionTimeout + cleanupInterval
        });

        it('should keep active sessions during cleanup', (done) => {
            const sessionId = 'active-session';
            sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            
            // Keep updating activity
            const activityInterval = setInterval(() => {
                sessionManager.updateSessionActivity(sessionId);
            }, 300);
            
            // Check after cleanup should have run
            setTimeout(() => {
                clearInterval(activityInterval);
                expect(sessionManager.getMetrics().totalSessions).toBe(1);
                done();
            }, 1500);
        });
    });

    describe('SessionManager Lifecycle', () => {
        it('should stop cleanup process when stopped', () => {
            const sessionId = 'test-session';
            sessionManager.addSession(sessionId, 'test-agent', '127.0.0.1');
            
            expect(sessionManager.getMetrics().totalSessions).toBe(1);
            
            sessionManager.stop();
            
            // All sessions should be cleared
            expect(sessionManager.getMetrics().totalSessions).toBe(0);
        });
    });
});

/**
 * Session Integration Tests
 * Tests session management integration with HTTP transport
 */
describe('Session Integration', () => {
    let sessionManager: SessionManager;
    
    beforeEach(() => {
        sessionManager = new SessionManager();
    });
    
    afterEach(() => {
        sessionManager.stop();
    });

    it('should handle typical HTTP client session lifecycle', () => {
        // Simulate client connection
        const sessionId = sessionManager.generateSessionId();
        const session = sessionManager.addSession(sessionId, 'Mozilla/5.0 Claude', '192.168.1.100');
        
        expect(session.connectionState).toBe('connecting');
        
        // Simulate successful connection
        sessionManager.updateSessionState(sessionId, 'connected');
        expect(sessionManager.getActiveSessions()).toHaveLength(1);
        
        // Simulate client activity
        sessionManager.updateSessionActivity(sessionId);
        
        // Simulate client disconnection
        sessionManager.updateSessionState(sessionId, 'disconnected');
        sessionManager.removeSession(sessionId);
        
        expect(sessionManager.getMetrics().totalSessions).toBe(0);
        expect(sessionManager.getActiveSessions()).toHaveLength(0);
    });

    it('should support multiple concurrent client sessions', () => {
        const sessions = [];
        
        // Create multiple sessions
        for (let i = 0; i < 3; i++) {
            const sessionId = sessionManager.generateSessionId();
            sessions.push(sessionId);
            sessionManager.addSession(sessionId, `client-${i}`, `192.168.1.${100 + i}`);
            sessionManager.updateSessionState(sessionId, 'connected');
        }
        
        expect(sessionManager.getMetrics().totalSessions).toBe(3);
        expect(sessionManager.getActiveSessions()).toHaveLength(3);
        
        // Remove one session
        sessionManager.removeSession(sessions[1]);
        
        expect(sessionManager.getMetrics().totalSessions).toBe(2);
        expect(sessionManager.getActiveSessions()).toHaveLength(2);
    });
});
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SessionAwareToolExecutor, SessionContext } from '../src/session/session-context';

/**
 * Multi-Client Support Unit Tests
 * Tests the enhanced multi-client capabilities for concurrent MCP client support
 * with session isolation and request routing
 */
describe('Multi-Client Support', () => {
    let sessionAwareExecutor: SessionAwareToolExecutor;
    
    beforeEach(() => {
        sessionAwareExecutor = new SessionAwareToolExecutor();
    });

    describe('SessionAwareToolExecutor', () => {
        it('should execute tools with session context isolation', async () => {
            const sessionContext1: SessionContext = {
                sessionId: 'session-1',
                userAgent: 'client-1',
                remoteAddress: '127.0.0.1',
                startedAt: new Date(),
                metadata: { client: 'test1' }
            };

            const sessionContext2: SessionContext = {
                sessionId: 'session-2',
                userAgent: 'client-2',
                remoteAddress: '127.0.0.2',
                startedAt: new Date(),
                metadata: { client: 'test2' }
            };

            // Mock tool handler that returns session-specific results
            const mockHandler = jest.fn().mockImplementation((params, context) => {
                return Promise.resolve({ 
                    result: `Tool executed for ${context.sessionId}`,
                    params,
                    sessionId: context.sessionId
                });
            });

            // Execute tools concurrently for different sessions
            const [result1, result2] = await Promise.all([
                sessionAwareExecutor.executeWithSession(
                    sessionContext1,
                    'test-tool',
                    { input: 'data1' },
                    mockHandler
                ),
                sessionAwareExecutor.executeWithSession(
                    sessionContext2,
                    'test-tool',
                    { input: 'data2' },
                    mockHandler
                )
            ]);

            expect(result1.sessionId).toBe('session-1');
            expect(result2.sessionId).toBe('session-2');
            expect(result1.result).toBe('Tool executed for session-1');
            expect(result2.result).toBe('Tool executed for session-2');
            expect(mockHandler).toHaveBeenCalledTimes(2);
        });

        it('should track active requests per session', async () => {
            const sessionContext: SessionContext = {
                sessionId: 'active-session',
                userAgent: 'test-client',
                remoteAddress: '127.0.0.1',
                startedAt: new Date()
            };

            // Start a long-running operation
            const longRunningPromise = sessionAwareExecutor.executeWithSession(
                sessionContext,
                'long-tool',
                { delay: 100 },
                async (params, context) => {
                    await new Promise(resolve => setTimeout(resolve, params.delay));
                    return { completed: true, sessionId: context.sessionId };
                }
            );

            // Check active requests during execution
            const sessionRequests = sessionAwareExecutor.getSessionRequests('active-session');
            expect(sessionRequests).toHaveLength(1);
            expect(sessionRequests[0].sessionContext.sessionId).toBe('active-session');

            // Wait for completion
            await longRunningPromise;

            // Check no active requests after completion
            const completedRequests = sessionAwareExecutor.getSessionRequests('active-session');
            expect(completedRequests).toHaveLength(0);
        });

        it('should cancel all requests for a disconnected session', async () => {
            const sessionContext: SessionContext = {
                sessionId: 'cancel-session',
                userAgent: 'test-client',
                remoteAddress: '127.0.0.1',
                startedAt: new Date()
            };

            // Start multiple operations for the session
            const operations = Array.from({ length: 3 }, (_, i) =>
                sessionAwareExecutor.executeWithSession(
                    sessionContext,
                    `tool-${i}`,
                    { index: i },
                    async (params, context) => {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        return { completed: true, index: params.index, sessionId: context.sessionId };
                    }
                )
            );

            // Verify active requests
            expect(sessionAwareExecutor.getSessionRequests('cancel-session')).toHaveLength(3);

            // Cancel all requests for the session
            const canceledCount = sessionAwareExecutor.cancelSessionRequests('cancel-session');
            expect(canceledCount).toBe(3);

            // Verify no active requests remain
            expect(sessionAwareExecutor.getSessionRequests('cancel-session')).toHaveLength(0);

            // Wait for operations to complete (they should still resolve)
            const results = await Promise.allSettled(operations);
            results.forEach(result => {
                expect(result.status).toBe('fulfilled');
            });
        });

        it('should maintain request isolation between sessions', async () => {
            const session1: SessionContext = {
                sessionId: 'isolation-1',
                userAgent: 'client-1',
                remoteAddress: '127.0.0.1',
                startedAt: new Date()
            };

            const session2: SessionContext = {
                sessionId: 'isolation-2',  
                userAgent: 'client-2',
                remoteAddress: '127.0.0.2',
                startedAt: new Date()
            };

            // Start operations for both sessions
            const operations1 = Array.from({ length: 2 }, (_, i) =>
                sessionAwareExecutor.executeWithSession(
                    session1,
                    `tool-1-${i}`,
                    { session: 1, index: i },
                    async (params) => {
                        await new Promise(resolve => setTimeout(resolve, 30));
                        return { session: params.session, index: params.index };
                    }
                )
            );

            const operations2 = Array.from({ length: 3 }, (_, i) =>
                sessionAwareExecutor.executeWithSession(
                    session2,
                    `tool-2-${i}`,
                    { session: 2, index: i },
                    async (params) => {
                        await new Promise(resolve => setTimeout(resolve, 30));
                        return { session: params.session, index: params.index };
                    }
                )
            );

            // Verify session isolation
            expect(sessionAwareExecutor.getSessionRequests('isolation-1')).toHaveLength(2);
            expect(sessionAwareExecutor.getSessionRequests('isolation-2')).toHaveLength(3);
            expect(sessionAwareExecutor.getAllActiveRequests()).toHaveLength(5);

            // Cancel only one session's requests
            const canceledCount = sessionAwareExecutor.cancelSessionRequests('isolation-1');
            expect(canceledCount).toBe(2);

            // Verify isolation maintained
            expect(sessionAwareExecutor.getSessionRequests('isolation-1')).toHaveLength(0);
            expect(sessionAwareExecutor.getSessionRequests('isolation-2')).toHaveLength(3);

            // Wait for remaining operations to complete
            const results2 = await Promise.all(operations2);
            expect(results2).toHaveLength(3);
            results2.forEach((result, index) => {
                expect(result.session).toBe(2);
                expect(result.index).toBe(index);
            });
        });
    });

    describe('Session Context Management', () => {
        it('should handle session metadata properly', () => {
            const sessionContext: SessionContext = {
                sessionId: 'metadata-session',
                userAgent: 'Mozilla/5.0 Claude',
                remoteAddress: '192.168.1.100',
                startedAt: new Date('2025-08-23T12:00:00Z'),
                metadata: {
                    clientVersion: '1.0.0',
                    features: ['git', 'docker', 'database'],
                    priority: 'high'
                }
            };

            expect(sessionContext.metadata?.clientVersion).toBe('1.0.0');
            expect(sessionContext.metadata?.features).toEqual(['git', 'docker', 'database']);
            expect(sessionContext.metadata?.priority).toBe('high');
        });

        it('should generate unique request IDs', async () => {
            const sessionContext: SessionContext = {
                sessionId: 'unique-request-session',
                userAgent: 'test-client',
                remoteAddress: '127.0.0.1',
                startedAt: new Date()
            };

            const requestIds = new Set<string>();
            const promises: Promise<void>[] = [];

            // Start multiple concurrent operations
            for (let i = 0; i < 5; i++) {
                const promise = sessionAwareExecutor.executeWithSession(
                    sessionContext,
                    `tool-${i}`,
                    { index: i },
                    async () => {
                        const activeRequests = sessionAwareExecutor.getSessionRequests('unique-request-session');
                        activeRequests.forEach(req => requestIds.add(req.requestId));
                        return { index: i };
                    }
                );
                promises.push(promise);
            }

            await Promise.all(promises);

            // All request IDs should be unique
            expect(requestIds.size).toBe(5);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle tool execution errors gracefully', async () => {
            const sessionContext: SessionContext = {
                sessionId: 'error-session',
                userAgent: 'test-client',
                remoteAddress: '127.0.0.1',
                startedAt: new Date()
            };

            const errorHandler = jest.fn().mockRejectedValue(new Error('Tool execution failed'));

            await expect(
                sessionAwareExecutor.executeWithSession(
                    sessionContext,
                    'failing-tool',
                    { shouldFail: true },
                    errorHandler
                )
            ).rejects.toThrow('Tool execution failed');

            // Verify no requests remain after error
            expect(sessionAwareExecutor.getSessionRequests('error-session')).toHaveLength(0);
        });

        it('should handle empty sessions gracefully', () => {
            expect(sessionAwareExecutor.getSessionRequests('non-existent-session')).toHaveLength(0);
            expect(sessionAwareExecutor.cancelSessionRequests('non-existent-session')).toBe(0);
        });

        it('should handle concurrent session operations', async () => {
            const sessions = Array.from({ length: 5 }, (_, i) => ({
                sessionId: `concurrent-session-${i}`,
                userAgent: `client-${i}`,
                remoteAddress: `127.0.0.${i + 1}`,
                startedAt: new Date()
            }));

            // Start operations for all sessions simultaneously
            const allOperations = sessions.flatMap(session =>
                Array.from({ length: 3 }, (_, i) =>
                    sessionAwareExecutor.executeWithSession(
                        session,
                        `tool-${session.sessionId}-${i}`,
                        { sessionId: session.sessionId, toolIndex: i },
                        async (params) => {
                            await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
                            return { 
                                sessionId: params.sessionId, 
                                toolIndex: params.toolIndex 
                            };
                        }
                    )
                )
            );

            // Verify all operations are active
            expect(sessionAwareExecutor.getAllActiveRequests()).toHaveLength(15);

            // Wait for all operations to complete
            const results = await Promise.all(allOperations);
            expect(results).toHaveLength(15);

            // Verify all requests completed
            expect(sessionAwareExecutor.getAllActiveRequests()).toHaveLength(0);
        });
    });
});

/**
 * Multi-Client Integration Tests
 * Tests multi-client support integration with session management
 */
describe('Multi-Client Integration', () => {
    let sessionAwareExecutor: SessionAwareToolExecutor;
    
    beforeEach(() => {
        sessionAwareExecutor = new SessionAwareToolExecutor();
    });

    it('should support typical multi-client workflow', async () => {
        // Simulate multiple Claude Code clients connecting
        const clients = [
            {
                sessionContext: {
                    sessionId: 'claude-client-1',
                    userAgent: 'Claude Code/1.0.0',
                    remoteAddress: '192.168.1.101',
                    startedAt: new Date(),
                    metadata: { clientType: 'claude-code', version: '1.0.0' }
                }
            },
            {
                sessionContext: {
                    sessionId: 'claude-client-2', 
                    userAgent: 'Claude Code/1.0.0',
                    remoteAddress: '192.168.1.102',
                    startedAt: new Date(),
                    metadata: { clientType: 'claude-code', version: '1.0.0' }
                }
            }
        ];

        // Simulate common MCP tool operations for each client
        const clientOperations = clients.map(client =>
            Promise.all([
                // List tools
                sessionAwareExecutor.executeWithSession(
                    client.sessionContext,
                    'list-tools',
                    {},
                    async (_, context) => ({ 
                        tools: ['git', 'docker', 'database'], 
                        sessionId: context.sessionId 
                    })
                ),
                
                // Analyze solution structure
                sessionAwareExecutor.executeWithSession(
                    client.sessionContext,
                    'analyze-solution-structure',
                    { includeDependencies: true },
                    async (params, context) => ({
                        projects: ['Console', 'Utility', 'CyphyrRecon'],
                        dependencies: params.includeDependencies,
                        sessionId: context.sessionId
                    })
                ),
                
                // Check development environment
                sessionAwareExecutor.executeWithSession(
                    client.sessionContext,
                    'get-development-environment-status',
                    { checkDocker: true, checkDatabase: true },
                    async (params, context) => ({
                        docker: true,
                        database: true,
                        git: true,
                        sessionId: context.sessionId
                    })
                )
            ])
        );

        // Execute all client operations concurrently
        const allResults = await Promise.all(clientOperations);

        // Verify each client got their own results
        expect(allResults).toHaveLength(2);
        allResults.forEach((clientResults, clientIndex) => {
            expect(clientResults).toHaveLength(3);
            clientResults.forEach(result => {
                expect(result.sessionId).toBe(`claude-client-${clientIndex + 1}`);
            });
        });

        // Verify no active requests remain
        expect(sessionAwareExecutor.getAllActiveRequests()).toHaveLength(0);
    });

    it('should handle client disconnection during operations', async () => {
        const sessionContext: SessionContext = {
            sessionId: 'disconnecting-client',
            userAgent: 'Claude Code/1.0.0',
            remoteAddress: '192.168.1.103',
            startedAt: new Date()
        };

        // Start long-running operations
        const longOperations = Array.from({ length: 3 }, (_, i) =>
            sessionAwareExecutor.executeWithSession(
                sessionContext,
                `long-operation-${i}`,
                { duration: 100, index: i },
                async (params, context) => {
                    await new Promise(resolve => setTimeout(resolve, params.duration));
                    return { completed: true, index: params.index, sessionId: context.sessionId };
                }
            )
        );

        // Verify operations are active
        expect(sessionAwareExecutor.getSessionRequests('disconnecting-client')).toHaveLength(3);

        // Simulate client disconnection (cancel all session requests)
        const canceledCount = sessionAwareExecutor.cancelSessionRequests('disconnecting-client');
        expect(canceledCount).toBe(3);

        // Verify cleanup
        expect(sessionAwareExecutor.getSessionRequests('disconnecting-client')).toHaveLength(0);

        // Operations should still complete
        const results = await Promise.allSettled(longOperations);
        results.forEach(result => {
            expect(result.status).toBe('fulfilled');
        });
    });
});
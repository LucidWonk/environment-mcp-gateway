import { CrossSessionCoordinator, CrossSessionOperation, ApprovalRequest, SessionNotification, SharedResource } from '../../src/session/cross-session-coordinator';
import { SessionManager } from '../../src/session/session-manager';
import { EventEmitter } from 'events';

describe('CrossSessionCoordinator', () => {
    let coordinator: CrossSessionCoordinator;
    let sessionManager: SessionManager;
    
    beforeEach(() => {
        sessionManager = new SessionManager();
        coordinator = new CrossSessionCoordinator(sessionManager);
    });
    
    afterEach(() => {
        coordinator.shutdown();
        sessionManager.shutdown();
    });

    describe('Session Registration', () => {
        it('should register session for cross-session operations', async () => {
            // Arrange
            const sessionId = 'test-session-1';
            const session = sessionManager.addSession(sessionId, 'Claude-Code/1.0', '127.0.0.1');
            
            // Act
            const registered = await coordinator.registerSession(sessionId);
            
            // Assert
            expect(registered).toBe(true);
            expect(coordinator.getRegisteredSessions()).toContain(sessionId);
        });
        
        it('should handle duplicate session registration gracefully', async () => {
            // Arrange
            const sessionId = 'test-session-1';
            const session = sessionManager.addSession(sessionId, 'Claude-Code/1.0', '127.0.0.1');
            await coordinator.registerSession(sessionId);
            
            // Act
            const registered = await coordinator.registerSession(sessionId);
            
            // Assert
            expect(registered).toBe(true);
            expect(coordinator.getRegisteredSessions()).toContain(sessionId);
        });
        
        it('should unregister session and clean up resources', async () => {
            // Arrange
            const sessionId = 'test-session-1';
            const session = sessionManager.addSession(sessionId, 'Claude-Code/1.0', '127.0.0.1');
            await coordinator.registerSession(sessionId);
            
            // Act
            const unregistered = await coordinator.unregisterSession(sessionId);
            
            // Assert
            expect(unregistered).toBe(true);
            expect(coordinator.getRegisteredSessions()).not.toContain(sessionId);
        });
    });

    describe('Cross-Session Operations', () => {
        beforeEach(async () => {
            // Set up multiple sessions
            const session1 = sessionManager.addSession('session-1', 'Claude-Code/1.0', '127.0.0.1');
            const session2 = sessionManager.addSession('session-2', 'Claude-Code/1.0', '127.0.0.2');
            const session3 = sessionManager.addSession('session-3', 'Claude-Code/1.0', '127.0.0.3');
            
            await coordinator.registerSession('session-1');
            await coordinator.registerSession('session-2');
            await coordinator.registerSession('session-3');
        });
        
        it('should initiate holistic context update across all sessions', async () => {
            // Arrange
            const updateData = {
                contextPath: '/Documentation/ContextEngineering/',
                updateType: 'holistic_update',
                changes: ['file1.md', 'file2.md'],
                requiredApproval: true
            };
            
            // Act
            const operationId = await coordinator.initiateOperation(
                'holistic_update',
                'session-1',
                updateData,
                ['session-2', 'session-3']
            );
            
            // Assert
            expect(operationId).toBeDefined();
            expect(operationId).toMatch(/^op-holistic_update-/);
            
            const operation = coordinator.getActiveOperation(operationId);
            expect(operation).toBeDefined();
            expect(operation?.operationType).toBe('holistic_update');
            expect(operation?.initiatingSessionId).toBe('session-1');
            expect(operation?.affectedSessions).toEqual(['session-1', 'session-2', 'session-3']);
        });
        
        it('should coordinate approval workflow across sessions', async () => {
            // Arrange
            const operationData = { contextPath: '/test/', requiredApproval: true };
            const operationId = await coordinator.initiateOperation(
                'approval_required',
                'session-1',
                operationData
            );
            
            // Act
            const approvalId = await coordinator.requestApproval(
                operationId,
                'session-1',
                'Context Engineering update requires approval',
                { timeout: 300000 }
            );
            
            // Assert
            expect(approvalId).toBeDefined();
            expect(approvalId).toMatch(/^approval-/);
            
            const approval = coordinator.getPendingApproval(approvalId);
            expect(approval).toBeDefined();
            expect(approval?.operationId).toBe(operationId);
            expect(approval?.requestingSessionId).toBe('session-1');
        });
        
        it('should process human approval response correctly', async () => {
            // Arrange
            const operationId = await coordinator.initiateOperation(
                'approval_required',
                'session-1',
                { contextPath: '/test/' }
            );
            
            const approvalId = await coordinator.requestApproval(
                operationId,
                'session-1',
                'Test approval request'
            );
            
            // Act
            const processed = await coordinator.processApprovalResponse(
                approvalId,
                'session-1',
                true,
                'Approved by human'
            );
            
            // Assert
            expect(processed).toBe(true);
            
            const approval = coordinator.getPendingApproval(approvalId);
            expect(approval).toBeUndefined(); // Should be cleared after processing
        });
        
        it('should handle approval rejection correctly', async () => {
            // Arrange
            const operationId = await coordinator.initiateOperation(
                'approval_required',
                'session-1',
                { contextPath: '/test/' }
            );
            
            const approvalId = await coordinator.requestApproval(
                operationId,
                'session-1',
                'Test approval request'
            );
            
            // Act
            const processed = await coordinator.processApprovalResponse(
                approvalId,
                'session-1',
                false,
                'Rejected by human'
            );
            
            // Assert
            expect(processed).toBe(true);
            
            const operation = coordinator.getActiveOperation(operationId);
            expect(operation?.status).toBe('failed');
        });
    });

    describe('Shared Resource Management', () => {
        beforeEach(async () => {
            await coordinator.registerSession('session-1');
            await coordinator.registerSession('session-2');
        });
        
        it('should acquire shared resource lock successfully', async () => {
            // Arrange
            const resourceId = 'context-engineering-docs';
            
            // Act
            const acquired = await coordinator.acquireSharedResource(
                resourceId,
                'session-1',
                'exclusive',
                5000
            );
            
            // Assert
            expect(acquired).toBe(true);
            
            const resource = coordinator.getSharedResource(resourceId);
            expect(resource).toBeDefined();
            expect(resource?.lockedBy).toBe('session-1');
            expect(resource?.lockType).toBe('exclusive');
        });
        
        it('should prevent concurrent exclusive access to shared resource', async () => {
            // Arrange
            const resourceId = 'context-engineering-docs';
            await coordinator.acquireSharedResource(resourceId, 'session-1', 'exclusive', 5000);
            
            // Act
            const acquired = await coordinator.acquireSharedResource(
                resourceId,
                'session-2',
                'exclusive',
                1000
            );
            
            // Assert
            expect(acquired).toBe(false);
        });
        
        it('should allow multiple shared access to resource', async () => {
            // Arrange
            const resourceId = 'context-engineering-docs';
            
            // Act
            const acquired1 = await coordinator.acquireSharedResource(
                resourceId,
                'session-1',
                'shared',
                5000
            );
            const acquired2 = await coordinator.acquireSharedResource(
                resourceId,
                'session-2',
                'shared',
                5000
            );
            
            // Assert
            expect(acquired1).toBe(true);
            expect(acquired2).toBe(true);
            
            const resource = coordinator.getSharedResource(resourceId);
            expect(resource?.sharedSessions).toContain('session-1');
            expect(resource?.sharedSessions).toContain('session-2');
        });
        
        it('should release shared resource correctly', async () => {
            // Arrange
            const resourceId = 'context-engineering-docs';
            await coordinator.acquireSharedResource(resourceId, 'session-1', 'exclusive', 5000);
            
            // Act
            const released = await coordinator.releaseSharedResource(resourceId, 'session-1');
            
            // Assert
            expect(released).toBe(true);
            
            const resource = coordinator.getSharedResource(resourceId);
            expect(resource?.lockedBy).toBeUndefined();
        });
    });

    describe('Cross-Session Notifications', () => {
        beforeEach(async () => {
            await coordinator.registerSession('session-1');
            await coordinator.registerSession('session-2');
            await coordinator.registerSession('session-3');
        });
        
        it('should broadcast notification to all sessions', async () => {
            // Arrange
            const notification: Omit<SessionNotification, 'id' | 'timestamp'> = {
                type: 'context_update',
                message: 'Context Engineering files updated',
                data: { files: ['file1.md', 'file2.md'] },
                severity: 'info'
            };
            
            let receivedNotifications: SessionNotification[] = [];
            coordinator.on('session_notification', (sessionId: string, notif: SessionNotification) => {
                receivedNotifications.push(notif);
            });
            
            // Act
            const broadcasted = await coordinator.broadcastNotification(notification);
            
            // Assert
            expect(broadcasted).toBe(true);
            expect(receivedNotifications).toHaveLength(3); // All 3 sessions
            expect(receivedNotifications[0].type).toBe('context_update');
            expect(receivedNotifications[0].message).toBe('Context Engineering files updated');
        });
        
        it('should send targeted notification to specific sessions', async () => {
            // Arrange
            const notification: Omit<SessionNotification, 'id' | 'timestamp'> = {
                type: 'approval_required',
                message: 'Your approval is required',
                data: { operationId: 'op-123' },
                severity: 'warning'
            };
            
            let receivedNotifications: { sessionId: string, notification: SessionNotification }[] = [];
            coordinator.on('session_notification', (sessionId: string, notif: SessionNotification) => {
                receivedNotifications.push({ sessionId, notification: notif });
            });
            
            // Act
            const sent = await coordinator.sendNotification(['session-1', 'session-3'], notification);
            
            // Assert
            expect(sent).toBe(true);
            expect(receivedNotifications).toHaveLength(2);
            expect(receivedNotifications.map(r => r.sessionId)).toEqual(['session-1', 'session-3']);
        });
        
        it('should acknowledge notification correctly', async () => {
            // Arrange
            const notification: Omit<SessionNotification, 'id' | 'timestamp'> = {
                type: 'info',
                message: 'Test notification',
                requiresAcknowledgment: true
            };
            
            await coordinator.sendNotification(['session-1'], notification);
            const pending = coordinator.getPendingNotifications('session-1');
            const notificationId = pending[0].id;
            
            // Act
            const acknowledged = await coordinator.acknowledgeNotification(notificationId, 'session-1');
            
            // Assert
            expect(acknowledged).toBe(true);
            
            const pendingAfter = coordinator.getPendingNotifications('session-1');
            expect(pendingAfter).toHaveLength(0);
        });
    });

    describe('Event Integration', () => {
        beforeEach(async () => {
            await coordinator.registerSession('session-1');
            await coordinator.registerSession('session-2');
        });
        
        it('should emit events for operation lifecycle', async () => {
            // Arrange
            let events: { event: string, data: any }[] = [];
            
            coordinator.on('operation_initiated', (data) => events.push({ event: 'operation_initiated', data }));
            coordinator.on('operation_completed', (data) => events.push({ event: 'operation_completed', data }));
            coordinator.on('approval_requested', (data) => events.push({ event: 'approval_requested', data }));
            
            // Act
            const operationId = await coordinator.initiateOperation(
                'holistic_update',
                'session-1',
                { contextPath: '/test/' }
            );
            
            await coordinator.requestApproval(operationId, 'session-1', 'Test approval');
            await coordinator.completeOperation(operationId, { success: true });
            
            // Assert
            expect(events).toHaveLength(3);
            expect(events[0].event).toBe('operation_initiated');
            expect(events[1].event).toBe('approval_requested');
            expect(events[2].event).toBe('operation_completed');
        });
        
        it('should emit session lifecycle events', async () => {
            // Arrange
            let events: { event: string, sessionId: string }[] = [];
            
            coordinator.on('session_registered', (sessionId) => events.push({ event: 'session_registered', sessionId }));
            coordinator.on('session_unregistered', (sessionId) => events.push({ event: 'session_unregistered', sessionId }));
            
            // Act
            await coordinator.registerSession('new-session');
            await coordinator.unregisterSession('new-session');
            
            // Assert
            expect(events).toHaveLength(2);
            expect(events[0].event).toBe('session_registered');
            expect(events[1].event).toBe('session_unregistered');
        });
    });

    describe('Context Engineering Service Integration', () => {
        it('should integrate with HolisticUpdateOrchestrator', async () => {
            // Arrange
            const mockOrchestrator = {
                coordinateUpdate: jest.fn().mockResolvedValue({ success: true, updateId: 'update-123' })
            };
            
            coordinator.setHolisticUpdateOrchestrator(mockOrchestrator);
            
            const operationData = {
                contextPath: '/Documentation/ContextEngineering/',
                updateType: 'holistic_update',
                changes: ['capability-registry.md']
            };
            
            // Act
            const operationId = await coordinator.initiateOperation(
                'holistic_update',
                'session-1',
                operationData
            );
            
            await coordinator.executeHolisticUpdate(operationId);
            
            // Assert
            expect(mockOrchestrator.coordinateUpdate).toHaveBeenCalledWith({
                operationId,
                contextPath: operationData.contextPath,
                changes: operationData.changes,
                sessions: ['session-1']
            });
        });
        
        it('should integrate with ApprovalWorkflowManager', async () => {
            // Arrange
            const mockApprovalManager = {
                processApprovalRequest: jest.fn().mockResolvedValue({ approved: true, approvalId: 'approval-123' })
            };
            
            coordinator.setApprovalWorkflowManager(mockApprovalManager);
            
            // Act
            const operationId = await coordinator.initiateOperation(
                'approval_required',
                'session-1',
                { contextPath: '/test/', requiredApproval: true }
            );
            
            const approvalId = await coordinator.requestApproval(
                operationId,
                'session-1',
                'Context update requires approval'
            );
            
            // Assert
            expect(mockApprovalManager.processApprovalRequest).toHaveBeenCalledWith({
                operationId,
                requestingSessionId: 'session-1',
                message: 'Context update requires approval',
                metadata: expect.any(Object)
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle operation timeout gracefully', async () => {
            // Arrange
            const operationId = await coordinator.initiateOperation(
                'long_running',
                'session-1',
                { timeout: 100 } // Very short timeout
            );
            
            // Act
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Assert
            const operation = coordinator.getActiveOperation(operationId);
            expect(operation?.status).toBe('timeout');
        });
        
        it('should handle invalid session operations', async () => {
            // Act & Assert
            await expect(coordinator.registerSession('invalid-session')).rejects.toThrow();
            await expect(coordinator.initiateOperation('test', 'non-existent-session', {})).rejects.toThrow();
        });
        
        it('should cleanup resources on shutdown', async () => {
            // Arrange
            await coordinator.registerSession('session-1');
            const operationId = await coordinator.initiateOperation('test', 'session-1', {});
            await coordinator.acquireSharedResource('resource-1', 'session-1', 'exclusive', 5000);
            
            // Act
            coordinator.shutdown();
            
            // Assert
            expect(coordinator.getRegisteredSessions()).toHaveLength(0);
            expect(coordinator.getActiveOperation(operationId)).toBeUndefined();
            expect(coordinator.getSharedResource('resource-1')).toBeUndefined();
        });
    });
});
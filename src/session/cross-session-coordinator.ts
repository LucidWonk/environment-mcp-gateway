/**
 * Cross-Session Coordinator for Context Engineering Multi-Client Operations
 * Enables coordination of Context Engineering operations across multiple client sessions
 * while preserving human approval gates and holistic update integrity
 */

import { EventEmitter } from 'events';
import { createMCPLogger } from '../utils/mcp-logger.js';
import { SessionContext } from './session-context.js';

const logger = createMCPLogger('cross-session-coordinator.log');

export interface CrossSessionOperation {
    operationId: string;
    operationType: 'holistic-update' | 'approval-gate' | 'context-generation' | 'rollback';
    initiatingSessionId: string;
    affectedSessions: string[];
    operationData: any;
    timestamp: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
    requiresApproval: boolean;
    approvalGateId?: string;
}

export interface SessionNotification {
    notificationId: string;
    targetSessionId: string;
    sourceSessionId: string;
    notificationType: 'context-update' | 'approval-required' | 'operation-complete' | 'conflict-detected';
    message: string;
    data: any;
    timestamp: Date;
    requiresAcknowledgment: boolean;
    acknowledged?: boolean;
}

export interface ApprovalRequest {
    approvalId: string;
    operationId: string;
    approvalType: 'human-gate' | 'cross-session-consensus' | 'conflict-resolution';
    requestingSessionId: string;
    approvalContext: any;
    requiredApprovers: string[];
    receivedApprovals: { sessionId: string; approved: boolean; timestamp: Date; comments?: string }[];
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    createdAt: Date;
    expiresAt?: Date;
}

export interface SharedResource {
    resourceId: string;
    resourceType: 'context-file' | 'domain-document' | 'approval-gate' | 'holistic-update';
    resourcePath: string;
    lockingSessionId?: string;
    lockedAt?: Date;
    lockTimeout: number;
    accessMode: 'read-only' | 'exclusive' | 'shared-write';
    pendingOperations: string[];
}

/**
 * Cross-Session Coordinator manages Context Engineering operations across multiple client sessions
 */
export class CrossSessionCoordinator extends EventEmitter {
    private static instance?: CrossSessionCoordinator;
    private activeOperations = new Map<string, CrossSessionOperation>();
    private pendingNotifications = new Map<string, SessionNotification[]>();
    private activeApprovals = new Map<string, ApprovalRequest>();
    private sharedResources = new Map<string, SharedResource>();
    private sessionContexts = new Map<string, SessionContext>();
    
    private constructor() {
        super();
        logger.info('CrossSessionCoordinator initialized');
        
        // Setup cleanup interval for expired operations and approvals
        setInterval(() => this.cleanupExpiredOperations(), 60000); // Every minute
    }
    
    static getInstance(): CrossSessionCoordinator {
        if (!this.instance) {
            this.instance = new CrossSessionCoordinator();
        }
        return this.instance;
    }
    
    /**
     * Register a session with the coordinator
     */
    registerSession(sessionContext: SessionContext): void {
        this.sessionContexts.set(sessionContext.sessionId, sessionContext);
        this.pendingNotifications.set(sessionContext.sessionId, []);
        
        logger.info('Session registered with cross-session coordinator', {
            sessionId: sessionContext.sessionId,
            userAgent: sessionContext.userAgent,
            totalSessions: this.sessionContexts.size
        });
        
        this.emit('session-registered', sessionContext);
    }
    
    /**
     * Unregister a session from the coordinator
     */
    unregisterSession(sessionId: string): void {
        logger.info('Unregistering session from cross-session coordinator', { sessionId });
        
        // Cancel any active operations initiated by this session
        this.cancelSessionOperations(sessionId);
        
        // Release any resources locked by this session
        this.releaseSessionResources(sessionId);
        
        // Clean up session data
        this.sessionContexts.delete(sessionId);
        this.pendingNotifications.delete(sessionId);
        
        logger.info('Session unregistered from cross-session coordinator', {
            sessionId,
            remainingSessions: this.sessionContexts.size
        });
        
        this.emit('session-unregistered', sessionId);
    }
    
    /**
     * Initiate a cross-session Context Engineering operation
     */
    async initiateOperation(
        operationType: CrossSessionOperation['operationType'],
        initiatingSessionId: string,
        operationData: any,
        affectedSessions?: string[]
    ): Promise<string> {
        const operationId = this.generateOperationId();
        
        // Determine affected sessions if not provided
        const targetSessions = affectedSessions || Array.from(this.sessionContexts.keys());
        
        const operation: CrossSessionOperation = {
            operationId,
            operationType,
            initiatingSessionId,
            affectedSessions: targetSessions,
            operationData,
            timestamp: new Date(),
            status: 'pending',
            requiresApproval: this.operationRequiresApproval(operationType, operationData)
        };
        
        this.activeOperations.set(operationId, operation);
        
        logger.info('Cross-session operation initiated', {
            operationId,
            operationType,
            initiatingSessionId,
            affectedSessions: targetSessions.length,
            requiresApproval: operation.requiresApproval
        });
        
        // If operation requires approval, create approval request
        if (operation.requiresApproval) {
            await this.createApprovalRequest(operation);
        } else {
            // Execute operation directly
            await this.executeOperation(operation);
        }
        
        this.emit('operation-initiated', operation);
        return operationId;
    }
    
    /**
     * Create an approval request for a cross-session operation
     */
    private async createApprovalRequest(operation: CrossSessionOperation): Promise<void> {
        const approvalId = this.generateApprovalId();
        
        const approvalRequest: ApprovalRequest = {
            approvalId,
            operationId: operation.operationId,
            approvalType: this.determineApprovalType(operation),
            requestingSessionId: operation.initiatingSessionId,
            approvalContext: this.buildApprovalContext(operation),
            requiredApprovers: this.determineRequiredApprovers(operation),
            receivedApprovals: [],
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        };
        
        this.activeApprovals.set(approvalId, approvalRequest);
        operation.approvalGateId = approvalId;
        
        // Notify affected sessions about approval requirement
        for (const sessionId of operation.affectedSessions) {
            await this.sendNotification(sessionId, {
                notificationId: this.generateNotificationId(),
                targetSessionId: sessionId,
                sourceSessionId: operation.initiatingSessionId,
                notificationType: 'approval-required',
                message: `Approval required for ${operation.operationType} operation`,
                data: {
                    operationId: operation.operationId,
                    approvalId,
                    approvalContext: approvalRequest.approvalContext
                },
                timestamp: new Date(),
                requiresAcknowledgment: true
            });
        }
        
        logger.info('Approval request created for cross-session operation', {
            approvalId,
            operationId: operation.operationId,
            approvalType: approvalRequest.approvalType,
            requiredApprovers: approvalRequest.requiredApprovers.length
        });
        
        this.emit('approval-request-created', approvalRequest);
    }
    
    /**
     * Process an approval response
     */
    async processApprovalResponse(
        approvalId: string,
        sessionId: string,
        approved: boolean,
        comments?: string
    ): Promise<boolean> {
        const approvalRequest = this.activeApprovals.get(approvalId);
        if (!approvalRequest) {
            throw new Error(`Approval request not found: ${approvalId}`);
        }
        
        // Check if session is authorized to approve
        if (!approvalRequest.requiredApprovers.includes(sessionId)) {
            throw new Error(`Session ${sessionId} not authorized to approve ${approvalId}`);
        }
        
        // Check if already responded
        const existingApproval = approvalRequest.receivedApprovals.find(a => a.sessionId === sessionId);
        if (existingApproval) {
            throw new Error(`Session ${sessionId} already provided approval for ${approvalId}`);
        }
        
        // Add approval response
        approvalRequest.receivedApprovals.push({
            sessionId,
            approved,
            timestamp: new Date(),
            comments
        });
        
        logger.info('Approval response received', {
            approvalId,
            sessionId,
            approved,
            receivedCount: approvalRequest.receivedApprovals.length,
            requiredCount: approvalRequest.requiredApprovers.length
        });
        
        // Check if all required approvals received
        const approvedCount = approvalRequest.receivedApprovals.filter(a => a.approved).length;
        const rejectedCount = approvalRequest.receivedApprovals.filter(a => !a.approved).length;
        const totalRequired = approvalRequest.requiredApprovers.length;
        
        if (rejectedCount > 0) {
            // Any rejection fails the approval
            approvalRequest.status = 'rejected';
            await this.handleApprovalRejection(approvalRequest);
        } else if (approvedCount === totalRequired) {
            // All required approvals received
            approvalRequest.status = 'approved';
            await this.handleApprovalSuccess(approvalRequest);
        }
        
        this.emit('approval-response-processed', {
            approvalId,
            sessionId,
            approved,
            finalStatus: approvalRequest.status
        });
        
        return approvalRequest.status !== 'pending';
    }
    
    /**
     * Handle successful approval
     */
    private async handleApprovalSuccess(approvalRequest: ApprovalRequest): Promise<void> {
        const operation = this.activeOperations.get(approvalRequest.operationId);
        if (!operation) {
            logger.error('Operation not found for approved request', {
                approvalId: approvalRequest.approvalId,
                operationId: approvalRequest.operationId
            });
            return;
        }
        
        logger.info('Operation approved, executing', {
            operationId: operation.operationId,
            approvalId: approvalRequest.approvalId
        });
        
        await this.executeOperation(operation);
        
        // Notify all affected sessions
        for (const sessionId of operation.affectedSessions) {
            await this.sendNotification(sessionId, {
                notificationId: this.generateNotificationId(),
                targetSessionId: sessionId,
                sourceSessionId: operation.initiatingSessionId,
                notificationType: 'operation-complete',
                message: `${operation.operationType} operation approved and executed`,
                data: { operationId: operation.operationId },
                timestamp: new Date(),
                requiresAcknowledgment: false
            });
        }
    }
    
    /**
     * Handle approval rejection
     */
    private async handleApprovalRejection(approvalRequest: ApprovalRequest): Promise<void> {
        const operation = this.activeOperations.get(approvalRequest.operationId);
        if (operation) {
            operation.status = 'cancelled';
            
            logger.info('Operation cancelled due to approval rejection', {
                operationId: operation.operationId,
                approvalId: approvalRequest.approvalId
            });
            
            // Notify all affected sessions
            for (const sessionId of operation.affectedSessions) {
                await this.sendNotification(sessionId, {
                    notificationId: this.generateNotificationId(),
                    targetSessionId: sessionId,
                    sourceSessionId: operation.initiatingSessionId,
                    notificationType: 'operation-complete',
                    message: `${operation.operationType} operation rejected and cancelled`,
                    data: { 
                        operationId: operation.operationId,
                        rejectionReasons: approvalRequest.receivedApprovals
                            .filter(a => !a.approved)
                            .map(a => a.comments)
                            .filter(c => c)
                    },
                    timestamp: new Date(),
                    requiresAcknowledgment: false
                });
            }
        }
    }
    
    /**
     * Execute a cross-session operation
     */
    private async executeOperation(operation: CrossSessionOperation): Promise<void> {
        operation.status = 'in-progress';
        
        try {
            logger.info('Executing cross-session operation', {
                operationId: operation.operationId,
                operationType: operation.operationType
            });
            
            switch (operation.operationType) {
            case 'holistic-update':
                await this.executeHolisticUpdate(operation);
                break;
            case 'context-generation':
                await this.executeContextGeneration(operation);
                break;
            case 'rollback':
                await this.executeRollback(operation);
                break;
            default:
                throw new Error(`Unknown operation type: ${operation.operationType}`);
            }
            
            operation.status = 'completed';
            logger.info('Cross-session operation completed successfully', {
                operationId: operation.operationId
            });
            
        } catch (error) {
            operation.status = 'failed';
            logger.error('Cross-session operation failed', {
                operationId: operation.operationId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
        
        this.emit('operation-completed', operation);
    }
    
    /**
     * Execute holistic update operation
     */
    private async executeHolisticUpdate(operation: CrossSessionOperation): Promise<void> {
        // This would integrate with the existing HolisticUpdateOrchestrator
        // but coordinate across multiple sessions
        logger.info('Executing holistic update with cross-session coordination', {
            operationId: operation.operationId,
            changedFiles: operation.operationData.changedFiles?.length || 0
        });
        
        // Lock shared resources
        const lockedResources = await this.lockSharedResources(operation.operationData.affectedResources, operation.initiatingSessionId);
        
        try {
            // Execute the holistic update
            // This would call the existing holistic update orchestrator
            // but ensure coordination across sessions
            
            // Notify all sessions of context updates
            for (const sessionId of operation.affectedSessions) {
                if (sessionId !== operation.initiatingSessionId) {
                    await this.sendNotification(sessionId, {
                        notificationId: this.generateNotificationId(),
                        targetSessionId: sessionId,
                        sourceSessionId: operation.initiatingSessionId,
                        notificationType: 'context-update',
                        message: 'Holistic context update completed',
                        data: { 
                            operationId: operation.operationId,
                            affectedDomains: operation.operationData.affectedDomains
                        },
                        timestamp: new Date(),
                        requiresAcknowledgment: false
                    });
                }
            }
        } finally {
            // Release locked resources
            await this.releaseSharedResources(lockedResources, operation.initiatingSessionId);
        }
    }
    
    /**
     * Execute context generation operation
     */
    private async executeContextGeneration(operation: CrossSessionOperation): Promise<void> {
        logger.info('Executing context generation with cross-session coordination', {
            operationId: operation.operationId
        });
        
        // Similar implementation to holistic update but for context generation
        // This would integrate with existing context generation services
    }
    
    /**
     * Execute rollback operation
     */
    private async executeRollback(operation: CrossSessionOperation): Promise<void> {
        logger.info('Executing rollback with cross-session coordination', {
            operationId: operation.operationId
        });
        
        // This would integrate with the existing rollback manager
        // but coordinate the rollback across all active sessions
    }
    
    /**
     * Send notification to a specific session
     */
    private async sendNotification(sessionId: string, notification: SessionNotification): Promise<void> {
        const sessionNotifications = this.pendingNotifications.get(sessionId);
        if (sessionNotifications) {
            sessionNotifications.push(notification);
            
            logger.debug('Notification queued for session', {
                sessionId,
                notificationId: notification.notificationId,
                notificationType: notification.notificationType
            });
            
            this.emit('notification-sent', notification);
        }
    }
    
    /**
     * Get pending notifications for a session
     */
    getPendingNotifications(sessionId: string): SessionNotification[] {
        return this.pendingNotifications.get(sessionId) || [];
    }
    
    /**
     * Acknowledge notification
     */
    acknowledgeNotification(sessionId: string, notificationId: string): boolean {
        const sessionNotifications = this.pendingNotifications.get(sessionId);
        if (sessionNotifications) {
            const notification = sessionNotifications.find(n => n.notificationId === notificationId);
            if (notification && notification.requiresAcknowledgment) {
                notification.acknowledged = true;
                logger.debug('Notification acknowledged', { sessionId, notificationId });
                return true;
            }
        }
        return false;
    }
    
    /**
     * Lock shared resources for exclusive access
     */
    private async lockSharedResources(resourceIds: string[], sessionId: string): Promise<string[]> {
        const lockedResources: string[] = [];
        
        for (const resourceId of resourceIds || []) {
            const resource = this.sharedResources.get(resourceId);
            if (resource) {
                if (resource.lockingSessionId && resource.lockingSessionId !== sessionId) {
                    throw new Error(`Resource ${resourceId} is locked by another session`);
                }
                
                resource.lockingSessionId = sessionId;
                resource.lockedAt = new Date();
                lockedResources.push(resourceId);
            }
        }
        
        logger.debug('Shared resources locked', { sessionId, lockedResources });
        return lockedResources;
    }
    
    /**
     * Release shared resources
     */
    private async releaseSharedResources(resourceIds: string[], sessionId: string): Promise<void> {
        for (const resourceId of resourceIds) {
            const resource = this.sharedResources.get(resourceId);
            if (resource && resource.lockingSessionId === sessionId) {
                resource.lockingSessionId = undefined;
                resource.lockedAt = undefined;
            }
        }
        
        logger.debug('Shared resources released', { sessionId, releasedResources: resourceIds });
    }
    
    /**
     * Cancel all operations for a session
     */
    private cancelSessionOperations(sessionId: string): void {
        for (const [operationId, operation] of this.activeOperations) {
            if (operation.initiatingSessionId === sessionId && operation.status === 'pending') {
                operation.status = 'cancelled';
                logger.info('Operation cancelled due to session disconnect', {
                    operationId,
                    sessionId
                });
            }
        }
    }
    
    /**
     * Release all resources locked by a session
     */
    private releaseSessionResources(sessionId: string): void {
        for (const [resourceId, resource] of this.sharedResources) {
            if (resource.lockingSessionId === sessionId) {
                resource.lockingSessionId = undefined;
                resource.lockedAt = undefined;
                logger.debug('Resource released due to session disconnect', {
                    resourceId,
                    sessionId
                });
            }
        }
    }
    
    /**
     * Clean up expired operations and approvals
     */
    private cleanupExpiredOperations(): void {
        const now = new Date();
        let cleanupCount = 0;
        
        // Clean up expired approvals
        for (const [approvalId, approval] of this.activeApprovals) {
            if (approval.expiresAt && approval.expiresAt < now && approval.status === 'pending') {
                approval.status = 'expired';
                this.activeApprovals.delete(approvalId);
                cleanupCount++;
                
                logger.info('Expired approval cleaned up', { approvalId });
            }
        }
        
        // Clean up completed operations older than 1 hour
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        for (const [operationId, operation] of this.activeOperations) {
            if (operation.timestamp < oneHourAgo && 
                ['completed', 'failed', 'cancelled'].includes(operation.status)) {
                this.activeOperations.delete(operationId);
                cleanupCount++;
            }
        }
        
        if (cleanupCount > 0) {
            logger.info('Cleanup completed', { cleanedUpItems: cleanupCount });
        }
    }
    
    // Helper methods
    private operationRequiresApproval(operationType: string, _operationData: any): boolean {
        // Define which operations require human approval
        return ['holistic-update', 'rollback'].includes(operationType);
    }
    
    private determineApprovalType(operation: CrossSessionOperation): ApprovalRequest['approvalType'] {
        if (operation.operationType === 'rollback') return 'conflict-resolution';
        return 'human-gate';
    }
    
    private buildApprovalContext(operation: CrossSessionOperation): any {
        return {
            operationType: operation.operationType,
            operationData: operation.operationData,
            initiatingSession: operation.initiatingSessionId,
            affectedSessions: operation.affectedSessions,
            timestamp: operation.timestamp
        };
    }
    
    private determineRequiredApprovers(operation: CrossSessionOperation): string[] {
        // For now, require approval from all affected sessions
        // In a more sophisticated implementation, this could be based on roles, permissions, etc.
        return operation.affectedSessions.filter(sessionId => sessionId !== operation.initiatingSessionId);
    }
    
    private generateOperationId(): string {
        return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private generateApprovalId(): string {
        return `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private generateNotificationId(): string {
        return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get coordinator metrics and status
     */
    getMetrics(): any {
        return {
            activeSessions: this.sessionContexts.size,
            activeOperations: this.activeOperations.size,
            pendingApprovals: this.activeApprovals.size,
            sharedResources: this.sharedResources.size,
            totalNotifications: Array.from(this.pendingNotifications.values())
                .reduce((sum, notifications) => sum + notifications.length, 0),
            timestamp: new Date().toISOString()
        };
    }
}
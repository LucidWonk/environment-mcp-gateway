/**
 * Cross-Session Coordinator for Context Engineering Multi-Client Operations
 * Enables coordination of Context Engineering operations across multiple client sessions
 * while preserving human approval gates and holistic update integrity
 */
import { EventEmitter } from 'events';
import { SessionContext } from './session-context.js';
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
    receivedApprovals: {
        sessionId: string;
        approved: boolean;
        timestamp: Date;
        comments?: string;
    }[];
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
export declare class CrossSessionCoordinator extends EventEmitter {
    private static instance?;
    private activeOperations;
    private pendingNotifications;
    private activeApprovals;
    private sharedResources;
    private sessionContexts;
    private constructor();
    static getInstance(): CrossSessionCoordinator;
    /**
     * Register a session with the coordinator
     */
    registerSession(sessionContext: SessionContext): void;
    /**
     * Unregister a session from the coordinator
     */
    unregisterSession(sessionId: string): void;
    /**
     * Initiate a cross-session Context Engineering operation
     */
    initiateOperation(operationType: CrossSessionOperation['operationType'], initiatingSessionId: string, operationData: any, affectedSessions?: string[]): Promise<string>;
    /**
     * Create an approval request for a cross-session operation
     */
    private createApprovalRequest;
    /**
     * Process an approval response
     */
    processApprovalResponse(approvalId: string, sessionId: string, approved: boolean, comments?: string): Promise<boolean>;
    /**
     * Handle successful approval
     */
    private handleApprovalSuccess;
    /**
     * Handle approval rejection
     */
    private handleApprovalRejection;
    /**
     * Execute a cross-session operation
     */
    private executeOperation;
    /**
     * Execute holistic update operation
     */
    private executeHolisticUpdate;
    /**
     * Execute context generation operation
     */
    private executeContextGeneration;
    /**
     * Execute rollback operation
     */
    private executeRollback;
    /**
     * Send notification to a specific session
     */
    private sendNotification;
    /**
     * Get pending notifications for a session
     */
    getPendingNotifications(sessionId: string): SessionNotification[];
    /**
     * Acknowledge notification
     */
    acknowledgeNotification(sessionId: string, notificationId: string): boolean;
    /**
     * Lock shared resources for exclusive access
     */
    private lockSharedResources;
    /**
     * Release shared resources
     */
    private releaseSharedResources;
    /**
     * Cancel all operations for a session
     */
    private cancelSessionOperations;
    /**
     * Release all resources locked by a session
     */
    private releaseSessionResources;
    /**
     * Clean up expired operations and approvals
     */
    private cleanupExpiredOperations;
    private operationRequiresApproval;
    private determineApprovalType;
    private buildApprovalContext;
    private determineRequiredApprovers;
    private generateOperationId;
    private generateApprovalId;
    private generateNotificationId;
    /**
     * Get coordinator metrics and status
     */
    getMetrics(): any;
}
//# sourceMappingURL=cross-session-coordinator.d.ts.map
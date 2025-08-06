/**
 * Approval Workflow Manager
 * Manages human approval workflows for document restructuring
 * Implements TEMP-CONTEXT-ENGINE-a7b3 approval workflow capability
 */
export interface ApprovalRequest {
    proposalId: string;
    type: 'document-migration' | 'capability-registry' | 'domain-restructuring';
    title: string;
    description: string;
    details: any;
    requiredApprovals: string[];
    priority: 'low' | 'normal' | 'urgent';
    submittedAt?: Date;
    submittedBy?: string;
}
export interface ApprovalResponse {
    approvalId: string;
    approver: string;
    decision: 'approved' | 'rejected' | 'request-changes';
    comments?: string;
    timestamp: Date;
    conditions?: string[];
}
export interface ApprovalWorkflow {
    approvalId: string;
    request: ApprovalRequest;
    status: 'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn';
    responses: ApprovalResponse[];
    createdAt: Date;
    expiresAt: Date;
    approvedAt?: Date;
    approvedBy?: string[];
    finalDecision?: 'approved' | 'rejected' | 'expired';
    consensusRequired: boolean;
    minimumApprovals: number;
}
/**
 * Manages approval workflows for document and registry changes
 * Provides human oversight for automated system operations
 */
export declare class ApprovalWorkflowManager {
    private activeWorkflows;
    private workflowHistory;
    private maxHistorySize;
    /**
     * Submit new approval request
     */
    submitRequest(request: ApprovalRequest): Promise<{
        approvalId: string;
        status: string;
    }>;
    /**
     * Submit approval response
     */
    submitResponse(approvalId: string, response: Omit<ApprovalResponse, 'approvalId' | 'timestamp'>): Promise<{
        status: string;
        finalDecision?: string;
    }>;
    /**
     * Check approval status
     */
    checkApproval(approvalId: string): Promise<string>;
    /**
     * Get approval details
     */
    getApprovalDetails(approvalId: string): Promise<ApprovalWorkflow>;
    /**
     * List pending approvals for a specific approver
     */
    getPendingApprovals(approver?: string): Promise<ApprovalWorkflow[]>;
    /**
     * Get workflow statistics
     */
    getWorkflowStatistics(since?: Date): {
        totalWorkflows: number;
        pendingCount: number;
        approvedCount: number;
        rejectedCount: number;
        expiredCount: number;
        averageResponseTime: number;
        approvalRate: number;
    };
    /**
     * Withdraw approval request
     */
    withdrawRequest(approvalId: string, reason?: string): Promise<{
        status: string;
    }>;
    private generateApprovalId;
    private getExpirationHours;
    private evaluateFinalDecision;
    private archiveWorkflow;
    private sendApprovalNotifications;
    /**
     * Simulate approval for testing (remove in production)
     */
    simulateApproval(approvalId: string, decision: 'approved' | 'rejected', approver?: string): Promise<{
        status: string;
        finalDecision?: string;
    }>;
}
//# sourceMappingURL=approval-workflow.d.ts.map
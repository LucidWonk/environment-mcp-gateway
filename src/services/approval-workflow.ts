/**
 * Approval Workflow Manager
 * Manages human approval workflows for document restructuring
 * Implements TEMP-CONTEXT-ENGINE-a7b3 approval workflow capability
 */

import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'approval-workflow.log' })
    ]
});

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
export class ApprovalWorkflowManager {
    private activeWorkflows: Map<string, ApprovalWorkflow> = new Map();
    private workflowHistory: ApprovalWorkflow[] = [];
    private maxHistorySize = 1000;

    /**
     * Submit new approval request
     */
    async submitRequest(request: ApprovalRequest): Promise<{ approvalId: string; status: string }> {
        logger.info(`Submitting approval request: ${request.type} - ${request.title}`);

        const approvalId = this.generateApprovalId();
        const expirationHours = this.getExpirationHours(request.priority);
        
        const workflow: ApprovalWorkflow = {
            approvalId,
            request: {
                ...request,
                submittedAt: new Date(),
                submittedBy: 'context-engineering-system'
            },
            status: 'pending',
            responses: [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
            consensusRequired: request.requiredApprovals.length > 1,
            minimumApprovals: Math.ceil(request.requiredApprovals.length * 0.6) // 60% consensus
        };

        this.activeWorkflows.set(approvalId, workflow);

        // Send notifications (simplified implementation)
        await this.sendApprovalNotifications(workflow);

        logger.info(`Approval request created: ${approvalId} (expires: ${workflow.expiresAt.toISOString()})`);

        return {
            approvalId,
            status: 'pending'
        };
    }

    /**
     * Submit approval response
     */
    async submitResponse(approvalId: string, response: Omit<ApprovalResponse, 'approvalId' | 'timestamp'>): Promise<{ status: string; finalDecision?: string }> {
        logger.info(`Processing approval response: ${approvalId} - ${response.decision}`);

        const workflow = this.activeWorkflows.get(approvalId);
        if (!workflow) {
            throw new Error(`Approval workflow not found: ${approvalId}`);
        }

        if (workflow.status !== 'pending') {
            throw new Error(`Workflow is not pending. Current status: ${workflow.status}`);
        }

        if (workflow.expiresAt < new Date()) {
            workflow.status = 'expired';
            workflow.finalDecision = 'expired';
            this.archiveWorkflow(workflow);
            throw new Error(`Approval workflow has expired: ${approvalId}`);
        }

        // Add response
        const approvalResponse: ApprovalResponse = {
            ...response,
            approvalId,
            timestamp: new Date()
        };

        workflow.responses.push(approvalResponse);

        // Check if decision is final
        const finalDecision = this.evaluateFinalDecision(workflow);
        
        if (finalDecision) {
            workflow.status = finalDecision;
            workflow.finalDecision = finalDecision;
            workflow.approvedAt = new Date();
            workflow.approvedBy = workflow.responses
                .filter(r => r.decision === 'approved')
                .map(r => r.approver);

            this.archiveWorkflow(workflow);

            logger.info(`Approval workflow finalized: ${approvalId} - ${finalDecision}`);
        }

        return {
            status: workflow.status,
            finalDecision: workflow.finalDecision
        };
    }

    /**
     * Check approval status
     */
    async checkApproval(approvalId: string): Promise<string> {
        // Check active workflows
        const activeWorkflow = this.activeWorkflows.get(approvalId);
        if (activeWorkflow) {
            // Check for expiration
            if (activeWorkflow.expiresAt < new Date() && activeWorkflow.status === 'pending') {
                activeWorkflow.status = 'expired';
                activeWorkflow.finalDecision = 'expired';
                this.archiveWorkflow(activeWorkflow);
                return 'expired';
            }
            return activeWorkflow.status;
        }

        // Check historical workflows
        const historicalWorkflow = this.workflowHistory.find(w => w.approvalId === approvalId);
        if (historicalWorkflow) {
            return historicalWorkflow.status;
        }

        throw new Error(`Approval workflow not found: ${approvalId}`);
    }

    /**
     * Get approval details
     */
    async getApprovalDetails(approvalId: string): Promise<ApprovalWorkflow> {
        const workflow = this.activeWorkflows.get(approvalId) || 
                        this.workflowHistory.find(w => w.approvalId === approvalId);
        
        if (!workflow) {
            throw new Error(`Approval workflow not found: ${approvalId}`);
        }

        return { ...workflow }; // Return copy to prevent external modification
    }

    /**
     * List pending approvals for a specific approver
     */
    async getPendingApprovals(approver?: string): Promise<ApprovalWorkflow[]> {
        const pending = Array.from(this.activeWorkflows.values())
            .filter(w => w.status === 'pending')
            .filter(w => w.expiresAt > new Date()) // Not expired
            .filter(w => !approver || w.request.requiredApprovals.includes(approver));

        return pending.map(w => ({ ...w })); // Return copies
    }

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
    } {
        const allWorkflows = [
            ...Array.from(this.activeWorkflows.values()),
            ...this.workflowHistory
        ];

        const filteredWorkflows = since 
            ? allWorkflows.filter(w => w.createdAt >= since)
            : allWorkflows;

        const completedWorkflows = filteredWorkflows.filter(w => w.finalDecision);
        const averageResponseTime = completedWorkflows.length > 0
            ? completedWorkflows.reduce((sum, w) => {
                return sum + (w.approvedAt?.getTime() || w.createdAt.getTime()) - w.createdAt.getTime();
            }, 0) / completedWorkflows.length
            : 0;

        const approvedCount = filteredWorkflows.filter(w => w.status === 'approved').length;
        const approvalRate = completedWorkflows.length > 0 ? approvedCount / completedWorkflows.length : 0;

        return {
            totalWorkflows: filteredWorkflows.length,
            pendingCount: filteredWorkflows.filter(w => w.status === 'pending').length,
            approvedCount: filteredWorkflows.filter(w => w.status === 'approved').length,
            rejectedCount: filteredWorkflows.filter(w => w.status === 'rejected').length,
            expiredCount: filteredWorkflows.filter(w => w.status === 'expired').length,
            averageResponseTime,
            approvalRate
        };
    }

    /**
     * Withdraw approval request
     */
    async withdrawRequest(approvalId: string, reason?: string): Promise<{ status: string }> {
        logger.info(`Withdrawing approval request: ${approvalId}`);

        const workflow = this.activeWorkflows.get(approvalId);
        if (!workflow) {
            throw new Error(`Approval workflow not found: ${approvalId}`);
        }

        if (workflow.status !== 'pending') {
            throw new Error(`Cannot withdraw non-pending workflow. Current status: ${workflow.status}`);
        }

        workflow.status = 'withdrawn';
        workflow.finalDecision = 'rejected'; // Treat withdrawal as rejection
        
        if (reason) {
            workflow.responses.push({
                approvalId,
                approver: 'system',
                decision: 'rejected',
                comments: `Withdrawn: ${reason}`,
                timestamp: new Date()
            });
        }

        this.archiveWorkflow(workflow);

        logger.info(`Approval request withdrawn: ${approvalId}`);
        
        return { status: 'withdrawn' };
    }

    // Private helper methods

    private generateApprovalId(): string {
        return `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private getExpirationHours(priority: string): number {
        switch (priority) {
        case 'urgent': return 4;   // 4 hours
        case 'normal': return 24;  // 24 hours
        case 'low': return 72;     // 72 hours
        default: return 24;
        }
    }

    private evaluateFinalDecision(workflow: ApprovalWorkflow): 'approved' | 'rejected' | null {
        const responses = workflow.responses;
        const rejections = responses.filter(r => r.decision === 'rejected').length;
        const approvals = responses.filter(r => r.decision === 'approved').length;
        const changeRequests = responses.filter(r => r.decision === 'request-changes').length;

        // Immediate rejection if any required approver rejects
        if (rejections > 0) {
            return 'rejected';
        }

        // Need to address change requests before approval
        if (changeRequests > 0) {
            return null; // Still pending
        }

        // Check if enough approvals received
        if (approvals >= workflow.minimumApprovals) {
            // For consensus required, check if all required approvers responded positively
            if (workflow.consensusRequired) {
                const responseCount = responses.length;
                const requiredCount = workflow.request.requiredApprovals.length;
                
                if (responseCount >= requiredCount && approvals === responseCount) {
                    return 'approved';
                }
            } else {
                return 'approved';
            }
        }

        return null; // Still pending
    }

    private archiveWorkflow(workflow: ApprovalWorkflow): void {
        this.activeWorkflows.delete(workflow.approvalId);
        this.workflowHistory.push(workflow);

        // Maintain history size limit
        if (this.workflowHistory.length > this.maxHistorySize) {
            this.workflowHistory.shift(); // Remove oldest
        }
    }

    private async sendApprovalNotifications(workflow: ApprovalWorkflow): Promise<void> {
        // Simplified notification system - in real implementation would send emails, Slack messages, etc.
        logger.info(`Would send notifications to: ${workflow.request.requiredApprovals.join(', ')}`);
        logger.info(`Approval request: ${workflow.request.title}`);
        logger.info(`Description: ${workflow.request.description}`);
        logger.info(`Priority: ${workflow.request.priority}`);
        logger.info(`Expires: ${workflow.expiresAt.toISOString()}`);
        
        // In real implementation, this would integrate with:
        // - Email system
        // - Slack/Teams notifications  
        // - Web dashboard
        // - Mobile push notifications
    }

    /**
     * Simulate approval for testing (remove in production)
     */
    async simulateApproval(approvalId: string, decision: 'approved' | 'rejected', approver: string = 'test-approver'): Promise<{ status: string; finalDecision?: string }> {
        logger.warn(`SIMULATION: Auto-approving ${approvalId} with decision: ${decision}`);
        
        return this.submitResponse(approvalId, {
            approver,
            decision,
            comments: `Simulated approval for testing purposes: ${decision}`
        });
    }
}
interface ExpertAssignment {
    coordinationPattern: string;
    taskPersistence: {
        enabled: boolean;
        sessionId: string;
        crossSessionAccess: boolean;
    };
    expertAllocation: {
        primaryExpert: string;
        secondaryExperts: string[];
        allocationStrategy: string;
    };
    trackingMetadata: {
        assignmentId: string;
        timestamp: string;
        version: string;
    };
}
interface HandoffRequest {
    taskId: string;
    sourceAgent: string;
    targetExpert: string;
    contextScope: string;
    subtaskDescription: string;
    contextPayload: string;
    urgency: string;
}
export declare class TaskToolVETIntegration {
    assignExperts(taskId: string, workflowDescription: string, expertSelection: any): Promise<ExpertAssignment>;
    initiateHandoff(request: HandoffRequest): Promise<string>;
    getHandoffStatus(handoffId: string): Promise<any>;
    completeHandoff(handoffId: string, results: any): Promise<void>;
    getPerformanceMetrics(): Record<string, any>;
    cleanup(): Promise<void>;
}
export declare const taskToolVETIntegration: TaskToolVETIntegration;
export {};
//# sourceMappingURL=task-tool-vet-integration.d.ts.map
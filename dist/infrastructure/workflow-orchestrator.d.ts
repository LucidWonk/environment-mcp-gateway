import { EventEmitter } from 'events';
export interface WorkflowStep {
    stepId: string;
    stepType: 'conversation-init' | 'context-sync' | 'conflict-resolution' | 'consensus-building' | 'decision-finalization' | 'custom';
    agentId?: string;
    dependencies: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: number;
    result?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
    timeout?: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    metadata?: Record<string, any>;
}
export interface WorkflowDefinition {
    workflowId: string;
    name: string;
    description: string;
    coordinationType: 'sequential' | 'parallel' | 'conditional' | 'hybrid';
    participants: string[];
    steps: WorkflowStep[];
    globalTimeout?: number;
    retryPolicy: 'none' | 'step-level' | 'workflow-level' | 'adaptive';
    errorHandling: 'fail-fast' | 'continue-on-error' | 'rollback' | 'escalate';
    version: string;
    createdBy: string;
    createdAt: string;
}
export interface WorkflowExecution {
    executionId: string;
    workflowId: string;
    status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    currentStep?: string;
    completedSteps: string[];
    failedSteps: string[];
    startTime: string;
    endTime?: string;
    totalDuration?: number;
    participantStates: Map<string, AgentState>;
    executionContext: Record<string, any>;
    checkpoints: WorkflowCheckpoint[];
    metrics: WorkflowMetrics;
}
export interface AgentState {
    agentId: string;
    status: 'idle' | 'active' | 'busy' | 'offline' | 'error';
    currentTask?: string;
    assignedSteps: string[];
    completedSteps: string[];
    lastActivity: string;
    performance: {
        averageResponseTime: number;
        successRate: number;
        taskCompletionRate: number;
    };
    capabilities: string[];
    workload: number;
}
export interface WorkflowCheckpoint {
    checkpointId: string;
    executionId: string;
    timestamp: string;
    completedSteps: string[];
    executionState: Record<string, any>;
    participantStates: Map<string, AgentState>;
    canRollbackTo: boolean;
    description: string;
}
export interface WorkflowMetrics {
    executionId: string;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    averageStepDuration: number;
    longestStepDuration: number;
    participantUtilization: Map<string, number>;
    resourceUsage: {
        memoryPeak: number;
        cpuAverage: number;
        networkRequests: number;
    };
    bottlenecks: string[];
    optimizationSuggestions: string[];
}
export interface CoordinationPattern {
    patternId: string;
    name: string;
    description: string;
    applicableScenarios: string[];
    steps: Partial<WorkflowStep>[];
    coordinationType: string;
    expectedParticipants: number;
    estimatedDuration: number;
    complexityScore: number;
}
export declare class WorkflowOrchestrator extends EventEmitter {
    private workflowDefinitions;
    private activeExecutions;
    private agentStates;
    private checkpoints;
    private coordinationPatterns;
    private executionQueue;
    constructor();
    createWorkflowDefinition(name: string, coordinationType: string, participants: string[], steps: Partial<WorkflowStep>[], options?: {
        description?: string;
        globalTimeout?: number;
        retryPolicy?: string;
        errorHandling?: string;
    }): Promise<string>;
    executeWorkflow(workflowId: string, initialContext?: Record<string, any>, options?: {
        priority?: 'low' | 'normal' | 'high' | 'critical';
        scheduledFor?: string;
        maxConcurrency?: number;
    }): Promise<string>;
    executeStep(executionId: string, stepId: string): Promise<any>;
    getWorkflowStatus(executionId: string): Promise<any>;
    pauseWorkflow(executionId: string): Promise<void>;
    resumeWorkflow(executionId: string): Promise<void>;
    cancelWorkflow(executionId: string, reason?: string): Promise<void>;
    private initializeCoordinationPatterns;
    private startOrchestrationEngine;
    private processExecutionQueue;
    private startWorkflowExecution;
    private executeSequential;
    private executeParallel;
    private executeConditional;
    private executeHybrid;
    private validateStepDependencies;
    private checkStepDependencies;
    private executeStepByType;
    private executeConversationInit;
    private executeContextSync;
    private executeConflictResolution;
    private executeConsensusBuilding;
    private executeDecisionFinalization;
    private executeCustomStep;
    private initializeAgentState;
    private initializeWorkflowMetrics;
    private createCheckpoint;
    private updateStepMetrics;
    private handleStepError;
    private continueWorkflowExecution;
    private completeWorkflowExecution;
    private cleanupWorkflowExecution;
    private monitorActiveExecutions;
    private cleanupCompletedExecutions;
    private estimateCompletionTime;
    private calculateExecutionHealth;
    private evaluateStepCondition;
    private groupStepsByDependencies;
    private rollbackToLastCheckpoint;
    private escalateError;
    getActiveExecutions(): string[];
    getWorkflowDefinitions(): string[];
    getCoordinationPatterns(): CoordinationPattern[];
    getSystemMetrics(): Promise<Record<string, any>>;
}
export declare const workflowOrchestrator: WorkflowOrchestrator;
//# sourceMappingURL=workflow-orchestrator.d.ts.map
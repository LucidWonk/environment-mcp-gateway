import { EventEmitter } from 'events';
export interface ConversationAgent {
    agentId: string;
    expertType: string;
    role: 'primary' | 'secondary' | 'observer' | 'mediator';
    capabilities: string[];
    status: 'active' | 'idle' | 'busy' | 'offline';
    connectionId?: string;
}
export interface ConversationMessage {
    messageId: string;
    conversationId: string;
    senderId: string;
    recipientIds: string[];
    messageType: 'task-assignment' | 'status-update' | 'question' | 'response' | 'coordination' | 'completion';
    content: {
        text: string;
        metadata?: Record<string, any>;
        attachments?: any[];
    };
    timestamp: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    requiresResponse: boolean;
    responseDeadline?: string;
}
export interface ConversationContext {
    conversationId: string;
    taskId: string;
    initiatorAgentId: string;
    participants: ConversationAgent[];
    conversationState: 'initializing' | 'active' | 'paused' | 'completing' | 'completed' | 'failed';
    contextScope: 'focused' | 'comprehensive' | 'cross-domain' | 'system-wide';
    sharedContext: {
        taskDescription: string;
        currentObjective: string;
        sharedData: Record<string, any>;
        decisions: Array<{
            decisionId: string;
            description: string;
            decidedBy: string;
            timestamp: string;
            consensus: boolean;
        }>;
        workflowId?: string;
        executionId?: string;
        activeConflictId?: string;
    };
    coordinationPattern: 'round-robin' | 'hierarchical' | 'collaborative' | 'consensus-driven' | 'leader-follower';
    messageHistory: ConversationMessage[];
    createdAt: string;
    lastActivity: string;
    timeoutSettings: {
        responseTimeout: number;
        inactivityTimeout: number;
        totalConversationTimeout: number;
    };
    contextSyncId?: string;
    contextSyncEnabled: boolean;
}
export interface ConversationRule {
    ruleId: string;
    ruleName: string;
    condition: {
        agentRoles?: string[];
        messageTypes?: string[];
        urgencyLevels?: string[];
        conversationStates?: string[];
    };
    action: {
        type: 'route' | 'escalate' | 'notify' | 'transform' | 'validate' | 'archive';
        parameters: Record<string, any>;
    };
    priority: number;
    enabled: boolean;
}
export interface ConversationMetrics {
    conversationId: string;
    participantCount: number;
    messageCount: number;
    averageResponseTime: number;
    consensusRate: number;
    conflictCount: number;
    taskCompletionRate: number;
    coordinationEfficiency: number;
    lastUpdated: string;
}
export declare class MultiAgentConversationManager extends EventEmitter {
    private conversations;
    private conversationRules;
    private activeAgents;
    private messageQueue;
    private conversationsByState;
    private messagesByUrgency;
    private agentsByStatus;
    constructor();
    private initializePerformanceIndexes;
    private updateConversationStateIndex;
    private updateAgentStatusIndex;
    private setConversationState;
    initiateConversation(taskId: string, initiatorAgentId: string, participants: Omit<ConversationAgent, 'status' | 'connectionId'>[], options: {
        contextScope?: 'focused' | 'comprehensive' | 'cross-domain' | 'system-wide';
        coordinationPattern?: 'round-robin' | 'hierarchical' | 'collaborative' | 'consensus-driven' | 'leader-follower';
        taskDescription: string;
        initialObjective: string;
        timeoutSettings?: Partial<ConversationContext['timeoutSettings']>;
        enableContextSync?: boolean;
        initialSharedData?: Record<string, any>;
    }): Promise<string>;
    routeMessage(message: Omit<ConversationMessage, 'messageId' | 'timestamp'>): Promise<string>;
    getConversationStatus(conversationId: string): Promise<ConversationContext | null>;
    addConversationRule(rule: Omit<ConversationRule, 'ruleId'>): Promise<string>;
    getConversationMetrics(conversationId: string): Promise<ConversationMetrics | null>;
    completeConversation(conversationId: string, completionReason: string): Promise<void>;
    updateSharedContext(conversationId: string, agentId: string, contextKey: string, contextValue: any, options?: {
        mergeStrategy?: 'replace' | 'merge' | 'append';
        requiresConsensus?: boolean;
        priority?: 'low' | 'normal' | 'high' | 'critical';
    }): Promise<string>;
    syncConversationContext(conversationId: string, targetAgents?: string[]): Promise<void>;
    getContextSyncStatus(conversationId: string): Promise<any>;
    createContextSnapshot(conversationId: string, description: string, createdBy: string): Promise<string | null>;
    rollbackContext(conversationId: string, versionId: string): Promise<void>;
    private initializeDefaultRules;
    private startConversationMonitoring;
    private monitorConversationHealth;
    private getApplicableRules;
    private executeRule;
    private handleEscalation;
    private handleNotification;
    private handleRouting;
    private handleTransformation;
    private handleValidation;
    private handleArchival;
    private calculateCoordinationEfficiency;
    getActiveConversations(): string[];
    getConversationsByAgent(agentId: string): string[];
    createConversationWorkflow(conversationId: string, workflowType: 'consensus-decision' | 'parallel-analysis' | 'escalation-hierarchy' | 'custom', options?: {
        steps?: Array<{
            stepType: string;
            priority?: string;
            dependencies?: string[];
            timeout?: number;
        }>;
        coordinationType?: string;
        errorHandling?: string;
        globalTimeout?: number;
    }): Promise<string>;
    executeConversationWorkflow(conversationId: string, priority?: 'low' | 'normal' | 'high' | 'critical'): Promise<string>;
    getConversationWorkflowStatus(conversationId: string): Promise<any>;
    pauseConversationWorkflow(conversationId: string): Promise<void>;
    resumeConversationWorkflow(conversationId: string): Promise<void>;
    resolveConversationConflict(conversationId: string, conflictData: {
        conflictType: string;
        positions: Array<{
            agentId: string;
            position: string;
            reasoning: string;
            confidence: number;
        }>;
        resolutionStrategy?: string;
        timeoutMinutes?: number;
    }): Promise<string>;
    private getWorkflowStepsForType;
    private getCoordinationTypeForWorkflow;
    private getAgentExpertise;
    private calculateAgentWeight;
    private calculateConversationHealth;
    getSystemMetrics(): Promise<Record<string, any>>;
    private calculateAverageConversationDuration;
    private calculateMessageProcessingRate;
    startCoordinationMonitoring(conversationId: string): Promise<void>;
    updateConversationMonitoring(conversationId: string, updates: {
        messageCount?: number;
        activeParticipants?: number;
        consensusLevel?: number;
        conflictCount?: number;
    }): Promise<void>;
    stopConversationMonitoring(conversationId: string, finalStatus: 'completed' | 'failed' | 'cancelled'): Promise<void>;
    getConversationMonitoringMetrics(conversationId: string): Promise<any>;
    getConversationHealthReport(conversationId: string): Promise<any>;
    createConversationAlert(metricType: 'response-time' | 'participation-rate' | 'consensus-level' | 'conflict-rate', threshold: number, severity: 'info' | 'warning' | 'error' | 'critical'): Promise<string>;
    getSystemMonitoringDashboard(): Promise<any>;
    private setupMonitoringEventHandlers;
    private cleanupMonitoringEventHandlers;
    private estimateConversationSteps;
    private calculateAverageResponseTime;
    private calculateConversationThroughput;
    private calculateConsensusLevel;
    private calculateConversationSuccessRate;
    private estimateConversationCPUUsage;
    private estimateConversationMemoryUsage;
    private estimateConversationNetworkUsage;
    private generateConversationRecommendations;
    private calculateSystemHealth;
    private generateSystemRecommendations;
}
export declare const multiAgentConversationManager: MultiAgentConversationManager;
//# sourceMappingURL=multi-agent-conversation-manager.d.ts.map
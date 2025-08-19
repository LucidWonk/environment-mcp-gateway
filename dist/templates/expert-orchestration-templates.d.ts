/**
 * Template System v4.0.0 - Expert Coordination Orchestration Templates
 * Phase 3 Step 3.1 Subtask A: Template v4.0.0 orchestration framework implementation
 *
 * Integrates Virtual Expert Team coordination patterns with template execution workflow.
 * Maintains template authority while leveraging expert guidance throughout ICP execution.
 */
import { WorkflowOrchestrator } from '../infrastructure/workflow-orchestrator.js';
import { MultiAgentConversationManager } from '../services/multi-agent-conversation-manager.js';
import { EventEmitter } from 'events';
export interface ExpertCoordinationTemplate {
    templateId: string;
    templateName: string;
    version: '4.0.0';
    expertCoordinationEnabled: boolean;
    templateType: 'implementation.icp' | 'concept.req' | 'codification.icp' | 'domain.req' | 'digital.req';
    expertRequirements: ExpertRequirement[];
    coordinationPatterns: TemplateCoordinationPattern[];
    humanApprovalGates: HumanApprovalGate[];
    expertGuidancePoints: ExpertGuidancePoint[];
    contextIntegration: TemplateContextIntegration;
    performanceMetrics: TemplatePerformanceMetrics;
    orchestrationWorkflow: TemplateOrchestrationWorkflow;
}
export interface ExpertRequirement {
    expertType: 'Architecture' | 'Cybersecurity' | 'Performance' | 'Financial Quant' | 'DevOps' | 'Process Engineer' | 'QA' | 'Context Engineering Compliance Agent';
    role: 'primary' | 'secondary' | 'observer' | 'mandatory';
    requiredCapabilities: string[];
    activationTriggers: string[];
    coordinationScope: 'template-wide' | 'phase-specific' | 'step-specific';
    confidenceThreshold: number;
}
export interface TemplateCoordinationPattern {
    patternId: string;
    patternName: string;
    applicablePhases: string[];
    coordinationType: 'sequential' | 'parallel' | 'consensus-driven' | 'escalation-hierarchy';
    expertHandoffTriggers: string[];
    contextTransferScope: 'full' | 'focused' | 'minimal';
    integrationStrategy: 'template-authority' | 'expert-guided' | 'collaborative';
    performanceTargets: {
        maxCoordinationOverhead: number;
        expertResponseTime: number;
        contextTransferIntegrity: number;
    };
}
export interface HumanApprovalGate {
    gateId: string;
    gateName: string;
    triggerConditions: string[];
    requiredApprovals: string[];
    expertRecommendationContext: boolean;
    timeoutPolicy: 'escalate' | 'auto-approve' | 'auto-reject';
    timeoutDuration: number;
    escalationPath: string[];
}
export interface ExpertGuidancePoint {
    guidanceId: string;
    guidanceName: string;
    phase: string;
    step?: string;
    expertTypes: string[];
    guidanceType: 'validation' | 'recommendation' | 'analysis' | 'conflict-resolution';
    inputRequirements: string[];
    outputFormat: 'structured' | 'narrative' | 'checklist' | 'risk-assessment';
    integrationMethod: 'inline' | 'referenced' | 'appendix';
    mandatory: boolean;
}
export interface TemplateContextIntegration {
    contextSyncEnabled: boolean;
    contextSyncScope: 'phase-level' | 'step-level' | 'real-time';
    contextValidation: boolean;
    expertContextEnhancement: boolean;
    hierarchicalContextSupport: boolean;
    crossDomainCoordination: boolean;
}
export interface TemplatePerformanceMetrics {
    expertSelectionAccuracy: number;
    coordinationOverhead: number;
    expertResponseTime: number;
    contextTransferIntegrity: number;
    humanApprovalLatency: number;
    templateExecutionSuccess: number;
}
export interface TemplateOrchestrationWorkflow {
    workflowId: string;
    phases: OrchestrationPhase[];
    expertCoordinationSteps: OrchestrationStep[];
    fallbackStrategies: FallbackStrategy[];
    errorHandlingPolicy: 'fail-fast' | 'expert-escalation' | 'graceful-degradation';
    monitoringConfig: OrchestrationMonitoring;
}
export interface OrchestrationPhase {
    phaseId: string;
    phaseName: string;
    expertRequirements: string[];
    coordinationPattern: string;
    humanApprovalRequired: boolean;
    expertGuidanceRequired: boolean;
    contextSyncRequired: boolean;
    dependencies: string[];
}
export interface OrchestrationStep {
    stepId: string;
    stepName: string;
    stepType: 'expert-selection' | 'expert-coordination' | 'context-transfer' | 'human-approval' | 'template-execution' | 'validation';
    expertTypes?: string[];
    coordinationData: Record<string, any>;
    timeoutMs: number;
    retryPolicy: 'none' | 'exponential-backoff' | 'fixed-delay';
    maxRetries: number;
}
export interface FallbackStrategy {
    strategyId: string;
    triggerConditions: string[];
    fallbackAction: 'template-only' | 'minimal-expert' | 'human-escalation' | 'cached-expert-guidance';
    description: string;
}
export interface OrchestrationMonitoring {
    metricsCollection: boolean;
    performanceThresholds: Record<string, number>;
    alertingEnabled: boolean;
    dashboardIntegration: boolean;
}
/**
 * Template System v4.0.0 Expert Orchestration Engine
 * Orchestrates expert coordination during template execution while maintaining template authority
 */
export declare class ExpertOrchestrationTemplates extends EventEmitter {
    private readonly workflowOrchestrator;
    private readonly conversationManager;
    private readonly templates;
    private readonly activeOrchestrations;
    private readonly expertCache;
    constructor(workflowOrchestrator: WorkflowOrchestrator, conversationManager: MultiAgentConversationManager);
    /**
     * Create an expert-coordinated template execution orchestration
     * Phase 3 Step 3.1: Core Template Orchestration
     */
    createTemplateOrchestration(templateType: string, executionContext: Record<string, any>, options?: {
        expertCoordinationLevel?: 'minimal' | 'standard' | 'comprehensive';
        humanApprovalRequired?: boolean;
        performanceTargets?: Partial<TemplatePerformanceMetrics>;
    }): Promise<string>;
    /**
     * Execute template phase with expert coordination
     * Phase 3 Step 3.1: Expert-Coordinated Phase Execution
     */
    executeTemplatePhase(orchestrationId: string, phaseId: string, phaseContext: Record<string, any>): Promise<ExpertCoordinatedPhaseResult>;
    /**
     * Complete template orchestration with final validation
     * Phase 3 Step 3.1: Orchestration Completion
     */
    completeTemplateOrchestration(orchestrationId: string, completionContext: Record<string, any>): Promise<TemplateOrchestrationCompletion>;
    /**
     * Get orchestration status and metrics
     * Phase 3 Step 3.1: Status and Monitoring
     */
    getOrchestrationStatus(orchestrationId: string): Promise<TemplateOrchestrationStatus | null>;
    private initializeDefaultTemplates;
    private setupEventHandlers;
    private getTemplateByType;
    private createExpertCoordinationWorkflow;
    private initializePerformanceMetrics;
    private selectExpertsForPhase;
    private executeExpertCoordination;
    private executeHumanApprovalGate;
    private executeTemplatePhaseWithGuidance;
    private updatePhasePerformanceMetrics;
    private calculateContextIntegrity;
    private executeFinalExpertValidation;
    private calculateFinalPerformanceMetrics;
    private generateOrchestrationSummary;
    private calculateExpertEffectiveness;
    private checkPerformanceTargets;
    private cleanupOrchestration;
    private estimateOrchestrationCompletion;
    private calculateExpertSelectionAccuracy;
    private calculateCoordinationEfficiency;
    private verifyTemplateAuthority;
}
interface ExpertSelection {
    expertType: string;
    expertId: string;
    role: string;
    confidence: number;
    capabilities: string[];
}
interface ExpertCoordinationResult {
    coordinationId: string;
    duration: number;
    recommendations: ExpertRecommendation[];
    consensusLevel: number;
    contextIntegrity: number;
}
interface ExpertRecommendation {
    expertType: string;
    recommendation: string;
    confidence: number;
    rationale: string;
}
interface HumanApprovalResult {
    approvalId: string;
    approved: boolean;
    duration: number;
    approver: string;
    comments: string;
}
interface TemplatePhaseResult {
    phaseId: string;
    status: string;
    executionTime: number;
    outputs: Record<string, any>;
    expertGuidanceApplied: boolean;
}
interface ExpertCoordinatedPhaseResult {
    orchestrationId: string;
    phaseId: string;
    status: string;
    selectedExperts: ExpertSelection[];
    coordinationResult: ExpertCoordinationResult | null;
    approvalResult: HumanApprovalResult | null;
    templateResult: TemplatePhaseResult;
    executionTime: number;
    contextIntegrity: number;
    expertGuidanceApplied: number;
    performanceMetrics: {
        expertSelectionTime: number;
        coordinationTime: number;
        approvalTime: number;
        templateExecutionTime: number;
        totalOverhead: number;
    };
}
interface TemplateOrchestrationCompletion {
    orchestrationId: string;
    templateId: string;
    status: string;
    totalDuration: number;
    finalMetrics: TemplatePerformanceMetrics;
    finalValidation: ExpertValidationResult;
    summary: OrchestrationSummary;
    expertParticipation: {
        totalExperts: number;
        coordinationSessions: number;
        averageContextIntegrity: number;
        expertEffectiveness: number;
    };
    qualityAssurance: {
        templateAuthorityMaintained: boolean;
        expertGuidanceIntegrated: boolean;
        humanApprovalsCompleted: number;
        performanceTargetsMet: boolean;
    };
}
interface TemplateOrchestrationStatus {
    orchestrationId: string;
    templateId: string;
    templateType: string;
    status: string;
    expertCoordinationLevel: string;
    progress: {
        totalPhases: number;
        completedPhases: number;
        progressPercentage: number;
    };
    activeExperts: ExpertParticipant[];
    currentContextIntegrity: number;
    performanceMetrics: TemplatePerformanceMetrics;
    timing: {
        startTime: string;
        endTime?: string;
        totalDuration?: number;
        estimatedCompletion: string | null;
    };
    qualityIndicators: {
        expertSelectionAccuracy: number;
        contextTransferIntegrity: number;
        coordinationEfficiency: number;
        templateAuthorityMaintained: boolean;
    };
}
interface ExpertValidationResult {
    validationId: string;
    overallScore: number;
    validationResults: ValidationResult[];
    recommendationsImplemented: number;
    qualityGrade: string;
}
interface ValidationResult {
    aspect: string;
    score: number;
    comments: string;
}
interface OrchestrationSummary {
    orchestrationId: string;
    templateType: string;
    totalPhases: number;
    expertSessions: number;
    humanApprovals: number;
    overallScore: number;
    recommendations: string;
}
interface ExpertParticipant {
    expertId: string;
    expertType: string;
    role: string;
    status: string;
    joinedAt: string;
    lastActivity: string;
}
export declare const expertOrchestrationTemplates: ExpertOrchestrationTemplates;
export {};
//# sourceMappingURL=expert-orchestration-templates.d.ts.map
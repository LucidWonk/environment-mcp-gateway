/**
 * Template Expert Integration Service
 * Phase 3 Step 3.1 Subtask B: Expert coordination pattern integration in template execution
 *
 * Provides seamless integration between template execution and Virtual Expert Team coordination.
 * Maintains template authority while leveraging expert guidance throughout the execution process.
 */
import { ExpertOrchestrationTemplates } from '../templates/expert-orchestration-templates.js';
import { MultiAgentConversationManager } from './multi-agent-conversation-manager.js';
import { WorkflowOrchestrator } from '../infrastructure/workflow-orchestrator.js';
import { EventEmitter } from 'events';
export interface TemplateExpertIntegration {
    integrationId: string;
    templateId: string;
    expertCoordinationId: string;
    integrationLevel: 'minimal' | 'standard' | 'comprehensive';
    coordinationContext: TemplateCoordinationContext;
    expertWorkflow: ExpertWorkflowDefinition;
    integrationStrategy: IntegrationStrategy;
    performanceParameters: IntegrationPerformanceParameters;
    qualityGates: TemplateQualityGate[];
}
export interface TemplateCoordinationContext {
    currentPhase: string;
    currentStep: string;
    templateType: string;
    executionScope: string;
    domainContext: string[];
    complexityLevel: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    expertRequirements: ExpertRequirementMapping[];
    contextSyncStatus: 'synchronized' | 'diverged' | 'syncing';
    humanApprovalRequired: boolean;
}
export interface ExpertRequirementMapping {
    templatePhase: string;
    templateStep?: string;
    expertType: string;
    expertRole: 'primary' | 'secondary' | 'observer' | 'mandatory';
    activationTrigger: string;
    coordinationPattern: string;
    contextScope: 'full' | 'focused' | 'minimal';
    responseTimeLimit: number;
    confidenceThreshold: number;
}
export interface ExpertWorkflowDefinition {
    workflowId: string;
    coordinationSteps: ExpertCoordinationStep[];
    handoffProtocols: ExpertHandoffProtocol[];
    consensusRequirements: ConsensusRequirement[];
    escalationPaths: EscalationPath[];
    contextTransferRules: ContextTransferRule[];
    performanceTargets: ExpertPerformanceTargets;
}
export interface ExpertCoordinationStep {
    stepId: string;
    stepName: string;
    templateTrigger: string;
    expertTypes: string[];
    coordinationType: 'sequential' | 'parallel' | 'consensus-driven' | 'hierarchical';
    inputRequirements: string[];
    outputFormat: 'recommendation' | 'validation' | 'analysis' | 'approval';
    integrationMethod: 'inline' | 'referenced' | 'override' | 'enhancement';
    timeoutMs: number;
    fallbackStrategy: string;
}
export interface ExpertHandoffProtocol {
    protocolId: string;
    fromExpert: string;
    toExpert: string;
    handoffTrigger: string;
    contextTransferScope: 'full' | 'focused' | 'minimal';
    integrityValidation: boolean;
    rollbackCapability: boolean;
    handoffTimeoutMs: number;
}
export interface ConsensusRequirement {
    consensusId: string;
    expertTypes: string[];
    consensusThreshold: number;
    conflictResolutionStrategy: 'voting' | 'hierarchy' | 'human-escalation' | 'weighted-expertise';
    maxRounds: number;
    timeoutMs: number;
}
export interface EscalationPath {
    pathId: string;
    triggerConditions: string[];
    escalationLevels: EscalationLevel[];
    humanIntegrationPoint: boolean;
    autoEscalationTimeout: number;
}
export interface EscalationLevel {
    level: number;
    expertType: string;
    authority: 'advisory' | 'decision-making' | 'override';
    timeoutMs: number;
}
export interface ContextTransferRule {
    ruleId: string;
    sourceContext: string;
    targetContext: string;
    transferTrigger: string;
    scope: 'full' | 'focused' | 'minimal';
    transformation: 'none' | 'filter' | 'enhance' | 'summarize';
    validationRequired: boolean;
    integrityChecks: string[];
}
export interface IntegrationStrategy {
    strategyId: string;
    authorityModel: 'template-primary' | 'expert-guided' | 'collaborative';
    conflictResolution: 'template-wins' | 'expert-wins' | 'human-decides' | 'consensus';
    contextSyncStrategy: 'real-time' | 'phase-boundary' | 'step-boundary' | 'on-demand';
    performanceOptimization: 'latency' | 'quality' | 'balanced';
    fallbackBehavior: 'template-only' | 'cached-expertise' | 'human-escalation';
}
export interface IntegrationPerformanceParameters {
    maxCoordinationLatency: number;
    maxContextSyncTime: number;
    targetExpertResponseTime: number;
    maxOverheadPercentage: number;
    minContextIntegrity: number;
    targetConsensusTime: number;
}
export interface TemplateQualityGate {
    gateId: string;
    gateName: string;
    gateType: 'expert-validation' | 'human-approval' | 'automated-check' | 'consensus-verification';
    templatePhase: string;
    expertRequirements?: string[];
    qualityCriteria: QualityCriterion[];
    passingThreshold: number;
    failureAction: 'block' | 'warn' | 'escalate' | 'continue-with-risk';
}
export interface QualityCriterion {
    criterionId: string;
    criterionName: string;
    evaluationType: 'automated' | 'expert-review' | 'human-judgment';
    weight: number;
    passingScore: number;
}
export interface ExpertPerformanceTargets {
    expertSelectionTime: number;
    coordinationTime: number;
    consensusTime: number;
    contextTransferTime: number;
    overallAccuracy: number;
    responseQuality: number;
}
export interface TemplateExecutionWithExpertGuidance {
    executionId: string;
    templateId: string;
    integrationId: string;
    currentPhase: string;
    expertParticipants: ActiveExpertParticipant[];
    coordinationHistory: CoordinationEvent[];
    contextState: TemplateContextState;
    qualityMetrics: ExecutionQualityMetrics;
    performanceMetrics: ExecutionPerformanceMetrics;
    integrationStatus: 'active' | 'degraded' | 'expert-unavailable' | 'template-only' | 'completed';
}
export interface ActiveExpertParticipant {
    expertId: string;
    expertType: string;
    role: string;
    status: 'active' | 'busy' | 'idle' | 'offline';
    currentTask?: string;
    lastResponse: string;
    responseQuality: number;
    coordinationEfficiency: number;
}
export interface CoordinationEvent {
    eventId: string;
    timestamp: string;
    eventType: 'expert-selected' | 'coordination-started' | 'consensus-reached' | 'escalation-triggered' | 'context-synced';
    participants: string[];
    outcome: 'success' | 'failure' | 'timeout' | 'escalated';
    duration: number;
    qualityScore: number;
    contextIntegrityScore: number;
}
export interface TemplateContextState {
    currentContext: Record<string, any>;
    expertEnhancements: Record<string, any>;
    syncStatus: 'synchronized' | 'diverged' | 'syncing' | 'conflict';
    integrityScore: number;
    lastSyncTime: string;
    conflictResolutions: ContextConflictResolution[];
}
export interface ContextConflictResolution {
    conflictId: string;
    conflictType: string;
    resolution: string;
    resolvedBy: 'template' | 'expert' | 'human' | 'consensus';
    timestamp: string;
}
export interface ExecutionQualityMetrics {
    overallQuality: number;
    expertGuidanceQuality: number;
    templateCompliance: number;
    consensusQuality: number;
    contextIntegrity: number;
    humanSatisfaction: number;
}
export interface ExecutionPerformanceMetrics {
    totalExecutionTime: number;
    expertCoordinationTime: number;
    contextSyncTime: number;
    consensusTime: number;
    humanApprovalTime: number;
    overheadPercentage: number;
    throughput: number;
}
/**
 * Template Expert Integration Service
 * Orchestrates seamless integration between template execution and expert coordination
 */
export declare class TemplateExpertIntegrationService extends EventEmitter {
    private readonly expertOrchestration;
    private readonly conversationManager;
    private readonly workflowOrchestrator;
    private readonly activeIntegrations;
    private readonly integrationStrategies;
    private readonly performanceCache;
    constructor(expertOrchestration: ExpertOrchestrationTemplates, conversationManager: MultiAgentConversationManager, workflowOrchestrator: WorkflowOrchestrator);
    /**
     * Create integrated template execution with expert coordination
     * Phase 3 Step 3.1 Subtask B: Core Integration Implementation
     */
    createIntegratedTemplateExecution(templateId: string, templateType: string, executionContext: Record<string, any>, options?: {
        integrationLevel?: 'minimal' | 'standard' | 'comprehensive';
        expertSelectionCriteria?: Record<string, any>;
        performanceParameters?: Partial<IntegrationPerformanceParameters>;
        qualityGates?: TemplateQualityGate[];
    }): Promise<string>;
    /**
     * Execute template phase with integrated expert coordination
     * Phase 3 Step 3.1 Subtask B: Coordinated Phase Execution
     */
    executeTemplatePhaseWithExperts(executionId: string, phaseId: string, phaseContext: Record<string, any>): Promise<IntegratedPhaseResult>;
    /**
     * Complete integrated template execution with final expert validation
     * Phase 3 Step 3.1 Subtask B: Integration Completion
     */
    completeIntegratedTemplateExecution(executionId: string, completionContext: Record<string, any>): Promise<IntegratedTemplateCompletionResult>;
    /**
     * Get current integration status and metrics
     * Phase 3 Step 3.1 Subtask B: Status and Monitoring
     */
    getIntegrationStatus(executionId: string): Promise<IntegrationStatusResult | null>;
    private initializeIntegrationStrategies;
    private setupPerformanceMonitoring;
    private createIntegrationConfiguration;
    private createExpertWorkflowDefinition;
    private startExpertCoordinationWorkflow;
    private executePrePhaseExpertCoordination;
    private executeExpertGuidedTemplatePhase;
    private executePostPhaseExpertValidation;
    private synchronizeTemplateExpertContext;
    private evaluatePhaseQualityGates;
    private updateExecutionMetrics;
    private initializeQualityMetrics;
    private initializePerformanceMetrics;
    private executeFinalExpertReview;
    private generateIntegratedExecutionReport;
    private calculateFinalIntegrationMetrics;
    private generateIntegrationRecommendations;
    private cleanupIntegratedExecution;
    private calculateExpertAvailability;
    private calculateCoordinationEfficiency;
    private monitorIntegrationPerformance;
    private optimizeExpertCoordination;
    private cleanupStaleIntegrations;
}
interface PrePhaseCoordinationResult {
    coordinationId: string;
    expertParticipants: ActiveExpertParticipant[];
    coordinationSessions: CoordinationSession[];
    consensusLevel: number;
    duration: number;
    averageResponseTime: number;
    recommendations: ExpertRecommendation[];
}
interface CoordinationSession {
    sessionId: string;
    participants: string[];
    duration: number;
    outcome: string;
}
interface ExpertRecommendation {
    expertType: string;
    recommendation: string;
    confidence: number;
    rationale: string;
}
interface TemplatePhaseExecutionResult {
    phaseId: string;
    status: string;
    executionTime: number;
    outputs: Record<string, any>;
    expertGuidanceApplied: boolean;
    templateCompliance: number;
}
interface PostPhaseValidationResult {
    validationId: string;
    validationResults: ValidationResult[];
    overallScore: number;
    duration: number;
    expertFeedback: ExpertFeedback[];
    recommendationsForNextPhase: string[];
}
interface ValidationResult {
    aspect: string;
    score: number;
    comments: string;
}
interface ExpertFeedback {
    expertType: string;
    feedback: string;
    severity: 'info' | 'warning' | 'error';
    recommendation: string;
}
interface ContextSynchronizationResult {
    syncId: string;
    integrityScore: number;
    conflictsResolved: number;
    syncDuration: number;
    enhancementsApplied: ContextEnhancement[];
}
interface ContextEnhancement {
    enhancementType: string;
    description: string;
    appliedBy: string;
}
interface QualityGateEvaluationResult {
    gateId: string;
    passed: boolean;
    score: number;
    evaluatedCriteria: EvaluatedCriterion[];
    failedCriteria: FailedCriterion[];
    recommendations: string[];
}
interface EvaluatedCriterion {
    criterionId: string;
    score: number;
    passed: boolean;
}
interface FailedCriterion {
    criterionId: string;
    reason: string;
    recommendation: string;
}
interface IntegratedPhaseResult {
    executionId: string;
    phaseId: string;
    status: string;
    preCoordination: PrePhaseCoordinationResult;
    templateResult: TemplatePhaseExecutionResult;
    postValidation: PostPhaseValidationResult;
    contextSync: ContextSynchronizationResult;
    qualityGateResult: QualityGateEvaluationResult;
    executionTime: number;
    expertParticipation: {
        expertsEngaged: number;
        coordinationSessions: number;
        consensusAchieved: boolean;
        contextIntegrity: number;
    };
    performanceMetrics: {
        coordinationOverhead: number;
        expertResponseTime: number;
        templateExecutionTime: number;
        totalIntegrationTime: number;
    };
}
interface FinalExpertReviewResult {
    reviewId: string;
    overallAssessment: string;
    qualityScore: number;
    expertRecommendations: ExpertRecommendation[];
    templateComplianceScore: number;
    implementationGrade: string;
}
interface IntegratedExecutionReport {
    reportId: string;
    executionSummary: string;
    phaseReports: PhaseReport[];
    expertParticipationSummary: string;
    qualityAssessment: string;
    performanceAnalysis: string;
    recommendations: string[];
}
interface PhaseReport {
    phaseId: string;
    status: string;
    duration: number;
    qualityScore: number;
    expertParticipation: number;
}
interface IntegratedTemplateCompletionResult {
    executionId: string;
    templateId: string;
    integrationId: string;
    status: string;
    finalExpertReview: FinalExpertReviewResult;
    executionReport: IntegratedExecutionReport;
    finalMetrics: ExecutionQualityMetrics;
    orchestrationCompletion: any;
    integrationSummary: {
        totalPhases: number;
        expertsParticipated: number;
        coordinationSessions: number;
        averageContextIntegrity: number;
        overallQuality: number;
        templateAuthorityMaintained: boolean;
        expertGuidanceIntegrated: boolean;
    };
    recommendations: string[];
}
interface IntegrationStatusResult {
    executionId: string;
    templateId: string;
    integrationId: string;
    currentPhase: string;
    integrationStatus: string;
    expertParticipants: ActiveExpertParticipant[];
    contextState: TemplateContextState;
    qualityMetrics: ExecutionQualityMetrics;
    performanceMetrics: ExecutionPerformanceMetrics;
    coordinationHistory: CoordinationEvent[];
    systemHealth: {
        expertAvailability: number;
        contextIntegrity: number;
        coordinationEfficiency: number;
        templateCompliance: number;
    };
}
export declare const templateExpertIntegrationService: TemplateExpertIntegrationService;
export {};
//# sourceMappingURL=template-expert-integration.d.ts.map
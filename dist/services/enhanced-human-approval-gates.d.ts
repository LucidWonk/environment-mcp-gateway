/**
 * Enhanced Human Approval Gates Service
 * Phase 3 Step 3.1 Subtask C: Human approval gate enhancement with expert recommendation context
 *
 * Provides enhanced human approval gates with rich expert recommendation context,
 * enabling informed decision-making while maintaining template execution flow.
 */
import { TemplateExpertIntegrationService } from './template-expert-integration.js';
import { MultiAgentConversationManager } from './multi-agent-conversation-manager.js';
import { ApprovalWorkflowManager } from './approval-workflow.js';
import { EventEmitter } from 'events';
export interface EnhancedHumanApprovalGate {
    gateId: string;
    gateName: string;
    gateType: 'template-phase-approval' | 'expert-recommendation-approval' | 'conflict-resolution-approval' | 'quality-gate-approval' | 'implementation-approval';
    templateContext: TemplateApprovalContext;
    expertContext: ExpertRecommendationContext;
    approvalCriteria: ApprovalCriterion[];
    escalationRules: EscalationRule[];
    contextPresentation: ContextPresentationConfig;
    decisionSupport: DecisionSupportConfig;
    timeoutPolicy: ApprovalTimeoutPolicy;
    auditTrail: ApprovalAuditTrail;
}
export interface TemplateApprovalContext {
    templateId: string;
    templateType: string;
    currentPhase: string;
    currentStep: string;
    phaseProgress: PhaseProgressInfo;
    templateCompliance: TemplateComplianceInfo;
    riskAssessment: TemplateRiskAssessment;
    impactAnalysis: TemplateImpactAnalysis;
    qualityMetrics: TemplateQualityMetrics;
}
export interface ExpertRecommendationContext {
    expertParticipants: ExpertParticipantInfo[];
    recommendations: ExpertRecommendation[];
    consensusLevel: number;
    conflictResolutions: ExpertConflictResolution[];
    expertValidationResults: ExpertValidationResult[];
    confidenceScores: ExpertConfidenceScore[];
    alternativeApproaches: AlternativeApproach[];
}
export interface ExpertParticipantInfo {
    expertId: string;
    expertType: string;
    role: 'primary' | 'secondary' | 'observer' | 'mandatory';
    participationLevel: 'full' | 'partial' | 'minimal';
    responsiveness: number;
    contributionQuality: number;
    agreementLevel: number;
    lastContribution: string;
    keyInsights: string[];
}
export interface ExpertRecommendation {
    recommendationId: string;
    expertType: string;
    expertId: string;
    recommendationType: 'proceed' | 'modify' | 'reject' | 'escalate' | 'defer';
    recommendation: string;
    rationale: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    supportingEvidence: string[];
    alternativeOptions: string[];
    risks: RiskAssessment[];
    benefits: BenefitAssessment[];
}
export interface ExpertConflictResolution {
    conflictId: string;
    conflictType: 'approach-disagreement' | 'priority-conflict' | 'risk-assessment-difference' | 'quality-standard-variance';
    conflictingExperts: string[];
    conflictDescription: string;
    resolutionStrategy: 'consensus-building' | 'expert-hierarchy' | 'human-decision' | 'additional-analysis';
    resolutionResult: 'resolved' | 'escalated' | 'deferred' | 'unresolved';
    finalRecommendation: string;
    humanDecisionRequired: boolean;
}
export interface PhaseProgressInfo {
    totalSteps: number;
    completedSteps: number;
    currentStepIndex: number;
    estimatedCompletion: string;
    criticalPath: string[];
    blockers: string[];
    dependencies: DependencyInfo[];
}
export interface TemplateComplianceInfo {
    overallCompliance: number;
    complianceCategories: ComplianceCategory[];
    violations: ComplianceViolation[];
    mitigations: ComplianceMitigation[];
    certificationStatus: 'compliant' | 'conditionally-compliant' | 'non-compliant' | 'under-review';
}
export interface TemplateRiskAssessment {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskCategories: RiskCategory[];
    mitigatedRisks: MitigatedRisk[];
    residualRisks: ResidualRisk[];
    riskTrends: RiskTrend[];
}
export interface TemplateImpactAnalysis {
    impactScope: 'local' | 'domain' | 'cross-domain' | 'system-wide';
    affectedComponents: AffectedComponent[];
    businessImpact: BusinessImpact;
    technicalImpact: TechnicalImpact;
    userImpact: UserImpact;
    timelineImpact: TimelineImpact;
}
export interface ApprovalCriterion {
    criterionId: string;
    criterionName: string;
    description: string;
    category: 'technical' | 'business' | 'quality' | 'compliance' | 'risk' | 'expert-guidance';
    weight: number;
    evaluationType: 'automatic' | 'expert-assessed' | 'human-judgment';
    currentScore: number;
    passingThreshold: number;
    expertRecommendations: string[];
    evidenceSources: string[];
}
export interface EscalationRule {
    ruleId: string;
    triggerConditions: string[];
    escalationLevel: 'supervisor' | 'senior-reviewer' | 'expert-panel' | 'executive-decision';
    escalationTimeout: number;
    escalationContext: string;
    automaticEscalation: boolean;
}
export interface ContextPresentationConfig {
    presentationFormat: 'comprehensive' | 'summary' | 'executive' | 'technical';
    visualizations: VisualizationConfig[];
    expertHighlights: ExpertHighlightConfig[];
    riskIndicators: RiskIndicatorConfig[];
    interactiveElements: InteractiveElementConfig[];
}
export interface DecisionSupportConfig {
    recommendationSummary: boolean;
    expertConsensusVisualization: boolean;
    riskAssessmentMatrix: boolean;
    impactAnalysisDashboard: boolean;
    alternativeComparisonTable: boolean;
    costBenefitAnalysis: boolean;
    timelineProjection: boolean;
    complianceChecklist: boolean;
}
export interface ApprovalTimeoutPolicy {
    initialTimeout: number;
    escalationTimeout: number;
    maxTotalTimeout: number;
    timeoutAction: 'auto-approve' | 'auto-reject' | 'escalate' | 'defer';
    reminderIntervals: number[];
    timeoutNotifications: NotificationConfig[];
}
export interface ApprovalAuditTrail {
    auditId: string;
    approvalHistory: ApprovalHistoryEntry[];
    expertContributions: ExpertContributionRecord[];
    decisionRationale: DecisionRationaleRecord[];
    complianceRecords: ComplianceRecord[];
    performanceMetrics: ApprovalPerformanceMetrics;
}
interface RiskAssessment {
    riskType: string;
    probability: number;
    impact: number;
    mitigation: string;
}
interface BenefitAssessment {
    benefitType: string;
    value: number;
    likelihood: number;
    timeframe: string;
}
interface DependencyInfo {
    dependencyId: string;
    dependencyType: string;
    status: 'satisfied' | 'pending' | 'blocked';
    impact: string;
}
interface ComplianceCategory {
    categoryName: string;
    score: number;
    requirements: string[];
    status: 'met' | 'partially-met' | 'not-met';
}
interface ComplianceViolation {
    violationId: string;
    violationType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
}
interface ComplianceMitigation {
    mitigationId: string;
    violationId: string;
    mitigationAction: string;
    effectivenessScore: number;
    implementationCost: string;
}
interface RiskCategory {
    categoryName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    risks: string[];
    mitigationStrategies: string[];
}
interface MitigatedRisk {
    riskId: string;
    originalRisk: string;
    mitigationAction: string;
    residualRisk: string;
    effectivenessScore: number;
}
interface ResidualRisk {
    riskId: string;
    riskDescription: string;
    acceptanceRationale: string;
    monitoringStrategy: string;
}
interface RiskTrend {
    trendType: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    trendPeriod: string;
    trendDescription: string;
}
interface AffectedComponent {
    componentId: string;
    componentType: string;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    changeType: 'modification' | 'addition' | 'removal' | 'refactoring';
}
interface BusinessImpact {
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedProcesses: string[];
    costImplications: string;
    benefitProjections: string;
    riskMitigations: string[];
}
interface TechnicalImpact {
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    architecturalChanges: string[];
    performanceImplications: string;
    securityConsiderations: string[];
    maintenanceRequirements: string[];
}
interface UserImpact {
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedUserGroups: string[];
    usabilityChanges: string[];
    trainingRequirements: string[];
    adoptionChallenges: string[];
}
interface TimelineImpact {
    estimatedDuration: string;
    criticalPathAffected: boolean;
    milestoneImpacts: string[];
    resourceRequirements: string[];
}
interface VisualizationConfig {
    visualizationType: 'chart' | 'graph' | 'matrix' | 'dashboard';
    dataSource: string;
    interactivity: boolean;
}
interface ExpertHighlightConfig {
    highlightType: 'consensus' | 'dissent' | 'critical-insight' | 'recommendation';
    prominence: 'high' | 'medium' | 'low';
    styling: string;
}
interface RiskIndicatorConfig {
    indicatorType: 'traffic-light' | 'gauge' | 'badge' | 'icon';
    thresholds: number[];
    colors: string[];
}
interface InteractiveElementConfig {
    elementType: 'expandable-section' | 'drill-down' | 'filter' | 'comparison';
    functionality: string;
    defaultState: string;
}
interface NotificationConfig {
    notificationType: 'email' | 'dashboard' | 'mobile' | 'slack';
    recipients: string[];
    messageTemplate: string;
}
interface ApprovalHistoryEntry {
    timestamp: string;
    approver: string;
    decision: 'approved' | 'rejected' | 'escalated' | 'deferred';
    rationale: string;
    conditions: string[];
}
interface ExpertContributionRecord {
    expertId: string;
    expertType: string;
    contributions: string[];
    influence: number;
    accuracy: number;
}
interface DecisionRationaleRecord {
    decisionId: string;
    decision: string;
    rationale: string;
    influencingFactors: string[];
    expertInputConsidered: string[];
}
interface ComplianceRecord {
    recordId: string;
    complianceType: string;
    status: 'compliant' | 'non-compliant' | 'conditional';
    validationMethod: string;
    validator: string;
}
interface ApprovalPerformanceMetrics {
    averageApprovalTime: number;
    escalationRate: number;
    overrideRate: number;
    qualityScore: number;
    stakeholderSatisfaction: number;
}
interface AlternativeApproach {
    approachId: string;
    approachName: string;
    description: string;
    expertSupport: number;
    feasibilityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    implementationCost: string;
    timeline: string;
}
interface ExpertValidationResult {
    validationId: string;
    expertType: string;
    validationAspect: string;
    score: number;
    comments: string;
    recommendations: string[];
}
interface ExpertConfidenceScore {
    expertId: string;
    expertType: string;
    confidenceLevel: number;
    confidenceFactors: string[];
    uncertaintyAreas: string[];
}
export interface HumanApprovalRequest {
    requestId: string;
    gateId: string;
    templateContext: TemplateApprovalContext;
    expertContext: ExpertRecommendationContext;
    approvalCriteria: ApprovalCriterion[];
    decisionDeadline: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    requestedBy: string;
    stakeholders: string[];
}
export interface HumanApprovalResponse {
    responseId: string;
    requestId: string;
    decision: 'approved' | 'rejected' | 'conditional-approval' | 'escalated' | 'deferred';
    rationale: string;
    conditions?: string[];
    expertInputConsidered: string[];
    additionalRequirements?: string[];
    approver: string;
    approvalTimestamp: string;
    validityPeriod?: string;
}
export interface EnhancedApprovalSession {
    sessionId: string;
    gateId: string;
    requestId: string;
    status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'escalated' | 'expired';
    participants: ApprovalParticipant[];
    expertContext: ExpertRecommendationContext;
    deliberationHistory: DeliberationEntry[];
    currentRecommendation: string;
    riskAssessment: TemplateRiskAssessment;
    complianceStatus: TemplateComplianceInfo;
    sessionMetrics: ApprovalSessionMetrics;
}
interface ApprovalParticipant {
    participantId: string;
    role: 'primary-approver' | 'secondary-approver' | 'advisor' | 'expert-consultant';
    expertise: string[];
    influence: number;
    responsiveness: number;
}
interface DeliberationEntry {
    entryId: string;
    timestamp: string;
    participant: string;
    entryType: 'question' | 'comment' | 'recommendation' | 'concern' | 'approval' | 'rejection';
    content: string;
    expertContext?: string;
    impact: 'low' | 'medium' | 'high';
}
interface ApprovalSessionMetrics {
    sessionDuration: number;
    participantEngagement: number;
    deliberationQuality: number;
    expertInfluence: number;
    consensusLevel: number;
    decisionConfidence: number;
}
/**
 * Enhanced Human Approval Gates Service
 * Provides sophisticated human approval workflows with rich expert context
 */
export declare class EnhancedHumanApprovalGatesService extends EventEmitter {
    private readonly templateIntegration;
    private readonly conversationManager;
    private readonly approvalWorkflow;
    private readonly activeApprovalGates;
    private readonly activeSessions;
    private readonly approvalCache;
    constructor(templateIntegration: TemplateExpertIntegrationService, conversationManager: MultiAgentConversationManager, approvalWorkflow: ApprovalWorkflowManager);
    /**
     * Create enhanced human approval request with expert context
     * Phase 3 Step 3.1 Subtask C: Enhanced Approval Request Creation
     */
    createEnhancedApprovalRequest(gateId: string, templateContext: TemplateApprovalContext, expertIntegrationId: string, options?: {
        urgency?: 'low' | 'medium' | 'high' | 'critical';
        stakeholders?: string[];
        customCriteria?: ApprovalCriterion[];
        timeoutOverride?: number;
    }): Promise<string>;
    /**
     * Process human approval with expert context consideration
     * Phase 3 Step 3.1 Subtask C: Enhanced Approval Processing
     */
    processEnhancedApproval(requestId: string, approverInput: {
        decision: 'approved' | 'rejected' | 'conditional-approval' | 'escalated' | 'deferred';
        rationale: string;
        conditions?: string[];
        expertInputConsidered?: string[];
        additionalRequirements?: string[];
        approver: string;
    }): Promise<HumanApprovalResponse>;
    /**
     * Get enhanced approval status with expert context
     * Phase 3 Step 3.1 Subtask C: Status and Monitoring
     */
    getEnhancedApprovalStatus(requestId: string): Promise<EnhancedApprovalStatus | null>;
    private initializeDefaultApprovalGates;
    private setupApprovalMonitoring;
    private gatherExpertRecommendationContext;
    private enhanceApprovalCriteriaWithExpertInsights;
    private createEnhancedApprovalSession;
    private initiateEnhancedApprovalWorkflow;
    private validateApprovalAgainstExpertRecommendations;
    private extractExpertInputSummary;
    private calculateApprovalValidityPeriod;
    private updateApprovalSessionWithDecision;
    private executePostApprovalActions;
    private calculateAverageExpertConfidence;
    private calculateExpertAgreement;
    private monitorApprovalTimeouts;
    private updateApprovalMetrics;
    private cleanupCompletedSessions;
}
interface TemplateQualityMetrics {
    overallQuality: number;
    codeQuality: number;
    testCoverage: number;
    documentationQuality: number;
    architecturalCompliance: number;
}
interface EnhancedApprovalStatus {
    requestId: string;
    sessionId: string;
    gateId: string;
    status: string;
    currentRecommendation: string;
    expertContext: {
        participantCount: number;
        consensusLevel: number;
        conflictCount: number;
        averageConfidence: number;
        expertAgreement: number;
    };
    approvalMetrics: {
        sessionDuration: number;
        participantEngagement: number;
        deliberationQuality: number;
        expertInfluence: number;
        decisionConfidence: number;
    };
    riskIndicators: {
        overallRisk: string;
        criticalRisks: number;
        mitigatedRisks: number;
    };
    complianceStatus: {
        overallCompliance: number;
        violations: number;
        certificationStatus: string;
    };
    approvalResponse?: HumanApprovalResponse;
}
export declare const enhancedHumanApprovalGatesService: EnhancedHumanApprovalGatesService;
export {};
//# sourceMappingURL=enhanced-human-approval-gates.d.ts.map
import { EventEmitter } from 'events';
export interface ConflictResolutionRequest {
    requestId: string;
    conversationId: string;
    conflictId: string;
    conflictType: 'content-conflict' | 'decision-conflict' | 'priority-conflict' | 'resource-conflict' | 'process-conflict';
    participants: ConflictParticipant[];
    conflictData: {
        description: string;
        conflictingValues: any[];
        contextKey: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        timestamp: string;
        metadata?: Record<string, any>;
    };
    resolutionCriteria: {
        strategy: ConflictResolutionStrategy;
        timeoutMs: number;
        consensusThreshold: number;
        fallbackStrategy?: ConflictResolutionStrategy;
        requiredParticipants?: string[];
    };
}
export interface ConflictParticipant {
    agentId: string;
    role: 'proposer' | 'reviewer' | 'decision-maker' | 'observer';
    weight: number;
    expertise: string[];
    position?: ConflictPosition;
    preferences?: Record<string, any>;
}
export interface ConflictPosition {
    positionId: string;
    participantId: string;
    proposedValue: any;
    justification: string;
    confidence: number;
    priority: number;
    supportingEvidence?: string[];
    alternativeProposals?: any[];
    timestamp: string;
}
export interface ConsensusVote {
    voteId: string;
    participantId: string;
    conflictId: string;
    voteType: 'support' | 'oppose' | 'abstain' | 'conditional';
    votedValue: any;
    confidence: number;
    conditions?: string[];
    reasoning: string;
    timestamp: string;
}
export interface ConflictResolution {
    resolutionId: string;
    conflictId: string;
    conversationId: string;
    resolutionType: 'consensus' | 'majority' | 'authority' | 'compromise' | 'escalation';
    resolvedValue: any;
    resolutionPath: string;
    participantAgreement: Map<string, boolean>;
    consensusScore: number;
    resolutionTime: number;
    finalVotes: ConsensusVote[];
    metadata: {
        strategy: ConflictResolutionStrategy;
        iterations: number;
        negotiationRounds: number;
        compromisesOffered: number;
        escalationRequired: boolean;
        overallSatisfaction: number;
    };
    resolvedAt: string;
}
export type ConflictResolutionStrategy = 'consensus-building' | 'majority-vote' | 'weighted-vote' | 'expert-authority' | 'collaborative-negotiation' | 'automated-compromise' | 'escalation-hierarchy' | 'time-bounded-consensus' | 'evidence-based-resolution';
export interface NegotiationRound {
    roundId: string;
    roundNumber: number;
    conflictId: string;
    participants: string[];
    proposals: ConflictPosition[];
    votes: ConsensusVote[];
    roundResult: 'progress' | 'stalemate' | 'resolution' | 'escalation';
    convergenceScore: number;
    startedAt: string;
    completedAt?: string;
    nextRoundStrategy?: ConflictResolutionStrategy;
}
export interface ConflictMetrics {
    conflictId: string;
    totalParticipants: number;
    activeParticipants: number;
    resolutionTime: number;
    negotiationRounds: number;
    consensusScore: number;
    satisfactionScore: number;
    efficacyScore: number;
    participationRate: number;
    convergenceRate: number;
    lastUpdated: string;
}
export declare class ConflictResolver extends EventEmitter {
    private activeConflicts;
    private resolutionHistory;
    private negotiationRounds;
    private participantPositions;
    private conflictVotes;
    private conflictMetrics;
    constructor();
    initiateConflictResolution(request: ConflictResolutionRequest): Promise<string>;
    submitPosition(conflictId: string, position: Omit<ConflictPosition, 'positionId' | 'timestamp'>): Promise<string>;
    submitVote(conflictId: string, vote: Omit<ConsensusVote, 'voteId' | 'timestamp'>): Promise<string>;
    getConflictStatus(conflictId: string): Promise<any>;
    startNegotiationRound(conflictId: string, strategy?: ConflictResolutionStrategy): Promise<string>;
    private executeResolutionStrategy;
    private executeConsensusBuilding;
    private executeMajorityVote;
    private executeWeightedVote;
    private executeExpertAuthority;
    private executeCollaborativeNegotiation;
    private executeAutomatedCompromise;
    private executeEscalationHierarchy;
    private executeTimeBoundedConsensus;
    private executeEvidenceBasedResolution;
    private validateConflictRequest;
    private evaluateConsensus;
    private calculateMajorityVote;
    private calculateWeightedVote;
    private generateCompromiseValue;
    private finalizeResolution;
    private determineResolutionType;
    private evaluateResolutionProgress;
    private calculateResolutionProgress;
    private updateConflictMetrics;
    private calculateConvergenceRate;
    private startConflictMonitoring;
    private monitorActiveConflicts;
    getActiveConflicts(): string[];
    getResolutionHistory(): ConflictResolution[];
    getSystemMetrics(): Promise<Record<string, any>>;
    private getMostUsedStrategy;
    private getMostEffectiveStrategy;
}
export declare const conflictResolver: ConflictResolver;
//# sourceMappingURL=conflict-resolver.d.ts.map
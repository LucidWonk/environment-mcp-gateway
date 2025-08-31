import { createMCPLogger } from '../utils/mcp-logger.js';
import { performanceMonitor, performanceMonitored } from './performance-monitor.js';
import { expertCache, ExpertCacheKeys, cached } from './expert-cache.js';
import { expertErrorHandler, ExpertErrorUtils } from './error-handler.js';
import { EventEmitter } from 'events';

const logger = createMCPLogger('conflict-resolver.log');

// Conflict Resolution Types
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
        consensusThreshold: number; // 0.0 to 1.0
        fallbackStrategy?: ConflictResolutionStrategy;
        requiredParticipants?: string[];
    };
}

export interface ConflictParticipant {
    agentId: string;
    role: 'proposer' | 'reviewer' | 'decision-maker' | 'observer';
    weight: number; // Voting weight (0.0 to 1.0)
    expertise: string[];
    position?: ConflictPosition;
    preferences?: Record<string, any>;
}

export interface ConflictPosition {
    positionId: string;
    participantId: string;
    proposedValue: any;
    justification: string;
    confidence: number; // 0.0 to 1.0
    priority: number; // 1-10 scale
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
    resolutionPath: string; // Description of how resolution was achieved
    participantAgreement: Map<string, boolean>;
    consensusScore: number; // 0.0 to 1.0
    resolutionTime: number; // Milliseconds
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

export type ConflictResolutionStrategy = 
    | 'consensus-building'
    | 'majority-vote'
    | 'weighted-vote'
    | 'expert-authority'
    | 'collaborative-negotiation'
    | 'automated-compromise'
    | 'escalation-hierarchy'
    | 'time-bounded-consensus'
    | 'evidence-based-resolution';

export interface NegotiationRound {
    roundId: string;
    roundNumber: number;
    conflictId: string;
    participants: string[];
    proposals: ConflictPosition[];
    votes: ConsensusVote[];
    roundResult: 'progress' | 'stalemate' | 'resolution' | 'escalation';
    convergenceScore: number; // How close participants are to agreement
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

// Conflict Resolver Service
export class ConflictResolver extends EventEmitter {
    private activeConflicts: Map<string, ConflictResolutionRequest> = new Map();
    private resolutionHistory: Map<string, ConflictResolution> = new Map();
    private negotiationRounds: Map<string, NegotiationRound[]> = new Map();
    private participantPositions: Map<string, ConflictPosition[]> = new Map();
    private conflictVotes: Map<string, ConsensusVote[]> = new Map();
    private conflictMetrics: Map<string, ConflictMetrics> = new Map();

    constructor() {
        super();
        this.startConflictMonitoring();
        
        logger.info('⚖️ Conflict Resolver initialized', {
            resolutionStrategies: 9,
            monitoringEnabled: true
        });
    }

    @performanceMonitored('conflict-resolution-initiation', performanceMonitor)
    public async initiateConflictResolution(request: ConflictResolutionRequest): Promise<string> {
        return await expertErrorHandler.executeWithErrorHandling(
            'initiateConflictResolution',
            'ConflictResolver',
            async () => {
                logger.info('⚖️ Initiating conflict resolution', {
                    requestId: request.requestId,
                    conflictId: request.conflictId,
                    conflictType: request.conflictType,
                    participantCount: request.participants.length,
                    strategy: request.resolutionCriteria.strategy
                });

                // Validate request
                this.validateConflictRequest(request);

                // Store active conflict
                this.activeConflicts.set(request.conflictId, request);

                // Initialize participant positions
                this.participantPositions.set(request.conflictId, []);
                this.conflictVotes.set(request.conflictId, []);
                this.negotiationRounds.set(request.conflictId, []);

                // Initialize metrics
                this.conflictMetrics.set(request.conflictId, {
                    conflictId: request.conflictId,
                    totalParticipants: request.participants.length,
                    activeParticipants: request.participants.filter(p => p.role !== 'observer').length,
                    resolutionTime: 0,
                    negotiationRounds: 0,
                    consensusScore: 0,
                    satisfactionScore: 0,
                    efficacyScore: 0,
                    participationRate: 0,
                    convergenceRate: 0,
                    lastUpdated: new Date().toISOString()
                });

                // Cache conflict for quick access
                const cacheKey = ExpertCacheKeys.contextTransfer(request.conflictId, 'conflict-resolution');
                expertCache.set(cacheKey, request, 60 * 60 * 1000); // Cache for 1 hour

                // Start resolution process based on strategy
                await this.executeResolutionStrategy(request);

                // Emit conflict initiated event
                this.emit('conflictResolutionInitiated', {
                    conflictId: request.conflictId,
                    conversationId: request.conversationId,
                    strategy: request.resolutionCriteria.strategy,
                    participantCount: request.participants.length
                });

                logger.info('✅ Conflict resolution initiated', {
                    requestId: request.requestId,
                    conflictId: request.conflictId,
                    strategy: request.resolutionCriteria.strategy
                });

                return request.conflictId;
            },
            // Fallback for conflict resolution initiation
            async () => {
                logger.warn('🔄 Using fallback for conflict resolution initiation', { 
                    conflictId: request.conflictId 
                });
                
                // Create minimal fallback resolution
                const fallbackResolution: ConflictResolution = {
                    resolutionId: `fallback-resolution-${Date.now()}`,
                    conflictId: request.conflictId,
                    conversationId: request.conversationId,
                    resolutionType: 'authority',
                    resolvedValue: request.conflictData.conflictingValues[0], // Use first value as fallback
                    resolutionPath: 'Fallback resolution - used first available value',
                    participantAgreement: new Map(),
                    consensusScore: 0.5,
                    resolutionTime: 0,
                    finalVotes: [],
                    metadata: {
                        strategy: 'expert-authority',
                        iterations: 1,
                        negotiationRounds: 0,
                        compromisesOffered: 0,
                        escalationRequired: false,
                        overallSatisfaction: 0.5
                    },
                    resolvedAt: new Date().toISOString()
                };

                this.resolutionHistory.set(request.conflictId, fallbackResolution);
                return request.conflictId;
            }
        );
    }

    @performanceMonitored('position-submission', performanceMonitor)
    public async submitPosition(conflictId: string, position: Omit<ConflictPosition, 'positionId' | 'timestamp'>): Promise<string> {
        return await expertErrorHandler.executeWithErrorHandling(
            'submitPosition',
            'ConflictResolver',
            async () => {
                const positionId = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const timestamp = new Date().toISOString();

                const fullPosition: ConflictPosition = {
                    ...position,
                    positionId,
                    timestamp
                };

                logger.info('📝 Position submitted for conflict', {
                    conflictId,
                    positionId,
                    participantId: position.participantId,
                    confidence: position.confidence
                });

                // Validate conflict exists
                const conflict = this.activeConflicts.get(conflictId);
                if (!conflict) {
                    throw ExpertErrorUtils.createValidationError(
                        'ConflictResolver',
                        'submitPosition',
                        `Conflict ${conflictId} not found`
                    );
                }

                // Validate participant is authorized
                const participant = conflict.participants.find(p => p.agentId === position.participantId);
                if (!participant) {
                    throw ExpertErrorUtils.createValidationError(
                        'ConflictResolver',
                        'submitPosition',
                        `Participant ${position.participantId} not authorized for conflict ${conflictId}`
                    );
                }

                // Store position
                const positions = this.participantPositions.get(conflictId) || [];
                positions.push(fullPosition);
                this.participantPositions.set(conflictId, positions);

                // Update participant reference
                participant.position = fullPosition;

                // Update metrics
                await this.updateConflictMetrics(conflictId);

                // Check if we can progress the resolution
                await this.evaluateResolutionProgress(conflictId);

                // Emit position submitted event
                this.emit('positionSubmitted', {
                    conflictId,
                    positionId,
                    participantId: position.participantId,
                    confidence: position.confidence
                });

                logger.info('✅ Position submitted successfully', {
                    conflictId,
                    positionId,
                    participantId: position.participantId
                });

                return positionId;
            }
        );
    }

    @performanceMonitored('consensus-vote', performanceMonitor)
    public async submitVote(conflictId: string, vote: Omit<ConsensusVote, 'voteId' | 'timestamp'>): Promise<string> {
        return await expertErrorHandler.executeWithErrorHandling(
            'submitVote',
            'ConflictResolver',
            async () => {
                const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const timestamp = new Date().toISOString();

                const fullVote: ConsensusVote = {
                    ...vote,
                    voteId,
                    timestamp
                };

                logger.info('🗳️ Vote submitted for conflict', {
                    conflictId,
                    voteId,
                    participantId: vote.participantId,
                    voteType: vote.voteType,
                    confidence: vote.confidence
                });

                // Validate conflict exists
                const conflict = this.activeConflicts.get(conflictId);
                if (!conflict) {
                    throw ExpertErrorUtils.createValidationError(
                        'ConflictResolver',
                        'submitVote',
                        `Conflict ${conflictId} not found`
                    );
                }

                // Validate participant is authorized
                const participant = conflict.participants.find(p => p.agentId === vote.participantId);
                if (!participant || participant.role === 'observer') {
                    throw ExpertErrorUtils.createValidationError(
                        'ConflictResolver',
                        'submitVote',
                        `Participant ${vote.participantId} not authorized to vote on conflict ${conflictId}`
                    );
                }

                // Store vote (replace any existing vote from this participant)
                const votes = this.conflictVotes.get(conflictId) || [];
                const existingVoteIndex = votes.findIndex(v => v.participantId === vote.participantId);
                
                if (existingVoteIndex >= 0) {
                    votes[existingVoteIndex] = fullVote;
                    logger.info('🔄 Vote updated for participant', {
                        conflictId,
                        participantId: vote.participantId
                    });
                } else {
                    votes.push(fullVote);
                }
                
                this.conflictVotes.set(conflictId, votes);

                // Update metrics
                await this.updateConflictMetrics(conflictId);

                // Check if consensus is achieved
                const consensusResult = await this.evaluateConsensus(conflictId);
                if (consensusResult.achieved) {
                    await this.finalizeResolution(conflictId, consensusResult);
                }

                // Emit vote submitted event
                this.emit('voteSubmitted', {
                    conflictId,
                    voteId,
                    participantId: vote.participantId,
                    voteType: vote.voteType
                });

                logger.info('✅ Vote submitted successfully', {
                    conflictId,
                    voteId,
                    participantId: vote.participantId
                });

                return voteId;
            }
        );
    }

    @cached(expertCache, (conflictId: string) => `conflict-status:${conflictId}`, 30 * 1000)
    public async getConflictStatus(conflictId: string): Promise<any> {
        logger.info('📊 Getting conflict resolution status', { conflictId });

        const conflict = this.activeConflicts.get(conflictId);
        const resolution = this.resolutionHistory.get(conflictId);
        const positions = this.participantPositions.get(conflictId) || [];
        const votes = this.conflictVotes.get(conflictId) || [];
        const rounds = this.negotiationRounds.get(conflictId) || [];
        const metrics = this.conflictMetrics.get(conflictId);

        if (!conflict && !resolution) {
            return null;
        }

        const status = {
            conflictId,
            isActive: !!conflict,
            isResolved: !!resolution,
            conflictType: conflict?.conflictType || resolution?.resolutionType,
            participantCount: conflict?.participants.length || 0,
            positionsSubmitted: positions.length,
            votesSubmitted: votes.length,
            negotiationRounds: rounds.length,
            currentStrategy: conflict?.resolutionCriteria.strategy,
            consensusScore: metrics?.consensusScore || 0,
            resolutionProgress: this.calculateResolutionProgress(conflictId),
            resolution: resolution ? {
                resolutionType: resolution.resolutionType,
                consensusScore: resolution.consensusScore,
                resolutionTime: resolution.resolutionTime,
                resolvedAt: resolution.resolvedAt
            } : null,
            metrics: metrics || null
        };

        logger.info('✅ Conflict status retrieved', {
            conflictId,
            isActive: status.isActive,
            isResolved: status.isResolved,
            consensusScore: status.consensusScore
        });

        return status;
    }

    public async startNegotiationRound(conflictId: string, strategy?: ConflictResolutionStrategy): Promise<string> {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) {
            throw new Error(`Conflict ${conflictId} not found`);
        }

        const rounds = this.negotiationRounds.get(conflictId) || [];
        const roundNumber = rounds.length + 1;
        const roundId = `round-${conflictId}-${roundNumber}`;

        const negotiationRound: NegotiationRound = {
            roundId,
            roundNumber,
            conflictId,
            participants: conflict.participants.filter(p => p.role !== 'observer').map(p => p.agentId),
            proposals: [],
            votes: [],
            roundResult: 'progress',
            convergenceScore: 0,
            startedAt: new Date().toISOString()
        };

        rounds.push(negotiationRound);
        this.negotiationRounds.set(conflictId, rounds);

        // Update conflict to use new strategy if provided
        if (strategy) {
            conflict.resolutionCriteria.strategy = strategy;
        }

        this.emit('negotiationRoundStarted', {
            conflictId,
            roundId,
            roundNumber,
            strategy: conflict.resolutionCriteria.strategy
        });

        logger.info('🗣️ Negotiation round started', {
            conflictId,
            roundId,
            roundNumber,
            participantCount: negotiationRound.participants.length
        });

        return roundId;
    }

    // Private helper methods
    private async executeResolutionStrategy(request: ConflictResolutionRequest): Promise<void> {
        const { strategy } = request.resolutionCriteria;

        switch (strategy) {
        case 'consensus-building':
            await this.executeConsensusBuilding(request);
            break;
        case 'majority-vote':
            await this.executeMajorityVote(request);
            break;
        case 'weighted-vote':
            await this.executeWeightedVote(request);
            break;
        case 'expert-authority':
            await this.executeExpertAuthority(request);
            break;
        case 'collaborative-negotiation':
            await this.executeCollaborativeNegotiation(request);
            break;
        case 'automated-compromise':
            await this.executeAutomatedCompromise(request);
            break;
        case 'escalation-hierarchy':
            await this.executeEscalationHierarchy(request);
            break;
        case 'time-bounded-consensus':
            await this.executeTimeBoundedConsensus(request);
            break;
        case 'evidence-based-resolution':
            await this.executeEvidenceBasedResolution(request);
            break;
        }
    }

    private async executeConsensusBuilding(request: ConflictResolutionRequest): Promise<void> {
        // Start initial negotiation round
        await this.startNegotiationRound(request.conflictId, 'consensus-building');

        // Set up timeout for consensus building
        setTimeout(async () => {
            const resolution = this.resolutionHistory.get(request.conflictId);
            if (!resolution) {
                // Attempt to build consensus or fall back to alternative strategy
                const consensusResult = await this.evaluateConsensus(request.conflictId);
                if (!consensusResult.achieved) {
                    if (request.resolutionCriteria.fallbackStrategy) {
                        logger.info('🔄 Consensus building timeout, falling back to alternative strategy', {
                            conflictId: request.conflictId,
                            fallbackStrategy: request.resolutionCriteria.fallbackStrategy
                        });
                        request.resolutionCriteria.strategy = request.resolutionCriteria.fallbackStrategy;
                        await this.executeResolutionStrategy(request);
                    } else {
                        // Force resolution with current best consensus
                        await this.finalizeResolution(request.conflictId, consensusResult);
                    }
                }
            }
        }, request.resolutionCriteria.timeoutMs);
    }

    private async executeMajorityVote(request: ConflictResolutionRequest): Promise<void> {
        // Immediately start voting round
        await this.startNegotiationRound(request.conflictId, 'majority-vote');

        // Set timeout for voting completion
        setTimeout(async () => {
            const votes = this.conflictVotes.get(request.conflictId) || [];
            if (votes.length > 0) {
                const majorityResult = this.calculateMajorityVote(votes);
                await this.finalizeResolution(request.conflictId, majorityResult);
            }
        }, Math.min(request.resolutionCriteria.timeoutMs, 300000)); // Max 5 minutes for voting
    }

    private async executeWeightedVote(request: ConflictResolutionRequest): Promise<void> {
        // Similar to majority vote but considers participant weights
        await this.startNegotiationRound(request.conflictId, 'weighted-vote');

        setTimeout(async () => {
            const votes = this.conflictVotes.get(request.conflictId) || [];
            if (votes.length > 0) {
                const weightedResult = this.calculateWeightedVote(request, votes);
                await this.finalizeResolution(request.conflictId, weightedResult);
            }
        }, Math.min(request.resolutionCriteria.timeoutMs, 300000));
    }

    private async executeExpertAuthority(request: ConflictResolutionRequest): Promise<void> {
        // Find the highest authority participant
        const authorityParticipant = request.participants
            .filter(p => p.role === 'decision-maker')
            .sort((a, b) => b.weight - a.weight)[0];

        if (authorityParticipant?.position) {
            const authorityResult = {
                achieved: true,
                resolvedValue: authorityParticipant.position.proposedValue,
                consensusScore: authorityParticipant.weight,
                resolutionPath: `Authority decision by ${authorityParticipant.agentId}`
            };
            await this.finalizeResolution(request.conflictId, authorityResult);
        }
    }

    private async executeCollaborativeNegotiation(request: ConflictResolutionRequest): Promise<void> {
        // Start multiple negotiation rounds with increasing compromise
        let round = 1;
        const maxRounds = 5;

        const runNegotiationRound = async (): Promise<void> => {
            if (round > maxRounds) {
                // Force resolution with best available compromise
                const currentConsensus = await this.evaluateConsensus(request.conflictId);
                await this.finalizeResolution(request.conflictId, currentConsensus);
                return;
            }

            await this.startNegotiationRound(request.conflictId, 'collaborative-negotiation');

            setTimeout(async () => {
                const consensusResult = await this.evaluateConsensus(request.conflictId);
                if (consensusResult.achieved) {
                    await this.finalizeResolution(request.conflictId, consensusResult);
                } else {
                    round++;
                    await runNegotiationRound();
                }
            }, request.resolutionCriteria.timeoutMs / maxRounds);
        };

        await runNegotiationRound();
    }

    private async executeAutomatedCompromise(request: ConflictResolutionRequest): Promise<void> {
        // Analyze all conflicting values and generate a compromise
        const compromiseValue = this.generateCompromiseValue(request.conflictData.conflictingValues);
        
        const compromiseResult = {
            achieved: true,
            resolvedValue: compromiseValue,
            consensusScore: 0.7, // Moderate consensus for automated compromise
            resolutionPath: 'Automated compromise based on conflicting values analysis'
        };

        await this.finalizeResolution(request.conflictId, compromiseResult);
    }

    private async executeEscalationHierarchy(request: ConflictResolutionRequest): Promise<void> {
        // Escalate to higher authority (would integrate with organizational hierarchy)
        const escalationResult = {
            achieved: true,
            resolvedValue: request.conflictData.conflictingValues[0], // Placeholder
            consensusScore: 0.8,
            resolutionPath: 'Escalated to higher authority for resolution'
        };

        await this.finalizeResolution(request.conflictId, escalationResult);
    }

    private async executeTimeBoundedConsensus(request: ConflictResolutionRequest): Promise<void> {
        // Quick consensus with strict time limit
        await this.executeConsensusBuilding(request);
    }

    private async executeEvidenceBasedResolution(request: ConflictResolutionRequest): Promise<void> {
        // Analyze evidence and make data-driven decision
        const positions = this.participantPositions.get(request.conflictId) || [];
        const evidenceScores = positions.map(p => ({
            position: p,
            evidenceScore: (p.supportingEvidence?.length || 0) * p.confidence
        }));

        const bestEvidence = evidenceScores.sort((a, b) => b.evidenceScore - a.evidenceScore)[0];
        
        if (bestEvidence) {
            const evidenceResult = {
                achieved: true,
                resolvedValue: bestEvidence.position.proposedValue,
                consensusScore: bestEvidence.position.confidence,
                resolutionPath: `Evidence-based resolution (evidence score: ${bestEvidence.evidenceScore})`
            };

            await this.finalizeResolution(request.conflictId, evidenceResult);
        }
    }

    private validateConflictRequest(request: ConflictResolutionRequest): void {
        if (!request.conflictId || !request.conversationId) {
            throw new Error('ConflictId and conversationId are required');
        }

        if (request.participants.length === 0) {
            throw new Error('At least one participant is required');
        }

        if (request.resolutionCriteria.consensusThreshold < 0 || request.resolutionCriteria.consensusThreshold > 1) {
            throw new Error('Consensus threshold must be between 0 and 1');
        }
    }

    private async evaluateConsensus(conflictId: string): Promise<any> {
        const conflict = this.activeConflicts.get(conflictId);
        const votes = this.conflictVotes.get(conflictId) || [];

        if (!conflict) {
            return { achieved: false, consensusScore: 0 };
        }

        const supportVotes = votes.filter(v => v.voteType === 'support');
        const totalVotingWeight = conflict.participants
            .filter(p => p.role !== 'observer')
            .reduce((sum, p) => sum + p.weight, 0);

        const supportWeight = supportVotes.reduce((sum, vote) => {
            const participant = conflict.participants.find(p => p.agentId === vote.participantId);
            return sum + (participant?.weight || 0);
        }, 0);

        const consensusScore = totalVotingWeight > 0 ? supportWeight / totalVotingWeight : 0;
        const achieved = consensusScore >= conflict.resolutionCriteria.consensusThreshold;

        if (achieved && supportVotes.length > 0) {
            // Find the most supported value
            const valueVotes = new Map<any, number>();
            supportVotes.forEach(vote => {
                const current = valueVotes.get(vote.votedValue) || 0;
                const participant = conflict.participants.find(p => p.agentId === vote.participantId);
                valueVotes.set(vote.votedValue, current + (participant?.weight || 0));
            });

            const mostSupported = Array.from(valueVotes.entries())
                .sort((a, b) => b[1] - a[1])[0];

            return {
                achieved: true,
                resolvedValue: mostSupported[0],
                consensusScore,
                resolutionPath: `Consensus achieved with ${Math.round(consensusScore * 100)}% agreement`
            };
        }

        return { achieved: false, consensusScore };
    }

    private calculateMajorityVote(votes: ConsensusVote[]): any {
        const valueVotes = new Map<any, number>();
        votes.forEach(vote => {
            if (vote.voteType === 'support') {
                const current = valueVotes.get(vote.votedValue) || 0;
                valueVotes.set(vote.votedValue, current + 1);
            }
        });

        const majority = Array.from(valueVotes.entries())
            .sort((a, b) => b[1] - a[1])[0];

        const totalVotes = votes.filter(v => v.voteType === 'support').length;
        const consensusScore = totalVotes > 0 ? majority[1] / totalVotes : 0;

        return {
            achieved: majority && majority[1] > totalVotes / 2,
            resolvedValue: majority?.[0],
            consensusScore,
            resolutionPath: `Majority vote (${majority?.[1]} of ${totalVotes} votes)`
        };
    }

    private calculateWeightedVote(request: ConflictResolutionRequest, votes: ConsensusVote[]): any {
        const valueVotes = new Map<any, number>();
        votes.forEach(vote => {
            if (vote.voteType === 'support') {
                const participant = request.participants.find(p => p.agentId === vote.participantId);
                const weight = participant?.weight || 0;
                const current = valueVotes.get(vote.votedValue) || 0;
                valueVotes.set(vote.votedValue, current + weight);
            }
        });

        const totalWeight = request.participants
            .filter(p => votes.some(v => v.participantId === p.agentId && v.voteType === 'support'))
            .reduce((sum, p) => sum + p.weight, 0);

        const weightedWinner = Array.from(valueVotes.entries())
            .sort((a, b) => b[1] - a[1])[0];

        const consensusScore = totalWeight > 0 ? weightedWinner[1] / totalWeight : 0;

        return {
            achieved: weightedWinner && consensusScore > 0.5,
            resolvedValue: weightedWinner?.[0],
            consensusScore,
            resolutionPath: `Weighted vote (${Math.round(consensusScore * 100)}% weighted support)`
        };
    }

    private generateCompromiseValue(conflictingValues: any[]): any {
        // Simple compromise generation - in practice, this would be more sophisticated
        if (conflictingValues.length === 0) return null;
        
        // For numeric values, return average
        if (conflictingValues.every(v => typeof v === 'number')) {
            return conflictingValues.reduce((sum, v) => sum + v, 0) / conflictingValues.length;
        }
        
        // For objects, merge properties
        if (conflictingValues.every(v => typeof v === 'object' && v !== null)) {
            return Object.assign({}, ...conflictingValues);
        }
        
        // For mixed types, return the most common value
        const valueCounts = new Map();
        conflictingValues.forEach(value => {
            const key = JSON.stringify(value);
            valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
        });
        
        const mostCommon = Array.from(valueCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];
        
        return JSON.parse(mostCommon[0]);
    }

    private async finalizeResolution(conflictId: string, consensusResult: any): Promise<void> {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) return;

        const startTime = new Date(conflict.conflictData.timestamp).getTime();
        const resolutionTime = Date.now() - startTime;

        const votes = this.conflictVotes.get(conflictId) || [];
        const rounds = this.negotiationRounds.get(conflictId) || [];

        // Calculate participant agreement
        const participantAgreement = new Map<string, boolean>();
        conflict.participants.forEach(participant => {
            const vote = votes.find(v => v.participantId === participant.agentId);
            if (vote) {
                participantAgreement.set(participant.agentId, 
                    vote.voteType === 'support' && 
                    JSON.stringify(vote.votedValue) === JSON.stringify(consensusResult.resolvedValue)
                );
            }
        });

        const resolution: ConflictResolution = {
            resolutionId: `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conflictId,
            conversationId: conflict.conversationId,
            resolutionType: this.determineResolutionType(conflict.resolutionCriteria.strategy),
            resolvedValue: consensusResult.resolvedValue,
            resolutionPath: consensusResult.resolutionPath,
            participantAgreement,
            consensusScore: consensusResult.consensusScore,
            resolutionTime,
            finalVotes: votes,
            metadata: {
                strategy: conflict.resolutionCriteria.strategy,
                iterations: 1,
                negotiationRounds: rounds.length,
                compromisesOffered: 0,
                escalationRequired: false,
                overallSatisfaction: consensusResult.consensusScore
            },
            resolvedAt: new Date().toISOString()
        };

        // Store resolution and cleanup active conflict
        this.resolutionHistory.set(conflictId, resolution);
        this.activeConflicts.delete(conflictId);

        // Update final metrics
        await this.updateConflictMetrics(conflictId, resolution);

        // Emit resolution event
        this.emit('conflictResolved', {
            conflictId,
            resolutionId: resolution.resolutionId,
            resolutionType: resolution.resolutionType,
            consensusScore: resolution.consensusScore,
            resolutionTime
        });

        logger.info('✅ Conflict resolution finalized', {
            conflictId,
            resolutionId: resolution.resolutionId,
            resolutionType: resolution.resolutionType,
            consensusScore: Math.round(resolution.consensusScore * 100),
            resolutionTimeMs: resolutionTime
        });
    }

    private determineResolutionType(strategy: ConflictResolutionStrategy): ConflictResolution['resolutionType'] {
        switch (strategy) {
        case 'consensus-building':
        case 'time-bounded-consensus':
            return 'consensus';
        case 'majority-vote':
        case 'weighted-vote':
            return 'majority';
        case 'expert-authority':
            return 'authority';
        case 'automated-compromise':
        case 'collaborative-negotiation':
            return 'compromise';
        case 'escalation-hierarchy':
            return 'escalation';
        default:
            return 'consensus';
        }
    }

    private async evaluateResolutionProgress(conflictId: string): Promise<void> {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) return;

        const positions = this.participantPositions.get(conflictId) || [];
        const votes = this.conflictVotes.get(conflictId) || [];

        // Check if all required participants have submitted positions
        const requiredParticipants = conflict.resolutionCriteria.requiredParticipants || 
            conflict.participants.filter(p => p.role !== 'observer').map(p => p.agentId);

        const submittedPositions = new Set(positions.map(p => p.participantId));
        const allPositionsSubmitted = requiredParticipants.every(id => submittedPositions.has(id));

        if (allPositionsSubmitted && votes.length === 0) {
            // Start voting phase
            await this.startNegotiationRound(conflictId);
        }
    }

    private calculateResolutionProgress(conflictId: string): number {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) return 100; // Assume completed if not active

        const positions = this.participantPositions.get(conflictId) || [];
        const votes = this.conflictVotes.get(conflictId) || [];

        const totalParticipants = conflict.participants.filter(p => p.role !== 'observer').length;
        const positionProgress = Math.min(positions.length / totalParticipants, 1) * 50;
        const voteProgress = Math.min(votes.length / totalParticipants, 1) * 50;

        return positionProgress + voteProgress;
    }

    private async updateConflictMetrics(conflictId: string, resolution?: ConflictResolution): Promise<void> {
        const metrics = this.conflictMetrics.get(conflictId);
        if (!metrics) return;

        const votes = this.conflictVotes.get(conflictId) || [];
        const positions = this.participantPositions.get(conflictId) || [];
        const rounds = this.negotiationRounds.get(conflictId) || [];

        metrics.resolutionTime = resolution?.resolutionTime || 0;
        metrics.negotiationRounds = rounds.length;
        metrics.consensusScore = resolution?.consensusScore || 0;
        metrics.participationRate = (votes.length + positions.length) / (metrics.totalParticipants * 2);
        metrics.satisfactionScore = resolution?.metadata.overallSatisfaction || 0;
        metrics.efficacyScore = metrics.consensusScore * metrics.participationRate;
        metrics.convergenceRate = this.calculateConvergenceRate(conflictId);
        metrics.lastUpdated = new Date().toISOString();

        this.conflictMetrics.set(conflictId, metrics);
    }

    private calculateConvergenceRate(conflictId: string): number {
        const positions = this.participantPositions.get(conflictId) || [];
        if (positions.length < 2) return 0;

        // Simple convergence calculation based on confidence scores
        const avgConfidence = positions.reduce((sum, p) => sum + p.confidence, 0) / positions.length;
        return avgConfidence;
    }

    private startConflictMonitoring(): void {
        // Monitor conflict timeouts and health
        setInterval(() => {
            this.monitorActiveConflicts();
        }, 30000); // Check every 30 seconds
    }

    private async monitorActiveConflicts(): Promise<void> {
        const now = Date.now();

        for (const [conflictId, conflict] of this.activeConflicts) {
            const conflictAge = now - new Date(conflict.conflictData.timestamp).getTime();
            const timeout = conflict.resolutionCriteria.timeoutMs;

            if (conflictAge > timeout) {
                logger.warn('⏰ Conflict resolution timeout detected', {
                    conflictId,
                    conflictAge: `${Math.round(conflictAge / 1000)}s`,
                    timeout: `${timeout / 1000}s`
                });

                // Force resolution with current state
                const currentConsensus = await this.evaluateConsensus(conflictId);
                await this.finalizeResolution(conflictId, currentConsensus);
            }
        }
    }

    // Public utility methods
    public getActiveConflicts(): string[] {
        return Array.from(this.activeConflicts.keys());
    }

    public getResolutionHistory(): ConflictResolution[] {
        return Array.from(this.resolutionHistory.values());
    }

    public async getSystemMetrics(): Promise<Record<string, any>> {
        const activeCount = this.activeConflicts.size;
        const totalResolutions = this.resolutionHistory.size;
        const allMetrics = Array.from(this.conflictMetrics.values());

        const avgConsensusScore = allMetrics.length > 0 ? 
            allMetrics.reduce((sum, m) => sum + m.consensusScore, 0) / allMetrics.length : 0;

        const avgResolutionTime = allMetrics.length > 0 ? 
            allMetrics.reduce((sum, m) => sum + m.resolutionTime, 0) / allMetrics.length : 0;

        return {
            timestamp: new Date().toISOString(),
            conflicts: {
                active: activeCount,
                totalResolved: totalResolutions,
                resolutionRate: activeCount + totalResolutions > 0 ? 
                    totalResolutions / (activeCount + totalResolutions) * 100 : 0
            },
            performance: {
                averageConsensusScore: avgConsensusScore,
                averageResolutionTime: avgResolutionTime,
                averageParticipationRate: allMetrics.length > 0 ? 
                    allMetrics.reduce((sum, m) => sum + m.participationRate, 0) / allMetrics.length : 0
            },
            strategies: {
                mostUsed: this.getMostUsedStrategy(),
                mostEffective: this.getMostEffectiveStrategy()
            }
        };
    }

    private getMostUsedStrategy(): string {
        const strategyCount = new Map<string, number>();
        
        for (const conflict of this.activeConflicts.values()) {
            const strategy = conflict.resolutionCriteria.strategy;
            strategyCount.set(strategy, (strategyCount.get(strategy) || 0) + 1);
        }

        for (const resolution of this.resolutionHistory.values()) {
            const strategy = resolution.metadata.strategy;
            strategyCount.set(strategy, (strategyCount.get(strategy) || 0) + 1);
        }

        const mostUsed = Array.from(strategyCount.entries())
            .sort((a, b) => b[1] - a[1])[0];

        return mostUsed?.[0] || 'consensus-building';
    }

    private getMostEffectiveStrategy(): string {
        const strategyEffectiveness = new Map<string, { total: number, count: number }>();

        for (const resolution of this.resolutionHistory.values()) {
            const strategy = resolution.metadata.strategy;
            const current = strategyEffectiveness.get(strategy) || { total: 0, count: 0 };
            current.total += resolution.consensusScore;
            current.count += 1;
            strategyEffectiveness.set(strategy, current);
        }

        const mostEffective = Array.from(strategyEffectiveness.entries())
            .map(([strategy, data]) => ({ strategy, avg: data.total / data.count }))
            .sort((a, b) => b.avg - a.avg)[0];

        return mostEffective?.strategy || 'consensus-building';
    }
}

// Export singleton instance
export const conflictResolver = new ConflictResolver();
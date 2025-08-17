var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { createMCPLogger } from '../utils/mcp-logger.js';
import { performanceMonitor, performanceMonitored } from './performance-monitor.js';
import { expertCache, ExpertCacheKeys, cached } from './expert-cache.js';
import { expertErrorHandler, ExpertErrorUtils } from './error-handler.js';
import { EventEmitter } from 'events';
const logger = createMCPLogger('conflict-resolver.log');
// Conflict Resolver Service
export class ConflictResolver extends EventEmitter {
    activeConflicts = new Map();
    resolutionHistory = new Map();
    negotiationRounds = new Map();
    participantPositions = new Map();
    conflictVotes = new Map();
    conflictMetrics = new Map();
    constructor() {
        super();
        this.startConflictMonitoring();
        logger.info('⚖️ Conflict Resolver initialized', {
            resolutionStrategies: 9,
            monitoringEnabled: true
        });
    }
    async initiateConflictResolution(request) {
        return await expertErrorHandler.executeWithErrorHandling('initiateConflictResolution', 'ConflictResolver', async () => {
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
            const fallbackResolution = {
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
        });
    }
    async submitPosition(conflictId, position) {
        return await expertErrorHandler.executeWithErrorHandling('submitPosition', 'ConflictResolver', async () => {
            const positionId = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date().toISOString();
            const fullPosition = {
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
                throw ExpertErrorUtils.createValidationError('ConflictResolver', 'submitPosition', `Conflict ${conflictId} not found`);
            }
            // Validate participant is authorized
            const participant = conflict.participants.find(p => p.agentId === position.participantId);
            if (!participant) {
                throw ExpertErrorUtils.createValidationError('ConflictResolver', 'submitPosition', `Participant ${position.participantId} not authorized for conflict ${conflictId}`);
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
        });
    }
    async submitVote(conflictId, vote) {
        return await expertErrorHandler.executeWithErrorHandling('submitVote', 'ConflictResolver', async () => {
            const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date().toISOString();
            const fullVote = {
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
                throw ExpertErrorUtils.createValidationError('ConflictResolver', 'submitVote', `Conflict ${conflictId} not found`);
            }
            // Validate participant is authorized
            const participant = conflict.participants.find(p => p.agentId === vote.participantId);
            if (!participant || participant.role === 'observer') {
                throw ExpertErrorUtils.createValidationError('ConflictResolver', 'submitVote', `Participant ${vote.participantId} not authorized to vote on conflict ${conflictId}`);
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
            }
            else {
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
        });
    }
    async getConflictStatus(conflictId) {
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
    async startNegotiationRound(conflictId, strategy) {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict) {
            throw new Error(`Conflict ${conflictId} not found`);
        }
        const rounds = this.negotiationRounds.get(conflictId) || [];
        const roundNumber = rounds.length + 1;
        const roundId = `round-${conflictId}-${roundNumber}`;
        const negotiationRound = {
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
    async executeResolutionStrategy(request) {
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
    async executeConsensusBuilding(request) {
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
                    }
                    else {
                        // Force resolution with current best consensus
                        await this.finalizeResolution(request.conflictId, consensusResult);
                    }
                }
            }
        }, request.resolutionCriteria.timeoutMs);
    }
    async executeMajorityVote(request) {
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
    async executeWeightedVote(request) {
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
    async executeExpertAuthority(request) {
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
    async executeCollaborativeNegotiation(request) {
        // Start multiple negotiation rounds with increasing compromise
        let round = 1;
        const maxRounds = 5;
        const runNegotiationRound = async () => {
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
                }
                else {
                    round++;
                    await runNegotiationRound();
                }
            }, request.resolutionCriteria.timeoutMs / maxRounds);
        };
        await runNegotiationRound();
    }
    async executeAutomatedCompromise(request) {
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
    async executeEscalationHierarchy(request) {
        // Escalate to higher authority (would integrate with organizational hierarchy)
        const escalationResult = {
            achieved: true,
            resolvedValue: request.conflictData.conflictingValues[0], // Placeholder
            consensusScore: 0.8,
            resolutionPath: 'Escalated to higher authority for resolution'
        };
        await this.finalizeResolution(request.conflictId, escalationResult);
    }
    async executeTimeBoundedConsensus(request) {
        // Quick consensus with strict time limit
        await this.executeConsensusBuilding(request);
    }
    async executeEvidenceBasedResolution(request) {
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
    validateConflictRequest(request) {
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
    async evaluateConsensus(conflictId) {
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
            const valueVotes = new Map();
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
    calculateMajorityVote(votes) {
        const valueVotes = new Map();
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
    calculateWeightedVote(request, votes) {
        const valueVotes = new Map();
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
    generateCompromiseValue(conflictingValues) {
        // Simple compromise generation - in practice, this would be more sophisticated
        if (conflictingValues.length === 0)
            return null;
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
    async finalizeResolution(conflictId, consensusResult) {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict)
            return;
        const startTime = new Date(conflict.conflictData.timestamp).getTime();
        const resolutionTime = Date.now() - startTime;
        const votes = this.conflictVotes.get(conflictId) || [];
        const rounds = this.negotiationRounds.get(conflictId) || [];
        // Calculate participant agreement
        const participantAgreement = new Map();
        conflict.participants.forEach(participant => {
            const vote = votes.find(v => v.participantId === participant.agentId);
            if (vote) {
                participantAgreement.set(participant.agentId, vote.voteType === 'support' &&
                    JSON.stringify(vote.votedValue) === JSON.stringify(consensusResult.resolvedValue));
            }
        });
        const resolution = {
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
    determineResolutionType(strategy) {
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
    async evaluateResolutionProgress(conflictId) {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict)
            return;
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
    calculateResolutionProgress(conflictId) {
        const conflict = this.activeConflicts.get(conflictId);
        if (!conflict)
            return 100; // Assume completed if not active
        const positions = this.participantPositions.get(conflictId) || [];
        const votes = this.conflictVotes.get(conflictId) || [];
        const totalParticipants = conflict.participants.filter(p => p.role !== 'observer').length;
        const positionProgress = Math.min(positions.length / totalParticipants, 1) * 50;
        const voteProgress = Math.min(votes.length / totalParticipants, 1) * 50;
        return positionProgress + voteProgress;
    }
    async updateConflictMetrics(conflictId, resolution) {
        const metrics = this.conflictMetrics.get(conflictId);
        if (!metrics)
            return;
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
    calculateConvergenceRate(conflictId) {
        const positions = this.participantPositions.get(conflictId) || [];
        if (positions.length < 2)
            return 0;
        // Simple convergence calculation based on confidence scores
        const avgConfidence = positions.reduce((sum, p) => sum + p.confidence, 0) / positions.length;
        return avgConfidence;
    }
    startConflictMonitoring() {
        // Monitor conflict timeouts and health
        setInterval(() => {
            this.monitorActiveConflicts();
        }, 30000); // Check every 30 seconds
    }
    async monitorActiveConflicts() {
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
    getActiveConflicts() {
        return Array.from(this.activeConflicts.keys());
    }
    getResolutionHistory() {
        return Array.from(this.resolutionHistory.values());
    }
    async getSystemMetrics() {
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
    getMostUsedStrategy() {
        const strategyCount = new Map();
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
    getMostEffectiveStrategy() {
        const strategyEffectiveness = new Map();
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
__decorate([
    performanceMonitored('conflict-resolution-initiation', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConflictResolver.prototype, "initiateConflictResolution", null);
__decorate([
    performanceMonitored('position-submission', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConflictResolver.prototype, "submitPosition", null);
__decorate([
    performanceMonitored('consensus-vote', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConflictResolver.prototype, "submitVote", null);
__decorate([
    cached(expertCache, (conflictId) => `conflict-status:${conflictId}`, 30 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConflictResolver.prototype, "getConflictStatus", null);
// Export singleton instance
export const conflictResolver = new ConflictResolver();
//# sourceMappingURL=conflict-resolver.js.map
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
import { performanceMonitor, performanceMonitored } from '../infrastructure/performance-monitor.js';
import { expertCache, ExpertCacheKeys, cached } from '../infrastructure/expert-cache.js';
import { expertConnectionPool } from '../infrastructure/expert-connection-pool.js';
import { expertErrorHandler, ExpertErrorUtils } from '../infrastructure/error-handler.js';
import { contextSynchronizer } from '../infrastructure/context-synchronizer.js';
import { EventEmitter } from 'events';
const logger = createMCPLogger('multi-agent-conversation-manager.log');
// Multi-agent Conversation Manager Service
export class MultiAgentConversationManager extends EventEmitter {
    conversations = new Map();
    conversationRules = [];
    activeAgents = new Map();
    messageQueue = new Map();
    constructor() {
        super();
        this.initializeDefaultRules();
        this.startConversationMonitoring();
        logger.info('🗣️ Multi-Agent Conversation Manager initialized', {
            defaultRules: this.conversationRules.length,
            monitoringEnabled: true
        });
    }
    async initiateConversation(taskId, initiatorAgentId, participants, options) {
        return await expertErrorHandler.executeWithErrorHandling('initiateConversation', 'ConversationManager', async () => {
            const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            logger.info('🚀 Initiating multi-agent conversation', {
                conversationId,
                taskId,
                initiatorAgentId,
                participantCount: participants.length,
                contextScope: options.contextScope || 'focused'
            });
            // Initialize participants with status and connections
            const initializedParticipants = [];
            for (const participant of participants) {
                try {
                    // Acquire connection for each participant
                    const connection = await expertConnectionPool.acquireConnection(participant.expertType, `conversation-${conversationId}`);
                    const agentWithConnection = {
                        ...participant,
                        status: 'active',
                        connectionId: connection.id
                    };
                    initializedParticipants.push(agentWithConnection);
                    this.activeAgents.set(participant.agentId, agentWithConnection);
                    logger.debug('👤 Agent initialized for conversation', {
                        agentId: participant.agentId,
                        expertType: participant.expertType,
                        role: participant.role,
                        connectionId: connection.id
                    });
                }
                catch (error) {
                    logger.warn('⚠️ Failed to initialize agent for conversation', {
                        agentId: participant.agentId,
                        expertType: participant.expertType,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Add agent without connection (will be handled by fallback mechanisms)
                    const fallbackAgent = {
                        ...participant,
                        status: 'offline',
                        connectionId: undefined
                    };
                    initializedParticipants.push(fallbackAgent);
                }
            }
            // Initialize context synchronization if enabled
            let contextSyncId;
            const enableContextSync = options.enableContextSync !== false; // Default to enabled
            if (enableContextSync) {
                try {
                    const participantIds = initializedParticipants.map(p => p.agentId);
                    const initialContext = {
                        taskDescription: options.taskDescription,
                        currentObjective: options.initialObjective,
                        ...options.initialSharedData
                    };
                    contextSyncId = await contextSynchronizer.initializeConversationSync(conversationId, participantIds, initialContext);
                    logger.info('🔄 Context synchronization initialized', {
                        conversationId,
                        contextSyncId,
                        participantCount: participantIds.length
                    });
                }
                catch (error) {
                    logger.warn('⚠️ Failed to initialize context synchronization', {
                        conversationId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Continue without context sync
                }
            }
            // Create conversation context
            const conversationContext = {
                conversationId,
                taskId,
                initiatorAgentId,
                participants: initializedParticipants,
                conversationState: 'initializing',
                contextScope: options.contextScope || 'focused',
                sharedContext: {
                    taskDescription: options.taskDescription,
                    currentObjective: options.initialObjective,
                    sharedData: options.initialSharedData || {},
                    decisions: []
                },
                coordinationPattern: options.coordinationPattern || 'collaborative',
                messageHistory: [],
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                timeoutSettings: {
                    responseTimeout: options.timeoutSettings?.responseTimeout || 30000, // 30 seconds
                    inactivityTimeout: options.timeoutSettings?.inactivityTimeout || 300000, // 5 minutes
                    totalConversationTimeout: options.timeoutSettings?.totalConversationTimeout || 3600000, // 1 hour
                    ...options.timeoutSettings
                },
                contextSyncId,
                contextSyncEnabled: enableContextSync
            };
            // Store conversation
            this.conversations.set(conversationId, conversationContext);
            this.messageQueue.set(conversationId, []);
            // Cache conversation for quick access
            const cacheKey = ExpertCacheKeys.contextTransfer(conversationId, 'conversation-context');
            expertCache.set(cacheKey, conversationContext, 60 * 60 * 1000); // Cache for 1 hour
            // Transition to active state
            conversationContext.conversationState = 'active';
            // Emit conversation initiated event
            this.emit('conversationInitiated', {
                conversationId,
                taskId,
                participants: initializedParticipants.length,
                contextScope: conversationContext.contextScope
            });
            logger.info('✅ Multi-agent conversation initiated successfully', {
                conversationId,
                taskId,
                activeParticipants: initializedParticipants.filter(p => p.status === 'active').length,
                offlineParticipants: initializedParticipants.filter(p => p.status === 'offline').length,
                coordinationPattern: conversationContext.coordinationPattern
            });
            return conversationId;
        }, 
        // Fallback function for conversation initiation
        async () => {
            logger.warn('🔄 Using fallback for conversation initiation', {
                taskId,
                initiatorAgentId,
                participantCount: participants.length
            });
            // Create minimal fallback conversation
            const fallbackConversationId = `fallback-conv-${Date.now()}`;
            const fallbackContext = {
                conversationId: fallbackConversationId,
                taskId,
                initiatorAgentId,
                participants: participants.map(p => ({ ...p, status: 'active', connectionId: 'fallback' })),
                conversationState: 'active',
                contextScope: 'focused',
                sharedContext: {
                    taskDescription: options.taskDescription,
                    currentObjective: options.initialObjective,
                    sharedData: {},
                    decisions: []
                },
                coordinationPattern: 'collaborative',
                messageHistory: [],
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                timeoutSettings: {
                    responseTimeout: 30000,
                    inactivityTimeout: 300000,
                    totalConversationTimeout: 3600000
                },
                contextSyncEnabled: false
            };
            this.conversations.set(fallbackConversationId, fallbackContext);
            this.messageQueue.set(fallbackConversationId, []);
            return fallbackConversationId;
        });
    }
    async routeMessage(message) {
        return await expertErrorHandler.executeWithErrorHandling('routeMessage', 'ConversationManager', async () => {
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date().toISOString();
            const fullMessage = {
                ...message,
                messageId,
                timestamp
            };
            logger.info('📨 Routing conversation message', {
                messageId,
                conversationId: message.conversationId,
                senderId: message.senderId,
                recipientCount: message.recipientIds.length,
                messageType: message.messageType,
                urgency: message.urgency
            });
            // Get conversation context
            const conversation = this.conversations.get(message.conversationId);
            if (!conversation) {
                throw ExpertErrorUtils.createValidationError('ConversationManager', 'routeMessage', `Conversation ${message.conversationId} not found`);
            }
            // Update conversation activity
            conversation.lastActivity = timestamp;
            // Apply conversation rules for message routing
            const applicableRules = this.getApplicableRules(fullMessage, conversation);
            for (const rule of applicableRules) {
                await this.executeRule(rule, fullMessage, conversation);
            }
            // Add message to conversation history
            conversation.messageHistory.push(fullMessage);
            // Add message to delivery queue
            const queue = this.messageQueue.get(message.conversationId) || [];
            queue.push(fullMessage);
            this.messageQueue.set(message.conversationId, queue);
            // Update conversation state based on message type
            if (message.messageType === 'completion') {
                conversation.conversationState = 'completing';
            }
            else if (conversation.conversationState === 'initializing') {
                conversation.conversationState = 'active';
            }
            // Update cache
            const cacheKey = ExpertCacheKeys.contextTransfer(message.conversationId, 'conversation-context');
            expertCache.set(cacheKey, conversation, 60 * 60 * 1000);
            // Emit message routed event
            this.emit('messageRouted', {
                messageId,
                conversationId: message.conversationId,
                messageType: message.messageType,
                rulesApplied: applicableRules.length
            });
            logger.info('✅ Message routed successfully', {
                messageId,
                conversationId: message.conversationId,
                rulesApplied: applicableRules.length
            });
            return messageId;
        });
    }
    async getConversationStatus(conversationId) {
        logger.info('📊 Getting conversation status', { conversationId });
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            logger.warn('⚠️ Conversation not found', { conversationId });
            return null;
        }
        // Update participant status
        for (const participant of conversation.participants) {
            if (participant.connectionId && participant.connectionId !== 'fallback') {
                try {
                    // Check if connection is still active (simplified check)
                    const agent = this.activeAgents.get(participant.agentId);
                    if (agent) {
                        participant.status = agent.status;
                    }
                }
                catch {
                    participant.status = 'offline';
                }
            }
        }
        logger.info('✅ Conversation status retrieved', {
            conversationId,
            state: conversation.conversationState,
            participantCount: conversation.participants.length,
            messageCount: conversation.messageHistory.length
        });
        return conversation;
    }
    async addConversationRule(rule) {
        const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullRule = {
            ...rule,
            ruleId
        };
        this.conversationRules.push(fullRule);
        this.conversationRules.sort((a, b) => b.priority - a.priority); // Sort by priority descending
        logger.info('📋 Conversation rule added', {
            ruleId,
            ruleName: rule.ruleName,
            priority: rule.priority,
            actionType: rule.action.type
        });
        return ruleId;
    }
    async getConversationMetrics(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return null;
        }
        const messages = conversation.messageHistory;
        const responseMessages = messages.filter(m => m.messageType === 'response');
        const responseTimes = responseMessages.map(m => {
            const originalMessage = messages.find(orig => orig.senderId !== m.senderId &&
                orig.timestamp < m.timestamp);
            if (originalMessage) {
                return new Date(m.timestamp).getTime() - new Date(originalMessage.timestamp).getTime();
            }
            return 0;
        }).filter(time => time > 0);
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;
        const decisions = conversation.sharedContext.decisions;
        const consensusDecisions = decisions.filter(d => d.consensus);
        const consensusRate = decisions.length > 0 ? (consensusDecisions.length / decisions.length) * 100 : 100;
        const metrics = {
            conversationId,
            participantCount: conversation.participants.length,
            messageCount: messages.length,
            averageResponseTime,
            consensusRate,
            conflictCount: decisions.length - consensusDecisions.length,
            taskCompletionRate: conversation.conversationState === 'completed' ? 100 : 0,
            coordinationEfficiency: this.calculateCoordinationEfficiency(conversation),
            lastUpdated: new Date().toISOString()
        };
        return metrics;
    }
    async completeConversation(conversationId, completionReason) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        conversation.conversationState = 'completed';
        conversation.lastActivity = new Date().toISOString();
        // Release connections for all participants
        for (const participant of conversation.participants) {
            if (participant.connectionId && participant.connectionId !== 'fallback') {
                try {
                    // Connection pool will handle cleanup automatically
                    this.activeAgents.delete(participant.agentId);
                }
                catch (error) {
                    logger.warn('⚠️ Failed to cleanup agent connection', {
                        agentId: participant.agentId,
                        connectionId: participant.connectionId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }
        // Clean up message queue
        this.messageQueue.delete(conversationId);
        // Emit completion event
        this.emit('conversationCompleted', {
            conversationId,
            completionReason,
            duration: new Date().getTime() - new Date(conversation.createdAt).getTime(),
            messageCount: conversation.messageHistory.length
        });
        logger.info('✅ Conversation completed', {
            conversationId,
            completionReason,
            messageCount: conversation.messageHistory.length,
            participantCount: conversation.participants.length
        });
    }
    async updateSharedContext(conversationId, agentId, contextKey, contextValue, options) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        // Validate agent is participant
        const isParticipant = conversation.participants.some(p => p.agentId === agentId);
        if (!isParticipant) {
            throw new Error(`Agent ${agentId} is not a participant in conversation ${conversationId}`);
        }
        let operationId;
        if (conversation.contextSyncEnabled && conversation.contextSyncId) {
            // Use context synchronizer for distributed updates
            operationId = await contextSynchronizer.updateContext(conversationId, agentId, contextKey, contextValue, options);
            // Trigger context sync across all participants
            await contextSynchronizer.syncContext(conversationId);
        }
        else {
            // Fallback to local context update
            operationId = `local-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Apply update directly to shared context
            if (options?.mergeStrategy === 'merge' &&
                typeof conversation.sharedContext.sharedData[contextKey] === 'object' &&
                typeof contextValue === 'object') {
                conversation.sharedContext.sharedData[contextKey] = {
                    ...conversation.sharedContext.sharedData[contextKey],
                    ...contextValue
                };
            }
            else {
                conversation.sharedContext.sharedData[contextKey] = contextValue;
            }
            // Update conversation activity
            conversation.lastActivity = new Date().toISOString();
        }
        // Emit context update event
        this.emit('sharedContextUpdated', {
            conversationId,
            agentId,
            contextKey,
            operationId,
            syncEnabled: conversation.contextSyncEnabled
        });
        logger.info('📝 Shared context updated', {
            conversationId,
            agentId,
            contextKey,
            operationId,
            syncEnabled: conversation.contextSyncEnabled
        });
        return operationId;
    }
    async syncConversationContext(conversationId, targetAgents) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        if (conversation.contextSyncEnabled && conversation.contextSyncId) {
            await contextSynchronizer.syncContext(conversationId, targetAgents);
            logger.info('🔄 Conversation context synchronized', {
                conversationId,
                targetAgentCount: targetAgents?.length || conversation.participants.length
            });
        }
        else {
            logger.warn('⚠️ Context sync not enabled for conversation', { conversationId });
        }
    }
    async getContextSyncStatus(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return null;
        }
        if (conversation.contextSyncEnabled && conversation.contextSyncId) {
            const syncStatus = await contextSynchronizer.getContextStatus(conversationId);
            return {
                conversationId,
                syncEnabled: true,
                syncStatus
            };
        }
        return {
            conversationId,
            syncEnabled: false,
            syncStatus: null
        };
    }
    async createContextSnapshot(conversationId, description, createdBy) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation || !conversation.contextSyncEnabled || !conversation.contextSyncId) {
            return null;
        }
        const versionId = await contextSynchronizer.createVersionSnapshot(conversationId, description, createdBy);
        this.emit('contextSnapshotCreated', {
            conversationId,
            versionId,
            description,
            createdBy
        });
        logger.info('📸 Context snapshot created', {
            conversationId,
            versionId,
            description
        });
        return versionId;
    }
    async rollbackContext(conversationId, versionId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation || !conversation.contextSyncEnabled || !conversation.contextSyncId) {
            throw new Error('Context sync not enabled or conversation not found');
        }
        await contextSynchronizer.rollbackToVersion(conversationId, versionId);
        // Update conversation activity
        conversation.lastActivity = new Date().toISOString();
        this.emit('contextRolledBack', {
            conversationId,
            versionId,
            timestamp: new Date().toISOString()
        });
        logger.info('🔄 Context rolled back', {
            conversationId,
            versionId
        });
    }
    // Private helper methods
    initializeDefaultRules() {
        const defaultRules = [
            {
                ruleName: 'High Priority Message Escalation',
                condition: {
                    urgencyLevels: ['high', 'critical']
                },
                action: {
                    type: 'escalate',
                    parameters: {
                        escalateTo: 'primary',
                        notifyAll: true
                    }
                },
                priority: 90,
                enabled: true
            },
            {
                ruleName: 'Completion Message Broadcasting',
                condition: {
                    messageTypes: ['completion']
                },
                action: {
                    type: 'notify',
                    parameters: {
                        notifyAll: true,
                        updateState: 'completing'
                    }
                },
                priority: 80,
                enabled: true
            },
            {
                ruleName: 'Response Timeout Notification',
                condition: {
                    messageTypes: ['question']
                },
                action: {
                    type: 'notify',
                    parameters: {
                        scheduleReminder: true,
                        reminderDelay: 30000
                    }
                },
                priority: 70,
                enabled: true
            }
        ];
        for (const rule of defaultRules) {
            const ruleId = `default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.conversationRules.push({ ...rule, ruleId });
        }
        this.conversationRules.sort((a, b) => b.priority - a.priority);
    }
    startConversationMonitoring() {
        // Monitor conversations for timeouts and health
        setInterval(() => {
            this.monitorConversationHealth();
        }, 30000); // Check every 30 seconds
    }
    async monitorConversationHealth() {
        const now = new Date().getTime();
        for (const [conversationId, conversation] of this.conversations) {
            if (conversation.conversationState === 'completed') {
                continue;
            }
            const lastActivity = new Date(conversation.lastActivity).getTime();
            const inactivityDuration = now - lastActivity;
            // Check for inactivity timeout
            if (inactivityDuration > conversation.timeoutSettings.inactivityTimeout) {
                logger.warn('⏰ Conversation inactivity timeout detected', {
                    conversationId,
                    inactivityDuration: `${Math.round(inactivityDuration / 1000)}s`,
                    threshold: `${conversation.timeoutSettings.inactivityTimeout / 1000}s`
                });
                conversation.conversationState = 'paused';
                this.emit('conversationTimeout', {
                    conversationId,
                    timeoutType: 'inactivity',
                    duration: inactivityDuration
                });
            }
            // Check for total conversation timeout
            const totalDuration = now - new Date(conversation.createdAt).getTime();
            if (totalDuration > conversation.timeoutSettings.totalConversationTimeout) {
                logger.warn('⏰ Conversation total timeout detected', {
                    conversationId,
                    totalDuration: `${Math.round(totalDuration / 1000)}s`,
                    threshold: `${conversation.timeoutSettings.totalConversationTimeout / 1000}s`
                });
                await this.completeConversation(conversationId, 'timeout');
            }
        }
    }
    getApplicableRules(message, conversation) {
        return this.conversationRules.filter(rule => {
            if (!rule.enabled)
                return false;
            const condition = rule.condition;
            // Check message type condition
            if (condition.messageTypes && !condition.messageTypes.includes(message.messageType)) {
                return false;
            }
            // Check urgency condition
            if (condition.urgencyLevels && !condition.urgencyLevels.includes(message.urgency)) {
                return false;
            }
            // Check conversation state condition
            if (condition.conversationStates && !condition.conversationStates.includes(conversation.conversationState)) {
                return false;
            }
            // Check agent role condition
            if (condition.agentRoles) {
                const senderAgent = conversation.participants.find(p => p.agentId === message.senderId);
                if (!senderAgent || !condition.agentRoles.includes(senderAgent.role)) {
                    return false;
                }
            }
            return true;
        });
    }
    async executeRule(rule, message, conversation) {
        try {
            switch (rule.action.type) {
                case 'escalate':
                    await this.handleEscalation(rule.action.parameters, message, conversation);
                    break;
                case 'notify':
                    await this.handleNotification(rule.action.parameters, message, conversation);
                    break;
                case 'route':
                    await this.handleRouting(rule.action.parameters, message, conversation);
                    break;
                case 'transform':
                    await this.handleTransformation(rule.action.parameters, message, conversation);
                    break;
                case 'validate':
                    await this.handleValidation(rule.action.parameters, message, conversation);
                    break;
                case 'archive':
                    await this.handleArchival(rule.action.parameters, message, conversation);
                    break;
            }
            logger.debug('📋 Conversation rule executed', {
                ruleId: rule.ruleId,
                ruleName: rule.ruleName,
                actionType: rule.action.type,
                messageId: message.messageId
            });
        }
        catch (error) {
            logger.error('❌ Failed to execute conversation rule', {
                ruleId: rule.ruleId,
                ruleName: rule.ruleName,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async handleEscalation(parameters, message, conversation) {
        const escalateTo = parameters.escalateTo;
        const notifyAll = parameters.notifyAll;
        // Find escalation target
        const targetAgent = conversation.participants.find(p => p.role === escalateTo);
        if (targetAgent) {
            // Add escalation to message recipients
            if (!message.recipientIds.includes(targetAgent.agentId)) {
                message.recipientIds.push(targetAgent.agentId);
            }
        }
        if (notifyAll) {
            // Add all participants to recipients
            for (const participant of conversation.participants) {
                if (!message.recipientIds.includes(participant.agentId)) {
                    message.recipientIds.push(participant.agentId);
                }
            }
        }
    }
    async handleNotification(parameters, message, conversation) {
        if (parameters.notifyAll) {
            for (const participant of conversation.participants) {
                if (!message.recipientIds.includes(participant.agentId)) {
                    message.recipientIds.push(participant.agentId);
                }
            }
        }
        if (parameters.updateState) {
            conversation.conversationState = parameters.updateState;
        }
        if (parameters.scheduleReminder) {
            const delay = parameters.reminderDelay || 30000;
            setTimeout(() => {
                this.emit('responseReminder', {
                    conversationId: conversation.conversationId,
                    messageId: message.messageId,
                    senderId: message.senderId
                });
            }, delay);
        }
    }
    async handleRouting(_parameters, _message, _conversation) {
        // Custom routing logic based on parameters
        // This is a placeholder for advanced routing capabilities
    }
    async handleTransformation(_parameters, _message, _conversation) {
        // Message transformation logic
        // This is a placeholder for message transformation capabilities
    }
    async handleValidation(_parameters, _message, _conversation) {
        // Message validation logic
        // This is a placeholder for message validation capabilities
    }
    async handleArchival(_parameters, _message, _conversation) {
        // Message archival logic
        // This is a placeholder for message archival capabilities
    }
    calculateCoordinationEfficiency(conversation) {
        const messages = conversation.messageHistory;
        if (messages.length === 0)
            return 100;
        // Calculate efficiency based on various factors
        const taskMessages = messages.filter(m => m.messageType === 'task-assignment' || m.messageType === 'response');
        const coordinationMessages = messages.filter(m => m.messageType === 'coordination');
        const taskRatio = taskMessages.length / messages.length;
        const redundancyPenalty = coordinationMessages.length > (messages.length * 0.3) ? 0.8 : 1.0;
        const baseEfficiency = taskRatio * 100;
        const adjustedEfficiency = baseEfficiency * redundancyPenalty;
        return Math.max(0, Math.min(100, adjustedEfficiency));
    }
    // Public utility methods
    getActiveConversations() {
        return Array.from(this.conversations.keys()).filter(id => {
            const conversation = this.conversations.get(id);
            return conversation && conversation.conversationState === 'active';
        });
    }
    getConversationsByAgent(agentId) {
        const conversationIds = [];
        for (const [id, conversation] of this.conversations) {
            if (conversation.participants.some(p => p.agentId === agentId)) {
                conversationIds.push(id);
            }
        }
        return conversationIds;
    }
    async getSystemMetrics() {
        const activeCount = this.getActiveConversations().length;
        const totalConversations = this.conversations.size;
        const totalAgents = this.activeAgents.size;
        const totalRules = this.conversationRules.filter(r => r.enabled).length;
        return {
            timestamp: new Date().toISOString(),
            conversations: {
                active: activeCount,
                total: totalConversations,
                completionRate: totalConversations > 0 ? ((totalConversations - activeCount) / totalConversations) * 100 : 0
            },
            agents: {
                active: totalAgents,
                averageParticipation: totalAgents > 0 ? activeCount / totalAgents : 0
            },
            rules: {
                enabled: totalRules,
                total: this.conversationRules.length
            },
            performance: {
                averageConversationDuration: this.calculateAverageConversationDuration(),
                messageProcessingRate: this.calculateMessageProcessingRate()
            }
        };
    }
    calculateAverageConversationDuration() {
        const completedConversations = Array.from(this.conversations.values())
            .filter(c => c.conversationState === 'completed');
        if (completedConversations.length === 0)
            return 0;
        const totalDuration = completedConversations.reduce((sum, conversation) => {
            const start = new Date(conversation.createdAt).getTime();
            const end = new Date(conversation.lastActivity).getTime();
            return sum + (end - start);
        }, 0);
        return totalDuration / completedConversations.length;
    }
    calculateMessageProcessingRate() {
        const totalMessages = Array.from(this.conversations.values())
            .reduce((sum, conversation) => sum + conversation.messageHistory.length, 0);
        const totalDuration = Array.from(this.conversations.values())
            .reduce((sum, conversation) => {
            const start = new Date(conversation.createdAt).getTime();
            const end = new Date(conversation.lastActivity).getTime();
            return sum + (end - start);
        }, 0);
        if (totalDuration === 0)
            return 0;
        return (totalMessages / totalDuration) * 1000 * 60; // Messages per minute
    }
}
__decorate([
    performanceMonitored('conversation-initialization', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Object]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "initiateConversation", null);
__decorate([
    performanceMonitored('message-routing', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "routeMessage", null);
__decorate([
    cached(expertCache, (conversationId) => `conversation-status:${conversationId}`, 2 * 60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "getConversationStatus", null);
__decorate([
    performanceMonitored('context-update', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "updateSharedContext", null);
__decorate([
    performanceMonitored('context-sync', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "syncConversationContext", null);
// Export singleton instance
export const multiAgentConversationManager = new MultiAgentConversationManager();
//# sourceMappingURL=multi-agent-conversation-manager.js.map
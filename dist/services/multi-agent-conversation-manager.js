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
import { conflictResolver } from '../infrastructure/conflict-resolver.js';
import { workflowOrchestrator } from '../infrastructure/workflow-orchestrator.js';
import { coordinationMonitor } from '../infrastructure/coordination-monitor.js';
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
    // Workflow Orchestration Integration Methods
    async createConversationWorkflow(conversationId, workflowType, options) {
        return await expertErrorHandler.executeWithErrorHandling('createConversationWorkflow', 'MultiAgentConversationManager', async () => {
            const conversation = this.conversations.get(conversationId);
            if (!conversation) {
                throw ExpertErrorUtils.createValidationError('MultiAgentConversationManager', 'createConversationWorkflow', `Conversation not found: ${conversationId}`);
            }
            logger.info('🎼 Creating conversation workflow', {
                conversationId,
                workflowType,
                participantCount: conversation.participants.length
            });
            // Define workflow steps based on type
            const defaultSteps = this.getWorkflowStepsForType(workflowType, conversation);
            const finalSteps = options?.steps || defaultSteps;
            // Get participant IDs
            const participants = conversation.participants.map(p => p.agentId);
            // Create workflow definition
            const workflowId = await workflowOrchestrator.createWorkflowDefinition(`${workflowType} - ${conversationId}`, options?.coordinationType || this.getCoordinationTypeForWorkflow(workflowType), participants, finalSteps, {
                description: `Workflow for conversation ${conversationId} of type ${workflowType}`,
                globalTimeout: options?.globalTimeout || 300000,
                errorHandling: options?.errorHandling || 'continue-on-error'
            });
            // Store workflow association
            conversation.sharedContext.workflowId = workflowId;
            // Emit workflow created event
            this.emit('conversationWorkflowCreated', {
                conversationId,
                workflowId,
                workflowType,
                participantCount: participants.length
            });
            logger.info('✅ Conversation workflow created', {
                conversationId,
                workflowId,
                workflowType
            });
            return workflowId;
        });
    }
    async executeConversationWorkflow(conversationId, priority) {
        return await expertErrorHandler.executeWithErrorHandling('executeConversationWorkflow', 'MultiAgentConversationManager', async () => {
            const conversation = this.conversations.get(conversationId);
            if (!conversation) {
                throw ExpertErrorUtils.createValidationError('MultiAgentConversationManager', 'executeConversationWorkflow', `Conversation not found: ${conversationId}`);
            }
            const workflowId = conversation.sharedContext.workflowId;
            if (!workflowId) {
                throw ExpertErrorUtils.createValidationError('MultiAgentConversationManager', 'executeConversationWorkflow', `No workflow associated with conversation: ${conversationId}`);
            }
            logger.info('🚀 Executing conversation workflow', {
                conversationId,
                workflowId,
                priority: priority || 'normal'
            });
            // Prepare initial context for workflow
            const initialContext = {
                conversationId,
                taskDescription: conversation.sharedContext.taskDescription,
                currentObjective: conversation.sharedContext.currentObjective,
                participantCount: conversation.participants.length,
                contextScope: conversation.contextScope,
                coordinationPattern: conversation.coordinationPattern
            };
            // Execute workflow
            const executionId = await workflowOrchestrator.executeWorkflow(workflowId, initialContext, {
                priority: priority || 'normal'
            });
            // Store execution ID
            conversation.sharedContext.executionId = executionId;
            // Update conversation state
            conversation.conversationState = 'active';
            conversation.lastActivity = new Date().toISOString();
            // Emit workflow execution started event
            this.emit('conversationWorkflowExecutionStarted', {
                conversationId,
                workflowId,
                executionId,
                priority: priority || 'normal'
            });
            logger.info('✅ Conversation workflow execution started', {
                conversationId,
                workflowId,
                executionId
            });
            return executionId;
        });
    }
    async getConversationWorkflowStatus(conversationId) {
        logger.info('📊 Getting conversation workflow status', { conversationId });
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return null;
        }
        const executionId = conversation.sharedContext.executionId;
        if (!executionId) {
            return {
                conversationId,
                workflowStatus: 'no-workflow',
                message: 'No workflow associated with this conversation'
            };
        }
        // Get workflow status from orchestrator
        const workflowStatus = await workflowOrchestrator.getWorkflowStatus(executionId);
        if (!workflowStatus) {
            return {
                conversationId,
                workflowStatus: 'execution-not-found',
                message: 'Workflow execution not found'
            };
        }
        // Combine conversation and workflow status
        const combinedStatus = {
            conversationId,
            conversationState: conversation.conversationState,
            workflowStatus: workflowStatus.status,
            workflowProgress: workflowStatus.progress,
            participantCount: conversation.participants.length,
            activeParticipants: conversation.participants.filter(p => p.status === 'active').length,
            messageCount: conversation.messageHistory.length,
            workflowMetrics: workflowStatus.metrics,
            coordinationPattern: conversation.coordinationPattern,
            contextSyncEnabled: conversation.contextSyncEnabled,
            lastActivity: conversation.lastActivity,
            healthStatus: {
                conversationHealth: this.calculateConversationHealth(conversation),
                workflowHealth: workflowStatus.healthStatus
            }
        };
        logger.info('✅ Conversation workflow status retrieved', {
            conversationId,
            workflowStatus: workflowStatus.status,
            progress: workflowStatus.progress.progressPercentage
        });
        return combinedStatus;
    }
    async pauseConversationWorkflow(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }
        const executionId = conversation.sharedContext.executionId;
        if (!executionId) {
            throw new Error(`No active workflow execution for conversation: ${conversationId}`);
        }
        await workflowOrchestrator.pauseWorkflow(executionId);
        // Update conversation state
        conversation.conversationState = 'paused';
        conversation.lastActivity = new Date().toISOString();
        this.emit('conversationWorkflowPaused', { conversationId, executionId });
        logger.info('⏸️ Conversation workflow paused', { conversationId, executionId });
    }
    async resumeConversationWorkflow(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }
        const executionId = conversation.sharedContext.executionId;
        if (!executionId) {
            throw new Error(`No workflow execution for conversation: ${conversationId}`);
        }
        await workflowOrchestrator.resumeWorkflow(executionId);
        // Update conversation state
        conversation.conversationState = 'active';
        conversation.lastActivity = new Date().toISOString();
        this.emit('conversationWorkflowResumed', { conversationId, executionId });
        logger.info('▶️ Conversation workflow resumed', { conversationId, executionId });
    }
    async resolveConversationConflict(conversationId, conflictData) {
        return await expertErrorHandler.executeWithErrorHandling('resolveConversationConflict', 'MultiAgentConversationManager', async () => {
            const conversation = this.conversations.get(conversationId);
            if (!conversation) {
                throw ExpertErrorUtils.createValidationError('MultiAgentConversationManager', 'resolveConversationConflict', `Conversation not found: ${conversationId}`);
            }
            logger.info('⚖️ Initiating conversation conflict resolution', {
                conversationId,
                conflictType: conflictData.conflictType,
                positionCount: conflictData.positions.length
            });
            // Prepare conflict resolution request
            const participants = conflictData.positions.map(pos => ({
                agentId: pos.agentId,
                role: 'decision-maker',
                expertise: [this.getAgentExpertise(pos.agentId, conversation)],
                weight: this.calculateAgentWeight(pos.agentId, conversation),
                position: {
                    positionId: `pos-${pos.agentId}-${Date.now()}`,
                    participantId: pos.agentId,
                    proposedValue: pos.position,
                    justification: pos.reasoning,
                    confidence: pos.confidence,
                    priority: 5, // Default priority
                    timestamp: new Date().toISOString()
                }
            }));
            const conflictId = `conflict-${conversationId}-${Date.now()}`;
            // Initiate conflict resolution
            const _resolutionRequest = await conflictResolver.initiateConflictResolution({
                requestId: `req-${conflictId}`,
                conversationId,
                conflictId,
                conflictType: conflictData.conflictType,
                participants,
                conflictData: {
                    description: `Conflict in conversation ${conversationId}`,
                    conflictingValues: conflictData.positions.map(p => p.position),
                    contextKey: 'conversation-decision',
                    severity: 'high',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        conversationId,
                        contextScope: conversation.contextScope,
                        coordinationPattern: conversation.coordinationPattern
                    }
                },
                resolutionCriteria: {
                    strategy: (conflictData.resolutionStrategy || 'consensus-building'),
                    timeoutMs: (conflictData.timeoutMinutes || 15) * 60 * 1000,
                    consensusThreshold: 0.75,
                    fallbackStrategy: 'majority-vote'
                }
            });
            // Store conflict ID in conversation context
            conversation.sharedContext.activeConflictId = conflictId;
            conversation.lastActivity = new Date().toISOString();
            // Emit conflict resolution started event
            this.emit('conversationConflictResolutionStarted', {
                conversationId,
                conflictId,
                conflictType: conflictData.conflictType,
                participantCount: participants.length
            });
            logger.info('✅ Conversation conflict resolution initiated', {
                conversationId,
                conflictId,
                participantCount: participants.length
            });
            return conflictId;
        });
    }
    // Private helper methods for workflow orchestration
    getWorkflowStepsForType(workflowType, conversation) {
        const baseSteps = [
            { stepType: 'conversation-init', priority: 'high', maxRetries: 2 }
        ];
        if (conversation.contextSyncEnabled) {
            baseSteps.push({ stepType: 'context-sync', priority: 'normal', maxRetries: 3 });
        }
        switch (workflowType) {
            case 'consensus-decision':
                return [
                    ...baseSteps,
                    { stepType: 'consensus-building', priority: 'critical', maxRetries: 5, dependencies: baseSteps.map(s => s.stepType) },
                    { stepType: 'decision-finalization', priority: 'high', maxRetries: 2, dependencies: ['consensus-building'] }
                ];
            case 'parallel-analysis':
                return [
                    ...baseSteps,
                    { stepType: 'custom', priority: 'normal', maxRetries: 3, dependencies: baseSteps.map(s => s.stepType), metadata: { analysisType: 'parallel' } },
                    { stepType: 'consensus-building', priority: 'high', maxRetries: 3, dependencies: ['custom'] },
                    { stepType: 'decision-finalization', priority: 'normal', maxRetries: 2, dependencies: ['consensus-building'] }
                ];
            case 'escalation-hierarchy':
                return [
                    ...baseSteps,
                    { stepType: 'conflict-resolution', priority: 'high', maxRetries: 3, dependencies: baseSteps.map(s => s.stepType) },
                    { stepType: 'custom', priority: 'critical', maxRetries: 2, dependencies: ['conflict-resolution'], metadata: { escalationType: 'hierarchy' } },
                    { stepType: 'decision-finalization', priority: 'high', maxRetries: 2, dependencies: ['custom'] }
                ];
            default:
                return [
                    ...baseSteps,
                    { stepType: 'custom', priority: 'normal', maxRetries: 3, dependencies: baseSteps.map(s => s.stepType) }
                ];
        }
    }
    getCoordinationTypeForWorkflow(workflowType) {
        switch (workflowType) {
            case 'consensus-decision': return 'sequential';
            case 'parallel-analysis': return 'hybrid';
            case 'escalation-hierarchy': return 'conditional';
            default: return 'sequential';
        }
    }
    getAgentExpertise(agentId, conversation) {
        const agent = conversation.participants.find(p => p.agentId === agentId);
        return agent?.expertType || 'general';
    }
    calculateAgentWeight(agentId, conversation) {
        const agent = conversation.participants.find(p => p.agentId === agentId);
        if (!agent)
            return 1.0;
        // Weight based on role and capabilities
        const roleWeights = {
            'primary': 1.5,
            'secondary': 1.2,
            'mediator': 1.3,
            'observer': 0.8
        };
        const baseWeight = roleWeights[agent.role] || 1.0;
        const capabilityBonus = agent.capabilities.length * 0.1;
        return Math.min(2.0, baseWeight + capabilityBonus);
    }
    calculateConversationHealth(conversation) {
        const activeParticipants = conversation.participants.filter(p => p.status === 'active').length;
        const totalParticipants = conversation.participants.length;
        const participationRate = activeParticipants / totalParticipants;
        const messageCount = conversation.messageHistory.length;
        const conversationAge = Date.now() - new Date(conversation.createdAt).getTime();
        const messageRate = messageCount / Math.max(1, conversationAge / 60000); // Messages per minute
        let healthScore = 100;
        const issues = [];
        if (participationRate < 0.7) {
            healthScore -= 30;
            issues.push('Low participant engagement');
        }
        if (messageRate < 0.5) {
            healthScore -= 20;
            issues.push('Low message activity');
        }
        if (conversation.conversationState === 'paused') {
            healthScore -= 15;
            issues.push('Conversation paused');
        }
        return {
            overallHealth: Math.max(0, healthScore),
            participationRate: participationRate * 100,
            messageRate,
            activeParticipants,
            totalParticipants,
            issues
        };
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
    // Real-time Coordination Monitoring Integration
    async startCoordinationMonitoring(conversationId) {
        return await expertErrorHandler.executeWithErrorHandling('startCoordinationMonitoring', 'MultiAgentConversationManager', async () => {
            const conversation = this.conversations.get(conversationId);
            if (!conversation) {
                throw ExpertErrorUtils.createValidationError('MultiAgentConversationManager', 'startCoordinationMonitoring', `Conversation ${conversationId} not found`);
            }
            logger.info('🎯 Starting conversation monitoring', {
                conversationId,
                participantCount: conversation.participants.length,
                contextScope: conversation.contextScope
            });
            await coordinationMonitor.startCoordinationMonitoring(conversationId, 'conversation', conversation.participants.length, {
                taskDescription: conversation.sharedContext.taskDescription,
                contextScope: conversation.contextScope,
                totalSteps: this.estimateConversationSteps(conversation)
            });
            // Set up conversation event handlers for monitoring
            this.setupMonitoringEventHandlers(conversationId);
            logger.info('✅ Conversation monitoring started', { conversationId });
        });
    }
    async updateConversationMonitoring(conversationId, updates) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation)
            return;
        const metrics = {
            completedSteps: updates.messageCount || conversation.messageHistory.length,
            latency: this.calculateAverageResponseTime(conversation),
            throughput: this.calculateConversationThroughput(conversation),
            qualityMetrics: {
                consensusRate: updates.consensusLevel || this.calculateConsensusLevel(conversation),
                successRate: this.calculateConversationSuccessRate(conversation)
            },
            resourceUtilization: {
                cpu: this.estimateConversationCPUUsage(conversation),
                memory: this.estimateConversationMemoryUsage(conversation),
                network: this.estimateConversationNetworkUsage(conversation)
            }
        };
        if (updates.conflictCount !== undefined) {
            metrics.errorCount = updates.conflictCount;
        }
        await coordinationMonitor.updateCoordinationMetrics(conversationId, metrics);
        logger.debug('📈 Conversation monitoring updated', {
            conversationId,
            messageCount: metrics.completedSteps,
            consensusRate: metrics.qualityMetrics.consensusRate
        });
    }
    async stopConversationMonitoring(conversationId, finalStatus) {
        logger.info('🏁 Stopping conversation monitoring', { conversationId, finalStatus });
        await coordinationMonitor.stopCoordinationMonitoring(conversationId, finalStatus);
        // Clean up event handlers
        this.cleanupMonitoringEventHandlers(conversationId);
        logger.info('✅ Conversation monitoring stopped', { conversationId });
    }
    async getConversationMonitoringMetrics(conversationId) {
        return await coordinationMonitor.getCoordinationMetrics(conversationId);
    }
    async getConversationHealthReport(conversationId) {
        const metrics = await coordinationMonitor.getCoordinationMetrics(conversationId);
        if (!metrics)
            return null;
        const conversation = this.conversations.get(conversationId);
        if (!conversation)
            return null;
        return {
            conversationId,
            overallHealth: this.calculateConversationHealth(conversation),
            monitoringMetrics: metrics,
            recommendations: this.generateConversationRecommendations(conversation, metrics)
        };
    }
    async createConversationAlert(metricType, threshold, severity) {
        const alertConfig = {
            alertId: `conversation-${metricType}-${Date.now()}`,
            metricType: metricType,
            threshold,
            comparison: 'greater-than',
            severity,
            enabled: true,
            cooldownPeriod: 300, // 5 minutes
            notificationChannels: ['log', 'event']
        };
        return await coordinationMonitor.createAlert(alertConfig);
    }
    async getSystemMonitoringDashboard() {
        const systemMetrics = await coordinationMonitor.getSystemMetrics();
        const conversationMetrics = await this.getSystemMetrics();
        const trends = await coordinationMonitor.getPerformanceTrends();
        return {
            dashboardId: 'system-overview',
            name: 'Multi-Agent Coordination System Overview',
            timestamp: new Date().toISOString(),
            sections: {
                systemHealth: {
                    coordinationMetrics: systemMetrics,
                    conversationMetrics,
                    overallHealth: this.calculateSystemHealth(systemMetrics, conversationMetrics)
                },
                performanceTrends: trends,
                activeAlerts: await coordinationMonitor.getActiveAlerts(),
                recommendations: this.generateSystemRecommendations(systemMetrics, conversationMetrics)
            }
        };
    }
    // Private monitoring helper methods
    setupMonitoringEventHandlers(conversationId) {
        // Listen for conversation events and update monitoring
        this.on('messageProcessed', async (data) => {
            if (data.conversationId === conversationId) {
                await this.updateConversationMonitoring(conversationId, {
                    messageCount: data.messageCount
                });
            }
        });
        this.on('consensusReached', async (data) => {
            if (data.conversationId === conversationId) {
                await this.updateConversationMonitoring(conversationId, {
                    consensusLevel: data.consensusLevel
                });
            }
        });
        this.on('conflictDetected', async (data) => {
            if (data.conversationId === conversationId) {
                await this.updateConversationMonitoring(conversationId, {
                    conflictCount: data.conflictCount
                });
            }
        });
    }
    cleanupMonitoringEventHandlers(conversationId) {
        // Remove specific event listeners for this conversation
        this.removeAllListeners(`messageProcessed:${conversationId}`);
        this.removeAllListeners(`consensusReached:${conversationId}`);
        this.removeAllListeners(`conflictDetected:${conversationId}`);
    }
    estimateConversationSteps(conversation) {
        // Estimate based on task complexity and participant count
        const baseSteps = 5; // Minimum steps for any conversation
        const participantSteps = conversation.participants.length * 2; // 2 steps per participant on average
        const complexityMultiplier = conversation.contextScope === 'system-wide' ? 2 : 1;
        return (baseSteps + participantSteps) * complexityMultiplier;
    }
    calculateAverageResponseTime(conversation) {
        if (conversation.messageHistory.length < 2)
            return 0;
        const responseTimes = [];
        for (let i = 1; i < conversation.messageHistory.length; i++) {
            const prevTime = new Date(conversation.messageHistory[i - 1].timestamp).getTime();
            const currTime = new Date(conversation.messageHistory[i].timestamp).getTime();
            responseTimes.push(currTime - prevTime);
        }
        return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
    calculateConversationThroughput(conversation) {
        const duration = Date.now() - new Date(conversation.createdAt).getTime();
        if (duration === 0)
            return 0;
        return (conversation.messageHistory.length / duration) * 1000 * 60; // Messages per minute
    }
    calculateConsensusLevel(conversation) {
        // Simplified consensus calculation based on message agreement patterns
        const agreementMessages = conversation.messageHistory.filter(m => m.content.text.toLowerCase().includes('agree') ||
            m.content.text.toLowerCase().includes('consensus') ||
            m.content.text.toLowerCase().includes('approved'));
        return conversation.messageHistory.length > 0
            ? (agreementMessages.length / conversation.messageHistory.length) * 100
            : 0;
    }
    calculateConversationSuccessRate(conversation) {
        // Success rate based on conversation state and completion criteria
        switch (conversation.conversationState) {
            case 'completed': return 100;
            case 'active': return 70; // Ongoing conversations get partial credit
            case 'paused': return 50;
            case 'failed': return 0;
            default: return 30;
        }
    }
    estimateConversationCPUUsage(conversation) {
        // Estimate CPU usage based on conversation activity
        const baseUsage = 10; // Base CPU usage for any conversation
        const participantUsage = conversation.participants.length * 5;
        const messageUsage = Math.min(conversation.messageHistory.length * 0.5, 30);
        return Math.min(100, baseUsage + participantUsage + messageUsage);
    }
    estimateConversationMemoryUsage(conversation) {
        // Estimate memory usage based on conversation data
        const baseMemory = 15; // Base memory for conversation structure
        const contextMemory = Object.keys(conversation.sharedContext).length * 2;
        const messageMemory = conversation.messageHistory.length * 1.5;
        return Math.min(100, baseMemory + contextMemory + messageMemory);
    }
    estimateConversationNetworkUsage(conversation) {
        // Estimate network usage based on communication patterns
        const recentMessages = conversation.messageHistory.filter(m => Date.now() - new Date(m.timestamp).getTime() < 300000 // Last 5 minutes
        );
        return Math.min(100, recentMessages.length * 8); // Rough network usage estimate
    }
    generateConversationRecommendations(conversation, metrics) {
        const recommendations = [];
        if (metrics.latency > 5000) {
            recommendations.push('Consider reducing response time requirements or adding more agents');
        }
        if (metrics.qualityMetrics?.consensusRate < 60) {
            recommendations.push('Improve consensus-building mechanisms or add a mediator agent');
        }
        if (conversation.participants.length > 8) {
            recommendations.push('Consider breaking down into smaller conversation groups');
        }
        if (metrics.resourceUtilization?.memory > 80) {
            recommendations.push('Optimize conversation context to reduce memory usage');
        }
        return recommendations;
    }
    calculateSystemHealth(systemMetrics, conversationMetrics) {
        const systemHealthScore = (systemMetrics.errorRate < 5 ? 25 : 0) +
            (systemMetrics.averageLatency < 3000 ? 25 : 0) +
            (systemMetrics.capacityMetrics.currentUtilization < 80 ? 25 : 0) +
            (conversationMetrics.conversations.completionRate > 70 ? 25 : 0);
        return systemHealthScore;
    }
    generateSystemRecommendations(systemMetrics, conversationMetrics) {
        const recommendations = [];
        if (systemMetrics.capacityMetrics.currentUtilization > 80) {
            recommendations.push('Consider scaling up system resources');
        }
        if (conversationMetrics.conversations.completionRate < 70) {
            recommendations.push('Review conversation workflows for bottlenecks');
        }
        if (systemMetrics.errorRate > 10) {
            recommendations.push('Investigate and fix recurring system errors');
        }
        if (systemMetrics.averageLatency > 5000) {
            recommendations.push('Optimize system performance and network latency');
        }
        return recommendations;
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
__decorate([
    performanceMonitored('workflow-creation', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "createConversationWorkflow", null);
__decorate([
    performanceMonitored('workflow-execution', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "executeConversationWorkflow", null);
__decorate([
    cached(expertCache, (conversationId) => `conversation-workflow-status:${conversationId}`, 30 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "getConversationWorkflowStatus", null);
__decorate([
    performanceMonitored('conversation-monitoring-start', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "startCoordinationMonitoring", null);
__decorate([
    performanceMonitored('conversation-monitoring-update', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "updateConversationMonitoring", null);
__decorate([
    performanceMonitored('conversation-monitoring-stop', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MultiAgentConversationManager.prototype, "stopConversationMonitoring", null);
// Export singleton instance
export const multiAgentConversationManager = new MultiAgentConversationManager();
//# sourceMappingURL=multi-agent-conversation-manager.js.map
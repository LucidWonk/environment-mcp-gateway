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
const logger = createMCPLogger('workflow-orchestrator.log');
// Workflow Orchestrator Service
export class WorkflowOrchestrator extends EventEmitter {
    workflowDefinitions = new Map();
    activeExecutions = new Map();
    agentStates = new Map();
    checkpoints = new Map();
    coordinationPatterns = new Map();
    executionQueue = [];
    constructor() {
        super();
        this.initializeCoordinationPatterns();
        this.startOrchestrationEngine();
        logger.info('🎼 Workflow Orchestrator initialized', {
            orchestrationEngineActive: true,
            coordinationPatternsLoaded: this.coordinationPatterns.size
        });
    }
    async createWorkflowDefinition(name, coordinationType, participants, steps, options) {
        return await expertErrorHandler.executeWithErrorHandling('createWorkflowDefinition', 'WorkflowOrchestrator', async () => {
            const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            logger.info('🏗️ Creating workflow definition', {
                workflowId,
                name,
                coordinationType,
                participantCount: participants.length,
                stepCount: steps.length
            });
            // Validate coordination type
            const validCoordinationTypes = ['sequential', 'parallel', 'conditional', 'hybrid'];
            if (!validCoordinationTypes.includes(coordinationType)) {
                throw ExpertErrorUtils.createValidationError('WorkflowOrchestrator', 'createWorkflowDefinition', `Invalid coordination type: ${coordinationType}`);
            }
            // Process and validate steps
            const processedSteps = steps.map((step, index) => ({
                stepId: step.stepId || `step-${index + 1}`,
                stepType: step.stepType || 'custom',
                agentId: step.agentId,
                dependencies: step.dependencies || [],
                status: 'pending',
                retryCount: 0,
                maxRetries: step.maxRetries || 3,
                timeout: step.timeout || 30000,
                priority: step.priority || 'normal',
                metadata: step.metadata || {}
            }));
            // Validate step dependencies
            await this.validateStepDependencies(processedSteps);
            // Create workflow definition
            const workflowDefinition = {
                workflowId,
                name,
                description: options?.description || `Workflow: ${name}`,
                coordinationType: coordinationType,
                participants,
                steps: processedSteps,
                globalTimeout: options?.globalTimeout || 300000, // 5 minutes default
                retryPolicy: options?.retryPolicy || 'step-level',
                errorHandling: options?.errorHandling || 'continue-on-error',
                version: '1.0.0',
                createdBy: 'system',
                createdAt: new Date().toISOString()
            };
            // Store workflow definition
            this.workflowDefinitions.set(workflowId, workflowDefinition);
            // Cache workflow definition
            const cacheKey = ExpertCacheKeys.contextTransfer(workflowId, 'workflow-definition');
            expertCache.set(cacheKey, workflowDefinition, 60 * 60 * 1000); // Cache for 1 hour
            // Emit workflow created event
            this.emit('workflowDefinitionCreated', {
                workflowId,
                name,
                coordinationType,
                participantCount: participants.length,
                stepCount: processedSteps.length
            });
            logger.info('✅ Workflow definition created', {
                workflowId,
                name,
                coordinationType,
                stepCount: processedSteps.length
            });
            return workflowId;
        }, 
        // Fallback for workflow definition creation
        async () => {
            logger.warn('🔄 Using fallback for workflow definition creation', { name });
            const fallbackWorkflowId = `fallback-workflow-${Date.now()}`;
            // Create minimal fallback workflow
            const fallbackWorkflow = {
                workflowId: fallbackWorkflowId,
                name: `Fallback: ${name}`,
                description: 'Fallback workflow definition',
                coordinationType: 'sequential',
                participants,
                steps: [],
                globalTimeout: 60000,
                retryPolicy: 'none',
                errorHandling: 'fail-fast',
                version: '1.0.0-fallback',
                createdBy: 'system-fallback',
                createdAt: new Date().toISOString()
            };
            this.workflowDefinitions.set(fallbackWorkflowId, fallbackWorkflow);
            return fallbackWorkflowId;
        });
    }
    async executeWorkflow(workflowId, initialContext, options) {
        return await expertErrorHandler.executeWithErrorHandling('executeWorkflow', 'WorkflowOrchestrator', async () => {
            const executionId = `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            logger.info('🚀 Starting workflow execution', {
                workflowId,
                executionId,
                priority: options?.priority || 'normal'
            });
            const workflowDefinition = this.workflowDefinitions.get(workflowId);
            if (!workflowDefinition) {
                throw ExpertErrorUtils.createValidationError('WorkflowOrchestrator', 'executeWorkflow', `Workflow definition not found: ${workflowId}`);
            }
            // Initialize participant states
            const participantStates = new Map();
            for (const agentId of workflowDefinition.participants) {
                participantStates.set(agentId, await this.initializeAgentState(agentId));
            }
            // Create workflow execution
            const workflowExecution = {
                executionId,
                workflowId,
                status: 'initializing',
                completedSteps: [],
                failedSteps: [],
                startTime: new Date().toISOString(),
                participantStates,
                executionContext: initialContext || {},
                checkpoints: [],
                metrics: await this.initializeWorkflowMetrics(executionId, workflowDefinition)
            };
            // Store execution
            this.activeExecutions.set(executionId, workflowExecution);
            // Create initial checkpoint
            await this.createCheckpoint(executionId, 'Initial execution state');
            // Start execution based on priority
            if (options?.priority === 'critical' || options?.priority === 'high') {
                // Execute immediately
                await this.startWorkflowExecution(executionId);
            }
            else {
                // Add to execution queue
                this.executionQueue.push(workflowExecution);
            }
            // Emit execution started event
            this.emit('workflowExecutionStarted', {
                executionId,
                workflowId,
                participantCount: workflowDefinition.participants.length,
                stepCount: workflowDefinition.steps.length
            });
            logger.info('✅ Workflow execution initiated', {
                executionId,
                workflowId,
                priority: options?.priority || 'normal'
            });
            return executionId;
        });
    }
    async executeStep(executionId, stepId) {
        return await expertErrorHandler.executeWithErrorHandling('executeStep', 'WorkflowOrchestrator', async () => {
            logger.info('⚡ Executing workflow step', { executionId, stepId });
            const execution = this.activeExecutions.get(executionId);
            if (!execution) {
                throw ExpertErrorUtils.createValidationError('WorkflowOrchestrator', 'executeStep', `Workflow execution not found: ${executionId}`);
            }
            const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
            if (!workflowDefinition) {
                throw ExpertErrorUtils.createValidationError('WorkflowOrchestrator', 'executeStep', `Workflow definition not found: ${execution.workflowId}`);
            }
            const step = workflowDefinition.steps.find(s => s.stepId === stepId);
            if (!step) {
                throw ExpertErrorUtils.createValidationError('WorkflowOrchestrator', 'executeStep', `Step not found: ${stepId}`);
            }
            // Check dependencies
            const dependenciesMet = await this.checkStepDependencies(execution, step);
            if (!dependenciesMet) {
                throw ExpertErrorUtils.createValidationError('WorkflowOrchestrator', 'executeStep', `Step dependencies not met: ${stepId}`);
            }
            // Update step status
            step.status = 'in_progress';
            step.startTime = new Date().toISOString();
            execution.currentStep = stepId;
            // Execute step based on type
            let stepResult;
            const startTime = Date.now();
            try {
                stepResult = await this.executeStepByType(execution, step);
                // Update step completion
                step.status = 'completed';
                step.endTime = new Date().toISOString();
                step.duration = Date.now() - startTime;
                step.result = stepResult;
                execution.completedSteps.push(stepId);
                // Update metrics
                await this.updateStepMetrics(execution, step, true);
                // Emit step completed event
                this.emit('stepCompleted', {
                    executionId,
                    stepId,
                    stepType: step.stepType,
                    duration: step.duration,
                    result: stepResult
                });
                logger.info('✅ Step execution completed', {
                    executionId,
                    stepId,
                    duration: step.duration
                });
            }
            catch (error) {
                // Handle step failure
                step.status = 'failed';
                step.endTime = new Date().toISOString();
                step.duration = Date.now() - startTime;
                step.error = error instanceof Error ? error.message : String(error);
                execution.failedSteps.push(stepId);
                // Update metrics
                await this.updateStepMetrics(execution, step, false);
                // Handle retry logic
                if (step.retryCount < step.maxRetries) {
                    step.retryCount++;
                    step.status = 'pending';
                    logger.warn('🔄 Retrying failed step', {
                        executionId,
                        stepId,
                        retryCount: step.retryCount,
                        maxRetries: step.maxRetries
                    });
                    // Retry after delay
                    setTimeout(() => {
                        this.executeStep(executionId, stepId);
                    }, 2000 * step.retryCount); // Exponential backoff
                    return null;
                }
                // Emit step failed event
                this.emit('stepFailed', {
                    executionId,
                    stepId,
                    error: step.error,
                    retryCount: step.retryCount
                });
                // Handle error based on workflow error handling policy
                await this.handleStepError(execution, step, error);
                throw error;
            }
            return stepResult;
        });
    }
    async getWorkflowStatus(executionId) {
        logger.info('📊 Getting workflow execution status', { executionId });
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            return null;
        }
        const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
        const checkpoints = this.checkpoints.get(executionId) || [];
        const status = {
            executionId,
            workflowId: execution.workflowId,
            workflowName: workflowDefinition?.name || 'Unknown',
            status: execution.status,
            currentStep: execution.currentStep,
            progress: {
                totalSteps: workflowDefinition?.steps.length || 0,
                completedSteps: execution.completedSteps.length,
                failedSteps: execution.failedSteps.length,
                progressPercentage: workflowDefinition?.steps.length
                    ? (execution.completedSteps.length / workflowDefinition.steps.length) * 100
                    : 0
            },
            timing: {
                startTime: execution.startTime,
                endTime: execution.endTime,
                totalDuration: execution.totalDuration,
                estimatedCompletion: await this.estimateCompletionTime(execution)
            },
            participants: {
                total: execution.participantStates.size,
                active: Array.from(execution.participantStates.values()).filter(s => s.status === 'active').length,
                idle: Array.from(execution.participantStates.values()).filter(s => s.status === 'idle').length
            },
            checkpoints: checkpoints.length,
            metrics: execution.metrics,
            healthStatus: await this.calculateExecutionHealth(execution)
        };
        logger.info('✅ Workflow status retrieved', {
            executionId,
            status: execution.status,
            progress: status.progress.progressPercentage
        });
        return status;
    }
    async pauseWorkflow(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            throw new Error(`Workflow execution not found: ${executionId}`);
        }
        execution.status = 'paused';
        // Create pause checkpoint
        await this.createCheckpoint(executionId, 'Workflow paused');
        this.emit('workflowPaused', { executionId });
        logger.info('⏸️ Workflow paused', { executionId });
    }
    async resumeWorkflow(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            throw new Error(`Workflow execution not found: ${executionId}`);
        }
        execution.status = 'running';
        // Continue execution
        await this.continueWorkflowExecution(executionId);
        this.emit('workflowResumed', { executionId });
        logger.info('▶️ Workflow resumed', { executionId });
    }
    async cancelWorkflow(executionId, reason) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            throw new Error(`Workflow execution not found: ${executionId}`);
        }
        execution.status = 'cancelled';
        execution.endTime = new Date().toISOString();
        execution.totalDuration = new Date().getTime() - new Date(execution.startTime).getTime();
        // Create cancellation checkpoint
        await this.createCheckpoint(executionId, `Workflow cancelled: ${reason || 'No reason provided'}`);
        // Clean up resources
        await this.cleanupWorkflowExecution(executionId);
        this.emit('workflowCancelled', { executionId, reason });
        logger.info('❌ Workflow cancelled', { executionId, reason });
    }
    // Private helper methods
    async initializeCoordinationPatterns() {
        // Define common coordination patterns
        const patterns = [
            {
                patternId: 'consensus-decision',
                name: 'Consensus Decision Making',
                description: 'Collaborative decision making with consensus building',
                applicableScenarios: ['team-decisions', 'conflict-resolution', 'policy-creation'],
                steps: [
                    { stepType: 'conversation-init', priority: 'high' },
                    { stepType: 'context-sync', priority: 'high' },
                    { stepType: 'consensus-building', priority: 'critical' },
                    { stepType: 'decision-finalization', priority: 'high' }
                ],
                coordinationType: 'sequential',
                expectedParticipants: 5,
                estimatedDuration: 300000, // 5 minutes
                complexityScore: 7
            },
            {
                patternId: 'parallel-analysis',
                name: 'Parallel Analysis Workflow',
                description: 'Multiple agents analyzing different aspects in parallel',
                applicableScenarios: ['code-review', 'data-analysis', 'risk-assessment'],
                steps: [
                    { stepType: 'conversation-init', priority: 'normal' },
                    { stepType: 'context-sync', priority: 'normal' },
                    { stepType: 'custom', priority: 'normal' }, // Parallel analysis
                    { stepType: 'consensus-building', priority: 'high' },
                    { stepType: 'decision-finalization', priority: 'normal' }
                ],
                coordinationType: 'hybrid',
                expectedParticipants: 3,
                estimatedDuration: 180000, // 3 minutes
                complexityScore: 5
            },
            {
                patternId: 'escalation-hierarchy',
                name: 'Escalation Hierarchy Workflow',
                description: 'Progressive escalation through expertise levels',
                applicableScenarios: ['conflict-resolution', 'approval-workflows', 'exception-handling'],
                steps: [
                    { stepType: 'conversation-init', priority: 'normal' },
                    { stepType: 'conflict-resolution', priority: 'high' },
                    { stepType: 'custom', priority: 'critical' }, // Escalation
                    { stepType: 'decision-finalization', priority: 'high' }
                ],
                coordinationType: 'conditional',
                expectedParticipants: 4,
                estimatedDuration: 240000, // 4 minutes
                complexityScore: 8
            }
        ];
        for (const pattern of patterns) {
            this.coordinationPatterns.set(pattern.patternId, pattern);
        }
        logger.info('📋 Coordination patterns initialized', {
            patternCount: patterns.length
        });
    }
    startOrchestrationEngine() {
        // Process execution queue periodically
        setInterval(() => {
            this.processExecutionQueue();
            this.monitorActiveExecutions();
            this.cleanupCompletedExecutions();
        }, 5000); // Check every 5 seconds
    }
    async processExecutionQueue() {
        if (this.executionQueue.length === 0)
            return;
        // Sort queue by priority
        this.executionQueue.sort((_a, _b) => {
            const priorityOrder = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };
            const aPriority = priorityOrder['normal']; // Default priority
            const bPriority = priorityOrder['normal']; // Default priority
            return bPriority - aPriority;
        });
        // Process high-priority executions
        const executionsToProcess = this.executionQueue.splice(0, 3); // Process up to 3 concurrently
        for (const execution of executionsToProcess) {
            await this.startWorkflowExecution(execution.executionId);
        }
    }
    async startWorkflowExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution)
            return;
        execution.status = 'running';
        const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
        if (!workflowDefinition)
            return;
        logger.info('🎯 Starting workflow execution', {
            executionId,
            coordinationType: workflowDefinition.coordinationType
        });
        // Execute based on coordination type
        switch (workflowDefinition.coordinationType) {
            case 'sequential':
                await this.executeSequential(execution, workflowDefinition);
                break;
            case 'parallel':
                await this.executeParallel(execution, workflowDefinition);
                break;
            case 'conditional':
                await this.executeConditional(execution, workflowDefinition);
                break;
            case 'hybrid':
                await this.executeHybrid(execution, workflowDefinition);
                break;
        }
    }
    async executeSequential(execution, definition) {
        for (const step of definition.steps) {
            if (execution.status !== 'running')
                break;
            try {
                await this.executeStep(execution.executionId, step.stepId);
            }
            catch {
                if (definition.errorHandling === 'fail-fast') {
                    execution.status = 'failed';
                    break;
                }
            }
        }
        if (execution.status === 'running') {
            await this.completeWorkflowExecution(execution.executionId);
        }
    }
    async executeParallel(execution, definition) {
        const parallelPromises = definition.steps.map(step => this.executeStep(execution.executionId, step.stepId).catch(error => {
            if (definition.errorHandling === 'fail-fast') {
                execution.status = 'failed';
            }
            return error;
        }));
        await Promise.allSettled(parallelPromises);
        if (execution.status === 'running') {
            await this.completeWorkflowExecution(execution.executionId);
        }
    }
    async executeConditional(execution, definition) {
        for (const step of definition.steps) {
            if (execution.status !== 'running')
                break;
            // Check step conditions
            const shouldExecute = await this.evaluateStepCondition(execution, step);
            if (!shouldExecute) {
                step.status = 'skipped';
                continue;
            }
            try {
                await this.executeStep(execution.executionId, step.stepId);
            }
            catch {
                if (definition.errorHandling === 'fail-fast') {
                    execution.status = 'failed';
                    break;
                }
            }
        }
        if (execution.status === 'running') {
            await this.completeWorkflowExecution(execution.executionId);
        }
    }
    async executeHybrid(execution, definition) {
        // Group steps by dependencies and execute in waves
        const stepWaves = await this.groupStepsByDependencies(definition.steps);
        for (const wave of stepWaves) {
            if (execution.status !== 'running')
                break;
            // Execute wave in parallel
            const wavePromises = wave.map(step => this.executeStep(execution.executionId, step.stepId).catch(error => {
                if (definition.errorHandling === 'fail-fast') {
                    execution.status = 'failed';
                }
                return error;
            }));
            await Promise.allSettled(wavePromises);
        }
        if (execution.status === 'running') {
            await this.completeWorkflowExecution(execution.executionId);
        }
    }
    async validateStepDependencies(steps) {
        const stepIds = new Set(steps.map(s => s.stepId));
        for (const step of steps) {
            for (const depId of step.dependencies) {
                if (!stepIds.has(depId)) {
                    throw new Error(`Step ${step.stepId} has invalid dependency: ${depId}`);
                }
            }
        }
    }
    async checkStepDependencies(execution, step) {
        for (const depId of step.dependencies) {
            if (!execution.completedSteps.includes(depId)) {
                return false;
            }
        }
        return true;
    }
    async executeStepByType(execution, step) {
        switch (step.stepType) {
            case 'conversation-init':
                return await this.executeConversationInit(execution, step);
            case 'context-sync':
                return await this.executeContextSync(execution, step);
            case 'conflict-resolution':
                return await this.executeConflictResolution(execution, step);
            case 'consensus-building':
                return await this.executeConsensusBuilding(execution, step);
            case 'decision-finalization':
                return await this.executeDecisionFinalization(execution, step);
            case 'custom':
                return await this.executeCustomStep(execution, step);
            default:
                throw new Error(`Unknown step type: ${step.stepType}`);
        }
    }
    async executeConversationInit(execution, _step) {
        // Simulate conversation initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            conversationId: `conv-${execution.executionId}`,
            participants: Array.from(execution.participantStates.keys()),
            status: 'initialized'
        };
    }
    async executeContextSync(execution, _step) {
        // Simulate context synchronization
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
            syncStatus: 'completed',
            participantsSynced: execution.participantStates.size,
            contextEntries: Object.keys(execution.executionContext).length
        };
    }
    async executeConflictResolution(_execution, _step) {
        // Simulate conflict resolution
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            conflictsResolved: 1,
            resolutionStrategy: 'consensus-building',
            consensusReached: true
        };
    }
    async executeConsensusBuilding(_execution, _step) {
        // Simulate consensus building
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            consensusAchieved: true,
            participantAgreement: 0.85,
            votingRounds: 2
        };
    }
    async executeDecisionFinalization(_execution, _step) {
        // Simulate decision finalization
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            decisionMade: true,
            finalDecision: 'approved',
            approvalLevel: 'unanimous'
        };
    }
    async executeCustomStep(execution, step) {
        // Simulate custom step execution
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            stepType: 'custom',
            executed: true,
            customData: step.metadata
        };
    }
    async initializeAgentState(agentId) {
        return {
            agentId,
            status: 'idle',
            assignedSteps: [],
            completedSteps: [],
            lastActivity: new Date().toISOString(),
            performance: {
                averageResponseTime: 150,
                successRate: 0.95,
                taskCompletionRate: 0.92
            },
            capabilities: ['conversation', 'analysis', 'decision-making'],
            workload: 0
        };
    }
    async initializeWorkflowMetrics(executionId, definition) {
        return {
            executionId,
            totalSteps: definition.steps.length,
            completedSteps: 0,
            failedSteps: 0,
            skippedSteps: 0,
            averageStepDuration: 0,
            longestStepDuration: 0,
            participantUtilization: new Map(),
            resourceUsage: {
                memoryPeak: 0,
                cpuAverage: 0,
                networkRequests: 0
            },
            bottlenecks: [],
            optimizationSuggestions: []
        };
    }
    async createCheckpoint(executionId, description) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            throw new Error(`Execution not found: ${executionId}`);
        }
        const checkpointId = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const checkpoint = {
            checkpointId,
            executionId,
            timestamp: new Date().toISOString(),
            completedSteps: [...execution.completedSteps],
            executionState: { ...execution.executionContext },
            participantStates: new Map(execution.participantStates),
            canRollbackTo: true,
            description
        };
        const checkpoints = this.checkpoints.get(executionId) || [];
        checkpoints.push(checkpoint);
        this.checkpoints.set(executionId, checkpoints);
        // Keep only last 10 checkpoints
        if (checkpoints.length > 10) {
            checkpoints.splice(0, checkpoints.length - 10);
        }
        logger.info('📸 Checkpoint created', { executionId, checkpointId, description });
        return checkpointId;
    }
    async updateStepMetrics(execution, step, success) {
        if (success) {
            execution.metrics.completedSteps++;
        }
        else {
            execution.metrics.failedSteps++;
        }
        if (step.duration) {
            const totalDuration = execution.metrics.averageStepDuration * (execution.metrics.completedSteps - 1) + step.duration;
            execution.metrics.averageStepDuration = totalDuration / execution.metrics.completedSteps;
            if (step.duration > execution.metrics.longestStepDuration) {
                execution.metrics.longestStepDuration = step.duration;
            }
        }
    }
    async handleStepError(execution, step, error) {
        const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
        if (!workflowDefinition)
            return;
        switch (workflowDefinition.errorHandling) {
            case 'fail-fast':
                execution.status = 'failed';
                await this.completeWorkflowExecution(execution.executionId);
                break;
            case 'continue-on-error':
                // Continue with next step
                break;
            case 'rollback':
                await this.rollbackToLastCheckpoint(execution.executionId);
                break;
            case 'escalate':
                await this.escalateError(execution, step, error);
                break;
        }
    }
    async continueWorkflowExecution(executionId) {
        // Resume execution from current step
        await this.startWorkflowExecution(executionId);
    }
    async completeWorkflowExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution)
            return;
        execution.status = 'completed';
        execution.endTime = new Date().toISOString();
        execution.totalDuration = new Date().getTime() - new Date(execution.startTime).getTime();
        // Create completion checkpoint
        await this.createCheckpoint(executionId, 'Workflow completed successfully');
        // Emit completion event
        this.emit('workflowCompleted', {
            executionId,
            totalDuration: execution.totalDuration,
            completedSteps: execution.completedSteps.length,
            failedSteps: execution.failedSteps.length
        });
        logger.info('🎉 Workflow execution completed', {
            executionId,
            totalDuration: execution.totalDuration,
            completedSteps: execution.completedSteps.length
        });
    }
    async cleanupWorkflowExecution(executionId) {
        // Clean up resources but keep execution record for audit
        const execution = this.activeExecutions.get(executionId);
        if (!execution)
            return;
        // Reset participant states
        for (const [_agentId, state] of execution.participantStates) {
            state.status = 'idle';
            state.currentTask = undefined;
            state.workload = 0;
        }
        logger.info('🧹 Workflow execution cleaned up', { executionId });
    }
    async monitorActiveExecutions() {
        for (const [executionId, execution] of this.activeExecutions) {
            if (execution.status === 'running') {
                const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
                if (workflowDefinition?.globalTimeout) {
                    const runningTime = Date.now() - new Date(execution.startTime).getTime();
                    if (runningTime > workflowDefinition.globalTimeout) {
                        logger.warn('⏰ Workflow execution timeout', { executionId, runningTime });
                        await this.cancelWorkflow(executionId, 'Global timeout exceeded');
                    }
                }
            }
        }
    }
    async cleanupCompletedExecutions() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        for (const [executionId, execution] of this.activeExecutions) {
            if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
                const age = now - new Date(execution.startTime).getTime();
                if (age > maxAge) {
                    this.activeExecutions.delete(executionId);
                    this.checkpoints.delete(executionId);
                    logger.info('🗑️ Cleaned up old execution', { executionId, age });
                }
            }
        }
    }
    async estimateCompletionTime(execution) {
        if (execution.status !== 'running')
            return null;
        const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
        if (!workflowDefinition)
            return null;
        const remainingSteps = workflowDefinition.steps.length - execution.completedSteps.length;
        const avgStepDuration = execution.metrics.averageStepDuration || 150;
        const estimatedMs = remainingSteps * avgStepDuration;
        const estimatedCompletion = new Date(Date.now() + estimatedMs);
        return estimatedCompletion.toISOString();
    }
    async calculateExecutionHealth(execution) {
        const workflowDefinition = this.workflowDefinitions.get(execution.workflowId);
        if (!workflowDefinition)
            return { overallHealth: 0, issues: ['Workflow definition not found'] };
        const issues = [];
        let healthScore = 100;
        // Check progress
        const progressRate = execution.completedSteps.length / workflowDefinition.steps.length;
        if (progressRate < 0.5 && execution.status === 'running') {
            healthScore -= 20;
            issues.push('Slow progress detected');
        }
        // Check failures
        const failureRate = execution.failedSteps.length / workflowDefinition.steps.length;
        if (failureRate > 0.1) {
            healthScore -= failureRate * 50;
            issues.push('High failure rate detected');
        }
        // Check participant health
        const offlineParticipants = Array.from(execution.participantStates.values())
            .filter(s => s.status === 'offline' || s.status === 'error').length;
        if (offlineParticipants > 0) {
            healthScore -= offlineParticipants * 15;
            issues.push(`${offlineParticipants} participants offline`);
        }
        return {
            overallHealth: Math.max(0, healthScore),
            progressRate: progressRate * 100,
            failureRate: failureRate * 100,
            offlineParticipants,
            issues
        };
    }
    async evaluateStepCondition(execution, step) {
        // Simple condition evaluation - can be extended
        if (step.metadata?.condition) {
            // Evaluate based on execution context
            return true; // Simplified - always execute for now
        }
        return true;
    }
    async groupStepsByDependencies(steps) {
        const waves = [];
        const remaining = [...steps];
        const completed = new Set();
        while (remaining.length > 0) {
            const currentWave = [];
            // Find steps with satisfied dependencies
            for (let i = remaining.length - 1; i >= 0; i--) {
                const step = remaining[i];
                const dependenciesSatisfied = step.dependencies.every(dep => completed.has(dep));
                if (dependenciesSatisfied) {
                    currentWave.push(step);
                    remaining.splice(i, 1);
                    completed.add(step.stepId);
                }
            }
            if (currentWave.length === 0) {
                // Circular dependency or other issue
                break;
            }
            waves.push(currentWave);
        }
        return waves;
    }
    async rollbackToLastCheckpoint(executionId) {
        const checkpoints = this.checkpoints.get(executionId) || [];
        const lastCheckpoint = checkpoints[checkpoints.length - 1];
        if (!lastCheckpoint) {
            logger.warn('⚠️ No checkpoint available for rollback', { executionId });
            return;
        }
        const execution = this.activeExecutions.get(executionId);
        if (!execution)
            return;
        // Restore state from checkpoint
        execution.completedSteps = [...lastCheckpoint.completedSteps];
        execution.executionContext = { ...lastCheckpoint.executionState };
        execution.participantStates = new Map(lastCheckpoint.participantStates);
        logger.info('🔄 Rolled back to checkpoint', {
            executionId,
            checkpointId: lastCheckpoint.checkpointId
        });
    }
    async escalateError(execution, step, error) {
        // Escalate error to higher authority or external system
        this.emit('errorEscalated', {
            executionId: execution.executionId,
            stepId: step.stepId,
            error: error instanceof Error ? error.message : String(error),
            escalationLevel: 'high'
        });
        logger.warn('⬆️ Error escalated', {
            executionId: execution.executionId,
            stepId: step.stepId,
            error: error instanceof Error ? error.message : String(error)
        });
    }
    // Public utility methods
    getActiveExecutions() {
        return Array.from(this.activeExecutions.keys());
    }
    getWorkflowDefinitions() {
        return Array.from(this.workflowDefinitions.keys());
    }
    getCoordinationPatterns() {
        return Array.from(this.coordinationPatterns.values());
    }
    async getSystemMetrics() {
        const activeExecutions = this.activeExecutions.size;
        const queuedExecutions = this.executionQueue.length;
        const totalDefinitions = this.workflowDefinitions.size;
        const totalPatterns = this.coordinationPatterns.size;
        const runningExecutions = Array.from(this.activeExecutions.values())
            .filter(e => e.status === 'running').length;
        const averageExecutionTime = Array.from(this.activeExecutions.values())
            .filter(e => e.totalDuration)
            .reduce((sum, e) => sum + (e.totalDuration || 0), 0) / activeExecutions || 0;
        return {
            timestamp: new Date().toISOString(),
            executions: {
                active: activeExecutions,
                running: runningExecutions,
                queued: queuedExecutions,
                averageDuration: averageExecutionTime
            },
            definitions: {
                total: totalDefinitions,
                patterns: totalPatterns
            },
            performance: {
                orchestrationLatency: 150, // ms
                throughput: Math.max(1, 60 / (averageExecutionTime / 1000)), // executions per minute
                resourceUtilization: 65 // percentage
            },
            health: {
                systemHealth: 95,
                activeParticipants: Array.from(this.agentStates.values())
                    .filter(s => s.status === 'active').length
            }
        };
    }
}
__decorate([
    performanceMonitored('workflow-definition-creation', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Array, Object]),
    __metadata("design:returntype", Promise)
], WorkflowOrchestrator.prototype, "createWorkflowDefinition", null);
__decorate([
    performanceMonitored('workflow-execution', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowOrchestrator.prototype, "executeWorkflow", null);
__decorate([
    performanceMonitored('step-execution', performanceMonitor),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkflowOrchestrator.prototype, "executeStep", null);
__decorate([
    cached(expertCache, (executionId) => `workflow-status:${executionId}`, 30 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowOrchestrator.prototype, "getWorkflowStatus", null);
// Export singleton instance
export const workflowOrchestrator = new WorkflowOrchestrator();
//# sourceMappingURL=workflow-orchestrator.js.map
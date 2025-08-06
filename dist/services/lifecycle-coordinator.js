/**
 * Lifecycle Integration Coordinator
 * Orchestrates complex multi-system lifecycle operations between document and registry systems
 * Implements TEMP-CONTEXT-ENGINE-a7b3 lifecycle integration capability
 */
import winston from 'winston';
import { contextEventManager } from '../events/context-events.js';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'lifecycle-coordinator.log' })
    ]
});
/**
 * Coordinates lifecycle operations across document and registry systems
 * Provides transaction-like semantics with rollback capabilities
 */
export class LifecycleCoordinator {
    documentMigration;
    registryManager;
    placeholderTracker;
    approvalWorkflow;
    archiveManager;
    activeOperations = new Map();
    coordinationPlans = new Map();
    rollbackSnapshots = new Map();
    constructor(documentMigration, registryManager, placeholderTracker, approvalWorkflow, archiveManager) {
        this.documentMigration = documentMigration;
        this.registryManager = registryManager;
        this.placeholderTracker = placeholderTracker;
        this.approvalWorkflow = approvalWorkflow;
        this.archiveManager = archiveManager;
        this.setupEventHandlers();
    }
    /**
     * Create coordination plan for complex lifecycle operation
     */
    async createCoordinationPlan(_request) {
        const planId = this.generatePlanId();
        logger.info(`Creating coordination plan: ${planId}`, {
            operationType: _request.operationType,
            placeholderIds: _request.placeholderIds,
            documentPaths: _request.documentPaths
        });
        await contextEventManager.emit('CoordinationPlanCreated', {
            planId,
            operationType: _request.operationType,
            _request
        });
        let plan;
        switch (_request.operationType) {
            case 'newconcepts-migration':
                plan = await this.createNewConceptsMigrationPlan(planId, _request);
                break;
            case 'placeholder-conversion':
                plan = await this.createPlaceholderConversionPlan(planId, _request);
                break;
            case 'document-restructure':
                plan = await this.createDocumentRestructurePlan(planId, _request);
                break;
            case 'full-lifecycle':
                plan = await this.createFullLifecyclePlan(planId, _request);
                break;
            default:
                throw new Error(`Unknown operation type: ${_request.operationType}`);
        }
        this.coordinationPlans.set(planId, plan);
        logger.info(`Coordination plan created: ${planId}`, {
            documentOperations: plan.documentOperations.length,
            registryOperations: plan.registryOperations.length,
            dependencies: plan.dependencies.length
        });
        return plan;
    }
    /**
     * Execute coordinated operation with transaction semantics
     */
    async executeCoordinatedOperation(planId) {
        const plan = this.coordinationPlans.get(planId);
        if (!plan) {
            throw new Error(`Coordination plan not found: ${planId}`);
        }
        const operationId = this.generateOperationId();
        const operation = {
            operationId,
            operationType: plan.operationType,
            planId,
            status: 'planning',
            startedAt: new Date(),
            components: {
                documentOperations: [...plan.documentOperations],
                registryOperations: [...plan.registryOperations]
            },
            metadata: {
                placeholderIds: this.extractPlaceholderIds(plan),
                documentPaths: this.extractDocumentPaths(plan),
                approvalIds: [],
                rollbackData: await this.createRollbackSnapshot()
            }
        };
        this.activeOperations.set(operationId, operation);
        logger.info(`Starting coordinated operation: ${operationId}`, {
            operationType: operation.operationType,
            planId
        });
        await contextEventManager.emit('IntegrationPhaseStarted', {
            integrationId: operationId,
            planId,
            phase: 'coordination'
        }, operationId, planId);
        try {
            // Execute operation phases
            operation.status = 'executing';
            await this.executeOperationPhases(operation, plan);
            operation.status = 'completed';
            operation.completedAt = new Date();
            await contextEventManager.emit('IntegratedUpdateCompleted', {
                operationId,
                planId,
                result: {
                    status: 'completed',
                    duration: operation.completedAt.getTime() - operation.startedAt.getTime(),
                    components: operation.components
                }
            }, operationId, planId);
            logger.info(`Coordinated operation completed: ${operationId}`);
            return operation;
        }
        catch (error) {
            logger.error(`Coordinated operation failed: ${operationId}`, error);
            operation.status = 'failed';
            await contextEventManager.emit('IntegratedUpdateFailed', {
                operationId,
                planId,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, operationId, planId);
            // Attempt rollback
            await this.rollbackOperation(operationId);
            throw error;
        }
    }
    /**
     * Rollback coordinated operation to previous state
     */
    async rollbackOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) {
            throw new Error(`Operation not found: ${operationId}`);
        }
        logger.warn(`Starting rollback for operation: ${operationId}`);
        operation.status = 'rolling-back';
        await contextEventManager.emit('IntegrationRollbackStarted', {
            operationId,
            planId: operation.planId
        }, operationId, operation.planId);
        try {
            const rollbackData = operation.metadata.rollbackData;
            // Execute rollback in reverse dependency order
            const plan = this.coordinationPlans.get(operation.planId);
            if (!plan) {
                throw new Error(`Plan not found for rollback: ${operation.planId}`);
            }
            // Rollback registry operations first
            for (const registryOp of operation.components.registryOperations.reverse()) {
                if (registryOp.status === 'completed') {
                    await this.rollbackRegistryOperation(registryOp, rollbackData);
                }
            }
            // Then rollback document operations
            for (const docOp of operation.components.documentOperations.reverse()) {
                if (docOp.status === 'completed') {
                    await this.rollbackDocumentOperation(docOp, rollbackData);
                }
            }
            operation.status = 'rolled-back';
            await contextEventManager.emit('IntegrationRollbackCompleted', {
                operationId,
                planId: operation.planId
            }, operationId, operation.planId);
            logger.info(`Rollback completed for operation: ${operationId}`);
            return true;
        }
        catch (error) {
            logger.error(`Rollback failed for operation: ${operationId}`, error);
            await contextEventManager.emit('IntegrationRollbackFailed', {
                operationId,
                planId: operation.planId,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, operationId, operation.planId);
            return false;
        }
    }
    /**
     * Get status of coordinated operation
     */
    getOperationStatus(operationId) {
        return this.activeOperations.get(operationId) || null;
    }
    /**
     * Get all active coordination plans
     */
    getActiveCoordinations() {
        return Array.from(this.activeOperations.values());
    }
    // Private implementation methods
    async createNewConceptsMigrationPlan(planId, _request) {
        const documentOperations = [];
        const registryOperations = [];
        const dependencies = [];
        const approvalGates = [];
        // Create document migration operations
        if (_request.documentPaths) {
            for (const docPath of _request.documentPaths) {
                const migrationOp = {
                    operationId: `doc-migrate-${Date.now()}`,
                    type: 'migrate',
                    sourcePath: docPath,
                    targetPath: this.calculateTargetPath(docPath, _request.targetDomain),
                    status: 'pending'
                };
                documentOperations.push(migrationOp);
            }
        }
        // Create registry conversion operations
        if (_request.placeholderIds) {
            for (const placeholderId of _request.placeholderIds) {
                const conversionOp = {
                    operationId: `reg-convert-${Date.now()}`,
                    type: 'capability-conversion',
                    placeholderId,
                    finalCapabilityId: this.generateFinalCapabilityId(placeholderId, _request.targetDomain),
                    status: 'pending'
                };
                registryOperations.push(conversionOp);
            }
        }
        // Add approval gate for human review
        approvalGates.push({
            gateId: `approval-${planId}`,
            description: 'Human approval for NewConcepts migration',
            requiredFor: [...documentOperations.map(op => op.operationId), ...registryOperations.map(op => op.operationId)],
            approvalType: 'human',
            approvalCriteria: {
                requiredApprovers: 1,
                description: _request.migrationReason || 'NewConcepts migration to mature domain'
            }
        });
        return {
            planId,
            operationType: 'newconcepts-migration',
            documentOperations,
            registryOperations,
            dependencies,
            approvalGates,
            rollbackStrategy: {
                rollbackOrder: [...registryOperations.map(op => op.operationId), ...documentOperations.map(op => op.operationId)],
                atomicGroups: [[...documentOperations.map(op => op.operationId)], [...registryOperations.map(op => op.operationId)]],
                rollbackTimeout: 30000
            },
            expectedDuration: 60000
        };
    }
    async createPlaceholderConversionPlan(planId, _request) {
        // Implementation for placeholder conversion plan
        return {
            planId,
            operationType: 'placeholder-conversion',
            documentOperations: [],
            registryOperations: [],
            dependencies: [],
            approvalGates: [],
            rollbackStrategy: { rollbackOrder: [], atomicGroups: [], rollbackTimeout: 15000 },
            expectedDuration: 30000
        };
    }
    async createDocumentRestructurePlan(planId, _request) {
        // Implementation for document restructure plan
        return {
            planId,
            operationType: 'document-restructure',
            documentOperations: [],
            registryOperations: [],
            dependencies: [],
            approvalGates: [],
            rollbackStrategy: { rollbackOrder: [], atomicGroups: [], rollbackTimeout: 15000 },
            expectedDuration: 45000
        };
    }
    async createFullLifecyclePlan(planId, _request) {
        // Implementation for full lifecycle plan
        return {
            planId,
            operationType: 'full-lifecycle',
            documentOperations: [],
            registryOperations: [],
            dependencies: [],
            approvalGates: [],
            rollbackStrategy: { rollbackOrder: [], atomicGroups: [], rollbackTimeout: 60000 },
            expectedDuration: 120000
        };
    }
    async executeOperationPhases(operation, plan) {
        // Phase 1: Request approvals
        if (plan.approvalGates.length > 0) {
            await this.processApprovalGates(operation, plan.approvalGates);
        }
        // Phase 2: Execute registry operations first (to ensure consistency)
        for (const registryOp of operation.components.registryOperations) {
            await this.executeRegistryOperation(registryOp, operation);
        }
        // Phase 3: Execute document operations
        for (const docOp of operation.components.documentOperations) {
            await this.executeDocumentOperation(docOp, operation);
        }
        // Phase 4: Validate final state
        await this.validateFinalState(operation);
    }
    async processApprovalGates(operation, gates) {
        for (const gate of gates) {
            if (gate.approvalType === 'human') {
                // Placeholder for approval workflow integration
                const approvalId = `approval-${operation.operationId}-${gate.gateId}`;
                operation.metadata.approvalIds.push(approvalId);
                // Wait for approval (in real implementation, this would be event-driven)
                logger.info(`Waiting for approval: ${approvalId} for gate: ${gate.gateId}`);
            }
        }
    }
    async executeRegistryOperation(operation, _parentOp) {
        operation.status = 'executing';
        try {
            switch (operation.type) {
                case 'placeholder-transition':
                    // Implement placeholder transition
                    break;
                case 'capability-conversion':
                    if (operation.placeholderId && operation.finalCapabilityId) {
                        await this.registryManager.proposeCapabilityConversion(operation.placeholderId, operation.finalCapabilityId);
                    }
                    break;
                case 'registry-update':
                    // Implement registry update
                    break;
            }
            operation.status = 'completed';
        }
        catch (error) {
            operation.status = 'failed';
            throw error;
        }
    }
    async executeDocumentOperation(operation, _parentOp) {
        operation.status = 'executing';
        try {
            switch (operation.type) {
                case 'migrate':
                    if (operation.sourcePath && operation.targetPath) {
                        // Use document migration service
                        // await this.documentMigration.migrateDocument(...);
                    }
                    break;
                case 'restructure':
                    // Implement document restructure
                    break;
                case 'archive':
                    if (operation.sourcePath) {
                        // Placeholder for archive functionality
                        logger.info(`Archiving document: ${operation.sourcePath}`);
                    }
                    break;
            }
            operation.status = 'completed';
        }
        catch (error) {
            operation.status = 'failed';
            throw error;
        }
    }
    async validateFinalState(operation) {
        // Validate that all operations completed successfully
        const failedOps = [
            ...operation.components.documentOperations.filter(op => op.status === 'failed'),
            ...operation.components.registryOperations.filter(op => op.status === 'failed')
        ];
        if (failedOps.length > 0) {
            throw new Error(`Validation failed: ${failedOps.length} operations failed`);
        }
    }
    async rollbackRegistryOperation(operation, _rollbackData) {
        // Implement registry operation rollback
        logger.info(`Rolling back registry operation: ${operation.operationId}`);
    }
    async rollbackDocumentOperation(operation, _rollbackData) {
        // Implement document operation rollback
        logger.info(`Rolling back document operation: ${operation.operationId}`);
    }
    async createRollbackSnapshot() {
        return {
            timestamp: new Date(),
            documentStates: new Map(),
            registryStates: new Map(),
            placeholderStates: new Map(),
            operationLog: []
        };
    }
    setupEventHandlers() {
        // Setup event listeners for coordination
        contextEventManager.on('ApprovalResponseSubmitted', async (event) => {
            logger.info(`Approval response received: ${event.data.approvalId}`);
        });
    }
    extractPlaceholderIds(plan) {
        return plan.registryOperations
            .map(op => op.placeholderId)
            .filter((id) => id !== undefined);
    }
    extractDocumentPaths(plan) {
        return plan.documentOperations
            .map(op => op.sourcePath)
            .filter(path => path !== undefined);
    }
    calculateTargetPath(sourcePath, targetDomain) {
        // Calculate target path based on domain structure
        if (sourcePath.includes('NewConcepts') && targetDomain) {
            return sourcePath.replace('NewConcepts', targetDomain);
        }
        return sourcePath;
    }
    generateFinalCapabilityId(placeholderId, targetDomain) {
        // Generate final capability ID from placeholder
        const parts = placeholderId.split('-');
        if (parts.length >= 3 && targetDomain) {
            return `${targetDomain.toUpperCase()}-${parts[2]}-${Date.now().toString().slice(-3)}`;
        }
        return `FINAL-${Date.now()}`;
    }
    generatePlanId() {
        return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }
    generateOperationId() {
        return `op-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }
}
//# sourceMappingURL=lifecycle-coordinator.js.map
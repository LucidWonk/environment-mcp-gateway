/**
 * Lifecycle Integration Coordinator
 * Orchestrates complex multi-system lifecycle operations between document and registry systems
 * Implements TEMP-CONTEXT-ENGINE-a7b3 lifecycle integration capability
 */
import { DocumentMigrationService } from './document-migration.js';
import { RegistryManager } from './registry-manager.js';
import { PlaceholderTracker } from './placeholder-tracker.js';
import { ApprovalWorkflowManager } from './approval-workflow.js';
import { ArchiveManager } from './archive-manager.js';
export interface CoordinatedOperation {
    operationId: string;
    operationType: 'newconcepts-migration' | 'placeholder-conversion' | 'document-restructure' | 'full-lifecycle';
    planId: string;
    status: 'planning' | 'executing' | 'completed' | 'failed' | 'rolling-back' | 'rolled-back';
    startedAt: Date;
    completedAt?: Date;
    components: {
        documentOperations: DocumentOperation[];
        registryOperations: RegistryOperation[];
    };
    metadata: {
        placeholderIds: string[];
        documentPaths: string[];
        approvalIds: string[];
        rollbackData: RollbackSnapshot;
    };
}
export interface DocumentOperation {
    operationId: string;
    type: 'migrate' | 'restructure' | 'archive' | 'validate';
    sourcePath: string;
    targetPath?: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    rollbackInfo?: any;
}
export interface RegistryOperation {
    operationId: string;
    type: 'placeholder-transition' | 'capability-conversion' | 'registry-update' | 'validate';
    placeholderId?: string;
    finalCapabilityId?: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    rollbackInfo?: any;
}
export interface RollbackSnapshot {
    timestamp: Date;
    documentStates: Map<string, any>;
    registryStates: Map<string, any>;
    placeholderStates: Map<string, any>;
    operationLog: OperationLogEntry[];
}
export interface OperationLogEntry {
    timestamp: Date;
    component: 'document' | 'registry' | 'coordinator';
    operation: string;
    details: any;
    rollbackAction?: string;
}
export interface CoordinationPlan {
    planId: string;
    operationType: CoordinatedOperation['operationType'];
    documentOperations: DocumentOperation[];
    registryOperations: RegistryOperation[];
    dependencies: OperationDependency[];
    approvalGates: ApprovalGate[];
    rollbackStrategy: RollbackStrategy;
    expectedDuration: number;
}
export interface OperationDependency {
    dependentOperationId: string;
    prerequisiteOperationId: string;
    dependencyType: 'completion' | 'approval' | 'validation';
}
export interface ApprovalGate {
    gateId: string;
    description: string;
    requiredFor: string[];
    approvalType: 'human' | 'automated';
    approvalCriteria: any;
}
export interface RollbackStrategy {
    rollbackOrder: string[];
    atomicGroups: string[][];
    rollbackTimeout: number;
}
/**
 * Coordinates lifecycle operations across document and registry systems
 * Provides transaction-like semantics with rollback capabilities
 */
export declare class LifecycleCoordinator {
    private documentMigration;
    private registryManager;
    private placeholderTracker;
    private approvalWorkflow;
    private archiveManager;
    private activeOperations;
    private coordinationPlans;
    private rollbackSnapshots;
    constructor(documentMigration: DocumentMigrationService, registryManager: RegistryManager, placeholderTracker: PlaceholderTracker, approvalWorkflow: ApprovalWorkflowManager, archiveManager: ArchiveManager);
    /**
     * Create coordination plan for complex lifecycle operation
     */
    createCoordinationPlan(_request: {
        operationType: CoordinatedOperation['operationType'];
        placeholderIds?: string[];
        documentPaths?: string[];
        targetDomain?: string;
        migrationReason?: string;
    }): Promise<CoordinationPlan>;
    /**
     * Execute coordinated operation with transaction semantics
     */
    executeCoordinatedOperation(planId: string): Promise<CoordinatedOperation>;
    /**
     * Rollback coordinated operation to previous state
     */
    rollbackOperation(operationId: string): Promise<boolean>;
    /**
     * Get status of coordinated operation
     */
    getOperationStatus(operationId: string): CoordinatedOperation | null;
    /**
     * Get all active coordination plans
     */
    getActiveCoordinations(): CoordinatedOperation[];
    private createNewConceptsMigrationPlan;
    private createPlaceholderConversionPlan;
    private createDocumentRestructurePlan;
    private createFullLifecyclePlan;
    private executeOperationPhases;
    private processApprovalGates;
    private executeRegistryOperation;
    private executeDocumentOperation;
    private validateFinalState;
    private rollbackRegistryOperation;
    private rollbackDocumentOperation;
    private createRollbackSnapshot;
    private setupEventHandlers;
    private extractPlaceholderIds;
    private extractDocumentPaths;
    private calculateTargetPath;
    private generateFinalCapabilityId;
    private generatePlanId;
    private generateOperationId;
}
//# sourceMappingURL=lifecycle-coordinator.d.ts.map
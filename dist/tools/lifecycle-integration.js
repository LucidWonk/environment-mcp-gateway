/**
 * Lifecycle Integration MCP Tools
 * MCP tools for coordinated lifecycle operations between document and registry systems
 * Implements TEMP-CONTEXT-ENGINE-a7b3 lifecycle integration capability
 */
import { LifecycleCoordinator } from '../services/lifecycle-coordinator.js';
import { NewConceptsMigrationOrchestrator } from '../workflows/newconcepts-migration.js';
import { DocumentMigrationService } from '../services/document-migration.js';
import { RegistryManager } from '../services/registry-manager.js';
import { PlaceholderTracker } from '../services/placeholder-tracker.js';
import { ApprovalWorkflowManager } from '../services/approval-workflow.js';
import { ArchiveManager } from '../services/archive-manager.js';
// import { contextEventManager } from '../events/context-events.js';
import path from 'path';
// Initialize services
const projectRoot = process.cwd();
const documentMigration = new DocumentMigrationService(projectRoot);
const registryManager = new RegistryManager(path.join(projectRoot, 'capability-registry.json'));
const placeholderTracker = new PlaceholderTracker(path.join(projectRoot, 'placeholder-tracker.json'));
const approvalWorkflow = new ApprovalWorkflowManager();
const archiveManager = new ArchiveManager(path.join(projectRoot, 'archive'));
const lifecycleCoordinator = new LifecycleCoordinator(documentMigration, registryManager, placeholderTracker, approvalWorkflow, archiveManager);
const newConceptsMigration = new NewConceptsMigrationOrchestrator(lifecycleCoordinator, placeholderTracker, projectRoot);
/**
 * Create coordination plan for lifecycle operation
 */
export const createLifecycleCoordinationPlan = {
    name: 'create-lifecycle-coordination-plan',
    description: 'Create coordination plan for complex lifecycle operation across document and registry systems',
    inputSchema: {
        type: 'object',
        properties: {
            operationType: {
                type: 'string',
                enum: ['newconcepts-migration', 'placeholder-conversion', 'document-restructure', 'full-lifecycle'],
                description: 'Type of lifecycle operation to coordinate'
            },
            placeholderIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Placeholder IDs involved in the operation'
            },
            documentPaths: {
                type: 'array',
                items: { type: 'string' },
                description: 'Document paths involved in the operation'
            },
            targetDomain: {
                type: 'string',
                description: 'Target domain for migration (e.g., Analysis, Data, Messaging)'
            },
            migrationReason: {
                type: 'string',
                description: 'Reason for the migration or operation'
            }
        },
        required: ['operationType']
    }
};
export async function handleCreateLifecycleCoordinationPlan(args) {
    try {
        const { operationType, placeholderIds = [], documentPaths = [], targetDomain, migrationReason } = args;
        const plan = await lifecycleCoordinator.createCoordinationPlan({
            operationType,
            placeholderIds,
            documentPaths,
            targetDomain,
            migrationReason
        });
        return {
            success: true,
            plan: {
                planId: plan.planId,
                operationType: plan.operationType,
                documentOperations: plan.documentOperations.length,
                registryOperations: plan.registryOperations.length,
                dependencies: plan.dependencies.length,
                approvalGates: plan.approvalGates.length,
                expectedDuration: plan.expectedDuration,
                rollbackStrategy: {
                    rollbackOrder: plan.rollbackStrategy.rollbackOrder.length,
                    atomicGroups: plan.rollbackStrategy.atomicGroups.length,
                    rollbackTimeout: plan.rollbackStrategy.rollbackTimeout
                }
            },
            nextSteps: [
                'Review the coordination plan details',
                'Execute the coordinated operation using execute-coordinated-operation',
                'Monitor operation progress using get-coordination-status'
            ]
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            operationType: args.operationType
        };
    }
}
/**
 * Execute coordinated lifecycle operation
 */
export const executeCoordinatedOperation = {
    name: 'execute-coordinated-operation',
    description: 'Execute coordinated lifecycle operation with transaction semantics and rollback capability',
    inputSchema: {
        type: 'object',
        properties: {
            planId: {
                type: 'string',
                description: 'Coordination plan ID to execute'
            }
        },
        required: ['planId']
    }
};
export async function handleExecuteCoordinatedOperation(args) {
    try {
        const { planId } = args;
        const operation = await lifecycleCoordinator.executeCoordinatedOperation(planId);
        return {
            success: true,
            operation: {
                operationId: operation.operationId,
                operationType: operation.operationType,
                planId: operation.planId,
                status: operation.status,
                startedAt: operation.startedAt,
                completedAt: operation.completedAt,
                components: {
                    documentOperations: operation.components.documentOperations.map(op => ({
                        operationId: op.operationId,
                        type: op.type,
                        status: op.status,
                        sourcePath: op.sourcePath,
                        targetPath: op.targetPath
                    })),
                    registryOperations: operation.components.registryOperations.map(op => ({
                        operationId: op.operationId,
                        type: op.type,
                        status: op.status,
                        placeholderId: op.placeholderId,
                        finalCapabilityId: op.finalCapabilityId
                    }))
                },
                metadata: {
                    placeholderIds: operation.metadata.placeholderIds,
                    documentPaths: operation.metadata.documentPaths,
                    approvalIds: operation.metadata.approvalIds
                }
            },
            result: operation.status === 'completed' ?
                'Coordinated operation completed successfully' :
                'Coordinated operation in progress'
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            planId: args.planId
        };
    }
}
/**
 * Get coordination operation status
 */
export const getCoordinationStatus = {
    name: 'get-coordination-status',
    description: 'Get status of coordinated lifecycle operation',
    inputSchema: {
        type: 'object',
        properties: {
            operationId: {
                type: 'string',
                description: 'Operation ID to get status for'
            }
        },
        required: ['operationId']
    }
};
export async function handleGetCoordinationStatus(args) {
    try {
        const { operationId } = args;
        const operation = lifecycleCoordinator.getOperationStatus(operationId);
        if (!operation) {
            return {
                success: false,
                error: 'Operation not found',
                operationId
            };
        }
        const duration = operation.completedAt
            ? operation.completedAt.getTime() - operation.startedAt.getTime()
            : Date.now() - operation.startedAt.getTime();
        return {
            success: true,
            operation: {
                operationId: operation.operationId,
                operationType: operation.operationType,
                planId: operation.planId,
                status: operation.status,
                startedAt: operation.startedAt,
                completedAt: operation.completedAt,
                duration,
                progress: {
                    documentOperationsCompleted: operation.components.documentOperations.filter(op => op.status === 'completed').length,
                    documentOperationsTotal: operation.components.documentOperations.length,
                    registryOperationsCompleted: operation.components.registryOperations.filter(op => op.status === 'completed').length,
                    registryOperationsTotal: operation.components.registryOperations.length
                },
                rollbackAvailable: operation.status === 'failed' || operation.status === 'executing'
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            operationId: args.operationId
        };
    }
}
/**
 * Rollback coordinated operation
 */
export const rollbackCoordinatedOperation = {
    name: 'rollback-coordinated-operation',
    description: 'Rollback coordinated lifecycle operation to previous state',
    inputSchema: {
        type: 'object',
        properties: {
            operationId: {
                type: 'string',
                description: 'Operation ID to rollback'
            },
            rollbackReason: {
                type: 'string',
                description: 'Reason for rollback'
            }
        },
        required: ['operationId']
    }
};
export async function handleRollbackCoordinatedOperation(args) {
    try {
        const { operationId, rollbackReason = 'Manual rollback request' } = args;
        const success = await lifecycleCoordinator.rollbackOperation(operationId);
        return {
            success,
            operationId,
            rollbackReason,
            result: success
                ? 'Operation rolled back successfully'
                : 'Rollback failed - check logs for details',
            recommendations: success
                ? ['Verify system state', 'Review rollback logs', 'Consider alternative approach']
                : ['Check rollback logs', 'Manual intervention may be required', 'Contact system administrator']
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            operationId: args.operationId
        };
    }
}
/**
 * Discover NewConcepts ready for migration
 */
export const discoverNewConcepts = {
    name: 'discover-newconcepts',
    description: 'Discover NewConcepts ready for migration to mature domain structures',
    inputSchema: {
        type: 'object',
        properties: {
            includeReadinessAssessment: {
                type: 'boolean',
                description: 'Include detailed readiness assessment for each concept',
                default: true
            },
            filterByDomain: {
                type: 'string',
                description: 'Filter concepts by target domain'
            }
        }
    }
};
export async function handleDiscoverNewConcepts(args) {
    try {
        const { includeReadinessAssessment = true, filterByDomain } = args;
        const discovery = await newConceptsMigration.discoverNewConcepts();
        let filteredResults = discovery;
        if (filterByDomain) {
            filteredResults = {
                ...discovery,
                conceptPaths: discovery.domainMappings.get(filterByDomain) || [],
                readinessCandidates: discovery.readinessCandidates.filter(candidate => candidate.conceptPath.toLowerCase().includes(filterByDomain.toLowerCase()))
            };
        }
        return {
            success: true,
            discovery: {
                conceptPaths: filteredResults.conceptPaths,
                placeholderCandidates: filteredResults.placeholderCandidates,
                domainMappings: Object.fromEntries(filteredResults.domainMappings),
                readinessCandidates: includeReadinessAssessment
                    ? filteredResults.readinessCandidates
                    : filteredResults.readinessCandidates.map(c => ({
                        conceptPath: c.conceptPath,
                        conceptName: c.conceptName,
                        maturityLevel: c.maturityLevel,
                        readinessScore: c.readinessScore
                    }))
            },
            summary: {
                totalConcepts: filteredResults.conceptPaths.length,
                readyConcepts: filteredResults.readinessCandidates.filter(c => c.maturityLevel === 'ready').length,
                developingConcepts: filteredResults.readinessCandidates.filter(c => c.maturityLevel === 'developing').length,
                conversionReadyPlaceholders: filteredResults.placeholderCandidates.length
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Initiate NewConcepts migration
 */
export const initiateNewConceptsMigration = {
    name: 'initiate-newconcepts-migration',
    description: 'Initiate NewConcepts migration workflow to mature domain structure',
    inputSchema: {
        type: 'object',
        properties: {
            conceptPath: {
                type: 'string',
                description: 'Path to the NewConcepts document to migrate'
            },
            conceptName: {
                type: 'string',
                description: 'Name of the concept being migrated'
            },
            targetDomain: {
                type: 'string',
                enum: ['Analysis', 'Data', 'Messaging', 'Infrastructure'],
                description: 'Target domain for the migration'
            },
            placeholderIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Placeholder IDs associated with this concept'
            },
            migrationReason: {
                type: 'string',
                description: 'Business justification for the migration'
            },
            maturityIndicators: {
                type: 'array',
                items: { type: 'string' },
                description: 'Evidence of concept maturity'
            },
            businessJustification: {
                type: 'string',
                description: 'Business value and justification for migration'
            }
        },
        required: ['conceptPath', 'conceptName', 'targetDomain', 'placeholderIds', 'migrationReason']
    }
};
export async function handleInitiateNewConceptsMigration(args) {
    try {
        const { conceptPath, conceptName, targetDomain, placeholderIds, migrationReason, maturityIndicators = [], businessJustification = '' } = args;
        const workflowId = await newConceptsMigration.initiateMigration({
            conceptPath,
            conceptName,
            targetDomain,
            placeholderIds,
            migrationReason,
            maturityIndicators,
            businessJustification
        });
        return {
            success: true,
            migration: {
                workflowId,
                conceptPath,
                conceptName,
                targetDomain,
                placeholderIds,
                status: 'analyzing'
            },
            nextSteps: [
                'Monitor migration progress using get-newconcepts-migration-status',
                'Review and approve migration when prompted',
                'Validate migration results after completion'
            ],
            estimatedDuration: placeholderIds.length * 30000 // 30s per placeholder
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            conceptPath: args.conceptPath
        };
    }
}
/**
 * Get NewConcepts migration status
 */
export const getNewConceptsMigrationStatus = {
    name: 'get-newconcepts-migration-status',
    description: 'Get status of NewConcepts migration workflow',
    inputSchema: {
        type: 'object',
        properties: {
            workflowId: {
                type: 'string',
                description: 'Migration workflow ID to get status for'
            }
        },
        required: ['workflowId']
    }
};
export async function handleGetNewConceptsMigrationStatus(args) {
    try {
        const { workflowId } = args;
        const workflow = newConceptsMigration.getMigrationStatus(workflowId);
        if (!workflow) {
            return {
                success: false,
                error: 'Migration workflow not found',
                workflowId
            };
        }
        const duration = workflow.completedAt
            ? workflow.completedAt.getTime() - workflow.startedAt.getTime()
            : Date.now() - workflow.startedAt.getTime();
        return {
            success: true,
            migration: {
                workflowId: workflow.workflowId,
                status: workflow.status,
                conceptPath: workflow.request.conceptPath,
                conceptName: workflow.request.conceptName,
                targetDomain: workflow.request.targetDomain,
                placeholderIds: workflow.request.placeholderIds,
                startedAt: workflow.startedAt,
                completedAt: workflow.completedAt,
                duration,
                error: workflow.error,
                progress: {
                    currentPhase: workflow.progress.currentPhase,
                    phasesCompleted: workflow.progress.phasesCompleted,
                    totalSteps: workflow.progress.totalSteps,
                    completedSteps: workflow.progress.completedSteps,
                    lastUpdate: workflow.progress.lastUpdate,
                    details: workflow.progress.details,
                    progressPercentage: Math.round((workflow.progress.completedSteps / workflow.progress.totalSteps) * 100)
                },
                coordinationPlan: workflow.coordinationPlan ? {
                    planId: workflow.coordinationPlan.planId,
                    operationType: workflow.coordinationPlan.operationType
                } : null,
                operationId: workflow.operationId
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            workflowId: args.workflowId
        };
    }
}
/**
 * List all active coordinations
 */
export const listActiveCoordinations = {
    name: 'list-active-coordinations',
    description: 'List all active coordination operations and migration workflows',
    inputSchema: {
        type: 'object',
        properties: {
            includeCompleted: {
                type: 'boolean',
                description: 'Include completed operations in the list',
                default: false
            }
        }
    }
};
export async function handleListActiveCoordinations(args) {
    try {
        const { includeCompleted = false } = args;
        const coordinations = lifecycleCoordinator.getActiveCoordinations();
        const migrations = newConceptsMigration.getActiveMigrations();
        const filteredCoordinations = includeCompleted
            ? coordinations
            : coordinations.filter(op => op.status !== 'completed');
        return {
            success: true,
            coordinations: {
                lifecycleOperations: filteredCoordinations.map(op => ({
                    operationId: op.operationId,
                    operationType: op.operationType,
                    planId: op.planId,
                    status: op.status,
                    startedAt: op.startedAt,
                    duration: op.completedAt
                        ? op.completedAt.getTime() - op.startedAt.getTime()
                        : Date.now() - op.startedAt.getTime()
                })),
                migrationWorkflows: migrations.map(workflow => ({
                    workflowId: workflow.workflowId,
                    status: workflow.status,
                    conceptName: workflow.request.conceptName,
                    targetDomain: workflow.request.targetDomain,
                    currentPhase: workflow.progress.currentPhase,
                    progressPercentage: Math.round((workflow.progress.completedSteps / workflow.progress.totalSteps) * 100),
                    startedAt: workflow.startedAt
                }))
            },
            summary: {
                totalCoordinations: filteredCoordinations.length,
                totalMigrations: migrations.length,
                executing: [...filteredCoordinations, ...migrations].filter(item => 'status' in item && item.status === 'executing').length
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
// Export all tools and handlers
export const lifecycleIntegrationTools = {
    'create-lifecycle-coordination-plan': createLifecycleCoordinationPlan,
    'execute-coordinated-operation': executeCoordinatedOperation,
    'get-coordination-status': getCoordinationStatus,
    'rollback-coordinated-operation': rollbackCoordinatedOperation,
    'discover-newconcepts': discoverNewConcepts,
    'initiate-newconcepts-migration': initiateNewConceptsMigration,
    'get-newconcepts-migration-status': getNewConceptsMigrationStatus,
    'list-active-coordinations': listActiveCoordinations
};
export const lifecycleIntegrationHandlers = {
    'create-lifecycle-coordination-plan': handleCreateLifecycleCoordinationPlan,
    'execute-coordinated-operation': handleExecuteCoordinatedOperation,
    'get-coordination-status': handleGetCoordinationStatus,
    'rollback-coordinated-operation': handleRollbackCoordinatedOperation,
    'discover-newconcepts': handleDiscoverNewConcepts,
    'initiate-newconcepts-migration': handleInitiateNewConceptsMigration,
    'get-newconcepts-migration-status': handleGetNewConceptsMigrationStatus,
    'list-active-coordinations': handleListActiveCoordinations
};
//# sourceMappingURL=lifecycle-integration.js.map
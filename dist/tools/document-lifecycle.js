/**
 * Document Lifecycle MCP Tools
 * MCP tools for document migration, approval workflow, and archive management
 * Implements TEMP-CONTEXT-ENGINE-a7b3 document lifecycle capability
 */
import { DocumentMigrationService } from '../services/document-migration.js';
import { ApprovalWorkflowManager } from '../services/approval-workflow.js';
import { ArchiveManager } from '../services/archive-manager.js';
import { contextEventManager } from '../events/context-events.js';
import path from 'path';
// Initialize services
const projectRoot = process.cwd();
const migrationService = new DocumentMigrationService(projectRoot);
const approvalWorkflow = new ApprovalWorkflowManager();
const archiveManager = new ArchiveManager(path.join(projectRoot, 'Documentation', 'Archive'));
/**
 * Analyze document for migration readiness
 */
export const analyzeDocumentMigrationReadiness = {
    name: 'analyze-document-migration-readiness',
    description: 'Analyze a NewConcepts document for migration readiness and provide maturity assessment',
    inputSchema: {
        type: 'object',
        properties: {
            documentPath: {
                type: 'string',
                description: 'Path to the document to analyze for migration'
            }
        },
        required: ['documentPath']
    }
};
export async function handleAnalyzeDocumentMigrationReadiness(args) {
    try {
        const { documentPath } = args;
        await contextEventManager.emit('DocumentAnalysisStarted', {
            documentPath,
            analysis: 'migration-readiness'
        });
        const analysis = await migrationService.analyzeDocumentForMigration(documentPath);
        await contextEventManager.emit('DocumentAnalysisCompleted', {
            documentPath,
            analysis,
            maturityLevel: analysis.maturityLevel,
            confidence: analysis.confidence
        });
        return {
            success: true,
            analysis: {
                filePath: analysis.filePath,
                documentType: analysis.documentType,
                currentDomain: analysis.currentDomain,
                discoveredDomains: analysis.discoveredDomains,
                placeholderIds: analysis.placeholderIds,
                businessConcepts: analysis.businessConcepts,
                integrationPoints: analysis.integrationPoints,
                maturityLevel: analysis.maturityLevel,
                confidence: analysis.confidence,
                readyForMigration: analysis.maturityLevel === 'ready-for-migration',
                recommendations: generateMigrationRecommendations(analysis)
            }
        };
    }
    catch (error) {
        await contextEventManager.emit('DocumentAnalysisFailed', {
            documentPath: args.documentPath,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            documentPath: args.documentPath
        };
    }
}
/**
 * Generate migration proposal for human approval
 */
export const generateMigrationProposal = {
    name: 'generate-migration-proposal',
    description: 'Generate a complete migration proposal for a ready NewConcepts document',
    inputSchema: {
        type: 'object',
        properties: {
            documentPath: {
                type: 'string',
                description: 'Path to the document to generate migration proposal for'
            },
            autoSubmitForApproval: {
                type: 'boolean',
                description: 'Whether to automatically submit the proposal for approval workflow',
                default: true
            }
        },
        required: ['documentPath']
    }
};
export async function handleGenerateMigrationProposal(args) {
    try {
        const { documentPath, autoSubmitForApproval = true } = args;
        await contextEventManager.emit('MigrationProposalStarted', {
            documentPath,
            autoSubmitForApproval
        });
        const proposal = await migrationService.generateMigrationProposal(documentPath);
        let approvalInfo = null;
        if (autoSubmitForApproval) {
            approvalInfo = await migrationService.submitForApproval(proposal.proposalId);
            await contextEventManager.emit('ApprovalRequested', {
                proposalId: proposal.proposalId,
                approvalId: approvalInfo.approvalId,
                documentPath,
                requiredApprovals: proposal.impactAnalysis.requiredApprovals
            });
        }
        await contextEventManager.emit('MigrationProposalGenerated', {
            proposalId: proposal.proposalId,
            documentPath,
            targetDomain: proposal.proposedStructure.targetDomain,
            approvalId: approvalInfo?.approvalId
        });
        return {
            success: true,
            proposal: {
                proposalId: proposal.proposalId,
                sourceDocument: proposal.sourceDocument,
                analysisResults: proposal.analysisResults,
                proposedStructure: proposal.proposedStructure,
                archiveStrategy: proposal.archiveStrategy,
                impactAnalysis: proposal.impactAnalysis,
                estimatedMigrationTime: proposal.estimatedMigrationTime,
                rollbackStrategy: proposal.rollbackStrategy,
                createdAt: proposal.createdAt,
                approvalRequired: proposal.approvalRequired
            },
            approval: approvalInfo ? {
                approvalId: approvalInfo.approvalId,
                status: approvalInfo.status,
                requiredApprovals: proposal.impactAnalysis.requiredApprovals,
                priority: proposal.impactAnalysis.riskLevel === 'high' ? 'urgent' : 'normal'
            } : null
        };
    }
    catch (error) {
        await contextEventManager.emit('MigrationProposalFailed', {
            documentPath: args.documentPath,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            documentPath: args.documentPath
        };
    }
}
/**
 * Check approval status and execute migration if approved
 */
export const executeMigrationIfApproved = {
    name: 'execute-migration-if-approved',
    description: 'Check approval status and execute migration if approved by required approvers',
    inputSchema: {
        type: 'object',
        properties: {
            proposalId: {
                type: 'string',
                description: 'Migration proposal ID to check and execute'
            },
            approvalId: {
                type: 'string',
                description: 'Approval workflow ID to check status'
            },
            forceExecute: {
                type: 'boolean',
                description: 'Force execution even if status check fails (for testing)',
                default: false
            }
        },
        required: ['proposalId', 'approvalId']
    }
};
export async function handleExecuteMigrationIfApproved(args) {
    try {
        const { proposalId, approvalId, forceExecute = false } = args;
        // Check approval status first
        const approvalStatus = await approvalWorkflow.checkApproval(approvalId);
        if (!forceExecute && approvalStatus !== 'approved') {
            return {
                success: false,
                status: 'waiting-for-approval',
                approvalStatus,
                message: `Migration cannot proceed. Approval status: ${approvalStatus}`,
                proposalId,
                approvalId
            };
        }
        await contextEventManager.emit('MigrationExecutionStarted', {
            proposalId,
            approvalId,
            approvalStatus
        });
        // Execute the migration
        const result = await migrationService.executeMigration(proposalId, approvalId);
        if (result.success) {
            await contextEventManager.emit('MigrationExecutionCompleted', {
                proposalId,
                result,
                migratedDocuments: result.migratedDocuments,
                archivedDocuments: result.archivedDocuments,
                updatedCapabilityIds: result.updatedCapabilityIds
            });
        }
        else {
            await contextEventManager.emit('MigrationExecutionFailed', {
                proposalId,
                errors: result.errors,
                warnings: result.warnings
            });
        }
        return {
            success: result.success,
            migration: {
                proposalId: result.proposalId,
                executionTime: result.executionTime,
                migratedDocuments: result.migratedDocuments,
                archivedDocuments: result.archivedDocuments,
                createdReferences: result.createdReferences,
                updatedCapabilityIds: result.updatedCapabilityIds,
                errors: result.errors,
                warnings: result.warnings
            },
            approvalStatus
        };
    }
    catch (error) {
        await contextEventManager.emit('MigrationExecutionFailed', {
            proposalId: args.proposalId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            proposalId: args.proposalId,
            approvalId: args.approvalId
        };
    }
}
/**
 * Get approval workflow status and details
 */
export const getApprovalWorkflowStatus = {
    name: 'get-approval-workflow-status',
    description: 'Get detailed status of approval workflow including pending approvals and statistics',
    inputSchema: {
        type: 'object',
        properties: {
            approvalId: {
                type: 'string',
                description: 'Specific approval ID to check (optional)'
            },
            approver: {
                type: 'string',
                description: 'Get pending approvals for specific approver (optional)'
            },
            includeStatistics: {
                type: 'boolean',
                description: 'Include workflow statistics in response',
                default: true
            }
        }
    }
};
export async function handleGetApprovalWorkflowStatus(args) {
    try {
        const { approvalId, approver, includeStatistics = true } = args;
        let specificApproval = null;
        if (approvalId) {
            try {
                specificApproval = await approvalWorkflow.getApprovalDetails(approvalId);
            }
            catch {
                // Approval not found, will return null
            }
        }
        const pendingApprovals = await approvalWorkflow.getPendingApprovals(approver);
        let statistics = null;
        if (includeStatistics) {
            statistics = approvalWorkflow.getWorkflowStatistics();
        }
        return {
            success: true,
            approval: specificApproval ? {
                approvalId: specificApproval.approvalId,
                request: specificApproval.request,
                status: specificApproval.status,
                responses: specificApproval.responses,
                createdAt: specificApproval.createdAt,
                expiresAt: specificApproval.expiresAt,
                approvedAt: specificApproval.approvedAt,
                approvedBy: specificApproval.approvedBy,
                finalDecision: specificApproval.finalDecision,
                consensusRequired: specificApproval.consensusRequired,
                minimumApprovals: specificApproval.minimumApprovals
            } : null,
            pendingApprovals: pendingApprovals.map(approval => ({
                approvalId: approval.approvalId,
                title: approval.request.title,
                type: approval.request.type,
                priority: approval.request.priority,
                createdAt: approval.createdAt,
                expiresAt: approval.expiresAt,
                requiredApprovals: approval.request.requiredApprovals,
                responseCount: approval.responses.length
            })),
            statistics: statistics ? {
                totalWorkflows: statistics.totalWorkflows,
                pendingCount: statistics.pendingCount,
                approvedCount: statistics.approvedCount,
                rejectedCount: statistics.rejectedCount,
                expiredCount: statistics.expiredCount,
                averageResponseTime: statistics.averageResponseTime,
                approvalRate: statistics.approvalRate
            } : null
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
 * Submit approval response
 */
export const submitApprovalResponse = {
    name: 'submit-approval-response',
    description: 'Submit an approval response (approved/rejected/request-changes) for a pending workflow',
    inputSchema: {
        type: 'object',
        properties: {
            approvalId: {
                type: 'string',
                description: 'Approval workflow ID to respond to'
            },
            approver: {
                type: 'string',
                description: 'Name/ID of the approver submitting the response'
            },
            decision: {
                type: 'string',
                enum: ['approved', 'rejected', 'request-changes'],
                description: 'Approval decision'
            },
            comments: {
                type: 'string',
                description: 'Comments explaining the decision (optional)'
            },
            conditions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Conditions that must be met (optional)'
            }
        },
        required: ['approvalId', 'approver', 'decision']
    }
};
export async function handleSubmitApprovalResponse(args) {
    try {
        const { approvalId, approver, decision, comments, conditions } = args;
        const result = await approvalWorkflow.submitResponse(approvalId, {
            approver,
            decision,
            comments,
            conditions
        });
        await contextEventManager.emit('ApprovalResponseSubmitted', {
            approvalId,
            approver,
            decision,
            status: result.status,
            finalDecision: result.finalDecision
        });
        return {
            success: true,
            response: {
                approvalId,
                approver,
                decision,
                comments,
                conditions,
                timestamp: new Date()
            },
            workflow: {
                status: result.status,
                finalDecision: result.finalDecision,
                isCompleted: result.finalDecision !== undefined
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            approvalId: args.approvalId
        };
    }
}
/**
 * Search archived documents
 */
export const searchArchivedDocuments = {
    name: 'search-archived-documents',
    description: 'Search archived documents by various criteria and retrieve archive statistics',
    inputSchema: {
        type: 'object',
        properties: {
            originalPath: {
                type: 'string',
                description: 'Filter by original document path (partial match)'
            },
            archiveReason: {
                type: 'string',
                enum: ['implementation-complete', 'domain-migration', 'deprecated', 'manual'],
                description: 'Filter by archive reason'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags (documents containing any of these tags)'
            },
            migrationId: {
                type: 'string',
                description: 'Filter by migration ID'
            },
            dateRange: {
                type: 'object',
                properties: {
                    from: { type: 'string', format: 'date-time' },
                    to: { type: 'string', format: 'date-time' }
                },
                description: 'Filter by archive date range'
            },
            includeStatistics: {
                type: 'boolean',
                description: 'Include archive statistics in response',
                default: true
            }
        }
    }
};
export async function handleSearchArchivedDocuments(args) {
    try {
        const { originalPath, archiveReason, tags, migrationId, dateRange, includeStatistics = true } = args;
        // Build search query
        const query = {};
        if (originalPath)
            query.originalPath = originalPath;
        if (archiveReason)
            query.archiveReason = archiveReason;
        if (tags)
            query.tags = tags;
        if (migrationId)
            query.migrationId = migrationId;
        if (dateRange) {
            query.dateRange = {
                from: new Date(dateRange.from),
                to: new Date(dateRange.to)
            };
        }
        const results = archiveManager.searchArchive(query);
        let statistics = null;
        if (includeStatistics) {
            statistics = archiveManager.getArchiveStatistics();
        }
        return {
            success: true,
            results: results.map(metadata => ({
                originalPath: metadata.originalPath,
                archivedPath: metadata.archivedPath,
                archiveDate: metadata.archiveDate,
                migrationId: metadata.migrationId,
                archiveReason: metadata.archiveReason,
                tags: metadata.tags,
                forwardReferences: metadata.forwardReferences,
                preserveHistory: metadata.preserveHistory
            })),
            query,
            totalResults: results.length,
            statistics: statistics ? {
                totalArchived: statistics.totalArchived,
                byReason: Object.fromEntries(statistics.byReason),
                byMonth: Object.fromEntries(statistics.byMonth),
                recentArchives: statistics.recentArchives.map(archive => ({
                    originalPath: archive.originalPath,
                    archiveDate: archive.archiveDate,
                    archiveReason: archive.archiveReason
                })),
                totalForwardReferences: statistics.totalForwardReferences
            } : null
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
 * Retrieve archived document content
 */
export const retrieveArchivedDocument = {
    name: 'retrieve-archived-document',
    description: 'Retrieve the original content of an archived document',
    inputSchema: {
        type: 'object',
        properties: {
            originalPath: {
                type: 'string',
                description: 'Original path of the document to retrieve from archive'
            }
        },
        required: ['originalPath']
    }
};
export async function handleRetrieveArchivedDocument(args) {
    try {
        const { originalPath } = args;
        const result = await archiveManager.retrieveArchivedDocument(originalPath);
        if (!result) {
            return {
                success: false,
                error: 'Document not found in archive',
                originalPath
            };
        }
        const forwardReferences = archiveManager.getForwardReferences(originalPath);
        return {
            success: true,
            document: {
                originalPath: result.metadata.originalPath,
                content: result.content,
                metadata: {
                    archivedPath: result.metadata.archivedPath,
                    archiveDate: result.metadata.archiveDate,
                    migrationId: result.metadata.migrationId,
                    archiveReason: result.metadata.archiveReason,
                    tags: result.metadata.tags,
                    preserveHistory: result.metadata.preserveHistory
                },
                forwardReferences: forwardReferences.map(ref => ({
                    newPath: ref.newPath,
                    referenceType: ref.referenceType,
                    createdDate: ref.createdDate,
                    migrationId: ref.migrationId
                }))
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            originalPath: args.originalPath
        };
    }
}
// Helper function to generate migration recommendations
function generateMigrationRecommendations(analysis) {
    const recommendations = [];
    if (analysis.maturityLevel === 'exploring') {
        recommendations.push('Document is still in exploration phase. Complete concept development before migration.');
        recommendations.push('Add implementation completion markers (✅ COMPLETED) when ready.');
    }
    else if (analysis.maturityLevel === 'ready-for-migration') {
        recommendations.push('Document is ready for migration to mature domain.');
        if (analysis.discoveredDomains.length === 0) {
            recommendations.push('Consider adding domain discovery section to clarify target domain.');
        }
        if (analysis.placeholderIds.length === 0) {
            recommendations.push('Consider adding capability IDs to track implementation artifacts.');
        }
    }
    else if (analysis.maturityLevel === 'mature') {
        recommendations.push('Document appears to already be in mature domain structure.');
    }
    if (analysis.confidence < 0.7) {
        recommendations.push('Low confidence in migration readiness. Consider manual review.');
    }
    if (analysis.businessConcepts.length === 0) {
        recommendations.push('No business concepts identified. Consider adding business concept documentation.');
    }
    return recommendations;
}
// Export all tools
export const documentLifecycleTools = {
    'analyze-document-migration-readiness': analyzeDocumentMigrationReadiness,
    'generate-migration-proposal': generateMigrationProposal,
    'execute-migration-if-approved': executeMigrationIfApproved,
    'get-approval-workflow-status': getApprovalWorkflowStatus,
    'submit-approval-response': submitApprovalResponse,
    'search-archived-documents': searchArchivedDocuments,
    'retrieve-archived-document': retrieveArchivedDocument
};
export const documentLifecycleHandlers = {
    'analyze-document-migration-readiness': handleAnalyzeDocumentMigrationReadiness,
    'generate-migration-proposal': handleGenerateMigrationProposal,
    'execute-migration-if-approved': handleExecuteMigrationIfApproved,
    'get-approval-workflow-status': handleGetApprovalWorkflowStatus,
    'submit-approval-response': handleSubmitApprovalResponse,
    'search-archived-documents': handleSearchArchivedDocuments,
    'retrieve-archived-document': handleRetrieveArchivedDocument
};
//# sourceMappingURL=document-lifecycle.js.map
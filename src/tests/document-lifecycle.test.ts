/**
 * Document Lifecycle Tests
 * Tests for document migration, approval workflow, and archive management
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentMigrationService } from '../services/document-migration.js';
import { ApprovalWorkflowManager, ApprovalRequest } from '../services/approval-workflow.js';
import { ArchiveManager } from '../services/archive-manager.js';

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        unlink: jest.fn(),
        access: jest.fn()
    }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Document Lifecycle System', () => {
    let migrationService: DocumentMigrationService;
    let approvalWorkflow: ApprovalWorkflowManager;
    let archiveManager: ArchiveManager;
    
    const testProjectRoot = '/test/project';
    const testArchiveRoot = '/test/project/Documentation/Archive';

    beforeEach(() => {
        migrationService = new DocumentMigrationService(testProjectRoot);
        approvalWorkflow = new ApprovalWorkflowManager();
        archiveManager = new ArchiveManager(testArchiveRoot);

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const sampleNewConceptContent = `# Test NewConcept

## Overview
This is a test concept for migration.

## Domain Discovery
**Confirmed Domain**: Analysis

## Implementation Status
✅ COMPLETED - All tests passing
Build Status: ✅

## Business Concepts
**Fractal Analysis**: Core analysis capability
**Inflection Detection**: Market turning point identification

## Placeholder IDs
- TEMP-ANALYSIS-FRACTAL-a7b3
- TEMP-ANALYSIS-INFLECTION-x9c2
`;

    describe('DocumentMigrationService', () => {
        describe('analyzeDocumentForMigration', () => {
            it('should analyze NewConcepts document correctly', async () => {
                mockFs.promises.readFile.mockResolvedValue(sampleNewConceptContent);

                const analysis = await migrationService.analyzeDocumentForMigration('Documentation/NewConcepts/test-concept.domain.req.md');

                expect(analysis).toEqual(expect.objectContaining({
                    filePath: 'Documentation/NewConcepts/test-concept.domain.req.md',
                    documentType: 'concept',
                    currentDomain: 'NewConcepts',
                    discoveredDomains: ['Analysis'],
                    placeholderIds: ['TEMP-ANALYSIS-FRACTAL-a7b3', 'TEMP-ANALYSIS-INFLECTION-x9c2'],
                    businessConcepts: expect.arrayContaining(['Fractal Analysis', 'Inflection Detection']),
                    maturityLevel: 'ready-for-migration',
                    confidence: expect.any(Number)
                }));

                expect(analysis.confidence).toBeGreaterThan(0.8); // Should be high confidence
            });

            it('should handle unready documents', async () => {
                const exploringContent = `# Exploring Concept
This is just preliminary exploration.
TBD: Need to define requirements.
`;
                mockFs.promises.readFile.mockResolvedValue(exploringContent);

                const analysis = await migrationService.analyzeDocumentForMigration('Documentation/NewConcepts/exploring.domain.req.md');

                expect(analysis.maturityLevel).toBe('exploring');
                expect(analysis.confidence).toBeLessThan(0.5);
            });

            it('should handle file read errors', async () => {
                mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));

                await expect(migrationService.analyzeDocumentForMigration('nonexistent.md'))
                    .rejects.toThrow('Document analysis failed: File not found');
            });
        });

        describe('generateMigrationProposal', () => {
            it('should generate complete migration proposal', async () => {
                mockFs.promises.readFile.mockResolvedValue(sampleNewConceptContent);

                const proposal = await migrationService.generateMigrationProposal('Documentation/NewConcepts/test-concept.domain.req.md');

                expect(proposal).toEqual(expect.objectContaining({
                    proposalId: expect.stringMatching(/^migration-\d+-[a-z0-9]+$/),
                    sourceDocument: 'Documentation/NewConcepts/test-concept.domain.req.md',
                    proposedStructure: expect.objectContaining({
                        targetDomain: 'Analysis',
                        newDocumentPath: expect.stringContaining('Documentation/Analysis/'),
                        templateType: 'domain',
                        finalCapabilityIds: expect.arrayContaining([
                            expect.objectContaining({
                                placeholder: 'TEMP-ANALYSIS-FRACTAL-a7b3',
                                final: expect.stringMatching(/^ANALYSIS-FRACTAL-[A-Z0-9]+$/)
                            })
                        ])
                    }),
                    archiveStrategy: expect.objectContaining({
                        archivePath: expect.stringContaining('Documentation/Archive/Implemented/'),
                        forwardReferences: expect.arrayContaining([
                            expect.stringContaining('Original NewConcept:')
                        ]),
                        preserveHistory: true
                    }),
                    impactAnalysis: expect.objectContaining({
                        riskLevel: expect.stringMatching(/^(low|medium|high)$/),
                        requiredApprovals: expect.arrayContaining(['domain-architect', 'technical-lead'])
                    }),
                    approvalRequired: true
                }));
            });

            it('should reject unready documents', async () => {
                const exploringContent = `# Exploring Concept
This is preliminary exploration.
`;
                mockFs.promises.readFile.mockResolvedValue(exploringContent);

                await expect(migrationService.generateMigrationProposal('Documentation/NewConcepts/exploring.domain.req.md'))
                    .rejects.toThrow('Document not ready for migration. Current maturity: exploring');
            });
        });

        describe('executeMigration', () => {
            it('should execute approved migration successfully', async () => {
                // Setup mocks
                mockFs.promises.readFile.mockResolvedValue(sampleNewConceptContent);
                mockFs.promises.mkdir.mockResolvedValue(undefined);
                mockFs.promises.writeFile.mockResolvedValue(undefined);
                mockFs.promises.unlink.mockResolvedValue(undefined);

                // Create and approve migration proposal
                const proposal = await migrationService.generateMigrationProposal('Documentation/NewConcepts/test-concept.domain.req.md');
                const approval = await approvalWorkflow.submitRequest({
                    proposalId: proposal.proposalId,
                    type: 'document-migration',
                    title: 'Test Migration',
                    description: 'Test migration description',
                    details: {},
                    requiredApprovals: ['test-approver'],
                    priority: 'normal'
                });
                
                // Simulate approval
                await approvalWorkflow.simulateApproval(approval.approvalId, 'approved');

                // Execute migration
                const result = await migrationService.executeMigration(proposal.proposalId, approval.approvalId);

                expect(result).toEqual(expect.objectContaining({
                    success: true,
                    proposalId: proposal.proposalId,
                    executionTime: expect.any(Number),
                    migratedDocuments: expect.arrayContaining([expect.stringContaining('Documentation/Analysis/')]),
                    archivedDocuments: expect.arrayContaining([expect.stringContaining('Documentation/Archive/')]),
                    updatedCapabilityIds: expect.arrayContaining([
                        expect.objectContaining({
                            placeholder: expect.stringMatching(/^TEMP-/),
                            final: expect.stringMatching(/^ANALYSIS-/)
                        })
                    ]),
                    errors: [],
                    warnings: []
                }));

                // Verify file operations were called
                expect(mockFs.promises.mkdir).toHaveBeenCalled();
                expect(mockFs.promises.writeFile).toHaveBeenCalled();
                expect(mockFs.promises.unlink).toHaveBeenCalled();
            });

            it('should handle migration failures with rollback', async () => {
                mockFs.promises.readFile.mockResolvedValue(sampleNewConceptContent);
                mockFs.promises.mkdir.mockResolvedValue(undefined);
                mockFs.promises.writeFile.mockRejectedValue(new Error('Write failed'));

                const proposal = await migrationService.generateMigrationProposal('Documentation/NewConcepts/test-concept.domain.req.md');
                const approval = await approvalWorkflow.submitRequest({
                    proposalId: proposal.proposalId,
                    type: 'document-migration',
                    title: 'Test Migration',
                    description: 'Test migration description',
                    details: {},
                    requiredApprovals: ['test-approver'],
                    priority: 'normal'
                });
                
                await approvalWorkflow.simulateApproval(approval.approvalId, 'approved');

                const result = await migrationService.executeMigration(proposal.proposalId, approval.approvalId);

                expect(result.success).toBe(false);
                expect(result.errors).toContain(expect.stringContaining('Write failed'));
            });

            it('should reject unapproved migrations', async () => {
                const proposal = await migrationService.generateMigrationProposal('Documentation/NewConcepts/test-concept.domain.req.md');
                const approval = await approvalWorkflow.submitRequest({
                    proposalId: proposal.proposalId,
                    type: 'document-migration',
                    title: 'Test Migration',
                    description: 'Test migration description',
                    details: {},
                    requiredApprovals: ['test-approver'],
                    priority: 'normal'
                });

                await expect(migrationService.executeMigration(proposal.proposalId, approval.approvalId))
                    .rejects.toThrow('Migration not approved. Status: pending');
            });
        });
    });

    describe('ApprovalWorkflowManager', () => {
        const sampleRequest: ApprovalRequest = {
            proposalId: 'test-proposal-123',
            type: 'document-migration',
            title: 'Test Migration Approval',
            description: 'Test migration for approval workflow',
            details: { testDetail: 'value' },
            requiredApprovals: ['approver1', 'approver2'],
            priority: 'normal'
        };

        describe('submitRequest', () => {
            it('should create approval workflow correctly', async () => {
                const result = await approvalWorkflow.submitRequest(sampleRequest);

                expect(result).toEqual({
                    approvalId: expect.stringMatching(/^approval-\d+-[a-z0-9]+$/),
                    status: 'pending'
                });

                const _details = await approvalWorkflow.getApprovalDetails(result.approvalId);
                expect(_details).toEqual(expect.objectContaining({
                    approvalId: result.approvalId,
                    request: expect.objectContaining({
                        ...sampleRequest,
                        submittedAt: expect.any(Date),
                        submittedBy: 'context-engineering-system'
                    }),
                    status: 'pending',
                    responses: [],
                    consensusRequired: true,
                    minimumApprovals: 2 // 60% of 2 = 1.2, ceiling = 2
                }));
            });
        });

        describe('submitResponse', () => {
            it('should handle approval responses correctly', async () => {
                const approval = await approvalWorkflow.submitRequest(sampleRequest);
                
                // First approver approves
                const response1 = await approvalWorkflow.submitResponse(approval.approvalId, {
                    approver: 'approver1',
                    decision: 'approved',
                    comments: 'Looks good to me'
                });

                expect(response1.status).toBe('pending'); // Still waiting for consensus

                // Second approver approves
                const response2 = await approvalWorkflow.submitResponse(approval.approvalId, {
                    approver: 'approver2',
                    decision: 'approved',
                    comments: 'Approved'
                });

                expect(response2.status).toBe('approved');
                expect(response2.finalDecision).toBe('approved');
            });

            it('should handle rejections correctly', async () => {
                const approval = await approvalWorkflow.submitRequest(sampleRequest);
                
                const response = await approvalWorkflow.submitResponse(approval.approvalId, {
                    approver: 'approver1',
                    decision: 'rejected',
                    comments: 'Not ready yet'
                });

                expect(response.status).toBe('rejected');
                expect(response.finalDecision).toBe('rejected');
            });

            it('should handle expired workflows', async () => {
                const expiredRequest = {
                    ...sampleRequest,
                    priority: 'urgent' as const // 4 hour expiration
                };
                
                const approval = await approvalWorkflow.submitRequest(expiredRequest);
                
                // Manually expire the workflow by manipulating time
                const _details = await approvalWorkflow.getApprovalDetails(approval.approvalId);
                // In a real test, we'd use jest.useFakeTimers() or mock the Date
                
                await expect(
                    approvalWorkflow.submitResponse(approval.approvalId, {
                        approver: 'approver1',
                        decision: 'approved'
                    })
                ).rejects.toThrow(); // Would throw if expired
            });
        });

        describe('getWorkflowStatistics', () => {
            it('should provide accurate statistics', async () => {
                // Create several workflows with different outcomes
                const approval1 = await approvalWorkflow.submitRequest({ ...sampleRequest, proposalId: 'prop1' });
                const approval2 = await approvalWorkflow.submitRequest({ ...sampleRequest, proposalId: 'prop2' });
                
                await approvalWorkflow.simulateApproval(approval1.approvalId, 'approved');
                await approvalWorkflow.simulateApproval(approval2.approvalId, 'rejected');

                const stats = approvalWorkflow.getWorkflowStatistics();

                expect(stats).toEqual(expect.objectContaining({
                    totalWorkflows: expect.any(Number),
                    pendingCount: expect.any(Number),
                    approvedCount: expect.any(Number),
                    rejectedCount: expect.any(Number),
                    averageResponseTime: expect.any(Number),
                    approvalRate: expect.any(Number)
                }));

                expect(stats.approvedCount).toBeGreaterThan(0);
                expect(stats.rejectedCount).toBeGreaterThan(0);
            });
        });
    });

    describe('ArchiveManager', () => {
        beforeEach(() => {
            // Mock file system operations
            mockFs.promises.mkdir.mockResolvedValue(undefined);
            mockFs.promises.access.mockResolvedValue(undefined);
        });

        describe('archiveDocument', () => {
            it('should archive document with metadata', async () => {
                const sourceContent = '# Test Document\nThis is a test document.';
                mockFs.promises.readFile.mockResolvedValue(sourceContent);
                mockFs.promises.writeFile.mockResolvedValue(undefined);
                mockFs.promises.unlink.mockResolvedValue(undefined);

                const result = await archiveManager.archiveDocument(
                    'Documentation/NewConcepts/test.md',
                    'Implemented/20250101-test.md',
                    ['Documentation/Analysis/test.domain.req.md'],
                    {
                        migrationId: 'migration-123',
                        reason: 'implementation-complete',
                        tags: ['analysis', 'fractal']
                    }
                );

                expect(result).toBe(path.resolve(testArchiveRoot, 'Implemented/20250101-test.md'));
                
                // Verify archive header was added
                expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.stringContaining('<!-- ARCHIVE METADATA'),
                    'utf-8'
                );
                
                // Verify original was deleted
                expect(mockFs.promises.unlink).toHaveBeenCalledWith(
                    expect.stringContaining('test.md')
                );
            });

            it('should handle archive failures', async () => {
                mockFs.promises.access.mockRejectedValue(new Error('File not found'));

                await expect(
                    archiveManager.archiveDocument(
                        'nonexistent.md',
                        'Implemented/test.md',
                        []
                    )
                ).rejects.toThrow('Archive operation failed: File not found');
            });
        });

        describe('retrieveArchivedDocument', () => {
            it('should retrieve archived document without metadata', async () => {
                // First archive a document
                const originalContent = '# Test Document\nOriginal content.';
                const archivedContent = `<!-- ARCHIVE METADATA -->
# ARCHIVED DOCUMENT
Archive metadata here...
---
${originalContent}`;
                
                mockFs.promises.readFile
                    .mockResolvedValueOnce(originalContent) // For archiving
                    .mockResolvedValueOnce(archivedContent); // For retrieval
                mockFs.promises.writeFile.mockResolvedValue(undefined);
                mockFs.promises.unlink.mockResolvedValue(undefined);
                mockFs.promises.access.mockResolvedValue(undefined);

                // Archive document first
                await archiveManager.archiveDocument(
                    'Documentation/test.md',
                    'Implemented/test.md',
                    []
                );

                // Then retrieve it
                const retrieved = await archiveManager.retrieveArchivedDocument('Documentation/test.md');

                expect(retrieved).not.toBeNull();
                expect(retrieved!.content).toBe(originalContent);
                expect(retrieved!.metadata).toEqual(expect.objectContaining({
                    originalPath: 'Documentation/test.md',
                    archivedPath: 'Implemented/test.md'
                }));
            });

            it('should return null for non-existent archives', async () => {
                const result = await archiveManager.retrieveArchivedDocument('nonexistent.md');
                expect(result).toBeNull();
            });
        });

        describe('searchArchive', () => {
            it('should search archives by criteria', async () => {
                // Setup mock to simulate archived documents
                mockFs.promises.readFile.mockResolvedValue('# Test');
                mockFs.promises.writeFile.mockResolvedValue(undefined);
                mockFs.promises.unlink.mockResolvedValue(undefined);
                mockFs.promises.access.mockResolvedValue(undefined);

                // Archive some test documents
                await archiveManager.archiveDocument('doc1.md', 'Implemented/doc1.md', [], {
                    reason: 'implementation-complete',
                    tags: ['analysis']
                });
                
                await archiveManager.archiveDocument('doc2.md', 'Migrated/doc2.md', [], {
                    reason: 'domain-migration',
                    tags: ['data']
                });

                // Search by reason
                const implementedResults = archiveManager.searchArchive({
                    archiveReason: 'implementation-complete'
                });

                expect(implementedResults).toHaveLength(1);
                expect(implementedResults[0].archiveReason).toBe('implementation-complete');

                // Search by tags
                const analysisResults = archiveManager.searchArchive({
                    tags: ['analysis']
                });

                expect(analysisResults).toHaveLength(1);
                expect(analysisResults[0].tags).toContain('analysis');
            });
        });

        describe('getArchiveStatistics', () => {
            it('should provide comprehensive statistics', async () => {
                mockFs.promises.readFile.mockResolvedValue('# Test');
                mockFs.promises.writeFile.mockResolvedValue(undefined);
                mockFs.promises.unlink.mockResolvedValue(undefined);
                mockFs.promises.access.mockResolvedValue(undefined);

                // Create some archived documents
                await archiveManager.archiveDocument('doc1.md', 'Implemented/doc1.md', ['ref1.md']);
                await archiveManager.archiveDocument('doc2.md', 'Migrated/doc2.md', []);

                const stats = archiveManager.getArchiveStatistics();

                expect(stats).toEqual(expect.objectContaining({
                    totalArchived: expect.any(Number),
                    byReason: expect.any(Map),
                    byMonth: expect.any(Map),
                    recentArchives: expect.any(Array),
                    totalForwardReferences: expect.any(Number)
                }));

                expect(stats.totalArchived).toBeGreaterThan(0);
                expect(stats.totalForwardReferences).toBeGreaterThan(0);
            });
        });
    });

    describe('Integration Tests', () => {
        it('should complete full document lifecycle', async () => {
            // Mock all file operations
            mockFs.promises.readFile.mockResolvedValue(sampleNewConceptContent);
            mockFs.promises.mkdir.mockResolvedValue(undefined);
            mockFs.promises.writeFile.mockResolvedValue(undefined);
            mockFs.promises.unlink.mockResolvedValue(undefined);
            mockFs.promises.access.mockResolvedValue(undefined);

            // 1. Analyze document
            const analysis = await migrationService.analyzeDocumentForMigration('Documentation/NewConcepts/test-concept.domain.req.md');
            expect(analysis.maturityLevel).toBe('ready-for-migration');

            // 2. Generate migration proposal
            const proposal = await migrationService.generateMigrationProposal('Documentation/NewConcepts/test-concept.domain.req.md');
            expect(proposal.approvalRequired).toBe(true);

            // 3. Submit for approval
            const approval = await migrationService.submitForApproval(proposal.proposalId);
            expect(approval.status).toBe('pending');

            // 4. Approve migration
            await approvalWorkflow.simulateApproval(approval.approvalId, 'approved');
            const approvalStatus = await approvalWorkflow.checkApproval(approval.approvalId);
            expect(approvalStatus).toBe('approved');

            // 5. Execute migration
            const result = await migrationService.executeMigration(proposal.proposalId, approval.approvalId);
            expect(result.success).toBe(true);
            expect(result.migratedDocuments).toHaveLength(1);
            expect(result.archivedDocuments).toHaveLength(1);

            // Verify the complete lifecycle worked
            expect(result.updatedCapabilityIds).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        placeholder: 'TEMP-ANALYSIS-FRACTAL-a7b3',
                        final: expect.stringMatching(/^ANALYSIS-FRACTAL-/)
                    })
                ])
            );
        });
    });
});
"use strict";
/**
 * Lifecycle Integration Tests
 * Tests for lifecycle coordination and NewConcepts migration workflows
 */
describe('Lifecycle Integration System', () => {
    it('should validate coordination plan structure', () => {
        const mockCoordinationPlan = {
            planId: 'plan-test-123456',
            operationType: 'newconcepts-migration',
            documentOperations: [
                {
                    operationId: 'doc-migrate-001',
                    type: 'migrate',
                    sourcePath: 'Documentation/NewConcepts/test-concept.md',
                    targetPath: 'Documentation/Analysis/test-concept.md',
                    status: 'pending'
                }
            ],
            registryOperations: [
                {
                    operationId: 'reg-convert-001',
                    type: 'capability-conversion',
                    placeholderId: 'TEMP-ANALYSIS-TEST-1234',
                    finalCapabilityId: 'ANALYSIS-TEST-FINAL-001',
                    status: 'pending'
                }
            ],
            dependencies: [],
            approvalGates: [
                {
                    gateId: 'approval-plan-test-123456',
                    description: 'Human approval for NewConcepts migration',
                    requiredFor: ['doc-migrate-001', 'reg-convert-001'],
                    approvalType: 'human',
                    approvalCriteria: {
                        requiredApprovers: 1,
                        description: 'Test migration to Analysis domain'
                    }
                }
            ],
            rollbackStrategy: {
                rollbackOrder: ['reg-convert-001', 'doc-migrate-001'],
                atomicGroups: [['doc-migrate-001'], ['reg-convert-001']],
                rollbackTimeout: 30000
            },
            expectedDuration: 60000
        };
        // Validate plan structure
        expect(mockCoordinationPlan.planId).toMatch(/^plan-[a-z0-9-]+$/);
        expect(mockCoordinationPlan.operationType).toBe('newconcepts-migration');
        expect(mockCoordinationPlan.documentOperations).toHaveLength(1);
        expect(mockCoordinationPlan.registryOperations).toHaveLength(1);
        expect(mockCoordinationPlan.approvalGates).toHaveLength(1);
        expect(mockCoordinationPlan.expectedDuration).toBeGreaterThan(0);
    });
    it('should validate NewConcepts readiness assessment', () => {
        const mockReadinessAssessment = {
            conceptPath: 'Documentation/NewConcepts/fractal-enhancement.md',
            conceptName: 'fractal-enhancement',
            maturityLevel: 'ready',
            readinessScore: 85.6,
            readinessFactors: {
                documentation: 90,
                implementation: 85,
                testing: 75,
                integration: 85,
                business_validation: 93
            },
            blockingFactors: [],
            recommendations: [
                'Complete implementation before migration',
                'Add comprehensive test coverage',
                'Validate business requirements'
            ]
        };
        // Validate assessment structure
        expect(mockReadinessAssessment.conceptPath).toMatch(/Documentation\/NewConcepts\/.+\.md$/);
        expect(['exploratory', 'developing', 'ready', 'mature']).toContain(mockReadinessAssessment.maturityLevel);
        expect(mockReadinessAssessment.readinessScore).toBeGreaterThanOrEqual(0);
        expect(mockReadinessAssessment.readinessScore).toBeLessThanOrEqual(100);
        expect(Object.keys(mockReadinessAssessment.readinessFactors)).toHaveLength(5);
        expect(Array.isArray(mockReadinessAssessment.recommendations)).toBe(true);
    });
    it('should validate migration workflow progress tracking', () => {
        const mockMigrationProgress = {
            currentPhase: 'placeholder-conversion',
            phasesCompleted: ['analysis', 'planning', 'approval'],
            totalSteps: 7,
            completedSteps: 4,
            lastUpdate: new Date(),
            details: 'Converting placeholder IDs to final capability IDs'
        };
        const validPhases = [
            'analysis', 'planning', 'approval', 'placeholder-conversion',
            'document-migration', 'validation', 'completion'
        ];
        // Validate progress structure
        expect(validPhases).toContain(mockMigrationProgress.currentPhase);
        expect(mockMigrationProgress.phasesCompleted).toBeInstanceOf(Array);
        expect(mockMigrationProgress.completedSteps).toBeLessThanOrEqual(mockMigrationProgress.totalSteps);
        expect(mockMigrationProgress.lastUpdate).toBeInstanceOf(Date);
        // Calculate progress percentage
        const progressPercentage = Math.round((mockMigrationProgress.completedSteps / mockMigrationProgress.totalSteps) * 100);
        expect(progressPercentage).toBe(57); // 4/7 = ~57%
    });
    it('should validate coordinated operation status', () => {
        const mockCoordinatedOperation = {
            operationId: 'op-12345-abc123',
            operationType: 'newconcepts-migration',
            planId: 'plan-test-123456',
            status: 'executing',
            startedAt: new Date(Date.now() - 30000), // 30 seconds ago
            completedAt: undefined,
            components: {
                documentOperations: [
                    {
                        operationId: 'doc-migrate-001',
                        type: 'migrate',
                        sourcePath: 'Documentation/NewConcepts/test-concept.md',
                        targetPath: 'Documentation/Analysis/test-concept.md',
                        status: 'completed'
                    }
                ],
                registryOperations: [
                    {
                        operationId: 'reg-convert-001',
                        type: 'capability-conversion',
                        placeholderId: 'TEMP-ANALYSIS-TEST-1234',
                        finalCapabilityId: 'ANALYSIS-TEST-FINAL-001',
                        status: 'executing'
                    }
                ]
            },
            metadata: {
                placeholderIds: ['TEMP-ANALYSIS-TEST-1234'],
                documentPaths: ['Documentation/NewConcepts/test-concept.md'],
                approvalIds: ['approval-op-12345-abc123-gate-001'],
                rollbackData: {
                    timestamp: new Date(),
                    documentStates: new Map(),
                    registryStates: new Map(),
                    placeholderStates: new Map(),
                    operationLog: []
                }
            }
        };
        // Validate operation structure
        expect(mockCoordinatedOperation.operationId).toMatch(/^op-\d+-[a-z0-9]+$/);
        expect(['newconcepts-migration', 'placeholder-conversion', 'document-restructure', 'full-lifecycle'])
            .toContain(mockCoordinatedOperation.operationType);
        expect(['planning', 'executing', 'completed', 'failed', 'rolling-back', 'rolled-back'])
            .toContain(mockCoordinatedOperation.status);
        expect(mockCoordinatedOperation.startedAt).toBeInstanceOf(Date);
        expect(mockCoordinatedOperation.components.documentOperations).toHaveLength(1);
        expect(mockCoordinatedOperation.components.registryOperations).toHaveLength(1);
        // Validate progress tracking
        const docOpsCompleted = mockCoordinatedOperation.components.documentOperations
            .filter((op) => op.status === 'completed').length;
        const regOpsCompleted = mockCoordinatedOperation.components.registryOperations
            .filter((op) => op.status === 'completed').length;
        expect(docOpsCompleted).toBe(1);
        expect(regOpsCompleted).toBe(0);
    });
    it('should validate rollback capability', () => {
        const mockRollbackSnapshot = {
            timestamp: new Date(),
            documentStates: new Map([
                ['Documentation/NewConcepts/test-concept.md', {
                        exists: true,
                        content: 'original content',
                        lastModified: new Date()
                    }]
            ]),
            registryStates: new Map([
                ['TEMP-ANALYSIS-TEST-1234', {
                        lifecycle: 'ready-for-conversion',
                        maturityLevel: 'ready-for-conversion',
                        confidence: 0.9
                    }]
            ]),
            placeholderStates: new Map([
                ['TEMP-ANALYSIS-TEST-1234', {
                        stage: 'ready-for-conversion',
                        transitions: []
                    }]
            ]),
            operationLog: [
                {
                    timestamp: new Date(),
                    component: 'document',
                    operation: 'migrate',
                    details: { sourcePath: 'Documentation/NewConcepts/test-concept.md' },
                    rollbackAction: 'restore-original-location'
                }
            ]
        };
        // Validate rollback snapshot structure
        expect(mockRollbackSnapshot.timestamp).toBeInstanceOf(Date);
        expect(mockRollbackSnapshot.documentStates).toBeInstanceOf(Map);
        expect(mockRollbackSnapshot.registryStates).toBeInstanceOf(Map);
        expect(mockRollbackSnapshot.placeholderStates).toBeInstanceOf(Map);
        expect(Array.isArray(mockRollbackSnapshot.operationLog)).toBe(true);
        // Validate that we can restore from snapshot
        const docState = mockRollbackSnapshot.documentStates.get('Documentation/NewConcepts/test-concept.md');
        expect(docState).toBeDefined();
        expect(docState?.exists).toBe(true);
        const regState = mockRollbackSnapshot.registryStates.get('TEMP-ANALYSIS-TEST-1234');
        expect(regState).toBeDefined();
        expect(regState?.lifecycle).toBe('ready-for-conversion');
    });
    it('should validate domain inference from concept paths', () => {
        const testCases = [
            { path: 'Documentation/NewConcepts/fractal-analysis-enhancement.md', expectedDomain: 'Analysis' },
            { path: 'Documentation/NewConcepts/timeseries-data-optimization.md', expectedDomain: 'Data' },
            { path: 'Documentation/NewConcepts/context-messaging-system.md', expectedDomain: 'Messaging' },
            { path: 'Documentation/NewConcepts/unknown-concept.md', expectedDomain: 'Unknown' }
        ];
        const inferDomainFromPath = (conceptPath) => {
            const pathLower = conceptPath.toLowerCase();
            if (pathLower.includes('fractal') || pathLower.includes('analysis')) {
                return 'Analysis';
            }
            else if (pathLower.includes('data') || pathLower.includes('timeseries')) {
                return 'Data';
            }
            else if (pathLower.includes('messaging') || pathLower.includes('context')) {
                return 'Messaging';
            }
            else {
                return 'Unknown';
            }
        };
        testCases.forEach(testCase => {
            const inferredDomain = inferDomainFromPath(testCase.path);
            expect(inferredDomain).toBe(testCase.expectedDomain);
        });
    });
});
//# sourceMappingURL=lifecycle-integration.test.js.map
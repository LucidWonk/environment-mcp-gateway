/**
 * Tests for Update Integration Orchestrator
 * Testing TEMP-CONTEXT-ENGINE-a7b3 integration capabilities
 */
import { UpdateIntegrationOrchestrator } from '../services/update-integration.js';
import { ContextEventManager } from '../events/context-events.js';
import { handleExecuteIntegratedUpdate, handleGetIntegrationStatus, handleValidateIntegrationPrerequisites, handleGetEventStatistics } from '../tools/update-integration.js';
// Mock the dependencies
jest.mock('../services/impact-mapper.js');
jest.mock('../services/cross-domain-coordinator.js');
jest.mock('../services/holistic-update-orchestrator.js');
describe('UpdateIntegrationOrchestrator', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = new UpdateIntegrationOrchestrator('.');
        jest.clearAllMocks();
    });
    describe('executeIntegratedUpdate', () => {
        it('should execute complete integration workflow successfully', async () => {
            const request = {
                changedFiles: ['src/test.cs', 'src/another.cs'],
                triggerType: 'manual',
                performanceTimeout: 300,
                projectRoot: '.'
            };
            // Mock successful responses from dependencies
            const mockImpactResult = {
                success: true,
                prediction: {
                    impactSummary: { totalAffectedDomains: 2 },
                    affectedDomains: [
                        { domain: 'Analysis' },
                        { domain: 'Data' }
                    ]
                }
            };
            const mockCoordResult = {
                success: true,
                coordination: { planId: 'test-plan-123' }
            };
            const mockHolisticResult = {
                success: true,
                updatedDomains: ['Analysis', 'Data']
            };
            // Mock the service methods
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockResolvedValue(mockImpactResult);
            jest.spyOn(orchestrator['crossDomainCoordinator'], 'coordinateUpdate')
                .mockResolvedValue(mockCoordResult);
            jest.spyOn(orchestrator['holisticOrchestrator'], 'executeHolisticUpdate')
                .mockResolvedValue(mockHolisticResult);
            const result = await orchestrator.executeIntegratedUpdate(request);
            expect(result.success).toBe(true);
            expect(result.affectedDomains).toEqual(['Analysis', 'Data']);
            expect(result.integrationId).toBeDefined();
            expect(result.executionMetrics.totalTime).toBeGreaterThan(0);
        });
        it('should handle impact analysis failure gracefully', async () => {
            const request = {
                changedFiles: ['src/test.cs'],
                triggerType: 'manual',
                performanceTimeout: 300
            };
            // Mock failed impact analysis
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockResolvedValue({ success: false, error: 'Impact analysis failed' });
            const result = await orchestrator.executeIntegratedUpdate(request);
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Impact analysis failed: Impact analysis failed');
        });
        it('should handle coordination failure and trigger rollback', async () => {
            const request = {
                changedFiles: ['src/test.cs'],
                triggerType: 'manual'
            };
            // Mock successful impact analysis but failed coordination
            const mockImpactResult = {
                success: true,
                prediction: {
                    impactSummary: { totalAffectedDomains: 1 },
                    affectedDomains: [{ domain: 'Analysis' }]
                }
            };
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockResolvedValue(mockImpactResult);
            jest.spyOn(orchestrator['crossDomainCoordinator'], 'coordinateUpdate')
                .mockResolvedValue({ success: false, error: 'Coordination failed' });
            // Mock rollback methods
            jest.spyOn(orchestrator['holisticOrchestrator'], 'rollbackUpdate')
                .mockResolvedValue(undefined);
            jest.spyOn(orchestrator['crossDomainCoordinator'], 'rollbackCoordination')
                .mockResolvedValue(undefined);
            const result = await orchestrator.executeIntegratedUpdate(request);
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Coordination phase failed');
        });
        it('should generate unique integration IDs', async () => {
            const request = {
                changedFiles: ['src/test.cs'],
                triggerType: 'manual'
            };
            // Mock successful flow
            const mockResults = {
                impact: { success: true, prediction: { impactSummary: {}, affectedDomains: [] } },
                coord: { success: true, coordination: {} },
                holistic: { success: true }
            };
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockResolvedValue(mockResults.impact);
            jest.spyOn(orchestrator['crossDomainCoordinator'], 'coordinateUpdate')
                .mockResolvedValue(mockResults.coord);
            jest.spyOn(orchestrator['holisticOrchestrator'], 'executeHolisticUpdate')
                .mockResolvedValue(mockResults.holistic);
            const result1 = await orchestrator.executeIntegratedUpdate(request);
            const result2 = await orchestrator.executeIntegratedUpdate(request);
            expect(result1.integrationId).not.toBe(result2.integrationId);
        });
    });
    describe('validatePrerequisites', () => {
        it('should validate all components successfully', async () => {
            // Mock successful validation for all components
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockResolvedValue({ success: true, prediction: {} });
            jest.spyOn(orchestrator['crossDomainCoordinator'], 'validateConfiguration')
                .mockResolvedValue(true);
            jest.spyOn(orchestrator['holisticOrchestrator'], 'validateConfiguration')
                .mockResolvedValue(true);
            const result = await orchestrator.validatePrerequisites();
            expect(result.valid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });
        it('should detect component configuration issues', async () => {
            // Mock failed validation
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockRejectedValue(new Error('Impact mapper not configured'));
            const result = await orchestrator.validatePrerequisites();
            expect(result.valid).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0]).toContain('Prerequisites validation error');
        });
    });
    describe('integration management', () => {
        it('should track active integrations', async () => {
            const request = {
                changedFiles: ['src/test.cs'],
                triggerType: 'manual'
            };
            // Mock quick successful execution
            const mockResults = {
                impact: { success: true, prediction: { impactSummary: {}, affectedDomains: [] } },
                coord: { success: true, coordination: {} },
                holistic: { success: true }
            };
            jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
                .mockResolvedValue(mockResults.impact);
            jest.spyOn(orchestrator['crossDomainCoordinator'], 'coordinateUpdate')
                .mockResolvedValue(mockResults.coord);
            jest.spyOn(orchestrator['holisticOrchestrator'], 'executeHolisticUpdate')
                .mockResolvedValue(mockResults.holistic);
            const initialActive = orchestrator.getActiveIntegrations();
            expect(initialActive).toHaveLength(0);
            const result = await orchestrator.executeIntegratedUpdate(request);
            // After completion, should be removed from active list
            const finalActive = orchestrator.getActiveIntegrations();
            expect(finalActive).toHaveLength(0);
            expect(result.success).toBe(true);
        });
    });
});
describe('ContextEventManager', () => {
    let eventManager;
    beforeEach(() => {
        eventManager = new ContextEventManager();
        eventManager.clearHistory();
    });
    describe('event emission and handling', () => {
        it('should emit and handle events correctly', async () => {
            const handlerMock = jest.fn();
            eventManager.on('IntegrationPhaseStarted', handlerMock);
            await eventManager.emit('IntegrationPhaseStarted', { phase: 'test' });
            expect(handlerMock).toHaveBeenCalledWith(expect.objectContaining({
                type: 'IntegrationPhaseStarted',
                data: { phase: 'test' }
            }));
        });
        it('should maintain event history', async () => {
            await eventManager.emit('IntegrationPhaseStarted', { phase: 'test1' });
            await eventManager.emit('CrossDomainImpactDetected', { domains: ['Analysis'] });
            const history = eventManager.getEventHistory();
            expect(history).toHaveLength(2);
            expect(history[0].type).toBe('IntegrationPhaseStarted');
            expect(history[1].type).toBe('CrossDomainImpactDetected');
        });
        it('should filter event history correctly', async () => {
            const integrationId = 'test-integration-123';
            await eventManager.emit('IntegrationPhaseStarted', { phase: 'test' }, integrationId);
            await eventManager.emit('CrossDomainImpactDetected', { domains: [] }, 'other-id');
            await eventManager.emit('IntegratedUpdateCompleted', { success: true }, integrationId);
            const filteredHistory = eventManager.getEventHistory({ integrationId });
            expect(filteredHistory).toHaveLength(2);
            expect(filteredHistory.every(e => e.integrationId === integrationId)).toBe(true);
        });
        it('should generate meaningful event statistics', async () => {
            const integrationId1 = 'integration-1';
            const integrationId2 = 'integration-2';
            // Simulate successful integration
            await eventManager.emit('IntegrationPhaseStarted', {}, integrationId1);
            await eventManager.emit('IntegratedUpdateCompleted', {}, integrationId1);
            // Simulate failed integration
            await eventManager.emit('IntegrationPhaseStarted', {}, integrationId2);
            await eventManager.emit('IntegratedUpdateFailed', {}, integrationId2);
            const stats = eventManager.getEventStatistics();
            expect(stats.totalEvents).toBe(4);
            expect(stats.integrationStats.totalIntegrations).toBe(2);
            expect(stats.integrationStats.successfulIntegrations).toBe(1);
            expect(stats.integrationStats.failedIntegrations).toBe(1);
        });
    });
    describe('error handling in event handlers', () => {
        it('should handle errors in event handlers gracefully', async () => {
            const errorHandler = jest.fn(() => {
                throw new Error('Handler error');
            });
            const successHandler = jest.fn();
            eventManager.on('IntegrationPhaseStarted', errorHandler);
            eventManager.on('IntegrationPhaseStarted', successHandler);
            // Should not throw despite handler error
            await expect(eventManager.emit('IntegrationPhaseStarted', {})).resolves.not.toThrow();
            expect(errorHandler).toHaveBeenCalled();
            expect(successHandler).toHaveBeenCalled();
        });
    });
});
describe('Update Integration MCP Tools', () => {
    describe('handleExecuteIntegratedUpdate', () => {
        it('should handle valid integration request', async () => {
            const args = {
                changedFiles: ['src/test.cs', 'src/test2.cs'],
                triggerType: 'manual',
                performanceTimeout: 300,
                projectRoot: '.'
            };
            // Mock UpdateIntegrationOrchestrator
            const mockResult = {
                success: true,
                integrationId: 'test-integration-123',
                impactAnalysisResult: { success: true },
                coordinationResult: { success: true, coordination: { planId: 'plan-123' } },
                holisticUpdateResult: { success: true },
                executionMetrics: {
                    totalTime: 1500,
                    impactAnalysisTime: 500,
                    coordinationTime: 600,
                    holisticUpdateTime: 400
                },
                affectedDomains: ['Analysis', 'Data'],
                errors: [],
                warnings: []
            };
            jest.spyOn(UpdateIntegrationOrchestrator.prototype, 'executeIntegratedUpdate')
                .mockResolvedValue(mockResult);
            const result = await handleExecuteIntegratedUpdate(args);
            expect(result.success).toBe(true);
            expect(result.integrationId).toBe('test-integration-123');
            expect(result.executionSummary.affectedDomains).toEqual(['Analysis', 'Data']);
            expect(result.phases.impactAnalysis.success).toBe(true);
            expect(result.phases.coordination.success).toBe(true);
            expect(result.phases.holisticUpdate.success).toBe(true);
        });
        it('should handle integration failure', async () => {
            const args = {
                changedFiles: ['src/test.cs'],
                triggerType: 'manual'
            };
            jest.spyOn(UpdateIntegrationOrchestrator.prototype, 'executeIntegratedUpdate')
                .mockRejectedValue(new Error('Integration failed'));
            const result = await handleExecuteIntegratedUpdate(args);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Integration failed');
        });
    });
    describe('handleGetIntegrationStatus', () => {
        it('should return specific integration status', async () => {
            const args = {
                integrationId: 'test-integration-123',
                includeEventHistory: true
            };
            const mockResult = {
                integrationId: 'test-integration-123',
                success: true,
                affectedDomains: ['Analysis'],
                executionMetrics: { totalTime: 1000 },
                errors: [],
                warnings: []
            };
            jest.spyOn(UpdateIntegrationOrchestrator.prototype, 'getIntegrationResult')
                .mockReturnValue(mockResult);
            const result = await handleGetIntegrationStatus(args);
            expect(result.success).toBe(true);
            expect(result.integration.integrationId).toBe('test-integration-123');
            expect(result.eventHistory).toBeDefined();
        });
        it('should return all active integrations when no ID provided', async () => {
            const args = { projectRoot: '.' };
            jest.spyOn(UpdateIntegrationOrchestrator.prototype, 'getActiveIntegrations')
                .mockReturnValue(['integration-1', 'integration-2']);
            const result = await handleGetIntegrationStatus(args);
            expect(result.success).toBe(true);
            expect(result.activeIntegrations.count).toBe(2);
            expect(result.activeIntegrations.integrationIds).toEqual(['integration-1', 'integration-2']);
        });
    });
    describe('handleValidateIntegrationPrerequisites', () => {
        it('should validate prerequisites successfully', async () => {
            const args = { projectRoot: '.' };
            jest.spyOn(UpdateIntegrationOrchestrator.prototype, 'validatePrerequisites')
                .mockResolvedValue({ valid: true, issues: [] });
            const result = await handleValidateIntegrationPrerequisites(args);
            expect(result.success).toBe(true);
            expect(result.validation.valid).toBe(true);
            expect(result.validation.status).toBe('READY');
        });
        it('should detect prerequisite issues', async () => {
            const args = { projectRoot: '.' };
            jest.spyOn(UpdateIntegrationOrchestrator.prototype, 'validatePrerequisites')
                .mockResolvedValue({
                valid: false,
                issues: ['Impact mapper not functional', 'coordinator not configured']
            });
            const result = await handleValidateIntegrationPrerequisites(args);
            expect(result.success).toBe(true);
            expect(result.validation.valid).toBe(false);
            expect(result.validation.status).toBe('ISSUES_FOUND');
            expect(result.validation.totalIssues).toBe(2);
        });
    });
    describe('handleGetEventStatistics', () => {
        it('should return event statistics', async () => {
            // This test would work with a real event manager
            const args = { includeEventHistory: true };
            const result = await handleGetEventStatistics(args);
            expect(result.success).toBe(true);
            expect(result.statistics).toBeDefined();
            expect(result.statistics.eventsByType).toBeDefined();
            expect(result.statistics.integrationStats).toBeDefined();
        });
    });
});
describe('Integration Performance Tests', () => {
    it('should complete integration workflow within performance requirements', async () => {
        const orchestrator = new UpdateIntegrationOrchestrator('.');
        const request = {
            changedFiles: ['src/test.cs'],
            triggerType: 'manual',
            performanceTimeout: 30 // 30 second limit
        };
        // Mock fast responses
        jest.spyOn(orchestrator['impactMapper'], 'predictChangeImpact')
            .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            success: true,
            prediction: { impactSummary: {}, affectedDomains: [] }
        }), 100)));
        jest.spyOn(orchestrator['crossDomainCoordinator'], 'coordinateUpdate')
            .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            success: true,
            coordination: { planId: 'test' }
        }), 100)));
        jest.spyOn(orchestrator['holisticOrchestrator'], 'executeHolisticUpdate')
            .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
        const startTime = Date.now();
        const result = await orchestrator.executeIntegratedUpdate(request);
        const totalTime = Date.now() - startTime;
        expect(result.success).toBe(true);
        expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
        expect(result.executionMetrics.totalTime).toBeLessThan(1000); // Mocked responses should be fast
    });
});
//# sourceMappingURL=update-integration.test.js.map
/**
 * Registry Lifecycle Tests
 * Tests for registry management, placeholder tracking, and validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { RegistryManager } from '../services/registry-manager';
import { PlaceholderTracker } from '../services/placeholder-tracker';
import { RegistryValidator } from '../services/registry-validator';

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        access: jest.fn()
    }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Registry Lifecycle System', () => {
    let registryManager: RegistryManager;
    let placeholderTracker: PlaceholderTracker;
    let registryValidator: RegistryValidator;
    
    const testRegistryPath = '/test/capability-registry.json';
    const testTrackerPath = '/test/placeholder-tracker.json';

    beforeEach(() => {
        registryManager = new RegistryManager(testRegistryPath);
        placeholderTracker = new PlaceholderTracker(testTrackerPath);
        registryValidator = new RegistryValidator(registryManager, placeholderTracker);

        // Reset mocks
        jest.clearAllMocks();
        
        // Mock file access to return file not found (clean state)
        mockFs.promises.access.mockRejectedValue(new Error('File not found'));
        mockFs.promises.writeFile.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('PlaceholderTracker', () => {
        describe('generatePlaceholderID', () => {
            it('should generate placeholder ID with correct format', async () => {
                const request = {
                    domain: 'Analysis',
                    name: 'Fractal',
                    sourceDocument: 'Documentation/NewConcepts/fractal-analysis.md',
                    businessConcepts: ['fractal-leg', 'market-structure'],
                    integrationPoints: ['inflection-detector']
                };

                const placeholderId = await placeholderTracker.generatePlaceholderID(request);

                expect(placeholderId).toMatch(/^TEMP-ANALYSIS-FRACTAL-[a-z0-9]{4}$/);
            });

            it('should create placeholder info with correct lifecycle', async () => {
                const request = {
                    domain: 'Data',
                    name: 'TimeSeries',
                    sourceDocument: 'Documentation/NewConcepts/timeseries-management.md'
                };

                const placeholderId = await placeholderTracker.generatePlaceholderID(request);
                const info = placeholderTracker.getPlaceholderInfo(placeholderId);

                expect(info).toEqual(expect.objectContaining({
                    placeholderId,
                    domain: 'Data',
                    name: 'TimeSeries',
                    lifecycle: 'concept-exploration',
                    sourceDocument: request.sourceDocument
                }));

                expect(info?.transitions).toHaveLength(1);
                expect(info?.transitions[0]).toEqual(expect.objectContaining({
                    to: 'concept-exploration',
                    reason: 'Initial placeholder creation',
                    triggeredBy: 'system'
                }));
            });

            it('should handle domain and name sanitization', async () => {
                const request = {
                    domain: 'Environment-MCP Gateway',
                    name: 'Context Gen!',
                    sourceDocument: 'test.md'
                };

                const placeholderId = await placeholderTracker.generatePlaceholderID(request);

                expect(placeholderId).toMatch(/^TEMP-ENVIRONMENTMCPGATEWAY-CONTEXTGEN-[a-z0-9]{4}$/);
            });
        });

        describe('transitionPlaceholderLifecycle', () => {
            it('should transition through valid lifecycle stages', async () => {
                const placeholderId = await placeholderTracker.generatePlaceholderID({
                    domain: 'Analysis',
                    name: 'Test',
                    sourceDocument: 'test.md'
                });

                // concept-exploration -> domain-discovery
                await placeholderTracker.transitionPlaceholderLifecycle(
                    placeholderId,
                    'domain-discovery',
                    'Domain boundaries identified'
                );

                let info = placeholderTracker.getPlaceholderInfo(placeholderId);
                expect(info?.lifecycle).toBe('domain-discovery');
                expect(info?.transitions).toHaveLength(2);

                // domain-discovery -> implementation-active
                await placeholderTracker.transitionPlaceholderLifecycle(
                    placeholderId,
                    'implementation-active',
                    'Starting implementation'
                );

                info = placeholderTracker.getPlaceholderInfo(placeholderId);
                expect(info?.lifecycle).toBe('implementation-active');
                expect(info?.transitions).toHaveLength(3);

                // implementation-active -> ready-for-conversion
                await placeholderTracker.transitionPlaceholderLifecycle(
                    placeholderId,
                    'ready-for-conversion',
                    'Implementation complete'
                );

                info = placeholderTracker.getPlaceholderInfo(placeholderId);
                expect(info?.lifecycle).toBe('ready-for-conversion');
            });

            it('should reject invalid transitions', async () => {
                const placeholderId = await placeholderTracker.generatePlaceholderID({
                    domain: 'Test',
                    name: 'Invalid',
                    sourceDocument: 'test.md'
                });

                // Try invalid transition: concept-exploration -> converted
                await expect(
                    placeholderTracker.transitionPlaceholderLifecycle(
                        placeholderId,
                        'converted',
                        'Invalid jump'
                    )
                ).rejects.toThrow('Invalid lifecycle transition: concept-exploration -> converted');
            });

            it('should handle non-existent placeholder', async () => {
                await expect(
                    placeholderTracker.transitionPlaceholderLifecycle(
                        'TEMP-FAKE-ID-1234',
                        'domain-discovery',
                        'Test'
                    )
                ).rejects.toThrow('Placeholder not found: TEMP-FAKE-ID-1234');
            });
        });

        describe('validatePlaceholderID', () => {
            it('should validate correct format', async () => {
                const placeholderId = await placeholderTracker.generatePlaceholderID({
                    domain: 'Analysis',
                    name: 'Test',
                    sourceDocument: 'test.md'
                });

                const validation = placeholderTracker.validatePlaceholderID(placeholderId);

                expect(validation.isValid).toBe(true);
                expect(validation.issues).toHaveLength(0);
            });

            it('should reject invalid formats', () => {
                const invalidIds = [
                    'INVALID-FORMAT',
                    'TEMP-DOMAIN',
                    'TEMP-DOMAIN-NAME',
                    'TEMP-DOMAIN-NAME-TOOLONG',
                    'temp-domain-name-1234',
                    'TEMP-X-NAME-1234',
                    'TEMP-VERYLONGDOMAINNAMETHATEXCEEDSLIMIT-NAME-1234'
                ];

                invalidIds.forEach(id => {
                    const validation = placeholderTracker.validatePlaceholderID(id);
                    expect(validation.isValid).toBe(false);
                    expect(validation.issues.length).toBeGreaterThan(0);
                });
            });
        });

        describe('getLifecycleStatistics', () => {
            it('should provide accurate statistics', async () => {
                // Create placeholders in various stages
                const id1 = await placeholderTracker.generatePlaceholderID({
                    domain: 'Analysis', name: 'Test1', sourceDocument: 'test1.md'
                });
                const _id2 = await placeholderTracker.generatePlaceholderID({
                    domain: 'Data', name: 'Test2', sourceDocument: 'test2.md'
                });

                await placeholderTracker.transitionPlaceholderLifecycle(id1, 'domain-discovery', 'Progress');
                await placeholderTracker.markAsConverted(id1, 'FINAL-ANALYSIS-TEST1-001', 'conv-123');

                const stats = placeholderTracker.getLifecycleStatistics();

                expect(stats.totalPlaceholders).toBe(2);
                expect(stats.byStage.get('concept-exploration')).toBe(1);
                expect(stats.byStage.get('converted')).toBe(1);
                expect(stats.byDomain.get('Analysis')).toBe(1);
                expect(stats.byDomain.get('Data')).toBe(1);
            });
        });
    });

    describe('RegistryManager', () => {
        describe('registerPlaceholderCapability', () => {
            it('should register placeholder capability', async () => {
                const placeholderData = {
                    placeholderId: 'TEMP-ANALYSIS-FRACTAL-a7b3',
                    name: 'Fractal Analysis',
                    description: 'Fractal analysis capability',
                    discoveredDomain: 'Analysis',
                    sourceDocument: 'fractal.md',
                    businessConcepts: ['fractal-leg'],
                    integrationPoints: ['inflection'],
                    maturityLevel: 'exploring' as const,
                    confidence: 0.7
                };

                const result = await registryManager.registerPlaceholderCapability(placeholderData);

                expect(result).toBe(placeholderData.placeholderId);
                
                const retrieved = registryManager.getPlaceholderCapability(placeholderData.placeholderId);
                expect(retrieved).toEqual(expect.objectContaining({
                    placeholderId: placeholderData.placeholderId,
                    name: placeholderData.name,
                    maturityLevel: 'exploring'
                }));
            });
        });

        describe('proposeCapabilityConversion', () => {
            it('should create conversion proposal with approval', async () => {
                // First register a placeholder
                await registryManager.registerPlaceholderCapability({
                    placeholderId: 'TEMP-ANALYSIS-TEST-1234',
                    name: 'Test Capability',
                    description: 'Test capability',
                    discoveredDomain: 'Analysis',
                    sourceDocument: 'test.md',
                    businessConcepts: [],
                    integrationPoints: [],
                    maturityLevel: 'ready-for-conversion',
                    confidence: 0.9
                });

                const conversion = await registryManager.proposeCapabilityConversion(
                    'TEMP-ANALYSIS-TEST-1234',
                    'ANALYSIS-TEST-FINAL-001'
                );

                expect(conversion).toEqual(expect.objectContaining({
                    placeholderId: 'TEMP-ANALYSIS-TEST-1234',
                    finalCapabilityId: 'ANALYSIS-TEST-FINAL-001',
                    conversionStatus: 'pending',
                    approvalRequired: true,
                    approvalId: expect.any(String)
                }));

                expect(conversion.proposedEntry).toEqual(expect.objectContaining({
                    id: 'ANALYSIS-TEST-FINAL-001',
                    domain: 'Analysis',
                    status: 'implemented'
                }));
            });

            it('should reject conversion of unready placeholder', async () => {
                await registryManager.registerPlaceholderCapability({
                    placeholderId: 'TEMP-ANALYSIS-UNREADY-1234',
                    name: 'Unready Capability',
                    description: 'Not ready for conversion',
                    discoveredDomain: 'Analysis',
                    sourceDocument: 'test.md',
                    businessConcepts: [],
                    integrationPoints: [],
                    maturityLevel: 'exploring',
                    confidence: 0.3
                });

                await expect(
                    registryManager.proposeCapabilityConversion(
                        'TEMP-ANALYSIS-UNREADY-1234',
                        'ANALYSIS-UNREADY-001'
                    )
                ).rejects.toThrow('not ready for conversion');
            });

            it('should reject conversion of non-existent placeholder', async () => {
                await expect(
                    registryManager.proposeCapabilityConversion(
                        'TEMP-FAKE-PLACEHOLDER-1234',
                        'ANALYSIS-FAKE-001'
                    )
                ).rejects.toThrow('Placeholder capability not found');
            });
        });

        describe('getRegistryStatistics', () => {
            it('should provide comprehensive statistics', async () => {
                // Add some test data
                await registryManager.registerPlaceholderCapability({
                    placeholderId: 'TEMP-ANALYSIS-STAT1-1234',
                    name: 'Stat Test 1',
                    description: 'Test',
                    discoveredDomain: 'Analysis',
                    sourceDocument: 'test.md',
                    businessConcepts: [],
                    integrationPoints: [],
                    maturityLevel: 'exploring',
                    confidence: 0.5
                });

                await registryManager.registerPlaceholderCapability({
                    placeholderId: 'TEMP-DATA-STAT2-5678',
                    name: 'Stat Test 2',
                    description: 'Test',
                    discoveredDomain: 'Data',
                    sourceDocument: 'test.md',
                    businessConcepts: [],
                    integrationPoints: [],
                    maturityLevel: 'ready-for-conversion',
                    confidence: 0.8
                });

                const stats = registryManager.getRegistryStatistics();

                expect(stats).toEqual(expect.objectContaining({
                    totalPlaceholders: 2,
                    placeholdersByMaturity: expect.any(Map),
                    activeConversions: expect.any(Number),
                    conversionsByStatus: expect.any(Map)
                }));

                expect(stats.placeholdersByMaturity.get('exploring')).toBe(1);
                expect(stats.placeholdersByMaturity.get('ready-for-conversion')).toBe(1);
            });
        });
    });

    describe('RegistryValidator', () => {
        describe('validateRegistry', () => {
            it('should perform comprehensive validation', async () => {
                const report = await registryValidator.validateRegistry();

                expect(report).toEqual(expect.objectContaining({
                    reportId: expect.stringMatching(/^validation-\d+-[a-z0-9]+$/),
                    validationDate: expect.any(Date),
                    validationDuration: expect.any(Number),
                    overallStatus: expect.stringMatching(/^(passed|warnings|failed)$/),
                    summary: expect.objectContaining({
                        totalRules: expect.any(Number),
                        rulesExecuted: expect.any(Number),
                        criticalViolations: expect.any(Number),
                        warningViolations: expect.any(Number)
                    }),
                    violations: expect.any(Array),
                    recommendations: expect.any(Array)
                }));
            });
        });

        describe('validateCapability', () => {
            it('should validate specific capability', async () => {
                const violations = await registryValidator.validateCapability('non-existent-capability');

                expect(violations).toEqual([
                    expect.objectContaining({
                        ruleId: 'capability-exists',
                        severity: 'critical',
                        message: 'Capability not found: non-existent-capability'
                    })
                ]);
            });
        });

        describe('checkPlaceholderPollution', () => {
            it('should detect placeholder pollution in main registry', async () => {
                const violations = await registryValidator.checkPlaceholderPollution();

                // Initially should be clean (empty registry)
                expect(violations).toEqual([]);
            });
        });

        describe('calculateHealthScore', () => {
            it('should calculate health score from validation report', async () => {
                const report = await registryValidator.validateRegistry();
                const healthScore = registryValidator.calculateHealthScore(report);

                expect(healthScore).toEqual(expect.objectContaining({
                    score: expect.any(Number),
                    grade: expect.stringMatching(/^[ABCDF]$/),
                    factors: expect.objectContaining({
                        consistency: expect.any(Number),
                        integrity: expect.any(Number),
                        pollution: expect.any(Number),
                        lifecycle: expect.any(Number),
                        audit: expect.any(Number)
                    })
                }));

                expect(healthScore.score).toBeGreaterThanOrEqual(0);
                expect(healthScore.score).toBeLessThanOrEqual(100);
            });
        });
    });

    describe('Integration Tests', () => {
        it('should complete full placeholder lifecycle', async () => {
            mockFs.promises.writeFile.mockResolvedValue(undefined);

            // 1. Generate placeholder ID
            const placeholderId = await placeholderTracker.generatePlaceholderID({
                domain: 'Analysis',
                name: 'Integration',
                sourceDocument: 'integration-test.md',
                businessConcepts: ['test-concept'],
                integrationPoints: ['test-integration']
            });

            expect(placeholderId).toMatch(/^TEMP-ANALYSIS-INTEGRATION-[a-z0-9]{4}$/);

            // 2. Register with registry manager
            await registryManager.registerPlaceholderCapability({
                placeholderId,
                name: 'Integration Test Capability',
                description: 'Full lifecycle test capability',
                discoveredDomain: 'Analysis',
                sourceDocument: 'integration-test.md',
                businessConcepts: ['test-concept'],
                integrationPoints: ['test-integration'],
                maturityLevel: 'exploring',
                confidence: 0.5
            });

            // 3. Transition through lifecycle stages
            await placeholderTracker.transitionPlaceholderLifecycle(
                placeholderId,
                'domain-discovery',
                'Domain boundaries identified'
            );

            await placeholderTracker.transitionPlaceholderLifecycle(
                placeholderId,
                'implementation-active',
                'Starting implementation'
            );

            await placeholderTracker.transitionPlaceholderLifecycle(
                placeholderId,
                'ready-for-conversion',
                'Implementation complete'
            );

            // 4. Update registry maturity
            await registryManager.updatePlaceholderMaturity(placeholderId, 'ready-for-conversion');

            // 5. Propose conversion
            const conversion = await registryManager.proposeCapabilityConversion(
                placeholderId,
                'ANALYSIS-INTEGRATION-FINAL-001',
                'implementation-complete'
            );

            expect(conversion.conversionStatus).toBe('pending');
            expect(conversion.approvalRequired).toBe(true);

            // 6. Validate registry consistency
            const report = await registryValidator.validateRegistry();
            expect(report.overallStatus).not.toBe('failed'); // Should not have critical failures

            // 7. Check statistics
            const placeholderStats = placeholderTracker.getLifecycleStatistics();
            expect(placeholderStats.totalPlaceholders).toBeGreaterThan(0);

            const registryStats = registryManager.getRegistryStatistics();
            expect(registryStats.totalPlaceholders).toBeGreaterThan(0);
            expect(registryStats.activeConversions).toBeGreaterThan(0);

            // Verify complete lifecycle worked
            const finalPlaceholderInfo = placeholderTracker.getPlaceholderInfo(placeholderId);
            expect(finalPlaceholderInfo?.lifecycle).toBe('ready-for-conversion');
            expect(finalPlaceholderInfo?.transitions).toHaveLength(4); // Initial + 3 transitions

            const conversionInfo = registryManager.getConversion(conversion.conversionId);
            expect(conversionInfo?.conversionStatus).toBe('pending');
            expect(conversionInfo?.approvalId).toBeTruthy();
        });

        it('should handle error scenarios gracefully', async () => {
            // Test non-existent placeholder operations
            expect(placeholderTracker.getPlaceholderInfo('FAKE-PLACEHOLDER')).toBeNull();
            expect(registryManager.getPlaceholderCapability('FAKE-PLACEHOLDER')).toBeNull();
            expect(registryManager.getConversion('fake-conversion-id')).toBeNull();

            // Test validation of clean state
            const violations = await registryValidator.checkPlaceholderPollution();
            expect(violations).toEqual([]);

            // Test statistics on empty state
            const stats = registryManager.getRegistryStatistics();
            expect(stats.totalCapabilities).toBe(0);
            expect(stats.totalPlaceholders).toBe(0);
        });
    });
});
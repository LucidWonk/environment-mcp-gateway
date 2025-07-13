import { AzureDevOpsAdapter, AzureDevOpsHealth } from '../../src/adapters/azure-devops-adapter';

// Integration tests for Azure DevOps adapter
// These tests will only run if Azure DevOps credentials are configured
describe('Azure DevOps Integration Tests', () => {
    let adapter: AzureDevOpsAdapter;
    let isConfigured: boolean;

    beforeAll(() => {
        adapter = new AzureDevOpsAdapter();
        // Check if Azure DevOps is properly configured
        isConfigured = !!(adapter.organization && adapter.pat && adapter.project);
        
        if (!isConfigured) {
            console.warn('Azure DevOps not configured - skipping integration tests');
            console.warn('Set AZURE_DEVOPS_ORGANIZATION, AZURE_DEVOPS_PROJECT, and AZURE_DEVOPS_PAT to run these tests');
        }
    });

    describe('Azure DevOps Connection Test', () => {
        test('should successfully connect to Azure DevOps API', async () => {
            if (!isConfigured) {
                console.log('Skipping connection test - Azure DevOps not configured');
                return;
            }

            const health: AzureDevOpsHealth = await adapter.getAzureDevOpsHealth();
            
            expect(health.connected).toBe(true);
            expect(health.organization).toBe(adapter.organization);
            expect(health.project).toBe(adapter.project);
            expect(health.apiVersion).toBe('7.0');
            expect(health.issues).toHaveLength(0);
            expect(health.message).toBe('Azure DevOps connection healthy');
        });

        test('should list pipelines successfully', async () => {
            if (!isConfigured) {
                console.log('Skipping pipeline listing test - Azure DevOps not configured');
                return;
            }

            const pipelines = await adapter.listPipelines();
            
            expect(Array.isArray(pipelines)).toBe(true);
            
            if (pipelines.length > 0) {
                const pipeline = pipelines[0];
                expect(pipeline).toHaveProperty('id');
                expect(pipeline).toHaveProperty('name');
                expect(pipeline).toHaveProperty('url');
                expect(pipeline).toHaveProperty('type');
                expect(['yaml', 'classic']).toContain(pipeline.type);
                expect(pipeline).toHaveProperty('createdDate');
                expect(pipeline.createdDate).toBeInstanceOf(Date);
            }
        });

        test('should get pipeline status for existing pipeline', async () => {
            if (!isConfigured) {
                console.log('Skipping pipeline status test - Azure DevOps not configured');
                return;
            }

            const pipelines = await adapter.listPipelines();
            
            if (pipelines.length === 0) {
                console.log('No pipelines found to test status');
                return;
            }

            const pipelineId = pipelines[0].id;
            const status = await adapter.getPipelineStatus(pipelineId);
            
            expect(status).toHaveProperty('pipeline');
            expect(status).toHaveProperty('recentRuns');
            expect(status).toHaveProperty('health');
            expect(status).toHaveProperty('message');
            expect(status.pipeline.id).toBe(pipelineId);
            expect(['healthy', 'degraded', 'failed']).toContain(status.health);
            expect(Array.isArray(status.recentRuns)).toBe(true);
        });

        test('should handle pipeline not found error gracefully', async () => {
            if (!isConfigured) {
                console.log('Skipping pipeline not found test - Azure DevOps not configured');
                return;
            }

            const nonExistentPipelineId = 999999;
            
            await expect(adapter.getPipelineStatus(nonExistentPipelineId))
                .rejects.toThrow(/404|not found/i);
        });

        test('should retrieve build logs if recent runs exist', async () => {
            if (!isConfigured) {
                console.log('Skipping build logs test - Azure DevOps not configured');
                return;
            }

            const pipelines = await adapter.listPipelines();
            
            if (pipelines.length === 0) {
                console.log('No pipelines found to test build logs');
                return;
            }

            const pipelineId = pipelines[0].id;
            const status = await adapter.getPipelineStatus(pipelineId);
            
            if (status.recentRuns.length === 0) {
                console.log('No recent runs found to test build logs');
                return;
            }

            const runId = status.recentRuns[0].id;
            
            // This might fail if the run doesn't have logs, which is acceptable
            try {
                const logs = await adapter.getBuildLogs(runId);
                expect(logs).toHaveProperty('value');
                expect(logs).toHaveProperty('count');
                expect(typeof logs.value).toBe('string');
                expect(typeof logs.count).toBe('number');
            } catch (error) {
                console.log(`Build logs not available for run ${runId}:`, (error as Error).message);
                // This is acceptable - not all runs have accessible logs
            }
        });
    });

    describe('Azure DevOps Error Scenarios', () => {
        test('should handle authentication errors properly', async () => {
            // Create adapter with invalid PAT
            const invalidAdapter = new (class extends AzureDevOpsAdapter {
                constructor() {
                    super();
                    (this as any).pat = 'invalid-pat-token';
                }
            })();

            await expect(invalidAdapter.listPipelines())
                .rejects.toThrow(/401|unauthorized|authentication/i);
        });

        test('should handle non-existent organization gracefully', async () => {
            if (!process.env.AZURE_DEVOPS_PAT) {
                console.log('Skipping organization test - no PAT available');
                return;
            }

            // Create adapter with invalid organization
            const invalidOrgAdapter = new (class extends AzureDevOpsAdapter {
                constructor() {
                    super();
                    (this as any).organization = 'non-existent-org-' + Date.now();
                    (this as any).baseUrl = `https://dev.azure.com/${this.organization}/${this.project}/_apis`;
                }
            })();

            await expect(invalidOrgAdapter.listPipelines())
                .rejects.toThrow(/404|not found/i);
        });
    });

    describe('Performance Tests', () => {
        test('should list pipelines within reasonable time', async () => {
            if (!isConfigured) {
                console.log('Skipping performance test - Azure DevOps not configured');
                return;
            }

            const startTime = Date.now();
            await adapter.listPipelines();
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        });

        test('should get health status within reasonable time', async () => {
            if (!isConfigured) {
                console.log('Skipping health performance test - Azure DevOps not configured');
                return;
            }

            const startTime = Date.now();
            await adapter.getAzureDevOpsHealth();
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });
});

// Test configuration validation
describe('Azure DevOps Configuration Validation', () => {
    test('should properly validate configuration completeness', () => {
        const adapter = new AzureDevOpsAdapter();
        
        // Check if configuration is complete
        const isComplete = !!(adapter.organization && adapter.pat && adapter.project);
        
        if (isComplete) {
            expect(adapter.organization).toBeTruthy();
            expect(adapter.project).toBeTruthy();
            expect(adapter.pat).toBeTruthy();
            expect(adapter.baseUrl).toContain(adapter.organization);
            expect(adapter.baseUrl).toContain(adapter.project);
        } else {
            console.log('Azure DevOps configuration incomplete - this is expected in some environments');
        }
    });

    test('should have correct API version', () => {
        const adapter = new AzureDevOpsAdapter();
        expect(adapter.apiVersion).toBe('7.0');
    });

    test('should construct correct base URL', () => {
        const adapter = new AzureDevOpsAdapter();
        
        if (adapter.organization && adapter.project) {
            expect(adapter.baseUrl).toMatch(/^https:\/\/dev\.azure\.com\/.+\/.+\/_apis$/);
        }
    });
});
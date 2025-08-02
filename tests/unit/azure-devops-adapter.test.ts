import { AzureDevOpsAdapter, PipelineInfo, PipelineRun, BuildLog } from '../../src/adapters/azure-devops-adapter';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock winston logger
jest.mock('winston', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })),
    format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        errors: jest.fn(),
        json: jest.fn()
    },
    transports: {
        Console: jest.fn(),
        File: jest.fn()
    }
}));

// Mock environment module
jest.mock('../../src/domain/config/environment', () => ({
    Environment: {
        azureDevOpsOrganization: 'test-org',
        azureDevOpsProject: 'test-project',
        azureDevOpsPAT: 'test-pat-token',
        azureDevOpsApiUrl: 'https://dev.azure.com',
        mcpLogLevel: 'info'
    }
}));

describe('Azure DevOps Adapter', () => {
    let adapter: AzureDevOpsAdapter;

    beforeEach(() => {
        jest.clearAllMocks();
        adapter = new AzureDevOpsAdapter();
    });

    describe('Pipeline Interface Validation', () => {
        test('PipelineInfo interface should match Azure DevOps API response structure', () => {
            const mockApiResponse = {
                id: 123,
                name: 'Test Pipeline',
                folder: '\\MyFolder',
                configuration: {
                    type: 'yaml',
                    repository: {
                        name: 'test-repo',
                        type: 'TfsGit',
                        url: 'https://dev.azure.com/test-org/test-project/_git/test-repo',
                        defaultBranch: 'refs/heads/main'
                    }
                },
                url: 'https://dev.azure.com/test-org/test-project/_apis/pipelines/123',
                revision: 5,
                createdDate: '2023-01-01T00:00:00Z',
                queueStatus: 'enabled',
                quality: 'definition',
                authoredBy: {
                    displayName: 'Test User',
                    uniqueName: 'test@example.com',
                    id: 'user-123'
                }
            };

            // Verify the interface can be constructed from API response
            const pipelineInfo: PipelineInfo = {
                id: mockApiResponse.id,
                name: mockApiResponse.name,
                folder: mockApiResponse.folder,
                type: mockApiResponse.configuration.type as 'yaml',
                url: mockApiResponse.url,
                revision: mockApiResponse.revision,
                createdDate: new Date(mockApiResponse.createdDate),
                queueStatus: mockApiResponse.queueStatus as 'enabled',
                quality: mockApiResponse.quality as 'definition',
                authoredBy: mockApiResponse.authoredBy,
                repository: mockApiResponse.configuration.repository
            };

            expect(pipelineInfo.id).toBe(123);
            expect(pipelineInfo.name).toBe('Test Pipeline');
            expect(pipelineInfo.type).toBe('yaml');
            expect(pipelineInfo.repository?.name).toBe('test-repo');
        });

        test('PipelineRun interface should match Azure DevOps API response structure', () => {
            const mockApiResponse = {
                id: 456,
                name: 'Test Run',
                state: 'completed',
                result: 'succeeded',
                createdDate: '2023-01-01T00:00:00Z',
                finishedDate: '2023-01-01T01:00:00Z',
                url: 'https://dev.azure.com/test-org/test-project/_apis/pipelines/runs/456',
                pipeline: {
                    id: 123,
                    name: 'Test Pipeline',
                    url: 'https://dev.azure.com/test-org/test-project/_apis/pipelines/123',
                    folder: '\\MyFolder'
                },
                resources: {
                    repositories: {
                        self: {
                            repository: { id: 'repo-123', type: 'TfsGit' },
                            refName: 'refs/heads/main',
                            version: 'abc123'
                        }
                    }
                },
                variables: {
                    testVar: { value: 'testValue', isSecret: false }
                },
                requestedBy: {
                    displayName: 'Test User',
                    uniqueName: 'test@example.com',
                    id: 'user-123'
                },
                requestedFor: {
                    displayName: 'Test User',
                    uniqueName: 'test@example.com',
                    id: 'user-123'
                }
            };

            const pipelineRun: PipelineRun = {
                id: mockApiResponse.id,
                name: mockApiResponse.name,
                status: mockApiResponse.state as 'completed',
                result: mockApiResponse.result as 'succeeded',
                state: mockApiResponse.state as 'completed',
                createdDate: new Date(mockApiResponse.createdDate),
                finishedDate: new Date(mockApiResponse.finishedDate),
                url: mockApiResponse.url,
                pipeline: mockApiResponse.pipeline,
                resources: mockApiResponse.resources,
                variables: mockApiResponse.variables,
                requestedBy: mockApiResponse.requestedBy,
                requestedFor: mockApiResponse.requestedFor
            };

            expect(pipelineRun.id).toBe(456);
            expect(pipelineRun.status).toBe('completed');
            expect(pipelineRun.result).toBe('succeeded');
            expect(pipelineRun.pipeline.id).toBe(123);
        });

        test('BuildLog interface should match Azure DevOps API response structure', () => {
            const mockApiResponse = {
                id: 789,
                type: 'Container',
                url: 'https://dev.azure.com/test-org/test-project/_apis/pipelines/runs/456/logs/789',
                lineCount: 150
            };

            const buildLog: BuildLog = {
                id: mockApiResponse.id,
                type: mockApiResponse.type,
                url: mockApiResponse.url,
                lineCount: mockApiResponse.lineCount
            };

            expect(buildLog.id).toBe(789);
            expect(buildLog.type).toBe('Container');
            expect(buildLog.lineCount).toBe(150);
        });
    });

    describe('Azure DevOps Error Handling Tests', () => {
        test('should handle 401 Unauthorized error', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: jest.fn().mockResolvedValue('{"message": "Invalid authentication credentials"}')
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            await expect(adapter.listPipelines()).rejects.toThrow(
                'Azure DevOps API request failed: 401 Unauthorized'
            );
        });

        test('should handle 403 Forbidden error', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                text: jest.fn().mockResolvedValue('{"message": "Access denied to resource"}')
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            await expect(adapter.getPipelineStatus(123)).rejects.toThrow(
                'Azure DevOps API request failed: 403 Forbidden'
            );
        });

        test('should handle 404 Not Found error', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: jest.fn().mockResolvedValue('{"message": "Pipeline not found"}')
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            await expect(adapter.triggerPipeline(999)).rejects.toThrow(
                'Azure DevOps API request failed: 404 Not Found'
            );
        });

        test('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(adapter.getBuildLogs(123)).rejects.toThrow('Network error');
        });
    });

    describe('Azure DevOps Adapter Instantiation', () => {
        test('should instantiate AzureDevOpsAdapter without making API calls', () => {
            const adapter = new AzureDevOpsAdapter();

            expect(adapter.organization).toBe('test-org');
            expect(adapter.project).toBe('test-project');
            expect(adapter.baseUrl).toBe('https://dev.azure.com/test-org/test-project/_apis');
            expect(adapter.apiVersion).toBe('7.0');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('Azure DevOps Method Signatures', () => {
        test('should have all required Azure DevOps methods', () => {
            expect(typeof adapter.listPipelines).toBe('function');
            expect(typeof adapter.triggerPipeline).toBe('function');
            expect(typeof adapter.getPipelineStatus).toBe('function');
            expect(typeof adapter.getBuildLogs).toBe('function');
            expect(typeof adapter.managePipelineVariables).toBe('function');
        });

        test('listPipelines method should have correct signature', () => {
            expect(adapter.listPipelines.length).toBe(1); // optional folder parameter
        });

        test('triggerPipeline method should have correct signature', () => {
            expect(adapter.triggerPipeline.length).toBe(1); // pipelineId (options has default value)
        });

        test('getPipelineStatus method should have correct signature', () => {
            expect(adapter.getPipelineStatus.length).toBe(1); // pipelineId parameter
        });

        test('getBuildLogs method should have correct signature', () => {
            expect(adapter.getBuildLogs.length).toBe(2); // runId and optional logId
        });

        test('managePipelineVariables method should have correct signature', () => {
            expect(adapter.managePipelineVariables.length).toBe(2); // pipelineId and variables
        });

        test('should have additional utility methods', () => {
            expect(typeof adapter.getAuthHeaders).toBe('function');
            expect(typeof adapter.getApiUrl).toBe('function');
            expect(typeof adapter.getAzureDevOpsHealth).toBe('function');
            expect(typeof adapter.getPipelineRun).toBe('function');
            expect(typeof adapter.cancelPipelineRun).toBe('function');
        });
    });

    describe('Authentication', () => {
        test('should generate correct auth headers', () => {
            const headers = adapter.getAuthHeaders();
            
            expect(headers['Authorization']).toMatch(/^Basic /);
            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Accept']).toBe('application/json');
        });

        test('should throw error when PAT is missing', () => {
            // Create adapter with empty PAT
            const emptyPATAdapter = new (class extends AzureDevOpsAdapter {
                constructor() {
                    super();
                    (this as any).pat = '';
                }
            })();

            expect(() => emptyPATAdapter.getAuthHeaders()).toThrow(
                'Azure DevOps PAT token is required for authentication'
            );
        });
    });

    describe('URL Generation', () => {
        test('should generate correct API URLs', () => {
            const endpoint = '/pipelines';
            const url = adapter.getApiUrl(endpoint);
            
            expect(url).toBe('https://dev.azure.com/test-org/test-project/_apis/pipelines');
        });
    });
});
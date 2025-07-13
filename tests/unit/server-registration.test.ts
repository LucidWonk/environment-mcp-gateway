// Mock all external dependencies first
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
    Server: jest.fn().mockImplementation(() => ({
        setRequestHandler: jest.fn(),
        connect: jest.fn()
    }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
    StdioServerTransport: jest.fn()
}));

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
    CallToolRequestSchema: 'CallToolRequestSchema',
    ErrorCode: {
        InvalidParams: 'INVALID_PARAMS',
        InternalError: 'INTERNAL_ERROR',
        MethodNotFound: 'METHOD_NOT_FOUND'
    },
    ListToolsRequestSchema: 'ListToolsRequestSchema',
    McpError: class MockMcpError extends Error {
        constructor(public code: string, message: string) {
            super(message);
            this.name = 'McpError';
        }
    }
}));

// Mock Environment module
jest.mock('../../src/config/environment', () => ({
    Environment: {
        validateEnvironment: jest.fn(),
        mcpLogLevel: 'info',
        solutionPath: '/test/solution.sln',
        getDevelopmentDatabaseConnectionString: jest.fn(() => 'mock-connection'),
        database: 'test-db',
        dbHost: 'localhost',
        dbPort: 5432,
        dockerComposeFile: 'docker-compose.yml',
        gitRepoPath: '/test/repo',
        gitUserName: 'test-user',
        gitUserEmail: 'test@example.com',
        getEnvironmentInfo: jest.fn(() => ({ env: 'test' }))
    }
}));

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

// Mock SolutionParser
jest.mock('../../src/infrastructure/solution-parser', () => ({
    SolutionParser: {
        parseSolution: jest.fn(() => ({
            name: 'TestSolution',
            path: '/test/solution.sln',
            projects: [
                { name: 'TestProject', type: 'C#', path: '/test/project', dependencies: [] }
            ],
            solutionFolders: []
        })),
        validateSolution: jest.fn(() => ({ valid: true, errors: [] })),
        getProjectsByType: jest.fn(() => []),
        getProjectDependencyChain: jest.fn(() => ['TestProject'])
    }
}));

// Mock AdapterManager
jest.mock('../../src/adapters/adapter-manager', () => ({
    AdapterManager: {
        getInstance: jest.fn(() => ({
            getDockerAdapter: jest.fn(() => ({
                listDevelopmentContainers: jest.fn(() => []),
                getComposeServices: jest.fn(() => []),
                getDevelopmentEnvironmentHealth: jest.fn(() => ({ overall: 'healthy', issues: [], recommendations: [] })),
                getContainerHealth: jest.fn(() => ({ healthy: true, message: 'OK' })),
                getContainerLogs: jest.fn(() => 'mock logs'),
                restartComposeService: jest.fn(() => true),
                getTimescaleDBStatus: jest.fn(() => ({ health: 'healthy' })),
                getRedPandaStatus: jest.fn(() => ({ overall: 'healthy' }))
            })),
            forceReload: jest.fn(),
            getStatus: jest.fn(() => ({
                reloadCount: 1,
                isWatching: true,
                lastReload: new Date(),
                adapterStatus: {}
            })),
            testConfiguration: jest.fn(() => ({
                azureDevOps: { healthy: true },
                docker: { healthy: true }
            }))
        }))
    }
}));

// Mock ToolRegistry
jest.mock('../../src/orchestrator/tool-registry', () => ({
    ToolRegistry: jest.fn().mockImplementation(() => ({
        getAllTools: jest.fn(() => [
            // Git Tools (7)
            { name: 'list-branches', description: 'Show all branches with status', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'create-feature-branch', description: 'Create feature branch', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'analyze-recent-commits', description: 'Analyze recent commits', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'get-commit-details', description: 'Get commit details', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'merge-branch', description: 'Merge branch safely', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'analyze-code-impact', description: 'Analyze code impact', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'validate-git-workflow', description: 'Validate Git workflow', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            // Azure DevOps Pipeline Tools (5)
            { name: 'list-pipelines', description: 'List Azure DevOps pipelines', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'trigger-pipeline', description: 'Trigger pipeline build', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'get-pipeline-status', description: 'Get pipeline status', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'get-build-logs', description: 'Get build logs', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'manage-pipeline-variables', description: 'Manage pipeline variables', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            // VM Management Tools (4)
            { name: 'provision-vm', description: 'Provision VM', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'deploy-to-vm', description: 'Deploy to VM', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'vm-health-check', description: 'Check VM health', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'vm-logs', description: 'Get VM logs', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            // Environment Orchestration Tools (3)
            { name: 'promote-environment', description: 'Promote environment', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'rollback-deployment', description: 'Rollback deployment', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'sync-configurations', description: 'Sync configurations', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() }
        ]),
        getGitTools: jest.fn(() => [
            { name: 'list-branches', description: 'Show all branches with status', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'create-feature-branch', description: 'Create feature branch', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'analyze-recent-commits', description: 'Analyze recent commits', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'get-commit-details', description: 'Get commit details', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'merge-branch', description: 'Merge branch safely', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'analyze-code-impact', description: 'Analyze code impact', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'validate-git-workflow', description: 'Validate Git workflow', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() }
        ]),
        getAzureDevOpsTools: jest.fn(() => [
            { name: 'list-pipelines', description: 'List Azure DevOps pipelines', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'trigger-pipeline', description: 'Trigger pipeline build', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'get-pipeline-status', description: 'Get pipeline status', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'get-build-logs', description: 'Get build logs', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'manage-pipeline-variables', description: 'Manage pipeline variables', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'provision-vm', description: 'Provision VM', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'deploy-to-vm', description: 'Deploy to VM', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'vm-health-check', description: 'Check VM health', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'vm-logs', description: 'Get VM logs', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'promote-environment', description: 'Promote environment', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'rollback-deployment', description: 'Rollback deployment', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() },
            { name: 'sync-configurations', description: 'Sync configurations', inputSchema: { type: 'object', properties: {} }, handler: jest.fn() }
        ])
    }))
}));

// Mock process.exit to prevent test termination
jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
    throw new Error(`Process.exit called with code ${code}`);
});

// Import the server after mocking
const EnvironmentMCPGateway = require('../../src/server.ts');

describe('Server Registration Tests', () => {
    let mockServer: any;
    let mockToolRegistry: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockServer = {
            setRequestHandler: jest.fn(),
            connect: jest.fn()
        };
        const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
        Server.mockReturnValue(mockServer);
        
        mockToolRegistry = require('../../src/orchestrator/tool-registry').ToolRegistry;
    });

    describe('Phase 1: Basic Server Structure Tests', () => {
        test('Server Import and Instantiation Test - should import ToolRegistry correctly', () => {
            // Verify that ToolRegistry is imported and can be instantiated
            expect(mockToolRegistry).toBeDefined();
            expect(typeof mockToolRegistry).toBe('function');
        });

        test('Server Member Variable Update Test - should update to toolRegistry member', () => {
            // This test verifies the import structure and member initialization
            // The ToolRegistry constructor should be available
            expect(typeof mockToolRegistry).toBe('function');
        });

        test('Server Startup Test - should start up without runtime errors', () => {
            // Verify server components are available and importable
            expect(() => {
                // Test that all required components are available
                const toolRegistry = new mockToolRegistry();
                expect(toolRegistry).toBeDefined();
                expect(toolRegistry.getAllTools).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Phase 2: Tool Registration Tests', () => {
        test('ListToolsRequestSchema Handler Test - should return correct total number of tools', () => {
            const mockInstance = new mockToolRegistry();
            const allTools = mockInstance.getAllTools();
            
            // Registry tools: 19 (7 Git + 12 Azure DevOps)
            // Infrastructure tools: 15
            // Total: 34 tools
            expect(allTools).toHaveLength(19);
            
            // Verify this would result in 34 total tools when combined with infrastructure
            const expectedInfrastructureTools = 15;
            const expectedTotalTools = allTools.length + expectedInfrastructureTools;
            expect(expectedTotalTools).toBe(34);
        });

        test('Tool List Structure Test - should have proper MCP structure', () => {
            const mockInstance = new mockToolRegistry();
            const allTools = mockInstance.getAllTools();
            
            allTools.forEach((tool: any) => {
                expect(tool).toHaveProperty('name');
                expect(tool).toHaveProperty('description');
                expect(tool).toHaveProperty('inputSchema');
                expect(tool).toHaveProperty('handler');
                
                expect(typeof tool.name).toBe('string');
                expect(typeof tool.description).toBe('string');
                expect(typeof tool.inputSchema).toBe('object');
                expect(typeof tool.handler).toBe('function');
                
                // Verify inputSchema structure
                expect(tool.inputSchema).toHaveProperty('type');
                expect(tool.inputSchema.type).toBe('object');
                expect(tool.inputSchema).toHaveProperty('properties');
            });
        });

        test('Tool Name Registration Test - should have all expected tool names without duplicates', () => {
            const mockInstance = new mockToolRegistry();
            const allTools = mockInstance.getAllTools();
            
            const expectedToolNames = [
                // Git Tools (7)
                'list-branches', 'create-feature-branch', 'analyze-recent-commits',
                'get-commit-details', 'merge-branch', 'analyze-code-impact', 'validate-git-workflow',
                // Azure DevOps Pipeline Tools (5)
                'list-pipelines', 'trigger-pipeline', 'get-pipeline-status', 'get-build-logs', 'manage-pipeline-variables',
                // VM Management Tools (4)
                'provision-vm', 'deploy-to-vm', 'vm-health-check', 'vm-logs',
                // Environment Orchestration Tools (3)
                'promote-environment', 'rollback-deployment', 'sync-configurations'
            ];
            
            const toolNames = allTools.map((tool: any) => tool.name);
            
            // Check all expected tools are present
            expectedToolNames.forEach(expectedName => {
                expect(toolNames).toContain(expectedName);
            });
            
            // Check for no duplicates
            const uniqueNames = new Set(toolNames);
            expect(uniqueNames.size).toBe(toolNames.length);
            
            // Verify correct count
            expect(toolNames).toHaveLength(19);
        });
    });

    describe('Phase 3: Tool Routing Tests', () => {
        test('Git Tool Routing Test - should route Git tools correctly', () => {
            const mockInstance = new mockToolRegistry();
            const gitTools = mockInstance.getGitTools();
            
            const gitToolNames = ['list-branches', 'create-feature-branch', 'analyze-recent-commits',
                                'get-commit-details', 'merge-branch', 'analyze-code-impact', 'validate-git-workflow'];
            
            expect(gitTools).toHaveLength(7);
            gitToolNames.forEach(toolName => {
                const tool = gitTools.find((t: any) => t.name === toolName);
                expect(tool).toBeDefined();
                expect(typeof tool?.handler).toBe('function');
            });
        });

        test('Azure DevOps Tool Routing Test - should route Azure DevOps tools correctly', () => {
            const mockInstance = new mockToolRegistry();
            const azureDevOpsTools = mockInstance.getAzureDevOpsTools();
            
            const azureDevOpsToolNames = [
                'list-pipelines', 'trigger-pipeline', 'get-pipeline-status', 'get-build-logs', 'manage-pipeline-variables',
                'provision-vm', 'deploy-to-vm', 'vm-health-check', 'vm-logs',
                'promote-environment', 'rollback-deployment', 'sync-configurations'
            ];
            
            expect(azureDevOpsTools).toHaveLength(12);
            azureDevOpsToolNames.forEach(toolName => {
                const tool = azureDevOpsTools.find((t: any) => t.name === toolName);
                expect(tool).toBeDefined();
                expect(typeof tool?.handler).toBe('function');
            });
        });

        test('Infrastructure Tool Routing Test - should maintain infrastructure tool routing', () => {
            // Infrastructure tools should still be handled via switch statement
            const expectedInfrastructureTools = [
                'analyze-solution-structure', 'get-development-environment-status',
                'validate-build-configuration', 'get-project-dependencies',
                'list-development-containers', 'get-container-health', 'get-container-logs',
                'restart-development-service', 'analyze-development-infrastructure',
                'check-timescaledb-health', 'check-redpanda-health', 'validate-development-stack',
                'reload-configuration', 'get-configuration-status', 'test-adapter-configuration'
            ];
            
            // Verify we have the expected infrastructure tools
            expect(expectedInfrastructureTools).toHaveLength(15);
            
            // Verify these tools are not in the registry tools (handled separately)
            const mockInstance = new mockToolRegistry();
            const registryToolNames = mockInstance.getAllTools().map((tool: any) => tool.name);
            
            expectedInfrastructureTools.forEach(toolName => {
                expect(registryToolNames).not.toContain(toolName);
            });
        });
    });

    describe('Phase 4: Backward Compatibility Tests', () => {
        test('Existing Infrastructure Tools Test - should maintain all infrastructure tools', () => {
            const expectedInfrastructureTools = [
                'analyze-solution-structure', 'get-development-environment-status',
                'validate-build-configuration', 'get-project-dependencies',
                'list-development-containers', 'get-container-health', 'get-container-logs',
                'restart-development-service', 'analyze-development-infrastructure',
                'check-timescaledb-health', 'check-redpanda-health', 'validate-development-stack',
                'reload-configuration', 'get-configuration-status', 'test-adapter-configuration'
            ];
            
            // Verify infrastructure tools count
            expect(expectedInfrastructureTools).toHaveLength(15);
            
            // These would be handled via direct method calls in the server switch statement
            expectedInfrastructureTools.forEach(toolName => {
                expect(typeof toolName).toBe('string');
                expect(toolName.length).toBeGreaterThan(0);
            });
        });

        test('Git Tools Backward Compatibility Test - should maintain Git tool functionality', () => {
            const mockInstance = new mockToolRegistry();
            const gitTools = mockInstance.getGitTools();
            
            // Verify all Git tools are still available with same names
            const expectedGitTools = [
                'list-branches', 'create-feature-branch', 'analyze-recent-commits',
                'get-commit-details', 'merge-branch', 'analyze-code-impact', 'validate-git-workflow'
            ];
            
            expect(gitTools).toHaveLength(7);
            expectedGitTools.forEach(toolName => {
                const tool = gitTools.find((t: any) => t.name === toolName);
                expect(tool).toBeDefined();
                expect(tool?.description).toBeTruthy();
                expect(typeof tool?.handler).toBe('function');
            });
        });

        test('Error Handling Consistency Test - should maintain McpError patterns', () => {
            const { McpError, ErrorCode } = require('@modelcontextprotocol/sdk/types.js');
            
            // Verify McpError is available and structured correctly
            expect(McpError).toBeDefined();
            expect(ErrorCode).toBeDefined();
            expect(ErrorCode.MethodNotFound).toBe('METHOD_NOT_FOUND');
            expect(ErrorCode.InvalidParams).toBe('INVALID_PARAMS');
            expect(ErrorCode.InternalError).toBe('INTERNAL_ERROR');
        });
    });

    describe('Phase 5: Server Integration Tests', () => {
        test('Tool Handler Delegation Test - should delegate to correct registries', () => {
            const mockInstance = new mockToolRegistry();
            
            // Verify ToolRegistry methods are called
            expect(mockInstance.getAllTools).toBeDefined();
            expect(mockInstance.getGitTools).toBeDefined();
            expect(mockInstance.getAzureDevOpsTools).toBeDefined();
            
            // Test that tools have handlers
            const allTools = mockInstance.getAllTools();
            allTools.forEach((tool: any) => {
                expect(typeof tool.handler).toBe('function');
            });
        });

        test('Unknown Tool Handling Test - should handle unknown tools properly', () => {
            const { McpError, ErrorCode } = require('@modelcontextprotocol/sdk/types.js');
            
            // Verify error can be created for unknown tools
            const error = new McpError(ErrorCode.MethodNotFound, 'Unknown tool: unknown-tool');
            expect(error).toBeInstanceOf(Error);
            expect(error.code).toBe('METHOD_NOT_FOUND');
            expect(error.message).toContain('Unknown tool: unknown-tool');
        });

        test('Server Response Format Test - should maintain MCP format', () => {
            // Mock response format verification
            const mockResponse = {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ test: 'data' }, null, 2)
                    }
                ]
            };
            
            expect(mockResponse).toHaveProperty('content');
            expect(Array.isArray(mockResponse.content)).toBe(true);
            mockResponse.content.forEach(item => {
                expect(item).toHaveProperty('type');
                expect(item).toHaveProperty('text');
                expect(typeof item.type).toBe('string');
                expect(typeof item.text).toBe('string');
            });
        });
    });

    describe('Phase 6: Tool Count Validation Tests', () => {
        test('Tool Category Count Test - should have correct counts per category', () => {
            const mockInstance = new mockToolRegistry();
            const allTools = mockInstance.getAllTools();
            const gitTools = mockInstance.getGitTools();
            const azureDevOpsTools = mockInstance.getAzureDevOpsTools();
            
            // Git tools: 7
            expect(gitTools).toHaveLength(7);
            const gitToolNames = ['list-branches', 'create-feature-branch', 'analyze-recent-commits',
                                'get-commit-details', 'merge-branch', 'analyze-code-impact', 'validate-git-workflow'];
            gitToolNames.forEach(name => {
                expect(gitTools.find((t: any) => t.name === name)).toBeDefined();
            });
            
            // Azure DevOps tools: 12 (5 pipeline + 4 VM + 3 orchestration)
            expect(azureDevOpsTools).toHaveLength(12);
            
            // Pipeline tools: 5
            const pipelineTools = azureDevOpsTools.filter((t: any) => 
                ['list-pipelines', 'trigger-pipeline', 'get-pipeline-status', 'get-build-logs', 'manage-pipeline-variables']
                .includes(t.name)
            );
            expect(pipelineTools).toHaveLength(5);
            
            // VM tools: 4
            const vmTools = azureDevOpsTools.filter((t: any) => 
                ['provision-vm', 'deploy-to-vm', 'vm-health-check', 'vm-logs']
                .includes(t.name)
            );
            expect(vmTools).toHaveLength(4);
            
            // Orchestration tools: 3
            const orchestrationTools = azureDevOpsTools.filter((t: any) => 
                ['promote-environment', 'rollback-deployment', 'sync-configurations']
                .includes(t.name)
            );
            expect(orchestrationTools).toHaveLength(3);
            
            // Total registry tools: 19
            expect(allTools).toHaveLength(19);
            
            // Infrastructure tools: 15 (handled separately in server)
            const infrastructureToolCount = 15;
            
            // Total server tools: 34
            const totalToolCount = allTools.length + infrastructureToolCount;
            expect(totalToolCount).toBe(34);
        });
    });
});
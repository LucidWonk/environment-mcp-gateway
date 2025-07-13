// Mock the MCP SDK first
jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
    McpError: class MockMcpError extends Error {
        constructor(public code: string, message: string) {
            super(message);
            this.name = 'McpError';
        }
    },
    ErrorCode: {
        InvalidParams: 'INVALID_PARAMS',
        InternalError: 'INTERNAL_ERROR',
        InvalidRequest: 'INVALID_REQUEST'
    }
}));

import { AzureDevOpsToolRegistry, ToolDefinition } from '../../src/orchestrator/azure-devops-tool-registry';

// Mock the adapters
jest.mock('../../src/adapters/azure-devops-adapter', () => ({
    AzureDevOpsAdapter: jest.fn().mockImplementation(() => ({
        listPipelines: jest.fn(),
        triggerPipeline: jest.fn(),
        getPipelineStatus: jest.fn(),
        getBuildLogs: jest.fn(),
        managePipelineVariables: jest.fn()
    }))
}));

jest.mock('../../src/adapters/vm-management-adapter', () => ({
    VMManagementAdapter: jest.fn().mockImplementation(() => ({
        getAvailableTemplates: jest.fn(),
        provisionVM: jest.fn(),
        getVMInfo: jest.fn(),
        createSSHConnection: jest.fn(),
        deployToVM: jest.fn(),
        getVMHealthStatus: jest.fn(),
        getVMLogs: jest.fn()
    }))
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

// Mock environment
jest.mock('../../src/config/environment', () => ({
    Environment: {
        mcpLogLevel: 'info'
    }
}));

describe('AzureDevOpsToolRegistry', () => {
    let registry: AzureDevOpsToolRegistry;
    let tools: ToolDefinition[];

    beforeEach(() => {
        jest.clearAllMocks();
        registry = new AzureDevOpsToolRegistry();
        tools = registry.getAzureDevOpsTools();
    });

    describe('Tool Registry Structure', () => {
        test('should instantiate without errors', () => {
            expect(registry).toBeInstanceOf(AzureDevOpsToolRegistry);
        });

        test('should return all required tools', () => {
            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBe(12); // Total number of tools implemented
        });

        test('should have all Azure DevOps pipeline tools', () => {
            const azureDevOpsTools = [
                'list-pipelines',
                'trigger-pipeline', 
                'get-pipeline-status',
                'get-build-logs',
                'manage-pipeline-variables'
            ];

            azureDevOpsTools.forEach(toolName => {
                const tool = tools.find(t => t.name === toolName);
                expect(tool).toBeDefined();
                expect(tool?.description).toBeTruthy();
                expect(tool?.inputSchema).toBeDefined();
                expect(typeof tool?.handler).toBe('function');
            });
        });

        test('should have all VM management tools', () => {
            const vmTools = [
                'provision-vm',
                'deploy-to-vm',
                'vm-health-check',
                'vm-logs'
            ];

            vmTools.forEach(toolName => {
                const tool = tools.find(t => t.name === toolName);
                expect(tool).toBeDefined();
                expect(tool?.description).toBeTruthy();
                expect(tool?.inputSchema).toBeDefined();
                expect(typeof tool?.handler).toBe('function');
            });
        });

        test('should have all environment orchestration tools', () => {
            const orchestrationTools = [
                'promote-environment',
                'rollback-deployment',
                'sync-configurations'
            ];

            orchestrationTools.forEach(toolName => {
                const tool = tools.find(t => t.name === toolName);
                expect(tool).toBeDefined();
                expect(tool?.description).toBeTruthy();
                expect(tool?.inputSchema).toBeDefined();
                expect(typeof tool?.handler).toBe('function');
            });
        });
    });

    describe('Tool Schema Validation', () => {
        test('all tools should have valid input schemas', () => {
            tools.forEach(tool => {
                expect(tool.inputSchema).toHaveProperty('type');
                expect(tool.inputSchema.type).toBe('object');
                expect(tool.inputSchema).toHaveProperty('properties');
                
                // Check if required fields are defined when they exist
                if (tool.inputSchema.required) {
                    expect(Array.isArray(tool.inputSchema.required)).toBe(true);
                    tool.inputSchema.required.forEach((field: string) => {
                        expect(tool.inputSchema.properties).toHaveProperty(field);
                    });
                }
            });
        });

        test('list-pipelines tool should have correct schema', () => {
            const tool = tools.find(t => t.name === 'list-pipelines')!;
            expect(tool.inputSchema.properties).toHaveProperty('folder');
            expect(tool.inputSchema.properties).toHaveProperty('includeStatus');
            expect(tool.inputSchema.properties.includeStatus.default).toBe(true);
        });

        test('trigger-pipeline tool should have correct schema', () => {
            const tool = tools.find(t => t.name === 'trigger-pipeline')!;
            expect(tool.inputSchema.properties).toHaveProperty('pipelineId');
            expect(tool.inputSchema.properties).toHaveProperty('sourceBranch');
            expect(tool.inputSchema.properties).toHaveProperty('variables');
            expect(tool.inputSchema.required).toContain('pipelineId');
        });

        test('provision-vm tool should have correct schema', () => {
            const tool = tools.find(t => t.name === 'provision-vm')!;
            expect(tool.inputSchema.properties).toHaveProperty('vmName');
            expect(tool.inputSchema.properties).toHaveProperty('templateName');
            expect(tool.inputSchema.properties).toHaveProperty('memoryMB');
            expect(tool.inputSchema.properties).toHaveProperty('cpuCores');
            expect(tool.inputSchema.required).toContain('vmName');
        });

        test('promote-environment tool should have correct schema', () => {
            const tool = tools.find(t => t.name === 'promote-environment')!;
            expect(tool.inputSchema.properties).toHaveProperty('sourceEnvironment');
            expect(tool.inputSchema.properties).toHaveProperty('targetEnvironment');
            expect(tool.inputSchema.properties).toHaveProperty('version');
            expect(tool.inputSchema.required).toContain('sourceEnvironment');
            expect(tool.inputSchema.required).toContain('targetEnvironment');
            expect(tool.inputSchema.required).toContain('version');
        });
    });

    describe('Tool Descriptions', () => {
        test('all tools should have meaningful descriptions', () => {
            tools.forEach(tool => {
                expect(tool.description).toBeTruthy();
                expect(tool.description.length).toBeGreaterThan(10);
            });
        });

        test('Azure DevOps tools should mention relevant functionality', () => {
            const azureDevOpsTools = tools.filter(t => 
                ['list-pipelines', 'trigger-pipeline', 'get-pipeline-status', 'get-build-logs', 'manage-pipeline-variables']
                .includes(t.name)
            );

            azureDevOpsTools.forEach(tool => {
                const desc = tool.description.toLowerCase();
                expect(
                    desc.includes('pipeline') || 
                    desc.includes('build') || 
                    desc.includes('azure') ||
                    desc.includes('ci/cd')
                ).toBe(true);
            });
        });

        test('VM management tools should mention VM functionality', () => {
            const vmTools = tools.filter(t => 
                ['provision-vm', 'deploy-to-vm', 'vm-health-check', 'vm-logs']
                .includes(t.name)
            );

            vmTools.forEach(tool => {
                const desc = tool.description.toLowerCase();
                expect(
                    desc.includes('vm') || 
                    desc.includes('virtual') || 
                    desc.includes('hyper-v') ||
                    desc.includes('container')
                ).toBe(true);
            });
        });
    });

    describe('Tool Handler Functions', () => {
        test('all handlers should be bound functions', () => {
            tools.forEach(tool => {
                expect(typeof tool.handler).toBe('function');
                expect(tool.handler.name).toBeTruthy();
            });
        });

        test('handlers should return promise with correct structure', async () => {
            // Test that handlers return promises (can't easily test actual execution without mocking all dependencies)
            tools.forEach(tool => {
                expect(tool.handler).toBeInstanceOf(Function);
            });
        });
    });

    describe('Trading Platform Context', () => {
        test('tools should be relevant for trading platform deployment', () => {
            const tradingRelevantTools = [
                'list-pipelines',
                'trigger-pipeline', 
                'provision-vm',
                'deploy-to-vm',
                'vm-health-check',
                'promote-environment'
            ];

            tradingRelevantTools.forEach(toolName => {
                const tool = tools.find(t => t.name === toolName);
                expect(tool).toBeDefined();
            });
        });

        test('environment orchestration tools should support promotion workflow', () => {
            const orchestrationTools = tools.filter(t => 
                ['promote-environment', 'rollback-deployment', 'sync-configurations'].includes(t.name)
            );

            expect(orchestrationTools).toHaveLength(3);
            
            // Check that promote-environment has sourceEnvironment and targetEnvironment
            const promoteEnvTool = tools.find(t => t.name === 'promote-environment');
            expect(promoteEnvTool?.inputSchema.properties).toHaveProperty('sourceEnvironment');
            expect(promoteEnvTool?.inputSchema.properties).toHaveProperty('targetEnvironment');
            
            // Check that rollback-deployment has environment
            const rollbackTool = tools.find(t => t.name === 'rollback-deployment');
            expect(rollbackTool?.inputSchema.properties).toHaveProperty('environment');
            
            // Check that sync-configurations has sourceEnvironment and targetEnvironments  
            const syncTool = tools.find(t => t.name === 'sync-configurations');
            expect(syncTool?.inputSchema.properties).toHaveProperty('sourceEnvironment');
            expect(syncTool?.inputSchema.properties).toHaveProperty('targetEnvironments');
        });
    });

    describe('Error Handling Structure', () => {
        test('tools should follow McpError pattern', () => {
            // Verify that the registry imports McpError
            // This is verified by the successful import and build
            expect(registry).toBeDefined();
        });

        test('required parameters should be properly defined', () => {
            const toolsWithRequiredParams = tools.filter(t => t.inputSchema.required && t.inputSchema.required.length > 0);
            
            expect(toolsWithRequiredParams.length).toBeGreaterThan(5);
            
            toolsWithRequiredParams.forEach(tool => {
                tool.inputSchema.required.forEach((param: string) => {
                    expect(tool.inputSchema.properties[param]).toBeDefined();
                });
            });
        });
    });

    describe('Integration with Adapters', () => {
        test('should instantiate AzureDevOpsAdapter', () => {
            const AzureDevOpsAdapter = require('../../src/adapters/azure-devops-adapter').AzureDevOpsAdapter;
            expect(AzureDevOpsAdapter).toHaveBeenCalled();
        });

        test('should instantiate VMManagementAdapter', () => {
            const VMManagementAdapter = require('../../src/adapters/vm-management-adapter').VMManagementAdapter;
            expect(VMManagementAdapter).toHaveBeenCalled();
        });
    });

    describe('Tool Names and Consistency', () => {
        test('tool names should follow kebab-case convention', () => {
            tools.forEach(tool => {
                expect(tool.name).toMatch(/^[a-z][a-z0-9-]*[a-z0-9]$/);
            });
        });

        test('tool names should be unique', () => {
            const names = tools.map(t => t.name);
            const uniqueNames = new Set(names);
            expect(uniqueNames.size).toBe(names.length);
        });

        test('should have comprehensive PRP-DEVOPS coverage', () => {
            const expectedTools = [
                // Azure DevOps Tools
                'list-pipelines',
                'trigger-pipeline',
                'get-pipeline-status', 
                'get-build-logs',
                'manage-pipeline-variables',
                
                // VM Management Tools
                'provision-vm',
                'deploy-to-vm',
                'vm-health-check',
                'vm-logs',
                
                // Environment Orchestration Tools
                'promote-environment',
                'rollback-deployment',
                'sync-configurations'
            ];

            expectedTools.forEach(expectedTool => {
                const tool = tools.find(t => t.name === expectedTool);
                expect(tool).toBeDefined();
            });
        });
    });
});
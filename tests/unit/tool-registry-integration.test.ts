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

// Mock all adapters
jest.mock('../../src/adapters/git-adapter', () => ({
    GitAdapter: jest.fn().mockImplementation(() => ({
        listBranches: jest.fn(),
        createFeatureBranch: jest.fn(),
        analyzeRecentCommits: jest.fn(),
        getCommitDetails: jest.fn(),
        analyzeMerge: jest.fn(),
        mergeBranch: jest.fn(),
        validateGitWorkflow: jest.fn()
    }))
}));

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

// Mock domain analyzer
jest.mock('../../src/domain/git-domain-analyzer', () => ({
    GitDomainAnalyzer: {
        analyzeBranchDomainContext: jest.fn(() => ({ domain: 'test', context: 'mock' })),
        analyzeCommitDomainImpact: jest.fn(() => ({ 
            domains: ['test'], 
            primaryDomain: 'test', 
            crossDomainImpact: false,
            businessImpact: 'low',
            riskLevel: 'low',
            affectedProjects: []
        })),
        analyzeCodeImpact: jest.fn(() => ({
            domainBreakdown: new Map(),
            crossDomainFiles: [],
            riskAssessment: 'low',
            recommendations: []
        })),
        mapFileToDomain: jest.fn(() => 'test'),
        getDomainDescription: jest.fn(() => 'Test domain')
    }
}));

import { ToolRegistry, GitToolRegistry } from '../../src/orchestrator/tool-registry';

describe('Tool Registry Integration', () => {
    let toolRegistry: ToolRegistry;

    beforeEach(() => {
        jest.clearAllMocks();
        toolRegistry = new ToolRegistry();
    });

    describe('Integration with Azure DevOps Tools', () => {
        test('should instantiate ToolRegistry successfully', () => {
            expect(toolRegistry).toBeInstanceOf(ToolRegistry);
        });

        test('should have backward compatibility alias for GitToolRegistry', () => {
            const gitRegistry = new GitToolRegistry();
            expect(gitRegistry).toBeInstanceOf(ToolRegistry);
        });

        test('getAllTools should return combined Git and Azure DevOps tools', () => {
            const allTools = toolRegistry.getAllTools();
            
            expect(Array.isArray(allTools)).toBe(true);
            expect(allTools.length).toBeGreaterThan(7); // Original Git tools + Azure DevOps tools
            
            // Should have Git tools
            const gitToolNames = allTools.filter(t => [
                'list-branches', 'create-feature-branch', 'analyze-recent-commits',
                'get-commit-details', 'merge-branch', 'analyze-code-impact', 'validate-git-workflow'
            ].includes(t.name));
            expect(gitToolNames).toHaveLength(7);
            
            // Should have Azure DevOps tools
            const azureDevOpsToolNames = allTools.filter(t => [
                'list-pipelines', 'trigger-pipeline', 'get-pipeline-status',
                'get-build-logs', 'manage-pipeline-variables'
            ].includes(t.name));
            expect(azureDevOpsToolNames).toHaveLength(5);
            
            // Should have VM management tools
            const vmToolNames = allTools.filter(t => [
                'provision-vm', 'deploy-to-vm', 'vm-health-check', 'vm-logs'
            ].includes(t.name));
            expect(vmToolNames).toHaveLength(4);
            
            // Should have environment orchestration tools
            const orchestrationToolNames = allTools.filter(t => [
                'promote-environment', 'rollback-deployment', 'sync-configurations'
            ].includes(t.name));
            expect(orchestrationToolNames).toHaveLength(3);
        });

        test('getGitTools should still return only Git tools for backward compatibility', () => {
            const gitTools = toolRegistry.getGitTools();
            
            expect(Array.isArray(gitTools)).toBe(true);
            expect(gitTools).toHaveLength(7);
            
            const gitToolNames = gitTools.map(t => t.name);
            expect(gitToolNames).toEqual([
                'list-branches',
                'create-feature-branch', 
                'analyze-recent-commits',
                'get-commit-details',
                'merge-branch',
                'analyze-code-impact',
                'validate-git-workflow'
            ]);
        });

        test('getAzureDevOpsTools should return Azure DevOps tools', () => {
            const azureDevOpsTools = toolRegistry.getAzureDevOpsTools();
            
            expect(Array.isArray(azureDevOpsTools)).toBe(true);
            expect(azureDevOpsTools).toHaveLength(12); // All Azure DevOps + VM + orchestration tools
            
            // Check for some key Azure DevOps tools
            const toolNames = azureDevOpsTools.map(t => t.name);
            expect(toolNames).toContain('list-pipelines');
            expect(toolNames).toContain('trigger-pipeline');
            expect(toolNames).toContain('provision-vm');
            expect(toolNames).toContain('promote-environment');
        });

        test('all tools should have consistent structure', () => {
            const allTools = toolRegistry.getAllTools();
            
            allTools.forEach(tool => {
                expect(tool).toHaveProperty('name');
                expect(tool).toHaveProperty('description');
                expect(tool).toHaveProperty('inputSchema');
                expect(tool).toHaveProperty('handler');
                
                expect(typeof tool.name).toBe('string');
                expect(typeof tool.description).toBe('string');
                expect(typeof tool.inputSchema).toBe('object');
                expect(typeof tool.handler).toBe('function');
                
                // Validate input schema structure
                expect(tool.inputSchema).toHaveProperty('type');
                expect(tool.inputSchema.type).toBe('object');
                expect(tool.inputSchema).toHaveProperty('properties');
            });
        });

        test('all tool names should be unique across Git and Azure DevOps tools', () => {
            const allTools = toolRegistry.getAllTools();
            const toolNames = allTools.map(t => t.name);
            const uniqueNames = new Set(toolNames);
            
            expect(uniqueNames.size).toBe(toolNames.length);
        });

        test('should maintain proper tool categories', () => {
            const allTools = toolRegistry.getAllTools();
            
            // Git tools should be domain-focused
            const gitTools = allTools.filter(t => [
                'list-branches', 'create-feature-branch', 'analyze-recent-commits',
                'get-commit-details', 'merge-branch', 'analyze-code-impact', 'validate-git-workflow'
            ].includes(t.name));
            
            gitTools.forEach(tool => {
                expect(tool.description.toLowerCase()).toMatch(/branch|commit|git|merge|domain|workflow/);
            });
            
            // Azure DevOps tools should be CI/CD focused
            const azureTools = allTools.filter(t => [
                'list-pipelines', 'trigger-pipeline', 'get-pipeline-status', 'get-build-logs'
            ].includes(t.name));
            
            azureTools.forEach(tool => {
                expect(tool.description.toLowerCase()).toMatch(/pipeline|build|ci\/cd|azure/);
            });
            
            // VM tools should be infrastructure focused
            const vmTools = allTools.filter(t => [
                'provision-vm', 'deploy-to-vm', 'vm-health-check', 'vm-logs'
            ].includes(t.name));
            
            vmTools.forEach(tool => {
                expect(tool.description.toLowerCase()).toMatch(/vm|virtual|deploy|health|hyper-v|container/);
            });
        });
    });

    describe('Adapter Integration', () => {
        test('should properly instantiate all required adapters', () => {
            const GitAdapter = require('../../src/adapters/git-adapter').GitAdapter;
            const AzureDevOpsAdapter = require('../../src/adapters/azure-devops-adapter').AzureDevOpsAdapter;
            const VMManagementAdapter = require('../../src/adapters/vm-management-adapter').VMManagementAdapter;
            
            expect(GitAdapter).toHaveBeenCalled();
            expect(AzureDevOpsAdapter).toHaveBeenCalled();
            expect(VMManagementAdapter).toHaveBeenCalled();
        });

        test('should delegate Azure DevOps tools to AzureDevOpsToolRegistry', () => {
            const azureDevOpsTools = toolRegistry.getAzureDevOpsTools();
            
            // Tools should be properly structured from AzureDevOpsToolRegistry
            expect(azureDevOpsTools.length).toBeGreaterThan(0);
            
            const pipelineTool = azureDevOpsTools.find(t => t.name === 'list-pipelines');
            expect(pipelineTool).toBeDefined();
            expect(pipelineTool?.description).toContain('pipeline');
        });
    });

    describe('Error Handling Integration', () => {
        test('should maintain consistent error handling patterns across all tools', () => {
            const allTools = toolRegistry.getAllTools();
            
            // All tools should have handlers that can potentially throw McpError
            allTools.forEach(tool => {
                expect(typeof tool.handler).toBe('function');
            });
        });
    });
});
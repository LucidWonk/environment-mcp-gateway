#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError
} from '@modelcontextprotocol/sdk/types.js';
import { Environment } from './domain/config/environment.js';
import { SolutionParser } from './infrastructure/solution-parser.js';
import { AdapterManager } from './adapters/adapter-manager.js';
import { ToolRegistry } from './orchestrator/tool-registry.js';
import winston from 'winston';

// Initialize environment and logging
try {
    Environment.validateEnvironment();
} catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
}

// Configure logging
const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});

class EnvironmentMCPGateway {
    private server: Server;
    private adapterManager: AdapterManager;
    private toolRegistry: ToolRegistry;
    
    constructor() {
        this.server = new Server(
            {
                name: 'lucidwonks-environment-mcp-gateway',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );
        
        this.adapterManager = AdapterManager.getInstance();
        this.toolRegistry = new ToolRegistry();
        this.setupHandlers();
    }
    
    private setupHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const allTools = this.toolRegistry.getAllTools();
            return {
                tools: [
                    // Git workflow and Azure DevOps tools
                    ...allTools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    })),
                    // Existing infrastructure tools
                    {
                        name: 'analyze-solution-structure',
                        description: 'Parse and analyze the Lucidwonks solution structure, dependencies, and projects',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                includeDependencies: {
                                    type: 'boolean',
                                    description: 'Include dependency analysis',
                                    default: true
                                },
                                projectType: {
                                    type: 'string',
                                    enum: ['C#', 'Python', 'Other', 'All'],
                                    description: 'Filter projects by type',
                                    default: 'All'
                                }
                            }
                        }
                    },
                    {
                        name: 'get-development-environment-status',
                        description: 'Get comprehensive status of development environment (database, docker, git, solution)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                checkDatabase: {
                                    type: 'boolean',
                                    description: 'Check database connectivity',
                                    default: true
                                },
                                checkDocker: {
                                    type: 'boolean',
                                    description: 'Check Docker services',
                                    default: true
                                },
                                checkGit: {
                                    type: 'boolean',
                                    description: 'Check Git status',
                                    default: true
                                }
                            }
                        }
                    },
                    {
                        name: 'validate-build-configuration',
                        description: 'Validate solution build configuration and check for issues',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectName: {
                                    type: 'string',
                                    description: 'Specific project to validate (optional, validates all if not specified)'
                                }
                            }
                        }
                    },
                    {
                        name: 'get-project-dependencies',
                        description: 'Get detailed dependency information for a specific project',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectName: {
                                    type: 'string',
                                    description: 'Name of the project to analyze'
                                }
                            },
                            required: ['projectName']
                        }
                    },
                    {
                        name: 'list-development-containers',
                        description: 'List all development containers (TimescaleDB, RedPanda) with status and health',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'get-container-health',
                        description: 'Get detailed health check for a specific container',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                containerId: {
                                    type: 'string',
                                    description: 'Container ID or name to check'
                                }
                            },
                            required: ['containerId']
                        }
                    },
                    {
                        name: 'get-container-logs',
                        description: 'Retrieve and analyze container logs for debugging',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                containerId: {
                                    type: 'string',
                                    description: 'Container ID or name to get logs from'
                                },
                                lines: {
                                    type: 'number',
                                    description: 'Number of recent log lines to retrieve',
                                    default: 50
                                }
                            },
                            required: ['containerId']
                        }
                    },
                    {
                        name: 'restart-development-service',
                        description: 'Restart specific development services (TimescaleDB, RedPanda)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                serviceName: {
                                    type: 'string',
                                    description: 'Service name to restart (e.g., timescaledb, redpanda-0)',
                                    enum: ['timescaledb', 'redpanda-0', 'redpanda-console']
                                }
                            },
                            required: ['serviceName']
                        }
                    },
                    {
                        name: 'analyze-development-infrastructure',
                        description: 'Comprehensive infrastructure health analysis with recommendations',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'check-timescaledb-health',
                        description: 'Detailed TimescaleDB container and connection status',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'check-redpanda-health',
                        description: 'RedPanda cluster and console health verification',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'validate-development-stack',
                        description: 'End-to-end validation of all development services',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'reload-configuration',
                        description: 'Force reload configuration from .env files and recreate adapters',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'get-configuration-status',
                        description: 'Get current configuration status and reload information',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'test-adapter-configuration',
                        description: 'Test current adapter configurations and connectivity',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            };
        });
        
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            
            try {
                // Check if it's a tool from the tool registry (Git or Azure DevOps)
                const allTools = this.toolRegistry.getAllTools();
                const registryTool = allTools.find(tool => tool.name === name);
                if (registryTool) {
                    return await registryTool.handler(args);
                }
                
                // Handle existing infrastructure tools
                switch (name) {
                case 'analyze-solution-structure':
                    return await this.analyzeSolutionStructure(args);
                case 'get-development-environment-status':
                    return await this.getDevelopmentEnvironmentStatus(args);
                case 'validate-build-configuration':
                    return await this.validateBuildConfiguration(args);
                case 'get-project-dependencies':
                    return await this.getProjectDependencies(args);
                case 'list-development-containers':
                    return await this.listDevelopmentContainers(args);
                case 'get-container-health':
                    return await this.getContainerHealth(args);
                case 'get-container-logs':
                    return await this.getContainerLogs(args);
                case 'restart-development-service':
                    return await this.restartDevelopmentService(args);
                case 'analyze-development-infrastructure':
                    return await this.analyzeDevelopmentInfrastructure(args);
                case 'check-timescaledb-health':
                    return await this.checkTimescaleDBHealth(args);
                case 'check-redpanda-health':
                    return await this.checkRedPandaHealth(args);
                case 'validate-development-stack':
                    return await this.validateDevelopmentStack(args);
                case 'reload-configuration':
                    return await this.reloadConfiguration(args);
                case 'get-configuration-status':
                    return await this.getConfigurationStatus(args);
                case 'test-adapter-configuration':
                    return await this.testAdapterConfiguration(args);
                default:
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${name}`
                    );
                }
            } catch (error) {
                logger.error('Tool execution failed', { tool: name, error });
                throw error;
            }
        });
    }
    
    private async analyzeSolutionStructure(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { includeDependencies = true, projectType = 'All' } = args;
        
        logger.info('Analyzing solution structure', { includeDependencies, projectType });
        
        const solution = SolutionParser.parseSolution(Environment.solutionPath);
        const validation = SolutionParser.validateSolution(solution);
        
        let projects = solution.projects;
        if (projectType !== 'All') {
            projects = SolutionParser.getProjectsByType(solution, projectType as any);
        }
        
        const result = {
            solution: {
                name: solution.name,
                path: solution.path,
                totalProjects: solution.projects.length,
                solutionFolders: solution.solutionFolders
            },
            projects: projects.map(p => ({
                name: p.name,
                type: p.type,
                path: p.path,
                dependencies: includeDependencies ? p.dependencies : undefined
            })),
            validation: {
                valid: validation.valid,
                errors: validation.errors
            }
        };
        
        if (includeDependencies) {
            result.projects.forEach(p => {
                const chain = SolutionParser.getProjectDependencyChain(solution, p.name);
                (p as any).buildOrder = chain.indexOf(p.name) + 1;
            });
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async getDevelopmentEnvironmentStatus(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { checkDatabase = true, checkDocker = true, checkGit = true } = args;
        
        logger.info('Getting development environment status', { checkDatabase, checkDocker, checkGit });
        
        const status = {
            timestamp: new Date().toISOString(),
            environment: Environment.getEnvironmentInfo(),
            database: checkDatabase ? await this.checkDatabaseStatus() : null,
            docker: checkDocker ? await this.checkDockerStatus() : null,
            git: checkGit ? await this.checkGitStatus() : null,
            solution: await this.checkSolutionStatus()
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(status, null, 2)
                }
            ]
        };
    }
    
    private async validateBuildConfiguration(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { projectName } = args;
        
        logger.info('Validating build configuration', { projectName });
        
        const solution = SolutionParser.parseSolution(Environment.solutionPath);
        const validation = SolutionParser.validateSolution(solution);
        
        const result = {
            solutionValid: validation.valid,
            errors: validation.errors,
            projects: solution.projects.map(p => ({
                name: p.name,
                type: p.type,
                path: p.path,
                dependencies: p.dependencies,
                buildOrder: SolutionParser.getProjectDependencyChain(solution, p.name).indexOf(p.name) + 1
            }))
        };
        
        if (projectName) {
            const project = solution.projects.find(p => p.name === projectName);
            if (!project) {
                throw new McpError(ErrorCode.InvalidParams, `Project not found: ${projectName}`);
            }
            
            result.projects = [result.projects.find(p => p.name === projectName)!];
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async getProjectDependencies(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { projectName } = args;
        
        if (!projectName) {
            throw new McpError(ErrorCode.InvalidParams, 'Project name is required');
        }
        
        logger.info('Getting project dependencies', { projectName });
        
        const solution = SolutionParser.parseSolution(Environment.solutionPath);
        const project = solution.projects.find(p => p.name === projectName);
        
        if (!project) {
            throw new McpError(ErrorCode.InvalidParams, `Project not found: ${projectName}`);
        }
        
        const dependencyChain = SolutionParser.getProjectDependencyChain(solution, projectName);
        
        const result = {
            project: {
                name: project.name,
                type: project.type,
                path: project.path
            },
            directDependencies: project.dependencies,
            fullDependencyChain: dependencyChain,
            buildOrder: dependencyChain.indexOf(projectName) + 1,
            dependents: solution.projects
                .filter(p => p.dependencies.includes(projectName))
                .map(p => p.name)
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async checkDatabaseStatus(): Promise<any> {
        try {
            const connectionString = Environment.getDevelopmentDatabaseConnectionString();
            return {
                connected: true,
                connectionString: connectionString.replace(/:([^:@]+)@/, ':***@'), // Hide password
                database: Environment.database,
                host: Environment.dbHost,
                port: Environment.dbPort
            };
        } catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    private async checkDockerStatus(): Promise<any> {
        try {
            const dockerAdapter = this.adapterManager.getDockerAdapter();
            const [containers, composeServices, environmentHealth] = await Promise.all([
                dockerAdapter.listDevelopmentContainers(),
                dockerAdapter.getComposeServices(),
                dockerAdapter.getDevelopmentEnvironmentHealth()
            ]);

            return {
                dockerComposeFile: Environment.dockerComposeFile,
                containers: containers.map(c => ({
                    id: c.id.substring(0, 12),
                    name: c.name,
                    image: c.image,
                    status: c.status,
                    health: c.health,
                    ports: c.ports,
                    uptime: c.uptime
                })),
                services: composeServices,
                infrastructure: environmentHealth,
                status: 'implemented'
            };
        } catch (error) {
            logger.error('Failed to check Docker status', { error });
            return {
                dockerComposeFile: Environment.dockerComposeFile,
                services: [],
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    private async checkGitStatus(): Promise<any> {
        return {
            repository: Environment.gitRepoPath,
            configured: !!Environment.gitUserName && !!Environment.gitUserEmail,
            user: Environment.gitUserName,
            email: Environment.gitUserEmail
        };
    }
    
    private async checkSolutionStatus(): Promise<any> {
        try {
            const solution = SolutionParser.parseSolution(Environment.solutionPath);
            const validation = SolutionParser.validateSolution(solution);
            
            return {
                path: Environment.solutionPath,
                name: solution.name,
                projects: solution.projects.length,
                valid: validation.valid,
                errors: validation.errors
            };
        } catch (error) {
            return {
                path: Environment.solutionPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    private async listDevelopmentContainers(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Listing development containers');
        
        const containers = await this.adapterManager.getDockerAdapter().listDevelopmentContainers();
        
        const result = {
            timestamp: new Date().toISOString(),
            containers: containers.map(c => ({
                id: c.id.substring(0, 12),
                name: c.name,
                image: c.image,
                status: c.status,
                health: c.health,
                ports: c.ports,
                uptime: c.uptime,
                command: c.command
            })),
            summary: {
                total: containers.length,
                running: containers.filter(c => c.status === 'running').length,
                healthy: containers.filter(c => c.health === 'healthy').length
            }
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async getContainerHealth(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { containerId } = args;
        
        if (!containerId) {
            throw new McpError(ErrorCode.InvalidParams, 'Container ID is required');
        }
        
        logger.info('Getting container health', { containerId });
        
        const health = await this.adapterManager.getDockerAdapter().getContainerHealth(containerId);
        
        const result = {
            timestamp: new Date().toISOString(),
            containerId,
            health: health.healthy,
            message: health.message,
            status: health.healthy ? 'healthy' : 'unhealthy'
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async getContainerLogs(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { containerId, lines = 50 } = args;
        
        if (!containerId) {
            throw new McpError(ErrorCode.InvalidParams, 'Container ID is required');
        }
        
        logger.info('Getting container logs', { containerId, lines });
        
        const logs = await this.adapterManager.getDockerAdapter().getContainerLogs(containerId, lines);
        
        const result = {
            timestamp: new Date().toISOString(),
            containerId,
            lines,
            logs
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async restartDevelopmentService(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        const { serviceName } = args;
        
        if (!serviceName) {
            throw new McpError(ErrorCode.InvalidParams, 'Service name is required');
        }
        
        logger.info('Restarting development service', { serviceName });
        
        const success = await this.adapterManager.getDockerAdapter().restartComposeService(serviceName);
        
        const result = {
            timestamp: new Date().toISOString(),
            serviceName,
            success,
            message: success ? `Service ${serviceName} restarted successfully` : `Failed to restart service ${serviceName}`
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async analyzeDevelopmentInfrastructure(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Analyzing development infrastructure');
        
        const environmentHealth = await this.adapterManager.getDockerAdapter().getDevelopmentEnvironmentHealth();
        
        const result = {
            timestamp: new Date().toISOString(),
            infrastructure: environmentHealth,
            summary: {
                overall: environmentHealth.overall,
                issuesCount: environmentHealth.issues.length,
                recommendationsCount: environmentHealth.recommendations.length
            }
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async checkTimescaleDBHealth(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Checking TimescaleDB health');
        
        const databaseStatus = await this.adapterManager.getDockerAdapter().getTimescaleDBStatus();
        
        const result = {
            timestamp: new Date().toISOString(),
            database: databaseStatus
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async checkRedPandaHealth(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Checking RedPanda health');
        
        const messagingStatus = await this.adapterManager.getDockerAdapter().getRedPandaStatus();
        
        const result = {
            timestamp: new Date().toISOString(),
            messaging: messagingStatus
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    private async validateDevelopmentStack(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Validating development stack');
        
        const dockerAdapter = this.adapterManager.getDockerAdapter();
        const [databaseStatus, messagingStatus, containers] = await Promise.all([
            dockerAdapter.getTimescaleDBStatus(),
            dockerAdapter.getRedPandaStatus(),
            dockerAdapter.listDevelopmentContainers()
        ]);
        
        const environmentHealth = await this.adapterManager.getDockerAdapter().getDevelopmentEnvironmentHealth();
        
        const result = {
            timestamp: new Date().toISOString(),
            validation: {
                database: databaseStatus,
                messaging: messagingStatus,
                containers: containers.map(c => ({
                    name: c.name,
                    image: c.image,
                    status: c.status,
                    health: c.health
                })),
                overall: environmentHealth.overall,
                issues: environmentHealth.issues,
                recommendations: environmentHealth.recommendations
            },
            summary: {
                overallHealth: environmentHealth.overall,
                containersRunning: containers.filter(c => c.status === 'running').length,
                containersTotal: containers.length,
                databaseHealthy: databaseStatus.health === 'healthy',
                messagingHealthy: messagingStatus.overall === 'healthy'
            }
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    
    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        logger.info('EnvironmentMCPGateway server started', {
            name: 'lucidwonks-environment-mcp-gateway',
            version: '1.0.0'
        });
    }

    private async reloadConfiguration(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Force reloading configuration');
        
        try {
            this.adapterManager.forceReload();
            
            const status = this.adapterManager.getStatus();
            
            const result = {
                timestamp: new Date().toISOString(),
                action: 'configuration_reloaded',
                reloadCount: status.reloadCount,
                message: 'Configuration reloaded successfully',
                adapterStatus: status.adapterStatus
            };
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to reload configuration', { error });
            
            const result = {
                timestamp: new Date().toISOString(),
                action: 'configuration_reload_failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
    }

    private async getConfigurationStatus(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Getting configuration status');
        
        const status = this.adapterManager.getStatus();
        
        const result = {
            timestamp: new Date().toISOString(),
            configurationManager: {
                reloadCount: status.reloadCount,
                isWatching: status.isWatching,
                lastReload: status.lastReload
            },
            adapters: status.adapterStatus,
            environment: Environment.getEnvironmentInfo()
        };
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    private async testAdapterConfiguration(_args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        logger.info('Testing adapter configurations');
        
        try {
            const testResults = await this.adapterManager.testConfiguration();
            
            const result = {
                timestamp: new Date().toISOString(),
                testResults,
                summary: {
                    azureDevOpsHealthy: testResults.azureDevOps.healthy,
                    dockerHealthy: testResults.docker.healthy,
                    allHealthy: testResults.azureDevOps.healthy && testResults.docker.healthy
                }
            };
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Failed to test adapter configurations', { error });
            
            const result = {
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                testResults: {
                    azureDevOps: { healthy: false, message: 'Test failed' },
                    docker: { healthy: false, message: 'Test failed' }
                }
            };
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
    }
}

// Start the server
const server = new EnvironmentMCPGateway();
server.run().catch((error) => {
    logger.error('Server failed to start:', error);
    process.exit(1);
});
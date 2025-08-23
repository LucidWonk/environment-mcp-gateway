#!/usr/bin/env node
// Set silent mode for MCP operations to prevent console output contamination
process.env.MCP_SILENT_MODE = 'true';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Environment } from './domain/config/environment.js';
import { SolutionParser } from './infrastructure/solution-parser.js';
import { AdapterManager } from './adapters/adapter-manager.js';
import { ToolRegistry } from './orchestrator/tool-registry.js';
import { HealthServer } from './health-server.js';
import { createMCPLogger } from './utils/mcp-logger.js';
// Initialize environment and logging
console.log('🚀 Debug: Starting environment validation');
try {
    Environment.validateEnvironment();
    console.log('✅ Debug: Environment validation successful');
}
catch (error) {
    // Only log in development mode, not during MCP operations
    const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.MCP_SILENT_MODE;
    console.error('❌ Debug: Environment validation failed:', error);
    if (isDevelopment) {
        console.error('Environment validation failed:', error);
    }
    process.exit(1);
}
console.log('🚀 Debug: Creating MCP logger');
// Configure logging - avoid console output during MCP operations
const logger = createMCPLogger('environment-mcp-gateway.log');
console.log('✅ Debug: MCP logger created');
// Log process lifecycle events
logger.info('🎬 Process starting', {
    processId: process.pid,
    parentProcessId: process.ppid,
    execPath: process.execPath,
    argv: process.argv,
    cwd: process.cwd(),
    mcpStdioMode: process.env.MCP_STDIO_MODE,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
});
// Handle process termination
process.on('SIGINT', () => {
    logger.info('⏹️ Process received SIGINT signal', { processId: process.pid });
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger.info('⏹️ Process received SIGTERM signal', { processId: process.pid });
    process.exit(0);
});
process.on('exit', (code) => {
    logger.info('🛑 Process exiting', {
        processId: process.pid,
        exitCode: code,
        timestamp: new Date().toISOString()
    });
});
class EnvironmentMCPGateway {
    server;
    adapterManager;
    toolRegistry;
    httpServer;
    activeSessions = new Map();
    transportMode;
    constructor() {
        logger.info('🔧 Initializing EnvironmentMCPGateway components');
        // Determine transport mode from environment
        this.transportMode = process.env.MCP_TRANSPORT_MODE || 'stdio';
        logger.info('🚀 Transport mode selected', { mode: this.transportMode });
        try {
            // Initialize MCP Server
            logger.debug('Creating MCP Server instance');
            this.server = new Server({
                name: 'lucidwonks-environment-mcp-gateway',
                version: '1.0.0'
            }, {
                capabilities: {
                    tools: {}
                }
            });
            logger.debug('✅ MCP Server instance created');
            // Initialize Adapter Manager
            logger.debug('Getting AdapterManager singleton instance');
            this.adapterManager = AdapterManager.getInstance();
            logger.debug('✅ AdapterManager initialized');
            // Initialize Tool Registry
            logger.debug('Creating ToolRegistry instance');
            this.toolRegistry = new ToolRegistry();
            logger.debug('✅ ToolRegistry created');
            // Setup request handlers
            logger.debug('Setting up MCP request handlers');
            this.setupHandlers();
            logger.info('✅ EnvironmentMCPGateway components initialized successfully');
        }
        catch (error) {
            logger.error('❌ Failed to initialize EnvironmentMCPGateway components', {
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            });
            throw error;
        }
    }
    setupHandlers() {
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
            const startTime = Date.now();
            logger.info(`🔧 Tool execution started: ${name}`, {
                tool: name,
                args: Object.keys(args || {}),
                timestamp: new Date().toISOString()
            });
            try {
                // Check if it's a tool from the tool registry (Git or Azure DevOps)
                const allTools = this.toolRegistry.getAllTools();
                const registryTool = allTools.find(tool => tool.name === name);
                if (registryTool) {
                    logger.debug(`📋 Executing registry tool: ${name}`);
                    const result = await registryTool.handler(args);
                    const duration = Date.now() - startTime;
                    logger.info(`✅ Registry tool completed: ${name}`, { duration, success: true });
                    return result;
                }
                // Handle existing infrastructure tools
                logger.debug(`🏗️ Executing infrastructure tool: ${name}`);
                let result;
                switch (name) {
                    case 'analyze-solution-structure':
                        result = await this.analyzeSolutionStructure(args);
                        break;
                    case 'get-development-environment-status':
                        result = await this.getDevelopmentEnvironmentStatus(args);
                        break;
                    case 'validate-build-configuration':
                        result = await this.validateBuildConfiguration(args);
                        break;
                    case 'get-project-dependencies':
                        result = await this.getProjectDependencies(args);
                        break;
                    case 'list-development-containers':
                        result = await this.listDevelopmentContainers(args);
                        break;
                    case 'get-container-health':
                        result = await this.getContainerHealth(args);
                        break;
                    case 'get-container-logs':
                        result = await this.getContainerLogs(args);
                        break;
                    case 'restart-development-service':
                        result = await this.restartDevelopmentService(args);
                        break;
                    case 'analyze-development-infrastructure':
                        result = await this.analyzeDevelopmentInfrastructure(args);
                        break;
                    case 'check-timescaledb-health':
                        result = await this.checkTimescaleDBHealth(args);
                        break;
                    case 'check-redpanda-health':
                        result = await this.checkRedPandaHealth(args);
                        break;
                    case 'validate-development-stack':
                        result = await this.validateDevelopmentStack(args);
                        break;
                    case 'reload-configuration':
                        result = await this.reloadConfiguration(args);
                        break;
                    case 'get-configuration-status':
                        result = await this.getConfigurationStatus(args);
                        break;
                    case 'test-adapter-configuration':
                        result = await this.testAdapterConfiguration(args);
                        break;
                    default:
                        logger.error(`❌ Unknown tool requested: ${name}`, {
                            tool: name,
                            availableTools: allTools.map(t => t.name),
                            infrastructureTools: [
                                'analyze-solution-structure', 'get-development-environment-status',
                                'validate-build-configuration', 'get-project-dependencies',
                                'list-development-containers', 'get-container-health',
                                'get-container-logs', 'restart-development-service',
                                'analyze-development-infrastructure', 'check-timescaledb-health',
                                'check-redpanda-health', 'validate-development-stack',
                                'reload-configuration', 'get-configuration-status',
                                'test-adapter-configuration'
                            ]
                        });
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                const duration = Date.now() - startTime;
                logger.info(`✅ Infrastructure tool completed: ${name}`, { duration, success: true });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger.error(`❌ Tool execution failed: ${name}`, {
                    tool: name,
                    duration,
                    args: Object.keys(args || {}),
                    error: error instanceof Error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : error,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        });
    }
    async analyzeSolutionStructure(args) {
        const { includeDependencies = true, projectType = 'All' } = args;
        logger.info('Analyzing solution structure', { includeDependencies, projectType });
        const solution = SolutionParser.parseSolution(Environment.solutionPath);
        const validation = SolutionParser.validateSolution(solution);
        let projects = solution.projects;
        if (projectType !== 'All') {
            projects = SolutionParser.getProjectsByType(solution, projectType);
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
                p.buildOrder = chain.indexOf(p.name) + 1;
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
    async getDevelopmentEnvironmentStatus(args) {
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
    async validateBuildConfiguration(args) {
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
            result.projects = [result.projects.find(p => p.name === projectName)];
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
    async getProjectDependencies(args) {
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
    async checkDatabaseStatus() {
        try {
            const connectionString = Environment.getDevelopmentDatabaseConnectionString();
            return {
                connected: true,
                connectionString: connectionString.replace(/:([^:@]+)@/, ':***@'), // Hide password
                database: Environment.database,
                host: Environment.dbHost,
                port: Environment.dbPort
            };
        }
        catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async checkDockerStatus() {
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
        }
        catch (error) {
            logger.error('Failed to check Docker status', { error });
            return {
                dockerComposeFile: Environment.dockerComposeFile,
                services: [],
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async checkGitStatus() {
        return {
            repository: Environment.gitRepoPath,
            configured: !!Environment.gitUserName && !!Environment.gitUserEmail,
            user: Environment.gitUserName,
            email: Environment.gitUserEmail
        };
    }
    async checkSolutionStatus() {
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
        }
        catch (error) {
            return {
                path: Environment.solutionPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async listDevelopmentContainers(_args) {
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
    async getContainerHealth(args) {
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
    async getContainerLogs(args) {
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
    async restartDevelopmentService(args) {
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
    async analyzeDevelopmentInfrastructure(_args) {
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
    async checkTimescaleDBHealth(_args) {
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
    async checkRedPandaHealth(_args) {
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
    async validateDevelopmentStack(_args) {
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
    async run() {
        logger.info('🚀 Starting MCP server connection process', {
            processId: process.pid,
            parentProcessId: process.ppid,
            transportMode: this.transportMode,
            mcpStdioMode: process.env.MCP_STDIO_MODE,
            isInteractive: process.stdin.isTTY
        });
        if (this.transportMode === 'stdio') {
            await this.runStdioTransport();
        }
        else {
            await this.runHttpTransport();
        }
    }
    async runStdioTransport() {
        logger.info('📡 Starting STDIO transport mode');
        // Add STDIO connection monitoring to detect disconnection
        this.setupStdioMonitoring();
        const transport = new StdioServerTransport();
        logger.info('📡 STDIO transport created, attempting connection...', {
            transportType: 'StdioServerTransport',
            processId: process.pid
        });
        try {
            await this.server.connect(transport);
            logger.info('✅ EnvironmentMCPGateway MCP server connected and ready', {
                name: 'lucidwonks-environment-mcp-gateway',
                version: '1.0.0',
                transport: 'STDIO',
                processId: process.pid,
                parentProcessId: process.ppid,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error('❌ Failed to connect MCP server', {
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error,
                processId: process.pid,
                mcpStdioMode: process.env.MCP_STDIO_MODE
            });
            throw error;
        }
    }
    async runHttpTransport() {
        logger.info('📡 Starting HTTP/SSE transport mode');
        const port = parseInt(process.env.MCP_SERVER_PORT || '3001');
        const host = process.env.MCP_HTTP_HOST || '0.0.0.0';
        // Create unified HTTP server for MCP and health endpoints
        this.httpServer = this.createUnifiedHttpServer();
        // Start HTTP server
        return new Promise((resolve, reject) => {
            this.httpServer.listen(port, host, () => {
                logger.info('✅ EnvironmentMCPGateway HTTP server started', {
                    name: 'lucidwonks-environment-mcp-gateway',
                    version: '1.0.0',
                    transport: 'HTTP/SSE',
                    port,
                    host,
                    mcpEndpoint: `/mcp`,
                    healthEndpoint: `/health`,
                    processId: process.pid,
                    timestamp: new Date().toISOString()
                });
                resolve();
            });
            this.httpServer.on('error', (error) => {
                logger.error('❌ HTTP server failed to start', {
                    error: error instanceof Error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : error,
                    port,
                    host
                });
                reject(error);
            });
        });
    }
    createUnifiedHttpServer() {
        return http.createServer(async (req, res) => {
            try {
                logger.debug('HTTP request received', {
                    method: req.method,
                    url: req.url,
                    userAgent: req.headers['user-agent']
                });
                if (req.url?.startsWith('/mcp')) {
                    await this.handleMcpRequest(req, res);
                }
                else if (req.url?.startsWith('/health') || req.url?.startsWith('/status')) {
                    await this.handleHealthRequest(req, res);
                }
                else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not Found', availableEndpoints: ['/mcp', '/health', '/status'] }));
                }
            }
            catch (error) {
                logger.error('HTTP request handling error', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    method: req.method,
                    url: req.url
                });
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            }
        });
    }
    async handleMcpRequest(req, res) {
        if (req.method === 'GET' && req.url === '/mcp') {
            // SSE connection establishment
            const sessionId = this.generateSessionId();
            const transport = new SSEServerTransport('/mcp', res);
            logger.info('🔌 New SSE connection established', {
                sessionId,
                clientIP: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });
            // Store session
            this.activeSessions.set(sessionId, transport);
            // Create dedicated MCP server instance for this session
            const sessionServer = new Server({
                name: 'lucidwonks-environment-mcp-gateway',
                version: '1.0.0'
            }, {
                capabilities: {
                    tools: {}
                }
            });
            // Setup request handlers for this session (reuse existing handlers)
            this.setupSessionHandlers(sessionServer);
            // Connect session server to transport
            await sessionServer.connect(transport);
            // Handle session cleanup
            transport.onclose = () => {
                logger.info('🔌 SSE connection closed', { sessionId });
                this.activeSessions.delete(sessionId);
            };
            transport.onerror = (error) => {
                logger.error('🔌 SSE connection error', { sessionId, error: error.message });
                this.activeSessions.delete(sessionId);
            };
            // Start SSE stream
            await transport.start();
        }
        else if (req.method === 'POST' && req.url?.startsWith('/mcp')) {
            // Handle POST messages to existing SSE sessions
            const sessionId = this.extractSessionId(req.url);
            const transport = this.activeSessions.get(sessionId);
            if (transport) {
                await transport.handlePostMessage(req, res);
            }
            else {
                logger.warn('POST to unknown session', { sessionId, url: req.url });
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Session not found' }));
            }
        }
        else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    }
    async handleHealthRequest(req, res) {
        // Integrate with existing HealthServer logic
        if (req.url === '/health' && req.method === 'GET') {
            const healthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0',
                transport: this.transportMode,
                activeSessions: this.activeSessions.size
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(healthStatus));
        }
        else if (req.url === '/status' && req.method === 'GET') {
            const statusInfo = {
                status: 'running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                transport: {
                    mode: this.transportMode,
                    activeSessions: this.activeSessions.size,
                    sessionIds: Array.from(this.activeSessions.keys())
                },
                environment: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    env: process.env.NODE_ENV || 'development'
                }
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(statusInfo, null, 2));
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Health endpoint not found' }));
        }
    }
    setupSessionHandlers(sessionServer) {
        // Setup the same request handlers as the main server
        sessionServer.setRequestHandler(ListToolsRequestSchema, async () => {
            const allTools = this.toolRegistry.getAllTools();
            return {
                tools: [
                    // Git workflow and Azure DevOps tools
                    ...allTools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    })),
                    // Existing infrastructure tools (copy from main setupHandlers)
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
                    // Add other tools as needed...
                ]
            };
        });
        sessionServer.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const startTime = Date.now();
            logger.info(`🔧 Session tool execution started: ${name}`, {
                tool: name,
                args: Object.keys(args || {}),
                timestamp: new Date().toISOString()
            });
            try {
                // Check if it's a tool from the tool registry (Git or Azure DevOps)
                const allTools = this.toolRegistry.getAllTools();
                const registryTool = allTools.find(tool => tool.name === name);
                if (registryTool) {
                    logger.debug(`📋 Executing session registry tool: ${name}`);
                    const result = await registryTool.handler(args);
                    const duration = Date.now() - startTime;
                    logger.info(`✅ Session registry tool completed: ${name}`, { duration, success: true });
                    return result;
                }
                // Handle existing infrastructure tools (delegate to main methods)
                logger.debug(`🏧 Executing session infrastructure tool: ${name}`);
                let result;
                switch (name) {
                    case 'analyze-solution-structure':
                        result = await this.analyzeSolutionStructure(args);
                        break;
                    case 'get-development-environment-status':
                        result = await this.getDevelopmentEnvironmentStatus(args);
                        break;
                    // Add other cases as needed...
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                const duration = Date.now() - startTime;
                logger.info(`✅ Session infrastructure tool completed: ${name}`, { duration, success: true });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger.error(`❌ Session tool execution failed: ${name}`, {
                    tool: name,
                    duration,
                    args: Object.keys(args || {}),
                    error: error instanceof Error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : error,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        });
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractSessionId(url) {
        // Extract session ID from URL path like /mcp/session_123
        const match = url.match(/\/mcp\/(.+)/);
        return match ? match[1] : '';
    }
    setupStdioMonitoring() {
        // Monitor stdin for connection closure
        if (process.stdin) {
            process.stdin.on('end', () => {
                logger.info('📪 STDIN closed - MCP client disconnected', {
                    processId: process.pid,
                    timestamp: new Date().toISOString()
                });
                process.exit(0);
            });
            process.stdin.on('close', () => {
                logger.info('📪 STDIN closed event - MCP client disconnected', {
                    processId: process.pid,
                    timestamp: new Date().toISOString()
                });
                process.exit(0);
            });
            process.stdin.on('error', (error) => {
                logger.warn('📪 STDIN error - possible client disconnection', {
                    processId: process.pid,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                process.exit(1);
            });
        }
        // Monitor stdout for write errors
        if (process.stdout) {
            process.stdout.on('error', (error) => {
                logger.warn('📤 STDOUT error - client may have disconnected', {
                    processId: process.pid,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                process.exit(1);
            });
        }
        // Set up a heartbeat mechanism for STDIO mode
        if (process.env.MCP_STDIO_MODE === 'true') {
            const heartbeatInterval = setInterval(() => {
                // Check if stdin is still readable and stdout is writable
                if (!process.stdin.readable || !process.stdout.writable) {
                    logger.info('💔 STDIO streams no longer available - disconnecting', {
                        processId: process.pid,
                        stdinReadable: process.stdin.readable,
                        stdoutWritable: process.stdout.writable,
                        timestamp: new Date().toISOString()
                    });
                    clearInterval(heartbeatInterval);
                    process.exit(0);
                }
            }, 30000); // Check every 30 seconds
            // Clean up heartbeat on exit
            process.on('exit', () => {
                clearInterval(heartbeatInterval);
            });
        }
    }
    async reloadConfiguration(_args) {
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
        }
        catch (error) {
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
    async getConfigurationStatus(_args) {
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
    async testAdapterConfiguration(_args) {
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
        }
        catch (error) {
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
/**
 * Start the Environment MCP Gateway server with comprehensive initialization logging
 * Handles both health server (for Docker) and main MCP server startup
 */
async function startServer() {
    const transportMode = process.env.MCP_TRANSPORT_MODE || 'stdio';
    logger.info('🚀 Starting Environment MCP Gateway server initialization', {
        nodeEnv: process.env.NODE_ENV,
        mcpPort: process.env.MCP_SERVER_PORT || '3001',
        projectRoot: process.env.PROJECT_ROOT,
        transportMode: transportMode,
        mcpStdioMode: process.env.MCP_STDIO_MODE,
        processId: process.pid,
        parentProcessId: process.ppid,
        argv: process.argv,
        execPath: process.execPath,
        healthServerEnabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_SERVER === 'true'
    });
    try {
        // Start health server for Docker health checks only when in STDIO mode
        // In HTTP mode, health endpoints are handled by the unified HTTP server
        if (transportMode === 'stdio' && (process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_SERVER === 'true') && !process.env.MCP_STDIO_MODE) {
            logger.info('🏥 Initializing health server for Docker health checks (STDIO mode)', {
                processId: process.pid,
                transportMode: transportMode
            });
            const healthPort = parseInt(process.env.MCP_SERVER_PORT || '3001');
            const healthServer = new HealthServer(healthPort);
            await healthServer.start();
            logger.info('✅ Health server started successfully', {
                port: healthPort,
                processId: process.pid
            });
        }
        else if (transportMode === 'http') {
            logger.info('🏥 Health endpoints will be handled by unified HTTP server', {
                transportMode: transportMode,
                processId: process.pid
            });
        }
        else {
            logger.info('⏭️ Health server disabled - running in STDIO MCP mode or development', {
                transportMode: transportMode,
                mcpStdioMode: process.env.MCP_STDIO_MODE,
                nodeEnv: process.env.NODE_ENV,
                processId: process.pid
            });
        }
        // Start MCP server
        logger.info('🔧 Initializing MCP server components');
        const server = new EnvironmentMCPGateway();
        await server.run();
        logger.info('✅ Environment MCP Gateway started successfully', {
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger.error('❌ Server failed to start - critical error during initialization', {
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error,
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV,
            projectRoot: process.env.PROJECT_ROOT
        });
        // Give logs time to flush before exiting
        setTimeout(() => process.exit(1), 100);
    }
}
console.log('🚀 Debug: About to call startServer()');
startServer().catch((error) => {
    console.error('❌ Debug: startServer failed:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map
#!/usr/bin/env node

// Set silent mode for MCP operations to prevent console output contamination
process.env.MCP_SILENT_MODE = 'true';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';
import { SessionManager } from './session/session-manager.js';
import { SessionAwareToolExecutor, SessionContext } from './session/session-context.js';
import { TransportFactory, TransportHandler } from './transport/transport-factory.js';
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
import { HealthServer } from './health-server.js';
import { createMCPLogger } from './utils/mcp-logger.js';
import fs from 'fs';
import os from 'os';

// Startup protection - prevent multiple instances with enhanced container support
const STARTUP_LOCK_FILE = '/tmp/mcp-gateway-startup.lock';

async function cleanupStaleProcesses(): Promise<void> {
    // In a clean Docker container environment, we don't need aggressive process cleanup
    // The container restart and lock file cleanup should be sufficient
    logger.info('Container startup - relying on clean container state');
}

async function acquireStartupLock(): Promise<boolean> {
    try {
        logger.info('🔒 Attempting to acquire startup lock', { 
            pid: process.pid, 
            lockFile: STARTUP_LOCK_FILE,
            containerEnv: !!process.env.HOSTNAME // Docker containers usually have this
        });
        
        // Clean up any stale processes first
        await cleanupStaleProcesses();
        
        if (fs.existsSync(STARTUP_LOCK_FILE)) {
            const lockContent = fs.readFileSync(STARTUP_LOCK_FILE, 'utf8');
            const { pid: lockPid, timestamp, hostname } = JSON.parse(lockContent);
            
            logger.info('🔍 Found existing lock', { 
                pid: process.pid, 
                lockPid, 
                age: Date.now() - timestamp,
                lockHostname: hostname,
                currentHostname: process.env.HOSTNAME || os.hostname()
            });
            
            // In container environment, be more aggressive about stale locks
            // Also check if hostname matches (different containers = different hostnames)
            const lockAge = Date.now() - timestamp;
            const isLockStale = lockAge > 3000; // 3 seconds for containers
            const isDifferentContainer = hostname && hostname !== (process.env.HOSTNAME || os.hostname());
            
            if (!isLockStale && !isDifferentContainer) {
                try {
                    // Check if process is still running
                    process.kill(lockPid, 0); // Signal 0 checks if process exists
                    logger.error('⚠️ Another MCP Gateway instance is active', { 
                        pid: process.pid, 
                        lockPid, 
                        lockAge,
                        reason: 'Process still running and lock not stale'
                    });
                    return false;
                } catch {
                    // Process doesn't exist, lock is stale
                    logger.info('⚰️ Lock process is dead, removing stale lock', { pid: process.pid, lockPid });
                    fs.unlinkSync(STARTUP_LOCK_FILE);
                }
            } else {
                // Lock is old or from different container, remove it
                const reason = isDifferentContainer ? 'different container' : 'stale lock';
                logger.info(`🧹 Removing ${reason}`, { 
                    pid: process.pid, 
                    lockAge,
                    isDifferentContainer,
                    lockHostname: hostname,
                    currentHostname: process.env.HOSTNAME || os.hostname()
                });
                fs.unlinkSync(STARTUP_LOCK_FILE);
            }
        } else {
            logger.info('✅ No existing lock file found - clean startup', { pid: process.pid });
        }
        
        // Acquire lock with container information
        logger.info('🔒 Acquiring startup lock', { pid: process.pid });
        fs.writeFileSync(STARTUP_LOCK_FILE, JSON.stringify({
            pid: process.pid,
            timestamp: Date.now(),
            hostname: process.env.HOSTNAME || os.hostname(),
            container: !!process.env.HOSTNAME
        }));
        
        logger.info('✅ Startup lock acquired successfully', { 
            pid: process.pid,
            hostname: process.env.HOSTNAME || os.hostname()
        });
        return true;
    } catch (error) {
        logger.error('❌ Failed to acquire startup lock', { pid: process.pid, error });
        return false;
    }
}

function releaseStartupLock(): void {
    try {
        if (fs.existsSync(STARTUP_LOCK_FILE)) {
            fs.unlinkSync(STARTUP_LOCK_FILE);
        }
    } catch (error) {
        // Note: This is in a cleanup function where logger might not be available
        console.error('Failed to release startup lock:', error);
    }
}

// Initialize environment and logging
try {
    Environment.validateEnvironment();
} catch (error) {
    // Only log in development mode, not during MCP operations
    const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.MCP_SILENT_MODE;
    if (isDevelopment) {
        // Note: This is during environment initialization where logger might not be available yet
        console.error('Environment validation failed:', error);
    }
    process.exit(1);
}

// Configure logging - avoid console output during MCP operations
const logger = createMCPLogger('environment-mcp-gateway.log');

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
    private baseServer: Server;
    private adapterManager: AdapterManager;
    private toolRegistry: ToolRegistry;
    private sessionManager: SessionManager;
    private sessionAwareExecutor: SessionAwareToolExecutor;
    private sessionServers = new Map<string, Server>();
    private transportHandler?: TransportHandler;
    
    constructor() {
        logger.info('🔧 Initializing EnvironmentMCPGateway components');
        
        try {
            // Initialize Base MCP Server (template for sessions)
            logger.debug('Creating Base MCP Server instance');
            this.baseServer = new Server(
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
            logger.debug('✅ Base MCP Server instance created');
            
            // Initialize Adapter Manager
            logger.debug('Getting AdapterManager singleton instance');
            this.adapterManager = AdapterManager.getInstance();
            logger.debug('✅ AdapterManager initialized');
            
            // Initialize Tool Registry
            logger.debug('Creating ToolRegistry instance');
            this.toolRegistry = new ToolRegistry();
            logger.debug('✅ ToolRegistry created');
            
            // Initialize Session Manager
            logger.debug('Creating SessionManager instance');
            this.sessionManager = new SessionManager({
                maxSessions: 10,
                sessionTimeout: 5 * 60 * 1000, // 5 minutes
                cleanupInterval: 60 * 1000 // 1 minute
            });
            logger.debug('✅ SessionManager created');
            
            // Initialize Session-Aware Tool Executor
            logger.debug('Creating SessionAwareToolExecutor instance');
            this.sessionAwareExecutor = new SessionAwareToolExecutor();
            logger.debug('✅ SessionAwareToolExecutor created');
            
            // Setup request handlers
            logger.debug('Setting up MCP request handlers');
            this.setupHandlers();
            logger.info('✅ EnvironmentMCPGateway components initialized successfully');
            
        } catch (error) {
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
    
    private setupHandlers(): void {
        this.baseServer.setRequestHandler(ListToolsRequestSchema, async () => {
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
        
        this.baseServer.setRequestHandler(CallToolRequestSchema, async (request) => {
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
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${name}`
                    );
                }
                
                const duration = Date.now() - startTime;
                logger.info(`✅ Infrastructure tool completed: ${name}`, { duration, success: true });
                return result;
                
            } catch (error) {
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
    
    /**
     * Create a session-specific MCP server with isolated context
     * Each client gets their own server instance for proper multi-client support
     */
    private createSessionServer(sessionContext: SessionContext): Server {
        logger.debug('Creating session-specific MCP server', { sessionId: sessionContext.sessionId });
        
        const sessionServer = new Server(
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
        
        // Setup handlers for this session server with session context
        this.setupSessionHandlers(sessionServer, sessionContext);
        
        logger.debug('Session-specific MCP server created', { sessionId: sessionContext.sessionId });
        return sessionServer;
    }
    
    /**
     * Setup request handlers for a session-specific server with session context
     */
    private setupSessionHandlers(server: Server, sessionContext: SessionContext): void {
        logger.debug('Setting up session-specific handlers', { sessionId: sessionContext.sessionId });
        
        // List tools handler (same for all sessions)
        server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                                    description: 'Include project dependencies analysis'
                                },
                                projectType: {
                                    type: 'string',
                                    enum: ['All', 'Library', 'Console', 'Web', 'Service', 'Test'],
                                    description: 'Filter by project type'
                                }
                            }
                        }
                    },
                    {
                        name: 'get-development-environment-status',
                        description: 'Get comprehensive development environment status including Docker, database, and solution health',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                checkDocker: {
                                    type: 'boolean',
                                    description: 'Check Docker services status'
                                },
                                checkDatabase: {
                                    type: 'boolean',
                                    description: 'Check database connectivity'
                                },
                                checkGit: {
                                    type: 'boolean',
                                    description: 'Check Git repository status'
                                }
                            }
                        }
                    },
                    {
                        name: 'validate-build-configuration',
                        description: 'Validate solution build configuration and project consistency',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectName: {
                                    type: 'string',
                                    description: 'Specific project to validate (optional)'
                                }
                            }
                        }
                    },
                    {
                        name: 'get-project-dependencies',
                        description: 'Analyze project dependencies and package references',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectName: {
                                    type: 'string',
                                    description: 'Specific project to analyze'
                                },
                                includeTransitive: {
                                    type: 'boolean',
                                    description: 'Include transitive dependencies'
                                }
                            }
                        }
                    }
                ]
            };
        });
        
        // Session-aware tool execution handler
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const startTime = Date.now();
            
            logger.info(`🔧 Tool execution started (Session: ${sessionContext.sessionId}): ${name}`, { 
                tool: name, 
                args: Object.keys(args || {}),
                sessionId: sessionContext.sessionId,
                timestamp: new Date().toISOString()
            });
            
            return this.sessionAwareExecutor.executeWithSession(
                sessionContext,
                name,
                args,
                async (params, context) => {
                    try {
                        // Execute tool with session context
                        const result = await this.executeToolWithSessionContext(name, params, context);
                        const duration = Date.now() - startTime;
                        
                        logger.info(`✅ Tool completed (Session: ${context.sessionId}): ${name}`, { 
                            duration, 
                            success: true,
                            sessionId: context.sessionId
                        });
                        
                        return result;
                    } catch (error) {
                        const duration = Date.now() - startTime;
                        logger.error(`❌ Tool failed (Session: ${context.sessionId}): ${name}`, { 
                            duration, 
                            error: error instanceof Error ? error.message : String(error),
                            sessionId: context.sessionId
                        });
                        throw error;
                    }
                }
            );
        });
    }
    
    /**
     * Execute tool with session context for proper multi-client isolation
     */
    private async executeToolWithSessionContext(name: string, args: any, sessionContext: SessionContext): Promise<any> {
        // Check if it's a tool from the tool registry (Git or Azure DevOps)
        const allTools = this.toolRegistry.getAllTools();
        const registryTool = allTools.find(tool => tool.name === name);
        if (registryTool) {
            logger.debug(`📋 Executing registry tool with session context: ${name}`, { 
                sessionId: sessionContext.sessionId 
            });
            return await registryTool.handler(args);
        }

        // Handle infrastructure tools with session context
        switch (name) {
        case 'analyze-solution-structure':
            return await this.analyzeSolutionStructure(args);
                
        case 'get-development-environment-status':
            return await this.getDevelopmentEnvironmentStatus(args);
                
        case 'validate-build-configuration':
            return await this.validateBuildConfiguration(args);
                
        case 'get-project-dependencies':
            return await this.getProjectDependencies(args);
                
        default:
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${name}`
            );
        }
    }
    
    /**
     * Get comprehensive multi-client session metrics
     */
    public getMultiClientMetrics() {
        const sessionMetrics = this.sessionManager.getMetrics();
        const activeRequests = this.sessionAwareExecutor.getAllActiveRequests();
        
        return {
            sessions: sessionMetrics,
            activeServers: this.sessionServers.size,
            activeRequests: {
                total: activeRequests.length,
                bySession: activeRequests.reduce((acc, req) => {
                    acc[req.sessionContext.sessionId] = (acc[req.sessionContext.sessionId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            },
            timestamp: new Date().toISOString()
        };
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
    
    /**
     * Create HTTP server that handles MCP SSE connections and health endpoints
     */
    private createMCPHttpServer(port: number): http.Server {
        const httpServer = http.createServer((req, res) => {
            // Set CORS headers for development
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // Handle MCP connections
            if (req.url === '/mcp') {
                if (req.method === 'GET') {
                    // SSE transport
                    this.handleMCPConnection(req, res);
                } else if (req.method === 'POST') {
                    // HTTP transport
                    this.handleMCPHTTPRequest(req, res);
                } else {
                    res.writeHead(405, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                }
            } 
            // Handle health endpoints
            else if (req.url === '/health' && req.method === 'GET') {
                this.handleHealthCheck(res);
            } else if (req.url === '/status' && req.method === 'GET') {
                this.handleStatusCheck(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });
        
        // Start the HTTP server  
        httpServer.listen(port, '0.0.0.0', () => {
            logger.info('🌐 HTTP server started for MCP and health endpoints', {
                port: port,
                host: '0.0.0.0',
                mcpEndpoint: '/mcp',
                healthEndpoints: ['/health', '/status']
            });
        });
        
        return httpServer;
    }
    
    /**
     * Handle MCP SSE connection from a client
     */
    private async handleMCPConnection(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        let sessionId: string | undefined;
        
        try {
            // Generate unique session ID for this connection
            sessionId = this.sessionManager.generateSessionId();
            
            logger.info('🔌 New MCP client connection', {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress
            });
            
            // Create session for this client connection
            this.sessionManager.addSession(
                sessionId,
                req.headers['user-agent'],
                req.socket?.remoteAddress
            );
            
            // Create session context for this connection
            const sessionContext: SessionContext = {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress,
                startedAt: new Date()
            };
            
            // Create session-specific MCP server for isolated multi-client support
            const sessionServer = this.createSessionServer(sessionContext);
            this.sessionServers.set(sessionId, sessionServer);
            
            // Create SSE transport for this specific connection
            const transport = new SSEServerTransport('/mcp', res);
            
            // Update session state to connecting
            this.sessionManager.updateSessionState(sessionId, 'connecting');
            
            // Connect the session-specific MCP server to this transport
            await sessionServer.connect(transport);
            
            // Update session state to connected
            this.sessionManager.updateSessionState(sessionId, 'connected');
            
            logger.info('✅ MCP client connected via SSE transport', {
                sessionId,
                totalSessions: this.sessionManager.getMetrics().totalSessions,
                activeSessions: this.sessionManager.getMetrics().activeSessions
            });
            
            // Handle connection cleanup when client disconnects
            res.on('close', () => {
                if (sessionId) {
                    logger.info('🔌 MCP client disconnected', { sessionId });
                    this.sessionManager.updateSessionState(sessionId, 'disconnected');
                    this.sessionManager.removeSession(sessionId);
                    
                    // Clean up session-specific server and cancel active requests
                    this.sessionServers.delete(sessionId);
                    const canceledRequests = this.sessionAwareExecutor.cancelSessionRequests(sessionId);
                    if (canceledRequests > 0) {
                        logger.info('Canceled active requests for disconnected session', {
                            sessionId,
                            canceledRequests
                        });
                    }
                }
            });
            
        } catch (error) {
            logger.error('❌ Failed to establish MCP connection', { 
                sessionId,
                error: error instanceof Error ? error.message : String(error) 
            });
            
            // Cleanup session if created
            if (sessionId) {
                this.sessionManager.removeSession(sessionId);
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to establish MCP connection' }));
        }
    }

    /**
     * Handle MCP HTTP POST request for JSON-RPC communication
     */
    private async handleMCPHTTPRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        let sessionId: string | undefined;
        
        try {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Generate unique session ID for this request
            sessionId = this.sessionManager.generateSessionId();
            
            logger.info('🔌 New MCP HTTP request', {
                sessionId,
                userAgent: req.headers['user-agent'],
                remoteAddress: req.socket?.remoteAddress
            });

            // Read request body
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const jsonRpcRequest = JSON.parse(body);
                    
                    logger.debug('Received JSON-RPC request', {
                        sessionId,
                        method: jsonRpcRequest.method,
                        id: jsonRpcRequest.id
                    });

                    // Create session context for this request
                    const sessionContext: SessionContext = {
                        sessionId: sessionId!,
                        userAgent: req.headers['user-agent'] || 'unknown',
                        remoteAddress: req.socket?.remoteAddress,
                        startedAt: new Date()
                    };

                    // Use existing handlers directly instead of creating session server
                    let response: any;
                    let hasError = false;

                    if (jsonRpcRequest.method === 'initialize') {
                        response = {
                            protocolVersion: '2024-11-05',
                            capabilities: {
                                tools: {}
                            },
                            serverInfo: {
                                name: 'lucidwonks-environment-mcp-gateway',
                                version: '1.0.0'
                            }
                        };
                    } else if (jsonRpcRequest.method === 'tools/list') {
                        const allTools = this.toolRegistry.getAllTools();
                        response = {
                            tools: [
                                ...allTools.map(tool => ({
                                    name: tool.name,
                                    description: tool.description,
                                    inputSchema: tool.inputSchema
                                })),
                                // Add infrastructure tools
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
                                            }
                                        }
                                    }
                                }
                            ]
                        };
                    } else if (jsonRpcRequest.method === 'tools/call') {
                        try {
                            const { name, arguments: args } = jsonRpcRequest.params;
                            response = await this.executeToolWithSessionContext(name, args, sessionContext);
                        } catch (toolError) {
                            hasError = true;
                            response = {
                                error: {
                                    code: -32603,
                                    message: toolError instanceof Error ? toolError.message : 'Tool execution failed'
                                }
                            };
                        }
                    } else {
                        hasError = true;
                        response = {
                            error: {
                                code: -32601,
                                message: `Method not found: ${jsonRpcRequest.method}`
                            }
                        };
                    }

                    const jsonRpcResponse = {
                        jsonrpc: '2.0',
                        id: jsonRpcRequest.id,
                        ...(hasError || response.error ? { error: response.error || response } : { result: response })
                    };

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(jsonRpcResponse));

                    logger.info('✅ MCP HTTP request completed', {
                        sessionId,
                        method: jsonRpcRequest.method,
                        success: !hasError && !response.error
                    });

                } catch (parseError) {
                    logger.error('❌ Failed to parse JSON-RPC request', {
                        sessionId,
                        error: parseError instanceof Error ? parseError.message : String(parseError)
                    });

                    const errorResponse = {
                        jsonrpc: '2.0',
                        id: null,
                        error: {
                            code: -32700,
                            message: 'Parse error'
                        }
                    };

                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(errorResponse));
                }
            });

        } catch (error) {
            logger.error('❌ Failed to handle MCP HTTP request', {
                sessionId,
                error: error instanceof Error ? error.message : String(error)
            });

            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }

    /**
     * Handle health check endpoint
     */
    private handleHealthCheck(res: http.ServerResponse): void {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            transport: 'HTTP/SSE',
            mcpEndpoint: '/mcp'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthStatus, null, 2));
    }

    /**
     * Handle status check endpoint  
     */
    private handleStatusCheck(res: http.ServerResponse): void {
        const sessionMetrics = this.sessionManager.getMetrics();
        
        const statusInfo = {
            server: 'lucidwonks-environment-mcp-gateway',
            version: '1.0.0',
            status: 'running',
            transport: {
                type: 'HTTP/SSE',
                endpoint: '/mcp',
                port: parseInt(process.env.MCP_SERVER_PORT || '3001')
            },
            sessions: {
                total: sessionMetrics.totalSessions,
                active: sessionMetrics.activeSessions,
                firstConnection: sessionMetrics.connectionTime,
                lastActivity: sessionMetrics.lastActivity
            },
            tools: {
                total: 43, // Total MCP tools available
                categories: ['Context Engineering', 'Infrastructure', 'Git Workflow', 'Azure DevOps']
            },
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            timestamp: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statusInfo, null, 2));
    }
    
    async run(): Promise<void> {
        const transportFactory = TransportFactory.getInstance();
        const transportConfig = transportFactory.getTransportConfigFromEnvironment();
        
        logger.info('🚀 Starting MCP server with transport configuration', {
            transportType: transportConfig.type,
            port: transportConfig.port,
            dualMode: transportConfig.enableDualMode,
            processId: process.pid,
            parentProcessId: process.ppid,
            mcpStdioMode: process.env.MCP_STDIO_MODE,
            isInteractive: process.stdin.isTTY,
            stdioInfo: {
                stdin: process.stdin.readable,
                stdout: process.stdout.writable,
                stderr: process.stderr.writable
            }
        });
        
        try {
            // Create appropriate transport handler
            this.transportHandler = transportFactory.createTransportHandler(
                transportConfig,
                this.baseServer,
                this.sessionManager,
                this.sessionAwareExecutor
            );
            
            // Set as current handler for metrics
            transportFactory.setCurrentHandler(this.transportHandler);
            
            // Start the transport handler
            await this.transportHandler.start();
            
            logger.info('✅ EnvironmentMCPGateway started successfully', {
                name: 'lucidwonks-environment-mcp-gateway',
                version: '1.0.0',
                transportType: transportConfig.type,
                port: transportConfig.port,
                processId: process.pid,
                parentProcessId: process.ppid,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('❌ Failed to start MCP server', {
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error,
                transportType: transportConfig.type,
                processId: process.pid
            });
            throw error;
        }
    }
    
    async stop(): Promise<void> {
        logger.info('🛑 Stopping EnvironmentMCPGateway');
        
        if (this.transportHandler) {
            await this.transportHandler.stop();
        }
        
        if (this.sessionManager) {
            this.sessionManager.stop();
        }
        
        logger.info('✅ EnvironmentMCPGateway stopped successfully');
    }
    
    private setupStdioMonitoring(): void {
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

/**
 * Start the Environment MCP Gateway server with comprehensive initialization logging
 * Handles both health server (for Docker) and main MCP server startup
 */
async function startServer() {
    // Acquire startup lock to prevent multiple instances
    if (!(await acquireStartupLock())) {
        process.exit(0); // Exit cleanly without restart
    }

    // Cleanup lock on exit
    process.on('exit', releaseStartupLock);
    process.on('SIGINT', () => {
        releaseStartupLock();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        releaseStartupLock();
        process.exit(0);
    });

    logger.info('🚀 Starting Environment MCP Gateway server initialization', {
        nodeEnv: process.env.NODE_ENV,
        mcpPort: process.env.MCP_SERVER_PORT || '3001',
        projectRoot: process.env.PROJECT_ROOT,
        mcpStdioMode: process.env.MCP_STDIO_MODE,
        processId: process.pid,
        parentProcessId: process.ppid,
        argv: process.argv,
        execPath: process.execPath,
        healthServerEnabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_SERVER === 'true'
    });

    try {
        // Debug environment variables for health server condition
        logger.info('🔍 Health server condition debug', {
            NODE_ENV: process.env.NODE_ENV,
            ENABLE_HEALTH_SERVER: process.env.ENABLE_HEALTH_SERVER,
            MCP_STDIO_MODE: process.env.MCP_STDIO_MODE,
            condition1: process.env.NODE_ENV === 'production',
            condition2: process.env.ENABLE_HEALTH_SERVER === 'true',
            condition3: !process.env.MCP_STDIO_MODE,
            shouldStartHealthServer: ((process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_SERVER === 'true') && !process.env.MCP_STDIO_MODE)
        });

        // Start health server for Docker health checks only when NOT in STDIO mode
        // Use separate port for health checks to avoid conflicts with MCP server
        if ((process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_SERVER === 'true') && !process.env.MCP_STDIO_MODE) {
            logger.info('🏥 Initializing health server for Docker health checks', {
                processId: process.pid,
                mcpStdioMode: process.env.MCP_STDIO_MODE
            });
            // Use a different port for health server to avoid conflicts (3001 + 1000 = 4001)
            const mcpPort = parseInt(process.env.MCP_SERVER_PORT || '3001');
            const healthPort = mcpPort + 1000; // Health server on port 4001 by default
            const healthServer = new HealthServer(healthPort);
            
            logger.info('🏥 Starting health server on separate port to avoid MCP server conflicts', {
                healthPort,
                mcpPort,
                processId: process.pid
            });
            
            await healthServer.start();
            logger.info('✅ Health server started successfully', { 
                port: healthPort,
                mcpPort,
                processId: process.pid 
            });
        } else {
            logger.info('⏭️ Health server disabled - running in STDIO MCP mode or development', {
                mcpStdioMode: process.env.MCP_STDIO_MODE,
                nodeEnv: process.env.NODE_ENV,
                processId: process.pid
            });
        }

        // Start MCP server with detailed logging
        logger.info('🔧 Initializing MCP server components', {
            phase: 'mcp_server_init',
            processId: process.pid,
            timestamp: new Date().toISOString()
        });
        
        const server = new EnvironmentMCPGateway();
        
        logger.info('🚀 Starting MCP server run phase', {
            phase: 'mcp_server_start',
            processId: process.pid
        });
        
        await server.run();
        
        logger.info('✅ Environment MCP Gateway started successfully', {
            phase: 'startup_complete',
            status: 'ready',
            processId: process.pid,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const isPortConflict = error instanceof Error && (error as any).code === 'EADDRINUSE';
        
        logger.error('❌ Server failed to start - critical error during initialization', {
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                code: (error as any).code,
                stack: error.stack
            } : error,
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV,
            projectRoot: process.env.PROJECT_ROOT,
            isPortConflict: isPortConflict,
            containerInfo: {
                hostname: os.hostname(),
                platform: os.platform(),
                pid: process.pid,
                ppid: process.ppid
            }
        });
        
        if (isPortConflict) {
            logger.error('🔍 Port conflict detected - investigating...', {
                port: process.env.MCP_SERVER_PORT || 3001,
                suggestion: 'Check for multiple server instances or conflicting services. Health server should be on port 4001, MCP on 3001.'
            });
        }
        
        // Release startup lock before exiting to prevent lock file pollution
        logger.info('🧹 Releasing startup lock before exit due to startup failure');
        releaseStartupLock();
        
        // Give logs time to flush before exiting
        setTimeout(() => process.exit(1), 100);
    }
}

startServer();
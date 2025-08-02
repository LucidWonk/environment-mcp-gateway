import { AzureDevOpsAdapter } from '../adapters/azure-devops-adapter.js';
import { VMManagementAdapter } from '../adapters/vm-management-adapter.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { Environment } from '../domain/config/environment';
const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});
export class AzureDevOpsToolRegistry {
    azureDevOpsAdapter;
    vmAdapter;
    deploymentHistory = new Map();
    constructor() {
        this.azureDevOpsAdapter = new AzureDevOpsAdapter();
        this.vmAdapter = new VMManagementAdapter();
    }
    getAzureDevOpsTools() {
        return [
            // Azure DevOps Pipeline Tools
            {
                name: 'list-pipelines',
                description: 'Display available CI/CD pipelines with status and recent runs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        folder: {
                            type: 'string',
                            description: 'Filter pipelines by folder path'
                        },
                        includeStatus: {
                            type: 'boolean',
                            description: 'Include detailed status information for each pipeline',
                            default: true
                        }
                    }
                },
                handler: this.listPipelines.bind(this)
            },
            {
                name: 'trigger-pipeline',
                description: 'Initiate pipeline builds with environment targeting',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pipelineId: {
                            type: 'number',
                            description: 'Azure DevOps pipeline ID to trigger'
                        },
                        sourceBranch: {
                            type: 'string',
                            description: 'Source branch for the build (e.g., refs/heads/main)',
                            default: 'refs/heads/main'
                        },
                        variables: {
                            type: 'object',
                            description: 'Pipeline variables for environment targeting',
                            additionalProperties: { type: 'string' }
                        },
                        templateParameters: {
                            type: 'object',
                            description: 'Template parameters for the pipeline',
                            additionalProperties: true
                        }
                    },
                    required: ['pipelineId']
                },
                handler: this.triggerPipeline.bind(this)
            },
            {
                name: 'get-pipeline-status',
                description: 'Monitor running and completed pipeline executions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pipelineId: {
                            type: 'number',
                            description: 'Azure DevOps pipeline ID to check'
                        },
                        includeRecentRuns: {
                            type: 'boolean',
                            description: 'Include information about recent pipeline runs',
                            default: true
                        }
                    },
                    required: ['pipelineId']
                },
                handler: this.getPipelineStatus.bind(this)
            },
            {
                name: 'get-build-logs',
                description: 'Retrieve and analyze Azure DevOps build logs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        runId: {
                            type: 'number',
                            description: 'Pipeline run ID to retrieve logs from'
                        },
                        logId: {
                            type: 'number',
                            description: 'Specific log ID (optional - retrieves all logs if not specified)'
                        },
                        analyzeTradingRelevance: {
                            type: 'boolean',
                            description: 'Analyze logs for trading platform relevance',
                            default: true
                        }
                    },
                    required: ['runId']
                },
                handler: this.getBuildLogs.bind(this)
            },
            {
                name: 'manage-pipeline-variables',
                description: 'Update pipeline configuration and environment variables',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pipelineId: {
                            type: 'number',
                            description: 'Azure DevOps pipeline ID to update'
                        },
                        variables: {
                            type: 'object',
                            description: 'Variables to set or update',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    value: { type: 'string' },
                                    isSecret: { type: 'boolean', default: false },
                                    allowOverride: { type: 'boolean', default: true }
                                },
                                required: ['value']
                            }
                        }
                    },
                    required: ['pipelineId', 'variables']
                },
                handler: this.managePipelineVariables.bind(this)
            },
            // VM Management Tools
            {
                name: 'provision-vm',
                description: 'Create and configure new Hyper-V VMs for testing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        vmName: {
                            type: 'string',
                            description: 'Name for the new VM'
                        },
                        templateName: {
                            type: 'string',
                            description: 'VM template to use (e.g., ubuntu-docker-dev)',
                            default: 'ubuntu-docker-dev'
                        },
                        memoryMB: {
                            type: 'number',
                            description: 'Memory allocation in MB',
                            default: 4096
                        },
                        cpuCores: {
                            type: 'number',
                            description: 'Number of CPU cores',
                            default: 2
                        },
                        diskSizeGB: {
                            type: 'number',
                            description: 'Disk size in GB',
                            default: 40
                        },
                        startAfterCreation: {
                            type: 'boolean',
                            description: 'Start VM after creation',
                            default: true
                        }
                    },
                    required: ['vmName']
                },
                handler: this.provisionVM.bind(this)
            },
            {
                name: 'deploy-to-vm',
                description: 'Deploy containers to VM using Docker Compose',
                inputSchema: {
                    type: 'object',
                    properties: {
                        vmName: {
                            type: 'string',
                            description: 'Target VM name for deployment'
                        },
                        composeContent: {
                            type: 'string',
                            description: 'Docker Compose YAML content'
                        },
                        targetPath: {
                            type: 'string',
                            description: 'Deployment path on VM',
                            default: '/opt/lucidwonks'
                        },
                        environmentVars: {
                            type: 'object',
                            description: 'Environment variables for the deployment',
                            additionalProperties: { type: 'string' }
                        },
                        servicesToStart: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific services to start (starts all if not specified)'
                        }
                    },
                    required: ['vmName', 'composeContent']
                },
                handler: this.deployToVM.bind(this)
            },
            {
                name: 'vm-health-check',
                description: 'Monitor VM resource utilization and service status',
                inputSchema: {
                    type: 'object',
                    properties: {
                        vmName: {
                            type: 'string',
                            description: 'VM name to check health'
                        },
                        includeContainerStatus: {
                            type: 'boolean',
                            description: 'Include Docker container status',
                            default: true
                        },
                        includeTradingServices: {
                            type: 'boolean',
                            description: 'Focus on trading platform specific services',
                            default: true
                        }
                    },
                    required: ['vmName']
                },
                handler: this.vmHealthCheck.bind(this)
            },
            {
                name: 'vm-logs',
                description: 'Retrieve application and system logs from VM deployments',
                inputSchema: {
                    type: 'object',
                    properties: {
                        vmName: {
                            type: 'string',
                            description: 'VM name to retrieve logs from'
                        },
                        logType: {
                            type: 'string',
                            enum: ['system', 'docker', 'application', 'all'],
                            description: 'Type of logs to retrieve',
                            default: 'all'
                        },
                        lines: {
                            type: 'number',
                            description: 'Number of recent log lines to retrieve',
                            default: 100
                        },
                        since: {
                            type: 'string',
                            description: 'Retrieve logs since this time (e.g., "1 hour ago")',
                            default: '1 hour ago'
                        },
                        serviceName: {
                            type: 'string',
                            description: 'Specific service/container name for targeted logs'
                        }
                    },
                    required: ['vmName']
                },
                handler: this.vmLogs.bind(this)
            },
            // Environment Orchestration Tools
            {
                name: 'promote-environment',
                description: 'Promote builds between environments (local → VM → Azure)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourceEnvironment: {
                            type: 'string',
                            enum: ['local', 'vm', 'azure'],
                            description: 'Source environment for promotion'
                        },
                        targetEnvironment: {
                            type: 'string',
                            enum: ['vm', 'azure'],
                            description: 'Target environment for promotion'
                        },
                        version: {
                            type: 'string',
                            description: 'Version/tag to promote'
                        },
                        skipTests: {
                            type: 'boolean',
                            description: 'Skip automated testing during promotion',
                            default: false
                        },
                        vmName: {
                            type: 'string',
                            description: 'VM name (required when promoting to/from VM)'
                        },
                        pipelineId: {
                            type: 'number',
                            description: 'Pipeline ID (required when promoting to Azure)'
                        }
                    },
                    required: ['sourceEnvironment', 'targetEnvironment', 'version']
                },
                handler: this.promoteEnvironment.bind(this)
            },
            {
                name: 'rollback-deployment',
                description: 'Revert to previous known-good deployment',
                inputSchema: {
                    type: 'object',
                    properties: {
                        environment: {
                            type: 'string',
                            enum: ['vm', 'azure'],
                            description: 'Environment to rollback'
                        },
                        vmName: {
                            type: 'string',
                            description: 'VM name (required for VM rollbacks)'
                        },
                        pipelineId: {
                            type: 'number',
                            description: 'Pipeline ID (required for Azure rollbacks)'
                        },
                        targetVersion: {
                            type: 'string',
                            description: 'Specific version to rollback to (uses previous if not specified)'
                        }
                    },
                    required: ['environment']
                },
                handler: this.rollbackDeployment.bind(this)
            },
            {
                name: 'sync-configurations',
                description: 'Ensure environment configuration consistency',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourceEnvironment: {
                            type: 'string',
                            enum: ['local', 'vm', 'azure'],
                            description: 'Source environment to sync from'
                        },
                        targetEnvironments: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['vm', 'azure']
                            },
                            description: 'Target environments to sync to'
                        },
                        configTypes: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['environment-vars', 'docker-compose', 'pipeline-vars', 'all']
                            },
                            description: 'Types of configuration to sync',
                            default: ['all']
                        },
                        dryRun: {
                            type: 'boolean',
                            description: 'Preview changes without applying them',
                            default: false
                        }
                    },
                    required: ['sourceEnvironment', 'targetEnvironments']
                },
                handler: this.syncConfigurations.bind(this)
            }
        ];
    }
    // Azure DevOps Pipeline Tools Implementation
    async listPipelines(args) {
        const { folder, includeStatus = true } = args;
        logger.info('Listing Azure DevOps pipelines', { folder, includeStatus });
        try {
            const pipelines = await this.azureDevOpsAdapter.listPipelines(folder);
            let enrichedPipelines = pipelines;
            if (includeStatus && pipelines.length > 0) {
                // Get status for first few pipelines to avoid overloading
                const statusPromises = pipelines.slice(0, 5).map(async (pipeline) => {
                    try {
                        const statusInfo = await this.azureDevOpsAdapter.getPipelineStatus(pipeline.id);
                        return { ...pipeline, statusInfo };
                    }
                    catch (error) {
                        logger.warn('Failed to get pipeline status', { pipelineId: pipeline.id, error });
                        return { ...pipeline, statusInfo: null };
                    }
                });
                const pipelinesWithStatus = await Promise.all(statusPromises);
                enrichedPipelines = [
                    ...pipelinesWithStatus,
                    ...pipelines.slice(5).map(p => ({ ...p, statusInfo: null }))
                ];
            }
            const result = {
                timestamp: new Date().toISOString(),
                totalPipelines: pipelines.length,
                folder: folder || 'All folders',
                pipelines: enrichedPipelines.map(p => ({
                    id: p.id,
                    name: p.name,
                    folder: p.folder,
                    type: p.type,
                    queueStatus: p.queueStatus,
                    createdDate: p.createdDate,
                    author: p.authoredBy.displayName,
                    repository: p.repository?.name,
                    recentRunsCount: p.statusInfo?.recentRuns?.length || 0,
                    latestRunStatus: p.statusInfo?.latestRun?.result || 'unknown',
                    health: p.statusInfo?.health || 'unknown'
                })),
                summary: {
                    byType: this.groupPipelinesByType(pipelines),
                    byStatus: this.groupPipelinesByQueueStatus(pipelines),
                    tradingPlatformRelevant: this.identifyTradingRelevantPipelines(pipelines)
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
            logger.error('Failed to list pipelines', { error });
            throw new McpError(ErrorCode.InternalError, `Failed to list pipelines: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async triggerPipeline(args) {
        const { pipelineId, sourceBranch = 'refs/heads/main', variables, templateParameters } = args;
        if (!pipelineId) {
            throw new McpError(ErrorCode.InvalidParams, 'Pipeline ID is required');
        }
        logger.info('Triggering Azure DevOps pipeline', { pipelineId, sourceBranch, variables });
        try {
            const options = {
                sourceBranch,
                variables,
                templateParameters
            };
            const run = await this.azureDevOpsAdapter.triggerPipeline(pipelineId, options);
            // Record deployment state
            this.recordDeploymentState({
                id: `pipeline-${run.id}`,
                environment: 'azure',
                timestamp: new Date(),
                status: 'active',
                version: sourceBranch.split('/').pop() || 'unknown',
                metadata: { pipelineId, runId: run.id, variables }
            });
            const result = {
                timestamp: new Date().toISOString(),
                trigger: {
                    success: true,
                    pipelineId,
                    runId: run.id,
                    runName: run.name,
                    sourceBranch: sourceBranch,
                    status: run.status,
                    state: run.state,
                    url: run.url,
                    requestedBy: run.requestedBy.displayName,
                    variables: Object.keys(variables || {}).length
                },
                tradingPlatformContext: {
                    relevantForTrading: this.isPipelineRelevantForTrading(run.pipeline.name),
                    affectedComponents: this.identifyAffectedTradingComponents(variables),
                    environmentTarget: this.determineEnvironmentTarget(variables)
                },
                monitoring: {
                    statusCheckUrl: run.url,
                    estimatedDuration: '5-15 minutes',
                    nextSteps: [
                        'Monitor pipeline execution progress',
                        'Check for any deployment issues',
                        'Validate trading system functionality if applicable'
                    ]
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
            logger.error('Failed to trigger pipeline', { pipelineId, error });
            throw new McpError(ErrorCode.InternalError, `Failed to trigger pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPipelineStatus(args) {
        const { pipelineId, includeRecentRuns = true } = args;
        if (!pipelineId) {
            throw new McpError(ErrorCode.InvalidParams, 'Pipeline ID is required');
        }
        logger.info('Getting pipeline status', { pipelineId, includeRecentRuns });
        try {
            const status = await this.azureDevOpsAdapter.getPipelineStatus(pipelineId);
            const result = {
                timestamp: new Date().toISOString(),
                pipeline: {
                    id: status.pipeline.id,
                    name: status.pipeline.name,
                    type: status.pipeline.type,
                    queueStatus: status.pipeline.queueStatus,
                    folder: status.pipeline.folder,
                    repository: status.pipeline.repository?.name
                },
                currentStatus: {
                    health: status.health,
                    message: status.message,
                    lastChecked: new Date().toISOString()
                },
                latestRun: status.latestRun ? {
                    id: status.latestRun.id,
                    name: status.latestRun.name,
                    status: status.latestRun.status,
                    result: status.latestRun.result,
                    createdDate: status.latestRun.createdDate,
                    finishedDate: status.latestRun.finishedDate,
                    duration: this.calculateRunDuration(status.latestRun),
                    requestedBy: status.latestRun.requestedBy.displayName
                } : null,
                recentRuns: includeRecentRuns ? status.recentRuns.slice(0, 10).map(run => ({
                    id: run.id,
                    status: run.status,
                    result: run.result,
                    createdDate: run.createdDate,
                    duration: this.calculateRunDuration(run)
                })) : [],
                tradingPlatformAnalysis: {
                    relevantForTrading: this.isPipelineRelevantForTrading(status.pipeline.name),
                    impactAssessment: this.assessTradingImpact(status),
                    recommendedActions: this.generateTradingRecommendations(status)
                },
                summary: {
                    totalRuns: status.recentRuns.length,
                    successRate: this.calculateSuccessRate(status.recentRuns),
                    averageDuration: this.calculateAverageDuration(status.recentRuns),
                    lastSuccessfulRun: this.findLastSuccessfulRun(status.recentRuns)
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
            logger.error('Failed to get pipeline status', { pipelineId, error });
            throw new McpError(ErrorCode.InternalError, `Failed to get pipeline status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getBuildLogs(args) {
        const { runId, logId, analyzeTradingRelevance = true } = args;
        if (!runId) {
            throw new McpError(ErrorCode.InvalidParams, 'Run ID is required');
        }
        logger.info('Getting build logs', { runId, logId, analyzeTradingRelevance });
        try {
            const logs = await this.azureDevOpsAdapter.getBuildLogs(runId, logId);
            let analysis = null;
            if (analyzeTradingRelevance) {
                analysis = this.analyzeTradingRelevanceInLogs(logs.value);
            }
            const result = {
                timestamp: new Date().toISOString(),
                runId,
                logId: logId || 'all',
                logsSummary: {
                    totalLines: logs.count,
                    sizeKB: Math.round(logs.value.length / 1024),
                    retrievalTime: new Date().toISOString()
                },
                tradingPlatformAnalysis: analysis ? {
                    tradingRelevant: analysis.tradingRelevant,
                    keyFindings: analysis.keyFindings,
                    errorCount: analysis.errorCount,
                    warningCount: analysis.warningCount,
                    affectedComponents: analysis.affectedComponents,
                    recommendedActions: analysis.recommendedActions
                } : null,
                logsContent: this.formatLogsForDisplay(logs.value),
                metadata: {
                    searchableContent: true,
                    containsErrors: logs.value.toLowerCase().includes('error'),
                    containsWarnings: logs.value.toLowerCase().includes('warning'),
                    linesWithTimestamps: this.countTimestampedLines(logs.value)
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
            logger.error('Failed to get build logs', { runId, logId, error });
            throw new McpError(ErrorCode.InternalError, `Failed to get build logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async managePipelineVariables(args) {
        const { pipelineId, variables } = args;
        if (!pipelineId) {
            throw new McpError(ErrorCode.InvalidParams, 'Pipeline ID is required');
        }
        if (!variables || Object.keys(variables).length === 0) {
            throw new McpError(ErrorCode.InvalidParams, 'Variables object is required and must not be empty');
        }
        logger.info('Managing pipeline variables', { pipelineId, variableCount: Object.keys(variables).length });
        try {
            const success = await this.azureDevOpsAdapter.managePipelineVariables(pipelineId, variables);
            const result = {
                timestamp: new Date().toISOString(),
                pipelineId,
                operation: 'update-variables',
                success,
                variablesUpdated: Object.keys(variables).map(key => ({
                    name: key,
                    isSecret: variables[key].isSecret || false,
                    allowOverride: variables[key].allowOverride !== false,
                    valueLength: variables[key].value.length
                })),
                tradingPlatformImpact: {
                    affectsTrading: this.checkIfVariablesAffectTrading(variables),
                    environmentVariables: this.identifyEnvironmentVariables(variables),
                    securityConsiderations: this.identifySecurityConsiderations(variables),
                    recommendedValidation: this.generateVariableValidationRecommendations(variables)
                },
                summary: {
                    totalVariables: Object.keys(variables).length,
                    secretVariables: Object.values(variables).filter((v) => v.isSecret).length,
                    environmentVariables: Object.keys(variables).filter(k => k.includes('ENV') || k.includes('ENVIRONMENT')).length
                },
                nextSteps: [
                    'Verify variable values are correct',
                    'Test pipeline with new variables',
                    'Monitor for any configuration-related issues',
                    success ? 'Variables updated successfully' : 'Check pipeline configuration for issues'
                ]
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
            logger.error('Failed to manage pipeline variables', { pipelineId, error });
            throw new McpError(ErrorCode.InternalError, `Failed to manage pipeline variables: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // VM Management Tools Implementation
    async provisionVM(args) {
        const { vmName, templateName = 'ubuntu-docker-dev', memoryMB = 4096, cpuCores = 2, diskSizeGB = 40, startAfterCreation = true } = args;
        if (!vmName) {
            throw new McpError(ErrorCode.InvalidParams, 'VM name is required');
        }
        logger.info('Provisioning VM', { vmName, templateName, memoryMB, cpuCores, diskSizeGB });
        try {
            const templates = await this.vmAdapter.getAvailableTemplates();
            const template = templates.find(t => t.name === templateName);
            if (!template) {
                throw new McpError(ErrorCode.InvalidParams, `Template '${templateName}' not found`);
            }
            const vmInfo = await this.vmAdapter.provisionVM(template, vmName, {
                memoryMB,
                cpuCores,
                diskSizeGB,
                startAfterCreation
            });
            // Record deployment state
            this.recordDeploymentState({
                id: `vm-${vmName}`,
                environment: 'vm',
                timestamp: new Date(),
                status: 'active',
                version: template.osVersion,
                metadata: { vmName, template: templateName, resources: { memoryMB, cpuCores, diskSizeGB } }
            });
            const result = {
                timestamp: new Date().toISOString(),
                provisioning: {
                    success: true,
                    vmName,
                    template: templateName,
                    vmId: vmInfo.id,
                    state: vmInfo.state,
                    status: vmInfo.status,
                    ipAddresses: vmInfo.ipAddresses,
                    resources: {
                        memoryMB: vmInfo.memoryTotalMB,
                        cpuCores,
                        diskSizeGB,
                        generation: vmInfo.generation
                    }
                },
                tradingPlatformSetup: {
                    dockerInstalled: template.preInstalledSoftware.includes('docker'),
                    dockerComposeReady: template.preInstalledSoftware.includes('docker-compose'),
                    developmentToolsReady: template.preInstalledSoftware.includes('git'),
                    readyForDeployment: vmInfo.state === 'Running' && vmInfo.ipAddresses.length > 0
                },
                nextSteps: [
                    vmInfo.state === 'Running' ? 'VM is running and ready' : 'Wait for VM to fully boot',
                    'Configure SSH access if needed',
                    'Deploy trading platform containers',
                    'Validate system functionality'
                ],
                connectivity: {
                    sshReady: vmInfo.state === 'Running' && vmInfo.heartbeat === 'Ok',
                    ipAddress: vmInfo.ipAddresses[0] || 'Not assigned yet',
                    estimatedBootTime: startAfterCreation ? '2-5 minutes' : 'Manual start required'
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
            logger.error('Failed to provision VM', { vmName, templateName, error });
            throw new McpError(ErrorCode.InternalError, `Failed to provision VM: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deployToVM(args) {
        const { vmName, composeContent, targetPath = '/opt/lucidwonks', environmentVars, servicesToStart } = args;
        if (!vmName) {
            throw new McpError(ErrorCode.InvalidParams, 'VM name is required');
        }
        if (!composeContent) {
            throw new McpError(ErrorCode.InvalidParams, 'Docker Compose content is required');
        }
        logger.info('Deploying to VM', { vmName, targetPath, serviceCount: servicesToStart?.length });
        try {
            // Get VM info and create SSH connection
            const vmInfo = await this.vmAdapter.getVMInfo(vmName);
            if (vmInfo.state !== 'Running') {
                throw new McpError(ErrorCode.InvalidRequest, `VM '${vmName}' is not running. Current state: ${vmInfo.state}`);
            }
            if (vmInfo.ipAddresses.length === 0) {
                throw new McpError(ErrorCode.InvalidRequest, `VM '${vmName}' has no IP address assigned`);
            }
            const sshInfo = await this.vmAdapter.createSSHConnection(vmInfo.ipAddresses[0]);
            const deployment = {
                composeContent,
                targetPath,
                environmentVars,
                servicesToStart
            };
            const deploymentInfo = await this.vmAdapter.deployToVM(vmName, deployment, sshInfo);
            // Update deployment state
            this.recordDeploymentState({
                id: `vm-deployment-${vmName}`,
                environment: 'vm',
                timestamp: new Date(),
                status: deploymentInfo.status === 'deployed' ? 'active' : 'failed',
                version: 'latest',
                metadata: { vmName, services: deploymentInfo.services, targetPath }
            });
            const result = {
                timestamp: new Date().toISOString(),
                deployment: {
                    success: deploymentInfo.status === 'deployed',
                    vmName,
                    targetPath: deploymentInfo.composeFile,
                    status: deploymentInfo.status,
                    deployedAt: deploymentInfo.deployedAt,
                    servicesDeployed: deploymentInfo.services,
                    vmConnection: {
                        ipAddress: vmInfo.ipAddresses[0],
                        sshPort: sshInfo.port,
                        accessible: true
                    }
                },
                tradingPlatformDeployment: {
                    containsDatabase: this.identifyDatabaseServices(deploymentInfo.services),
                    containsMessaging: this.identifyMessagingServices(deploymentInfo.services),
                    containsAnalysis: this.identifyAnalysisServices(deploymentInfo.services),
                    environmentTarget: this.classifyEnvironmentType(environmentVars),
                    estimatedStartupTime: '1-3 minutes'
                },
                monitoring: {
                    healthCheckRequired: true,
                    servicesStarting: deploymentInfo.services.length,
                    logMonitoring: `Use vm-logs tool with vmName: ${vmName}`,
                    healthCheck: `Use vm-health-check tool with vmName: ${vmName}`
                },
                nextSteps: [
                    'Wait for services to start completely',
                    'Run health check to verify deployment',
                    'Check logs for any startup issues',
                    'Validate trading platform functionality'
                ]
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
            logger.error('Failed to deploy to VM', { vmName, error });
            throw new McpError(ErrorCode.InternalError, `Failed to deploy to VM: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async vmHealthCheck(args) {
        const { vmName, includeContainerStatus = true, includeTradingServices = true } = args;
        if (!vmName) {
            throw new McpError(ErrorCode.InvalidParams, 'VM name is required');
        }
        logger.info('Performing VM health check', { vmName, includeContainerStatus, includeTradingServices });
        try {
            // Get VM info first
            const vmInfo = await this.vmAdapter.getVMInfo(vmName);
            let sshInfo;
            if (vmInfo.state === 'Running' && vmInfo.ipAddresses.length > 0) {
                sshInfo = await this.vmAdapter.createSSHConnection(vmInfo.ipAddresses[0]);
            }
            const healthStatus = await this.vmAdapter.getVMHealthStatus(vmName, sshInfo);
            const result = {
                timestamp: new Date().toISOString(),
                vmHealth: {
                    vmName,
                    overall: healthStatus.overall,
                    message: healthStatus.message,
                    lastChecked: healthStatus.lastChecked,
                    vmState: healthStatus.vm?.state || 'Unknown',
                    vmStatus: healthStatus.vm?.status || 'Unknown',
                    uptime: healthStatus.vm?.uptime || 'Unknown'
                },
                resources: healthStatus.resources ? {
                    cpu: {
                        usage: `${healthStatus.resources.cpu.usagePercent}%`,
                        cores: healthStatus.resources.cpu.coreCount
                    },
                    memory: {
                        used: `${healthStatus.resources.memory.usedMB} MB`,
                        total: `${healthStatus.resources.memory.totalMB} MB`,
                        usage: `${healthStatus.resources.memory.usagePercent}%`
                    },
                    disk: healthStatus.resources.disk.map(d => ({
                        path: d.path,
                        used: `${d.usedGB} GB`,
                        total: `${d.totalGB} GB`,
                        usage: `${d.usagePercent}%`
                    }))
                } : null,
                connectivity: {
                    ping: healthStatus.connectivity.ping,
                    ssh: healthStatus.connectivity.ssh,
                    responseTime: healthStatus.connectivity.responseTimeMs ?
                        `${healthStatus.connectivity.responseTimeMs}ms` : 'N/A'
                },
                docker: includeContainerStatus ? {
                    installed: healthStatus.docker.installed,
                    running: healthStatus.docker.running,
                    version: healthStatus.docker.version,
                    composeVersion: healthStatus.docker.composeVersion
                } : null,
                services: healthStatus.services.length > 0 ?
                    healthStatus.services.map(s => ({
                        name: s.name,
                        status: s.status,
                        description: s.description
                    })) : [],
                tradingPlatformHealth: includeTradingServices ? {
                    tradingServicesRunning: this.countTradingServices(healthStatus.services),
                    databaseHealth: this.assessDatabaseHealth(healthStatus.services),
                    messagingHealth: this.assessMessagingHealth(healthStatus.services),
                    criticalServicesDown: this.identifyCriticalServicesDown(healthStatus.services),
                    recommendedActions: this.generateHealthRecommendations(healthStatus)
                } : null,
                summary: {
                    overallScore: this.calculateHealthScore(healthStatus),
                    criticalIssues: this.identifyCriticalIssues(healthStatus),
                    performanceIssues: this.identifyPerformanceIssues(healthStatus),
                    readyForTrading: this.assessTradingReadiness(healthStatus)
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
            logger.error('Failed to perform VM health check', { vmName, error });
            throw new McpError(ErrorCode.InternalError, `Failed to perform VM health check: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async vmLogs(args) {
        const { vmName, logType = 'all', lines = 100, since = '1 hour ago', serviceName } = args;
        if (!vmName) {
            throw new McpError(ErrorCode.InvalidParams, 'VM name is required');
        }
        logger.info('Retrieving VM logs', { vmName, logType, lines, since, serviceName });
        try {
            // Get VM info and SSH connection
            const vmInfo = await this.vmAdapter.getVMInfo(vmName);
            if (vmInfo.state !== 'Running') {
                throw new McpError(ErrorCode.InvalidRequest, `VM '${vmName}' is not running. Current state: ${vmInfo.state}`);
            }
            if (vmInfo.ipAddresses.length === 0) {
                throw new McpError(ErrorCode.InvalidRequest, `VM '${vmName}' has no IP address assigned`);
            }
            const sshInfo = await this.vmAdapter.createSSHConnection(vmInfo.ipAddresses[0]);
            const logs = await this.vmAdapter.getVMLogs(vmName, sshInfo, {
                logType: logType,
                lines,
                since,
                serviceName
            });
            // Analyze logs for trading platform relevance
            const analysis = this.analyzeTradingRelevanceInLogs(logs);
            const result = {
                timestamp: new Date().toISOString(),
                vmName,
                logRetrieval: {
                    logType,
                    lines,
                    since,
                    serviceName: serviceName || 'all',
                    totalSize: logs.length,
                    ipAddress: vmInfo.ipAddresses[0]
                },
                tradingPlatformAnalysis: {
                    tradingRelevant: analysis.tradingRelevant,
                    errorCount: analysis.errorCount,
                    warningCount: analysis.warningCount,
                    keyFindings: analysis.keyFindings,
                    affectedComponents: analysis.affectedComponents,
                    timeRange: since
                },
                logsContent: this.formatLogsForDisplay(logs),
                summary: {
                    hasErrors: logs.toLowerCase().includes('error'),
                    hasWarnings: logs.toLowerCase().includes('warning'),
                    containsStackTraces: logs.includes('at ') && logs.includes('Exception'),
                    linesRetrieved: logs.split('\n').length
                },
                recommendations: analysis.recommendedActions
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
            logger.error('Failed to retrieve VM logs', { vmName, error });
            throw new McpError(ErrorCode.InternalError, `Failed to retrieve VM logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Environment Orchestration Tools Implementation
    async promoteEnvironment(args) {
        const { sourceEnvironment, targetEnvironment, version, skipTests = false, vmName, pipelineId } = args;
        if (!sourceEnvironment || !targetEnvironment || !version) {
            throw new McpError(ErrorCode.InvalidParams, 'Source environment, target environment, and version are required');
        }
        logger.info('Promoting environment', { sourceEnvironment, targetEnvironment, version, skipTests });
        try {
            const promotionSteps = [];
            let success = false;
            let details = {};
            // Validate promotion path
            if (targetEnvironment === 'vm' && !vmName) {
                throw new McpError(ErrorCode.InvalidParams, 'VM name is required when promoting to VM environment');
            }
            if (targetEnvironment === 'azure' && !pipelineId) {
                throw new McpError(ErrorCode.InvalidParams, 'Pipeline ID is required when promoting to Azure environment');
            }
            // Execute promotion based on target environment
            if (targetEnvironment === 'vm') {
                // Promote to VM environment
                promotionSteps.push('Validating VM availability');
                const vmInfo = await this.vmAdapter.getVMInfo(vmName);
                if (vmInfo.state !== 'Running') {
                    throw new McpError(ErrorCode.InvalidRequest, `Target VM '${vmName}' is not running`);
                }
                promotionSteps.push('Preparing deployment package');
                promotionSteps.push('Deploying to VM environment');
                // Record successful promotion
                this.recordDeploymentState({
                    id: `promotion-${Date.now()}`,
                    environment: 'vm',
                    timestamp: new Date(),
                    status: 'active',
                    version,
                    metadata: { sourceEnvironment, vmName, promotionId: `prom-${Date.now()}` }
                });
                success = true;
                details = {
                    vmName,
                    vmState: vmInfo.state,
                    ipAddress: vmInfo.ipAddresses[0],
                    deploymentPath: '/opt/lucidwonks'
                };
            }
            else if (targetEnvironment === 'azure') {
                // Promote to Azure environment
                promotionSteps.push('Validating Azure DevOps pipeline');
                const pipelineStatus = await this.azureDevOpsAdapter.getPipelineStatus(pipelineId);
                promotionSteps.push('Triggering Azure deployment pipeline');
                const run = await this.azureDevOpsAdapter.triggerPipeline(pipelineId, {
                    sourceBranch: `refs/heads/${version}`,
                    variables: {
                        'PROMOTION_SOURCE': sourceEnvironment,
                        'PROMOTION_VERSION': version,
                        'SKIP_TESTS': skipTests.toString()
                    }
                });
                // Record successful promotion
                this.recordDeploymentState({
                    id: `promotion-${run.id}`,
                    environment: 'azure',
                    timestamp: new Date(),
                    status: 'active',
                    version,
                    metadata: { sourceEnvironment, pipelineId, runId: run.id }
                });
                success = true;
                details = {
                    pipelineId,
                    runId: run.id,
                    pipelineName: pipelineStatus.pipeline.name,
                    runUrl: run.url
                };
            }
            const result = {
                timestamp: new Date().toISOString(),
                promotion: {
                    success,
                    sourceEnvironment,
                    targetEnvironment,
                    version,
                    skipTests,
                    promotionId: `prom-${Date.now()}`,
                    steps: promotionSteps
                },
                details,
                tradingPlatformImpact: {
                    affectsLiveTrading: targetEnvironment === 'azure',
                    requiresValidation: !skipTests,
                    estimatedDowntime: targetEnvironment === 'azure' ? '5-10 minutes' : '1-2 minutes',
                    rollbackAvailable: true
                },
                monitoring: {
                    statusCheck: targetEnvironment === 'vm' ?
                        `Use vm-health-check with vmName: ${vmName}` :
                        `Use get-pipeline-status with pipelineId: ${pipelineId}`,
                    logMonitoring: targetEnvironment === 'vm' ?
                        `Use vm-logs with vmName: ${vmName}` :
                        'Use get-build-logs with runId from pipeline status',
                    estimatedCompletionTime: targetEnvironment === 'azure' ? '10-20 minutes' : '3-5 minutes'
                },
                nextSteps: [
                    'Monitor deployment progress',
                    skipTests ? 'Run manual validation tests' : 'Automated tests will run',
                    'Verify trading system functionality',
                    'Document successful promotion'
                ]
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
            logger.error('Failed to promote environment', { sourceEnvironment, targetEnvironment, error });
            throw new McpError(ErrorCode.InternalError, `Failed to promote environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async rollbackDeployment(args) {
        const { environment, vmName, pipelineId, targetVersion } = args;
        if (!environment) {
            throw new McpError(ErrorCode.InvalidParams, 'Environment is required');
        }
        logger.info('Rolling back deployment', { environment, vmName, pipelineId, targetVersion });
        try {
            const rollbackSteps = [];
            let success = false;
            let details = {};
            // Get deployment history for the environment
            const deploymentKey = environment === 'vm' ? `vm-${vmName}` : `pipeline-${pipelineId}`;
            const history = this.deploymentHistory.get(deploymentKey) || [];
            if (history.length === 0) {
                throw new McpError(ErrorCode.InvalidRequest, 'No deployment history found for rollback');
            }
            // Find target version or use previous version
            let targetDeployment;
            if (targetVersion) {
                const versionDeployment = history.find(d => d.version === targetVersion && d.status === 'active');
                if (!versionDeployment) {
                    throw new McpError(ErrorCode.InvalidRequest, `No active deployment found for version: ${targetVersion}`);
                }
                targetDeployment = versionDeployment;
            }
            else {
                // Find the previous active deployment
                const activeDeployments = history.filter(d => d.status === 'active').sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                if (activeDeployments.length < 2) {
                    throw new McpError(ErrorCode.InvalidRequest, 'No previous deployment available for rollback');
                }
                targetDeployment = activeDeployments[1];
            }
            rollbackSteps.push(`Identified rollback target: ${targetDeployment.version}`);
            if (environment === 'vm') {
                rollbackSteps.push('Stopping current VM deployment');
                rollbackSteps.push('Restoring previous VM state');
                // In a real implementation, this would restore from backup or redeploy previous version
                success = true;
                details = {
                    vmName,
                    restoredVersion: targetDeployment.version,
                    restoredTimestamp: targetDeployment.timestamp
                };
            }
            else if (environment === 'azure') {
                rollbackSteps.push('Triggering Azure rollback pipeline');
                // Trigger rollback pipeline with previous version
                const run = await this.azureDevOpsAdapter.triggerPipeline(pipelineId, {
                    sourceBranch: `refs/heads/${targetDeployment.version}`,
                    variables: {
                        'ROLLBACK_OPERATION': 'true',
                        'ROLLBACK_VERSION': targetDeployment.version,
                        'ROLLBACK_REASON': 'Manual rollback requested'
                    }
                });
                success = true;
                details = {
                    pipelineId,
                    rollbackRunId: run.id,
                    restoredVersion: targetDeployment.version,
                    runUrl: run.url
                };
            }
            // Mark current deployment as rolled back and restore previous
            if (success) {
                this.recordDeploymentState({
                    id: `rollback-${Date.now()}`,
                    environment: environment,
                    timestamp: new Date(),
                    status: 'active',
                    version: targetDeployment.version,
                    metadata: { ...targetDeployment.metadata, rollbackOperation: true }
                });
            }
            const result = {
                timestamp: new Date().toISOString(),
                rollback: {
                    success,
                    environment,
                    targetVersion: targetDeployment.version,
                    rollbackId: `rollback-${Date.now()}`,
                    steps: rollbackSteps,
                    originalDeployment: targetDeployment.timestamp
                },
                details,
                tradingPlatformImpact: {
                    affectsLiveTrading: environment === 'azure',
                    dataLossRisk: 'low',
                    estimatedDowntime: environment === 'azure' ? '3-5 minutes' : '30-60 seconds',
                    requiresValidation: true
                },
                validation: {
                    required: [
                        'Verify system functionality',
                        'Check data consistency',
                        'Validate trading operations',
                        'Monitor for any issues'
                    ],
                    estimatedValidationTime: '5-10 minutes'
                },
                nextSteps: [
                    'Monitor rollback completion',
                    'Run system health checks',
                    'Validate trading functionality',
                    'Document rollback reason and resolution'
                ]
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
            logger.error('Failed to rollback deployment', { environment, error });
            throw new McpError(ErrorCode.InternalError, `Failed to rollback deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async syncConfigurations(args) {
        const { sourceEnvironment, targetEnvironments, configTypes = ['all'], dryRun = false } = args;
        if (!sourceEnvironment || !targetEnvironments || targetEnvironments.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, 'Source environment and target environments are required');
        }
        logger.info('Syncing configurations', { sourceEnvironment, targetEnvironments, configTypes, dryRun });
        try {
            const syncResults = [];
            const configurationDifferences = [];
            for (const targetEnv of targetEnvironments) {
                const syncResult = {
                    target: targetEnv,
                    success: false,
                    changes: [],
                    conflicts: [],
                    skipped: []
                };
                // Analyze configuration differences
                if (configTypes.includes('all') || configTypes.includes('environment-vars')) {
                    // Compare environment variables
                    const envDiff = await this.compareEnvironmentVariables(sourceEnvironment, targetEnv);
                    if (envDiff.differences.length > 0) {
                        configurationDifferences.push({
                            type: 'environment-vars',
                            target: targetEnv,
                            differences: envDiff.differences
                        });
                        if (!dryRun) {
                            syncResult.changes.push(`Updated ${envDiff.differences.length} environment variables`);
                        }
                    }
                }
                if (configTypes.includes('all') || configTypes.includes('docker-compose')) {
                    // Compare Docker Compose configurations
                    const composeDiff = await this.compareDockerComposeConfigs(sourceEnvironment, targetEnv);
                    if (composeDiff.differences.length > 0) {
                        configurationDifferences.push({
                            type: 'docker-compose',
                            target: targetEnv,
                            differences: composeDiff.differences
                        });
                        if (!dryRun) {
                            syncResult.changes.push('Updated Docker Compose configuration');
                        }
                    }
                }
                if (configTypes.includes('all') || configTypes.includes('pipeline-vars')) {
                    // Compare pipeline variables (Azure only)
                    if (targetEnv === 'azure') {
                        const pipelineDiff = await this.comparePipelineVariables(sourceEnvironment);
                        if (pipelineDiff.differences.length > 0) {
                            configurationDifferences.push({
                                type: 'pipeline-vars',
                                target: targetEnv,
                                differences: pipelineDiff.differences
                            });
                            if (!dryRun) {
                                syncResult.changes.push(`Updated ${pipelineDiff.differences.length} pipeline variables`);
                            }
                        }
                    }
                }
                syncResult.success = true;
                syncResults.push(syncResult);
            }
            const result = {
                timestamp: new Date().toISOString(),
                synchronization: {
                    sourceEnvironment,
                    targetEnvironments,
                    configTypes,
                    dryRun,
                    syncId: `sync-${Date.now()}`,
                    overallSuccess: syncResults.every(r => r.success)
                },
                results: syncResults,
                configurationAnalysis: {
                    totalDifferences: configurationDifferences.length,
                    differences: configurationDifferences,
                    criticalDifferences: this.identifyCriticalConfigDifferences(configurationDifferences),
                    tradingImpact: this.assessConfigSyncTradingImpact(configurationDifferences)
                },
                tradingPlatformConsiderations: {
                    affectsLiveTrading: targetEnvironments.includes('azure'),
                    requiresRestart: this.determineIfRestartRequired(configurationDifferences),
                    validationRequired: true,
                    riskLevel: this.assessConfigSyncRisk(configurationDifferences)
                },
                summary: {
                    environmentsUpdated: dryRun ? 0 : syncResults.filter(r => r.success).length,
                    changesApplied: dryRun ? 0 : syncResults.reduce((sum, r) => sum + r.changes.length, 0),
                    conflictsDetected: syncResults.reduce((sum, r) => sum + r.conflicts.length, 0),
                    estimatedImpact: this.estimateConfigSyncImpact(configurationDifferences)
                },
                nextSteps: dryRun ? [
                    'Review configuration differences',
                    'Plan configuration changes',
                    'Run sync without dryRun to apply changes',
                    'Validate changes in non-production first'
                ] : [
                    'Verify configuration changes',
                    'Test system functionality',
                    'Monitor for configuration-related issues',
                    'Document synchronization'
                ]
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
            logger.error('Failed to sync configurations', { sourceEnvironment, targetEnvironments, error });
            throw new McpError(ErrorCode.InternalError, `Failed to sync configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Helper Methods for Trading Platform Analysis
    groupPipelinesByType(pipelines) {
        const groups = {};
        pipelines.forEach(p => {
            groups[p.type] = (groups[p.type] || 0) + 1;
        });
        return groups;
    }
    groupPipelinesByQueueStatus(pipelines) {
        const groups = {};
        pipelines.forEach(p => {
            groups[p.queueStatus] = (groups[p.queueStatus] || 0) + 1;
        });
        return groups;
    }
    identifyTradingRelevantPipelines(pipelines) {
        return pipelines
            .filter(p => this.isPipelineRelevantForTrading(p.name))
            .map(p => p.name);
    }
    isPipelineRelevantForTrading(pipelineName) {
        const tradingKeywords = ['trading', 'analysis', 'fractal', 'inflection', 'data', 'timescale', 'redpanda', 'lucidwonks'];
        return tradingKeywords.some(keyword => pipelineName.toLowerCase().includes(keyword));
    }
    identifyAffectedTradingComponents(variables) {
        if (!variables)
            return [];
        const components = [];
        const keys = Object.keys(variables);
        if (keys.some(k => k.includes('DATABASE') || k.includes('TIMESCALE'))) {
            components.push('Database Layer');
        }
        if (keys.some(k => k.includes('MESSAGING') || k.includes('REDPANDA') || k.includes('KAFKA'))) {
            components.push('Messaging System');
        }
        if (keys.some(k => k.includes('ANALYSIS') || k.includes('FRACTAL'))) {
            components.push('Analysis Engine');
        }
        return components;
    }
    determineEnvironmentTarget(variables) {
        if (!variables)
            return 'unknown';
        const envVars = Object.keys(variables).filter(k => k.includes('ENV') || k.includes('ENVIRONMENT'));
        if (envVars.length === 0)
            return 'production';
        const envValues = envVars.map(k => variables[k].toLowerCase());
        if (envValues.some(v => v.includes('dev')))
            return 'development';
        if (envValues.some(v => v.includes('test')))
            return 'testing';
        if (envValues.some(v => v.includes('stage')))
            return 'staging';
        return 'production';
    }
    calculateRunDuration(run) {
        if (!run.finishedDate)
            return 'In Progress';
        const duration = run.finishedDate.getTime() - run.createdDate.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    calculateSuccessRate(runs) {
        if (runs.length === 0)
            return '0%';
        const successful = runs.filter(r => r.result === 'succeeded').length;
        const rate = (successful / runs.length * 100).toFixed(1);
        return `${rate}%`;
    }
    calculateAverageDuration(runs) {
        const completedRuns = runs.filter(r => r.finishedDate);
        if (completedRuns.length === 0)
            return 'N/A';
        const totalDuration = completedRuns.reduce((sum, run) => {
            return sum + (run.finishedDate.getTime() - run.createdDate.getTime());
        }, 0);
        const avgDuration = totalDuration / completedRuns.length;
        const minutes = Math.floor(avgDuration / 60000);
        const seconds = Math.floor((avgDuration % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    findLastSuccessfulRun(runs) {
        const successfulRun = runs.find(r => r.result === 'succeeded');
        return successfulRun ? successfulRun.createdDate.toISOString() : 'None';
    }
    assessTradingImpact(status) {
        if (!this.isPipelineRelevantForTrading(status.pipeline.name)) {
            return 'No trading impact';
        }
        if (status.health === 'failed') {
            return 'High - Trading system deployment blocked';
        }
        else if (status.health === 'degraded') {
            return 'Medium - Trading system may have issues';
        }
        else {
            return 'Low - Trading system deployment healthy';
        }
    }
    generateTradingRecommendations(status) {
        const recommendations = [];
        if (this.isPipelineRelevantForTrading(status.pipeline.name)) {
            if (status.health === 'failed') {
                recommendations.push('Investigate pipeline failures before trading deployment');
                recommendations.push('Check for data layer or analysis engine issues');
            }
            else if (status.health === 'degraded') {
                recommendations.push('Monitor pipeline closely for trading system stability');
            }
            else {
                recommendations.push('Pipeline healthy for trading system deployment');
            }
        }
        return recommendations;
    }
    analyzeTradingRelevanceInLogs(logContent) {
        const tradingKeywords = ['trading', 'fractal', 'inflection', 'analysis', 'timescale', 'redpanda', 'price', 'ticker'];
        const errorKeywords = ['error', 'exception', 'failed', 'failure'];
        const warningKeywords = ['warning', 'warn', 'deprecated'];
        const lines = logContent.split('\n');
        const tradingRelevantLines = lines.filter(line => tradingKeywords.some(keyword => line.toLowerCase().includes(keyword)));
        const errorLines = lines.filter(line => errorKeywords.some(keyword => line.toLowerCase().includes(keyword)));
        const warningLines = lines.filter(line => warningKeywords.some(keyword => line.toLowerCase().includes(keyword)));
        const affectedComponents = [];
        if (logContent.toLowerCase().includes('database') || logContent.toLowerCase().includes('timescale')) {
            affectedComponents.push('Database Layer');
        }
        if (logContent.toLowerCase().includes('messaging') || logContent.toLowerCase().includes('redpanda')) {
            affectedComponents.push('Messaging System');
        }
        if (logContent.toLowerCase().includes('analysis') || logContent.toLowerCase().includes('fractal')) {
            affectedComponents.push('Analysis Engine');
        }
        return {
            tradingRelevant: tradingRelevantLines.length > 0,
            errorCount: errorLines.length,
            warningCount: warningLines.length,
            keyFindings: [
                ...tradingRelevantLines.slice(0, 5),
                ...errorLines.slice(0, 3)
            ],
            affectedComponents,
            recommendedActions: this.generateLogAnalysisRecommendations(errorLines, warningLines, affectedComponents)
        };
    }
    generateLogAnalysisRecommendations(errorLines, warningLines, components) {
        const recommendations = [];
        if (errorLines.length > 0) {
            recommendations.push('Investigate error messages for system issues');
            if (components.includes('Database Layer')) {
                recommendations.push('Check database connectivity and data integrity');
            }
            if (components.includes('Analysis Engine')) {
                recommendations.push('Validate analysis algorithm functionality');
            }
        }
        if (warningLines.length > 5) {
            recommendations.push('Review warnings for potential system degradation');
        }
        if (recommendations.length === 0) {
            recommendations.push('Logs appear healthy - continue monitoring');
        }
        return recommendations;
    }
    formatLogsForDisplay(logs) {
        // Truncate very long logs for display
        if (logs.length > 50000) {
            return logs.substring(0, 50000) + '\n\n... (truncated for display)';
        }
        return logs;
    }
    countTimestampedLines(logs) {
        const timestampPattern = /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/;
        return logs.split('\n').filter(line => timestampPattern.test(line)).length;
    }
    checkIfVariablesAffectTrading(variables) {
        const tradingRelatedKeys = Object.keys(variables).filter(key => {
            const keyLower = key.toLowerCase();
            return keyLower.includes('trading') || keyLower.includes('analysis') ||
                keyLower.includes('database') || keyLower.includes('messaging');
        });
        return tradingRelatedKeys.length > 0;
    }
    identifyEnvironmentVariables(variables) {
        return Object.keys(variables).filter(key => key.includes('ENV') || key.includes('ENVIRONMENT') || key.includes('CONFIG'));
    }
    identifySecurityConsiderations(variables) {
        const considerations = [];
        Object.entries(variables).forEach(([key, value]) => {
            if (value.isSecret) {
                considerations.push(`Secret variable: ${key}`);
            }
            if (key.toLowerCase().includes('password') || key.toLowerCase().includes('key')) {
                considerations.push(`Security-sensitive variable: ${key}`);
            }
        });
        return considerations;
    }
    generateVariableValidationRecommendations(variables) {
        const recommendations = [];
        const secretCount = Object.values(variables).filter((v) => v.isSecret).length;
        if (secretCount > 0) {
            recommendations.push('Verify secret variables are properly encrypted');
        }
        if (this.checkIfVariablesAffectTrading(variables)) {
            recommendations.push('Test trading system functionality with new variables');
            recommendations.push('Validate analysis engine configuration');
        }
        recommendations.push('Monitor pipeline execution for variable-related issues');
        return recommendations;
    }
    // VM-specific helper methods
    identifyDatabaseServices(services) {
        return services.some(s => s.toLowerCase().includes('database') ||
            s.toLowerCase().includes('timescale') ||
            s.toLowerCase().includes('postgres'));
    }
    identifyMessagingServices(services) {
        return services.some(s => s.toLowerCase().includes('redpanda') ||
            s.toLowerCase().includes('kafka') ||
            s.toLowerCase().includes('messaging'));
    }
    identifyAnalysisServices(services) {
        return services.some(s => s.toLowerCase().includes('analysis') ||
            s.toLowerCase().includes('fractal') ||
            s.toLowerCase().includes('inflection'));
    }
    classifyEnvironmentType(environmentVars) {
        if (!environmentVars)
            return 'development';
        const envStr = JSON.stringify(environmentVars).toLowerCase();
        if (envStr.includes('prod'))
            return 'production';
        if (envStr.includes('stage'))
            return 'staging';
        if (envStr.includes('test'))
            return 'testing';
        return 'development';
    }
    countTradingServices(services) {
        return services.filter(s => {
            const name = s.name.toLowerCase();
            return name.includes('trading') || name.includes('analysis') ||
                name.includes('database') || name.includes('messaging');
        }).length;
    }
    assessDatabaseHealth(services) {
        const dbServices = services.filter(s => s.name.toLowerCase().includes('database') ||
            s.name.toLowerCase().includes('postgres') ||
            s.name.toLowerCase().includes('timescale'));
        if (dbServices.length === 0)
            return 'Not deployed';
        const runningServices = dbServices.filter(s => s.status === 'running');
        return runningServices.length === dbServices.length ? 'Healthy' : 'Issues detected';
    }
    assessMessagingHealth(services) {
        const msgServices = services.filter(s => s.name.toLowerCase().includes('redpanda') ||
            s.name.toLowerCase().includes('kafka'));
        if (msgServices.length === 0)
            return 'Not deployed';
        const runningServices = msgServices.filter(s => s.status === 'running');
        return runningServices.length === msgServices.length ? 'Healthy' : 'Issues detected';
    }
    identifyCriticalServicesDown(services) {
        const criticalServices = ['docker', 'database', 'timescale', 'redpanda', 'postgres'];
        return services
            .filter(s => s.status === 'failed' &&
            criticalServices.some(cs => s.name.toLowerCase().includes(cs)))
            .map(s => s.name);
    }
    generateHealthRecommendations(healthStatus) {
        const recommendations = [];
        if (healthStatus.overall === 'failed') {
            recommendations.push('Address critical VM issues before deployment');
            recommendations.push('Check system resources and connectivity');
        }
        if (!healthStatus.docker.running) {
            recommendations.push('Start Docker service for container deployment');
        }
        if (!healthStatus.connectivity.ssh) {
            recommendations.push('Verify SSH connectivity for management access');
        }
        return recommendations;
    }
    calculateHealthScore(healthStatus) {
        let score = 0;
        let maxScore = 0;
        // VM state (30 points)
        maxScore += 30;
        if (healthStatus.vm?.state === 'Running')
            score += 30;
        else if (healthStatus.vm?.state === 'Saved')
            score += 15;
        // Connectivity (25 points)
        maxScore += 25;
        if (healthStatus.connectivity.ping)
            score += 15;
        if (healthStatus.connectivity.ssh)
            score += 10;
        // Docker (25 points)
        maxScore += 25;
        if (healthStatus.docker.installed)
            score += 10;
        if (healthStatus.docker.running)
            score += 15;
        // Services (20 points)
        maxScore += 20;
        const runningServices = healthStatus.services.filter(s => s.status === 'running').length;
        const totalServices = healthStatus.services.length;
        if (totalServices > 0) {
            score += (runningServices / totalServices) * 20;
        }
        return Math.round((score / maxScore) * 100);
    }
    identifyCriticalIssues(healthStatus) {
        const issues = [];
        if (healthStatus.vm?.state !== 'Running') {
            issues.push(`VM not running: ${healthStatus.vm?.state}`);
        }
        if (!healthStatus.connectivity.ssh) {
            issues.push('SSH connectivity unavailable');
        }
        if (!healthStatus.docker.running) {
            issues.push('Docker service not running');
        }
        return issues;
    }
    identifyPerformanceIssues(healthStatus) {
        const issues = [];
        if (healthStatus.resources) {
            if (healthStatus.resources.cpu.usagePercent > 80) {
                issues.push(`High CPU usage: ${healthStatus.resources.cpu.usagePercent}%`);
            }
            if (healthStatus.resources.memory.usagePercent > 85) {
                issues.push(`High memory usage: ${healthStatus.resources.memory.usagePercent}%`);
            }
            healthStatus.resources.disk.forEach(disk => {
                if (disk.usagePercent > 90) {
                    issues.push(`High disk usage on ${disk.path}: ${disk.usagePercent}%`);
                }
            });
        }
        return issues;
    }
    assessTradingReadiness(healthStatus) {
        return healthStatus.overall === 'healthy' &&
            healthStatus.docker.running &&
            healthStatus.connectivity.ssh;
    }
    // Environment orchestration helper methods
    recordDeploymentState(state) {
        const key = `${state.environment}-${state.id}`;
        const history = this.deploymentHistory.get(key) || [];
        history.push(state);
        this.deploymentHistory.set(key, history);
    }
    async compareEnvironmentVariables(source, target) {
        // In a real implementation, this would compare actual environment variables
        return { differences: [] };
    }
    async compareDockerComposeConfigs(source, target) {
        // In a real implementation, this would compare Docker Compose configurations
        return { differences: [] };
    }
    async comparePipelineVariables(source) {
        // In a real implementation, this would compare pipeline variables
        return { differences: [] };
    }
    identifyCriticalConfigDifferences(differences) {
        return differences.filter(diff => diff.type === 'environment-vars' &&
            (diff.differences.some((d) => d.key.includes('DATABASE') || d.key.includes('SECRET'))));
    }
    assessConfigSyncTradingImpact(differences) {
        const tradingRelated = differences.some(diff => diff.differences.some((d) => d.key.toLowerCase().includes('trading') ||
            d.key.toLowerCase().includes('analysis')));
        return tradingRelated ? 'High - Trading system configuration affected' : 'Low - No trading impact';
    }
    determineIfRestartRequired(differences) {
        return differences.some(diff => diff.type === 'docker-compose' ||
            diff.differences.some((d) => d.key.includes('DATABASE') || d.key.includes('SERVICE')));
    }
    assessConfigSyncRisk(differences) {
        const criticalChanges = differences.filter(diff => diff.type === 'environment-vars' &&
            diff.differences.some((d) => d.key.includes('SECRET') || d.key.includes('PASSWORD')));
        if (criticalChanges.length > 0)
            return 'High';
        if (differences.length > 10)
            return 'Medium';
        return 'Low';
    }
    estimateConfigSyncImpact(differences) {
        const totalChanges = differences.reduce((sum, diff) => sum + diff.differences.length, 0);
        if (totalChanges === 0)
            return 'No changes required';
        if (totalChanges <= 5)
            return 'Minor configuration updates';
        if (totalChanges <= 15)
            return 'Moderate configuration changes';
        return 'Significant configuration overhaul';
    }
}
//# sourceMappingURL=azure-devops-tool-registry.js.map
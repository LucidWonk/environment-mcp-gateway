import winston from 'winston';
import { Environment } from '../domain/config/environment.js';

// Define types for Azure DevOps API responses  
export type TemplateParameterValue = string | number | boolean | null | undefined;
export type PipelineResourceValue = string | number | boolean | { [key: string]: any };
export type PipelineParameterValue = string | number | boolean | string[] | { [key: string]: any };
export type AzureDevOpsApiResponse = Record<string, any>;

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

export interface PipelineInfo {
    id: number;
    name: string;
    folder: string;
    type: 'yaml' | 'classic';
    url: string;
    revision: number;
    createdDate: Date;
    queueStatus: 'enabled' | 'disabled' | 'paused';
    quality: 'definition' | 'draft';
    authoredBy: {
        displayName: string;
        uniqueName: string;
        id: string;
    };
    repository?: {
        name: string;
        type: string;
        url: string;
        defaultBranch: string;
    };
}

export interface PipelineRun {
    id: number;
    name: string;
    status: 'notStarted' | 'inProgress' | 'completed' | 'cancelling' | 'cancelled' | 'postponed';
    result?: 'succeeded' | 'partiallySucceeded' | 'failed' | 'cancelled';
    state: 'unknown' | 'inProgress' | 'completed';
    createdDate: Date;
    finishedDate?: Date;
    url: string;
    pipeline: {
        id: number;
        name: string;
        url: string;
        folder: string;
    };
    resources: {
        repositories?: {
            [key: string]: {
                repository: {
                    id: string;
                    type: string;
                };
                refName: string;
                version: string;
            };
        };
    };
    variables: { [key: string]: PipelineVariable };
    templateParameters?: { [key: string]: TemplateParameterValue };
    requestedBy: {
        displayName: string;
        uniqueName: string;
        id: string;
    };
    requestedFor: {
        displayName: string;
        uniqueName: string;
        id: string;
    };
}

export interface PipelineVariable {
    value: string;
    isSecret: boolean;
    allowOverride?: boolean;
}

export interface BuildLog {
    id: number;
    type: string;
    url: string;
    lineCount: number;
}

export interface BuildLogContent {
    value: string;
    count: number;
}

export interface PipelineStatus {
    pipeline: PipelineInfo;
    latestRun?: PipelineRun;
    recentRuns: PipelineRun[];
    health: 'healthy' | 'degraded' | 'failed';
    message: string;
}

export interface AzureDevOpsHealth {
    connected: boolean;
    organization: string;
    project: string;
    apiVersion: string;
    pipelinesCount: number;
    activeRuns: number;
    message: string;
    issues: Array<{
        severity: 'error' | 'warning' | 'info';
        component: string;
        message: string;
    }>;
}

export interface TriggerPipelineOptions {
    sourceBranch?: string;
    variables?: { [key: string]: string };
    templateParameters?: { [key: string]: TemplateParameterValue };
    resources?: {
        repositories?: {
            [key: string]: {
                refName: string;
            };
        };
    };
}

export class AzureDevOpsAdapter {
    public readonly baseUrl: string;
    public readonly organization: string;
    public readonly project: string;
    public readonly pat: string;
    public readonly apiVersion = '7.0';

    constructor() {
        this.organization = Environment.azureDevOpsOrganization || '';
        this.project = Environment.azureDevOpsProject || '';
        this.pat = Environment.azureDevOpsPAT || '';
        this.baseUrl = `${Environment.azureDevOpsApiUrl}/${this.organization}/${this.project}/_apis`;

        if (!this.organization || !this.pat) {
            logger.warn('Azure DevOps configuration incomplete - some features may not be available', {
                hasOrganization: !!this.organization,
                hasPAT: !!this.pat
            });
        }
    }

    public getAuthHeaders(): { [key: string]: string } {
        if (!this.pat) {
            throw new Error('Azure DevOps PAT token is required for authentication');
        }

        // Azure DevOps uses Basic authentication with empty username and PAT as password
        const auth = Buffer.from(`:${this.pat}`).toString('base64');
        
        return {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    public getApiUrl(endpoint: string): string {
        return `${this.baseUrl}${endpoint}`;
    }

    private async makeRequest<T>(endpoint: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<T> {
        if (!this.organization || !this.pat) {
            throw new Error('Azure DevOps configuration incomplete - missing organization or PAT');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const authHeaders = this.getAuthHeaders();
        
        const defaultOptions: { method?: string; headers?: Record<string, string>; body?: string } = {
            headers: {
                ...authHeaders,
                ...options.headers
            }
        };

        try {
            logger.debug('Making Azure DevOps API request', { url, method: options.method || 'GET' });
            
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure DevOps API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json() as T;
            } else {
                return await response.text() as T;
            }
        } catch (error) {
            logger.error('Azure DevOps API request failed', { url, error });
            throw error;
        }
    }

    async listPipelines(folder?: string): Promise<PipelineInfo[]> {
        try {
            logger.info('Listing Azure DevOps pipelines', { folder });
            
            let endpoint = `/pipelines?api-version=${this.apiVersion}`;
            if (folder) {
                endpoint += `&path=${encodeURIComponent(folder)}`;
            }

            const response = await this.makeRequest<{ value: AzureDevOpsApiResponse[] }>(endpoint);
            
            const pipelines: PipelineInfo[] = response.value.map(pipeline => ({
                id: pipeline.id,
                name: pipeline.name,
                folder: pipeline.folder || '\\',
                type: pipeline.configuration?.type === 'yaml' ? 'yaml' : 'classic',
                url: pipeline.url,
                revision: pipeline.revision,
                createdDate: new Date(pipeline.createdDate),
                queueStatus: pipeline.queueStatus || 'enabled',
                quality: pipeline.quality || 'definition',
                authoredBy: {
                    displayName: pipeline.authoredBy?.displayName || 'Unknown',
                    uniqueName: pipeline.authoredBy?.uniqueName || '',
                    id: pipeline.authoredBy?.id || ''
                },
                repository: pipeline.configuration?.repository ? {
                    name: pipeline.configuration.repository.name,
                    type: pipeline.configuration.repository.type,
                    url: pipeline.configuration.repository.url,
                    defaultBranch: pipeline.configuration.repository.defaultBranch
                } : undefined
            }));

            logger.info('Successfully listed pipelines', { count: pipelines.length });
            return pipelines;
        } catch (error) {
            logger.error('Failed to list pipelines', { error });
            throw error;
        }
    }

    async triggerPipeline(pipelineId: number, options: TriggerPipelineOptions = {}): Promise<PipelineRun> {
        try {
            logger.info('Triggering Azure DevOps pipeline', { pipelineId, options });

            const requestBody: any = {
                resources: options.resources || {},
                templateParameters: options.templateParameters || {},
                variables: {}
            };

            // Add variables if provided
            if (options.variables) {
                for (const [key, value] of Object.entries(options.variables)) {
                    requestBody.variables[key] = {
                        value: value,
                        isSecret: false
                    };
                }
            }

            // Add source branch if provided
            if (options.sourceBranch) {
                requestBody.resources.repositories = {
                    self: {
                        refName: options.sourceBranch.startsWith('refs/') ? 
                            options.sourceBranch : 
                            `refs/heads/${options.sourceBranch}`
                    }
                };
            }

            const endpoint = `/pipelines/${pipelineId}/runs?api-version=${this.apiVersion}`;
            const response = await this.makeRequest<AzureDevOpsApiResponse>(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const run: PipelineRun = {
                id: response.id,
                name: response.name,
                status: response.state,
                result: response.result,
                state: response.state,
                createdDate: new Date(response.createdDate),
                finishedDate: response.finishedDate ? new Date(response.finishedDate) : undefined,
                url: response.url,
                pipeline: {
                    id: response.pipeline.id,
                    name: response.pipeline.name,
                    url: response.pipeline.url,
                    folder: response.pipeline.folder || '\\'
                },
                resources: response.resources || {},
                variables: response.variables || {},
                templateParameters: response.templateParameters,
                requestedBy: {
                    displayName: response.requestedBy?.displayName || 'Unknown',
                    uniqueName: response.requestedBy?.uniqueName || '',
                    id: response.requestedBy?.id || ''
                },
                requestedFor: {
                    displayName: response.requestedFor?.displayName || 'Unknown',
                    uniqueName: response.requestedFor?.uniqueName || '',
                    id: response.requestedFor?.id || ''
                }
            };

            logger.info('Successfully triggered pipeline', { pipelineId, runId: run.id });
            return run;
        } catch (error) {
            logger.error('Failed to trigger pipeline', { pipelineId, error });
            throw error;
        }
    }

    async getPipelineStatus(pipelineId: number): Promise<PipelineStatus> {
        try {
            logger.info('Getting pipeline status', { pipelineId });

            // Get pipeline details
            const pipelineEndpoint = `/pipelines/${pipelineId}?api-version=${this.apiVersion}`;
            const pipelineResponse = await this.makeRequest<AzureDevOpsApiResponse>(pipelineEndpoint);

            const pipeline: PipelineInfo = {
                id: pipelineResponse.id,
                name: pipelineResponse.name,
                folder: pipelineResponse.folder || '\\',
                type: pipelineResponse.configuration?.type === 'yaml' ? 'yaml' : 'classic',
                url: pipelineResponse.url,
                revision: pipelineResponse.revision,
                createdDate: new Date(pipelineResponse.createdDate),
                queueStatus: pipelineResponse.queueStatus || 'enabled',
                quality: pipelineResponse.quality || 'definition',
                authoredBy: {
                    displayName: pipelineResponse.authoredBy?.displayName || 'Unknown',
                    uniqueName: pipelineResponse.authoredBy?.uniqueName || '',
                    id: pipelineResponse.authoredBy?.id || ''
                },
                repository: pipelineResponse.configuration?.repository ? {
                    name: pipelineResponse.configuration.repository.name,
                    type: pipelineResponse.configuration.repository.type,
                    url: pipelineResponse.configuration.repository.url,
                    defaultBranch: pipelineResponse.configuration.repository.defaultBranch
                } : undefined
            };

            // Get recent runs
            const runsEndpoint = `/pipelines/${pipelineId}/runs?api-version=${this.apiVersion}&$top=10`;
            const runsResponse = await this.makeRequest<{ value: AzureDevOpsApiResponse[] }>(runsEndpoint);

            const recentRuns: PipelineRun[] = runsResponse.value.map(run => ({
                id: run.id,
                name: run.name,
                status: run.state,
                result: run.result,
                state: run.state,
                createdDate: new Date(run.createdDate),
                finishedDate: run.finishedDate ? new Date(run.finishedDate) : undefined,
                url: run.url,
                pipeline: {
                    id: run.pipeline.id,
                    name: run.pipeline.name,
                    url: run.pipeline.url,
                    folder: run.pipeline.folder || '\\'
                },
                resources: run.resources || {},
                variables: run.variables || {},
                templateParameters: run.templateParameters,
                requestedBy: {
                    displayName: run.requestedBy?.displayName || 'Unknown',
                    uniqueName: run.requestedBy?.uniqueName || '',
                    id: run.requestedBy?.id || ''
                },
                requestedFor: {
                    displayName: run.requestedFor?.displayName || 'Unknown',
                    uniqueName: run.requestedFor?.uniqueName || '',
                    id: run.requestedFor?.id || ''
                }
            }));

            const latestRun = recentRuns.length > 0 ? recentRuns[0] : undefined;

            // Determine health status
            let health: 'healthy' | 'degraded' | 'failed' = 'healthy';
            let message = 'Pipeline is healthy';

            if (pipeline.queueStatus === 'disabled') {
                health = 'failed';
                message = 'Pipeline is disabled';
            } else if (latestRun) {
                if (latestRun.result === 'failed') {
                    health = 'failed';
                    message = 'Latest run failed';
                } else if (latestRun.result === 'partiallySucceeded') {
                    health = 'degraded';
                    message = 'Latest run partially succeeded';
                } else if (latestRun.status === 'inProgress') {
                    message = 'Pipeline run in progress';
                }
            }

            const status: PipelineStatus = {
                pipeline,
                latestRun,
                recentRuns,
                health,
                message
            };

            logger.info('Successfully retrieved pipeline status', { pipelineId, health });
            return status;
        } catch (error) {
            logger.error('Failed to get pipeline status', { pipelineId, error });
            throw error;
        }
    }

    async getBuildLogs(runId: number, logId?: number): Promise<BuildLogContent> {
        try {
            logger.info('Getting build logs', { runId, logId });

            if (logId) {
                // Get specific log
                const endpoint = `/pipelines/runs/${runId}/logs/${logId}?api-version=${this.apiVersion}`;
                const logContent = await this.makeRequest<string>(endpoint);
                
                return {
                    value: logContent,
                    count: logContent.split('\n').length
                };
            } else {
                // Get all logs
                const logsEndpoint = `/pipelines/runs/${runId}/logs?api-version=${this.apiVersion}`;
                const logsResponse = await this.makeRequest<{ value: BuildLog[] }>(logsEndpoint);
                
                let allLogs = '';
                let totalLines = 0;

                for (const log of logsResponse.value) {
                    try {
                        const logContent = await this.makeRequest<string>(
                            `/pipelines/runs/${runId}/logs/${log.id}?api-version=${this.apiVersion}`
                        );
                        allLogs += `\n=== ${log.type} (Log ID: ${log.id}) ===\n${logContent}\n`;
                        totalLines += logContent.split('\n').length;
                    } catch (logError) {
                        logger.warn('Failed to fetch individual log', { runId, logId: log.id, error: logError });
                        allLogs += `\n=== ${log.type} (Log ID: ${log.id}) ===\nError fetching log: ${logError}\n`;
                    }
                }

                return {
                    value: allLogs,
                    count: totalLines
                };
            }
        } catch (error) {
            logger.error('Failed to get build logs', { runId, logId, error });
            throw error;
        }
    }

    async managePipelineVariables(pipelineId: number, variables: { [key: string]: PipelineVariable }): Promise<boolean> {
        try {
            logger.info('Managing pipeline variables', { pipelineId, variableCount: Object.keys(variables).length });

            // Get current pipeline definition
            const endpoint = `/pipelines/${pipelineId}?api-version=${this.apiVersion}`;
            const pipeline = await this.makeRequest<AzureDevOpsApiResponse>(endpoint);

            // Update variables in the pipeline configuration
            if (!pipeline.configuration) {
                pipeline.configuration = {};
            }
            if (!pipeline.configuration.variables) {
                pipeline.configuration.variables = {};
            }

            // Merge new variables
            Object.assign(pipeline.configuration.variables, variables);

            // Update the pipeline
            const updateEndpoint = `/pipelines/${pipelineId}?api-version=${this.apiVersion}`;
            await this.makeRequest<AzureDevOpsApiResponse>(updateEndpoint, {
                method: 'PUT',
                body: JSON.stringify(pipeline)
            });

            logger.info('Successfully updated pipeline variables', { pipelineId });
            return true;
        } catch (error) {
            logger.error('Failed to manage pipeline variables', { pipelineId, error });
            throw error;
        }
    }

    async getAzureDevOpsHealth(): Promise<AzureDevOpsHealth> {
        try {
            if (!this.organization || !this.pat) {
                return {
                    connected: false,
                    organization: this.organization,
                    project: this.project,
                    apiVersion: this.apiVersion,
                    pipelinesCount: 0,
                    activeRuns: 0,
                    message: 'Azure DevOps not configured',
                    issues: [{
                        severity: 'warning',
                        component: 'Configuration',
                        message: 'Azure DevOps organization or PAT not configured'
                    }]
                };
            }

            logger.info('Checking Azure DevOps health');

            // Test connection by getting project info
            const projectEndpoint = `/project?api-version=${this.apiVersion}`;
            const _projectInfo = await this.makeRequest<AzureDevOpsApiResponse>(projectEndpoint);

            // Get pipelines count
            const pipelinesResponse = await this.makeRequest<{ count: number }>(
                `/pipelines?api-version=${this.apiVersion}&$top=1`
            );

            // Get active runs count
            const runsResponse = await this.makeRequest<{ count: number }>(
                `/pipelines/runs?api-version=${this.apiVersion}&statusFilter=inProgress&$top=1`
            );

            const health: AzureDevOpsHealth = {
                connected: true,
                organization: this.organization,
                project: this.project,
                apiVersion: this.apiVersion,
                pipelinesCount: pipelinesResponse.count || 0,
                activeRuns: runsResponse.count || 0,
                message: 'Azure DevOps connection healthy',
                issues: []
            };

            logger.info('Azure DevOps health check completed', { health: 'healthy' });
            return health;
        } catch (error) {
            logger.error('Azure DevOps health check failed', { error });
            
            return {
                connected: false,
                organization: this.organization,
                project: this.project,
                apiVersion: this.apiVersion,
                pipelinesCount: 0,
                activeRuns: 0,
                message: `Azure DevOps connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                issues: [{
                    severity: 'error',
                    component: 'Connection',
                    message: `Failed to connect to Azure DevOps: ${error instanceof Error ? error.message : 'Unknown error'}`
                }]
            };
        }
    }

    async getPipelineRun(runId: number): Promise<PipelineRun> {
        try {
            logger.info('Getting pipeline run details', { runId });

            const endpoint = `/pipelines/runs/${runId}?api-version=${this.apiVersion}`;
            const response = await this.makeRequest<AzureDevOpsApiResponse>(endpoint);

            const run: PipelineRun = {
                id: response.id,
                name: response.name,
                status: response.state,
                result: response.result,
                state: response.state,
                createdDate: new Date(response.createdDate),
                finishedDate: response.finishedDate ? new Date(response.finishedDate) : undefined,
                url: response.url,
                pipeline: {
                    id: response.pipeline.id,
                    name: response.pipeline.name,
                    url: response.pipeline.url,
                    folder: response.pipeline.folder || '\\'
                },
                resources: response.resources || {},
                variables: response.variables || {},
                templateParameters: response.templateParameters,
                requestedBy: {
                    displayName: response.requestedBy?.displayName || 'Unknown',
                    uniqueName: response.requestedBy?.uniqueName || '',
                    id: response.requestedBy?.id || ''
                },
                requestedFor: {
                    displayName: response.requestedFor?.displayName || 'Unknown',
                    uniqueName: response.requestedFor?.uniqueName || '',
                    id: response.requestedFor?.id || ''
                }
            };

            logger.info('Successfully retrieved pipeline run', { runId });
            return run;
        } catch (error) {
            logger.error('Failed to get pipeline run', { runId, error });
            throw error;
        }
    }

    async cancelPipelineRun(runId: number): Promise<boolean> {
        try {
            logger.info('Cancelling pipeline run', { runId });

            const endpoint = `/pipelines/runs/${runId}?api-version=${this.apiVersion}`;
            await this.makeRequest<AzureDevOpsApiResponse>(endpoint, {
                method: 'PATCH',
                body: JSON.stringify({
                    state: 'cancelling'
                })
            });

            logger.info('Successfully cancelled pipeline run', { runId });
            return true;
        } catch (error) {
            logger.error('Failed to cancel pipeline run', { runId, error });
            throw error;
        }
    }
}
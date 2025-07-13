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
    variables: {
        [key: string]: PipelineVariable;
    };
    templateParameters?: {
        [key: string]: any;
    };
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
    variables?: {
        [key: string]: string;
    };
    templateParameters?: {
        [key: string]: any;
    };
    resources?: {
        repositories?: {
            [key: string]: {
                refName: string;
            };
        };
    };
}
export declare class AzureDevOpsAdapter {
    readonly baseUrl: string;
    readonly organization: string;
    readonly project: string;
    readonly pat: string;
    readonly apiVersion = "7.0";
    constructor();
    getAuthHeaders(): {
        [key: string]: string;
    };
    getApiUrl(endpoint: string): string;
    private makeRequest;
    listPipelines(folder?: string): Promise<PipelineInfo[]>;
    triggerPipeline(pipelineId: number, options?: TriggerPipelineOptions): Promise<PipelineRun>;
    getPipelineStatus(pipelineId: number): Promise<PipelineStatus>;
    getBuildLogs(runId: number, logId?: number): Promise<BuildLogContent>;
    managePipelineVariables(pipelineId: number, variables: {
        [key: string]: PipelineVariable;
    }): Promise<boolean>;
    getAzureDevOpsHealth(): Promise<AzureDevOpsHealth>;
    getPipelineRun(runId: number): Promise<PipelineRun>;
    cancelPipelineRun(runId: number): Promise<boolean>;
}
//# sourceMappingURL=azure-devops-adapter.d.ts.map
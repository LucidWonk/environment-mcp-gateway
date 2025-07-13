export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    handler: (args: any) => Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
    }>;
}
export declare class AzureDevOpsToolRegistry {
    private azureDevOpsAdapter;
    private vmAdapter;
    private deploymentHistory;
    constructor();
    getAzureDevOpsTools(): ToolDefinition[];
    private listPipelines;
    private triggerPipeline;
    private getPipelineStatus;
    private getBuildLogs;
    private managePipelineVariables;
    private provisionVM;
    private deployToVM;
    private vmHealthCheck;
    private vmLogs;
    private promoteEnvironment;
    private rollbackDeployment;
    private syncConfigurations;
    private groupPipelinesByType;
    private groupPipelinesByQueueStatus;
    private identifyTradingRelevantPipelines;
    private isPipelineRelevantForTrading;
    private identifyAffectedTradingComponents;
    private determineEnvironmentTarget;
    private calculateRunDuration;
    private calculateSuccessRate;
    private calculateAverageDuration;
    private findLastSuccessfulRun;
    private assessTradingImpact;
    private generateTradingRecommendations;
    private analyzeTradingRelevanceInLogs;
    private generateLogAnalysisRecommendations;
    private formatLogsForDisplay;
    private countTimestampedLines;
    private checkIfVariablesAffectTrading;
    private identifyEnvironmentVariables;
    private identifySecurityConsiderations;
    private generateVariableValidationRecommendations;
    private identifyDatabaseServices;
    private identifyMessagingServices;
    private identifyAnalysisServices;
    private classifyEnvironmentType;
    private countTradingServices;
    private assessDatabaseHealth;
    private assessMessagingHealth;
    private identifyCriticalServicesDown;
    private generateHealthRecommendations;
    private calculateHealthScore;
    private identifyCriticalIssues;
    private identifyPerformanceIssues;
    private assessTradingReadiness;
    private recordDeploymentState;
    private compareEnvironmentVariables;
    private compareDockerComposeConfigs;
    private comparePipelineVariables;
    private identifyCriticalConfigDifferences;
    private assessConfigSyncTradingImpact;
    private determineIfRestartRequired;
    private assessConfigSyncRisk;
    private estimateConfigSyncImpact;
}
//# sourceMappingURL=azure-devops-tool-registry.d.ts.map
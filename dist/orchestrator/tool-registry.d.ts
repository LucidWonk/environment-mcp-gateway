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
export declare class ToolRegistry {
    private gitAdapter;
    private azureDevOpsToolRegistry;
    constructor();
    getAllTools(): ToolDefinition[];
    getGitTools(): ToolDefinition[];
    private listBranches;
    private createFeatureBranch;
    private analyzeRecentCommits;
    private getCommitDetails;
    private mergeBranch;
    private analyzeCodeImpact;
    private validateGitWorkflow;
    private calculateDomainDistribution;
    private calculateRiskDistribution;
    private generateCommitRecommendations;
    private generateWorkflowRecommendations;
    private extractProjectFromPath;
    getAzureDevOpsTools(): ToolDefinition[];
}
export declare const GitToolRegistry: typeof ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map
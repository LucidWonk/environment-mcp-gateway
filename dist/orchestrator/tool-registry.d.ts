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
export declare class GitToolRegistry {
    private gitAdapter;
    constructor();
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
}
//# sourceMappingURL=tool-registry.d.ts.map
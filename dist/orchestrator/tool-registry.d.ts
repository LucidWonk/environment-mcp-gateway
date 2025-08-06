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
    private semanticAnalysisService;
    private businessConceptExtractor;
    private csharpParser;
    private contextGenerator;
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
    getSemanticAnalysisTools(): ToolDefinition[];
    getContextGenerationTools(): ToolDefinition[];
    private analyzeCodeChangesForContext;
    private extractBusinessConcepts;
    private identifyBusinessRules;
    private generateAnalysisSummary;
    getHolisticContextUpdateTools(): ToolDefinition[];
    getCrossDomainImpactAnalysisTools(): ToolDefinition[];
    getUpdateIntegrationTools(): ToolDefinition[];
    getDocumentLifecycleTools(): ToolDefinition[];
}
export declare const GitToolRegistry: typeof ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map
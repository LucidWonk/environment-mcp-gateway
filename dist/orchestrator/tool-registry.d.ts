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
    /**
     * Enhance semantic analysis results with domain analysis and change analysis,
     * then cache them in the format expected by the context generator
     */
    private enhanceAndCacheResults;
    /**
     * Extract domain from file path
     */
    private extractDomainFromPath;
    /**
     * Calculate domain confidence based on analysis results
     */
    private calculateDomainConfidence;
    /**
     * Extract cross-domain dependencies from the analysis result
     */
    private extractCrossDomainDependencies;
    /**
     * Calculate impact level based on the analysis results
     */
    private calculateImpactLevel;
    /**
     * Extract affected components from analysis results
     */
    private extractAffectedComponents;
    private extractBusinessConcepts;
    private identifyBusinessRules;
    private generateAnalysisSummary;
    getHolisticContextUpdateTools(): ToolDefinition[];
    getCrossDomainImpactAnalysisTools(): ToolDefinition[];
    getUpdateIntegrationTools(): ToolDefinition[];
    getDocumentLifecycleTools(): ToolDefinition[];
    getRegistryLifecycleTools(): ToolDefinition[];
    getLifecycleIntegrationTools(): ToolDefinition[];
}
export declare const GitToolRegistry: typeof ToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map
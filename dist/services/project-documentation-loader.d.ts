/**
 * Project Documentation Loader Service
 *
 * Provides project-specific documentation loading and caching for virtual expert agents.
 * Enables experts to provide guidance based on actual project standards, architecture
 * documents, and Context Engineering system requirements.
 */
export interface ProjectStandards {
    architectureGuidelines?: ArchitectureStandards;
    testingStandards?: TestingStandards;
    devOpsInfrastructure?: DevOpsStandards;
    contextEngineering?: ContextEngineeringStandards;
}
export interface ArchitectureStandards {
    buildSystemIntegration: {
        dotnetCommands: string[];
        typescriptValidation: string[];
        dockerOrchestration: string[];
        qualityStandards: string[];
    };
    dockerContainerization: {
        infrastructureServices: string[];
        applicationContainers: string[];
        healthChecking: string[];
    };
    testingFrameworks: {
        bddFramework: string;
        infrastructureTesting: string;
        testCoverage: string;
        reportingStandards: string[];
    };
    utilityLibraryStandards: {
        loggingIntegration: string;
        configurationManagement: string;
        messagingPatterns: string[];
        domainDrivenDesign: string[];
    };
}
export interface TestingStandards {
    dualFrameworkStrategy: {
        bddUsage: string[];
        xunitUsage: string[];
        frameworkSelection: string[];
    };
    testProjectStructure: {
        namingConventions: string[];
        organizationPatterns: string[];
        categorization: string[];
    };
    testDataManagement: {
        tableDrivernPatterns: string[];
        mockDataFactories: string[];
        assertionStandards: string[];
        loggingRequirements: string[];
    };
}
export interface DevOpsStandards {
    gitOpsWorkflow: {
        repositoryStructure: string[];
        branchProtection: string[];
        immutableInfrastructure: string[];
    };
    multiEnvironmentDeployment: {
        environments: string[];
        deploymentOrchestration: string[];
        configurationManagement: string[];
    };
    qualityGates: {
        automatedTesting: string[];
        coverageRequirements: string[];
        deploymentValidation: string[];
    };
}
export interface ContextEngineeringStandards {
    systemPurpose: string;
    documentTypes: {
        domainReqMd: string[];
        digitalReqMd: string[];
        icpTypes: string[];
    };
    documentLifecycle: {
        newConceptsFlow: string[];
        maturityProcess: string[];
        registryManagement: string[];
    };
    semanticAnalysis: {
        businessConceptExtraction: string[];
        confidenceScoring: string[];
        templateGeneration: string[];
    };
}
/**
 * Project Documentation Loader - loads and caches project-specific standards
 */
export declare class ProjectDocumentationLoader {
    private readonly projectRoot;
    private documentationCache;
    private cacheTimestamps;
    private readonly cacheTimeout;
    constructor(projectRoot?: string);
    /**
     * Load comprehensive project standards for virtual expert agents
     */
    loadProjectStandards(): Promise<ProjectStandards>;
    /**
     * Load Architecture Guidelines from domain document
     */
    private loadArchitectureGuidelines;
    /**
     * Load Testing Standards from domain document
     */
    private loadTestingStandards;
    /**
     * Load DevOps Standards from domain document
     */
    private loadDevOpsStandards;
    /**
     * Load Context Engineering Standards
     */
    private loadContextEngineeringStandards;
    /**
     * Get expert-specific guidance based on project standards
     */
    getExpertGuidance(expertType: string, subtask: string): Promise<string>;
    private getBaseExpertGuidance;
    private getArchitectureSpecificGuidance;
    private getTestingSpecificGuidance;
    private getDevOpsSpecificGuidance;
    private getContextEngineeringGuidance;
    private fileExists;
    private readFileWithCache;
    /**
     * Clear documentation cache (useful for testing or when documents are updated)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        entries: number;
        oldestEntry: number | null;
        newestEntry: number | null;
    };
}
export declare const projectDocumentationLoader: ProjectDocumentationLoader;
//# sourceMappingURL=project-documentation-loader.d.ts.map
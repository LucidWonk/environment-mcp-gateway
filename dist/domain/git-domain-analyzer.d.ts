import { CommitInfo, BranchInfo } from '../adapters/git-adapter.js';
export declare enum TradingDomain {
    ANALYSIS = "Analysis",
    DATA = "Data",
    MESSAGING = "Messaging",
    UI = "UI",
    TESTS = "Tests",
    INFRASTRUCTURE = "Infrastructure",
    UNKNOWN = "Unknown"
}
export interface DomainMappingRule {
    domain: TradingDomain;
    pathPatterns: string[];
    projectPatterns: string[];
    description: string;
}
export interface DomainAnalysisResult {
    domains: TradingDomain[];
    primaryDomain: TradingDomain;
    crossDomainImpact: boolean;
    affectedProjects: string[];
    businessImpact: string;
    riskLevel: 'low' | 'medium' | 'high';
}
export interface ProjectDomainMapping {
    projectName: string;
    domain: TradingDomain;
    description: string;
    keyFiles: string[];
}
export declare class GitDomainAnalyzer {
    private static readonly DOMAIN_MAPPINGS;
    private static readonly PROJECT_MAPPINGS;
    static mapFileToDomain(filePath: string): TradingDomain;
    static mapProjectToDomain(projectName: string): TradingDomain;
    private static matchesPattern;
    static analyzeCommitDomainImpact(commit: CommitInfo): DomainAnalysisResult;
    private static extractProjectName;
    private static assessBusinessImpact;
    private static assessRiskLevel;
    static analyzeBranchDomainContext(branch: BranchInfo): string[];
    static getProjectDomainMappings(): ProjectDomainMapping[];
    static getDomainMappingRules(): DomainMappingRule[];
    static getDomainDescription(domain: TradingDomain): string;
    static analyzeCodeImpact(filePaths: string[]): {
        domainBreakdown: Map<TradingDomain, number>;
        crossDomainFiles: string[];
        riskAssessment: string;
        recommendations: string[];
    };
}
//# sourceMappingURL=git-domain-analyzer.d.ts.map
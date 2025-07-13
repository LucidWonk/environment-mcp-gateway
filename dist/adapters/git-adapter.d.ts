export interface BranchInfo {
    name: string;
    current: boolean;
    remote: string | null;
    lastCommit: {
        hash: string;
        date: Date;
        message: string;
        author: string;
    };
    ahead: number;
    behind: number;
    domainContext?: string[];
}
export interface CommitInfo {
    hash: string;
    shortHash: string;
    date: Date;
    message: string;
    author: string;
    email: string;
    files: CommitFileInfo[];
    domainImpact?: DomainImpact;
}
export interface CommitFileInfo {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
    additions?: number;
    deletions?: number;
    domain?: string;
}
export interface DomainImpact {
    analysis: boolean;
    data: boolean;
    messaging: boolean;
    crossDomain: boolean;
    affectedProjects: string[];
}
export interface GitWorkflowValidation {
    currentBranch: string;
    isClean: boolean;
    hasUncommitted: boolean;
    hasUntracked: boolean;
    branchUpToDate: boolean;
    followsNamingConvention: boolean;
    issues: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
        suggestion?: string;
    }>;
}
export interface MergeAnalysis {
    canMerge: boolean;
    conflicts: boolean;
    conflictFiles: string[];
    baseBranch: string;
    targetBranch: string;
    ahead: number;
    behind: number;
    previewChanges: CommitFileInfo[];
}
export declare class GitAdapter {
    private readonly repoPath;
    constructor();
    private executeGitCommand;
    listBranches(): Promise<BranchInfo[]>;
    createFeatureBranch(branchName: string, baseBranch?: string): Promise<boolean>;
    analyzeRecentCommits(count?: number): Promise<CommitInfo[]>;
    getCommitDetails(commitHash: string): Promise<CommitInfo>;
    mergeBranch(sourceBranch: string, targetBranch?: string): Promise<MergeAnalysis>;
    analyzeMerge(sourceBranch: string, targetBranch: string): Promise<MergeAnalysis>;
    validateGitWorkflow(): Promise<GitWorkflowValidation>;
    getGitStatus(): Promise<any>;
}
//# sourceMappingURL=git-adapter.d.ts.map
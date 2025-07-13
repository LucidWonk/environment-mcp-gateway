export interface SolutionProject {
    id: string;
    name: string;
    path: string;
    type: 'C#' | 'Python' | 'Other';
    dependencies: string[];
}
export interface SolutionStructure {
    name: string;
    path: string;
    projects: SolutionProject[];
    solutionFolders: string[];
}
export interface GitBranchInfo {
    name: string;
    isActive: boolean;
    lastCommit: string;
    lastCommitDate: Date;
}
export interface GitStatus {
    branch: string;
    staged: string[];
    modified: string[];
    untracked: string[];
    ahead: number;
    behind: number;
}
export interface DatabaseSchemaInfo {
    tables: TableInfo[];
    indexes: IndexInfo[];
    constraints: ConstraintInfo[];
}
export interface TableInfo {
    name: string;
    schema: string;
    columns: ColumnInfo[];
    rowCount?: number;
}
export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
}
export interface IndexInfo {
    name: string;
    table: string;
    columns: string[];
    isUnique: boolean;
}
export interface ConstraintInfo {
    name: string;
    table: string;
    type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'CHECK' | 'UNIQUE';
    columns: string[];
}
export interface DockerContainerInfo {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'restarting' | 'dead';
    ports: string[];
    createdAt: Date;
    command: string;
}
export interface DockerServiceHealth {
    service: string;
    healthy: boolean;
    message: string;
    lastCheck: Date;
}
export interface BuildResult {
    success: boolean;
    project: string;
    duration: number;
    warnings: string[];
    errors: string[];
    output: string;
}
export interface TestResult {
    success: boolean;
    project: string;
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
    failures: TestFailure[];
    output: string;
}
export interface TestFailure {
    test: string;
    message: string;
    stackTrace: string;
}
export interface DevelopmentEnvironmentStatus {
    database: {
        connected: boolean;
        message: string;
    };
    docker: {
        running: boolean;
        services: DockerServiceHealth[];
        containers?: DockerContainerInfo[];
        infrastructure?: {
            overall: 'healthy' | 'degraded' | 'failed';
            issues: Array<{
                component: string;
                severity: 'warning' | 'error';
                message: string;
            }>;
            recommendations: Array<{
                issue: string;
                suggestion: string;
                command?: string;
            }>;
        };
    };
    git: {
        repository: string;
        branch: string;
        clean: boolean;
        upToDate: boolean;
    };
    solution: {
        path: string;
        projects: number;
        buildable: boolean;
    };
}
//# sourceMappingURL=infrastructure-types.d.ts.map
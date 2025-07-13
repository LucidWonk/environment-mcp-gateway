export declare class Environment {
    static readonly dbHost: string;
    static readonly dbPassword: string | undefined;
    static readonly dbPort: number;
    static readonly database: string;
    static readonly username: string;
    static readonly gitRepoPath: string;
    static readonly gitUserName: string | undefined;
    static readonly gitUserEmail: string | undefined;
    static readonly mcpServerPort: number;
    static readonly mcpLogLevel: string;
    static readonly solutionPath: string;
    static readonly projectRoot: string;
    static readonly dockerComposeFile: string;
    static getDevelopmentDatabaseConnectionString(): string;
    static validateEnvironment(): void;
    static getEnvironmentInfo(): Record<string, any>;
}
//# sourceMappingURL=environment.d.ts.map
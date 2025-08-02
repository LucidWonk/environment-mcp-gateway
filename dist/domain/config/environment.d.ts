export declare class Environment {
    static get dbHost(): string;
    static get dbPassword(): string | undefined;
    static get dbPort(): number;
    static get database(): string;
    static get username(): string;
    static get gitRepoPath(): string;
    static get gitUserName(): string | undefined;
    static get gitUserEmail(): string | undefined;
    static get mcpServerPort(): number;
    static get mcpLogLevel(): string;
    static get solutionPath(): string;
    static get projectRoot(): string;
    static get dockerComposeFile(): string;
    static get azureDevOpsOrganization(): string | undefined;
    static get azureDevOpsProject(): string;
    static get azureDevOpsPAT(): string | undefined;
    static get azureDevOpsApiUrl(): string;
    static get hyperVPath(): string;
    static get vmStoragePath(): string;
    static get sshKeyPath(): string;
    static get vmDefaultPassword(): string | undefined;
    static get vmDefaultUsername(): string;
    static get vmNetworkSwitch(): string;
    static get vmBootTimeout(): number;
    static get sshTimeout(): number;
    static get hyperVHostIP(): string;
    static get hyperVHostUser(): string;
    static get hyperVHostAuthMethod(): string;
    static get hyperVHostCredentialPath(): string | undefined;
    static getDevelopmentDatabaseConnectionString(): string;
    static validateEnvironment(): void;
    static validateHyperVConfiguration(): void;
    static getHyperVHostConnectionString(): string;
    static getHyperVCredentialPath(): string;
    static getEnvironmentInfo(): Record<string, any>;
}
//# sourceMappingURL=environment.d.ts.map
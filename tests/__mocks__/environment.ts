// Mock environment module for Jest tests
export class Environment {
    static get dbHost(): string { return 'localhost'; }
    static get dbPassword(): string | undefined { return 'test-password'; }
    static get dbPort(): number { return 5432; }
    static get dbName(): string { return 'test-db'; }
    static get dbUser(): string { return 'test-user'; }

    static get redpandaBootstrapServers(): string { return 'localhost:9092'; }
    static get redpandaSchemaRegistryUrl(): string { return 'http://localhost:8081'; }
    static get redpandaAdminUrl(): string { return 'http://localhost:9644'; }

    static get azureDevOpsOrganization(): string | undefined { return 'test-org'; }
    static get azureDevOpsProject(): string | undefined { return 'test-project'; }
    static get azureDevOpsPAT(): string | undefined { return 'test-pat'; }
    static get azureDevOpsApiUrl(): string { return 'https://dev.azure.com'; }

    static get mcpLogLevel(): string { return 'info'; }
    static get mcpServerPort(): number { return 3000; }

    static get gitRepositoryPath(): string { return '/test/repo'; }

    static get hypervHost(): string { return 'localhost'; }
    static get hypervUsername(): string | undefined { return 'test-user'; }
    static get hypervPassword(): string | undefined { return 'test-password'; }
    static get hypervDomain(): string | undefined { return 'test-domain'; }

    static validateEnvironment(): any {
        return { isValid: true, errors: [] };
    }
}
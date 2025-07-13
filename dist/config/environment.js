import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// Load environment variables from .env.development in parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../.env.development');
config({ path: envPath });
export class Environment {
    // Database - development database configuration
    static get dbHost() { return process.env.DB_HOST ?? "localhost"; }
    static get dbPassword() { return process.env.DB_PASSWORD; }
    static get dbPort() { return parseInt(process.env.DB_PORT ?? "5432"); }
    static get database() { return process.env.TIMESCALE_DATABASE ?? "pricehistorydb"; }
    static get username() { return process.env.TIMESCALE_USERNAME ?? "postgres"; }
    // Git configuration for development workflow
    static get gitRepoPath() { return process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks"; }
    static get gitUserName() { return process.env.GIT_USER_NAME; }
    static get gitUserEmail() { return process.env.GIT_USER_EMAIL; }
    // MCP server configuration
    static get mcpServerPort() { return parseInt(process.env.MCP_SERVER_PORT ?? "3001"); }
    static get mcpLogLevel() { return process.env.MCP_LOG_LEVEL ?? "info"; }
    // Solution and project paths
    static get solutionPath() { return join(process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks", "Lucidwonks.sln"); }
    static get projectRoot() { return process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks"; }
    // Docker configuration
    static get dockerComposeFile() { return join(process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks", "docker-compose.yml"); }
    // Azure DevOps configuration
    static get azureDevOpsOrganization() { return process.env.AZURE_DEVOPS_ORGANIZATION; }
    static get azureDevOpsProject() { return process.env.AZURE_DEVOPS_PROJECT ?? "Lucidwonks"; }
    static get azureDevOpsPAT() { return process.env.AZURE_DEVOPS_PAT; }
    static get azureDevOpsApiUrl() { return process.env.AZURE_DEVOPS_API_URL ?? "https://dev.azure.com"; }
    static getDevelopmentDatabaseConnectionString() {
        if (!this.dbPassword) {
            throw new Error("Database password is required (DB_PASSWORD environment variable)");
        }
        return `postgresql://${this.username}:${this.dbPassword}@${this.dbHost}:${this.dbPort}/${this.database}`;
    }
    static validateEnvironment() {
        const requiredVars = [
            'DB_PASSWORD',
            'GIT_USER_NAME',
            'GIT_USER_EMAIL'
        ];
        // Optional Azure DevOps validation
        if (process.env.AZURE_DEVOPS_ORGANIZATION && !process.env.AZURE_DEVOPS_PAT) {
            throw new Error('AZURE_DEVOPS_PAT is required when AZURE_DEVOPS_ORGANIZATION is set');
        }
        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
    static getEnvironmentInfo() {
        return {
            dbHost: this.dbHost,
            dbPort: this.dbPort,
            database: this.database,
            username: this.username,
            gitRepoPath: this.gitRepoPath,
            gitUserName: this.gitUserName,
            gitUserEmail: this.gitUserEmail,
            mcpServerPort: this.mcpServerPort,
            mcpLogLevel: this.mcpLogLevel,
            solutionPath: this.solutionPath,
            projectRoot: this.projectRoot,
            dockerComposeFile: this.dockerComposeFile,
            azureDevOpsOrganization: this.azureDevOpsOrganization,
            azureDevOpsProject: this.azureDevOpsProject,
            azureDevOpsApiUrl: this.azureDevOpsApiUrl,
            azureDevOpsPATConfigured: !!this.azureDevOpsPAT
        };
    }
}
//# sourceMappingURL=environment.js.map
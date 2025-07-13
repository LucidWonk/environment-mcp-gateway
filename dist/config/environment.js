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
    static dbHost = process.env.DB_HOST ?? "localhost";
    static dbPassword = process.env.DB_PASSWORD;
    static dbPort = parseInt(process.env.DB_PORT ?? "5432");
    static database = process.env.TIMESCALE_DATABASE ?? "pricehistorydb";
    static username = process.env.TIMESCALE_USERNAME ?? "postgres";
    // Git configuration for development workflow
    static gitRepoPath = process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks";
    static gitUserName = process.env.GIT_USER_NAME;
    static gitUserEmail = process.env.GIT_USER_EMAIL;
    // MCP server configuration
    static mcpServerPort = parseInt(process.env.MCP_SERVER_PORT ?? "3001");
    static mcpLogLevel = process.env.MCP_LOG_LEVEL ?? "info";
    // Solution and project paths
    static solutionPath = join(process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks", "Lucidwonks.sln");
    static projectRoot = process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks";
    // Docker configuration
    static dockerComposeFile = join(process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks", "docker-compose.yml");
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
            dockerComposeFile: this.dockerComposeFile
        };
    }
}
//# sourceMappingURL=environment.js.map
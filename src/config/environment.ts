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
    public static readonly dbHost = process.env.DB_HOST ?? "localhost";
    public static readonly dbPassword = process.env.DB_PASSWORD;
    public static readonly dbPort = parseInt(process.env.DB_PORT ?? "5432");
    public static readonly database = process.env.TIMESCALE_DATABASE ?? "pricehistorydb";
    public static readonly username = process.env.TIMESCALE_USERNAME ?? "postgres";
    
    // Git configuration for development workflow
    public static readonly gitRepoPath = process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks";
    public static readonly gitUserName = process.env.GIT_USER_NAME;
    public static readonly gitUserEmail = process.env.GIT_USER_EMAIL;
    
    // MCP server configuration
    public static readonly mcpServerPort = parseInt(process.env.MCP_SERVER_PORT ?? "3001");
    public static readonly mcpLogLevel = process.env.MCP_LOG_LEVEL ?? "info";
    
    // Solution and project paths
    public static readonly solutionPath = join(process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks", "Lucidwonks.sln");
    public static readonly projectRoot = process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks";
    
    // Docker configuration
    public static readonly dockerComposeFile = join(process.env.GIT_REPO_PATH ?? "/mnt/m/Projects/Lucidwonks", "docker-compose.yml");
    
    public static getDevelopmentDatabaseConnectionString(): string {
        if (!this.dbPassword) {
            throw new Error("Database password is required (DB_PASSWORD environment variable)");
        }
        return `postgresql://${this.username}:${this.dbPassword}@${this.dbHost}:${this.dbPort}/${this.database}`;
    }
    
    public static validateEnvironment(): void {
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
    
    public static getEnvironmentInfo(): Record<string, any> {
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
import { config } from 'dotenv';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.development in parent directory
// Use resolve to get absolute path - handle both src and dist directories
const projectRoot = resolve(__dirname, '..', '..', '..');
const envPath = join(projectRoot, '.env.development');
console.info(`Loading environment from: ${envPath}`);
config({ path: envPath });

export class Environment {
    // Database - development database configuration
    public static get dbHost(): string { return process.env.DB_HOST ?? 'localhost'; }
    public static get dbPassword(): string | undefined { return process.env.DB_PASSWORD; }
    public static get dbPort(): number { return parseInt(process.env.DB_PORT ?? '5432'); }
    public static get database(): string { return process.env.TIMESCALE_DATABASE ?? 'pricehistorydb'; }
    public static get username(): string { return process.env.TIMESCALE_USERNAME ?? 'postgres'; }
    
    // Git configuration for development workflow
    public static get gitRepoPath(): string { 
        // Use PROJECT_ROOT from Docker environment, fallback to GIT_REPO_PATH, then default
        return process.env.PROJECT_ROOT ?? process.env.GIT_REPO_PATH ?? '/mnt/m/Projects/Lucidwonks'; 
    }
    public static get gitUserName(): string | undefined { return process.env.GIT_USER_NAME; }
    public static get gitUserEmail(): string | undefined { return process.env.GIT_USER_EMAIL; }
    
    // MCP server configuration
    public static get mcpServerPort(): number { return parseInt(process.env.MCP_SERVER_PORT ?? '3001'); }
    public static get mcpLogLevel(): string { return process.env.MCP_LOG_LEVEL ?? 'info'; }
    
    // Solution and project paths
    public static get solutionPath(): string { return join(this.projectRoot, 'Lucidwonks.sln'); }
    public static get projectRoot(): string { 
        // Use PROJECT_ROOT from Docker environment, fallback to GIT_REPO_PATH, then default
        const root = process.env.PROJECT_ROOT ?? process.env.GIT_REPO_PATH ?? '/mnt/m/Projects/Lucidwonks';
        // Validate the path exists and log for debugging
        console.info(`Project root resolved to: ${root}`);
        return root;
    }
    
    // Docker configuration
    public static get dockerComposeFile(): string { return join(this.projectRoot, 'docker-compose.yml'); }
    
    // Azure DevOps configuration
    public static get azureDevOpsOrganization(): string | undefined { return process.env.AZURE_DEVOPS_ORGANIZATION; }
    public static get azureDevOpsProject(): string { return process.env.AZURE_DEVOPS_PROJECT ?? 'Lucidwonks'; }
    public static get azureDevOpsPAT(): string | undefined { return process.env.AZURE_DEVOPS_PAT; }
    public static get azureDevOpsApiUrl(): string { return process.env.AZURE_DEVOPS_API_URL ?? 'https://dev.azure.com'; }
    
    // VM Management configuration
    public static get hyperVPath(): string { return process.env.HYPERV_PATH ?? 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'; }
    public static get vmStoragePath(): string { return process.env.VM_STORAGE_PATH ?? 'C:\\VMs'; }
    public static get sshKeyPath(): string { return process.env.SSH_KEY_PATH ?? 'C:\\SSH\\vm-dev-key'; }
    public static get vmDefaultPassword(): string | undefined { return process.env.VM_DEFAULT_PASSWORD; }
    public static get vmDefaultUsername(): string { return process.env.VM_DEFAULT_USERNAME ?? 'developer'; }
    public static get vmNetworkSwitch(): string { return process.env.VM_NETWORK_SWITCH ?? 'Default Switch'; }
    public static get vmBootTimeout(): number { return parseInt(process.env.VM_BOOT_TIMEOUT ?? '300'); }
    public static get sshTimeout(): number { return parseInt(process.env.SSH_TIMEOUT ?? '30'); }
    
    // Hyper-V Host configuration
    public static get hyperVHostIP(): string { return process.env.HYPER_V_HOST_IP ?? 'localhost'; }
    public static get hyperVHostUser(): string { return process.env.HYPER_V_HOST_USER ?? 'Administrator'; }
    public static get hyperVHostAuthMethod(): string { return process.env.HYPER_V_HOST_AUTH_METHOD ?? 'powershell-remoting'; }
    public static get hyperVHostCredentialPath(): string | undefined { return process.env.HYPER_V_HOST_CREDENTIAL_PATH; }
    
    public static getDevelopmentDatabaseConnectionString(): string {
        if (!this.dbPassword) {
            throw new Error('Database password is required (DB_PASSWORD environment variable)');
        }
        return `postgresql://${this.username}:${this.dbPassword}@${this.dbHost}:${this.dbPort}/${this.database}`;
    }
    
    public static validateEnvironment(): void {
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
        
        // Validate Hyper-V host configuration
        this.validateHyperVConfiguration();
    }
    
    public static validateHyperVConfiguration(): void {
        const requiredHyperVVars = [
            'HYPER_V_HOST_IP',
            'HYPER_V_HOST_USER'
        ];
        
        const allHyperVVars = [
            'HYPER_V_HOST_IP',
            'HYPER_V_HOST_USER',
            'HYPER_V_HOST_AUTH_METHOD',
            'HYPER_V_HOST_CREDENTIAL_PATH'
        ];
        
        // Check if any Hyper-V variables are set (indicating Hyper-V usage)
        const hyperVVarsSet = allHyperVVars.some(varName => process.env[varName]);
        
        if (hyperVVarsSet) {
            const missingHyperV = requiredHyperVVars.filter(varName => !process.env[varName]);
            if (missingHyperV.length > 0) {
                throw new Error(`Missing required Hyper-V environment variables: ${missingHyperV.join(', ')}`);
            }
            
            // Validate credential path if using credential-based auth
            if (this.hyperVHostAuthMethod === 'powershell-remoting' && !this.hyperVHostCredentialPath) {
                throw new Error('HYPER_V_HOST_CREDENTIAL_PATH is required when using powershell-remoting authentication');
            }
        }
    }
    
    public static getHyperVHostConnectionString(): string {
        return `${this.hyperVHostUser}@${this.hyperVHostIP}`;
    }
    
    public static getHyperVCredentialPath(): string {
        if (!this.hyperVHostCredentialPath) {
            throw new Error('Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)');
        }
        return this.hyperVHostCredentialPath;
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
            dockerComposeFile: this.dockerComposeFile,
            azureDevOpsOrganization: this.azureDevOpsOrganization,
            azureDevOpsProject: this.azureDevOpsProject,
            azureDevOpsApiUrl: this.azureDevOpsApiUrl,
            azureDevOpsPATConfigured: !!this.azureDevOpsPAT,
            hyperVPath: this.hyperVPath,
            vmStoragePath: this.vmStoragePath,
            sshKeyPath: this.sshKeyPath,
            vmDefaultUsername: this.vmDefaultUsername,
            vmNetworkSwitch: this.vmNetworkSwitch,
            vmBootTimeout: this.vmBootTimeout,
            sshTimeout: this.sshTimeout,
            vmDefaultPasswordConfigured: !!this.vmDefaultPassword,
            hyperVHostIP: this.hyperVHostIP,
            hyperVHostUser: this.hyperVHostUser,
            hyperVHostAuthMethod: this.hyperVHostAuthMethod,
            hyperVHostCredentialPathConfigured: !!this.hyperVHostCredentialPath
        };
    }
}
import { config } from 'dotenv';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables from .env.development in EnvironmentMCPGateway root directory
// Calculate path from src/domain/config back to EnvironmentMCPGateway root
const mcpGatewayRoot = resolve(__dirname, '..', '..', '..');
const envPath = join(mcpGatewayRoot, '.env.development');
console.info(`Loading environment from: ${envPath}`);
// Verify the file exists before trying to load it
if (existsSync(envPath)) {
    config({ path: envPath });
    console.info(`✅ Environment file loaded successfully from ${envPath}`);
}
else {
    console.warn(`❌ Environment file not found at ${envPath}, using process environment variables`);
}
export class Environment {
    // Database - development database configuration
    static get dbHost() { return process.env.DB_HOST ?? 'localhost'; }
    static get dbPassword() { return process.env.DB_PASSWORD; }
    static get dbPort() { return parseInt(process.env.DB_PORT ?? '5432'); }
    static get database() { return process.env.TIMESCALE_DATABASE ?? 'pricehistorydb'; }
    static get username() { return process.env.TIMESCALE_USERNAME ?? 'postgres'; }
    // Git configuration for development workflow
    static get gitRepoPath() {
        // Use PROJECT_ROOT from Docker environment, fallback to GIT_REPO_PATH, then default
        return process.env.PROJECT_ROOT ?? process.env.GIT_REPO_PATH ?? '/mnt/m/projects/lucidwonks';
    }
    static get gitUserName() { return process.env.GIT_USER_NAME; }
    static get gitUserEmail() { return process.env.GIT_USER_EMAIL; }
    // MCP server configuration
    static get mcpServerPort() { return parseInt(process.env.MCP_SERVER_PORT ?? '3001'); }
    static get mcpLogLevel() { return process.env.MCP_LOG_LEVEL ?? 'info'; }
    // Solution and project paths
    static get solutionPath() { return join(this.projectRoot, 'Lucidwonks.sln'); }
    static get projectRoot() {
        // Use PROJECT_ROOT from Docker environment, fallback to GIT_REPO_PATH, then default
        const root = process.env.PROJECT_ROOT ?? process.env.GIT_REPO_PATH ?? '/mnt/m/projects/lucidwonks';
        // Validate the path exists and log for debugging
        console.info(`Project root resolved to: ${root}`);
        return root;
    }
    // Docker configuration
    static get dockerComposeFile() { return join(this.projectRoot, 'docker-compose.yml'); }
    // Azure DevOps configuration
    static get azureDevOpsOrganization() { return process.env.AZURE_DEVOPS_ORGANIZATION; }
    static get azureDevOpsProject() { return process.env.AZURE_DEVOPS_PROJECT ?? 'Lucidwonks'; }
    static get azureDevOpsPAT() { return process.env.AZURE_DEVOPS_PAT; }
    static get azureDevOpsApiUrl() { return process.env.AZURE_DEVOPS_API_URL ?? 'https://dev.azure.com'; }
    // VM Management configuration
    static get hyperVPath() { return process.env.HYPERV_PATH ?? 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'; }
    static get vmStoragePath() { return process.env.VM_STORAGE_PATH ?? 'C:\\VMs'; }
    static get sshKeyPath() { return process.env.SSH_KEY_PATH ?? 'C:\\SSH\\vm-dev-key'; }
    static get vmDefaultPassword() { return process.env.VM_DEFAULT_PASSWORD; }
    static get vmDefaultUsername() { return process.env.VM_DEFAULT_USERNAME ?? 'developer'; }
    static get vmNetworkSwitch() { return process.env.VM_NETWORK_SWITCH ?? 'Default Switch'; }
    static get vmBootTimeout() { return parseInt(process.env.VM_BOOT_TIMEOUT ?? '300'); }
    static get sshTimeout() { return parseInt(process.env.SSH_TIMEOUT ?? '30'); }
    // Hyper-V Host configuration
    static get hyperVHostIP() { return process.env.HYPER_V_HOST_IP ?? 'localhost'; }
    static get hyperVHostUser() { return process.env.HYPER_V_HOST_USER ?? 'Administrator'; }
    static get hyperVHostAuthMethod() { return process.env.HYPER_V_HOST_AUTH_METHOD ?? 'powershell-remoting'; }
    static get hyperVHostCredentialPath() { return process.env.HYPER_V_HOST_CREDENTIAL_PATH; }
    static getDevelopmentDatabaseConnectionString() {
        if (!this.dbPassword) {
            throw new Error('Database password is required (DB_PASSWORD environment variable)');
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
        // Validate Hyper-V host configuration
        this.validateHyperVConfiguration();
    }
    static validateHyperVConfiguration() {
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
    static getHyperVHostConnectionString() {
        return `${this.hyperVHostUser}@${this.hyperVHostIP}`;
    }
    static getHyperVCredentialPath() {
        if (!this.hyperVHostCredentialPath) {
            throw new Error('Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)');
        }
        return this.hyperVHostCredentialPath;
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
//# sourceMappingURL=environment.js.map
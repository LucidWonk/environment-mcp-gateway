"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterManager = void 0;
const winston_1 = __importDefault(require("winston"));
const configuration_manager_js_1 = require("../domain/config/configuration-manager.js");
const azure_devops_adapter_js_1 = require("./azure-devops-adapter.js");
const docker_adapter_js_1 = require("./docker-adapter.js");
const logger = winston_1.default.createLogger({
    level: process.env.MCP_LOG_LEVEL ?? 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});
class AdapterManager {
    static instance;
    adapters;
    configManager;
    reloadCount = 0;
    constructor() {
        this.configManager = configuration_manager_js_1.ConfigurationManager.getInstance();
        this.adapters = this.createAdapters();
        this.setupConfigurationWatching();
    }
    static getInstance() {
        if (!AdapterManager.instance) {
            AdapterManager.instance = new AdapterManager();
        }
        return AdapterManager.instance;
    }
    createAdapters() {
        logger.info('Creating fresh adapter instances');
        return {
            azureDevOps: new azure_devops_adapter_js_1.AzureDevOpsAdapter(),
            docker: new docker_adapter_js_1.DockerAdapter()
        };
    }
    setupConfigurationWatching() {
        this.configManager.addChangeListener(this.handleConfigurationChange.bind(this));
        // Start watching configuration files
        this.configManager.startWatching();
        logger.info('Adapter manager initialized with configuration watching');
    }
    async handleConfigurationChange(event) {
        logger.info('Configuration change detected, reloading adapters', {
            type: event.type,
            changes: event.changes,
            reloadCount: this.reloadCount + 1
        });
        try {
            // Check if Azure DevOps configuration changed
            const azureDevOpsVars = ['AZURE_DEVOPS_ORGANIZATION', 'AZURE_DEVOPS_PROJECT', 'AZURE_DEVOPS_PAT', 'AZURE_DEVOPS_API_URL'];
            const azureDevOpsChanged = event.changes.some(change => azureDevOpsVars.includes(change));
            // Check if Docker configuration changed (though Docker adapter is less configuration-dependent)
            const dockerVars = ['GIT_REPO_PATH', 'DB_HOST', 'DB_PORT'];
            const dockerChanged = event.changes.some(change => dockerVars.includes(change));
            // Reload affected adapters
            if (azureDevOpsChanged || event.type === 'dotenv') {
                logger.info('Reloading Azure DevOps adapter due to configuration changes');
                this.adapters.azureDevOps = new azure_devops_adapter_js_1.AzureDevOpsAdapter();
            }
            if (dockerChanged || event.type === 'dotenv') {
                logger.info('Reloading Docker adapter due to configuration changes');
                this.adapters.docker = new docker_adapter_js_1.DockerAdapter();
            }
            this.reloadCount++;
            logger.info('Adapter reload completed successfully', {
                reloadCount: this.reloadCount,
                azureDevOpsReloaded: azureDevOpsChanged || event.type === 'dotenv',
                dockerReloaded: dockerChanged || event.type === 'dotenv'
            });
        }
        catch (error) {
            logger.error('Failed to reload adapters after configuration change', {
                error: error instanceof Error ? error.message : 'Unknown error',
                event
            });
        }
    }
    getAdapters() {
        return this.adapters;
    }
    getAzureDevOpsAdapter() {
        return this.adapters.azureDevOps;
    }
    getDockerAdapter() {
        return this.adapters.docker;
    }
    forceReload() {
        logger.info('Forcing adapter reload');
        this.configManager.reloadConfiguration();
    }
    getStatus() {
        const azureDevOps = this.adapters.azureDevOps;
        return {
            reloadCount: this.reloadCount,
            isWatching: this.configManager.getConfigurationSummary().isWatching,
            lastReload: new Date(),
            adapterStatus: {
                azureDevOps: {
                    organization: azureDevOps.organization,
                    project: azureDevOps.project,
                    hasConfigured: !!azureDevOps.organization && !!azureDevOps.pat,
                    baseUrl: azureDevOps.baseUrl
                },
                docker: {
                    configured: true // Docker adapter doesn't require specific configuration
                }
            }
        };
    }
    async testConfiguration() {
        logger.info('Testing adapter configurations');
        const results = {
            azureDevOps: { healthy: false, message: '' },
            docker: { healthy: false, message: '' }
        };
        // Test Azure DevOps
        try {
            const azureHealth = await this.adapters.azureDevOps.getAzureDevOpsHealth();
            results.azureDevOps.healthy = azureHealth.connected;
            results.azureDevOps.message = azureHealth.message;
        }
        catch (error) {
            results.azureDevOps.message = `Azure DevOps test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        // Test Docker
        try {
            const containers = await this.adapters.docker.listDevelopmentContainers();
            results.docker.healthy = true;
            results.docker.message = `Docker healthy, ${containers.length} containers found`;
        }
        catch (error) {
            results.docker.message = `Docker test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        return results;
    }
    async shutdown() {
        logger.info('Shutting down adapter manager');
        await this.configManager.shutdown();
    }
}
exports.AdapterManager = AdapterManager;
//# sourceMappingURL=adapter-manager.js.map
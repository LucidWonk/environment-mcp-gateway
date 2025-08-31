import { ConfigurationManager, ConfigurationChangeEvent } from '../domain/config/configuration-manager.js';
import { AzureDevOpsAdapter } from './azure-devops-adapter.js';
import { DockerAdapter } from './docker-adapter.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('mcp-gateway.log');

export interface AdapterInstances {
    azureDevOps: AzureDevOpsAdapter;
    docker: DockerAdapter;
}

export class AdapterManager {
    private static instance: AdapterManager;
    private adapters: AdapterInstances;
    private configManager: ConfigurationManager;
    private reloadCount: number = 0;

    private constructor() {
        this.configManager = ConfigurationManager.getInstance();
        this.adapters = this.createAdapters();
        this.setupConfigurationWatching();
    }

    public static getInstance(): AdapterManager {
        if (!AdapterManager.instance) {
            AdapterManager.instance = new AdapterManager();
        }
        return AdapterManager.instance;
    }

    private createAdapters(): AdapterInstances {
        logger.info('Creating fresh adapter instances');
        
        return {
            azureDevOps: new AzureDevOpsAdapter(),
            docker: new DockerAdapter()
        };
    }

    private setupConfigurationWatching(): void {
        this.configManager.addChangeListener(this.handleConfigurationChange.bind(this));
        
        // Start watching configuration files
        this.configManager.startWatching();
        
        logger.info('Adapter manager initialized with configuration watching');
    }

    private async handleConfigurationChange(event: ConfigurationChangeEvent): Promise<void> {
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
                this.adapters.azureDevOps = new AzureDevOpsAdapter();
            }

            if (dockerChanged || event.type === 'dotenv') {
                logger.info('Reloading Docker adapter due to configuration changes');
                this.adapters.docker = new DockerAdapter();
            }

            this.reloadCount++;
            
            logger.info('Adapter reload completed successfully', {
                reloadCount: this.reloadCount,
                azureDevOpsReloaded: azureDevOpsChanged || event.type === 'dotenv',
                dockerReloaded: dockerChanged || event.type === 'dotenv'
            });

        } catch (error) {
            logger.error('Failed to reload adapters after configuration change', {
                error: error instanceof Error ? error.message : 'Unknown error',
                event
            });
        }
    }

    public getAdapters(): AdapterInstances {
        return this.adapters;
    }

    public getAzureDevOpsAdapter(): AzureDevOpsAdapter {
        return this.adapters.azureDevOps;
    }

    public getDockerAdapter(): DockerAdapter {
        return this.adapters.docker;
    }

    public forceReload(): void {
        logger.info('Forcing adapter reload');
        this.configManager.reloadConfiguration();
    }

    public getStatus(): {
        reloadCount: number;
        isWatching: boolean;
        lastReload: Date;
        adapterStatus: {
            azureDevOps: {
                organization: string;
                project: string;
                hasConfigured: boolean;
                baseUrl: string;
            };
            docker: {
                configured: boolean;
            };
        };
        } {
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

    public async testConfiguration(): Promise<{
        azureDevOps: { healthy: boolean; message: string; };
        docker: { healthy: boolean; message: string; };
    }> {
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
        } catch (error) {
            results.azureDevOps.message = `Azure DevOps test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        // Test Docker
        try {
            const containers = await this.adapters.docker.listDevelopmentContainers();
            results.docker.healthy = true;
            results.docker.message = `Docker healthy, ${containers.length} containers found`;
        } catch (error) {
            results.docker.message = `Docker test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        return results;
    }

    public async shutdown(): Promise<void> {
        logger.info('Shutting down adapter manager');
        await this.configManager.shutdown();
    }
}
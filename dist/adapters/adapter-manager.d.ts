import { AzureDevOpsAdapter } from './azure-devops-adapter.js';
import { DockerAdapter } from './docker-adapter.js';
export interface AdapterInstances {
    azureDevOps: AzureDevOpsAdapter;
    docker: DockerAdapter;
}
export declare class AdapterManager {
    private static instance;
    private adapters;
    private configManager;
    private reloadCount;
    private constructor();
    static getInstance(): AdapterManager;
    private createAdapters;
    private setupConfigurationWatching;
    private handleConfigurationChange;
    getAdapters(): AdapterInstances;
    getAzureDevOpsAdapter(): AzureDevOpsAdapter;
    getDockerAdapter(): DockerAdapter;
    forceReload(): void;
    getStatus(): {
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
    };
    testConfiguration(): Promise<{
        azureDevOps: {
            healthy: boolean;
            message: string;
        };
        docker: {
            healthy: boolean;
            message: string;
        };
    }>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=adapter-manager.d.ts.map
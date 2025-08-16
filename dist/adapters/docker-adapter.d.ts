export interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'restarting' | 'dead' | 'exited';
    health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
    ports: string[];
    createdAt: Date;
    command: string;
    uptime?: string;
}
export interface DatabaseContainerStatus {
    container: ContainerInfo | null;
    connection: {
        host: string;
        port: number;
        database: string;
        accessible: boolean;
    };
    health: 'healthy' | 'degraded' | 'failed';
    message: string;
}
export interface MessageQueueContainerStatus {
    redpanda: {
        container: ContainerInfo | null;
        health: 'healthy' | 'degraded' | 'failed';
        ports: {
            kafka: number;
            schemaRegistry: number;
            adminApi: number;
        };
    };
    console: {
        container: ContainerInfo | null;
        accessible: boolean;
        url: string;
    };
    overall: 'healthy' | 'degraded' | 'failed';
    message: string;
}
export interface EnvironmentHealth {
    overall: 'healthy' | 'degraded' | 'failed';
    database: DatabaseContainerStatus;
    messaging: MessageQueueContainerStatus;
    issues: Array<{
        component: string;
        severity: 'warning' | 'error';
        message: string;
    }>;
    recommendations: Array<{
        issue: string;
        suggestion: string;
        command?: string;
    }>;
}
export interface ComposeServiceInfo {
    name: string;
    status: 'running' | 'stopped' | 'error';
    container?: ContainerInfo;
    dependsOn: string[];
}
export declare class DockerAdapter {
    private static readonly TIMESCALE_IMAGE_PATTERNS;
    private static readonly REDPANDA_IMAGE_PATTERNS;
    private static readonly REDPANDA_CONSOLE_IMAGE_PATTERNS;
    private executeDockerCommand;
    private normalizeContainerStatus;
    private executeComposeCommand;
    private parseDockerPsOutput;
    listContainers(): Promise<ContainerInfo[]>;
    listDevelopmentContainers(): Promise<ContainerInfo[]>;
    getContainerHealth(containerId: string): Promise<{
        healthy: boolean;
        message: string;
    }>;
    getContainerLogs(containerId: string, lines?: number): Promise<string>;
    restartContainer(containerId: string): Promise<boolean>;
    getTimescaleDBStatus(): Promise<DatabaseContainerStatus>;
    getRedPandaStatus(): Promise<MessageQueueContainerStatus>;
    private evaluateContainerHealth;
    getDevelopmentEnvironmentHealth(): Promise<EnvironmentHealth>;
    getComposeServices(): Promise<ComposeServiceInfo[]>;
    restartComposeService(serviceName: string): Promise<boolean>;
}
//# sourceMappingURL=docker-adapter.d.ts.map
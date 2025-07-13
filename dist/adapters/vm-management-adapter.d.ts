export interface VMInfo {
    name: string;
    id: string;
    state: 'Running' | 'Off' | 'Saved' | 'Paused' | 'Starting' | 'Stopping' | 'Other';
    status: 'Operating normally' | 'Degraded' | 'Critical' | 'Non-recoverable error' | 'Unknown';
    cpuUsage: number;
    memoryUsageMB: number;
    memoryTotalMB: number;
    uptime: string;
    ipAddresses: string[];
    heartbeat: 'Ok' | 'Error' | 'NoContact' | 'LostCommunication';
    integrationServicesVersion?: string;
    generation: 1 | 2;
    version?: string;
    notes?: string;
}
export interface VMResourceUsage {
    cpu: {
        usagePercent: number;
        coreCount: number;
    };
    memory: {
        usedMB: number;
        totalMB: number;
        usagePercent: number;
    };
    disk: {
        usedGB: number;
        totalGB: number;
        usagePercent: number;
        path: string;
    }[];
    network: {
        interfaceName: string;
        bytesReceived: number;
        bytesSent: number;
        packetsReceived: number;
        packetsSent: number;
    }[];
}
export interface VMHealthStatus {
    vm: VMInfo | null;
    resources: VMResourceUsage | null;
    docker: {
        installed: boolean;
        running: boolean;
        version?: string;
        composeVersion?: string;
    };
    connectivity: {
        ping: boolean;
        ssh: boolean;
        responseTimeMs?: number;
    };
    services: {
        name: string;
        status: 'running' | 'stopped' | 'failed' | 'unknown';
        description?: string;
    }[];
    overall: 'healthy' | 'degraded' | 'failed';
    message: string;
    lastChecked: Date;
}
export interface VMDeploymentInfo {
    vmName: string;
    composeFile: string;
    services: string[];
    status: 'deployed' | 'deploying' | 'failed' | 'stopped';
    deployedAt?: Date;
    lastUpdate?: Date;
    logs?: string;
}
export interface VMTemplate {
    name: string;
    description: string;
    osType: 'Ubuntu' | 'Windows' | 'CentOS' | 'Other';
    osVersion: string;
    memoryMB: number;
    cpuCores: number;
    diskSizeGB: number;
    templatePath: string;
    preInstalledSoftware: string[];
    generation?: 1 | 2;
    defaultCredentials?: {
        username: string;
        passwordEnvVar?: string;
        sshKeyPath?: string;
    };
}
export interface SSHConnectionInfo {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKeyPath?: string;
    timeout: number;
}
export interface DockerComposeDeployment {
    composeContent: string;
    environmentVars?: {
        [key: string]: string;
    };
    targetPath: string;
    servicesToStart?: string[];
    volumes?: {
        local: string;
        remote: string;
    }[];
    networks?: string[];
}
export declare class VMManagementAdapter {
    private static readonly DEFAULT_VM_TEMPLATES;
    private readonly hyperVPath;
    private readonly vmStoragePath;
    private readonly sshKeyPath;
    constructor();
    private executePowerShellCommand;
    private executeSSHCommand;
    provisionVM(template: VMTemplate, vmName: string, options?: {
        memoryMB?: number;
        cpuCores?: number;
        diskSizeGB?: number;
        networkSwitch?: string;
        startAfterCreation?: boolean;
    }): Promise<VMInfo>;
    getVMInfo(vmName: string): Promise<VMInfo>;
    listVMs(): Promise<VMInfo[]>;
    startVM(vmName: string): Promise<boolean>;
    stopVM(vmName: string, force?: boolean): Promise<boolean>;
    restartVM(vmName: string): Promise<boolean>;
    deleteVM(vmName: string, deleteFiles?: boolean): Promise<boolean>;
    getVMHealthStatus(vmName: string, sshInfo?: SSHConnectionInfo): Promise<VMHealthStatus>;
    private getVMResourceUsage;
    private checkVMConnectivity;
    private checkDockerStatus;
    private getVMServices;
    deployToVM(vmName: string, deployment: DockerComposeDeployment, sshInfo: SSHConnectionInfo): Promise<VMDeploymentInfo>;
    getVMLogs(vmName: string, sshInfo: SSHConnectionInfo, options?: {
        logType: 'system' | 'docker' | 'application' | 'all';
        lines?: number;
        since?: string;
        serviceName?: string;
    }): Promise<string>;
    private waitForVMBoot;
    getAvailableTemplates(): Promise<VMTemplate[]>;
    createSSHConnection(ipAddress: string, username?: string): Promise<SSHConnectionInfo>;
    getVMManagementHealth(): Promise<{
        hyperVAvailable: boolean;
        vmCount: number;
        runningVMs: number;
        storageUsageGB: number;
        issues: string[];
        recommendations: string[];
    }>;
}
//# sourceMappingURL=vm-management-adapter.d.ts.map
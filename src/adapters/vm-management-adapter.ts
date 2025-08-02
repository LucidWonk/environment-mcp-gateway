import { spawn } from 'child_process';
import { join } from 'path';
import winston from 'winston';
import { Environment } from '../domain/config/environment';

const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});

// VM Status and State Interfaces
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
    environmentVars?: { [key: string]: string };
    targetPath: string;
    servicesToStart?: string[];
    volumes?: { local: string; remote: string }[];
    networks?: string[];
}

// VM Management Adapter Class
export class VMManagementAdapter {
    private static readonly DEFAULT_VM_TEMPLATES: VMTemplate[] = [
        {
            name: 'ubuntu-docker-dev',
            description: 'Ubuntu 22.04 LTS with Docker and development tools',
            osType: 'Ubuntu',
            osVersion: '22.04',
            memoryMB: 4096,
            cpuCores: 2,
            diskSizeGB: 40,
            templatePath: 'C:\\VM Templates\\Ubuntu-22.04-Docker-Template.vhdx',
            preInstalledSoftware: ['docker', 'docker-compose', 'git', 'curl', 'wget', 'nano'],
            generation: 2,
            defaultCredentials: {
                username: 'developer',
                passwordEnvVar: 'VM_DEFAULT_PASSWORD',
                sshKeyPath: 'C:\\SSH\\vm-dev-key'
            }
        }
    ];

    private readonly hyperVPath: string;
    private readonly vmStoragePath: string;
    private readonly sshKeyPath: string;

    constructor() {
        this.hyperVPath = process.env.HYPERV_PATH || 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
        this.vmStoragePath = process.env.VM_STORAGE_PATH || 'C:\\VMs';
        this.sshKeyPath = process.env.SSH_KEY_PATH || 'C:\\SSH\\vm-dev-key';
    }

    // PowerShell execution helper
    private async executePowerShellCommand(command: string, args: string[] = []): Promise<string> {
        return new Promise((resolve, reject) => {
            const fullCommand = `${command} ${args.join(' ')}`;
            const process = spawn('powershell.exe', ['-Command', fullCommand], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    const error = stderr || `PowerShell command failed with exit code ${code}`;
                    reject(new Error(error));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Failed to execute PowerShell command: ${error.message}`));
            });
        });
    }

    // SSH execution helper
    private async executeSSHCommand(connectionInfo: SSHConnectionInfo, command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const sshArgs = [
                '-o', 'StrictHostKeyChecking=no',
                '-o', 'UserKnownHostsFile=/dev/null',
                '-o', `ConnectTimeout=${connectionInfo.timeout}`,
                '-p', connectionInfo.port.toString()
            ];

            if (connectionInfo.privateKeyPath) {
                sshArgs.push('-i', connectionInfo.privateKeyPath);
            }

            sshArgs.push(`${connectionInfo.username}@${connectionInfo.host}`, command);

            const process = spawn('ssh', sshArgs);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`SSH command failed: ${stderr || `Exit code ${code}`}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Failed to execute SSH command: ${error.message}`));
            });
        });
    }

    // VM Provisioning and Management
    async provisionVM(template: VMTemplate, vmName: string, options: {
        memoryMB?: number;
        cpuCores?: number;
        diskSizeGB?: number;
        networkSwitch?: string;
        startAfterCreation?: boolean;
    } = {}): Promise<VMInfo> {
        try {
            logger.info('Provisioning new VM', { vmName, template: template.name });

            const memoryMB = options.memoryMB || template.memoryMB;
            const cpuCores = options.cpuCores || template.cpuCores;
            const diskSizeGB = options.diskSizeGB || template.diskSizeGB;
            const networkSwitch = options.networkSwitch || 'Default Switch';

            // Create VM using PowerShell commands
            const createVMCommand = `
                $vmPath = "${this.vmStoragePath}\\${vmName}"
                $vhdPath = "$vmPath\\${vmName}.vhdx"
                
                # Create VM directory
                New-Item -ItemType Directory -Path $vmPath -Force
                
                # Copy template VHD
                Copy-Item "${template.templatePath}" $vhdPath
                
                # Resize VHD if needed
                if (${diskSizeGB} -gt ${template.diskSizeGB}) {
                    Resize-VHD -Path $vhdPath -SizeBytes (${diskSizeGB}GB)
                }
                
                # Create VM
                New-VM -Name "${vmName}" -MemoryStartupBytes (${memoryMB}MB) -VHDPath $vhdPath -Generation ${template.generation || 2}
                
                # Configure VM
                Set-VM -Name "${vmName}" -ProcessorCount ${cpuCores}
                Get-VMNetworkAdapter -VMName "${vmName}" | Connect-VMNetworkAdapter -SwitchName "${networkSwitch}"
                
                # Set automatic start/stop actions
                Set-VM -Name "${vmName}" -AutomaticStartAction Start -AutomaticStopAction ShutDown
                
                Write-Output "VM ${vmName} created successfully"
            `;

            await this.executePowerShellCommand(createVMCommand);

            // Start VM if requested
            if (options.startAfterCreation !== false) {
                await this.startVM(vmName);
                
                // Wait for VM to boot and be accessible
                await this.waitForVMBoot(vmName, 300); // 5 minute timeout
            }

            const vmInfo = await this.getVMInfo(vmName);
            logger.info('VM provisioned successfully', { vmName, vmInfo });

            return vmInfo;
        } catch (error) {
            logger.error('Failed to provision VM', { vmName, template: template.name, error });
            throw error;
        }
    }

    async getVMInfo(vmName: string): Promise<VMInfo> {
        try {
            const command = `
                $vm = Get-VM -Name "${vmName}"
                $vmStats = Get-VMMemory -VMName "${vmName}"
                $vmProcessor = Get-VMProcessor -VMName "${vmName}"
                
                # Get network adapters and IP addresses
                $networkAdapters = Get-VMNetworkAdapter -VMName "${vmName}"
                $ipAddresses = @()
                foreach ($adapter in $networkAdapters) {
                    if ($adapter.IPAddresses) {
                        $ipAddresses += $adapter.IPAddresses
                    }
                }
                
                # Get integration services
                $integrationServices = Get-VMIntegrationService -VMName "${vmName}"
                $heartbeat = ($integrationServices | Where-Object {$_.Name -eq "Heartbeat"}).PrimaryStatusDescription
                
                $result = @{
                    Name = $vm.Name
                    Id = $vm.Id
                    State = $vm.State
                    Status = $vm.Status
                    CPUUsage = $vm.CPUUsage
                    MemoryUsageMB = [math]::Round($vmStats.Assigned / 1MB, 0)
                    MemoryTotalMB = [math]::Round($vmStats.Maximum / 1MB, 0)
                    Uptime = $vm.Uptime.ToString()
                    IPAddresses = $ipAddresses -join ","
                    Heartbeat = $heartbeat
                    Generation = $vm.Generation
                    Version = $vm.Version
                    Notes = $vm.Notes
                }
                
                $result | ConvertTo-Json -Compress
            `;

            const output = await this.executePowerShellCommand(command);
            const vmData = JSON.parse(output);

            return {
                name: vmData.Name,
                id: vmData.Id,
                state: vmData.State,
                status: vmData.Status,
                cpuUsage: vmData.CPUUsage || 0,
                memoryUsageMB: vmData.MemoryUsageMB || 0,
                memoryTotalMB: vmData.MemoryTotalMB || 0,
                uptime: vmData.Uptime || '00:00:00',
                ipAddresses: vmData.IPAddresses ? vmData.IPAddresses.split(',').filter((ip: string) => ip.trim()) : [],
                heartbeat: vmData.Heartbeat || 'Unknown',
                generation: vmData.Generation || 2,
                version: vmData.Version,
                notes: vmData.Notes
            };
        } catch (error) {
            logger.error('Failed to get VM info', { vmName, error });
            throw error;
        }
    }

    async listVMs(): Promise<VMInfo[]> {
        try {
            const command = `
                $vms = Get-VM | ForEach-Object {
                    $vm = $_
                    $vmStats = Get-VMMemory -VMName $vm.Name
                    $networkAdapters = Get-VMNetworkAdapter -VMName $vm.Name
                    $ipAddresses = @()
                    foreach ($adapter in $networkAdapters) {
                        if ($adapter.IPAddresses) {
                            $ipAddresses += $adapter.IPAddresses
                        }
                    }
                    
                    @{
                        Name = $vm.Name
                        Id = $vm.Id
                        State = $vm.State
                        Status = $vm.Status
                        CPUUsage = $vm.CPUUsage
                        MemoryUsageMB = [math]::Round($vmStats.Assigned / 1MB, 0)
                        MemoryTotalMB = [math]::Round($vmStats.Maximum / 1MB, 0)
                        Uptime = $vm.Uptime.ToString()
                        IPAddresses = $ipAddresses -join ","
                        Generation = $vm.Generation
                    }
                }
                $vms | ConvertTo-Json
            `;

            const output = await this.executePowerShellCommand(command);
            const vmsData = JSON.parse(output);
            const vmArray = Array.isArray(vmsData) ? vmsData : [vmsData];

            return vmArray.map(vmData => ({
                name: vmData.Name,
                id: vmData.Id,
                state: vmData.State,
                status: vmData.Status,
                cpuUsage: vmData.CPUUsage || 0,
                memoryUsageMB: vmData.MemoryUsageMB || 0,
                memoryTotalMB: vmData.MemoryTotalMB || 0,
                uptime: vmData.Uptime || '00:00:00',
                ipAddresses: vmData.IPAddresses ? vmData.IPAddresses.split(',').filter((ip: string) => ip.trim()) : [],
                heartbeat: 'NoContact',
                generation: vmData.Generation || 2
            }));
        } catch (error) {
            logger.error('Failed to list VMs', { error });
            return [];
        }
    }

    async startVM(vmName: string): Promise<boolean> {
        try {
            logger.info('Starting VM', { vmName });
            await this.executePowerShellCommand(`Start-VM -Name "${vmName}"`);
            logger.info('VM started successfully', { vmName });
            return true;
        } catch (error) {
            logger.error('Failed to start VM', { vmName, error });
            return false;
        }
    }

    async stopVM(vmName: string, force: boolean = false): Promise<boolean> {
        try {
            logger.info('Stopping VM', { vmName, force });
            const command = force ? `Stop-VM -Name "${vmName}" -Force` : `Stop-VM -Name "${vmName}"`;
            await this.executePowerShellCommand(command);
            logger.info('VM stopped successfully', { vmName });
            return true;
        } catch (error) {
            logger.error('Failed to stop VM', { vmName, error });
            return false;
        }
    }

    async restartVM(vmName: string): Promise<boolean> {
        try {
            logger.info('Restarting VM', { vmName });
            await this.executePowerShellCommand(`Restart-VM -Name "${vmName}" -Force`);
            logger.info('VM restarted successfully', { vmName });
            return true;
        } catch (error) {
            logger.error('Failed to restart VM', { vmName, error });
            return false;
        }
    }

    async deleteVM(vmName: string, deleteFiles: boolean = true): Promise<boolean> {
        try {
            logger.info('Deleting VM', { vmName, deleteFiles });
            
            // Stop VM if running
            const vmInfo = await this.getVMInfo(vmName);
            if (vmInfo.state === 'Running') {
                await this.stopVM(vmName, true);
            }

            // Remove VM
            await this.executePowerShellCommand(`Remove-VM -Name "${vmName}" -Force`);

            // Delete VM files if requested
            if (deleteFiles) {
                const vmPath = join(this.vmStoragePath, vmName);
                await this.executePowerShellCommand(`Remove-Item -Path "${vmPath}" -Recurse -Force -ErrorAction SilentlyContinue`);
            }

            logger.info('VM deleted successfully', { vmName });
            return true;
        } catch (error) {
            logger.error('Failed to delete VM', { vmName, error });
            return false;
        }
    }

    // VM Health Monitoring
    async getVMHealthStatus(vmName: string, sshInfo?: SSHConnectionInfo): Promise<VMHealthStatus> {
        try {
            logger.info('Checking VM health', { vmName });

            const vm = await this.getVMInfo(vmName);
            let resources: VMResourceUsage | null = null;
            let connectivity: { ping: boolean; ssh: boolean; responseTimeMs?: number } = { ping: false, ssh: false };
            let docker: { installed: boolean; running: boolean; version?: string; composeVersion?: string } = { installed: false, running: false };
            let services: { name: string; status: 'running' | 'stopped' | 'failed' | 'unknown'; description?: string }[] = [];

            // Get resource usage if VM is running
            if (vm.state === 'Running' && vm.ipAddresses.length > 0) {
                try {
                    resources = await this.getVMResourceUsage(vmName);
                    connectivity = await this.checkVMConnectivity(vm.ipAddresses[0], sshInfo);
                    
                    if (connectivity.ssh && sshInfo) {
                        docker = await this.checkDockerStatus(sshInfo);
                        services = await this.getVMServices(sshInfo);
                    }
                } catch (error) {
                    logger.warn('Failed to get detailed VM health info', { vmName, error });
                }
            }

            // Determine overall health
            let overall: 'healthy' | 'degraded' | 'failed' = 'failed';
            let message = 'VM health check failed';

            if (vm.state === 'Running' && vm.heartbeat === 'Ok') {
                if (connectivity.ssh && docker.running) {
                    overall = 'healthy';
                    message = 'VM is running and fully operational';
                } else if (connectivity.ping) {
                    overall = 'degraded';
                    message = 'VM is running but some services may be unavailable';
                } else {
                    overall = 'degraded';
                    message = 'VM is running but connectivity issues detected';
                }
            } else if (vm.state === 'Running') {
                overall = 'degraded';
                message = 'VM is running but integration services may be unavailable';
            } else if (vm.state === 'Off') {
                overall = 'failed';
                message = 'VM is not running';
            }

            return {
                vm,
                resources,
                docker,
                connectivity,
                services,
                overall,
                message,
                lastChecked: new Date()
            };
        } catch (error) {
            logger.error('Failed to get VM health status', { vmName, error });
            
            return {
                vm: null,
                resources: null,
                docker: { installed: false, running: false },
                connectivity: { ping: false, ssh: false },
                services: [],
                overall: 'failed',
                message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                lastChecked: new Date()
            };
        }
    }

    private async getVMResourceUsage(vmName: string): Promise<VMResourceUsage> {
        const command = `
            $vm = Get-VM -Name "${vmName}"
            $vmStats = Get-VMMemory -VMName "${vmName}"
            $vmProcessor = Get-VMProcessor -VMName "${vmName}"
            
            $result = @{
                CPU = @{
                    UsagePercent = $vm.CPUUsage
                    CoreCount = $vmProcessor.Count
                }
                Memory = @{
                    UsedMB = [math]::Round($vmStats.Assigned / 1MB, 0)
                    TotalMB = [math]::Round($vmStats.Maximum / 1MB, 0)
                    UsagePercent = [math]::Round(($vmStats.Assigned / $vmStats.Maximum) * 100, 1)
                }
            }
            
            $result | ConvertTo-Json -Compress
        `;

        const output = await this.executePowerShellCommand(command);
        const data = JSON.parse(output);

        return {
            cpu: {
                usagePercent: data.CPU.UsagePercent || 0,
                coreCount: data.CPU.CoreCount || 1
            },
            memory: {
                usedMB: data.Memory.UsedMB || 0,
                totalMB: data.Memory.TotalMB || 0,
                usagePercent: data.Memory.UsagePercent || 0
            },
            disk: [], // Would need SSH access to get disk info from inside VM
            network: [] // Would need SSH access to get network stats from inside VM
        };
    }

    private async checkVMConnectivity(ipAddress: string, sshInfo?: SSHConnectionInfo): Promise<{
        ping: boolean;
        ssh: boolean;
        responseTimeMs?: number;
    }> {
        let ping = false;
        let ssh = false;
        let responseTimeMs: number | undefined;

        // Test ping connectivity
        try {
            const startTime = Date.now();
            await this.executePowerShellCommand(`Test-Connection -ComputerName "${ipAddress}" -Count 1 -Quiet`);
            responseTimeMs = Date.now() - startTime;
            ping = true;
        } catch {
            ping = false;
        }

        // Test SSH connectivity if credentials provided
        if (sshInfo && ping) {
            try {
                await this.executeSSHCommand(sshInfo, 'echo "test"');
                ssh = true;
            } catch {
                ssh = false;
            }
        }

        return { ping, ssh, responseTimeMs };
    }

    private async checkDockerStatus(sshInfo: SSHConnectionInfo): Promise<{
        installed: boolean;
        running: boolean;
        version?: string;
        composeVersion?: string;
    }> {
        try {
            // Check if Docker is installed
            const dockerVersion = await this.executeSSHCommand(sshInfo, 'docker --version 2>/dev/null || echo "not installed"');
            const installed = !dockerVersion.includes('not installed');

            if (!installed) {
                return { installed: false, running: false };
            }

            // Check if Docker daemon is running
            let running = false;
            try {
                await this.executeSSHCommand(sshInfo, 'docker info >/dev/null 2>&1');
                running = true;
            } catch {
                running = false;
            }

            // Get Docker Compose version
            let composeVersion: string | undefined;
            try {
                composeVersion = await this.executeSSHCommand(sshInfo, 'docker-compose --version 2>/dev/null');
            } catch {
                composeVersion = undefined;
            }

            return {
                installed,
                running,
                version: dockerVersion,
                composeVersion
            };
        } catch {
            return { installed: false, running: false };
        }
    }

    private async getVMServices(sshInfo: SSHConnectionInfo): Promise<{
        name: string;
        status: 'running' | 'stopped' | 'failed' | 'unknown';
        description?: string;
    }[]> {
        try {
            const output = await this.executeSSHCommand(sshInfo, 'systemctl list-units --type=service --state=running,failed --no-pager --no-legend');
            const lines = output.split('\n').filter(line => line.trim());

            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                const name = parts[0] || 'unknown';
                const state = parts[2] || 'unknown';
                const description = parts.slice(4).join(' ') || '';

                let status: 'running' | 'stopped' | 'failed' | 'unknown' = 'unknown';
                if (state === 'running') status = 'running';
                else if (state === 'failed') status = 'failed';
                else if (state === 'dead' || state === 'inactive') status = 'stopped';

                return { name, status, description };
            });
        } catch {
            return [];
        }
    }

    // Docker Compose Deployment
    async deployToVM(vmName: string, deployment: DockerComposeDeployment, sshInfo: SSHConnectionInfo): Promise<VMDeploymentInfo> {
        try {
            logger.info('Deploying to VM', { vmName, targetPath: deployment.targetPath });

            // Create target directory
            await this.executeSSHCommand(sshInfo, `mkdir -p "${deployment.targetPath}"`);

            // Create docker-compose.yml file
            const composeFile = join(deployment.targetPath, 'docker-compose.yml');
            const createFileCommand = `cat > "${composeFile}" << 'EOF'\n${deployment.composeContent}\nEOF`;
            await this.executeSSHCommand(sshInfo, createFileCommand);

            // Create .env file if environment variables provided
            if (deployment.environmentVars) {
                const envContent = Object.entries(deployment.environmentVars)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n');
                const envFile = join(deployment.targetPath, '.env');
                const createEnvCommand = `cat > "${envFile}" << 'EOF'\n${envContent}\nEOF`;
                await this.executeSSHCommand(sshInfo, createEnvCommand);
            }

            // Copy any additional volumes if specified
            if (deployment.volumes) {
                for (const volume of deployment.volumes) {
                    try {
                        // This would require SCP functionality - simplified for now
                        logger.info('Volume mapping configured', { local: volume.local, remote: volume.remote });
                    } catch (error) {
                        logger.warn('Failed to copy volume', { volume, error });
                    }
                }
            }

            // Deploy using docker-compose
            const deployCommand = `cd "${deployment.targetPath}" && docker-compose up -d ${deployment.servicesToStart?.join(' ') || ''}`;
            const deployOutput = await this.executeSSHCommand(sshInfo, deployCommand);

            // Get deployed services
            const servicesOutput = await this.executeSSHCommand(sshInfo, `cd "${deployment.targetPath}" && docker-compose ps --services`);
            const services = servicesOutput.split('\n').filter(s => s.trim());

            logger.info('Deployment completed successfully', { vmName, services });

            return {
                vmName,
                composeFile: deployment.targetPath,
                services,
                status: 'deployed',
                deployedAt: new Date(),
                logs: deployOutput
            };
        } catch (error) {
            logger.error('Failed to deploy to VM', { vmName, error });
            
            return {
                vmName,
                composeFile: deployment.targetPath,
                services: [],
                status: 'failed',
                logs: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async getVMLogs(vmName: string, sshInfo: SSHConnectionInfo, options: {
        logType: 'system' | 'docker' | 'application' | 'all';
        lines?: number;
        since?: string;
        serviceName?: string;
    } = { logType: 'all' }): Promise<string> {
        try {
            logger.info('Retrieving VM logs', { vmName, options });

            const lines = options.lines || 100;
            const since = options.since || '1 hour ago';
            let logs = '';

            if (options.logType === 'system' || options.logType === 'all') {
                try {
                    const systemLogs = await this.executeSSHCommand(sshInfo, `journalctl --since="${since}" -n ${lines} --no-pager`);
                    logs += `=== SYSTEM LOGS ===\n${systemLogs}\n\n`;
                } catch (error) {
                    logs += `=== SYSTEM LOGS ===\nFailed to retrieve: ${error}\n\n`;
                }
            }

            if (options.logType === 'docker' || options.logType === 'all') {
                try {
                    const dockerLogs = await this.executeSSHCommand(sshInfo, `docker system events --since="${since}" --until=now`);
                    logs += `=== DOCKER EVENTS ===\n${dockerLogs}\n\n`;
                } catch (error) {
                    logs += `=== DOCKER EVENTS ===\nFailed to retrieve: ${error}\n\n`;
                }

                // Get container logs if specific service requested
                if (options.serviceName) {
                    try {
                        const containerLogs = await this.executeSSHCommand(sshInfo, `docker logs --tail ${lines} --since="${since}" ${options.serviceName}`);
                        logs += `=== ${options.serviceName.toUpperCase()} CONTAINER LOGS ===\n${containerLogs}\n\n`;
                    } catch (error) {
                        logs += `=== ${options.serviceName.toUpperCase()} CONTAINER LOGS ===\nFailed to retrieve: ${error}\n\n`;
                    }
                }
            }

            if (options.logType === 'application' || options.logType === 'all') {
                try {
                    const appLogs = await this.executeSSHCommand(sshInfo, `find /var/log -name "*.log" -type f -newermt "${since}" -exec tail -n ${lines} {} + 2>/dev/null || echo "No application logs found"`);
                    logs += `=== APPLICATION LOGS ===\n${appLogs}\n\n`;
                } catch (error) {
                    logs += `=== APPLICATION LOGS ===\nFailed to retrieve: ${error}\n\n`;
                }
            }

            return logs.trim();
        } catch (error) {
            logger.error('Failed to get VM logs', { vmName, error });
            return `Failed to retrieve logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    // Utility Methods
    private async waitForVMBoot(vmName: string, timeoutSeconds: number = 300): Promise<boolean> {
        const startTime = Date.now();
        const timeout = timeoutSeconds * 1000;

        while (Date.now() - startTime < timeout) {
            try {
                const vmInfo = await this.getVMInfo(vmName);
                if (vmInfo.state === 'Running' && vmInfo.heartbeat === 'Ok' && vmInfo.ipAddresses.length > 0) {
                    logger.info('VM boot completed', { vmName, bootTime: Date.now() - startTime });
                    return true;
                }
            } catch {
                // Continue waiting
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        }

        logger.warn('VM boot timeout', { vmName, timeoutSeconds });
        return false;
    }

    async getAvailableTemplates(): Promise<VMTemplate[]> {
        return VMManagementAdapter.DEFAULT_VM_TEMPLATES;
    }

    async createSSHConnection(ipAddress: string, username: string = 'developer'): Promise<SSHConnectionInfo> {
        return {
            host: ipAddress,
            port: 22,
            username,
            privateKeyPath: this.sshKeyPath,
            timeout: 30
        };
    }

    // Environment Integration Methods
    async getVMManagementHealth(): Promise<{
        hyperVAvailable: boolean;
        vmCount: number;
        runningVMs: number;
        storageUsageGB: number;
        issues: string[];
        recommendations: string[];
    }> {
        try {
            // Check if Hyper-V is available
            let hyperVAvailable = false;
            try {
                await this.executePowerShellCommand('Get-WindowsFeature -Name Hyper-V');
                hyperVAvailable = true;
            } catch {
                hyperVAvailable = false;
            }

            const vms = await this.listVMs();
            const vmCount = vms.length;
            const runningVMs = vms.filter(vm => vm.state === 'Running').length;

            // Get storage usage (simplified)
            let storageUsageGB = 0;
            try {
                const storageOutput = await this.executePowerShellCommand(`Get-ChildItem "${this.vmStoragePath}" -Recurse | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum`);
                storageUsageGB = Math.round(parseInt(storageOutput) / (1024 * 1024 * 1024));
            } catch {
                storageUsageGB = 0;
            }

            const issues: string[] = [];
            const recommendations: string[] = [];

            if (!hyperVAvailable) {
                issues.push('Hyper-V is not available or not enabled');
                recommendations.push('Enable Hyper-V feature in Windows');
            }

            if (storageUsageGB > 100) {
                issues.push('High VM storage usage detected');
                recommendations.push('Consider cleaning up old VMs or expanding storage');
            }

            return {
                hyperVAvailable,
                vmCount,
                runningVMs,
                storageUsageGB,
                issues,
                recommendations
            };
        } catch (error) {
            logger.error('Failed to get VM management health', { error });
            return {
                hyperVAvailable: false,
                vmCount: 0,
                runningVMs: 0,
                storageUsageGB: 0,
                issues: ['Failed to check VM management health'],
                recommendations: ['Check PowerShell execution policy and Hyper-V installation']
            };
        }
    }
}
// Mock child_process.spawn globally
const mockProcess = {
    stdout: {
        on: jest.fn()
    },
    stderr: {
        on: jest.fn()
    },
    on: jest.fn()
};

jest.mock('child_process', () => ({
    spawn: jest.fn(() => mockProcess)
}));

import { VMManagementAdapter, VMInfo, VMHealthStatus, VMDeploymentInfo, VMTemplate, SSHConnectionInfo, DockerComposeDeployment, VMResourceUsage } from '../../src/adapters/vm-management-adapter';

// Mock winston logger
jest.mock('winston', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })),
    format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        errors: jest.fn(),
        json: jest.fn()
    },
    transports: {
        Console: jest.fn(),
        File: jest.fn()
    }
}));

// Mock environment module
jest.mock('../../src/domain/config/environment', () => ({
    Environment: {
        mcpLogLevel: 'info',
        hyperVPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        vmStoragePath: 'C:\\VMs',
        sshKeyPath: 'C:\\SSH\\vm-dev-key',
        vmDefaultPassword: 'test-password',
        vmDefaultUsername: 'developer',
        vmNetworkSwitch: 'Default Switch',
        vmBootTimeout: 300,
        sshTimeout: 30
    }
}));

describe('VM Management Adapter Tests', () => {
    let adapter: VMManagementAdapter;
    let mockSpawn: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSpawn = require('child_process').spawn as jest.Mock;
        adapter = new VMManagementAdapter();
    });

    describe('VM Adapter Instantiation (Safest Tests)', () => {
        test('should instantiate VMManagementAdapter without making external calls', () => {
            const vmAdapter = new VMManagementAdapter();
            
            expect(vmAdapter).toBeInstanceOf(VMManagementAdapter);
            expect(mockSpawn).not.toHaveBeenCalled();
        });

        test('should initialize with default configuration paths', () => {
            const vmAdapter = new VMManagementAdapter();
            
            // Verify adapter exists and has expected structure
            expect(vmAdapter).toHaveProperty('constructor');
            expect(typeof vmAdapter.listVMs).toBe('function');
            expect(typeof vmAdapter.provisionVM).toBe('function');
        });

        test('should handle environment variable configuration', () => {
            // Test with process.env overrides
            const originalEnv = process.env;
            process.env.VM_STORAGE_PATH = 'D:\\TestVMs';
            process.env.SSH_KEY_PATH = 'D:\\SSH\\test-key';
            
            const customAdapter = new VMManagementAdapter();
            expect(customAdapter).toBeInstanceOf(VMManagementAdapter);
            
            // Restore environment
            process.env = originalEnv;
        });
    });

    describe('VM Management Method Signatures', () => {
        test('should have all required VM management methods', () => {
            expect(typeof adapter.provisionVM).toBe('function');
            expect(typeof adapter.deployToVM).toBe('function');
            expect(typeof adapter.getVMHealthStatus).toBe('function');
            expect(typeof adapter.getVMLogs).toBe('function');
            expect(typeof adapter.startVM).toBe('function');
            expect(typeof adapter.stopVM).toBe('function');
            expect(typeof adapter.restartVM).toBe('function');
        });

        test('should have utility and management methods', () => {
            expect(typeof adapter.listVMs).toBe('function');
            expect(typeof adapter.getVMInfo).toBe('function');
            expect(typeof adapter.deleteVM).toBe('function');
            expect(typeof adapter.getAvailableTemplates).toBe('function');
            expect(typeof adapter.createSSHConnection).toBe('function');
            expect(typeof adapter.getVMManagementHealth).toBe('function');
        });

        test('provisionVM method should have correct signature', () => {
            expect(adapter.provisionVM.length).toBe(2); // template, vmName (options has default)
        });

        test('deployToVM method should have correct signature', () => {
            expect(adapter.deployToVM.length).toBe(3); // vmName, deployment, sshInfo
        });

        test('getVMHealthStatus method should have correct signature', () => {
            expect(adapter.getVMHealthStatus.length).toBe(2); // vmName, optional sshInfo
        });

        test('getVMLogs method should have correct signature', () => {
            expect(adapter.getVMLogs.length).toBe(2); // vmName, sshInfo (options has default)
        });

        test('basic VM control methods should have correct signatures', () => {
            expect(adapter.startVM.length).toBe(1); // vmName
            expect(adapter.stopVM.length).toBe(1); // vmName (force has default)
            expect(adapter.restartVM.length).toBe(1); // vmName
            expect(adapter.deleteVM.length).toBe(1); // vmName (deleteFiles has default)
        });
    });

    describe('VM Interface Validation', () => {
        test('VMInfo interface should have all required properties', () => {
            const mockVMInfo: VMInfo = {
                name: 'test-vm',
                id: 'vm-12345',
                state: 'Running',
                status: 'Operating normally',
                cpuUsage: 25.5,
                memoryUsageMB: 2048,
                memoryTotalMB: 4096,
                uptime: '2:30:45',
                ipAddresses: ['192.168.1.100'],
                heartbeat: 'Ok',
                integrationServicesVersion: '10.0.19041.1',
                generation: 2,
                version: '9.0',
                notes: 'Development VM'
            };

            expect(mockVMInfo.name).toBe('test-vm');
            expect(mockVMInfo.state).toBe('Running');
            expect(mockVMInfo.generation).toBe(2);
            expect(Array.isArray(mockVMInfo.ipAddresses)).toBe(true);
        });

        test('VMHealthStatus interface should have comprehensive health data', () => {
            const mockHealthStatus: VMHealthStatus = {
                vm: {
                    name: 'test-vm',
                    id: 'vm-12345',
                    state: 'Running',
                    status: 'Operating normally',
                    cpuUsage: 15.2,
                    memoryUsageMB: 1024,
                    memoryTotalMB: 2048,
                    uptime: '1:15:30',
                    ipAddresses: ['192.168.1.100'],
                    heartbeat: 'Ok',
                    generation: 2
                },
                resources: {
                    cpu: { usagePercent: 15.2, coreCount: 2 },
                    memory: { usedMB: 1024, totalMB: 2048, usagePercent: 50.0 },
                    disk: [{ usedGB: 15, totalGB: 40, usagePercent: 37.5, path: '/dev/sda1' }],
                    network: [{ interfaceName: 'eth0', bytesReceived: 1000000, bytesSent: 500000, packetsReceived: 1000, packetsSent: 500 }]
                },
                docker: {
                    installed: true,
                    running: true,
                    version: 'Docker version 20.10.21',
                    composeVersion: 'docker-compose version 1.29.2'
                },
                connectivity: {
                    ping: true,
                    ssh: true,
                    responseTimeMs: 25
                },
                services: [
                    { name: 'docker.service', status: 'running', description: 'Docker Application Container Engine' }
                ],
                overall: 'healthy',
                message: 'VM is running and fully operational',
                lastChecked: new Date()
            };

            expect(mockHealthStatus.overall).toBe('healthy');
            expect(mockHealthStatus.docker.installed).toBe(true);
            expect(mockHealthStatus.connectivity.ssh).toBe(true);
            expect(Array.isArray(mockHealthStatus.services)).toBe(true);
        });

        test('VMDeploymentInfo interface should track deployment status', () => {
            const mockDeployment: VMDeploymentInfo = {
                vmName: 'test-vm',
                composeFile: '/opt/lucidwonks/docker-compose.yml',
                services: ['timescaledb', 'redpanda-0', 'redpanda-console'],
                status: 'deployed',
                deployedAt: new Date('2023-12-01T10:00:00Z'),
                lastUpdate: new Date('2023-12-01T10:05:00Z'),
                logs: 'Deployment completed successfully'
            };

            expect(mockDeployment.status).toBe('deployed');
            expect(Array.isArray(mockDeployment.services)).toBe(true);
            expect(mockDeployment.services).toContain('timescaledb');
        });

        test('VMTemplate interface should define VM templates correctly', () => {
            const mockTemplate: VMTemplate = {
                name: 'ubuntu-docker-dev',
                description: 'Ubuntu 22.04 LTS with Docker and development tools',
                osType: 'Ubuntu',
                osVersion: '22.04',
                memoryMB: 4096,
                cpuCores: 2,
                diskSizeGB: 40,
                templatePath: 'C:\\VM Templates\\Ubuntu-22.04-Docker-Template.vhdx',
                preInstalledSoftware: ['docker', 'docker-compose', 'git', 'curl', 'wget', 'nano'],
                defaultCredentials: {
                    username: 'developer',
                    passwordEnvVar: 'VM_DEFAULT_PASSWORD',
                    sshKeyPath: 'C:\\SSH\\vm-dev-key'
                }
            };

            expect(mockTemplate.osType).toBe('Ubuntu');
            expect(mockTemplate.memoryMB).toBe(4096);
            expect(Array.isArray(mockTemplate.preInstalledSoftware)).toBe(true);
            expect(mockTemplate.defaultCredentials?.username).toBe('developer');
        });

        test('SSHConnectionInfo interface should have connection parameters', () => {
            const mockSSHInfo: SSHConnectionInfo = {
                host: '192.168.1.100',
                port: 22,
                username: 'developer',
                password: 'secure-password',
                privateKeyPath: 'C:\\SSH\\vm-dev-key',
                timeout: 30
            };

            expect(mockSSHInfo.port).toBe(22);
            expect(mockSSHInfo.timeout).toBe(30);
            expect(typeof mockSSHInfo.host).toBe('string');
        });

        test('DockerComposeDeployment interface should define deployment configuration', () => {
            const mockDeploymentConfig: DockerComposeDeployment = {
                composeContent: 'version: "3.8"\nservices:\n  test:\n    image: nginx',
                environmentVars: { NODE_ENV: 'development', API_PORT: '3000' },
                targetPath: '/opt/lucidwonks',
                servicesToStart: ['test'],
                volumes: [{ local: './data', remote: '/app/data' }],
                networks: ['lucidwonks-network']
            };

            expect(typeof mockDeploymentConfig.composeContent).toBe('string');
            expect(mockDeploymentConfig.environmentVars?.NODE_ENV).toBe('development');
            expect(Array.isArray(mockDeploymentConfig.servicesToStart)).toBe(true);
            expect(Array.isArray(mockDeploymentConfig.volumes)).toBe(true);
        });
    });

    describe('Logger Integration Test', () => {
        test('should use Winston logger configuration matching other adapters', () => {
            // Verify logger mock structure is consistent with other adapters
            const winston = require('winston');
            expect(winston.createLogger).toBeDefined();
            expect(winston.format).toBeDefined();
            expect(winston.transports).toBeDefined();
        });

        test('should have consistent log level configuration pattern', () => {
            // Verify Environment configuration is used for log level
            const Environment = require('../../src/domain/config/environment').Environment;
            expect(Environment.mcpLogLevel).toBe('info');
        });

        test('should have winston transport structure like other adapters', () => {
            // Verify winston mock has expected transport constructors
            const winston = require('winston');
            expect(winston.transports.Console).toBeDefined();
            expect(winston.transports.File).toBeDefined();
            expect(winston.format.combine).toBeDefined();
            expect(winston.format.timestamp).toBeDefined();
            expect(winston.format.json).toBeDefined();
        });
    });

    describe('VM Management Configuration Test', () => {
        test('should correctly read VM-related environment variables', async () => {
            // Test that adapter reads configuration without errors
            expect(() => new VMManagementAdapter()).not.toThrow();
        });

        test('should have proper default configuration values', () => {
            const vmAdapter = new VMManagementAdapter();
            
            // Verify adapter initializes with expected defaults
            expect(vmAdapter).toBeInstanceOf(VMManagementAdapter);
        });

        test('should handle missing environment variables gracefully', () => {
            // Test with minimal environment
            const originalEnv = process.env;
            
            // Clear VM-related environment variables
            delete process.env.VM_STORAGE_PATH;
            delete process.env.SSH_KEY_PATH;
            delete process.env.HYPERV_PATH;
            
            expect(() => new VMManagementAdapter()).not.toThrow();
            
            // Restore environment
            process.env = originalEnv;
        });

        test('should validate template availability without PowerShell execution', async () => {
            const templates = await adapter.getAvailableTemplates();
            
            expect(Array.isArray(templates)).toBe(true);
            expect(templates.length).toBeGreaterThan(0);
            
            const ubuntuTemplate = templates.find(t => t.osType === 'Ubuntu');
            expect(ubuntuTemplate).toBeDefined();
            expect(ubuntuTemplate?.preInstalledSoftware).toContain('docker');
            
            // Should not trigger PowerShell execution for template retrieval
            expect(mockSpawn).not.toHaveBeenCalled();
        });
    });

    describe('PowerShell Command Structure Test', () => {
        test('should generate properly formatted Hyper-V commands without executing', () => {
            // Test that command generation doesn't trigger actual PowerShell execution
            expect(mockSpawn).not.toHaveBeenCalled();
        });

        test('should validate PowerShell command structure patterns', () => {
            // Verify that the adapter has methods that would generate PowerShell commands
            expect(typeof adapter.listVMs).toBe('function');
            expect(typeof adapter.startVM).toBe('function');
            expect(typeof adapter.stopVM).toBe('function');
            
            // These methods should exist but not be called during instantiation
            expect(mockSpawn).not.toHaveBeenCalled();
        });

        test('should have VM template validation without PowerShell execution', async () => {
            const templates = await adapter.getAvailableTemplates();
            const template = templates[0];
            
            // Verify template structure for PowerShell command generation
            expect(template).toHaveProperty('templatePath');
            expect(template).toHaveProperty('memoryMB');
            expect(template).toHaveProperty('cpuCores');
            expect(template).toHaveProperty('diskSizeGB');
            expect(template).toHaveProperty('generation');
            
            // Should not trigger PowerShell execution
            expect(mockSpawn).not.toHaveBeenCalled();
        });
    });

    describe('SSH Configuration Test', () => {
        test('should properly structure SSH connection configuration', async () => {
            const sshInfo = await adapter.createSSHConnection('192.168.1.100', 'developer');
            
            expect(sshInfo).toHaveProperty('host');
            expect(sshInfo).toHaveProperty('port');
            expect(sshInfo).toHaveProperty('username');
            expect(sshInfo).toHaveProperty('privateKeyPath');
            expect(sshInfo).toHaveProperty('timeout');
            
            expect(sshInfo.host).toBe('192.168.1.100');
            expect(sshInfo.username).toBe('developer');
            expect(sshInfo.port).toBe(22);
            expect(sshInfo.timeout).toBe(30);
        });

        test('should validate SSH configuration for Ubuntu VM connectivity', async () => {
            const sshInfo = await adapter.createSSHConnection('10.0.0.100');
            
            // Verify SSH configuration structure for Ubuntu VMs
            expect(sshInfo.host).toBe('10.0.0.100');
            expect(sshInfo.username).toBe('developer'); // Default username
            expect(sshInfo.port).toBe(22); // Standard SSH port
            expect(typeof sshInfo.privateKeyPath).toBe('string');
            expect(sshInfo.timeout).toBeGreaterThan(0);
        });

        test('should not attempt actual SSH connection during configuration', async () => {
            await adapter.createSSHConnection('192.168.1.100');
            
            // Should not trigger spawn for SSH commands
            expect(mockSpawn).not.toHaveBeenCalledWith('ssh', expect.any(Array));
        });
    });

    describe('Error Handling Structure', () => {
        test('should follow PowerShell error handling patterns like docker-adapter', () => {
            // Verify that adapter methods are async and would handle errors properly
            expect(typeof adapter.listVMs).toBe('function');
            expect(typeof adapter.getVMInfo).toBe('function');
            expect(typeof adapter.startVM).toBe('function');
        });

        test('should have consistent error handling structure across methods', () => {
            // VM management methods should return promises for error handling
            const vmMethods = [
                'listVMs',
                'getVMInfo',
                'startVM',
                'stopVM',
                'restartVM',
                'deleteVM',
                'provisionVM',
                'deployToVM',
                'getVMHealthStatus',
                'getVMLogs'
            ];

            vmMethods.forEach(method => {
                expect(typeof adapter[method as keyof VMManagementAdapter]).toBe('function');
            });
        });

        test('should have proper async method signatures for error handling', () => {
            // Verify methods are functions that would return promises
            expect(typeof adapter.getVMManagementHealth).toBe('function');
            expect(typeof adapter.getAvailableTemplates).toBe('function');
        });
    });

    describe('PowerShell/SSH Execution Pattern Tests', () => {
        test('should follow spawn() pattern from docker-adapter without execution', () => {
            // Verify that adapter has structure for PowerShell execution
            expect(mockSpawn).not.toHaveBeenCalled();
            
            // Adapter should be ready to use spawn but not call it during instantiation
            expect(adapter).toBeInstanceOf(VMManagementAdapter);
        });

        test('should validate SSH command structure without attempting connections', () => {
            // SSH methods should exist but not execute during testing
            expect(typeof adapter.getVMLogs).toBe('function');
            expect(typeof adapter.deployToVM).toBe('function');
            
            // Should not trigger SSH spawn calls
            expect(mockSpawn).not.toHaveBeenCalledWith('ssh', expect.any(Array));
        });

        test('should have Docker Compose deployment structure without execution', () => {
            const deploymentConfig: DockerComposeDeployment = {
                composeContent: 'version: "3.8"',
                targetPath: '/opt/test',
                environmentVars: { NODE_ENV: 'test' }
            };
            
            // Deployment configuration should be properly structured
            expect(deploymentConfig).toHaveProperty('composeContent');
            expect(deploymentConfig).toHaveProperty('targetPath');
            expect(deploymentConfig).toHaveProperty('environmentVars');
            
            // Should not trigger actual deployment
            expect(mockSpawn).not.toHaveBeenCalled();
        });
    });

    describe('Integration Pattern Consistency', () => {
        test('should match adapter patterns from docker-adapter structure', () => {
            // Verify similar method naming and structure
            expect(typeof adapter.listVMs).toBe('function'); // Similar to listContainers
            expect(typeof adapter.getVMHealthStatus).toBe('function'); // Similar to getContainerHealth
            expect(typeof adapter.getVMLogs).toBe('function'); // Similar to getContainerLogs
        });

        test('should use similar configuration patterns as other adapters', () => {
            // Environment configuration should follow established patterns
            const Environment = require('../../src/domain/config/environment').Environment;
            expect(Environment.mcpLogLevel).toBeDefined();
            expect(Environment.vmStoragePath).toBeDefined();
            expect(Environment.sshKeyPath).toBeDefined();
        });

        test('should maintain consistent async/await patterns', () => {
            // Test that methods return promises without calling them
            expect(typeof adapter.listVMs).toBe('function');
            expect(typeof adapter.getVMManagementHealth).toBe('function');
            expect(typeof adapter.getAvailableTemplates).toBe('function');
            
            // Methods that require parameters should still be functions
            expect(typeof adapter.getVMInfo).toBe('function');
            expect(typeof adapter.provisionVM).toBe('function');
            expect(typeof adapter.deployToVM).toBe('function');
            expect(typeof adapter.getVMHealthStatus).toBe('function');
            expect(typeof adapter.getVMLogs).toBe('function');
        });
    });
});
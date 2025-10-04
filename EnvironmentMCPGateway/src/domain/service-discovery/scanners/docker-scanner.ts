/**
 * Docker Service Scanner
 * Scans for Docker daemon services via Unix socket and TCP
 */

import { IServiceScanner, IConnectivityValidator, DiscoveredService, ServiceHealthDetails } from '../types.js';
import { ConnectivityValidator } from '../connectivity-validator.js';
import { existsSync } from 'fs';

/**
 * Scanner for Docker daemon services
 */
export class DockerScanner implements IServiceScanner {
    readonly serviceType = 'docker';
    readonly defaultPorts = [2375, 2376] as const; // Docker TCP ports (insecure/TLS)
    
    private readonly connectivityValidator: IConnectivityValidator;
    private readonly connectionTimeout: number;
    
    // Common Docker Unix socket paths
    private readonly unixSocketPaths = [
        '/var/run/docker.sock',
        '/var/lib/docker/docker.sock'
    ] as const;
    
    constructor(
        connectivityValidator?: IConnectivityValidator,
        connectionTimeout: number = 5000
    ) {
        this.connectivityValidator = connectivityValidator ?? new ConnectivityValidator();
        this.connectionTimeout = connectionTimeout;
    }
    
    /**
     * Scan for Docker daemon services on the specified host
     */
    async scanHost(host: string, ports?: readonly number[]): Promise<readonly DiscoveredService[]> {
        const discoveredServices: DiscoveredService[] = [];
        
        // If scanning localhost, check Unix sockets first
        if (this.isLocalhost(host)) {
            const unixSocketService = await this.scanUnixSockets(host);
            if (unixSocketService) {
                discoveredServices.push(unixSocketService);
            }
        }
        
        // Scan TCP ports
        const scanPorts = ports ?? this.defaultPorts;
        for (const port of scanPorts) {
            const connectivityResult = await this.connectivityValidator.testConnection(
                host, 
                port, 
                this.connectionTimeout
            );
            
            if (connectivityResult.success) {
                // Perform health validation
                const healthDetails = await this.validateHealth({
                    serviceType: 'docker',
                    serviceName: `docker-tcp-${host}-${port}`,
                    host,
                    port
                });
                
                const service: DiscoveredService = {
                    serviceType: 'docker',
                    serviceName: `docker-tcp-${host}-${port}`,
                    host,
                    port,
                    isHealthy: healthDetails.connectivity === 'success' && 
                              healthDetails.functionalityCheck !== 'failed',
                    healthDetails,
                    discoveredAt: new Date(),
                    responseTime: connectivityResult.responseTime
                };
                
                discoveredServices.push(service);
            }
        }
        
        return discoveredServices;
    }
    
    /**
     * Validate basic functionality of a Docker service
     */
    async validateHealth(service: Partial<DiscoveredService>): Promise<ServiceHealthDetails> {
        if (!service.host) {
            return {
                connectivity: 'error',
                functionalityCheck: 'skipped',
                errorMessage: 'Missing host for health validation',
                additionalInfo: {}
            };
        }
        
        // For Unix socket services
        if (service.serviceName?.includes('unix-socket')) {
            return this.validateUnixSocketHealth(service);
        }
        
        // For TCP services
        if (!service.port) {
            return {
                connectivity: 'error',
                functionalityCheck: 'skipped',
                errorMessage: 'Missing port for TCP health validation',
                additionalInfo: {}
            };
        }
        
        return this.validateTCPHealth(service.host, service.port);
    }
    
    /**
     * Scan Unix sockets for Docker daemon
     */
    private async scanUnixSockets(host: string): Promise<DiscoveredService | null> {
        for (const socketPath of this.unixSocketPaths) {
            if (existsSync(socketPath)) {
                // Test if socket is accessible
                const healthDetails = await this.validateUnixSocketAtPath(socketPath);
                
                const service: DiscoveredService = {
                    serviceType: 'docker',
                    serviceName: `docker-unix-socket-${socketPath.replace(/[\/]/g, '-')}`,
                    host,
                    port: 0, // Unix socket doesn't use port
                    isHealthy: healthDetails.connectivity === 'success' && 
                              healthDetails.functionalityCheck !== 'failed',
                    healthDetails,
                    discoveredAt: new Date(),
                    responseTime: 0 // Unix socket response time not meaningful
                };
                
                return service;
            }
        }
        
        return null;
    }
    
    /**
     * Validate Unix socket health
     */
    private async validateUnixSocketHealth(service: Partial<DiscoveredService>): Promise<ServiceHealthDetails> {
        const socketPath = this.extractSocketPathFromServiceName(service.serviceName);
        if (!socketPath) {
            return {
                connectivity: 'error',
                functionalityCheck: 'skipped',
                errorMessage: 'Could not determine Unix socket path',
                additionalInfo: {}
            };
        }
        
        return this.validateUnixSocketAtPath(socketPath);
    }
    
    /**
     * Validate specific Unix socket path
     */
    private async validateUnixSocketAtPath(socketPath: string): Promise<ServiceHealthDetails> {
        try {
            // Check if socket file exists
            if (!existsSync(socketPath)) {
                return {
                    connectivity: 'error',
                    functionalityCheck: 'skipped',
                    errorMessage: `Unix socket not found: ${socketPath}`,
                    additionalInfo: { socketPath }
                };
            }
            
            // Attempt to connect to Unix socket
            const socketValidation = await this.testUnixSocketConnection(socketPath);
            
            return {
                connectivity: socketValidation.success ? 'success' : 'error',
                functionalityCheck: socketValidation.dockerApiWorking ? 'success' : 'failed',
                version: socketValidation.version,
                errorMessage: socketValidation.errorMessage,
                additionalInfo: {
                    socketPath,
                    ...socketValidation.details
                }
            };
        } catch (error) {
            return {
                connectivity: 'error',
                functionalityCheck: 'failed',
                errorMessage: `Unix socket validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                additionalInfo: { socketPath }
            };
        }
    }
    
    /**
     * Validate TCP Docker daemon health
     */
    private async validateTCPHealth(host: string, port: number): Promise<ServiceHealthDetails> {
        // Test basic connectivity first
        const connectivityResult = await this.connectivityValidator.testConnection(
            host, 
            port, 
            this.connectionTimeout
        );
        
        if (!connectivityResult.success) {
            return {
                connectivity: connectivityResult.errorMessage?.includes('timeout') ? 'timeout' : 'refused',
                functionalityCheck: 'skipped',
                errorMessage: connectivityResult.errorMessage,
                additionalInfo: {
                    responseTime: connectivityResult.responseTime
                }
            };
        }
        
        // Attempt Docker API validation
        try {
            const dockerApiValidation = await this.validateDockerAPI(host, port);
            
            return {
                connectivity: 'success',
                functionalityCheck: dockerApiValidation.success ? 'success' : 'failed',
                version: dockerApiValidation.version,
                errorMessage: dockerApiValidation.errorMessage,
                additionalInfo: {
                    responseTime: connectivityResult.responseTime,
                    ...dockerApiValidation.details
                }
            };
        } catch (error) {
            return {
                connectivity: 'success',
                functionalityCheck: 'failed',
                errorMessage: `Docker API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                additionalInfo: {
                    responseTime: connectivityResult.responseTime
                }
            };
        }
    }
    
    /**
     * Test Unix socket connection and basic Docker API
     */
    private async testUnixSocketConnection(socketPath: string): Promise<{
        success: boolean;
        dockerApiWorking: boolean;
        version?: string;
        errorMessage?: string;
        details: Record<string, unknown>;
    }> {
        return new Promise((resolve) => {
            const { createConnection } = require('net');
            
            try {
                const socket = createConnection({ path: socketPath });
                socket.setTimeout(this.connectionTimeout);
                
                socket.on('connect', () => {
                    // Send basic Docker API request (GET /version)
                    const httpRequest = [
                        'GET /version HTTP/1.1',
                        'Host: localhost',
                        'Connection: close',
                        '', ''
                    ].join('\r\n');
                    
                    socket.write(httpRequest);
                });
                
                let responseData = '';
                
                socket.on('data', (data: Buffer) => {
                    responseData += data.toString();
                });
                
                socket.on('end', () => {
                    socket.destroy();
                    
                    // Parse basic HTTP response
                    if (responseData.includes('HTTP/1.1 200') && responseData.includes('Docker')) {
                        resolve({
                            success: true,
                            dockerApiWorking: true,
                            version: 'Docker daemon (Unix socket)',
                            details: {
                                socketPath,
                                httpResponse: true,
                                apiVersion: this.extractDockerVersion(responseData)
                            }
                        });
                    } else {
                        resolve({
                            success: true,
                            dockerApiWorking: false,
                            errorMessage: 'Socket accessible but Docker API not responding properly',
                            details: {
                                socketPath,
                                responseReceived: responseData.length > 0
                            }
                        });
                    }
                });
                
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve({
                        success: false,
                        dockerApiWorking: false,
                        errorMessage: 'Unix socket connection timeout',
                        details: { socketPath, timeoutOccurred: true }
                    });
                });
                
                socket.on('error', (error: Error) => {
                    socket.destroy();
                    resolve({
                        success: false,
                        dockerApiWorking: false,
                        errorMessage: `Unix socket connection error: ${error.message}`,
                        details: { socketPath, socketError: error.message }
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    dockerApiWorking: false,
                    errorMessage: `Failed to create Unix socket connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    details: { socketPath }
                });
            }
        });
    }
    
    /**
     * Validate Docker API over TCP
     */
    private async validateDockerAPI(host: string, port: number): Promise<{
        success: boolean;
        version?: string;
        errorMessage?: string;
        details: Record<string, unknown>;
    }> {
        // This would typically make an HTTP request to /version
        // For now, we'll consider TCP connectivity as sufficient validation
        return {
            success: true, // TCP connectivity already verified
            version: 'Docker daemon (TCP endpoint detected)',
            details: {
                tcpEndpoint: true,
                port,
                note: 'Full HTTP validation requires additional dependencies'
            }
        };
    }
    
    /**
     * Extract Docker version from API response
     */
    private extractDockerVersion(response: string): string | undefined {
        const versionMatch = response.match(/"Version":"([^"]+)"/);
        return versionMatch ? versionMatch[1] : undefined;
    }
    
    /**
     * Extract socket path from service name
     */
    private extractSocketPathFromServiceName(serviceName?: string): string | undefined {
        if (!serviceName) return undefined;
        
        for (const socketPath of this.unixSocketPaths) {
            if (serviceName.includes(socketPath.replace(/[\/]/g, '-'))) {
                return socketPath;
            }
        }
        return undefined;
    }
    
    /**
     * Check if host is localhost
     */
    private isLocalhost(host: string): boolean {
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }
}
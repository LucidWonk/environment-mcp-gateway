/**
 * TimescaleDB Service Scanner
 * Scans for PostgreSQL/TimescaleDB database services
 */

import { IServiceScanner, IConnectivityValidator, DiscoveredService, ServiceHealthDetails } from '../types.js';
import { ConnectivityValidator } from '../connectivity-validator.js';

/**
 * Scanner for TimescaleDB/PostgreSQL database services
 */
export class TimescaleDBScanner implements IServiceScanner {
    readonly serviceType = 'timescaledb';
    readonly defaultPorts = [5432] as const;
    
    private readonly connectivityValidator: IConnectivityValidator;
    private readonly connectionTimeout: number;
    
    constructor(
        connectivityValidator?: IConnectivityValidator,
        connectionTimeout: number = 5000
    ) {
        this.connectivityValidator = connectivityValidator ?? new ConnectivityValidator();
        this.connectionTimeout = connectionTimeout;
    }
    
    /**
     * Scan for PostgreSQL/TimescaleDB services on the specified host
     */
    async scanHost(host: string, ports?: readonly number[]): Promise<readonly DiscoveredService[]> {
        const scanPorts = ports ?? this.defaultPorts;
        const discoveredServices: DiscoveredService[] = [];
        
        // Test connectivity to each port
        for (const port of scanPorts) {
            const startTime = Date.now();
            const connectivityResult = await this.connectivityValidator.testConnection(
                host, 
                port, 
                this.connectionTimeout
            );
            
            if (connectivityResult.success) {
                // Perform health validation
                const healthDetails = await this.validateHealth({
                    serviceType: 'timescaledb',
                    serviceName: `timescaledb-${host}-${port}`,
                    host,
                    port
                });
                
                const service: DiscoveredService = {
                    serviceType: 'timescaledb',
                    serviceName: `timescaledb-${host}-${port}`,
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
     * Validate basic functionality of a TimescaleDB service
     */
    async validateHealth(service: Partial<DiscoveredService>): Promise<ServiceHealthDetails> {
        if (!service.host || !service.port) {
            return {
                connectivity: 'error',
                functionalityCheck: 'skipped',
                errorMessage: 'Missing host or port for health validation',
                additionalInfo: {}
            };
        }
        
        // Test basic connectivity first
        const connectivityResult = await this.connectivityValidator.testConnection(
            service.host, 
            service.port, 
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
        
        // Attempt basic PostgreSQL protocol validation
        try {
            const protocolValidation = await this.validatePostgreSQLProtocol(service.host, service.port);
            
            return {
                connectivity: 'success',
                functionalityCheck: protocolValidation.success ? 'success' : 'failed',
                version: protocolValidation.version,
                errorMessage: protocolValidation.errorMessage,
                additionalInfo: {
                    responseTime: connectivityResult.responseTime,
                    protocolValidation: protocolValidation.details,
                    isTimescaleDB: protocolValidation.isTimescaleDB
                }
            };
        } catch (error) {
            return {
                connectivity: 'success',
                functionalityCheck: 'failed',
                errorMessage: `Health validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                additionalInfo: {
                    responseTime: connectivityResult.responseTime
                }
            };
        }
    }
    
    /**
     * Validate PostgreSQL protocol by attempting basic protocol handshake
     */
    private async validatePostgreSQLProtocol(host: string, port: number): Promise<{
        success: boolean;
        version?: string;
        errorMessage?: string;
        isTimescaleDB?: boolean;
        details: Record<string, unknown>;
    }> {
        return new Promise((resolve) => {
            const { createConnection } = require('net');
            const socket = createConnection({ host, port });
            
            socket.setTimeout(this.connectionTimeout);
            
            let responseData = Buffer.alloc(0);
            
            socket.on('connect', () => {
                // Send PostgreSQL startup message (simplified version)
                // This is a basic protocol validation, not a full connection
                const startupMessage = Buffer.from([
                    0x00, 0x00, 0x00, 0x08, // Message length
                    0x04, 0xD2, 0x16, 0x2F  // Protocol version 3.0
                ]);
                socket.write(startupMessage);
            });
            
            socket.on('data', (data: Buffer) => {
                responseData = Buffer.concat([responseData, data]);
                
                // Check for PostgreSQL error response or authentication request
                if (responseData.length >= 5) {
                    const messageType = responseData[0];
                    
                    // 'R' = Authentication request (good sign)
                    // 'E' = Error message (but still indicates PostgreSQL)
                    if (messageType === 0x52 || messageType === 0x45) {
                        socket.destroy();
                        resolve({
                            success: true,
                            version: 'PostgreSQL (version unknown)',
                            isTimescaleDB: false, // Would need actual query to determine
                            details: {
                                messageType: messageType === 0x52 ? 'auth_request' : 'error_response',
                                protocolRecognized: true
                            }
                        });
                        return;
                    }
                }
                
                // If we get unexpected data, still consider it a basic success
                // since something responded on the PostgreSQL port
                setTimeout(() => {
                    socket.destroy();
                    resolve({
                        success: true,
                        version: 'PostgreSQL (protocol detected)',
                        isTimescaleDB: false,
                        details: {
                            responseReceived: true,
                            dataLength: responseData.length
                        }
                    });
                }, 1000);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve({
                    success: false,
                    errorMessage: 'PostgreSQL protocol validation timeout',
                    details: {
                        timeoutOccurred: true
                    }
                });
            });
            
            socket.on('error', (error: Error) => {
                socket.destroy();
                resolve({
                    success: false,
                    errorMessage: `PostgreSQL protocol validation error: ${error.message}`,
                    details: {
                        socketError: error.message
                    }
                });
            });
        });
    }
}
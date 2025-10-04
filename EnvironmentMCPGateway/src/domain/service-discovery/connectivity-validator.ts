/**
 * Connectivity Validator
 * Handles network connectivity validation with timeout management
 */

import { createConnection, Socket } from 'net';
import { IConnectivityValidator, ConnectivityResult } from './types.js';

/**
 * Implementation of connectivity validation using TCP sockets
 */
export class ConnectivityValidator implements IConnectivityValidator {
    
    /**
     * Test basic TCP connectivity to a host:port with timeout
     */
    async testConnection(host: string, port: number, timeout: number): Promise<ConnectivityResult> {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const socket = new Socket();
            
            // Set timeout
            socket.setTimeout(timeout);
            
            socket.on('connect', () => {
                const responseTime = Date.now() - startTime;
                socket.destroy();
                resolve({
                    success: true,
                    responseTime
                });
            });
            
            socket.on('timeout', () => {
                const responseTime = Date.now() - startTime;
                socket.destroy();
                resolve({
                    success: false,
                    responseTime,
                    errorMessage: `Connection timeout after ${timeout}ms`
                });
            });
            
            socket.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                socket.destroy();
                resolve({
                    success: false,
                    responseTime,
                    errorMessage: `Connection error: ${error.message}`
                });
            });
            
            // Attempt connection
            try {
                socket.connect(port, host);
            } catch (error) {
                const responseTime = Date.now() - startTime;
                resolve({
                    success: false,
                    responseTime,
                    errorMessage: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        });
    }
    
    /**
     * Test connectivity to multiple ports in parallel
     */
    async testMultiplePorts(host: string, ports: readonly number[], timeout: number): Promise<Map<number, ConnectivityResult>> {
        const results = new Map<number, ConnectivityResult>();
        
        // Test all ports in parallel
        const testPromises = ports.map(async (port) => {
            const result = await this.testConnection(host, port, timeout);
            results.set(port, result);
        });
        
        await Promise.all(testPromises);
        return results;
    }
    
    /**
     * Find first available port from a list of candidates
     */
    async findAvailablePort(host: string, ports: readonly number[], timeout: number): Promise<{ port: number; result: ConnectivityResult } | null> {
        for (const port of ports) {
            const result = await this.testConnection(host, port, timeout);
            if (result.success) {
                return { port, result };
            }
        }
        return null;
    }
}
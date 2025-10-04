/**
 * Service Scanner Factory
 * Creates appropriate service scanners based on service type
 */

import { IServiceScanner } from './types.js';
import { TimescaleDBScanner } from './scanners/timescaledb-scanner.js';
import { RedPandaScanner } from './scanners/redpanda-scanner.js';
import { DockerScanner } from './scanners/docker-scanner.js';

/**
 * Factory for creating protocol-specific service scanners
 */
export class ServiceScannerFactory {
    private readonly scanners = new Map<string, IServiceScanner>();
    
    constructor() {
        this.initializeDefaultScanners();
    }
    
    /**
     * Get scanner for a specific service type
     */
    getScanner(serviceType: string): IServiceScanner | null {
        return this.scanners.get(serviceType) || null;
    }
    
    /**
     * Get all available scanners
     */
    getAllScanners(): readonly IServiceScanner[] {
        return Array.from(this.scanners.values());
    }
    
    /**
     * Get all supported service types
     */
    getSupportedServiceTypes(): readonly string[] {
        return Array.from(this.scanners.keys());
    }
    
    /**
     * Register a custom scanner
     */
    registerScanner(serviceType: string, scanner: IServiceScanner): void {
        this.scanners.set(serviceType, scanner);
    }
    
    /**
     * Unregister a scanner
     */
    unregisterScanner(serviceType: string): boolean {
        return this.scanners.delete(serviceType);
    }
    
    /**
     * Check if a service type is supported
     */
    isServiceTypeSupported(serviceType: string): boolean {
        return this.scanners.has(serviceType);
    }
    
    /**
     * Get scanner by port (best guess based on default ports)
     */
    getScannerByPort(port: number): IServiceScanner[] {
        const matchingScanners: IServiceScanner[] = [];
        
        for (const scanner of this.scanners.values()) {
            if (scanner.defaultPorts.includes(port)) {
                matchingScanners.push(scanner);
            }
        }
        
        return matchingScanners;
    }
    
    /**
     * Initialize default service scanners
     */
    private initializeDefaultScanners(): void {
        // TimescaleDB/PostgreSQL scanner
        this.scanners.set('timescaledb', new TimescaleDBScanner());
        this.scanners.set('postgresql', new TimescaleDBScanner()); // Alias
        
        // RedPanda/Kafka scanner
        this.scanners.set('redpanda', new RedPandaScanner());
        this.scanners.set('kafka', new RedPandaScanner()); // Alias
        
        // Docker scanner
        this.scanners.set('docker', new DockerScanner());
        this.scanners.set('container', new DockerScanner()); // Alias
    }
    
    /**
     * Create scanner factory with custom configuration
     */
    static createWithConfiguration(config: {
        connectionTimeout?: number;
        enableTimescaleDB?: boolean;
        enableRedPanda?: boolean;
        enableDocker?: boolean;
    }): ServiceScannerFactory {
        const factory = new ServiceScannerFactory();
        
        // Clear default scanners if needed
        if (!config.enableTimescaleDB) {
            factory.unregisterScanner('timescaledb');
            factory.unregisterScanner('postgresql');
        }
        
        if (!config.enableRedPanda) {
            factory.unregisterScanner('redpanda');
            factory.unregisterScanner('kafka');
        }
        
        if (!config.enableDocker) {
            factory.unregisterScanner('docker');
            factory.unregisterScanner('container');
        }
        
        // Apply custom timeout if specified
        if (config.connectionTimeout) {
            // Re-register scanners with custom timeout
            if (config.enableTimescaleDB !== false) {
                factory.registerScanner('timescaledb', new TimescaleDBScanner(undefined, config.connectionTimeout));
                factory.registerScanner('postgresql', new TimescaleDBScanner(undefined, config.connectionTimeout));
            }
            
            if (config.enableRedPanda !== false) {
                factory.registerScanner('redpanda', new RedPandaScanner(undefined, config.connectionTimeout));
                factory.registerScanner('kafka', new RedPandaScanner(undefined, config.connectionTimeout));
            }
            
            if (config.enableDocker !== false) {
                factory.registerScanner('docker', new DockerScanner(undefined, config.connectionTimeout));
                factory.registerScanner('container', new DockerScanner(undefined, config.connectionTimeout));
            }
        }
        
        return factory;
    }
}
/**
 * Service Discovery Engine
 * Main orchestrator for automated service discovery across environments
 */

import { EventEmitter } from 'events';
import { 
    ServiceDiscoveryResult, 
    DiscoveredService, 
    ServiceDiscoveryConfig, 
    DEFAULT_SERVICE_DISCOVERY_CONFIG,
    ServiceDiscoveryEvents 
} from './types.js';
import { ServiceScannerFactory } from './service-scanner-factory.js';
import { ServiceDiscoveryCache } from './service-discovery-cache.js';
import { ServerDefinition, EnvironmentConfiguration } from '../environment-registry/types.js';

/**
 * Main service discovery engine coordinating service detection across environments
 */
export class ServiceDiscoveryEngine extends EventEmitter {
    private readonly scannerFactory: ServiceScannerFactory;
    private readonly cache: ServiceDiscoveryCache;
    private readonly config: ServiceDiscoveryConfig;
    
    constructor(
        config: Partial<ServiceDiscoveryConfig> = {},
        scannerFactory?: ServiceScannerFactory
    ) {
        super();
        
        this.config = { ...DEFAULT_SERVICE_DISCOVERY_CONFIG, ...config };
        this.scannerFactory = scannerFactory ?? new ServiceScannerFactory();
        this.cache = new ServiceDiscoveryCache(this.config.cacheTimeout);
        
        // Set up event handling
        this.setupEventHandlers();
    }
    
    /**
     * Discover services in a specific environment
     */
    async discoverEnvironmentServices(
        environmentConfig: EnvironmentConfiguration, 
        useCache: boolean = true
    ): Promise<ServiceDiscoveryResult> {
        const startTime = Date.now();
        
        // Check cache first if enabled
        if (useCache && this.config.enableCaching) {
            const cachedResult = this.cache.get(environmentConfig.environmentId);
            if (cachedResult) {
                this.emit('discovery-completed', {
                    environmentId: environmentConfig.environmentId,
                    result: cachedResult
                } as ServiceDiscoveryEvents['discovery-completed']);
                
                return cachedResult;
            }
        }
        
        try {
            // Discover services across all servers in the environment
            const allDiscoveredServices: DiscoveredService[] = [];
            const errors: string[] = [];
            
            for (const server of environmentConfig.servers) {
                try {
                    const serverServices = await this.discoverServerServices(server);
                    allDiscoveredServices.push(...serverServices);
                } catch (error) {
                    const errorMessage = `Server ${server.id} (${server.host}): ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMessage);
                }
            }
            
            const result: ServiceDiscoveryResult = {
                environmentId: environmentConfig.environmentId,
                discoveredAt: new Date(),
                services: allDiscoveredServices,
                errors,
                totalScanDuration: Date.now() - startTime
            };
            
            // Cache the result if caching is enabled
            if (this.config.enableCaching) {
                this.cache.set(environmentConfig.environmentId, result);
            }
            
            // Emit events
            if (allDiscoveredServices.length > 0) {
                this.emit('service-discovered', {
                    environmentId: environmentConfig.environmentId,
                    services: allDiscoveredServices
                } as ServiceDiscoveryEvents['service-discovered']);
            }
            
            this.emit('discovery-completed', {
                environmentId: environmentConfig.environmentId,
                result
            } as ServiceDiscoveryEvents['discovery-completed']);
            
            return result;
            
        } catch (error) {
            const errorMessage = `Environment discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            this.emit('discovery-failed', {
                environmentId: environmentConfig.environmentId,
                error: errorMessage
            } as ServiceDiscoveryEvents['discovery-failed']);
            
            throw new Error(errorMessage);
        }
    }
    
    /**
     * Discover services on a specific server
     */
    async discoverServerServices(server: ServerDefinition): Promise<DiscoveredService[]> {
        const discoveredServices: DiscoveredService[] = [];
        
        // Try all available scanners on this server
        for (const scanner of this.scannerFactory.getAllScanners()) {
            try {
                const services = await scanner.scanHost(server.host);
                discoveredServices.push(...services);
            } catch (error) {
                // Log scanner error but don't fail the entire discovery
                console.warn(`Scanner ${scanner.serviceType} failed for ${server.host}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        return discoveredServices;
    }
    
    /**
     * Discover specific service types in an environment
     */
    async discoverServicesByType(
        environmentConfig: EnvironmentConfiguration,
        serviceTypes: readonly string[],
        useCache: boolean = true
    ): Promise<ServiceDiscoveryResult> {
        const startTime = Date.now();
        const allDiscoveredServices: DiscoveredService[] = [];
        const errors: string[] = [];
        
        try {
            for (const server of environmentConfig.servers) {
                for (const serviceType of serviceTypes) {
                    const scanner = this.scannerFactory.getScanner(serviceType);
                    if (!scanner) {
                        errors.push(`No scanner available for service type: ${serviceType}`);
                        continue;
                    }
                    
                    try {
                        const services = await scanner.scanHost(server.host);
                        // Filter to only include services of the requested type
                        const filteredServices = services.filter(s => s.serviceType === serviceType);
                        allDiscoveredServices.push(...filteredServices);
                    } catch (error) {
                        const errorMessage = `Service type ${serviceType} discovery failed on ${server.host}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        errors.push(errorMessage);
                    }
                }
            }
            
            const result: ServiceDiscoveryResult = {
                environmentId: environmentConfig.environmentId,
                discoveredAt: new Date(),
                services: allDiscoveredServices,
                errors,
                totalScanDuration: Date.now() - startTime
            };
            
            // Emit events
            if (allDiscoveredServices.length > 0) {
                this.emit('service-discovered', {
                    environmentId: environmentConfig.environmentId,
                    services: allDiscoveredServices
                } as ServiceDiscoveryEvents['service-discovered']);
            }
            
            this.emit('discovery-completed', {
                environmentId: environmentConfig.environmentId,
                result
            } as ServiceDiscoveryEvents['discovery-completed']);
            
            return result;
            
        } catch (error) {
            const errorMessage = `Service type discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            this.emit('discovery-failed', {
                environmentId: environmentConfig.environmentId,
                error: errorMessage
            } as ServiceDiscoveryEvents['discovery-failed']);
            
            throw new Error(errorMessage);
        }
    }
    
    /**
     * Refresh cache for a specific environment
     */
    async refreshEnvironmentCache(environmentConfig: EnvironmentConfiguration): Promise<ServiceDiscoveryResult> {
        // Force cache refresh by bypassing cache check
        return this.discoverEnvironmentServices(environmentConfig, false);
    }
    
    /**
     * Get supported service types
     */
    getSupportedServiceTypes(): readonly string[] {
        return this.scannerFactory.getSupportedServiceTypes();
    }
    
    /**
     * Validate discovered service health
     */
    async validateServiceHealth(service: DiscoveredService): Promise<DiscoveredService> {
        const scanner = this.scannerFactory.getScanner(service.serviceType);
        if (!scanner) {
            return {
                ...service,
                isHealthy: false,
                healthDetails: {
                    connectivity: 'error',
                    functionalityCheck: 'failed',
                    errorMessage: `No scanner available for service type: ${service.serviceType}`,
                    additionalInfo: {}
                }
            };
        }
        
        try {
            const healthDetails = await scanner.validateHealth(service);
            return {
                ...service,
                isHealthy: healthDetails.connectivity === 'success' && 
                          healthDetails.functionalityCheck !== 'failed',
                healthDetails
            };
        } catch (error) {
            return {
                ...service,
                isHealthy: false,
                healthDetails: {
                    connectivity: 'error',
                    functionalityCheck: 'failed',
                    errorMessage: `Health validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    additionalInfo: {}
                }
            };
        }
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalEntries: number;
        expiredEntries: number;
        validEntries: number;
        oldestEntry?: Date;
        newestEntry?: Date;
    } {
        return this.cache.getStats();
    }
    
    /**
     * Clear discovery cache
     */
    clearCache(): void {
        this.cache.clear();
    }
    
    /**
     * Get cached result for environment
     */
    getCachedResult(environmentId: string): ServiceDiscoveryResult | null {
        return this.cache.get(environmentId);
    }
    
    /**
     * Setup event handlers for service health monitoring
     */
    private setupEventHandlers(): void {
        // Listen for service health changes to emit appropriate events
        this.on('service-discovered', (event: ServiceDiscoveryEvents['service-discovered']) => {
            // Could implement additional logic here for health change detection
        });
    }
    
    /**
     * Cleanup resources
     */
    dispose(): void {
        this.cache.dispose();
        this.removeAllListeners();
    }
}

// Type-safe event emitter interface
export interface ServiceDiscoveryEngine {
    emit<K extends keyof ServiceDiscoveryEvents>(
        event: K,
        data: ServiceDiscoveryEvents[K]
    ): boolean;
    
    on<K extends keyof ServiceDiscoveryEvents>(
        event: K,
        listener: (data: ServiceDiscoveryEvents[K]) => void
    ): this;
    
    once<K extends keyof ServiceDiscoveryEvents>(
        event: K,
        listener: (data: ServiceDiscoveryEvents[K]) => void
    ): this;
}
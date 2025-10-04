/**
 * Service Discovery Domain Types
 * Core types and interfaces for automated service discovery and validation
 */

import { ServiceEndpoint } from '../environment-registry/types.js';

/**
 * Result of service discovery operation
 */
export interface ServiceDiscoveryResult {
    readonly environmentId: string;
    readonly discoveredAt: Date;
    readonly services: readonly DiscoveredService[];
    readonly errors: readonly string[];
    readonly totalScanDuration: number;
}

/**
 * Represents a discovered service with health validation
 */
export interface DiscoveredService {
    readonly serviceType: 'timescaledb' | 'redpanda' | 'docker' | 'unknown';
    readonly serviceName: string;
    readonly host: string;
    readonly port: number;
    readonly isHealthy: boolean;
    readonly healthDetails: ServiceHealthDetails;
    readonly discoveredAt: Date;
    readonly responseTime: number;
}

/**
 * Health validation details for a discovered service
 */
export interface ServiceHealthDetails {
    readonly connectivity: 'success' | 'timeout' | 'refused' | 'error';
    readonly functionalityCheck: 'success' | 'failed' | 'skipped';
    readonly version?: string;
    readonly errorMessage?: string;
    readonly additionalInfo: Record<string, unknown>;
}

/**
 * Configuration for service discovery operations
 */
export interface ServiceDiscoveryConfig {
    readonly connectionTimeout: number; // milliseconds
    readonly readTimeout: number; // milliseconds 
    readonly totalTimeout: number; // milliseconds
    readonly retryAttempts: number;
    readonly cacheTimeout: number; // milliseconds for TTL
    readonly enableCaching: boolean;
}

/**
 * Cache entry for discovery results
 */
export interface ServiceDiscoveryCacheEntry {
    readonly result: ServiceDiscoveryResult;
    readonly cachedAt: Date;
    readonly expiresAt: Date;
}

/**
 * Interface for protocol-specific service scanners
 */
export interface IServiceScanner {
    readonly serviceType: string;
    readonly defaultPorts: readonly number[];
    
    /**
     * Scan for services of this type on the specified host
     */
    scanHost(host: string, ports?: readonly number[]): Promise<readonly DiscoveredService[]>;
    
    /**
     * Validate basic functionality of a discovered service
     */
    validateHealth(service: Partial<DiscoveredService>): Promise<ServiceHealthDetails>;
}

/**
 * Interface for connectivity validation
 */
export interface IConnectivityValidator {
    /**
     * Test basic TCP connectivity to a host:port
     */
    testConnection(host: string, port: number, timeout: number): Promise<ConnectivityResult>;
}

/**
 * Result of connectivity validation
 */
export interface ConnectivityResult {
    readonly success: boolean;
    readonly responseTime: number;
    readonly errorMessage?: string;
}

/**
 * Events published by service discovery
 */
export interface ServiceDiscoveryEvents {
    'service-discovered': {
        environmentId: string;
        services: readonly DiscoveredService[];
    };
    'service-health-changed': {
        environmentId: string;
        serviceName: string;
        previousHealth: boolean;
        currentHealth: boolean;
    };
    'discovery-completed': {
        environmentId: string;
        result: ServiceDiscoveryResult;
    };
    'discovery-failed': {
        environmentId: string;
        error: string;
    };
}

/**
 * Default configuration for service discovery
 */
export const DEFAULT_SERVICE_DISCOVERY_CONFIG: ServiceDiscoveryConfig = {
    connectionTimeout: 5000, // 5 seconds
    readTimeout: 10000, // 10 seconds
    totalTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    cacheTimeout: 300000, // 5 minutes
    enableCaching: true
};
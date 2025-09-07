/**
 * Environment Registry Domain Types
 * Core types and interfaces for multi-environment registry architecture
 */

/**
 * Represents a server definition with connection and resource information
 */
export interface ServerDefinition {
    readonly id: string;
    readonly host: string;
    readonly port?: number;
    readonly protocol: 'http' | 'https' | 'ssh' | 'tcp';
    readonly description: string;
    readonly credentials?: {
        readonly username?: string;
        readonly password?: string;
        readonly keyPath?: string;
    };
    readonly tags: readonly string[];
    readonly metadata: Record<string, unknown>;
}

/**
 * Service endpoint configuration for specific services in an environment
 */
export interface ServiceEndpoint {
    readonly serviceName: string;
    readonly serviceType: 'database' | 'messaging' | 'container' | 'api' | 'other';
    readonly host: string;
    readonly port: number;
    readonly protocol: string;
    readonly connectionString?: string;
    readonly healthCheckPath?: string;
    readonly authentication?: {
        readonly username?: string;
        readonly password?: string;
        readonly token?: string;
        readonly database?: string;
    };
    readonly configuration: Record<string, unknown>;
}

/**
 * Environment configuration containing all service endpoints and settings
 */
export interface EnvironmentConfiguration {
    readonly environmentId: string;
    readonly environmentName: string;
    readonly environmentType: 'development' | 'qa' | 'staging' | 'production' | 'test';
    readonly applicationId: string;
    readonly servers: readonly ServerDefinition[];
    readonly services: readonly ServiceEndpoint[];
    readonly variables: Record<string, string>;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly version: number;
}

/**
 * Application registry entry containing hierarchical environment relationships
 */
export interface ApplicationRegistryEntry {
    readonly applicationId: string;
    readonly applicationName: string;
    readonly description: string;
    readonly environments: Record<string, EnvironmentConfiguration>;
    readonly defaultEnvironment?: string;
    readonly tags: readonly string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * Environment health status information
 */
export interface EnvironmentHealthStatus {
    readonly environmentId: string;
    readonly applicationId: string;
    readonly overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    readonly serviceStatuses: Record<string, {
        readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
        readonly lastCheck: Date;
        readonly responseTime?: number;
        readonly error?: string;
        readonly details?: Record<string, unknown>;
    }>;
    readonly lastUpdated: Date;
    readonly checkDuration: number;
}

/**
 * Registry operation result
 */
export interface RegistryOperationResult<T = void> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: string;
    readonly validation?: {
        readonly isValid: boolean;
        readonly errors: readonly string[];
        readonly warnings: readonly string[];
    };
}

/**
 * Registry query options
 */
export interface RegistryQueryOptions {
    readonly applicationId?: string;
    readonly environmentType?: EnvironmentConfiguration['environmentType'];
    readonly isActive?: boolean;
    readonly tags?: readonly string[];
    readonly includeInactive?: boolean;
    readonly sortBy?: 'name' | 'created' | 'updated';
    readonly sortOrder?: 'asc' | 'desc';
    readonly limit?: number;
    readonly offset?: number;
}

/**
 * Events published by the environment registry domain
 */
export interface EnvironmentRegistryEvents {
    readonly 'environment-registered': {
        readonly applicationId: string;
        readonly environmentId: string;
        readonly configuration: EnvironmentConfiguration;
        readonly timestamp: Date;
    };
    readonly 'environment-updated': {
        readonly applicationId: string;
        readonly environmentId: string;
        readonly previousConfiguration: EnvironmentConfiguration;
        readonly newConfiguration: EnvironmentConfiguration;
        readonly timestamp: Date;
    };
    readonly 'environment-health-changed': {
        readonly applicationId: string;
        readonly environmentId: string;
        readonly previousStatus: EnvironmentHealthStatus['overallStatus'];
        readonly newStatus: EnvironmentHealthStatus['overallStatus'];
        readonly healthStatus: EnvironmentHealthStatus;
        readonly timestamp: Date;
    };
    readonly 'application-registered': {
        readonly applicationId: string;
        readonly applicationName: string;
        readonly entry: ApplicationRegistryEntry;
        readonly timestamp: Date;
    };
}
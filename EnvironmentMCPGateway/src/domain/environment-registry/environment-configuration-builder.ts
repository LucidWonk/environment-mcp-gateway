/**
 * Environment Configuration Builder - Fluent API for building environment configurations
 * Provides type-safe, validated environment configuration construction
 */

import {
    EnvironmentConfiguration,
    ServerDefinition,
    ServiceEndpoint
} from './types.js';
import { EnvironmentValidator } from './environment-validator.js';

export class EnvironmentConfigurationBuilder {
    private config: {
        environmentId?: string;
        environmentName?: string;
        environmentType?: EnvironmentConfiguration['environmentType'];
        applicationId?: string;
        servers: ServerDefinition[];
        services: ServiceEndpoint[];
        variables: Record<string, string>;
        isActive: boolean;
    } = {
        servers: [],
        services: [],
        variables: {},
        isActive: true
    };

    private validator = new EnvironmentValidator();

    /**
     * Set basic environment information
     */
    setEnvironmentInfo(
        environmentId: string,
        environmentName: string,
        environmentType: EnvironmentConfiguration['environmentType'],
        applicationId: string
    ): this {
        this.config.environmentId = environmentId;
        this.config.environmentName = environmentName;
        this.config.environmentType = environmentType;
        this.config.applicationId = applicationId;
        return this;
    }

    /**
     * Add a server to the environment
     */
    addServer(serverDefinition: ServerDefinition): this {
        this.config.servers = [...this.config.servers, serverDefinition];
        return this;
    }

    /**
     * Add a service endpoint to the environment
     */
    addService(serviceEndpoint: ServiceEndpoint): this {
        this.config.services = [...this.config.services, serviceEndpoint];
        return this;
    }

    /**
     * Add multiple services at once
     */
    addServices(services: readonly ServiceEndpoint[]): this {
        services.forEach(service => this.addService(service));
        return this;
    }

    /**
     * Set environment variables
     */
    setVariables(variables: Record<string, string>): this {
        this.config.variables = { ...variables };
        return this;
    }

    /**
     * Add a single environment variable
     */
    addVariable(key: string, value: string): this {
        this.config.variables = { ...this.config.variables, [key]: value };
        return this;
    }

    /**
     * Set environment active status
     */
    setActive(isActive: boolean): this {
        this.config.isActive = isActive;
        return this;
    }

    /**
     * Helper method to add TimescaleDB service with common configuration
     */
    addTimescaleDB(
        host: string,
        port: number = 5432,
        database: string,
        username: string,
        password: string,
        options: {
            serviceName?: string;
            ssl?: boolean;
            connectionTimeout?: number;
        } = {}
    ): this {
        const serviceName = options.serviceName || 'timescaledb';
        const protocol = options.ssl ? 'postgresql+ssl' : 'postgresql';
        
        const service: ServiceEndpoint = {
            serviceName,
            serviceType: 'database',
            host,
            port,
            protocol,
            connectionString: `postgresql://${username}:${password}@${host}:${port}/${database}`,
            healthCheckPath: '/health',
            authentication: {
                username,
                password,
                database
            },
            configuration: {
                ssl: options.ssl || false,
                connectionTimeout: options.connectionTimeout || 30000,
                maxConnections: 10
            }
        };

        return this.addService(service);
    }

    /**
     * Helper method to add RedPanda service with common configuration
     */
    addRedPanda(
        host: string,
        kafkaPort: number = 9092,
        adminPort: number = 9644,
        schemaRegistryPort: number = 8081,
        options: {
            serviceName?: string;
            consumerGroupId?: string;
        } = {}
    ): this {
        const serviceName = options.serviceName || 'redpanda';

        const kafkaService: ServiceEndpoint = {
            serviceName: `${serviceName}-kafka`,
            serviceType: 'messaging',
            host,
            port: kafkaPort,
            protocol: 'kafka',
            healthCheckPath: '/health',
            configuration: {
                bootstrapServers: `${host}:${kafkaPort}`,
                consumerGroupId: options.consumerGroupId || 'mcp-gateway',
                autoOffsetReset: 'earliest'
            }
        };

        const schemaRegistryService: ServiceEndpoint = {
            serviceName: `${serviceName}-schema-registry`,
            serviceType: 'api',
            host,
            port: schemaRegistryPort,
            protocol: 'http',
            healthCheckPath: '/subjects',
            configuration: {
                url: `http://${host}:${schemaRegistryPort}`
            }
        };

        return this.addService(kafkaService).addService(schemaRegistryService);
    }

    /**
     * Helper method to add Docker service with common configuration
     */
    addDocker(
        host: string,
        port: number = 2376,
        options: {
            serviceName?: string;
            useTls?: boolean;
            socketPath?: string;
        } = {}
    ): this {
        const serviceName = options.serviceName || 'docker';
        const protocol = options.useTls ? 'https' : 'http';

        const service: ServiceEndpoint = {
            serviceName,
            serviceType: 'container',
            host,
            port,
            protocol,
            healthCheckPath: '/version',
            configuration: {
                socketPath: options.socketPath || '/var/run/docker.sock',
                tlsVerify: options.useTls || false,
                apiVersion: '1.41'
            }
        };

        return this.addService(service);
    }

    /**
     * Helper method to create a development environment template
     */
    static forDevelopment(
        applicationId: string,
        environmentId: string = 'development',
        environmentName: string = 'Development'
    ): EnvironmentConfigurationBuilder {
        return new EnvironmentConfigurationBuilder()
            .setEnvironmentInfo(environmentId, environmentName, 'development', applicationId)
            .addVariable('NODE_ENV', 'development')
            .addVariable('LOG_LEVEL', 'debug')
            .setActive(true);
    }

    /**
     * Helper method to create a production environment template
     */
    static forProduction(
        applicationId: string,
        environmentId: string = 'production',
        environmentName: string = 'Production'
    ): EnvironmentConfigurationBuilder {
        return new EnvironmentConfigurationBuilder()
            .setEnvironmentInfo(environmentId, environmentName, 'production', applicationId)
            .addVariable('NODE_ENV', 'production')
            .addVariable('LOG_LEVEL', 'warn')
            .setActive(true);
    }

    /**
     * Helper method to create a QA environment template
     */
    static forQA(
        applicationId: string,
        environmentId: string = 'qa',
        environmentName: string = 'Quality Assurance'
    ): EnvironmentConfigurationBuilder {
        return new EnvironmentConfigurationBuilder()
            .setEnvironmentInfo(environmentId, environmentName, 'qa', applicationId)
            .addVariable('NODE_ENV', 'qa')
            .addVariable('LOG_LEVEL', 'info')
            .setActive(true);
    }

    /**
     * Validate the current configuration
     */
    validate(): {
        readonly isValid: boolean;
        readonly errors: readonly string[];
        readonly warnings: readonly string[];
    } {
        if (!this.config.environmentId || !this.config.environmentName || 
            !this.config.environmentType || !this.config.applicationId) {
            return {
                isValid: false,
                errors: ['Missing required environment information (ID, name, type, or application ID)'],
                warnings: []
            };
        }

        return this.validator.validateEnvironmentConfiguration(
            this.config as Omit<EnvironmentConfiguration, 'createdAt' | 'updatedAt' | 'version'>
        );
    }

    /**
     * Build the final environment configuration
     */
    build(): Omit<EnvironmentConfiguration, 'createdAt' | 'updatedAt' | 'version'> {
        const validation = this.validate();
        
        if (!validation.isValid) {
            throw new Error(`Invalid environment configuration: ${validation.errors.join(', ')}`);
        }

        return {
            environmentId: this.config.environmentId!,
            environmentName: this.config.environmentName!,
            environmentType: this.config.environmentType!,
            applicationId: this.config.applicationId!,
            servers: this.config.servers || [],
            services: this.config.services || [],
            variables: this.config.variables || {},
            isActive: this.config.isActive !== undefined ? this.config.isActive : true
        };
    }

    /**
     * Get a copy of current configuration state
     */
    getConfig(): Readonly<{
        environmentId?: string;
        environmentName?: string;
        environmentType?: EnvironmentConfiguration['environmentType'];
        applicationId?: string;
        servers: readonly ServerDefinition[];
        services: readonly ServiceEndpoint[];
        variables: Readonly<Record<string, string>>;
        isActive: boolean;
    }> {
        return { ...this.config };
    }

    /**
     * Reset the builder to start fresh
     */
    reset(): this {
        this.config = {
            servers: [],
            services: [],
            variables: {},
            isActive: true
        };
        return this;
    }

    /**
     * Clone the current builder state
     */
    clone(): EnvironmentConfigurationBuilder {
        const cloned = new EnvironmentConfigurationBuilder();
        cloned.config = {
            ...this.config,
            servers: [...(this.config.servers || [])],
            services: [...(this.config.services || [])],
            variables: { ...(this.config.variables || {}) }
        };
        return cloned;
    }
}
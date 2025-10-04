/**
 * Environment Validator - Comprehensive validation engine for environment configurations
 * Ensures environment registry data integrity and compliance
 */

import {
    EnvironmentConfiguration,
    ServerDefinition,
    ServiceEndpoint,
    RegistryOperationResult
} from './types.js';

interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
}

export class EnvironmentValidator {
    private readonly requiredServiceTypes = ['database', 'messaging', 'container'] as const;
    private readonly validEnvironmentTypes = ['development', 'qa', 'staging', 'production', 'test'] as const;
    private readonly validProtocols = ['http', 'https', 'ssh', 'tcp', 'postgresql', 'kafka'] as const;

    /**
     * Validate application ID format and constraints
     */
    validateApplicationId(applicationId: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!applicationId || applicationId.trim().length === 0) {
            errors.push('Application ID cannot be empty');
        }

        if (applicationId.length < 3) {
            errors.push('Application ID must be at least 3 characters long');
        }

        if (applicationId.length > 50) {
            errors.push('Application ID cannot exceed 50 characters');
        }

        // Check for valid characters (alphanumeric, hyphens, underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(applicationId)) {
            errors.push('Application ID can only contain alphanumeric characters, hyphens, and underscores');
        }

        // Check for proper naming conventions
        if (applicationId.startsWith('-') || applicationId.endsWith('-') || applicationId.startsWith('_')) {
            warnings.push('Application ID should not start or end with special characters');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate complete environment configuration
     */
    validateEnvironmentConfiguration(config: Omit<EnvironmentConfiguration, 'createdAt' | 'updatedAt' | 'version'>): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate environment ID
        if (!config.environmentId || config.environmentId.trim().length === 0) {
            errors.push('Environment ID cannot be empty');
        }

        if (config.environmentId && !/^[a-zA-Z0-9_-]+$/.test(config.environmentId)) {
            errors.push('Environment ID can only contain alphanumeric characters, hyphens, and underscores');
        }

        // Validate environment name
        if (!config.environmentName || config.environmentName.trim().length === 0) {
            errors.push('Environment name cannot be empty');
        }

        // Validate environment type
        if (!this.validEnvironmentTypes.includes(config.environmentType)) {
            errors.push(`Invalid environment type. Must be one of: ${this.validEnvironmentTypes.join(', ')}`);
        }

        // Validate application ID reference
        if (!config.applicationId || config.applicationId.trim().length === 0) {
            errors.push('Application ID reference cannot be empty');
        }

        // Validate servers
        if (!config.servers || config.servers.length === 0) {
            warnings.push('Environment has no servers defined');
        } else {
            config.servers.forEach((server, index) => {
                const serverValidation = this.validateServerDefinition(server);
                errors.push(...serverValidation.errors.map(err => `Server ${index + 1}: ${err}`));
                warnings.push(...serverValidation.warnings.map(warn => `Server ${index + 1}: ${warn}`));
            });
        }

        // Validate services
        if (!config.services || config.services.length === 0) {
            warnings.push('Environment has no services defined');
        } else {
            config.services.forEach((service, index) => {
                const serviceValidation = this.validateServiceEndpoint(service);
                errors.push(...serviceValidation.errors.map(err => `Service ${index + 1}: ${err}`));
                warnings.push(...serviceValidation.warnings.map(warn => `Service ${index + 1}: ${warn}`));
            });

            // Check for recommended service types
            const serviceTypes = new Set(config.services.map(s => s.serviceType));
            this.requiredServiceTypes.forEach(requiredType => {
                if (!serviceTypes.has(requiredType)) {
                    warnings.push(`Recommended service type '${requiredType}' not found`);
                }
            });
        }

        // Validate environment variables
        if (config.variables) {
            Object.keys(config.variables).forEach(key => {
                if (!key.match(/^[A-Z_][A-Z0-9_]*$/)) {
                    warnings.push(`Environment variable '${key}' should follow UPPER_SNAKE_CASE convention`);
                }
            });
        }

        // Production environment specific validations
        if (config.environmentType === 'production') {
            if (!config.services.some(s => s.serviceType === 'database')) {
                errors.push('Production environments must have at least one database service');
            }

            config.services.forEach(service => {
                if (service.host === 'localhost' || service.host === '127.0.0.1') {
                    errors.push(`Production service '${service.serviceName}' cannot use localhost`);
                }

                if (!service.authentication) {
                    warnings.push(`Production service '${service.serviceName}' should have authentication configured`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate server definition
     */
    private validateServerDefinition(server: ServerDefinition): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!server.id || server.id.trim().length === 0) {
            errors.push('Server ID cannot be empty');
        }

        if (!server.host || server.host.trim().length === 0) {
            errors.push('Server host cannot be empty');
        }

        // Validate protocol
        if (!this.validProtocols.includes(server.protocol as any)) {
            errors.push(`Invalid protocol '${server.protocol}'. Must be one of: ${this.validProtocols.join(', ')}`);
        }

        // Validate port ranges
        if (server.port && (server.port < 1 || server.port > 65535)) {
            errors.push('Port must be between 1 and 65535');
        }

        // Validate host format
        if (server.host) {
            const isValidIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(server.host);
            const isValidHostname = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(server.host);
            
            if (!isValidIP && !isValidHostname && server.host !== 'localhost') {
                warnings.push(`Host '${server.host}' may not be a valid hostname or IP address`);
            }
        }

        // Validate credentials
        if (server.credentials) {
            if (server.credentials.password && server.credentials.keyPath) {
                warnings.push('Both password and key path specified - key path will take precedence');
            }

            if (!server.credentials.username && !server.credentials.keyPath) {
                warnings.push('Credentials specified but no username or key path provided');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate service endpoint configuration
     */
    private validateServiceEndpoint(service: ServiceEndpoint): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!service.serviceName || service.serviceName.trim().length === 0) {
            errors.push('Service name cannot be empty');
        }

        if (!service.host || service.host.trim().length === 0) {
            errors.push('Service host cannot be empty');
        }

        if (!service.port || service.port < 1 || service.port > 65535) {
            errors.push('Service port must be between 1 and 65535');
        }

        if (!service.protocol || service.protocol.trim().length === 0) {
            errors.push('Service protocol cannot be empty');
        }

        // Service type specific validations
        switch (service.serviceType) {
            case 'database':
                this.validateDatabaseService(service, errors, warnings);
                break;
            case 'messaging':
                this.validateMessagingService(service, errors, warnings);
                break;
            case 'container':
                this.validateContainerService(service, errors, warnings);
                break;
            case 'api':
                this.validateApiService(service, errors, warnings);
                break;
        }

        // Validate connection string format if provided
        if (service.connectionString) {
            if (service.serviceType === 'database' && !service.connectionString.includes('://')) {
                warnings.push('Database connection string should include protocol scheme');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    private validateDatabaseService(service: ServiceEndpoint, errors: string[], warnings: string[]): void {
        if (!service.authentication?.database) {
            warnings.push('Database service should specify target database name');
        }

        if (service.port) {
            const commonDbPorts = [5432, 3306, 1433, 1521, 27017];
            if (!commonDbPorts.includes(service.port)) {
                warnings.push(`Port ${service.port} is not a common database port`);
            }
        }
    }

    private validateMessagingService(service: ServiceEndpoint, errors: string[], warnings: string[]): void {
        const commonMsgPorts = [9092, 5672, 61616, 8080, 8081, 8082];
        if (service.port && !commonMsgPorts.includes(service.port)) {
            warnings.push(`Port ${service.port} is not a common messaging port`);
        }
    }

    private validateContainerService(service: ServiceEndpoint, errors: string[], warnings: string[]): void {
        if (service.protocol !== 'http' && service.protocol !== 'https' && service.protocol !== 'tcp') {
            warnings.push('Container services typically use HTTP, HTTPS, or TCP protocols');
        }
    }

    private validateApiService(service: ServiceEndpoint, errors: string[], warnings: string[]): void {
        if (service.protocol !== 'http' && service.protocol !== 'https') {
            errors.push('API services must use HTTP or HTTPS protocol');
        }

        if (!service.healthCheckPath) {
            warnings.push('API services should define a health check path');
        }
    }

    /**
     * Validate environment configuration update
     */
    validateEnvironmentUpdate(
        currentConfig: EnvironmentConfiguration,
        updateConfig: Partial<EnvironmentConfiguration>
    ): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Prevent changing immutable fields
        const immutableFields = ['environmentId', 'applicationId', 'createdAt'];
        immutableFields.forEach(field => {
            if (field in updateConfig && updateConfig[field as keyof EnvironmentConfiguration] !== currentConfig[field as keyof EnvironmentConfiguration]) {
                errors.push(`Field '${field}' cannot be modified after creation`);
            }
        });

        // Version must be incremental
        if ('version' in updateConfig && updateConfig.version !== undefined) {
            if (updateConfig.version <= currentConfig.version) {
                errors.push('Version must be incremented for updates');
            }
        }

        // If updating active status to false, warn about impact
        if ('isActive' in updateConfig && updateConfig.isActive === false && currentConfig.isActive === true) {
            warnings.push('Deactivating environment may impact dependent tools and services');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
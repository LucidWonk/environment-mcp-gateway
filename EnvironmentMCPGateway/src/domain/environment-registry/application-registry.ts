/**
 * Application Registry - Central aggregate for multi-environment management
 * Implements hierarchical application-environment-server relationships with validation
 */

import { EventEmitter } from 'events';
import {
    ApplicationRegistryEntry,
    EnvironmentConfiguration,
    EnvironmentHealthStatus,
    RegistryOperationResult,
    RegistryQueryOptions,
    EnvironmentRegistryEvents,
    ServerDefinition,
    ServiceEndpoint
} from './types.js';
import { EnvironmentValidator } from './environment-validator.js';

export class ApplicationRegistry extends EventEmitter {
    private readonly applications = new Map<string, ApplicationRegistryEntry>();
    private readonly healthStatuses = new Map<string, EnvironmentHealthStatus>();
    private readonly validator: EnvironmentValidator;

    constructor() {
        super();
        this.validator = new EnvironmentValidator();
    }

    /**
     * Register a new application with its initial configuration
     */
    async registerApplication(
        applicationId: string,
        applicationName: string,
        description: string,
        options: {
            readonly defaultEnvironment?: string;
            readonly tags?: readonly string[];
        } = {}
    ): Promise<RegistryOperationResult<ApplicationRegistryEntry>> {
        try {
            // Validate application ID format
            const validation = this.validator.validateApplicationId(applicationId);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Invalid application ID',
                    validation
                };
            }

            // Check for existing application
            if (this.applications.has(applicationId)) {
                return {
                    success: false,
                    error: `Application '${applicationId}' already exists`
                };
            }

            const now = new Date();
            const entry: ApplicationRegistryEntry = {
                applicationId,
                applicationName,
                description,
                environments: {},
                defaultEnvironment: options.defaultEnvironment,
                tags: options.tags || [],
                createdAt: now,
                updatedAt: now
            };

            this.applications.set(applicationId, entry);

            // Emit event for domain integration
            this.emit('application-registered', {
                applicationId,
                applicationName,
                entry,
                timestamp: now
            } satisfies EnvironmentRegistryEvents['application-registered']);

            return {
                success: true,
                data: entry
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to register application: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Register an environment for an existing application
     */
    async registerEnvironment(
        applicationId: string,
        environmentConfig: Omit<EnvironmentConfiguration, 'createdAt' | 'updatedAt' | 'version'>
    ): Promise<RegistryOperationResult<EnvironmentConfiguration>> {
        try {
            // Validate application exists
            const application = this.applications.get(applicationId);
            if (!application) {
                return {
                    success: false,
                    error: `Application '${applicationId}' not found`
                };
            }

            // Validate environment configuration
            const validation = this.validator.validateEnvironmentConfiguration(environmentConfig);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Invalid environment configuration',
                    validation
                };
            }

            const now = new Date();
            const fullConfig: EnvironmentConfiguration = {
                ...environmentConfig,
                createdAt: now,
                updatedAt: now,
                version: 1
            };

            // Update application with new environment
            const updatedApplication: ApplicationRegistryEntry = {
                ...application,
                environments: {
                    ...application.environments,
                    [environmentConfig.environmentId]: fullConfig
                },
                updatedAt: now
            };

            this.applications.set(applicationId, updatedApplication);

            // Initialize health status
            const initialHealthStatus: EnvironmentHealthStatus = {
                environmentId: environmentConfig.environmentId,
                applicationId,
                overallStatus: 'unknown',
                serviceStatuses: Object.fromEntries(
                    environmentConfig.services.map(service => [
                        service.serviceName,
                        {
                            status: 'unknown' as const,
                            lastCheck: now
                        }
                    ])
                ),
                lastUpdated: now,
                checkDuration: 0
            };

            this.healthStatuses.set(
                `${applicationId}:${environmentConfig.environmentId}`,
                initialHealthStatus
            );

            // Emit event for domain integration
            this.emit('environment-registered', {
                applicationId,
                environmentId: environmentConfig.environmentId,
                configuration: fullConfig,
                timestamp: now
            } satisfies EnvironmentRegistryEvents['environment-registered']);

            return {
                success: true,
                data: fullConfig
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to register environment: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get application by ID
     */
    getApplication(applicationId: string): ApplicationRegistryEntry | undefined {
        return this.applications.get(applicationId);
    }

    /**
     * Get environment configuration
     */
    getEnvironment(applicationId: string, environmentId: string): EnvironmentConfiguration | undefined {
        const application = this.applications.get(applicationId);
        return application?.environments[environmentId];
    }

    /**
     * Get environment health status
     */
    getEnvironmentHealth(applicationId: string, environmentId: string): EnvironmentHealthStatus | undefined {
        return this.healthStatuses.get(`${applicationId}:${environmentId}`);
    }

    /**
     * Update environment health status
     */
    async updateEnvironmentHealth(
        applicationId: string,
        environmentId: string,
        healthStatus: Omit<EnvironmentHealthStatus, 'applicationId' | 'environmentId'>
    ): Promise<RegistryOperationResult<EnvironmentHealthStatus>> {
        try {
            const key = `${applicationId}:${environmentId}`;
            const currentStatus = this.healthStatuses.get(key);
            
            if (!currentStatus) {
                return {
                    success: false,
                    error: 'Environment health status not found'
                };
            }

            const previousStatus = currentStatus.overallStatus;
            const newHealthStatus: EnvironmentHealthStatus = {
                ...healthStatus,
                applicationId,
                environmentId
            };

            this.healthStatuses.set(key, newHealthStatus);

            // Emit event if status changed
            if (previousStatus !== newHealthStatus.overallStatus) {
                this.emit('environment-health-changed', {
                    applicationId,
                    environmentId,
                    previousStatus,
                    newStatus: newHealthStatus.overallStatus,
                    healthStatus: newHealthStatus,
                    timestamp: new Date()
                } satisfies EnvironmentRegistryEvents['environment-health-changed']);
            }

            return {
                success: true,
                data: newHealthStatus
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to update health status: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Query applications and environments
     */
    queryApplications(options: RegistryQueryOptions = {}): readonly ApplicationRegistryEntry[] {
        const results = Array.from(this.applications.values());
        
        let filtered = results;

        // Apply filters
        if (options.applicationId) {
            filtered = filtered.filter(app => app.applicationId === options.applicationId);
        }

        if (options.tags && options.tags.length > 0) {
            filtered = filtered.filter(app => 
                options.tags!.some(tag => app.tags.includes(tag))
            );
        }

        if (options.environmentType) {
            filtered = filtered.filter(app => 
                Object.values(app.environments).some(env => env.environmentType === options.environmentType)
            );
        }

        if (options.isActive !== undefined) {
            filtered = filtered.filter(app => 
                Object.values(app.environments).some(env => env.isActive === options.isActive)
            );
        }

        // Apply sorting
        const sortBy = options.sortBy || 'name';
        const sortOrder = options.sortOrder || 'asc';

        filtered.sort((a, b) => {
            let aVal: string | Date;
            let bVal: string | Date;

            switch (sortBy) {
                case 'name':
                    aVal = a.applicationName;
                    bVal = b.applicationName;
                    break;
                case 'created':
                    aVal = a.createdAt;
                    bVal = b.createdAt;
                    break;
                case 'updated':
                    aVal = a.updatedAt;
                    bVal = b.updatedAt;
                    break;
                default:
                    aVal = a.applicationName;
                    bVal = b.applicationName;
            }

            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        // Apply pagination
        if (options.offset || options.limit) {
            const offset = options.offset || 0;
            const limit = options.limit;
            filtered = limit ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
        }

        return filtered;
    }

    /**
     * Get all environment configurations across applications
     */
    getAllEnvironments(): readonly EnvironmentConfiguration[] {
        const environments: EnvironmentConfiguration[] = [];
        
        for (const application of this.applications.values()) {
            environments.push(...Object.values(application.environments));
        }
        
        return environments;
    }

    /**
     * Get registry statistics
     */
    getRegistryStats(): {
        readonly applicationCount: number;
        readonly environmentCount: number;
        readonly activeEnvironmentCount: number;
        readonly healthyEnvironmentCount: number;
        readonly serviceCount: number;
    } {
        const applications = Array.from(this.applications.values());
        const environments = this.getAllEnvironments();
        const healthStatuses = Array.from(this.healthStatuses.values());

        return {
            applicationCount: applications.length,
            environmentCount: environments.length,
            activeEnvironmentCount: environments.filter(env => env.isActive).length,
            healthyEnvironmentCount: healthStatuses.filter(health => health.overallStatus === 'healthy').length,
            serviceCount: environments.reduce((total, env) => total + env.services.length, 0)
        };
    }

    /**
     * Clear all registry data (for testing/reset)
     */
    clear(): void {
        this.applications.clear();
        this.healthStatuses.clear();
    }
}
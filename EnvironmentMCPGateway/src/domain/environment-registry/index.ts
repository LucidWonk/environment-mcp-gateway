/**
 * Environment Registry Domain - Main Index
 * Multi-environment registry architecture with hierarchical app-env-server management
 */

// Core Types and Interfaces
export * from './types.js';

// Main Application Registry Service
export { ApplicationRegistry } from './application-registry.js';

// Configuration Management
export { EnvironmentValidator } from './environment-validator.js';
export { EnvironmentConfigurationBuilder } from './environment-configuration-builder.js';
export { ConfigurationPersistenceEngine } from './configuration-persistence-engine.js';

// Domain Services Factory
import { ApplicationRegistry } from './application-registry.js';
import { ConfigurationPersistenceEngine } from './configuration-persistence-engine.js';
import { EnvironmentValidator } from './environment-validator.js';

/**
 * Environment Registry Domain Service Factory
 * Creates properly configured domain services with dependencies
 */
export class EnvironmentRegistryFactory {
    /**
     * Create a complete environment registry setup with persistence
     */
    static async createRegistry(options: {
        configDirectory?: string;
        enablePersistence?: boolean;
        enableBackups?: boolean;
        autoLoad?: boolean;
    } = {}): Promise<{
        registry: ApplicationRegistry;
        persistence?: ConfigurationPersistenceEngine;
        validator: EnvironmentValidator;
    }> {
        const validator = new EnvironmentValidator();
        const registry = new ApplicationRegistry();

        let persistence: ConfigurationPersistenceEngine | undefined;

        if (options.enablePersistence !== false) {
            persistence = new ConfigurationPersistenceEngine({
                configDirectory: options.configDirectory,
                enableBackups: options.enableBackups
            });

            // Initialize persistence
            const initResult = await persistence.initialize();
            if (!initResult.success) {
                throw new Error(`Failed to initialize persistence: ${initResult.error}`);
            }

            // Auto-load existing configuration
            if (options.autoLoad !== false) {
                const loadResult = await persistence.loadRegistryData();
                if (loadResult.success && loadResult.data) {
                    // Populate registry with loaded data
                    for (const [applicationId, application] of Object.entries(loadResult.data)) {
                        // Register application first
                        await registry.registerApplication(
                            applicationId,
                            application.applicationName,
                            application.description,
                            {
                                defaultEnvironment: application.defaultEnvironment,
                                tags: application.tags
                            }
                        );

                        // Register each environment
                        for (const environment of Object.values(application.environments)) {
                            await registry.registerEnvironment(applicationId, {
                                environmentId: environment.environmentId,
                                environmentName: environment.environmentName,
                                environmentType: environment.environmentType,
                                applicationId: environment.applicationId,
                                servers: environment.servers,
                                services: environment.services,
                                variables: environment.variables,
                                isActive: environment.isActive
                            });
                        }
                    }
                }
            }

            // Set up persistence listeners
            registry.on('application-registered', async () => {
                const applications: Record<string, any> = {};
                for (const app of registry.queryApplications()) {
                    applications[app.applicationId] = app;
                }
                await persistence!.saveRegistryData(applications);
            });

            registry.on('environment-registered', async () => {
                const applications: Record<string, any> = {};
                for (const app of registry.queryApplications()) {
                    applications[app.applicationId] = app;
                }
                await persistence!.saveRegistryData(applications);
            });
        }

        return {
            registry,
            persistence,
            validator
        };
    }

    /**
     * Create a lightweight registry for testing without persistence
     */
    static createTestRegistry(): {
        registry: ApplicationRegistry;
        validator: EnvironmentValidator;
    } {
        return {
            registry: new ApplicationRegistry(),
            validator: new EnvironmentValidator()
        };
    }
}
/**
 * Configuration Persistence Engine - YAML-based durable persistence for environment registry
 * Manages configuration files, versioning, and backup with atomic operations
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { EventEmitter } from 'events';
import {
    ApplicationRegistryEntry,
    EnvironmentConfiguration,
    RegistryOperationResult,
    EnvironmentRegistryEvents
} from './types.js';

interface PersistedRegistryData {
    readonly version: string;
    readonly lastUpdated: string;
    readonly applications: Record<string, ApplicationRegistryEntry>;
    readonly metadata: {
        readonly formatVersion: number;
        readonly generatedBy: string;
        readonly checksum?: string;
    };
}

interface PersistenceOptions {
    readonly configDirectory: string;
    readonly enableBackups: boolean;
    readonly maxBackups: number;
    readonly autoSave: boolean;
    readonly backupInterval: number; // milliseconds
}

export class ConfigurationPersistenceEngine extends EventEmitter {
    private readonly options: PersistenceOptions;
    private readonly configFilePath: string;
    private readonly backupDirectory: string;
    private autoSaveTimer?: NodeJS.Timeout;
    private isLoading = false;
    private isSaving = false;

    constructor(options: Partial<PersistenceOptions> = {}) {
        super();
        
        this.options = {
            configDirectory: options.configDirectory || path.join(process.cwd(), '.mcp-gateway-config'),
            enableBackups: options.enableBackups !== false,
            maxBackups: options.maxBackups || 10,
            autoSave: options.autoSave !== false,
            backupInterval: options.backupInterval || 300000 // 5 minutes
        };

        this.configFilePath = path.join(this.options.configDirectory, 'environment-registry.yaml');
        this.backupDirectory = path.join(this.options.configDirectory, 'backups');

        if (this.options.autoSave) {
            this.setupAutoSave();
        }
    }

    /**
     * Initialize persistence engine and ensure directory structure exists
     */
    async initialize(): Promise<RegistryOperationResult<void>> {
        try {
            await this.ensureDirectoryStructure();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: `Failed to initialize persistence engine: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Load environment registry data from persistent storage
     */
    async loadRegistryData(): Promise<RegistryOperationResult<Record<string, ApplicationRegistryEntry>>> {
        if (this.isLoading) {
            return {
                success: false,
                error: 'Load operation already in progress'
            };
        }

        this.isLoading = true;

        try {
            // Check if config file exists
            const configExists = await this.fileExists(this.configFilePath);
            if (!configExists) {
                // Return empty registry for first-time setup
                return {
                    success: true,
                    data: {}
                };
            }

            const fileContent = await fs.readFile(this.configFilePath, 'utf-8');
            const parsedData = yaml.load(fileContent) as PersistedRegistryData;

            // Validate loaded data structure
            const validation = this.validatePersistedData(parsedData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Invalid configuration file format',
                    validation
                };
            }

            // Convert date strings back to Date objects
            const applications = this.deserializeApplications(parsedData.applications);

            this.emit('configuration-loaded', {
                applications: Object.keys(applications),
                timestamp: new Date()
            });

            return {
                success: true,
                data: applications
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to load registry data: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Save environment registry data to persistent storage with atomic writes
     */
    async saveRegistryData(applications: Record<string, ApplicationRegistryEntry>): Promise<RegistryOperationResult<void>> {
        if (this.isSaving) {
            return {
                success: false,
                error: 'Save operation already in progress'
            };
        }

        this.isSaving = true;

        try {
            await this.ensureDirectoryStructure();

            // Create backup if file exists and backups are enabled
            if (this.options.enableBackups) {
                await this.createBackup();
            }

            // Prepare data for serialization
            const dataToSave: PersistedRegistryData = {
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                applications: this.serializeApplications(applications),
                metadata: {
                    formatVersion: 1,
                    generatedBy: 'EnvironmentMCPGateway',
                    checksum: this.generateChecksum(applications)
                }
            };

            // Convert to YAML with formatting
            const yamlContent = yaml.dump(dataToSave, {
                indent: 2,
                lineWidth: 120,
                noRefs: true,
                sortKeys: true
            });

            // Add header comment
            const header = [
                '# Environment MCP Gateway - Registry Configuration',
                '# This file contains the complete registry of applications and environments',
                `# Generated on: ${new Date().toISOString()}`,
                '# Do not edit this file directly - use MCP tools for registry management',
                '',
                ''
            ].join('\n');

            const finalContent = header + yamlContent;

            // Atomic write: write to temp file then rename
            const tempFilePath = `${this.configFilePath}.tmp`;
            await fs.writeFile(tempFilePath, finalContent, 'utf-8');
            await fs.rename(tempFilePath, this.configFilePath);

            this.emit('configuration-saved', {
                applications: Object.keys(applications),
                timestamp: new Date()
            });

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: `Failed to save registry data: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Create a backup of the current configuration
     */
    async createBackup(): Promise<RegistryOperationResult<string>> {
        try {
            const configExists = await this.fileExists(this.configFilePath);
            if (!configExists) {
                return {
                    success: false,
                    error: 'No configuration file exists to backup'
                };
            }

            await fs.mkdir(this.backupDirectory, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `environment-registry-${timestamp}.yaml`;
            const backupFilePath = path.join(this.backupDirectory, backupFileName);

            await fs.copyFile(this.configFilePath, backupFilePath);

            // Clean up old backups
            await this.cleanupOldBackups();

            return {
                success: true,
                data: backupFilePath
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Restore configuration from a backup file
     */
    async restoreFromBackup(backupFileName: string): Promise<RegistryOperationResult<void>> {
        try {
            const backupFilePath = path.join(this.backupDirectory, backupFileName);
            const backupExists = await this.fileExists(backupFilePath);
            
            if (!backupExists) {
                return {
                    success: false,
                    error: `Backup file '${backupFileName}' not found`
                };
            }

            // Validate backup file before restore
            const backupContent = await fs.readFile(backupFilePath, 'utf-8');
            const parsedBackup = yaml.load(backupContent) as PersistedRegistryData;
            
            const validation = this.validatePersistedData(parsedBackup);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Invalid backup file format',
                    validation
                };
            }

            // Create current backup before restore
            await this.createBackup();

            // Copy backup to main config file
            await fs.copyFile(backupFilePath, this.configFilePath);

            this.emit('configuration-restored', {
                backupFile: backupFileName,
                timestamp: new Date()
            });

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: `Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * List available backup files
     */
    async listBackups(): Promise<RegistryOperationResult<string[]>> {
        try {
            const backupDirExists = await this.fileExists(this.backupDirectory);
            if (!backupDirExists) {
                return {
                    success: true,
                    data: []
                };
            }

            const files = await fs.readdir(this.backupDirectory);
            const backupFiles = files
                .filter(file => file.startsWith('environment-registry-') && file.endsWith('.yaml'))
                .sort()
                .reverse(); // Most recent first

            return {
                success: true,
                data: backupFiles
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get configuration file information
     */
    async getConfigurationInfo(): Promise<RegistryOperationResult<{
        readonly exists: boolean;
        readonly size?: number;
        readonly lastModified?: Date;
        readonly path: string;
        readonly backupCount: number;
    }>> {
        try {
            const configExists = await this.fileExists(this.configFilePath);
            let size: number | undefined;
            let lastModified: Date | undefined;

            if (configExists) {
                const stats = await fs.stat(this.configFilePath);
                size = stats.size;
                lastModified = stats.mtime;
            }

            const backupsResult = await this.listBackups();
            const backupCount = backupsResult.success ? backupsResult.data?.length || 0 : 0;

            return {
                success: true,
                data: {
                    exists: configExists,
                    size,
                    lastModified,
                    path: this.configFilePath,
                    backupCount
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to get configuration info: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Cleanup and shutdown persistence engine
     */
    async shutdown(): Promise<void> {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
    }

    private async ensureDirectoryStructure(): Promise<void> {
        await fs.mkdir(this.options.configDirectory, { recursive: true });
        if (this.options.enableBackups) {
            await fs.mkdir(this.backupDirectory, { recursive: true });
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private setupAutoSave(): void {
        this.autoSaveTimer = setInterval(async () => {
            // Auto-save is handled by the ApplicationRegistry calling saveRegistryData
            // This timer is for periodic backup creation
            if (await this.fileExists(this.configFilePath)) {
                await this.createBackup();
            }
        }, this.options.backupInterval);
    }

    private serializeApplications(applications: Record<string, ApplicationRegistryEntry>): Record<string, any> {
        const serialized: Record<string, any> = {};
        
        for (const [key, application] of Object.entries(applications)) {
            serialized[key] = {
                ...application,
                createdAt: application.createdAt.toISOString(),
                updatedAt: application.updatedAt.toISOString(),
                environments: Object.fromEntries(
                    Object.entries(application.environments).map(([envKey, env]) => [
                        envKey,
                        {
                            ...env,
                            createdAt: env.createdAt.toISOString(),
                            updatedAt: env.updatedAt.toISOString()
                        }
                    ])
                )
            };
        }
        
        return serialized;
    }

    private deserializeApplications(serializedApplications: Record<string, any>): Record<string, ApplicationRegistryEntry> {
        const applications: Record<string, ApplicationRegistryEntry> = {};
        
        for (const [key, application] of Object.entries(serializedApplications)) {
            applications[key] = {
                ...application,
                createdAt: new Date(application.createdAt),
                updatedAt: new Date(application.updatedAt),
                environments: Object.fromEntries(
                    Object.entries(application.environments).map(([envKey, env]: [string, any]) => [
                        envKey,
                        {
                            ...env,
                            createdAt: new Date(env.createdAt),
                            updatedAt: new Date(env.updatedAt)
                        }
                    ])
                )
            };
        }
        
        return applications;
    }

    private validatePersistedData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];

        if (!data || typeof data !== 'object') {
            errors.push('Data must be an object');
            return { isValid: false, errors, warnings: [] };
        }

        if (!data.version || typeof data.version !== 'string') {
            errors.push('Missing or invalid version field');
        }

        if (!data.applications || typeof data.applications !== 'object') {
            errors.push('Missing or invalid applications field');
        }

        if (!data.metadata || typeof data.metadata !== 'object') {
            errors.push('Missing or invalid metadata field');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }

    private generateChecksum(applications: Record<string, ApplicationRegistryEntry>): string {
        const crypto = require('crypto');
        const data = JSON.stringify(applications, null, 2);
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    private async cleanupOldBackups(): Promise<void> {
        try {
            const backupsResult = await this.listBackups();
            if (!backupsResult.success || !backupsResult.data) {
                return;
            }

            const backups = backupsResult.data;
            if (backups.length <= this.options.maxBackups) {
                return;
            }

            // Remove oldest backups
            const backupsToDelete = backups.slice(this.options.maxBackups);
            for (const backupFile of backupsToDelete) {
                const backupPath = path.join(this.backupDirectory, backupFile);
                await fs.unlink(backupPath);
            }
        } catch (error) {
            // Log error but don't fail the operation
            console.warn(`Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
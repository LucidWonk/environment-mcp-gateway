import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { watch, FSWatcher } from 'fs';
import { existsSync, readFileSync } from 'fs';
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.MCP_LOG_LEVEL ?? 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});

export interface ConfigurationChangeEvent {
    type: 'environment' | 'dotenv';
    changes: string[];
    timestamp: Date;
}

export type ConfigurationChangeListener = (event: ConfigurationChangeEvent) => void | Promise<void>;

export class ConfigurationManager {
    private static instance: ConfigurationManager;
    private listeners: ConfigurationChangeListener[] = [];
    private watchers: FSWatcher[] = [];
    private currentEnvSnapshot: Map<string, string | undefined> = new Map();
    private envFilePath: string;
    private lastEnvFileContent: string = '';
    private isWatching: boolean = false;

    private constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.envFilePath = join(__dirname, '../../../.env.development');
        this.captureCurrentEnvironment();
        this.captureEnvFileContent();
    }

    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    private captureCurrentEnvironment(): void {
        const envVars = [
            'DB_HOST', 'DB_PASSWORD', 'DB_PORT', 'TIMESCALE_DATABASE', 'TIMESCALE_USERNAME',
            'GIT_REPO_PATH', 'GIT_USER_NAME', 'GIT_USER_EMAIL',
            'MCP_SERVER_PORT', 'MCP_LOG_LEVEL',
            'AZURE_DEVOPS_ORGANIZATION', 'AZURE_DEVOPS_PROJECT', 'AZURE_DEVOPS_PAT', 'AZURE_DEVOPS_API_URL'
        ];

        this.currentEnvSnapshot.clear();
        envVars.forEach(varName => {
            this.currentEnvSnapshot.set(varName, process.env[varName]);
        });
    }

    private captureEnvFileContent(): void {
        if (existsSync(this.envFilePath)) {
            try {
                this.lastEnvFileContent = readFileSync(this.envFilePath, 'utf8');
            } catch (error) {
                logger.warn('Failed to read .env file for content capture', { 
                    path: this.envFilePath, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }
    }

    public reloadConfiguration(): void {
        logger.info('Reloading configuration from .env file', { path: this.envFilePath });
        
        // Reload .env file
        config({ path: this.envFilePath, override: true });
        
        // Detect changes
        const changes = this.detectEnvironmentChanges();
        
        if (changes.length > 0) {
            logger.info('Configuration changes detected', { changes });
            
            // Update snapshot
            this.captureCurrentEnvironment();
            this.captureEnvFileContent();
            
            // Notify listeners
            const event: ConfigurationChangeEvent = {
                type: 'environment',
                changes,
                timestamp: new Date()
            };
            
            this.notifyListeners(event);
        } else {
            logger.debug('Configuration reloaded but no changes detected');
        }
    }

    private detectEnvironmentChanges(): string[] {
        const changes: string[] = [];
        
        for (const [varName, oldValue] of this.currentEnvSnapshot) {
            const newValue = process.env[varName];
            if (oldValue !== newValue) {
                changes.push(varName);
                logger.debug('Environment variable changed', { 
                    variable: varName, 
                    oldValue: oldValue ? '[SET]' : '[UNSET]',
                    newValue: newValue ? '[SET]' : '[UNSET]'
                });
            }
        }
        
        return changes;
    }

    public startWatching(): void {
        if (this.isWatching) {
            logger.warn('Configuration watching is already active');
            return;
        }

        logger.info('Starting configuration file watching', { path: this.envFilePath });

        if (existsSync(this.envFilePath)) {
            try {
                const watcher = watch(this.envFilePath, (eventType, filename) => {
                    if (eventType === 'change') {
                        logger.info('Configuration file changed, reloading...', { 
                            filename, 
                            path: this.envFilePath 
                        });
                        
                        // Debounce rapid file changes
                        setTimeout(() => {
                            this.handleFileChange();
                        }, 100);
                    }
                });

                watcher.on('error', (error) => {
                    logger.error('Configuration file watcher error', { 
                        path: this.envFilePath, 
                        error: error.message 
                    });
                });

                this.watchers.push(watcher);
                this.isWatching = true;
                
                logger.info('Configuration file watching started successfully');
            } catch (error) {
                logger.error('Failed to start configuration file watching', { 
                    path: this.envFilePath, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        } else {
            logger.warn('Configuration file does not exist, watching disabled', { 
                path: this.envFilePath 
            });
        }
    }

    private handleFileChange(): void {
        try {
            // Check if file content actually changed
            const newContent = readFileSync(this.envFilePath, 'utf8');
            
            if (newContent !== this.lastEnvFileContent) {
                logger.info('Configuration file content changed, triggering reload');
                
                const event: ConfigurationChangeEvent = {
                    type: 'dotenv',
                    changes: ['file_modified'],
                    timestamp: new Date()
                };
                
                // Reload configuration
                this.reloadConfiguration();
                
                // Notify about file change specifically
                this.notifyListeners(event);
            } else {
                logger.debug('Configuration file change event but content unchanged');
            }
        } catch (error) {
            logger.error('Error handling configuration file change', { 
                error: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
    }

    public stopWatching(): void {
        if (!this.isWatching) {
            return;
        }

        logger.info('Stopping configuration file watching');
        
        this.watchers.forEach(watcher => {
            try {
                watcher.close();
            } catch (error) {
                logger.warn('Error closing configuration file watcher', { 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        });
        
        this.watchers = [];
        this.isWatching = false;
        
        logger.info('Configuration file watching stopped');
    }

    public addChangeListener(listener: ConfigurationChangeListener): void {
        this.listeners.push(listener);
        logger.debug('Configuration change listener added', { 
            listenerCount: this.listeners.length 
        });
    }

    public removeChangeListener(listener: ConfigurationChangeListener): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
            logger.debug('Configuration change listener removed', { 
                listenerCount: this.listeners.length 
            });
        }
    }

    private async notifyListeners(event: ConfigurationChangeEvent): Promise<void> {
        logger.info('Notifying configuration change listeners', { 
            type: event.type, 
            changes: event.changes,
            listenerCount: this.listeners.length 
        });
        
        for (const listener of this.listeners) {
            try {
                await listener(event);
            } catch (error) {
                logger.error('Configuration change listener error', { 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }
    }

    public getCurrentConfiguration(): Record<string, string | undefined> {
        const config: Record<string, string | undefined> = {};
        
        for (const [varName, value] of this.currentEnvSnapshot) {
            config[varName] = value;
        }
        
        return config;
    }

    public getConfigurationSummary(): {
        envFilePath: string;
        isWatching: boolean;
        listenerCount: number;
        lastReload: Date;
        configuredVariables: string[];
        } {
        return {
            envFilePath: this.envFilePath,
            isWatching: this.isWatching,
            listenerCount: this.listeners.length,
            lastReload: new Date(),
            configuredVariables: Array.from(this.currentEnvSnapshot.keys()).filter(key => 
                this.currentEnvSnapshot.get(key) !== undefined
            )
        };
    }

    public async shutdown(): Promise<void> {
        logger.info('Shutting down configuration manager');
        this.stopWatching();
        this.listeners = [];
    }
}
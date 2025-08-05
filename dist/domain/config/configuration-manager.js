"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = void 0;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const fs_1 = require("fs");
const fs_2 = require("fs");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: process.env.MCP_LOG_LEVEL ?? 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});
class ConfigurationManager {
    static instance;
    listeners = [];
    watchers = [];
    currentEnvSnapshot = new Map();
    envFilePath;
    lastEnvFileContent = '';
    isWatching = false;
    constructor() {
        // Use CommonJS __dirname
        this.envFilePath = (0, path_1.join)(__dirname, '../../../.env.development');
        this.captureCurrentEnvironment();
        this.captureEnvFileContent();
    }
    static getInstance() {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }
    captureCurrentEnvironment() {
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
    captureEnvFileContent() {
        if ((0, fs_2.existsSync)(this.envFilePath)) {
            try {
                this.lastEnvFileContent = (0, fs_2.readFileSync)(this.envFilePath, 'utf8');
            }
            catch (error) {
                logger.warn('Failed to read .env file for content capture', {
                    path: this.envFilePath,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    reloadConfiguration() {
        logger.info('Reloading configuration from .env file', { path: this.envFilePath });
        // Reload .env file
        (0, dotenv_1.config)({ path: this.envFilePath, override: true });
        // Detect changes
        const changes = this.detectEnvironmentChanges();
        if (changes.length > 0) {
            logger.info('Configuration changes detected', { changes });
            // Update snapshot
            this.captureCurrentEnvironment();
            this.captureEnvFileContent();
            // Notify listeners
            const event = {
                type: 'environment',
                changes,
                timestamp: new Date()
            };
            this.notifyListeners(event);
        }
        else {
            logger.debug('Configuration reloaded but no changes detected');
        }
    }
    detectEnvironmentChanges() {
        const changes = [];
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
    startWatching() {
        if (this.isWatching) {
            logger.warn('Configuration watching is already active');
            return;
        }
        logger.info('Starting configuration file watching', { path: this.envFilePath });
        if ((0, fs_2.existsSync)(this.envFilePath)) {
            try {
                const watcher = (0, fs_1.watch)(this.envFilePath, (eventType, filename) => {
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
            }
            catch (error) {
                logger.error('Failed to start configuration file watching', {
                    path: this.envFilePath,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        else {
            logger.warn('Configuration file does not exist, watching disabled', {
                path: this.envFilePath
            });
        }
    }
    handleFileChange() {
        try {
            // Check if file content actually changed
            const newContent = (0, fs_2.readFileSync)(this.envFilePath, 'utf8');
            if (newContent !== this.lastEnvFileContent) {
                logger.info('Configuration file content changed, triggering reload');
                const event = {
                    type: 'dotenv',
                    changes: ['file_modified'],
                    timestamp: new Date()
                };
                // Reload configuration
                this.reloadConfiguration();
                // Notify about file change specifically
                this.notifyListeners(event);
            }
            else {
                logger.debug('Configuration file change event but content unchanged');
            }
        }
        catch (error) {
            logger.error('Error handling configuration file change', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    stopWatching() {
        if (!this.isWatching) {
            return;
        }
        logger.info('Stopping configuration file watching');
        this.watchers.forEach(watcher => {
            try {
                watcher.close();
            }
            catch (error) {
                logger.warn('Error closing configuration file watcher', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.watchers = [];
        this.isWatching = false;
        logger.info('Configuration file watching stopped');
    }
    addChangeListener(listener) {
        this.listeners.push(listener);
        logger.debug('Configuration change listener added', {
            listenerCount: this.listeners.length
        });
    }
    removeChangeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
            logger.debug('Configuration change listener removed', {
                listenerCount: this.listeners.length
            });
        }
    }
    async notifyListeners(event) {
        logger.info('Notifying configuration change listeners', {
            type: event.type,
            changes: event.changes,
            listenerCount: this.listeners.length
        });
        for (const listener of this.listeners) {
            try {
                await listener(event);
            }
            catch (error) {
                logger.error('Configuration change listener error', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    getCurrentConfiguration() {
        const config = {};
        for (const [varName, value] of this.currentEnvSnapshot) {
            config[varName] = value;
        }
        return config;
    }
    getConfigurationSummary() {
        return {
            envFilePath: this.envFilePath,
            isWatching: this.isWatching,
            listenerCount: this.listeners.length,
            lastReload: new Date(),
            configuredVariables: Array.from(this.currentEnvSnapshot.keys()).filter(key => this.currentEnvSnapshot.get(key) !== undefined)
        };
    }
    async shutdown() {
        logger.info('Shutting down configuration manager');
        this.stopWatching();
        this.listeners = [];
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=configuration-manager.js.map
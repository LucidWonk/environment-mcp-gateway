export interface ConfigurationChangeEvent {
    type: 'environment' | 'dotenv';
    changes: string[];
    timestamp: Date;
}
export type ConfigurationChangeListener = (event: ConfigurationChangeEvent) => void | Promise<void>;
export declare class ConfigurationManager {
    private static instance;
    private listeners;
    private watchers;
    private currentEnvSnapshot;
    private envFilePath;
    private lastEnvFileContent;
    private isWatching;
    private constructor();
    static getInstance(): ConfigurationManager;
    private captureCurrentEnvironment;
    private captureEnvFileContent;
    reloadConfiguration(): void;
    private detectEnvironmentChanges;
    startWatching(): void;
    private handleFileChange;
    stopWatching(): void;
    addChangeListener(listener: ConfigurationChangeListener): void;
    removeChangeListener(listener: ConfigurationChangeListener): void;
    private notifyListeners;
    getCurrentConfiguration(): Record<string, string | undefined>;
    getConfigurationSummary(): {
        envFilePath: string;
        isWatching: boolean;
        listenerCount: number;
        lastReload: Date;
        configuredVariables: string[];
    };
    shutdown(): Promise<void>;
}
//# sourceMappingURL=configuration-manager.d.ts.map
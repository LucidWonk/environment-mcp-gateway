import { EventEmitter } from 'events';
export interface ExpertConnection {
    id: string;
    expertType: string;
    sessionId: string;
    isActive: boolean;
    createdAt: number;
    lastUsed: number;
    usageCount: number;
    metadata?: Record<string, any>;
}
export interface ConnectionPoolConfig {
    maxConnections: number;
    maxConnectionsPerExpert: number;
    connectionTimeout: number;
    idleTimeout: number;
    retryAttempts: number;
    retryDelay: number;
    healthCheckInterval: number;
}
export declare const DEFAULT_POOL_CONFIG: ConnectionPoolConfig;
export interface PoolStatistics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    connectionsByExpert: Record<string, number>;
    poolUtilization: number;
    averageConnectionAge: number;
    totalConnectionsCreated: number;
    totalConnectionsDestroyed: number;
}
export declare class ExpertConnectionPool extends EventEmitter {
    private connections;
    private connectionsByExpert;
    private config;
    private healthCheckTimer;
    private totalConnectionsCreated;
    private totalConnectionsDestroyed;
    constructor(config?: ConnectionPoolConfig);
    acquireConnection(expertType: string, sessionId?: string): Promise<ExpertConnection>;
    releaseConnection(connectionId: string): void;
    private findIdleConnection;
    private createConnection;
    private establishConnection;
    destroyConnection(connectionId: string): void;
    private startHealthChecking;
    private performHealthCheck;
    getStatistics(): PoolStatistics;
    getConnection(connectionId: string): ExpertConnection | null;
    getConnectionsForExpert(expertType: string): ExpertConnection[];
    updateConfig(newConfig: Partial<ConnectionPoolConfig>): void;
    drain(): Promise<void>;
    getHealthStatus(): Record<string, any>;
}
export declare class ExpertPoolManager {
    private pools;
    constructor();
    getPool(domain: string, config?: ConnectionPoolConfig): ExpertConnectionPool;
    getAllStatistics(): Record<string, PoolStatistics>;
    drainAll(): Promise<void>;
}
export declare const expertConnectionPool: ExpertConnectionPool;
export declare const expertPoolManager: ExpertPoolManager;
//# sourceMappingURL=expert-connection-pool.d.ts.map
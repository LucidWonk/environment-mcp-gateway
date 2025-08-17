import { createMCPLogger } from '../utils/mcp-logger.js';
import { EventEmitter } from 'events';

const logger = createMCPLogger('expert-connection-pool.log');

// Expert connection interface
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

// Pool configuration
export interface ConnectionPoolConfig {
    maxConnections: number; // Maximum total connections
    maxConnectionsPerExpert: number; // Maximum connections per expert type
    connectionTimeout: number; // Connection timeout in milliseconds
    idleTimeout: number; // Idle connection timeout in milliseconds
    retryAttempts: number; // Number of retry attempts for failed connections
    retryDelay: number; // Delay between retry attempts in milliseconds
    healthCheckInterval: number; // Health check interval in milliseconds
}

// Default pool configuration optimized for VET operations
export const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
    maxConnections: 50,
    maxConnectionsPerExpert: 10,
    connectionTimeout: 30000, // 30 seconds
    idleTimeout: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    healthCheckInterval: 60000 // 1 minute
};

// Connection pool statistics
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

// Expert connection pool for managing concurrent expert consultations
export class ExpertConnectionPool extends EventEmitter {
    private connections: Map<string, ExpertConnection> = new Map();
    private connectionsByExpert: Map<string, Set<string>> = new Map();
    private config: ConnectionPoolConfig;
    private healthCheckTimer: ReturnType<typeof setTimeout> | null = null;
    private totalConnectionsCreated: number = 0;
    private totalConnectionsDestroyed: number = 0;

    constructor(config: ConnectionPoolConfig = DEFAULT_POOL_CONFIG) {
        super();
        this.config = config;
        this.startHealthChecking();
        
        logger.info('🔗 Expert Connection Pool initialized', {
            maxConnections: this.config.maxConnections,
            maxConnectionsPerExpert: this.config.maxConnectionsPerExpert,
            idleTimeout: `${this.config.idleTimeout}ms`
        });
    }

    // Acquire a connection for an expert type
    public async acquireConnection(expertType: string, sessionId?: string): Promise<ExpertConnection> {
        logger.debug('🎯 Acquiring connection', { expertType, sessionId });

        // Check if we can reuse an existing idle connection
        const existingConnection = this.findIdleConnection(expertType);
        if (existingConnection) {
            existingConnection.isActive = true;
            existingConnection.lastUsed = Date.now();
            existingConnection.usageCount++;
            existingConnection.sessionId = sessionId || existingConnection.sessionId;

            logger.debug('♻️ Reusing existing connection', {
                connectionId: existingConnection.id,
                expertType,
                usageCount: existingConnection.usageCount
            });

            this.emit('connectionAcquired', existingConnection);
            return existingConnection;
        }

        // Check connection limits
        if (this.connections.size >= this.config.maxConnections) {
            throw new Error(`Connection pool is full (${this.config.maxConnections} connections)`);
        }

        const expertConnections = this.connectionsByExpert.get(expertType) || new Set();
        if (expertConnections.size >= this.config.maxConnectionsPerExpert) {
            throw new Error(`Too many connections for expert type ${expertType} (${this.config.maxConnectionsPerExpert} max)`);
        }

        // Create new connection
        const connection = await this.createConnection(expertType, sessionId);
        this.totalConnectionsCreated++;

        logger.info('✨ New connection created', {
            connectionId: connection.id,
            expertType,
            totalConnections: this.connections.size
        });

        this.emit('connectionCreated', connection);
        return connection;
    }

    // Release a connection back to the pool
    public releaseConnection(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            logger.warn('⚠️ Attempted to release unknown connection', { connectionId });
            return;
        }

        connection.isActive = false;
        connection.lastUsed = Date.now();

        logger.debug('🔓 Connection released', {
            connectionId,
            expertType: connection.expertType,
            usageCount: connection.usageCount
        });

        this.emit('connectionReleased', connection);
    }

    // Find an idle connection for reuse
    private findIdleConnection(expertType: string): ExpertConnection | null {
        const expertConnections = this.connectionsByExpert.get(expertType);
        if (!expertConnections) return null;

        for (const connectionId of expertConnections) {
            const connection = this.connections.get(connectionId);
            if (connection && !connection.isActive) {
                // Check if connection is still healthy (not too old)
                const connectionAge = Date.now() - connection.lastUsed;
                if (connectionAge <= this.config.idleTimeout) {
                    return connection;
                }
            }
        }

        return null;
    }

    // Create a new connection
    private async createConnection(expertType: string, sessionId?: string): Promise<ExpertConnection> {
        const connectionId = `conn-${expertType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        const connection: ExpertConnection = {
            id: connectionId,
            expertType,
            sessionId: sessionId || `session-${now}`,
            isActive: true,
            createdAt: now,
            lastUsed: now,
            usageCount: 1,
            metadata: {
                createdBy: 'expert-connection-pool',
                poolVersion: '1.0.0'
            }
        };

        // Store connection
        this.connections.set(connectionId, connection);

        // Track by expert type
        if (!this.connectionsByExpert.has(expertType)) {
            this.connectionsByExpert.set(expertType, new Set());
        }
        this.connectionsByExpert.get(expertType)!.add(connectionId);

        // Simulate connection establishment (in real implementation, this would establish actual connection)
        await this.establishConnection(connection);

        return connection;
    }

    // Simulate connection establishment
    private async establishConnection(connection: ExpertConnection): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Connection timeout for ${connection.expertType}`));
            }, this.config.connectionTimeout);

            // Simulate async connection process
            setImmediate(() => {
                clearTimeout(timeout);
                logger.debug('🔌 Connection established', {
                    connectionId: connection.id,
                    expertType: connection.expertType
                });
                resolve();
            });
        });
    }

    // Destroy a connection
    public destroyConnection(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            logger.warn('⚠️ Attempted to destroy unknown connection', { connectionId });
            return;
        }

        // Remove from main connections map
        this.connections.delete(connectionId);

        // Remove from expert type tracking
        const expertConnections = this.connectionsByExpert.get(connection.expertType);
        if (expertConnections) {
            expertConnections.delete(connectionId);
            if (expertConnections.size === 0) {
                this.connectionsByExpert.delete(connection.expertType);
            }
        }

        this.totalConnectionsDestroyed++;

        logger.debug('💥 Connection destroyed', {
            connectionId,
            expertType: connection.expertType,
            totalConnections: this.connections.size
        });

        this.emit('connectionDestroyed', connection);
    }

    // Start health checking timer
    private startHealthChecking(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);

        logger.debug('🏥 Health checking started', {
            interval: `${this.config.healthCheckInterval}ms`
        });
    }

    // Perform health check and cleanup
    private performHealthCheck(): void {
        const now = Date.now();
        const expiredConnections: string[] = [];

        for (const [connectionId, connection] of this.connections.entries()) {
            // Check for idle timeout
            if (!connection.isActive && (now - connection.lastUsed) > this.config.idleTimeout) {
                expiredConnections.push(connectionId);
            }
        }

        // Remove expired connections
        for (const connectionId of expiredConnections) {
            this.destroyConnection(connectionId);
        }

        if (expiredConnections.length > 0) {
            logger.debug('🧹 Health check cleanup completed', {
                expiredConnections: expiredConnections.length,
                remainingConnections: this.connections.size
            });
        }

        this.emit('healthCheckCompleted', {
            totalConnections: this.connections.size,
            expiredConnections: expiredConnections.length
        });
    }

    // Get pool statistics
    public getStatistics(): PoolStatistics {
        const now = Date.now();
        let activeCount = 0;
        let totalAge = 0;

        const connectionsByExpert: Record<string, number> = {};

        for (const connection of this.connections.values()) {
            if (connection.isActive) {
                activeCount++;
            }
            totalAge += now - connection.createdAt;

            connectionsByExpert[connection.expertType] = 
                (connectionsByExpert[connection.expertType] || 0) + 1;
        }

        const stats: PoolStatistics = {
            totalConnections: this.connections.size,
            activeConnections: activeCount,
            idleConnections: this.connections.size - activeCount,
            connectionsByExpert,
            poolUtilization: (this.connections.size / this.config.maxConnections) * 100,
            averageConnectionAge: this.connections.size > 0 ? totalAge / this.connections.size : 0,
            totalConnectionsCreated: this.totalConnectionsCreated,
            totalConnectionsDestroyed: this.totalConnectionsDestroyed
        };

        logger.debug('📊 Pool statistics requested', stats);
        return stats;
    }

    // Get connection by ID
    public getConnection(connectionId: string): ExpertConnection | null {
        return this.connections.get(connectionId) || null;
    }

    // Get all connections for an expert type
    public getConnectionsForExpert(expertType: string): ExpertConnection[] {
        const expertConnections = this.connectionsByExpert.get(expertType);
        if (!expertConnections) return [];

        return Array.from(expertConnections)
            .map(id => this.connections.get(id))
            .filter(conn => conn !== undefined) as ExpertConnection[];
    }

    // Update pool configuration
    public updateConfig(newConfig: Partial<ConnectionPoolConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Restart health checking if interval changed
        if (newConfig.healthCheckInterval) {
            this.startHealthChecking();
        }

        logger.info('⚙️ Pool configuration updated', { config: this.config });
    }

    // Drain the pool (gracefully close all connections)
    public async drain(): Promise<void> {
        logger.info('🚰 Draining connection pool', { 
            totalConnections: this.connections.size 
        });

        // Stop health checking
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }

        // Destroy all connections
        const connectionIds = Array.from(this.connections.keys());
        for (const connectionId of connectionIds) {
            this.destroyConnection(connectionId);
        }

        logger.info('✅ Connection pool drained');
        this.emit('poolDrained');
    }

    // Get pool health status
    public getHealthStatus(): Record<string, any> {
        const stats = this.getStatistics();
        const healthStatus = {
            healthy: true,
            issues: [] as string[],
            statistics: stats,
            timestamp: new Date().toISOString()
        };

        // Check for potential issues
        if (stats.poolUtilization > 90) {
            healthStatus.healthy = false;
            healthStatus.issues.push('Pool utilization above 90%');
        }

        if (stats.averageConnectionAge > 10 * 60 * 1000) { // 10 minutes
            healthStatus.issues.push('Average connection age exceeds 10 minutes');
        }

        const idleRatio = stats.idleConnections / stats.totalConnections;
        if (idleRatio > 0.8) {
            healthStatus.issues.push('More than 80% of connections are idle');
        }

        return healthStatus;
    }
}

// Pool manager for handling multiple expert connection pools
export class ExpertPoolManager {
    private pools: Map<string, ExpertConnectionPool> = new Map();
    
    constructor() {
        logger.info('🏊 Expert Pool Manager initialized');
    }

    // Get or create pool for specific expert domain
    public getPool(domain: string, config?: ConnectionPoolConfig): ExpertConnectionPool {
        if (!this.pools.has(domain)) {
            const pool = new ExpertConnectionPool(config);
            this.pools.set(domain, pool);
            
            logger.info('🏊 Created new pool for domain', { domain });
        }

        return this.pools.get(domain)!;
    }

    // Get statistics for all pools
    public getAllStatistics(): Record<string, PoolStatistics> {
        const allStats: Record<string, PoolStatistics> = {};
        
        for (const [domain, pool] of this.pools.entries()) {
            allStats[domain] = pool.getStatistics();
        }

        return allStats;
    }

    // Drain all pools
    public async drainAll(): Promise<void> {
        const drainPromises = Array.from(this.pools.values()).map(pool => pool.drain());
        await Promise.all(drainPromises);
        this.pools.clear();
        
        logger.info('🚰 All pools drained');
    }
}

// Export singleton instances
export const expertConnectionPool = new ExpertConnectionPool();
export const expertPoolManager = new ExpertPoolManager();
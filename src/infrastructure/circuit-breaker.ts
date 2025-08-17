import { createMCPLogger } from '../utils/mcp-logger.js';
import { EventEmitter } from 'events';

const logger = createMCPLogger('circuit-breaker.log');

// Circuit breaker states
export enum CircuitBreakerState {
    CLOSED = 'closed',     // Normal operation
    OPEN = 'open',         // Circuit is open, requests fail fast
    HALF_OPEN = 'half-open' // Testing if service has recovered
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
    failureThreshold: number;        // Number of failures before opening circuit
    resetTimeout: number;            // Time to wait before attempting recovery (ms)
    monitoringPeriod: number;        // Time window for monitoring failures (ms)
    halfOpenMaxCalls: number;        // Max calls allowed in half-open state
    timeoutDuration: number;         // Request timeout in milliseconds
    enableHealthCheck: boolean;      // Enable automatic health checking
    healthCheckInterval: number;     // Health check interval (ms)
}

// Default circuit breaker configuration optimized for expert operations
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,             // 5 failures before opening
    resetTimeout: 30000,             // 30 seconds before retry
    monitoringPeriod: 60000,         // 1-minute monitoring window
    halfOpenMaxCalls: 3,             // Allow 3 test calls in half-open
    timeoutDuration: 15000,          // 15-second request timeout
    enableHealthCheck: true,         // Enable health checking
    healthCheckInterval: 60000       // Health check every minute
};

// Failure record for tracking
interface FailureRecord {
    timestamp: number;
    error: Error;
    operation: string;
}

// Circuit breaker statistics
export interface CircuitBreakerStats {
    state: CircuitBreakerState;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    circuitOpenCount: number;
    lastFailureTime: number | null;
    recentFailures: number;
    successRate: number;
    averageResponseTime: number;
}

// Expert-specific circuit breaker for managing fault tolerance
export class ExpertCircuitBreaker extends EventEmitter {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private config: CircuitBreakerConfig;
    private failures: FailureRecord[] = [];
    private totalRequests: number = 0;
    private successfulRequests: number = 0;
    private failedRequests: number = 0;
    private circuitOpenCount: number = 0;
    private lastFailureTime: number | null = null;
    private halfOpenCallsCount: number = 0;
    private nextRetryTime: number = 0;
    private responseTimes: number[] = [];
    private healthCheckTimer: ReturnType<typeof setTimeout> | null = null;
    
    public readonly expertType: string;

    constructor(expertType: string, config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG) {
        super();
        this.expertType = expertType;
        this.config = config;
        
        if (this.config.enableHealthCheck) {
            this.startHealthChecking();
        }
        
        logger.info('⚡ Circuit Breaker initialized', {
            expertType: this.expertType,
            config: this.config,
            state: this.state
        });
    }

    // Execute a function with circuit breaker protection
    public async execute<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        // Check if circuit allows the request
        if (!this.canExecute()) {
            const error = new Error(`Circuit breaker is ${this.state} for ${this.expertType}`);
            this.emit('requestRejected', { expertType: this.expertType, operation, state: this.state });
            throw error;
        }

        this.totalRequests++;
        const startTime = Date.now();

        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(fn);
            const responseTime = Date.now() - startTime;
            
            // Record success
            this.onSuccess(responseTime);
            this.emit('requestSuccess', { 
                expertType: this.expertType, 
                operation, 
                responseTime,
                state: this.state 
            });
            
            return result;
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Record failure
            this.onFailure(error as Error, operation);
            this.emit('requestFailure', { 
                expertType: this.expertType, 
                operation, 
                error: error as Error,
                responseTime,
                state: this.state 
            });
            
            throw error;
        }
    }

    // Check if circuit breaker allows execution
    private canExecute(): boolean {
        const now = Date.now();
        
        switch (this.state) {
        case CircuitBreakerState.CLOSED:
            return true;
                
        case CircuitBreakerState.OPEN:
            if (now >= this.nextRetryTime) {
                this.state = CircuitBreakerState.HALF_OPEN;
                this.halfOpenCallsCount = 0;
                logger.info('🔄 Circuit breaker transitioning to HALF_OPEN', {
                    expertType: this.expertType,
                    nextRetryTime: new Date(this.nextRetryTime).toISOString()
                });
                this.emit('stateChanged', { 
                    expertType: this.expertType, 
                    from: CircuitBreakerState.OPEN, 
                    to: CircuitBreakerState.HALF_OPEN 
                });
                return true;
            }
            return false;
                
        case CircuitBreakerState.HALF_OPEN:
            return this.halfOpenCallsCount < this.config.halfOpenMaxCalls;
                
        default:
            return false;
        }
    }

    // Execute function with timeout
    private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Operation timeout after ${this.config.timeoutDuration}ms for ${this.expertType}`));
            }, this.config.timeoutDuration);

            fn()
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    // Handle successful execution
    private onSuccess(responseTime: number): void {
        this.successfulRequests++;
        this.responseTimes.push(responseTime);
        
        // Keep only recent response times for average calculation
        if (this.responseTimes.length > 100) {
            this.responseTimes = this.responseTimes.slice(-50);
        }

        if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.halfOpenCallsCount++;
            
            // If all half-open calls succeed, close the circuit
            if (this.halfOpenCallsCount >= this.config.halfOpenMaxCalls) {
                this.state = CircuitBreakerState.CLOSED;
                this.failures = []; // Clear failures on recovery
                logger.info('✅ Circuit breaker recovered to CLOSED', {
                    expertType: this.expertType,
                    halfOpenCalls: this.halfOpenCallsCount
                });
                this.emit('stateChanged', { 
                    expertType: this.expertType, 
                    from: CircuitBreakerState.HALF_OPEN, 
                    to: CircuitBreakerState.CLOSED 
                });
                this.emit('circuitClosed', { expertType: this.expertType });
            }
        }
    }

    // Handle failed execution
    private onFailure(error: Error, operation: string): void {
        this.failedRequests++;
        this.lastFailureTime = Date.now();
        
        const failureRecord: FailureRecord = {
            timestamp: this.lastFailureTime,
            error,
            operation
        };
        
        this.failures.push(failureRecord);
        this.cleanupOldFailures();

        // Check if we should open the circuit
        if (this.shouldOpenCircuit()) {
            this.openCircuit();
        }
    }

    // Check if circuit should be opened
    private shouldOpenCircuit(): boolean {
        if (this.state === CircuitBreakerState.OPEN) {
            return false;
        }

        const recentFailures = this.getRecentFailureCount();
        return recentFailures >= this.config.failureThreshold;
    }

    // Open the circuit
    private openCircuit(): void {
        const previousState = this.state;
        this.state = CircuitBreakerState.OPEN;
        this.circuitOpenCount++;
        this.nextRetryTime = Date.now() + this.config.resetTimeout;
        
        logger.warn('🔴 Circuit breaker opened', {
            expertType: this.expertType,
            recentFailures: this.getRecentFailureCount(),
            threshold: this.config.failureThreshold,
            nextRetryTime: new Date(this.nextRetryTime).toISOString()
        });
        
        this.emit('stateChanged', { 
            expertType: this.expertType, 
            from: previousState, 
            to: CircuitBreakerState.OPEN 
        });
        this.emit('circuitOpened', { 
            expertType: this.expertType, 
            failureCount: this.getRecentFailureCount() 
        });
    }

    // Get count of recent failures within monitoring period
    private getRecentFailureCount(): number {
        const cutoffTime = Date.now() - this.config.monitoringPeriod;
        return this.failures.filter(f => f.timestamp > cutoffTime).length;
    }

    // Clean up old failure records
    private cleanupOldFailures(): void {
        const cutoffTime = Date.now() - this.config.monitoringPeriod;
        this.failures = this.failures.filter(f => f.timestamp > cutoffTime);
    }

    // Get current circuit breaker statistics
    public getStats(): CircuitBreakerStats {
        const recentFailures = this.getRecentFailureCount();
        const successRate = this.totalRequests > 0 ? 
            (this.successfulRequests / this.totalRequests) * 100 : 0;
        const averageResponseTime = this.responseTimes.length > 0 ?
            this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;

        return {
            state: this.state,
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            circuitOpenCount: this.circuitOpenCount,
            lastFailureTime: this.lastFailureTime,
            recentFailures,
            successRate,
            averageResponseTime
        };
    }

    // Force circuit to specific state (for testing/manual control)
    public forceState(newState: CircuitBreakerState): void {
        const previousState = this.state;
        this.state = newState;
        
        if (newState === CircuitBreakerState.OPEN) {
            this.nextRetryTime = Date.now() + this.config.resetTimeout;
        } else if (newState === CircuitBreakerState.HALF_OPEN) {
            this.halfOpenCallsCount = 0;
        }
        
        logger.info('🔧 Circuit breaker state forced', {
            expertType: this.expertType,
            from: previousState,
            to: newState
        });
        
        this.emit('stateChanged', { 
            expertType: this.expertType, 
            from: previousState, 
            to: newState 
        });
    }

    // Reset circuit breaker statistics
    public reset(): void {
        this.state = CircuitBreakerState.CLOSED;
        this.failures = [];
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.circuitOpenCount = 0;
        this.lastFailureTime = null;
        this.halfOpenCallsCount = 0;
        this.nextRetryTime = 0;
        this.responseTimes = [];
        
        logger.info('🔄 Circuit breaker reset', { expertType: this.expertType });
        this.emit('circuitReset', { expertType: this.expertType });
    }

    // Start health checking if enabled
    private startHealthChecking(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);

        logger.debug('🏥 Health checking started', {
            expertType: this.expertType,
            interval: this.config.healthCheckInterval
        });
    }

    // Perform health check
    private async performHealthCheck(): Promise<void> {
        try {
            // Only perform health check if circuit is open
            if (this.state !== CircuitBreakerState.OPEN) {
                return;
            }

            // Simple health check - in real implementation, this would ping the service
            const isHealthy = await this.checkExpertHealth();
            
            if (isHealthy) {
                logger.info('💚 Expert health check passed', { expertType: this.expertType });
                // Don't automatically close, but allow transition to half-open
                this.nextRetryTime = Math.min(this.nextRetryTime, Date.now());
            } else {
                logger.debug('❤️ Expert health check failed', { expertType: this.expertType });
            }
        } catch (error) {
            logger.warn('⚠️ Health check error', { 
                expertType: this.expertType, 
                error: (error as Error).message 
            });
        }
    }

    // Check expert health (mock implementation)
    private async checkExpertHealth(): Promise<boolean> {
        // In a real implementation, this would check:
        // - Expert service availability
        // - Response time thresholds
        // - Resource utilization
        return new Promise((resolve) => {
            // Simulate health check
            setTimeout(() => {
                resolve(Math.random() > 0.3); // 70% chance of being healthy
            }, 100);
        });
    }

    // Update circuit breaker configuration
    public updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // Restart health checking if interval changed
        if (newConfig.healthCheckInterval && this.config.enableHealthCheck) {
            this.startHealthChecking();
        }
        
        logger.info('⚙️ Circuit breaker configuration updated', {
            expertType: this.expertType,
            config: this.config
        });
    }

    // Destroy circuit breaker and cleanup resources
    public destroy(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        
        this.removeAllListeners();
        
        logger.info('💥 Circuit breaker destroyed', { expertType: this.expertType });
    }
}

// Circuit breaker manager for handling multiple expert circuit breakers
export class CircuitBreakerManager {
    private circuitBreakers: Map<string, ExpertCircuitBreaker> = new Map();
    private globalConfig: CircuitBreakerConfig;

    constructor(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG) {
        this.globalConfig = config;
        logger.info('🔌 Circuit Breaker Manager initialized');
    }

    // Get or create circuit breaker for expert type
    public getCircuitBreaker(expertType: string, config?: CircuitBreakerConfig): ExpertCircuitBreaker {
        if (!this.circuitBreakers.has(expertType)) {
            const circuitConfig = config || this.globalConfig;
            const circuitBreaker = new ExpertCircuitBreaker(expertType, circuitConfig);
            
            // Forward events with expert identification
            circuitBreaker.on('stateChanged', (event) => {
                this.emit('expertStateChanged', event);
            });
            circuitBreaker.on('circuitOpened', (event) => {
                this.emit('expertCircuitOpened', event);
            });
            circuitBreaker.on('circuitClosed', (event) => {
                this.emit('expertCircuitClosed', event);
            });
            
            this.circuitBreakers.set(expertType, circuitBreaker);
            logger.info('🔌 Created circuit breaker for expert', { expertType });
        }

        return this.circuitBreakers.get(expertType)!;
    }

    // Get statistics for all circuit breakers
    public getAllStats(): Record<string, CircuitBreakerStats> {
        const allStats: Record<string, CircuitBreakerStats> = {};
        
        for (const [expertType, circuitBreaker] of this.circuitBreakers.entries()) {
            allStats[expertType] = circuitBreaker.getStats();
        }

        return allStats;
    }

    // Get overall system health
    public getSystemHealth(): Record<string, any> {
        const allStats = this.getAllStats();
        const expertTypes = Object.keys(allStats);
        
        const openCircuits = expertTypes.filter(expert => 
            allStats[expert].state === CircuitBreakerState.OPEN
        ).length;
        
        const totalRequests = expertTypes.reduce((sum, expert) => 
            sum + allStats[expert].totalRequests, 0
        );
        
        const totalSuccesses = expertTypes.reduce((sum, expert) => 
            sum + allStats[expert].successfulRequests, 0
        );
        
        const overallSuccessRate = totalRequests > 0 ? 
            (totalSuccesses / totalRequests) * 100 : 100;

        return {
            timestamp: new Date().toISOString(),
            totalExperts: expertTypes.length,
            healthyExperts: expertTypes.length - openCircuits,
            faultedExperts: openCircuits,
            overallSuccessRate,
            systemHealthy: openCircuits === 0 && overallSuccessRate >= 90,
            expertStats: allStats
        };
    }

    // Reset all circuit breakers
    public resetAll(): void {
        for (const circuitBreaker of this.circuitBreakers.values()) {
            circuitBreaker.reset();
        }
        logger.info('🔄 All circuit breakers reset');
    }

    // Destroy all circuit breakers
    public destroyAll(): void {
        for (const circuitBreaker of this.circuitBreakers.values()) {
            circuitBreaker.destroy();
        }
        this.circuitBreakers.clear();
        logger.info('💥 All circuit breakers destroyed');
    }

    // Event emitter functionality
    private eventEmitter = new EventEmitter();
    public on = this.eventEmitter.on.bind(this.eventEmitter);
    public emit = this.eventEmitter.emit.bind(this.eventEmitter);
    public removeListener = this.eventEmitter.removeListener.bind(this.eventEmitter);
    public removeAllListeners = this.eventEmitter.removeAllListeners.bind(this.eventEmitter);
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
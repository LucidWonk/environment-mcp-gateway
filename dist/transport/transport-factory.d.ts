/**
 * Transport factory for MCP server supporting both STDIO and HTTP transports
 * Enables backward compatibility and gradual migration from STDIO to HTTP
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SessionManager } from '../session/session-manager.js';
import { SessionAwareToolExecutor } from '../session/session-context.js';
export type TransportType = 'stdio' | 'http';
export interface TransportConfig {
    type: TransportType;
    port?: number;
    enableDualMode?: boolean;
}
export interface TransportHandler {
    start(): Promise<void>;
    stop(): Promise<void>;
    getMetrics(): any;
}
/**
 * STDIO Transport Handler - maintains existing single-client behavior
 */
export declare class StdioTransportHandler implements TransportHandler {
    private sessionManager?;
    private sessionExecutor?;
    private server;
    private transport?;
    constructor(server: Server, sessionManager?: SessionManager | undefined, sessionExecutor?: SessionAwareToolExecutor | undefined);
    start(): Promise<void>;
    stop(): Promise<void>;
    getMetrics(): any;
}
/**
 * HTTP Transport Handler - supports multi-client sessions
 */
export declare class HttpTransportHandler implements TransportHandler {
    private baseServer;
    private sessionManager;
    private sessionExecutor;
    private port;
    private httpServer?;
    private sessionServers;
    private sseTransports;
    constructor(baseServer: Server, sessionManager: SessionManager, sessionExecutor: SessionAwareToolExecutor, port?: number);
    start(): Promise<void>;
    stop(): Promise<void>;
    private handleMCPConnection;
    private createSessionServer;
    /**
     * Setup request handlers for session-specific server with session context
     */
    private setupSessionHandlers;
    /**
     * Execute tool with session context for proper multi-client isolation
     */
    private executeToolWithSessionContext;
    /**
     * Analyze solution structure tool implementation
     */
    private analyzeSolutionStructure;
    /**
     * Get development environment status tool implementation
     */
    private getDevelopmentEnvironmentStatus;
    /**
     * Helper methods for tool implementations
     */
    private checkDatabaseStatus;
    private checkDockerStatus;
    private checkGitStatus;
    private checkSolutionStatus;
    /**
     * MCP Server Self-Diagnostic tool implementation
     * Comprehensive validation of all MCP capabilities and system health
     */
    private mcpServerSelfDiagnostic;
    /**
     * Test MCP protocol compliance
     */
    private testMcpProtocolCompliance;
    /**
     * Test tool registry functionality
     */
    private testToolRegistryFunctionality;
    /**
     * Test session management functionality
     */
    private testSessionManagement;
    /**
     * Test infrastructure tools functionality
     */
    private testInfrastructureTools;
    /**
     * Test environment configuration
     */
    private testEnvironmentConfiguration;
    /**
     * Test transport layer functionality
     */
    private testTransportLayer;
    /**
     * Performance benchmarks (optional)
     */
    private performPerformanceTests;
    /**
     * Generate recommendations for failed components
     */
    private generateRecommendation;
    private handleHealthCheck;
    private handleStatusCheck;
    private handleCORSPreflight;
    private handleMetrics;
    private handleMCPHTTPRequest;
    /**
     * Handle MCP POST requests - could be for SSE session or standalone HTTP
     */
    private handleMCPPOSTRequest;
    /**
     * Extract session ID from request for SSE POST message routing
     */
    private extractSessionIdFromRequest;
    getMetrics(): any;
}
/**
 * Transport Factory - creates and manages transport handlers based on configuration
 */
export declare class TransportFactory {
    private static instance?;
    private currentHandler?;
    private constructor();
    static getInstance(): TransportFactory;
    /**
     * Create transport handler based on configuration
     */
    createTransportHandler(config: TransportConfig, server: Server, sessionManager?: SessionManager, sessionExecutor?: SessionAwareToolExecutor): TransportHandler;
    /**
     * Get transport configuration from environment
     */
    getTransportConfigFromEnvironment(): TransportConfig;
    /**
     * Set the current active transport handler
     */
    setCurrentHandler(handler: TransportHandler): void;
    /**
     * Get metrics from current transport handler
     */
    getCurrentMetrics(): any;
}
//# sourceMappingURL=transport-factory.d.ts.map
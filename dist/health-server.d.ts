/**
 * Simple HTTP health check server for Docker health checks
 * Runs alongside the MCP server to provide health status
 */
export declare class HealthServer {
    private server;
    private readonly port;
    constructor(port?: number);
    private createServer;
    private handleHealthCheck;
    private handleStatusCheck;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=health-server.d.ts.map
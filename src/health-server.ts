import http from 'http';
import { Environment } from './domain/config/environment.js';

/**
 * Simple HTTP health check server for Docker health checks
 * Runs alongside the MCP server to provide health status
 */
export class HealthServer {
    private server: http.Server;
    private readonly port: number;

    constructor(port: number = 3001) {
        this.port = port;
        this.server = this.createServer();
    }

    private createServer(): http.Server {
        return http.createServer((req, res) => {
            // Set CORS headers for development
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (req.url === '/health' && req.method === 'GET') {
                this.handleHealthCheck(res);
            } else if (req.url === '/status' && req.method === 'GET') {
                this.handleStatusCheck(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });
    }

    private handleHealthCheck(res: http.ServerResponse): void {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthStatus));
    }

    private handleStatusCheck(res: http.ServerResponse): void {
        const statusInfo = {
            status: 'running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                env: process.env.NODE_ENV || 'development'
            },
            mcp: {
                logLevel: Environment.mcpLogLevel,
                configured: true
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statusInfo, null, 2));
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, '0.0.0.0', () => {
                // Only log in development mode, not during MCP operations
                const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.MCP_SILENT_MODE;
                if (isDevelopment) {
                    console.info(`Health server listening on http://0.0.0.0:${this.port}`);
                    console.info(`Health check: http://0.0.0.0:${this.port}/health`);
                    console.info(`Status check: http://0.0.0.0:${this.port}/status`);
                }
                resolve();
            });

            this.server.on('error', (error) => {
                reject(error);
            });
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            this.server.close(() => {
                resolve();
            });
        });
    }
}
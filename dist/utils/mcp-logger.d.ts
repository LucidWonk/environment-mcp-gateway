import winston from 'winston';
/**
 * Shared logger utility that respects MCP_SILENT_MODE
 * This prevents console output contamination during MCP JSON-RPC operations
 */
export declare function createMCPLogger(logFilename: string): winston.Logger;
/**
 * Shared logger with colorized console output for services that need it
 */
export declare function createMCPLoggerWithColor(logFilename: string): winston.Logger;
//# sourceMappingURL=mcp-logger.d.ts.map
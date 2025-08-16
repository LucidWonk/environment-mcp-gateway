import winston from 'winston';

/**
 * Shared logger utility that respects MCP_SILENT_MODE
 * This prevents console output contamination during MCP JSON-RPC operations
 */
export function createMCPLogger(logFilename: string): winston.Logger {
    const transports: winston.transport[] = [
        new winston.transports.File({ filename: logFilename })
    ];

    // Only add console transport if not in MCP silent mode
    if (!process.env.MCP_SILENT_MODE) {
        transports.push(new winston.transports.Console());
    }

    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
        transports
    });
}

/**
 * Shared logger with colorized console output for services that need it
 */
export function createMCPLoggerWithColor(logFilename: string): winston.Logger {
    const transports: winston.transport[] = [
        new winston.transports.File({ 
            filename: logFilename,
            format: winston.format.json()
        })
    ];

    // Only add console transport if not in MCP silent mode
    if (!process.env.MCP_SILENT_MODE) {
        transports.push(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }));
    }

    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let logString = `${timestamp} [${level.toUpperCase()}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                    logString += ` ${JSON.stringify(meta, null, 2)}`;
                }
                return logString;
            })
        ),
        transports
    });
}
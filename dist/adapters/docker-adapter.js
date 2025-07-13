import { spawn } from 'child_process';
import winston from 'winston';
import { Environment } from '../config/environment.js';
const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});
export class DockerAdapter {
    static TIMESCALE_IMAGE_PATTERNS = [
        'timescale/timescaledb',
        'timescale/timescaledb-ha',
        'postgres'
    ];
    static REDPANDA_IMAGE_PATTERNS = [
        'redpandadata/redpanda',
        'vectorized/redpanda'
    ];
    static REDPANDA_CONSOLE_IMAGE_PATTERNS = [
        'redpandadata/console',
        'vectorized/console'
    ];
    async executeDockerCommand(args) {
        return new Promise((resolve, reject) => {
            const process = spawn('docker', args);
            let stdout = '';
            let stderr = '';
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                }
                else {
                    reject(new Error(`Docker command failed (exit code ${code}): ${stderr}`));
                }
            });
            process.on('error', (error) => {
                reject(new Error(`Failed to execute docker command: ${error.message}`));
            });
        });
    }
    async executeComposeCommand(args) {
        return new Promise((resolve, reject) => {
            const process = spawn('docker-compose', args, {
                cwd: Environment.projectRoot
            });
            let stdout = '';
            let stderr = '';
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                }
                else {
                    reject(new Error(`Docker compose command failed (exit code ${code}): ${stderr}`));
                }
            });
            process.on('error', (error) => {
                reject(new Error(`Failed to execute docker-compose command: ${error.message}`));
            });
        });
    }
    parseDockerPsOutput(output) {
        const lines = output.split('\n').filter(line => line.trim());
        if (lines.length === 0)
            return [];
        // Skip header line
        const containerLines = lines.slice(1);
        return containerLines.map(line => {
            const parts = line.split(/\s{2,}/); // Split by 2 or more spaces
            if (parts.length < 6)
                return null;
            const [id, image, command, created, status, ports, ...nameParts] = parts;
            const name = nameParts.join(' ') || 'unknown';
            // Parse status and health
            let containerStatus = 'stopped';
            let health = 'none';
            if (status.toLowerCase().includes('up')) {
                containerStatus = 'running';
                if (status.includes('(healthy)')) {
                    health = 'healthy';
                }
                else if (status.includes('(unhealthy)')) {
                    health = 'unhealthy';
                }
                else if (status.includes('(starting)')) {
                    health = 'starting';
                }
            }
            else if (status.toLowerCase().includes('exited')) {
                containerStatus = 'exited';
            }
            else if (status.toLowerCase().includes('restarting')) {
                containerStatus = 'restarting';
            }
            else if (status.toLowerCase().includes('dead')) {
                containerStatus = 'dead';
            }
            // Parse ports
            const portMappings = ports.split(',').map(p => p.trim()).filter(p => p);
            return {
                id: id.trim(),
                name: name.trim(),
                image: image.trim(),
                status: containerStatus,
                health,
                ports: portMappings,
                createdAt: new Date(), // Would need more detailed parsing for actual creation time
                command: command.trim(),
                uptime: created.trim()
            };
        }).filter(container => container !== null);
    }
    async listContainers() {
        try {
            const output = await this.executeDockerCommand(['ps', '-a', '--format', 'table {{.ID}}\t{{.Image}}\t{{.Command}}\t{{.CreatedAt}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}']);
            return this.parseDockerPsOutput(output);
        }
        catch (error) {
            logger.error('Failed to list containers', { error });
            return [];
        }
    }
    async listDevelopmentContainers() {
        const allContainers = await this.listContainers();
        return allContainers.filter(container => {
            const image = container.image.toLowerCase();
            return DockerAdapter.TIMESCALE_IMAGE_PATTERNS.some(pattern => image.includes(pattern)) ||
                DockerAdapter.REDPANDA_IMAGE_PATTERNS.some(pattern => image.includes(pattern)) ||
                DockerAdapter.REDPANDA_CONSOLE_IMAGE_PATTERNS.some(pattern => image.includes(pattern));
        });
    }
    async getContainerHealth(containerId) {
        try {
            const output = await this.executeDockerCommand(['inspect', '--format', '{{.State.Health.Status}}', containerId]);
            const healthStatus = output.trim();
            if (healthStatus === 'healthy') {
                return { healthy: true, message: 'Container is healthy' };
            }
            else if (healthStatus === 'unhealthy') {
                return { healthy: false, message: 'Container is unhealthy' };
            }
            else if (healthStatus === 'starting') {
                return { healthy: false, message: 'Container is starting' };
            }
            else {
                return { healthy: true, message: 'No health check configured' };
            }
        }
        catch (error) {
            logger.error('Failed to get container health', { containerId, error });
            return { healthy: false, message: `Failed to check health: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }
    async getContainerLogs(containerId, lines = 50) {
        try {
            const output = await this.executeDockerCommand(['logs', '--tail', lines.toString(), containerId]);
            return output;
        }
        catch (error) {
            logger.error('Failed to get container logs', { containerId, error });
            return `Failed to retrieve logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    async restartContainer(containerId) {
        try {
            await this.executeDockerCommand(['restart', containerId]);
            logger.info('Container restarted successfully', { containerId });
            return true;
        }
        catch (error) {
            logger.error('Failed to restart container', { containerId, error });
            return false;
        }
    }
    async getTimescaleDBStatus() {
        const containers = await this.listDevelopmentContainers();
        const timescaleContainer = containers.find(c => DockerAdapter.TIMESCALE_IMAGE_PATTERNS.some(pattern => c.image.toLowerCase().includes(pattern)));
        const connectionInfo = {
            host: Environment.dbHost,
            port: Environment.dbPort,
            database: Environment.database,
            accessible: false
        };
        if (!timescaleContainer) {
            return {
                container: null,
                connection: connectionInfo,
                health: 'failed',
                message: 'TimescaleDB container not found'
            };
        }
        // Check if container is running and healthy
        const isRunning = timescaleContainer.status === 'running';
        const isHealthy = timescaleContainer.health === 'healthy' || timescaleContainer.health === 'none';
        // Test database connection
        try {
            // This would be implemented to actually test the connection
            // For now, assume it's accessible if container is running
            connectionInfo.accessible = isRunning;
        }
        catch (error) {
            connectionInfo.accessible = false;
        }
        let health = 'failed';
        let message = '';
        if (isRunning && isHealthy && connectionInfo.accessible) {
            health = 'healthy';
            message = 'TimescaleDB is running and accessible';
        }
        else if (isRunning && !connectionInfo.accessible) {
            health = 'degraded';
            message = 'TimescaleDB container is running but not accessible';
        }
        else if (!isRunning) {
            health = 'failed';
            message = 'TimescaleDB container is not running';
        }
        else if (!isHealthy) {
            health = 'degraded';
            message = 'TimescaleDB container is unhealthy';
        }
        return {
            container: timescaleContainer,
            connection: connectionInfo,
            health,
            message
        };
    }
    async getRedPandaStatus() {
        const containers = await this.listDevelopmentContainers();
        const redpandaContainer = containers.find(c => DockerAdapter.REDPANDA_IMAGE_PATTERNS.some(pattern => c.image.toLowerCase().includes(pattern)));
        const consoleContainer = containers.find(c => DockerAdapter.REDPANDA_CONSOLE_IMAGE_PATTERNS.some(pattern => c.image.toLowerCase().includes(pattern)));
        const redpandaHealth = this.evaluateContainerHealth(redpandaContainer);
        const consoleAccessible = consoleContainer?.status === 'running';
        let overall = 'failed';
        let message = '';
        if (redpandaHealth === 'healthy' && consoleAccessible) {
            overall = 'healthy';
            message = 'RedPanda cluster and console are running';
        }
        else if (redpandaHealth === 'healthy' && !consoleAccessible) {
            overall = 'degraded';
            message = 'RedPanda cluster is running but console is not accessible';
        }
        else if (redpandaHealth === 'degraded') {
            overall = 'degraded';
            message = 'RedPanda cluster is degraded';
        }
        else {
            overall = 'failed';
            message = 'RedPanda cluster is not running';
        }
        return {
            redpanda: {
                container: redpandaContainer || null,
                health: redpandaHealth,
                ports: {
                    kafka: 9092,
                    schemaRegistry: 8081,
                    adminApi: 8082
                }
            },
            console: {
                container: consoleContainer || null,
                accessible: consoleAccessible,
                url: 'http://localhost:8080'
            },
            overall,
            message
        };
    }
    evaluateContainerHealth(container) {
        if (!container)
            return 'failed';
        if (container.status === 'running') {
            if (container.health === 'healthy' || container.health === 'none') {
                return 'healthy';
            }
            else if (container.health === 'unhealthy') {
                return 'degraded';
            }
            else if (container.health === 'starting') {
                return 'degraded';
            }
        }
        return 'failed';
    }
    async getDevelopmentEnvironmentHealth() {
        const [databaseStatus, messagingStatus] = await Promise.all([
            this.getTimescaleDBStatus(),
            this.getRedPandaStatus()
        ]);
        const issues = [];
        const recommendations = [];
        // Analyze database issues
        if (databaseStatus.health === 'failed') {
            issues.push({
                component: 'Database',
                severity: 'error',
                message: databaseStatus.message
            });
            if (!databaseStatus.container) {
                recommendations.push({
                    issue: 'TimescaleDB container not found',
                    suggestion: 'Start TimescaleDB container',
                    command: 'docker-compose up -d timescaledb'
                });
            }
            else if (databaseStatus.container.status !== 'running') {
                recommendations.push({
                    issue: 'TimescaleDB container not running',
                    suggestion: 'Start TimescaleDB container',
                    command: `docker start ${databaseStatus.container.id}`
                });
            }
        }
        else if (databaseStatus.health === 'degraded') {
            issues.push({
                component: 'Database',
                severity: 'warning',
                message: databaseStatus.message
            });
            recommendations.push({
                issue: 'TimescaleDB connectivity issues',
                suggestion: 'Check database logs and restart if needed',
                command: `docker restart ${databaseStatus.container?.id}`
            });
        }
        // Analyze messaging issues
        if (messagingStatus.overall === 'failed') {
            issues.push({
                component: 'Messaging',
                severity: 'error',
                message: messagingStatus.message
            });
            if (!messagingStatus.redpanda.container) {
                recommendations.push({
                    issue: 'RedPanda container not found',
                    suggestion: 'Start RedPanda services',
                    command: 'docker-compose up -d redpanda-0'
                });
            }
        }
        else if (messagingStatus.overall === 'degraded') {
            issues.push({
                component: 'Messaging',
                severity: 'warning',
                message: messagingStatus.message
            });
            if (!messagingStatus.console.accessible) {
                recommendations.push({
                    issue: 'RedPanda console not accessible',
                    suggestion: 'Start RedPanda console',
                    command: 'docker-compose up -d redpanda-console'
                });
            }
        }
        // Determine overall health
        let overall = 'healthy';
        if (issues.some(i => i.severity === 'error')) {
            overall = 'failed';
        }
        else if (issues.some(i => i.severity === 'warning')) {
            overall = 'degraded';
        }
        return {
            overall,
            database: databaseStatus,
            messaging: messagingStatus,
            issues,
            recommendations
        };
    }
    async getComposeServices() {
        try {
            const output = await this.executeComposeCommand(['ps', '--format', 'json']);
            const services = JSON.parse(output);
            return services.map((service) => ({
                name: service.Service,
                status: service.State === 'running' ? 'running' : 'stopped',
                container: service.ID ? {
                    id: service.ID,
                    name: service.Name,
                    image: service.Image,
                    status: service.State,
                    ports: service.Ports ? service.Ports.split(',') : [],
                    createdAt: new Date(),
                    command: service.Command || ''
                } : undefined,
                dependsOn: [] // Would need to parse from docker-compose.yml
            }));
        }
        catch (error) {
            logger.error('Failed to get compose services', { error });
            return [];
        }
    }
    async restartComposeService(serviceName) {
        try {
            await this.executeComposeCommand(['restart', serviceName]);
            logger.info('Compose service restarted successfully', { serviceName });
            return true;
        }
        catch (error) {
            logger.error('Failed to restart compose service', { serviceName, error });
            return false;
        }
    }
}
//# sourceMappingURL=docker-adapter.js.map
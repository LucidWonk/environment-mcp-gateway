# Environment MCP Gateway - Docker Deployment

This directory contains Docker configuration files for containerizing and deploying the Environment MCP Gateway service.

## Files

- `Dockerfile.multistage` - Multi-stage Dockerfile with build validation
- `docker-compose.vs2022.yml` - Docker Compose for VS2022 integration  
- `build.sh` - Build script for Docker images
- `deploy.sh` - Deployment management script

## Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose v2.0+
- Git (for build metadata)
- Your Lucidwonks project built and tested in Visual Studio 2022

## Quick Start

1. **Set your project path** (adjust as needed):
   ```bash
   export LUCIDWONKS_PROJECT_PATH="M:/Projects/Lucidwonks"
   ```

2. **Build the Docker image**:
   ```bash
   cd EnvironmentMCPGateway
   chmod +x docker/build.sh
   ./docker/build.sh
   ```

3. **Start the services**:
   ```bash
   chmod +x docker/deploy.sh
   ./docker/deploy.sh start
   ```

4. **Check health**:
   ```bash
   ./docker/deploy.sh health
   ```

## Configuration

### Environment Variables

Set these in your `.env.development` file:

```bash
# MCP Server Configuration
NODE_ENV=production
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info
PROJECT_ROOT=/workspace

# Database Configuration  
DATABASE_URL=postgresql://postgres:password@timescaledb:5432/pricehistorydb

# Optional: Enable health server in development
ENABLE_HEALTH_SERVER=true
```

### Volume Mounts

The container mounts your VS2022 project directory as read-only to:
- `/workspace` - Your Lucidwonks project directory

Persistent volumes for MCP server data:
- `mcp_cache` - Semantic analysis cache
- `mcp_rollback` - Holistic update rollback data  
- `mcp_atomic` - Atomic operation files

## Deployment Commands

```bash
# Start all services
./docker/deploy.sh start

# Stop all services  
./docker/deploy.sh stop

# Restart services
./docker/deploy.sh restart

# View service status
./docker/deploy.sh status

# View logs
./docker/deploy.sh logs
./docker/deploy.sh logs -f  # Follow logs

# Check health
./docker/deploy.sh health

# Clean up everything (removes data!)
./docker/deploy.sh clean
```

## Health Checks

The containerized MCP server includes health endpoints:

- `http://localhost:3001/health` - Simple health check
- `http://localhost:3001/status` - Detailed status information

Docker health checks run automatically every 30 seconds.

## Integration with Claude Code

To use the containerized MCP server with Claude Code:

1. **Start the container**:
   ```bash
   ./docker/deploy.sh start
   ```

2. **Configure Claude Code** to use the containerized server:
   - Update your MCP client configuration to point to `localhost:3001`
   - Ensure the container has access to your project files

3. **Verify connection**:
   ```bash
   curl http://localhost:3001/health
   ```

## Development Workflow

1. **Make changes** in Visual Studio 2022
2. **Run tests** and validate in VS2022
3. **Rebuild container**:
   ```bash
   ./docker/build.sh
   ./docker/deploy.sh restart
   ```
4. **Test with Claude Code** using the containerized server

## Troubleshooting

### Container won't start
- Check logs: `./docker/deploy.sh logs`
- Verify environment variables in `.env.development`
- Check port 3001 isn't already in use

### Health check fails
- Check if the application is listening on `0.0.0.0:3001` 
- Verify health server is enabled with `ENABLE_HEALTH_SERVER=true`
- Check container logs for startup errors

### Project files not accessible
- Verify `LUCIDWONKS_PROJECT_PATH` environment variable
- Check volume mount in `docker-compose.vs2022.yml`
- Ensure file permissions allow container access

### Database connection issues
- Check TimescaleDB health: `./docker/deploy.sh health`
- Verify database URL in environment configuration
- Check if TimescaleDB container is running

## Security Notes

- Container runs as non-root user (`mcpuser`)
- Project directory is mounted read-only
- Health server only exposes status endpoints
- No sensitive data in container images

## Performance

- Multi-stage build reduces final image size
- Build validation ensures quality
- Health checks enable proper orchestration
- Persistent volumes prevent data loss
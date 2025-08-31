# Container-Only MCP Server Configuration

## Summary

Your MCP server is now configured to **only run in Docker containers**, preventing Claude Code from spinning up local WSL instances.

## What Changed

### 1. Container Detection Guard
Added automatic container detection in `src/server.ts`:
- Checks for `CONTAINER=true`, `DOCKER=true`, `/.dockerenv` file, or Kubernetes environment
- Gracefully exits with helpful message if not in container
- Provides override option for local development when needed

### 2. Updated Docker Configuration
- **Dockerfile**: Sets `CONTAINER=true` and `DOCKER=true` environment variables
- **docker-compose.yml**: Explicitly sets container environment variables
- Container runs on port 3002 externally (maps to 3001 internally)

### 3. Package.json Script Changes
```bash
# Now shows container-only message
npm run dev

# For Docker container management
npm run docker:up      # Start MCP server in container
npm run docker:down    # Stop container
npm run docker:logs    # View container logs
npm run docker:health  # Check container health
npm run docker:status  # Check container status

# Emergency local override (for debugging only)
npm run dev:force      # Forces local execution
```

### 4. Claude Code Integration
- **`.claudeignore`**: Prevents Claude Code from trying to execute server locally
- MCP server will only be accessible when running in Docker

## Usage

### Starting MCP Server (Container Only)
```bash
# Build and start the container
npm run docker:up

# Check if it's running
npm run docker:status

# View logs
npm run docker:logs

# Check health
npm run docker:health
```

### Accessing the Server
- **Container Health**: `http://localhost:3002/health`
- **Container Status**: `http://localhost:3002/status`
- **MCP Endpoint**: `http://localhost:3002/mcp`

### Stopping the Server
```bash
# Stop the container
npm run docker:down
```

## What Happens Now

### When Claude Code Tries to Start MCP Server Locally:
```
🐳 MCP server is configured for container-only execution.
📋 To run locally for development, use: FORCE_LOCAL_MCP=true npm run dev:local
🚀 To run in Docker: docker-compose up -d environment-mcp-gateway
```

### When You Run `npm run dev:local` Without Container:
```
🐳 MCP server is configured for container-only execution.
📋 To run locally for development, use: FORCE_LOCAL_MCP=true npm run dev:local
🚀 To run in Docker: docker-compose up -d environment-mcp-gateway
```

### When Container Starts:
- ✅ Container detection passes
- ✅ MCP server starts normally
- ✅ Health endpoints available on port 3002
- ✅ Proper logging and monitoring

## Emergency Override

If you need to run locally for debugging:
```bash
# Force local execution (bypasses container guard)
FORCE_LOCAL_MCP=true npm run dev:local

# Or use the npm script
npm run dev:force
```

## Configuration Files Changed

- **`src/server.ts`**: Added container detection guard
- **`docker/Dockerfile`**: Added container environment variables
- **`docker/docker-compose.yml`**: Explicit container flags
- **`package.json`**: Container-focused scripts
- **`.claudeignore`**: Prevents Claude Code auto-execution
- **`README-CONTAINER-ONLY.md`**: This documentation

## Benefits

1. **No More Local Instances**: Claude Code can't accidentally spin up WSL servers
2. **Consistent Environment**: Always runs in controlled Docker environment
3. **No Platform Issues**: Container has correct binaries and dependencies
4. **Proper Isolation**: Container-specific volumes and networking
5. **Health Monitoring**: Built-in health checks and status endpoints
6. **Easy Management**: Simple Docker commands for all operations

## Integration with Claude Code

Claude Code should now:
- ✅ Not start local MCP server instances
- ✅ Connect to your Docker container at `localhost:3002`
- ✅ Use the containerized MCP server for all operations

Your MCP server is now strictly container-only! 🐳
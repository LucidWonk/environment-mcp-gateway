# MCP Server Stability Guide

## Problem Analysis

Your MCP server instability was caused by **cross-platform binary conflicts** in WSL environments. Here's what happened:

### Root Causes

1. **esbuild Platform Mismatch**: Node modules installed on Windows contain `@esbuild/win32-x64` binaries, but WSL requires `@esbuild/linux-x64`
2. **Environment Switching**: Moving between Windows/WSL/Docker without rebuilding dependencies
3. **Process Management**: Multiple server instances and unclear startup/shutdown processes
4. **Dependency Cache Issues**: npm cache containing wrong platform binaries

## Stability Solution

### Quick Commands

```bash
# Start server with stability checks
npm run start:stable

# Stop all MCP processes cleanly  
npm run stop

# Complete reset (fixes all platform issues)
npm run reset

# Health monitoring
npm run health
npm run status
```

### Detailed Usage

#### Starting the Server
```bash
# Recommended: Use the stability script
./start-stable.sh

# Alternative: Regular start
npm run dev
```

The stability script:
- ✅ Detects WSL environment automatically
- ✅ Cleans up conflicting processes
- ✅ Verifies platform-correct dependencies
- ✅ Performs health checks with retry logic
- ✅ Provides comprehensive logging

#### Stopping the Server
```bash
# Graceful shutdown
./stop-mcp.sh

# Or use npm script
npm run stop
```

#### Complete Reset (When Things Go Wrong)
```bash
# Nuclear option - fixes everything
npm run reset
```

This will:
1. Stop all processes
2. Remove dist, node_modules, package-lock.json
3. Reinstall dependencies with correct platform binaries

### Prevention Measures

#### 1. Platform-Specific Configuration
- **`.npmrc`**: Forces Linux binaries in WSL
- **`.nvmrc`**: Locks Node.js version
- **`package.json`**: Added stability scripts

#### 2. Environment Detection
The stability script automatically detects:
- WSL vs native Linux
- Wrong platform binaries
- Port conflicts
- Stale processes

#### 3. Process Management
- PID file tracking (`.mcp-server.pid`)
- Graceful shutdown with fallback to force-kill
- Port conflict resolution
- Lock file cleanup

## Common Issues & Solutions

### Issue: "esbuild platform mismatch"
**Solution**: Run `npm run reset` - this completely rebuilds dependencies for your current platform.

### Issue: "Port 3001 already in use"
**Solution**: Run `npm run stop` before starting, or the stability script handles this automatically.

### Issue: Server starts but doesn't respond
**Solution**: Check logs in `environment-mcp-gateway.log` and use health endpoints.

### Issue: Multiple server instances
**Solution**: Always use `npm run stop` before starting, or use `npm run start:stable` which handles cleanup.

## Monitoring & Health Checks

### Health Endpoints
- **Health**: `http://localhost:3001/health` - Basic server status
- **Status**: `http://localhost:3001/status` - Detailed metrics and session info
- **MCP**: `http://localhost:3001/mcp` - MCP protocol endpoint

### Quick Health Check
```bash
# Check if server is responding
curl http://localhost:3001/health

# Or use npm script
npm run health
```

### Log Monitoring
```bash
# Watch real-time logs
tail -f environment-mcp-gateway.log

# View startup logs
head -50 environment-mcp-gateway.log
```

## Best Practices

### 1. Always Use Stability Scripts
- Use `npm run start:stable` instead of `npm run dev`
- Use `npm run stop` instead of Ctrl+C
- Use `npm run reset` when switching environments

### 2. Environment Consistency
- Stay in WSL when developing (don't switch to Windows)
- Don't copy `node_modules` between environments
- Use `npm run reset` after environment switches

### 3. Regular Maintenance
```bash
# Weekly dependency refresh
npm run reset

# Clean up old processes
npm run stop
```

### 4. Debugging Issues
1. Check logs: `tail environment-mcp-gateway.log`
2. Check health: `npm run health`
3. Check processes: `ps aux | grep tsx`
4. Nuclear reset: `npm run reset`

## Environment-Specific Notes

### WSL (Your Current Setup)
- Automatic platform detection enabled
- Linux binary enforcement via `.npmrc`
- Cross-platform conflict prevention

### Docker
- Use `npm run start` (not stability script)
- Health server runs on port 4001
- Container-specific optimizations

### Native Linux/macOS
- Stability script works but less critical
- Platform detection still beneficial
- Same stability features available

## Files Added for Stability

- **`start-stable.sh`**: Comprehensive server startup with health checks
- **`stop-mcp.sh`**: Clean server shutdown with process cleanup  
- **`.npmrc`**: Platform-specific npm configuration
- **`.nvmrc`**: Node.js version specification
- **`README-MCP-STABILITY.md`**: This documentation

## Success Indicators

When stable, you should see:
- ✅ Server starts in < 10 seconds
- ✅ Health endpoint responds immediately
- ✅ No platform mismatch errors
- ✅ Single server process running
- ✅ Clean startup/shutdown logs

Your MCP server should now be rock-solid stable! 🚀
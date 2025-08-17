# MCP Server Diagnostic Report
Generated: 2025-08-17

## Executive Summary
The MCP server container is running and healthy, but the connection mechanism is incorrectly configured. Each connection attempt from Claude creates a new server instance instead of connecting to the existing one.

## Current State Analysis

### ✅ Working Components
1. **Container Health**: Container `environment-mcp-gateway` is running and healthy
   - Started: 32 minutes ago
   - Health checks: Passing every 30 seconds
   - Port: 3001 exposed and available
   - Process: Node server running as PID 1 in container

2. **Infrastructure**: All supporting services operational
   - TimescaleDB: Running and healthy (port 5432)
   - RedPanda: Running and healthy (port 9092)
   - RedPanda Console: Running (port 8080)

3. **Configuration Files**: Valid and present
   - `mcp-server-config.json`: Configured for docker exec
   - `claude_desktop_config.json`: Configured for docker exec
   - Both configs target the correct container name

### ❌ Root Cause Identified

**Problem**: The MCP server architecture conflict
- The server uses `StdioServerTransport` which expects STDIO communication
- Each `docker exec` command starts a NEW Node.js process
- The container CMD runs `node dist/server.js` continuously
- Claude's connection attempts via `docker exec -i` create duplicate processes

**Evidence from logs**:
```
Multiple initialization sequences showing:
- "Process starting" with different PIDs
- "Initializing EnvironmentMCPGateway components" repeated
- No "Process exiting" messages between initializations
```

## The Architecture Mismatch

### Current Flow (Broken)
1. Container starts with `node dist/server.js` (PID 1)
2. Server initializes and waits for STDIO input
3. Claude attempts connection via `docker exec -i ... node dist/server.js`
4. This starts a SECOND server instance (new PID)
5. The new instance tries to initialize but can't properly communicate
6. Connection fails or behaves unpredictably

### Expected Flow
1. Container should either:
   - Option A: Run a persistent server that Claude connects to via a protocol
   - Option B: Start fresh for each connection (container should idle, not run server)

## Solution Options

### Option 1: Idle Container Pattern (Recommended)
**Concept**: Container stays idle, server starts only when Claude connects

**Implementation**:
1. Update Dockerfile CMD to idle command (e.g., `tail -f /dev/null`)
2. Claude connects via `docker exec` and starts server fresh each time
3. Server runs for duration of Claude session then exits

**Pros**:
- Clean process lifecycle
- No conflicting instances
- Matches MCP STDIO design pattern

**Cons**:
- Health checks need adjustment
- Container appears "idle" when not in use

### Option 2: Persistent Server with Protocol
**Concept**: Run server persistently with proper IPC mechanism

**Implementation**:
1. Modify server to support named pipes or TCP socket
2. Keep server running continuously
3. Claude connects to existing server via protocol

**Pros**:
- Server always ready
- No startup delay

**Cons**:
- Requires significant code changes
- More complex architecture

### Option 3: Process Manager Pattern
**Concept**: Use a process manager to ensure single instance

**Implementation**:
1. Add process manager (e.g., supervisor) to container
2. Configure to maintain single server instance
3. Handle connection routing

**Pros**:
- Robust process management
- Can handle crashes/restarts

**Cons**:
- Additional complexity
- More components to maintain

## Recommended Immediate Fix

### Step 1: Update Dockerfile
```dockerfile
# Change the CMD to idle
CMD ["tail", "-f", "/dev/null"]
```

### Step 2: Adjust Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD echo "Container Ready" || exit 1
```

### Step 3: Keep MCP Configuration
The existing configuration in `claude_desktop_config.json` is correct and will work once the container is idling properly.

## Enhanced Logging Added
I've added comprehensive process lifecycle logging to help diagnose future issues:

1. **Process Start Logging**: Captures PID, parent PID, arguments, and environment
2. **Signal Handlers**: Logs SIGINT, SIGTERM, and exit events
3. **Connection Logging**: Enhanced STDIO connection attempt logging
4. **Error Handling**: Better error capture and reporting

## Testing Plan

### After Implementation:
1. Rebuild container with updated Dockerfile
2. Start container and verify it's idling
3. Test MCP connection: 
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test","version":"1.0.0"},"capabilities":{}}}' | \
   docker exec -i -e MCP_STDIO_MODE=true environment-mcp-gateway node dist/server.js
   ```
4. Verify single process lifecycle in logs
5. Test with Claude actual connection

## Monitoring Improvements
The enhanced logging will now show:
- Process lifecycle (start/stop)
- Connection attempts with process IDs
- Parent/child process relationships
- STDIO mode detection
- Health check interactions

## Next Steps
1. **Immediate**: Request container rebuild with Dockerfile fix
2. **Short-term**: Monitor logs with enhanced logging
3. **Long-term**: Consider Option 2 for production robustness

## Log Analysis Commands
```bash
# View process lifecycle events
docker logs environment-mcp-gateway 2>&1 | grep -E "🎬|⏹️|🛑"

# View connection attempts
docker logs environment-mcp-gateway 2>&1 | grep -E "processId|parentProcessId"

# Check for multiple initializations
docker logs environment-mcp-gateway 2>&1 | grep "Initializing EnvironmentMCPGateway"
```

## Conclusion
The issue is a fundamental architecture mismatch between:
- How the container runs the server (persistent process)
- How Claude expects to connect (fresh process per connection)

The recommended fix (Option 1) aligns the container behavior with Claude's expectations and requires minimal code changes.
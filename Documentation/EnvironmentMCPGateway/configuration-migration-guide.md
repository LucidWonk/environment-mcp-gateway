# MCP Transport Configuration Migration Guide

## **Overview**

This guide helps migrate from STDIO to HTTP transport for the EnvironmentMCPGateway, enabling multi-client support while maintaining backward compatibility.

## **Transport Options**

### **HTTP Transport (Recommended)**
- **Multi-client support**: Multiple Claude Code instances can connect concurrently
- **Session management**: Each client gets isolated execution context
- **Enhanced monitoring**: Comprehensive metrics and health endpoints
- **Scalability**: Better resource utilization and concurrent processing

### **STDIO Transport (Legacy)**
- **Single-client**: Traditional one-to-one client-server communication
- **Backward compatibility**: Existing configurations continue working
- **Minimal resources**: Lower memory footprint for single-user scenarios

## **Environment Configuration**

### **Configuration Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT_TYPE` | `http` | Transport type: `http` or `stdio` |
| `MCP_SERVER_PORT` | `3001` | HTTP server port (HTTP transport only) |
| `MCP_LOG_LEVEL` | `info` | Logging level: `error`, `warn`, `info`, `debug` |
| `MCP_ENABLE_DUAL_TRANSPORT` | `false` | Enable both STDIO and HTTP simultaneously |

### **Example Configurations**

#### **HTTP Transport (Multi-Client)**
```bash
# .env.development
MCP_TRANSPORT_TYPE=http
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info
MCP_ENABLE_DUAL_TRANSPORT=false
```

#### **STDIO Transport (Single-Client)**
```bash
# .env.development  
MCP_TRANSPORT_TYPE=stdio
MCP_LOG_LEVEL=info
```

#### **Dual Transport (Migration Period)**
```bash
# .env.development
MCP_TRANSPORT_TYPE=http
MCP_SERVER_PORT=3001
MCP_ENABLE_DUAL_TRANSPORT=true
MCP_LOG_LEVEL=info
```

## **Automated Migration**

### **Using Migration Utility**

Run the automated migration tool to update your configuration:

```bash
cd EnvironmentMCPGateway
npm run migrate:transport
```

The utility will:
1. Read your current configuration
2. Create a backup of existing settings
3. Add missing transport configuration
4. Generate Claude Code client configuration
5. Provide migration guidance

### **Manual Migration**

1. **Backup existing configuration**:
   ```bash
   cp .env.development .env.development.backup
   ```

2. **Add transport configuration** to `.env.development`:
   ```bash
   # Add these lines
   MCP_TRANSPORT_TYPE=http
   MCP_SERVER_PORT=3001
   MCP_LOG_LEVEL=info
   MCP_ENABLE_DUAL_TRANSPORT=false
   ```

3. **Update Claude Code configuration** (see Client Configuration section)

4. **Test the connection**:
   ```bash
   npm start
   ```

## **Client Configuration**

### **Claude Code HTTP Client**

Update your Claude Code configuration file:

```json
{
  "mcpServers": {
    "lucidwonks-environment": {
      "command": "node",
      "args": ["dist/server.js"],
      "transport": "sse",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### **Claude Code STDIO Client (Backward Compatibility)**

For existing STDIO clients, no changes required. Optionally, you can explicitly set the transport:

```json
{
  "mcpServers": {
    "lucidwonks-environment": {
      "command": "node", 
      "args": ["dist/server.js"],
      "env": {
        "MCP_TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

## **Migration Strategies**

### **Strategy 1: Direct Migration (Recommended)**
1. Update server configuration to HTTP transport
2. Update all clients to HTTP transport
3. Test connections and functionality
4. Deploy to production

**Pros**: Clean, simple, immediate multi-client benefits  
**Cons**: Requires coordinated client updates

### **Strategy 2: Gradual Migration**
1. Enable dual transport mode on server
2. Update clients one by one to HTTP transport  
3. Disable STDIO transport when all clients migrated
4. Deploy final HTTP-only configuration

**Pros**: Zero downtime, gradual rollout  
**Cons**: Temporary resource overhead

### **Strategy 3: Parallel Deployment**
1. Deploy HTTP transport server on new port
2. Test with select clients
3. Migrate clients in batches
4. Retire STDIO server

**Pros**: Complete isolation, easy rollback  
**Cons**: Resource duplication, port management

## **Validation and Testing**

### **Server Startup Validation**

**HTTP Transport**:
```bash
# Test HTTP transport
MCP_TRANSPORT_TYPE=http npm start

# Expected log output:
# "Starting HTTP transport handler", port: 3001
# "HTTP transport server started successfully"
```

**STDIO Transport**:
```bash
# Test STDIO transport
MCP_TRANSPORT_TYPE=stdio npm start

# Expected log output:
# "Starting STDIO transport handler"
# "STDIO transport connected successfully"
```

### **Health Check Endpoints**

**HTTP Transport** provides additional endpoints:

- **Health**: `GET http://localhost:3001/health`
- **Metrics**: `GET http://localhost:3001/metrics`
- **MCP Connection**: `GET http://localhost:3001/mcp` (SSE)

### **Multi-Client Testing**

1. **Start server in HTTP mode**:
   ```bash
   MCP_TRANSPORT_TYPE=http npm start
   ```

2. **Connect multiple Claude Code instances**

3. **Verify session isolation**:
   ```bash
   curl http://localhost:3001/metrics
   ```
   
   Should show multiple active sessions and proper request routing.

## **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**: Change the port or stop conflicting services
```bash
MCP_SERVER_PORT=3002 npm start
```

#### **Transport Type Not Recognized**
```
Error: Unsupported transport type: xyz
```

**Solution**: Use valid transport types (`http` or `stdio`)
```bash
MCP_TRANSPORT_TYPE=http npm start
```

#### **Missing Session Components**
```
Error: SessionManager and SessionAwareToolExecutor are required for HTTP transport
```

**Solution**: This indicates an internal configuration issue. Restart the server.

### **Performance Monitoring**

#### **Memory Usage**
- **STDIO**: ~50-100MB baseline
- **HTTP**: ~75-150MB baseline + ~10MB per active session

#### **Connection Limits**
- **STDIO**: 1 client maximum
- **HTTP**: 10 concurrent sessions (configurable in SessionManager)

#### **Response Times**
- **Tool execution**: Same performance for both transports
- **Connection setup**: HTTP ~50ms vs STDIO ~10ms
- **Session routing**: HTTP +5ms overhead per request

## **Rollback Procedures**

### **Emergency Rollback to STDIO**

1. **Update environment**:
   ```bash
   MCP_TRANSPORT_TYPE=stdio
   ```

2. **Restart server**:
   ```bash
   npm start
   ```

3. **Update client configurations** to remove HTTP settings

4. **Verify single-client connection**

### **Configuration Backup Restoration**

If migration created issues:

```bash
# Restore from backup
cp .env.development.backup.TIMESTAMP .env.development
npm start
```

## **Advanced Configuration**

### **Custom Port Configuration**
```bash
MCP_SERVER_PORT=8080 npm start
```

### **Debug Logging**
```bash
MCP_LOG_LEVEL=debug npm start
```

### **Production Deployment**
```bash
NODE_ENV=production MCP_TRANSPORT_TYPE=http npm start
```

## **Support and Resources**

- **Documentation**: `/Documentation/EnvironmentMCPGateway/`
- **Configuration Examples**: `.env.transport.example`
- **Migration Utility**: `npm run migrate:transport`
- **Health Checks**: `http://localhost:3001/health`

---

**Migration completed successfully?** Your EnvironmentMCPGateway now supports both modern multi-client HTTP transport and legacy STDIO compatibility!
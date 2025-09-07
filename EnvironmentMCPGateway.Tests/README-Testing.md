# Integration Testing Guide

This guide explains how to run integration tests for the EnvironmentMCPGateway project while ensuring proper cleanup to prevent spurious server instances.

## Overview

The integration tests require a running MCP server instance on port 3002. This guide provides automated tooling to:

1. Start the MCP server for testing
2. Run integration tests  
3. Automatically clean up server processes
4. Prevent spurious instances from remaining on your development machine

## Test Server Management

### Automated Management (Recommended)

The `MCPTestServerManager` class in `Helpers/MCPTestServerManager.cs` provides automatic server lifecycle management:

```csharp
using var serverManager = new MCPTestServerManager();
await serverManager.StartServerAsync();

// Run your tests...

// Server automatically stops when disposed
```

### Manual Management

If you need to manually control the server:

#### Start Test Server
```bash
./scripts/start-test-server.sh
```

#### Clean Up Test Server
```bash
./scripts/cleanup-test-server.sh
```

## Running Tests

### From IDE (Visual Studio, Rider, etc.)
1. The test server will be started automatically when integration tests run
2. Tests use the `MCPTestServerManager` for lifecycle management
3. Server is cleaned up automatically when tests complete

### From Command Line
```bash
# Run all integration tests
dotnet test --filter "Category=Integration"

# Clean up afterwards (optional - should happen automatically)
./scripts/cleanup-test-server.sh
```

## Environment Separation

The test setup ensures separation from production environments:

- **Test Server**: Runs on port 3002 with `NODE_ENV=development`
- **Test Database**: Uses dummy credentials (`DB_PASSWORD=test_password`)
- **Production Server**: Deployed via Azure pipeline, runs in containers
- **Lock Files**: Test server uses temporary lock files that are cleaned up

## Troubleshooting

### Tests Fail with "MCP server failed to become ready"

1. Check if port 3002 is already in use:
   ```bash
   lsof -i :3002
   ```

2. Run the cleanup script:
   ```bash
   ./scripts/cleanup-test-server.sh
   ```

3. Verify the EnvironmentMCPGateway project builds:
   ```bash
   cd EnvironmentMCPGateway
   npm run build
   ```

### Spurious Server Instances

If you find MCP server processes running after tests:

1. Run the cleanup script:
   ```bash
   ./scripts/cleanup-test-server.sh
   ```

2. Check for processes manually:
   ```bash
   ps aux | grep "node.*server"
   ```

### Permission Issues

Ensure scripts are executable:
```bash
chmod +x scripts/*.sh
```

## Azure Pipeline Compatibility

This test setup is designed to work with the Azure pipeline that builds the production DevOps instance:

- **Local Testing**: Uses the scripts and helpers in this directory
- **Azure Pipeline**: Builds and deploys to production containers automatically
- **No Interference**: Local test instances use different ports and configuration

## Best Practices

1. **Always use the automated management** via `MCPTestServerManager` when possible
2. **Run cleanup script** if you manually start servers outside of tests
3. **Don't modify the production server configuration** for testing needs
4. **Report issues** if spurious instances persist after running cleanup

## Files Overview

- `Helpers/MCPTestServerManager.cs` - Automated server lifecycle management
- `scripts/start-test-server.sh` - Manual server startup script
- `scripts/cleanup-test-server.sh` - Cleanup script for spurious instances
- Integration test files - Use the MCPTestServerManager for proper cleanup
# Visual Studio IDE Test Explorer Integration

This document explains how the test infrastructure has been configured to work seamlessly with Visual Studio 2022 Test Explorer.

## Problem Solved

Previously, integration tests would fail in the IDE Test Explorer because they required a running MCP server instance. The command line tests worked because they used startup scripts, but the IDE had no way to automatically start/stop the MCP server.

## Solution Overview

We've implemented an **automatic MCP server fixture** that integrates with xUnit's collection fixtures to:

1. ✅ **Automatically start** the MCP server when integration tests begin
2. ✅ **Share the server** across all integration tests (efficient)
3. ✅ **Automatically clean up** when all tests complete
4. ✅ **Work in both** command line and IDE Test Explorer
5. ✅ **Prevent spurious instances** from remaining after tests

## How It Works

### Test Collection Fixture
- `MCPServerTestFixture` - Manages MCP server lifecycle
- `MCPServerTestCollection` - xUnit collection definition
- Integration tests use `[Collection("MCP Server Collection")]`

### Automatic Lifecycle Management
```
IDE Test Run Starts
    ↓
MCPServerTestFixture.InitializeAsync()
    ↓ 
Start MCP server using scripts/start-test-server.sh
    ↓
Run all integration tests (server shared)
    ↓
MCPServerTestFixture.DisposeAsync()
    ↓
Clean up using scripts/cleanup-test-server.sh
    ↓
IDE Test Run Ends
```

## Files Created/Modified

### New Infrastructure Files
- `Infrastructure/MCPServerTestFixture.cs` - Server lifecycle management
- `Infrastructure/MCPServerTestCollection.cs` - xUnit collection definition
- `scripts/update-integration-tests-for-ide.sh` - Automated test class updates

### Updated Integration Tests
All integration test classes that require MCP server now use:
```csharp
[Collection("MCP Server Collection")]
public class YourIntegrationTests
{
    private readonly MCPServerTestFixture _serverFixture;
    
    public YourIntegrationTests(MCPServerTestFixture serverFixture)
    {
        _serverFixture = serverFixture;
    }
    
    // Tests use _serverFixture.GetServerUrl()
}
```

## Visual Studio 2022 Usage

### Running Tests in IDE
1. **Open Visual Studio 2022**
2. **Open Test Explorer** (Test → Test Explorer)
3. **Build the solution** (integration tests will appear)
4. **Run any integration test** - MCP server starts automatically
5. **Run more tests** - same server instance is reused
6. **When done** - server automatically stops and cleans up

### Test Output
The Test Explorer shows server management activity:
```
[10:47:36] MCP Test Fixture: 🚀 Starting MCP server for IDE Test Explorer...
[10:47:38] MCP Test Fixture: ✅ MCP server ready for tests (Fixture #1)
[Test execution proceeds...]
[10:48:15] MCP Test Fixture: 🛑 Stopping MCP server (last fixture disposing)...
[10:48:16] MCP Test Fixture: ✅ MCP server stopped and cleaned up
```

## Command Line Compatibility

The solution maintains full compatibility with command line testing:

```bash
# All methods still work
dotnet test
dotnet test --filter "Category=Integration"
./scripts/start-test-server.sh && dotnet test
```

## Troubleshooting

### Tests Still Fail in IDE
1. **Build the solution** - Ensure fixtures are compiled
2. **Check Test Explorer output** - Look for server startup messages
3. **Verify scripts exist**:
   - `scripts/start-test-server.sh`
   - `scripts/cleanup-test-server.sh`
4. **Run cleanup manually**: `./scripts/cleanup-test-server.sh`

### Multiple Server Instances
If you see multiple servers:
```bash
# Clean up manually
./scripts/cleanup-test-server.sh

# Check for processes
ps aux | grep "node.*server"
```

### Permissions Issues
```bash
# Ensure scripts are executable
chmod +x scripts/*.sh

# Fix line endings if needed
dos2unix scripts/*.sh
```

## Integration Test Development

When creating new integration tests that need the MCP server:

1. **Add the collection attribute**:
   ```csharp
   [Collection("MCP Server Collection")]
   ```

2. **Inject the fixture**:
   ```csharp
   public YourTest(MCPServerTestFixture serverFixture)
   ```

3. **Use the fixture URL**:
   ```csharp
   var response = await _httpClient.GetAsync($"{_serverFixture.GetServerUrl()}/health");
   ```

## Benefits

✅ **No manual server management** - IDE handles everything automatically  
✅ **Consistent with command line** - Same behavior everywhere  
✅ **Resource efficient** - One server shared across all tests  
✅ **Clean environment** - Automatic cleanup prevents spurious processes  
✅ **Developer friendly** - Just run tests in Test Explorer, it works!  

The solution ensures your 1,272 integration tests work perfectly in both Visual Studio IDE and command line environments.
using Xunit;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Test collection definition for MCP server integration tests
    /// This ensures all integration tests share the same MCP server instance in IDE Test Explorer
    /// </summary>
    [CollectionDefinition("MCP Server Collection")]
    public class MCPServerTestCollection : ICollectionFixture<MCPServerTestFixture>
    {
        // This class has no code, and is never instantiated. 
        // Its purpose is simply to be the place to apply [CollectionDefinition] 
        // and all the ICollectionFixture<> interfaces.
    }
}
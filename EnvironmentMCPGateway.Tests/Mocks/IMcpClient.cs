using System.Threading.Tasks;

namespace EnvironmentMCPGateway.Tests
{
    /// <summary>
    /// Interface for MCP (Model Context Protocol) client operations
    /// Supports tool calling for Context Engineering Enhancement System
    /// </summary>
    public interface IMcpClient
    {
        /// <summary>
        /// Call a tool with the specified name and parameters
        /// </summary>
        /// <param name="toolName">Name of the tool to call</param>
        /// <param name="parameters">Parameters to pass to the tool</param>
        /// <returns>Tool execution result</returns>
        Task<object?> CallToolAsync(string toolName, object parameters);

        /// <summary>
        /// Check if the MCP client is connected and healthy
        /// </summary>
        /// <returns>True if client is healthy</returns>
        Task<bool> IsHealthyAsync();
    }
}
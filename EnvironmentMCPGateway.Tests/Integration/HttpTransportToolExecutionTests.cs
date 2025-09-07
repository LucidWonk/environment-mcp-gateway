using System.Net.Http;
using EnvironmentMCPGateway.Tests.Infrastructure;
using System.Text;
using EnvironmentMCPGateway.Tests.Infrastructure;
using System.Text.Json;
using EnvironmentMCPGateway.Tests.Infrastructure;
using FluentAssertions;
using EnvironmentMCPGateway.Tests.Infrastructure;
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;
using Xunit;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Comprehensive tests to detect HTTP Transport Tool Execution issues
    /// These tests are designed to catch the specific problems that were fixed:
    /// 1. Tool execution routing failures
    /// 2. Session context issues
    /// 3. Transport layer integration problems
    /// </summary>
    [Collection("MCP Server Collection")]
    public class HttpTransportToolExecutionTests : IAsyncLifetime
    {
        private readonly HttpClient _httpClient;
        private readonly string _mcpBaseUrl = "http://localhost:3002";
        private readonly ILogger<HttpTransportToolExecutionTests> _logger;

        public HttpTransportToolExecutionTests()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            var loggerFactory = LoggerFactory.Create(builder => 
                builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            _logger = loggerFactory.CreateLogger<HttpTransportToolExecutionTests>();
        }

        public async Task InitializeAsync()
        {
            // Ensure MCP server is ready
            var retryCount = 0;
            var maxRetries = 5;

            while (retryCount < maxRetries)
            {
                try
                {
                    var response = await _httpClient.GetAsync($"{_mcpBaseUrl}/health");
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("MCP server ready for tool execution tests");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"MCP server not ready (attempt {retryCount + 1}): {ex.Message}");
                }

                retryCount++;
                await Task.Delay(1000);
            }

            throw new InvalidOperationException("MCP server failed to become ready for tool execution tests");
        }

        public Task DisposeAsync()
        {
            _httpClient.Dispose();
            return Task.CompletedTask;
        }

        [Fact]
        [Trait("Category", "HttpTransportExecution")]
        [Trait("TestType", "RegressionPrevention")]
        public async Task HttpTransport_ShouldNotReturnHardcodedNotImplementedError()
        {
            // This test specifically prevents the hardcoded "not implemented" error that was fixed
            
            // Arrange
            var toolCallRequest = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = "analyze-solution-structure",
                    arguments = new { includeDependencies = true }
                }
            };

            var jsonContent = JsonSerializer.Serialize(toolCallRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tool execution response: {content}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("HTTP transport should handle tool execution");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            
            // CRITICAL: Should NOT contain the hardcoded error message that was fixed
            if (responseData.TryGetProperty("error", out var error))
            {
                var errorMessage = error.GetProperty("message").GetString();
                errorMessage.Should().NotContain("not yet implemented", 
                    "Tool execution should not return hardcoded 'not implemented' error");
                errorMessage.Should().NotContain("Tool execution not yet implemented for HTTP transport", 
                    "The specific hardcoded error message should be gone");
            }
            else
            {
                // Should have successful result instead of error
                responseData.TryGetProperty("result", out _).Should().BeTrue(
                    "Working tools should return results, not errors");
            }
        }

        [Fact]
        [Trait("Category", "HttpTransportExecution")]
        [Trait("TestType", "RegressionPrevention")]
        public async Task HttpTransport_ToolHandlers_ShouldBeProperlyRegistered()
        {
            // This test ensures that tool handlers are properly registered in session servers
            
            // Arrange - Get list of available tools first
            var toolsRequest = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/list",
                @params = new { }
            };

            var toolsContent = new StringContent(JsonSerializer.Serialize(toolsRequest), Encoding.UTF8, "application/json");
            var toolsResponse = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", toolsContent);
            var toolsResponseContent = await toolsResponse.Content.ReadAsStringAsync();

            toolsResponse.IsSuccessStatusCode.Should().BeTrue();
            var toolsData = JsonSerializer.Deserialize<JsonElement>(toolsResponseContent);
            var tools = toolsData.GetProperty("result").GetProperty("tools").EnumerateArray().ToList();
            
            // Act & Assert - Test each tool individually
            foreach (var tool in tools)
            {
                var toolName = tool.GetProperty("name").GetString();
                _logger.LogInformation($"Testing tool handler registration for: {toolName}");

                var callRequest = new
                {
                    jsonrpc = "2.0",
                    id = 2,
                    method = "tools/call",
                    @params = new
                    {
                        name = toolName,
                        arguments = new { }
                    }
                };

                var callContent = new StringContent(JsonSerializer.Serialize(callRequest), Encoding.UTF8, "application/json");
                var callResponse = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", callContent);
                var callResponseContent = await callResponse.Content.ReadAsStringAsync();

                _logger.LogInformation($"Tool {toolName} response: {callResponseContent}");

                // Assert
                callResponse.IsSuccessStatusCode.Should().BeTrue($"Tool {toolName} should be callable via HTTP");
                
                var callData = JsonSerializer.Deserialize<JsonElement>(callResponseContent);
                
                if (callData.TryGetProperty("error", out var error))
                {
                    var errorCode = error.GetProperty("code").GetInt32();
                    var errorMessage = error.GetProperty("message").GetString();
                    
                    // Should NOT be method not found (-32601) - indicates handler registration failure
                    errorCode.Should().NotBe(-32601, 
                        $"Tool {toolName} handler should be registered (method not found error indicates missing handler)");
                        
                    // Should NOT be the hardcoded not implemented error
                    errorMessage.Should().NotContain("not yet implemented", 
                        $"Tool {toolName} should have proper implementation");
                }
                else
                {
                    // Successful execution - this is expected for working tools
                    callData.TryGetProperty("result", out _).Should().BeTrue(
                        $"Tool {toolName} should return results when working correctly");
                }
            }
        }

        [Fact]
        [Trait("Category", "HttpTransportExecution")]
        [Trait("TestType", "RegressionPrevention")]
        public async Task HttpTransport_SessionContext_ShouldBeProperlyMaintained()
        {
            // This test ensures session context is maintained across tool executions
            
            // Arrange - Multiple tool calls in sequence
            var requests = new[]
            {
                new { id = 1, tool = "analyze-solution-structure", args = (object)new { includeDependencies = true } },
                new { id = 2, tool = "get-development-environment-status", args = (object)new { checkDatabase = false } }
            };

            // Act & Assert - Each request should maintain independent session context
            foreach (var req in requests)
            {
                var request = new
                {
                    jsonrpc = "2.0",
                    id = req.id,
                    method = "tools/call",
                    @params = new
                    {
                        name = req.tool,
                        arguments = req.args
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation($"Session context test - Tool: {req.tool}, Response: {responseContent}");

                // Assert
                response.IsSuccessStatusCode.Should().BeTrue($"Session context should be maintained for {req.tool}");
                
                var data = JsonSerializer.Deserialize<JsonElement>(responseContent);
                data.GetProperty("id").GetInt32().Should().Be(req.id, 
                    "Response ID should match request ID (indicates session context preservation)");
                    
                // Should not have session-related errors
                if (data.TryGetProperty("error", out var error))
                {
                    var errorMessage = error.GetProperty("message").GetString();
                    errorMessage.ToLowerInvariant().Should().NotContain("session");
                    errorMessage.ToLowerInvariant().Should().NotContain("context");
                }
            }
        }

        [Theory]
        [Trait("Category", "HttpTransportExecution")]
        [Trait("TestType", "ToolSpecific")]
        [InlineData("analyze-solution-structure", "includeDependencies", true)]
        [InlineData("analyze-solution-structure", "projectType", "All")]
        [InlineData("get-development-environment-status", "checkDatabase", true)]
        [InlineData("get-development-environment-status", "checkDocker", false)]
        [InlineData("get-development-environment-status", "checkGit", true)]
        public async Task HttpTransport_SpecificTools_ShouldExecuteWithParameters(string toolName, string paramName, object paramValue)
        {
            // This test ensures specific tool implementations work correctly with parameters
            
            // Arrange
            var arguments = new Dictionary<string, object?> { [paramName] = paramValue };
            
            var request = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = toolName,
                    arguments = arguments
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tool {toolName} with {paramName}={paramValue}: {responseContent}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Tool {toolName} should execute with parameter {paramName}");
            
            var data = JsonSerializer.Deserialize<JsonElement>(responseContent);
            
            if (data.TryGetProperty("error", out var error))
            {
                var errorCode = error.GetProperty("code").GetInt32();
                var errorMessage = error.GetProperty("message").GetString();
                
                // Specific assertions for common execution issues
                errorCode.Should().NotBe(-32603, $"Tool {toolName} should not have internal execution errors");
                errorMessage.Should().NotContain("not implemented", $"Tool {toolName} should be fully implemented");
                errorMessage.Should().NotContain("Cannot read properties", $"Tool {toolName} should handle parameters correctly");
            }
            else
            {
                // Successful execution - verify result structure
                data.TryGetProperty("result", out var result).Should().BeTrue(
                    $"Tool {toolName} should return result when successful");
                    
                if (toolName == "analyze-solution-structure")
                {
                    result.TryGetProperty("content", out var content_prop).Should().BeTrue(
                        "Solution analysis should return content");
                }
                else if (toolName == "get-development-environment-status")
                {
                    result.TryGetProperty("content", out var content_prop).Should().BeTrue(
                        "Environment status should return content");
                }
            }
        }

        [Fact]
        [Trait("Category", "HttpTransportExecution")]
        [Trait("TestType", "ErrorHandling")]
        public async Task HttpTransport_InvalidToolCall_ShouldReturnProperError()
        {
            // This test ensures proper error handling for invalid tools (not the hardcoded error)
            
            // Arrange
            var request = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = "nonexistent-tool",
                    arguments = new { }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Invalid tool call response: {responseContent}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("Should return proper JSON-RPC error, not HTTP error");
            
            var data = JsonSerializer.Deserialize<JsonElement>(responseContent);
            data.TryGetProperty("error", out var error).Should().BeTrue("Invalid tool should return error");
            
            var errorCode = error.GetProperty("code").GetInt32();
            var errorMessage = error.GetProperty("message").GetString();
            
            // Should be proper "method not found" or "unknown tool" error, not hardcoded implementation error
            errorMessage.Should().NotContain("not yet implemented for HTTP transport", 
                "Should not return the old hardcoded error message");
            errorMessage.Should().Contain("Unknown tool", 
                "Should return proper unknown tool error");
        }

        [Fact]
        [Trait("Category", "HttpTransportExecution")]
        [Trait("TestType", "MultiClient")]
        public async Task HttpTransport_ConcurrentToolCalls_ShouldMaintainSessionIsolation()
        {
            // This test ensures multiple concurrent tool executions work correctly
            
            // Arrange - Multiple concurrent requests
            var tasks = Enumerable.Range(1, 3).Select(i => new
            {
                Id = i,
                Task = ExecuteToolCall(i, "analyze-solution-structure", new { includeDependencies = i % 2 == 0 })
            }).ToList();

            // Act
            var results = await Task.WhenAll(tasks.Select(t => t.Task));

            // Assert
            for (int i = 0; i < results.Length; i++)
            {
                var (success, response, requestId) = results[i];
                var expectedId = tasks[i].Id;

                success.Should().BeTrue($"Concurrent request {expectedId} should succeed");
                
                if (!string.IsNullOrEmpty(response))
                {
                    var data = JsonSerializer.Deserialize<JsonElement>(response);
                    data.GetProperty("id").GetInt32().Should().Be(expectedId, 
                        "Response ID should match request ID in concurrent scenario");
                        
                    // Should not have concurrency-related errors
                    if (data.TryGetProperty("error", out var error))
                    {
                        var errorMessage = error.GetProperty("message").GetString();
                        errorMessage.ToLowerInvariant().Should().NotContain("concurrent");
                        errorMessage.ToLowerInvariant().Should().NotContain("session");
                    }
                }
            }
        }

        private async Task<(bool Success, string Response, int RequestId)> ExecuteToolCall(int requestId, string toolName, object arguments)
        {
            try
            {
                var request = new
                {
                    jsonrpc = "2.0",
                    id = requestId,
                    method = "tools/call",
                    @params = new
                    {
                        name = toolName,
                        arguments = arguments
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                return (response.IsSuccessStatusCode, responseContent, requestId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Tool call {requestId} failed: {ex.Message}");
                return (false, ex.Message, requestId);
            }
        }
    }
}
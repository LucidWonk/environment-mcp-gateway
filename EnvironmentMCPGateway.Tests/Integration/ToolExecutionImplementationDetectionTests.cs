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
    /// Tests specifically designed to detect when tool execution is not properly implemented
    /// These tests would have caught the original HTTP transport tool execution issues
    /// </summary>
    [Collection("MCP Server Collection")]
    public class ToolExecutionImplementationDetectionTests : IAsyncLifetime
    {
        private readonly HttpClient _httpClient;
        private readonly string _mcpBaseUrl = "http://localhost:3002";
        private readonly ILogger<ToolExecutionImplementationDetectionTests> _logger;

        public ToolExecutionImplementationDetectionTests()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
            
            var loggerFactory = LoggerFactory.Create(builder => 
                builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            _logger = loggerFactory.CreateLogger<ToolExecutionImplementationDetectionTests>();
        }

        public async Task InitializeAsync()
        {
            // Wait for MCP server
            var maxWait = TimeSpan.FromSeconds(10);
            var start = DateTime.UtcNow;

            while (DateTime.UtcNow - start < maxWait)
            {
                try
                {
                    var response = await _httpClient.GetAsync($"{_mcpBaseUrl}/health");
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("MCP server ready for tool implementation detection tests");
                        return;
                    }
                }
                catch { }
                await Task.Delay(500);
            }

            throw new TimeoutException("MCP server not ready for tool implementation tests");
        }

        public Task DisposeAsync()
        {
            _httpClient.Dispose();
            return Task.CompletedTask;
        }

        [Theory]
        [Trait("Category", "ImplementationDetection")]
        [Trait("Priority", "Critical")]
        [InlineData("analyze-solution-structure")]
        [InlineData("get-development-environment-status")]
        public async Task ToolExecution_ShouldNotReturnSpecificNotImplementedError(string toolName)
        {
            // This test specifically catches the exact error that was being returned
            
            // Arrange
            var request = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = toolName,
                    arguments = new { }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tool {toolName} implementation detection response: {responseContent}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Tool {toolName} call should not fail at HTTP level");

            var data = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (data.TryGetProperty("error", out var error))
            {
                var errorMessage = error.GetProperty("message").GetString();
                var errorCode = error.GetProperty("code").GetInt32();

                // CRITICAL: This is the exact error message that was being returned when broken
                errorMessage.Should().NotBe("Tool execution not yet implemented for HTTP transport",
                    $"Tool {toolName} should not return the hardcoded unimplemented error");

                errorMessage.Should().NotContain("not yet implemented",
                    $"Tool {toolName} should be fully implemented, not return placeholder errors");

                // If there's an error, it should be a proper error, not implementation placeholder
                if (errorCode == -32603) // Internal error
                {
                    errorMessage.Should().NotContain("not implemented", 
                        "Internal errors should not be about missing implementation");
                }
            }
            else
            {
                // No error means successful execution - this is what we want
                data.TryGetProperty("result", out _).Should().BeTrue(
                    $"Successful tool execution should return a result for {toolName}");
            }
        }

        [Fact]
        [Trait("Category", "ImplementationDetection")]
        [Trait("TestType", "StructuralValidation")]
        public async Task ToolList_ToolsCallMethod_ShouldBeImplemented()
        {
            // This test ensures that if tools are listed, they should be callable
            
            // Step 1: Get tools list
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

            toolsResponse.IsSuccessStatusCode.Should().BeTrue("Tools list should work");
            
            var toolsData = JsonSerializer.Deserialize<JsonElement>(toolsResponseContent);
            var tools = toolsData.GetProperty("result").GetProperty("tools").EnumerateArray().ToList();

            tools.Should().NotBeEmpty("Server should return tools if it supports tool execution");

            // Step 2: Try to call each listed tool
            foreach (var tool in tools)
            {
                var toolName = tool.GetProperty("name").GetString();
                
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

                _logger.LogInformation($"Testing implementation for listed tool: {toolName}");

                // Assert - If a tool is listed, it should have SOME implementation
                callResponse.IsSuccessStatusCode.Should().BeTrue($"Listed tool {toolName} should be callable");

                var callData = JsonSerializer.Deserialize<JsonElement>(callResponseContent);

                if (callData.TryGetProperty("error", out var error))
                {
                    var errorCode = error.GetProperty("code").GetInt32();
                    var errorMessage = error.GetProperty("message").GetString();

                    // Should NOT be method not found - that indicates handler registration failure
                    errorCode.Should().NotBe(-32601,
                        $"Tool {toolName} is listed but handler not found - indicates setup issue");

                    // Should NOT be the specific unimplemented error
                    errorMessage.Should().NotBe("Tool execution not yet implemented for HTTP transport",
                        $"Tool {toolName} should have actual implementation");

                    // If it's an implementation error, should be specific, not generic
                    if (errorCode == -32603)
                    {
                        errorMessage.Should().NotContain("not yet implemented",
                            $"Tool {toolName} errors should be specific, not generic implementation placeholders");
                    }
                }
                else
                {
                    // Successful execution is preferred
                    callData.TryGetProperty("result", out _).Should().BeTrue(
                        $"Successful tool {toolName} execution should return result");
                }
            }
        }

        [Fact]
        [Trait("Category", "ImplementationDetection")]
        [Trait("TestType", "HandlerRegistration")]
        public async Task ToolExecution_HandlersShouldBeRegistered()
        {
            // This test detects if tool handlers are properly registered in the server
            
            var testTool = "analyze-solution-structure";
            
            var request = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = testTool,
                    arguments = new { includeDependencies = true }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Handler registration test for {testTool}: {responseContent}");

            response.IsSuccessStatusCode.Should().BeTrue("Tool handler registration test should get HTTP success");

            var data = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (data.TryGetProperty("error", out var error))
            {
                var errorCode = error.GetProperty("code").GetInt32();

                // Method not found indicates handler registration failure
                errorCode.Should().NotBe(-32601,
                    "Tool handler should be registered - method not found indicates missing handler setup");
            }
            
            // Whether success or specific error, should NOT be generic implementation error
            var responseStr = responseContent.ToLowerInvariant();
            responseStr.Should().NotContain("not yet implemented", 
                "Tool response should not contain generic implementation placeholders");
        }

        [Theory]
        [Trait("Category", "ImplementationDetection")]
        [Trait("TestType", "ParameterHandling")]
        [InlineData("analyze-solution-structure", "includeDependencies", true)]
        [InlineData("get-development-environment-status", "checkDatabase", false)]
        public async Task ToolExecution_ShouldHandleParametersCorrectly(string toolName, string paramName, object paramValue)
        {
            // This test detects if tools can handle parameters (indicates proper implementation)
            
            var arguments = new Dictionary<string, object>
            {
                [paramName] = paramValue
            };

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
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Parameter handling test - {toolName} with {paramName}={paramValue}: {responseContent}");

            response.IsSuccessStatusCode.Should().BeTrue($"Tool {toolName} should handle parameters at HTTP level");

            var data = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (data.TryGetProperty("error", out var error))
            {
                var errorMessage = error.GetProperty("message").GetString();

                // Should not have parameter-related implementation errors
                errorMessage.Should().NotContain("not implemented",
                    $"Tool {toolName} should properly implement parameter handling");

                errorMessage.Should().NotContain("Cannot read properties",
                    $"Tool {toolName} should properly access parameters");

                errorMessage.Should().NotContain("undefined",
                    $"Tool {toolName} should handle parameters without undefined errors");
            }
            else
            {
                // Successful parameter handling
                data.TryGetProperty("result", out _).Should().BeTrue(
                    $"Tool {toolName} should return result when parameters handled correctly");
            }
        }

        [Fact]
        [Trait("Category", "ImplementationDetection")]
        [Trait("TestType", "SessionContext")]
        public async Task ToolExecution_ShouldMaintainSessionContext()
        {
            // This test detects if session context is properly maintained
            
            var requests = new[]
            {
                new { id = 1, tool = "analyze-solution-structure" },
                new { id = 2, tool = "get-development-environment-status" }
            };

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
                        arguments = new { }
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation($"Session context test - {req.tool}: {responseContent}");

                var data = JsonSerializer.Deserialize<JsonElement>(responseContent);

                // Response should have correct ID (indicates session context preserved)
                data.TryGetProperty("id", out var idProp).Should().BeTrue(
                    $"Tool {req.tool} response should have ID property");

                if (idProp.ValueKind != JsonValueKind.Undefined)
                {
                    idProp.GetInt32().Should().Be(req.id,
                        $"Tool {req.tool} response ID should match request ID - indicates session context maintained");
                }

                if (data.TryGetProperty("error", out var error))
                {
                    var errorMessage = error.GetProperty("message").GetString();
                    errorMessage.Should().NotContain("session",
                        $"Tool {req.tool} should not have session-related errors");
                }
            }
        }

        [Fact]
        [Trait("Category", "ImplementationDetection")]
        [Trait("TestType", "ResultStructure")]
        public async Task ToolExecution_SuccessfulTools_ShouldReturnProperStructure()
        {
            // This test detects if successfully implemented tools return proper result structure
            
            var toolName = "analyze-solution-structure";
            
            var request = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = toolName,
                    arguments = new { includeDependencies = true }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Result structure test for {toolName}: {responseContent}");

            var data = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (!data.TryGetProperty("error", out _))
            {
                // If no error, should have proper result structure
                data.TryGetProperty("result", out var result).Should().BeTrue(
                    $"Working tool {toolName} should return result");

                if (result.ValueKind != JsonValueKind.Undefined)
                {
                    // Should have MCP-compliant tool result structure
                    result.TryGetProperty("content", out var content_prop).Should().BeTrue(
                        $"Tool {toolName} result should have content array");

                    if (content_prop.ValueKind == JsonValueKind.Array)
                    {
                        var contentItems = content_prop.EnumerateArray().ToList();
                        contentItems.Should().NotBeEmpty(
                            $"Tool {toolName} content should not be empty");

                        // Each content item should have proper structure
                        foreach (var item in contentItems)
                        {
                            item.TryGetProperty("type", out _).Should().BeTrue(
                                $"Tool {toolName} content items should have type");
                            item.TryGetProperty("text", out _).Should().BeTrue(
                                $"Tool {toolName} content items should have text");
                        }
                    }
                }
            }
        }
    }
}
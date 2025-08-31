using System.Net.Http;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Tests specifically designed to validate the Claude Code connection pattern
    /// Simulates how Claude Code actually connects to MCP servers
    /// </summary>
    public class ClaudeCodeMCPConnectionTests : IAsyncLifetime
    {
        private readonly HttpClient _httpClient;
        private readonly string _mcpBaseUrl = "http://localhost:3002";
        private readonly ILogger<ClaudeCodeMCPConnectionTests> _logger;
        private readonly string _claudeCodeUserAgent = "claude-code/1.0.90";

        public ClaudeCodeMCPConnectionTests()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(10);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", _claudeCodeUserAgent);
            
            var loggerFactory = LoggerFactory.Create(builder => 
                builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            _logger = loggerFactory.CreateLogger<ClaudeCodeMCPConnectionTests>();
        }

        public async Task InitializeAsync()
        {
            // Verify MCP server is accessible
            try
            {
                var healthResponse = await _httpClient.GetAsync($"{_mcpBaseUrl}/health");
                healthResponse.IsSuccessStatusCode.Should().BeTrue("MCP server should be healthy before running tests");
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Cannot connect to MCP server at {_mcpBaseUrl}: {ex.Message}", ex);
            }
        }

        public Task DisposeAsync()
        {
            _httpClient.Dispose();
            return Task.CompletedTask;
        }

        [Fact]
        [Trait("Category", "ClaudeCodeIntegration")]
        [Trait("Priority", "Critical")]
        public async Task ClaudeCode_InitializeConnection_ShouldFollowMCPProtocol()
        {
            // Arrange - Mimic Claude Code's exact initialization request
            var initRequest = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "initialize",
                @params = new
                {
                    protocolVersion = "2024-11-05",
                    capabilities = new { },
                    clientInfo = new
                    {
                        name = "claude-code",
                        version = "1.0.90"
                    }
                }
            };

            var json = JsonSerializer.Serialize(initRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation($"Sending Claude Code style initialize request: {json}");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Initialize response: Status={response.StatusCode}, Content={responseContent}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Initialize request failed: {response.StatusCode} - {responseContent}");

            var responseData = JsonSerializer.Deserialize<JsonElement>(responseContent);
            
            // Verify JSON-RPC 2.0 compliance
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").GetInt32().Should().Be(1);
            responseData.TryGetProperty("error", out _).Should().BeFalse("Initialize should not return error");

            // Verify MCP protocol response
            var result = responseData.GetProperty("result");
            result.GetProperty("protocolVersion").GetString().Should().Be("2024-11-05");
            
            var capabilities = result.GetProperty("capabilities");
            capabilities.TryGetProperty("tools", out _).Should().BeTrue("Server should declare tools capability");

            var serverInfo = result.GetProperty("serverInfo");
            serverInfo.GetProperty("name").GetString().Should().NotBeNullOrEmpty();
            serverInfo.GetProperty("version").GetString().Should().NotBeNullOrEmpty();
        }

        [Fact]
        [Trait("Category", "ClaudeCodeIntegration")]
        [Trait("Priority", "Critical")]
        public async Task ClaudeCode_ListTools_ShouldReturnValidToolDefinitions()
        {
            // Arrange - Tools list request as Claude Code would send it
            var toolsRequest = new
            {
                jsonrpc = "2.0",
                id = 2,
                method = "tools/list",
                @params = new { }
            };

            var json = JsonSerializer.Serialize(toolsRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation($"Sending tools/list request: {json}");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tools list response: Status={response.StatusCode}, Content={responseContent}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Tools list request failed: {response.StatusCode} - {responseContent}");

            var responseData = JsonSerializer.Deserialize<JsonElement>(responseContent);
            
            // Verify JSON-RPC 2.0 compliance
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").GetInt32().Should().Be(2);
            responseData.TryGetProperty("error", out _).Should().BeFalse("Tools list should not return error");

            // Verify tools structure
            var result = responseData.GetProperty("result");
            result.TryGetProperty("tools", out var toolsProperty).Should().BeTrue("Result should contain tools array");

            var tools = toolsProperty.EnumerateArray().ToList();
            tools.Should().NotBeEmpty("Server should return at least one tool");

            // Validate each tool has required MCP tool structure
            foreach (var tool in tools)
            {
                tool.TryGetProperty("name", out var nameProperty).Should().BeTrue("Each tool must have a name");
                nameProperty.GetString().Should().NotBeNullOrEmpty("Tool name cannot be empty");

                tool.TryGetProperty("description", out var descProperty).Should().BeTrue("Each tool must have a description");
                descProperty.GetString().Should().NotBeNullOrEmpty("Tool description cannot be empty");

                tool.TryGetProperty("inputSchema", out var schemaProperty).Should().BeTrue("Each tool must have an inputSchema");
                
                if (schemaProperty.ValueKind != JsonValueKind.Undefined)
                {
                    schemaProperty.TryGetProperty("type", out var typeProperty).Should().BeTrue("InputSchema must have a type");
                    typeProperty.GetString().Should().Be("object", "InputSchema type should be object for MCP tools");
                }

                _logger.LogInformation($"Validated tool: {nameProperty.GetString()}");
            }
        }

        [Fact]
        [Trait("Category", "ClaudeCodeIntegration")]
        [Trait("Priority", "Medium")]
        public async Task ClaudeCode_FullConnectionWorkflow_ShouldWorkEndToEnd()
        {
            var requestId = 1;

            // Step 1: Initialize connection
            _logger.LogInformation("Step 1: Initialize MCP connection");
            var initSuccess = await PerformInitialization(requestId++);
            initSuccess.Should().BeTrue("Initialization must succeed for Claude Code workflow");

            // Step 2: List available tools
            _logger.LogInformation("Step 2: List available tools");
            var toolsListResult = await PerformToolsList(requestId++);
            toolsListResult.Tools.Should().NotBeEmpty("Tools list must return tools for Claude Code workflow");
            toolsListResult.Success.Should().BeTrue("Tools list must succeed");

            // Step 3: Attempt tool call (should now work successfully)
            _logger.LogInformation("Step 3: Attempt tool call");
            var firstTool = toolsListResult.Tools.First();
            var toolCallResult = await PerformToolCall(requestId++, firstTool, new { });
            
            // Tool call should return successful response now that tools are implemented
            toolCallResult.Success.Should().BeTrue("Tool call should return proper JSON-RPC response");
            toolCallResult.HasError.Should().BeFalse("Working tools should execute successfully without errors");

            _logger.LogInformation("Full Claude Code workflow simulation completed successfully");
        }

        [Theory]
        [Trait("Category", "ClaudeCodeIntegration")]
        [Trait("Priority", "High")]
        [InlineData("")]
        [InlineData("invalid json")]
        [InlineData("{")]
        [InlineData("{\"jsonrpc\":\"1.0\"}")]
        public async Task ClaudeCode_InvalidRequests_ShouldReturnProperErrors(string invalidJson)
        {
            // Arrange
            var content = new StringContent(invalidJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Invalid request '{invalidJson}' response: {response.StatusCode} - {responseContent}");

            // Assert
            if (string.IsNullOrEmpty(invalidJson) || invalidJson == "{" || invalidJson == "invalid json")
            {
                // Parse errors should return 400 Bad Request
                response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
            }
            else
            {
                // Other errors might still return 200 with JSON-RPC error
                response.IsSuccessStatusCode.Should().BeTrue();
            }

            // Response should always be valid JSON-RPC error
            var responseData = JsonSerializer.Deserialize<JsonElement>(responseContent);
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.TryGetProperty("error", out var error).Should().BeTrue("Invalid requests should return error");
            error.GetProperty("code").GetInt32().Should().BeLessThan(0, "JSON-RPC error codes should be negative");
        }

        [Fact]
        [Trait("Category", "ClaudeCodeIntegration")]
        [Trait("Priority", "High")]
        public async Task ClaudeCode_ConnectionHeaders_ShouldBeHandledCorrectly()
        {
            // Arrange
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("User-Agent", _claudeCodeUserAgent);
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate");

            var request = new
            {
                jsonrpc = "2.0",
                id = 99,
                method = "initialize",
                @params = new
                {
                    protocolVersion = "2024-11-05",
                    capabilities = new { },
                    clientInfo = new { name = "claude-code", version = "1.0.90" }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync($"{_mcpBaseUrl}/mcp", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Headers test response: {response.StatusCode} - Headers handled correctly");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("Server should handle Claude Code headers correctly");

            // Verify CORS headers are present
            response.Headers.Should().Contain(h => h.Key.StartsWith("Access-Control-"));
        }

        [Fact]
        [Trait("Category", "ClaudeCodeIntegration")]
        [Trait("Priority", "Low")]
        public async Task ClaudeCode_ConcurrentConnections_ShouldBeIsolated()
        {
            // Simulate multiple Claude Code instances connecting simultaneously
            var tasks = Enumerable.Range(1, 3).Select(async i =>
            {
                var initRequest = new
                {
                    jsonrpc = "2.0",
                    id = i,
                    method = "initialize",
                    @params = new
                    {
                        protocolVersion = "2024-11-05",
                        capabilities = new { },
                        clientInfo = new { name = $"claude-code-instance-{i}", version = "1.0.90" }
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(initRequest), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                return new { InstanceId = i, Success = response.IsSuccessStatusCode, Response = responseContent };
            }).ToList();

            var results = await Task.WhenAll(tasks);

            // Assert all instances connected successfully
            results.Should().OnlyContain(r => r.Success, "All Claude Code instances should connect successfully");

            // Verify each got appropriate response with correct ID
            foreach (var result in results)
            {
                var data = JsonSerializer.Deserialize<JsonElement>(result.Response);
                data.GetProperty("id").GetInt32().Should().Be(result.InstanceId);
                _logger.LogInformation($"Claude Code instance {result.InstanceId} connected successfully");
            }
        }

        // Helper methods for workflow testing
        private async Task<bool> PerformInitialization(int requestId)
        {
            try
            {
                var request = new
                {
                    jsonrpc = "2.0",
                    id = requestId,
                    method = "initialize",
                    @params = new
                    {
                        protocolVersion = "2024-11-05",
                        capabilities = new { },
                        clientInfo = new { name = "claude-code", version = "1.0.90" }
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Initialize failed: {response.StatusCode} - {responseContent}");
                    return false;
                }

                var data = JsonSerializer.Deserialize<JsonElement>(responseContent);
                return !data.TryGetProperty("error", out _);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Initialize exception: {ex.Message}");
                return false;
            }
        }

        private async Task<(bool Success, List<string> Tools)> PerformToolsList(int requestId)
        {
            try
            {
                var request = new
                {
                    jsonrpc = "2.0",
                    id = requestId,
                    method = "tools/list",
                    @params = new { }
                };

                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Tools list failed: {response.StatusCode} - {responseContent}");
                    return (false, new List<string>());
                }

                var data = JsonSerializer.Deserialize<JsonElement>(responseContent);
                if (data.TryGetProperty("error", out _))
                {
                    return (false, new List<string>());
                }

                var tools = data.GetProperty("result").GetProperty("tools").EnumerateArray()
                    .Select(t => t.GetProperty("name").GetString()!)
                    .ToList();

                return (true, tools);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Tools list exception: {ex.Message}");
                return (false, new List<string>());
            }
        }

        private async Task<(bool Success, bool HasError)> PerformToolCall(int requestId, string toolName, object arguments)
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

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Tool call failed: {response.StatusCode} - {responseContent}");
                    return (false, false);
                }

                var data = JsonSerializer.Deserialize<JsonElement>(responseContent);
                var hasError = data.TryGetProperty("error", out _);

                _logger.LogInformation($"Tool call for {toolName}: Success={response.IsSuccessStatusCode}, HasError={hasError}");
                return (true, hasError);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Tool call exception: {ex.Message}");
                return (false, false);
            }
        }
    }
}
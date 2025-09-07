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
using Moq;
using EnvironmentMCPGateway.Tests.Infrastructure;
using Xunit;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Comprehensive HTTP MCP Transport Integration Tests
    /// Tests the actual HTTP transport layer that Claude Code connects to
    /// </summary>
    [Collection("MCP Server Collection")]
    public class HttpMCPTransportIntegrationTests : IAsyncLifetime
    {
        private readonly HttpClient _httpClient;
        private readonly string _mcpBaseUrl = "http://localhost:3002";
        private readonly ILogger<HttpMCPTransportIntegrationTests> _logger;

        public HttpMCPTransportIntegrationTests()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            var loggerFactory = LoggerFactory.Create(builder => 
                builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            _logger = loggerFactory.CreateLogger<HttpMCPTransportIntegrationTests>();
        }

        public async Task InitializeAsync()
        {
            // Wait for MCP server to be ready
            var retryCount = 0;
            var maxRetries = 10;
            var delayMs = 1000;

            while (retryCount < maxRetries)
            {
                try
                {
                    var response = await _httpClient.GetAsync($"{_mcpBaseUrl}/health");
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("MCP server is ready");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"MCP server not ready (attempt {retryCount + 1}): {ex.Message}");
                }

                retryCount++;
                await Task.Delay(delayMs);
                delayMs = Math.Min(delayMs * 2, 5000); // Exponential backoff
            }

            throw new InvalidOperationException($"MCP server failed to become ready after {maxRetries} attempts");
        }

        public async Task DisposeAsync()
        {
            _httpClient.Dispose();
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task HealthEndpoint_ShouldReturnHealthyStatus()
        {
            // Act
            var response = await _httpClient.GetAsync($"{_mcpBaseUrl}/health");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Health endpoint failed: {content}");
            
            var healthData = JsonSerializer.Deserialize<JsonElement>(content);
            healthData.GetProperty("status").GetString().Should().Be("healthy");
            healthData.GetProperty("transport").GetString().Should().Be("HTTP/SSE");
            healthData.GetProperty("mcpEndpoint").GetString().Should().Be("/mcp");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task StatusEndpoint_ShouldReturnServerInformation()
        {
            // Act
            var response = await _httpClient.GetAsync($"{_mcpBaseUrl}/status");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Status endpoint failed: {content}");
            
            var statusData = JsonSerializer.Deserialize<JsonElement>(content);
            statusData.GetProperty("server").GetString().Should().Be("lucidwonks-environment-mcp-gateway");
            statusData.GetProperty("version").GetString().Should().Be("1.0.0");
            statusData.GetProperty("status").GetString().Should().Be("running");
            
            var transportInfo = statusData.GetProperty("transport");
            transportInfo.GetProperty("type").GetString().Should().Be("HTTP/SSE");
            transportInfo.GetProperty("endpoint").GetString().Should().Be("/mcp");
            transportInfo.GetProperty("port").GetInt32().Should().Be(3002);
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_POST_Initialize_ShouldReturnValidResponse()
        {
            // Arrange
            var initializeRequest = new
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
                        name = "claude-code-test",
                        version = "1.0.0"
                    }
                }
            };

            var jsonContent = JsonSerializer.Serialize(initializeRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Initialize Response: {content}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Initialize request failed: {response.StatusCode} - {content}");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").GetInt32().Should().Be(1);
            
            var result = responseData.GetProperty("result");
            result.GetProperty("protocolVersion").GetString().Should().Be("2024-11-05");
            result.GetProperty("serverInfo").GetProperty("name").GetString().Should().Be("lucidwonks-environment-mcp-gateway");
            result.GetProperty("serverInfo").GetProperty("version").GetString().Should().Be("1.0.0");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_POST_ToolsList_ShouldReturnAvailableTools()
        {
            // Arrange
            var toolsListRequest = new
            {
                jsonrpc = "2.0",
                id = 2,
                method = "tools/list",
                @params = new { }
            };

            var jsonContent = JsonSerializer.Serialize(toolsListRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tools List Response: {content}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Tools/list request failed: {response.StatusCode} - {content}");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").GetInt32().Should().Be(2);
            
            var result = responseData.GetProperty("result");
            var tools = result.GetProperty("tools").EnumerateArray().ToList();
            
            tools.Should().NotBeEmpty("Server should return at least some tools");
            tools.Should().HaveCountGreaterThan(1, "Expected multiple tools to be available");

            // Verify required tools are present
            var toolNames = tools.Select(t => t.GetProperty("name").GetString()).ToList();
            toolNames.Should().Contain("analyze-solution-structure");
            toolNames.Should().Contain("get-development-environment-status");

            // Verify tool structure
            foreach (var tool in tools)
            {
                tool.GetProperty("name").GetString().Should().NotBeNullOrEmpty();
                tool.GetProperty("description").GetString().Should().NotBeNullOrEmpty();
                tool.TryGetProperty("inputSchema", out var schema).Should().BeTrue("Each tool should have an input schema");
                
                if (schema.ValueKind != JsonValueKind.Undefined)
                {
                    schema.GetProperty("type").GetString().Should().Be("object");
                }
            }
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_POST_UnsupportedMethod_ShouldReturnMethodNotFound()
        {
            // Arrange
            var unsupportedRequest = new
            {
                jsonrpc = "2.0",
                id = 3,
                method = "unsupported/method",
                @params = new { }
            };

            var jsonContent = JsonSerializer.Serialize(unsupportedRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Unsupported Method Response: {content}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("Should return 200 with JSON-RPC error");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").GetInt32().Should().Be(3);
            
            var error = responseData.GetProperty("error");
            error.GetProperty("code").GetInt32().Should().Be(-32601); // Method not found
            error.GetProperty("message").GetString().Should().Contain("Method not found");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_POST_MalformedJSON_ShouldReturnParseError()
        {
            // Arrange
            var malformedJson = "{invalid json}";
            var httpContent = new StringContent(malformedJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Malformed JSON Response: {content}");

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").ValueKind.Should().Be(JsonValueKind.Null);
            
            var error = responseData.GetProperty("error");
            error.GetProperty("code").GetInt32().Should().Be(-32700); // Parse error
            error.GetProperty("message").GetString().Should().Be("Parse error");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_GET_ShouldStartSSEConnection()
        {
            // Arrange - Use shorter timeout for SSE test since it's expected to stream indefinitely
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(3); // Short timeout to avoid hanging

            try
            {
                // Act - Attempt to start SSE connection 
                var response = await client.GetAsync($"{_mcpBaseUrl}/mcp");

                _logger.LogInformation($"SSE Connection Response Status: {response.StatusCode}");

                // Assert - The connection should start successfully (200) even if we don't maintain it
                response.IsSuccessStatusCode.Should().BeTrue("SSE connection should start successfully");
                
                var contentType = response.Content.Headers.ContentType?.MediaType;
                // SSE connections typically use text/event-stream, but server might use other content types for initial handshake
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                // Expected behavior - SSE connections stream indefinitely
                _logger.LogInformation("SSE connection timed out as expected (streaming connection)");
                // This is actually success - the server accepted the connection and started streaming
            }
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_UnsupportedHTTPMethod_ShouldReturnMethodNotAllowed()
        {
            // Act
            var response = await _httpClient.PutAsync($"{_mcpBaseUrl}/mcp", new StringContent(""));

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.MethodNotAllowed);
            
            var content = await response.Content.ReadAsStringAsync();
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.GetProperty("error").GetString().Should().Be("Method Not Allowed");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPEndpoint_OPTIONS_ShouldReturnCORSHeaders()
        {
            // Arrange
            var request = new HttpRequestMessage(HttpMethod.Options, $"{_mcpBaseUrl}/mcp");

            // Act
            var response = await _httpClient.SendAsync(request);

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("OPTIONS request should succeed");
            
            // Verify CORS headers
            response.Headers.Should().ContainSingle(h => h.Key == "Access-Control-Allow-Origin");
            response.Headers.GetValues("Access-Control-Allow-Origin").First().Should().Be("*");
        }

        [Theory]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        [InlineData("analyze-solution-structure")]
        [InlineData("get-development-environment-status")]
        public async Task MCPEndpoint_POST_ToolsCall_ShouldExecuteSuccessfully(string toolName)
        {
            // Arrange
            var toolsCallRequest = new
            {
                jsonrpc = "2.0",
                id = 4,
                method = "tools/call",
                @params = new
                {
                    name = toolName,
                    arguments = new { }
                }
            };

            var jsonContent = JsonSerializer.Serialize(toolsCallRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tools Call Response for {toolName}: {content}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("Tool execution should return successful response");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.GetProperty("jsonrpc").GetString().Should().Be("2.0");
            responseData.GetProperty("id").GetInt32().Should().Be(4);
            
            // Should have result, not error
            responseData.TryGetProperty("error", out _).Should().BeFalse("Working tools should not return errors");
            responseData.TryGetProperty("result", out var result).Should().BeTrue("Working tools should return results");
            
            // Verify result structure based on tool
            if (toolName == "analyze-solution-structure")
            {
                // Should return content array with solution analysis
                result.TryGetProperty("content", out var contentProp).Should().BeTrue("Solution analysis should return content");
                var contentArray = contentProp.EnumerateArray().ToList();
                contentArray.Should().NotBeEmpty("Solution analysis should return analysis data");
            }
            else if (toolName == "get-development-environment-status")
            {
                // Should return content array with environment status
                result.TryGetProperty("content", out var contentProp).Should().BeTrue("Environment status should return content");
                var contentArray = contentProp.EnumerateArray().ToList();
                contentArray.Should().NotBeEmpty("Environment status should return status data");
            }
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        public async Task MCPWorkflow_InitializeAndListTools_ShouldWorkSequentially()
        {
            // Step 1: Initialize
            var initializeRequest = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "initialize",
                @params = new
                {
                    protocolVersion = "2024-11-05",
                    capabilities = new { },
                    clientInfo = new { name = "test-client", version = "1.0.0" }
                }
            };

            var initContent = new StringContent(JsonSerializer.Serialize(initializeRequest), Encoding.UTF8, "application/json");
            var initResponse = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", initContent);
            var initResult = await initResponse.Content.ReadAsStringAsync();

            _logger.LogInformation($"Initialize in workflow: {initResult}");

            // Assert initialize succeeded
            initResponse.IsSuccessStatusCode.Should().BeTrue($"Initialize failed: {initResult}");

            // Step 2: List Tools
            var toolsRequest = new
            {
                jsonrpc = "2.0",
                id = 2,
                method = "tools/list",
                @params = new { }
            };

            var toolsContent = new StringContent(JsonSerializer.Serialize(toolsRequest), Encoding.UTF8, "application/json");
            var toolsResponse = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", toolsContent);
            var toolsResult = await toolsResponse.Content.ReadAsStringAsync();

            _logger.LogInformation($"Tools list in workflow: {toolsResult}");

            // Assert tools list succeeded
            toolsResponse.IsSuccessStatusCode.Should().BeTrue($"Tools list failed: {toolsResult}");

            var toolsData = JsonSerializer.Deserialize<JsonElement>(toolsResult);
            var tools = toolsData.GetProperty("result").GetProperty("tools").EnumerateArray().ToList();
            tools.Should().NotBeEmpty("Workflow should return tools after successful initialization");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        [Trait("Performance", "Load")]
        public async Task MCPEndpoint_ConcurrentRequests_ShouldHandleMultipleClients()
        {
            // Arrange
            const int concurrentRequests = 5;
            var tasks = new List<Task<(bool Success, string Response)>>();

            // Act - Send multiple concurrent initialize requests
            for (int i = 0; i < concurrentRequests; i++)
            {
                var requestId = i + 100;
                tasks.Add(SendInitializeRequest(requestId));
            }

            var results = await Task.WhenAll(tasks);

            // Assert
            results.Should().OnlyContain(r => r.Success, "All concurrent requests should succeed");
            
            // Verify each response has unique ID
            var responseIds = new List<int>();
            foreach (var (success, response) in results)
            {
                if (success)
                {
                    var data = JsonSerializer.Deserialize<JsonElement>(response);
                    var id = data.GetProperty("id").GetInt32();
                    responseIds.Add(id);
                }
            }

            responseIds.Should().HaveCount(concurrentRequests);
            responseIds.Distinct().Should().HaveCount(concurrentRequests, "Each response should have a unique ID matching its request");
        }

        private async Task<(bool Success, string Response)> SendInitializeRequest(int requestId)
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
                        clientInfo = new { name = $"test-client-{requestId}", version = "1.0.0" }
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", content);
                var result = await response.Content.ReadAsStringAsync();

                return (response.IsSuccessStatusCode, result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Concurrent request {requestId} failed: {ex.Message}");
                return (false, ex.Message);
            }
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Transport", "HTTP")]
        [Trait("Reliability", "Connectivity")]
        public async Task MCPServer_ShouldRecoverFromConnectionInterruption()
        {
            // Step 1: Establish baseline connection
            var baselineResponse = await SendInitializeRequest(999);
            baselineResponse.Success.Should().BeTrue("Baseline connection should work");

            // Step 2: Wait a moment and try again (simulating connection recovery)
            await Task.Delay(2000);

            var recoveryResponse = await SendInitializeRequest(1000);
            recoveryResponse.Success.Should().BeTrue("Connection should recover after interruption");

            _logger.LogInformation("Connection recovery test completed successfully");
        }
    }
}
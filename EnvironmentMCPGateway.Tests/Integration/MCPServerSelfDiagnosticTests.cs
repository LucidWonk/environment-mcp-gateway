using System.Net.Http;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Tests for the MCP Server Self-Diagnostic tool functionality
    /// Validates comprehensive health checking and diagnostic capabilities
    /// </summary>
    public class MCPServerSelfDiagnosticTests : IAsyncLifetime
    {
        private readonly HttpClient _httpClient;
        private readonly string _mcpBaseUrl = "http://localhost:3002";
        private readonly ILogger<MCPServerSelfDiagnosticTests> _logger;

        public MCPServerSelfDiagnosticTests()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            var loggerFactory = LoggerFactory.Create(builder => 
                builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            _logger = loggerFactory.CreateLogger<MCPServerSelfDiagnosticTests>();
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
                        _logger.LogInformation("MCP server ready for self-diagnostic tests");
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

            throw new InvalidOperationException("MCP server failed to become ready for self-diagnostic tests");
        }

        public Task DisposeAsync()
        {
            _httpClient.Dispose();
            return Task.CompletedTask;
        }

        [Fact]
        [Trait("Category", "SelfDiagnostic")]
        [Trait("Priority", "Critical")]
        public async Task MCPServerSelfDiagnostic_ShouldReturnComprehensiveHealthReport()
        {
            // Arrange
            var diagnosticRequest = new
            {
                jsonrpc = "2.0",
                id = 1,
                method = "tools/call",
                @params = new
                {
                    name = "mcp-server-self-diagnostic",
                    arguments = new { verbose = true, includePerformanceTests = false }
                }
            };

            var jsonContent = JsonSerializer.Serialize(diagnosticRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Self-diagnostic response: {content}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("Self-diagnostic request should succeed");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            
            // Should not have JSON-RPC error
            responseData.TryGetProperty("error", out _).Should().BeFalse("Self-diagnostic should not return error");

            // Should have result with diagnostic content
            responseData.TryGetProperty("result", out var result).Should().BeTrue("Should return diagnostic result");
            result.TryGetProperty("content", out var contentArray).Should().BeTrue("Should have content array");
            
            var diagnosticContent = contentArray.EnumerateArray().First();
            diagnosticContent.GetProperty("type").GetString().Should().Be("text");
            
            var diagnosticJson = JsonSerializer.Deserialize<JsonElement>(diagnosticContent.GetProperty("text").GetString()!);
            
            // Validate diagnostic structure
            ValidateDiagnosticStructure(diagnosticJson);
        }

        [Fact]
        [Trait("Category", "SelfDiagnostic")]
        [Trait("Priority", "High")]
        public async Task MCPServerSelfDiagnostic_WithPerformanceTests_ShouldIncludeBenchmarks()
        {
            // Arrange
            var diagnosticRequest = new
            {
                jsonrpc = "2.0",
                id = 2,
                method = "tools/call",
                @params = new
                {
                    name = "mcp-server-self-diagnostic",
                    arguments = new { verbose = false, includePerformanceTests = true }
                }
            };

            var jsonContent = JsonSerializer.Serialize(diagnosticRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Performance diagnostic response length: {content.Length}");

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue("Performance diagnostic should succeed");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            var diagnosticJson = JsonSerializer.Deserialize<JsonElement>(
                responseData.GetProperty("result").GetProperty("content").EnumerateArray()
                .First().GetProperty("text").GetString()!);
            
            // Should include performance diagnostics
            diagnosticJson.TryGetProperty("diagnostics", out var diagnostics).Should().BeTrue();
            diagnostics.TryGetProperty("performance", out var performance).Should().BeTrue();
            performance.ValueKind.Should().NotBe(JsonValueKind.Null, "Performance tests should be included");
            
            // Validate performance structure
            var perfObj = performance;
            perfObj.TryGetProperty("status", out _).Should().BeTrue("Performance should have status");
            perfObj.TryGetProperty("benchmarks", out _).Should().BeTrue("Performance should have benchmarks");
        }

        [Theory]
        [Trait("Category", "SelfDiagnostic")]
        [Trait("Priority", "Medium")]
        [InlineData(true, true)]   // verbose + performance
        [InlineData(true, false)]  // verbose only  
        [InlineData(false, true)]  // performance only
        [InlineData(false, false)] // minimal
        public async Task MCPServerSelfDiagnostic_ParameterCombinations_ShouldWorkCorrectly(bool verbose, bool includePerformanceTests)
        {
            // Arrange
            var diagnosticRequest = new
            {
                jsonrpc = "2.0",
                id = 3,
                method = "tools/call",
                @params = new
                {
                    name = "mcp-server-self-diagnostic",
                    arguments = new { verbose, includePerformanceTests }
                }
            };

            var jsonContent = JsonSerializer.Serialize(diagnosticRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.IsSuccessStatusCode.Should().BeTrue($"Diagnostic with verbose={verbose}, performance={includePerformanceTests} should succeed");
            
            var responseData = JsonSerializer.Deserialize<JsonElement>(content);
            responseData.TryGetProperty("error", out _).Should().BeFalse("Should not return error for any parameter combination");
            
            var diagnosticJson = JsonSerializer.Deserialize<JsonElement>(
                responseData.GetProperty("result").GetProperty("content").EnumerateArray()
                .First().GetProperty("text").GetString()!);
                
            // Validate basic structure
            diagnosticJson.TryGetProperty("timestamp", out _).Should().BeTrue("Should have timestamp");
            diagnosticJson.TryGetProperty("summary", out _).Should().BeTrue("Should have summary");
            diagnosticJson.TryGetProperty("diagnostics", out var diagnostics).Should().BeTrue("Should have diagnostics");
            
            // Check performance inclusion based on parameter
            diagnostics.TryGetProperty("performance", out var performance).Should().BeTrue("Should have performance property");
            if (includePerformanceTests)
            {
                performance.ValueKind.Should().NotBe(JsonValueKind.Null, "Performance should be included when requested");
            }
            else
            {
                performance.ValueKind.Should().Be(JsonValueKind.Null, "Performance should be null when not requested");
            }
        }

        [Fact]
        [Trait("Category", "SelfDiagnostic")]
        [Trait("Priority", "High")]
        public async Task MCPServerSelfDiagnostic_ShouldValidateAllMCPCapabilities()
        {
            // Arrange
            var diagnosticRequest = new
            {
                jsonrpc = "2.0",
                id = 4,
                method = "tools/call",
                @params = new
                {
                    name = "mcp-server-self-diagnostic",
                    arguments = new { verbose = true }
                }
            };

            var jsonContent = JsonSerializer.Serialize(diagnosticRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            var diagnosticJson = JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Deserialize<JsonElement>(content)
                .GetProperty("result").GetProperty("content").EnumerateArray()
                .First().GetProperty("text").GetString()!);

            var diagnostics = diagnosticJson.GetProperty("diagnostics");

            // Check all expected diagnostic categories
            var requiredCategories = new[] {
                "mcpProtocol", "toolRegistry", "sessionManagement", 
                "infrastructure", "environmentConfig", "transport"
            };

            foreach (var category in requiredCategories)
            {
                diagnostics.TryGetProperty(category, out var categoryData).Should().BeTrue($"Should test {category}");
                categoryData.TryGetProperty("status", out var status).Should().BeTrue($"{category} should have status");
                
                var statusValue = status.GetString();
                statusValue.Should().BeOneOf("passed", "warning", "failed", $"{category} should have valid status");
            }

            // Check summary
            var summary = diagnosticJson.GetProperty("summary");
            summary.GetProperty("healthScore").GetInt32().Should().BeGreaterThanOrEqualTo(0).And.BeLessThanOrEqualTo(100);
            summary.GetProperty("totalTests").GetInt32().Should().BeGreaterThan(0);
        }

        [Fact]
        [Trait("Category", "SelfDiagnostic")]
        [Trait("Priority", "Medium")]
        public async Task MCPServerSelfDiagnostic_ShouldProvideActionableRecommendations()
        {
            // Arrange
            var diagnosticRequest = new
            {
                jsonrpc = "2.0",
                id = 5,
                method = "tools/call",
                @params = new
                {
                    name = "mcp-server-self-diagnostic",
                    arguments = new { verbose = true }
                }
            };

            var jsonContent = JsonSerializer.Serialize(diagnosticRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            var diagnosticJson = JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Deserialize<JsonElement>(content)
                .GetProperty("result").GetProperty("content").EnumerateArray()
                .First().GetProperty("text").GetString()!);

            diagnosticJson.TryGetProperty("recommendations", out var recommendations).Should().BeTrue("Should have recommendations array");
            
            // If there are recommendations, they should have proper structure
            if (recommendations.GetArrayLength() > 0)
            {
                foreach (var recommendation in recommendations.EnumerateArray())
                {
                    recommendation.TryGetProperty("severity", out _).Should().BeTrue("Recommendation should have severity");
                    recommendation.TryGetProperty("component", out _).Should().BeTrue("Recommendation should have component");
                    recommendation.TryGetProperty("issue", out _).Should().BeTrue("Recommendation should have issue description");
                    recommendation.TryGetProperty("suggestion", out _).Should().BeTrue("Recommendation should have suggestion");
                    
                    var suggestionText = recommendation.GetProperty("suggestion").GetString();
                    suggestionText.Should().NotBeNullOrEmpty("Suggestion should be actionable");
                }
            }
        }

        [Fact]
        [Trait("Category", "SelfDiagnostic")]
        [Trait("Priority", "Low")]
        public async Task MCPServerSelfDiagnostic_PerformanceTests_ShouldBeFast()
        {
            // Arrange
            var diagnosticRequest = new
            {
                jsonrpc = "2.0",
                id = 6,
                method = "tools/call",
                @params = new
                {
                    name = "mcp-server-self-diagnostic",
                    arguments = new { includePerformanceTests = true }
                }
            };

            var jsonContent = JsonSerializer.Serialize(diagnosticRequest);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var startTime = DateTimeOffset.UtcNow;

            // Act
            var response = await _httpClient.PostAsync($"{_mcpBaseUrl}/mcp", httpContent);
            var content = await response.Content.ReadAsStringAsync();
            
            var duration = DateTimeOffset.UtcNow - startTime;

            // Assert
            duration.Should().BeLessThan(TimeSpan.FromSeconds(10), "Self-diagnostic should complete quickly");
            
            var diagnosticJson = JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Deserialize<JsonElement>(content)
                .GetProperty("result").GetProperty("content").EnumerateArray()
                .First().GetProperty("text").GetString()!);

            var summary = diagnosticJson.GetProperty("summary");
            var reportedDuration = summary.GetProperty("duration").GetInt32();
            
            reportedDuration.Should().BeLessThan(10000, "Reported duration should be less than 10 seconds");
        }

        /// <summary>
        /// Validates the structure of the diagnostic response
        /// </summary>
        private static void ValidateDiagnosticStructure(JsonElement diagnosticJson)
        {
            // Required top-level properties
            diagnosticJson.TryGetProperty("timestamp", out _).Should().BeTrue("Should have timestamp");
            diagnosticJson.TryGetProperty("sessionId", out _).Should().BeTrue("Should have sessionId");
            diagnosticJson.TryGetProperty("server", out _).Should().BeTrue("Should have server info");
            diagnosticJson.TryGetProperty("diagnostics", out _).Should().BeTrue("Should have diagnostics");
            diagnosticJson.TryGetProperty("recommendations", out _).Should().BeTrue("Should have recommendations");
            diagnosticJson.TryGetProperty("summary", out _).Should().BeTrue("Should have summary");

            // Validate server info
            var server = diagnosticJson.GetProperty("server");
            server.GetProperty("name").GetString().Should().Be("lucidwonks-environment-mcp-gateway");
            server.GetProperty("version").GetString().Should().Be("1.0.0");
            server.GetProperty("transport").GetString().Should().Be("HTTP/SSE");

            // Validate summary
            var summary = diagnosticJson.GetProperty("summary");
            summary.GetProperty("totalTests").GetInt32().Should().BeGreaterThan(0);
            summary.GetProperty("healthScore").GetInt32().Should().BeInRange(0, 100);
        }
    }
}
/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Post-deployment validation tests for MCP tools 
    /// These are NOT regression tests - they validate the deployed MCP server health
    /// Tests the critical tools: get-development-environment-status, restart-development-service, test-adapter-configuration
    /// Should be run on-demand after deployment to validate environment health
    /// </summary>
    [Trait("Category", "PostDeploymentValidation")]
    [Trait("Domain", "MCP")]
    [Trait("RunManually", "true")]
    public class MCPToolsPostDeploymentValidationTests : TestBase
    {
        private readonly string _mcpGatewayDir;
        private readonly string _mcpServerPath;
        private const int TimeoutMs = 15000; // 15 seconds timeout

        public MCPToolsPostDeploymentValidationTests()
        {
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            _mcpGatewayDir = Path.Combine(projectRoot, "EnvironmentMCPGateway");
            _mcpServerPath = Path.Combine(_mcpGatewayDir, "dist", "server.js");
        }

        private static bool ShouldRunValidationTests()
        {
            // Only run these tests when explicitly requested
            var runValidation = Environment.GetEnvironmentVariable("RUN_POST_DEPLOYMENT_VALIDATION");
            return !string.IsNullOrEmpty(runValidation) && bool.TryParse(runValidation, out var shouldRun) && shouldRun;
        }

        [Fact]
        public async Task GetDevelopmentEnvironmentStatus_ShouldReturnValidResponse_WithAllChecksEnabled()
        {
            if (!ShouldRunValidationTests())
            {
                // Return early instead of failing - this prevents pipeline blockage
                return;
            }
            
            // Arrange
            var toolName = "get-development-environment-status";
            var args = new
            {
                checkDatabase = true,
                checkDocker = true,
                checkGit = true
            };

            // Act
            var result = await CallMCPToolAsync(toolName, args);

            // Assert
            result.Should().NotBeNull("MCP tool should return a response");
            result.TryGetProperty("content", out _).Should().BeTrue("Response should contain content property");
            
            var content = result.GetProperty("content").EnumerateArray().ToArray();
            content.Should().HaveCountGreaterThan(0, "Response should contain content");
            
            var responseText = content[0].GetProperty("text").GetString();
            responseText.Should().NotBeNullOrEmpty();
            
            // Parse and validate the response structure
            var responseData = JsonDocument.Parse(responseText!);
            var root = responseData.RootElement;
            
            root.TryGetProperty("timestamp", out _).Should().BeTrue("Response should include timestamp");
            root.TryGetProperty("environment", out _).Should().BeTrue("Response should include environment info");
            root.TryGetProperty("database", out _).Should().BeTrue("Response should include database status");
            root.TryGetProperty("docker", out _).Should().BeTrue("Response should include docker status");
            root.TryGetProperty("git", out _).Should().BeTrue("Response should include git status");
            root.TryGetProperty("solution", out _).Should().BeTrue("Response should include solution status");
            
            // Test completed successfully - no error logging needed
        }

        [Fact]
        public async Task GetDevelopmentEnvironmentStatus_ShouldReturnValidResponse_WithSelectiveChecks()
        {
            if (!ShouldRunValidationTests())
            {
                // Return early instead of failing - this prevents pipeline blockage
                return;
            }
            
            // Arrange
            var toolName = "get-development-environment-status";
            var args = new
            {
                checkDatabase = false,
                checkDocker = true,
                checkGit = false
            };

            // Act
            var result = await CallMCPToolAsync(toolName, args);

            // Assert
            result.Should().NotBeNull("MCP tool should return a response");
            
            var content = result.GetProperty("content").EnumerateArray().ToArray();
            var responseText = content[0].GetProperty("text").GetString();
            var responseData = JsonDocument.Parse(responseText!);
            var root = responseData.RootElement;
            
            // Verify selective checks work properly
            root.GetProperty("database").ValueKind.Should().Be(JsonValueKind.Null, "Database check should be null when disabled");
            root.GetProperty("git").ValueKind.Should().Be(JsonValueKind.Null, "Git check should be null when disabled");
            root.GetProperty("docker").ValueKind.Should().NotBe(JsonValueKind.Null, "Docker check should be present when enabled");
            
            // Test completed successfully - no error logging needed
        }

        [Fact]
        public async Task RestartDevelopmentService_ShouldReturnValidResponse_WithValidServiceName()
        {
            if (!ShouldRunValidationTests())
            {
                // Return early instead of failing - this prevents pipeline blockage
                return;
            }
            
            // Arrange
            var toolName = "restart-development-service";
            var args = new
            {
                serviceName = "redpanda-console"
            };

            // Act
            var result = await CallMCPToolAsync(toolName, args);

            // Assert
            result.Should().NotBeNull("MCP tool should return a response");
            
            var content = result.GetProperty("content").EnumerateArray().ToArray();
            var responseText = content[0].GetProperty("text").GetString();
            var responseData = JsonDocument.Parse(responseText!);
            var root = responseData.RootElement;
            
            root.TryGetProperty("timestamp", out _).Should().BeTrue("Response should include timestamp");
            root.TryGetProperty("serviceName", out _).Should().BeTrue("Response should include service name");
            root.TryGetProperty("success", out _).Should().BeTrue("Response should include success status");
            root.TryGetProperty("message", out _).Should().BeTrue("Response should include message");
            
            var serviceName = root.GetProperty("serviceName").GetString();
            serviceName.Should().Be("redpanda-console", "Service name should match requested service");
            
            // Test completed successfully - no error logging needed
        }

        [Fact]
        public async Task TestAdapterConfiguration_ShouldReturnValidResponse_WithHealthCheckResults()
        {
            if (!ShouldRunValidationTests())
            {
                // Return early instead of failing - this prevents pipeline blockage
                return;
            }
            
            // Arrange
            var toolName = "test-adapter-configuration";
            var args = new { }; // No arguments required for this tool

            // Act
            var result = await CallMCPToolAsync(toolName, args);

            // Assert
            result.Should().NotBeNull("MCP tool should return a response");
            
            var content = result.GetProperty("content").EnumerateArray().ToArray();
            var responseText = content[0].GetProperty("text").GetString();
            var responseData = JsonDocument.Parse(responseText!);
            var root = responseData.RootElement;
            
            root.TryGetProperty("timestamp", out _).Should().BeTrue("Response should include timestamp");
            root.TryGetProperty("testResults", out _).Should().BeTrue("Response should include test results");
            root.TryGetProperty("summary", out _).Should().BeTrue("Response should include summary");
            
            var testResults = root.GetProperty("testResults");
            testResults.TryGetProperty("azureDevOps", out _).Should().BeTrue("Test results should include Azure DevOps status");
            testResults.TryGetProperty("docker", out _).Should().BeTrue("Test results should include Docker status");
            
            var azureDevOps = testResults.GetProperty("azureDevOps");
            azureDevOps.TryGetProperty("healthy", out _).Should().BeTrue("Azure DevOps results should include healthy status");
            
            var docker = testResults.GetProperty("docker");
            docker.TryGetProperty("healthy", out _).Should().BeTrue("Docker results should include healthy status");
            
            var summary = root.GetProperty("summary");
            summary.TryGetProperty("azureDevOpsHealthy", out _).Should().BeTrue("Summary should include Azure DevOps health");
            summary.TryGetProperty("dockerHealthy", out _).Should().BeTrue("Summary should include Docker health");
            summary.TryGetProperty("allHealthy", out _).Should().BeTrue("Summary should include overall health status");
            
            // Test completed successfully - no error logging needed
        }

        [Fact]
        public async Task MCPTools_ShouldReturnCleanJSONResponses_WithoutConsoleContamination()
        {
            if (!ShouldRunValidationTests())
            {
                // Return early instead of failing - this prevents pipeline blockage
                return;
            }
            
            // This test validates that the MCP_SILENT_MODE fix is working
            // by ensuring JSON responses are parseable and not contaminated with console output
            
            var toolsToTest = new[]
            {
                new { name = "get-development-environment-status", args = (object)new { } },
                new { name = "test-adapter-configuration", args = (object)new { } },
                new { name = "restart-development-service", args = (object)new { serviceName = "redpanda-console" } }
            };

            foreach (var tool in toolsToTest)
            {
                try
                {
                    // Act
                    var result = await CallMCPToolAsync(tool.name, tool.args);

                    // Assert
                    result.Should().NotBeNull($"Tool {tool.name} should return a valid response");
                    
                    // Validate MCP response structure
                    result.TryGetProperty("content", out _).Should().BeTrue($"Tool {tool.name} should return content");
                    
                    var content = result.GetProperty("content").EnumerateArray().ToArray();
                    content.Should().HaveCountGreaterThan(0, $"Tool {tool.name} should return non-empty content");
                    
                    foreach (var item in content)
                    {
                        item.TryGetProperty("type", out var type).Should().BeTrue($"Content item should have type property for tool {tool.name}");
                        item.TryGetProperty("text", out var text).Should().BeTrue($"Content item should have text property for tool {tool.name}");
                        
                        type.GetString().Should().Be("text", $"Content type should be 'text' for tool {tool.name}");
                        
                        var textContent = text.GetString();
                        textContent.Should().NotBeNullOrEmpty($"Text content should not be empty for tool {tool.name}");
                        
                        // Verify text content is valid JSON (not contaminated with console output)
                        var parseAction = () => JsonDocument.Parse(textContent!);
                        parseAction.Should().NotThrow($"Text content should be valid JSON for tool {tool.name}");
                    }
                    
                    // Tool validation successful - no error logging needed
                }
                catch (Exception ex)
                {
                    LogError(ex, "Failed to validate tool {ToolName}", tool.name);
                    throw;
                }
            }
        }

        /// <summary>
        /// Helper method to call MCP tools via JSON-RPC and return parsed response
        /// Includes timeout handling and proper error logging
        /// </summary>
        private async Task<JsonElement> CallMCPToolAsync(string toolName, object arguments)
        {
            // Verify MCP server exists
            File.Exists(_mcpServerPath).Should().BeTrue($"MCP server should exist at {_mcpServerPath}");

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = _mcpServerPath,
                WorkingDirectory = _mcpGatewayDir,
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            // Set MCP_SILENT_MODE to prevent console contamination
            processStartInfo.Environment["MCP_SILENT_MODE"] = "true";

            using var process = new Process { StartInfo = processStartInfo };
            
            try
            {
                process.Start();

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

                var requestJson = JsonSerializer.Serialize(request);
                
                // Send request
                await process.StandardInput.WriteLineAsync(requestJson);
                await process.StandardInput.FlushAsync();

                // Read response with timeout
                var timeoutTask = Task.Delay(TimeoutMs);
                var readTask = process.StandardOutput.ReadToEndAsync();
                
                var completedTask = await Task.WhenAny(readTask, timeoutTask);
                
                if (completedTask == timeoutTask)
                {
                    process.Kill();
                    throw new TimeoutException($"Tool {toolName} timed out after {TimeoutMs}ms");
                }

                var stdout = await readTask;
                
                if (string.IsNullOrEmpty(stdout))
                {
                    var stderr = await process.StandardError.ReadToEndAsync();
                    throw new InvalidOperationException($"No output received from tool {toolName}. Stderr: {stderr}");
                }

                // Look for valid JSON-RPC response in stdout
                var lines = stdout.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                
                foreach (var line in lines)
                {
                    try
                    {
                        var responseDoc = JsonDocument.Parse(line);
                        var root = responseDoc.RootElement;
                        
                        if (root.TryGetProperty("jsonrpc", out var jsonrpc) &&
                            jsonrpc.GetString() == "2.0" &&
                            root.TryGetProperty("id", out var id) &&
                            id.GetInt32() == 1)
                        {
                            if (root.TryGetProperty("error", out var error))
                            {
                                var errorMessage = error.GetProperty("message").GetString();
                                throw new InvalidOperationException($"Tool {toolName} returned error: {errorMessage}");
                            }
                            
                            if (root.TryGetProperty("result", out var result))
                            {
                                return result;
                            }
                        }
                    }
                    catch (JsonException)
                    {
                        // Continue looking for valid JSON-RPC response
                        continue;
                    }
                }

                throw new InvalidOperationException($"No valid JSON-RPC response found for tool {toolName}. Output: {stdout.Substring(0, Math.Min(500, stdout.Length))}");
            }
            finally
            {
                if (!process.HasExited)
                {
                    process.Kill();
                }
            }
        }
    }
}
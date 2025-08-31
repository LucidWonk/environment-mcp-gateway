/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Text.Json;
using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Integration tests for the CLI tool interface (trigger-context-reindex.js)
    /// Tests the command-line interface that provides direct access to MCP context operations
    /// </summary>
    [Collection("CLIToolIntegration")]
    [Trait("Category", "Integration")]
    [Trait("Integration", "CLITool")]
    [Trait("Component", "CLITool")]
    public class CLIToolInterfaceTests : TestBase
    {
        private readonly string _projectRoot;
        private readonly string _cliToolPath;
        private readonly Mock<ILogger> _mockLogger;

        public CLIToolInterfaceTests()
        {
            _mockLogger = new Mock<ILogger>();
            
            // Get project root and CLI tool path
            var currentDir = Directory.GetCurrentDirectory();
            _projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            _cliToolPath = Path.Combine(_projectRoot, "trigger-context-reindex.js");
        }

        [Fact]
        [Trait("TestType", "FileExistence")]
        public void CLITool_ShouldExist_AndBeExecutable()
        {
            // Act & Assert
            File.Exists(_cliToolPath).Should().BeTrue("CLI tool should exist at project root");
            
            var fileContent = File.ReadAllText(_cliToolPath);
            fileContent.Should().StartWith("#!/usr/bin/env node", 
                "CLI tool should have proper shebang for Node.js execution");
        }

        [Fact]
        [Trait("TestType", "HelpCommand")]
        public void CLITool_Help_ShouldDisplayUsageInformation()
        {
            // Act
            var result = ExecuteNodeCommand(_cliToolPath, "help");
            
            // Assert
            result.Success.Should().BeTrue("help command should execute successfully");
            result.Output.Should().Contain("Lucidwonks Context Engineering Tool", 
                "help should display tool title");
            result.Output.Should().Contain("USAGE:", "help should show usage section");
            result.Output.Should().Contain("OPERATIONS:", "help should show operations section");
            result.Output.Should().Contain("full-reindex", "help should list full-reindex operation");
            result.Output.Should().Contain("holistic-update", "help should list holistic-update operation");
            result.Output.Should().Contain("status", "help should list status operation");
            result.Output.Should().Contain("health", "help should list health operation");
        }

        [Fact]
        [Trait("TestType", "InvalidOperation")]
        public void CLITool_InvalidOperation_ShouldShowError()
        {
            // Act
            var result = ExecuteNodeCommand(_cliToolPath, "invalid-operation");
            
            // Assert
            result.Success.Should().BeFalse("invalid operation should fail");
            result.Error.Should().Contain("Unknown operation: invalid-operation", 
                "should show specific error for invalid operation");
            result.Error.Should().Contain("Run with \"help\"", 
                "should suggest using help command");
        }

        [Fact]
        [Trait("TestType", "ConfigurationValidation")]
        public void CLITool_ShouldHaveCorrectConfiguration()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("const MCP_CONTAINER = 'environment-mcp-gateway'", 
                "should use correct container name");
            toolContent.Should().Contain("const MCP_HTTP_PORT = 3002", 
                "should use correct external HTTP port");
            toolContent.Should().Contain("const MCP_INTERNAL_PORT = 3001", 
                "should reference correct internal port");
        }

        [Fact]
        [Trait("TestType", "OperationDefinition")]
        public void CLITool_ShouldDefineAllRequiredOperations()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("'full-reindex':", "should define full-reindex operation");
            toolContent.Should().Contain("'holistic-update':", "should define holistic-update operation");
            toolContent.Should().Contain("'status':", "should define status operation");
            toolContent.Should().Contain("'health':", "should define health operation");
            
            // Check handler functions
            toolContent.Should().Contain("executeFullRepositoryReindex", 
                "should have full reindex handler");
            toolContent.Should().Contain("executeHolisticContextUpdate", 
                "should have holistic update handler");
            toolContent.Should().Contain("getUpdateStatus", "should have status handler");
            toolContent.Should().Contain("checkHealth", "should have health handler");
        }

        [Fact]
        [Trait("TestType", "ErrorHandling")]
        public void CLITool_WithoutArguments_ShouldShowHelp()
        {
            // Act
            var result = ExecuteNodeCommand(_cliToolPath);
            
            // Assert
            result.Success.Should().BeTrue("CLI tool should handle no arguments gracefully");
            result.Output.Should().Contain("USAGE:", "should display usage when no arguments provided");
            result.Output.Should().Contain("OPERATIONS:", "should show available operations");
        }

        [Theory]
        [InlineData("full-reindex", "Execute full repository context reindexing")]
        [InlineData("holistic-update", "Execute holistic context update for changed files")]
        [InlineData("status", "Get status of context update operations")]
        [InlineData("health", "Check MCP Gateway health")]
        [Trait("TestType", "OperationDescriptions")]
        public void CLITool_Operations_ShouldHaveDescriptions(string operation, string expectedDescription)
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain($"'{operation}':", $"should define {operation} operation");
            toolContent.Should().Contain(expectedDescription, 
                $"{operation} should have descriptive text");
        }

        [Fact]
        [Trait("TestType", "Integration")]
        public async Task CLITool_Health_WithoutContainer_ShouldHandleGracefully()
        {
            // This test validates error handling when MCP Gateway is not running
            // Act
            var result = ExecuteNodeCommand(_cliToolPath, "health");
            
            // Assert
            // The tool should attempt the health check and either succeed or fail gracefully
            // Since we can't guarantee MCP Gateway state in tests, we check for proper error handling
            result.Should().NotBeNull("health command should complete");
            
            // The command should either succeed (if container is running) or show proper error
            if (!result.Success)
            {
                result.Error.Should().NotBeEmpty("should provide error information when health check fails");
            }
            else
            {
                result.Output.Should().Contain("Health Check", "successful health check should show results");
            }
        }

        [Fact]
        [Trait("TestType", "ParameterHandling")]
        public void CLITool_ShouldParseCommandLineOptions()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("parseOptions", "should have option parsing function");
            toolContent.Should().Contain("--cleanupFirst", "should support cleanupFirst option");
            toolContent.Should().Contain("--files", "should support files option");
            toolContent.Should().Contain("--limit", "should support limit option");
            toolContent.Should().Contain("--metrics", "should support metrics option");
        }

        [Fact]
        [Trait("TestType", "ContainerIntegration")]
        public void CLITool_ShouldExecuteContainerCommands()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("executeContainerCommand", 
                "should have container command execution function");
            toolContent.Should().Contain("docker exec", "should use docker exec for container commands");
            toolContent.Should().Contain("holistic-context-updates.js", 
                "should reference correct MCP module");
            toolContent.Should().Contain("handleExecuteFullRepositoryReindex", 
                "should call repository reindex handler");
            toolContent.Should().Contain("handleExecuteHolisticContextUpdate", 
                "should call holistic update handler");
        }

        [Fact]
        [Trait("TestType", "GitIntegration")]
        public void CLITool_ShouldIntegrateWithGit()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("getChangedFilesFromGit", 
                "should have git integration for changed files");
            toolContent.Should().Contain("getCurrentGitHash", 
                "should get current git commit hash");
            toolContent.Should().Contain("git diff --name-only HEAD~1..HEAD", 
                "should use git diff to get changed files");
            toolContent.Should().Contain("git rev-parse HEAD", 
                "should use git rev-parse for commit hash");
        }

        [Fact]
        [Trait("TestType", "HTTPIntegration")]
        public void CLITool_ShouldSupportHTTPHealthChecks()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("makeHttpRequest", 
                "should have HTTP request functionality");
            toolContent.Should().Contain("http://localhost:${MCP_HTTP_PORT}/health", 
                "should make health check requests to correct endpoint");
            toolContent.Should().Contain("JSON.parse", 
                "should parse JSON responses from HTTP endpoints");
        }

        [Fact]
        [Trait("TestType", "UserExperience")]
        public void CLITool_ShouldProvideUserFriendlyOutput()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("🚀 Executing", "should use emojis for visual feedback");
            toolContent.Should().Contain("✅ Operation completed", "should show success indicators");
            toolContent.Should().Contain("❌ Operation failed", "should show failure indicators");
            toolContent.Should().Contain("📋", "should use descriptive emojis");
            toolContent.Should().Contain("⏱️ Execution time", "should show timing information");
            
            // Check for user-friendly examples in help
            toolContent.Should().Contain("EXAMPLES:", "help should include usage examples");
        }

        [Fact]
        [Trait("TestType", "ModuleExports")]
        public void CLITool_ShouldExposeModuleFunctions()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            toolContent.Should().Contain("module.exports", "should export functions for testing");
            toolContent.Should().Contain("executeFullRepositoryReindex", 
                "should export full repository reindex function");
            toolContent.Should().Contain("executeHolisticContextUpdate", 
                "should export holistic update function");
            toolContent.Should().Contain("getUpdateStatus", "should export status function");
            toolContent.Should().Contain("checkHealth", "should export health function");
            toolContent.Should().Contain("OPERATIONS", "should export operations config");
        }

        [Fact]
        [Trait("TestType", "RobustErrorHandling")]
        public void CLITool_ShouldHandleEdgeCases()
        {
            // Arrange
            var toolContent = File.ReadAllText(_cliToolPath);
            
            // Act & Assert
            // Git integration error handling
            toolContent.Should().Contain("Could not get changed files from git, using empty list", 
                "should handle git command failures");
            
            // Container command error handling
            toolContent.Should().Contain("Container execution error", 
                "should handle container execution failures");
            
            // HTTP request error handling
            toolContent.Should().Contain("Invalid JSON response", 
                "should handle malformed HTTP responses");
            
            // Process exit codes
            toolContent.Should().Contain("process.exit(1)", 
                "should use proper exit codes for failures");
        }

        private (bool Success, string Output, string Error) ExecuteNodeCommand(string scriptPath, params string[] arguments)
        {
            try
            {
                using var process = new Process();
                process.StartInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"\"{scriptPath}\" {string.Join(" ", arguments)}",
                    WorkingDirectory = _projectRoot,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                process.Start();
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                return (process.ExitCode == 0, output, error);
            }
            catch (Exception ex)
            {
                return (false, string.Empty, ex.Message);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                // No specific cleanup needed for CLI tool tests
            }
            base.Dispose(disposing);
        }
    }
}
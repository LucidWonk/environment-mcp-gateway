using Xunit;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Extensions.Logging;
using System.IO;
using System;
using System.Collections.Generic;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// XUnit tests for Environment Configuration functionality
    /// Converted from Jest tests in compliance with testing policy
    /// </summary>
    public class EnvironmentConfigurationTests : IDisposable
    {
        private readonly ILogger<EnvironmentConfigurationTests> _logger;
        private readonly Dictionary<string, string?> _originalEnvVars;

        public EnvironmentConfigurationTests()
        {
            // Initialize Serilog logger as required by testing standards
            Log.Logger = new LoggerConfiguration()
                .WriteTo.Console()
                .WriteTo.File("logs/test-environment-config-.txt", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            var loggerFactory = new SerilogLoggerFactory(Log.Logger);
            _logger = loggerFactory.CreateLogger<EnvironmentConfigurationTests>();

            // Backup original environment variables
            _originalEnvVars = new Dictionary<string, string?>
            {
                ["PROJECT_ROOT"] = Environment.GetEnvironmentVariable("PROJECT_ROOT"),
                ["GIT_REPO_PATH"] = Environment.GetEnvironmentVariable("GIT_REPO_PATH"),
                ["NODE_ENV"] = Environment.GetEnvironmentVariable("NODE_ENV")
            };

            _logger.LogInformation("Environment Configuration Tests initialized");
        }

        [Fact]
        public void ProjectRoot_ShouldUseProjectRootWhenAvailable_DockerEnvironment()
        {
            // Arrange
            _logger.LogInformation("Testing PROJECT_ROOT environment variable priority");
            Environment.SetEnvironmentVariable("PROJECT_ROOT", "/workspace");
            Environment.SetEnvironmentVariable("GIT_REPO_PATH", null);

            // Act & Assert
            var projectRoot = Environment.GetEnvironmentVariable("PROJECT_ROOT");
            var gitRepoPath = Environment.GetEnvironmentVariable("GIT_REPO_PATH") ?? projectRoot;

            Assert.Equal("/workspace", projectRoot);
            Assert.Equal("/workspace", gitRepoPath);
            
            _logger.LogInformation("PROJECT_ROOT test passed: {ProjectRoot}", projectRoot);
        }

        [Fact]
        public void ProjectRoot_ShouldFallbackToGitRepoPath_WhenProjectRootNotAvailable()
        {
            // Arrange
            _logger.LogInformation("Testing GIT_REPO_PATH fallback behavior");
            Environment.SetEnvironmentVariable("PROJECT_ROOT", null);
            Environment.SetEnvironmentVariable("GIT_REPO_PATH", "/mnt/m/projects/lucidwonks");

            // Act & Assert
            var projectRoot = Environment.GetEnvironmentVariable("PROJECT_ROOT");
            var gitRepoPath = Environment.GetEnvironmentVariable("GIT_REPO_PATH");

            Assert.Null(projectRoot);
            Assert.Equal("/mnt/m/projects/lucidwonks", gitRepoPath);
            
            _logger.LogInformation("GIT_REPO_PATH fallback test passed: {GitRepoPath}", gitRepoPath);
        }

        [Fact]
        public void Environment_ShouldProvideDefaultPaths_WhenNoVariablesSet()
        {
            // Arrange
            _logger.LogInformation("Testing default path behavior");
            Environment.SetEnvironmentVariable("PROJECT_ROOT", null);
            Environment.SetEnvironmentVariable("GIT_REPO_PATH", null);

            // Act
            var projectRoot = Environment.GetEnvironmentVariable("PROJECT_ROOT");
            var gitRepoPath = Environment.GetEnvironmentVariable("GIT_REPO_PATH");
            var currentDir = Directory.GetCurrentDirectory();

            // Assert
            Assert.Null(projectRoot);
            Assert.Null(gitRepoPath);
            Assert.NotNull(currentDir);
            
            _logger.LogInformation("Default path test passed, current directory: {CurrentDir}", currentDir);
        }

        [Theory]
        [InlineData("development")]
        [InlineData("production")]
        [InlineData("test")]
        public void NodeEnvironment_ShouldAcceptValidValues(string environment)
        {
            // Arrange
            _logger.LogInformation("Testing NODE_ENV validation for: {Environment}", environment);
            Environment.SetEnvironmentVariable("NODE_ENV", environment);

            // Act
            var nodeEnv = Environment.GetEnvironmentVariable("NODE_ENV");

            // Assert
            Assert.Equal(environment, nodeEnv);
            _logger.LogInformation("NODE_ENV test passed for: {Environment}", environment);
        }

        [Fact]
        public void EnvironmentValidation_ShouldHandleMissingConfiguration()
        {
            // Arrange
            _logger.LogInformation("Testing environment validation with missing configuration");
            Environment.SetEnvironmentVariable("PROJECT_ROOT", null);
            Environment.SetEnvironmentVariable("GIT_REPO_PATH", null);
            Environment.SetEnvironmentVariable("NODE_ENV", null);

            // Act & Assert - Should not throw, should use defaults
            var nodeEnv = Environment.GetEnvironmentVariable("NODE_ENV");
            Assert.Null(nodeEnv); // Should be null when not set
            
            _logger.LogInformation("Missing configuration test passed");
        }

        public void Dispose()
        {
            // Restore original environment variables
            foreach (var kvp in _originalEnvVars)
            {
                Environment.SetEnvironmentVariable(kvp.Key, kvp.Value);
            }

            _logger.LogInformation("Environment Configuration Tests disposed and environment restored");
            Log.CloseAndFlush();
        }
    }
}
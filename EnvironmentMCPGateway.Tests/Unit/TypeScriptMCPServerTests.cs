using Xunit;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// XUnit tests for TypeScript MCP Server functionality
    /// Converted from Jest tests in compliance with testing policy
    /// Tests server startup, configuration, and basic operations
    /// </summary>
    public class TypeScriptMCPServerTests : IDisposable
    {
        private readonly ILogger<TypeScriptMCPServerTests> _logger;
        private readonly string _gatewayPath;

        public TypeScriptMCPServerTests()
        {
            // Initialize Serilog logger as required by testing standards
            Log.Logger = new LoggerConfiguration()
                .WriteTo.Console()
                .WriteTo.File("logs/test-typescript-mcp-server-.txt", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            var loggerFactory = new SerilogLoggerFactory(Log.Logger);
            _logger = loggerFactory.CreateLogger<TypeScriptMCPServerTests>();

            // Find the EnvironmentMCPGateway directory more reliably
            var currentDir = Directory.GetCurrentDirectory();
            var solutionRoot = FindSolutionRoot(currentDir);
            _gatewayPath = Path.Combine(solutionRoot, "EnvironmentMCPGateway");

            _logger.LogInformation("TypeScript MCP Server Tests initialized with gateway path: {GatewayPath}", _gatewayPath);
        }

        private string FindSolutionRoot(string startPath)
        {
            var directory = new DirectoryInfo(startPath);
            while (directory != null)
            {
                if (File.Exists(Path.Combine(directory.FullName, "LucidwonksMCPGateway.sln")))
                {
                    return directory.FullName;
                }
                directory = directory.Parent;
            }
            return startPath; // Fallback
        }

        [Fact]
        public void ServerConfiguration_ShouldHaveValidPackageJson()
        {
            // Arrange
            var packageJsonPath = Path.Combine(_gatewayPath, "package.json");
            _logger.LogInformation("Testing package.json configuration: {PackageJsonPath}", packageJsonPath);

            // Act & Assert
            Assert.True(File.Exists(packageJsonPath), "package.json should exist");
            
            var packageContent = File.ReadAllText(packageJsonPath);
            Assert.Contains("lucidwonks-environment-mcp-gateway", packageContent);
            Assert.Contains("@modelcontextprotocol/sdk", packageContent);
            Assert.DoesNotContain("jest", packageContent); // Jest should be removed
            
            _logger.LogInformation("Package.json validation passed");
        }

        [Fact]
        public void ServerConfiguration_ShouldHaveValidTypeScriptConfig()
        {
            // Arrange
            var tsconfigPath = Path.Combine(_gatewayPath, "tsconfig.json");
            _logger.LogInformation("Testing TypeScript configuration: {TsconfigPath}", tsconfigPath);

            // Act & Assert
            Assert.True(File.Exists(tsconfigPath), "tsconfig.json should exist");
            
            var tsconfigContent = File.ReadAllText(tsconfigPath);
            Assert.Contains("ES2022", tsconfigContent);
            Assert.Contains("src/**/*", tsconfigContent);
            
            _logger.LogInformation("TypeScript configuration validation passed");
        }

        [Fact]
        public void ServerStructure_ShouldHaveRequiredDirectories()
        {
            // Arrange & Act
            _logger.LogInformation("Testing server directory structure");

            var srcPath = Path.Combine(_gatewayPath, "src");
            var distPath = Path.Combine(_gatewayPath, "dist");
            var serverPath = Path.Combine(_gatewayPath, "src", "server.ts");

            // Assert
            Assert.True(Directory.Exists(srcPath), "src directory should exist");
            Assert.True(File.Exists(serverPath), "server.ts should exist");
            
            _logger.LogInformation("Server structure validation passed");
        }

        [Fact]
        public void TestingPolicy_ShouldNotContainJestFiles()
        {
            // Arrange
            _logger.LogInformation("Testing that Jest files have been removed per testing policy");

            var jestConfigPath = Path.Combine(_gatewayPath, "jest.config.js");
            var testDirPath = Path.Combine(_gatewayPath, "src", "tests");

            // Act & Assert
            Assert.False(File.Exists(jestConfigPath), "jest.config.js should not exist per testing policy");
            Assert.False(Directory.Exists(testDirPath), "src/tests directory should not exist per testing policy");
            
            _logger.LogInformation("Jest removal validation passed - complies with testing policy");
        }

        [Fact]
        public async Task ServerBuild_ShouldCompileSuccessfully()
        {
            // Arrange
            _logger.LogInformation("Testing TypeScript compilation (optimized)");

            // Skip test if npm not available or gateway path doesn't exist
            if (!Directory.Exists(_gatewayPath))
            {
                _logger.LogWarning("Skipping npm build test - gateway path not found: {GatewayPath}", _gatewayPath);
                return;
            }

            if (!IsNpmAvailable())
            {
                _logger.LogWarning("Skipping npm build test - npm not available");
                return;
            }

            // Act - Use optimized shared compilation
            var success = await TestOptimizations.PerformanceTimer.TimeAsync(
                () => TestOptimizations.EnsureTypeScriptCompiled(_gatewayPath, _logger),
                "TypeScript Compilation",
                _logger);

            // Assert
            Assert.True(success, "TypeScript compilation should succeed");
            
            // Verify output exists
            var serverJsPath = Path.Combine(_gatewayPath, "dist", "server.js");
            Assert.True(File.Exists(serverJsPath), $"Compiled server.js should exist at {serverJsPath}");
            
            _logger.LogInformation("TypeScript compilation test completed successfully");
        }

        private async Task OriginalServerBuildMethod()
        {
            // Original implementation moved here for reference
            var processInfo = new ProcessStartInfo
            {
                FileName = GetNpmCommand(),
                Arguments = "run build",
                WorkingDirectory = _gatewayPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            };

            using var process = Process.Start(processInfo);
            Assert.NotNull(process);

            await process.WaitForExitAsync();
            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();

            // Assert
            Assert.Equal(0, process.ExitCode);
            
            var distPath = Path.Combine(_gatewayPath, "dist");
            var serverJsPath = Path.Combine(distPath, "server.js");
            Assert.True(File.Exists(serverJsPath), "Compiled server.js should exist");
            
            _logger.LogInformation("TypeScript compilation test passed, output: {Output}", stdout);
        }

        [Fact]
        public async Task ServerLinting_ShouldPassESLintChecks()
        {
            // Arrange
            _logger.LogInformation("Testing ESLint compliance");

            // Skip test if npm not available or gateway path doesn't exist
            if (!Directory.Exists(_gatewayPath))
            {
                _logger.LogWarning("Skipping npm lint test - gateway path not found: {GatewayPath}", _gatewayPath);
                return;
            }

            if (!IsNpmAvailable())
            {
                _logger.LogWarning("Skipping npm lint test - npm not available");
                return;
            }

            // Act
            var processInfo = new ProcessStartInfo
            {
                FileName = GetNpmCommand(),
                Arguments = "run lint",
                WorkingDirectory = _gatewayPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            };

            using var process = Process.Start(processInfo);
            Assert.NotNull(process);

            await process.WaitForExitAsync();
            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();

            // Assert
            Assert.Equal(0, process.ExitCode);
            _logger.LogInformation("ESLint validation passed, output: {Output}", stdout);
        }

        private bool IsNpmAvailable()
        {
            try
            {
                var processInfo = new ProcessStartInfo
                {
                    FileName = GetNpmCommand(),
                    Arguments = "--version",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(processInfo);
                return process != null && process.WaitForExit(5000) && process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        private string GetNpmCommand()
        {
            // On Windows, npm might be npm.cmd
            return OperatingSystem.IsWindows() ? "npm.cmd" : "npm";
        }

        [Fact]
        public void EnvironmentConfig_ShouldHandleImportMetaCorrectly()
        {
            // Arrange
            var environmentPath = Path.Combine(_gatewayPath, "src", "domain", "config", "environment.ts");
            _logger.LogInformation("Testing import.meta handling in environment config: {EnvironmentPath}", environmentPath);

            // Act & Assert
            Assert.True(File.Exists(environmentPath), "environment.ts should exist");
            
            var content = File.ReadAllText(environmentPath);
            Assert.Contains("try", content); // Should have try-catch for import.meta
            Assert.Contains("catch", content);
            Assert.Contains("process.cwd()", content); // Should have fallback
            
            _logger.LogInformation("Environment config import.meta handling validation passed");
        }

        [Fact]
        public void LoggingConfiguration_ShouldUseWinstonCorrectly()
        {
            // Arrange
            var loggerPath = Path.Combine(_gatewayPath, "src", "utils", "mcp-logger.ts");
            _logger.LogInformation("Testing Winston logger configuration: {LoggerPath}", loggerPath);

            // Act & Assert
            Assert.True(File.Exists(loggerPath), "mcp-logger.ts should exist");
            
            var content = File.ReadAllText(loggerPath);
            Assert.Contains("winston", content);
            Assert.Contains("MCP_SILENT_MODE", content);
            Assert.Contains("createMCPLogger", content);
            
            _logger.LogInformation("Winston logger configuration validation passed");
        }

        public void Dispose()
        {
            _logger.LogInformation("TypeScript MCP Server Tests disposed");
            Log.CloseAndFlush();
        }
    }
}
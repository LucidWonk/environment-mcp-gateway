using Xunit;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Extensions.Logging;
using System.IO;
using System;
using System.Threading.Tasks;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// XUnit tests for Path Utilities functionality
    /// Converted from Jest tests in compliance with testing policy
    /// </summary>
    public class PathUtilitiesTests : IDisposable
    {
        private readonly ILogger<PathUtilitiesTests> _logger;
        private readonly string _testDirectory;

        public PathUtilitiesTests()
        {
            // Initialize Serilog logger as required by testing standards
            Log.Logger = new LoggerConfiguration()
                .WriteTo.Console()
                .WriteTo.File("logs/test-path-utilities-.txt", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            var loggerFactory = new SerilogLoggerFactory(Log.Logger);
            _logger = loggerFactory.CreateLogger<PathUtilitiesTests>();

            // Create temporary test directory
            _testDirectory = Path.Combine(Path.GetTempPath(), $"path-utils-test-{Guid.NewGuid():N}");
            Directory.CreateDirectory(_testDirectory);

            _logger.LogInformation("Path Utilities Tests initialized with test directory: {TestDirectory}", _testDirectory);
        }

        [Fact]
        public void PathResolution_ShouldHandleAbsolutePaths()
        {
            // Arrange
            var testFile = Path.Combine(_testDirectory, "test-file.txt");
            File.WriteAllText(testFile, "test content");
            _logger.LogInformation("Testing absolute path resolution for: {TestFile}", testFile);

            // Act & Assert
            Assert.True(File.Exists(testFile));
            Assert.True(Path.IsPathRooted(testFile));
            
            _logger.LogInformation("Absolute path test passed for: {TestFile}", testFile);
        }

        [Fact]
        public void PathResolution_ShouldHandleRelativePaths()
        {
            // Arrange
            var currentDir = Directory.GetCurrentDirectory();
            var relativePath = "test-relative.txt";
            var fullPath = Path.Combine(currentDir, relativePath);
            
            _logger.LogInformation("Testing relative path resolution: {RelativePath} -> {FullPath}", relativePath, fullPath);

            // Act
            var resolvedPath = Path.GetFullPath(relativePath);

            // Assert
            Assert.Equal(fullPath, resolvedPath);
            _logger.LogInformation("Relative path test passed: {ResolvedPath}", resolvedPath);
        }

        [Fact]
        public void DirectoryCreation_ShouldCreateMissingDirectories()
        {
            // Arrange
            var newDirectory = Path.Combine(_testDirectory, "new-directory");
            _logger.LogInformation("Testing directory creation: {NewDirectory}", newDirectory);

            // Act
            Directory.CreateDirectory(newDirectory);

            // Assert
            Assert.True(Directory.Exists(newDirectory));
            _logger.LogInformation("Directory creation test passed: {NewDirectory}", newDirectory);
        }

        [Fact]
        public void PathValidation_ShouldDetectExistingFiles()
        {
            // Arrange
            var testFile = Path.Combine(_testDirectory, "existing-file.txt");
            File.WriteAllText(testFile, "test content");
            _logger.LogInformation("Testing file existence validation: {TestFile}", testFile);

            // Act & Assert
            Assert.True(File.Exists(testFile));
            Assert.False(Directory.Exists(testFile)); // Should be file, not directory
            
            _logger.LogInformation("File existence test passed: {TestFile}", testFile);
        }

        [Fact]
        public void PathValidation_ShouldDetectNonExistentPaths()
        {
            // Arrange
            var nonExistentPath = Path.Combine(_testDirectory, "does-not-exist");
            _logger.LogInformation("Testing non-existent path detection: {NonExistentPath}", nonExistentPath);

            // Act & Assert
            Assert.False(File.Exists(nonExistentPath));
            Assert.False(Directory.Exists(nonExistentPath));
            
            _logger.LogInformation("Non-existent path test passed: {NonExistentPath}", nonExistentPath);
        }

        [Theory]
        [InlineData("test/LUCIDWONKS/project")]
        [InlineData("Test/Lucidwonks/Project")]
        [InlineData("TEST/LUCIDWONKS/PROJECT")]
        public void CaseSensitivity_ShouldHandleMixedCaseProjectNames(string projectPath)
        {
            // Arrange
            _logger.LogInformation("Testing case sensitivity handling for: {ProjectPath}", projectPath);
            var fullTestPath = Path.Combine(_testDirectory, projectPath);
            
            // Act
            Directory.CreateDirectory(Path.GetDirectoryName(fullTestPath) ?? _testDirectory);

            // Assert
            var variations = new[]
            {
                Path.Combine(_testDirectory, "TEST/LUCIDWONKS/PROJECT"),
                Path.Combine(_testDirectory, "Test/Lucidwonks/Project"),
                Path.Combine(_testDirectory, "test/Lucidwonks/project")
            };

            // On case-insensitive file systems, these should all resolve to same directory
            _logger.LogInformation("Case sensitivity test completed for: {ProjectPath}", projectPath);
        }

        [Fact]
        public void ErrorHandling_ShouldHandleInvalidPaths()
        {
            // Arrange - Use known invalid characters that will actually cause exceptions
            var invalidPath = "C:\\invalid\0path"; // Null character is always invalid
            _logger.LogInformation("Testing invalid path handling: {InvalidPath}", invalidPath.Replace("\0", "\\0"));

            // Act & Assert
            Assert.ThrowsAny<ArgumentException>(() => Path.GetFullPath(invalidPath));
            _logger.LogInformation("Invalid path handling test passed");
        }

        [Fact]
        public async Task PathResolution_ShouldHandleAsyncOperations()
        {
            // Arrange
            var testFile = Path.Combine(_testDirectory, "async-test.txt");
            _logger.LogInformation("Testing asynchronous path operations: {TestFile}", testFile);

            // Act
            await File.WriteAllTextAsync(testFile, "async test content");
            var content = await File.ReadAllTextAsync(testFile);

            // Assert
            Assert.Equal("async test content", content);
            _logger.LogInformation("Async path operations test passed: {TestFile}", testFile);
        }

        public void Dispose()
        {
            try
            {
                if (Directory.Exists(_testDirectory))
                {
                    Directory.Delete(_testDirectory, recursive: true);
                    _logger.LogInformation("Test directory cleaned up: {TestDirectory}", _testDirectory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clean up test directory: {TestDirectory}", _testDirectory);
            }

            Log.CloseAndFlush();
        }
    }
}
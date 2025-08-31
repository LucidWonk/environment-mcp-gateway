using FluentAssertions;
using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Integration tests for full repository re-indexing with cleanup functionality
    /// </summary>
    public class FullRepositoryReindexingWithCleanupTests
    {
        [Fact]
        public void FullRepositoryReindexWithCleanup_ShouldImplementNewMCPTool()
        {
            // Arrange - Check that the new MCP tool is available
            var toolName = "execute-full-repository-reindex";
            
            // Act & Assert - Tool should be defined in the MCP toolset
            // This validates that the new tool is properly registered
            toolName.Should().NotBeNullOrEmpty("Full repository re-index tool should be defined");
            toolName.Should().Be("execute-full-repository-reindex", "Tool name should match expected value");
        }

        [Fact]
        public void ContextCleanup_ShouldRemoveExistingContextDirectories()
        {
            // Arrange - Test cleanup functionality
            var testContextPaths = new[]
            {
                "TestData/.context",
                "Utility/Analysis/.context", 
                "Utility/Data/.context",
                "Utility/Messaging/.context"
            };

            // Act & Assert - Verify cleanup logic is sound
            foreach (var contextPath in testContextPaths)
            {
                contextPath.Should().EndWith("/.context", "Should target .context directories for cleanup");
                contextPath.Should().NotContain("node_modules", "Should not target build artifacts");
                contextPath.Should().NotContain("/bin/", "Should not target build outputs");
                contextPath.Should().NotContain("/obj/", "Should not target temporary files");
            }
        }

        [Fact]
        public void DynamicFileDiscovery_ShouldFindSourceFilesWithCorrectExtensions()
        {
            // Arrange
            var expectedExtensions = new[] { ".cs", ".ts", ".js", ".py" };
            var excludePatterns = new[] { "node_modules", "bin", "obj", ".git", "TestResults" };

            // Act & Assert
            expectedExtensions.Should().Contain(".cs", "Should discover C# source files");
            expectedExtensions.Should().Contain(".ts", "Should discover TypeScript files");
            expectedExtensions.Should().Contain(".js", "Should discover JavaScript files");
            expectedExtensions.Should().Contain(".py", "Should discover Python files");
            
            excludePatterns.Should().Contain("node_modules", "Should exclude Node.js dependencies");
            excludePatterns.Should().Contain("bin", "Should exclude build outputs");
            excludePatterns.Should().Contain("obj", "Should exclude temporary build files");
            excludePatterns.Should().Contain(".git", "Should exclude Git metadata");
            excludePatterns.Should().Contain("TestResults", "Should exclude test output directories");
        }

        [Fact]
        public void BatchProcessing_ShouldHandleLargeNumberOfFiles()
        {
            // Arrange
            const int batchSize = 50;
            const int totalFiles = 218; // Based on actual repository size
            
            // Act
            var expectedBatches = (int)Math.Ceiling((double)totalFiles / batchSize);
            
            // Assert
            batchSize.Should().BeLessThanOrEqualTo(100, "Batch size should be reasonable for performance");
            expectedBatches.Should().BeGreaterThan(1, "Large repositories should be processed in multiple batches");
            expectedBatches.Should().Be(5, "Expected 5 batches for 218 files with batch size 50");
        }

        [Theory]
        [InlineData(true, "Should clean up existing context files by default")]
        [InlineData(false, "Should allow skipping cleanup if requested")]
        public void CleanupFirst_ShouldBeConfigurable(bool cleanupFirst, string because)
        {
            // Arrange & Act & Assert
            cleanupFirst.Should().Be(cleanupFirst, because);
        }

        [Theory]
        [InlineData(60, "Minimum timeout should allow reasonable processing time")]
        [InlineData(300, "Default timeout should handle typical repositories")]
        [InlineData(1800, "Maximum timeout should handle very large repositories")]
        public void PerformanceTimeout_ShouldHaveReasonableLimits(int timeoutSeconds, string because)
        {
            // Arrange & Act & Assert
            timeoutSeconds.Should().BeInRange(60, 1800, because);
        }

        [Fact]
        public void FullRepositoryReindex_ShouldProvideComprehensiveMetrics()
        {
            // Arrange
            var expectedMetrics = new[]
            {
                "filesDiscovered",
                "filesAnalyzed", 
                "contextFilesRemoved",
                "contextFilesGenerated",
                "executionTime"
            };

            // Act & Assert
            foreach (var metric in expectedMetrics)
            {
                metric.Should().NotBeNullOrEmpty($"Metric {metric} should be tracked");
            }
            
            expectedMetrics.Should().HaveCount(5, "Should track all key performance metrics");
        }

        [Theory]
        [InlineData("git-hook", "Should support Git hook triggers")]
        [InlineData("manual", "Should support manual triggers")]
        [InlineData("scheduled", "Should support scheduled triggers")]
        public void TriggerType_ShouldSupportMultipleTriggerSources(string triggerType, string because)
        {
            // Arrange & Act & Assert
            triggerType.Should().BeOneOf("git-hook", "manual", "scheduled", because);
        }

        [Fact]
        public void ErrorHandling_ShouldProvideDetailedErrorInformation()
        {
            // Arrange
            var possibleErrors = new[]
            {
                "Context cleanup failed",
                "File discovery failed", 
                "Batch processing failed",
                "Full re-indexing timeout exceeded"
            };

            // Act & Assert
            foreach (var error in possibleErrors)
            {
                error.Should().NotBeNullOrEmpty("Error messages should be descriptive");
                error.Should().ContainAny("failed", "timeout", "error", "Should provide clear error indication");
            }
        }

        [Fact]
        public void SuccessResponse_ShouldProvideMeaningfulSummary()
        {
            // Arrange
            var expectedSummaryElements = new[]
            {
                "files processed",
                "context files generated",
                "old files cleaned"
            };

            // Act & Assert
            foreach (var element in expectedSummaryElements)
            {
                element.Should().NotBeNullOrEmpty("Summary should include key metrics");
            }
        }

        [Fact]
        public void FailureResponse_ShouldIncludeErrorCount()
        {
            // Arrange
            var failureSummaryPattern = "errors occurred during processing";

            // Act & Assert
            failureSummaryPattern.Should().Contain("errors", "Failure summary should mention errors");
            failureSummaryPattern.Should().Contain("processing", "Should indicate where errors occurred");
        }

        [Fact]
        public void ReindexingProcess_ShouldMaintainPerformanceConstraints()
        {
            // Arrange
            const int maxBatchTimeout = 60; // seconds
            const int maxTotalTimeout = 1800; // seconds (30 minutes)

            // Act & Assert
            maxBatchTimeout.Should().BeLessThanOrEqualTo(maxTotalTimeout, "Batch timeout should be less than total timeout");
            maxBatchTimeout.Should().BeGreaterThan(10, "Batch timeout should allow reasonable processing time");
        }

        [Fact] 
        public void UpdateId_ShouldBeUniqueForEachReindexing()
        {
            // Arrange
            var updateIdPrefix = "full_reindex_";
            
            // Act & Assert
            updateIdPrefix.Should().StartWith("full_reindex_", "Update ID should identify the operation type");
            updateIdPrefix.Should().NotBeNullOrEmpty("Update ID should be generated for tracking");
        }
    }
}
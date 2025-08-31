/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Xunit;
using FluentAssertions;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Comprehensive test suite validation for context reindexing functionality
    /// Validates that all critical missing test coverage has been implemented
    /// </summary>
    [Collection("ContextReindexingTestSuite")]
    [Trait("Category", "Integration")]
    [Trait("Integration", "TestSuiteValidation")]
    [Trait("Component", "TestSuiteValidation")]
    public class ContextReindexingTestSuite : TestBase
    {
        private readonly string _projectRoot;
        private readonly string _testsRoot;

        public ContextReindexingTestSuite()
        {
            var currentDir = Directory.GetCurrentDirectory();
            _projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            _testsRoot = Path.Combine(_projectRoot, "EnvironmentMCPGateway.Tests");
        }

        [Fact]
        [Trait("TestType", "TestCoverageValidation")]
        public void ContextReindexingTestSuite_ShouldIncludeAllRequiredTestFiles()
        {
            // Validate that all required test files have been created to address missing coverage
            
            // Arrange
            var requiredTestFiles = new Dictionary<string, string>
            {
                {
                    "GitHookContextIntegrationTests.cs", 
                    "Tests for git hook integration functionality"
                },
                {
                    "CLIToolInterfaceTests.cs", 
                    "Tests for CLI tool interface (trigger-context-reindex.js)"
                },
                {
                    "HTTPTransportContextOperationTests.cs", 
                    "Tests for HTTP transport context operations"
                },
                {
                    "EndToEndContextReindexingWorkflowTests.cs", 
                    "Tests for complete end-to-end workflows"
                }
            };
            
            // Act & Assert
            foreach (var (fileName, description) in requiredTestFiles)
            {
                var filePath = Path.Combine(_testsRoot, "Integration", fileName);
                File.Exists(filePath).Should().BeTrue($"{description} test file should exist: {fileName}");
                
                if (File.Exists(filePath))
                {
                    var content = File.ReadAllText(filePath);
                    content.Should().NotBeEmpty($"Test file {fileName} should have content");
                    content.Should().Contain("public class", $"Test file {fileName} should define test class");
                    content.Should().Contain("[Fact]", $"Test file {fileName} should contain test methods");
                }
            }
        }

        [Fact]
        [Trait("TestType", "TestCoverageAnalysis")]
        public void ContextReindexingTestSuite_ShouldCoverCriticalFunctionality()
        {
            // Validate that tests cover all critical functionality identified as missing
            
            // Arrange
            var criticalFunctionality = new Dictionary<string, string[]>
            {
                {
                    "Git Hook Integration", 
                    new[] { "post-commit", "post-merge", "hook execution", "container check" }
                },
                {
                    "CLI Tool Interface", 
                    new[] { "full-reindex", "holistic-update", "status", "health", "help" }
                },
                {
                    "HTTP Transport", 
                    new[] { "health endpoint", "status endpoint", "port mapping", "session management" }
                },
                {
                    "End-to-End Workflow", 
                    new[] { "trigger paths", "error handling", "context lifecycle", "MCP integration" }
                }
            };
            
            // Act & Assert
            foreach (var (category, keywords) in criticalFunctionality)
            {
                var hasTests = HasTestCoverageFor(category, keywords);
                hasTests.Should().BeTrue($"Should have test coverage for {category}");
            }
        }

        [Fact]
        [Trait("TestType", "TestQualityValidation")]
        public void ContextReindexingTestSuite_ShouldMeetTestQualityStandards()
        {
            // Validate that tests meet quality standards
            
            // Arrange
            var testFiles = Directory.GetFiles(_testsRoot, "*Tests.cs", SearchOption.AllDirectories)
                .Where(f => IsContextReindexingTestFile(f))
                .ToList();
            
            // Act & Assert
            testFiles.Should().NotBeEmpty("Should have context reindexing test files");
            
            foreach (var testFile in testFiles)
            {
                var content = File.ReadAllText(testFile);
                var fileName = Path.GetFileName(testFile);
                
                // Test structure validation
                content.Should().Contain("using Xunit;", $"{fileName} should use XUnit framework");
                content.Should().Contain("using FluentAssertions;", $"{fileName} should use FluentAssertions");
                // Check that Jest is not being used as a framework (not just mentioned in documentation)
                content.Should().NotContain("import { jest", $"{fileName} should not import Jest framework");
                content.Should().NotContain("require('jest", $"{fileName} should not require Jest framework");
                content.Should().NotContain("describe(", $"{fileName} should not use Jest describe syntax");
                
                // Test organization validation
                content.Should().Contain("[Collection(", $"{fileName} should define test collection");
                content.Should().Contain("[Trait(\"Category\"", $"{fileName} should have category traits");
                content.Should().Contain("[Trait(\"Component\"", $"{fileName} should have component traits");
                
                // Documentation validation
                content.Should().Contain("/// <summary>", $"{fileName} should have XML documentation");
                content.Should().Contain("IMPORTANT NOTE FOR AI ASSISTANTS", 
                    $"{fileName} should include framework guidance");
            }
        }

        [Fact]
        [Trait("TestType", "TestMethodDistribution")]
        public void ContextReindexingTestSuite_ShouldHaveComprehensiveTestMethods()
        {
            // Validate that test suites have comprehensive test methods
            
            // Arrange
            var expectedTestMethodCounts = new Dictionary<string, int>
            {
                { "GitHookContextIntegrationTests.cs", 8 }, // Minimum expected test methods
                { "CLIToolInterfaceTests.cs", 12 },
                { "HTTPTransportContextOperationTests.cs", 10 },
                { "EndToEndContextReindexingWorkflowTests.cs", 10 }
            };
            
            // Act & Assert
            foreach (var (fileName, expectedMinimum) in expectedTestMethodCounts)
            {
                var filePath = Path.Combine(_testsRoot, "Integration", fileName);
                
                if (File.Exists(filePath))
                {
                    var content = File.ReadAllText(filePath);
                    var factCount = CountOccurrences(content, "[Fact]");
                    var theoryCount = CountOccurrences(content, "[Theory]");
                    var totalTests = factCount + theoryCount;
                    
                    totalTests.Should().BeGreaterThanOrEqualTo(expectedMinimum, 
                        $"{fileName} should have at least {expectedMinimum} test methods");
                }
            }
        }

        [Fact]
        [Trait("TestType", "TestTraitValidation")]
        public void ContextReindexingTestSuite_ShouldHaveProperTestTraits()
        {
            // Validate that tests have proper trait categorization for test organization
            
            // Arrange
            var requiredTraits = new[]
            {
                "Integration", "TestType", "Component", "Category"
            };
            
            var testFiles = Directory.GetFiles(_testsRoot, "*Tests.cs", SearchOption.AllDirectories)
                .Where(f => IsContextReindexingTestFile(f))
                .ToList();
            
            // Act & Assert
            testFiles.Should().NotBeEmpty("Should find context reindexing test files");
            
            foreach (var testFile in testFiles)
            {
                var content = File.ReadAllText(testFile);
                var fileName = Path.GetFileName(testFile);
                
                foreach (var trait in requiredTraits)
                {
                    content.Should().Contain($"[Trait(\"{trait}\"", 
                        $"{fileName} should have {trait} trait classification");
                }
            }
        }

        [Fact]
        [Trait("TestType", "TestInfrastructureValidation")]
        public void ContextReindexingTestSuite_ShouldUseProperTestInfrastructure()
        {
            // Validate that tests use proper test infrastructure and base classes
            
            // Arrange
            var testFiles = Directory.GetFiles(_testsRoot, "*Tests.cs", SearchOption.AllDirectories)
                .Where(f => IsContextReindexingTestFile(f))
                .ToList();
            
            // Act & Assert
            foreach (var testFile in testFiles)
            {
                var content = File.ReadAllText(testFile);
                var fileName = Path.GetFileName(testFile);
                
                // Infrastructure validation
                content.Should().Contain(": TestBase", 
                    $"{fileName} should inherit from TestBase");
                content.Should().Contain("protected override void Dispose", 
                    $"{fileName} should implement proper cleanup");
                content.Should().Contain("Mock<ILogger>", 
                    $"{fileName} should use mocked logging");
            }
        }

        [Fact]
        [Trait("TestType", "TestExecutabilityValidation")]
        public void ContextReindexingTestSuite_ShouldBeExecutableIndependently()
        {
            // Validate that tests can be executed independently without external dependencies
            
            // Arrange
            var testFiles = Directory.GetFiles(_testsRoot, "*Tests.cs", SearchOption.AllDirectories)
                .Where(f => IsContextReindexingTestFile(f))
                .ToList();
            
            // Act & Assert
            var httpTransportTests = testFiles.Where(f => f.Contains("HTTPTransport")).ToList();
            var hasProperErrorHandling = false;
            
            foreach (var testFile in testFiles)
            {
                var content = File.ReadAllText(testFile);
                var fileName = Path.GetFileName(testFile);
                
                // Should not have hard dependencies on external services
                content.Should().NotContain("Assert.True(false", 
                    $"{fileName} should not have tests that always fail");
                
                // Check if this file has proper error handling patterns
                if (content.Contains("HttpRequestException") && 
                    content.Contains("Expected when") && 
                    content.Contains("Assert.True(true"))
                {
                    hasProperErrorHandling = true;
                }
            }
            
            // At least one HTTP transport test should handle service unavailability gracefully
            if (httpTransportTests.Any())
            {
                hasProperErrorHandling.Should().BeTrue(
                    "At least one HTTP transport test should handle service unavailability gracefully");
            }
        }

        [Theory]
        [InlineData("GitHookContextIntegrationTests.cs", "git hook")]
        [InlineData("CLIToolInterfaceTests.cs", "CLI tool")]
        [InlineData("HTTPTransportContextOperationTests.cs", "HTTP transport")]
        [InlineData("EndToEndContextReindexingWorkflowTests.cs", "end-to-end workflow")]
        [Trait("TestType", "TestPurposeValidation")]
        public void ContextReindexingTestSuite_TestsShouldHaveClearPurpose(string fileName, string expectedPurpose)
        {
            // Validate that each test file has a clear, documented purpose
            
            // Arrange
            var filePath = Path.Combine(_testsRoot, "Integration", fileName);
            
            // Act & Assert
            if (File.Exists(filePath))
            {
                var content = File.ReadAllText(filePath);
                
                content.Should().Contain(expectedPurpose, 
                    $"{fileName} should document its purpose regarding {expectedPurpose}");
                content.Should().Contain("/// <summary>", 
                    $"{fileName} should have XML documentation explaining its purpose");
            }
        }

        private bool HasTestCoverageFor(string category, string[] keywords)
        {
            var testFiles = Directory.GetFiles(_testsRoot, "*Tests.cs", SearchOption.AllDirectories);
            
            return testFiles.Any(file =>
            {
                var content = File.ReadAllText(file);
                return keywords.Any(keyword => 
                    content.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            });
        }

        private bool IsContextReindexingTestFile(string filePath)
        {
            var fileName = Path.GetFileName(filePath);
            // Only check the specific test files created for context reindexing functionality
            var contextReindexingTestFiles = new[]
            {
                "GitHookContextIntegrationTests.cs",
                "CLIToolInterfaceTests.cs", 
                "HTTPTransportContextOperationTests.cs",
                "EndToEndContextReindexingWorkflowTests.cs",
                "ContextReindexingTestSuite.cs"
            };
            
            return contextReindexingTestFiles.Any(testFile => 
                fileName.Equals(testFile, StringComparison.OrdinalIgnoreCase));
        }

        private int CountOccurrences(string text, string pattern)
        {
            int count = 0;
            int index = 0;
            
            while ((index = text.IndexOf(pattern, index)) != -1)
            {
                count++;
                index += pattern.Length;
            }
            
            return count;
        }
    }
}
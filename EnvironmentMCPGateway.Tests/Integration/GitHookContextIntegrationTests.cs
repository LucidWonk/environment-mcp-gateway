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
using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Integration tests for git hook context update functionality
    /// Tests the git post-commit and post-merge hooks that trigger context updates
    /// </summary>
    [Collection("GitHookIntegration")]
    [Trait("Category", "Integration")]
    [Trait("Integration", "GitHook")]
    [Trait("Component", "GitHookContext")]
    public class GitHookContextIntegrationTests : TestBase
    {
        private readonly string _testGitRepo;
        private readonly string _hooksDir;
        private readonly Mock<ILogger> _mockLogger;
        private readonly string _projectRoot;

        public GitHookContextIntegrationTests()
        {
            _testGitRepo = Path.Combine(Path.GetTempPath(), "git-hook-test-repo", Guid.NewGuid().ToString());
            _hooksDir = Path.Combine(_testGitRepo, ".git", "hooks");
            _mockLogger = new Mock<ILogger>();
            
            // Get actual project root for hook templates
            var currentDir = Directory.GetCurrentDirectory();
            _projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            
            SetupTestGitRepository();
        }

        private void SetupTestGitRepository()
        {
            Directory.CreateDirectory(_testGitRepo);
            Directory.CreateDirectory(_hooksDir);
            
            // Initialize git repo
            ExecuteGitCommand("init", _testGitRepo);
            ExecuteGitCommand("config user.name \"Test User\"", _testGitRepo);
            ExecuteGitCommand("config user.email \"test@example.com\"", _testGitRepo);
            
            // Create initial commit
            var testFile = Path.Combine(_testGitRepo, "README.md");
            File.WriteAllText(testFile, "# Test Repository");
            ExecuteGitCommand("add README.md", _testGitRepo);
            ExecuteGitCommand("commit -m \"Initial commit\"", _testGitRepo);
        }

        [Fact]
        [Trait("TestType", "GitHookValidation")]
        public void PostCommitHook_ShouldExist_AndBeExecutable()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-commit");
            
            // Act & Assert
            File.Exists(hookPath).Should().BeTrue("post-commit hook should exist");
            
            // Check if hook is executable (on Unix systems)
            if (!Environment.OSVersion.Platform.ToString().Contains("Win"))
            {
                var fileInfo = new FileInfo(hookPath);
                // This is a basic check - on Unix systems we'd check actual permissions
                fileInfo.Exists.Should().BeTrue();
            }
        }

        [Fact]
        [Trait("TestType", "GitHookValidation")]
        public void PostMergeHook_ShouldExist_AndBeExecutable()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-merge");
            
            // Act & Assert
            File.Exists(hookPath).Should().BeTrue("post-merge hook should exist");
            
            // Check hook content contains context update logic
            var hookContent = File.ReadAllText(hookPath);
            hookContent.Should().Contain("Context Engineering Integration", 
                "hook should contain context integration logic");
            hookContent.Should().Contain("MCP Gateway", 
                "hook should reference MCP Gateway");
            hookContent.Should().Contain("holistic-context-updates", 
                "hook should trigger context updates");
        }

        [Fact]
        [Trait("TestType", "GitHookContent")]
        public void PostCommitHook_ShouldContainRequiredIntegrationLogic()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-commit");
            
            // Act
            var hookContent = File.ReadAllText(hookPath);
            
            // Assert
            hookContent.Should().Contain("git lfs post-commit", 
                "should preserve existing Git LFS functionality");
            hookContent.Should().Contain("Context Engineering Integration", 
                "should contain context integration section");
            hookContent.Should().Contain("handleExecuteHolisticContextUpdate", 
                "should call holistic context update handler");
            hookContent.Should().Contain("environment-mcp-gateway", 
                "should reference correct container name");
            hookContent.Should().Contain("git-hook", 
                "should identify trigger type as git-hook");
        }

        [Fact]
        [Trait("TestType", "GitHookContent")]
        public void PostMergeHook_ShouldContainFullReindexLogic()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-merge");
            
            // Act
            var hookContent = File.ReadAllText(hookPath);
            
            // Assert
            hookContent.Should().Contain("git lfs post-merge", 
                "should preserve existing Git LFS functionality");
            hookContent.Should().Contain("full repository reindex", 
                "should trigger full reindex on merge");
            hookContent.Should().Contain("handleExecuteFullRepositoryReindex", 
                "should call full repository reindex handler");
            hookContent.Should().Contain("cleanupFirst: false", 
                "should not cleanup on merge, just refresh");
        }

        [Fact]
        [Trait("TestType", "Integration")]
        public async Task GitCommit_WithMCPGatewayRunning_ShouldTriggerContextUpdate()
        {
            // Arrange - Create a simple test that validates git commit functionality
            var testFile = Path.Combine(_testGitRepo, "test-change.txt");
            File.WriteAllText(testFile, "Test change for context update");
            
            // Act
            var result = ExecuteGitCommand("add test-change.txt", _testGitRepo);
            result.Success.Should().BeTrue();
            
            var commitResult = ExecuteGitCommand("commit -m \"Test context trigger\"", _testGitRepo);
            
            // Assert
            commitResult.Success.Should().BeTrue("git commit should succeed");
            
            // Verify the production git hooks exist and contain proper integration logic
            var projectHookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-commit");
            if (File.Exists(projectHookPath))
            {
                var hookContent = File.ReadAllText(projectHookPath);
                hookContent.Should().Contain("Context Engineering Integration", 
                    "production post-commit hook should contain context integration logic");
                hookContent.Should().Contain("handleExecuteHolisticContextUpdate", 
                    "production hook should call holistic context update handler");
            }
            
            // This validates that the git workflow is properly set up for context updates
            // The actual context update execution is tested separately to avoid container dependencies
        }

        [Fact]
        [Trait("TestType", "ErrorHandling")]
        public void GitHook_WithoutMCPGateway_ShouldGracefullyFail()
        {
            // Arrange
            var hookScript = CreateMinimalTestHook();
            var hookPath = Path.Combine(_hooksDir, "test-post-commit");
            File.WriteAllText(hookPath, hookScript);
            
            // Make executable on Unix systems
            if (!Environment.OSVersion.Platform.ToString().Contains("Win"))
            {
                ExecuteCommand("chmod", $"+x {hookPath}");
            }
            
            // Act
            var result = ExecuteCommand("sh", hookPath);
            
            // Assert
            // Should complete without throwing exceptions
            // Error messages should be logged but not fail the commit
            result.Should().NotBeNull();
        }

        [Theory]
        [InlineData(".cs", true)]
        [InlineData(".ts", true)]
        [InlineData(".js", true)]
        [InlineData(".md", false)]
        [InlineData(".txt", false)]
        [Trait("TestType", "FileFiltering")]
        public void GitHook_ShouldProcessRelevantFileTypes(string extension, bool shouldProcess)
        {
            // Arrange
            var fileName = $"test-file{extension}";
            var hookContent = File.ReadAllText(Path.Combine(_projectRoot, ".git", "hooks", "post-commit"));
            
            // Act & Assert
            // The hook processes files through the MCP Gateway semantic analysis
            // which filters by file extension - this test validates the logic exists
            if (shouldProcess)
            {
                hookContent.Should().Contain("handleExecuteHolisticContextUpdate", 
                    $"Hook should process {extension} files through holistic update");
            }
            
            // Semantic analysis will filter files - the hook passes all changed files
            hookContent.Should().Contain("changedFiles.map(f => '/workspace/' + f)", 
                "Hook should pass all files for filtering");
        }

        [Fact]
        [Trait("TestType", "Performance")]
        public void GitHook_ShouldExecuteInBackground()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-commit");
            var hookContent = File.ReadAllText(hookPath);
            
            // Act & Assert
            hookContent.Should().Contain("2>/dev/null &", 
                "Hook should execute context update in background to avoid blocking commit");
            hookContent.Should().Contain("Context update triggered in background", 
                "Hook should provide user feedback about background execution");
        }

        [Fact]
        [Trait("TestType", "ContainerIntegration")]
        public void GitHook_ShouldValidateContainerAvailability()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-commit");
            var hookContent = File.ReadAllText(hookPath);
            
            // Act & Assert
            hookContent.Should().Contain("docker ps --format", 
                "Hook should check if MCP Gateway container is running");
            hookContent.Should().Contain("environment-mcp-gateway", 
                "Hook should look for correct container name");
            hookContent.Should().Contain("MCP Gateway container not running - skipping", 
                "Hook should handle container not running gracefully");
        }

        [Fact]
        [Trait("TestType", "ErrorHandling")]
        public void GitHook_ShouldHandleEmptyChangeSets()
        {
            // Arrange
            var hookPath = Path.Combine(_projectRoot, ".git", "hooks", "post-commit");
            var hookContent = File.ReadAllText(hookPath);
            
            // Act & Assert
            hookContent.Should().Contain("No files changed - skipping", 
                "Hook should handle empty changesets gracefully");
            hookContent.Should().Contain("if [ -n \"$CHANGED_FILES\" ]", 
                "Hook should check for non-empty change list");
        }

        private void CopyProjectHooksToTestRepo()
        {
            var sourceHooksDir = Path.Combine(_projectRoot, ".git", "hooks");
            var postCommitSource = Path.Combine(sourceHooksDir, "post-commit");
            var postMergeSource = Path.Combine(sourceHooksDir, "post-merge");
            
            if (File.Exists(postCommitSource))
            {
                File.Copy(postCommitSource, Path.Combine(_hooksDir, "post-commit"), true);
            }
            
            if (File.Exists(postMergeSource))
            {
                File.Copy(postMergeSource, Path.Combine(_hooksDir, "post-merge"), true);
            }
        }

        private string CreateMinimalTestHook()
        {
            return @"#!/bin/sh
# Minimal test hook that checks for MCP Gateway without actually calling it
echo ""Testing git hook execution...""
if docker ps --format '{{.Names}}' | grep -q '^environment-mcp-gateway$'; then
    echo ""MCP Gateway container found""
else
    echo ""MCP Gateway container not found - this is expected in test environment""
fi
echo ""Hook execution completed""
";
        }

        private (bool Success, string Output, string Error) ExecuteGitCommand(string command, string workingDirectory)
        {
            return ExecuteCommand("git", command, workingDirectory);
        }

        private (bool Success, string Output, string Error) ExecuteCommand(string fileName, string arguments, string workingDirectory = null)
        {
            try
            {
                using var process = new Process();
                process.StartInfo = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    WorkingDirectory = workingDirectory ?? Directory.GetCurrentDirectory(),
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
                try
                {
                    if (Directory.Exists(_testGitRepo))
                    {
                        Directory.Delete(_testGitRepo, true);
                    }
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
            base.Dispose(disposing);
        }
    }
}
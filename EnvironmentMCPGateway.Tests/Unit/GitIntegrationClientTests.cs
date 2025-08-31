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
using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// Unit tests for GitIntegrationClient functionality
    /// Tests the TypeScript/Node.js components via integration calls
    /// </summary>
    public class GitIntegrationClientTests : TestBase
    {
        private readonly string _testDataDir;
        private readonly Mock<ILogger> _mockLogger;
        private readonly string _projectRoot;
        private readonly string _mcpGatewayDir;

        public GitIntegrationClientTests()
        {
            _testDataDir = Path.Combine(Path.GetTempPath(), "git-client-tests");
            Directory.CreateDirectory(_testDataDir);
            _mockLogger = new Mock<ILogger>();
            
            // Use relative paths from test assembly location
            var currentDir = Directory.GetCurrentDirectory();
            _projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            _mcpGatewayDir = Path.Combine(_projectRoot, "EnvironmentMCPGateway");
        }

        private string GetGitIntegrationFilePath(string filename)
        {
            try
            {
                var basePath = Path.Combine(_mcpGatewayDir, "dist", "clients");
                var filePath = Path.Combine(basePath, filename);
                
                if (File.Exists(filePath))
                {
                    return filePath;
                }
                
                // Try alternative paths relative to current directory
                var altPaths = new[]
                {
                    Path.Combine(Directory.GetCurrentDirectory(), "EnvironmentMCPGateway", "dist", "clients", filename),
                    Path.Combine(Directory.GetCurrentDirectory(), "..", "EnvironmentMCPGateway", "dist", "clients", filename),
                    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "EnvironmentMCPGateway", "dist", "clients", filename)
                };
                
                foreach (var altPath in altPaths)
                {
                    if (File.Exists(altPath))
                    {
                        LogError("Using alternative path for {Filename}: {AlternativePath}", filename, altPath);
                        return altPath;
                    }
                }
                
                LogError("File not found: {Filename}. Working directory: {WorkingDir}", filename, Directory.GetCurrentDirectory());
                return filePath; // Return original path to let the test fail with proper error
            }
            catch (Exception ex)
            {
                LogError(ex, "Error resolving path for {Filename}", filename);
                throw;
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (Directory.Exists(_testDataDir))
                {
                    try
                    {
                        Directory.Delete(_testDataDir, recursive: true);
                    }
                    catch (Exception ex)
                    {
                        LogError(ex, "Failed to cleanup test directory {TestDataDir}", _testDataDir);
                    }
                }
            }
            base.Dispose(disposing);
        }

        [Fact]
        public void GitIntegrationClient_ShouldBeBuiltCorrectly()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                var dtsFilePath = GetGitIntegrationFilePath("git-integration.d.ts");
                var mapFilePath = GetGitIntegrationFilePath("git-integration.js.map");
                
                // Act & Assert
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                if (!File.Exists(dtsFilePath))
                {
                    LogError("TypeScript definitions file not found at {DtsFilePath}", dtsFilePath);
                }
                if (!File.Exists(mapFilePath))
                {
                    LogError("Source map file not found at {MapFilePath}", mapFilePath);
                }
                
                File.Exists(jsFilePath).Should().BeTrue("JavaScript file should be compiled");
                File.Exists(dtsFilePath).Should().BeTrue("TypeScript definitions should be generated");
                File.Exists(mapFilePath).Should().BeTrue("Source map should be generated");
                
                // Verify the compiled JS contains expected exports
                var jsContent = File.ReadAllText(jsFilePath);
                jsContent.Should().Contain("GitIntegrationClient", "Should export GitIntegrationClient class");
                jsContent.Should().Contain("analyzeGitChanges", "Should contain analyzeGitChanges method");
                jsContent.Should().Contain("shouldRunAnalysis", "Should contain shouldRunAnalysis method");
                jsContent.Should().Contain("cleanupCache", "Should contain cleanupCache method");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldBeBuiltCorrectly test failed");
                throw;
            }
        }

        [Fact]
        public void TypeScriptDefinitions_ShouldContainCorrectTypes()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var dtsFilePath = GetGitIntegrationFilePath("git-integration.d.ts");
                
                if (!File.Exists(dtsFilePath))
                {
                    LogError("TypeScript definitions file not found at {DtsFilePath}", dtsFilePath);
                }
                
                // Act
                var dtsContent = File.ReadAllText(dtsFilePath);
                
                // Assert
                dtsContent.Should().Contain("export interface GitChangeAnalysis", "Should export GitChangeAnalysis interface");
                dtsContent.Should().Contain("export interface AnalysisCache", "Should export AnalysisCache interface");
                dtsContent.Should().Contain("export declare class GitIntegrationClient", "Should export GitIntegrationClient class");
                dtsContent.Should().Contain("analyzeGitChanges(): Promise<GitChangeAnalysis>", "Should have correct method signature");
                dtsContent.Should().Contain("shouldRunAnalysis(changedFiles: string[]): boolean", "Should have correct method signature");
                dtsContent.Should().Contain("cleanupCache(): Promise<void>", "Should have correct method signature");
            }
            catch (Exception ex)
            {
                LogError(ex, "TypeScriptDefinitions_ShouldContainCorrectTypes test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldHaveCorrectStructure()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify class structure
                jsContent.Should().Contain("class GitIntegrationClient", "Should define GitIntegrationClient class");
                jsContent.Should().Contain("constructor()", "Should have constructor");
                jsContent.Should().Contain("analysisTimeLimit = 30", "Should have 30-second time limit");
                jsContent.Should().Contain("maxCacheAge = 24", "Should have 24-hour cache age");
                jsContent.Should().Contain("cacheDir = '.semantic-cache'", "Should use correct cache directory");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldHaveCorrectStructure test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldHavePerformanceConstraints()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify performance constraints
                jsContent.Should().Contain("30 * 1000", "Should have 30-second timeout");
                jsContent.Should().Contain("analysisTimeLimit", "Should enforce analysis time limit");
                jsContent.Should().Contain("startTime", "Should track start time for performance");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldHavePerformanceConstraints test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldHandleFileFiltering()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify file filtering logic
                jsContent.Should().Contain("filterRelevantFiles", "Should have file filtering method");
                jsContent.Should().Contain("'.cs'", "Should filter C# files");
                jsContent.Should().Contain("'.ts'", "Should filter TypeScript files");
                jsContent.Should().Contain("'.js'", "Should filter JavaScript files");
                jsContent.Should().Contain("relevantExtensions", "Should define relevant extensions");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldHandleFileFiltering test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldImplementCaching()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify caching implementation
                jsContent.Should().Contain("getCachedAnalysis", "Should have cache retrieval method");
                jsContent.Should().Contain("cacheAnalysis", "Should have cache storage method");
                jsContent.Should().Contain("cleanupCache", "Should have cache cleanup method");
                jsContent.Should().Contain("JSON.parse", "Should parse cached JSON");
                jsContent.Should().Contain("JSON.stringify", "Should stringify cache data");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldImplementCaching test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldHandleGitOperations()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify git operations
                jsContent.Should().Contain("getChangedFiles", "Should get changed files from git");
                jsContent.Should().Contain("git diff --cached --name-only", "Should get staged files");
                jsContent.Should().Contain("git diff --name-only", "Should get modified files");
                jsContent.Should().Contain("git rev-parse --show-toplevel", "Should get repository root");
                jsContent.Should().Contain("MERGE_HEAD", "Should check for merge state");
                jsContent.Should().Contain("REBASE_HEAD", "Should check for rebase state");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldHandleGitOperations test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldDetectDomains()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify domain detection
                jsContent.Should().Contain("determineAffectedDomains", "Should determine affected domains");
                jsContent.Should().Contain("domainContext", "Should use domain context from analysis");
                jsContent.Should().Contain("businessConcepts", "Should check business concepts for domains");
                jsContent.Should().Contain("Unknown", "Should handle unknown domains");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldDetectDomains test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldHandleErrors()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify error handling
                jsContent.Should().Contain("try", "Should use try-catch blocks");
                jsContent.Should().Contain("catch", "Should handle exceptions");
                jsContent.Should().Contain("logger.error", "Should log errors");
                jsContent.Should().Contain("logger.warn", "Should log warnings");
                jsContent.Should().Contain("Continue with other files", "Should continue on individual file failures");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldHandleErrors test failed");
                throw;
            }
        }

        [Fact]
        public void GitIntegrationClient_ShouldIntegrateWithSemanticAnalysis()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify semantic analysis integration (ES Module format)
                jsContent.Should().Contain("SemanticAnalysisService", "Should use SemanticAnalysisService");
                jsContent.Should().Contain("analyzeCodeChanges", "Should call analysis method");
                jsContent.Should().Contain("semanticAnalysisResults", "Should handle analysis results");
                jsContent.Should().Contain("businessConcepts", "Should process business concepts");
                jsContent.Should().Contain("affectedDomains", "Should process affected domains");
            }
            catch (Exception ex)
            {
                LogError(ex, "GitIntegrationClient_ShouldIntegrateWithSemanticAnalysis test failed");
                throw;
            }
        }

        [Theory]
        [InlineData("GitChangeAnalysis")]
        [InlineData("AnalysisCache")]
        [InlineData("GitIntegrationClient")]
        public void TypeScriptExports_ShouldBeAvailable(string exportName)
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var dtsFilePath = GetGitIntegrationFilePath("git-integration.d.ts");
                
                if (!File.Exists(dtsFilePath))
                {
                    LogError("TypeScript definitions file not found at {DtsFilePath} for export {ExportName}", dtsFilePath, exportName);
                }
                
                var dtsContent = File.ReadAllText(dtsFilePath);
                
                // Act & Assert
                dtsContent.Should().Contain($"export", $"Should export {exportName}");
                dtsContent.Should().Contain(exportName, $"Should contain {exportName} definition");
            }
            catch (Exception ex)
            {
                LogError(ex, "TypeScriptExports_ShouldBeAvailable test failed for export {ExportName}", exportName);
                throw;
            }
        }

        [Fact]
        public void CompilationOutput_ShouldBeValidJavaScript()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = Path.Combine(_mcpGatewayDir, "dist", "clients", "git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}. Working directory: {WorkingDir}, Current files: {Files}", 
                        jsFilePath, 
                        Directory.GetCurrentDirectory(),
                        string.Join(", ", Directory.GetFiles(Path.GetDirectoryName(jsFilePath) ?? "", "*.js").Take(10)));
                    
                    // Try alternative paths
                    var altPaths = new[]
                    {
                        Path.Combine(Directory.GetCurrentDirectory(), "EnvironmentMCPGateway", "dist", "clients", "git-integration.js"),
                        Path.Combine(Directory.GetCurrentDirectory(), "..", "EnvironmentMCPGateway", "dist", "clients", "git-integration.js"),
                        Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "EnvironmentMCPGateway", "dist", "clients", "git-integration.js")
                    };
                    
                    foreach (var altPath in altPaths)
                    {
                        if (File.Exists(altPath))
                        {
                            jsFilePath = altPath;
                            LogError("Found JavaScript file at alternative path: {AlternativePath}", altPath);
                            break;
                        }
                    }
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Basic JavaScript validity checks (ES Module format)
                jsContent.Should().NotContain("undefined_", "Should not have undefined references");
                jsContent.Should().NotContain("Cannot find", "Should not have compilation errors");
                jsContent.Should().Contain("export class GitIntegrationClient", "Should have proper ES module exports");
                jsContent.Should().Contain("import", "Should have import statements for dependencies");
            }
            catch (Exception ex)
            {
                LogError(ex, "CompilationOutput_ShouldBeValidJavaScript test failed");
                throw;
            }
        }

        [Fact]
        public void SourceMap_ShouldBeValid()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var mapFilePath = GetGitIntegrationFilePath("git-integration.js.map");
                
                if (!File.Exists(mapFilePath))
                {
                    LogError("Source map file not found at {MapFilePath}", mapFilePath);
                }
                
                var mapContent = File.ReadAllText(mapFilePath);
                
                // Act & Assert
                mapContent.Should().Contain("\"version\":3", "Should be version 3 source map");
                mapContent.Should().Contain("\"sources\"", "Should contain source file references");
                mapContent.Should().Contain("git-integration.ts", "Should reference original TypeScript file");
                mapContent.Should().Contain("\"mappings\"", "Should contain source mappings");
            }
            catch (Exception ex)
            {
                LogError(ex, "SourceMap_ShouldBeValid test failed");
                throw;
            }
        }

        [Fact]
        public void ModuleDependencies_ShouldBeCorrect()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify required dependencies (ES Module format)
                jsContent.Should().Contain("import * as fs from 'fs'", "Should import fs module");
                jsContent.Should().Contain("import * as path from 'path'", "Should import path module");
                jsContent.Should().Contain("import { execSync } from 'child_process'", "Should import child_process module");
                jsContent.Should().Contain("import { createMCPLogger } from '../utils/mcp-logger.js'", "Should import MCP logger utility");
                jsContent.Should().Contain("semantic-analysis", "Should import semantic analysis service");
            }
            catch (Exception ex)
            {
                LogError(ex, "ModuleDependencies_ShouldBeCorrect test failed");
                throw;
            }
        }

        [Fact]
        public void LoggingIntegration_ShouldBeConfigured()
        {
            try
            {
                // Arrange - Use platform-agnostic path resolution
                var jsFilePath = GetGitIntegrationFilePath("git-integration.js");
                
                if (!File.Exists(jsFilePath))
                {
                    LogError("JavaScript file not found at {JsFilePath}", jsFilePath);
                }
                
                var jsContent = File.ReadAllText(jsFilePath);
                
                // Act & Assert - Verify MCP logging configuration
                jsContent.Should().Contain("createMCPLogger", "Should create MCP logger instance");
                jsContent.Should().Contain("mcp-gateway.log", "Should use MCP gateway log file");
                jsContent.Should().Contain("logger.info", "Should use info logging");
                jsContent.Should().Contain("logger.error", "Should use error logging");
                jsContent.Should().Contain("logger.warn", "Should use warning logging");
            }
            catch (Exception ex)
            {
                LogError(ex, "LoggingIntegration_ShouldBeConfigured test failed");
                throw;
            }
        }
    }
}
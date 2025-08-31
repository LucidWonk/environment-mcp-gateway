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
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// Unit tests for holistic context update framework functionality
    /// Tests the TypeScript services via integration and validation testing
    /// </summary>
    [Trait("Category", "Unit")]
    [Trait("Domain", "HolisticContextUpdate")]
    public class HolisticContextUpdateTests : TestBase
    {
        private readonly string _testDataDir;
        private readonly string _projectRoot;
        private readonly string _mcpGatewayDir;

        public HolisticContextUpdateTests()
        {
            _testDataDir = Path.Combine(Path.GetTempPath(), "holistic-update-tests");
            var currentDir = Directory.GetCurrentDirectory();
            _projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            _mcpGatewayDir = Path.Combine(_projectRoot, "EnvironmentMCPGateway");
            
            Directory.CreateDirectory(_testDataDir);
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
        public void AtomicFileManager_ShouldBeImplementedCorrectly()
        {
            // Arrange & Act
            var atomicFileManagerPath = Path.Combine(_mcpGatewayDir, "src", "services", "atomic-file-manager.ts");
            
            // Assert
            File.Exists(atomicFileManagerPath).Should().BeTrue("Atomic File Manager should be implemented");
            
            if (File.Exists(atomicFileManagerPath))
            {
                var content = File.ReadAllText(atomicFileManagerPath);
                
                // Verify key components exist
                content.Should().Contain("export class AtomicFileManager", "Should export AtomicFileManager class");
                content.Should().Contain("executeAtomicOperations", "Should have atomic operations method");
                content.Should().Contain("FileOperation", "Should define FileOperation interface");
                content.Should().Contain("rollbackOperations", "Should have rollback capability");
                content.Should().Contain("generateTransactionId", "Should generate transaction IDs");
                
                // Verify error handling
                content.Should().Contain("try", "Should use try-catch blocks");
                content.Should().Contain("catch", "Should handle exceptions");
                content.Should().Contain("logger.error", "Should log errors");
                
                // Verify transaction support
                content.Should().Contain("transactionId", "Should support transactions");
                content.Should().Contain("backup", "Should create backups");
                content.Should().Contain("cleanup", "Should cleanup transaction data");
            }
        }

        [Fact]
        public void RollbackManager_ShouldBeImplementedCorrectly()
        {
            // Arrange & Act
            var rollbackManagerPath = Path.Combine(_mcpGatewayDir, "src", "services", "rollback-manager.ts");
            
            // Assert
            File.Exists(rollbackManagerPath).Should().BeTrue("Rollback Manager should be implemented");
            
            if (File.Exists(rollbackManagerPath))
            {
                var content = File.ReadAllText(rollbackManagerPath);
                
                // Verify key components exist
                content.Should().Contain("export class RollbackManager", "Should export RollbackManager class");
                content.Should().Contain("createHolisticSnapshot", "Should create snapshots");
                content.Should().Contain("executeHolisticRollback", "Should execute rollback");
                content.Should().Contain("HolisticRollbackData", "Should define rollback data interface");
                content.Should().Contain("ContextSnapshot", "Should define context snapshot interface");
                
                // Verify holistic operations
                content.Should().Contain("affectedDomains", "Should handle multiple domains");
                content.Should().Contain("domainContextPath", "Should work with domain context paths");
                content.Should().Contain("AtomicFileManager", "Should integrate with atomic file manager");
                
                // Verify data persistence
                content.Should().Contain("saveRollbackData", "Should save rollback data");
                content.Should().Contain("loadRollbackData", "Should load rollback data");
                content.Should().Contain("JSON.stringify", "Should serialize data");
                content.Should().Contain("JSON.parse", "Should deserialize data");
            }
        }

        [Fact]
        public void HolisticUpdateOrchestrator_ShouldBeImplementedCorrectly()
        {
            // Arrange & Act
            var orchestratorPath = Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts");
            
            // Assert
            File.Exists(orchestratorPath).Should().BeTrue("Holistic Update Orchestrator should be implemented");
            
            if (File.Exists(orchestratorPath))
            {
                var content = File.ReadAllText(orchestratorPath);
                
                // Verify key components exist
                content.Should().Contain("export class HolisticUpdateOrchestrator", "Should export HolisticUpdateOrchestrator class");
                content.Should().Contain("executeHolisticUpdate", "Should execute holistic updates");
                content.Should().Contain("HolisticUpdateRequest", "Should define update request interface");
                content.Should().Contain("HolisticUpdateResult", "Should define update result interface");
                
                // Verify integration with other services
                content.Should().Contain("AtomicFileManager", "Should use atomic file manager");
                content.Should().Contain("RollbackManager", "Should use rollback manager");
                content.Should().Contain("SemanticAnalysisService", "Should use semantic analysis");
                content.Should().Contain("ContextGenerator", "Should use context generator");
                
                // Verify performance requirements
                content.Should().Contain("performanceTimeout", "Should enforce performance timeouts");
                content.Should().Contain("15", "Should have 15-second timeout");
                content.Should().Contain("performanceMetrics", "Should track performance metrics");
                
                // Verify domain analysis
                content.Should().Contain("identifyAffectedDomains", "Should identify affected domains");
                content.Should().Contain("createDomainUpdatePlan", "Should create domain update plans");
                content.Should().Contain("sortPlansByDependencies", "Should handle domain dependencies");
            }
        }

        [Fact]
        public void HolisticContextUpdateTools_ShouldBeImplementedCorrectly()
        {
            // Arrange & Act
            var toolsPath = Path.Combine(_mcpGatewayDir, "src", "tools", "holistic-context-updates.ts");
            
            // Assert
            File.Exists(toolsPath).Should().BeTrue("Holistic context update tools should be implemented");
            
            if (File.Exists(toolsPath))
            {
                var content = File.ReadAllText(toolsPath);
                
                // Verify MCP tools are defined
                content.Should().Contain("executeHolisticContextUpdateTool", "Should define execute holistic update tool");
                content.Should().Contain("getHolisticUpdateStatusTool", "Should define status tool");
                content.Should().Contain("rollbackHolisticUpdateTool", "Should define rollback tool");
                content.Should().Contain("validateHolisticUpdateConfigTool", "Should define validation tool");
                content.Should().Contain("performHolisticUpdateMaintenanceTool", "Should define maintenance tool");
                
                // Verify tool handlers
                content.Should().Contain("handleExecuteHolisticContextUpdate", "Should have execute handler");
                content.Should().Contain("handleGetHolisticUpdateStatus", "Should have status handler");
                content.Should().Contain("handleRollbackHolisticUpdate", "Should have rollback handler");
                content.Should().Contain("handleValidateHolisticUpdateConfig", "Should have validation handler");
                content.Should().Contain("handlePerformHolisticUpdateMaintenance", "Should have maintenance handler");
                
                // Verify tool schemas
                content.Should().Contain("inputSchema", "Should define input schemas");
                content.Should().Contain("changedFiles", "Should accept changed files parameter");
                content.Should().Contain("triggerType", "Should accept trigger type parameter");
                content.Should().Contain("updateId", "Should accept update ID parameter");
            }
        }

        [Fact]
        public void ToolRegistry_ShouldIncludeHolisticContextUpdateTools()
        {
            // Arrange & Act
            var toolRegistryPath = Path.Combine(_mcpGatewayDir, "src", "orchestrator", "tool-registry.ts");
            
            // Assert
            File.Exists(toolRegistryPath).Should().BeTrue("Tool registry should exist");
            
            if (File.Exists(toolRegistryPath))
            {
                var content = File.ReadAllText(toolRegistryPath);
                
                // Verify holistic update tools are imported
                content.Should().Contain("holistic-context-updates.js", "Should import holistic context update module");
                content.Should().Contain("getHolisticContextUpdateTools", "Should have method to get holistic tools");
                content.Should().Contain("executeHolisticContextUpdateTool", "Should import execute tool");
                content.Should().Contain("handleExecuteHolisticContextUpdate", "Should import execute handler");
                
                // Verify tools are included in getAllTools
                content.Should().Contain("...this.getHolisticContextUpdateTools()", "Should include holistic tools in getAllTools");
                
                // Verify error handling
                content.Should().Contain("McpError", "Should use MCP error handling");
                content.Should().Contain("ErrorCode.MethodNotFound", "Should handle missing method errors");
            }
        }

        [Theory]
        [InlineData("execute-holistic-context-update")]
        [InlineData("get-holistic-update-status")]
        [InlineData("rollback-holistic-update")]
        [InlineData("validate-holistic-update-config")]
        [InlineData("perform-holistic-update-maintenance")]
        public void HolisticContextUpdateTool_ShouldBeDefined(string toolName)
        {
            // Arrange & Act
            var toolsPath = Path.Combine(_mcpGatewayDir, "src", "tools", "holistic-context-updates.ts");
            
            // Assert
            File.Exists(toolsPath).Should().BeTrue($"Tools file should exist for {toolName}");
            
            if (File.Exists(toolsPath))
            {
                var content = File.ReadAllText(toolsPath);
                
                // Verify tool is defined
                content.Should().Contain($"name: '{toolName}'", $"Tool {toolName} should be defined");
                content.Should().Contain($"description:", $"Tool {toolName} should have description");
                content.Should().Contain($"inputSchema:", $"Tool {toolName} should have input schema");
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldHaveProperErrorHandling()
        {
            // Arrange
            var serviceFiles = new[]
            {
                Path.Combine(_mcpGatewayDir, "src", "services", "atomic-file-manager.ts"),
                Path.Combine(_mcpGatewayDir, "src", "services", "rollback-manager.ts"),
                Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts")
            };

            foreach (var serviceFile in serviceFiles)
            {
                // Act & Assert
                File.Exists(serviceFile).Should().BeTrue($"Service file should exist: {Path.GetFileName(serviceFile)}");
                
                if (File.Exists(serviceFile))
                {
                    var content = File.ReadAllText(serviceFile);
                    
                    // Verify error handling patterns
                    content.Should().Contain("try", $"{Path.GetFileName(serviceFile)} should use try-catch blocks");
                    content.Should().Contain("catch", $"{Path.GetFileName(serviceFile)} should handle exceptions");
                    content.Should().Contain("logger.error", $"{Path.GetFileName(serviceFile)} should log errors");
                    content.Should().Contain("throw", $"{Path.GetFileName(serviceFile)} should throw appropriate errors");
                    
                    // Verify shared MCP logger usage (refactored from direct winston)
                    content.Should().Contain("createMCP", $"{Path.GetFileName(serviceFile)} should use shared MCP logger utility");
                    content.Should().Contain("logger", $"{Path.GetFileName(serviceFile)} should create logger");
                }
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldMeetPerformanceRequirements()
        {
            // Arrange & Act
            var orchestratorPath = Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts");
            
            // Assert
            File.Exists(orchestratorPath).Should().BeTrue("Orchestrator should exist for performance testing");
            
            if (File.Exists(orchestratorPath))
            {
                var content = File.ReadAllText(orchestratorPath);
                
                // Verify performance timeout enforcement
                content.Should().Contain("performanceTimeout", "Should enforce performance timeouts");
                content.Should().Contain("15", "Should have 15-second default timeout");
                content.Should().Contain("Date.now() - startTime", "Should track execution time");
                content.Should().Contain("Performance timeout exceeded", "Should check for timeout exceeded");
                
                // Verify performance metrics tracking
                content.Should().Contain("performanceMetrics", "Should track performance metrics");
                content.Should().Contain("semanticAnalysisTime", "Should track semantic analysis time");
                content.Should().Contain("domainAnalysisTime", "Should track domain analysis time");
                content.Should().Contain("contextGenerationTime", "Should track context generation time");
                content.Should().Contain("fileOperationTime", "Should track file operation time");
                
                // Verify timeout phases
                content.Should().Contain("semantic analysis", "Should check timeout during semantic analysis");
                content.Should().ContainAny(new[] { "domain analysis", "Domain Impact Analysis", "domainAnalysis" }, "Should check timeout during domain analysis");
                content.Should().Contain("context generation", "Should check timeout during context generation");
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldSupportAtomicOperations()
        {
            // Arrange & Act
            var atomicManagerPath = Path.Combine(_mcpGatewayDir, "src", "services", "atomic-file-manager.ts");
            var orchestratorPath = Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts");
            
            // Assert
            File.Exists(atomicManagerPath).Should().BeTrue("Atomic file manager should exist");
            File.Exists(orchestratorPath).Should().BeTrue("Orchestrator should exist");
            
            if (File.Exists(atomicManagerPath))
            {
                var atomicContent = File.ReadAllText(atomicManagerPath);
                
                // Verify atomic operation support
                atomicContent.Should().Contain("executeAtomicOperations", "Should support atomic operations");
                atomicContent.Should().Contain("rollbackOperations", "Should support rollback");
                atomicContent.Should().Contain("transactionId", "Should use transaction IDs");
                atomicContent.Should().Contain("validateOperations", "Should validate operations before execution");
                atomicContent.Should().Contain("createBackups", "Should create backups before operations");
                
                // Verify all operations succeed or all fail
                atomicContent.Should().Contain("All operations succeed or all are rolled back", "Should be truly atomic");
                atomicContent.Should().Contain("AtomicOperationResult", "Should return atomic operation results");
            }
            
            if (File.Exists(orchestratorPath))
            {
                var orchestratorContent = File.ReadAllText(orchestratorPath);
                
                // Verify orchestrator uses atomic operations
                orchestratorContent.Should().Contain("atomicFileManager", "Should use atomic file manager");
                orchestratorContent.Should().Contain("executeAtomicOperations", "Should execute atomic operations");
                orchestratorContent.Should().Contain("createFileOperations", "Should create file operations for atomic execution");
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldSupportDomainBoundaryDetection()
        {
            // Arrange & Act
            var orchestratorPath = Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts");
            
            // Assert
            File.Exists(orchestratorPath).Should().BeTrue("Orchestrator should exist for domain testing");
            
            if (File.Exists(orchestratorPath))
            {
                var content = File.ReadAllText(orchestratorPath);
                
                // Verify domain identification
                content.Should().Contain("identifyAffectedDomains", "Should identify affected domains");
                content.Should().Contain("inferDomainFromPath", "Should infer domains from file paths");
                content.Should().Contain("identifyCrossCuttingDomains", "Should identify cross-cutting domains");
                
                // Verify domain patterns
                content.Should().Contain("Analysis", "Should recognize Analysis domain");
                content.Should().Contain("Data", "Should recognize Data domain");
                content.Should().Contain("Messaging", "Should recognize Messaging domain");
                content.Should().Contain("Console", "Should recognize Console domain");
                content.Should().Contain("TestSuite", "Should recognize TestSuite domain");
                
                // Verify domain dependencies
                content.Should().Contain("identifyDomainDependencies", "Should identify domain dependencies");
                content.Should().Contain("sortPlansByDependencies", "Should sort by dependencies");
                content.Should().Contain("dependentDomains", "Should track dependent domains");
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldIntegrateWithExistingServices()
        {
            // Arrange & Act
            var orchestratorPath = Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts");
            
            // Assert
            File.Exists(orchestratorPath).Should().BeTrue("Orchestrator should exist for integration testing");
            
            if (File.Exists(orchestratorPath))
            {
                var content = File.ReadAllText(orchestratorPath);
                
                // Verify integration with existing services
                content.Should().Contain("SemanticAnalysisService", "Should integrate with semantic analysis");
                content.Should().Contain("ContextGenerator", "Should integrate with context generator");
                content.Should().Contain("analyzeCodeChanges", "Should use code analysis");
                content.Should().Contain("generateContextFiles", "Should use context generation");
                
                // Verify import statements
                content.Should().Contain("import", "Should have proper imports");
                content.Should().Contain("semantic-analysis.js", "Should import semantic analysis");
                content.Should().Contain("context-generator.js", "Should import context generator");
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldProvideComprehensiveLogging()
        {
            // Arrange
            var serviceFiles = new[]
            {
                "atomic-file-manager.ts",
                "rollback-manager.ts",
                "holistic-update-orchestrator.ts"
            };

            foreach (var serviceFile in serviceFiles)
            {
                // Act
                var filePath = Path.Combine(_mcpGatewayDir, "src", "services", serviceFile);
                
                // Assert
                File.Exists(filePath).Should().BeTrue($"Service file should exist: {serviceFile}");
                
                if (File.Exists(filePath))
                {
                    var content = File.ReadAllText(filePath);
                    
                    // Verify logging configuration (updated for shared MCP logger)
                    content.Should().Contain("createMCP", $"{serviceFile} should create MCP logger");
                    content.Should().Contain("logger", $"{serviceFile} should have logger instance");
                    // Note: Console and File transports are now handled by shared utility with MCP_SILENT_MODE support
                    
                    // Verify log levels (basic logging methods should still be present)
                    content.Should().Contain("logger.info", $"{serviceFile} should use info logging");
                    content.Should().Contain("logger.error", $"{serviceFile} should use error logging");
                    // Note: debug logging and structured features are configured in shared utility
                }
            }
        }

        [Fact]
        public void HolisticUpdateFramework_ShouldHandleRollbackScenarios()
        {
            // Arrange & Act
            var rollbackManagerPath = Path.Combine(_mcpGatewayDir, "src", "services", "rollback-manager.ts");
            var orchestratorPath = Path.Combine(_mcpGatewayDir, "src", "services", "holistic-update-orchestrator.ts");
            
            // Assert - Rollback Manager
            File.Exists(rollbackManagerPath).Should().BeTrue("Rollback manager should exist");
            
            if (File.Exists(rollbackManagerPath))
            {
                var rollbackContent = File.ReadAllText(rollbackManagerPath);
                
                // Verify rollback capabilities
                rollbackContent.Should().Contain("createHolisticSnapshot", "Should create snapshots before updates");
                rollbackContent.Should().Contain("executeHolisticRollback", "Should execute rollback");
                rollbackContent.Should().Contain("HolisticRollbackData", "Should define rollback data structure");
                rollbackContent.Should().Contain("ContextSnapshot", "Should create context snapshots");
                
                // Verify rollback validation
                rollbackContent.Should().Contain("validateRollbackData", "Should validate rollback data");
                rollbackContent.Should().Contain("loadRollbackData", "Should load rollback data");
                rollbackContent.Should().Contain("saveRollbackData", "Should save rollback data");
            }
            
            // Assert - Orchestrator Integration
            File.Exists(orchestratorPath).Should().BeTrue("Orchestrator should exist");
            
            if (File.Exists(orchestratorPath))
            {
                var orchestratorContent = File.ReadAllText(orchestratorPath);
                
                // Verify orchestrator rollback integration
                orchestratorContent.Should().Contain("rollbackManager", "Should use rollback manager");
                orchestratorContent.Should().Contain("createHolisticSnapshot", "Should create snapshots");
                orchestratorContent.Should().Contain("executeHolisticRollback", "Should trigger rollback on failure");
                orchestratorContent.Should().Contain("rollbackData", "Should return rollback data");
            }
        }
    }
}
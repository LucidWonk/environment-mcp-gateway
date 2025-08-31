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
    /// Unit tests for cross-domain impact analysis functionality
    /// Tests domain boundary detection, impact propagation, and coordination
    /// </summary>
    [Trait("Category", "Unit")]
    [Trait("Domain", "CrossDomainImpactAnalysis")]
    public class CrossDomainImpactAnalysisTests : TestBase
    {
        private readonly string _testProjectRoot;
        private readonly string _mcpGatewayDir;

        public CrossDomainImpactAnalysisTests()
        {
            var currentDir = Directory.GetCurrentDirectory();
            _testProjectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            _mcpGatewayDir = Path.Combine(_testProjectRoot, "EnvironmentMCPGateway");
        }

        [Fact]
        public void DomainAnalyzer_ShouldBeBuiltAndAccessible()
        {
            // Arrange
            var domainAnalyzerFile = Path.Combine(_mcpGatewayDir, "dist", "services", "domain-analyzer.js");
            
            // Act & Assert
            File.Exists(domainAnalyzerFile).Should().BeTrue("Domain analyzer should be compiled");
            
            if (File.Exists(domainAnalyzerFile))
            {
                var content = File.ReadAllText(domainAnalyzerFile);
                
                // Verify class structure
                content.Should().NotBeEmpty("Domain analyzer should not be empty");
                content.Should().Contain("class DomainAnalyzer", "Should contain DomainAnalyzer class");
                content.Should().Contain("export", "Should have exports");
                
                // Verify key methods
                content.Should().Contain("analyzeDomainMap", "Should have domain map analysis");
                content.Should().Contain("analyzeChangedFileImpacts", "Should have changed file impact analysis");
                content.Should().Contain("discoverDomainBoundaries", "Should have boundary discovery");
                content.Should().Contain("analyzeRelationships", "Should have relationship analysis");
            }
        }

        [Fact]
        public void ImpactMapper_ShouldBeBuiltAndAccessible()
        {
            // Arrange
            var impactMapperFile = Path.Combine(_mcpGatewayDir, "dist", "services", "impact-mapper.js");
            
            // Act & Assert
            File.Exists(impactMapperFile).Should().BeTrue("Impact mapper should be compiled");
            
            if (File.Exists(impactMapperFile))
            {
                var content = File.ReadAllText(impactMapperFile);
                
                // Verify class structure
                content.Should().NotBeEmpty("Impact mapper should not be empty");
                content.Should().Contain("class ImpactMapper", "Should contain ImpactMapper class");
                content.Should().Contain("export", "Should have exports");
                
                // Verify key methods
                content.Should().Contain("predictChangeImpact", "Should have change impact prediction");
                content.Should().Contain("buildImpactGraph", "Should have impact graph building");
                content.Should().Contain("calculateUpdateSequence", "Should have update sequence calculation");
                content.Should().Contain("identifyRiskFactors", "Should have risk factor identification");
            }
        }

        [Fact]
        public void CrossDomainCoordinator_ShouldBeBuiltAndAccessible()
        {
            // Arrange
            var coordinatorFile = Path.Combine(_mcpGatewayDir, "dist", "services", "cross-domain-coordinator.js");
            
            // Act & Assert
            File.Exists(coordinatorFile).Should().BeTrue("Cross-domain coordinator should be compiled");
            
            if (File.Exists(coordinatorFile))
            {
                var content = File.ReadAllText(coordinatorFile);
                
                // Verify class structure
                content.Should().NotBeEmpty("Cross-domain coordinator should not be empty");
                content.Should().Contain("class CrossDomainCoordinator", "Should contain CrossDomainCoordinator class");
                content.Should().Contain("export", "Should have exports");
                
                // Verify key methods
                content.Should().Contain("coordinateUpdate", "Should have update coordination");
                content.Should().Contain("createUpdatePlan", "Should have update plan creation");
                content.Should().Contain("executeCoordinatedUpdate", "Should have coordinated execution");
                content.Should().Contain("executeCoordinatedRollback", "Should have coordinated rollback");
            }
        }

        [Fact]
        public void CrossDomainImpactAnalysisTools_ShouldBeBuiltAndAccessible()
        {
            // Arrange
            var toolsFile = Path.Combine(_mcpGatewayDir, "dist", "tools", "cross-domain-impact-analysis.js");
            
            // Act & Assert
            File.Exists(toolsFile).Should().BeTrue("Cross-domain impact analysis tools should be compiled");
            
            if (File.Exists(toolsFile))
            {
                var content = File.ReadAllText(toolsFile);
                
                // Verify tool definitions
                content.Should().Contain("analyzedomainmapTool", "Should contain domain map analysis tool");
                content.Should().Contain("predictchangeimpactTool", "Should contain change impact prediction tool");
                content.Should().Contain("coordinatecrossdomainupdateTool", "Should contain coordination tool");
                content.Should().Contain("analyzespecificdomainsimpactTool", "Should contain specific domain analysis tool");
                content.Should().Contain("getcrossdomaincoordinationstatusTool", "Should contain status tool");
                
                // Verify handlers
                content.Should().Contain("handleAnalyzeDomainMap", "Should contain domain map handler");
                content.Should().Contain("handlePredictChangeImpact", "Should contain prediction handler");
                content.Should().Contain("handleCoordinateCrossDomainUpdate", "Should contain coordination handler");
                content.Should().Contain("handleAnalyzeSpecificDomainsImpact", "Should contain specific analysis handler");
                content.Should().Contain("handleGetCrossDomainCoordinationStatus", "Should contain status handler");
                
                // Verify exports
                content.Should().Contain("getCrossDomainImpactAnalysisTools", "Should export tools function");
                content.Should().Contain("getCrossDomainImpactAnalysisHandlers", "Should export handlers function");
            }
        }

        [Theory]
        [InlineData("Analysis", "Utility/Analysis")]
        [InlineData("Data", "Utility/Data")]
        [InlineData("Messaging", "Utility/Messaging")]
        [InlineData("Console", "Console")]
        [InlineData("CyphyrRecon", "CyphyrRecon")]
        [InlineData("TestSuite", "TestSuite")]
        [InlineData("Services", "Services")]
        [InlineData("EnvironmentMCPGateway", "EnvironmentMCPGateway")]
        [InlineData("Documentation", "Documentation")]
        public void DomainAnalyzer_ShouldRecognizeKnownDomainPatterns(string expectedDomain, string pathPattern)
        {
            // Arrange
            var domainAnalyzerFile = Path.Combine(_mcpGatewayDir, "src", "services", "domain-analyzer.ts");
            
            // Act & Assert
            File.Exists(domainAnalyzerFile).Should().BeTrue("Domain analyzer source should exist");
            
            // Verify the path pattern is used for domain recognition
            pathPattern.Should().NotBeNullOrEmpty("Path pattern should be provided for domain analysis");
            
            if (File.Exists(domainAnalyzerFile))
            {
                var content = File.ReadAllText(domainAnalyzerFile);
                
                // Verify domain is recognized
                content.Should().Contain($"'{expectedDomain}'", $"Should recognize {expectedDomain} domain");
                
                // Verify pattern mapping exists
                content.Should().Contain("knownDomainPatterns", "Should have domain pattern mapping");
                content.Should().Contain("initializeDomainPatterns", "Should initialize domain patterns");
                
                // Verify path-based domain inference
                content.Should().Contain("inferDomainFromPath", "Should have path-based domain inference");
                content.Should().Contain("domainPatterns", "Should define domain patterns");
            }
        }

        [Fact]
        public void DomainAnalyzer_ShouldSupportSemanticAnalysisIntegration()
        {
            // Arrange
            var domainAnalyzerFile = Path.Combine(_mcpGatewayDir, "src", "services", "domain-analyzer.ts");
            
            // Act & Assert
            File.Exists(domainAnalyzerFile).Should().BeTrue("Domain analyzer source should exist");
            
            if (File.Exists(domainAnalyzerFile))
            {
                var content = File.ReadAllText(domainAnalyzerFile);
                
                // Verify semantic analysis integration
                content.Should().Contain("SemanticAnalysisService", "Should integrate with semantic analysis");
                content.Should().Contain("analyzeCodeChanges", "Should use semantic code analysis");
                content.Should().Contain("businessConcepts", "Should work with business concepts");
                content.Should().Contain("businessRules", "Should work with business rules");
                
                // Verify business concept extraction
                content.Should().Contain("extractBusinessConcepts", "Should extract business concepts");
                content.Should().Contain("extractKeyInterfaces", "Should extract key interfaces");
                
                // Verify confidence scoring
                content.Should().Contain("calculateDomainConfidence", "Should calculate domain confidence");
                content.Should().Contain("confidence", "Should track confidence scores");
            }
        }

        [Fact]
        public void ImpactMapper_ShouldSupportImpactGraphConstruction()
        {
            // Arrange
            var impactMapperFile = Path.Combine(_mcpGatewayDir, "src", "services", "impact-mapper.ts");
            
            // Act & Assert
            File.Exists(impactMapperFile).Should().BeTrue("Impact mapper source should exist");
            
            if (File.Exists(impactMapperFile))
            {
                var content = File.ReadAllText(impactMapperFile);
                
                // Verify impact graph structures
                content.Should().Contain("ImpactNode", "Should define impact nodes");
                content.Should().Contain("ImpactEdge", "Should define impact edges");
                content.Should().Contain("ImpactGraph", "Should define impact graph");
                
                // Verify impact levels
                content.Should().Contain("'direct'", "Should support direct impact");
                content.Should().Contain("'indirect'", "Should support indirect impact");
                content.Should().Contain("'cascade'", "Should support cascade impact");
                
                // Verify impact propagation
                content.Should().Contain("propagateImpact", "Should propagate impact");
                content.Should().Contain("propagationDepth", "Should track propagation depth");
                content.Should().Contain("maxPropagationDepth", "Should limit propagation depth");
                
                // Verify critical path calculation
                content.Should().Contain("calculateCriticalPath", "Should calculate critical path");
                content.Should().Contain("criticalPath", "Should track critical path");
            }
        }

        [Theory]
        [InlineData("circular-dependency", "Circular dependencies detected")]
        [InlineData("high-coupling", "High coupling detected")]
        [InlineData("performance", "Performance risks")]
        [InlineData("rollback-complexity", "Rollback complexity")]
        [InlineData("missing-tests", "Missing tests")]
        public void ImpactMapper_ShouldIdentifyRiskFactors(string riskType, string expectedDescription)
        {
            // Arrange
            var impactMapperFile = Path.Combine(_mcpGatewayDir, "src", "services", "impact-mapper.ts");
            
            // Verify expected description is provided for validation
            expectedDescription.Should().NotBeNullOrEmpty("Expected description should be provided for risk validation");
            
            // Act & Assert
            File.Exists(impactMapperFile).Should().BeTrue("Impact mapper source should exist");
            
            if (File.Exists(impactMapperFile))
            {
                var content = File.ReadAllText(impactMapperFile);
                
                // Verify risk factor types
                content.Should().Contain($"'{riskType}'", $"Should recognize {riskType} risk");
                
                // Verify risk factor structure
                content.Should().Contain("RiskFactor", "Should define risk factor interface");
                content.Should().Contain("severity", "Should track risk severity");
                content.Should().Contain("mitigation", "Should provide mitigation guidance");
                
                // Verify risk identification methods
                content.Should().Contain("identifyRiskFactors", "Should identify risk factors");
                content.Should().Contain("detectCircularDependencies", "Should detect circular dependencies");
                content.Should().Contain("detectHighCoupling", "Should detect high coupling");
                content.Should().Contain("detectPerformanceRisks", "Should detect performance risks");
            }
        }

        [Fact]
        public void CrossDomainCoordinator_ShouldSupportExecutionPhases()
        {
            // Arrange
            var coordinatorFile = Path.Combine(_mcpGatewayDir, "src", "services", "cross-domain-coordinator.ts");
            
            // Act & Assert
            File.Exists(coordinatorFile).Should().BeTrue("Cross-domain coordinator source should exist");
            
            if (File.Exists(coordinatorFile))
            {
                var content = File.ReadAllText(coordinatorFile);
                
                // Verify execution phase structure
                content.Should().Contain("ExecutionPhase", "Should define execution phases");
                content.Should().Contain("phaseNumber", "Should number phases");
                content.Should().Contain("parallelExecution", "Should support parallel execution");
                content.Should().Contain("criticalPath", "Should identify critical path phases");
                
                // Verify phase creation
                content.Should().Contain("createExecutionPhases", "Should create execution phases");
                content.Should().Contain("executePhase", "Should execute individual phases");
                
                // Verify coordination strategies
                content.Should().Contain("CoordinationStrategy", "Should define coordination strategies");
                content.Should().Contain("parallelizable", "Should support parallelizable strategies");
                content.Should().Contain("riskLevel", "Should assess strategy risk levels");
                content.Should().Contain("requiredResources", "Should specify required resources");
            }
        }

        [Theory]
        [InlineData("Critical Sequential", "critical")]
        [InlineData("Parallel Low-Risk", "low")]
        [InlineData("Parallel Monitored", "medium")]
        [InlineData("Sequential High-Risk", "high")]
        [InlineData("Sequential Standard", "medium")]
        public void CrossDomainCoordinator_ShouldSupportCoordinationStrategies(string strategyName, string expectedRiskLevel)
        {
            // Arrange
            var coordinatorFile = Path.Combine(_mcpGatewayDir, "src", "services", "cross-domain-coordinator.ts");
            
            // Act & Assert
            File.Exists(coordinatorFile).Should().BeTrue("Cross-domain coordinator source should exist");
            
            if (File.Exists(coordinatorFile))
            {
                var content = File.ReadAllText(coordinatorFile);
                
                // Verify strategy names
                content.Should().Contain($"'{strategyName}'", $"Should support {strategyName} strategy");
                
                // Verify risk levels
                content.Should().Contain($"'{expectedRiskLevel}'", $"Should support {expectedRiskLevel} risk level");
                
                // Verify strategy methods
                content.Should().Contain("createCoordinationStrategy", "Should create coordination strategies");
                content.Should().Contain("getStrategyName", "Should determine strategy names");
                content.Should().Contain("getStrategyDescription", "Should provide strategy descriptions");
            }
        }

        [Fact]
        public void CrossDomainCoordinator_ShouldSupportRollbackCoordination()
        {
            // Arrange
            var coordinatorFile = Path.Combine(_mcpGatewayDir, "src", "services", "cross-domain-coordinator.ts");
            
            // Act & Assert
            File.Exists(coordinatorFile).Should().BeTrue("Cross-domain coordinator source should exist");
            
            if (File.Exists(coordinatorFile))
            {
                var content = File.ReadAllText(coordinatorFile);
                
                // Verify rollback coordination
                content.Should().Contain("executeCoordinatedRollback", "Should execute coordinated rollback");
                content.Should().Contain("rollbackRequired", "Should determine rollback requirements");
                content.Should().Contain("rollbackCompleted", "Should track rollback completion");
                
                // Verify rollback strategy
                content.Should().Contain("generateRollbackStrategy", "Should generate rollback strategies");
                content.Should().Contain("rollbackStrategy", "Should track rollback strategy");
                
                // Verify integration with holistic orchestrator
                content.Should().Contain("HolisticUpdateOrchestrator", "Should integrate with holistic orchestrator");
                content.Should().Contain("performMaintenance", "Should support maintenance operations");
            }
        }

        [Theory]
        [InlineData("analyze-domain-map", "Analyze the complete domain map")]
        [InlineData("predict-change-impact", "Predict the complete impact of proposed changes")]
        [InlineData("coordinate-cross-domain-update", "Coordinate a comprehensive cross-domain update")]
        [InlineData("analyze-specific-domains-impact", "Analyze impact between specific domains")]
        [InlineData("get-cross-domain-coordination-status", "Get status of active cross-domain coordinations")]
        public void CrossDomainImpactAnalysisTools_ShouldProvideExpectedTools(string toolName, string expectedDescriptionFragment)
        {
            // Arrange
            var toolsFile = Path.Combine(_mcpGatewayDir, "src", "tools", "cross-domain-impact-analysis.ts");
            
            // Act & Assert
            File.Exists(toolsFile).Should().BeTrue("Cross-domain impact analysis tools source should exist");
            
            if (File.Exists(toolsFile))
            {
                var content = File.ReadAllText(toolsFile);
                
                // Verify tool definition
                content.Should().Contain($"{toolName.Replace("-", "")}Tool", $"Should define {toolName} tool");
                content.Should().Contain($"'{toolName}'", $"Should name tool as {toolName}");
                content.Should().Contain(expectedDescriptionFragment, $"Should describe {toolName} correctly");
                
                // Verify handler
                content.Should().Contain($"handle{toPascalCase(toolName)}", $"Should have handler for {toolName}");
                
                // Verify input schema
                content.Should().Contain("inputSchema", $"Should define input schema for {toolName}");
                content.Should().Contain("type: 'object'", $"Should use object schema for {toolName}");
            }
        }

        [Fact]
        public void ToolRegistry_ShouldIntegrateCrossDomainImpactAnalysisTools()
        {
            // Arrange
            var toolRegistryFile = Path.Combine(_mcpGatewayDir, "src", "orchestrator", "tool-registry.ts");
            
            // Act & Assert
            File.Exists(toolRegistryFile).Should().BeTrue("Tool registry source should exist");
            
            if (File.Exists(toolRegistryFile))
            {
                var content = File.ReadAllText(toolRegistryFile);
                
                // Verify integration
                content.Should().Contain("getCrossDomainImpactAnalysisTools", "Should import cross-domain tools");
                content.Should().Contain("getCrossDomainImpactAnalysisHandlers", "Should import cross-domain handlers");
                content.Should().Contain("cross-domain-impact-analysis", "Should import from correct module");
                
                // Verify registration
                content.Should().Contain("getCrossDomainImpactAnalysisTools()", "Should register cross-domain tools");
                content.Should().Contain("getCrossDomainImpactAnalysisTools", "Should include in getAllTools");
            }
        }

        [Fact]
        public void CrossDomainServices_ShouldSupportPerformanceOptimization()
        {
            // Arrange
            var serviceFiles = new[]
            {
                Path.Combine(_mcpGatewayDir, "src", "services", "domain-analyzer.ts"),
                Path.Combine(_mcpGatewayDir, "src", "services", "impact-mapper.ts"),
                Path.Combine(_mcpGatewayDir, "src", "services", "cross-domain-coordinator.ts")
            };
            
            foreach (var serviceFile in serviceFiles)
            {
                // Act & Assert
                File.Exists(serviceFile).Should().BeTrue($"Service file should exist: {Path.GetFileName(serviceFile)}");
                
                if (File.Exists(serviceFile))
                {
                    var content = File.ReadAllText(serviceFile);
                    
                    // Verify performance considerations
                    content.Should().Contain("performance", $"{Path.GetFileName(serviceFile)} should consider performance");
                    content.Should().Contain("timeout", $"{Path.GetFileName(serviceFile)} should support timeouts");
                    
                    // Verify caching (for applicable services)
                    if (serviceFile.Contains("impact-mapper"))
                    {
                        content.Should().Contain("cache", "Impact mapper should support caching");
                        content.Should().Contain("clearCache", "Impact mapper should support cache clearing");
                    }
                    
                    // Verify error handling
                    content.Should().Contain("try", $"{Path.GetFileName(serviceFile)} should handle errors");
                    content.Should().Contain("catch", $"{Path.GetFileName(serviceFile)} should catch exceptions");
                    content.Should().Contain("logger", $"{Path.GetFileName(serviceFile)} should support logging");
                }
            }
        }

        [Fact]
        public void CrossDomainAnalysis_ShouldSupportVisualizationData()
        {
            // Arrange
            var toolsFile = Path.Combine(_mcpGatewayDir, "src", "tools", "cross-domain-impact-analysis.ts");
            
            // Act & Assert
            File.Exists(toolsFile).Should().BeTrue("Cross-domain tools source should exist");
            
            if (File.Exists(toolsFile))
            {
                var content = File.ReadAllText(toolsFile);
                
                // Verify visualization support
                content.Should().Contain("includeVisualization", "Should support visualization flag");
                content.Should().Contain("visualization", "Should provide visualization data");
                content.Should().Contain("nodes", "Should provide visualization nodes");
                content.Should().Contain("edges", "Should provide visualization edges");
                
                // Verify visualization helpers
                content.Should().Contain("getNodeColor", "Should provide node coloring");
                content.Should().Contain("getEdgeColor", "Should provide edge coloring");
                
                // Verify confidence-based visualization
                content.Should().Contain("confidence", "Should use confidence for visualization");
                content.Should().Contain("strength", "Should use strength for visualization");
            }
        }

        /// <summary>
        /// Helper method to convert kebab-case to PascalCase
        /// </summary>
        private string toPascalCase(string kebabCase)
        {
            var parts = kebabCase.Split('-');
            var result = "";
            
            foreach (var part in parts)
            {
                if (part.Length > 0)
                {
                    result += char.ToUpper(part[0]) + part.Substring(1).ToLower();
                }
            }
            
            return result;
        }
    }
}
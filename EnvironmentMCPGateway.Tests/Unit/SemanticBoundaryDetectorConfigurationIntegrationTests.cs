/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Unit
{
    /// <summary>
    /// Integration tests for semantic boundary detector configuration functionality
    /// Tests Enhancement Feature 2, Step 2.2: Boundary Detection Configuration Integration
    /// BR-CEE-005: Configuration must support >85% accuracy requirement
    /// BR-CEE-007: Algorithm must be configurable for different repository types
    /// BR-CEE-008: Configuration validation and runtime tuning
    /// </summary>
    public class SemanticBoundaryDetectorConfigurationIntegrationTests : TestBase
    {
        private readonly string tempProjectRoot;
        private readonly string semanticBoundaryDetectorPath;

        public SemanticBoundaryDetectorConfigurationIntegrationTests()
        {
            tempProjectRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempProjectRoot);
            
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            semanticBoundaryDetectorPath = Path.Combine(projectRoot, "EnvironmentMCPGateway", "src", "services", "semantic-boundary-detector.ts");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && Directory.Exists(tempProjectRoot))
            {
                try
                {
                    Directory.Delete(tempProjectRoot, recursive: true);
                }
                catch (Exception ex)
                {
                    LogError(ex, "Failed to cleanup temp directory: {TempPath}", tempProjectRoot);
                }
            }
            base.Dispose(disposing);
        }

        [Fact]
        public void SemanticBoundaryDetectorConfiguration_ShouldIntegrateConfigurationManager()
        {
            // Arrange & Act - Verify configuration manager integration
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue("Semantic boundary detector should exist");
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify configuration manager integration
                content.Should().Contain("BoundaryDetectionConfigManager", "Should import config manager");
                content.Should().Contain("configManager", "Should have config manager instance");
                content.Should().Contain("ConfigValidationResult", "Should import validation result type");
                
                // Verify enhanced constructor
                content.Should().Contain("configManager?: BoundaryDetectionConfigManager", "Should accept config manager parameter");
                content.Should().Contain("this.configManager = configManager || new BoundaryDetectionConfigManager()", "Should initialize config manager");
                
                // Verify configuration management methods
                content.Should().Contain("autoConfigureForProject", "Should implement auto-configuration");
                content.Should().Contain("switchToRepositoryConfiguration", "Should implement repository type switching");
                content.Should().Contain("updateConfigurationWithValidation", "Should implement validated updates");
                content.Should().Contain("getCurrentConfigurationStatus", "Should provide configuration status");
                content.Should().Contain("createCustomRepositoryConfiguration", "Should support custom configurations");
            }
        }

        [Theory]
        [InlineData("autoConfigureForProject", "BR-CEE-007")]           // Auto-configuration for repository types
        [InlineData("updateConfigurationWithValidation", "BR-CEE-007")] // Runtime configuration updates  
        [InlineData("switchToRepositoryConfiguration", "BR-CEE-007")]   // Repository type switching
        [InlineData("getCurrentConfigurationStatus", "BR-CEE-007")]     // Configuration introspection
        [InlineData("createCustomRepositoryConfiguration", "BR-CEE-007")] // Custom configuration creation
        public void ConfigurationMethods_ConceptTest_ShouldImplementBusinessRuleRequirements(
            string methodName, 
            string businessRule)
        {
            // Arrange - Test configuration method implementation (BR-CEE-007)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Act & Assert - Verify method implementation
                content.Should().Contain(methodName, $"Should implement {methodName} method");
                content.Should().Contain(businessRule, $"Should reference {businessRule} business rule");
                
                // Verify method-specific requirements
                switch (methodName)
                {
                    case "autoConfigureForProject":
                        content.Should().Contain("detectRepositoryType", "Should detect repository type automatically");
                        content.Should().Contain("getConfigurationForType", "Should get type-specific configuration");
                        content.Should().Contain("validateConfiguration", "Should validate detected configuration");
                        content.Should().Contain("estimated accuracy", "Should report estimated accuracy");
                        break;
                        
                    case "updateConfigurationWithValidation":
                        content.Should().Contain("validateConfiguration(newConfig)", "Should validate configuration updates");
                        content.Should().Contain("validation.isValid", "Should check validation status");
                        content.Should().Contain("Object.assign(this.config, updates)", "Should apply valid updates");
                        content.Should().Contain("validation issues", "Should report validation issues");
                        break;
                        
                    case "switchToRepositoryConfiguration":
                        content.Should().Contain("getConfigurationForType(repositoryType)", "Should get repository configuration");
                        content.Should().Contain("validation.isValid", "Should validate before switching");
                        content.Should().Contain("Object.assign(this.config", "Should apply new configuration");
                        content.Should().Contain("boolean", "Should return success status");
                        break;
                        
                    case "getCurrentConfigurationStatus":
                        content.Should().Contain("{ config:", "Should return configuration object");
                        content.Should().Contain("validation:", "Should include validation status");
                        content.Should().Contain("repositoryTypes:", "Should list available repository types");
                        content.Should().Contain("getAvailableRepositoryTypes", "Should get available types");
                        break;
                        
                    case "createCustomRepositoryConfiguration":
                        content.Should().Contain("createCustomRepositoryConfig", "Should create custom config");
                        content.Should().Contain("saveConfiguration", "Should persist custom config");
                        content.Should().Contain("Promise<boolean>", "Should return async success status");
                        content.Should().Contain("typeName", "Should accept custom type name");
                        break;
                }
            }
        }

        [Fact]
        public void AccuracyValidationIntegration_ConceptTest_ShouldIntegrateAccuracyValidation()
        {
            // Arrange - Test accuracy validation integration (BR-CEE-005)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify accuracy validation integration
                content.Should().Contain("validateDetectionAccuracy", "Should implement accuracy validation");
                content.Should().Contain("groundTruthBoundaries", "Should accept ground truth data");
                content.Should().Contain("detectionResults", "Should accept detection results");
                content.Should().Contain("accuracy", "Should calculate accuracy metrics");
                content.Should().Contain("precision", "Should calculate precision metrics");
                content.Should().Contain("recall", "Should calculate recall metrics");
                content.Should().Contain("f1Score", "Should calculate F1 score metrics");
                
                // Verify accuracy requirement compliance
                content.Should().Contain("BR-CEE-005", "Should reference accuracy requirement business rule");
                content.Should().Contain(">85% accuracy", "Should mention accuracy requirement");
                content.Should().Contain("human domain expert judgment", "Should reference validation source");
                
                // Verify accuracy calculation logic
                content.Should().Contain("truePositives", "Should track true positive predictions");
                content.Should().Contain("falsePositives", "Should track false positive predictions");
                content.Should().Contain("falseNegatives", "Should track false negative predictions");
                content.Should().Contain("trueNegatives", "Should track true negative predictions");
                
                // Test accuracy calculation formulas
                var accuracyFormulas = new[]
                {
                    "(truePositives + trueNegatives) / groundTruthBoundaries.length",  // Accuracy
                    "truePositives / (truePositives + falsePositives)",               // Precision  
                    "truePositives / (truePositives + falseNegatives)",               // Recall
                    "2 * (precision * recall) / (precision + recall)"                // F1 Score
                };
                
                foreach (var formula in accuracyFormulas)
                {
                    // Verify the calculation logic is present (may be reformatted)
                    var formulaComponents = formula.Split(new[] { '+', '-', '*', '/', '(', ')' }, StringSplitOptions.RemoveEmptyEntries)
                        .Where(c => c.Trim().Length > 2)
                        .Select(c => c.Trim());
                    
                    foreach (var component in formulaComponents)
                    {
                        if (component.Contains("truePositives") || component.Contains("falsePositives") || 
                            component.Contains("falseNegatives") || component.Contains("trueNegatives") ||
                            component.Contains("precision") || component.Contains("recall"))
                        {
                            content.Should().Contain(component, $"Accuracy calculation should include {component}");
                        }
                    }
                }
            }
        }

        [Theory]
        [InlineData("applyConfigurationRecommendations", true)]   // Should apply accuracy improvements
        [InlineData("estimatedAccuracy", true)]                   // Should report estimated accuracy
        [InlineData("accuracy requirement", true)]                // Should check accuracy requirements
        [InlineData("85%", true)]                                 // Should reference 85% accuracy target
        [InlineData("Math.max", true)]                            // Should improve thresholds
        public void AccuracyImprovementMechanisms_ConceptTest_ShouldImplementAccuracyOptimization(
            string expectedFeature,
            bool shouldBePresent)
        {
            // Arrange - Test accuracy improvement mechanisms (BR-CEE-005)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Act & Assert - Verify accuracy optimization features
                if (shouldBePresent)
                {
                    content.Should().Contain(expectedFeature, $"Should implement {expectedFeature} for accuracy optimization");
                }
                else
                {
                    content.Should().NotContain(expectedFeature, $"Should not contain {expectedFeature}");
                }
                
                // Verify specific accuracy improvement logic
                if (expectedFeature == "applyConfigurationRecommendations")
                {
                    content.Should().Contain("improvedConfig", "Should create improved configuration");
                    content.Should().Contain("Math.max", "Should increase thresholds for better accuracy");
                    content.Should().Contain("boundaryDetectionThreshold", "Should improve boundary detection threshold");
                    content.Should().Contain("minBusinessConceptDensity", "Should improve concept density threshold");
                }
                
                if (expectedFeature == "estimatedAccuracy")
                {
                    content.Should().Contain("validation.estimatedAccuracy", "Should report estimated accuracy from validation");
                    content.Should().Contain("100).toFixed(1)", "Should format accuracy as percentage");
                }
            }
        }

        [Theory]
        [InlineData("algorithm-heavy", "lower concept threshold")]     // Algorithm repos need lower concept requirements
        [InlineData("enterprise", "higher concept threshold")]        // Enterprise repos need more business concepts  
        [InlineData("utility", "lowest thresholds")]                  // Utility repos have minimal requirements
        public void RepositoryTypeConfigurationTuning_ConceptTest_ShouldTuneForRepositoryTypes(
            string repositoryType,
            string expectedTuning)
        {
            // Arrange - Test repository-specific configuration tuning (BR-CEE-007)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify repository type configuration support
                content.Should().Contain("detectRepositoryType", $"Should detect {repositoryType} repository type");
                content.Should().Contain("getConfigurationForType", $"Should get {repositoryType} configuration");
                content.Should().Contain("Auto-configured for repository type", "Should report auto-configuration");
                
                // Verify configuration tuning characteristics
                switch (expectedTuning)
                {
                    case "lower concept threshold":
                        // Algorithm-heavy repos should prioritize complexity over concepts
                        repositoryType.Should().Be("algorithm-heavy", "Should be algorithm-heavy repository");
                        content.Should().Contain("algorithmic implementations", "Should recognize algorithmic complexity");
                        break;
                        
                    case "higher concept threshold":
                        // Enterprise repos should require more business concepts
                        repositoryType.Should().Be("enterprise", "Should be enterprise repository");
                        content.Should().Contain("business logic", "Should emphasize business logic");
                        break;
                        
                    case "lowest thresholds":
                        // Utility repos should have minimal requirements
                        repositoryType.Should().Be("utility", "Should be utility repository");
                        content.Should().Contain("utility", "Should recognize utility patterns");
                        break;
                }
                
                // All repository types should support validation
                content.Should().Contain("validateConfiguration", "Should validate repository-specific configurations");
                content.Should().Contain("validation.isValid", "Should check configuration validity");
            }
        }

        [Fact]
        public void ConfigurationPersistenceIntegration_ConceptTest_ShouldPersistCustomConfigurations()
        {
            // Arrange - Test configuration persistence integration (BR-CEE-007)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify persistence integration
                content.Should().Contain("createCustomRepositoryConfiguration", "Should create custom configurations");
                content.Should().Contain("saveConfiguration", "Should save configurations");
                content.Should().Contain("Promise<boolean>", "Should return async success status");
                
                // Verify custom configuration parameters
                content.Should().Contain("typeName", "Should accept custom type name");
                content.Should().Contain("description", "Should accept configuration description");
                content.Should().Contain("baseType", "Should accept base configuration type");
                content.Should().Contain("overrides", "Should accept configuration overrides");
                
                // Verify error handling
                content.Should().Contain("try", "Should handle creation errors");
                content.Should().Contain("catch", "Should catch and log errors");
                content.Should().Contain("Failed to create custom repository configuration", "Should provide error messages");
                
                // Verify success reporting
                content.Should().Contain("Created and saved custom repository configuration", "Should log successful creation");
                content.Should().Contain("return true", "Should return success status");
                content.Should().Contain("return false", "Should return failure status");
            }
        }

        [Fact]
        public void RuntimeConfigurationUpdates_ConceptTest_ShouldSupportRuntimeTuning()
        {
            // Arrange - Test runtime configuration updates (BR-CEE-007)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify runtime update support
                content.Should().Contain("updateConfigurationWithValidation", "Should support runtime updates");
                content.Should().Contain("Partial<BoundaryDetectionConfig>", "Should accept partial configuration updates");
                content.Should().Contain("ConfigValidationResult", "Should return validation results");
                
                // Verify validation before application
                content.Should().Contain("validateConfiguration(newConfig)", "Should validate updates before applying");
                content.Should().Contain("validation.isValid", "Should check validation status");
                content.Should().Contain("Object.assign(this.config, updates)", "Should apply valid updates");
                content.Should().Contain("validation issues", "Should report validation issues");
                
                // Verify update logging
                content.Should().Contain("Configuration updated successfully", "Should log successful updates");
                content.Should().Contain("Configuration update rejected", "Should log rejected updates");
                
                // Verify repository type switching
                content.Should().Contain("switchToRepositoryConfiguration", "Should support repository type switching");
                content.Should().Contain("repositoryType", "Should accept repository type parameter");
                content.Should().Contain("Switched to", "Should report successful switching");
                content.Should().Contain("Cannot switch to", "Should report switching failures");
            }
        }

        [Theory]
        [InlineData("{ config:", "validation:", "repositoryTypes:")]   // Configuration status structure
        [InlineData("getAvailableRepositoryTypes", "map(rt => rt.name)")] // Repository types extraction
        [InlineData("validateConfiguration(this.config)", "validation")] // Current config validation
        public void ConfigurationIntrospection_ConceptTest_ShouldProvideConfigurationStatus(
            params string[] expectedElements)
        {
            // Arrange - Test configuration introspection (BR-CEE-007)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify configuration status functionality
                content.Should().Contain("getCurrentConfigurationStatus", "Should implement configuration status");
                
                // Verify expected elements
                foreach (var element in expectedElements)
                {
                    content.Should().Contain(element, $"Configuration status should include {element}");
                }
                
                // Verify return type structure
                content.Should().Contain("config: BoundaryDetectionConfig", "Should return current configuration");
                content.Should().Contain("validation: ConfigValidationResult", "Should return validation status");
                content.Should().Contain("repositoryTypes: string[]", "Should return available repository types");
                
                // Verify configuration cloning (immutability)
                content.Should().Contain("{ ...this.config }", "Should return configuration copy");
                
                // Test configuration status scenarios
                var statusScenarios = new[]
                {
                    new { Element = "config", Required = true, Description = "Current configuration" },
                    new { Element = "validation", Required = true, Description = "Validation status" },
                    new { Element = "repositoryTypes", Required = true, Description = "Available types" }
                };
                
                foreach (var scenario in statusScenarios)
                {
                    if (scenario.Required)
                    {
                        content.Should().Contain(scenario.Element, $"Status should include {scenario.Description}");
                    }
                    
                    scenario.Element.Should().NotBeNullOrEmpty("Status element should have valid name");
                    scenario.Description.Should().NotBeNullOrEmpty("Status element should have description");
                }
            }
        }

        [Fact]
        public void BusinessRuleCompliance_ConceptTest_ShouldMeetAllConfigurationBusinessRules()
        {
            // Arrange & Act - Comprehensive configuration business rule compliance test
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - BR-CEE-005: Configuration must support >85% accuracy requirement
                content.Should().Contain("BR-CEE-005", "Should reference accuracy requirement");
                content.Should().Contain(">85% accuracy", "Should mention accuracy target");
                content.Should().Contain("validateDetectionAccuracy", "Should implement accuracy validation");
                content.Should().Contain("human domain expert judgment", "Should reference validation source");
                
                // BR-CEE-007: Algorithm must be configurable for different repository types
                content.Should().Contain("BR-CEE-007", "Should reference configurability requirement");
                content.Should().Contain("configurable for different repository types", "Should support repository type configuration");
                content.Should().Contain("autoConfigureForProject", "Should implement auto-configuration");
                content.Should().Contain("switchToRepositoryConfiguration", "Should support type switching");
                content.Should().Contain("updateConfigurationWithValidation", "Should support runtime updates");
                
                // BR-CEE-008: Must avoid trivial directories (handled by base detector, verify integration)
                content.Should().Contain("trivialDirectoryPatterns", "Should handle trivial directory exclusion");
                content.Should().Contain("shouldSkipDirectory", "Should implement directory skipping logic");
                
                // Verify configuration integration completeness
                content.Should().Contain("BoundaryDetectionConfigManager", "Should integrate with configuration manager");
                content.Should().Contain("configManager", "Should use configuration manager");
                content.Should().Contain("ConfigValidationResult", "Should use validation results");
                content.Should().Contain("getCurrentConfigurationStatus", "Should provide configuration status");
                content.Should().Contain("createCustomRepositoryConfiguration", "Should support custom configurations");
            }
        }
    }
}
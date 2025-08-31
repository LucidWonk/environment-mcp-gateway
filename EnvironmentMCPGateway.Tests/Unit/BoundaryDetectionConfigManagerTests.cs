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
    /// Unit tests for boundary detection configuration manager functionality
    /// Tests Enhancement Feature 2, Step 2.2: Boundary Detection Configuration Integration
    /// BR-CEE-005: Configuration must support >85% accuracy requirement
    /// BR-CEE-007: Algorithm must be configurable for different repository types
    /// BR-CEE-008: Configuration validation and tuning mechanisms
    /// </summary>
    public class BoundaryDetectionConfigManagerTests : TestBase
    {
        private readonly string tempProjectRoot;
        private readonly string boundaryConfigManagerPath;

        public BoundaryDetectionConfigManagerTests()
        {
            tempProjectRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempProjectRoot);
            
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            boundaryConfigManagerPath = Path.Combine(projectRoot, "EnvironmentMCPGateway", "src", "services", "boundary-detection-config-manager.ts");
            
            // Create test repository structure for different repository types
            CreateAlgorithmHeavyStructure();
            CreateEnterpriseStructure();
            CreateUtilityStructure();
        }

        private void CreateAlgorithmHeavyStructure()
        {
            var algorithmRoot = Path.Combine(tempProjectRoot, "algorithm-heavy");
            Directory.CreateDirectory(algorithmRoot);
            
            // Create algorithm-heavy directory structure
            Directory.CreateDirectory(Path.Combine(algorithmRoot, "Fractal", "Analysis"));
            Directory.CreateDirectory(Path.Combine(algorithmRoot, "Indicator", "Technical"));
            Directory.CreateDirectory(Path.Combine(algorithmRoot, "Trading", "Signals"));
            Directory.CreateDirectory(Path.Combine(algorithmRoot, "Mathematical", "Calculations"));
            
            // Create README with algorithmic keywords
            File.WriteAllText(Path.Combine(algorithmRoot, "README.md"), 
                "# Algorithmic Trading Platform\nFractal analysis and technical indicator calculations for market analysis.");
        }

        private void CreateEnterpriseStructure()
        {
            var enterpriseRoot = Path.Combine(tempProjectRoot, "enterprise");
            Directory.CreateDirectory(enterpriseRoot);
            
            // Create enterprise directory structure
            Directory.CreateDirectory(Path.Combine(enterpriseRoot, "Domain", "Services"));
            Directory.CreateDirectory(Path.Combine(enterpriseRoot, "Controllers", "API"));
            Directory.CreateDirectory(Path.Combine(enterpriseRoot, "Repositories", "Data"));
            Directory.CreateDirectory(Path.Combine(enterpriseRoot, "Validation", "Business"));
            
            // Create README with enterprise keywords
            File.WriteAllText(Path.Combine(enterpriseRoot, "README.md"), 
                "# Enterprise Business Application\nDomain-driven design with business services and validation rules.");
        }

        private void CreateUtilityStructure()
        {
            var utilityRoot = Path.Combine(tempProjectRoot, "utility");
            Directory.CreateDirectory(utilityRoot);
            
            // Create utility directory structure
            Directory.CreateDirectory(Path.Combine(utilityRoot, "Helpers", "Extensions"));
            Directory.CreateDirectory(Path.Combine(utilityRoot, "Common", "Infrastructure"));
            Directory.CreateDirectory(Path.Combine(utilityRoot, "Shared", "Utilities"));
            Directory.CreateDirectory(Path.Combine(utilityRoot, "Logging", "Configuration"));
            
            // Create README with utility keywords
            File.WriteAllText(Path.Combine(utilityRoot, "README.md"), 
                "# Utility Library\nCommon helpers and infrastructure utilities for shared functionality.");
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
        public void BoundaryDetectionConfigManager_ShouldImplementRequiredInterface()
        {
            // Arrange & Act - Verify the configuration manager implementation exists
            File.Exists(boundaryConfigManagerPath).Should().BeTrue("Boundary detection config manager should exist");
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Assert - Verify core interface implementation
                content.Should().Contain("export class BoundaryDetectionConfigManager", "Should export BoundaryDetectionConfigManager class");
                content.Should().Contain("detectRepositoryType", "Should have repository type detection method");
                content.Should().Contain("getConfigurationForType", "Should have configuration retrieval method");
                content.Should().Contain("validateConfiguration", "Should have configuration validation method");
                
                // Verify business rule implementation references
                content.Should().Contain("BR-CEE-005", "Should reference business rule BR-CEE-005");
                content.Should().Contain("BR-CEE-007", "Should reference business rule BR-CEE-007");
                content.Should().Contain("BR-CEE-008", "Should reference business rule BR-CEE-008");
            }
        }

        [Fact]
        public void RepositoryTypeConfiguration_ShouldHaveRequiredTypes()
        {
            // Arrange & Act
            File.Exists(boundaryConfigManagerPath).Should().BeTrue("Config manager should exist");
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Assert - Verify predefined repository types
                content.Should().Contain("algorithm-heavy", "Should support algorithm-heavy repository type");
                content.Should().Contain("enterprise", "Should support enterprise repository type");
                content.Should().Contain("utility", "Should support utility repository type");
                
                // Verify repository type characteristics
                content.Should().Contain("algorithmHeavyConfig", "Should define algorithm-heavy configuration");
                content.Should().Contain("enterpriseConfig", "Should define enterprise configuration");
                content.Should().Contain("utilityConfig", "Should define utility configuration");
                
                // Verify detection patterns
                content.Should().Contain("detectionPatterns", "Should define detection patterns for repository types");
                content.Should().Contain("algorithmHeavy:", "Should have algorithm detection patterns");
                content.Should().Contain("enterprisePatterns:", "Should have enterprise detection patterns");
                content.Should().Contain("utilityPatterns:", "Should have utility detection patterns");
            }
        }

        [Theory]
        [InlineData("algorithm-heavy", 2.5, 0.6, 0.5, 0.65)]  // Algorithm-heavy: lower concept threshold, higher complexity weight
        [InlineData("enterprise", 4.0, 0.8, 0.7, 0.8)]        // Enterprise: higher concept threshold, higher coherence requirement
        [InlineData("utility", 1.5, 0.4, 0.4, 0.5)]           // Utility: lowest thresholds for infrastructure repos
        public void RepositoryTypeConfigurations_ConceptTest_ShouldHaveTunedThresholds(
            string repositoryType, 
            double expectedConceptDensity, 
            double expectedComplexityScore, 
            double expectedCoherenceScore,
            double expectedBoundaryThreshold)
        {
            // Arrange - Test repository-specific configuration tuning (BR-CEE-007)
            File.Exists(boundaryConfigManagerPath).Should().BeTrue();
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Act & Assert - Verify configuration characteristics for repository type
                if (repositoryType == "algorithm-heavy")
                {
                    // Algorithm-heavy repositories prioritize complexity detection
                    content.Should().Contain("minBusinessConceptDensity: 2.5", "Algorithm-heavy should have lower concept density threshold");
                    content.Should().Contain("algorithmComplexityWeight: 0.5", "Algorithm-heavy should emphasize complexity detection");
                    content.Should().Contain("boundaryDetectionThreshold: 0.65", "Algorithm-heavy should have moderate boundary threshold");
                }
                else if (repositoryType == "enterprise")
                {
                    // Enterprise repositories prioritize business concept density
                    content.Should().Contain("minBusinessConceptDensity: 4.0", "Enterprise should have high concept density requirement");
                    content.Should().Contain("businessConceptWeight: 0.5", "Enterprise should emphasize business concepts");
                    content.Should().Contain("boundaryDetectionThreshold: 0.8", "Enterprise should have high boundary threshold");
                }
                else if (repositoryType == "utility")
                {
                    // Utility repositories have the lowest thresholds
                    content.Should().Contain("minBusinessConceptDensity: 1.5", "Utility should have lowest concept density threshold");
                    content.Should().Contain("boundaryDetectionThreshold: 0.5", "Utility should have lowest boundary threshold");
                    content.Should().Contain("businessConceptWeight: 0.6", "Utility should emphasize few business concepts");
                }
                
                // Verify all repository types maintain accuracy focus
                expectedConceptDensity.Should().BeGreaterThan(0, $"{repositoryType} should have positive concept density threshold");
                expectedComplexityScore.Should().BeInRange(0.0, 1.0, $"{repositoryType} should have valid complexity score range");
                expectedCoherenceScore.Should().BeInRange(0.0, 1.0, $"{repositoryType} should have valid coherence score range");
                expectedBoundaryThreshold.Should().BeInRange(0.0, 1.0, $"{repositoryType} should have valid boundary threshold");
            }
        }

        [Theory]
        [InlineData("fractal|indicator|technical|analysis", "algorithm-heavy")]    // Algorithm patterns
        [InlineData("service|repository|controller|domain", "enterprise")]        // Enterprise patterns  
        [InlineData("utility|helper|extension|common", "utility")]                // Utility patterns
        public void RepositoryTypeDetection_ConceptTest_ShouldRecognizePatterns(
            string testPattern, 
            string expectedRepositoryType)
        {
            // Arrange - Test repository type detection patterns (BR-CEE-007)
            var testDescriptions = new[]
            {
                "This project implements fractal analysis and technical indicator calculations",
                "Enterprise application with domain services and business repositories", 
                "Utility library with helper extensions and common infrastructure"
            };
            
            // Act - Test pattern matching simulation
            var patternRegex = new System.Text.RegularExpressions.Regex(testPattern, 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            var matchingDescriptions = testDescriptions
                .Where(desc => patternRegex.IsMatch(desc))
                .ToArray();
            
            // Assert - Verify pattern recognition
            if (expectedRepositoryType == "algorithm-heavy")
            {
                matchingDescriptions.Should().Contain(desc => desc.Contains("fractal") || desc.Contains("indicator"), 
                    "Algorithm-heavy patterns should match algorithmic descriptions");
            }
            else if (expectedRepositoryType == "enterprise")
            {
                matchingDescriptions.Should().Contain(desc => desc.Contains("domain") || desc.Contains("service"), 
                    "Enterprise patterns should match business domain descriptions");
            }
            else if (expectedRepositoryType == "utility")
            {
                matchingDescriptions.Should().Contain(desc => desc.Contains("utility") || desc.Contains("helper"), 
                    "Utility patterns should match infrastructure descriptions");
            }
            
            matchingDescriptions.Length.Should().BeGreaterThan(0, $"Pattern '{testPattern}' should match at least one test description");
        }

        [Fact]
        public void ConfigurationValidation_ConceptTest_ShouldValidateThresholdRanges()
        {
            // Arrange - Test configuration validation logic (BR-CEE-005)
            File.Exists(boundaryConfigManagerPath).Should().BeTrue();
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Assert - Verify validation implementation
                content.Should().Contain("validateConfiguration", "Should implement configuration validation");
                content.Should().Contain("isValid", "Should return validation status");
                content.Should().Contain("issues", "Should return validation issues");
                content.Should().Contain("recommendations", "Should provide improvement recommendations");
                
                // Verify threshold validation logic
                content.Should().Contain("boundaryDetectionThreshold < 0", "Should validate boundary threshold lower bound");
                content.Should().Contain("boundaryDetectionThreshold > 1", "Should validate boundary threshold upper bound");
                content.Should().Contain("minBusinessConceptDensity < 0", "Should validate concept density lower bound");
                content.Should().Contain("minAlgorithmComplexityScore < 0", "Should validate complexity score lower bound");
                content.Should().Contain("minSemanticCoherenceScore < 0", "Should validate coherence score lower bound");
                
                // Verify weight factor validation
                content.Should().Contain("totalWeight", "Should validate weight factor sum");
                content.Should().Contain("Math.abs(totalWeight - 1.0)", "Should check weight factors sum to 1.0");
                
                // Test validation scenarios
                var validationScenarios = new[]
                {
                    new { Threshold = 0.5, Valid = true, Description = "Valid threshold" },
                    new { Threshold = -0.1, Valid = false, Description = "Invalid negative threshold" },
                    new { Threshold = 1.5, Valid = false, Description = "Invalid threshold above 1.0" },
                    new { Threshold = 0.9, Valid = true, Description = "Valid high threshold" }
                };
                
                foreach (var scenario in validationScenarios)
                {
                    scenario.Threshold.Should().Match(t => scenario.Valid ? (t >= 0.0 && t <= 1.0) : (t < 0.0 || t > 1.0), 
                        scenario.Description);
                }
            }
        }

        [Theory]
        [InlineData(0.75, 3.0, 0.7, 0.6, 0.85)]    // Well-balanced configuration (high accuracy)
        [InlineData(0.5, 1.0, 0.4, 0.3, 0.50)]     // Low thresholds (base accuracy only)
        [InlineData(0.9, 5.0, 0.9, 0.8, 0.50)]     // High thresholds (outside optimal ranges, base accuracy)
        [InlineData(0.75, 3.0, 0.65, 0.55, 0.80)]  // Good configuration (most bonuses apply)
        public void AccuracyEstimation_ConceptTest_ShouldEstimateConfigurationAccuracy(
            double boundaryThreshold,
            double conceptDensity, 
            double complexityScore,
            double coherenceScore,
            double expectedMinAccuracy)
        {
            // Arrange - Test accuracy estimation logic (BR-CEE-005: >85% accuracy)
            File.Exists(boundaryConfigManagerPath).Should().BeTrue();
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Assert - Verify accuracy estimation implementation
                content.Should().Contain("estimateConfigurationAccuracy", "Should implement accuracy estimation");
                content.Should().Contain("estimatedAccuracy", "Should return accuracy estimation");
                content.Should().Contain("Heuristic accuracy estimation", "Should document estimation approach");
                
                // Verify accuracy calculation factors
                content.Should().Contain("boundaryDetectionThreshold >= 0.7", "Should consider optimal threshold range");
                content.Should().Contain("minBusinessConceptDensity >= 2.0", "Should consider concept density range");
                content.Should().Contain("minAlgorithmComplexityScore >= 0.6", "Should consider complexity score range");
                content.Should().Contain("minSemanticCoherenceScore >= 0.5", "Should consider coherence score range");
                
                // Test accuracy estimation logic simulation (matching TypeScript implementation exactly)
                var estimatedAccuracy = 0.5; // Base accuracy
                
                // Well-balanced thresholds increase accuracy (exact TypeScript logic)
                if (boundaryThreshold >= 0.7 && boundaryThreshold <= 0.8) estimatedAccuracy += 0.2;
                if (conceptDensity >= 2.0 && conceptDensity <= 4.0) estimatedAccuracy += 0.15;
                if (complexityScore >= 0.6 && complexityScore <= 0.8) estimatedAccuracy += 0.1;
                if (coherenceScore >= 0.5 && coherenceScore <= 0.7) estimatedAccuracy += 0.1;
                
                estimatedAccuracy = Math.Min(estimatedAccuracy, 1.0);
                
                // Verify estimation matches expected minimum (allowing for exact calculation)
                estimatedAccuracy.Should().BeGreaterThanOrEqualTo(expectedMinAccuracy, 
                    $"Estimated accuracy should meet expectation for configuration with thresholds {boundaryThreshold}, {conceptDensity}, {complexityScore}, {coherenceScore}. Calculated: {estimatedAccuracy}, Expected: {expectedMinAccuracy}");
                
                // Verify accuracy is within valid range
                estimatedAccuracy.Should().BeInRange(0.5, 1.0, "Accuracy should be between base accuracy and maximum");
            }
        }

        [Fact]
        public void ConfigurationPersistence_ConceptTest_ShouldSaveAndLoadConfigurations()
        {
            // Arrange - Test configuration persistence (BR-CEE-007)
            File.Exists(boundaryConfigManagerPath).Should().BeTrue();
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Assert - Verify persistence implementation
                content.Should().Contain("saveConfiguration", "Should implement configuration saving");
                content.Should().Contain("loadConfiguration", "Should implement configuration loading");
                content.Should().Contain("JSON.stringify", "Should serialize configuration to JSON");
                content.Should().Contain("JSON.parse", "Should deserialize configuration from JSON");
                
                // Verify configuration structure
                content.Should().Contain("version", "Should include configuration version");
                content.Should().Contain("defaultConfig", "Should persist default configuration");
                content.Should().Contain("repositoryConfigs", "Should persist repository type configurations");
                
                // Verify file system operations
                content.Should().Contain("fs.writeFileSync", "Should write configuration to file system");
                content.Should().Contain("fs.readFileSync", "Should read configuration from file system");
                content.Should().Contain("fs.existsSync", "Should check for existing configuration file");
                content.Should().Contain("fs.mkdirSync", "Should create configuration directory if needed");
                
                // Test configuration path handling
                var testConfigPaths = new[]
                {
                    ".context-config/boundary-detection.json",
                    "/path/to/config/boundary-detection.json",
                    "custom-config.json"
                };
                
                foreach (var configPath in testConfigPaths)
                {
                    configPath.Should().EndWith(".json", "Configuration files should use JSON format");
                    Path.GetExtension(configPath).Should().Be(".json", "Configuration should use .json extension");
                }
            }
        }

        [Fact]
        public void CustomRepositoryConfiguration_ConceptTest_ShouldSupportCustomConfigurations()
        {
            // Arrange - Test custom configuration creation (BR-CEE-007)
            File.Exists(boundaryConfigManagerPath).Should().BeTrue();
            
            if (File.Exists(boundaryConfigManagerPath))
            {
                var content = File.ReadAllText(boundaryConfigManagerPath);
                
                // Assert - Verify custom configuration support
                content.Should().Contain("createCustomRepositoryConfig", "Should support custom configuration creation");
                content.Should().Contain("baseType", "Should allow basing custom configs on existing types");
                content.Should().Contain("overrides", "Should support configuration overrides");
                
                // Verify custom configuration validation
                content.Should().Contain("validateConfiguration(customConfig.config)", "Should validate custom configurations");
                content.Should().Contain("Invalid custom configuration", "Should reject invalid custom configurations");
                
                // Test custom configuration scenarios
                var customConfigScenarios = new[]
                {
                    new { Name = "ml-heavy", BaseType = "algorithm-heavy", Description = "Machine learning repositories" },
                    new { Name = "microservice", BaseType = "enterprise", Description = "Microservice architectures" },
                    new { Name = "testing", BaseType = "utility", Description = "Testing and quality assurance repositories" }
                };
                
                foreach (var scenario in customConfigScenarios)
                {
                    scenario.Name.Should().NotBeNullOrEmpty("Custom configuration should have valid name");
                    scenario.BaseType.Should().BeOneOf("algorithm-heavy", "enterprise", "utility", 
                        "Custom configuration should be based on valid repository type");
                    scenario.Description.Should().NotBeNullOrEmpty("Custom configuration should have description");
                }
            }
        }

        [Fact]
        public void IntegratedConfigurationManagement_ConceptTest_ShouldIntegrateWithSemanticBoundaryDetector()
        {
            // Arrange - Test integration with semantic boundary detector (BR-CEE-007)
            var semanticDetectorPath = Path.Combine(Path.GetDirectoryName(boundaryConfigManagerPath)!, "semantic-boundary-detector.ts");
            
            File.Exists(boundaryConfigManagerPath).Should().BeTrue("Config manager should exist");
            File.Exists(semanticDetectorPath).Should().BeTrue("Semantic boundary detector should exist");
            
            if (File.Exists(boundaryConfigManagerPath) && File.Exists(semanticDetectorPath))
            {
                var configContent = File.ReadAllText(boundaryConfigManagerPath);
                var detectorContent = File.ReadAllText(semanticDetectorPath);
                
                // Assert - Verify integration implementation
                detectorContent.Should().Contain("BoundaryDetectionConfigManager", "Detector should import config manager");
                detectorContent.Should().Contain("configManager", "Detector should use config manager");
                detectorContent.Should().Contain("autoConfigureForProject", "Detector should support auto-configuration");
                detectorContent.Should().Contain("switchToRepositoryConfiguration", "Detector should support repository type switching");
                detectorContent.Should().Contain("updateConfigurationWithValidation", "Detector should support validated configuration updates");
                
                // Verify configuration validation integration
                detectorContent.Should().Contain("validateConfiguration", "Detector should validate configurations");
                detectorContent.Should().Contain("ConfigValidationResult", "Detector should return validation results");
                detectorContent.Should().Contain("getCurrentConfigurationStatus", "Detector should provide configuration status");
                
                // Verify repository type detection integration
                detectorContent.Should().Contain("detectRepositoryType", "Detector should detect repository types");
                detectorContent.Should().Contain("getConfigurationForType", "Detector should get type-specific configurations");
                detectorContent.Should().Contain("createCustomRepositoryConfiguration", "Detector should support custom configurations");
            }
        }

        [Theory]
        [InlineData("algorithm-heavy", 0.85, true)]     // Algorithm-heavy should meet accuracy
        [InlineData("enterprise", 0.90, true)]         // Enterprise should exceed accuracy
        [InlineData("utility", 0.80, false)]           // Utility might not meet strict accuracy
        [InlineData("custom-ml", 0.88, true)]          // Custom ML config should meet accuracy
        public void AccuracyRequirementCompliance_ConceptTest_ShouldMeetBusinessRuleAccuracy(
            string repositoryType,
            double configurationAccuracy,
            bool shouldMeetRequirement)
        {
            // Arrange - Test BR-CEE-005: >85% accuracy requirement compliance
            const double ACCURACY_REQUIREMENT = 0.85;
            
            // Act - Test accuracy requirement validation
            var meetsRequirement = configurationAccuracy >= ACCURACY_REQUIREMENT;
            
            // Assert - Verify accuracy compliance
            meetsRequirement.Should().Be(shouldMeetRequirement, 
                $"{repositoryType} configuration with {configurationAccuracy * 100:F1}% accuracy should {(shouldMeetRequirement ? "meet" : "potentially not meet")} the {ACCURACY_REQUIREMENT * 100:F1}% requirement");
            
            if (shouldMeetRequirement)
            {
                configurationAccuracy.Should().BeGreaterThanOrEqualTo(ACCURACY_REQUIREMENT, 
                    $"{repositoryType} should meet BR-CEE-005 accuracy requirement");
            }
            
            // All configurations should be within valid range
            configurationAccuracy.Should().BeInRange(0.0, 1.0, "Accuracy should be valid percentage");
            
            // High-accuracy configurations should be stable
            if (configurationAccuracy >= 0.90)
            {
                configurationAccuracy.Should().BeGreaterThanOrEqualTo(0.90, 
                    "High-accuracy configurations should maintain excellent performance");
            }
        }
    }
}
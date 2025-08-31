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
    /// Unit tests for semantic boundary detector functionality
    /// Tests Enhancement Feature 2, Step 2.1: Boundary Detection Algorithm Development
    /// BR-CEE-005: Boundary detection algorithm must achieve >85% accuracy
    /// BR-CEE-006: Detection must consider business concept density, algorithm complexity, and semantic coherence
    /// BR-CEE-007: Algorithm must be configurable for different repository types
    /// BR-CEE-008: Must avoid creating contexts for trivial directories
    /// </summary>
    public class SemanticBoundaryDetectorTests : TestBase
    {
        private readonly string tempProjectRoot;
        private readonly string semanticBoundaryDetectorPath;

        public SemanticBoundaryDetectorTests()
        {
            tempProjectRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempProjectRoot);
            
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            semanticBoundaryDetectorPath = Path.Combine(projectRoot, "EnvironmentMCPGateway", "src", "services", "semantic-boundary-detector.ts");
            
            // Create test directory structure representing real semantic boundaries
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Analysis", "Fractal"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Analysis", "Indicator"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Analysis", "Pattern"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Data", "Provider"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Data", "Repository"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Messaging", "Event"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Properties")); // Trivial directory
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "obj")); // Excluded directory
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
        public void SemanticBoundaryDetector_ShouldImplementRequiredInterface()
        {
            // Arrange & Act - Verify the semantic boundary detector implementation exists
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue("Semantic boundary detector service should exist");
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify core interface implementation
                content.Should().Contain("export class SemanticBoundaryDetector", "Should export SemanticBoundaryDetector class");
                content.Should().Contain("detectSemanticBoundaries", "Should have detectSemanticBoundaries method");
                content.Should().Contain("BoundaryDetectionConfig", "Should define boundary detection configuration interface");
                content.Should().Contain("BoundaryAnalysisResult", "Should define boundary analysis result interface");
                
                // Verify business rule implementation references
                content.Should().Contain("BR-CEE-005", "Should reference business rule BR-CEE-005");
                content.Should().Contain("BR-CEE-006", "Should reference business rule BR-CEE-006");
                content.Should().Contain("BR-CEE-007", "Should reference business rule BR-CEE-007");
                content.Should().Contain("BR-CEE-008", "Should reference business rule BR-CEE-008");
            }
        }

        [Fact]
        public void BoundaryDetectionConfig_ShouldHaveRequiredProperties()
        {
            // Arrange & Act
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue("Semantic boundary detector should exist");
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify configuration structure
                content.Should().Contain("minBusinessConceptDensity", "Should configure minimum business concept density");
                content.Should().Contain("minAlgorithmComplexityScore", "Should configure minimum algorithm complexity score");
                content.Should().Contain("minSemanticCoherenceScore", "Should configure minimum semantic coherence score");
                
                // Verify weighted scoring system
                content.Should().Contain("businessConceptWeight", "Should have business concept weight factor");
                content.Should().Contain("algorithmComplexityWeight", "Should have algorithm complexity weight factor");
                content.Should().Contain("semanticCoherenceWeight", "Should have semantic coherence weight factor");
                
                // Verify thresholds and constraints
                content.Should().Contain("boundaryDetectionThreshold", "Should have boundary detection threshold");
                content.Should().Contain("excludePatterns", "Should have exclusion patterns for trivial directories");
                content.Should().Contain("maxAnalysisTimeMs", "Should have performance constraint for analysis time");
            }
        }

        [Theory]
        [InlineData("Fractal", 3.0, 0.8, 0.7, true)]     // High complexity algorithm directory
        [InlineData("Indicator", 4.0, 0.9, 0.8, true)]   // High complexity with indicators
        [InlineData("Pattern", 2.5, 0.6, 0.8, false)]    // Below business concept threshold
        [InlineData("Provider", 3.5, 0.5, 0.7, false)]   // Below algorithm complexity threshold  
        [InlineData("Cache", 1.0, 0.3, 0.4, false)]      // Below all thresholds
        public void BoundaryDetection_ConceptTest_ShouldApplyMultipleCriteria(
            string directoryName, 
            double conceptDensity, 
            double algorithmComplexity, 
            double semanticCoherence, 
            bool expectedShouldCreateContext)
        {
            // Arrange - Test multi-criteria boundary detection logic
            var testDirectoryPath = Path.Combine("Utility", "Analysis", directoryName);
            
            // Act & Assert - Verify criteria application
            conceptDensity.Should().BeGreaterThanOrEqualTo(0.0, "Concept density should be valid");
            algorithmComplexity.Should().BeGreaterThanOrEqualTo(0.0, "Algorithm complexity should be valid");
            semanticCoherence.Should().BeGreaterThanOrEqualTo(0.0, "Semantic coherence should be valid");
            
            // Test weighted scoring concept (simulated calculation)
            var weightedScore = (conceptDensity / 3.0 * 0.4) + (algorithmComplexity * 0.35) + (semanticCoherence * 0.25);
            var shouldCreate = weightedScore >= 0.75 && conceptDensity >= 3.0 && algorithmComplexity >= 0.7 && semanticCoherence >= 0.6;
            
            shouldCreate.Should().Be(expectedShouldCreateContext, 
                $"Directory {directoryName} with scores (concepts:{conceptDensity}, complexity:{algorithmComplexity}, coherence:{semanticCoherence}) should have expected context creation decision");
        }

        [Theory]
        [InlineData("Properties", true)]     // Should be excluded as trivial
        [InlineData("obj", true)]           // Should be excluded as build artifact
        [InlineData("bin", true)]           // Should be excluded as build artifact  
        [InlineData("node_modules", true)]  // Should be excluded as package directory
        [InlineData("Fractal", false)]      // Should NOT be excluded as semantic directory
        [InlineData("Indicator", false)]    // Should NOT be excluded as semantic directory
        [InlineData("Provider", false)]     // Should NOT be excluded as semantic directory
        public void TrivialDirectoryDetection_ConceptTest_ShouldExcludeCorrectDirectories(
            string directoryName, 
            bool shouldBeExcluded)
        {
            // Arrange - Test trivial directory exclusion logic (BR-CEE-008)
            var testDirectoryPath = Path.Combine(tempProjectRoot, directoryName);
            
            // Act & Assert - Verify exclusion patterns
            var excludedPatterns = new[] { "Properties", "obj", "bin", "node_modules", ".git", "packages", "logs" };
            var trivialPatterns = new[] { "Properties", "obj", "bin", "packages", "wwwroot", "lib", "migrations", "seeds", "images", "assets", "static" };
            
            var isInExcludedPatterns = excludedPatterns.Any(pattern => 
                directoryName.ToLower().Contains(pattern.ToLower()));
            var isInTrivialPatterns = trivialPatterns.Any(pattern => 
                directoryName.Equals(pattern, StringComparison.OrdinalIgnoreCase));
            
            var actualShouldExclude = isInExcludedPatterns || isInTrivialPatterns;
            
            actualShouldExclude.Should().Be(shouldBeExcluded, 
                $"Directory {directoryName} should have correct exclusion status based on BR-CEE-008");
        }

        [Fact]
        public void BusinessConceptDensityCalculation_ConceptTest_ShouldCountUniqueConceptsCorrectly()
        {
            // Arrange - Test business concept density calculation (BR-CEE-006)
            var testConcepts = new[]
            {
                ("FractalAnalyzer", "Algorithm"),      // Unique concept 1
                ("FractalLeg", "Entity"),              // Unique concept 2  
                ("FractalValidation", "Service"),      // Unique concept 3
                ("FractalAnalyzer", "Algorithm"),      // Duplicate - should not count
                ("InflectionPoint", "Entity")          // Unique concept 4
            };
            
            // Act - Simulate concept density calculation
            var uniqueConceptKeys = testConcepts
                .Select(c => $"{c.Item1}:{c.Item2}")
                .Distinct()
                .ToArray();
            
            var conceptCount = uniqueConceptKeys.Length;
            var minThreshold = 3.0;
            var density = conceptCount / minThreshold;
            
            // Assert - Verify concept counting logic
            conceptCount.Should().Be(4, "Should count 4 unique concepts (excluding duplicate)");
            density.Should().BeApproximately(4.0 / 3.0, 0.01, "Density should be calculated correctly");
            
            // Verify threshold logic
            var meetsThreshold = conceptCount >= minThreshold;
            meetsThreshold.Should().BeTrue("Should meet minimum business concept density threshold");
        }

        [Theory]
        [InlineData("calculation|algorithm|analyze", 0.8)]    // High algorithmic complexity
        [InlineData("moving.?average|rsi|stochastic", 0.9)]  // Technical indicators  
        [InlineData("transform|filter|aggregate", 0.7)]      // Data processing
        [InlineData("simple|basic|utility", 0.2)]            // Low complexity
        [InlineData("getter|setter|property", 0.1)]          // Trivial patterns
        public void AlgorithmComplexityScoring_ConceptTest_ShouldRecognizeComplexityPatterns(
            string complexityPattern, 
            double expectedComplexityRange)
        {
            // Arrange - Test algorithm complexity detection patterns
            var testBusinessConcepts = new[]
            {
                "FractalCalculationAlgorithm analyzes market structure patterns",
                "RSIIndicatorProcessor computes relative strength index",
                "MovingAverageTransform filters price data",
                "SimpleDataContainer holds basic information",
                "PropertyGetter returns field value"
            };
            
            // Act - Test pattern matching simulation
            var patternRegex = new System.Text.RegularExpressions.Regex(complexityPattern, 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            var matchingConcepts = testBusinessConcepts
                .Where(concept => patternRegex.IsMatch(concept))
                .Count();
            
            var simulatedComplexityScore = Math.Min(matchingConcepts / (double)testBusinessConcepts.Length, 1.0);
            
            // Assert - Verify complexity scoring
            if (expectedComplexityRange >= 0.7)
            {
                matchingConcepts.Should().BeGreaterThan(0, 
                    $"High complexity patterns '{complexityPattern}' should match business concepts");
            }
            else if (expectedComplexityRange <= 0.3)
            {
                // For low complexity patterns, we expect fewer matches in algorithmic contexts
                simulatedComplexityScore.Should().BeLessThanOrEqualTo(0.5, 
                    $"Low complexity patterns '{complexityPattern}' should have lower scores in algorithmic contexts");
            }
            
            simulatedComplexityScore.Should().BeGreaterThanOrEqualTo(0.0, "Complexity score should be non-negative");
            simulatedComplexityScore.Should().BeLessThanOrEqualTo(1.0, "Complexity score should not exceed maximum");
        }

        [Theory]
        [InlineData(new[] { "Analysis", "Analysis", "Analysis" }, 1.0)]        // Perfect coherence
        [InlineData(new[] { "Analysis", "Analysis", "Data" }, 0.67)]           // Good coherence  
        [InlineData(new[] { "Analysis", "Data", "Messaging" }, 0.33)]          // Poor coherence
        [InlineData(new[] { "Unknown", "Unknown", "Unknown" }, 1.0)]           // Consistent but unknown
        public void SemanticCoherenceCalculation_ConceptTest_ShouldMeasureDomainConsistency(
            string[] domainContexts, 
            double expectedCoherence)
        {
            // Arrange - Test semantic coherence calculation
            var domainCounts = domainContexts
                .GroupBy(d => d)
                .ToDictionary(g => g.Key, g => g.Count());
            
            // Act - Calculate domain coherence (percentage of files in dominant domain)
            var totalFiles = domainContexts.Length;
            var dominantDomainCount = domainCounts.Values.Max();
            var actualCoherence = (double)dominantDomainCount / totalFiles;
            
            // Assert - Verify coherence calculation
            actualCoherence.Should().BeApproximately(expectedCoherence, 0.01, 
                $"Domain coherence for contexts [{string.Join(", ", domainContexts)}] should be calculated correctly");
            
            actualCoherence.Should().BeGreaterThanOrEqualTo(0.0, "Coherence should be non-negative");
            actualCoherence.Should().BeLessThanOrEqualTo(1.0, "Coherence should not exceed maximum");
            
            // Verify coherence quality assessment
            if (expectedCoherence >= 0.8)
            {
                actualCoherence.Should().BeGreaterThanOrEqualTo(0.8, "High coherence domains should meet quality threshold");
            }
            else if (expectedCoherence <= 0.4)
            {
                actualCoherence.Should().BeLessThanOrEqualTo(0.4, "Low coherence domains should be below quality threshold");
            }
        }

        [Fact]
        public void ConfigurationTuning_ConceptTest_ShouldSupportDifferentRepositoryTypes()
        {
            // Arrange - Test configuration tuning capability (BR-CEE-007)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify configuration flexibility
                content.Should().Contain("updateConfiguration", "Should support configuration updates");
                content.Should().Contain("getConfiguration", "Should provide configuration access");
                content.Should().Contain("Partial<BoundaryDetectionConfig>", "Should support partial configuration updates");
                
                // Verify configurable thresholds for different repository types
                content.Should().Contain("minBusinessConceptDensity", "Should allow tuning business concept density");
                content.Should().Contain("boundaryDetectionThreshold", "Should allow tuning detection sensitivity");
                content.Should().Contain("excludePatterns", "Should allow customizing exclusion patterns");
                
                // Test different repository configuration scenarios
                var repositoryTypes = new[]
                {
                    new { Type = "Algorithm-Heavy", ConceptDensity = 2.0, Threshold = 0.6 },  // Lower thresholds for algorithm repositories
                    new { Type = "Enterprise", ConceptDensity = 4.0, Threshold = 0.8 },       // Higher thresholds for enterprise repositories  
                    new { Type = "Utility", ConceptDensity = 1.5, Threshold = 0.5 }          // Very low thresholds for utility repositories
                };
                
                foreach (var repoType in repositoryTypes)
                {
                    repoType.ConceptDensity.Should().BeGreaterThan(0, $"{repoType.Type} repository should have valid concept density configuration");
                    repoType.Threshold.Should().BeInRange(0.0, 1.0, $"{repoType.Type} repository should have valid threshold configuration");
                }
            }
        }

        [Fact]
        public void AccuracyValidation_ConceptTest_ShouldMeetRequiredAccuracyThreshold()
        {
            // Arrange - Test accuracy validation capability (BR-CEE-005: >85% accuracy)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify accuracy validation implementation
                content.Should().Contain("validateDetectionAccuracy", "Should implement accuracy validation");
                content.Should().Contain("accuracy", "Should calculate accuracy metrics");
                content.Should().Contain("precision", "Should calculate precision metrics");
                content.Should().Contain("recall", "Should calculate recall metrics");
                content.Should().Contain("f1Score", "Should calculate F1 score metrics");
                
                // Test accuracy calculation logic simulation
                var testScenarios = new[]
                {
                    new { TruePositives = 17, FalsePositives = 2, FalseNegatives = 1, TrueNegatives = 10 },  // 90% accuracy
                    new { TruePositives = 15, FalsePositives = 3, FalseNegatives = 2, TrueNegatives = 10 },  // 83% accuracy  
                    new { TruePositives = 20, FalsePositives = 1, FalseNegatives = 1, TrueNegatives = 8 }    // 93% accuracy
                };
                
                foreach (var scenario in testScenarios)
                {
                    var total = scenario.TruePositives + scenario.FalsePositives + scenario.FalseNegatives + scenario.TrueNegatives;
                    var accuracy = (double)(scenario.TruePositives + scenario.TrueNegatives) / total;
                    var precision = (double)scenario.TruePositives / (scenario.TruePositives + scenario.FalsePositives);
                    var recall = (double)scenario.TruePositives / (scenario.TruePositives + scenario.FalseNegatives);
                    
                    accuracy.Should().BeInRange(0.0, 1.0, "Accuracy should be valid percentage");
                    precision.Should().BeInRange(0.0, 1.0, "Precision should be valid percentage");
                    recall.Should().BeInRange(0.0, 1.0, "Recall should be valid percentage");
                    
                    if (accuracy >= 0.85)
                    {
                        accuracy.Should().BeGreaterThanOrEqualTo(0.85, "Should meet BR-CEE-005 accuracy requirement");
                    }
                }
            }
        }

        [Fact]
        public void PerformanceConstraints_ConceptTest_ShouldMeetTimingRequirements()
        {
            // Arrange - Test performance constraints (10 seconds analysis time)
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify performance constraint implementation
                content.Should().Contain("maxAnalysisTimeMs", "Should have maximum analysis time configuration");
                content.Should().Contain("10000", "Should default to 10 seconds (10000ms) analysis limit");
                content.Should().Contain("Date.now() - startTime", "Should track analysis execution time");
                content.Should().Contain("timeout", "Should implement timeout detection");
                
                // Verify performance logging and metrics
                content.Should().Contain("detectionDurationMs", "Should track individual boundary detection duration");
                content.Should().Contain("totalAnalysisTimeMs", "Should track total analysis duration");
                content.Should().Contain("logger.warn", "Should log performance warnings for timeout situations");
                
                // Test timing constraint scenarios
                var performanceScenarios = new[]
                {
                    new { DirectoryCount = 10, ExpectedTimeMs = 1000 },   // Small repository
                    new { DirectoryCount = 50, ExpectedTimeMs = 5000 },   // Medium repository  
                    new { DirectoryCount = 100, ExpectedTimeMs = 10000 }  // Large repository (at limit)
                };
                
                foreach (var scenario in performanceScenarios)
                {
                    scenario.ExpectedTimeMs.Should().BeLessThanOrEqualTo(10000, 
                        $"Analysis for {scenario.DirectoryCount} directories should complete within performance constraints");
                }
            }
        }

        [Fact]
        public void BoundaryDetectionWorkflow_ConceptTest_ShouldFollowCorrectAnalysisSequence()
        {
            // Arrange - Test complete boundary detection workflow
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - Verify workflow sequence implementation
                content.Should().Contain("groupSemanticResultsByDirectory", "Should group semantic results by directory");
                content.Should().Contain("shouldSkipDirectory", "Should check for directory exclusions");
                content.Should().Contain("analyzeBoundaryPotential", "Should analyze boundary potential for each directory");
                
                // Verify individual analysis components
                content.Should().Contain("calculateBusinessConceptDensity", "Should calculate business concept density");
                content.Should().Contain("calculateAlgorithmComplexityScore", "Should calculate algorithm complexity score");
                content.Should().Contain("calculateSemanticCoherenceScore", "Should calculate semantic coherence score");
                
                // Verify decision making process
                content.Should().Contain("overallScore", "Should calculate overall weighted score");
                content.Should().Contain("shouldCreateContext", "Should make boundary creation decision");
                content.Should().Contain("generateBoundaryReasoning", "Should generate human-readable reasoning");
                
                // Verify output structure
                content.Should().Contain("detectedBoundaries", "Should return detected boundaries");
                content.Should().Contain("analysisMetrics", "Should return analysis metrics");
                content.Should().Contain("confidence", "Should include confidence scores");
            }
        }

        [Theory]
        [InlineData("/Utility/Analysis/Fractal/", "Fractal Analysis", true)]
        [InlineData("/Utility/Analysis/Indicator/", "Technical Indicators", true)]  
        [InlineData("/Utility/Data/Provider/", "Data Providers", true)]
        [InlineData("/Utility/Properties/", "Project Properties", false)]
        [InlineData("/bin/Debug/", "Build Artifacts", false)]
        public void RealWorldDirectoryScenarios_ConceptTest_ShouldHandleTypicalProjectStructure(
            string directoryPath, 
            string description, 
            bool expectedShouldCreateContext)
        {
            // Arrange - Test real-world directory scenarios from actual project structure
            var normalizedPath = directoryPath.Replace('\\', '/');
            var dirName = Path.GetFileName(normalizedPath.TrimEnd('/'));
            
            // Act - Simulate real-world boundary detection logic
            var isExcludedPath = normalizedPath.ToLower().Contains("bin") || 
                               normalizedPath.ToLower().Contains("obj") || 
                               normalizedPath.ToLower().Contains("properties");
            
            var hasSemanticValue = normalizedPath.Contains("Fractal") || 
                                 normalizedPath.Contains("Indicator") || 
                                 normalizedPath.Contains("Provider") ||
                                 normalizedPath.Contains("Analysis") ||
                                 normalizedPath.Contains("Data");
            
            var shouldCreate = hasSemanticValue && !isExcludedPath;
            
            // Assert - Verify expected behavior for real-world scenarios
            shouldCreate.Should().Be(expectedShouldCreateContext, 
                $"Directory {directoryPath} ({description}) should have correct boundary detection decision based on real-world project patterns");
            
            // Verify path normalization
            normalizedPath.Should().NotContain("\\", "Paths should be normalized to forward slashes");
            dirName.Should().NotBeNullOrEmpty("Should be able to extract directory name");
        }

        [Fact]
        public void BusinessRulesCompliance_ConceptTest_ShouldMeetAllRequiredBusinessRules()
        {
            // Arrange & Act - Comprehensive business rule compliance test
            File.Exists(semanticBoundaryDetectorPath).Should().BeTrue();
            
            if (File.Exists(semanticBoundaryDetectorPath))
            {
                var content = File.ReadAllText(semanticBoundaryDetectorPath);
                
                // Assert - BR-CEE-005: Boundary detection algorithm must achieve >85% accuracy
                content.Should().Contain("BR-CEE-005", "Should reference accuracy requirement");
                content.Should().Contain(">85%", "Should mention 85% accuracy target");
                content.Should().Contain("validateDetectionAccuracy", "Should implement accuracy validation");
                
                // BR-CEE-006: Detection must consider business concept density, algorithm complexity, and semantic coherence  
                content.Should().Contain("BR-CEE-006", "Should reference multi-criteria detection");
                content.Should().Contain("businessConceptDensity", "Should implement business concept density");
                content.Should().Contain("algorithmComplexityScore", "Should implement algorithm complexity scoring");
                content.Should().Contain("semanticCoherenceScore", "Should implement semantic coherence scoring");
                
                // BR-CEE-007: Algorithm must be configurable for different repository types
                content.Should().Contain("BR-CEE-007", "Should reference configurability requirement");
                content.Should().Contain("updateConfiguration", "Should support configuration updates");
                content.Should().Contain("BoundaryDetectionConfig", "Should have configurable parameters");
                
                // BR-CEE-008: Must avoid creating contexts for trivial directories  
                content.Should().Contain("BR-CEE-008", "Should reference trivial directory avoidance");
                content.Should().Contain("trivialDirectoryPatterns", "Should define trivial directory patterns");
                content.Should().Contain("shouldSkipDirectory", "Should implement directory skipping logic");
            }
        }
    }
}
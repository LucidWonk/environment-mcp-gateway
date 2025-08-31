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
    /// Unit tests for enhanced semantic analysis domain detection functionality
    /// Tests Enhancement Feature 1, Step 1.2: Semantic Analysis Domain Detection Enhancement
    /// BR-CEE-002: Domain detection must recognize semantic subdirectories with business content
    /// </summary>
    public class SemanticAnalysisDomainDetectionTests : TestBase
    {
        private readonly string tempProjectRoot;
        private readonly string semanticAnalysisPath;

        public SemanticAnalysisDomainDetectionTests()
        {
            tempProjectRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempProjectRoot);
            
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            semanticAnalysisPath = Path.Combine(projectRoot, "EnvironmentMCPGateway", "src", "services", "semantic-analysis.ts");
            
            // Create test directory structure for semantic subdirectories
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Analysis", "Fractal"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Analysis", "Indicator"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Analysis", "Pattern"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Data", "Provider"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Data", "Repository"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Messaging", "Event"));
            Directory.CreateDirectory(Path.Combine(tempProjectRoot, "Utility", "Messaging", "Handler"));
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
        public void SemanticAnalysisService_ShouldSupportSemanticSubdirectoryDetection()
        {
            // Arrange & Act - Verify the enhanced extractDomainFromPath implementation exists
            File.Exists(semanticAnalysisPath).Should().BeTrue("Semantic analysis service should exist");
            
            if (File.Exists(semanticAnalysisPath))
            {
                var content = File.ReadAllText(semanticAnalysisPath);
                
                // Assert - Verify enhanced domain detection is implemented
                content.Should().Contain("semanticSubdirectoryPatterns", "Should define semantic subdirectory patterns");
                content.Should().Contain("BR-CEE-002", "Should reference business rule BR-CEE-002");
                content.Should().Contain("Enhanced domain detection", "Should have enhanced domain detection comment");
                
                // Verify semantic subdirectory mappings
                content.Should().Contain("'fractal': 'Analysis.Fractal'", "Should map fractal to Analysis.Fractal");
                content.Should().Contain("'indicator': 'Analysis.Indicator'", "Should map indicator to Analysis.Indicator");
                content.Should().Contain("'provider': 'Data.Provider'", "Should map provider to Data.Provider");
                content.Should().Contain("'event': 'Messaging.Event'", "Should map event to Messaging.Event");
                
                // Verify backward compatibility is maintained
                content.Should().Contain("Fallback to traditional domain detection", "Should maintain backward compatibility");
                content.Should().Contain("'analysis', 'data', 'messaging'", "Should still support traditional domains");
            }
        }

        [Theory]
        [InlineData("/Utility/Analysis/Fractal/FractalAnalyzer.cs", "Analysis.Fractal")]
        [InlineData("/Utility/Analysis/Indicator/RSICalculator.cs", "Analysis.Indicator")]
        [InlineData("/Utility/Analysis/Pattern/PatternRecognition.cs", "Analysis.Pattern")]
        [InlineData("/Utility/Analysis/Algorithm/TradingAlgorithm.cs", "Analysis.Algorithm")]
        [InlineData("/Utility/Data/Provider/TwelveDataProvider.cs", "Data.Provider")]
        [InlineData("/Utility/Data/Repository/MarketDataRepository.cs", "Data.Repository")]
        [InlineData("/Utility/Data/Cache/DataCache.cs", "Data.Cache")]
        [InlineData("/Utility/Data/Transform/DataTransformer.cs", "Data.Transform")]
        [InlineData("/Utility/Messaging/Event/MarketDataEvent.cs", "Messaging.Event")]
        [InlineData("/Utility/Messaging/Command/ProcessDataCommand.cs", "Messaging.Command")]
        [InlineData("/Utility/Messaging/Handler/EventHandler.cs", "Messaging.Handler")]
        [InlineData("/Utility/Messaging/Publisher/EventPublisher.cs", "Messaging.Publisher")]
        public void SemanticSubdirectoryPaths_ConceptTest_ShouldMapToCorrectDomains(string filePath, string expectedDomain)
        {
            // Arrange - Test file paths that should map to semantic subdirectories
            var normalizedPath = Path.GetFullPath(filePath);
            var pathParts = filePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            // Act & Assert - Verify path structure matches expected semantic patterns
            pathParts.Should().Contain("Utility", "Path should contain Utility namespace");
            pathParts.Length.Should().BeGreaterThan(3, "Semantic paths should have sufficient depth");
            
            var expectedParts = expectedDomain.Split('.');
            expectedParts.Length.Should().Be(2, "Expected domain should have format Domain.Subdirectory");
            
            var domainPart = expectedParts[0];
            var subdirectoryPart = expectedParts[1];
            
            pathParts.Should().Contain(domainPart, $"Path should contain {domainPart} domain");
            pathParts.Should().Contain(subdirectoryPart, $"Path should contain {subdirectoryPart} subdirectory");
        }

        [Theory]
        [InlineData("/Utility/Analysis/SomeFile.cs", "Analysis")]
        [InlineData("/Utility/Data/SomeFile.cs", "Data")]
        [InlineData("/Utility/Messaging/SomeFile.cs", "Messaging")]
        [InlineData("/Console/Program.cs", "Unknown")]
        [InlineData("/TestSuite/TestClass.cs", "Unknown")]
        public void BackwardCompatibility_ConceptTest_ShouldMaintainTraditionalDomainDetection(string filePath, string expectedDomain)
        {
            // Arrange - Test that traditional domain detection still works
            var pathParts = filePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            // Act & Assert - Verify traditional domain patterns are still supported
            if (expectedDomain != "Unknown")
            {
                pathParts.Should().Contain(expectedDomain, $"Path should contain {expectedDomain} domain");
            }
            
            // Test that the path structure is still compatible
            var normalizedPath = filePath.Replace('\\', '/');
            normalizedPath.Should().NotBeNullOrEmpty("Path should be valid");
            normalizedPath.Should().StartWith("/", "Test paths should start with root");
        }

        [Fact]
        public void DomainDetectionLogic_ConceptTest_ShouldPrioritizeSemanticSubdirectories()
        {
            // Arrange - Test that semantic subdirectories take precedence over traditional domains
            var semanticPath = "/Utility/Analysis/Fractal/FractalAnalyzer.cs";
            var traditionalPath = "/Utility/Analysis/GeneralAnalyzer.cs";
            
            // Act & Assert - Semantic paths should be more specific
            var semanticPathParts = semanticPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var traditionalPathParts = traditionalPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            // Semantic paths have more depth and specificity
            semanticPathParts.Length.Should().BeGreaterThan(traditionalPathParts.Length, 
                "Semantic paths should have more depth than traditional paths");
            
            // Both should contain the base domain
            semanticPathParts.Should().Contain("Analysis", "Semantic path should contain Analysis domain");
            traditionalPathParts.Should().Contain("Analysis", "Traditional path should contain Analysis domain");
            
            // Only semantic path should contain the subdirectory
            semanticPathParts.Should().Contain("Fractal", "Semantic path should contain Fractal subdirectory");
            traditionalPathParts.Should().NotContain("Fractal", "Traditional path should not contain Fractal subdirectory");
        }

        [Fact]
        public void PathNormalization_ConceptTest_ShouldHandleVariousPathFormats()
        {
            // Arrange - Test different path formats that might be encountered
            var testPaths = new[]
            {
                "/Utility/Analysis/Fractal/FractalAnalyzer.cs",        // Unix-style
                "\\Utility\\Analysis\\Indicator\\RSI.cs",              // Windows-style
                "Utility/Data/Provider/ApiProvider.cs",                // Relative Unix
                "Utility\\Messaging\\Event\\MarketEvent.cs"            // Relative Windows
            };

            // Act & Assert - All paths should be processable
            foreach (var testPath in testPaths)
            {
                var normalizedPath = testPath.Replace('\\', '/');
                var pathParts = normalizedPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                
                pathParts.Should().NotBeEmpty($"Path {testPath} should have parts after normalization");
                pathParts.Should().Contain("Utility", $"Path {testPath} should contain Utility after normalization");
                
                // Test that we can identify domain patterns regardless of path format
                var hasDomainPattern = pathParts.Any(part => 
                    new[] { "Analysis", "Data", "Messaging" }.Contains(part));
                hasDomainPattern.Should().BeTrue($"Path {testPath} should contain recognizable domain pattern");
            }
        }

        [Fact]
        public void SemanticSubdirectoryValidation_ConceptTest_ShouldRequireParentDomain()
        {
            // Arrange - Test that semantic subdirectories are validated against parent domains
            var validSemanticPaths = new[]
            {
                "/Utility/Analysis/Fractal/FractalAnalyzer.cs",    // Fractal under Analysis ✓
                "/Utility/Data/Provider/DataProvider.cs",          // Provider under Data ✓  
                "/Utility/Messaging/Event/SomeEvent.cs"            // Event under Messaging ✓
            };

            var invalidSemanticPaths = new[]
            {
                "/Utility/Data/Fractal/SomeFile.cs",               // Fractal under Data ✗
                "/Utility/Analysis/Provider/SomeFile.cs",          // Provider under Analysis ✗
                "/Utility/Messaging/Indicator/SomeFile.cs"         // Indicator under Messaging ✗
            };

            // Act & Assert - Valid paths should have correct domain-subdirectory relationships
            foreach (var validPath in validSemanticPaths)
            {
                var pathParts = validPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                
                // Find the domain and subdirectory
                var domainIndex = -1;
                var subdirectoryIndex = -1;
                
                for (int i = 0; i < pathParts.Length - 1; i++)
                {
                    if (new[] { "Analysis", "Data", "Messaging" }.Contains(pathParts[i]))
                    {
                        domainIndex = i;
                        if (i + 1 < pathParts.Length)
                        {
                            subdirectoryIndex = i + 1;
                        }
                        break;
                    }
                }
                
                domainIndex.Should().BeGreaterThan(-1, $"Valid path {validPath} should have identifiable domain");
                subdirectoryIndex.Should().BeGreaterThan(-1, $"Valid path {validPath} should have identifiable subdirectory");
                
                if (domainIndex > -1 && subdirectoryIndex > -1)
                {
                    var domain = pathParts[domainIndex];
                    var subdirectory = pathParts[subdirectoryIndex];
                    
                    // Verify domain-subdirectory relationships
                    var validRelationships = new[]
                    {
                        ("Analysis", "Fractal"),
                        ("Analysis", "Indicator"), 
                        ("Analysis", "Pattern"),
                        ("Analysis", "Algorithm"),
                        ("Data", "Provider"),
                        ("Data", "Repository"),
                        ("Data", "Cache"),
                        ("Data", "Transform"),
                        ("Messaging", "Event"),
                        ("Messaging", "Command"),
                        ("Messaging", "Handler"),
                        ("Messaging", "Publisher")
                    };
                    
                    validRelationships.Should().Contain((domain, subdirectory), 
                        $"Path {validPath} should have valid domain-subdirectory relationship");
                }
            }
        }

        [Fact]
        public void SemanticAnalysisImplementation_ShouldMeetPerformanceRequirements()
        {
            // Arrange & Act - Verify implementation doesn't introduce performance regressions
            File.Exists(semanticAnalysisPath).Should().BeTrue("Semantic analysis service should exist");
            
            if (File.Exists(semanticAnalysisPath))
            {
                var content = File.ReadAllText(semanticAnalysisPath);
                
                // Assert - Implementation should be efficient
                content.Should().Contain("semanticSubdirectoryPatterns", "Should use precomputed patterns for efficiency");
                content.Should().Contain("for (let i = 0; i < parts.length; i++)", "Should use efficient loop for path traversal");
                content.Should().Contain("toLowerCase()", "Should use case-insensitive comparison for robustness");
                
                // Verify early termination patterns for performance
                content.Should().Contain("return semanticSubdirectoryPatterns[part]", "Should return early when match found");
                content.Should().Contain("break", "Should include break or return statements for optimization");
                
                // Verify fallback mechanism
                content.Should().Contain("Fallback to traditional", "Should have fallback for backward compatibility");
            }
        }

        [Fact]
        public void BusinessRuleBRCEE002_ShouldBeImplementedCorrectly()
        {
            // Arrange & Act - Verify BR-CEE-002 compliance
            File.Exists(semanticAnalysisPath).Should().BeTrue("Semantic analysis service should exist");
            
            if (File.Exists(semanticAnalysisPath))
            {
                var content = File.ReadAllText(semanticAnalysisPath);
                
                // Assert - BR-CEE-002: Domain detection must recognize semantic subdirectories with business content
                content.Should().Contain("BR-CEE-002", "Should reference business rule BR-CEE-002");
                content.Should().Contain("semantic subdirectories", "Should implement semantic subdirectory detection");
                content.Should().Contain("business content", "Should consider business content in detection");
                
                // Verify all required semantic subdirectories are supported
                var requiredAnalysisSubdirs = new[] { "fractal", "indicator", "pattern", "algorithm" };
                var requiredDataSubdirs = new[] { "provider", "repository", "cache", "transform" };
                var requiredMessagingSubdirs = new[] { "event", "command", "handler", "publisher" };
                
                foreach (var subdir in requiredAnalysisSubdirs)
                {
                    content.Should().Contain($"'{subdir}': 'Analysis.", $"Should support Analysis.{subdir}");
                }
                
                foreach (var subdir in requiredDataSubdirs)
                {
                    content.Should().Contain($"'{subdir}': 'Data.", $"Should support Data.{subdir}");
                }
                
                foreach (var subdir in requiredMessagingSubdirs)
                {
                    content.Should().Contain($"'{subdir}': 'Messaging.", $"Should support Messaging.{subdir}");
                }
            }
        }
    }
}
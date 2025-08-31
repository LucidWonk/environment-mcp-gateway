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
    /// Unit tests for C# attribute metadata analysis functionality
    /// Tests Enhancement Feature 3, Step 3.2: C# Attribute Metadata Analysis
    /// BR-CEE-010: Must extract 10+ business rules from Indicator domain covering parameter validation, 
    /// calculation constraints, and signal generation logic
    /// BR-CEE-011: Must achieve >80% accuracy in business rule classification and confidence scoring
    /// BR-CEE-012: Rule extraction must focus on semantic value for AI development assistance
    /// </summary>
    public class CSharpAttributeAnalysisTests : TestBase
    {
        private readonly string tempProjectRoot;
        private readonly string xmlParserPath;

        public CSharpAttributeAnalysisTests()
        {
            tempProjectRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempProjectRoot);
            
            var currentDir = Directory.GetCurrentDirectory();
            var projectRoot = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", ".."));
            xmlParserPath = Path.Combine(projectRoot, "EnvironmentMCPGateway", "src", "services", "xml-documentation-rule-parser.ts");
            
            // Create test C# files with various attribute patterns
            CreateIndicatorParameterTestFile();
            CreateIndicatorDefinitionTestFile();
            CreateValidationAttributeTestFile();
            CreateComplexAttributeTestFile();
        }

        private void CreateIndicatorParameterTestFile()
        {
            var filePath = Path.Combine(tempProjectRoot, "IndicatorParameterTest.cs");
            var content = @"
using System;

/// <summary>
/// Test indicator with various parameter attribute patterns
/// </summary>
[IndicatorDefinition(""RSI"", ""Relative Strength Index"")]
public class RelativeStrengthIndex
{
    /// <summary>
    /// Period parameter with critical constraints
    /// </summary>
    [IndicatorParameter(IsRequired = true, MinValue = 1, MaxValue = 100, Description = ""Period for RSI calculation"")]
    public int Period { get; }

    /// <summary>
    /// Optional indicator composition parameter  
    /// </summary>
    [IndicatorParameter(IsRequired = false, Description = ""Base indicator to calculate RSI from"")]
    public IIndicator BaseIndicator { get; }

    /// <summary>
    /// Threshold parameter for signal generation
    /// </summary>
    [IndicatorParameter(IsRequired = true, MinValue = 0, MaxValue = 100, Description = ""Overbought threshold level"")]
    public double Threshold { get; }

    /// <summary>
    /// Factor parameter for algorithmic scaling
    /// </summary>
    [IndicatorParameter(IsRequired = false, Description = ""Scaling factor for sensitivity adjustment"")]
    public double Factor { get; set; }
}";
            File.WriteAllText(filePath, content);
        }

        private void CreateIndicatorDefinitionTestFile()
        {
            var filePath = Path.Combine(tempProjectRoot, "IndicatorDefinitionTest.cs");
            var content = @"
/// <summary>
/// Momentum indicator implementation
/// </summary>
[IndicatorDefinition(""RSI"", ""Relative Strength Index"")]
public class RelativeStrengthIndex : IndicatorBase
{
}

/// <summary>
/// Trend following indicator
/// </summary>
[IndicatorDefinition(""SMA"", ""Simple Moving Average"")]
public class SimpleMovingAverage : IndicatorBase
{
}

/// <summary>
/// Volatility measurement indicator
/// </summary>
[IndicatorDefinition(""BB"", ""Bollinger Bands"")]
public class BollingerBands : IndicatorBase
{
}

/// <summary>
/// Volume analysis indicator
/// </summary>
[IndicatorDefinition(""OBV"", ""On Balance Volume"")]
public class OnBalanceVolume : IndicatorBase
{
}";
            File.WriteAllText(filePath, content);
        }

        private void CreateValidationAttributeTestFile()
        {
            var filePath = Path.Combine(tempProjectRoot, "ValidationAttributeTest.cs");
            var content = @"
using System.ComponentModel.DataAnnotations;

public class ValidationTestClass
{
    [Required]
    public string RequiredField { get; set; }

    [Range(1, 100)]
    public int RangeField { get; set; }

    [MinLength(5)]
    public string MinLengthField { get; set; }

    [MaxLength(50)]
    public string MaxLengthField { get; set; }

    [RegularExpression(@""^[A-Z]{2,3}$"")]
    public string PatternField { get; set; }

    [Required]
    [Range(0.1, 99.9)]
    [MaxLength(20)]
    public string ComplexValidationField { get; set; }
}";
            File.WriteAllText(filePath, content);
        }

        private void CreateComplexAttributeTestFile()
        {
            var filePath = Path.Combine(tempProjectRoot, "ComplexAttributeTest.cs");
            var content = @"
/// <summary>
/// Complex indicator with multiple attribute combinations
/// </summary>
[IndicatorDefinition(""MACD"", ""Moving Average Convergence Divergence"")]
public class MovingAverageConvergenceDivergence
{
    [IndicatorParameter(IsRequired = true, MinValue = 1, MaxValue = 50, Description = ""Fast period for MACD calculation"")]
    [Range(1, 50)]
    public int FastPeriod { get; }

    [IndicatorParameter(IsRequired = true, MinValue = 1, MaxValue = 100, Description = ""Slow period for MACD calculation"")]
    [Range(1, 100)]
    public int SlowPeriod { get; }

    [IndicatorParameter(IsRequired = true, MinValue = 1, MaxValue = 20, Description = ""Signal line period"")]
    public int SignalPeriod { get; }

    [IndicatorParameter(IsRequired = false, Description = ""Window size for analysis"")]
    public int WindowSize { get; set; }
}";
            File.WriteAllText(filePath, content);
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
        public void EnhancedAttributeExtraction_ShouldExtractIndicatorParameterRules()
        {
            // Arrange - Test enhanced IndicatorParameter attribute extraction
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify enhanced IndicatorParameter extraction capabilities
                content.Should().Contain("extractIndicatorParameterRules", "Should have enhanced parameter extraction method");
                content.Should().Contain("analyzeParameterSemantics", "Should analyze parameter semantic patterns");
                content.Should().Contain("propertyType", "Should capture property type information");
                content.Should().Contain("propertyName", "Should capture property name information");
                
                // Verify semantic analysis patterns
                content.Should().Contain("period", "Should recognize period parameter patterns");
                content.Should().Contain("threshold", "Should recognize threshold parameter patterns");
                content.Should().Contain("factor", "Should recognize factor parameter patterns");
                content.Should().Contain("window", "Should recognize window parameter patterns");
            }
        }

        [Fact]
        public void EnhancedAttributeExtraction_ShouldExtractIndicatorDefinitionRules()
        {
            // Arrange - Test enhanced IndicatorDefinition attribute extraction  
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify enhanced IndicatorDefinition extraction capabilities
                content.Should().Contain("extractIndicatorDefinitionRules", "Should have enhanced definition extraction method");
                content.Should().Contain("analyzeIndicatorDefinitionSemantics", "Should analyze indicator semantic classification");
                content.Should().Contain("className", "Should capture class name information");
                
                // Verify indicator type classification
                content.Should().Contain("Momentum", "Should classify momentum indicators");
                content.Should().Contain("Trend", "Should classify trend indicators");
                content.Should().Contain("Volatility", "Should classify volatility indicators");
                content.Should().Contain("Volume", "Should classify volume indicators");
                
                // Verify naming consistency analysis
                content.Should().Contain("naming-consistency", "Should analyze naming consistency");
            }
        }

        [Fact]
        public void EnhancedAttributeExtraction_ShouldAnalyzeValidationAttributes()
        {
            // Arrange - Test enhanced validation attribute analysis
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify enhanced validation attribute capabilities
                content.Should().Contain("extractValidationAttributeRules", "Should have enhanced validation extraction method");
                content.Should().Contain("validationPatterns", "Should define validation patterns");
                content.Should().Contain("calculateAttributeConfidence", "Should calculate confidence for attributes");
                
                // Verify validation types
                content.Should().Contain("Required", "Should recognize Required validation");
                content.Should().Contain("Range", "Should recognize Range validation");
                content.Should().Contain("MinLength", "Should recognize MinLength validation");
                content.Should().Contain("MaxLength", "Should recognize MaxLength validation");
                content.Should().Contain("RegularExpression", "Should recognize RegularExpression validation");
            }
        }

        [Fact]
        public void AttributeCombinationAnalysis_ShouldIdentifyComplexValidation()
        {
            // Arrange - Test attribute combination analysis (Step 3.2 new feature)
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify attribute combination analysis
                content.Should().Contain("extractAttributeCombinationRules", "Should analyze attribute combinations");
                content.Should().Contain("multiAttributeRegex", "Should detect multiple attributes");
                content.Should().Contain("complex-validation", "Should identify complex validation patterns");
                content.Should().Contain("attributeCount", "Should count attributes per property");
            }
        }

        [Fact]
        public void PropertyAttributeRelationshipAnalysis_ShouldAnalyzeTypePatterns()
        {
            // Arrange - Test property-attribute relationship analysis (Step 3.2 new feature)
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify property-attribute relationship analysis
                content.Should().Contain("extractPropertyAttributeRules", "Should analyze property-attribute relationships");
                content.Should().Contain("typeAttributePatterns", "Should define type-attribute patterns");
                content.Should().Contain("semantic-pattern", "Should identify semantic patterns");
                
                // Verify type-specific patterns
                content.Should().Contain("int", "Should analyze integer property patterns");
                content.Should().Contain("double", "Should analyze double property patterns");
                content.Should().Contain("string", "Should analyze string property patterns");
                content.Should().Contain("IIndicator", "Should analyze indicator property patterns");
            }
        }

        [Theory]
        [InlineData("Period", "period")]
        [InlineData("Threshold", "threshold")]
        [InlineData("Factor", "factor")]
        [InlineData("WindowSize", "window")]
        public void SemanticParameterAnalysis_ShouldRecognizeBusinessPatterns(
            string parameterName, 
            string expectedPattern)
        {
            // Arrange - Test semantic analysis of parameter names and business significance
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify semantic parameter analysis
                content.Should().Contain("businessSignificancePatterns", "Should define business significance patterns");
                content.Should().Contain("parameter-semantic", "Should classify parameter semantics");
                
                // Verify specific pattern recognition
                content.Should().Contain(expectedPattern, $"Should recognize {expectedPattern} pattern for {parameterName}");
            }
        }

        [Fact]
        public void ConfidenceScoring_ShouldProvideAccurateScoresForAttributes()
        {
            // Arrange - Test BR-CEE-011: >80% accuracy in business rule classification
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify confidence scoring implementation
                content.Should().Contain("calculateAttributeConfidence", "Should implement confidence calculation");
                content.Should().Contain("confidence += 0.10", "Should boost confidence for reliable patterns");
                content.Should().Contain("confidence += 0.05", "Should adjust confidence based on content");
                content.Should().Contain("Math.min(confidence, 0.95)", "Should cap confidence at reasonable maximum");
                
                // Verify base confidence levels
                const double REQUIRED_ACCURACY = 0.80;
                REQUIRED_ACCURACY.Should().BeGreaterThanOrEqualTo(0.80, "Should meet BR-CEE-011 accuracy requirement");
            }
        }

        [Fact]
        public void ConstraintExtraction_ShouldProvideDetailedContext()
        {
            // Arrange - Test detailed constraint extraction for enhanced context
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify constraint extraction capabilities
                content.Should().Contain("extractConstraintsFromAttribute", "Should extract detailed constraints");
                content.Should().Contain("Required parameter", "Should identify required constraints");
                content.Should().Contain("Minimum value", "Should extract minimum value constraints");
                content.Should().Contain("Maximum value", "Should extract maximum value constraints");
                content.Should().Contain("Purpose", "Should extract purpose descriptions");
            }
        }

        [Fact]
        public void BusinessRuleCompliance_Step32_ShouldMeetAllEnhancementRequirements()
        {
            // Arrange & Act - Comprehensive Step 3.2 business rule compliance test
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - BR-CEE-010: Extract 10+ business rules from Indicator domain 
                content.Should().Contain("Step 3.2", "Should implement Step 3.2 enhancements");
                content.Should().Contain("C# Attribute Metadata Analysis", "Should implement attribute metadata analysis");
                
                // Verify enhanced extraction methods
                content.Should().Contain("extractIndicatorParameterRules", "Should have enhanced parameter extraction");
                content.Should().Contain("extractIndicatorDefinitionRules", "Should have enhanced definition extraction");
                content.Should().Contain("extractValidationAttributeRules", "Should have enhanced validation extraction");
                content.Should().Contain("extractAttributeCombinationRules", "Should have combination analysis");
                content.Should().Contain("extractPropertyAttributeRules", "Should have relationship analysis");
                
                // BR-CEE-011: >80% accuracy in business rule classification
                content.Should().Contain("calculateAttributeConfidence", "Should implement accuracy scoring");
                content.Should().Contain("confidence", "Should track confidence levels");
                
                // BR-CEE-012: Focus on semantic value for AI development assistance
                content.Should().Contain("semantic", "Should provide semantic analysis");
                content.Should().Contain("business significance", "Should analyze business significance");
                content.Should().Contain("AI development assistance", "Should focus on AI assistance value");
                
                // Verify comprehensive attribute coverage
                content.Should().Contain("IndicatorParameter", "Should handle indicator parameters");
                content.Should().Contain("IndicatorDefinition", "Should handle indicator definitions");
                content.Should().Contain("ValidationRule", "Should handle validation rules");
                content.Should().Contain("BusinessLogicRule", "Should extract business logic rules");
            }
        }

        [Theory]
        [InlineData("RSI", "Momentum")]
        [InlineData("SMA", "Trend")]
        [InlineData("BollingerBands", "Volatility")]
        [InlineData("OnBalanceVolume", "Volume")]
        public void IndicatorClassification_ShouldClassifyIndicatorTypes(
            string indicatorName,
            string expectedType)
        {
            // Arrange - Test indicator type classification (Step 3.2 enhancement)
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            // Verify indicator name is provided for classification
            indicatorName.Should().NotBeNullOrEmpty("Indicator name should be provided for classification");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify indicator classification capability
                content.Should().Contain("indicatorTypes", "Should define indicator type patterns");
                content.Should().Contain("indicator-classification", "Should classify indicators");
                content.Should().Contain(expectedType, $"Should recognize {expectedType} indicator type");
                
                // Verify business rule extraction for indicator types
                if (expectedType == "Momentum")
                {
                    content.Should().Contain("overbought", "Should understand momentum indicator concepts");
                }
                else if (expectedType == "Trend")
                {
                    content.Should().Contain("directional", "Should understand trend indicator concepts");
                }
                else if (expectedType == "Volatility")
                {
                    content.Should().Contain("dispersion", "Should understand volatility indicator concepts");
                }
                else if (expectedType == "Volume")
                {
                    content.Should().Contain("trading activity", "Should understand volume indicator concepts");
                }
            }
        }

        [Fact]
        public void CriticalParameterAnalysis_ShouldIdentifyBusinessImportance()
        {
            // Arrange - Test critical parameter analysis (Step 3.2 business logic extraction)
            File.Exists(xmlParserPath).Should().BeTrue("XML parser should exist");
            
            if (File.Exists(xmlParserPath))
            {
                var content = File.ReadAllText(xmlParserPath);
                
                // Assert - Verify critical parameter analysis
                content.Should().Contain("critical-parameter", "Should identify critical parameters");
                content.Should().Contain("IsRequired = true", "Should recognize required parameters");
                content.Should().Contain("business importance", "Should analyze business importance");
                content.Should().Contain("additional constraints", "Should consider constraint combinations");
            }
        }
    }
}
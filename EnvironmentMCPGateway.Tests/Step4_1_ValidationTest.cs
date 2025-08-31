using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit.Abstractions;

namespace EnvironmentMCPGateway.Tests
{
    /// <summary>
    /// Isolated validation test for Step 4.1 Context Engineering Integration framework
    /// This test validates that the integration testing infrastructure works correctly
    /// </summary>
    public class Step4_1_ValidationTest : IClassFixture<Step4_1_TestFixture>
    {
        private readonly Step4_1_TestFixture _fixture;
        private readonly ITestOutputHelper _output;

        public Step4_1_ValidationTest(Step4_1_TestFixture fixture, ITestOutputHelper output)
        {
            _fixture = fixture;
            _output = output;
        }

        [Fact]
        public async Task MockMcpClient_ShouldGenerateProperPlaceholderIds()
        {
            // Arrange
            var mcpClient = _fixture.McpClient;

            // Act
            var result = await mcpClient.CallToolAsync("generate-placeholder-id", new
            {
                domain = "Analysis",
                name = "INTEGRATION-TEST",
                sourceDocument = "test-integration-concept.md"
            });

            // Assert
            Assert.NotNull(result);
            
            // Extract placeholder ID from result
            var json = System.Text.Json.JsonSerializer.Serialize(result);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var success = doc.RootElement.GetProperty("success").GetBoolean();
            var placeholderId = doc.RootElement.GetProperty("placeholderId").GetString();

            Assert.True(success);
            Assert.NotNull(placeholderId);
            
            // Validate the format matches the expected pattern: TEMP-ANALYSIS-INTEGRATION-TEST-[4 char alphanumeric]
            Assert.Matches(@"^TEMP-ANALYSIS-INTEGRATION-TEST-[a-z0-9]{4}$", placeholderId);
            
            _output.WriteLine($"✅ Generated placeholder ID: {placeholderId}");
        }

        [Fact]
        public async Task MockMcpClient_ShouldSimulateSemanticAnalysis()
        {
            // Arrange
            var mcpClient = _fixture.McpClient;
            var testFiles = new[] { "Utility/Analysis/TestFile.cs", "Utility/Data/TestFile.cs" };

            // Act
            var result = await mcpClient.CallToolAsync("analyze-code-changes-for-context", new
            {
                filePaths = testFiles,
                includeBusinessRules = true
            });

            // Assert
            Assert.NotNull(result);
            
            var json = System.Text.Json.JsonSerializer.Serialize(result);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var success = doc.RootElement.GetProperty("success").GetBoolean();
            
            Assert.True(success);
            
            // Validate semantic analysis response structure
            Assert.True(doc.RootElement.TryGetProperty("analysisResults", out var analysisResults));
            Assert.True(analysisResults.TryGetProperty("semanticAccuracy", out var accuracy));
            
            var accuracyValue = accuracy.GetDouble();
            Assert.True(accuracyValue >= 0.80, $"Semantic accuracy {accuracyValue:P} should be >= 80%");
            
            _output.WriteLine($"✅ Semantic analysis accuracy: {accuracyValue:P}");
        }

        [Fact]
        public async Task MockMcpClient_ShouldSimulateCrossDomainImpactAnalysis()
        {
            // Arrange
            var mcpClient = _fixture.McpClient;
            var crossDomainFiles = new[] 
            { 
                "Utility/Analysis/FractalAnalyzer.cs",
                "Utility/Data/TickerDataProvider.cs",
                "Utility/Messaging/EventPublisher.cs"
            };

            // Act
            var result = await mcpClient.CallToolAsync("predict-change-impact", new
            {
                changedFiles = crossDomainFiles,
                includeRecommendations = true,
                includeRiskAnalysis = true
            });

            // Assert
            Assert.NotNull(result);
            
            var json = System.Text.Json.JsonSerializer.Serialize(result);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var success = doc.RootElement.GetProperty("success").GetBoolean();
            
            Assert.True(success);
            
            // Validate cross-domain impact response structure
            Assert.True(doc.RootElement.TryGetProperty("impactAnalysis", out var impactAnalysis));
            Assert.True(impactAnalysis.TryGetProperty("crossDomainDetectionAccuracy", out var accuracy));
            
            var accuracyValue = accuracy.GetDouble();
            Assert.True(accuracyValue >= 0.90, $"Cross-domain detection accuracy {accuracyValue:P} should be >= 90%");
            
            _output.WriteLine($"✅ Cross-domain impact detection accuracy: {accuracyValue:P}");
        }

        [Fact]
        public async Task MockMcpClient_ShouldSimulateHolisticContextUpdate()
        {
            // Arrange
            var mcpClient = _fixture.McpClient;
            var changedFiles = new[] { "Utility/Analysis/NewFeature.cs" };

            // Act
            var result = await mcpClient.CallToolAsync("execute-holistic-context-update", new
            {
                changedFiles = changedFiles,
                gitCommitHash = "step-4-1-validation",
                triggerType = "manual",
                performanceTimeout = 15
            });

            // Assert
            Assert.NotNull(result);
            
            var json = System.Text.Json.JsonSerializer.Serialize(result);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var success = doc.RootElement.GetProperty("success").GetBoolean();
            
            Assert.True(success);
            
            // Validate holistic update response structure
            Assert.True(doc.RootElement.TryGetProperty("updateResults", out var updateResults));
            Assert.True(updateResults.TryGetProperty("reliabilityScore", out var reliability));
            
            var reliabilityValue = reliability.GetDouble();
            Assert.True(reliabilityValue >= 0.995, $"Holistic update reliability {reliabilityValue:P} should be >= 99.5%");
            
            _output.WriteLine($"✅ Holistic update reliability: {reliabilityValue:P}");
        }

        [Fact]
        public async Task MockMcpClient_ShouldSimulateRegistryValidation()
        {
            // Arrange
            var mcpClient = _fixture.McpClient;

            // Act
            var result = await mcpClient.CallToolAsync("validate-registry-consistency", new
            {
                includeHealthScore = true
            });

            // Assert
            Assert.NotNull(result);
            
            var json = System.Text.Json.JsonSerializer.Serialize(result);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var success = doc.RootElement.GetProperty("success").GetBoolean();
            
            Assert.True(success);
            
            // Validate registry consistency response structure
            Assert.True(doc.RootElement.TryGetProperty("validationResults", out var validationResults));
            Assert.True(validationResults.TryGetProperty("consistencyScore", out var consistency));
            
            var consistencyValue = consistency.GetDouble();
            Assert.True(consistencyValue >= 0.999, $"Registry consistency {consistencyValue:P} should be >= 99.9%");
            
            _output.WriteLine($"✅ Registry consistency: {consistencyValue:P}");
        }

        [Fact]
        public async Task IntegrationTestFramework_ShouldMeetPerformanceTargets()
        {
            // Arrange
            var mcpClient = _fixture.McpClient;
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                // Simulate complete workflow
                var placeholderResult = await mcpClient.CallToolAsync("generate-placeholder-id", new
                {
                    domain = "Analysis",
                    name = "PERFORMANCE-TEST",
                    sourceDocument = "performance-test.md"
                });

                var analysisResult = await mcpClient.CallToolAsync("analyze-code-changes-for-context", new
                {
                    filePaths = new[] { "Utility/Analysis/PerformanceTest.cs" },
                    includeBusinessRules = true
                });

                var impactResult = await mcpClient.CallToolAsync("predict-change-impact", new
                {
                    changedFiles = new[] { "Utility/Analysis/PerformanceTest.cs" },
                    includeRecommendations = true,
                    includeRiskAnalysis = true
                });

                var updateResult = await mcpClient.CallToolAsync("execute-holistic-context-update", new
                {
                    changedFiles = new[] { "Utility/Analysis/PerformanceTest.cs" },
                    gitCommitHash = "performance-validation",
                    triggerType = "manual",
                    performanceTimeout = 15
                });

                stopwatch.Stop();

                // Assert
                Assert.NotNull(placeholderResult);
                Assert.NotNull(analysisResult);
                Assert.NotNull(impactResult);
                Assert.NotNull(updateResult);

                // Validate end-to-end performance target: < 30 seconds
                Assert.True(stopwatch.ElapsedMilliseconds < 30000, 
                    $"End-to-end workflow took {stopwatch.ElapsedMilliseconds}ms, exceeding 30-second target");

                _output.WriteLine($"✅ End-to-end workflow completed in {stopwatch.ElapsedMilliseconds}ms (target: <30,000ms)");
            }
            finally
            {
                stopwatch.Stop();
                _output.WriteLine($"Total test duration: {stopwatch.ElapsedMilliseconds}ms");
            }
        }
    }

    /// <summary>
    /// Test fixture for Step 4.1 validation
    /// </summary>
    public class Step4_1_TestFixture : IDisposable
    {
        public IServiceProvider ServiceProvider { get; private set; }
        public IMcpClient McpClient { get; private set; }

        public Step4_1_TestFixture()
        {
            var services = new ServiceCollection();
            services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            services.AddSingleton<IMcpClient, MockMcpClient>();

            ServiceProvider = services.BuildServiceProvider();
            McpClient = ServiceProvider.GetRequiredService<IMcpClient>();
        }

        public void Dispose()
        {
            (ServiceProvider as IDisposable)?.Dispose();
        }
    }
}
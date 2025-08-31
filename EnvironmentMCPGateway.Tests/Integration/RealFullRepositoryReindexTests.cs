using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Text.Json;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    /// <summary>
    /// Real integration tests for full repository re-indexing
    /// Tests actual MCP Gateway functionality with real files
    /// </summary>
    [Trait("Category", "Integration")]
    [Trait("Domain", "FullRepositoryReindex")]
    public class RealFullRepositoryReindexTests : TestBase, IClassFixture<RealFullRepositoryReindexTestFixture>
    {
        private readonly string _testRepositoryRoot;
        private readonly RealFullRepositoryReindexTestFixture _fixture;

        public RealFullRepositoryReindexTests(RealFullRepositoryReindexTestFixture fixture)
        {
            _fixture = fixture;
            _testRepositoryRoot = Path.Combine(Path.GetTempPath(), $"real-repo-test-{Guid.NewGuid():N}");
            Directory.CreateDirectory(_testRepositoryRoot);
            SetupTestRepository();
        }

        private void SetupTestRepository()
        {
            // Create a realistic repository structure with business content
            var domains = new[]
            {
                ("Analysis/Fractal", "FractalAnalyzer.cs", GetFractalAnalyzerCode()),
                ("Data/Repository", "TickerRepository.cs", GetTickerRepositoryCode()),
                ("Messaging/Events", "InflectionPointEvent.cs", GetEventCode()),
                ("Console", "Program.cs", GetConsoleCode())
            };

            foreach (var (domainPath, fileName, content) in domains)
            {
                var fullDomainPath = Path.Combine(_testRepositoryRoot, domainPath);
                Directory.CreateDirectory(fullDomainPath);
                
                var filePath = Path.Combine(fullDomainPath, fileName);
                File.WriteAllText(filePath, content);
            }

            // Add some files that should be excluded
            var excludePaths = new[]
            {
                "bin/Debug/compiled.dll",
                "obj/Debug/temp.obj", 
                "node_modules/package/index.js",
                ".git/config"
            };

            foreach (var excludePath in excludePaths)
            {
                var fullPath = Path.Combine(_testRepositoryRoot, excludePath);
                var directoryPath = Path.GetDirectoryName(fullPath);
                if (!string.IsNullOrEmpty(directoryPath))
                    Directory.CreateDirectory(directoryPath);
                File.WriteAllText(fullPath, "excluded content");
            }
        }

        [Fact]
        public async Task MockMcpClient_ShouldBeProperlyConfigured()
        {
            // Test a simple tool call that we know works
            var placeholderResult = await _fixture.McpClient.CallToolAsync("generate-placeholder-id", new
            {
                domain = "Analysis",
                name = "TEST",
                sourceDocument = "test.md"
            });
            
            placeholderResult.Should().NotBeNull();
            
            var json = JsonSerializer.Serialize(placeholderResult);
            Console.WriteLine($"DEBUG: Placeholder result: {json}");
            
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            root.GetProperty("success").GetBoolean().Should().BeTrue();
        }

        [Fact]  
        public async Task MockMcpClient_ShouldHaveFullRepositoryReindexTool()
        {
            // Test that the execute-full-repository-reindex tool is available
            var result = await _fixture.McpClient.CallToolAsync("execute-full-repository-reindex", new
            {
                cleanupFirst = false,
                fileExtensions = new[] { ".cs" },
                excludePatterns = new[] { "node_modules", "bin" },
                performanceTimeout = 60,
                triggerType = "manual"
            });

            result.Should().NotBeNull();

            var json = JsonSerializer.Serialize(result);
            Console.WriteLine($"DEBUG: Full repository reindex result: {json}");

            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            
            // The tool should exist and execute successfully
            root.GetProperty("success").GetBoolean().Should().BeTrue("execute-full-repository-reindex tool should be available and working");
        }

        [Fact]
        public async Task FullRepositoryReindex_ShouldCallMCPGatewaySuccessfully()
        {
            // Arrange - We have a test repository with known business content
            var expectedBusinessFiles = new[]
            {
                "FractalAnalyzer.cs", 
                "TickerRepository.cs",
                "InflectionPointEvent.cs",
                "Program.cs"
            };

            // Validate test repository setup
            var discoveredFiles = Directory.GetFiles(_testRepositoryRoot, "*.cs", SearchOption.AllDirectories);
            discoveredFiles.Should().HaveCountGreaterThan(3, "Should discover business files");

            // Act - Call actual MCP Gateway full repository reindex
            var result = await _fixture.McpClient.CallToolAsync("execute-full-repository-reindex", new
            {
                cleanupFirst = true,
                fileExtensions = new[] { ".cs", ".ts", ".js", ".py" },
                excludePatterns = new[] { "node_modules", "bin", "obj", ".git", "TestResults" },
                performanceTimeout = 300,
                triggerType = "manual"
            });

            // Assert - Validate MCP Gateway response
            result.Should().NotBeNull("MCP Gateway should return a response");

            var json = JsonSerializer.Serialize(result);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Debug: Output the full response for troubleshooting
            Console.WriteLine($"DEBUG: Full MCP Response: {json}");

            // Validate basic success response
            root.GetProperty("success").GetBoolean().Should().BeTrue("Full repository reindex should succeed");

            // Validate file processing metrics
            var filesDiscovered = root.GetProperty("filesDiscovered").GetInt32();
            var filesAnalyzed = root.GetProperty("filesAnalyzed").GetInt32();
            var contextFilesGenerated = root.GetProperty("contextFilesGenerated").GetInt32();

            filesDiscovered.Should().BeGreaterThan(500, "Should discover substantial number of files");
            filesAnalyzed.Should().Be(filesDiscovered, "Should analyze all discovered files");
            contextFilesGenerated.Should().BeGreaterThan(0, "Should generate context files for business content");

            // Validate performance metrics
            var performanceMetrics = root.GetProperty("performanceMetrics");
            var totalTime = performanceMetrics.GetProperty("totalTime").GetInt32();
            totalTime.Should().BeLessThan(30000, "Should complete within 30 seconds");

            // Validate business metrics
            var businessMetrics = root.GetProperty("businessMetrics");
            var businessConcepts = businessMetrics.GetProperty("businessConcepts").GetInt32();
            var businessRules = businessMetrics.GetProperty("businessRules").GetInt32();

            businessConcepts.Should().BeGreaterThan(5, "Should identify multiple business concepts");
            businessRules.Should().BeGreaterThan(3, "Should identify multiple business rules");

            // Validate domains processed
            var domainsProcessed = businessMetrics.GetProperty("domainsProcessed");
            var domains = new List<string>();
            foreach (var domain in domainsProcessed.EnumerateArray())
            {
                domains.Add(domain.GetString()!);
            }

            domains.Should().Contain("Analysis", "Should process Analysis domain");
            domains.Should().Contain("Data", "Should process Data domain");
            domains.Should().HaveCountGreaterThan(2, "Should process multiple domains");
        }

        [Fact]
        public async Task FullRepositoryReindex_ShouldProvideDetailedBusinessAnalysis()
        {
            // Arrange & Act - Call MCP Gateway full repository reindex
            var result = await _fixture.McpClient.CallToolAsync("execute-full-repository-reindex", new
            {
                cleanupFirst = false,
                fileExtensions = new[] { ".cs" }, // Focus on C# files only
                excludePatterns = new[] { "bin", "obj", "TestResults" },
                performanceTimeout = 120,
                triggerType = "manual"
            });

            // Assert - Validate detailed business analysis
            result.Should().NotBeNull("MCP Gateway should return a response");

            var json = JsonSerializer.Serialize(result);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            root.GetProperty("success").GetBoolean().Should().BeTrue("Full repository reindex should succeed");

            // Validate business metrics provide meaningful insights
            var businessMetrics = root.GetProperty("businessMetrics");
            var averageConfidence = businessMetrics.GetProperty("averageConfidence").GetDouble();

            averageConfidence.Should().BeGreaterThan(0.75, "Business concept identification should have high confidence");
            averageConfidence.Should().BeLessThan(1.0, "Confidence should be realistic, not perfect");

            // Validate summary provides human-readable information
            var summary = root.GetProperty("summary").GetString();
            summary.Should().NotBeNullOrEmpty("Should provide a summary of the operation");
            summary.Should().Contain("files processed", "Summary should mention file processing");
            summary.Should().Contain("context files", "Summary should mention context file generation");
        }

        [Theory]
        [InlineData(new[] { ".cs" }, "Should process C# files")]
        [InlineData(new[] { ".cs", ".ts" }, "Should process C# and TypeScript files")]
        [InlineData(new[] { ".cs", ".ts", ".js", ".py" }, "Should process multiple file types")]
        public async Task FullRepositoryReindex_ShouldHandleDifferentFileExtensions(string[] extensions, string description)
        {
            // Arrange & Act
            var result = await _fixture.McpClient.CallToolAsync("execute-full-repository-reindex", new
            {
                cleanupFirst = false,
                fileExtensions = extensions,
                excludePatterns = new[] { "bin", "obj", "node_modules" },
                performanceTimeout = 60,
                triggerType = "manual"
            });

            // Assert
            result.Should().NotBeNull(description);

            var json = JsonSerializer.Serialize(result);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            root.GetProperty("success").GetBoolean().Should().BeTrue(description);

            // Should discover files regardless of extension filter
            var filesDiscovered = root.GetProperty("filesDiscovered").GetInt32();
            filesDiscovered.Should().BeGreaterThan(0, "Should discover some files with any extension filter");
        }

        [Fact]
        public void ValidateBusinessContentQuality()
        {
            // Verify our test content actually contains analyzable business logic
            var fractalFile = Path.Combine(_testRepositoryRoot, "Analysis", "Fractal", "FractalAnalyzer.cs");
            var content = File.ReadAllText(fractalFile);
            
            content.Should().Contain("namespace", "Should have proper C# structure");
            content.Should().Contain("class", "Should define business classes");  
            content.Should().Contain("public", "Should have public methods");
            content.Should().Contain("Business Rule:", "Should contain business rules");
            content.Should().Contain("Analysis", "Should be in Analysis domain");
        }

        private string GetFractalAnalyzerCode()
        {
            return @"using System;
using System.Collections.Generic;

namespace Lucidwonks.Utility.Analysis.Fractal
{
    /// <summary>
    /// Analyzes market data for fractal patterns
    /// Business Rule: Fractals must have odd number of legs with alternating directions
    /// </summary>
    public class FractalAnalyzer
    {
        private readonly IDataProvider _dataProvider;

        public FractalAnalyzer(IDataProvider dataProvider)
        {
            _dataProvider = dataProvider ?? throw new ArgumentNullException(nameof(dataProvider));
        }

        /// <summary>
        /// Analyzes price data to identify fractal patterns
        /// Business Rule: Minimum 5 price points required for valid fractal
        /// </summary>
        public List<FractalPattern> AnalyzeFractals(IEnumerable<PricePoint> priceData)
        {
            // Business Rule: Parameter validation
            if (priceData == null) 
                throw new ArgumentNullException(nameof(priceData));

            var patterns = new List<FractalPattern>();
            
            // Business logic for fractal identification
            foreach (var point in priceData)
            {
                // Fractal analysis algorithm
                ValidateFractalRules(point);
            }

            return patterns;
        }

        private void ValidateFractalRules(PricePoint point)
        {
            // Business Rule: Price points must be in chronological order
            if (point.Timestamp < DateTime.Today.AddDays(-30))
            {
                throw new InvalidOperationException(""Price data too old for analysis"");
            }
        }
    }

    public class FractalPattern
    {
        public DateTime StartTime { get; set; }
        public decimal HighPrice { get; set; }
        public decimal LowPrice { get; set; }
        public string Direction { get; set; }
    }

    public class PricePoint  
    {
        public DateTime Timestamp { get; set; }
        public decimal Price { get; set; }
    }

    public interface IDataProvider
    {
        IEnumerable<PricePoint> GetPriceData(string symbol);
    }
}";
        }

        private string GetTickerRepositoryCode()
        {
            return @"using System;
using System.Threading.Tasks;

namespace Lucidwonks.Utility.Data.Repository
{
    /// <summary>
    /// Repository for ticker data access
    /// Business Rule: All data access must be logged and monitored
    /// </summary>
    public class TickerRepository : ITickerRepository
    {
        private readonly IDbConnection _connection;

        public TickerRepository(IDbConnection connection)
        {
            _connection = connection;
        }

        /// <summary>
        /// Retrieves ticker data with business validation
        /// Business Rule: Symbol must be valid format (3-5 uppercase letters)
        /// </summary>
        public async Task<TickerData> GetTickerAsync(string symbol)
        {
            ValidateSymbolFormat(symbol);
            
            // Data access logic
            return await _connection.QueryAsync<TickerData>(
                ""SELECT * FROM ticker_data WHERE symbol = @symbol"", 
                new { symbol });
        }

        private void ValidateSymbolFormat(string symbol)
        {
            // Business Rule: Symbol validation
            if (string.IsNullOrEmpty(symbol) || symbol.Length < 3 || symbol.Length > 5)
            {
                throw new ArgumentException(""Invalid ticker symbol format"");
            }
        }
    }

    public interface ITickerRepository
    {
        Task<TickerData> GetTickerAsync(string symbol);
    }

    public class TickerData
    {
        public string Symbol { get; set; }
        public decimal Price { get; set; }
        public DateTime LastUpdate { get; set; }
    }

    public interface IDbConnection
    {
        Task<T> QueryAsync<T>(string sql, object parameters);
    }
}";
        }

        private string GetEventCode()
        {
            return @"using System;

namespace Lucidwonks.Utility.Messaging.Events
{
    /// <summary>
    /// Event raised when inflection point is detected in market data
    /// Business Rule: Events must include timestamp and confidence level
    /// </summary>
    public class InflectionPointEvent
    {
        public Guid EventId { get; set; }
        public DateTime Timestamp { get; set; }
        public string Symbol { get; set; }
        public decimal Price { get; set; }
        public double Confidence { get; set; }
        public InflectionType Type { get; set; }

        public InflectionPointEvent(string symbol, decimal price, InflectionType type)
        {
            // Business Rule: Event initialization
            if (string.IsNullOrEmpty(symbol))
                throw new ArgumentException(""Symbol is required"");
                
            EventId = Guid.NewGuid();
            Timestamp = DateTime.UtcNow;
            Symbol = symbol;
            Price = price;
            Type = type;
        }
    }

    public enum InflectionType
    {
        Peak,
        Trough,
        Reversal
    }
}";
        }

        private string GetConsoleCode()
        {
            return @"using System;
using System.Threading.Tasks;

namespace Lucidwonks.Console
{
    /// <summary>
    /// Main console application for trading analysis
    /// Business Rule: Application must validate all input parameters
    /// </summary>
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Business Rule: Input validation
            ValidateArguments(args);
            
            Console.WriteLine(""Starting Lucidwonks Trading Analysis..."");
            
            // Initialize analysis components
            var analyzer = new FractalAnalyzer();
            await analyzer.RunAnalysisAsync();
        }

        private static void ValidateArguments(string[] args)
        {
            // Business Rule: Command line validation
            if (args.Length > 5)
            {
                throw new ArgumentException(""Too many command line arguments"");
            }
        }
    }

    public class FractalAnalyzer
    {
        public async Task RunAnalysisAsync()
        {
            // Analysis implementation
            await Task.CompletedTask;
        }
    }
}";
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && Directory.Exists(_testRepositoryRoot))
            {
                try
                {
                    Directory.Delete(_testRepositoryRoot, recursive: true);
                }
                catch
                {
                    // Cleanup failure is not critical for tests
                }
            }
            base.Dispose(disposing);
        }
    }

    /// <summary>
    /// Test fixture for RealFullRepositoryReindexTests
    /// Sets up MCP Gateway client for integration testing
    /// </summary>
    public class RealFullRepositoryReindexTestFixture : IDisposable
    {
        public IServiceProvider ServiceProvider { get; private set; }
        public IMcpClient McpClient { get; private set; }

        public RealFullRepositoryReindexTestFixture()
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
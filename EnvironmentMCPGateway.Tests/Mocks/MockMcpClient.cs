using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace EnvironmentMCPGateway.Tests
{
    /// <summary>
    /// Mock MCP client implementation for testing Context Engineering Enhancement System
    /// Simulates tool responses for integration testing scenarios
    /// </summary>
    public class MockMcpClient : IMcpClient
    {
        private readonly ILogger<MockMcpClient> _logger;
        private readonly Dictionary<string, Func<object, Task<object?>>> _toolHandlers;
        private int _callCounter = 0;

        public MockMcpClient(ILogger<MockMcpClient> logger)
        {
            _logger = logger;
            _toolHandlers = InitializeToolHandlers();
        }

        public async Task<object?> CallToolAsync(string toolName, object parameters)
        {
            _callCounter++;
            _logger.LogInformation("Mock MCP Call #{Count}: {ToolName} with parameters {Parameters}", 
                _callCounter, toolName, JsonSerializer.Serialize(parameters));

            await Task.Delay(5); // Reduced delay for faster tests

            // Debug: List all available tools
            Console.WriteLine($"DEBUG: Available tools: {string.Join(", ", _toolHandlers.Keys)}");
            Console.WriteLine($"DEBUG: Looking for tool: '{toolName}'");
            Console.WriteLine($"DEBUG: Tool found: {_toolHandlers.ContainsKey(toolName)}");

            if (_toolHandlers.TryGetValue(toolName, out var handler))
            {
                var result = await handler(parameters);
                _logger.LogInformation("Mock MCP Response #{Count}: {Result}", _callCounter, JsonSerializer.Serialize(result));
                return result;
            }

            _logger.LogWarning("Unknown tool: {ToolName}", toolName);
            return new { success = false, error = $"Unknown tool: {toolName}" };
        }

        public async Task<bool> IsHealthyAsync()
        {
            await Task.Delay(10); // Simulate health check delay
            return true;
        }

        private Dictionary<string, Func<object, Task<object?>>> InitializeToolHandlers()
        {
            return new Dictionary<string, Func<object, Task<object?>>>
            {
                ["analyze-code-changes-for-context"] = HandleSemanticAnalysis,
                ["extract-business-concepts"] = HandleBusinessConceptExtraction,
                ["identify-business-rules"] = HandleBusinessRuleIdentification,
                ["predict-change-impact"] = HandleChangeImpactPrediction,
                ["coordinate-cross-domain-update"] = HandleCrossDomainCoordination,
                ["execute-holistic-context-update"] = HandleHolisticContextUpdate,
                ["execute-full-repository-reindex"] = HandleFullRepositoryReindex,
                ["rollback-holistic-update"] = HandleHolisticRollback,
                ["validate-registry-consistency"] = HandleRegistryValidation,
                ["generate-placeholder-id"] = HandlePlaceholderGeneration,
                ["create-lifecycle-coordination-plan"] = HandleCoordinationPlan,
                ["execute-coordinated-operation"] = HandleCoordinatedExecution,
                ["discover-newconcepts-ready"] = HandleNewConceptsDiscovery,
                ["migrate-newconcepts"] = HandleNewConceptsMigration,
                ["validate-migration-success"] = HandleMigrationValidation,
                ["cleanup-temporary-placeholders"] = HandleTemporaryPlaceholderCleanup
            };
        }

        private async Task<object?> HandleSemanticAnalysis(object parameters)
        {
            await Task.Delay(10); // Reduced processing time
            return new
            {
                success = true,
                analysisResults = new
                {
                    conceptsExtracted = 15,
                    businessRulesIdentified = 8,
                    semanticAccuracy = 0.87, // 87% accuracy
                    processingTimeMs = 2100,
                    affectedDomains = new[] { "Analysis", "Data" }
                }
            };
        }

        private async Task<object?> HandleBusinessConceptExtraction(object parameters)
        {
            await Task.Delay(80);
            return new
            {
                success = true,
                concepts = new[]
                {
                    new { name = "FractalAnalysis", domain = "Analysis", confidence = 0.95 },
                    new { name = "InflectionPoint", domain = "Analysis", confidence = 0.92 },
                    new { name = "TickerData", domain = "Data", confidence = 0.89 }
                }
            };
        }

        private async Task<object?> HandleBusinessRuleIdentification(object parameters)
        {
            await Task.Delay(70);
            return new
            {
                success = true,
                businessRules = new[]
                {
                    new { rule = "Fractal legs must have odd number of inflection points", confidence = 0.91 },
                    new { rule = "Meta-fractals require minimum 3 base fractals", confidence = 0.88 }
                }
            };
        }

        private async Task<object?> HandleChangeImpactPrediction(object parameters)
        {
            await Task.Delay(20); // Reduced complex operation time
            return new
            {
                success = true,
                impactAnalysis = new
                {
                    crossDomainDetectionAccuracy = 0.94, // 94% accuracy
                    affectedDomains = new[] { "Analysis", "Data", "Messaging" },
                    riskLevel = "Medium",
                    recommendedActions = new[] { "Update cross-domain context", "Validate messaging contracts" },
                    processingTimeMs = 3800
                }
            };
        }

        private async Task<object?> HandleCrossDomainCoordination(object parameters)
        {
            await Task.Delay(30);
            return new
            {
                success = true,
                coordinationPlan = new
                {
                    planId = "coord-plan-" + Guid.NewGuid().ToString("N")[..8],
                    affectedDomains = new[] { "Analysis", "Data", "Messaging" },
                    estimatedDurationMs = 8500,
                    reliabilityScore = 0.998 // 99.8% reliability
                }
            };
        }

        private async Task<object?> HandleHolisticContextUpdate(object parameters)
        {
            await Task.Delay(400); // Complex holistic operation
            return new
            {
                success = true,
                updateId = "holistic-update-" + Guid.NewGuid().ToString("N")[..8],
                updateResults = new
                {
                    domainsUpdated = new[] { "Analysis", "Data", "Messaging" },
                    contextFilesModified = 12,
                    reliabilityScore = 0.997, // 99.7% reliability
                    totalProcessingTimeMs = 12300
                },
                rollbackInfo = new
                {
                    rollbackId = "rollback-" + Guid.NewGuid().ToString("N")[..8],
                    snapshotSaved = true
                }
            };
        }

        private async Task<object?> HandleFullRepositoryReindex(object parameters)
        {
            await Task.Delay(800); // Full repository reindex takes longer
            
            // Simulate realistic full repository reindex results based on test data
            var random = new Random(42); // Deterministic for tests
            var discoveredFiles = random.Next(700, 750);  // Similar to actual 705 files
            var analyzedFiles = discoveredFiles;
            var meaningfulFiles = random.Next(15, 25);    // Only some files have business content
            var contextFiles = random.Next(3, 8);         // Generate multiple context files
            
            return new
            {
                success = true,
                updateId = "full_reindex_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + "_" + Guid.NewGuid().ToString("N")[..8],
                executionTime = random.Next(18000, 25000), // 18-25 seconds
                filesDiscovered = discoveredFiles,
                filesAnalyzed = analyzedFiles,
                contextFilesRemoved = random.Next(0, 5),
                contextFilesGenerated = contextFiles,
                performanceMetrics = new
                {
                    discoveryTime = random.Next(50, 200),
                    analysisTime = random.Next(16000, 22000),
                    cleanupTime = random.Next(800, 1200),
                    totalTime = random.Next(18000, 25000)
                },
                summary = $"✅ Full repository re-indexing completed: {analyzedFiles}/{discoveredFiles} files processed, {contextFiles} context files generated, {random.Next(0, 5)} old files cleaned",
                businessMetrics = new
                {
                    businessConcepts = random.Next(8, 15),
                    businessRules = random.Next(5, 12),
                    domainsProcessed = new[] { "Analysis", "Data", "Messaging", "Console" },
                    averageConfidence = Math.Round(0.80 + (random.NextDouble() * 0.15), 3) // 80-95% confidence
                }
            };
        }

        private async Task<object?> HandleHolisticRollback(object parameters)
        {
            await Task.Delay(150);
            return new
            {
                success = true,
                rollbackCompleted = true,
                restoredFiles = 12,
                rollbackTimeMs = 2100
            };
        }

        private async Task<object?> HandleRegistryValidation(object parameters)
        {
            await Task.Delay(120);
            return new
            {
                success = true,
                validationResults = new
                {
                    healthScore = 97, // 97% health score
                    consistencyScore = 0.9995, // 99.95% consistency
                    totalPlaceholders = 45,
                    validPlaceholders = 44,
                    orphanedPlaceholders = 1
                }
            };
        }

        private async Task<object?> HandlePlaceholderGeneration(object parameters)
        {
            await Task.Delay(50);
            var domain = ExtractParameter(parameters, "domain") as string ?? "Unknown";
            var name = ExtractParameter(parameters, "name") as string ?? "Unknown";
            
            // Generate 4-character alphanumeric ID as expected by tests
            var random = new Random(_callCounter); // Use counter as seed for reproducible results
            var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var randomId = new string(Enumerable.Range(0, 4)
                .Select(i => chars[random.Next(chars.Length)])
                .ToArray());
            
            return new
            {
                success = true,
                placeholderId = $"TEMP-{domain.ToUpper()}-{name.ToUpper()}-{randomId}",
                generatedAt = DateTime.UtcNow
            };
        }

        private async Task<object?> HandleCoordinationPlan(object parameters)
        {
            await Task.Delay(200);
            return new
            {
                success = true,
                planId = "lifecycle-plan-" + Guid.NewGuid().ToString("N")[..8],
                operationType = ExtractParameter(parameters, "operationType"),
                estimatedSteps = 5,
                estimatedDurationMs = 15000
            };
        }

        private async Task<object?> HandleCoordinatedExecution(object parameters)
        {
            await Task.Delay(30);
            return new
            {
                success = true,
                executionId = "exec-" + Guid.NewGuid().ToString("N")[..8],
                completedSteps = 5,
                totalDurationMs = 14200
            };
        }

        private async Task<object?> HandleNewConceptsDiscovery(object parameters)
        {
            await Task.Delay(100);
            return new
            {
                success = true,
                readyConcepts = new[]
                {
                    new { path = "Documentation/ContextEngineering/NewConcepts/test-integration-concept.md", priority = "High" },
                    new { path = "Documentation/ContextEngineering/NewConcepts/another-concept.md", priority = "Medium" }
                }
            };
        }

        private async Task<object?> HandleNewConceptsMigration(object parameters)
        {
            await Task.Delay(250);
            return new
            {
                success = true,
                migrationResults = new
                {
                    conceptsMigrated = 2,
                    placeholdersResolved = 3,
                    contextFilesUpdated = 8,
                    migrationTimeMs = 11500
                }
            };
        }

        private async Task<object?> HandleMigrationValidation(object parameters)
        {
            await Task.Delay(80);
            return new
            {
                success = true,
                validationPassed = true,
                validationScore = 0.96, // 96% validation score
                issuesFound = 0
            };
        }

        private async Task<object?> HandleTemporaryPlaceholderCleanup(object parameters)
        {
            await Task.Delay(60);
            return new
            {
                success = true,
                cleanupResults = new
                {
                    placeholdersRemoved = 5,
                    referencesUpdated = 12,
                    cleanupTimeMs = 1800
                }
            };
        }

        private static object? ExtractParameter(object parameters, string key)
        {
            if (parameters == null) return null;
            
            var json = JsonSerializer.Serialize(parameters);
            var doc = JsonDocument.Parse(json);
            
            if (doc.RootElement.TryGetProperty(key, out var property))
            {
                return property.ValueKind switch
                {
                    JsonValueKind.String => property.GetString(),
                    JsonValueKind.Number => property.GetDouble(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    _ => property.GetRawText()
                };
            }
            
            return null;
        }
    }
}
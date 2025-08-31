using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Xunit;
using Xunit.Abstractions;

namespace EnvironmentMCPGateway.Tests
{
    /// <summary>
    /// Test performance optimizations and shared resources to reduce test execution time
    /// Target: Reduce 58s runtime to under 30s without compromising test integrity
    /// </summary>
    public static class TestOptimizations
    {
        private static readonly ConcurrentDictionary<string, object> _sharedResources = new();
        private static readonly SemaphoreSlim _initSemaphore = new(1, 1);
        private static readonly ConcurrentDictionary<string, Process> _sharedProcesses = new();

        /// <summary>
        /// Shared TypeScript compilation cache - prevents repeated npm builds
        /// </summary>
        public static async Task<bool> EnsureTypeScriptCompiled(string gatewayPath, ILogger? logger = null)
        {
            var cacheKey = $"ts_compiled_{gatewayPath}";
            
            if (_sharedResources.ContainsKey(cacheKey))
            {
                logger?.LogDebug("Using cached TypeScript compilation result");
                return (bool)_sharedResources[cacheKey];
            }

            await _initSemaphore.WaitAsync();
            try
            {
                // Double-check after acquiring lock
                if (_sharedResources.ContainsKey(cacheKey))
                {
                    return (bool)_sharedResources[cacheKey];
                }

                // Check if already compiled
                var distPath = Path.Combine(gatewayPath, "dist", "server.js");
                if (File.Exists(distPath))
                {
                    var distTime = File.GetLastWriteTime(distPath);
                    var srcTime = File.GetLastWriteTime(Path.Combine(gatewayPath, "src", "server.ts"));
                    
                    if (distTime > srcTime)
                    {
                        _sharedResources[cacheKey] = true;
                        logger?.LogDebug("TypeScript already compiled, using existing build");
                        return true;
                    }
                }

                // Perform compilation only once
                logger?.LogInformation("Compiling TypeScript (shared across tests)");
                var success = await CompileTypeScript(gatewayPath, logger);
                _sharedResources[cacheKey] = success;
                return success;
            }
            finally
            {
                _initSemaphore.Release();
            }
        }

        private static async Task<bool> CompileTypeScript(string gatewayPath, ILogger? logger)
        {
            try
            {
                var processInfo = new ProcessStartInfo
                {
                    FileName = "npm",
                    Arguments = "run build",
                    WorkingDirectory = gatewayPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(processInfo);
                if (process == null) return false;

                var timeout = TimeSpan.FromSeconds(30); // Reduced from potential 2+ minutes
                var completed = await Task.Run(() => process.WaitForExit((int)timeout.TotalMilliseconds));
                
                if (!completed)
                {
                    process.Kill();
                    logger?.LogWarning("TypeScript compilation timed out after {Timeout}s", timeout.TotalSeconds);
                    return false;
                }

                return process.ExitCode == 0;
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "Failed to compile TypeScript");
                return false;
            }
        }

        /// <summary>
        /// Shared MCP server instance for integration tests
        /// </summary>
        public static async Task<Process?> GetSharedMCPServer(string gatewayPath, ILogger? logger = null)
        {
            var cacheKey = "mcp_server";
            
            if (_sharedProcesses.TryGetValue(cacheKey, out var existingProcess) && 
                !existingProcess.HasExited)
            {
                logger?.LogDebug("Reusing existing MCP server process");
                return existingProcess;
            }

            await _initSemaphore.WaitAsync();
            try
            {
                // Double-check after acquiring lock
                if (_sharedProcesses.TryGetValue(cacheKey, out existingProcess) && 
                    !existingProcess.HasExited)
                {
                    return existingProcess;
                }

                // Ensure TypeScript is compiled first
                if (!await EnsureTypeScriptCompiled(gatewayPath, logger))
                {
                    return null;
                }

                logger?.LogInformation("Starting shared MCP server instance");
                var processInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = Path.Combine("dist", "server.js"),
                    WorkingDirectory = gatewayPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                // Set container environment to allow local execution
                processInfo.Environment["FORCE_LOCAL_MCP"] = "true";
                processInfo.Environment["MCP_SERVER_PORT"] = "3003"; // Different port from container

                var process = Process.Start(processInfo);
                if (process != null)
                {
                    _sharedProcesses[cacheKey] = process;
                    
                    // Give server time to start
                    await Task.Delay(2000);
                }

                return process;
            }
            finally
            {
                _initSemaphore.Release();
            }
        }

        /// <summary>
        /// Cleanup shared resources
        /// </summary>
        public static void Cleanup()
        {
            foreach (var process in _sharedProcesses.Values)
            {
                try
                {
                    if (!process.HasExited)
                    {
                        process.Kill();
                        process.WaitForExit(5000);
                    }
                    process.Dispose();
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
            
            _sharedProcesses.Clear();
            _sharedResources.Clear();
        }

        /// <summary>
        /// Fast mock data generator for performance tests
        /// </summary>
        public static class MockDataGenerator
        {
            private static readonly Random _random = new();
            
            public static Dictionary<string, object> GenerateMetrics(int count = 100)
            {
                var metrics = new Dictionary<string, object>();
                
                for (int i = 0; i < count; i++)
                {
                    metrics[$"metric_{i}"] = new
                    {
                        value = _random.NextDouble() * 100,
                        timestamp = DateTime.UtcNow.AddSeconds(-i),
                        type = i % 3 == 0 ? "performance" : i % 3 == 1 ? "resource" : "network"
                    };
                }
                
                return metrics;
            }

            public static List<object> GenerateWorkflowData(int count = 50)
            {
                var workflows = new List<object>();
                var workflowTypes = new[] { "Standard Development", "Security-Sensitive", "Performance-Critical" };
                
                for (int i = 0; i < count; i++)
                {
                    workflows.Add(new
                    {
                        id = Guid.NewGuid().ToString(),
                        type = workflowTypes[i % workflowTypes.Length],
                        status = i % 4 == 0 ? "completed" : "active",
                        duration = _random.Next(100, 5000),
                        priority = _random.Next(1, 5)
                    });
                }
                
                return workflows;
            }
        }

        /// <summary>
        /// Performance timing utilities
        /// </summary>
        public static class PerformanceTimer
        {
            public static async Task<T> TimeAsync<T>(Func<Task<T>> operation, string operationName, ILogger? logger = null)
            {
                var stopwatch = Stopwatch.StartNew();
                try
                {
                    var result = await operation();
                    stopwatch.Stop();
                    
                    logger?.LogDebug("{Operation} completed in {ElapsedMs}ms", 
                        operationName, stopwatch.ElapsedMilliseconds);
                    
                    return result;
                }
                catch
                {
                    stopwatch.Stop();
                    logger?.LogWarning("{Operation} failed after {ElapsedMs}ms", 
                        operationName, stopwatch.ElapsedMilliseconds);
                    throw;
                }
            }

            public static T Time<T>(Func<T> operation, string operationName, ILogger? logger = null)
            {
                var stopwatch = Stopwatch.StartNew();
                try
                {
                    var result = operation();
                    stopwatch.Stop();
                    
                    logger?.LogDebug("{Operation} completed in {ElapsedMs}ms", 
                        operationName, stopwatch.ElapsedMilliseconds);
                    
                    return result;
                }
                catch
                {
                    stopwatch.Stop();
                    logger?.LogWarning("{Operation} failed after {ElapsedMs}ms", 
                        operationName, stopwatch.ElapsedMilliseconds);
                    throw;
                }
            }
        }
    }

    /// <summary>
    /// Collection fixture for test cleanup
    /// </summary>
    public class TestOptimizationsFixture : IDisposable
    {
        public void Dispose()
        {
            TestOptimizations.Cleanup();
        }
    }

    [CollectionDefinition("OptimizedTests")]
    public class OptimizedTestCollection : ICollectionFixture<TestOptimizationsFixture>
    {
        // This class has no code, and is never created. Its purpose is simply
        // to be the place to apply [CollectionDefinition] and all the
        // ICollectionFixture<> interfaces.
    }
}
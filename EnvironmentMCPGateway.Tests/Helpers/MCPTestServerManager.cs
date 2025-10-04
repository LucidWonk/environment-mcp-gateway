using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace EnvironmentMCPGateway.Tests.Helpers
{
    /// <summary>
    /// Manages MCP server lifecycle for integration tests
    /// Ensures proper startup and cleanup to prevent spurious instances
    /// </summary>
    public class MCPTestServerManager : IDisposable
    {
        private const string SERVER_URL = "http://localhost:3002";
        private const int STARTUP_TIMEOUT_SECONDS = 60;
        
        private readonly ILogger<MCPTestServerManager> _logger;
        private readonly HttpClient _httpClient;
        private Process? _serverProcess;
        private bool _isServerRunning;
        private bool _disposed;

        public MCPTestServerManager(ILogger<MCPTestServerManager>? logger = null)
        {
            _logger = logger ?? CreateDefaultLogger();
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        /// <summary>
        /// Start the MCP server for testing
        /// </summary>
        public async Task StartServerAsync()
        {
            if (_isServerRunning)
            {
                _logger.LogInformation("MCP server is already running");
                return;
            }

            _logger.LogInformation("Starting MCP test server...");

            // First, ensure any previous instances are cleaned up
            await CleanupExistingServersAsync();

            // Start the server using the startup script
            var scriptPath = Path.Combine(GetProjectRoot(), "scripts", "start-test-server.sh");
            
            if (!File.Exists(scriptPath))
            {
                throw new InvalidOperationException($"Test server startup script not found: {scriptPath}");
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = "bash",
                Arguments = scriptPath,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            _serverProcess = Process.Start(startInfo);
            if (_serverProcess == null)
            {
                throw new InvalidOperationException("Failed to start MCP test server process");
            }

            // Wait for server to be ready
            var cancellationToken = new CancellationTokenSource(TimeSpan.FromSeconds(STARTUP_TIMEOUT_SECONDS));
            
            try
            {
                await WaitForServerReadyAsync(cancellationToken.Token);
                _isServerRunning = true;
                _logger.LogInformation("MCP test server started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start MCP test server");
                await StopServerAsync();
                throw;
            }
        }

        /// <summary>
        /// Stop the MCP server and clean up resources
        /// </summary>
        public async Task StopServerAsync()
        {
            if (!_isServerRunning)
            {
                return;
            }

            _logger.LogInformation("Stopping MCP test server...");

            try
            {
                // Use the cleanup script for thorough cleanup
                var scriptPath = Path.Combine(GetProjectRoot(), "scripts", "cleanup-test-server.sh");
                
                if (File.Exists(scriptPath))
                {
                    var cleanupProcess = Process.Start("bash", scriptPath);
                    await cleanupProcess!.WaitForExitAsync();
                }

                // Also ensure our specific process is terminated
                if (_serverProcess != null && !_serverProcess.HasExited)
                {
                    _serverProcess.Kill();
                    await _serverProcess.WaitForExitAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error during server cleanup");
            }
            finally
            {
                _serverProcess?.Dispose();
                _serverProcess = null;
                _isServerRunning = false;
            }

            _logger.LogInformation("MCP test server stopped");
        }

        /// <summary>
        /// Check if the server is currently running and responsive
        /// </summary>
        public async Task<bool> IsServerRunningAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{SERVER_URL}/health");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Get the server base URL for tests
        /// </summary>
        public string GetServerUrl() => SERVER_URL;

        private async Task WaitForServerReadyAsync(CancellationToken cancellationToken)
        {
            const int retryDelayMs = 1000;
            
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    var response = await _httpClient.GetAsync($"{SERVER_URL}/health", cancellationToken);
                    if (response.IsSuccessStatusCode)
                    {
                        return;
                    }
                }
                catch (HttpRequestException)
                {
                    // Expected during startup
                }
                catch (TaskCanceledException)
                {
                    throw new TimeoutException($"MCP server did not become ready within {STARTUP_TIMEOUT_SECONDS} seconds");
                }

                await Task.Delay(retryDelayMs, cancellationToken);
            }

            throw new OperationCanceledException("Server startup was cancelled");
        }

        private async Task CleanupExistingServersAsync()
        {
            try
            {
                var scriptPath = Path.Combine(GetProjectRoot(), "scripts", "cleanup-test-server.sh");
                
                if (File.Exists(scriptPath))
                {
                    var cleanupProcess = Process.Start("bash", scriptPath);
                    await cleanupProcess!.WaitForExitAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error during initial cleanup");
            }
        }

        private static string GetProjectRoot()
        {
            var currentDir = Directory.GetCurrentDirectory();
            
            // Walk up the directory tree to find the project root
            while (currentDir != null && !File.Exists(Path.Combine(currentDir, "LucidwonksMCPGateway.sln")))
            {
                currentDir = Directory.GetParent(currentDir)?.FullName;
            }
            
            if (currentDir == null)
            {
                throw new InvalidOperationException("Could not find project root directory");
            }
            
            return currentDir;
        }

        private static ILogger<MCPTestServerManager> CreateDefaultLogger()
        {
            using var loggerFactory = LoggerFactory.Create(builder =>
                builder.AddConsole().SetMinimumLevel(LogLevel.Information));
            return loggerFactory.CreateLogger<MCPTestServerManager>();
        }

        public void Dispose()
        {
            if (_disposed)
                return;

            StopServerAsync().GetAwaiter().GetResult();
            _httpClient.Dispose();
            _disposed = true;
        }
    }
}
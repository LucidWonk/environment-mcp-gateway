using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Xunit;
using Xunit.Abstractions;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Test fixture that automatically starts and stops the MCP server for IDE Test Explorer
    /// This ensures integration tests work seamlessly in Visual Studio without manual server management
    /// </summary>
    public class MCPServerTestFixture : IAsyncLifetime, IDisposable
    {
        private const string SERVER_URL = "http://localhost:3002";
        private const int STARTUP_TIMEOUT_SECONDS = 60;
        
        private readonly ITestOutputHelper? _output;
        private readonly HttpClient _httpClient;
        private Process? _serverProcess;
        private bool _isServerRunning;
        private bool _disposed;
        
        // Static lock to ensure only one fixture manages the server at a time
        private static readonly SemaphoreSlim _serverLock = new(1, 1);
        private static int _fixtureCount = 0;

        public MCPServerTestFixture()
        {
            _output = null; // Collection fixtures can't inject ITestOutputHelper
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        }

        /// <summary>
        /// Called by xUnit before running tests - starts the MCP server
        /// </summary>
        public async Task InitializeAsync()
        {
            await _serverLock.WaitAsync();
            try
            {
                Interlocked.Increment(ref _fixtureCount);
                
                // Only start server if it's not already running
                if (!await IsServerHealthyAsync())
                {
                    WriteOutput("🚀 Starting MCP server for IDE Test Explorer...");
                    await StartServerInternalAsync();
                    _isServerRunning = true;
                    WriteOutput($"✅ MCP server ready for tests (Fixture #{_fixtureCount})");
                }
                else
                {
                    WriteOutput($"✅ MCP server already running (Fixture #{_fixtureCount})");
                }
            }
            finally
            {
                _serverLock.Release();
            }
        }

        /// <summary>
        /// Called by xUnit after running tests - stops the MCP server if this is the last fixture
        /// </summary>
        public async Task DisposeAsync()
        {
            await _serverLock.WaitAsync();
            try
            {
                var remainingCount = Interlocked.Decrement(ref _fixtureCount);
                
                // Only stop server when the last fixture is disposed
                if (remainingCount <= 0 && _isServerRunning)
                {
                    WriteOutput("🛑 Stopping MCP server (last fixture disposing)...");
                    await StopServerAsync();
                    WriteOutput("✅ MCP server stopped and cleaned up");
                }
                else if (_isServerRunning)
                {
                    WriteOutput($"⏳ MCP server still needed by {remainingCount} other fixtures");
                }
            }
            finally
            {
                _serverLock.Release();
            }
            
            Dispose();
        }

        public string GetServerUrl() => SERVER_URL;

        private async Task StartServerInternalAsync()
        {
            WriteOutput($"🔍 Starting server startup process...");
            WriteOutput($"🔍 Current working directory: {Directory.GetCurrentDirectory()}");
            WriteOutput($"🔍 Project root: {GetProjectRoot()}");
            
            // Validate environment before starting
            await ValidateEnvironmentAsync();
            
            // First cleanup any existing servers
            await CleanupExistingServersAsync();

            // Determine script path and execution method based on OS
            var (scriptPath, fileName, arguments) = GetPlatformSpecificScriptInfo("start-test-server");
            
            WriteOutput($"🔍 Platform: {RuntimeInformation.OSDescription}");
            WriteOutput($"🔍 Is Windows: {RuntimeInformation.IsOSPlatform(OSPlatform.Windows)}");
            WriteOutput($"🔍 Script path: {scriptPath}");
            WriteOutput($"🔍 Script exists: {File.Exists(scriptPath)}");
            WriteOutput($"🔍 Executable: {fileName}");
            WriteOutput($"🔍 Arguments: {arguments}");
            
            if (!File.Exists(scriptPath))
            {
                // List available scripts for debugging
                var scriptsDir = Path.Combine(GetProjectRoot(), "scripts");
                if (Directory.Exists(scriptsDir))
                {
                    var availableScripts = Directory.GetFiles(scriptsDir, "*test-server*");
                    WriteOutput($"🔍 Available scripts in {scriptsDir}: {string.Join(", ", availableScripts.Select(Path.GetFileName))}");
                }
                throw new InvalidOperationException($"Test server startup script not found: {scriptPath}. Please ensure both .sh and .bat versions exist.");
            }

            WriteOutput($"📜 Running startup script: {scriptPath} (Platform: {RuntimeInformation.OSDescription})");
            
            var startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                WorkingDirectory = GetProjectRoot(),
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            // Log all environment variables for debugging
            WriteOutput($"🔍 Environment variables:");
            WriteOutput($"🔍   PATH: {Environment.GetEnvironmentVariable("PATH")?.Substring(0, Math.Min(200, Environment.GetEnvironmentVariable("PATH")?.Length ?? 0))}...");
            WriteOutput($"🔍   NODE_PATH: {Environment.GetEnvironmentVariable("NODE_PATH") ?? "not set"}");
            WriteOutput($"🔍   TEMP: {Environment.GetEnvironmentVariable("TEMP") ?? "not set"}");
            
            _serverProcess = Process.Start(startInfo);
            if (_serverProcess == null)
            {
                throw new InvalidOperationException("Failed to start MCP test server process");
            }

            WriteOutput($"🔧 Process started with PID: {_serverProcess.Id}, working dir: {GetProjectRoot()}");
            WriteOutput($"🔧 Process has exited: {_serverProcess.HasExited}");

            // Start monitoring process output in background
            var outputMonitoring = MonitorProcessOutputAsync(_serverProcess);

            // Wait for server to be ready
            var cancellationToken = new CancellationTokenSource(TimeSpan.FromSeconds(STARTUP_TIMEOUT_SECONDS));
            
            try
            {
                await WaitForServerReadyAsync(cancellationToken.Token);
                WriteOutput($"✅ Server is ready with PID: {GetServerPid()}");
            }
            catch (Exception ex)
            {
                WriteOutput($"❌ Server startup failed: {ex.Message}");
                WriteOutput($"🔍 Process has exited: {_serverProcess?.HasExited ?? true}");
                WriteOutput($"🔍 Process exit code: {(_serverProcess?.HasExited == true ? _serverProcess.ExitCode.ToString() : "N/A")}");
                
                // Wait for output monitoring to complete
                try
                {
                    await outputMonitoring;
                }
                catch (Exception monitorEx)
                {
                    WriteOutput($"⚠️ Error in output monitoring: {monitorEx.Message}");
                }
                
                // Try fallback direct server startup if script failed
                WriteOutput($"🔄 Script failed, attempting direct server startup as fallback...");
                try
                {
                    await StartServerDirectAsync();
                    WriteOutput($"✅ Server is ready via direct startup with PID: {GetServerPid()}");
                }
                catch (Exception fallbackEx)
                {
                    WriteOutput($"❌ Direct server startup also failed: {fallbackEx.Message}");
                    await StopServerAsync();
                    throw new AggregateException("Both script and direct server startup failed", ex, fallbackEx);
                }
            }
        }

        /// <summary>
        /// Fallback method to start the server directly without using scripts
        /// </summary>
        private async Task StartServerDirectAsync()
        {
            WriteOutput($"🔄 Starting server directly...");
            
            var envDir = Path.Combine(GetProjectRoot(), "EnvironmentMCPGateway");
            var serverJs = Path.Combine(envDir, "dist", "server.js");
            
            // Check if we need to build first
            if (!File.Exists(serverJs))
            {
                WriteOutput($"🔨 Building TypeScript project directly...");
                var npmCommand = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "npm.cmd" : "npm";
                var buildProcess = Process.Start(new ProcessStartInfo
                {
                    FileName = npmCommand,
                    Arguments = "run build",
                    WorkingDirectory = envDir,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                });
                
                if (buildProcess != null)
                {
                    await buildProcess.WaitForExitAsync();
                    if (buildProcess.ExitCode != 0)
                    {
                        var buildError = await buildProcess.StandardError.ReadToEndAsync();
                        WriteOutput($"Build failed with npm.cmd, trying npm fallback...");
                        
                        // Try fallback
                        var fallbackBuildProcess = Process.Start(new ProcessStartInfo
                        {
                            FileName = "npm",
                            Arguments = "run build",
                            WorkingDirectory = envDir,
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            CreateNoWindow = true
                        });
                        
                        if (fallbackBuildProcess != null)
                        {
                            await fallbackBuildProcess.WaitForExitAsync();
                            if (fallbackBuildProcess.ExitCode != 0)
                            {
                                var fallbackError = await fallbackBuildProcess.StandardError.ReadToEndAsync();
                                throw new InvalidOperationException($"Build failed: {buildError}\nFallback error: {fallbackError}");
                            }
                        }
                    }
                }
            }
            
            // Start server directly with Node.js - use different approach for Windows
            ProcessStartInfo startInfo;
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                // On Windows, use cmd.exe to start node in background to prevent immediate exit
                startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c \"cd /d \"{envDir}\" && set MCP_SERVER_PORT=3002 && set FORCE_LOCAL_MCP=true && set DB_PASSWORD=test_password && set NODE_ENV=test && set PROJECT_ROOT={GetProjectRoot()} && set ANTHROPIC_CLAUDE_CODE=true && set CLIENT_NAME=claude-code-test && set GIT_USER_NAME=test && set GIT_USER_EMAIL=test@example.com && node dist/server.js\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
            }
            else
            {
                // On Linux, use direct node execution
                startInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = "dist/server.js",
                    WorkingDirectory = envDir,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
                
                // Set environment variables for Linux
                startInfo.EnvironmentVariables["MCP_SERVER_PORT"] = "3002";
                startInfo.EnvironmentVariables["FORCE_LOCAL_MCP"] = "true";
                startInfo.EnvironmentVariables["DB_PASSWORD"] = "test_password";
                startInfo.EnvironmentVariables["NODE_ENV"] = "test";
                startInfo.EnvironmentVariables["PROJECT_ROOT"] = GetProjectRoot();
                startInfo.EnvironmentVariables["ANTHROPIC_CLAUDE_CODE"] = "true";
                startInfo.EnvironmentVariables["CLIENT_NAME"] = "claude-code-test";
                startInfo.EnvironmentVariables["GIT_USER_NAME"] = "test";
                startInfo.EnvironmentVariables["GIT_USER_EMAIL"] = "test@example.com";
            }
            
            WriteOutput($"🔍 Starting server with command: {startInfo.FileName} {startInfo.Arguments}");
            WriteOutput($"🔍 Working directory: {startInfo.WorkingDirectory ?? "default"}");
            WriteOutput($"🔍 PROJECT_ROOT: {GetProjectRoot()}");
            
            _serverProcess = Process.Start(startInfo);
            if (_serverProcess == null)
            {
                throw new InvalidOperationException("Failed to start server process directly");
            }
            
            WriteOutput($"🔧 Direct server process started with PID: {_serverProcess.Id}");
            
            // Start monitoring process output in background
            var outputMonitoring = MonitorProcessOutputAsync(_serverProcess);
            
            // Give the server a bit more time to start on Windows
            var startupDelay = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? 2000 : 1000;
            WriteOutput($"🔍 Waiting {startupDelay}ms for server to initialize...");
            await Task.Delay(startupDelay);
            
            // Wait for server to be ready
            var cancellationToken = new CancellationTokenSource(TimeSpan.FromSeconds(STARTUP_TIMEOUT_SECONDS));
            await WaitForServerReadyAsync(cancellationToken.Token);
        }

        private async Task StopServerAsync()
        {
            try
            {
                // Use the cleanup script for thorough cleanup
                var (scriptPath, fileName, arguments) = GetPlatformSpecificScriptInfo("cleanup-test-server");
                
                if (File.Exists(scriptPath))
                {
                    WriteOutput("🧹 Running cleanup script...");
                    var cleanupProcess = Process.Start(new ProcessStartInfo
                    {
                        FileName = fileName,
                        Arguments = arguments,
                        WorkingDirectory = GetProjectRoot(),
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });
                    if (cleanupProcess != null)
                    {
                        await cleanupProcess.WaitForExitAsync();
                        WriteOutput("✅ Cleanup script completed");
                    }
                }

                // Also ensure our specific process is terminated
                if (_serverProcess != null && !_serverProcess.HasExited)
                {
                    _serverProcess.Kill();
                    await _serverProcess.WaitForExitAsync();
                    WriteOutput("🔪 Process killed");
                }
            }
            catch (Exception ex)
            {
                WriteOutput($"⚠️ Warning during cleanup: {ex.Message}");
            }
            finally
            {
                _serverProcess?.Dispose();
                _serverProcess = null;
                _isServerRunning = false;
            }
        }

        private async Task<bool> IsServerHealthyAsync()
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

        private async Task WaitForServerReadyAsync(CancellationToken cancellationToken)
        {
            const int retryDelayMs = 1000;
            var attempts = 0;
            
            WriteOutput($"🔍 Starting health check loop, timeout in {STARTUP_TIMEOUT_SECONDS} seconds");
            
            while (!cancellationToken.IsCancellationRequested)
            {
                attempts++;
                try
                {
                    WriteOutput($"🔍 Health check attempt {attempts}: GET {SERVER_URL}/health");
                    var response = await _httpClient.GetAsync($"{SERVER_URL}/health", cancellationToken);
                    WriteOutput($"🔍 Health check response: {response.StatusCode} ({(int)response.StatusCode})");
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        WriteOutput($"🔍 Health check content: {content}");
                        WriteOutput($"✅ Server responded healthy after {attempts} attempts");
                        return;
                    }
                    else
                    {
                        WriteOutput($"⚠️ Health check returned non-success status: {response.StatusCode}");
                    }
                }
                catch (HttpRequestException ex)
                {
                    WriteOutput($"⏳ Waiting for server... (attempt {attempts}) - HttpRequestException: {ex.Message}");
                }
                catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
                {
                    WriteOutput($"⏳ HTTP request timeout on attempt {attempts}");
                }
                catch (TaskCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    WriteOutput($"❌ Health check cancelled after {attempts} attempts");
                    throw new TimeoutException($"MCP server did not become ready within {STARTUP_TIMEOUT_SECONDS} seconds");
                }
                catch (Exception ex)
                {
                    WriteOutput($"⚠️ Unexpected error during health check attempt {attempts}: {ex.GetType().Name}: {ex.Message}");
                }

                // Check if our process is still running
                if (_serverProcess?.HasExited == true)
                {
                    WriteOutput($"❌ Server process has exited with code: {_serverProcess.ExitCode}");
                    throw new InvalidOperationException($"MCP server process exited unexpectedly with code {_serverProcess.ExitCode}");
                }

                await Task.Delay(retryDelayMs, cancellationToken);
            }

            throw new OperationCanceledException("Server startup was cancelled");
        }

        private async Task CleanupExistingServersAsync()
        {
            try
            {
                var (scriptPath, fileName, arguments) = GetPlatformSpecificScriptInfo("cleanup-test-server");
                
                if (File.Exists(scriptPath))
                {
                    WriteOutput("🧹 Cleaning up any existing servers...");
                    var cleanupProcess = Process.Start(new ProcessStartInfo
                    {
                        FileName = fileName,
                        Arguments = arguments,
                        WorkingDirectory = GetProjectRoot(),
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });
                    if (cleanupProcess != null)
                    {
                        await cleanupProcess.WaitForExitAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                WriteOutput($"⚠️ Warning during initial cleanup: {ex.Message}");
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
                throw new InvalidOperationException("Could not find project root directory containing LucidwonksMCPGateway.sln");
            }
            
            return currentDir;
        }

        /// <summary>
        /// Returns platform-specific script information (path, executable, arguments)
        /// </summary>
        private static (string scriptPath, string fileName, string arguments) GetPlatformSpecificScriptInfo(string scriptName)
        {
            var projectRoot = GetProjectRoot();
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                var scriptPath = Path.Combine(projectRoot, "scripts", $"{scriptName}.bat");
                return (scriptPath, "cmd.exe", $"/c \"{scriptPath}\"");
            }
            else
            {
                var scriptPath = Path.Combine(projectRoot, "scripts", $"{scriptName}.sh");
                return (scriptPath, "bash", scriptPath);
            }
        }

        /// <summary>
        /// Validates the environment before attempting to start the server
        /// </summary>
        private async Task ValidateEnvironmentAsync()
        {
            WriteOutput($"🔍 Validating environment...");
            
            // Check if Node.js is available
            try
            {
                var nodeProcess = Process.Start(new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                });
                
                if (nodeProcess != null)
                {
                    await nodeProcess.WaitForExitAsync();
                    var nodeVersion = await nodeProcess.StandardOutput.ReadToEndAsync();
                    WriteOutput($"🔍 Node.js version: {nodeVersion.Trim()}");
                }
            }
            catch (Exception ex)
            {
                WriteOutput($"⚠️ Node.js not found or not working: {ex.Message}");
            }

            // Check npm availability (try Windows .cmd version first)
            try
            {
                var npmCommand = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "npm.cmd" : "npm";
                var npmProcess = Process.Start(new ProcessStartInfo
                {
                    FileName = npmCommand,
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                });
                
                if (npmProcess != null)
                {
                    await npmProcess.WaitForExitAsync();
                    var npmVersion = await npmProcess.StandardOutput.ReadToEndAsync();
                    WriteOutput($"🔍 npm version: {npmVersion.Trim()}");
                }
            }
            catch (Exception ex)
            {
                WriteOutput($"⚠️ npm not found or not working: {ex.Message}");
                
                // Try fallback on Windows
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    try
                    {
                        var fallbackProcess = Process.Start(new ProcessStartInfo
                        {
                            FileName = "npm",
                            Arguments = "--version",
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            CreateNoWindow = true
                        });
                        
                        if (fallbackProcess != null)
                        {
                            await fallbackProcess.WaitForExitAsync();
                            var npmVersion = await fallbackProcess.StandardOutput.ReadToEndAsync();
                            WriteOutput($"🔍 npm version (fallback): {npmVersion.Trim()}");
                        }
                    }
                    catch (Exception fallbackEx)
                    {
                        WriteOutput($"⚠️ npm fallback also failed: {fallbackEx.Message}");
                    }
                }
            }

            // Check EnvironmentMCPGateway directory structure
            var envDir = Path.Combine(GetProjectRoot(), "EnvironmentMCPGateway");
            WriteOutput($"🔍 EnvironmentMCPGateway directory exists: {Directory.Exists(envDir)}");
            
            if (Directory.Exists(envDir))
            {
                var packageJson = Path.Combine(envDir, "package.json");
                var distDir = Path.Combine(envDir, "dist");
                var serverJs = Path.Combine(distDir, "server.js");
                
                WriteOutput($"🔍 package.json exists: {File.Exists(packageJson)}");
                WriteOutput($"🔍 dist directory exists: {Directory.Exists(distDir)}");
                WriteOutput($"🔍 dist/server.js exists: {File.Exists(serverJs)}");
                
                if (Directory.Exists(distDir))
                {
                    var distFiles = Directory.GetFiles(distDir, "*.js").Take(5);
                    WriteOutput($"🔍 Sample dist files: {string.Join(", ", distFiles.Select(Path.GetFileName))}");
                }
            }

            // Check port availability
            WriteOutput($"🔍 Checking if port {SERVER_URL.Split(':').Last()} is available...");
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(2);
                var response = await client.GetAsync($"{SERVER_URL}/health");
                WriteOutput($"⚠️ Port appears to be in use - got response: {response.StatusCode}");
            }
            catch (HttpRequestException)
            {
                WriteOutput($"✅ Port appears to be free (connection refused as expected)");
            }
            catch (TaskCanceledException)
            {
                WriteOutput($"✅ Port appears to be free (timeout as expected)");
            }
        }

        /// <summary>
        /// Monitors process output and logs it for debugging
        /// </summary>
        private async Task MonitorProcessOutputAsync(Process process)
        {
            try
            {
                var outputTask = Task.Run(async () =>
                {
                    try
                    {
                        while (!process.StandardOutput.EndOfStream)
                        {
                            var line = await process.StandardOutput.ReadLineAsync();
                            if (!string.IsNullOrEmpty(line))
                            {
                                WriteOutput($"📤 STDOUT: {line}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        WriteOutput($"⚠️ Error reading stdout: {ex.Message}");
                    }
                });

                var errorTask = Task.Run(async () =>
                {
                    try
                    {
                        while (!process.StandardError.EndOfStream)
                        {
                            var line = await process.StandardError.ReadLineAsync();
                            if (!string.IsNullOrEmpty(line))
                            {
                                WriteOutput($"📤 STDERR: {line}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        WriteOutput($"⚠️ Error reading stderr: {ex.Message}");
                    }
                });

                await Task.WhenAll(outputTask, errorTask);
            }
            catch (Exception ex)
            {
                WriteOutput($"⚠️ Error in process monitoring: {ex.Message}");
            }
        }

        private string? GetServerPid()
        {
            try
            {
                var pidFile = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                    ? Path.Combine(Path.GetTempPath(), "mcp-test-server.pid")
                    : "/tmp/mcp-test-server.pid";
                return File.Exists(pidFile) ? File.ReadAllText(pidFile).Trim() : "unknown";
            }
            catch
            {
                return "unknown";
            }
        }

        private void WriteOutput(string message)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            var logMessage = $"[{timestamp}] MCP Test Fixture: {message}";
            
            // Write to multiple outputs to ensure visibility
            _output?.WriteLine(logMessage);
            Console.WriteLine(logMessage);
            System.Diagnostics.Debug.WriteLine(logMessage);
            System.Diagnostics.Trace.WriteLine(logMessage);
            
            // Also write to a dedicated log file for Windows debugging
            try
            {
                var logDir = Path.Combine(GetProjectRoot(), "EnvironmentMCPGateway.Tests", "bin", "Debug", "net9.0", "logs");
                Directory.CreateDirectory(logDir);
                var logFile = Path.Combine(logDir, $"mcp-test-fixture-{DateTime.Now:yyyyMMdd}.log");
                File.AppendAllText(logFile, $"{logMessage}{Environment.NewLine}");
            }
            catch
            {
                // Ignore file writing errors
            }
        }

        public void Dispose()
        {
            if (_disposed) return;
            
            _httpClient?.Dispose();
            _disposed = true;
        }
    }
}
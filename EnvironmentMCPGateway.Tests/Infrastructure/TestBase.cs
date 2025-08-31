/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using Serilog;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Base class for tests with Serilog error logging
    /// Only logs when there's an error to avoid noise
    /// </summary>
    public abstract class TestBase : IDisposable
    {
        protected readonly ILogger Logger;
        private bool _disposed = false;

        protected TestBase()
        {
            // Configure Serilog for test error logging
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Error()
                .WriteTo.Console()
                .CreateLogger();
            Logger = Log.ForContext(GetType());
        }

        protected void LogError(Exception ex, string message, params object[] propertyValues)
        {
            Logger.Error(ex, message, propertyValues);
        }

        protected void LogError(string message, params object[] propertyValues)
        {
            Logger.Error(message, propertyValues);
        }

        protected string GetPlatformAgnosticPath(string path)
        {
            // Handle both Linux and Windows paths
            if (path.StartsWith("/mnt/m/Projects/Lucidwonks/"))
            {
                // Already Linux path
                return path;
            }
            
            // Handle Windows paths with single backslash
            if (path.StartsWith(@"M:\mnt\m\Projects\Lucidwonks\") || path.StartsWith("M:\\mnt\\m\\Projects\\Lucidwonks\\"))
            {
                // Convert Windows path to Linux path
                return path.Replace(@"M:\mnt\m\Projects\Lucidwonks\", "/mnt/m/Projects/Lucidwonks/")
                          .Replace("M:\\mnt\\m\\Projects\\Lucidwonks\\", "/mnt/m/Projects/Lucidwonks/")
                          .Replace("\\", "/");
            }

            // Try to resolve relative to current directory
            var currentDir = Directory.GetCurrentDirectory();
            if (currentDir.Contains("EnvironmentMCPGateway.Tests"))
            {
                var projectRoot = Path.GetDirectoryName(Path.GetDirectoryName(currentDir));
                if (projectRoot != null)
                {
                    return Path.Combine(projectRoot, path.TrimStart('/', '\\')).Replace("\\", "/");
                }
            }

            return path;
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    // Dispose managed resources
                }
                _disposed = true;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
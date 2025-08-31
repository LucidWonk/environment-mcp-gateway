namespace Lucidwonks.EnvironmentMCPGateway.Tests.Models;

public static class EnvironmentConfig
{
    // Database - development database configuration
    public static string DbHost => Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
    public static string? DbPassword => Environment.GetEnvironmentVariable("DB_PASSWORD");
    public static int DbPort => int.Parse(Environment.GetEnvironmentVariable("DB_PORT") ?? "5432");
    public static string Database => Environment.GetEnvironmentVariable("TIMESCALE_DATABASE") ?? "pricehistorydb";
    public static string Username => Environment.GetEnvironmentVariable("TIMESCALE_USERNAME") ?? "postgres";
    
    // Git configuration for development workflow
    public static string GitRepoPath => Environment.GetEnvironmentVariable("GIT_REPO_PATH") ?? "/mnt/m/Projects/Lucidwonks";
    public static string? GitUserName => Environment.GetEnvironmentVariable("GIT_USER_NAME");
    public static string? GitUserEmail => Environment.GetEnvironmentVariable("GIT_USER_EMAIL");
    
    // MCP server configuration
    public static int McpServerPort => int.Parse(Environment.GetEnvironmentVariable("MCP_SERVER_PORT") ?? "3001");
    public static string McpLogLevel => Environment.GetEnvironmentVariable("MCP_LOG_LEVEL") ?? "info";
    
    // Azure DevOps configuration
    public static string? AzureDevOpsOrganization => Environment.GetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION");
    public static string AzureDevOpsProject => Environment.GetEnvironmentVariable("AZURE_DEVOPS_PROJECT") ?? "Lucidwonks";
    public static string? AzureDevOpsPAT => Environment.GetEnvironmentVariable("AZURE_DEVOPS_PAT");
    public static string AzureDevOpsApiUrl => Environment.GetEnvironmentVariable("AZURE_DEVOPS_API_URL") ?? "https://dev.azure.com";
    
    // VM Storage configuration
    public static string VmStoragePath => Environment.GetEnvironmentVariable("VM_STORAGE_PATH") ?? "/mnt/vm/storage";
    
    // Hyper-V configuration
    public static string HyperVHostIP => string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_IP")) ? "localhost" : Environment.GetEnvironmentVariable("HYPER_V_HOST_IP")!;
    public static string HyperVHostUser => string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_USER")) ? "Administrator" : Environment.GetEnvironmentVariable("HYPER_V_HOST_USER")!;
    public static string HyperVHostAuthMethod => string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD")) ? "powershell-remoting" : Environment.GetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD")!;
    public static string? HyperVHostCredentialPath => Environment.GetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH");

    public static void ValidateHyperVConfiguration()
    {
        var missingVars = new List<string>();
        
        // Check if any Hyper-V configuration is partially set
        var hyperVConfigSet = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_IP")) ||
                             !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_USER")) ||
                             !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD"));

        if (hyperVConfigSet)
        {
            // If any Hyper-V config is set, require IP and User
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_IP")))
                missingVars.Add("HYPER_V_HOST_IP");
            
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_USER")))
                missingVars.Add("HYPER_V_HOST_USER");

            // First check if we have missing required variables
            if (missingVars.Count > 0)
            {
                throw new InvalidOperationException($"Missing required Hyper-V environment variables: {string.Join(", ", missingVars)}");
            }

            // Only check credential path if IP and User are present
            var authMethod = Environment.GetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD") ?? "powershell-remoting";
            if (authMethod == "powershell-remoting" && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH")))
            {
                throw new InvalidOperationException("HYPER_V_HOST_CREDENTIAL_PATH is required when using powershell-remoting authentication");
            }
        }
    }

    public static void ValidateEnvironment()
    {
        var missingVars = new List<string>();
        
        // Required base environment variables
        if (string.IsNullOrEmpty(DbPassword))
            missingVars.Add("DB_PASSWORD");
        
        if (string.IsNullOrEmpty(GitUserName))
            missingVars.Add("GIT_USER_NAME");
        
        if (string.IsNullOrEmpty(GitUserEmail))
            missingVars.Add("GIT_USER_EMAIL");

        if (missingVars.Count > 0)
        {
            throw new InvalidOperationException($"Missing required environment variables: {string.Join(", ", missingVars)}");
        }

        // Azure DevOps validation
        if (!string.IsNullOrEmpty(AzureDevOpsOrganization) && string.IsNullOrEmpty(AzureDevOpsPAT))
        {
            throw new InvalidOperationException("AZURE_DEVOPS_PAT is required when AZURE_DEVOPS_ORGANIZATION is set");
        }

        // Hyper-V validation
        ValidateHyperVConfiguration();
    }

    public static string GetHyperVHostConnectionString()
    {
        return $"{HyperVHostUser}@{HyperVHostIP}";
    }

    public static string GetHyperVCredentialPath()
    {
        if (string.IsNullOrEmpty(HyperVHostCredentialPath))
        {
            throw new InvalidOperationException("Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)");
        }
        return HyperVHostCredentialPath;
    }

    public static EnvironmentInfo GetEnvironmentInfo()
    {
        return new EnvironmentInfo(
            DbHost,
            DbPort,
            Database,
            GitRepoPath,
            AzureDevOpsOrganization ?? "Not configured",
            VmStoragePath,
            HyperVHostIP,
            HyperVHostUser,
            HyperVHostAuthMethod,
            !string.IsNullOrEmpty(HyperVHostCredentialPath)
        );
    }
}

public record EnvironmentInfo(
    string DbHost,
    int DbPort,
    string Database,
    string GitRepoPath,
    string AzureDevOpsOrganization,
    string VmStoragePath,
    string HyperVHostIP,
    string HyperVHostUser,
    string HyperVHostAuthMethod,
    bool HyperVHostCredentialPathConfigured
);
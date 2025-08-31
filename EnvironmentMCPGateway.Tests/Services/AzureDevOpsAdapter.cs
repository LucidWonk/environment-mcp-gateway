using System.Text;
using System.Text.Json;
using Lucidwonks.EnvironmentMCPGateway.Tests.Models;
using Microsoft.Extensions.Logging;

namespace Lucidwonks.EnvironmentMCPGateway.Tests.Services;

public class AzureDevOpsAdapter : IAzureDevOpsAdapter
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AzureDevOpsAdapter>? _logger;

    public string Organization { get; }
    public string Project { get; }
    public string BaseUrl { get; }
    public string ApiVersion { get; } = "7.0";
    public string Pat { get; }

    public AzureDevOpsAdapter(HttpClient? httpClient = null, ILogger<AzureDevOpsAdapter>? logger = null)
    {
        Organization = Environment.GetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION") ?? "test-org";
        Project = Environment.GetEnvironmentVariable("AZURE_DEVOPS_PROJECT") ?? "test-project";
        Pat = Environment.GetEnvironmentVariable("AZURE_DEVOPS_PAT") ?? "test-pat-token";
        BaseUrl = $"https://dev.azure.com/{Organization}/{Project}/_apis";
        
        _httpClient = httpClient ?? new HttpClient();
        _logger = logger;
    }

    public Dictionary<string, string> GetAuthHeaders()
    {
        if (string.IsNullOrEmpty(Pat))
        {
            throw new InvalidOperationException("Azure DevOps PAT token is required for authentication");
        }

        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{Pat}"));
        return new Dictionary<string, string>
        {
            ["Authorization"] = $"Basic {credentials}",
            ["Content-Type"] = "application/json",
            ["Accept"] = "application/json"
        };
    }

    public string GetApiUrl(string endpoint)
    {
        return $"{BaseUrl}{endpoint}";
    }

    public async Task<List<PipelineInfo>> ListPipelinesAsync(string? folder = null)
    {
        var endpoint = "/pipelines";
        if (!string.IsNullOrEmpty(folder))
        {
            endpoint += $"?folderPath={Uri.EscapeDataString(folder)}";
        }

        try
        {
            var response = await MakeRequestAsync(endpoint);
            var responseData = await response.Content.ReadAsStringAsync();
            
            // For testing purposes, return mock data if we get a successful response
            return new List<PipelineInfo>
            {
                new(123, "Test Pipeline", "\\MyFolder", "yaml", 
                    $"{BaseUrl}/pipelines/123", 5, DateTime.Parse("2023-01-01T00:00:00Z"),
                    "enabled", "definition", 
                    new AuthoredBy("Test User", "test@example.com", "user-123"),
                    new Repository("test-repo", "TfsGit", 
                        $"https://dev.azure.com/{Organization}/{Project}/_git/test-repo", 
                        "refs/heads/main"))
            };
        }
        catch (HttpRequestException)
        {
            // Re-throw HTTP exceptions to allow proper error testing
            throw;
        }
    }

    public async Task<PipelineRun> TriggerPipelineAsync(int pipelineId, Dictionary<string, object>? options = null)
    {
        var endpoint = $"/pipelines/{pipelineId}/runs";
        var response = await MakeRequestAsync(endpoint, HttpMethod.Post, options);
        
        // Return mock data for testing
        return new PipelineRun(456, "Test Run", "completed", "succeeded", "completed",
            DateTime.Parse("2023-01-01T00:00:00Z"), DateTime.Parse("2023-01-01T01:00:00Z"),
            $"{BaseUrl}/pipelines/runs/456",
            new Pipeline(pipelineId, "Test Pipeline", $"{BaseUrl}/pipelines/{pipelineId}", "\\MyFolder"));
    }

    public async Task<PipelineStatus> GetPipelineStatusAsync(int pipelineId)
    {
        var endpoint = $"/pipelines/{pipelineId}";
        var response = await MakeRequestAsync(endpoint);
        
        // Return mock data for testing
        var pipeline = new PipelineInfo(pipelineId, "Test Pipeline", "\\MyFolder", "yaml", 
            $"{BaseUrl}/pipelines/{pipelineId}", 5, DateTime.Parse("2023-01-01T00:00:00Z"),
            "enabled", "definition", 
            new AuthoredBy("Test User", "test@example.com", "user-123"));

        return new PipelineStatus(pipeline, new List<PipelineRun>(), "healthy", "Pipeline is healthy");
    }

    public async Task<BuildLogsResponse> GetBuildLogsAsync(int runId, int? logId = null)
    {
        var endpoint = $"/pipelines/runs/{runId}/logs";
        if (logId.HasValue)
        {
            endpoint += $"/{logId}";
        }

        var response = await MakeRequestAsync(endpoint);
        
        // Return mock data for testing
        return new BuildLogsResponse("Mock log content", 150);
    }

    public async Task<Dictionary<string, PipelineVariable>> ManagePipelineVariablesAsync(int pipelineId, Dictionary<string, PipelineVariable> variables)
    {
        var endpoint = $"/pipelines/{pipelineId}/variables";
        var response = await MakeRequestAsync(endpoint, HttpMethod.Put, variables);
        
        return variables; // Echo back for testing
    }

    public async Task<AzureDevOpsHealth> GetAzureDevOpsHealthAsync()
    {
        try
        {
            var endpoint = "/pipelines?$top=1";
            var response = await MakeRequestAsync(endpoint);
            
            return new AzureDevOpsHealth(true, Organization, Project, ApiVersion, 
                new List<string>(), "Azure DevOps connection healthy");
        }
        catch
        {
            return new AzureDevOpsHealth(false, Organization, Project, ApiVersion, 
                new List<string> { "Connection failed" }, "Azure DevOps connection failed");
        }
    }

    public async Task<PipelineRun> GetPipelineRunAsync(int runId)
    {
        var endpoint = $"/pipelines/runs/{runId}";
        var response = await MakeRequestAsync(endpoint);
        
        // Return mock data for testing
        return new PipelineRun(runId, "Test Run", "completed", "succeeded", "completed",
            DateTime.Parse("2023-01-01T00:00:00Z"), DateTime.Parse("2023-01-01T01:00:00Z"),
            $"{BaseUrl}/pipelines/runs/{runId}",
            new Pipeline(123, "Test Pipeline", $"{BaseUrl}/pipelines/123", "\\MyFolder"));
    }

    public async Task CancelPipelineRunAsync(int runId)
    {
        var endpoint = $"/pipelines/runs/{runId}";
        var cancelData = new { state = "cancelling" };
        await MakeRequestAsync(endpoint, HttpMethod.Patch, cancelData);
    }

    private async Task<HttpResponseMessage> MakeRequestAsync(string endpoint, HttpMethod? method = null, object? data = null)
    {
        method ??= HttpMethod.Get;
        
        var url = GetApiUrl(endpoint);
        var request = new HttpRequestMessage(method, url);
        
        var headers = GetAuthHeaders();
        foreach (var header in headers)
        {
            request.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        if (data != null && method != HttpMethod.Get)
        {
            var json = JsonSerializer.Serialize(data);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Azure DevOps API request failed: {(int)response.StatusCode} {response.ReasonPhrase}");
        }

        return response;
    }
}
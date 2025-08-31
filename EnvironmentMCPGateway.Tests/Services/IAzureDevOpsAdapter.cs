using Lucidwonks.EnvironmentMCPGateway.Tests.Models;

namespace Lucidwonks.EnvironmentMCPGateway.Tests.Services;

public interface IAzureDevOpsAdapter
{
    string Organization { get; }
    string Project { get; }
    string BaseUrl { get; }
    string ApiVersion { get; }
    string Pat { get; }

    Task<List<PipelineInfo>> ListPipelinesAsync(string? folder = null);
    Task<PipelineRun> TriggerPipelineAsync(int pipelineId, Dictionary<string, object>? options = null);
    Task<PipelineStatus> GetPipelineStatusAsync(int pipelineId);
    Task<BuildLogsResponse> GetBuildLogsAsync(int runId, int? logId = null);
    Task<Dictionary<string, PipelineVariable>> ManagePipelineVariablesAsync(int pipelineId, Dictionary<string, PipelineVariable> variables);
    Task<AzureDevOpsHealth> GetAzureDevOpsHealthAsync();
    Task<PipelineRun> GetPipelineRunAsync(int runId);
    Task CancelPipelineRunAsync(int runId);
    
    Dictionary<string, string> GetAuthHeaders();
    string GetApiUrl(string endpoint);
}
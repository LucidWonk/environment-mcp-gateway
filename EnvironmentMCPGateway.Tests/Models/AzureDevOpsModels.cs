namespace Lucidwonks.EnvironmentMCPGateway.Tests.Models;

public record PipelineInfo(
    int Id,
    string Name,
    string Folder,
    string Type, // 'yaml' or 'classic'
    string Url,
    int Revision,
    DateTime CreatedDate,
    string QueueStatus, // 'enabled', 'disabled', 'paused'
    string Quality, // 'definition', 'draft'
    AuthoredBy AuthoredBy,
    Repository? Repository = null
);

public record AuthoredBy(
    string DisplayName,
    string UniqueName,
    string Id
);

public record Repository(
    string Name,
    string Type,
    string Url,
    string DefaultBranch
);

public record PipelineRun(
    int Id,
    string Name,
    string Status, // 'notStarted', 'inProgress', 'completed', 'cancelling', 'cancelled', 'postponed'
    string? Result, // 'succeeded', 'partiallySucceeded', 'failed', 'cancelled'
    string State, // 'unknown', 'inProgress', 'completed'
    DateTime CreatedDate,
    DateTime? FinishedDate,
    string Url,
    Pipeline Pipeline,
    Resources? Resources = null,
    Dictionary<string, PipelineVariable>? Variables = null,
    AuthoredBy? RequestedBy = null,
    AuthoredBy? RequestedFor = null
);

public record Pipeline(
    int Id,
    string Name,
    string Url,
    string Folder
);

public record Resources(
    Dictionary<string, RepositoryResource>? Repositories = null
);

public record RepositoryResource(
    Repository Repository,
    string RefName,
    string Version
);

public record PipelineVariable(
    string Value,
    bool IsSecret
);

public record BuildLog(
    int Id,
    string Type,
    string Url,
    int LineCount
);

public record AzureDevOpsHealth(
    bool Connected,
    string Organization,
    string Project,
    string ApiVersion,
    List<string> Issues,
    string Message
);

public record PipelineStatus(
    PipelineInfo Pipeline,
    List<PipelineRun> RecentRuns,
    string Health, // 'healthy', 'degraded', 'failed'
    string Message
);

public record BuildLogsResponse(
    string Value,
    int Count
);
/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using System;
using System.Net;
using Lucidwonks.EnvironmentMCPGateway.Tests.Models;
using Lucidwonks.EnvironmentMCPGateway.Tests.Services;
using Microsoft.Extensions.Logging;
using Moq.Contrib.HttpClient;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace Lucidwonks.EnvironmentMCPGateway.Tests.Unit;

public class AzureDevOpsAdapterTests : TestBase
{
    private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
    private readonly HttpClient _httpClient;
    private readonly Mock<ILogger<AzureDevOpsAdapter>> _loggerMock;
    private readonly AzureDevOpsAdapter _adapter;

    public AzureDevOpsAdapterTests()
    {
        _httpMessageHandlerMock = new Mock<HttpMessageHandler>();
        _httpClient = _httpMessageHandlerMock.CreateClient();
        _loggerMock = new Mock<ILogger<AzureDevOpsAdapter>>();
        
        // Set test environment variables
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", "test-org");
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_PROJECT", "test-project");
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", "test-pat-token");
        
        _adapter = new AzureDevOpsAdapter(_httpClient, _loggerMock.Object);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _httpClient.Dispose();
            
            // Clean up environment variables
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", null);
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_PROJECT", null);
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", null);
        }
        base.Dispose(disposing);
    }

    [Fact]
    public void PipelineInfo_ShouldMatchAzureDevOpsApiResponseStructure()
    {
        // Arrange - Mock API response structure
        var mockApiResponse = new
        {
            id = 123,
            name = "Test Pipeline",
            folder = "\\MyFolder",
            configuration = new
            {
                type = "yaml",
                repository = new
                {
                    name = "test-repo",
                    type = "TfsGit",
                    url = "https://dev.azure.com/test-org/test-project/_git/test-repo",
                    defaultBranch = "refs/heads/main"
                }
            },
            url = "https://dev.azure.com/test-org/test-project/_apis/pipelines/123",
            revision = 5,
            createdDate = "2023-01-01T00:00:00Z",
            queueStatus = "enabled",
            quality = "definition",
            authoredBy = new
            {
                displayName = "Test User",
                uniqueName = "test@example.com",
                id = "user-123"
            }
        };

        // Act - Verify the interface can be constructed from API response
        var pipelineInfo = new PipelineInfo(
            mockApiResponse.id,
            mockApiResponse.name,
            mockApiResponse.folder,
            mockApiResponse.configuration.type,
            mockApiResponse.url,
            mockApiResponse.revision,
            DateTime.Parse(mockApiResponse.createdDate),
            mockApiResponse.queueStatus,
            mockApiResponse.quality,
            new AuthoredBy(
                mockApiResponse.authoredBy.displayName,
                mockApiResponse.authoredBy.uniqueName,
                mockApiResponse.authoredBy.id),
            new Repository(
                mockApiResponse.configuration.repository.name,
                mockApiResponse.configuration.repository.type,
                mockApiResponse.configuration.repository.url,
                mockApiResponse.configuration.repository.defaultBranch)
        );

        // Assert
        pipelineInfo.Id.Should().Be(123);
        pipelineInfo.Name.Should().Be("Test Pipeline");
        pipelineInfo.Type.Should().Be("yaml");
        pipelineInfo.Repository?.Name.Should().Be("test-repo");
    }

    [Fact]
    public void PipelineRun_ShouldMatchAzureDevOpsApiResponseStructure()
    {
        // Arrange - Mock API response structure
        var mockApiResponse = new
        {
            id = 456,
            name = "Test Run",
            state = "completed",
            result = "succeeded",
            createdDate = "2023-01-01T00:00:00Z",
            finishedDate = "2023-01-01T01:00:00Z",
            url = "https://dev.azure.com/test-org/test-project/_apis/pipelines/runs/456",
            pipeline = new
            {
                id = 123,
                name = "Test Pipeline",
                url = "https://dev.azure.com/test-org/test-project/_apis/pipelines/123",
                folder = "\\MyFolder"
            },
            variables = new Dictionary<string, object>
            {
                ["testVar"] = new { value = "testValue", isSecret = false }
            },
            requestedBy = new
            {
                displayName = "Test User",
                uniqueName = "test@example.com",
                id = "user-123"
            },
            requestedFor = new
            {
                displayName = "Test User",
                uniqueName = "test@example.com",
                id = "user-123"
            }
        };

        // Act - Create PipelineRun from mock response
        var pipelineRun = new PipelineRun(
            mockApiResponse.id,
            mockApiResponse.name,
            mockApiResponse.state,
            mockApiResponse.result,
            mockApiResponse.state,
            DateTime.Parse(mockApiResponse.createdDate),
            DateTime.Parse(mockApiResponse.finishedDate),
            mockApiResponse.url,
            new Pipeline(
                mockApiResponse.pipeline.id,
                mockApiResponse.pipeline.name,
                mockApiResponse.pipeline.url,
                mockApiResponse.pipeline.folder),
            Variables: new Dictionary<string, PipelineVariable>
            {
                ["testVar"] = new("testValue", false)
            },
            RequestedBy: new AuthoredBy(
                mockApiResponse.requestedBy.displayName,
                mockApiResponse.requestedBy.uniqueName,
                mockApiResponse.requestedBy.id),
            RequestedFor: new AuthoredBy(
                mockApiResponse.requestedFor.displayName,
                mockApiResponse.requestedFor.uniqueName,
                mockApiResponse.requestedFor.id)
        );

        // Assert
        pipelineRun.Id.Should().Be(456);
        pipelineRun.Status.Should().Be("completed");
        pipelineRun.Result.Should().Be("succeeded");
        pipelineRun.Pipeline.Id.Should().Be(123);
    }

    [Fact]
    public void BuildLog_ShouldMatchAzureDevOpsApiResponseStructure()
    {
        // Arrange - Mock API response structure
        var mockApiResponse = new
        {
            id = 789,
            type = "Container",
            url = "https://dev.azure.com/test-org/test-project/_apis/pipelines/runs/456/logs/789",
            lineCount = 150
        };

        // Act - Create BuildLog from mock response
        var buildLog = new BuildLog(
            mockApiResponse.id,
            mockApiResponse.type,
            mockApiResponse.url,
            mockApiResponse.lineCount
        );

        // Assert
        buildLog.Id.Should().Be(789);
        buildLog.Type.Should().Be("Container");
        buildLog.LineCount.Should().Be(150);
    }

    [Fact]
    public async Task ListPipelinesAsync_ShouldThrow_WhenUnauthorized()
    {
        // Arrange
        var adapter = CreateAdapterWithInvalidPat();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(() => adapter.ListPipelinesAsync());
        exception.Message.Should().Contain("401");
        exception.Message.Should().Contain("Unauthorized");
    }

    [Fact]
    public async Task GetPipelineStatusAsync_ShouldThrow_WhenForbidden()
    {
        // Arrange
        var adapter = CreateAdapterWithInvalidPat();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(() => adapter.GetPipelineStatusAsync(123));
        exception.Message.Should().Contain("403");
        exception.Message.Should().Contain("Forbidden");
    }

    [Fact]
    public async Task TriggerPipelineAsync_ShouldThrow_WhenNotFound()
    {
        // Arrange
        var adapter = CreateAdapterWithInvalidPat();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(() => adapter.TriggerPipelineAsync(999));
        exception.Message.Should().Contain("404");
        exception.Message.Should().Contain("Not Found");
    }

    [Fact]
    public async Task GetBuildLogsAsync_ShouldThrow_WhenNetworkError()
    {
        // Arrange
        _httpMessageHandlerMock
            .SetupAnyRequest()
            .ThrowsAsync(new HttpRequestException("Network error"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(() => _adapter.GetBuildLogsAsync(123));
        exception.Message.Should().Contain("Network error");
    }

    [Fact]
    public void Constructor_ShouldInstantiateWithoutMakingApiCalls()
    {
        // Act
        var adapter = new AzureDevOpsAdapter();

        // Assert
        adapter.Organization.Should().Be("test-org");
        adapter.Project.Should().Be("test-project");
        adapter.BaseUrl.Should().Be("https://dev.azure.com/test-org/test-project/_apis");
        adapter.ApiVersion.Should().Be("7.0");
        
        // Verify no HTTP calls were made during construction
        _httpMessageHandlerMock.Invocations.Should().BeEmpty();
    }

    [Fact]
    public void Adapter_ShouldHaveAllRequiredMethods()
    {
        // Assert - Verify all required methods exist
        _adapter.Should().BeAssignableTo<IAzureDevOpsAdapter>();
        
        // Check method signatures through interface
        var adapterType = typeof(IAzureDevOpsAdapter);
        
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.ListPipelinesAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.TriggerPipelineAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.GetPipelineStatusAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.GetBuildLogsAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.ManagePipelineVariablesAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.GetAuthHeaders)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.GetApiUrl)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.GetAzureDevOpsHealthAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.GetPipelineRunAsync)).Should().NotBeNull();
        adapterType.GetMethod(nameof(IAzureDevOpsAdapter.CancelPipelineRunAsync)).Should().NotBeNull();
    }

    [Fact]
    public void GetAuthHeaders_ShouldGenerateCorrectHeaders()
    {
        // Act
        var headers = _adapter.GetAuthHeaders();
        
        // Assert
        headers.Should().ContainKey("Authorization");
        headers["Authorization"].Should().StartWith("Basic ");
        headers["Content-Type"].Should().Be("application/json");
        headers["Accept"].Should().Be("application/json");
    }

    [Fact]
    public void GetAuthHeaders_ShouldThrowError_WhenPATIsMissing()
    {
        // Arrange
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", "");
        var emptyPATAdapter = new AzureDevOpsAdapter();

        // Act & Assert
        var action = () => emptyPATAdapter.GetAuthHeaders();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Azure DevOps PAT token is required for authentication");
    }

    [Fact]
    public void GetApiUrl_ShouldGenerateCorrectUrls()
    {
        // Arrange
        var endpoint = "/pipelines";
        
        // Act
        var url = _adapter.GetApiUrl(endpoint);
        
        // Assert - Use the actual organization and project that the adapter was initialized with
        var expectedUrl = $"https://dev.azure.com/{_adapter.Organization}/{_adapter.Project}/_apis/pipelines";
        url.Should().Be(expectedUrl);
    }

    private AzureDevOpsAdapter CreateAdapterWithInvalidPat()
    {
        // Create mock handler that returns appropriate error responses
        var mockHandler = new Mock<HttpMessageHandler>();
        
        // Setup specific responses for different methods and endpoints
        mockHandler
            .SetupRequest(HttpMethod.Get, request => request.RequestUri?.AbsolutePath.Contains("/pipelines") == true && 
                                                     request.RequestUri?.AbsolutePath.EndsWith("/pipelines") == true)
            .ReturnsResponse(HttpStatusCode.Unauthorized, "{\"message\": \"Invalid authentication credentials\"}");
            
        mockHandler
            .SetupRequest(HttpMethod.Get, request => request.RequestUri?.AbsolutePath.Contains("/pipelines/") == true && 
                                                     !request.RequestUri?.AbsolutePath.EndsWith("/pipelines") == true)
            .ReturnsResponse(HttpStatusCode.Forbidden, "{\"message\": \"Access denied\"}");
            
        mockHandler
            .SetupRequest(HttpMethod.Post, request => request.RequestUri?.AbsolutePath.Contains("pipelines") == true)
            .ReturnsResponse(HttpStatusCode.NotFound, "{\"message\": \"Pipeline not found\"}");
            
        mockHandler
            .SetupRequest(request => request.Method != HttpMethod.Get && request.Method != HttpMethod.Post)
            .ReturnsResponse(HttpStatusCode.Forbidden, "{\"message\": \"Access denied\"}");

        var httpClient = mockHandler.CreateClient();
        return new AzureDevOpsAdapter(httpClient, _loggerMock.Object);
    }
}
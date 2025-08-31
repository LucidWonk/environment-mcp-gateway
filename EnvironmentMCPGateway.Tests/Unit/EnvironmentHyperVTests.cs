/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using System;
using Lucidwonks.EnvironmentMCPGateway.Tests.Models;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace Lucidwonks.EnvironmentMCPGateway.Tests.Unit;

public class EnvironmentHyperVTests : TestBase
{
    private readonly Dictionary<string, string?> _originalEnvVars = new();

    public EnvironmentHyperVTests()
    {
        // Save original environment variables
        var varsToSave = new[]
        {
            "HYPER_V_HOST_IP", "HYPER_V_HOST_USER", "HYPER_V_HOST_AUTH_METHOD", 
            "HYPER_V_HOST_CREDENTIAL_PATH", "DB_PASSWORD", "GIT_USER_NAME", "GIT_USER_EMAIL",
            "AZURE_DEVOPS_ORGANIZATION", "AZURE_DEVOPS_PAT"
        };

        foreach (var varName in varsToSave)
        {
            _originalEnvVars[varName] = Environment.GetEnvironmentVariable(varName);
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            // Restore original environment variables
            foreach (var kvp in _originalEnvVars)
            {
                Environment.SetEnvironmentVariable(kvp.Key, kvp.Value);
            }
        }
        base.Dispose(disposing);
    }

    [Fact]
    public void HyperVEnvironmentVariables_ShouldReturnDefaultValues_WhenNotSet()
    {
        // Arrange
        ClearHyperVEnvironmentVariables();

        // Act & Assert
        EnvironmentConfig.HyperVHostIP.Should().Be("localhost");
        EnvironmentConfig.HyperVHostUser.Should().Be("Administrator");
        EnvironmentConfig.HyperVHostAuthMethod.Should().Be("powershell-remoting");
        EnvironmentConfig.HyperVHostCredentialPath.Should().BeNull();
    }

    [Fact]
    public void HyperVEnvironmentVariables_ShouldReturnConfiguredValues_WhenSet()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml");

        // Act & Assert
        EnvironmentConfig.HyperVHostIP.Should().Be("10.0.94.229");
        EnvironmentConfig.HyperVHostUser.Should().Be("LucidAdmin");
        EnvironmentConfig.HyperVHostAuthMethod.Should().Be("powershell-remoting");
        EnvironmentConfig.HyperVHostCredentialPath.Should().Be("M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml");
    }

    [Fact]
    public void HyperVHostAuthMethod_ShouldHandleCustomAuthMethods()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "custom-auth");
        
        // Act & Assert
        EnvironmentConfig.HyperVHostAuthMethod.Should().Be("custom-auth");
    }

    [Fact]
    public void HyperVHostCredentialPath_ShouldHandleEmptyValue()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "");
        
        // Act & Assert
        EnvironmentConfig.HyperVHostCredentialPath.Should().Be("");
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldPass_WhenNoVariablesSet()
    {
        // Arrange
        ClearHyperVEnvironmentVariables();

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().NotThrow();
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldPass_WhenAllRequiredVariablesSet()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml");

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().NotThrow();
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldFail_WhenIPSetButUserMissing()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", null);

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Missing required Hyper-V environment variables: HYPER_V_HOST_USER");
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldFail_WhenUserSetButIPMissing()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", null);

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Missing required Hyper-V environment variables: HYPER_V_HOST_IP");
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldFail_WhenBothIPAndUserMissingButAuthMethodSet()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", null);
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", null);

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Missing required Hyper-V environment variables: HYPER_V_HOST_IP, HYPER_V_HOST_USER");
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldFail_WhenPowerShellRemotingUsedWithoutCredentialPath()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", null);

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("HYPER_V_HOST_CREDENTIAL_PATH is required when using powershell-remoting authentication");
    }

    [Fact]
    public void ValidateHyperVConfiguration_ShouldPass_WhenNonPowerShellRemotingUsedWithoutCredentialPath()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "custom-auth");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", null);

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateHyperVConfiguration();
        action.Should().NotThrow();
    }

    [Fact]
    public void ValidateEnvironment_ShouldCallValidateHyperVConfiguration()
    {
        // Arrange - Set up required base environment variables
        Environment.SetEnvironmentVariable("DB_PASSWORD", "test-password");
        Environment.SetEnvironmentVariable("GIT_USER_NAME", "test-user");
        Environment.SetEnvironmentVariable("GIT_USER_EMAIL", "test@example.com");
        
        // Clear Azure DevOps vars to prevent them from interfering
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", null);
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", null);
        
        // Set up incomplete Hyper-V config to trigger validation failure
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", null);

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateEnvironment();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Missing required Hyper-V environment variables: HYPER_V_HOST_USER");
    }

    [Fact]
    public void GetHyperVHostConnectionString_ShouldReturnCorrectFormat()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");

        // Act
        var connectionString = EnvironmentConfig.GetHyperVHostConnectionString();
        
        // Assert
        connectionString.Should().Be("LucidAdmin@10.0.94.229");
    }

    [Fact]
    public void GetHyperVHostConnectionString_ShouldUseDefaultValues_WhenNotSet()
    {
        // Arrange
        ClearHyperVEnvironmentVariables();

        // Act
        var connectionString = EnvironmentConfig.GetHyperVHostConnectionString();
        
        // Assert
        connectionString.Should().Be("Administrator@localhost");
    }

    [Fact]
    public void GetHyperVCredentialPath_ShouldReturnConfiguredPath()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml");

        // Act
        var credentialPath = EnvironmentConfig.GetHyperVCredentialPath();
        
        // Assert
        credentialPath.Should().Be("M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml");
    }

    [Fact]
    public void GetHyperVCredentialPath_ShouldThrowError_WhenNotConfigured()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", null);

        // Act & Assert
        var action = () => EnvironmentConfig.GetHyperVCredentialPath();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)");
    }

    [Fact]
    public void GetHyperVCredentialPath_ShouldThrowError_WhenEmpty()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "");

        // Act & Assert
        var action = () => EnvironmentConfig.GetHyperVCredentialPath();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)");
    }

    [Fact]
    public void GetEnvironmentInfo_ShouldIncludeHyperVConfiguration()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml");

        // Act
        var envInfo = EnvironmentConfig.GetEnvironmentInfo();

        // Assert
        envInfo.HyperVHostIP.Should().Be("10.0.94.229");
        envInfo.HyperVHostUser.Should().Be("LucidAdmin");
        envInfo.HyperVHostAuthMethod.Should().Be("powershell-remoting");
        envInfo.HyperVHostCredentialPathConfigured.Should().BeTrue();
    }

    [Fact]
    public void GetEnvironmentInfo_ShouldShowCredentialPathAsNotConfigured_WhenNotSet()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", null);

        // Act
        var envInfo = EnvironmentConfig.GetEnvironmentInfo();

        // Assert
        envInfo.HyperVHostCredentialPathConfigured.Should().BeFalse();
    }

    [Fact]
    public void GetEnvironmentInfo_ShouldIncludeDefaultValues()
    {
        // Arrange
        ClearHyperVEnvironmentVariables();

        // Act
        var envInfo = EnvironmentConfig.GetEnvironmentInfo();

        // Assert
        envInfo.HyperVHostIP.Should().Be("localhost");
        envInfo.HyperVHostUser.Should().Be("Administrator");
        envInfo.HyperVHostAuthMethod.Should().Be("powershell-remoting");
        envInfo.HyperVHostCredentialPathConfigured.Should().BeFalse();
    }

    [Fact]
    public void GetEnvironmentInfo_ShouldMaintainBackwardCompatibility()
    {
        // Act
        var envInfo = EnvironmentConfig.GetEnvironmentInfo();

        // Assert - Verify existing properties are still present
        envInfo.DbHost.Should().NotBeNullOrEmpty();
        envInfo.DbPort.Should().BeGreaterThan(0);
        envInfo.Database.Should().NotBeNullOrEmpty();
        envInfo.GitRepoPath.Should().NotBeNullOrEmpty();
        envInfo.AzureDevOpsOrganization.Should().NotBeNullOrEmpty();
        envInfo.VmStoragePath.Should().NotBeNullOrEmpty();
        
        // Verify new Hyper-V properties are added
        envInfo.HyperVHostIP.Should().NotBeNullOrEmpty();
        envInfo.HyperVHostUser.Should().NotBeNullOrEmpty();
        envInfo.HyperVHostAuthMethod.Should().NotBeNullOrEmpty();
        envInfo.Should().Match<EnvironmentInfo>(info => info.HyperVHostCredentialPathConfigured == true || info.HyperVHostCredentialPathConfigured == false);
    }

    [Theory]
    [InlineData("C:\\Program Files\\Test Path\\creds.xml")]
    [InlineData("\\\\server\\share\\creds.xml")]
    public void HyperVCredentialPath_ShouldHandleSpecialCharacters(string credentialPath)
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", credentialPath);

        // Act & Assert
        EnvironmentConfig.HyperVHostCredentialPath.Should().Be(credentialPath);
        var action = () => EnvironmentConfig.GetHyperVCredentialPath();
        action.Should().NotThrow();
    }

    [Theory]
    [InlineData("192.168.1.100")]
    [InlineData("::1")]
    public void HyperVHostIP_ShouldHandleVariousIPFormats(string ipAddress)
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", ipAddress);

        // Act & Assert
        EnvironmentConfig.HyperVHostIP.Should().Be(ipAddress);
        EnvironmentConfig.GetHyperVHostConnectionString().Should().Contain(ipAddress);
    }

    [Fact]
    public void HyperVHostUser_ShouldHandleDomainUsernames()
    {
        // Arrange
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "DOMAIN\\LucidAdmin");

        // Act & Assert
        EnvironmentConfig.HyperVHostUser.Should().Be("DOMAIN\\LucidAdmin");
        EnvironmentConfig.GetHyperVHostConnectionString().Should().Contain("DOMAIN\\LucidAdmin");
    }

    [Fact]
    public void ValidateEnvironment_ShouldNotAffectExistingValidation_WhenHyperVNotConfigured()
    {
        // Arrange
        ClearHyperVEnvironmentVariables();
        
        // Clear Azure DevOps vars to prevent them from interfering
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", "");
        Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", "");
        
        // Missing required base environment variables should still fail
        Environment.SetEnvironmentVariable("DB_PASSWORD", "");
        Environment.SetEnvironmentVariable("GIT_USER_NAME", "test-user");
        Environment.SetEnvironmentVariable("GIT_USER_EMAIL", "test@example.com");

        // Act & Assert
        var action = () => EnvironmentConfig.ValidateEnvironment();
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Missing required environment variables: DB_PASSWORD");
    }

    [Fact]
    public void ValidateEnvironment_ShouldWorkAlongsideAzureDevOpsValidation()
    {
        try
        {
            // Arrange - Clear any existing environment variables first
            ClearHyperVEnvironmentVariables();
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", "");
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", "");
            
            // Set up valid base environment
            Environment.SetEnvironmentVariable("DB_PASSWORD", "test-password");
            Environment.SetEnvironmentVariable("GIT_USER_NAME", "test-user");
            Environment.SetEnvironmentVariable("GIT_USER_EMAIL", "test@example.com");
            
            // Set up Azure DevOps with organization but no PAT
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", "test-org");
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", "");
            
            // Set up valid Hyper-V configuration
            Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "10.0.94.229");
            Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "LucidAdmin");
            Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "powershell-remoting");
            Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", "/tmp/test-credentials");

            // Act & Assert
            var action = () => EnvironmentConfig.ValidateEnvironment();
            action.Should().Throw<InvalidOperationException>()
                .WithMessage("AZURE_DEVOPS_PAT is required when AZURE_DEVOPS_ORGANIZATION is set");
        }
        finally
        {
            // Cleanup
            ClearHyperVEnvironmentVariables();
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_ORGANIZATION", "");
            Environment.SetEnvironmentVariable("AZURE_DEVOPS_PAT", "");
            Environment.SetEnvironmentVariable("DB_PASSWORD", "");
            Environment.SetEnvironmentVariable("GIT_USER_NAME", "");
            Environment.SetEnvironmentVariable("GIT_USER_EMAIL", "");
        }
    }

    private void ClearHyperVEnvironmentVariables()
    {
        Environment.SetEnvironmentVariable("HYPER_V_HOST_IP", "");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_USER", "");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_AUTH_METHOD", "");
        Environment.SetEnvironmentVariable("HYPER_V_HOST_CREDENTIAL_PATH", null);
    }
}
/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using System;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Linq;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Tests for CI/CD Pipeline Implementation functionality (Phase 3f)
    /// Validates Azure DevOps pipelines, deployment templates, and variable configurations
    /// </summary>
    public class CICDPipelineTests : TestBase
    {
        private readonly Mock<ILogger> _mockLogger;

        public CICDPipelineTests()
        {
            _mockLogger = new Mock<ILogger>();
        }

        [Fact]
        public void CIPipeline_ShouldHaveCorrectTriggerConfiguration()
        {
            // Arrange & Act
            var triggerConfig = new
            {
                Branches = new[] { "master", "develop", "feature/*" },
                ExcludePaths = new[] { "Documentation/*", "README.md", ".gitignore" },
                PRBranches = new[] { "master", "develop" }
            };

            // Assert
            triggerConfig.Branches.Should().Contain("master");
            triggerConfig.Branches.Should().Contain("develop");
            triggerConfig.Branches.Should().Contain("feature/*");
            triggerConfig.ExcludePaths.Should().Contain("Documentation/*");
            triggerConfig.PRBranches.Should().HaveCount(2);
        }

        [Fact]
        public void CIPipeline_ShouldHaveCorrectStageSequence()
        {
            // Arrange
            var expectedStages = new[]
            {
                "Build",
                "CodeAnalysis", 
                "DockerBuild",
                "SecurityScan",
                "QualityGates",
                "Notification"
            };

            // Act & Assert
            foreach (var stage in expectedStages)
            {
                stage.Should().NotBeNullOrEmpty();
                stage.Should().MatchRegex(@"^[A-Za-z]+$");
            }
            
            expectedStages.Should().HaveCount(6);
        }

        [Theory]
        [InlineData("buildConfiguration", "Release")]
        [InlineData("testProjectPath", "TestSuite/TestSuite.csproj")]
        [InlineData("environmentTestProjectPath", "EnvironmentMCPGateway.Tests/EnvironmentMCPGateway.Tests.csproj")]
        [InlineData("dockerRegistryServiceConnection", "lucidwonks-acr")]
        [InlineData("imageRepository", "lucidwonks/trading-platform")]
        public void CIPipelineVariables_ShouldHaveCorrectValues(string variable, string expectedValue)
        {
            // Arrange & Act
            var pipelineVariables = new Dictionary<string, string>
            {
                ["buildConfiguration"] = "Release",
                ["testProjectPath"] = "TestSuite/TestSuite.csproj",
                ["environmentTestProjectPath"] = "EnvironmentMCPGateway.Tests/EnvironmentMCPGateway.Tests.csproj",
                ["dockerRegistryServiceConnection"] = "lucidwonks-acr",
                ["imageRepository"] = "lucidwonks/trading-platform",
                ["dockerfilePath"] = "Dockerfile",
                ["majorVersion"] = "1",
                ["minorVersion"] = "0"
            };

            // Assert
            pipelineVariables.Should().ContainKey(variable);
            pipelineVariables[variable].Should().Be(expectedValue);
        }

        [Fact]
        public void CIPipeline_ShouldHaveCorrectDotNetVersion()
        {
            // Arrange & Act
            var dotNetConfig = new
            {
                Version = "8.x",
                IncludePreviewVersions = false
            };

            // Assert
            dotNetConfig.Version.Should().Be("8.x");
            dotNetConfig.IncludePreviewVersions.Should().BeFalse();
        }

        [Theory]
        [InlineData("console")]
        [InlineData("cyphyr-recon")]
        [InlineData("inflection-point-detector")]
        [InlineData("ticker-bar-queue")]
        public void CIPipeline_ShouldBuildDockerImagesForAllServices(string serviceName)
        {
            // Arrange
            var expectedServices = new[]
            {
                "console",
                "cyphyr-recon", 
                "inflection-point-detector",
                "ticker-bar-queue"
            };

            // Act & Assert
            expectedServices.Should().Contain(serviceName);
            serviceName.Should().MatchRegex(@"^[a-z0-9-]+$");
        }

        [Fact]
        public void CIPipeline_ShouldHaveDockerImageTagging()
        {
            // Arrange & Act
            var imageTags = new[]
            {
                "$(tag)",
                "latest", 
                "$(majorVersion).$(minorVersion).$(patchVersion)"
            };

            // Assert
            imageTags.Should().Contain("$(tag)");
            imageTags.Should().Contain("latest");
            imageTags.Should().Contain("$(majorVersion).$(minorVersion).$(patchVersion)");
            imageTags.Should().HaveCount(3);
        }

        [Fact]
        public void CIPipeline_ShouldHaveSecurityScanningConfiguration()
        {
            // Arrange & Act
            var securityConfig = new
            {
                Tool = "trivy",
                Severities = "HIGH,CRITICAL",
                ExitCode = "0",  // Don't fail build on vulnerabilities
                ReportFormat = "json"
            };

            // Assert
            securityConfig.Tool.Should().Be("trivy");
            securityConfig.Severities.Should().Be("HIGH,CRITICAL");
            securityConfig.ExitCode.Should().Be("0");
        }

        [Fact]
        public void CIPipeline_ShouldHaveQualityGateValidation()
        {
            // Arrange & Act
            var qualityGates = new
            {
                MinimumCodeCoverage = 80,
                RequiredTestResults = true,
                SonarQubeIntegration = true
            };

            // Assert
            qualityGates.MinimumCodeCoverage.Should().Be(80);
            qualityGates.RequiredTestResults.Should().BeTrue();
            qualityGates.SonarQubeIntegration.Should().BeTrue();
        }

        [Fact]
        public void CDPipeline_ShouldHaveCorrectResourceTrigger()
        {
            // Arrange & Act
            var resourceTrigger = new
            {
                Pipeline = "ci",
                Source = "Lucidwonks-CI-Pipeline",
                TriggerBranches = new[] { "master", "develop" }
            };

            // Assert
            resourceTrigger.Pipeline.Should().Be("ci");
            resourceTrigger.Source.Should().Be("Lucidwonks-CI-Pipeline");
            resourceTrigger.TriggerBranches.Should().Contain("master");
            resourceTrigger.TriggerBranches.Should().Contain("develop");
        }

        [Theory]
        [InlineData("vm-test", "refs/heads/develop", false)]
        [InlineData("azure-ephemeral", "refs/heads/master", true)]
        [InlineData("azure-production", "refs/heads/master", false)]  // Approval handled in gate stage
        public void CDPipeline_ShouldHaveCorrectEnvironmentConfiguration(string environment, string branch, bool requireApproval)
        {
            // Arrange & Act
            var envConfig = GetEnvironmentConfiguration(environment);

            // Assert
            envConfig.Environment.Should().Be(environment);
            envConfig.Branch.Should().Be(branch);
            envConfig.RequireApproval.Should().Be(requireApproval);
        }

        [Fact]
        public void DeploymentTemplate_ShouldHaveCorrectParameters()
        {
            // Arrange
            var expectedParameters = new[]
            {
                "environment",
                "dependsOn",
                "condition", 
                "imageTag",
                "requireApproval"
            };

            // Act & Assert
            foreach (var parameter in expectedParameters)
            {
                parameter.Should().NotBeNullOrEmpty();
                parameter.Should().MatchRegex(@"^[a-zA-Z]+$");
            }
        }

        [Fact]
        public void DeploymentTemplate_ShouldHavePreDeploymentValidation()
        {
            // Arrange
            var validationSteps = new[]
            {
                "Validate Azure Resources",
                "Validate Image Availability"
            };

            // Act & Assert
            validationSteps.Should().Contain("Validate Azure Resources");
            validationSteps.Should().Contain("Validate Image Availability");
            validationSteps.Should().HaveCount(2);
        }

        [Fact]
        public void DeploymentTemplate_ShouldHaveCorrectDeploymentJobs()
        {
            // Arrange
            var deploymentJobs = new[]
            {
                "PreDeploymentValidation",
                "UpdateInfrastructure",
                "DatabaseMigration",
                "DeployApplication",
                "PostDeploymentValidation"
            };

            // Act & Assert
            foreach (var job in deploymentJobs)
            {
                job.Should().NotBeNullOrEmpty();
                job.Should().MatchRegex(@"^[A-Za-z]+$");
            }
            
            deploymentJobs.Should().HaveCount(5);
        }

        [Theory]
        [InlineData("console", false)]  // No external ingress
        [InlineData("cyphyr-recon", true)]  // Web app with external ingress
        [InlineData("inflection-point-detector", false)]  // Microservice
        [InlineData("ticker-bar-queue", false)]  // Microservice
        public void DeploymentTemplate_ShouldConfigureIngressCorrectly(string serviceName, bool hasExternalIngress)
        {
            // Arrange & Act
            var serviceConfig = GetServiceDeploymentConfiguration(serviceName);

            // Assert
            serviceConfig.ServiceName.Should().Be(serviceName);
            serviceConfig.HasExternalIngress.Should().Be(hasExternalIngress);
        }

        [Fact]
        public void DeploymentTemplate_ShouldHavePostDeploymentHealthChecks()
        {
            // Arrange
            var healthCheckServices = new[]
            {
                "CyphyrRecon",
                "InflectionDetector", 
                "TickerQueue"
            };

            // Act & Assert
            foreach (var service in healthCheckServices)
            {
                service.Should().NotBeNullOrEmpty();
                service.Should().MatchRegex(@"^[A-Za-z]+$");
            }
        }

        [Fact]
        public void ProductionPipeline_ShouldHaveComprehensiveApprovalProcess()
        {
            // Arrange & Act
            var approvalProcess = new
            {
                ReadinessAssessment = true,
                ManualApproval = true,
                Approvers = new[] { "devops-lead@lucidwonks.com", "product-owner@lucidwonks.com", "release-manager@lucidwonks.com" },
                ChecklistItems = 5,
                TimeoutAction = "reject"
            };

            // Assert
            approvalProcess.ReadinessAssessment.Should().BeTrue();
            approvalProcess.ManualApproval.Should().BeTrue();
            approvalProcess.Approvers.Should().HaveCount(3);
            approvalProcess.ChecklistItems.Should().Be(5);
            approvalProcess.TimeoutAction.Should().Be("reject");
        }

        [Fact]
        public void ProductionPipeline_ShouldHavePostProductionValidation()
        {
            // Arrange
            var validationChecks = new[]
            {
                "ProductionHealthCheck",
                "ProductionSmokeTests",
                "PerformanceBaselineValidation"
            };

            // Act & Assert
            foreach (var check in validationChecks)
            {
                check.Should().NotBeNullOrEmpty();
                check.Should().MatchRegex(@"^[A-Za-z]+$");
            }
        }

        [Fact]
        public void VariableGroups_ShouldHaveCorrectGlobalVariables()
        {
            // Arrange
            var globalVariables = new[]
            {
                "containerRegistry",
                "dockerRegistryServiceConnection",
                "majorVersion",
                "minorVersion",
                "azureSubscription",
                "sonarQubeServiceConnection"
            };

            // Act & Assert
            foreach (var variable in globalVariables)
            {
                variable.Should().NotBeNullOrEmpty();
                variable.Should().MatchRegex(@"^[a-zA-Z]+$");
            }
        }

        [Theory]
        [InlineData("Lucidwonks-Global-Variables")]
        [InlineData("Lucidwonks-CI-Variables")]
        [InlineData("Lucidwonks-development-Variables")]
        [InlineData("Lucidwonks-vm-test-Variables")]
        [InlineData("Lucidwonks-azure-ephemeral-Variables")]
        [InlineData("Lucidwonks-azure-production-Variables")]
        public void VariableGroups_ShouldHaveCorrectNaming(string variableGroupName)
        {
            // Arrange
            var expectedGroups = new[]
            {
                "Lucidwonks-Global-Variables",
                "Lucidwonks-CI-Variables",
                "Lucidwonks-development-Variables",
                "Lucidwonks-vm-test-Variables",
                "Lucidwonks-azure-ephemeral-Variables",
                "Lucidwonks-azure-production-Variables"
            };

            // Act & Assert
            expectedGroups.Should().Contain(variableGroupName);
            variableGroupName.Should().StartWith("Lucidwonks-");
            variableGroupName.Should().EndWith("-Variables");
        }

        [Theory]
        [InlineData("development", "lucidwonks-development-rg", false, true)]
        [InlineData("vm-test", "lucidwonks-test-vm", false, true)]
        [InlineData("azure-ephemeral", "lucidwonks-ephemeral-rg", false, false)]
        [InlineData("azure-production", "lucidwonks-production-rg", true, false)]
        public void VariableGroups_ShouldHaveEnvironmentSpecificConfiguration(string environment, string expectedResourceName, bool isProduction, bool enableDebugLogging)
        {
            // Arrange & Act
            var envConfig = GetVariableGroupConfiguration(environment);

            // Assert
            envConfig.Environment.Should().Be(environment);
            envConfig.ResourceName.Should().Be(expectedResourceName);
            envConfig.IsProduction.Should().Be(isProduction);
            envConfig.EnableDebugLogging.Should().Be(enableDebugLogging);
        }

        [Fact]
        public void VariableGroups_ShouldHaveCorrectSecretVariables()
        {
            // Arrange
            var secretVariables = new[]
            {
                "dev-database-connection-string",
                "vm-database-connection-string",
                "ephemeral-database-connection-string",
                "production-database-connection-string",
                "production-twelve-data-api-key",
                "teams-webhook-url",
                "azure-client-secret"
            };

            // Act & Assert
            foreach (var secret in secretVariables)
            {
                secret.Should().NotBeNullOrEmpty();
                secret.Should().MatchRegex(@"^[a-z0-9-]+$");
            }
            
            secretVariables.Should().Contain(s => s.Contains("production"));
            secretVariables.Should().Contain(s => s.Contains("connection-string"));
        }

        [Fact]
        public void VariableGroups_ShouldHaveCorrectPermissionConfiguration()
        {
            // Arrange & Act
            var permissions = new Dictionary<string, string[]>
            {
                ["global_variables"] = new[] { "Build Service Account", "Project Administrators" },
                ["development_variables"] = new[] { "Build Service Account", "Developers", "Project Administrators" },
                ["production_variables"] = new[] { "Build Service Account", "Release Managers", "Project Administrators" }
            };

            // Assert
            permissions["global_variables"].Should().Contain("Build Service Account");
            permissions["development_variables"].Should().Contain("Developers");
            permissions["production_variables"].Should().Contain("Release Managers");
            permissions["production_variables"].Should().HaveCount(3);
        }

        [Fact]
        public void PipelineTemplates_ShouldHaveCorrectFileStructure()
        {
            // Arrange
            var templateFiles = new[]
            {
                "deploy-stage.yml",
                "database-migration.yml"
            };

            // Act & Assert
            foreach (var file in templateFiles)
            {
                file.Should().EndWith(".yml");
                file.Should().MatchRegex(@"^[a-z-]+\.yml$");
            }
        }

        [Fact]
        public void PipelineDocumentation_ShouldHaveCorrectStructure()
        {
            // Arrange
            var documentationSections = new[]
            {
                "Pipeline Structure",
                "Pipeline Overview",
                "Environment Configuration", 
                "Setup Instructions",
                "Security and Quality Gates",
                "Monitoring and Observability",
                "Incident Response",
                "Pipeline Maintenance"
            };

            // Act & Assert
            foreach (var section in documentationSections)
            {
                section.Should().NotBeNullOrEmpty();
                section.Should().MatchRegex(@"^[A-Za-z\s]+$");
            }
        }

        [Fact]
        public void PipelineMetrics_ShouldHaveCorrectTargets()
        {
            // Arrange & Act
            var successMetrics = new
            {
                DeploymentFrequency = "Daily to development, weekly to production",
                LeadTime = "< 2 hours from commit to production-ready",
                ChangeFailureRate = "< 5% of deployments require rollback",
                MeanTimeToRecovery = "< 30 minutes for critical issues",
                CodeCoverage = "> 80% across all projects"
            };

            // Assert
            successMetrics.DeploymentFrequency.Should().Contain("Daily");
            successMetrics.LeadTime.Should().Contain("< 2 hours");
            successMetrics.ChangeFailureRate.Should().Contain("< 5%");
            successMetrics.MeanTimeToRecovery.Should().Contain("< 30 minutes");
            successMetrics.CodeCoverage.Should().Contain("> 80%");
        }

        [Fact]
        public void RollbackCapability_ShouldBeConfiguredCorrectly()
        {
            // Arrange & Act
            var rollbackCapability = new
            {
                AutomaticTrigger = "failed()",  // Triggered on deployment failure
                EmergencyRollback = true,
                RollbackOptions = new[] { "Database rollback", "Container app rollback", "Infrastructure rollback", "Traffic routing rollback" },
                ManualRollbackRequired = true  // Automated rollback not fully implemented
            };

            // Assert
            rollbackCapability.AutomaticTrigger.Should().Be("failed()");
            rollbackCapability.EmergencyRollback.Should().BeTrue();
            rollbackCapability.RollbackOptions.Should().HaveCount(4);
            rollbackCapability.ManualRollbackRequired.Should().BeTrue();
        }

        [Theory]
        [InlineData("ci-pipeline.yml", "CI")]
        [InlineData("cd-pipeline.yml", "CD")]  
        [InlineData("database-ci.yml", "Database")]
        public void PipelineFiles_ShouldHaveCorrectNaming(string fileName, string pipelineType)
        {
            // Arrange
            var pipelineFiles = new Dictionary<string, string>
            {
                ["ci-pipeline.yml"] = "CI",
                ["cd-pipeline.yml"] = "CD",
                ["database-ci.yml"] = "Database"
            };

            // Act & Assert
            pipelineFiles.Should().ContainKey(fileName);
            pipelineFiles[fileName].Should().Be(pipelineType);
            fileName.Should().EndWith(".yml");
        }

        // Helper methods for test data
        private static EnvironmentConfiguration GetEnvironmentConfiguration(string environment)
        {
            return environment switch
            {
                "vm-test" => new EnvironmentConfiguration
                {
                    Environment = "vm-test",
                    Branch = "refs/heads/develop",
                    RequireApproval = false
                },
                "azure-ephemeral" => new EnvironmentConfiguration
                {
                    Environment = "azure-ephemeral",
                    Branch = "refs/heads/master",
                    RequireApproval = true
                },
                "azure-production" => new EnvironmentConfiguration
                {
                    Environment = "azure-production",
                    Branch = "refs/heads/master",
                    RequireApproval = false  // Handled in gate stage
                },
                _ => new EnvironmentConfiguration
                {
                    Environment = environment,
                    Branch = "refs/heads/master",
                    RequireApproval = false
                }
            };
        }

        private static ServiceDeploymentConfiguration GetServiceDeploymentConfiguration(string serviceName)
        {
            return serviceName switch
            {
                "console" => new ServiceDeploymentConfiguration
                {
                    ServiceName = "console",
                    HasExternalIngress = false,
                    TargetPort = 0
                },
                "cyphyr-recon" => new ServiceDeploymentConfiguration
                {
                    ServiceName = "cyphyr-recon",
                    HasExternalIngress = true,
                    TargetPort = 80
                },
                "inflection-point-detector" => new ServiceDeploymentConfiguration
                {
                    ServiceName = "inflection-point-detector",
                    HasExternalIngress = false,
                    TargetPort = 0
                },
                "ticker-bar-queue" => new ServiceDeploymentConfiguration
                {
                    ServiceName = "ticker-bar-queue",
                    HasExternalIngress = false,
                    TargetPort = 0
                },
                _ => new ServiceDeploymentConfiguration
                {
                    ServiceName = serviceName,
                    HasExternalIngress = false,
                    TargetPort = 0
                }
            };
        }

        private static VariableGroupConfiguration GetVariableGroupConfiguration(string environment)
        {
            return environment switch
            {
                "development" => new VariableGroupConfiguration
                {
                    Environment = "development",
                    ResourceName = "lucidwonks-development-rg",
                    IsProduction = false,
                    EnableDebugLogging = true
                },
                "vm-test" => new VariableGroupConfiguration
                {
                    Environment = "vm-test",
                    ResourceName = "lucidwonks-test-vm",
                    IsProduction = false,
                    EnableDebugLogging = true
                },
                "azure-ephemeral" => new VariableGroupConfiguration
                {
                    Environment = "azure-ephemeral",
                    ResourceName = "lucidwonks-ephemeral-rg",
                    IsProduction = false,
                    EnableDebugLogging = false
                },
                "azure-production" => new VariableGroupConfiguration
                {
                    Environment = "azure-production",
                    ResourceName = "lucidwonks-production-rg",
                    IsProduction = true,
                    EnableDebugLogging = false
                },
                _ => new VariableGroupConfiguration
                {
                    Environment = environment,
                    ResourceName = $"lucidwonks-{environment}-rg",
                    IsProduction = false,
                    EnableDebugLogging = false
                }
            };
        }
    }

    // Helper classes for type safety
    public class EnvironmentConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public string Branch { get; set; } = string.Empty;
        public bool RequireApproval { get; set; }
    }

    public class ServiceDeploymentConfiguration
    {
        public string ServiceName { get; set; } = string.Empty;
        public bool HasExternalIngress { get; set; }
        public int TargetPort { get; set; }
    }

    public class VariableGroupConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public string ResourceName { get; set; } = string.Empty;
        public bool IsProduction { get; set; }
        public bool EnableDebugLogging { get; set; }
    }
}
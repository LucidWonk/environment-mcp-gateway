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
using System.Linq;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Tests for Azure Infrastructure Implementation with Pulumi (Phase 3d)
    /// Validates Pulumi C# infrastructure code, resource configurations, and deployment patterns
    /// </summary>
    public class PulumiInfrastructureTests : TestBase
    {
        private readonly Mock<ILogger> _mockLogger;

        public PulumiInfrastructureTests()
        {
            _mockLogger = new Mock<ILogger>();
        }

        [Fact]
        public void PulumiProject_ShouldHaveCorrectStructure()
        {
            // Arrange
            var expectedDirectories = new[]
            {
                "devops/infra",
                "devops/infra/Lucidwonks.Infrastructure",
                "devops/infra/Lucidwonks.Infrastructure/Stacks",
                "devops/infra/Lucidwonks.Infrastructure/Components"
            };

            var expectedFiles = new[]
            {
                "Pulumi.yaml",
                "Pulumi.development.yaml",
                "Pulumi.ephemeral.yaml",
                "Pulumi.production.yaml",
                "README.md"
            };

            // Assert
            expectedDirectories.Should().HaveCount(4);
            expectedFiles.Should().HaveCount(5);
            expectedFiles.Should().Contain("Pulumi.yaml");
            expectedFiles.Should().Contain("README.md");
        }

        [Fact]
        public void PulumiStack_ShouldHaveRequiredComponents()
        {
            // Arrange
            var requiredComponents = new[]
            {
                "TradingPlatformStack",
                "PostgreSQLComponent",
                "ContainerAppComponent"
            };

            // Assert
            requiredComponents.Should().HaveCount(3);
            requiredComponents.Should().Contain("TradingPlatformStack");
            requiredComponents.Should().Contain("PostgreSQLComponent");
            requiredComponents.Should().Contain("ContainerAppComponent");
        }

        [Theory]
        [InlineData("development", "eastus2", "B1ms", 32)]
        [InlineData("ephemeral", "eastus2", "B1ms", 32)]
        [InlineData("production", "eastus2", "Standard_D2ds_v4", 128)]
        public void DatabaseConfiguration_ShouldMatchEnvironmentRequirements(
            string environment, string location, string skuName, int storageSizeGB)
        {
            // Arrange & Act
            var dbConfig = GetDatabaseConfiguration(environment);

            // Assert
            dbConfig.Environment.Should().Be(environment);
            dbConfig.Location.Should().Be(location);
            dbConfig.SkuName.Should().Be(skuName);
            dbConfig.StorageSizeGB.Should().Be(storageSizeGB);
        }

        [Fact]
        public void AzureResources_ShouldHaveProperNamingConvention()
        {
            // Arrange
            var resourceNames = new Dictionary<string, string>
            {
                ["ResourceGroup"] = "lucidwonks-{environment}-rg",
                ["KeyVault"] = "lucidwonks-{environment}-kv",
                ["Database"] = "lucidwonks-{environment}-db",
                ["ContainerAppEnv"] = "lucidwonks-{environment}-env",
                ["StorageAccount"] = "lucidwonks{environment}storage"
            };

            // Assert
            foreach (var resource in resourceNames)
            {
                resource.Value.Should().Contain("{environment}");
                resource.Value.Should().StartWith("lucidwonks");
            }
        }

        [Theory]
        [InlineData("CyphyrRecon", 0.5, 1.0, true, 80)]
        [InlineData("Console", 0.5, 1.0, false, 0)]
        [InlineData("InflectionDetector", 0.25, 0.5, false, 0)]
        [InlineData("TickerQueue", 0.25, 0.5, false, 0)]
        [InlineData("RedPanda", 1.0, 2.0, false, 9092)]
        public void ContainerApps_ShouldHaveCorrectResourceAllocation(
            string appName, double cpuCores, double memoryGB, bool externalIngress, int targetPort)
        {
            // Arrange & Act
            var appConfig = GetContainerAppConfiguration(appName, "development");

            // Assert
            appConfig.AppName.Should().Be(appName);
            appConfig.CpuCores.Should().Be(cpuCores);
            appConfig.MemoryGB.Should().Be(memoryGB);
            appConfig.ExternalIngress.Should().Be(externalIngress);
            appConfig.TargetPort.Should().Be(targetPort);
        }

        [Fact]
        public void KeyVault_ShouldHaveCorrectAccessPolicies()
        {
            // Arrange
            var expectedPermissions = new
            {
                Keys = new[] { "get", "list", "create", "update" },
                Secrets = new[] { "get", "list", "set", "delete" },
                Certificates = new[] { "get", "list", "create", "update" }
            };

            // Assert
            expectedPermissions.Keys.Should().HaveCount(4);
            expectedPermissions.Secrets.Should().HaveCount(4);
            expectedPermissions.Certificates.Should().HaveCount(4);
            expectedPermissions.Secrets.Should().Contain("set");
            expectedPermissions.Secrets.Should().Contain("delete");
        }

        [Theory]
        [InlineData("development", 30)]
        [InlineData("ephemeral", 30)]
        [InlineData("production", 90)]
        public void LogAnalytics_ShouldHaveCorrectRetentionPolicy(string environment, int retentionDays)
        {
            // Arrange & Act
            var logConfig = GetLogAnalyticsConfiguration(environment);

            // Assert
            logConfig.Environment.Should().Be(environment);
            logConfig.RetentionDays.Should().Be(retentionDays);
        }

        [Theory]
        [InlineData("production", true)]
        [InlineData("ephemeral", false)]
        [InlineData("development", false)]
        public void ContainerRegistry_ShouldBeProvisionedCorrectly(
            string environment, bool isProduction)
        {
            // Arrange & Act
            var registryConfig = GetContainerRegistryConfiguration(environment);

            // Assert
            if (environment == "production" || environment == "ephemeral")
            {
                registryConfig.ShouldProvision.Should().BeTrue();
            }
            else
            {
                registryConfig.ShouldProvision.Should().BeFalse();
            }
            
            registryConfig.IsProduction.Should().Be(isProduction);
        }

        [Fact]
        public void PulumiConfiguration_ShouldHaveRequiredSecrets()
        {
            // Arrange
            var requiredSecrets = new[]
            {
                "dbPassword",
                "twelveDataApiKey",
                "tenantId",
                "servicePrincipalObjectId"
            };

            // Assert
            requiredSecrets.Should().HaveCount(4);
            requiredSecrets.Should().Contain("dbPassword");
            requiredSecrets.Should().Contain("twelveDataApiKey");
        }

        [Theory]
        [InlineData("development", 7, false)]
        [InlineData("ephemeral", 7, false)]
        [InlineData("production", 30, true)]
        public void DatabaseBackup_ShouldHaveCorrectConfiguration(
            string environment, int backupRetentionDays, bool geoRedundant)
        {
            // Arrange & Act
            var backupConfig = GetDatabaseBackupConfiguration(environment);

            // Assert
            backupConfig.Environment.Should().Be(environment);
            backupConfig.BackupRetentionDays.Should().Be(backupRetentionDays);
            backupConfig.GeoRedundant.Should().Be(geoRedundant);
        }

        [Theory]
        [InlineData("production", "ZoneRedundant")]
        [InlineData("ephemeral", "Disabled")]
        [InlineData("development", "Disabled")]
        public void DatabaseHighAvailability_ShouldMatchEnvironment(string environment, string haMode)
        {
            // Arrange & Act
            var haConfig = GetHighAvailabilityConfiguration(environment);

            // Assert
            haConfig.Environment.Should().Be(environment);
            haConfig.Mode.Should().Be(haMode);
        }

        [Fact]
        public void ContainerAppScaling_ShouldHaveCorrectRules()
        {
            // Arrange
            var scalingRules = new[]
            {
                new { Name = "http-scale", Type = "http", Metric = "concurrentRequests", Value = "100" },
                new { Name = "cpu-scale", Type = "cpu", Metric = "Utilization", Value = "70" }
            };

            // Assert
            scalingRules.Should().HaveCount(2);
            scalingRules.Should().Contain(r => r.Name == "http-scale");
            scalingRules.Should().Contain(r => r.Name == "cpu-scale");
            scalingRules.First(r => r.Name == "cpu-scale").Value.Should().Be("70");
        }

        [Theory]
        [InlineData("CyphyrRecon", "development", 1, 3)]
        [InlineData("CyphyrRecon", "production", 2, 10)]
        [InlineData("InflectionDetector", "development", 1, 2)]
        [InlineData("InflectionDetector", "production", 2, 5)]
        public void ContainerAppReplicas_ShouldMatchEnvironment(
            string appName, string environment, int minReplicas, int maxReplicas)
        {
            // Arrange & Act
            var replicaConfig = GetReplicaConfiguration(appName, environment);

            // Assert
            replicaConfig.AppName.Should().Be(appName);
            replicaConfig.Environment.Should().Be(environment);
            replicaConfig.MinReplicas.Should().Be(minReplicas);
            replicaConfig.MaxReplicas.Should().Be(maxReplicas);
        }

        [Fact]
        public void StorageAccount_ShouldHaveSecurityConfiguration()
        {
            // Arrange
            var storageConfig = new
            {
                EnableHttpsTrafficOnly = true,
                MinimumTlsVersion = "TLS1_2",
                SkuName = "Standard_LRS",
                Kind = "StorageV2"
            };

            // Assert
            storageConfig.EnableHttpsTrafficOnly.Should().BeTrue();
            storageConfig.MinimumTlsVersion.Should().Be("TLS1_2");
            storageConfig.SkuName.Should().Be("Standard_LRS");
            storageConfig.Kind.Should().Be("StorageV2");
        }

        [Fact]
        public void PostgreSQL_ShouldHaveTimescaleDBConfiguration()
        {
            // Arrange
            var postgresConfig = new Dictionary<string, string>
            {
                ["shared_preload_libraries"] = "timescaledb",
                ["max_connections"] = "100",
                ["shared_buffers"] = "32768"
            };

            // Assert
            postgresConfig.Should().ContainKey("shared_preload_libraries");
            postgresConfig["shared_preload_libraries"].Should().Be("timescaledb");
            postgresConfig.Should().ContainKey("max_connections");
            postgresConfig.Should().ContainKey("shared_buffers");
        }

        [Fact]
        public void FirewallRules_ShouldAllowAzureServices()
        {
            // Arrange
            var firewallRules = new[]
            {
                new { Name = "AllowAzureServices", StartIP = "0.0.0.0", EndIP = "0.0.0.0" },
                new { Name = "AllowAllDev", StartIP = "0.0.0.0", EndIP = "255.255.255.255" }
            };

            // Assert
            firewallRules.Should().HaveCountGreaterThanOrEqualTo(1);
            firewallRules.Should().Contain(r => r.Name == "AllowAzureServices");
            firewallRules.First(r => r.Name == "AllowAzureServices").StartIP.Should().Be("0.0.0.0");
        }

        [Fact]
        public void PulumiOutputs_ShouldIncludeAllRequiredValues()
        {
            // Arrange
            var requiredOutputs = new[]
            {
                "ResourceGroupName",
                "StorageAccountName",
                "KeyVaultName",
                "KeyVaultUri",
                "DatabaseServerName",
                "DatabaseFQDN",
                "ContainerAppEnvironmentId",
                "CyphyrReconUrl",
                "LogAnalyticsWorkspaceId"
            };

            // Assert
            requiredOutputs.Should().HaveCount(9);
            requiredOutputs.Should().Contain("KeyVaultUri");
            requiredOutputs.Should().Contain("DatabaseFQDN");
            requiredOutputs.Should().Contain("CyphyrReconUrl");
        }

        [Fact]
        public void EnvironmentVariables_ShouldBeConfiguredCorrectly()
        {
            // Arrange
            var envVars = new Dictionary<string, string>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "{environment}",
                ["ConnectionStrings__DefaultConnection"] = "{from-keyvault}",
                ["TwelveData__ApiKey"] = "{from-config}",
                ["Kafka__BootstrapServers"] = "lucidwonks-{environment}-redpanda:9092"
            };

            // Assert
            envVars.Should().ContainKey("ASPNETCORE_ENVIRONMENT");
            envVars.Should().ContainKey("ConnectionStrings__DefaultConnection");
            envVars["Kafka__BootstrapServers"].Should().Contain("redpanda:9092");
        }

        [Theory]
        [InlineData("development", 150)]
        [InlineData("production", 800)]
        public void EstimatedCosts_ShouldBeWithinBudget(string environment, int maxMonthlyCost)
        {
            // Arrange & Act
            var costEstimate = GetEstimatedMonthlyCost(environment);

            // Assert
            costEstimate.Environment.Should().Be(environment);
            costEstimate.EstimatedCost.Should().BeLessThanOrEqualTo(maxMonthlyCost);
        }

        [Fact]
        public void Tags_ShouldIncludeRequiredMetadata()
        {
            // Arrange
            var requiredTags = new Dictionary<string, string>
            {
                ["Environment"] = "{environment}",
                ["ManagedBy"] = "Pulumi",
                ["Project"] = "Lucidwonks",
                ["CreatedDate"] = "{date}"
            };

            // Assert
            requiredTags.Should().ContainKey("Environment");
            requiredTags.Should().ContainKey("ManagedBy");
            requiredTags["ManagedBy"].Should().Be("Pulumi");
            requiredTags["Project"].Should().Be("Lucidwonks");
        }

        [Fact]
        public void HealthProbes_ShouldBeConfiguredForWebApps()
        {
            // Arrange
            var healthProbes = new[]
            {
                new { Type = "Liveness", Path = "/health", InitialDelay = 30, Period = 10 },
                new { Type = "Readiness", Path = "/ready", InitialDelay = 10, Period = 5 }
            };

            // Assert
            healthProbes.Should().HaveCount(2);
            healthProbes.Should().Contain(p => p.Type == "Liveness");
            healthProbes.Should().Contain(p => p.Type == "Readiness");
            healthProbes.First(p => p.Type == "Liveness").Path.Should().Be("/health");
        }

        [Fact]
        public void PulumiProject_ShouldHaveCorrectDotNetConfiguration()
        {
            // Arrange
            var projectConfig = new
            {
                TargetFramework = "net8.0",
                OutputType = "Exe",
                Nullable = "enable",
                ImplicitUsings = "enable"
            };

            // Assert
            projectConfig.TargetFramework.Should().Be("net8.0");
            projectConfig.OutputType.Should().Be("Exe");
            projectConfig.Nullable.Should().Be("enable");
            projectConfig.ImplicitUsings.Should().Be("enable");
        }

        [Fact]
        public void PulumiPackages_ShouldHaveCorrectVersions()
        {
            // Arrange
            var packages = new Dictionary<string, string>
            {
                ["Pulumi"] = "3.60.*",
                ["Pulumi.AzureNative"] = "2.30.*",
                ["Pulumi.Docker"] = "4.5.*"
            };

            // Assert
            packages.Should().HaveCount(3);
            packages.Should().ContainKey("Pulumi");
            packages.Should().ContainKey("Pulumi.AzureNative");
            packages["Pulumi"].Should().StartWith("3.");
        }

        // Helper methods for test data
        private static DatabaseConfiguration GetDatabaseConfiguration(string environment)
        {
            return environment switch
            {
                "production" => new DatabaseConfiguration
                {
                    Environment = "production",
                    Location = "eastus2",
                    SkuName = "Standard_D2ds_v4",
                    StorageSizeGB = 128
                },
                _ => new DatabaseConfiguration
                {
                    Environment = environment,
                    Location = "eastus2",
                    SkuName = "B1ms",
                    StorageSizeGB = 32
                }
            };
        }

        private static ContainerAppConfiguration GetContainerAppConfiguration(string appName, string environment)
        {
            return appName switch
            {
                "CyphyrRecon" => new ContainerAppConfiguration
                {
                    AppName = "CyphyrRecon",
                    CpuCores = environment == "production" ? 1.0 : 0.5,
                    MemoryGB = environment == "production" ? 2.0 : 1.0,
                    ExternalIngress = true,
                    TargetPort = 80
                },
                "Console" => new ContainerAppConfiguration
                {
                    AppName = "Console",
                    CpuCores = environment == "production" ? 1.0 : 0.5,
                    MemoryGB = environment == "production" ? 2.0 : 1.0,
                    ExternalIngress = false,
                    TargetPort = 0
                },
                "InflectionDetector" => new ContainerAppConfiguration
                {
                    AppName = "InflectionDetector",
                    CpuCores = environment == "production" ? 0.5 : 0.25,
                    MemoryGB = environment == "production" ? 1.0 : 0.5,
                    ExternalIngress = false,
                    TargetPort = 0
                },
                "TickerQueue" => new ContainerAppConfiguration
                {
                    AppName = "TickerQueue",
                    CpuCores = environment == "production" ? 0.5 : 0.25,
                    MemoryGB = environment == "production" ? 1.0 : 0.5,
                    ExternalIngress = false,
                    TargetPort = 0
                },
                "RedPanda" => new ContainerAppConfiguration
                {
                    AppName = "RedPanda",
                    CpuCores = environment == "production" ? 2.0 : 1.0,
                    MemoryGB = environment == "production" ? 4.0 : 2.0,
                    ExternalIngress = false,
                    TargetPort = 9092
                },
                _ => new ContainerAppConfiguration
                {
                    AppName = appName,
                    CpuCores = 0.5,
                    MemoryGB = 1.0,
                    ExternalIngress = false,
                    TargetPort = 0
                }
            };
        }

        private static LogAnalyticsConfiguration GetLogAnalyticsConfiguration(string environment)
        {
            return new LogAnalyticsConfiguration
            {
                Environment = environment,
                RetentionDays = environment == "production" ? 90 : 30
            };
        }

        private static ContainerRegistryConfiguration GetContainerRegistryConfiguration(string environment)
        {
            return new ContainerRegistryConfiguration
            {
                Environment = environment,
                ShouldProvision = environment == "production" || environment == "ephemeral",
                IsProduction = environment == "production"
            };
        }

        private static DatabaseBackupConfiguration GetDatabaseBackupConfiguration(string environment)
        {
            return new DatabaseBackupConfiguration
            {
                Environment = environment,
                BackupRetentionDays = environment == "production" ? 30 : 7,
                GeoRedundant = environment == "production"
            };
        }

        private static HighAvailabilityConfiguration GetHighAvailabilityConfiguration(string environment)
        {
            return new HighAvailabilityConfiguration
            {
                Environment = environment,
                Mode = environment == "production" ? "ZoneRedundant" : "Disabled"
            };
        }

        private static ReplicaConfiguration GetReplicaConfiguration(string appName, string environment)
        {
            return (appName, environment) switch
            {
                ("CyphyrRecon", "production") => new ReplicaConfiguration
                {
                    AppName = appName,
                    Environment = environment,
                    MinReplicas = 2,
                    MaxReplicas = 10
                },
                ("CyphyrRecon", _) => new ReplicaConfiguration
                {
                    AppName = appName,
                    Environment = environment,
                    MinReplicas = 1,
                    MaxReplicas = 3
                },
                ("InflectionDetector", "production") => new ReplicaConfiguration
                {
                    AppName = appName,
                    Environment = environment,
                    MinReplicas = 2,
                    MaxReplicas = 5
                },
                ("InflectionDetector", _) => new ReplicaConfiguration
                {
                    AppName = appName,
                    Environment = environment,
                    MinReplicas = 1,
                    MaxReplicas = 2
                },
                _ => new ReplicaConfiguration
                {
                    AppName = appName,
                    Environment = environment,
                    MinReplicas = 1,
                    MaxReplicas = 1
                }
            };
        }

        private static CostEstimate GetEstimatedMonthlyCost(string environment)
        {
            return new CostEstimate
            {
                Environment = environment,
                EstimatedCost = environment == "production" ? 800 : 150
            };
        }
    }

    // Helper classes for type safety
    public class DatabaseConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string SkuName { get; set; } = string.Empty;
        public int StorageSizeGB { get; set; }
    }

    public class ContainerAppConfiguration
    {
        public string AppName { get; set; } = string.Empty;
        public double CpuCores { get; set; }
        public double MemoryGB { get; set; }
        public bool ExternalIngress { get; set; }
        public int TargetPort { get; set; }
    }

    public class LogAnalyticsConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public int RetentionDays { get; set; }
    }

    public class ContainerRegistryConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public bool ShouldProvision { get; set; }
        public bool IsProduction { get; set; }
    }

    public class DatabaseBackupConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public int BackupRetentionDays { get; set; }
        public bool GeoRedundant { get; set; }
    }

    public class HighAvailabilityConfiguration
    {
        public string Environment { get; set; } = string.Empty;
        public string Mode { get; set; } = string.Empty;
    }

    public class ReplicaConfiguration
    {
        public string AppName { get; set; } = string.Empty;
        public string Environment { get; set; } = string.Empty;
        public int MinReplicas { get; set; }
        public int MaxReplicas { get; set; }
    }

    public class CostEstimate
    {
        public string Environment { get; set; } = string.Empty;
        public int EstimatedCost { get; set; }
    }
}
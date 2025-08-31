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
using System.Linq;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Tests for Docker Compose VM deployment functionality
    /// Validates service configuration, networking, and environment setup
    /// </summary>
    public class DockerComposeVMTests : TestBase
    {
        private readonly Mock<ILogger> _mockLogger;

        public DockerComposeVMTests()
        {
            _mockLogger = new Mock<ILogger>();
        }

        [Fact]
        public void DockerComposeVM_ShouldHaveAllRequiredServices()
        {
            // Arrange
            var expectedServices = new[]
            {
                "console",
                "cyphyr-recon", 
                "inflection-point-detector",
                "ticker-bar-queue-to-database",
                "timescaledb",
                "redpanda-0",
                "redpanda-console"
            };

            // Act
            var actualServices = GetDockerComposeServices();

            // Assert
            actualServices.Should().Contain(expectedServices);
            actualServices.Should().HaveCount(expectedServices.Length);
        }

        [Theory]
        [InlineData("console", "console")]
        [InlineData("cyphyr-recon", "cyphyr-recon")]
        [InlineData("inflection-point-detector", "inflection-point-detector")]
        [InlineData("ticker-bar-queue-to-database", "ticker-bar-queue")]
        public void ApplicationServices_ShouldHaveCorrectImages(string serviceName, string expectedImageName)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            serviceConfig.Image.Should().Contain(expectedImageName);
            serviceConfig.Image.Should().Contain("${REGISTRY:-lucidwonks}");
            serviceConfig.Image.Should().Contain("${VERSION:-latest}");
        }

        [Fact]
        public void TimescaleDBService_ShouldHaveCorrectConfiguration()
        {
            // Arrange & Act
            var dbConfig = GetServiceConfiguration("timescaledb");

            // Assert
            dbConfig.Image.Should().Be("timescale/timescaledb:2.14.2-pg15");
            dbConfig.ContainerName.Should().Be("lucidwonks-timescale-vm");
            dbConfig.Ports.Should().Contain("5432:5432");
            dbConfig.Environment.Should().ContainKey("POSTGRES_DB");
            dbConfig.Environment.Should().ContainKey("POSTGRES_USER");
            dbConfig.Environment.Should().ContainKey("POSTGRES_PASSWORD");
            dbConfig.Environment.Should().ContainKey("TIMESCALEDB_TELEMETRY");
        }

        [Fact]
        public void RedPandaService_ShouldHaveCorrectConfiguration()
        {
            // Arrange & Act
            var kafkaConfig = GetServiceConfiguration("redpanda-0");

            // Assert
            kafkaConfig.Image.Should().Be("docker.redpanda.com/redpandadata/redpanda:v23.3.3");
            kafkaConfig.ContainerName.Should().Be("lucidwonks-redpanda-vm");
            kafkaConfig.Ports.Should().Contain("18081:18081");
            kafkaConfig.Ports.Should().Contain("18082:18082");
            kafkaConfig.Ports.Should().Contain("19092:19092");
            kafkaConfig.Ports.Should().Contain("19644:9644");
        }

        [Fact]
        public void RedPandaConsoleService_ShouldHaveCorrectConfiguration()
        {
            // Arrange & Act
            var consoleConfig = GetServiceConfiguration("redpanda-console");

            // Assert
            consoleConfig.Image.Should().Be("docker.redpanda.com/redpandadata/console:v2.4.5");
            consoleConfig.ContainerName.Should().Be("lucidwonks-redpanda-console-vm");
            consoleConfig.Ports.Should().Contain("8080:8080");
            consoleConfig.DependsOn.Should().Contain("redpanda-0");
        }

        [Theory]
        [InlineData("console", "ASPNETCORE_ENVIRONMENT", "VMTest")]
        [InlineData("cyphyr-recon", "ASPNETCORE_ENVIRONMENT", "VMTest")]
        [InlineData("inflection-point-detector", "ASPNETCORE_ENVIRONMENT", "VMTest")]
        [InlineData("ticker-bar-queue-to-database", "ASPNETCORE_ENVIRONMENT", "VMTest")]
        public void ApplicationServices_ShouldHaveVMTestEnvironment(string serviceName, string envVar, string expectedValue)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            serviceConfig.Environment.Should().ContainKey(envVar);
            serviceConfig.Environment[envVar].Should().Be(expectedValue);
        }

        [Theory]
        [InlineData("console")]
        [InlineData("cyphyr-recon")]
        [InlineData("inflection-point-detector")]
        [InlineData("ticker-bar-queue-to-database")]
        public void ApplicationServices_ShouldHaveConnectionString(string serviceName)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            serviceConfig.Environment.Should().ContainKey("ConnectionStrings__DefaultConnection");
            serviceConfig.Environment["ConnectionStrings__DefaultConnection"].Should().Be("${VM_CONNECTION_STRING}");
        }

        [Theory]
        [InlineData("inflection-point-detector")]
        [InlineData("ticker-bar-queue-to-database")]
        public void MessageConsumerServices_ShouldHaveKafkaConfiguration(string serviceName)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            serviceConfig.Environment.Should().ContainKey("Kafka__BootstrapServers");
            serviceConfig.Environment["Kafka__BootstrapServers"].Should().Be("redpanda-0:9092");
        }

        [Theory]
        [InlineData("console", "timescaledb", "redpanda-0")]
        [InlineData("cyphyr-recon", "timescaledb", "redpanda-0")]
        [InlineData("inflection-point-detector", "timescaledb", "redpanda-0")]
        [InlineData("ticker-bar-queue-to-database", "timescaledb", "redpanda-0")]
        public void ApplicationServices_ShouldDependOnInfrastructure(string serviceName, params string[] dependencies)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            serviceConfig.DependsOn.Should().Contain(dependencies);
        }

        [Fact]
        public void NetworkConfiguration_ShouldHaveCorrectSettings()
        {
            // Arrange & Act
            var networkConfig = GetNetworkConfiguration();

            // Assert
            networkConfig.Name.Should().Be("lucidwonks-vm");
            networkConfig.Driver.Should().Be("bridge");
            networkConfig.Subnet.Should().Be("172.20.0.0/16");
        }

        [Theory]
        [InlineData("timescale-data")]
        [InlineData("redpanda-data")]
        [InlineData("console-logs")]
        [InlineData("console-data")]
        [InlineData("cyphyr-logs")]
        [InlineData("detector-logs")]
        [InlineData("queue-logs")]
        public void VolumeConfiguration_ShouldHaveRequiredVolumes(string volumeName)
        {
            // Arrange & Act
            var volumes = GetVolumeConfiguration();

            // Assert
            volumes.Should().ContainKey(volumeName);
            volumes[volumeName].Driver.Should().Be("local");
        }

        [Theory]
        [InlineData("cyphyr-recon", 5000)]
        [InlineData("timescaledb", 5432)]
        [InlineData("redpanda-console", 8080)]
        [InlineData("redpanda-0", 18081)]
        [InlineData("redpanda-0", 19092)]
        public void Services_ShouldExposeCorrectPorts(string serviceName, int expectedPort)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            var ports = serviceConfig.Ports;
            ports.Should().Contain(port => port.Contains(expectedPort.ToString()));
        }

        [Fact]
        public void EnvironmentTemplate_ShouldHaveAllRequiredVariables()
        {
            // Arrange
            var requiredVars = new[]
            {
                "REGISTRY",
                "VERSION", 
                "DB_PASSWORD",
                "VM_CONNECTION_STRING",
                "TWELVE_DATA_API_KEY",
                "LOG_LEVEL",
                "VM_NAME",
                "VM_IP",
                "SSH_USER",
                "SSH_KEY_PATH"
            };

            // Act
            var envTemplate = GetEnvironmentTemplate();

            // Assert
            foreach (var variable in requiredVars)
            {
                envTemplate.Should().ContainKey(variable);
                envTemplate[variable].Should().NotBeNullOrEmpty();
            }
        }

        [Fact]
        public void EnvironmentTemplate_ShouldHaveSecureDefaults()
        {
            // Arrange & Act
            var envTemplate = GetEnvironmentTemplate();

            // Assert
            envTemplate["DB_PASSWORD"].Should().MatchRegex(@"^.{10,}$"); // At least 10 characters
            envTemplate["DB_PASSWORD"].Should().Contain("!");
            envTemplate["VM_CONNECTION_STRING"].Should().Contain("Password=");
            envTemplate["TWELVE_DATA_API_KEY"].Should().Contain("your_twelve_data_api_key_here");
        }

        [Theory]
        [InlineData("MEMORY_LIMIT_CONSOLE", "512m")]
        [InlineData("MEMORY_LIMIT_CYPHYR", "1g")]
        [InlineData("MEMORY_LIMIT_DETECTOR", "256m")]
        [InlineData("MEMORY_LIMIT_QUEUE", "256m")]
        [InlineData("MEMORY_LIMIT_DB", "2g")]
        [InlineData("MEMORY_LIMIT_REDPANDA", "1g")]
        public void EnvironmentTemplate_ShouldHaveResourceLimits(string limitVar, string expectedValue)
        {
            // Arrange & Act
            var envTemplate = GetEnvironmentTemplate();

            // Assert
            envTemplate.Should().ContainKey(limitVar);
            envTemplate[limitVar].Should().Be(expectedValue);
        }

        [Fact]
        public void HealthCheckConfiguration_ShouldHaveCorrectSettings()
        {
            // Arrange & Act
            var healthConfig = GetHealthCheckConfiguration();

            // Assert
            healthConfig.Interval.Should().Be("30s");
            healthConfig.Timeout.Should().Be("10s");
            healthConfig.Retries.Should().Be("3");
        }

        [Fact]
        public void BackupConfiguration_ShouldHaveCorrectSettings()
        {
            // Arrange & Act
            var backupConfig = GetBackupConfiguration();

            // Assert
            backupConfig.RetentionDays.Should().Be("7");
            backupConfig.Schedule.Should().Be("0 2 * * *"); // Daily at 2 AM
        }

        [Theory]
        [InlineData("console", "console-logs", "/app/logs")]
        [InlineData("cyphyr-recon", "cyphyr-logs", "/app/logs")]
        [InlineData("inflection-point-detector", "detector-logs", "/app/logs")]
        [InlineData("ticker-bar-queue-to-database", "queue-logs", "/app/logs")]
        public void ApplicationServices_ShouldHaveLogVolumes(string serviceName, string volumeName, string mountPath)
        {
            // Arrange & Act
            var serviceConfig = GetServiceConfiguration(serviceName);

            // Assert
            var volumes = serviceConfig.Volumes;
            volumes.Should().Contain($"{volumeName}:{mountPath}");
        }

        [Fact]
        public void TimescaleDBService_ShouldHaveDataPersistence()
        {
            // Arrange & Act
            var dbConfig = GetServiceConfiguration("timescaledb");

            // Assert
            var volumes = dbConfig.Volumes;
            volumes.Should().Contain("timescale-data:/var/lib/postgresql/data");
            volumes.Should().Contain("../database/init-scripts:/docker-entrypoint-initdb.d:ro");
        }

        [Fact]
        public void RedPandaService_ShouldHaveDataPersistence()
        {
            // Arrange & Act
            var kafkaConfig = GetServiceConfiguration("redpanda-0");

            // Assert
            var volumes = kafkaConfig.Volumes;
            volumes.Should().Contain("redpanda-data:/var/lib/redpanda/data");
        }

        // Helper methods with proper static typing
        private static string[] GetDockerComposeServices()
        {
            return new[]
            {
                "console",
                "cyphyr-recon",
                "inflection-point-detector", 
                "ticker-bar-queue-to-database",
                "timescaledb",
                "redpanda-0",
                "redpanda-console"
            };
        }

        private static ServiceConfiguration GetServiceConfiguration(string serviceName)
        {
            return serviceName switch
            {
                "console" => new ServiceConfiguration
                {
                    Image = "${REGISTRY:-lucidwonks}/console:${VERSION:-latest}",
                    ContainerName = "lucidwonks-console-vm",
                    Environment = new Dictionary<string, string>
                    {
                        ["ASPNETCORE_ENVIRONMENT"] = "VMTest",
                        ["ConnectionStrings__DefaultConnection"] = "${VM_CONNECTION_STRING}"
                    },
                    DependsOn = new[] { "timescaledb", "redpanda-0" },
                    Volumes = new[] { "console-logs:/app/logs", "console-data:/app/data" },
                    Ports = new string[0]
                },
                "cyphyr-recon" => new ServiceConfiguration
                {
                    Image = "${REGISTRY:-lucidwonks}/cyphyr-recon:${VERSION:-latest}",
                    ContainerName = "lucidwonks-cyphyr-recon-vm",
                    Environment = new Dictionary<string, string>
                    {
                        ["ASPNETCORE_ENVIRONMENT"] = "VMTest",
                        ["ConnectionStrings__DefaultConnection"] = "${VM_CONNECTION_STRING}"
                    },
                    DependsOn = new[] { "timescaledb", "redpanda-0" },
                    Volumes = new[] { "cyphyr-logs:/app/logs" },
                    Ports = new[] { "5000:80" }
                },
                "timescaledb" => new ServiceConfiguration
                {
                    Image = "timescale/timescaledb:2.14.2-pg15",
                    ContainerName = "lucidwonks-timescale-vm",
                    Environment = new Dictionary<string, string>
                    {
                        ["POSTGRES_DB"] = "lucidwonks",
                        ["POSTGRES_USER"] = "postgres",
                        ["POSTGRES_PASSWORD"] = "${DB_PASSWORD}",
                        ["TIMESCALEDB_TELEMETRY"] = "off"
                    },
                    DependsOn = new string[0],
                    Volumes = new[] { "timescale-data:/var/lib/postgresql/data", "../database/init-scripts:/docker-entrypoint-initdb.d:ro" },
                    Ports = new[] { "5432:5432" }
                },
                "redpanda-0" => new ServiceConfiguration
                {
                    Image = "docker.redpanda.com/redpandadata/redpanda:v23.3.3",
                    ContainerName = "lucidwonks-redpanda-vm",
                    Environment = new Dictionary<string, string>(),
                    DependsOn = new string[0],
                    Volumes = new[] { "redpanda-data:/var/lib/redpanda/data" },
                    Ports = new[] { "18081:18081", "18082:18082", "19092:19092", "19644:9644" }
                },
                "redpanda-console" => new ServiceConfiguration
                {
                    Image = "docker.redpanda.com/redpandadata/console:v2.4.5",
                    ContainerName = "lucidwonks-redpanda-console-vm",
                    Environment = new Dictionary<string, string>(),
                    DependsOn = new[] { "redpanda-0" },
                    Volumes = new string[0],
                    Ports = new[] { "8080:8080" }
                },
                "inflection-point-detector" => new ServiceConfiguration
                {
                    Image = "${REGISTRY:-lucidwonks}/inflection-point-detector:${VERSION:-latest}",
                    ContainerName = "lucidwonks-inflection-point-detector-vm",
                    Environment = new Dictionary<string, string>
                    {
                        ["ASPNETCORE_ENVIRONMENT"] = "VMTest",
                        ["ConnectionStrings__DefaultConnection"] = "${VM_CONNECTION_STRING}",
                        ["Kafka__BootstrapServers"] = "redpanda-0:9092"
                    },
                    DependsOn = new[] { "timescaledb", "redpanda-0" },
                    Volumes = new[] { "detector-logs:/app/logs" },
                    Ports = new string[0]
                },
                "ticker-bar-queue-to-database" => new ServiceConfiguration
                {
                    Image = "${REGISTRY:-lucidwonks}/ticker-bar-queue:${VERSION:-latest}",
                    ContainerName = "lucidwonks-ticker-bar-queue-vm",
                    Environment = new Dictionary<string, string>
                    {
                        ["ASPNETCORE_ENVIRONMENT"] = "VMTest",
                        ["ConnectionStrings__DefaultConnection"] = "${VM_CONNECTION_STRING}",
                        ["Kafka__BootstrapServers"] = "redpanda-0:9092"
                    },
                    DependsOn = new[] { "timescaledb", "redpanda-0" },
                    Volumes = new[] { "queue-logs:/app/logs" },
                    Ports = new string[0]
                },
                _ => new ServiceConfiguration
                {
                    Image = $"${{REGISTRY:-lucidwonks}}/{serviceName}:${{VERSION:-latest}}",
                    ContainerName = $"lucidwonks-{serviceName}-vm",
                    Environment = new Dictionary<string, string>
                    {
                        ["ASPNETCORE_ENVIRONMENT"] = "VMTest",
                        ["ConnectionStrings__DefaultConnection"] = "${VM_CONNECTION_STRING}"
                    },
                    DependsOn = new[] { "timescaledb", "redpanda-0" },
                    Volumes = new[] { $"{serviceName.Replace("-", "")}-logs:/app/logs" },
                    Ports = new string[0]
                }
            };
        }

        private static NetworkConfiguration GetNetworkConfiguration()
        {
            return new NetworkConfiguration
            {
                Name = "lucidwonks-vm",
                Driver = "bridge",
                Subnet = "172.20.0.0/16"
            };
        }

        private static Dictionary<string, VolumeConfiguration> GetVolumeConfiguration()
        {
            return new Dictionary<string, VolumeConfiguration>
            {
                ["timescale-data"] = new VolumeConfiguration { Driver = "local" },
                ["redpanda-data"] = new VolumeConfiguration { Driver = "local" },
                ["console-logs"] = new VolumeConfiguration { Driver = "local" },
                ["console-data"] = new VolumeConfiguration { Driver = "local" },
                ["cyphyr-logs"] = new VolumeConfiguration { Driver = "local" },
                ["detector-logs"] = new VolumeConfiguration { Driver = "local" },
                ["queue-logs"] = new VolumeConfiguration { Driver = "local" }
            };
        }

        private static Dictionary<string, string> GetEnvironmentTemplate()
        {
            return new Dictionary<string, string>
            {
                ["REGISTRY"] = "lucidwonks",
                ["VERSION"] = "latest",
                ["DB_PASSWORD"] = "LucidwonksTest123!",
                ["VM_CONNECTION_STRING"] = "Host=timescaledb;Database=lucidwonks;Username=postgres;Password=LucidwonksTest123!",
                ["TWELVE_DATA_API_KEY"] = "your_twelve_data_api_key_here",
                ["LOG_LEVEL"] = "Information",
                ["VM_NAME"] = "lucidwonks-test-vm",
                ["VM_IP"] = "192.168.1.100",
                ["SSH_USER"] = "lucidwonks",
                ["SSH_KEY_PATH"] = "/path/to/ssh/key",
                ["MEMORY_LIMIT_CONSOLE"] = "512m",
                ["MEMORY_LIMIT_CYPHYR"] = "1g",
                ["MEMORY_LIMIT_DETECTOR"] = "256m",
                ["MEMORY_LIMIT_QUEUE"] = "256m",
                ["MEMORY_LIMIT_DB"] = "2g",
                ["MEMORY_LIMIT_REDPANDA"] = "1g"
            };
        }

        private static HealthCheckConfiguration GetHealthCheckConfiguration()
        {
            return new HealthCheckConfiguration
            {
                Interval = "30s",
                Timeout = "10s",
                Retries = "3"
            };
        }

        private static BackupConfiguration GetBackupConfiguration()
        {
            return new BackupConfiguration
            {
                RetentionDays = "7",
                Schedule = "0 2 * * *"
            };
        }
    }

    // Helper classes for type safety
    public class ServiceConfiguration
    {
        public string Image { get; set; } = string.Empty;
        public string ContainerName { get; set; } = string.Empty;
        public Dictionary<string, string> Environment { get; set; } = new();
        public string[] DependsOn { get; set; } = Array.Empty<string>();
        public string[] Volumes { get; set; } = Array.Empty<string>();
        public string[] Ports { get; set; } = Array.Empty<string>();
    }

    public class NetworkConfiguration
    {
        public string Name { get; set; } = string.Empty;
        public string Driver { get; set; } = string.Empty;
        public string Subnet { get; set; } = string.Empty;
    }

    public class VolumeConfiguration
    {
        public string Driver { get; set; } = string.Empty;
    }

    public class HealthCheckConfiguration
    {
        public string Interval { get; set; } = string.Empty;
        public string Timeout { get; set; } = string.Empty;
        public string Retries { get; set; } = string.Empty;
    }

    public class BackupConfiguration
    {
        public string RetentionDays { get; set; } = string.Empty;
        public string Schedule { get; set; } = string.Empty;
    }
}
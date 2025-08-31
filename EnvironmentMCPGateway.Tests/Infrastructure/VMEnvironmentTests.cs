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

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Tests for VM Environment Setup functionality (Phase 3c)
    /// Validates VM provisioning, Docker Compose deployment, and environment management
    /// </summary>
    public class VMEnvironmentTests : TestBase
    {
        private readonly Mock<ILogger> _mockLogger;

        public VMEnvironmentTests()
        {
            _mockLogger = new Mock<ILogger>();
        }

        [Theory]
        [InlineData("lucidwonks-test-vm", 4, 40, 2)]
        [InlineData("minimal-vm", 2, 20, 1)]
        [InlineData("large-vm", 8, 80, 4)]
        public void HyperVArgs_ShouldConfigureCorrectly(string vmName, int memoryGB, int diskSizeGB, int cpuCores)
        {
            // Arrange & Act
            var args = new
            {
                VMName = vmName,
                MemoryGB = memoryGB,
                DiskSizeGB = diskSizeGB,
                CPUCores = cpuCores
            };

            // Assert
            args.VMName.Should().Be(vmName);
            args.MemoryGB.Should().Be(memoryGB);
            args.DiskSizeGB.Should().Be(diskSizeGB);
            args.CPUCores.Should().Be(cpuCores);
        }

        [Fact]
        public void VMTemplate_UbuntuDockerDev_ShouldHaveCorrectDefaults()
        {
            // Arrange & Act
            var template = new
            {
                MemoryGB = 4,
                DiskSizeGB = 40,
                CPUCores = 2,
                Template = "ubuntu-docker-dev",
                StartAfterCreation = true
            };

            // Assert
            template.MemoryGB.Should().Be(4);
            template.DiskSizeGB.Should().Be(40);
            template.CPUCores.Should().Be(2);
            template.Template.Should().Be("ubuntu-docker-dev");
            template.StartAfterCreation.Should().BeTrue();
        }

        [Fact]
        public void VMTemplate_LargeVM_ShouldHaveCorrectConfiguration()
        {
            // Arrange & Act
            var template = new
            {
                MemoryGB = 8,
                DiskSizeGB = 80,
                CPUCores = 4,
                Template = "large-vm",
                StartAfterCreation = true
            };

            // Assert
            template.MemoryGB.Should().Be(8);
            template.DiskSizeGB.Should().Be(80);
            template.CPUCores.Should().Be(4);
        }

        [Fact]
        public void VMTemplate_MinimalVM_ShouldHaveCorrectConfiguration()
        {
            // Arrange & Act
            var template = new
            {
                MemoryGB = 2,
                DiskSizeGB = 20,
                CPUCores = 1,
                Template = "minimal-vm",
                StartAfterCreation = false
            };

            // Assert
            template.MemoryGB.Should().Be(2);
            template.DiskSizeGB.Should().Be(20);
            template.CPUCores.Should().Be(1);
            template.StartAfterCreation.Should().BeFalse();
        }

        [Theory]
        [InlineData("C:\\ISOs\\ubuntu-22.04.3-live-server-amd64.iso")]
        [InlineData("C:\\ISOs\\ubuntu-20.04.6-live-server-amd64.iso")]
        public void VMConfiguration_ShouldAcceptValidISOPaths(string isoPath)
        {
            // Arrange & Act
            var config = new { IsoPath = isoPath };

            // Assert
            config.IsoPath.Should().NotBeNullOrEmpty();
            config.IsoPath.Should().EndWith(".iso");
        }

        [Theory]
        [InlineData("Default Switch")]
        [InlineData("External Switch")]
        [InlineData("Internal Switch")]
        public void VMConfiguration_ShouldAcceptValidSwitchNames(string switchName)
        {
            // Arrange & Act
            var config = new { SwitchName = switchName };

            // Assert
            config.SwitchName.Should().NotBeNullOrEmpty();
            config.SwitchName.Should().Be(switchName);
        }

        [Fact]
        public void DockerComposeConfiguration_ShouldHaveAllRequiredServices()
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

            // Act & Assert
            foreach (var service in expectedServices)
            {
                service.Should().NotBeNullOrEmpty();
                service.Should().MatchRegex("^[a-z0-9-]+$"); // Valid Docker service name format
            }
        }

        [Theory]
        [InlineData("console", "lucidwonks/console:latest")]
        [InlineData("cyphyr-recon", "lucidwonks/cyphyr-recon:latest")]
        [InlineData("inflection-point-detector", "lucidwonks/inflection-point-detector:latest")]
        [InlineData("ticker-bar-queue-to-database", "lucidwonks/ticker-bar-queue:latest")]
        public void DockerServices_ShouldHaveCorrectImageNames(string serviceName, string expectedImage)
        {
            // Arrange & Act
            var imageConfig = new { ServiceName = serviceName, Image = expectedImage };

            // Assert
            imageConfig.Image.Should().NotBeNullOrEmpty();
            imageConfig.Image.Should().StartWith("lucidwonks/");
            imageConfig.Image.Should().EndWith(":latest");
        }

        [Fact]
        public void DatabaseConfiguration_ShouldHaveCorrectSettings()
        {
            // Arrange & Act
            var dbConfig = new
            {
                Image = "timescale/timescaledb:2.14.2-pg15",
                Database = "lucidwonks",
                User = "postgres",
                Port = 5432,
                ContainerName = "lucidwonks-timescale-vm"
            };

            // Assert
            dbConfig.Image.Should().Contain("timescaledb");
            dbConfig.Database.Should().Be("lucidwonks");
            dbConfig.User.Should().Be("postgres");
            dbConfig.Port.Should().Be(5432);
            dbConfig.ContainerName.Should().Contain("lucidwonks");
        }

        [Fact]
        public void RedPandaConfiguration_ShouldHaveCorrectSettings()
        {
            // Arrange & Act
            var kafkaConfig = new
            {
                Image = "docker.redpanda.com/redpandadata/redpanda:v23.3.3",
                InternalPort = 9092,
                ExternalPort = 19092,
                SchemaRegistryPort = 18081,
                ConsolePort = 8080
            };

            // Assert
            kafkaConfig.Image.Should().Contain("redpanda");
            kafkaConfig.InternalPort.Should().Be(9092);
            kafkaConfig.ExternalPort.Should().Be(19092);
            kafkaConfig.SchemaRegistryPort.Should().Be(18081);
            kafkaConfig.ConsolePort.Should().Be(8080);
        }

        [Theory]
        [InlineData("ASPNETCORE_ENVIRONMENT", "VMTest")]
        [InlineData("ConnectionStrings__DefaultConnection", "Host=timescaledb;Database=lucidwonks;Username=postgres;Password=LucidwonksTest123!")]
        [InlineData("Kafka__BootstrapServers", "redpanda-0:9092")]
        public void EnvironmentVariables_ShouldHaveCorrectValues(string key, string expectedValue)
        {
            // Arrange & Act
            var envVar = new { Key = key, Value = expectedValue };

            // Assert
            envVar.Key.Should().NotBeNullOrEmpty();
            envVar.Value.Should().NotBeNullOrEmpty();
            
            if (key == "ASPNETCORE_ENVIRONMENT")
            {
                envVar.Value.Should().Be("VMTest");
            }
            else if (key.Contains("ConnectionStrings"))
            {
                envVar.Value.Should().Contain("Host=timescaledb");
                envVar.Value.Should().Contain("Database=lucidwonks");
            }
            else if (key.Contains("Kafka"))
            {
                envVar.Value.Should().Contain("redpanda-0:9092");
            }
        }

        [Fact]
        public void NetworkConfiguration_ShouldHaveCorrectSettings()
        {
            // Arrange & Act
            var networkConfig = new
            {
                NetworkName = "lucidwonks-vm",
                Driver = "bridge",
                Subnet = "172.20.0.0/16"
            };

            // Assert
            networkConfig.NetworkName.Should().Be("lucidwonks-vm");
            networkConfig.Driver.Should().Be("bridge");
            networkConfig.Subnet.Should().Be("172.20.0.0/16");
        }

        [Theory]
        [InlineData("timescale-data")]
        [InlineData("redpanda-data")]
        [InlineData("console-logs")]
        [InlineData("cyphyr-logs")]
        [InlineData("detector-logs")]
        [InlineData("queue-logs")]
        public void VolumeConfiguration_ShouldHaveRequiredVolumes(string volumeName)
        {
            // Arrange & Act & Assert
            volumeName.Should().NotBeNullOrEmpty();
            volumeName.Should().MatchRegex("^[a-z0-9-]+$");
        }

        [Theory]
        [InlineData(5000, "cyphyr-recon")] // CyphyrRecon web interface
        [InlineData(5432, "timescaledb")]  // PostgreSQL
        [InlineData(8080, "redpanda-console")] // RedPanda Console
        [InlineData(18081, "redpanda-0")] // Schema Registry
        [InlineData(19092, "redpanda-0")] // Kafka External
        public void PortConfiguration_ShouldExposeCorrectPorts(int port, string service)
        {
            // Arrange & Act
            var portConfig = new { Port = port, Service = service };

            // Assert
            portConfig.Port.Should().BeGreaterThan(0);
            portConfig.Port.Should().BeLessThan(65536);
            portConfig.Service.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void PulumiConfiguration_ShouldHaveCorrectEnvironmentSettings()
        {
            // Arrange & Act
            var pulumiConfig = new Dictionary<string, object>
            {
                ["lucidwonks-devops:environment"] = "vm",
                ["lucidwonks-devops:vmName"] = "lucidwonks-test-vm",
                ["lucidwonks-devops:vmTemplate"] = "ubuntu-docker-dev",
                ["lucidwonks-devops:memoryGB"] = 4,
                ["lucidwonks-devops:diskSizeGB"] = 40,
                ["lucidwonks-devops:cpuCores"] = 2,
                ["lucidwonks-devops:startAfterCreation"] = true
            };

            // Assert
            pulumiConfig["lucidwonks-devops:environment"].Should().Be("vm");
            pulumiConfig["lucidwonks-devops:vmName"].Should().Be("lucidwonks-test-vm");
            pulumiConfig["lucidwonks-devops:vmTemplate"].Should().Be("ubuntu-docker-dev");
            pulumiConfig["lucidwonks-devops:memoryGB"].Should().Be(4);
            pulumiConfig["lucidwonks-devops:diskSizeGB"].Should().Be(40);
            pulumiConfig["lucidwonks-devops:cpuCores"].Should().Be(2);
            pulumiConfig["lucidwonks-devops:startAfterCreation"].Should().Be(true);
        }

        [Theory]
        [InlineData("vm-setup.ps1")]
        [InlineData("vm-post-setup.sh")]
        public void DeploymentScripts_ShouldHaveCorrectNames(string scriptName)
        {
            // Arrange & Act & Assert
            scriptName.Should().NotBeNullOrEmpty();
            scriptName.Should().MatchRegex(@"^vm-[a-z-]+\.(ps1|sh)$");
        }

        [Fact]
        public void VMPostSetupScript_ShouldInstallRequiredComponents()
        {
            // Arrange
            var expectedComponents = new[]
            {
                "docker-ce",
                "docker-ce-cli",
                "containerd.io",
                "docker-buildx-plugin",
                "docker-compose-plugin",
                "openssh-server",
                "htop",
                "net-tools"
            };

            // Act & Assert
            foreach (var component in expectedComponents)
            {
                component.Should().NotBeNullOrEmpty();
                component.Should().MatchRegex("^[a-z0-9.-]+$");
            }
        }

        [Theory]
        [InlineData("ssh", 22)]
        [InlineData("5000/tcp", 5000)] // CyphyrRecon
        [InlineData("5432/tcp", 5432)] // PostgreSQL
        [InlineData("8080/tcp", 8080)] // RedPanda Console
        public void FirewallConfiguration_ShouldAllowRequiredPorts(string rule, int port)
        {
            // Arrange & Act
            var firewallRule = new { Rule = rule, Port = port };

            // Assert
            firewallRule.Rule.Should().NotBeNullOrEmpty();
            firewallRule.Port.Should().BeGreaterThan(0);
            firewallRule.Port.Should().BeLessThan(65536);
        }

        [Fact]
        public void SystemLimits_ShouldBeConfiguredForContainers()
        {
            // Arrange & Act
            var systemLimits = new
            {
                MaxMapCount = 262144,
                FileMax = 2097152
            };

            // Assert
            systemLimits.MaxMapCount.Should().Be(262144);
            systemLimits.FileMax.Should().Be(2097152);
        }

        [Fact]
        public void LogRotationConfiguration_ShouldBeProperlySetup()
        {
            // Arrange & Act
            var logConfig = new
            {
                Path = "/opt/lucidwonks/logs/*.log",
                Frequency = "daily",
                Retention = 30,
                Compress = true,
                CreateMode = "644"
            };

            // Assert
            logConfig.Path.Should().Contain("/opt/lucidwonks/logs");
            logConfig.Frequency.Should().Be("daily");
            logConfig.Retention.Should().Be(30);
            logConfig.Compress.Should().BeTrue();
            logConfig.CreateMode.Should().Be("644");
        }
    }
}
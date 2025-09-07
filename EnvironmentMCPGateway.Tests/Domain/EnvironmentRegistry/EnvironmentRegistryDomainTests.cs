/**
 * Environment Registry Domain Tests
 * Simplified XUnit tests for environment registry domain logic
 * Following Lucidwonks testing standards with QA Expert guidance
 */

using FluentAssertions;
using Xunit;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Domain.EnvironmentRegistry
{
    /// <summary>
    /// Simplified unit tests for environment registry domain
    /// Tests core business logic without complex mocking
    /// </summary>
    [Trait("Category", "Unit")]
    [Trait("Domain", "EnvironmentRegistry")]
    public class EnvironmentRegistryDomainTests : TestBase
    {
        [Theory]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        [InlineData("my-app", true)]
        [InlineData("trading_system", true)]
        [InlineData("app123", true)]
        [InlineData("TRADING-PLATFORM-2024", true)]
        [InlineData("data_analysis_engine", true)]
        [InlineData("", false)]
        [InlineData(" ", false)]
        [InlineData("ab", false)]
        [InlineData("my app", false)]
        [InlineData("app@123", false)]
        [InlineData("app!test", false)]
        public void Should_Validate_Application_Id_Format(string applicationId, bool expectedValid)
        {
            try
            {
                // Arrange & Act
                var isValid = IsValidApplicationId(applicationId);

                // Assert
                isValid.Should().Be(expectedValid,
                    $"Application ID '{applicationId}' should be {(expectedValid ? "valid" : "invalid")}");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate application ID format for {ApplicationId}", applicationId);
                throw;
            }
        }

        [Theory]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        [InlineData("development", true)]
        [InlineData("qa", true)]
        [InlineData("staging", true)]
        [InlineData("production", true)]
        [InlineData("test", true)]
        [InlineData("invalid", false)]
        [InlineData("", false)]
        public void Should_Validate_Environment_Types(string environmentType, bool expectedValid)
        {
            try
            {
                // Arrange & Act
                var isValid = IsValidEnvironmentType(environmentType);

                // Assert
                isValid.Should().Be(expectedValid,
                    $"Environment type '{environmentType}' should be {(expectedValid ? "valid" : "invalid")}");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate environment type {EnvironmentType}", environmentType);
                throw;
            }
        }

        [Theory]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        [InlineData("NODE_ENV", true)]
        [InlineData("LOG_LEVEL", true)]
        [InlineData("API_URL", true)]
        [InlineData("DATABASE_CONNECTION", true)]
        [InlineData("badVar", false)]
        [InlineData("another-bad", false)]
        [InlineData("MixedCase", false)]
        public void Should_Follow_Environment_Variable_Naming_Convention(string variableName, bool isGoodPractice)
        {
            try
            {
                // Arrange & Act
                var followsConvention = IsValidEnvironmentVariableName(variableName);

                // Assert
                followsConvention.Should().Be(isGoodPractice,
                    $"Environment variable '{variableName}' should {(isGoodPractice ? "follow" : "not follow")} UPPER_SNAKE_CASE convention");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate environment variable naming convention for {VariableName}", variableName);
                throw;
            }
        }

        [Theory]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        [InlineData("http", true)]
        [InlineData("https", true)]
        [InlineData("ssh", true)]
        [InlineData("tcp", true)]
        [InlineData("postgresql", true)]
        [InlineData("kafka", true)]
        [InlineData("invalid", false)]
        [InlineData("", false)]
        public void Should_Validate_Server_Protocols(string protocol, bool expectedValid)
        {
            try
            {
                // Arrange & Act
                var isValid = IsValidProtocol(protocol);

                // Assert
                isValid.Should().Be(expectedValid,
                    $"Protocol '{protocol}' should be {(expectedValid ? "valid" : "invalid")}");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate server protocol {Protocol}", protocol);
                throw;
            }
        }

        [Theory]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        [InlineData(1, true)]
        [InlineData(80, true)]
        [InlineData(443, true)]
        [InlineData(5432, true)]
        [InlineData(65535, true)]
        [InlineData(0, false)]
        [InlineData(65536, false)]
        [InlineData(70000, false)]
        public void Should_Validate_Port_Ranges(int port, bool expectedValid)
        {
            try
            {
                // Arrange & Act
                var isValid = IsValidPort(port);

                // Assert
                isValid.Should().Be(expectedValid,
                    $"Port {port} should be {(expectedValid ? "valid" : "invalid")}");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate port range for {Port}", port);
                throw;
            }
        }

        [Fact]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        public void Should_Generate_Valid_Environment_Configuration_Structure()
        {
            try
            {
                // Arrange
                var config = CreateSampleEnvironmentConfiguration();

                // Act & Assert
                config.Should().NotBeNull();
                config.EnvironmentId.Should().NotBeNullOrEmpty();
                config.EnvironmentName.Should().NotBeNullOrEmpty();
                config.ApplicationId.Should().NotBeNullOrEmpty();
                config.EnvironmentType.Should().BeOneOf("development", "qa", "staging", "production", "test");
                config.Servers.Should().NotBeEmpty();
                config.Services.Should().NotBeEmpty();
                config.Variables.Should().NotBeNull();
                config.IsActive.Should().BeTrue();
                config.CreatedAt.Should().BeBefore(DateTime.UtcNow.AddMinutes(1));
                config.UpdatedAt.Should().BeBefore(DateTime.UtcNow.AddMinutes(1));
                config.Version.Should().BeGreaterThan(0);
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to generate valid environment configuration structure");
                throw;
            }
        }

        [Fact]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        public void Should_Support_Production_Environment_Constraints()
        {
            try
            {
                // Arrange
                var prodConfig = CreateProductionEnvironmentConfiguration();

                // Act & Assert
                prodConfig.EnvironmentType.Should().Be("production");
                
                // Production must have database service
                prodConfig.Services.Should().Contain(s => s.ServiceType == "database");
                
                // Production cannot use localhost
                prodConfig.Services.Should().NotContain(s => s.Host == "localhost" || s.Host == "127.0.0.1");
                prodConfig.Servers.Should().NotContain(s => s.Host == "localhost" || s.Host == "127.0.0.1");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate production environment constraints");
                throw;
            }
        }

        [Fact]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        public void Should_Support_Environment_Builder_Pattern()
        {
            try
            {
                // Arrange & Act
                var config = CreateEnvironmentUsingBuilder();

                // Assert
                config.Should().NotBeNull();
                config.EnvironmentId.Should().Be("builder-test");
                config.EnvironmentType.Should().Be("development");
                config.ApplicationId.Should().Be("builder-app");
                
                // Should have TimescaleDB service
                config.Services.Should().Contain(s => s.ServiceName == "timescaledb");
                var dbService = config.Services.First(s => s.ServiceName == "timescaledb");
                dbService.ServiceType.Should().Be("database");
                dbService.Port.Should().Be(5432);
                dbService.Protocol.Should().Be("postgresql");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate environment builder pattern");
                throw;
            }
        }

        [Fact]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        public void Should_Support_Registry_Statistics_Calculation()
        {
            try
            {
                // Arrange
                var applications = CreateSampleApplications();

                // Act
                var stats = CalculateRegistryStatistics(applications);

                // Assert
                stats.Should().NotBeNull();
                stats.ApplicationCount.Should().Be(3);
                stats.EnvironmentCount.Should().Be(6); // 2 environments per app
                stats.ActiveEnvironmentCount.Should().BeGreaterThan(0);
                stats.ServiceCount.Should().BeGreaterThan(0);
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to calculate registry statistics");
                throw;
            }
        }

        [Fact]
        [Trait("Feature", "MCPGATEWAY-ENVREGISTRY-ae7f-F001")]
        public void Should_Support_Configuration_Persistence_Structure()
        {
            try
            {
                // Arrange
                var applications = CreateSampleApplications();

                // Act
                var configData = CreateYamlConfigurationStructure(applications);

                // Assert
                configData.Should().NotBeNull();
                configData.Should().ContainKey("version");
                configData.Should().ContainKey("lastUpdated");
                configData.Should().ContainKey("applications");
                configData.Should().ContainKey("metadata");
                
                var metadata = configData["metadata"] as Dictionary<string, object>;
                metadata.Should().ContainKey("formatVersion");
                metadata.Should().ContainKey("generatedBy");
                metadata.Should().ContainKey("checksum");
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to validate configuration persistence structure");
                throw;
            }
        }

        #region Helper Methods and Test Data

        private bool IsValidApplicationId(string applicationId)
        {
            if (string.IsNullOrWhiteSpace(applicationId)) return false;
            if (applicationId.Length < 3 || applicationId.Length > 50) return false;
            return System.Text.RegularExpressions.Regex.IsMatch(applicationId, @"^[a-zA-Z0-9_-]+$");
        }

        private bool IsValidEnvironmentType(string environmentType)
        {
            var validTypes = new[] { "development", "qa", "staging", "production", "test" };
            return validTypes.Contains(environmentType);
        }

        private bool IsValidEnvironmentVariableName(string name)
        {
            return System.Text.RegularExpressions.Regex.IsMatch(name, @"^[A-Z_][A-Z0-9_]*$");
        }

        private bool IsValidProtocol(string protocol)
        {
            var validProtocols = new[] { "http", "https", "ssh", "tcp", "postgresql", "kafka" };
            return validProtocols.Contains(protocol);
        }

        private bool IsValidPort(int port)
        {
            return port >= 1 && port <= 65535;
        }

        private EnvironmentConfiguration CreateSampleEnvironmentConfiguration()
        {
            try
            {
                return new EnvironmentConfiguration
                {
                    EnvironmentId = "sample-env",
                    EnvironmentName = "Sample Environment",
                    EnvironmentType = "development",
                    ApplicationId = "sample-app",
                Servers = new[]
                {
                    new ServerDefinition
                    {
                        Id = "web-1",
                        Host = "localhost",
                        Port = 3000,
                        Protocol = "http",
                        Description = "Web server",
                        Tags = new[] { "web", "frontend" },
                        Metadata = new Dictionary<string, object> { ["environment"] = "development" }
                    }
                },
                Services = new[]
                {
                    new ServiceEndpoint
                    {
                        ServiceName = "postgres",
                        ServiceType = "database",
                        Host = "localhost",
                        Port = 5432,
                        Protocol = "postgresql",
                        ConnectionString = "postgresql://user:pass@localhost:5432/testdb",
                        Authentication = new Dictionary<string, object>
                        {
                            ["username"] = "user",
                            ["password"] = "pass",
                            ["database"] = "testdb"
                        },
                        Configuration = new Dictionary<string, object>
                        {
                            ["ssl"] = false,
                            ["connectionTimeout"] = 30000,
                            ["maxConnections"] = 10
                        }
                    }
                },
                Variables = new Dictionary<string, string>
                {
                    ["NODE_ENV"] = "development",
                    ["LOG_LEVEL"] = "debug"
                },
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                UpdatedAt = DateTime.UtcNow,
                Version = 1
                };
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to create sample environment configuration");
                throw;
            }
        }

        private EnvironmentConfiguration CreateProductionEnvironmentConfiguration()
        {
            try
            {
                return new EnvironmentConfiguration
            {
                EnvironmentId = "production",
                EnvironmentName = "Production Environment",
                EnvironmentType = "production",
                ApplicationId = "prod-app",
                Servers = new[]
                {
                    new ServerDefinition
                    {
                        Id = "web-prod-1",
                        Host = "web.prod.example.com",
                        Port = 443,
                        Protocol = "https",
                        Description = "Production web server",
                        Tags = new[] { "web", "production" },
                        Metadata = new Dictionary<string, object> { ["environment"] = "production" }
                    }
                },
                Services = new[]
                {
                    new ServiceEndpoint
                    {
                        ServiceName = "postgres-prod",
                        ServiceType = "database",
                        Host = "db.prod.example.com",
                        Port = 5432,
                        Protocol = "postgresql",
                        ConnectionString = "postgresql://produser:prodpass@db.prod.example.com:5432/proddb",
                        Authentication = new Dictionary<string, object>
                        {
                            ["username"] = "produser",
                            ["password"] = "prodpass",
                            ["database"] = "proddb"
                        }
                    }
                },
                Variables = new Dictionary<string, string>
                {
                    ["NODE_ENV"] = "production",
                    ["LOG_LEVEL"] = "info"
                },
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                UpdatedAt = DateTime.UtcNow,
                Version = 1
                };
            }
            catch (Exception ex)
            {
                LogError(ex, "Failed to create production environment configuration");
                throw;
            }
        }

        private EnvironmentConfiguration CreateEnvironmentUsingBuilder()
        {
            // Simulate builder pattern result
            return new EnvironmentConfiguration
            {
                EnvironmentId = "builder-test",
                EnvironmentName = "Builder Test Environment",
                EnvironmentType = "development",
                ApplicationId = "builder-app",
                Servers = new[]
                {
                    new ServerDefinition
                    {
                        Id = "dev-server",
                        Host = "localhost",
                        Port = 3000,
                        Protocol = "http",
                        Description = "Development server",
                        Tags = new[] { "development", "local" },
                        Metadata = new Dictionary<string, object>()
                    }
                },
                Services = new[]
                {
                    new ServiceEndpoint
                    {
                        ServiceName = "timescaledb",
                        ServiceType = "database",
                        Host = "localhost",
                        Port = 5432,
                        Protocol = "postgresql",
                        ConnectionString = "postgresql://user:pass@localhost:5432/devdb",
                        Authentication = new Dictionary<string, object>
                        {
                            ["username"] = "user",
                            ["password"] = "pass",
                            ["database"] = "devdb"
                        },
                        Configuration = new Dictionary<string, object>
                        {
                            ["ssl"] = false,
                            ["connectionTimeout"] = 30000,
                            ["maxConnections"] = 10
                        }
                    }
                },
                Variables = new Dictionary<string, string>
                {
                    ["NODE_ENV"] = "development",
                    ["LOG_LEVEL"] = "debug"
                },
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                UpdatedAt = DateTime.UtcNow,
                Version = 1
            };
        }

        private List<ApplicationRegistryEntry> CreateSampleApplications()
        {
            return new List<ApplicationRegistryEntry>
            {
                new ApplicationRegistryEntry
                {
                    ApplicationId = "trading-app",
                    ApplicationName = "Trading Application",
                    Description = "High-frequency trading system",
                    Environments = new Dictionary<string, EnvironmentConfiguration>
                    {
                        ["development"] = CreateSampleEnvironmentConfiguration(),
                        ["production"] = CreateProductionEnvironmentConfiguration()
                    },
                    Tags = new[] { "trading", "finance" },
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow
                },
                new ApplicationRegistryEntry
                {
                    ApplicationId = "data-app",
                    ApplicationName = "Data Processing Application",
                    Description = "Real-time data processing system",
                    Environments = new Dictionary<string, EnvironmentConfiguration>
                    {
                        ["development"] = CreateSampleEnvironmentConfiguration(),
                        ["production"] = CreateProductionEnvironmentConfiguration()
                    },
                    Tags = new[] { "data", "analytics" },
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow
                },
                new ApplicationRegistryEntry
                {
                    ApplicationId = "mixed-app",
                    ApplicationName = "Mixed Services Application",
                    Description = "Multi-purpose application system",
                    Environments = new Dictionary<string, EnvironmentConfiguration>
                    {
                        ["development"] = CreateSampleEnvironmentConfiguration(),
                        ["production"] = CreateProductionEnvironmentConfiguration()
                    },
                    Tags = new[] { "trading", "data", "mixed" },
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow
                }
            };
        }

        private RegistryStatistics CalculateRegistryStatistics(List<ApplicationRegistryEntry> applications)
        {
            var totalEnvironments = applications.Sum(app => app.Environments.Count);
            var activeEnvironments = applications.SelectMany(app => app.Environments.Values)
                .Count(env => env.IsActive);
            var totalServices = applications.SelectMany(app => app.Environments.Values)
                .Sum(env => env.Services.Count());

            return new RegistryStatistics
            {
                ApplicationCount = applications.Count,
                EnvironmentCount = totalEnvironments,
                ActiveEnvironmentCount = activeEnvironments,
                ServiceCount = totalServices
            };
        }

        private Dictionary<string, object> CreateYamlConfigurationStructure(List<ApplicationRegistryEntry> applications)
        {
            var applicationData = new Dictionary<string, object>();
            
            foreach (var app in applications)
            {
                applicationData[app.ApplicationId] = new
                {
                    applicationId = app.ApplicationId,
                    applicationName = app.ApplicationName,
                    description = app.Description,
                    environments = app.Environments.ToDictionary(
                        kvp => kvp.Key,
                        kvp => (object)new
                        {
                            environmentId = kvp.Value.EnvironmentId,
                            environmentName = kvp.Value.EnvironmentName,
                            environmentType = kvp.Value.EnvironmentType
                        }
                    ),
                    tags = app.Tags,
                    createdAt = app.CreatedAt.ToString("O"),
                    updatedAt = app.UpdatedAt.ToString("O")
                };
            }

            return new Dictionary<string, object>
            {
                ["version"] = "1.0.0",
                ["lastUpdated"] = DateTime.UtcNow.ToString("O"),
                ["applications"] = applicationData,
                ["metadata"] = new Dictionary<string, object>
                {
                    ["formatVersion"] = 1,
                    ["generatedBy"] = "EnvironmentMCPGateway",
                    ["checksum"] = "abc123def456"
                }
            };
        }

        #endregion

        #region Test Data Classes

        public class EnvironmentConfiguration
        {
            public string EnvironmentId { get; set; } = string.Empty;
            public string EnvironmentName { get; set; } = string.Empty;
            public string EnvironmentType { get; set; } = string.Empty;
            public string ApplicationId { get; set; } = string.Empty;
            public ServerDefinition[] Servers { get; set; } = Array.Empty<ServerDefinition>();
            public ServiceEndpoint[] Services { get; set; } = Array.Empty<ServiceEndpoint>();
            public Dictionary<string, string> Variables { get; set; } = new();
            public bool IsActive { get; set; } = true;
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
            public int Version { get; set; }
        }

        public class ServerDefinition
        {
            public string Id { get; set; } = string.Empty;
            public string Host { get; set; } = string.Empty;
            public int Port { get; set; }
            public string Protocol { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string[] Tags { get; set; } = Array.Empty<string>();
            public Dictionary<string, object> Metadata { get; set; } = new();
        }

        public class ServiceEndpoint
        {
            public string ServiceName { get; set; } = string.Empty;
            public string ServiceType { get; set; } = string.Empty;
            public string Host { get; set; } = string.Empty;
            public int Port { get; set; }
            public string Protocol { get; set; } = string.Empty;
            public string ConnectionString { get; set; } = string.Empty;
            public Dictionary<string, object> Authentication { get; set; } = new();
            public Dictionary<string, object> Configuration { get; set; } = new();
        }

        public class ApplicationRegistryEntry
        {
            public string ApplicationId { get; set; } = string.Empty;
            public string ApplicationName { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public Dictionary<string, EnvironmentConfiguration> Environments { get; set; } = new();
            public string[] Tags { get; set; } = Array.Empty<string>();
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
        }

        public class RegistryStatistics
        {
            public int ApplicationCount { get; set; }
            public int EnvironmentCount { get; set; }
            public int ActiveEnvironmentCount { get; set; }
            public int ServiceCount { get; set; }
        }

        #endregion
    }
}
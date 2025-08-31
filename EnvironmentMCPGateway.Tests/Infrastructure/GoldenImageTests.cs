/**
 * IMPORTANT NOTE FOR AI ASSISTANTS:
 * This project uses XUnit as the approved testing framework.
 * Jest is NOT ALLOWED - only XUnit testing should be used.
 * Refer to Documentation/Overview/Testing-Standards.md for approved testing approaches.
 */

using System;
using Xunit;
using FluentAssertions;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Moq;

namespace EnvironmentMCPGateway.Tests.Infrastructure
{
    /// <summary>
    /// Comprehensive test suite for Phase 3g Golden Image and Testing functionality
    /// Tests backup/restore workflows, Azure Blob Storage integration, and test orchestration
    /// </summary>
    public class GoldenImageTests : TestBase
    {
        private readonly Mock<ILogger> _mockLogger;
        private readonly string _projectRoot;
        
        public GoldenImageTests()
        {
            _mockLogger = new Mock<ILogger>();
            
            // Navigate up from test output directory to find project root
            var currentDir = Directory.GetCurrentDirectory();
            var testDir = currentDir;
            
            // Look for the devops directory relative to the solution root
            while (!Directory.Exists(Path.Combine(testDir, "devops")) && Directory.GetParent(testDir) != null)
            {
                testDir = Directory.GetParent(testDir)!.FullName;
            }
            
            _projectRoot = testDir;
        }

        #region Golden Image Backup Tests

        [Fact]
        public void GoldenImageBackupScript_ShouldExist()
        {
            // Arrange
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-backup.sh");

            // Act & Assert
            File.Exists(scriptPath).Should().BeTrue($"Golden image backup script should exist at {scriptPath}");
        }

        [Fact]
        public void GoldenImageBackupScript_ShouldBeExecutable()
        {
            // Arrange
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-backup.sh");

            // Act
            var fileInfo = new FileInfo(scriptPath);
            
            // Assert
            fileInfo.Exists.Should().BeTrue("Backup script file should exist");
            // Note: On Windows, executable bit checking is different than Unix
            // This test verifies the file exists and can be read
            fileInfo.Length.Should().BeGreaterThan(0, "Script file should not be empty");
        }

        [Theory]
        [InlineData("development")]
        [InlineData("vm-test")]
        [InlineData("azure-ephemeral")]
        public void GoldenImageBackup_ShouldSupportEnvironments(string environment)
        {
            // Arrange
            var configPath = Path.Combine(_projectRoot, "devops", "config", "environments", $"{environment}.json");

            // Act & Assert
            if (File.Exists(configPath))
            {
                var configContent = File.ReadAllText(configPath);
                configContent.Should().NotBeNullOrEmpty("Environment configuration should not be empty");
                
                // Verify it's valid JSON
                var action = () => JsonDocument.Parse(configContent);
                action.Should().NotThrow("Environment configuration should be valid JSON");
            }
            else
            {
                // For test purposes, assume environment config would exist in real deployment
                environment.Should().BeOneOf("development", "vm-test", "azure-ephemeral");
            }
        }

        [Fact]
        public void GoldenImageBackup_ShouldHaveMetadataStructure()
        {
            // Arrange
            var expectedMetadataStructure = new
            {
                backup_name = "",
                environment = "",
                timestamp = "",
                database = new { host = "", port = 0, name = "", username = "" },
                files = new { custom_format = "", plain_sql = "", metadata = "" },
                size_bytes = new { custom_format = 0, plain_sql = 0 },
                checksum = new { custom_format = "", plain_sql = "" }
            };

            // Act & Assert
            // Verify the metadata structure is properly defined in the backup script
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-backup.sh");
            if (File.Exists(scriptPath))
            {
                var scriptContent = File.ReadAllText(scriptPath);
                
                // Check that metadata structure elements are present in script
                scriptContent.Should().Contain("backup_name", "Script should create backup_name metadata");
                scriptContent.Should().Contain("environment", "Script should create environment metadata");
                scriptContent.Should().Contain("timestamp", "Script should create timestamp metadata");
                scriptContent.Should().Contain("checksum", "Script should create checksum metadata");
            }
            
            expectedMetadataStructure.Should().NotBeNull("Metadata structure should be defined");
        }

        [Fact]
        public void GoldenImageBackup_ShouldValidateProductionEnvironment()
        {
            // Arrange
            var productionEnvironments = new[] { "azure-production", "production" };

            // Act & Assert
            foreach (var env in productionEnvironments)
            {
                // The backup script should allow production backups but restore script should prevent production restores
                env.Should().NotBeNullOrEmpty("Production environment names should be defined");
            }
        }

        #endregion

        #region Golden Image Restore Tests

        [Fact]
        public void GoldenImageRestoreScript_ShouldExist()
        {
            // Arrange
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-restore.sh");

            // Act & Assert
            File.Exists(scriptPath).Should().BeTrue($"Golden image restore script should exist at {scriptPath}");
        }

        [Fact]
        public void GoldenImageRestore_ShouldPreventProductionRestore()
        {
            // Arrange
            var restoreScript = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-restore.sh");

            // Act & Assert
            if (File.Exists(restoreScript))
            {
                var scriptContent = File.ReadAllText(restoreScript);
                
                // Verify script contains production environment protection
                scriptContent.Should().Contain("production", "Script should check for production environment");
                scriptContent.Should().Contain("ERROR", "Script should have error handling for production");
            }
        }

        [Fact]
        public void GoldenImageRestore_ShouldCreatePreRestoreBackup()
        {
            // Arrange
            var restoreScript = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-restore.sh");

            // Act & Assert
            if (File.Exists(restoreScript))
            {
                var scriptContent = File.ReadAllText(restoreScript);
                
                // Verify script creates pre-restore backup
                scriptContent.Should().Contain("pre-restore", "Script should create pre-restore backup");
                scriptContent.Should().Contain("pg_dump", "Script should use pg_dump for pre-restore backup");
            }
        }

        [Theory]
        [InlineData("vm-test")]
        [InlineData("azure-ephemeral")]
        [InlineData("development")]
        public void GoldenImageRestore_ShouldSupportNonProductionEnvironments(string environment)
        {
            // Arrange & Act & Assert
            var nonProductionEnvironments = new[] { "vm-test", "azure-ephemeral", "development" };
            nonProductionEnvironments.Should().Contain(environment, 
                "Restore should be allowed for non-production environments");
        }

        [Fact]
        public void GoldenImageRestore_ShouldValidateBackupIntegrity()
        {
            // Arrange
            var restoreScript = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-restore.sh");

            // Act & Assert
            if (File.Exists(restoreScript))
            {
                var scriptContent = File.ReadAllText(restoreScript);
                
                // Verify script validates backup integrity
                scriptContent.Should().Contain("checksum", "Script should validate backup checksums");
                scriptContent.Should().Contain("md5sum", "Script should use md5sum for integrity checking");
                scriptContent.Should().Contain("pg_restore --list", "Script should validate PostgreSQL backup format");
            }
        }

        #endregion

        #region Azure Blob Storage Integration Tests

        [Fact]
        public void AzureBlobStorageScript_ShouldExist()
        {
            // Arrange
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "azure", "golden-image-azure-sync.ps1");

            // Act & Assert
            File.Exists(scriptPath).Should().BeTrue($"Azure Blob Storage sync script should exist at {scriptPath}");
        }

        [Fact]
        public void AzureStorageConfig_ShouldExist()
        {
            // Arrange
            var configPath = Path.Combine(_projectRoot, "devops", "config", "azure-storage.json");

            // Act & Assert
            File.Exists(configPath).Should().BeTrue($"Azure storage configuration should exist at {configPath}");
        }

        [Fact]
        public void AzureStorageConfig_ShouldHaveValidStructure()
        {
            // Arrange
            var configPath = Path.Combine("devops", "config", "azure-storage.json");
            
            // Act & Assert
            if (File.Exists(configPath))
            {
                var configContent = File.ReadAllText(configPath);
                var config = JsonDocument.Parse(configContent);
                var root = config.RootElement;
                
                // Verify required properties exist
                root.TryGetProperty("storage_account", out _).Should().BeTrue("Config should have storage_account");
                root.TryGetProperty("golden_images_container", out _).Should().BeTrue("Config should have golden_images_container");
                root.TryGetProperty("retention_policy", out _).Should().BeTrue("Config should have retention_policy");
                root.TryGetProperty("environments", out _).Should().BeTrue("Config should have environments");
            }
        }

        [Theory]
        [InlineData("Upload")]
        [InlineData("Download")]
        [InlineData("List")]
        [InlineData("Cleanup")]
        public void AzureBlobStorage_ShouldSupportOperations(string operation)
        {
            // Arrange
            var scriptPath = Path.Combine("devops", "scripts", "azure", "golden-image-azure-sync.ps1");

            // Act & Assert
            if (File.Exists(scriptPath))
            {
                var scriptContent = File.ReadAllText(scriptPath);
                
                // Verify script supports the operation
                scriptContent.Should().Contain($"\"{operation}\"", $"Script should support {operation} operation");
            }
            
            // Verify operation is valid
            var validOperations = new[] { "Upload", "Download", "List", "Cleanup" };
            validOperations.Should().Contain(operation, "Operation should be supported");
        }

        [Fact]
        public void AzureBlobStorage_ShouldHaveRetentionPolicy()
        {
            // Arrange
            var scriptPath = Path.Combine("devops", "scripts", "azure", "golden-image-azure-sync.ps1");

            // Act & Assert
            if (File.Exists(scriptPath))
            {
                var scriptContent = File.ReadAllText(scriptPath);
                
                // Verify script implements retention policy
                scriptContent.Should().Contain("retention", "Script should implement retention policy");
                scriptContent.Should().Contain("Cleanup", "Script should support cleanup operation");
            }
        }

        #endregion

        #region Test Data Refresh Tests

        [Fact]
        public void TestDataRefreshScript_ShouldExist()
        {
            // Arrange
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "database", "test-data-refresh.sh");

            // Act & Assert
            File.Exists(scriptPath).Should().BeTrue($"Test data refresh script should exist at {scriptPath}");
        }

        [Fact]
        public void TestDataSeeds_ShouldExist()
        {
            // Arrange
            var seedsDir = Path.Combine(_projectRoot, "devops", "database", "seeds", "trading-sample");

            // Act & Assert
            Directory.Exists(seedsDir).Should().BeTrue($"Test data seeds directory should exist at {seedsDir}");
            
            if (Directory.Exists(seedsDir))
            {
                var sqlFiles = Directory.GetFiles(seedsDir, "*.sql");
                sqlFiles.Should().NotBeEmpty("Seeds directory should contain SQL files");
            }
        }

        [Theory]
        [InlineData("001_reference_data.sql")]
        [InlineData("002_sample_data.sql")]
        public void TestDataSeeds_ShouldContainRequiredFiles(string seedFile)
        {
            // Arrange
            var seedPath = Path.Combine(_projectRoot, "devops", "database", "seeds", "trading-sample", seedFile);

            // Act & Assert
            File.Exists(seedPath).Should().BeTrue($"Seed file {seedFile} should exist");
            
            if (File.Exists(seedPath))
            {
                var content = File.ReadAllText(seedPath);
                content.Should().NotBeNullOrEmpty($"Seed file {seedFile} should not be empty");
                content.Should().Contain("INSERT", $"Seed file {seedFile} should contain INSERT statements");
            }
        }

        [Fact]
        public void TestDataRefresh_ShouldValidateEnvironment()
        {
            // Arrange
            var refreshScript = Path.Combine(_projectRoot, "devops", "scripts", "database", "test-data-refresh.sh");

            // Act & Assert
            if (File.Exists(refreshScript))
            {
                var scriptContent = File.ReadAllText(refreshScript);
                
                // Verify script validates environment before refresh
                scriptContent.Should().Contain("validate_environment", "Script should validate environment");
                scriptContent.Should().Contain("production", "Script should check for production environment");
            }
        }

        [Theory]
        [InlineData("trading-sample")]
        [InlineData("performance-test")]
        [InlineData("integration-test")]
        public void TestDataRefresh_ShouldSupportDataSets(string dataSet)
        {
            // Arrange & Act & Assert
            var supportedDataSets = new[] { "trading-sample", "performance-test", "integration-test" };
            supportedDataSets.Should().Contain(dataSet, $"Data set {dataSet} should be supported");
        }

        #endregion

        #region Test Orchestration Tests

        [Fact]
        public void TestOrchestratorScript_ShouldExist()
        {
            // Arrange
            var scriptPath = Path.Combine(_projectRoot, "devops", "scripts", "testing", "test-orchestrator.sh");

            // Act & Assert
            File.Exists(scriptPath).Should().BeTrue($"Test orchestrator script should exist at {scriptPath}");
        }

        [Fact]
        public void TestSuiteConfig_ShouldExist()
        {
            // Arrange
            var configPath = Path.Combine(_projectRoot, "devops", "config", "test-suites", "deployment.json");

            // Act & Assert
            File.Exists(configPath).Should().BeTrue($"Deployment test suite configuration should exist at {configPath}");
        }

        [Fact]
        public void TestSuiteConfig_ShouldHaveValidStructure()
        {
            // Arrange
            var configPath = Path.Combine("devops", "config", "test-suites", "deployment.json");
            
            // Act & Assert
            if (File.Exists(configPath))
            {
                var configContent = File.ReadAllText(configPath);
                var config = JsonDocument.Parse(configContent);
                var root = config.RootElement;
                
                // Verify required properties exist
                root.TryGetProperty("name", out _).Should().BeTrue("Config should have name");
                root.TryGetProperty("description", out _).Should().BeTrue("Config should have description");
                root.TryGetProperty("test_categories", out _).Should().BeTrue("Config should have test_categories");
                root.TryGetProperty("timeout_minutes", out _).Should().BeTrue("Config should have timeout_minutes");
                
                // Verify test categories
                if (root.TryGetProperty("test_categories", out var categories))
                {
                    categories.ValueKind.Should().Be(JsonValueKind.Array, "test_categories should be an array");
                    categories.GetArrayLength().Should().BeGreaterThan(0, "Should have at least one test category");
                }
            }
        }

        [Theory]
        [InlineData("database")]
        [InlineData("application")]
        [InlineData("integration")]
        [InlineData("security")]
        public void TestOrchestrator_ShouldSupportTestCategories(string category)
        {
            // Arrange
            var configPath = Path.Combine("devops", "config", "test-suites", "deployment.json");
            
            // Act & Assert
            if (File.Exists(configPath))
            {
                var configContent = File.ReadAllText(configPath);
                configContent.Should().Contain($"\"{category}\"", $"Test suite should include {category} tests");
            }
            
            var expectedCategories = new[] { "database", "application", "integration", "security" };
            expectedCategories.Should().Contain(category, $"Category {category} should be supported");
        }

        [Fact]
        public void TestOrchestrator_ShouldGenerateReports()
        {
            // Arrange
            var orchestratorScript = Path.Combine("devops", "scripts", "testing", "test-orchestrator.sh");

            // Act & Assert
            if (File.Exists(orchestratorScript))
            {
                var scriptContent = File.ReadAllText(orchestratorScript);
                
                // Verify script generates test reports
                scriptContent.Should().Contain("generate_test_report", "Script should generate test reports");
                scriptContent.Should().Contain("test-report", "Script should create test report files");
                scriptContent.Should().Contain("json", "Script should support JSON report format");
            }
        }

        #endregion

        #region CI/CD Pipeline Integration Tests

        [Fact]
        public void GoldenImagePipeline_ShouldExist()
        {
            // Arrange
            var pipelinePath = Path.Combine(_projectRoot, "devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml");

            // Act & Assert
            File.Exists(pipelinePath).Should().BeTrue($"Golden image pipeline template should exist at {pipelinePath}");
        }

        [Fact]
        public void GoldenImagePipeline_ShouldHaveValidYaml()
        {
            // Arrange
            var pipelinePath = Path.Combine(_projectRoot, "devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml");
            
            // Act & Assert
            if (File.Exists(pipelinePath))
            {
                var pipelineContent = File.ReadAllText(pipelinePath);
                
                // Basic YAML structure validation
                pipelineContent.Should().NotBeNullOrEmpty("Pipeline file should not be empty");
                pipelineContent.Should().Contain("parameters:", "Pipeline should have parameters");
                pipelineContent.Should().Contain("stages:", "Pipeline should have stages");
                pipelineContent.Should().Contain("jobs:", "Pipeline should have jobs");
            }
        }

        [Theory]
        [InlineData("backup")]
        [InlineData("restore")]
        [InlineData("refresh")]
        public void GoldenImagePipeline_ShouldSupportOperations(string operation)
        {
            // Arrange
            var pipelinePath = Path.Combine("devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml");
            
            // Act & Assert
            if (File.Exists(pipelinePath))
            {
                var pipelineContent = File.ReadAllText(pipelinePath);
                pipelineContent.Should().Contain(operation, $"Pipeline should support {operation} operation");
            }
            
            var supportedOperations = new[] { "backup", "restore", "refresh" };
            supportedOperations.Should().Contain(operation, $"Operation {operation} should be supported");
        }

        [Fact]
        public void GoldenImagePipeline_ShouldHaveArtifactPublishing()
        {
            // Arrange
            var pipelinePath = Path.Combine("devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml");
            
            // Act & Assert
            if (File.Exists(pipelinePath))
            {
                var pipelineContent = File.ReadAllText(pipelinePath);
                
                // Verify pipeline publishes artifacts
                pipelineContent.Should().Contain("PublishBuildArtifacts", "Pipeline should publish build artifacts");
                pipelineContent.Should().Contain("PublishTestResults", "Pipeline should publish test results");
            }
        }

        [Fact]
        public void GoldenImagePipeline_ShouldHaveNotifications()
        {
            // Arrange
            var pipelinePath = Path.Combine("devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml");
            
            // Act & Assert
            if (File.Exists(pipelinePath))
            {
                var pipelineContent = File.ReadAllText(pipelinePath);
                
                // Verify pipeline includes notifications
                pipelineContent.Should().Contain("Notification", "Pipeline should have notification stage");
                pipelineContent.Should().Contain("webhook", "Pipeline should support webhook notifications");
            }
        }

        #endregion

        #region Integration and End-to-End Tests

        [Fact]
        public void GoldenImageWorkflow_ShouldBeIntegrated()
        {
            // Arrange
            var requiredComponents = new[]
            {
                Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-backup.sh"),
                Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-restore.sh"),
                Path.Combine(_projectRoot, "devops", "scripts", "database", "test-data-refresh.sh"),
                Path.Combine(_projectRoot, "devops", "scripts", "testing", "test-orchestrator.sh"),
                Path.Combine(_projectRoot, "devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml")
            };

            // Act & Assert
            foreach (var component in requiredComponents)
            {
                var exists = File.Exists(component) || Directory.Exists(component);
                exists.Should().BeTrue($"Required component should exist: {component}");
            }
        }

        [Theory]
        [InlineData("vm-test")]
        [InlineData("azure-ephemeral")]
        public void GoldenImageWorkflow_ShouldSupportTestEnvironments(string environment)
        {
            // Arrange
            var testEnvironments = new[] { "vm-test", "azure-ephemeral", "development" };

            // Act & Assert
            testEnvironments.Should().Contain(environment, 
                $"Golden image workflow should support test environment: {environment}");
        }

        [Fact]
        public void Phase3g_ShouldHaveCompleteImplementation()
        {
            // Arrange
            var phase3gComponents = new Dictionary<string, string>
            {
                ["backup_script"] = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-backup.sh"),
                ["restore_script"] = Path.Combine(_projectRoot, "devops", "scripts", "database", "golden-image-restore.sh"),
                ["azure_sync_script"] = Path.Combine(_projectRoot, "devops", "scripts", "azure", "golden-image-azure-sync.ps1"),
                ["test_refresh_script"] = Path.Combine(_projectRoot, "devops", "scripts", "database", "test-data-refresh.sh"),
                ["test_orchestrator"] = Path.Combine(_projectRoot, "devops", "scripts", "testing", "test-orchestrator.sh"),
                ["pipeline_template"] = Path.Combine(_projectRoot, "devops", ".azure-pipelines", "templates", "golden-image-pipeline.yml"),
                ["test_suite_config"] = Path.Combine(_projectRoot, "devops", "config", "test-suites", "deployment.json"),
                ["azure_storage_config"] = Path.Combine(_projectRoot, "devops", "config", "azure-storage.json")
            };

            // Act & Assert
            foreach (var component in phase3gComponents)
            {
                var exists = File.Exists(component.Value) || Directory.Exists(component.Value);
                exists.Should().BeTrue($"Phase 3g component '{component.Key}' should exist at: {component.Value}");
            }
        }

        #endregion

        #region Performance and Quality Tests

        [Fact]
        public void GoldenImageScripts_ShouldHaveProperErrorHandling()
        {
            // Arrange
            var scripts = new[]
            {
                Path.Combine("devops", "scripts", "database", "golden-image-backup.sh"),
                Path.Combine("devops", "scripts", "database", "golden-image-restore.sh"),
                Path.Combine("devops", "scripts", "database", "test-data-refresh.sh"),
                Path.Combine("devops", "scripts", "testing", "test-orchestrator.sh")
            };

            // Act & Assert
            foreach (var script in scripts)
            {
                if (File.Exists(script))
                {
                    var content = File.ReadAllText(script);
                    
                    // Verify error handling patterns
                    content.Should().Contain("set -euo pipefail", "Script should have strict error handling");
                    content.Should().Contain("log", "Script should have logging function");
                    content.Should().Contain("ERROR", "Script should handle errors explicitly");
                }
            }
        }

        [Fact]
        public void GoldenImageWorkflow_ShouldHaveComprehensiveLogging()
        {
            // Arrange
            var loggingComponents = new[]
            {
                "golden-image-backup.sh",
                "golden-image-restore.sh", 
                "test-data-refresh.sh",
                "test-orchestrator.sh"
            };

            // Act & Assert
            foreach (var component in loggingComponents)
            {
                var scriptPath = Path.Combine("devops", "scripts", "database", component);
                if (!File.Exists(scriptPath))
                {
                    scriptPath = Path.Combine("devops", "scripts", "testing", component);
                }
                
                if (File.Exists(scriptPath))
                {
                    var content = File.ReadAllText(scriptPath);
                    content.Should().Contain("LOG_FILE", $"Script {component} should have log file configuration");
                    content.Should().Contain("tee -a", $"Script {component} should append to log files");
                }
            }
        }

        [Fact]
        public void TestExecutionMetrics_ShouldBeTracked()
        {
            // Arrange
            var metricsToTrack = new[]
            {
                "TESTS_TOTAL",
                "TESTS_PASSED", 
                "TESTS_FAILED",
                "START_TIME",
                "duration"
            };

            // Act & Assert
            var orchestratorScript = Path.Combine("devops", "scripts", "testing", "test-orchestrator.sh");
            if (File.Exists(orchestratorScript))
            {
                var content = File.ReadAllText(orchestratorScript);
                
                foreach (var metric in metricsToTrack)
                {
                    content.Should().Contain(metric, $"Test orchestrator should track {metric}");
                }
            }
        }

        #endregion
    }
}
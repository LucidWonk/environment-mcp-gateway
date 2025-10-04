# API Reference - MCP Tools

Complete reference documentation for all 34 EnvironmentMCPGateway tools available in Claude Code.

## 📋 **Tool Categories Overview**

| Category | Tool Count | Description |
|----------|------------|-------------|
| [Git Operations](#git-operations) | 7 | Branch management, commits, workflow validation |
| [CI/CD Pipelines](#cicd-pipeline-management) | 6 | Pipeline control, monitoring, configuration |
| [VM Management](#vm-and-container-management) | 7 | Virtual machine and container operations |
| [Infrastructure](#development-infrastructure) | 8 | Solution analysis, environment status |
| [Database & Monitoring](#database-and-monitoring) | 6 | Database health, configuration management |

---

## 🔧 **Git Operations**

### **`list-branches`**
Show all branches with status, recent activity, and domain context analysis.

**Parameters:**
- `includeDomainContext` (optional): Include domain-specific context analysis
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"List all branches with their domain context and recent activity"
"Show me all branches without domain analysis"
```

**Response Format:**
```json
{
  "branches": [
    {
      "name": "feature/analysis/fractal-improvements",
      "status": "active",
      "lastCommit": "2025-02-03T10:30:00Z",
      "domainContext": "Analysis Engine",
      "recentActivity": "Updated fractal leg detection algorithm"
    }
  ]
}
```

### **`create-feature-branch`**
Create branches following DDD naming conventions (feature/analysis/*, feature/data/*, feature/messaging/*).

**Parameters:**
- `branchName` (required): Branch name with domain prefix
  - Type: `string`
  - Format: `feature/{domain}/{description}`
- `baseBranch` (optional): Base branch to create from
  - Type: `string`
  - Default: `"master"`

**Example Usage:**
```
"Create a new feature branch for analysis engine improvements"
"Create a feature branch for data layer optimization based on development branch"
```

**Valid Domain Prefixes:**
- `feature/analysis/*` - Analysis Engine domain
- `feature/data/*` - Data Layer domain  
- `feature/messaging/*` - Messaging Infrastructure domain
- `hotfix/production/*` - Production emergency fixes

### **`analyze-recent-commits`**
Show recent commits with impact analysis on trading domains.

**Parameters:**
- `count` (optional): Number of recent commits to analyze
  - Type: `number`
  - Default: `10`
- `includeDomainAnalysis` (optional): Include domain impact analysis
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Analyze the last 5 commits for domain impact"
"Show recent commits without domain analysis"
```

### **`get-commit-details`**
Retrieve detailed commit information with affected projects and domains.

**Parameters:**
- `commitHash` (required): Git commit hash (full or short)
  - Type: `string`
  - Example: `"abc123def"` or `"abc123def456..."`

**Example Usage:**
```
"Get details for commit abc123 including affected domains"
"Show me what projects were affected by the latest commit"
```

### **`merge-branch`**
Safe branch merging with conflict detection and analysis.

**Parameters:**
- `sourceBranch` (required): Source branch to merge from
  - Type: `string`
- `targetBranch` (optional): Target branch to merge into
  - Type: `string`
  - Default: `"master"`
- `analyzeOnly` (optional): Only analyze merge, do not execute
  - Type: `boolean`
  - Default: `false`

**Example Usage:**
```
"Merge my feature branch safely into master"
"Analyze what conflicts would occur if I merge feature/analysis/improvements"
```

### **`analyze-code-impact`**
Map file changes to DDD domains (Analysis, Data, Messaging).

**Parameters:**
- `filePaths` (optional): List of file paths to analyze
  - Type: `string[]`
- `targetBranch` (optional): Target branch for comparison
  - Type: `string`
- `baseBranch` (optional): Base branch for comparison
  - Type: `string`
  - Default: `"master"`

**Example Usage:**
```
"Analyze the impact of my current changes on trading domains"
"Check what domains are affected by changes in src/Analysis/"
```

### **`validate-git-workflow`**
Ensure proper Git workflow compliance with team standards.

**Parameters:**
- `strict` (optional): Enable strict workflow validation
  - Type: `boolean`
  - Default: `false`

**Example Usage:**
```
"Validate my current git workflow follows team standards"
"Perform strict validation of git workflow compliance"
```

---

## 🚀 **CI/CD Pipeline Management**

### **`list-pipelines`**
Display available CI/CD pipelines with status and recent runs.

**Parameters:**
- `folder` (optional): Filter pipelines by folder path
  - Type: `string`
- `includeStatus` (optional): Include detailed status information
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"List all available pipelines with their current status"
"Show pipelines in the CI folder only"
```

### **`trigger-pipeline`**
Initiate pipeline builds with environment targeting.

**Parameters:**
- `pipelineId` (required): Azure DevOps pipeline ID to trigger
  - Type: `number`
- `sourceBranch` (optional): Source branch for the build
  - Type: `string`
  - Default: `"refs/heads/main"`
- `variables` (optional): Pipeline variables for environment targeting
  - Type: `object`
- `templateParameters` (optional): Template parameters for the pipeline
  - Type: `object`

**Example Usage:**
```
"Trigger pipeline 123 for my feature branch"
"Start the CI pipeline with debug logging enabled"
```

**Common Variables:**
```json
{
  "BuildConfiguration": "Release",
  "TargetEnvironment": "vm-test",
  "RunIntegrationTests": "true",
  "DeploymentType": "blue-green"
}
```

### **`get-pipeline-status`**
Monitor running and completed pipeline executions.

**Parameters:**
- `pipelineId` (required): Azure DevOps pipeline ID to check
  - Type: `number`
- `includeRecentRuns` (optional): Include information about recent runs
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Check the status of pipeline 123 and show recent runs"
"Get current status of the CI pipeline"
```

### **`get-build-logs`**
Retrieve and analyze Azure DevOps build logs.

**Parameters:**
- `runId` (required): Pipeline run ID to retrieve logs from
  - Type: `number`
- `logId` (optional): Specific log ID (retrieves all if not specified)
  - Type: `number`
- `analyzeTradingRelevance` (optional): Analyze logs for trading platform relevance
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Get build logs for run 456 and analyze for trading system issues"
"Show me the detailed logs for the failed pipeline run"
```

### **`manage-pipeline-variables`**
Update pipeline configuration and environment variables.

**Parameters:**
- `pipelineId` (required): Azure DevOps pipeline ID to update
  - Type: `number`
- `variables` (required): Variables to set or update
  - Type: `object`

**Variable Schema:**
```json
{
  "VariableName": {
    "value": "string",
    "isSecret": false,
    "allowOverride": true
  }
}
```

**Example Usage:**
```
"Update the target environment variable for pipeline 123 to 'azure-ephemeral'"
"Set the database connection string for the deployment pipeline"
```

### **`sync-configurations`**
Ensure environment configuration consistency across environments.

**Parameters:**
- `sourceEnvironment` (required): Source environment to sync from
  - Type: `string`
  - Enum: `["local", "vm", "azure"]`
- `targetEnvironments` (required): Target environments to sync to
  - Type: `string[]`
  - Values: `["vm", "azure"]`
- `configTypes` (optional): Types of configuration to sync
  - Type: `string[]`
  - Default: `["all"]`
  - Options: `["environment-vars", "docker-compose", "pipeline-vars", "all"]`
- `dryRun` (optional): Preview changes without applying them
  - Type: `boolean`
  - Default: `false`

**Example Usage:**
```
"Sync configuration from local development to VM test environment"
"Preview configuration sync from VM to Azure without applying changes"
```

---

## 🖥️ **VM and Container Management**

### **`provision-vm`**
Create and configure new Hyper-V VMs for testing.

**Parameters:**
- `vmName` (required): Name for the new VM
  - Type: `string`
- `templateName` (optional): VM template to use
  - Type: `string`
  - Default: `"ubuntu-docker-dev"`
- `memoryMB` (optional): Memory allocation in MB
  - Type: `number`
  - Default: `4096`
- `cpuCores` (optional): Number of CPU cores
  - Type: `number`
  - Default: `2`
- `diskSizeGB` (optional): Disk size in GB
  - Type: `number`
  - Default: `40`
- `startAfterCreation` (optional): Start VM after creation
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Provision a new VM named 'test-vm-01' with 8GB RAM and 4 CPU cores"
"Create a standard VM for integration testing"
```

### **`deploy-to-vm`**
Deploy containers to VM using Docker Compose.

**Parameters:**
- `vmName` (required): Target VM name for deployment
  - Type: `string`
- `composeContent` (required): Docker Compose YAML content
  - Type: `string`
- `targetPath` (optional): Deployment path on VM
  - Type: `string`
  - Default: `"/opt/lucidwonks"`
- `environmentVars` (optional): Environment variables for deployment
  - Type: `object`
- `servicesToStart` (optional): Specific services to start
  - Type: `string[]`

**Example Usage:**
```
"Deploy the current Docker Compose configuration to test-vm-01"
"Deploy only the TimescaleDB and RedPanda services to the VM"
```

### **`vm-health-check`**
Monitor VM resource utilization and service status.

**Parameters:**
- `vmName` (required): VM name to check health
  - Type: `string`
- `includeContainerStatus` (optional): Include Docker container status
  - Type: `boolean`
  - Default: `true`
- `includeTradingServices` (optional): Focus on trading platform specific services
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Check health status of test-vm-01 including all container information"
"Get basic VM health without detailed container analysis"
```

### **`vm-logs`**
Retrieve application and system logs from VM deployments.

**Parameters:**
- `vmName` (required): VM name to retrieve logs from
  - Type: `string`
- `logType` (optional): Type of logs to retrieve
  - Type: `string`
  - Default: `"all"`
  - Enum: `["system", "docker", "application", "all"]`
- `serviceName` (optional): Specific service/container name for targeted logs
  - Type: `string`
- `lines` (optional): Number of recent log lines to retrieve
  - Type: `number`
  - Default: `100`
- `since` (optional): Retrieve logs since this time
  - Type: `string`
  - Default: `"1 hour ago"`

**Example Usage:**
```
"Get the last 200 lines of application logs from test-vm-01"
"Show TimescaleDB logs from the VM for the past 2 hours"
```

### **`promote-environment`**
Promote builds between environments (local → VM → Azure).

**Parameters:**
- `sourceEnvironment` (required): Source environment for promotion
  - Type: `string`
  - Enum: `["local", "vm", "azure"]`
- `targetEnvironment` (required): Target environment for promotion
  - Type: `string`
  - Enum: `["vm", "azure"]`
- `version` (required): Version/tag to promote
  - Type: `string`
- `vmName` (optional): VM name (required when promoting to/from VM)
  - Type: `string`
- `pipelineId` (optional): Pipeline ID (required when promoting to Azure)
  - Type: `number`
- `skipTests` (optional): Skip automated testing during promotion
  - Type: `boolean`
  - Default: `false`

**Example Usage:**
```
"Promote version v2.1.0 from VM test to Azure ephemeral environment"
"Promote the current local build to VM test environment"
```

### **`rollback-deployment`**
Revert to previous known-good deployment.

**Parameters:**
- `environment` (required): Environment to rollback
  - Type: `string`
  - Enum: `["vm", "azure"]`
- `vmName` (optional): VM name (required for VM rollbacks)
  - Type: `string`
- `pipelineId` (optional): Pipeline ID (required for Azure rollbacks)
  - Type: `number`
- `targetVersion` (optional): Specific version to rollback to
  - Type: `string`

**Example Usage:**
```
"Emergency rollback of production Azure environment to previous version"
"Rollback test-vm-01 to version v2.0.5"
```

---

## 🗄️ **Development Infrastructure**

### **`analyze-solution-structure`**
Parse and analyze the Lucidwonks solution structure, dependencies, and projects.

**Parameters:**
- `projectType` (optional): Filter projects by type
  - Type: `string`
  - Default: `"All"`
  - Enum: `["C#", "Python", "Other", "All"]`
- `includeDependencies` (optional): Include dependency analysis
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Analyze the complete solution structure with all dependencies"
"Show only C# projects and their dependencies"
```

### **`get-development-environment-status`**
Get comprehensive status of development environment (database, docker, git, solution).

**Parameters:**
- `checkDatabase` (optional): Check database connectivity
  - Type: `boolean`
  - Default: `true`
- `checkDocker` (optional): Check Docker services
  - Type: `boolean`
  - Default: `true`
- `checkGit` (optional): Check Git status
  - Type: `boolean`
  - Default: `true`

**Example Usage:**
```
"Get complete development environment status"
"Check only database and Docker, skip Git status"
```

### **`validate-build-configuration`**
Validate solution build configuration and check for issues.

**Parameters:**
- `projectName` (optional): Specific project to validate
  - Type: `string`

**Example Usage:**
```
"Validate build configuration for all projects"
"Check build configuration for the EnvironmentMCPGateway project"
```

### **`get-project-dependencies`**
Get detailed dependency information for a specific project.

**Parameters:**
- `projectName` (required): Name of the project to analyze
  - Type: `string`

**Example Usage:**
```
"Get dependencies for the Utility project"
"Show all dependencies for EnvironmentMCPGateway project"
```

### **`list-development-containers`**
List all development containers (TimescaleDB, RedPanda) with status and health.

**Parameters:** None

**Example Usage:**
```
"List all development containers with their health status"
"Show me what containers are currently running"
```

### **`get-container-health`**
Get detailed health check for a specific container.

**Parameters:**
- `containerId` (required): Container ID or name to check
  - Type: `string`

**Example Usage:**
```
"Get detailed health information for the TimescaleDB container"
"Check health status of container timescaledb"
```

### **`get-container-logs`**
Retrieve and analyze container logs for debugging.

**Parameters:**
- `containerId` (required): Container ID or name to get logs from
  - Type: `string`
- `lines` (optional): Number of recent log lines to retrieve
  - Type: `number`
  - Default: `50`

**Example Usage:**
```
"Get the last 100 lines from TimescaleDB container logs"
"Show recent logs from redpanda-0 container"
```

### **`restart-development-service`**
Restart specific development services (TimescaleDB, RedPanda).

**Parameters:**
- `serviceName` (required): Service name to restart
  - Type: `string`
  - Enum: `["timescaledb", "redpanda-0", "redpanda-console"]`

**Example Usage:**
```
"Restart the TimescaleDB service"
"Restart RedPanda messaging service"
```

---

## 🔍 **Database and Monitoring**

### **`analyze-development-infrastructure`**
Comprehensive infrastructure health analysis with recommendations.

**Parameters:** None

**Example Usage:**
```
"Perform comprehensive analysis of development infrastructure"
"Analyze infrastructure health and provide optimization recommendations"
```

### **`check-timescaledb-health`**
Detailed TimescaleDB container and connection status.

**Parameters:** None

**Example Usage:**
```
"Check TimescaleDB health and connection status"
"Verify TimescaleDB is running properly"
```

### **`check-redpanda-health`**
RedPanda cluster and console health verification.

**Parameters:** None

**Example Usage:**
```
"Check RedPanda cluster health and console status"
"Verify messaging infrastructure is operational"
```

### **`validate-development-stack`**
End-to-end validation of all development services.

**Parameters:** None

**Example Usage:**
```
"Validate the complete development stack"
"Perform end-to-end validation of all services"
```

### **`reload-configuration`**
Force reload configuration from .env files and recreate adapters.

**Parameters:** None

**Example Usage:**
```
"Reload configuration from environment files"
"Force refresh of all configuration and restart adapters"
```

### **`get-configuration-status`**
Get current configuration status and reload information.

**Parameters:** None

**Example Usage:**
```
"Show current configuration status"
"Get information about configuration load status"
```

### **`test-adapter-configuration`**
Test current adapter configurations and connectivity.

**Parameters:** None

**Example Usage:**
```
"Test all adapter configurations"
"Verify adapter connectivity and configuration"
```

---

## 🛠️ **Common Usage Patterns**

### **🔄 Daily Development Workflow**
```bash
# Morning startup
"Get comprehensive development environment status"
"List recent commits with domain impact analysis"

# During development
"Analyze impact of my current changes"
"Validate git workflow compliance"

# Before integration
"Create feature branch for analysis improvements"
"Merge my feature branch safely with conflict detection"
```

### **🚀 Deployment Workflow**
```bash
# Build and test
"Trigger CI pipeline for current branch"
"Monitor pipeline status and check for failures"

# Environment progression
"Provision VM for integration testing"
"Deploy validated build to VM environment"
"Promote build from VM to Azure ephemeral"
```

### **🔧 Troubleshooting Workflow**
```bash
# Diagnose issues
"Analyze development infrastructure for problems"
"Check TimescaleDB and RedPanda health status"
"Get container logs and analyze for errors"

# Fix issues
"Restart services that are not responding"
"Reload configuration and test adapters"
"Validate complete development stack"
```

### **🗄️ Database Management**
```bash
# Golden image operations (via separate scripts)
./devops/scripts/database/golden-image-backup.sh development
./devops/scripts/database/golden-image-restore.sh development latest

# Health monitoring
"Check TimescaleDB health and performance"
"Validate database connectivity and configuration"
```

---

## 📊 **Response Formats**

### **Standard Success Response**
```json
{
  "success": true,
  "timestamp": "2025-02-03T10:30:00Z",
  "data": {
    // Tool-specific response data
  },
  "metadata": {
    "executionTime": "1.2s",
    "version": "1.0.0"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "timestamp": "2025-02-03T10:30:00Z",
  "error": {
    "code": "ADAPTER_ERROR",
    "message": "Azure DevOps adapter connection failed",
    "details": "Authentication token has expired"
  },
  "suggestions": [
    "Refresh Azure DevOps authentication token",
    "Check network connectivity to Azure services"
  ]
}
```

### **Health Check Response Format**
```json
{
  "service": "TimescaleDB",
  "status": "healthy",
  "uptime": "2d 14h 32m",
  "metrics": {
    "cpu_usage": "15%",
    "memory_usage": "1.2GB / 2GB",
    "disk_usage": "3.4GB / 20GB",
    "connections": "5 / 100"
  },
  "last_check": "2025-02-03T10:30:00Z"
}
```

---

## 🔗 **Related Documentation**

- [MCP Gateway Usage Guide](../guides/mcp-gateway-usage.md) - Practical usage examples
- [Common Issues](../troubleshooting/common-issues.md) - Troubleshooting tool problems
- [Architecture Overview](./architecture.md) - Understanding the system design
- [Configuration Reference](./configuration.md) - Environment and tool configuration

---

**💡 Pro Tip: Use natural language with Claude Code - it will select the appropriate tools and parameters automatically based on your intent.**

*For advanced usage patterns, see [MCP Gateway Usage Guide](../guides/mcp-gateway-usage.md) →*
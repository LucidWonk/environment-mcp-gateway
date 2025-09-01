# MCP Gateway Usage Guide

Master the EnvironmentMCPGateway's 34 AI-powered tools for comprehensive DevOps automation.

## 🎯 **Overview**

The EnvironmentMCPGateway provides Claude Code with 34 specialized tools for managing your entire development lifecycle. This guide shows you how to leverage these tools effectively for maximum productivity.

## 📋 **Available Tool Categories**

### **🔧 Git Operations (7 tools)**
- `list-branches` - Show all branches with status and domain context
- `create-feature-branch` - Create DDD-named branches (feature/analysis/*, feature/data/*)
- `analyze-recent-commits` - View commits with trading domain impact analysis
- `get-commit-details` - Detailed commit info with affected projects
- `merge-branch` - Safe branch merging with conflict detection
- `analyze-code-impact` - Map file changes to DDD domains
- `validate-git-workflow` - Ensure proper Git workflow compliance

### **🚀 CI/CD Pipeline Management (6 tools)**
- `list-pipelines` - Display available pipelines with status
- `trigger-pipeline` - Initiate builds with environment targeting
- `get-pipeline-status` - Monitor running and completed executions
- `get-build-logs` - Retrieve and analyze Azure DevOps logs
- `manage-pipeline-variables` - Update configuration and environment variables
- `sync-configurations` - Ensure environment configuration consistency

### **🖥️ VM and Container Management (7 tools)**
- `provision-vm` - Create and configure new Hyper-V VMs
- `deploy-to-vm` - Deploy containers using Docker Compose
- `vm-health-check` - Monitor VM resource utilization and services
- `vm-logs` - Retrieve application and system logs
- `promote-environment` - Promote builds between environments
- `rollback-deployment` - Revert to previous known-good deployment
- `list-development-containers` - List containers with status and health

### **🗄️ Development Infrastructure (8 tools)**
- `analyze-solution-structure` - Parse Lucidwonks solution and dependencies
- `get-development-environment-status` - Comprehensive environment status
- `validate-build-configuration` - Check solution build setup
- `get-project-dependencies` - Detailed project dependency analysis
- `get-container-health` - Detailed health check for specific containers
- `get-container-logs` - Retrieve and analyze container logs
- `restart-development-service` - Restart specific services (TimescaleDB, RedPanda)
- `analyze-development-infrastructure` - Comprehensive health analysis

### **🔍 Database and Monitoring (6 tools)**
- `check-timescaledb-health` - TimescaleDB container and connection status
- `check-redpanda-health` - RedPanda cluster and console verification
- `validate-development-stack` - End-to-end validation of all services
- `reload-configuration` - Force reload from .env files
- `get-configuration-status` - Current configuration status
- `test-adapter-configuration` - Test adapter configurations and connectivity

## 💡 **Common Usage Patterns**

### **🚀 Daily Development Workflow**

**Start your development day:**
```
"Check the development environment status and ensure all services are healthy"
```
*Uses: get-development-environment-status, check-timescaledb-health, check-redpanda-health*

**Create a new feature branch:**
```
"Create a new feature branch for fractal analysis improvements"
```
*Uses: create-feature-branch with DDD naming conventions*

**Check your work before committing:**
```
"Analyze the impact of my recent changes on the trading platform domains"
```
*Uses: analyze-code-impact, validate-git-workflow*

### **🔧 Troubleshooting Scenarios**

**Service not responding:**
```
"The TimescaleDB container seems slow - check its health and logs"
```
*Uses: check-timescaledb-health, get-container-logs*

**Pipeline failure investigation:**
```
"The latest pipeline failed - show me the build logs and current status"
```
*Uses: get-pipeline-status, get-build-logs*

**Environment synchronization issues:**
```
"My local environment doesn't match the VM - sync the configurations"
```
*Uses: sync-configurations, get-configuration-status*

### **🚁 Deployment Operations**

**Prepare for deployment:**
```
"Create a VM test environment and deploy the latest build"
```
*Uses: provision-vm, deploy-to-vm, vm-health-check*

**Promote to next environment:**
```
"Promote the validated build from VM to Azure ephemeral environment"
```
*Uses: promote-environment with source VM and target Azure*

**Emergency rollback:**
```
"Something's wrong in production - rollback to the previous version immediately"
```
*Uses: rollback-deployment with emergency procedures*

## 🎨 **Advanced Usage Examples**

### **📊 Comprehensive Health Check**
```
Claude: "Perform a complete health assessment of our development infrastructure"

Expected Actions:
1. get-development-environment-status - Overall system status
2. analyze-development-infrastructure - Detailed analysis with recommendations  
3. check-timescaledb-health - Database connectivity and performance
4. check-redpanda-health - Message queue cluster status
5. list-development-containers - All container health
6. validate-development-stack - End-to-end validation
```

### **🔄 Full Environment Refresh**
```
Claude: "Reset my development environment to a clean state with latest code"

Expected Actions:
1. analyze-recent-commits - Check what's changed
2. validate-git-workflow - Ensure proper state
3. restart-development-service timescaledb - Clean database restart
4. restart-development-service redpanda-0 - Clean message queue
5. reload-configuration - Fresh configuration load
6. validate-development-stack - Verify everything works
```

### **🚀 Complete Deployment Pipeline**
```
Claude: "Deploy the latest feature branch through the complete pipeline to production"

Expected Actions:
1. analyze-code-impact - Assess change impact
2. validate-git-workflow - Ensure proper branch state
3. trigger-pipeline - Start CI/CD pipeline
4. get-pipeline-status - Monitor progress
5. provision-vm - Create test environment  
6. deploy-to-vm - Deploy to VM for testing
7. promote-environment - VM → Azure ephemeral
8. promote-environment - Azure ephemeral → Azure production
```

## 🏗️ **Environment-Specific Workflows**

### **🏠 Local Development**
```bash
# Daily startup routine
"Start all development services and verify they're healthy"

# Code integration
"Merge my feature branch and validate the integration" 

# Troubleshooting
"My local RedPanda isn't working - diagnose and fix it"
```

### **🖥️ VM Testing Environment**
```bash
# Environment setup
"Provision a new VM for testing the latest trading algorithm changes"

# Deployment testing  
"Deploy the current build to VM and run integration tests"

# Performance validation
"Check VM resource usage and application performance metrics"
```

### **☁️ Azure Environments**
```bash
# Pipeline orchestration
"Trigger the CI/CD pipeline and monitor its progress to Azure ephemeral"

# Production deployment
"Promote the validated build from ephemeral to production with approval"

# Monitoring and alerting
"Check the production pipeline status and any recent deployment issues"
```

## 🛠️ **Tool Integration Patterns**

### **📈 Development Workflow Integration**
```
1. Code Development:
   → create-feature-branch (start new work)
   → analyze-code-impact (assess changes)
   → validate-git-workflow (ensure compliance)

2. Local Testing:
   → get-development-environment-status (check setup)
   → restart-development-service (refresh services)
   → validate-development-stack (end-to-end test)

3. Integration:
   → merge-branch (safe merging)
   → trigger-pipeline (start CI/CD)
   → get-pipeline-status (monitor progress)

4. Deployment:
   → provision-vm (test environment)
   → deploy-to-vm (local deployment)
   → promote-environment (environment progression)
```

### **🔍 Debugging and Diagnostics Chain**
```
Problem Investigation:
→ get-development-environment-status (overview)
→ analyze-development-infrastructure (detailed analysis)
→ get-container-logs (specific service logs)
→ check-timescaledb-health / check-redpanda-health (service-specific)
→ test-adapter-configuration (configuration validation)

Resolution:
→ restart-development-service (service restart)
→ reload-configuration (configuration refresh)  
→ validate-development-stack (verify fix)
```

## 📝 **Best Practices**

### **✅ Do's**
- **Start with status checks** before making changes
- **Use domain-aware branching** (feature/analysis/*, feature/data/*)
- **Monitor pipeline progress** after triggering builds
- **Validate environments** before deployments
- **Check logs** when troubleshooting issues
- **Test configurations** after changes

### **❌ Don'ts**
- **Don't skip validation** steps before deployment
- **Don't ignore health warnings** from status checks
- **Don't promote** without proper testing
- **Don't rollback** without understanding the issue
- **Don't bypass** approval workflows for production

### **🎯 Efficiency Tips**
- **Combine related operations** in single requests
- **Use environment progression** (Local → VM → Azure)
- **Leverage domain analysis** for impact assessment
- **Monitor continuously** during deployments
- **Document issues** found during troubleshooting

## 🆘 **Emergency Procedures**

### **🚨 Production Issues**
```
"EMERGENCY: Production trading system is down - immediate rollback required"

1. get-pipeline-status - Assess current state
2. rollback-deployment - Emergency rollback to last known good
3. check-timescaledb-health - Verify database integrity
4. validate-development-stack - Confirm rollback success
5. get-build-logs - Investigate failure cause
```

### **🔧 Development Environment Broken**
```
"Development environment is completely broken - full reset needed"

1. analyze-development-infrastructure - Assess damage
2. restart-development-service timescaledb - Reset database
3. restart-development-service redpanda-0 - Reset messaging
4. reload-configuration - Fresh configuration
5. validate-development-stack - Verify recovery
```

### **🏗️ Build Pipeline Failures**
```
"All builds are failing - investigate and fix the pipeline"

1. list-pipelines - Check all pipeline status
2. get-build-logs - Analyze failure details
3. analyze-recent-commits - Check recent changes
4. validate-git-workflow - Verify repository state
5. manage-pipeline-variables - Fix configuration if needed
```

## 📊 **Monitoring and Metrics**

### **📈 Key Performance Indicators**
- **Environment Health Score** - Overall system status percentage
- **Pipeline Success Rate** - Percentage of successful deployments
- **Mean Time to Recovery** - Average time to resolve issues
- **Deployment Frequency** - How often deployments occur
- **Service Uptime** - Availability of critical services

### **📋 Regular Health Checks**
```bash
# Weekly health assessment
"Perform comprehensive weekly health check of all environments"

# Monthly optimization review
"Analyze performance trends and optimization opportunities"

# Quarterly infrastructure review  
"Complete infrastructure assessment with upgrade recommendations"
```

## 🔗 **Integration with Other Tools**

### **📝 Documentation Integration**
- Link to [Architecture Overview](../technical/architecture.md)
- Reference [Configuration Guide](../technical/configuration.md)
- Connect with [Troubleshooting Guide](../troubleshooting/common-issues.md)

### **🧪 Testing Integration**
- Coordinate with test execution frameworks
- Integrate with quality gate requirements
- Support automated testing workflows

### **📊 Monitoring Integration**
- Connect with Azure Application Insights
- Integrate with Log Analytics
- Support custom metric collection

---

**🎊 Congratulations! You're now ready to master the EnvironmentMCPGateway.**

*Next: [Pipeline Operations Guide](./pipeline-operations.md) →*
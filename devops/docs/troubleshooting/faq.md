# Frequently Asked Questions

Quick answers to common questions about the Lucidwonks Infrastructure DevOps platform.

## 🎯 **Getting Started**

### **Q: I'm new to the team. Where do I start?**
**A:** Follow this sequence:
1. Read the [Quick Start Guide](../guides/quick-start.md) (15 minutes)
2. Complete [Environment Setup](../guides/environment-setup.md) 
3. Work through [Team Onboarding](../team/onboarding.md)
4. Practice with [MCP Gateway Usage](../guides/mcp-gateway-usage.md)

### **Q: What's the difference between all these environments?**
**A:** We have 4 environments:
- **Local Development**: Your laptop with Docker containers
- **VM Test**: Local Hyper-V VM for integration testing
- **Azure Ephemeral**: Temporary cloud environment for validation
- **Azure Production**: Live trading system

### **Q: How do I know if my environment is working correctly?**
**A:** Ask Claude Code: `"Check the development environment status and ensure all services are healthy"`

### **Q: What's this MCP Gateway thing?**
**A:** The EnvironmentMCPGateway gives Claude Code 34 specialized tools to manage your entire DevOps workflow. Think of it as an AI assistant for infrastructure.

## 🔧 **Technical Setup**

### **Q: Docker Compose isn't starting. What's wrong?**
**A:** Most common issues:
```bash
# Check if ports are occupied
netstat -tlnp | grep -E "(5432|9092|8080)"

# Update Docker Compose if old version
docker-compose --version  # Should be 2.0+

# Reset networking if stuck
docker-compose down
docker network prune -f
docker-compose up -d
```

### **Q: I get "connection refused" errors. How do I fix this?**
**A:** Check the service startup order:
```bash
# Services must start in dependency order
docker-compose up -d timescaledb    # Database first
sleep 30                            # Wait for initialization
docker-compose up -d redpanda-0     # Message queue second
sleep 30
docker-compose up -d                # Everything else
```

### **Q: My TimescaleDB keeps restarting. Why?**
**A:** Usually memory or disk space:
```bash
# Check available resources
free -h    # Need at least 2GB free RAM
df -h      # Need at least 5GB free disk

# Check container logs
docker-compose logs timescaledb
```

### **Q: RedPanda console shows "connection failed". Help?**
**A:** Common fixes:
```bash
# Verify RedPanda is fully started
docker-compose logs redpanda-0 | tail -20

# Check port accessibility
curl -f http://localhost:8080/health

# Restart the console
docker-compose restart redpanda-console
```

### **Q: The MCP Gateway won't connect to Claude Code. What now?**
**A:** Step-by-step fix:
```bash
# 1. Ensure it's running
cd EnvironmentMCPGateway
npm run dev

# 2. Check Claude Code configuration
# Update MCP servers config with absolute path
# Restart Claude Code

# 3. Verify tools loaded
# Should see: "34 tools registered successfully"
```

## 🚀 **Development Workflow**

### **Q: How do I create a new feature branch properly?**
**A:** Use domain-driven naming:
```
"Create a new feature branch for fractal analysis improvements"
```
This creates: `feature/analysis/fractal-improvements`

### **Q: How do I know what my changes will affect?**
**A:** Use impact analysis:
```
"Analyze the impact of my recent changes on the trading platform domains"
```

### **Q: What's the proper way to test my changes?**
**A:** Follow the environment progression:
1. **Local**: Test in Docker containers
2. **VM**: Deploy to local VM for integration testing  
3. **Azure Ephemeral**: Cloud validation
4. **Azure Production**: Final deployment

### **Q: How do I deploy my changes to the VM for testing?**
**A:**
```
"Provision a new VM for testing and deploy my latest changes"
```

### **Q: My build is failing. How do I debug it?**
**A:**
```
"The latest pipeline failed - show me the build logs and current status"
```

## 🗄️ **Database and Data**

### **Q: How do I reset my database to a clean state?**
**A:** Use golden image restore:
```bash
./devops/scripts/database/golden-image-restore.sh development latest
```
Or ask Claude: `"Restore the development database from the latest golden image"`

### **Q: What's a "golden image"?**
**A:** A golden image is a validated database backup containing:
- Proper schema structure
- Reference data (currencies, exchanges)
- Sample trading data for testing
- All necessary extensions (TimescaleDB)

### **Q: How do I add test data to my environment?**
**A:**
```bash
./devops/scripts/database/test-data-refresh.sh development trading-sample
```

### **Q: Can I backup my current database state?**
**A:**
```
"Create a golden image backup of my current development database"
```

### **Q: How do I check if my database is healthy?**
**A:**
```
"Check TimescaleDB health and performance metrics"
```

## 🔄 **CI/CD and Deployments**

### **Q: How do I trigger a pipeline build?**
**A:**
```
"Trigger the CI pipeline for the latest changes on my feature branch"
```

### **Q: How do I monitor pipeline progress?**
**A:**
```
"Show me the current status of all running pipelines"
```

### **Q: What happens if a deployment fails?**
**A:** The system automatically:
1. Stops the deployment
2. Preserves the previous version
3. Alerts the team
4. Provides rollback options

### **Q: How do I rollback a deployment?**
**A:**
```
"Rollback the VM test environment to the previous version"
```

### **Q: Can I deploy directly to production?**
**A:** No. All production deployments:
- Must go through environment progression
- Require manual approval gates
- Need passing quality gates
- Include automatic rollback capabilities

### **Q: How do I know if a deployment succeeded?**
**A:**
```
"Verify the deployment health in the VM test environment"
```

## 🖥️ **VM and Azure Operations**

### **Q: How do I create a new VM for testing?**
**A:**
```
"Provision a new Hyper-V VM with standard configuration for testing"
```

### **Q: My VM isn't starting. What's wrong?**
**A:** Common issues:
- **Hyper-V not enabled**: Requires Windows Pro/Enterprise
- **Insufficient memory**: Need at least 4GB available
- **PowerShell execution policy**: Must allow script execution

### **Q: How do I check what's running on my VM?**
**A:**
```
"Show me the health status and running services on the test VM"
```

### **Q: How do I get logs from a VM?**
**A:**
```
"Get the application logs from the VM test environment"
```

### **Q: Can I connect directly to the VM?**
**A:** Yes, use SSH:
```bash
ssh user@vm-ip-address
```
IP addresses are shown in VM health status.

### **Q: How do I clean up old VMs?**
**A:** VMs are automatically managed, but you can:
```
"List all VMs and their current status for cleanup"
```

## 🔍 **Monitoring and Troubleshooting**

### **Q: How do I check if everything is working?**
**A:**
```
"Perform comprehensive health assessment of all environments"
```

### **Q: My application is running slowly. How do I diagnose?**
**A:**
```
"Analyze development infrastructure performance and provide recommendations"
```

### **Q: How do I see what's in the logs?**
**A:**
```
"Show me the recent logs for TimescaleDB and identify any error patterns"
```

### **Q: A service keeps crashing. How do I fix it?**
**A:**
```bash
# Check specific service health
"Check the health status of the RedPanda messaging service"

# Restart if needed
"Restart the TimescaleDB development service"
```

### **Q: How do I know which services are running?**
**A:**
```
"List all development containers with their health status"
```

### **Q: Everything seems broken. How do I reset?**
**A:** Complete environment reset:
```bash
# WARNING: This deletes all local data
docker-compose down -v
docker system prune -a -f
docker-compose up -d

# Then restore from backup
./devops/scripts/database/golden-image-restore.sh development latest
```

## ⚙️ **Configuration and Environment**

### **Q: How do I update configuration settings?**
**A:**
```
"Reload configuration from environment files and restart adapters"
```

### **Q: Where are configuration files stored?**
**A:**
- **Environment configs**: `devops/config/environments/`
- **Docker Compose**: `docker-compose.yml`
- **MCP Gateway**: `EnvironmentMCPGateway/.env`
- **Application settings**: `*/appsettings.json`

### **Q: How do I check current configuration status?**
**A:**
```
"Show me the current configuration status and any reload information"
```

### **Q: My environment variables aren't loading. Why?**
**A:** Check:
```bash
# Verify .env file exists and has correct format
cat .env | grep -v "^#"

# Restart services to reload variables
docker-compose restart

# Or force configuration reload
"Force reload configuration from .env files"
```

### **Q: How do I sync configurations between environments?**
**A:**
```
"Sync configuration from local development to VM test environment"
```

## 🔐 **Security and Access**

### **Q: How do I authenticate with Azure?**
**A:**
```bash
# Interactive login
az login

# Set default organization
az devops configure --defaults organization=https://dev.azure.com/yourorg

# Test authentication
az account show
```

### **Q: My Azure operations are failing with auth errors. Help?**
**A:**
```bash
# Clear and re-authenticate
az logout
az login
az account set --subscription "your-subscription-name"

# Update personal access token
echo "AZURE_DEVOPS_PAT=your-new-token" >> .env
```

### **Q: Are there any secrets I need to configure?**
**A:** Check the setup guide for:
- Azure DevOps personal access token
- Azure subscription credentials
- Database passwords (auto-generated)
- Service principal credentials (for production)

### **Q: How do I handle credential expiration?**
**A:** Credentials are managed in Azure Key Vault for production. For development:
```bash
# Update expired tokens
az account get-access-token  # Check current token
# Generate new PAT in Azure DevOps if expired
```

## 📊 **Performance and Optimization**

### **Q: The system feels slow. How do I optimize it?**
**A:**
```
"Analyze system performance and provide optimization recommendations"
```

### **Q: How much memory/CPU should I allocate?**
**A:** Minimum requirements:
- **Development**: 8GB RAM, 4 CPU cores
- **VM Test**: 4GB RAM, 2 CPU cores
- **Azure**: Auto-scaling based on load

### **Q: Can I run this on a less powerful machine?**
**A:** Reduce resource allocation:
```yaml
# In docker-compose.yml, add resource limits:
services:
  timescaledb:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### **Q: How do I monitor resource usage?**
**A:**
```bash
# Real-time monitoring
docker stats

# Or via MCP Gateway
"Show current resource utilization for all development containers"
```

## 🚨 **Emergency Situations**

### **Q: Production is down! What do I do?**
**A:** **STAY CALM** and follow emergency procedures:
```
"EMERGENCY: Production trading system is down - immediate rollback required"
```
This triggers automatic emergency protocols.

### **Q: A deployment broke everything. How do I fix it?**
**A:**
```
"Emergency rollback of [environment] to the last known good version"
```

### **Q: I accidentally deleted important data. Can I recover it?**
**A:** Check backup options:
```bash
# List available backups
ls -la devops/backups/

# Restore from backup
./devops/scripts/database/golden-image-restore.sh development backup-name
```

### **Q: Who should I contact in an emergency?**
**A:**
- **Production Issues**: DevOps Team Lead + Platform Architect
- **Security Issues**: Security Team + Platform Architect
- **Development Blocking**: Team Lead + Senior Developer

## 📞 **Getting Help**

### **Q: This FAQ doesn't answer my question. Where else can I look?**
**A:**
1. [Common Issues Guide](./common-issues.md) - Detailed troubleshooting
2. [Debugging Guide](./debugging.md) - Advanced techniques
3. [MCP Gateway Usage](../guides/mcp-gateway-usage.md) - Tool usage
4. [Architecture Overview](../technical/architecture.md) - System understanding

### **Q: How do I report a bug or request a feature?**
**A:**
- **Bugs**: Create GitHub issue with reproduction steps
- **Features**: Discuss with team lead first
- **Documentation issues**: Submit pull request with fixes

### **Q: Can I contribute to the documentation?**
**A:** Yes! See [Contributing Guide](../team/contributing.md) for guidelines.

### **Q: Is there training available?**
**A:** Yes:
- [Training Materials](../team/training.md) - Interactive exercises
- [Best Practices](../team/best-practices.md) - Recommended patterns
- [Team Workflows](../team/workflows.md) - Standard procedures

## 🔧 **Advanced Topics**

### **Q: How do I customize the MCP Gateway for my needs?**
**A:** See the MCP Gateway documentation:
```bash
cd EnvironmentMCPGateway
cat README.md  # Development setup
cat docs/ARCHITECTURE.md  # Technical details
```

### **Q: Can I add new tools to the MCP Gateway?**
**A:** Yes, follow the tool development guide:
```typescript
// Add to src/orchestrator/tool-registry.ts
// Implement adapter in src/adapters/
// Add tests in tests/
```

### **Q: How do I extend the CI/CD pipelines?**
**A:** Pipeline templates are in:
```
devops/.azure-pipelines/templates/
```
Follow Azure DevOps YAML pipeline documentation.

### **Q: Can I deploy to other cloud providers?**
**A:** Currently Azure-focused, but the Pulumi infrastructure code can be adapted for AWS/GCP. See `devops/infrastructure/` for IaC templates.

---

**💡 Still need help? Try asking Claude Code directly - it has access to all these tools and can provide real-time assistance!**

*Next: [Debugging Guide](./debugging.md) for advanced troubleshooting →*
# Common Issues and Solutions

Quick solutions to frequent problems encountered in the Lucidwonks Infrastructure DevOps platform.

## 🎯 **Quick Reference**

### **🔥 Emergency Actions**
- **Production Down**: [Production Emergency](#-production-emergency) 
- **Build Pipeline Broken**: [Pipeline Failures](#-pipeline-failures)
- **Database Issues**: [Database Problems](#-database-connectivity-issues)
- **Environment Corrupt**: [Environment Recovery](#-environment-recovery)

### **⚡ Most Common Issues**
1. [TimescaleDB Connection Failures](#timescaledb-connection-failures)
2. [RedPanda Service Not Starting](#redpanda-service-not-starting) 
3. [Docker Compose Network Issues](#docker-compose-network-issues)
4. [MCP Gateway Connection Problems](#mcp-gateway-connection-problems)
5. [Azure Pipeline Authentication](#azure-pipeline-authentication-failures)

## 🗄️ **Database Connectivity Issues**

### **TimescaleDB Connection Failures**

**Symptoms:**
- Applications cannot connect to database
- Connection timeout errors
- "Connection refused" messages

**Quick Diagnosis:**
```bash
# Check if TimescaleDB container is running
docker-compose ps timescaledb

# Check container logs
docker-compose logs timescaledb

# Test direct connection
docker-compose exec timescaledb psql -U postgres -c "SELECT version();"
```

**Solutions:**

**Solution 1: Service Not Started**
```bash
# Start TimescaleDB service
docker-compose up -d timescaledb

# Wait for initialization
sleep 30

# Verify service is ready
docker-compose exec timescaledb pg_isready -U postgres
```

**Solution 2: Configuration Issues**
```bash
# Check environment configuration
cat devops/config/environments/development.json

# Verify database credentials in .env
grep DB_ .env

# Restart with fresh configuration
docker-compose down
docker-compose up -d timescaledb
```

**Solution 3: Port Conflicts**
```bash
# Check if port 5432 is occupied
netstat -tlnp | grep 5432
# or on Linux
ss -tlnp | grep 5432

# If conflict exists, modify docker-compose.yml ports:
# ports:
#   - "5433:5432"  # Use different external port
```

**Solution 4: Container Corruption**
```bash
# Reset TimescaleDB container completely
docker-compose down
docker volume rm lucidwonks_postgres_data  # WARNING: DATA LOSS
docker-compose up -d timescaledb

# Restore from backup if needed
./devops/scripts/database/golden-image-restore.sh development latest
```

### **Database Performance Issues**

**Symptoms:**
- Slow query responses
- High CPU usage in TimescaleDB
- Connection pool exhaustion

**Quick Fix:**
```bash
# Check active connections
docker-compose exec timescaledb psql -U postgres -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';"

# Check slow queries
docker-compose exec timescaledb psql -U postgres -c "
SELECT query, state, query_start, now() - query_start as duration
FROM pg_stat_activity 
WHERE now() - query_start > interval '30 seconds';"

# Restart database service
docker-compose restart timescaledb
```

## 📨 **Messaging Infrastructure Issues**

### **RedPanda Service Not Starting**

**Symptoms:**
- RedPanda console not accessible
- Message publishing failures
- Kafka connection errors

**Quick Diagnosis:**
```bash
# Check RedPanda cluster status
docker-compose ps redpanda-0 redpanda-console

# Check RedPanda logs
docker-compose logs redpanda-0

# Check console accessibility
curl -f http://localhost:8080/health || echo "Console not accessible"
```

**Solutions:**

**Solution 1: Port Conflicts**
```bash
# Check ports 9092, 8080, 8081
netstat -tlnp | grep -E "(9092|8080|8081)"

# If conflicts, modify docker-compose.yml
# Change external ports while keeping internal ports same
```

**Solution 2: Memory Issues**
```bash
# Check available memory
free -h

# Reduce RedPanda memory if needed (docker-compose.yml)
# environment:
#   REDPANDA_PANDAPROXY_PANDAPROXY_API_MEMORY_LIMIT: 256Mi
```

**Solution 3: Network Configuration**
```bash
# Reset Docker networks
docker-compose down
docker network prune -f
docker-compose up -d

# Verify network connectivity
docker-compose exec redpanda-0 rpk cluster health
```

### **Message Queue Performance**

**Symptoms:**
- High message latency
- Consumer lag issues
- Topic creation failures

**Quick Fix:**
```bash
# Check cluster health
docker-compose exec redpanda-0 rpk cluster health

# List topics and check lag
docker-compose exec redpanda-0 rpk topic list
docker-compose exec redpanda-0 rpk group list

# Restart RedPanda cluster
docker-compose restart redpanda-0 redpanda-console
```

## 🐳 **Docker and Container Issues**

### **Docker Compose Network Issues**

**Symptoms:**
- Services cannot communicate
- DNS resolution failures
- Network isolation problems

**Quick Diagnosis:**
```bash
# Check Docker networks
docker network ls

# Inspect the project network
docker network inspect lucidwonks_default

# Test service connectivity
docker-compose exec console ping timescaledb
docker-compose exec console ping redpanda-0
```

**Solutions:**

**Solution 1: Network Recreation**
```bash
# Completely reset Docker networking
docker-compose down
docker network prune -f
docker system prune -f  # WARNING: Removes unused containers/images
docker-compose up -d
```

**Solution 2: Service Discovery Issues**
```bash
# Check service names in docker-compose.yml
# Ensure services use correct hostnames:
# Database: "timescaledb" not "localhost"
# RedPanda: "redpanda-0" not "localhost"

# Restart with dependency order
docker-compose up -d timescaledb
sleep 30
docker-compose up -d redpanda-0  
sleep 30
docker-compose up -d
```

**Solution 3: Port Mapping Conflicts**
```bash
# Check for conflicting services
sudo lsof -i :5432  # TimescaleDB
sudo lsof -i :9092  # RedPanda Kafka
sudo lsof -i :8080  # RedPanda Console

# Kill conflicting processes or change ports
```

### **Container Resource Issues**

**Symptoms:**
- Containers restarting frequently
- Out of memory errors
- High CPU usage

**Quick Fix:**
```bash
# Check container resource usage
docker stats

# Check system resources
df -h  # Disk space
free -h  # Memory
top    # CPU usage

# If low resources, stop non-essential services
docker-compose stop cyphyr-recon inflection-point-detector
```

## 🔌 **MCP Gateway Connection Problems**

### **Claude Code Cannot Connect to MCP Gateway**

**Symptoms:**
- Claude Code shows MCP connection errors
- Tools are not available in Claude
- MCP server startup failures

**Quick Diagnosis:**
```bash
# Check if MCP Gateway is running
cd EnvironmentMCPGateway
npm run status || echo "Not running"

# Check logs
cat logs/mcp-server.log

# Test tool loading
npm run test
```

**Solutions:**

**Solution 1: MCP Server Not Running**
```bash
# Start MCP Gateway
cd EnvironmentMCPGateway
npm install  # Ensure dependencies
npm run build  # Compile TypeScript
npm run dev  # Start in development mode

# Verify tools loaded
# Should see: "[MCP Server] 34 tools registered successfully"
```

**Solution 2: Claude Code Configuration**
```json
// Update Claude Code MCP configuration
{
  "mcpServers": {
    "environment-gateway": {
      "command": "node",
      "args": ["/absolute/path/to/lucidwonks/EnvironmentMCPGateway/dist/server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Solution 3: Permission Issues**
```bash
# Fix file permissions
chmod +x EnvironmentMCPGateway/dist/server.js

# Check Node.js version
node --version  # Should be 18+

# Reinstall dependencies if needed
cd EnvironmentMCPGateway
rm -rf node_modules package-lock.json
npm install
```

### **MCP Tools Not Working**

**Symptoms:**
- Some tools are available but fail
- Azure operations not working
- VM tools failing

**Quick Fix:**
```bash
# Check environment configuration
cd EnvironmentMCPGateway
npm run check-config

# Verify Azure CLI authentication
az account show

# Test specific tool categories
npm run test:git
npm run test:azure
npm run test:vm
```

## 🏗️ **Pipeline Failures**

### **Azure Pipeline Authentication Failures**

**Symptoms:**
- Pipeline triggers fail
- Azure API authentication errors
- Service principal issues

**Quick Diagnosis:**
```bash
# Test Azure CLI authentication
az account show
az devops project list --organization https://dev.azure.com/yourorg

# Check service principal (if used)
az account get-access-token
```

**Solutions:**

**Solution 1: Re-authenticate Azure CLI**
```bash
# Clear existing authentication
az logout
az login

# Set default organization
az devops configure --defaults organization=https://dev.azure.com/yourorg
az devops configure --defaults project=YourProject
```

**Solution 2: Service Principal Issues**
```bash
# Check service principal permissions
az role assignment list --assignee <service-principal-id>

# Verify permissions include:
# - Build (read, execute)
# - Release (read, write, execute)  
# - Code (read)
```

**Solution 3: Token Expiration**
```bash
# Generate new personal access token in Azure DevOps
# Update token in environment configuration
echo "AZURE_DEVOPS_PAT=your-new-token" >> .env

# Restart MCP Gateway
cd EnvironmentMCPGateway
npm restart
```

### **Build and Test Failures**

**Symptoms:**
- Unit tests failing
- Build compilation errors
- Package restore issues

**Quick Fix:**
```bash
# Clean and rebuild solution
dotnet clean
dotnet restore
dotnet build

# Run specific test project
dotnet test EnvironmentMCPGateway.Tests/EnvironmentMCPGateway.Tests.csproj

# Check for missing dependencies
dotnet list package --outdated
```

## 🖥️ **VM and Deployment Issues**

### **Hyper-V VM Provisioning Failures**

**Symptoms:**
- VM creation fails
- PowerShell execution errors
- Hyper-V service issues

**Quick Diagnosis:**
```bash
# Check Hyper-V status (Windows)
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V

# Check PowerShell execution policy
Get-ExecutionPolicy

# Test VM management
Get-VM
```

**Solutions:**

**Solution 1: Hyper-V Not Enabled**
```powershell
# Enable Hyper-V (requires admin PowerShell and restart)
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
# Restart computer after enabling
```

**Solution 2: PowerShell Execution Policy**
```powershell
# Set execution policy (as administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or for specific script
Set-ExecutionPolicy Bypass -Scope Process
```

**Solution 3: Insufficient Resources**
```powershell
# Check available memory
Get-WmiObject -Class Win32_ComputerSystem | Select-Object TotalPhysicalMemory

# Check available disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace

# Adjust VM resource allocation in devops/infrastructure/vm-config.json
```

### **Container Deployment to VM Failures**

**Symptoms:**
- Docker Compose deployment fails on VM
- SSH connection issues
- Network connectivity problems

**Quick Fix:**
```bash
# Test SSH connectivity to VM
ssh -o ConnectTimeout=10 user@vm-ip "echo 'Connection successful'"

# Check Docker status on VM
ssh user@vm-ip "docker --version && docker-compose --version"

# Verify VM network configuration
ssh user@vm-ip "ip addr show && ping -c 3 8.8.8.8"
```

## 🚨 **Production Emergency**

### **Complete Production Outage**

**Immediate Actions (0-5 minutes):**
```bash
# 1. Assess the situation
"Claude, check the production pipeline status and recent deployments"

# 2. Immediate rollback if deployment-related
"Emergency rollback of production to the last known good version"

# 3. Verify database integrity
"Check TimescaleDB health in production environment"

# 4. Validate rollback success
"Confirm production services are responding after rollback"
```

**Investigation Phase (5-30 minutes):**
```bash
# Analyze what went wrong
"Get detailed build logs for the failed production deployment"

# Check recent changes
"Analyze recent commits that may have caused the production issue"

# Document the incident
"Generate a comprehensive report of the production incident"
```

### **Partial Service Degradation**

**Assessment:**
```bash
# Check specific service health
"Check the health of all production containers and identify degraded services"

# Monitor performance metrics
"Show current resource utilization and performance metrics for production"

# Evaluate impact
"Assess which trading domains are affected by the service degradation"
```

## 🔄 **Environment Recovery**

### **Complete Environment Reset**

**For Development Environment:**
```bash
# Complete reset procedure
docker-compose down -v  # Removes volumes - DATA LOSS WARNING
docker system prune -a -f
docker volume prune -f

# Restart from scratch
docker-compose up -d
./devops/scripts/database/golden-image-restore.sh development latest

# Verify recovery
"Validate the complete development stack after reset"
```

**For VM Test Environment:**
```bash
# Reset VM environment
"Provision a fresh VM for testing and deploy the latest validated build"

# Restore test data
./devops/scripts/database/test-data-refresh.sh vm-test trading-sample

# Validate environment
"Perform comprehensive health check of the VM test environment"
```

## 📞 **When to Escalate**

### **Immediate Escalation Required:**
- Production trading system down > 5 minutes
- Data corruption in production database
- Security breach indicators
- Complete Azure infrastructure outage

### **Standard Escalation (within 4 hours):**
- Development environment issues blocking team
- Pipeline failures affecting multiple developers
- VM provisioning consistently failing
- Performance degradation > 50%

### **Escalation Contacts:**
- **Production Issues**: DevOps Team Lead + Platform Architect
- **Security Issues**: Security Team + Platform Architect  
- **Infrastructure Issues**: Cloud Engineering Team
- **Development Blocking**: Team Lead + Senior Developer

## 🛠️ **Diagnostic Commands Reference**

### **System Health Check:**
```bash
# Complete system diagnosis
"Perform comprehensive health assessment of all environments"

# Specific service checks
"Check TimescaleDB health and performance metrics"
"Verify RedPanda cluster status and message throughput"
"Analyze development infrastructure for issues and recommendations"
```

### **Log Collection:**
```bash
# Collect all relevant logs
docker-compose logs --tail=100 > system-logs.txt
cat devops/logs/golden-restore-$(date +%Y%m%d).log
cat EnvironmentMCPGateway/logs/mcp-server.log

# Analyze logs with MCP Gateway
"Analyze the container logs for TimescaleDB and identify any error patterns"
```

### **Performance Analysis:**
```bash
# Resource utilization
docker stats --no-stream
free -h
df -h

# Database performance
"Check database performance metrics and identify slow queries"

# Network analysis
"Test network connectivity between all development services"
```

## 📚 **Related Documentation**

- [FAQ](./faq.md) - Frequently asked questions
- [Debugging Guide](./debugging.md) - Advanced troubleshooting
- [MCP Gateway Usage](../guides/mcp-gateway-usage.md) - Tool usage patterns
- [Architecture Overview](../technical/architecture.md) - System understanding

---

**💡 Remember: When in doubt, start with `"Check the development environment status"` - it provides comprehensive overview of all systems.**

*Need more help? Check [FAQ](./faq.md) or [Debugging Guide](./debugging.md) →*
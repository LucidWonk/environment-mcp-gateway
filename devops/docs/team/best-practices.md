# Best Practices and Patterns

Essential guidelines, patterns, and anti-patterns for effective use of the Lucidwonks Infrastructure DevOps platform.

## 🎯 **Core Principles**

### **🔐 Security First**
- Never commit secrets, API keys, or passwords
- Use environment variables and Azure Key Vault for sensitive data
- Validate all inputs and sanitize outputs
- Apply principle of least privilege for all access

### **🚀 Automation Over Manual**
- Automate repetitive tasks through MCP Gateway
- Use Infrastructure as Code for all resources
- Implement GitOps workflows for all changes
- Prefer declarative over imperative approaches

### **📊 Observable and Measurable**
- Log all significant operations with structured data
- Monitor performance metrics and set alerts
- Track deployment success rates and rollback frequency
- Measure and optimize build and deployment times

### **🔄 Fail-Fast and Recover Quickly**
- Design systems to detect failures early
- Implement automatic rollback capabilities
- Practice recovery procedures regularly
- Document all incident response processes

---

## 🏗️ **Architecture Patterns**

### **✅ Recommended Patterns**

#### **Domain-Driven Branch Naming**
```bash
# ✅ GOOD: Domain-specific, descriptive
feature/analysis/fractal-leg-improvements
feature/data/timescaledb-optimization  
feature/messaging/redpanda-performance
hotfix/production/memory-leak-fix

# ❌ BAD: Generic, unclear
feature/updates
fix/bug
development
```

#### **Environment Progression**
```bash
# ✅ GOOD: Proper progression flow
Local Development → VM Test → Azure Ephemeral → Azure Production

# ❌ BAD: Skipping environments
Local Development → Azure Production (direct)
```

#### **MCP Gateway Usage Patterns**
```bash
# ✅ GOOD: Descriptive, action-oriented commands
"Create a golden image backup for the development environment"
"Deploy the validated build to VM test environment and verify health"
"Analyze recent commits for impact on trading domains"

# ❌ BAD: Vague, unclear commands  
"backup something"
"deploy stuff"
"check things"
```

#### **Infrastructure as Code Structure**
```csharp
// ✅ GOOD: Modular, reusable components
public class TradingPlatformStack : Stack
{
    public TradingPlatformStack(string environment)
    {
        var resourceGroup = new TradingResourceGroup(environment);
        var database = new TimescaleDatabaseComponent(resourceGroup, environment);
        var containerApps = new TradingApplications(resourceGroup, database, environment);
    }
}

// ❌ BAD: Monolithic, hard-coded values
public class MyStack : Stack
{
    public MyStack()
    {
        // 500 lines of resources in one constructor
    }
}
```

#### **Configuration Management**
```json
// ✅ GOOD: Environment-specific, organized
{
  "environment": "development",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "lucidwonks",
    "connection_pool_size": 10
  },
  "scaling": {
    "min_replicas": 1,
    "max_replicas": 3
  }
}

// ❌ BAD: Hard-coded, unorganized
{
  "db_host": "prod-server-123",
  "some_setting": "value",
  "random_config": true
}
```

### **❌ Anti-Patterns to Avoid**

#### **Manual Environment Changes**
```bash
# ❌ NEVER: Direct production changes
ssh production-server
sudo systemctl restart trading-app
docker run -d new-image:latest

# ✅ ALWAYS: Use proper deployment pipelines
"Trigger production deployment pipeline with approved build"
```

#### **Bypassing Quality Gates**
```bash
# ❌ NEVER: Skip tests or approvals
git push --force origin main
# Deploy directly without tests

# ✅ ALWAYS: Follow quality gates
"Trigger CI pipeline and wait for all quality gates to pass"
"Request approval for production deployment"
```

#### **Shared Development Environments**
```bash
# ❌ NEVER: Multiple developers on same environment
Team sharing single VM for testing
Multiple people modifying same database

# ✅ ALWAYS: Isolated environments per developer
Each developer has their own VM
Use golden images for consistent starting points
```

---

## 🛠️ **Development Workflow Best Practices**

### **🌟 Feature Development Pattern**

#### **1. Start with Clean Environment**
```bash
# Verify your starting point
"Check development environment status and ensure all services are healthy"

# Create feature branch with domain context
"Create a new feature branch for [domain]/[feature-description]"

# Ensure clean database state
"Restore development database from latest golden image if needed"
```

#### **2. Development Iteration**
```bash
# Regular impact assessment
"Analyze impact of my current changes on trading platform domains"

# Continuous validation
dotnet build && dotnet test
"Validate git workflow compliance"

# Keep environment healthy
"Restart any services that might be affected by my changes"
```

#### **3. Pre-Integration Validation**
```bash
# Comprehensive validation before merge
"Create golden image backup before integration"
"Run comprehensive health check of development environment"
"Validate build configuration for all affected projects"

# Merge with safety
"Merge my feature branch safely and check for conflicts"
```

#### **4. Integration Testing**
```bash
# Deploy to isolated test environment
"Provision fresh VM for integration testing"
"Deploy current build to VM and verify all services start correctly"
"Run full integration test suite on VM environment"

# Validate before promotion
"Verify deployment health and performance metrics"
```

### **🔄 Daily Development Routine**

#### **Morning Startup (5 minutes)**
```bash
# Check environment health
"Perform morning health check of all development services"

# Update and sync
git pull origin main
"Sync local configuration with latest team changes"

# Verify readiness
"Confirm development environment is ready for work"
```

#### **During Development**
```bash
# Regular health monitoring
"Check for any service degradation while I'm working"

# Impact tracking
"Show me what domains my current changes will affect"

# Continuous validation
"Validate my current git workflow status"
```

#### **End of Day (5 minutes)**
```bash
# Save progress
git add . && git commit -m "WIP: [description]"

# Environment cleanup
"Create end-of-day backup if I made significant database changes"

# Status check
"Generate summary of today's development activities"
```

---

## 🚀 **Deployment Best Practices**

### **🎯 Deployment Strategy**

#### **Progressive Deployment Pattern**
```bash
# Stage 1: Local Validation
"Validate build and tests pass locally"
"Create pre-deployment backup of current state"

# Stage 2: VM Integration
"Deploy to VM test environment with health checks"
"Run integration test suite and verify performance"

# Stage 3: Azure Ephemeral
"Promote validated build to Azure ephemeral environment"
"Execute comprehensive test scenarios in cloud environment"

# Stage 4: Production (with approval)
"Request production deployment approval with test evidence"
"Deploy to production with automatic rollback on failure"
```

#### **Zero-Downtime Deployment**
```bash
# Pre-deployment validation
"Verify target environment capacity and health"
"Create production backup before deployment"

# Gradual rollout
"Deploy with blue-green strategy"
"Monitor key performance indicators during rollout"

# Post-deployment verification
"Validate deployment success with health checks"
"Confirm all trading systems are operating normally"
```

### **🛡️ Safety Measures**

#### **Rollback Readiness**
```bash
# Always have rollback plan
"Document rollback procedure before any production deployment"
"Test rollback procedure in ephemeral environment"

# Quick rollback capability
"Prepare emergency rollback plan with single-command execution"
```

#### **Monitoring and Alerting**
```bash
# Continuous monitoring
"Set up monitoring for deployment progress and system health"
"Configure alerts for performance degradation"

# Active verification
"Monitor deployment metrics and trading system performance"
"Validate all critical business functions post-deployment"
```

---

## 🗄️ **Database Management Best Practices**

### **📊 Golden Image Strategy**

#### **Backup Naming Convention**
```bash
# ✅ GOOD: Descriptive, timestamped
golden-prod-migration-20250203-pre-v2.1.0
golden-dev-fractal-improvements-20250203
golden-test-performance-baseline-20250203

# ❌ BAD: Generic, unclear
backup1
latest  
test-backup
```

#### **Backup Frequency and Retention**
```bash
# Development: Before major changes
"Create golden image backup before schema modifications"
"Create backup before major data imports"

# Testing: Daily automated backups
"Schedule daily golden image creation for test environments"

# Production: Multiple retention levels
"Maintain hourly, daily, weekly, and monthly backup sets"
```

### **🔧 Database Operations**

#### **Schema Migration Pattern**
```bash
# ✅ GOOD: Controlled, tested migrations
1. Test migration in development
2. Validate with integration tests
3. Apply to VM test environment
4. Verify in Azure ephemeral
5. Production migration with rollback plan

# ❌ BAD: Direct production changes
1. Apply directly to production
2. Hope it works
```

#### **Data Refresh Strategy**
```bash
# Regular test data refresh
"Refresh VM test environment with latest golden image"
"Apply test data seeds for consistent testing"

# Performance testing data
"Create performance test datasets with realistic data volumes"
"Validate query performance before production deployment"
```

---

## 🖥️ **VM and Container Management**

### **📦 Container Best Practices**

#### **Resource Management**
```yaml
# ✅ GOOD: Explicit resource limits
services:
  timescaledb:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

# ❌ BAD: No resource constraints
services:
  timescaledb:
    image: timescale/timescaledb:latest
    # No resource limits
```

#### **Health Checks**
```yaml
# ✅ GOOD: Comprehensive health checks
healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# ❌ BAD: No health monitoring
# No healthcheck defined
```

### **🖥️ VM Management Patterns**

#### **VM Lifecycle Management**
```bash
# ✅ GOOD: Automated VM management
"Provision VM with standard configuration"
"Deploy application stack with health verification"
"Monitor resource usage and performance"
"Cleanup VM after testing completion"

# ❌ BAD: Manual VM management
# Manual VM creation and configuration
# No monitoring or cleanup
```

#### **VM Resource Optimization**
```bash
# Right-sizing VMs
"Analyze VM resource usage and optimize allocation"
"Scale VM resources based on workload requirements"

# Cost management
"Use ephemeral VMs for temporary testing"
"Schedule VM shutdown for non-business hours"
```

---

## 🔍 **Monitoring and Observability**

### **📊 Metrics and Monitoring**

#### **Key Performance Indicators**
```bash
# System Health Metrics
- Service uptime percentage
- Response time percentiles (P50, P95, P99)
- Error rate and success ratio
- Resource utilization (CPU, memory, disk)

# Business Metrics
- Trading system availability
- Data processing latency
- Pipeline success rate
- Deployment frequency and lead time
```

#### **Alerting Strategy**
```bash
# ✅ GOOD: Actionable alerts
Alert: "Production TimescaleDB connection pool > 80% capacity"
Action: Scale database or investigate connection leaks

Alert: "Deployment pipeline failed for 3 consecutive builds"
Action: Investigate code changes and fix build issues

# ❌ BAD: Noise alerts
Alert: "CPU usage above 50%"
Alert: "New log entry created"
```

### **🔍 Logging Best Practices**

#### **Structured Logging**
```csharp
// ✅ GOOD: Structured, searchable logs
_logger.LogInformation("Deployment completed successfully",
    new { 
        Environment = "production",
        Version = "v2.1.0",
        Duration = deploymentTime,
        ComponentsDeployed = components.Count
    });

// ❌ BAD: Unstructured text
_logger.LogInformation("Deployment done");
```

#### **Log Retention and Management**
```bash
# Environment-specific retention
Development: 7 days
Testing: 30 days  
Production: 90 days
Audit logs: 7 years

# Log aggregation and analysis
"Aggregate logs from all services for correlation analysis"
"Set up log-based alerting for error patterns"
```

---

## 🔐 **Security Best Practices**

### **🛡️ Access Control**

#### **Principle of Least Privilege**
```bash
# ✅ GOOD: Role-based access
Developer: Read access to dev/test, no production access
DevOps Engineer: Full access to dev/test, limited production access
Platform Architect: Full access to all environments

# ❌ BAD: Broad permissions
Everyone has admin access to everything
```

#### **Secret Management**
```bash
# ✅ GOOD: Centralized secret management
Azure Key Vault for production secrets
Environment variables for development
Automatic secret rotation

# ❌ BAD: Hard-coded secrets
Passwords in configuration files
API keys in source code
```

### **🔒 Network Security**

#### **Environment Isolation**
```bash
# Network segmentation
Development: Local Docker networks
Testing: Isolated VM networks
Production: Azure Virtual Networks with security groups

# Access controls
VPN required for production access
MFA for all administrative actions
```

---

## 📈 **Performance Optimization**

### **⚡ System Performance**

#### **Database Optimization**
```sql
-- ✅ GOOD: Optimized queries with indexes
CREATE INDEX CONCURRENTLY idx_tickerbars_time_ticker 
ON pricehistory.tickerbars (time DESC, ticker);

SELECT * FROM pricehistory.tickerbars 
WHERE ticker = 'AAPL' 
  AND time >= NOW() - INTERVAL '1 day'
ORDER BY time DESC;

-- ❌ BAD: Unoptimized queries
SELECT * FROM pricehistory.tickerbars WHERE ticker LIKE '%AAPL%';
```

#### **Container Performance**
```bash
# Resource optimization
"Monitor container resource usage and identify bottlenecks"
"Optimize container images for size and startup time"

# Network performance  
"Configure container networks for optimal communication"
"Monitor network latency between services"
```

### **🚀 Build and Deployment Performance**

#### **Pipeline Optimization**
```yaml
# ✅ GOOD: Parallel execution, caching
stages:
  - stage: Build
    jobs:
    - job: BuildAPI
      steps:
      - task: Cache@2  # Cache dependencies
      - task: DotNetCoreCLI@2  # Parallel builds
    - job: BuildUI
      steps:
      - task: Cache@2
      - task: NodeTool@0

# ❌ BAD: Sequential, no caching
steps:
  - task: DotNetCoreCLI@2  # Everything sequential
  - task: NodeTool@0       # No caching
```

---

## 🤝 **Team Collaboration**

### **💬 Communication Patterns**

#### **Effective Status Updates**
```bash
# ✅ GOOD: Specific, actionable
"Deployed fractal analysis improvements to VM test environment. 
Performance tests show 15% improvement in processing speed. 
Ready for ephemeral deployment pending code review."

# ❌ BAD: Vague, unclear
"Working on stuff. Almost done."
```

#### **Documentation Practices**
```markdown
# ✅ GOOD: Clear, actionable documentation
## Problem
Trading system latency increased after last deployment

## Investigation
- Checked database query performance (normal)
- Analyzed container resource usage (CPU spike in analysis service)
- Reviewed recent code changes (inefficient algorithm in fractal processing)

## Solution
- Optimized fractal algorithm implementation
- Added performance monitoring
- Created rollback procedure

## Verification
- Latency reduced by 25%
- CPU usage normalized
- All tests passing

# ❌ BAD: Unclear documentation
## Issue
Something is slow
Fixed it
```

### **🔄 Knowledge Sharing**

#### **Regular Knowledge Transfer**
```bash
# Weekly team sessions
- Architecture decision reviews
- Postmortem discussions
- New technology evaluations
- Best practice sharing

# Documentation maintenance
- Keep runbooks updated
- Document new procedures
- Share troubleshooting experiences
- Update onboarding materials
```

---

## 📚 **Continuous Learning**

### **🎓 Skill Development**

#### **Technical Skills**
- Cloud architecture and design patterns
- Container orchestration and optimization
- Database performance tuning
- Security best practices and compliance

#### **Soft Skills**
- Incident response and communication
- Cross-functional collaboration
- Technical writing and documentation
- Mentoring and knowledge transfer

### **📖 Recommended Resources**

#### **Books and Documentation**
- "Site Reliability Engineering" by Google
- "Building Microservices" by Sam Newman
- "Database Reliability Engineering" by Campbell & Majors
- Azure Architecture Center documentation

#### **Training and Certification**
- Azure DevOps Engineer Expert
- Azure Solutions Architect Expert
- Kubernetes certifications
- Security and compliance training

---

**🎯 Remember: These best practices evolve with our platform. Always question, improve, and share your insights!**

*Next: [Training Materials](./training.md) for hands-on practice →*
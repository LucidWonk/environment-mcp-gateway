# Team Onboarding Guide

Welcome to the Lucidwonks Infrastructure DevOps team! This guide will get you from zero to productive in your first week.

## 🎯 **Week 1 Learning Path**

### **📅 Day 1: Environment Setup**

**Morning (2-3 hours): Get Your Base System Ready**

**Prerequisites Check:**
```bash
# Verify required software
docker --version          # Need 20.10+
docker-compose --version  # Need 2.0+
node --version            # Need 18+
dotnet --version          # Need 8.0+
git --version             # Need 2.30+
az --version              # Azure CLI
```

**Setup Checklist:**
- [ ] Clone repository and navigate to project
- [ ] Run [Quick Start Guide](../guides/quick-start.md) (15 minutes)
- [ ] Verify all services start successfully
- [ ] Connect Claude Code to MCP Gateway
- [ ] Test basic MCP tools

**Your First Claude Commands:**
```
"Check the development environment status and ensure all services are healthy"
"List all available MCP tools for environment management"
"Create a test backup of the development database"
```

**Afternoon (2-3 hours): Understanding the Platform**

**Reading List:**
- [ ] [Platform Overview](../README.md) - High-level understanding
- [ ] [Architecture Overview](../technical/architecture.md) - System design
- [ ] [MCP Gateway Usage](../guides/mcp-gateway-usage.md) - Core tools

**Hands-On Exercise:**
```
# Practice environment management
"Perform comprehensive health assessment of all environments"
"Show me the status of all development containers"
"Create a golden image backup named 'my-first-backup'"
```

**End of Day Check:**
- [ ] All services running locally
- [ ] Claude Code connected and working
- [ ] Basic MCP commands successful
- [ ] Understanding of 4 environments (Local, VM, Azure Ephemeral, Production)

---

### **📅 Day 2: Development Workflow**

**Morning (3 hours): Git and Branch Management**

**Learn Domain-Driven Development:**
```
# Practice branch creation
"Create a new feature branch for analysis improvements"
"Create a new feature branch for data layer enhancements"  
"Create a new feature branch for messaging infrastructure updates"
```

**Understanding Impact Analysis:**
```
# Check what your changes affect
"Analyze the impact of recent changes on trading platform domains"
"Show recent commits with impact analysis on trading domains"
```

**Git Workflow Practice:**
```bash
# Manual practice alongside MCP tools
git checkout -b feature/analysis/my-test-feature
# Make some test changes to analysis files
git add .
git commit -m "Test commit for learning"

# Then use MCP to validate
"Validate git workflow compliance for current branch"
"Analyze code impact of my recent changes"
```

**Afternoon (2 hours): Pipeline Operations**

**Pipeline Basics:**
```
# Learn pipeline management
"List all available pipelines with current status"
"Show me the details of the CI pipeline configuration"
```

**Build and Test Workflow:**
```bash
# Manual testing
dotnet clean
dotnet restore  
dotnet build
dotnet test

# Then via MCP Gateway
"Trigger a test build for my feature branch"
"Monitor the pipeline progress and show me any failures"
```

**End of Day Goals:**
- [ ] Comfortable with domain-driven branch naming
- [ ] Understand impact analysis concept
- [ ] Can trigger and monitor pipelines
- [ ] Know difference between CI and CD pipelines

---

### **📅 Day 3: Database and Data Management**

**Morning (2 hours): Database Operations**

**TimescaleDB Basics:**
```
# Database health and management
"Check TimescaleDB health and performance metrics"
"Show me the structure of the trading database schema"
```

**Golden Image Workflow:**
```bash
# Practice backup and restore
"Create a golden image backup of development environment"
"List all available golden image backups"

# Manual verification
docker-compose exec timescaledb psql -U postgres -d lucidwonks -c "
SELECT ticker, COUNT(*) as bars_count 
FROM pricehistory.tickerbars 
GROUP BY ticker 
ORDER BY ticker;"
```

**Afternoon (3 hours): VM and Container Management**

**Virtual Machine Setup:**
```
# Learn VM operations (Windows only - requires Hyper-V)
"Provision a new VM for testing with standard configuration"
"Check the health status of all VMs"
"Get logs from the VM test environment"
```

**Container Operations:**
```
# Container health and management
"List all development containers with health status"
"Get detailed health check for TimescaleDB container"
"Restart the RedPanda messaging service"
```

**End of Day Achievements:**
- [ ] Comfortable with database backup/restore
- [ ] Understanding of golden image concept
- [ ] Can provision and manage VMs (if on Windows)
- [ ] Know how to troubleshoot container issues

---

### **📅 Day 4: Advanced Operations**

**Morning (3 hours): Environment Promotion**

**Deployment Pipeline:**
```
# Learn environment progression
"Deploy current build to VM test environment"
"Monitor deployment progress and verify success"
"Promote validated build from VM to Azure ephemeral"
```

**Configuration Management:**
```
# Configuration synchronization
"Show current configuration status across all environments"
"Sync configuration from development to VM test environment"
"Reload configuration from environment files"
```

**Afternoon (2 hours): Monitoring and Diagnostics**

**Health Monitoring:**
```
# Comprehensive monitoring
"Analyze development infrastructure for performance bottlenecks"
"Generate health report for all environments"
"Check for any configuration drift between environments"
```

**Log Analysis:**
```
# Log management and analysis
"Get container logs for TimescaleDB and analyze for errors"
"Show VM logs for the past hour"
"Analyze recent pipeline logs for failure patterns"
```

**End of Day Competencies:**
- [ ] Understand environment promotion flow
- [ ] Can deploy to multiple environments
- [ ] Know how to monitor system health
- [ ] Comfortable with log analysis

---

### **📅 Day 5: Troubleshooting and Emergency Procedures**

**Morning (2 hours): Common Issues Resolution**

**Practice Problem Solving:**
```bash
# Simulate common issues and resolve them
docker-compose stop timescaledb
# Now practice diagnosing and fixing
"The TimescaleDB seems to be down - diagnose and fix the issue"

docker-compose stop redpanda-0
"RedPanda messaging is not working - what's wrong and how do I fix it?"
```

**Use Troubleshooting Resources:**
- [ ] Work through [Common Issues Guide](../troubleshooting/common-issues.md)
- [ ] Practice with [FAQ scenarios](../troubleshooting/faq.md)
- [ ] Learn diagnostic commands

**Afternoon (3 hours): Emergency Response**

**Emergency Procedures Training:**
```
# Practice emergency scenarios (in safe environment)
"Simulate production rollback procedure in VM environment"
"Practice emergency database restore from backup"
"Test complete environment recovery process"
```

**Team Communication:**
- [ ] Learn escalation procedures
- [ ] Understand emergency contact protocols
- [ ] Practice incident documentation

**End of Week Assessment:**
- [ ] Can independently resolve common issues
- [ ] Know when and how to escalate problems
- [ ] Understand emergency response procedures
- [ ] Ready for real project work

---

## 🎓 **Week 2-4: Advanced Learning**

### **Week 2: Specialization Areas**

**Choose Your Focus Area:**
- **Pipeline Engineering**: Azure DevOps, YAML templates, quality gates
- **Infrastructure Management**: Pulumi, Azure resources, cost optimization
- **Database Operations**: TimescaleDB optimization, backup strategies
- **Monitoring & Observability**: Application Insights, alerting, dashboards

### **Week 3: Team Integration**

**Real Project Work:**
- [ ] Join daily standups and retrospectives
- [ ] Take on small bug fixes and improvements
- [ ] Review team member pull requests
- [ ] Contribute to documentation updates

### **Week 4: Leadership and Mentoring**

**Knowledge Sharing:**
- [ ] Lead a team knowledge sharing session
- [ ] Write a blog post about your learning experience
- [ ] Mentor the next new team member
- [ ] Identify improvement opportunities

---

## 🛠️ **Your Toolkit Reference**

### **📋 Daily Commands You'll Use**
```bash
# Environment health check
"Check the development environment status"

# Service management
"Restart services that aren't responding properly"

# Pipeline operations
"Trigger CI pipeline for my latest changes"
"Check the status of all running pipelines"

# Database operations
"Create backup before making schema changes"
"Restore development database to clean state"

# VM and deployment
"Deploy to VM test environment for integration testing"
"Check health and logs of test environment"
```

### **📖 Essential Documentation Bookmarks**
- [Quick Start Guide](../guides/quick-start.md) - When things go wrong
- [MCP Gateway Usage](../guides/mcp-gateway-usage.md) - Your daily reference
- [Common Issues](../troubleshooting/common-issues.md) - First stop for problems
- [FAQ](../troubleshooting/faq.md) - Quick answers
- [Architecture Overview](../technical/architecture.md) - Understanding the system

### **🔧 Local Development Setup**
```bash
# Your daily startup routine
docker-compose up -d
cd EnvironmentMCPGateway && npm run dev

# Your daily shutdown routine  
docker-compose down
# MCP Gateway stops automatically with Claude Code
```

### **📱 Emergency Contact Information**
- **DevOps Team Lead**: [Contact Information]
- **Platform Architect**: [Contact Information]  
- **On-Call Engineer**: [Rotation Schedule]
- **Emergency Escalation**: [Procedures Document]

---

## 🎯 **Learning Objectives and Assessments**

### **End of Week 1 - Self Assessment**

**Technical Skills (1-5 scale):**
- [ ] Can start/stop local development environment independently
- [ ] Comfortable using MCP Gateway tools via Claude Code
- [ ] Understand the 4-environment architecture
- [ ] Can create and manage feature branches properly
- [ ] Know how to backup and restore databases
- [ ] Can deploy to VM test environment
- [ ] Understand basic troubleshooting procedures

**Confidence Levels:**
- [ ] **Beginner** (1-2): Need guidance for most tasks
- [ ] **Developing** (3): Can do routine tasks with occasional help
- [ ] **Proficient** (4): Independent on common tasks
- [ ] **Advanced** (5): Can help others and handle complex scenarios

### **End of Month - Team Assessment**

**Competency Areas:**
- **Infrastructure Management**: Can provision and manage environments
- **Pipeline Operations**: Comfortable with CI/CD workflows
- **Database Administration**: Proficient with backup/restore operations
- **Troubleshooting**: Can diagnose and resolve common issues
- **Team Collaboration**: Effective communication and knowledge sharing

### **90-Day Goals**
- [ ] Lead a feature implementation end-to-end
- [ ] Improve or create new MCP Gateway tools
- [ ] Mentor a new team member
- [ ] Contribute to platform architecture decisions
- [ ] Identify and implement process improvements

---

## 🤝 **Team Integration**

### **🎭 Meet Your Team**

**Platform Architect**
- Final technical decision maker
- Architecture and design guidance
- Performance and scalability expertise

**DevOps Team Lead**  
- Day-to-day operations management
- Process improvement and standards
- Team coordination and planning

**Senior DevOps Engineers**
- Mentoring and code review
- Complex problem solving
- Infrastructure specialization

**Trading Domain Experts**
- Business logic and requirements
- Trading system knowledge
- Performance optimization

### **📅 Team Rituals**

**Daily Standups (15 minutes)**
- What you accomplished yesterday
- What you're working on today  
- Any blockers or help needed

**Weekly Retrospectives (45 minutes)**
- Process improvements
- Lessons learned
- Team feedback and suggestions

**Monthly Architecture Reviews (2 hours)**
- Technical debt assessment
- Performance analysis
- Future planning and roadmap

**Quarterly Training Sessions (Half day)**
- New technology exploration
- Skill development workshops
- Industry best practices review

### **🎓 Mentorship Program**

**Your Mentor Assignment:**
- Experienced team member paired with you
- Weekly 1:1 sessions for first month
- Project shadowing and code review
- Career development guidance

**Mentoring Others:**
- After 6 months, you'll mentor new members
- Share your learning experience
- Contribute to onboarding improvements
- Build teaching and leadership skills

---

## 📈 **Career Development Path**

### **6-Month Milestones**
- [ ] **Technical Proficiency**: Independent on all routine tasks
- [ ] **System Understanding**: Deep knowledge of platform architecture
- [ ] **Problem Solving**: Can handle complex troubleshooting
- [ ] **Team Contribution**: Regular contributions to improvements

### **1-Year Goals**
- [ ] **Technical Leadership**: Lead major feature implementations
- [ ] **Innovation**: Contribute new tools and processes
- [ ] **Mentoring**: Successfully onboard new team members
- [ ] **Strategy**: Participate in architecture and planning decisions

### **Growth Opportunities**
- **Specialization Tracks**: Infrastructure, Pipelines, Database, Security
- **Leadership Roles**: Team Lead, Platform Architect, Principal Engineer
- **Cross-Functional**: Trading Algorithms, Data Engineering, Security
- **External**: Conference speaking, Open source contributions

---

**🎉 Welcome to the team! We're excited to see what you'll build with us.**

*Ready to start? Begin with [Quick Start Guide](../guides/quick-start.md) →*
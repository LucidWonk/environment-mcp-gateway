# Environment MCP Gateway Setup and Installation Guide

## Overview

The Environment MCP Gateway is a TypeScript-based Model Context Protocol (MCP) server that provides comprehensive development environment management for the Lucidwonks trading platform. It integrates with Git, Azure DevOps, Docker, VM management, and provides advanced context engineering capabilities including holistic context updates and cross-domain impact analysis with Step 4.2 Performance Optimization.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11 with WSL2, macOS, or Linux
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **Git**: Version 2.30 or higher
- **Docker**: Version 20.10 or higher (for infrastructure services)
- **.NET SDK**: Version 8.0 or higher (for full platform integration)
- **Python**: Version 3.9 or higher (for Git hooks automation)

### Required Access
- Git repository access (clone permissions)
- Azure DevOps access (if using CI/CD features)
- Docker daemon access
- File system permissions for context file management

### Network Requirements
- Internet access for npm package installation
- Access to Azure DevOps APIs (if using CI/CD features)
- Local network access for Docker services

## Configuration Options

### Default Configuration
The following settings will be used unless you specify otherwise:

**Core MCP Settings:**
- Server Port: `3000` (MCP server listening port)
- Server Name: `lucidwonks-environment-gateway` (MCP client identifier)
- Context Domains: `Analysis,Data,Messaging,Infrastructure` (DDD domain boundaries)
- Log Level: `info` (console and file logging level)

**Performance Optimization Settings:**
- Caching: `enabled` (Step 4.2 multi-level caching system)
- Parallel Processing: `enabled` (concurrent context operations)
- Memory Optimization: `enabled` (object pooling and streaming)

**Optional Components:**
- [ ] **Git Hooks Automation**: Automatically update context files on commits (recommended for teams)
- [ ] **Azure DevOps Integration**: CI/CD pipeline management and monitoring
- [ ] **Docker VM Management**: Hyper-V VM provisioning and deployment
- [ ] **Advanced Performance Monitoring**: Real-time metrics and benchmarking

> **Customization**: Review these defaults and modify the `.env` file after installation if needed.

### Quick Setup Modes

```bash
# Default setup with recommended components
./setup-mcp-gateway.sh --default

# Minimal setup (MCP server only)
./setup-mcp-gateway.sh --minimal

# Full setup with all optional components
./setup-mcp-gateway.sh --full

# Interactive configuration
./setup-mcp-gateway.sh --interactive
```

## Installation Steps

### Step 1: Environment Preparation

#### 1.1 Clone and Navigate to Repository
```bash
# Navigate to your development directory
cd /path/to/your/projects

# Clone the Lucidwonks repository
git clone <repository-url> Lucidwonks
cd Lucidwonks

# Navigate to MCP Gateway directory
cd EnvironmentMCPGateway
```

#### 1.2 Verify Prerequisites
```bash
# Check all prerequisites at once
npm run check-prerequisites

# Or check individually:
node --version    # Should be 18.0+
npm --version     # Should be 9.0+
git --version     # Should be 2.30+
docker --version  # Should be 20.10+
python3 --version # Should be 3.9+ (for Git hooks)
```

### Step 2: Core MCP Gateway Installation

#### 2.1 Install Dependencies and Build
```bash
# Install npm dependencies
npm install

# Build TypeScript project
npm run build

# Run linting (ensures code quality)
npm run lint
```

#### 2.2 Create Base Configuration
```bash
# Generate default configuration
npm run generate-config

# This creates .env with default settings shown above
```

### Step 3: Optional Component Installation

#### 3.1 Git Hooks Automation (Recommended)
If you selected Git hooks automation:

```bash
# Git hooks are automatically installed with MCP Gateway
# The pre-commit hook will automatically update context files
# when C#, TypeScript, or JavaScript files are modified

# Test the Git hooks by making a code change
echo "// Test comment" >> ../Utility/Analysis/TestFile.cs
git add ../Utility/Analysis/TestFile.cs
git commit -m "Test MCP context engineering hook"

# The hook will automatically run and update .context files
```

#### 3.2 Azure DevOps Integration
If you selected Azure DevOps integration:

```bash
# Configure Azure DevOps credentials
npm run config:azure-devops

# This will prompt for:
# - Organization name
# - Personal Access Token
# - Project configuration
```

#### 3.3 Docker VM Management
If you selected VM management:

```bash
# Start infrastructure services
cd ..
docker-compose up -d

# Initialize database
dotnet run --project Console/Console.csproj

# Return to MCP Gateway
cd EnvironmentMCPGateway
```

#### 3.4 Advanced Performance Monitoring
If you selected performance monitoring:

```bash
# Enable performance benchmarking
npm run enable-performance-monitoring

# Run performance validation
npm run test:performance
```

### Step 4: MCP Client Configuration

#### 4.1 Register with Claude Desktop
Add to your MCP client configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lucidwonks-environment-gateway": {
      "command": "node",
      "args": ["path/to/Lucidwonks/EnvironmentMCPGateway/dist/server.js"],
      "cwd": "path/to/Lucidwonks/EnvironmentMCPGateway",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 4.2 Customize Configuration (Optional)
Edit `.env` file to override defaults:

```env
# Example customizations
MCP_SERVER_PORT=3001
LOG_LEVEL=debug
CONTEXT_DOMAINS=Analysis,Data,Messaging,Infrastructure,Testing

# Azure DevOps (if component selected)
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_TOKEN=your-personal-access-token

# Performance tuning
CACHE_SIZE=1000
PARALLEL_WORKERS=8
MEMORY_POOL_SIZE=100
```

## Verification Steps

### Quick Health Check

#### 4.1 Verify Core Installation
```bash
# Run comprehensive health check
npm run health-check

# Should show:
# ✅ TypeScript compilation successful
# ✅ All dependencies installed
# ✅ Configuration files present
# ✅ Core services operational
```

#### 4.2 Test MCP Server Startup
```bash
# Start server in test mode
npm run start:test

# You should see:
# 🚀 MCP Gateway starting...
# ✅ Server listening on port 3000
# ✅ Context domains loaded: Analysis, Data, Messaging, Infrastructure
# ✅ Performance optimizations active
```

### Comprehensive Testing

#### 4.3 Run Full Test Suite
```bash
# Run all tests including performance benchmarks
npm test

# Run only integration tests
npm run test:integration

# Run performance validation
npm run test:performance
```

#### 4.4 Test Selected Optional Components

**If Git Hooks Selected:**
```bash
# Test Git hooks integration
echo "// Test comment" >> test-file.cs
git add test-file.cs
git commit -m "Test context engineering hook"

# Should show automatic context updates
```

**If Azure DevOps Selected:**
```bash
# Test Azure DevOps connectivity
npm run test:azure-devops
```

**If VM Management Selected:**
```bash
# Test Docker services
npm run test:docker-services

# Test database connectivity  
npm run test:database
```

### Common Issues and Solutions

#### Issue: "Cannot find module" errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Issue: MCP client connection failures
**Solution**:
1. Verify path in `claude_desktop_config.json` is absolute
2. Restart Claude Desktop after configuration changes
3. Check server logs: `tail -f logs/mcp-gateway.log`

#### Issue: Git hooks not working (Windows)
**Solution**:
```bash
# Install dos2unix for line ending fixes
choco install dos2unix
# Or use WSL: wsl ../scripts/setup-git-hooks.sh
```

#### Issue: Performance tests failing
**Solution**:
```bash
# Reset performance configurations
npm run reset-performance-config
npm run test:performance
```

## Basic Usage

### Getting Started

#### Start the MCP Server
```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev

# Debug mode with verbose logging
npm run debug
```

### Available MCP Tools by Category

#### **Environment Management**
- `analyze-solution-structure` - Analyze .NET solution and dependencies
- `get-development-environment-status` - Check Docker services, database, Git status
- `validate-build-configuration` - Verify project build settings

#### **Context Engineering** 
- `execute-holistic-context-update` - Update context files across domains
- `coordinate-cross-domain-update` - Analyze and coordinate cross-domain changes
- `analyze-domain-map` - Map domain boundaries and relationships
- `predict-change-impact` - Predict impact of code changes

#### **Git Integration**
- `list-branches` - Show branches with domain context
- `create-feature-branch` - Create DDD-compliant feature branches
- `analyze-recent-commits` - Show commits with domain impact analysis

#### **Performance & CI/CD** (if components selected)
- `list-pipelines` - Show Azure DevOps pipelines
- `trigger-pipeline` - Start pipeline builds
- `provision-vm` - Create Hyper-V VMs
- `get-build-logs` - Retrieve and analyze build logs

### Common Operations

#### Daily Development Workflow
```bash
# 1. Check system health
npm run health-check

# 2. Analyze recent changes
# Use MCP tool: analyze-recent-commits

# 3. Update contexts after major changes  
# Use MCP tool: execute-holistic-context-update

# 4. Check cross-domain impact before big changes
# Use MCP tool: predict-change-impact
```

#### Team Onboarding
```bash
# New team member setup
./setup-team-member.sh

# Verify their environment
npm run verify-team-setup
```

## Maintenance

### Regular Tasks

#### Daily Operations
- Monitor `logs/mcp-gateway.log` for errors
- Check MCP tool response times via Claude Desktop
- Verify Docker services: `docker-compose ps`

#### Weekly Maintenance
```bash
# Update dependencies
npm update

# Clean old logs
npm run clean-logs

# Run performance benchmarks
npm run benchmark

# Update context templates if needed
npm run update-templates
```

#### Monthly Updates
```bash
# Check for security updates
npm audit

# Update Node.js and rebuild
npm run rebuild

# Review configuration settings
npm run config:review

# Update team documentation
npm run update-team-docs
```

### Performance Monitoring

#### Real-time Metrics
```bash
# Monitor cache performance
npm run monitor:cache

# Monitor memory usage
npm run monitor:memory  

# Monitor parallel processing efficiency
npm run monitor:parallel
```

#### Performance Benchmarks
```bash
# Run full performance suite
npm run benchmark:full

# Compare with baselines
npm run benchmark:compare

# Generate performance report
npm run benchmark:report
```

### Troubleshooting

#### Log Locations
- **MCP Gateway**: `logs/mcp-gateway.log`
- **Performance**: `logs/performance.log`
- **Git Integration**: `logs/git-integration.log`
- **Context Updates**: `logs/context-updates.log`

#### Diagnostic Commands
```bash
# Comprehensive system diagnostics
npm run diagnose

# Test specific components
npm run diagnose:git
npm run diagnose:performance  
npm run diagnose:azure-devops
npm run diagnose:docker

# Export diagnostic report
npm run diagnose:export
```

#### Recovery Operations
```bash
# Reset to default configuration
npm run reset:config

# Clear all caches
npm run reset:cache

# Rebuild performance optimizations
npm run reset:performance

# Emergency recovery mode
npm run recover:emergency
```

### Support and Documentation

- **Architecture**: `/Documentation/ContextEngineering/context-engineering-system.md`
- **Performance**: `/Documentation/Performance/step4-2-implementation-summary.md`  
- **Git Integration**: Git hooks automatically installed and configured
- **API Reference**: `npm run docs:generate`
- **Troubleshooting**: `npm run help:troubleshoot`

---

## Quick Reference

### Essential Commands
```bash
# Complete setup with defaults
npm run setup:default

# Health check
npm run health-check  

# Start server
npm start

# Run all tests
npm test

# Performance benchmark
npm run benchmark
```

### Configuration Files
- **Core**: `.env`
- **MCP Client**: `claude_desktop_config.json` 
- **Git**: `.gitattributes`, `scripts/setup-git-hooks.sh`
- **Performance**: `src/services/performance-*.ts`
- **Logging**: `logs/mcp-gateway.log`

### Key Features Enabled
- ✅ **Step 4.2 Performance Optimization** - Caching, parallel processing, memory optimization
- ✅ **Context Engineering Enhancement** - Holistic updates, cross-domain analysis  
- ✅ **Git Integration** - Branch management, commit analysis
- ✅ **Real Performance Benchmarks** - Meaningful performance validation
- ✅ **Optional Git Hooks** - Automatic context updates on commits
- ✅ **Azure DevOps Integration** - CI/CD pipeline management (optional)

---

**Installation Complete**: Your Environment MCP Gateway is now ready with comprehensive context engineering, performance optimization, and optional team automation capabilities. The system will maintain consistent context documentation across your entire Lucidwonks trading platform development.
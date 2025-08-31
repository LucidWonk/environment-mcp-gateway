# Environment MCP Gateway

**Repository**: https://github.com/LucidWonk/environment-mcp-gateway.git

A centralized Model Context Protocol (MCP) server providing development environment management and context engineering capabilities for all Lucidwonks projects and similar technology stacks.

## Overview

This repository contains the MCP Gateway server and supporting infrastructure that enables Claude Code to interact with development environments, analyze project structures, manage dependencies, and provide intelligent context generation.

## Architecture

- **EnvironmentMCPGateway**: TypeScript/Node.js MCP server implementation
- **EnvironmentMCPGateway.Tests**: C# test suite for validation and integration testing
- **Docker Integration**: Containerized deployment for consistent environments

## Key Features

- **Environment Analysis**: Comprehensive analysis of .NET solutions, projects, and dependencies
- **Context Generation**: Intelligent context creation for development workflows
- **Git Integration**: Repository analysis and change management
- **Docker Management**: Container orchestration and health monitoring
- **Development Server**: Single instance supporting multiple client projects

## Development Commands

### Build and Test
```bash
# Build the entire solution
dotnet build LucidwonksMCPGateway.sln

# Run C# integration tests
dotnet test EnvironmentMCPGateway.Tests/

# TypeScript development and testing
cd EnvironmentMCPGateway
npm install
npm run build
npm run lint
npm test
```

### Docker Deployment
```bash
# Build and run MCP server
docker-compose up -d

# Check server health
curl http://localhost:3002/health

# View logs
docker-compose logs -f environment-mcp-gateway
```

## Production Deployment

This MCP server is designed to run as a single centralized instance on the test server, supporting development activities across all projects using the same technology stack.

### Server Configuration
- **Port**: 3002 (configurable via environment variables)
- **Environment**: Containerized deployment with Docker Compose
- **Scaling**: Single instance architecture (multiple instances not supported)

## Technology Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Testing**: C# XUnit with comprehensive integration tests
- **Containerization**: Docker with multi-stage builds
- **Protocol**: Model Context Protocol (MCP) 1.0+

## Project Structure

```
environment-mcp-gateway/
├── LucidwonksMCPGateway.sln          # Visual Studio solution file
├── EnvironmentMCPGateway/            # TypeScript MCP server
│   ├── src/                          # TypeScript source code
│   ├── dist/                         # Compiled JavaScript
│   ├── package.json                  # Node.js dependencies
│   └── tsconfig.json                 # TypeScript configuration
├── EnvironmentMCPGateway.Tests/      # C# integration tests
├── docker-compose.yml                # Production deployment
├── Directory.Packages.props          # Centralized package versions
└── README.md                         # This file
```

## License

MIT License - See LICENSE file for details
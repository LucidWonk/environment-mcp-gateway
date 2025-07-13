# Lucidwonks Environment MCP Gateway

A TypeScript MCP (Model Context Protocol) server that provides Claude Code with comprehensive access to the Lucidwonks development environment infrastructure.

## Overview

This MCP server focuses on **development environment management** and provides tools for:

- **Solution Analysis**: Parse and understand Lucidwonks.sln structure and dependencies
- **Development Environment Status**: Monitor database, Docker, Git, and solution health
- **Build Configuration Validation**: Validate project dependencies and build order
- **Project Analysis**: Understand project relationships and dependency chains

## Features

### Core Tools

- `analyze-solution-structure`: Parse Lucidwonks.sln and analyze project relationships
- `get-development-environment-status`: Check database, Docker, Git, and solution status
- `validate-build-configuration`: Validate solution build configuration
- `get-project-dependencies`: Get detailed dependency information for projects

### Environment Integration

- Loads configuration from `../.env.development`
- Supports TimescaleDB development database
- Integrates with Docker development environment
- Git repository management capabilities

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Ensure environment variables are set in `../.env.development`:
```bash
DB_HOST=localhost
DB_PASSWORD=password
DB_PORT=5432
TIMESCALE_DATABASE=pricehistorydb
TIMESCALE_USERNAME=postgres
GIT_REPO_PATH=/mnt/m/Projects/Lucidwonks
GIT_USER_NAME=your-username
GIT_USER_EMAIL=your-email@example.com
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Docker
```bash
cd docker
docker-compose up -d
```

## Tools Reference

### analyze-solution-structure

Parses the Lucidwonks.sln file and provides detailed analysis of projects and dependencies.

**Parameters:**
- `includeDependencies` (boolean): Include dependency analysis (default: true)
- `projectType` (string): Filter by project type - 'C#', 'Python', 'Other', or 'All' (default: 'All')

**Returns:**
- Solution metadata (name, path, project count)
- Project list with types and dependencies
- Validation results (circular dependencies, missing projects)
- Build order information

### get-development-environment-status

Provides comprehensive status check of the development environment.

**Parameters:**
- `checkDatabase` (boolean): Check database connectivity (default: true)
- `checkDocker` (boolean): Check Docker services (default: true)
- `checkGit` (boolean): Check Git status (default: true)

**Returns:**
- Environment configuration
- Database connection status
- Docker service health
- Git repository status
- Solution validation results

### validate-build-configuration

Validates the solution build configuration and checks for issues.

**Parameters:**
- `projectName` (string): Specific project to validate (optional)

**Returns:**
- Solution validation status
- Project build order
- Dependency validation results
- Configuration errors

### get-project-dependencies

Gets detailed dependency information for a specific project.

**Parameters:**
- `projectName` (string): Name of the project to analyze (required)

**Returns:**
- Project metadata
- Direct dependencies
- Full dependency chain
- Build order position
- Dependent projects

## Architecture

```
EnvironmentMCPGateway/
├── src/
│   ├── server.ts                    # Main MCP server
│   ├── config/
│   │   └── environment.ts          # Environment configuration
│   ├── infrastructure/
│   │   └── solution-parser.ts      # Solution file parsing
│   └── types/
│       └── infrastructure-types.ts # Type definitions
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── tests/
    ├── integration/
    └── unit/
```

## Development

### Running Tests
```bash
npm test
npm run test:watch
npm run test:integration
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Building
```bash
npm run build
npm run clean
```

## Configuration

The server loads configuration from the parent directory's `.env.development` file and validates required environment variables on startup.

### Required Environment Variables
- `DB_PASSWORD`: Database password
- `GIT_USER_NAME`: Git username
- `GIT_USER_EMAIL`: Git email

### Optional Environment Variables
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `TIMESCALE_DATABASE`: Database name (default: pricehistorydb)
- `TIMESCALE_USERNAME`: Database username (default: postgres)
- `GIT_REPO_PATH`: Git repository path (default: /mnt/m/Projects/Lucidwonks)
- `MCP_SERVER_PORT`: MCP server port (default: 3001)
- `MCP_LOG_LEVEL`: Log level (default: info)

## Security

- Database passwords are not exposed in status responses
- Git credentials are validated but not logged
- File system access is restricted to the project directory
- Docker integration uses read-only access where possible

## Logging

The server uses Winston for structured logging with:
- Console output for development
- File logging to `environment-mcp-gateway.log`
- Configurable log levels
- Error tracking with stack traces

## Next Steps

This Phase 1 implementation provides the foundation for development environment management. Future phases will add:

- Git MCP server integration for branch/commit operations
- PostgreSQL MCP server for database schema analysis
- Docker adapter for container management
- Build and test execution capabilities
- CI/CD pipeline integration
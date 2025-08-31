#!/bin/bash

# Test Orchestrator Script for MCP Gateway
# Coordinates test execution across different test suites

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

echo "=== MCP Gateway Test Orchestrator ==="
echo "Project Root: $PROJECT_ROOT"

# Run test suites in order
echo "Running MCP Gateway test suites..."

# 1. Unit tests
echo "1. Running unit tests..."
cd "$PROJECT_ROOT"
dotnet test EnvironmentMCPGateway.Tests/ --filter "Category=Unit" --logger "console;verbosity=minimal"

# 2. Integration tests
echo "2. Running integration tests..."
dotnet test EnvironmentMCPGateway.Tests/ --filter "Category=Integration" --logger "console;verbosity=minimal"

# 3. Performance tests  
echo "3. Running performance tests..."
dotnet test EnvironmentMCPGateway.Tests/ --filter "Category=Performance" --logger "console;verbosity=minimal"

echo "Test orchestration completed"
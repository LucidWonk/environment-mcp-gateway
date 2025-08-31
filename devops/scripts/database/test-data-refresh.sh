#!/bin/bash

# Test Data Refresh Script for MCP Gateway
# Refreshes test data and sample contexts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

echo "=== MCP Gateway Test Data Refresh ==="
echo "Project Root: $PROJECT_ROOT"

# Function to validate environment
validate_environment() {
    echo "Validating environment setup..."
    
    # Check if we're in test environment
    if [ "${ENVIRONMENT:-development}" = "production" ]; then
        echo "ERROR: Test data refresh should not be run in production"
        exit 1
    fi
    
    # Check if required tools are available
    if ! command -v node &> /dev/null; then
        echo "WARNING: Node.js not found - context regeneration may not work"
    fi
    
    # Check project structure
    if [ ! -f "$PROJECT_ROOT/trigger-context-reindex.js" ]; then
        echo "WARNING: Context reindex tool not found at expected location"
    fi
    
    echo "Environment validation completed"
}

# Run environment validation
validate_environment

# Refresh context cache for testing
if [ -d "$PROJECT_ROOT/.context-cache" ]; then
    echo "Clearing existing context cache..."
    rm -rf "$PROJECT_ROOT/.context-cache"/*
fi

# Regenerate sample context data
echo "Regenerating sample context data..."
if [ -f "$PROJECT_ROOT/trigger-context-reindex.js" ]; then
    cd "$PROJECT_ROOT"
    node trigger-context-reindex.js --test-mode
fi

echo "Test data refresh completed"
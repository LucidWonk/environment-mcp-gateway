#!/bin/bash

# Test Data Refresh Script for MCP Gateway
# Refreshes test data and sample contexts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

echo "=== MCP Gateway Test Data Refresh ==="
echo "Project Root: $PROJECT_ROOT"

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
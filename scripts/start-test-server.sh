#!/bin/bash

# Test Server Startup Script
# Starts MCP server for integration testing with proper environment setup

echo "🚀 Starting MCP server for integration tests..."

# Navigate to the EnvironmentMCPGateway directory
cd "$(dirname "$0")/../EnvironmentMCPGateway" || {
    echo "❌ Failed to navigate to EnvironmentMCPGateway directory"
    exit 1
}

# Build the project if dist doesn't exist or is empty
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "🔨 Building TypeScript project..."
    npm run build
fi

# Export required environment variables for testing
export MCP_SERVER_PORT=3002
export FORCE_LOCAL_MCP=true
export DB_PASSWORD=test_password
export NODE_ENV=development

# Start the server in the background
echo "🌐 Starting MCP server on port 3002..."
node dist/server.js > /tmp/mcp-test-server.log 2>&1 &
SERVER_PID=$!

# Store the PID for cleanup
echo $SERVER_PID > /tmp/mcp-test-server.pid

# Wait for server to be ready (up to 30 seconds)
echo "⏳ Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo "✅ MCP server is ready on port 3002 (PID: $SERVER_PID)"
        exit 0
    fi
    sleep 1
done

echo "❌ Server failed to start within 30 seconds"
kill $SERVER_PID 2>/dev/null
exit 1
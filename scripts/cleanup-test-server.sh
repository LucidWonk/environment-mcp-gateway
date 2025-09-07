#!/bin/bash

# Test Server Cleanup Script
# Ensures no spurious MCP server instances remain after testing

echo "🧹 Cleaning up test MCP server instances..."

# Kill any Node.js processes running server.js (MCP server)
if pgrep -f "node.*server\.js" > /dev/null; then
    echo "🛑 Stopping MCP server processes..."
    pkill -f "node.*server\.js"
    sleep 2
    
    # Force kill if still running
    if pgrep -f "node.*server\.js" > /dev/null; then
        echo "🔥 Force killing stubborn MCP server processes..."
        pkill -9 -f "node.*server\.js"
    fi
else
    echo "✅ No MCP server processes found"
fi

# Check for processes using port 3002
if lsof -ti:3002 > /dev/null 2>&1; then
    echo "🔌 Cleaning up processes on port 3002..."
    lsof -ti:3002 | xargs kill -9
else
    echo "✅ Port 3002 is free"
fi

# Remove any temporary MCP lock files
if [ -f "/tmp/mcp-gateway-startup.lock" ]; then
    echo "🔓 Removing MCP startup lock file..."
    rm -f "/tmp/mcp-gateway-startup.lock"
fi

echo "✨ Test server cleanup complete!"
#!/bin/bash
# Script to rebuild and deploy the fixed MCP Gateway container

echo "🔧 Rebuilding Environment MCP Gateway with fixed Dockerfile..."
echo "=================================================="

# Navigate to the EnvironmentMCPGateway directory
cd /mnt/m/projects/lucidwonks/EnvironmentMCPGateway || exit 1

# Build TypeScript first
echo "📦 Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ TypeScript build failed"
    exit 1
fi

echo "✅ TypeScript build successful"

# Stop and remove existing container if running
echo "🛑 Stopping existing container..."
docker stop environment-mcp-gateway 2>/dev/null
docker rm environment-mcp-gateway 2>/dev/null

# Build new container with fixed Dockerfile
echo "🐳 Building new Docker image..."
docker build -f docker/Dockerfile.multistage.fixed -t lucidwonks-environment-environment-mcp-gateway .
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"

# Run the new container
echo "🚀 Starting new container..."
docker run -d \
    --name environment-mcp-gateway \
    -p 3001:3001 \
    -v /mnt/m/projects/lucidwonks:/workspace:ro \
    -e NODE_ENV=production \
    -e PROJECT_ROOT=/workspace \
    -e MCP_SERVER_PORT=3001 \
    -e MCP_LOG_LEVEL=info \
    -e MCP_SERVER_NAME=lucidwonks-environment-mcp-gateway \
    -e MCP_SERVER_VERSION=1.0.0 \
    -e GIT_USER_NAME="Environment MCP Gateway" \
    -e GIT_USER_EMAIL=noreply@lucidwonks.com \
    lucidwonks-environment-environment-mcp-gateway

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container"
    exit 1
fi

echo "✅ Container started successfully"

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 3

# Check container status
docker ps | grep environment-mcp-gateway
if [ $? -eq 0 ]; then
    echo "✅ Container is running"
else
    echo "❌ Container is not running"
    echo "Checking logs..."
    docker logs environment-mcp-gateway --tail 20
    exit 1
fi

# Test MCP connection
echo "🧪 Testing MCP connection..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test","version":"1.0.0"},"capabilities":{}}}' | \
docker exec -i -e MCP_STDIO_MODE=true environment-mcp-gateway node dist/server.js 2>&1 | head -5

echo ""
echo "=================================================="
echo "✅ Container rebuild complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the MCP connection in Claude"
echo "2. Monitor logs: docker logs -f environment-mcp-gateway"
echo "3. Check enhanced logging for process lifecycle events"
echo ""
echo "🔍 Useful commands:"
echo "   docker logs environment-mcp-gateway --tail 100"
echo "   docker exec environment-mcp-gateway ps aux"
echo "   docker inspect environment-mcp-gateway"
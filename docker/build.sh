#!/bin/bash

# Build script for Environment MCP Gateway Docker container
# This script should be run from the EnvironmentMCPGateway directory

set -e

echo "🐳 Building Environment MCP Gateway Docker container..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the EnvironmentMCPGateway directory."
    exit 1
fi

# Set build arguments
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(node -p "require('./package.json').version")

echo "📋 Build information:"
echo "  Version: ${VERSION}"
echo "  Git Commit: ${GIT_COMMIT}"
echo "  Build Date: ${BUILD_DATE}"
echo ""

# Build the Docker image
echo "🔨 Building Docker image..."
docker build \
    --file docker/Dockerfile.multistage \
    --tag lucidwonks/environment-mcp-gateway:${VERSION} \
    --tag lucidwonks/environment-mcp-gateway:latest \
    --build-arg BUILD_DATE="${BUILD_DATE}" \
    --build-arg GIT_COMMIT="${GIT_COMMIT}" \
    --build-arg VERSION="${VERSION}" \
    .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "📦 Available images:"
    docker images lucidwonks/environment-mcp-gateway
    echo ""
    echo "🚀 To run the container:"
    echo "  docker-compose -f docker/docker-compose.vs2022.yml up -d"
else
    echo "❌ Docker build failed!"
    exit 1
fi
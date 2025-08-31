#!/bin/bash

# MCP Server Stability Script
# Ensures the MCP server starts reliably across environment switches

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MCP_PORT=${MCP_SERVER_PORT:-3001}
HEALTH_CHECK_TIMEOUT=30
MAX_RESTART_ATTEMPTS=3
RESTART_ATTEMPT=0

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

# Check if running in WSL
check_wsl_environment() {
    if [[ -f /proc/version ]] && grep -qi microsoft /proc/version; then
        log "Detected WSL environment"
        export WSL_DETECTED=true
        # Ensure we're using Linux-specific settings
        export npm_config_target_platform=linux
        export npm_config_target_arch=x64
    else
        export WSL_DETECTED=false
    fi
}

# Clean up any existing processes
cleanup_existing_processes() {
    log "Cleaning up existing MCP server processes..."
    
    # Kill any running tsx/node processes for this server
    pkill -f "tsx watch src/server.ts" || true
    pkill -f "server.ts" || true
    
    # Wait a moment for processes to terminate
    sleep 2
    
    # Check if port is still in use
    if netstat -tlnp 2>/dev/null | grep ":${MCP_PORT} " >/dev/null; then
        log_warning "Port ${MCP_PORT} still in use, attempting to free it..."
        fuser -k ${MCP_PORT}/tcp 2>/dev/null || true
        sleep 2
    fi
    
    log_success "Process cleanup completed"
}

# Verify and fix node_modules if needed
verify_node_modules() {
    log "Verifying node_modules platform compatibility..."
    
    # Check for Windows esbuild binaries in WSL
    if [[ "$WSL_DETECTED" == "true" ]] && [[ -d "node_modules/@esbuild/win32-x64" ]]; then
        log_warning "Found Windows esbuild binaries in WSL environment - reinstalling dependencies"
        rm -rf node_modules package-lock.json
        npm install
        log_success "Dependencies reinstalled for Linux platform"
    fi
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        npm install
        log_success "Dependencies installed"
    fi
    
    # Verify critical dependencies
    if [[ ! -f "node_modules/.bin/tsx" ]]; then
        log_error "Critical dependency 'tsx' missing - reinstalling..."
        rm -rf node_modules package-lock.json
        npm install
    fi
}

# Health check function
check_server_health() {
    local timeout=${1:-30}
    local count=0
    
    log "Waiting for MCP server to be ready (timeout: ${timeout}s)..."
    
    while [[ $count -lt $timeout ]]; do
        if curl -s "http://localhost:${MCP_PORT}/health" >/dev/null 2>&1; then
            log_success "MCP server is healthy and responding"
            return 0
        fi
        
        sleep 1
        ((count++))
        
        if [[ $((count % 5)) -eq 0 ]]; then
            log "Still waiting... (${count}/${timeout}s)"
        fi
    done
    
    log_error "Health check failed - server not responding after ${timeout}s"
    return 1
}

# Start the MCP server
start_server() {
    log "Starting MCP server on port ${MCP_PORT}..."
    
    # Ensure we're in the right directory
    cd "$(dirname "${BASH_SOURCE[0]}")"
    
    # Start the server in the background
    npm run dev &
    local server_pid=$!
    
    # Store PID for cleanup
    echo $server_pid > .mcp-server.pid
    
    log "MCP server started with PID: ${server_pid}"
    
    # Wait for server to be ready
    if check_server_health $HEALTH_CHECK_TIMEOUT; then
        log_success "MCP server startup completed successfully"
        
        # Display server information
        echo ""
        echo "=== MCP Server Information ==="
        echo "🌐 Health endpoint: http://localhost:${MCP_PORT}/health"
        echo "📊 Status endpoint: http://localhost:${MCP_PORT}/status"
        echo "🔌 MCP endpoint: http://localhost:${MCP_PORT}/mcp"
        echo "🆔 Process ID: ${server_pid}"
        echo "📋 PID file: $(pwd)/.mcp-server.pid"
        echo ""
        
        return 0
    else
        log_error "Server failed to start properly"
        kill $server_pid 2>/dev/null || true
        rm -f .mcp-server.pid
        return 1
    fi
}

# Main execution with retry logic
main() {
    log "🚀 Starting MCP Server Stability Manager"
    echo ""
    
    # Check environment
    check_wsl_environment
    
    while [[ $RESTART_ATTEMPT -lt $MAX_RESTART_ATTEMPTS ]]; do
        if [[ $RESTART_ATTEMPT -gt 0 ]]; then
            log_warning "Restart attempt $RESTART_ATTEMPT of $MAX_RESTART_ATTEMPTS"
            sleep 5
        fi
        
        # Cleanup any existing processes
        cleanup_existing_processes
        
        # Verify dependencies
        verify_node_modules
        
        # Attempt to start server
        if start_server; then
            log_success "🎉 MCP server is running stably!"
            echo ""
            echo "To stop the server, run:"
            echo "  kill \$(cat .mcp-server.pid) && rm -f .mcp-server.pid"
            echo ""
            echo "To view logs:"
            echo "  tail -f environment-mcp-gateway.log"
            echo ""
            
            # Keep script running to monitor
            trap 'cleanup_existing_processes; exit 0' INT TERM
            wait $(cat .mcp-server.pid 2>/dev/null) 2>/dev/null || true
            exit 0
        else
            ((RESTART_ATTEMPT++))
            if [[ $RESTART_ATTEMPT -lt $MAX_RESTART_ATTEMPTS ]]; then
                log_error "Server start failed, retrying..."
            fi
        fi
    done
    
    log_error "❌ Failed to start MCP server after $MAX_RESTART_ATTEMPTS attempts"
    exit 1
}

# Run main function
main "$@"
#!/bin/bash

# MCP Server Stop Script
# Safely stops the MCP server and cleans up processes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Change to script directory
cd "$(dirname "${BASH_SOURCE[0]}")"

log "🛑 Stopping MCP server processes..."

# Stop server by PID file if it exists
if [[ -f .mcp-server.pid ]]; then
    pid=$(cat .mcp-server.pid)
    log "Found PID file with process ID: $pid"
    
    if kill -0 "$pid" 2>/dev/null; then
        log "Stopping process $pid gracefully..."
        kill -TERM "$pid" 2>/dev/null || true
        
        # Wait for graceful shutdown
        count=0
        while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
            sleep 1
            ((count++))
        done
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Process still running, forcing shutdown..."
            kill -KILL "$pid" 2>/dev/null || true
        fi
        
        log_success "Process $pid stopped"
    else
        log_warning "Process $pid was not running"
    fi
    
    rm -f .mcp-server.pid
    log_success "PID file removed"
else
    log "No PID file found, searching for MCP processes..."
fi

# Kill any remaining MCP-related processes
killed_count=0

# Kill tsx watch processes
if pgrep -f "tsx watch src/server.ts" >/dev/null 2>&1; then
    pkill -TERM -f "tsx watch src/server.ts" || true
    sleep 2
    pkill -KILL -f "tsx watch src/server.ts" 2>/dev/null || true
    ((killed_count++))
    log "Stopped tsx watch processes"
fi

# Kill server.ts processes
if pgrep -f "server.ts" >/dev/null 2>&1; then
    pkill -TERM -f "server.ts" || true
    sleep 2
    pkill -KILL -f "server.ts" 2>/dev/null || true
    ((killed_count++))
    log "Stopped server.ts processes"
fi

# Kill any processes using the MCP port
local mcp_port=${MCP_SERVER_PORT:-3001}
if netstat -tlnp 2>/dev/null | grep ":${mcp_port} " >/dev/null; then
    log "Freeing port $mcp_port..."
    fuser -k ${mcp_port}/tcp 2>/dev/null || true
    ((killed_count++))
fi

# Clean up lock files
rm -f /tmp/mcp-gateway-startup.lock

if [[ $killed_count -gt 0 ]]; then
    log_success "Stopped $killed_count MCP-related processes"
else
    log_success "No MCP processes were running"
fi

# Verify everything is stopped
sleep 1
if ! pgrep -f "tsx.*server.ts\|server.ts" >/dev/null 2>&1; then
    log_success "🎉 All MCP server processes stopped successfully"
else
    log_warning "Some processes may still be running:"
    pgrep -fl "tsx.*server.ts\|server.ts" || true
fi

echo ""
echo "MCP server has been stopped. To restart:"
echo "  ./start-stable.sh"
echo ""
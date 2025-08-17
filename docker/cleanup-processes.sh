#!/bin/sh

# Cleanup script for orphaned MCP server processes
# Kills node processes older than 30 minutes to prevent accumulation

echo "$(date): Starting MCP process cleanup"

# Find node processes (excluding PID 1 and current process)
NODE_PIDS=$(ps aux | grep 'node.*dist/server.js' | grep -v grep | awk '{print $2}')

if [ -z "$NODE_PIDS" ]; then
    echo "$(date): No node processes found to clean up"
    exit 0
fi

for PID in $NODE_PIDS; do
    # Skip PID 1 (container init)
    if [ "$PID" = "1" ]; then
        continue
    fi
    
    # Get process start time (in minutes since boot)
    START_TIME=$(ps -o etimes= -p "$PID" 2>/dev/null | tr -d ' ')
    
    if [ -n "$START_TIME" ] && [ "$START_TIME" -gt 1800 ]; then
        # Process older than 30 minutes (1800 seconds)
        echo "$(date): Killing orphaned node process PID $PID (running for $START_TIME seconds)"
        kill "$PID" 2>/dev/null || echo "$(date): Failed to kill PID $PID"
    else
        echo "$(date): Keeping active node process PID $PID (running for $START_TIME seconds)"
    fi
done

echo "$(date): MCP process cleanup completed"
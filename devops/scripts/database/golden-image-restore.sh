#!/bin/bash

# Golden Image Restore Script for MCP Gateway
# Restores MCP Gateway database and context files from backup

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

# Configuration
BACKUP_DIR="${PROJECT_ROOT}/backups"
BACKUP_NAME="${1:-latest}"

echo "=== MCP Gateway Golden Image Restore ==="
echo "Backup Name: $BACKUP_NAME"
echo "Backup Directory: $BACKUP_DIR"

# Restore context files
if [ -d "$BACKUP_DIR/${BACKUP_NAME}_context_cache" ]; then
    echo "Restoring context cache..."
    rm -rf "$PROJECT_ROOT/.context-cache"
    cp -r "$BACKUP_DIR/${BACKUP_NAME}_context_cache" "$PROJECT_ROOT/.context-cache"
fi

echo "Restore completed from: $BACKUP_DIR/${BACKUP_NAME}"
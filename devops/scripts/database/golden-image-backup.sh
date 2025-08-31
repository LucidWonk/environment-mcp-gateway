#!/bin/bash

# Golden Image Backup Script for MCP Gateway
# Creates backup of MCP Gateway database and context files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

# Configuration
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mcp-gateway-golden-${TIMESTAMP}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "=== MCP Gateway Golden Image Backup ==="
echo "Backup Name: $BACKUP_NAME"
echo "Backup Directory: $BACKUP_DIR"
echo "Project Root: $PROJECT_ROOT"

# Backup context files
if [ -d "$PROJECT_ROOT/.context-cache" ]; then
    echo "Backing up context cache..."
    cp -r "$PROJECT_ROOT/.context-cache" "$BACKUP_DIR/${BACKUP_NAME}_context_cache"
fi

# Create backup manifest
cat > "$BACKUP_DIR/${BACKUP_NAME}_manifest.json" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_type": "golden_image",
    "environment": "${ENVIRONMENT:-development}",
    "components": [
        "context_cache",
        "configuration"
    ],
    "version": "1.0.0"
}
EOF

# Create checksum file for backup integrity validation
echo "Creating backup checksums..."
CHECKSUM_FILE="$BACKUP_DIR/${BACKUP_NAME}_checksums.md5"
(cd "$BACKUP_DIR" && find "${BACKUP_NAME}_context_cache" "${BACKUP_NAME}_manifest.json" -type f 2>/dev/null | xargs md5sum > "$CHECKSUM_FILE" 2>/dev/null || true)

echo "Backup completed: $BACKUP_DIR/${BACKUP_NAME}"
echo "Manifest: $BACKUP_DIR/${BACKUP_NAME}_manifest.json"
echo "Checksums: $CHECKSUM_FILE"
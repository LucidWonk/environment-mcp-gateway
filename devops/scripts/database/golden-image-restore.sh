#!/bin/bash

# Golden Image Restore Script for MCP Gateway
# Restores MCP Gateway database and context files from backup

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

# Configuration
BACKUP_DIR="${PROJECT_ROOT}/backups"
BACKUP_NAME="${1:-latest}"
ENVIRONMENT="${ENVIRONMENT:-development}"

echo "=== MCP Gateway Golden Image Restore ==="
echo "Backup Name: $BACKUP_NAME"
echo "Backup Directory: $BACKUP_DIR"
echo "Environment: $ENVIRONMENT"

# Production safety check
if [ "$ENVIRONMENT" = "production" ]; then
    echo "ERROR: Production restore is not allowed without explicit override"
    echo "Use ALLOW_PRODUCTION_RESTORE=true environment variable to override"
    if [ "${ALLOW_PRODUCTION_RESTORE:-false}" != "true" ]; then
        exit 1
    fi
    echo "WARNING: Production restore override enabled - proceeding with caution"
fi

# Validate backup exists and has manifest
MANIFEST_FILE="$BACKUP_DIR/${BACKUP_NAME}_manifest.json"
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "ERROR: Backup manifest not found: $MANIFEST_FILE"
    exit 1
fi

echo "Validating backup integrity..."

# Read and validate manifest
if ! command -v jq &> /dev/null; then
    echo "WARNING: jq not found - skipping JSON validation"
else
    if ! jq . "$MANIFEST_FILE" > /dev/null 2>&1; then
        echo "ERROR: Invalid backup manifest JSON"
        exit 1
    fi
    
    BACKUP_TYPE=$(jq -r '.backup_type' "$MANIFEST_FILE" 2>/dev/null || echo "unknown")
    if [ "$BACKUP_TYPE" != "golden_image" ]; then
        echo "ERROR: Invalid backup type: $BACKUP_TYPE (expected: golden_image)"
        exit 1
    fi
fi

# Database backup validation (PostgreSQL)
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}_database.sql"
if [ -f "$BACKUP_FILE" ]; then
    echo "Validating PostgreSQL backup format..."
    if command -v pg_restore &> /dev/null; then
        if ! pg_restore --list "$BACKUP_FILE" &> /dev/null; then
            echo "ERROR: Invalid PostgreSQL backup format"
            exit 1
        fi
        echo "PostgreSQL backup format validation passed"
    else
        echo "WARNING: pg_restore not found - skipping database backup validation"
    fi
fi

# Checksum validation
echo "Performing checksum validation..."
CHECKSUM_FILE="$BACKUP_DIR/${BACKUP_NAME}_checksums.md5"
if [ -f "$CHECKSUM_FILE" ]; then
    echo "Found checksum file - validating backup integrity"
    if ! (cd "$BACKUP_DIR" && md5sum -c "$CHECKSUM_FILE" --quiet); then
        echo "ERROR: Checksum validation failed - backup may be corrupted"
        exit 1
    fi
    echo "Checksum validation passed"
else
    echo "WARNING: No checksum file found - cannot validate backup integrity"
fi

# Create pre-restore backup
echo "Creating pre-restore backup..."
PRE_RESTORE_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PRE_RESTORE_NAME="pre-restore-${PRE_RESTORE_TIMESTAMP}"

if [ -d "$PROJECT_ROOT/.context-cache" ]; then
    echo "Backing up current context cache..."
    cp -r "$PROJECT_ROOT/.context-cache" "$BACKUP_DIR/${PRE_RESTORE_NAME}_context_cache"
fi

# Create database backup using pg_dump if available
if command -v pg_dump &> /dev/null && [ -n "${DATABASE_URL:-}" ]; then
    echo "Creating database backup with pg_dump..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/${PRE_RESTORE_NAME}_database.sql" 2>/dev/null || true
elif command -v pg_dump &> /dev/null; then
    echo "Creating local database backup with pg_dump..."
    pg_dump -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" "${DB_NAME:-mcpgateway}" > "$BACKUP_DIR/${PRE_RESTORE_NAME}_database.sql" 2>/dev/null || echo "WARNING: Database backup failed - proceeding with context-only backup"
fi

# Create pre-restore manifest
cat > "$BACKUP_DIR/${PRE_RESTORE_NAME}_manifest.json" << EOF
{
    "backup_name": "$PRE_RESTORE_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_type": "pre-restore",
    "environment": "$ENVIRONMENT",
    "original_restore_target": "$BACKUP_NAME",
    "components": [
        "context_cache"
    ],
    "version": "1.0.0"
}
EOF

echo "Pre-restore backup created: $PRE_RESTORE_NAME"

# Perform restore
echo "Performing restore operation..."

# Restore context files
if [ -d "$BACKUP_DIR/${BACKUP_NAME}_context_cache" ]; then
    echo "Restoring context cache..."
    rm -rf "$PROJECT_ROOT/.context-cache"
    cp -r "$BACKUP_DIR/${BACKUP_NAME}_context_cache" "$PROJECT_ROOT/.context-cache"
    echo "Context cache restored successfully"
else
    echo "WARNING: No context cache found in backup"
fi

# Verify restore
echo "Verifying restore operation..."
if [ -d "$PROJECT_ROOT/.context-cache" ]; then
    RESTORED_FILES=$(find "$PROJECT_ROOT/.context-cache" -type f | wc -l)
    echo "Restored $RESTORED_FILES context files"
else
    echo "WARNING: No context cache directory found after restore"
fi

echo "Restore completed from: $BACKUP_DIR/${BACKUP_NAME}"
echo "Pre-restore backup available at: $BACKUP_DIR/${PRE_RESTORE_NAME}"
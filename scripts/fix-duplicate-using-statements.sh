#!/bin/bash

echo "🔧 Fixing duplicate using statements in integration test files..."

# Find files with duplicate Infrastructure using statements
FILES=$(find "/mnt/m/projects/lucidwonks-mcp-gateway/EnvironmentMCPGateway.Tests/Integration" -name "*.cs" -exec grep -l "EnvironmentMCPGateway.Tests.Infrastructure" {} \;)

for FILE in $FILES; do
    echo "📝 Processing: $(basename "$FILE")"
    
    # Remove duplicate using statements, keeping only the first one
    awk '!seen[$0]++' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    
    echo "  ✅ Fixed duplicates in $(basename "$FILE")"
done

echo "✨ Duplicate using statement cleanup complete!"
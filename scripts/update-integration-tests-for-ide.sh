#!/bin/bash

# Script to update integration test classes to use the MCP Server Collection for IDE compatibility
echo "🔧 Updating integration test classes for IDE Test Explorer compatibility..."

# Find all integration test files that use localhost:3002 (need MCP server)
FILES=$(find "/mnt/m/projects/lucidwonks-mcp-gateway/EnvironmentMCPGateway.Tests/Integration" -name "*.cs" -exec grep -l "localhost:3002" {} \;)

for FILE in $FILES; do
    echo "📝 Processing: $(basename "$FILE")"
    
    # Check if file already has the MCP Server Collection
    if grep -q '\[Collection("MCP Server Collection")\]' "$FILE"; then
        echo "  ✅ Already has MCP Server Collection"
        continue
    fi
    
    # Add the using statement if not present
    if ! grep -q "using EnvironmentMCPGateway.Tests.Infrastructure;" "$FILE"; then
        # Find the line with the last using statement and add after it
        sed -i '/^using.*$/a using EnvironmentMCPGateway.Tests.Infrastructure;' "$FILE"
        echo "  ➕ Added Infrastructure using statement"
    fi
    
    # Replace existing Collection attribute or add if none
    if grep -q '\[Collection(' "$FILE"; then
        # Replace existing Collection attribute
        sed -i 's/\[Collection("[^"]*")\]/[Collection("MCP Server Collection")]/' "$FILE"
        echo "  🔄 Replaced existing Collection attribute"
    else
        # Add Collection attribute before class declaration
        sed -i '/public class.*Test.*:/i\    [Collection("MCP Server Collection")]' "$FILE"
        echo "  ➕ Added MCP Server Collection attribute"
    fi
    
    echo "  ✅ Updated $(basename "$FILE")"
done

echo "✨ Integration test update complete!"
echo "📋 Summary: Integration test classes now use shared MCP Server Collection"
echo "🎯 IDE Test Explorer will automatically manage MCP server lifecycle"
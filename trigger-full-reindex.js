#!/usr/bin/env node

/**
 * Full Repository Context Re-indexing Tool
 * Dynamically discovers all source files and triggers comprehensive context update
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Full Repository Context Re-indexing...');

// Dynamically discover all source files
const sourceFileCommand = `
find /mnt/m/Projects/Lucidwonks \\
  -path "*/bin" -prune -o \\
  -path "*/obj" -prune -o \\
  -path "*/node_modules" -prune -o \\
  -path "*/wwwroot" -prune -o \\
  -path "*/.git" -prune -o \\
  -name "*.cs" -print -o \\
  -name "*.ts" -print \\
  | grep -v "\\.d\\.ts$" \\
  | grep -v "bootstrap" \\
  | grep -v "test-cache" \\
  | sort
`;

try {
    console.log('🔍 Discovering source files...');
    const allFiles = execSync(sourceFileCommand, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(file => file.trim().length > 0);
    
    console.log(`📁 Found ${allFiles.length} source files to analyze`);
    
    // Show sample of files
    console.log('\nSample of files to be analyzed:');
    allFiles.slice(0, 10).forEach((file, index) => {
        console.log(`   ${index + 1}. ${path.relative('/mnt/m/Projects/Lucidwonks', file)}`);
    });
    if (allFiles.length > 10) {
        console.log(`   ... and ${allFiles.length - 10} more files`);
    }
    
    // Create MCP command to call holistic context update
    console.log('\n🚀 Triggering comprehensive holistic context update via MCP...');
    
    // For now, we'll create a comprehensive file list to pass to the MCP
    // In a real implementation, this would call the MCP server directly
    
    const mcpCommand = `node -e "
        console.log('Simulating MCP call with ${allFiles.length} files');
        console.log('Files would be passed to: mcp__environment-gateway__execute-holistic-context-update');
        console.log('Execution would analyze all domains: Analysis, Data, Messaging, Infrastructure, Testing');
    "`;
    
    execSync(mcpCommand, { stdio: 'inherit' });
    
    // Store the file list for actual MCP integration
    const fileListData = {
        timestamp: new Date().toISOString(),
        totalFiles: allFiles.length,
        files: allFiles.map(f => path.relative('/mnt/m/Projects/Lucidwonks', f)),
        domains: [
            'Analysis',
            'Data', 
            'Messaging',
            'Infrastructure',
            'Testing',
            'Console',
            'CyphyrRecon',
            'DevOps'
        ]
    };
    
    fs.writeFileSync(
        '/mnt/m/Projects/Lucidwonks/.semantic-cache/full-reindex-files.json',
        JSON.stringify(fileListData, null, 2)
    );
    
    console.log('\n✅ Full repository re-indexing preparation completed!');
    console.log('📄 File list saved to .semantic-cache/full-reindex-files.json');
    console.log('🎯 Ready for MCP holistic context update execution');
    
} catch (error) {
    console.error('❌ Error during full repository re-indexing:', error.message);
    process.exit(1);
}
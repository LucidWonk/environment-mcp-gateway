#!/usr/bin/env node

// Script to replace all winston.createLogger instances with createMCPLogger

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files with winston.createLogger
const grepOutput = execSync('grep -r "winston\\.createLogger" src/ --include="*.ts" -l', { 
    cwd: __dirname, 
    encoding: 'utf8' 
}).trim();

if (!grepOutput) {
    console.log('No files found with winston.createLogger');
    process.exit(0);
}

const filesToFix = grepOutput.split('\n').filter(file => 
    file.endsWith('.ts') && !file.includes('mcp-logger.ts')
);

console.log(`Found ${filesToFix.length} files to fix:`, filesToFix);

function fixWinstonLogger(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import for createMCPLogger if not present
    if (!content.includes('createMCPLogger')) {
        // Find the import section and add our import
        const imports = content.match(/import.*?from.*?;/gs) || [];
        const lastImport = imports[imports.length - 1];
        
        if (lastImport) {
            const importToAdd = "import { createMCPLogger } from '../utils/mcp-logger.js';";
            content = content.replace(lastImport, lastImport + '\n' + importToAdd);
        }
    }
    
    // Replace winston.createLogger with createMCPLogger
    content = content.replace(
        /const logger = winston\.createLogger\({[\s\S]*?}\);/g,
        "const logger = createMCPLogger('mcp-gateway.log');"
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed winston logger in ${filePath}`);
}

// Fix all files
filesToFix.forEach(filePath => {
    fixWinstonLogger(filePath);
});

console.log('Finished converting all winston loggers to MCP loggers');
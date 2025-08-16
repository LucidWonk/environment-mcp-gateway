#!/usr/bin/env node

// Script to fix import placement for createMCPLogger

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/domain/config/configuration-manager.ts',
    'src/orchestrator/tool-registry.ts', 
    'src/services/domain-analyzer.ts',
    'src/services/impact-mapper.ts'
];

function fixImportPlacement(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove any misplaced import at the end
    content = content.replace(/\nimport \{ createMCPLogger \} from '\.\.\/utils\/mcp-logger\.js';\s*$/g, '');
    
    // Find where to insert the import - after other imports but before any non-import statements
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import line
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') && lines[i].includes('from')) {
            insertIndex = i + 1;
        } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('*') && !lines[i].trim().startsWith('/*')) {
            break;
        }
    }
    
    // Check if import already exists
    if (!content.includes("import { createMCPLogger } from '../utils/mcp-logger.js'")) {
        lines.splice(insertIndex, 0, "import { createMCPLogger } from '../utils/mcp-logger.js';");
        content = lines.join('\n');
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed import placement in ${filePath}`);
}

// Fix all files
filesToFix.forEach(filePath => {
    fixImportPlacement(filePath);
});

console.log('Finished fixing import placements');
#!/usr/bin/env node

// Script to fix all remaining console contamination in EnvironmentMCPGateway

const fs = require('fs');
const path = require('path');

// List of files with console statements that need fixing
const filesToFix = [
    'src/events/context-events.ts',
    'src/services/job-manager.ts', 
    'src/services/holistic-update-orchestrator.ts'
];

function fixConsoleContamination(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all console.info/warn/error statements with MCP_SILENT_MODE checks
    content = content.replace(/(\s+)(console\.(info|warn|error)\(.+?\);)/gs, (match, indent, consoleStatement) => {
        return `${indent}if (!process.env.MCP_SILENT_MODE) {\n${indent}    ${consoleStatement}\n${indent}}`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`Fixed console contamination in ${filePath}`);
}

// Fix all files
filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    fixConsoleContamination(fullPath);
});

console.log('Finished fixing remaining console contamination');
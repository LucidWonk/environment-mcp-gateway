#!/usr/bin/env node

// Script to fix console contamination in holistic-context-updates.ts by wrapping console statements with MCP_SILENT_MODE checks

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/tools/holistic-context-updates.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all console.info/warn/error statements with MCP_SILENT_MODE checks
content = content.replace(/(\s+)(console\.(info|warn|error)\(.+?\);)/gs, (match, indent, consoleStatement) => {
    return `${indent}if (!process.env.MCP_SILENT_MODE) {\n${indent}    ${consoleStatement}\n${indent}}`;
});

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fixed console contamination in holistic-context-updates.ts');
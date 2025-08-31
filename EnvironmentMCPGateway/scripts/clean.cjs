#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`Removed: ${dirPath}`);
        } catch (error) {
            console.warn(`Warning: Could not remove ${dirPath}: ${error.message}`);
        }
    } else {
        console.log(`Directory does not exist: ${dirPath}`);
    }
}

// Clean dist directory
const distPath = path.join(__dirname, '..', 'dist');
removeDirectory(distPath);

console.log('Clean completed successfully.');
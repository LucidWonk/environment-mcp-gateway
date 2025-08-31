#!/usr/bin/env node

// Debug script to test full repository reindex with a small subset of files
// This will help us identify why 0 context files are generated

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug: Starting diagnostic full repository reindex...');

// Create a very small test with known good files
const knownGoodFiles = [
    'Console/Program.cs',
    'Utility/Analysis/Fractal/FractalAnalysisAlgorithm.cs',
    'Utility/Data/Provider/Timescale/TimescaleDBWrapper.cs'
];

console.log('📁 Testing with known good files:');
knownGoodFiles.forEach((file, index) => {
    const fullPath = path.resolve(file);
    const exists = fs.existsSync(fullPath);
    console.log(`  ${index + 1}. ${file} -> ${fullPath} (${exists ? 'EXISTS' : 'NOT FOUND'})`);
});

console.log('\n🎯 This diagnostic will help identify:');
console.log('  1. Whether file discovery is finding the right files');
console.log('  2. Whether semantic analysis is processing them');
console.log('  3. Whether domain identification is working');
console.log('  4. Whether context generation is being called');

console.log('\n✅ Debug script ready. Next step: run actual MCP Gateway test.');
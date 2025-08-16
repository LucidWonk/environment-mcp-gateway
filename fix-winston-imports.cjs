#!/usr/bin/env node

// Script to remove unused winston and Environment imports

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files with unused winston imports
const filesToFix = [
    'src/adapters/adapter-manager.ts',
    'src/adapters/azure-devops-adapter.ts',
    'src/adapters/docker-adapter.ts',
    'src/adapters/git-adapter.ts',
    'src/adapters/vm-management-adapter.ts',
    'src/clients/git-integration.ts',
    'src/domain/config/configuration-manager.ts',
    'src/orchestrator/azure-devops-tool-registry.ts',
    'src/orchestrator/tool-registry.ts',
    'src/services/approval-workflow.ts',
    'src/services/archive-manager.ts',
    'src/services/boundary-detection-config-manager.ts',
    'src/services/business-concept-extractor.ts',
    'src/services/context-template-generator.ts',
    'src/services/cross-domain-coordinator.ts',
    'src/services/csharp-parser.ts',
    'src/services/document-migration.ts',
    'src/services/domain-analyzer.ts',
    'src/services/hierarchical-relationship-manager.ts',
    'src/services/impact-mapper.ts',
    'src/services/lifecycle-coordinator.ts',
    'src/services/path-utilities.ts',
    'src/services/placeholder-tracker.ts',
    'src/services/registry-manager.ts',
    'src/services/registry-validator.ts',
    'src/services/semantic-boundary-detector.ts',
    'src/services/timeout-manager.ts',
    'src/services/update-integration.ts',
    'src/workflows/newconcepts-migration.ts'
];

function removeUnusedImports(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove unused winston import
    content = content.replace(/^import winston from 'winston';\s*\n/gm, '');
    
    // Remove unused Environment import where it's not used
    const unusedEnvironmentFiles = [
        'src/adapters/vm-management-adapter.ts',
        'src/clients/git-integration.ts',
        'src/orchestrator/azure-devops-tool-registry.ts',
        'src/orchestrator/tool-registry.ts',
        'src/services/business-concept-extractor.ts',
        'src/services/context-template-generator.ts',
        'src/services/csharp-parser.ts',
        'src/services/hierarchical-relationship-manager.ts'
    ];
    
    if (unusedEnvironmentFiles.includes(filePath)) {
        content = content.replace(/^import \{ Environment \} from.*?;\s*\n/gm, '');
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Removed unused imports from ${filePath}`);
}

// Fix all files
filesToFix.forEach(filePath => {
    removeUnusedImports(filePath);
});

console.log('Finished removing unused winston and Environment imports');
#!/usr/bin/env node

import { HolisticUpdateOrchestrator } from './EnvironmentMCPGateway/dist/services/holistic-update-orchestrator.js';
import { DiscoveryRequest } from './EnvironmentMCPGateway/dist/tools/holistic-context-updates.js';
import path from 'path';

async function testEnhancedDiagnostics() {
    console.log('🚀 Testing enhanced diagnostics for semantic analysis failures...');
    
    const projectRoot = path.resolve(process.cwd());
    console.log(`📁 Project root: ${projectRoot}`);
    
    // Initialize orchestrator
    const orchestrator = new HolisticUpdateOrchestrator(projectRoot);
    
    try {
        // Create a small test case with known files
        const testFiles = [
            './Analysis/InflectionPoint.cs',
            './Utility/Analysis/Inflection/InflectionPointEvent.cs',
            './Console/Program.cs'
        ].map(f => path.resolve(projectRoot, f));
        
        console.log('📄 Test files:');
        testFiles.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
        });
        
        console.log('\n🔍 Testing semantic analysis with enhanced diagnostics...');
        const results = await orchestrator.performSemanticAnalysis(testFiles);
        
        console.log(`\n📊 Semantic Analysis Results:`);
        console.log(`   - Results produced: ${results.length}`);
        console.log(`   - Expected files: ${testFiles.length}`);
        
        if (results.length === 0) {
            console.log('\n❌ CONFIRMED: Semantic analysis produced 0 results');
            console.log('   This demonstrates the issue reported by the user');
        } else {
            console.log('\n✅ Semantic analysis working correctly');
            results.forEach((result, index) => {
                console.log(`   Result ${index + 1}: ${result.filePath} -> ${result.businessConcepts.length} concepts, ${result.businessRules.length} rules`);
            });
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testEnhancedDiagnostics().catch(console.error);
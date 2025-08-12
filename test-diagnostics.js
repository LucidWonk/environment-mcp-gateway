import { HolisticUpdateOrchestrator } from './dist/services/holistic-update-orchestrator.js';
import path from 'path';
import fs from 'fs';

async function testEnhancedDiagnostics() {
    console.log('🚀 Testing enhanced diagnostics for semantic analysis failures...');
    
    const projectRoot = path.resolve(process.cwd(), '..');
    console.log(`📁 Project root: ${projectRoot}`);
    
    // Initialize orchestrator
    const orchestrator = new HolisticUpdateOrchestrator(projectRoot);
    
    try {
        // Find some actual C# files with business logic
        console.log('🔍 Looking for meaningful C# files with business logic...');
        
        const testFiles = [
            '/mnt/m/projects/lucidwonks/Utility/Data/Inflection/InflectionPointsDAL.cs',
            '/mnt/m/projects/lucidwonks/TestSuite/Utility/Analysis/Indicator/IndicatorManagerSteps.cs',
            '/mnt/m/projects/lucidwonks/Utility/Analysis/Inflection/InflectionPointsAnalysisManager.cs'
        ].filter(f => fs.existsSync(f));
        
        if (testFiles.length === 0) {
            console.log('❌ No C# files found. Looking for any files to test...');
            // Fall back to any files
            const files = fs.readdirSync(projectRoot, { recursive: true });
            const codeFiles = files.filter(f => f.endsWith('.cs') || f.endsWith('.ts') || f.endsWith('.js')).slice(0, 3);
            testFiles = codeFiles.map(f => path.join(projectRoot, f));
        }
        
        console.log('📄 Test files found:');
        testFiles.forEach((file, index) => {
            const exists = fs.existsSync(file);
            console.log(`   ${index + 1}. ${file} ${exists ? '✅' : '❌'}`);
        });
        
        if (testFiles.length === 0) {
            console.log('❌ No test files available');
            return;
        }
        
        console.log('\n🔍 Testing semantic analysis with enhanced diagnostics...');
        const results = await orchestrator.performSemanticAnalysis(testFiles);
        
        console.log(`\n📊 Semantic Analysis Results:`);
        console.log(`   - Results produced: ${results.length}`);
        console.log(`   - Expected files: ${testFiles.length}`);
        
        if (results.length === 0) {
            console.log('\n❌ CONFIRMED: Semantic analysis produced 0 results');
            console.log('   This demonstrates the issue reported by the user');
            console.log('   Enhanced diagnostics should show detailed error information in the logs above');
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
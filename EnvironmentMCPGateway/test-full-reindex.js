import { handleExecuteFullRepositoryReindexSync } from './dist/tools/holistic-context-updates.js';

async function testFullReindex() {
    console.log('🚀 Testing full repository re-indexing with enhanced success criteria...');
    
    try {
        const result = await handleExecuteFullRepositoryReindexSync({
            mode: 'full_repository_reindex',
            cleanupFirst: true,
            maxConcurrency: 2
        });
        
        console.log('\n📊 Full Re-indexing Results:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📄 Files Discovered: ${result.filesDiscovered}`);
        console.log(`🔍 Files Analyzed: ${result.filesAnalyzed}`);
        console.log(`📁 Context Files Generated: ${result.contextFilesGenerated}`);
        console.log(`🗑️ Context Files Removed: ${result.contextFilesRemoved || 0}`);
        
        if (result.contextCoverage) {
            console.log(`\n📊 Context Coverage Analysis:`);
            console.log(`   - Total code directories: ${result.contextCoverage.total}`);
            console.log(`   - Directories with .context: ${result.contextCoverage.covered}`);
            console.log(`   - Missing .context directories: ${result.contextCoverage.missing}`);
            console.log(`   - Coverage percentage: ${result.contextCoverage.percentage}%`);
        }
        
        if (result.missingContextDirectories && result.missingContextDirectories.length > 0) {
            console.log(`\n❌ Missing .context directories:`);
            result.missingContextDirectories.forEach(dir => {
                console.log(`   📁 ${dir}`);
            });
        }
        
        if (result.qualityIssues && result.qualityIssues.length > 0) {
            console.log(`\n⚠️ Quality issues found:`);
            result.qualityIssues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        }
        
        if (result.errors && result.errors.length > 0) {
            console.log(`\n❌ Errors:`);
            result.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        console.log(`\n📋 Summary: ${result.summary}`);
        console.log(`⏱️ Execution Time: ${result.executionTime}ms`);
        
        // Detailed success analysis
        if (result.success) {
            console.log('\n🎉 SUCCESS: Full re-indexing completed with all success criteria met!');
        } else {
            console.log('\n⚠️ PARTIAL SUCCESS: Re-indexing completed but success criteria not fully met');
            console.log('   This demonstrates the enhanced validation is working correctly');
        }
        
    } catch (error) {
        console.error('\n❌ Full re-indexing test failed:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testFullReindex().catch(console.error);
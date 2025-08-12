import { handleExecuteFullRepositoryReindexSync } from './dist/tools/holistic-context-updates.js';

async function testPermissionFix() {
    console.log('🚀 Testing permission fix with limited scope...');
    
    try {
        const result = await handleExecuteFullRepositoryReindexSync({
            cleanupFirst: false, // Don't cleanup to focus on the permission fix
            fileExtensions: ['.cs'],
            excludePatterns: ['node_modules', 'bin', 'obj', '.git', 'TestResults', 'EnvironmentMCPGateway', 'TestSuite', 'CyphyrRecon', 'Service', 'devops'],
            performanceTimeout: 60, // Shorter timeout
            triggerType: 'manual'
        });
        
        console.log('\n📊 Permission Fix Test Results:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📄 Files Discovered: ${result.filesDiscovered}`);
        console.log(`🔍 Files Analyzed: ${result.filesAnalyzed}`);
        console.log(`📁 Context Files Generated: ${result.contextFilesGenerated}`);
        
        if (result.errors && result.errors.length > 0) {
            console.log(`\n❌ Errors:`);
            result.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        console.log(`\n📋 Summary: ${result.summary}`);
        console.log(`⏱️ Execution Time: ${result.executionTime}ms`);
        
        // Check if we solved the permission issues
        const hasPermissionErrors = result.errors?.some(error => error.includes('permission')) || false;
        const hasExistsErrors = result.errors?.some(error => error.includes('already exists')) || false;
        
        if (!hasPermissionErrors && !hasExistsErrors) {
            console.log('\n🎉 SUCCESS: Permission issues appear to be resolved!');
        } else {
            console.log('\n⚠️ Still have permission-related issues to resolve');
        }
        
    } catch (error) {
        console.error('\n❌ Permission fix test failed:', error.message);
    }
}

testPermissionFix().catch(console.error);
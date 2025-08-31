#!/usr/bin/env node

const { spawn } = require('child_process');

/**
 * Actually test the 3 supposedly "fixed" tools to validate they work
 */

async function callMCPTool(toolName, args = {}) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔧 Actually testing: ${toolName}`);
        console.log(`   Args: ${JSON.stringify(args)}`);
        
        const mcp = spawn('node', ['dist/server.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
        });

        let stdout = '';
        let stderr = '';

        mcp.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        mcp.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: toolName,
                arguments: args
            }
        };

        mcp.stdin.write(JSON.stringify(request) + '\n');
        
        const timeout = setTimeout(() => {
            mcp.kill('SIGTERM');
            reject(new Error(`Tool ${toolName} timed out after 10 seconds`));
        }, 10000);

        mcp.on('close', (code) => {
            clearTimeout(timeout);
            
            console.log(`   Exit code: ${code}`);
            console.log(`   Stdout length: ${stdout.length} chars`);
            console.log(`   Stderr length: ${stderr.length} chars`);
            
            try {
                if (stdout.includes('"result"')) {
                    const response = JSON.parse(stdout);
                    console.log('   ✅ SUCCESS: Got valid response');
                    resolve(response);
                } else if (stdout.includes('"error"')) {
                    const response = JSON.parse(stdout);
                    console.log('   ❌ ERROR: Tool returned error');
                    console.log(`   Error: ${JSON.stringify(response.error, null, 2)}`);
                    reject(new Error(JSON.stringify(response.error)));
                } else {
                    console.log('   ❌ FAILED: No valid JSON response');
                    console.log(`   Raw stdout: ${stdout.slice(0, 200)}...`);
                    reject(new Error('No valid response'));
                }
            } catch (parseError) {
                console.log('   ❌ FAILED: Could not parse response');
                console.log(`   Parse error: ${parseError.message}`);
                reject(parseError);
            }
        });
    });
}

async function validateAllFixes() {
    console.log('🔍 ACTUAL VALIDATION OF "FIXED" TOOLS');
    console.log('=====================================');
    
    const tests = [
        {
            name: 'get-development-environment-status',
            args: { checkDatabase: true, checkDocker: true, checkGit: true },
            expectedContent: ['docker', 'database', 'git', 'solution']
        },
        {
            name: 'restart-development-service', 
            args: { serviceName: 'redpanda-console' },
            expectedContent: ['success', 'serviceName', 'message']
        },
        {
            name: 'test-adapter-configuration',
            args: {},
            expectedContent: ['testResults', 'azureDevOps', 'docker']
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const response = await callMCPTool(test.name, test.args);
            
            // Validate response content
            const content = JSON.stringify(response);
            const hasExpectedContent = test.expectedContent.every(key => 
                content.toLowerCase().includes(key.toLowerCase())
            );
            
            if (hasExpectedContent) {
                console.log(`   ✅ VALIDATED: Contains expected content`);
                results.push({ tool: test.name, status: 'working', error: null });
            } else {
                console.log(`   ⚠️  PARTIAL: Works but missing expected content`);
                console.log(`   Expected: ${test.expectedContent.join(', ')}`);
                results.push({ tool: test.name, status: 'partial', error: 'Missing expected content' });
            }
            
        } catch (error) {
            console.log(`   ❌ BROKEN: ${error.message}`);
            results.push({ tool: test.name, status: 'broken', error: error.message });
        }
    }
    
    // Summary
    console.log('\n📊 ACTUAL VALIDATION RESULTS');
    console.log('============================');
    
    const working = results.filter(r => r.status === 'working');
    const partial = results.filter(r => r.status === 'partial');
    const broken = results.filter(r => r.status === 'broken');
    
    console.log(`✅ Actually Working: ${working.length}/3`);
    working.forEach(r => console.log(`   • ${r.tool}`));
    
    if (partial.length > 0) {
        console.log(`⚠️  Partially Working: ${partial.length}/3`);
        partial.forEach(r => console.log(`   • ${r.tool} - ${r.error}`));
    }
    
    if (broken.length > 0) {
        console.log(`❌ Still Broken: ${broken.length}/3`);
        broken.forEach(r => console.log(`   • ${r.tool} - ${r.error}`));
    }
    
    if (working.length === 3) {
        console.log('\n🎉 ALL TOOLS ACTUALLY WORKING!');
    } else {
        console.log(`\n⚠️  Only ${working.length}/3 tools actually working`);
    }
    
    return results;
}

validateAllFixes().catch(console.error);
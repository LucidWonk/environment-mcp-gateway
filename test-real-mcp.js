// Test actual MCP server by sending requests to it
import { spawn } from 'child_process';

function testMCPTool(toolName, args = {}) {
    return new Promise((resolve) => {
        console.log(`\n🔍 Testing ${toolName}...`);
        
        const request = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: toolName,
                arguments: args
            }
        });

        const child = spawn('node', [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_PATH: './node_modules' }
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            error += data.toString();
        });

        child.on('close', (code) => {
            if (output.includes('error') || error.length > 0 || code !== 0) {
                console.log(`   ❌ FAILED: ${toolName}`);
                if (error) console.log(`   Error: ${error.slice(0, 200)}...`);
                resolve(false);
            } else {
                console.log(`   ✅ SUCCESS: ${toolName}`);
                resolve(true);
            }
        });

        // Write the MCP request
        child.stdin.write(request + '\n');
        child.stdin.end();

        // Timeout after 5 seconds
        setTimeout(() => {
            child.kill();
            console.log(`   ⏰ TIMEOUT: ${toolName}`);
            resolve(false);
        }, 5000);
    });
}

async function runTests() {
    console.log('🧪 Real MCP Tool Integration Tests');
    console.log('==================================');

    const tools = [
        'get-development-environment-status',
        'analyze-solution-structure', 
        'list-development-containers',
        'check-timescaledb-health'
    ];

    const results = {};
    
    for (const tool of tools) {
        results[tool] = await testMCPTool(tool);
    }

    console.log('\n📊 Results Summary:');
    console.log('==================');
    for (const [tool, success] of Object.entries(results)) {
        const status = success ? '✅' : '❌';
        console.log(`${status} ${tool}`);
    }

    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;
    console.log(`\n${successCount}/${totalCount} tools working`);
}

runTests();
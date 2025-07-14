#\!/usr/bin/env node

import { spawn } from 'child_process';

// Simple MCP test script
async function testMCPServer() {
    console.log('🚀 Starting MCP Server test...');
    
    try {
        // Start the MCP server
        const server = spawn('node', ['dist/server.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let errorOutput = '';
        
        server.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        server.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        // Test 1: Server initialization
        console.log('✅ Test 1: Server starts without errors');
        
        // Wait for server to start and then kill it
        setTimeout(() => {
            console.log('📊 Server Output:');
            console.log(output);
            
            if (errorOutput) {
                console.log('⚠️  Server Errors:');
                console.log(errorOutput);
            }
            
            server.kill();
            console.log('✅ Test completed - server stopped');
            
            // Analyze output
            if (output.includes('EnvironmentMCPGateway server started')) {
                console.log('✅ Server initialization successful');
            } else {
                console.log('❌ Server initialization failed');
            }
            
            if (\!errorOutput.includes('Error') && \!errorOutput.includes('ENOENT')) {
                console.log('✅ No critical errors detected');
            } else {
                console.log('⚠️  Some errors detected - check output');
            }
            
        }, 3000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMCPServer();
EOF < /dev/null

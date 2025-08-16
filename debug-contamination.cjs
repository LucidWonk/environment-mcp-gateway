#!/usr/bin/env node

// Script to debug what's contaminating JSON-RPC responses

const { spawn } = require('child_process');
const path = require('path');

const mcpServerPath = path.join(__dirname, 'dist', 'server.js');

function testTool(toolName, args) {
    console.log(`\n🔧 Debug testing: ${toolName}`);
    
    return new Promise((resolve) => {
        const childProcess = spawn('node', [mcpServerPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname,
            env: { 
                ...process.env,
                MCP_SILENT_MODE: 'true'
            }
        });

        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: args
            }
        };

        const requestJson = JSON.stringify(request);
        console.log(`📤 Request: ${requestJson}`);
        
        childProcess.stdin.write(requestJson + '\n');
        childProcess.stdin.end();

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        setTimeout(() => {
            try {
                childProcess.kill();
            } catch (e) {}
            
            console.log(`📥 Raw stdout (${stdout.length} chars):`);
            console.log(`"${stdout}"`);
            console.log(`\n📥 Raw stderr (${stderr.length} chars):`);
            console.log(`"${stderr}"`);
            
            if (stdout.length > 0) {
                console.log(`\n🔍 First 200 chars of stdout:`);
                console.log(`"${stdout.substring(0, 200)}"`);
                
                console.log(`\n🔍 Around position 128:`);
                const start = Math.max(0, 128 - 20);
                const end = Math.min(stdout.length, 128 + 20);
                console.log(`"${stdout.substring(start, end)}"`);
                console.log(`   ${''.padStart(20, ' ')}^`);
            }
            
            resolve();
        }, 5000);
    });
}

async function debugContamination() {
    console.log('🔍 DEBUGGING JSON-RPC CONTAMINATION');
    console.log('===================================');
    
    await testTool('test-adapter-configuration', {});
}

debugContamination();
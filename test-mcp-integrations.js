#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test results storage
const testResults = {
    database: { status: 'pending', error: null },
    docker: { status: 'pending', error: null },
    git: { status: 'pending', error: null },
    solution: { status: 'pending', error: null }
};

async function callMCPTool(toolName, args = {}) {
    return new Promise((resolve, reject) => {
        const mcpProcess = spawn('node', [
            join(__dirname, 'EnvironmentMCPGateway/dist/server.js')
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
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

        let stdout = '';
        let stderr = '';

        mcpProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        mcpProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        mcpProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const response = JSON.parse(stdout);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}\nStdout: ${stdout}\nStderr: ${stderr}`));
                }
            } else {
                reject(new Error(`MCP process exited with code ${code}\nStderr: ${stderr}`));
            }
        });

        mcpProcess.stdin.write(JSON.stringify(request) + '\n');
        mcpProcess.stdin.end();

        // Timeout after 10 seconds
        setTimeout(() => {
            mcpProcess.kill();
            reject(new Error('MCP call timed out'));
        }, 10000);
    });
}

async function testDatabaseIntegration() {
    console.log('🔍 Testing Database Integration...');
    try {
        const result = await callMCPTool('check-timescaledb-health');
        testResults.database.status = 'success';
        console.log('✅ Database integration working');
        return result;
    } catch (error) {
        testResults.database.status = 'failed';
        testResults.database.error = error.message;
        console.log('❌ Database integration failed:', error.message);
        throw error;
    }
}

async function testDockerIntegration() {
    console.log('🔍 Testing Docker Integration...');
    try {
        const result = await callMCPTool('list-development-containers');
        testResults.docker.status = 'success';
        console.log('✅ Docker integration working');
        return result;
    } catch (error) {
        testResults.docker.status = 'failed';
        testResults.docker.error = error.message;
        console.log('❌ Docker integration failed:', error.message);
        throw error;
    }
}

async function testGitIntegration() {
    console.log('🔍 Testing Git Integration...');
    try {
        const result = await callMCPTool('get-development-environment-status', { 
            checkDatabase: false, 
            checkDocker: false, 
            checkGit: true 
        });
        testResults.git.status = 'success';
        console.log('✅ Git integration working');
        return result;
    } catch (error) {
        testResults.git.status = 'failed';
        testResults.git.error = error.message;
        console.log('❌ Git integration failed:', error.message);
        throw error;
    }
}

async function testSolutionAnalysis() {
    console.log('🔍 Testing Solution Analysis...');
    try {
        const result = await callMCPTool('analyze-solution-structure', {
            includeDependencies: false
        });
        testResults.solution.status = 'success';
        console.log('✅ Solution analysis working');
        return result;
    } catch (error) {
        testResults.solution.status = 'failed';
        testResults.solution.error = error.message;
        console.log('❌ Solution analysis failed:', error.message);
        throw error;
    }
}

async function runTests() {
    console.log('🚀 Starting MCP Integration Tests\n');
    
    const tests = [
        { name: 'Database', fn: testDatabaseIntegration },
        { name: 'Docker', fn: testDockerIntegration },
        { name: 'Git', fn: testGitIntegration },
        { name: 'Solution Analysis', fn: testSolutionAnalysis }
    ];

    for (const test of tests) {
        try {
            await test.fn();
        } catch (error) {
            // Error already logged in test function
        }
        console.log(''); // Add spacing between tests
    }

    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================');
    for (const [integration, result] of Object.entries(testResults)) {
        const status = result.status === 'success' ? '✅' : 
                      result.status === 'failed' ? '❌' : '⏳';
        console.log(`${status} ${integration.padEnd(15)} ${result.status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    }

    const failedCount = Object.values(testResults).filter(r => r.status === 'failed').length;
    const successCount = Object.values(testResults).filter(r => r.status === 'success').length;
    
    console.log(`\n${successCount} passed, ${failedCount} failed`);
    
    if (failedCount > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
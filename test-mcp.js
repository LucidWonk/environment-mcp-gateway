#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

// Simple test to validate MCP server functionality
async function testMCPServer() {
    console.log('Testing EnvironmentMCPGateway MCP server...');
    
    const server = spawn('node', ['dist/server.js'], {
        stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Test initialize request
    const initializeRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            capabilities: {},
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        }
    };
    
    server.stdin.write(JSON.stringify(initializeRequest) + '\n');
    
    // Test list tools request
    const listToolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    
    // Test analyze-solution-structure tool
    const toolRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
            name: 'analyze-solution-structure',
            arguments: {
                includeDependencies: true,
                projectType: 'C#'
            }
        }
    };
    
    server.stdin.write(JSON.stringify(toolRequest) + '\n');
    
    let output = '';
    server.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    // Wait for responses
    await setTimeout(2000);
    
    server.kill();
    
    console.log('MCP Server Output:');
    console.log(output);
    
    // Parse and validate responses
    const lines = output.split('\n').filter(line => line.trim());
    const responses = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);
    
    console.log('\nParsed responses:');
    responses.forEach((response, index) => {
        console.log(`Response ${index + 1}:`, JSON.stringify(response, null, 2));
    });
    
    // Check if we got the expected responses
    const hasInitializeResponse = responses.some(r => r.id === 1 && r.result);
    const hasToolsListResponse = responses.some(r => r.id === 2 && r.result && r.result.tools);
    const hasToolCallResponse = responses.some(r => r.id === 3 && r.result && r.result.content);
    
    console.log('\nValidation Results:');
    console.log('Initialize response:', hasInitializeResponse ? 'PASS' : 'FAIL');
    console.log('Tools list response:', hasToolsListResponse ? 'PASS' : 'FAIL');
    console.log('Tool call response:', hasToolCallResponse ? 'PASS' : 'FAIL');
    
    if (hasInitializeResponse && hasToolsListResponse && hasToolCallResponse) {
        console.log('\n✅ All tests PASSED - MCP server is working correctly!');
    } else {
        console.log('\n❌ Some tests FAILED - check the output above');
    }
}

testMCPServer().catch(console.error);
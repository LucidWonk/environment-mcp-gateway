#!/usr/bin/env node

/**
 * Comprehensive MCP Server Diagnostic Tool
 * Tests all available tools on ubuntu-devops.lan MCP server
 */

const http = require('http');

const MCP_SERVER_URL = 'http://ubuntu-devops.lan:3001';
const MCP_ENDPOINT = '/mcp';

class MCPDiagnosticTool {
    constructor() {
        this.requestId = 1;
        this.totalTools = 0;
        this.workingTools = 0;
        this.failedTools = [];
    }

    // Make HTTP request to MCP server
    async makeRequest(data) {
        return new Promise((resolve, reject) => {
            const jsonData = JSON.stringify(data);
            const options = {
                hostname: 'ubuntu-devops.lan',
                port: 3001,
                path: MCP_ENDPOINT,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(jsonData),
                    'User-Agent': 'mcp-diagnostic-tool/1.0'
                },
                timeout: 10000 // 10 second timeout
            };

            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON response: ${e.message}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`HTTP request failed: ${err.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(jsonData);
            req.end();
        });
    }

    // Test health endpoint
    async testHealthEndpoint() {
        console.log('📊 Testing Health Endpoint...');
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'ubuntu-devops.lan',
                port: 3001,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const health = JSON.parse(responseData);
                        console.log('✅ Health endpoint working:', {
                            status: health.status,
                            uptime: health.uptime ? `${Math.floor(health.uptime)} seconds` : 'unknown',
                            transport: health.transport,
                            version: health.version
                        });
                        resolve(health);
                    } catch (e) {
                        reject(new Error(`Health endpoint returned invalid JSON: ${e.message}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Health endpoint failed: ${err.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Health endpoint timeout'));
            });

            req.end();
        });
    }

    // Test status endpoint
    async testStatusEndpoint() {
        console.log('📈 Testing Status Endpoint...');
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'ubuntu-devops.lan',
                port: 3001,
                path: '/status',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const status = JSON.parse(responseData);
                        console.log('✅ Status endpoint working:', {
                            server: status.server,
                            status: status.status,
                            totalTools: status.tools?.total || 'unknown',
                            categories: status.tools?.categories || [],
                            activeSessions: status.sessions?.active || 0,
                            process: {
                                pid: status.process?.pid,
                                uptime: status.process?.uptime ? `${Math.floor(status.process.uptime)} seconds` : 'unknown'
                            }
                        });
                        resolve(status);
                    } catch (e) {
                        reject(new Error(`Status endpoint returned invalid JSON: ${e.message}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Status endpoint failed: ${err.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Status endpoint timeout'));
            });

            req.end();
        });
    }

    // Initialize MCP connection
    async initialize() {
        console.log('🔧 Initializing MCP Connection...');
        
        const initRequest = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'mcp-diagnostic-tool',
                    version: '1.0.0'
                }
            }
        };

        try {
            const response = await this.makeRequest(initRequest);
            
            if (response.error) {
                throw new Error(`Initialize failed: ${response.error.message}`);
            }
            
            console.log('✅ MCP Connection initialized:', {
                protocolVersion: response.result.protocolVersion,
                serverName: response.result.serverInfo.name,
                serverVersion: response.result.serverInfo.version,
                capabilities: Object.keys(response.result.capabilities)
            });
            
            return response.result;
        } catch (error) {
            console.error('❌ Initialize failed:', error.message);
            throw error;
        }
    }

    // List all available tools
    async listAllTools() {
        console.log('📋 Listing All Available Tools...');
        
        const listRequest = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'tools/list',
            params: {}
        };

        try {
            const response = await this.makeRequest(listRequest);
            
            if (response.error) {
                throw new Error(`Tools list failed: ${response.error.message}`);
            }
            
            const tools = response.result.tools;
            this.totalTools = tools.length;
            
            console.log(`✅ Found ${tools.length} available tools:`);
            
            // Group tools by category
            const toolsByCategory = this.groupToolsByCategory(tools);
            
            for (const [category, categoryTools] of Object.entries(toolsByCategory)) {
                console.log(`\n📂 ${category} (${categoryTools.length} tools):`);
                categoryTools.forEach((tool, index) => {
                    console.log(`   ${index + 1}. ${tool.name}`);
                    console.log(`      Description: ${tool.description}`);
                    console.log(`      Schema: ${tool.inputSchema.type || 'object'} with ${Object.keys(tool.inputSchema.properties || {}).length} parameters`);
                });
            }
            
            return tools;
        } catch (error) {
            console.error('❌ List tools failed:', error.message);
            throw error;
        }
    }

    // Group tools by category based on name patterns
    groupToolsByCategory(tools) {
        const categories = {
            'Git & Version Control': [],
            'Azure DevOps & Pipelines': [],
            'Infrastructure & Docker': [],
            'Context Generation': [],
            'Business Analysis': [],
            'Virtual Expert Team': [],
            'Lifecycle Management': [],
            'VM Management': [],
            'Cross-Domain Analysis': [],
            'Other Tools': []
        };

        tools.forEach(tool => {
            const name = tool.name.toLowerCase();
            
            if (name.includes('git') || name.includes('branch') || name.includes('commit') || name.includes('merge')) {
                categories['Git & Version Control'].push(tool);
            } else if (name.includes('pipeline') || name.includes('azure') || name.includes('build') || name.includes('deploy') || name.includes('devops')) {
                categories['Azure DevOps & Pipelines'].push(tool);
            } else if (name.includes('infrastructure') || name.includes('docker') || name.includes('container') || name.includes('development') || name.includes('solution') || name.includes('environment')) {
                categories['Infrastructure & Docker'].push(tool);
            } else if (name.includes('context') || name.includes('generate') || name.includes('semantic') || name.includes('holistic')) {
                categories['Context Generation'].push(tool);
            } else if (name.includes('business') || name.includes('concept') || name.includes('rule') || name.includes('analysis')) {
                categories['Business Analysis'].push(tool);
            } else if (name.includes('expert') || name.includes('team') || name.includes('virtual')) {
                categories['Virtual Expert Team'].push(tool);
            } else if (name.includes('lifecycle') || name.includes('document') || name.includes('registry')) {
                categories['Lifecycle Management'].push(tool);
            } else if (name.includes('vm') || name.includes('provision') || name.includes('health-check') || name.includes('logs')) {
                categories['VM Management'].push(tool);
            } else if (name.includes('cross-domain') || name.includes('impact')) {
                categories['Cross-Domain Analysis'].push(tool);
            } else {
                categories['Other Tools'].push(tool);
            }
        });

        // Remove empty categories
        return Object.fromEntries(
            Object.entries(categories).filter(([_, tools]) => tools.length > 0)
        );
    }

    // Test a specific tool
    async testTool(tool, testArgs = {}) {
        console.log(`\n🔧 Testing tool: ${tool.name}`);
        
        const callRequest = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'tools/call',
            params: {
                name: tool.name,
                arguments: testArgs
            }
        };

        try {
            const startTime = Date.now();
            const response = await this.makeRequest(callRequest);
            const duration = Date.now() - startTime;
            
            if (response.error) {
                console.log(`❌ Tool "${tool.name}" failed: ${response.error.message}`);
                this.failedTools.push({
                    name: tool.name,
                    error: response.error.message,
                    category: this.getCategoryForTool(tool)
                });
                return { success: false, error: response.error.message };
            }
            
            console.log(`✅ Tool "${tool.name}" executed successfully (${duration}ms)`);
            
            // Show sample of the response
            if (response.result && response.result.content) {
                const content = response.result.content[0];
                if (content && content.text) {
                    const preview = content.text.length > 200 ? 
                        content.text.substring(0, 200) + '...' : 
                        content.text;
                    console.log(`   Response preview: ${preview}`);
                }
            }
            
            this.workingTools++;
            return { success: true, duration, response: response.result };
        } catch (error) {
            console.log(`❌ Tool "${tool.name}" failed: ${error.message}`);
            this.failedTools.push({
                name: tool.name,
                error: error.message,
                category: this.getCategoryForTool(tool)
            });
            return { success: false, error: error.message };
        }
    }

    // Get category for a tool
    getCategoryForTool(tool) {
        const name = tool.name.toLowerCase();
        if (name.includes('git') || name.includes('branch') || name.includes('commit')) {
            return 'Git & Version Control';
        } else if (name.includes('pipeline') || name.includes('azure') || name.includes('build')) {
            return 'Azure DevOps & Pipelines';
        } else if (name.includes('infrastructure') || name.includes('docker') || name.includes('container')) {
            return 'Infrastructure & Docker';
        } else if (name.includes('context') || name.includes('generate')) {
            return 'Context Generation';
        } else if (name.includes('vm') || name.includes('provision')) {
            return 'VM Management';
        }
        return 'Other';
    }

    // Get appropriate test arguments for a tool
    getTestArgumentsForTool(tool) {
        const name = tool.name.toLowerCase();
        const properties = tool.inputSchema.properties || {};
        const required = tool.inputSchema.required || [];
        const args = {};

        // Set safe default values for required parameters
        required.forEach(param => {
            const propSchema = properties[param];
            if (propSchema) {
                switch (propSchema.type) {
                    case 'string':
                        if (param.includes('name') || param.includes('id')) {
                            args[param] = 'test';
                        } else if (param.includes('path')) {
                            args[param] = './test';
                        } else {
                            args[param] = propSchema.default || 'test-value';
                        }
                        break;
                    case 'number':
                    case 'integer':
                        args[param] = propSchema.default || 1;
                        break;
                    case 'boolean':
                        args[param] = propSchema.default !== undefined ? propSchema.default : true;
                        break;
                    case 'array':
                        args[param] = propSchema.default || [];
                        break;
                    case 'object':
                        args[param] = propSchema.default || {};
                        break;
                    default:
                        args[param] = propSchema.default || null;
                }
            }
        });

        // Tool-specific overrides for better testing
        if (name.includes('list') && Object.keys(args).length === 0) {
            // List tools usually don't need parameters
            return {};
        } else if (name.includes('status') && Object.keys(args).length === 0) {
            // Status tools usually don't need parameters
            return {};
        } else if (name.includes('health') && Object.keys(args).length === 0) {
            // Health tools usually don't need parameters
            return {};
        }

        return args;
    }

    // Test all tools with appropriate arguments
    async testAllTools(tools) {
        console.log(`\n🧪 Testing All ${tools.length} Tools...\n`);
        
        const results = [];
        
        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            const testArgs = this.getTestArgumentsForTool(tool);
            
            console.log(`[${i + 1}/${tools.length}] Testing: ${tool.name}`);
            if (Object.keys(testArgs).length > 0) {
                console.log(`   Arguments: ${JSON.stringify(testArgs)}`);
            }
            
            const result = await this.testTool(tool, testArgs);
            results.push({
                tool: tool.name,
                category: this.getCategoryForTool(tool),
                ...result
            });
            
            // Small delay between tests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }

    // Generate comprehensive report
    generateReport(tools, testResults) {
        console.log('\n🎯 COMPREHENSIVE MCP SERVER DIAGNOSTIC REPORT\n');
        console.log('=' * 80);
        
        // Server Summary
        console.log('\n📊 SERVER SUMMARY:');
        console.log(`   Total Tools Available: ${this.totalTools}`);
        console.log(`   Working Tools: ${this.workingTools}`);
        console.log(`   Failed Tools: ${this.failedTools.length}`);
        console.log(`   Success Rate: ${((this.workingTools / this.totalTools) * 100).toFixed(1)}%`);
        
        // Tool Categories
        console.log('\n📂 TOOLS BY CATEGORY:');
        const toolsByCategory = this.groupToolsByCategory(tools);
        for (const [category, categoryTools] of Object.entries(toolsByCategory)) {
            const workingInCategory = testResults.filter(r => 
                r.category === category && r.success
            ).length;
            console.log(`   ${category}: ${workingInCategory}/${categoryTools.length} working`);
        }
        
        // Failed Tools Analysis
        if (this.failedTools.length > 0) {
            console.log('\n❌ FAILED TOOLS:');
            const failuresByCategory = {};
            this.failedTools.forEach(fail => {
                if (!failuresByCategory[fail.category]) {
                    failuresByCategory[fail.category] = [];
                }
                failuresByCategory[fail.category].push(fail);
            });
            
            for (const [category, failures] of Object.entries(failuresByCategory)) {
                console.log(`\n   ${category} (${failures.length} failures):`);
                failures.forEach(fail => {
                    console.log(`      • ${fail.name}: ${fail.error}`);
                });
            }
        }
        
        // Performance Analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS:');
        const successfulResults = testResults.filter(r => r.success && r.duration);
        if (successfulResults.length > 0) {
            const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
            const maxDuration = Math.max(...successfulResults.map(r => r.duration));
            const minDuration = Math.min(...successfulResults.map(r => r.duration));
            
            console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
            console.log(`   Fastest Tool: ${minDuration}ms`);
            console.log(`   Slowest Tool: ${maxDuration}ms`);
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (this.workingTools === this.totalTools) {
            console.log('   ✅ All tools are working correctly. Server is fully operational.');
        } else if (this.workingTools > this.totalTools * 0.8) {
            console.log('   ⚠️  Most tools working, but some failures detected. Check failed tools.');
        } else {
            console.log('   🚨 Significant tool failures detected. Server may need attention.');
        }
        
        if (this.failedTools.some(f => f.category === 'Infrastructure & Docker')) {
            console.log('   🐳 Infrastructure tools failing - check Docker and database connectivity');
        }
        
        if (this.failedTools.some(f => f.category === 'Azure DevOps & Pipelines')) {
            console.log('   ☁️  Azure DevOps tools failing - check PAT configuration and connectivity');
        }
        
        console.log('\n' + '=' * 80);
        console.log('Diagnostic completed successfully! 🎉');
    }

    // Main diagnostic routine
    async runComprehensiveDiagnostic() {
        console.log('🚀 STARTING COMPREHENSIVE MCP SERVER DIAGNOSTIC\n');
        console.log(`Target: ${MCP_SERVER_URL}`);
        console.log(`Timestamp: ${new Date().toISOString()}\n`);

        try {
            // Test basic connectivity
            console.log('🔍 Phase 1: Basic Connectivity Tests');
            await this.testHealthEndpoint();
            await this.testStatusEndpoint();
            
            // Initialize MCP connection
            console.log('\n🔍 Phase 2: MCP Protocol Tests');
            await this.initialize();
            
            // List all tools
            console.log('\n🔍 Phase 3: Tool Discovery');
            const tools = await this.listAllTools();
            
            // Test all tools
            console.log('\n🔍 Phase 4: Tool Functionality Tests');
            const testResults = await this.testAllTools(tools);
            
            // Generate comprehensive report
            console.log('\n🔍 Phase 5: Analysis & Reporting');
            this.generateReport(tools, testResults);
            
        } catch (error) {
            console.error('\n💥 DIAGNOSTIC FAILED:', error.message);
            console.log('\n🔍 Attempting basic connectivity check...');
            
            try {
                await this.testHealthEndpoint();
                console.log('   Health endpoint is accessible, but MCP protocol may have issues');
            } catch (healthError) {
                console.log('   Server appears to be completely unavailable');
                console.log('   Possible causes:');
                console.log('   • Server is not running');
                console.log('   • Network connectivity issues');
                console.log('   • Firewall blocking port 3001');
                console.log('   • Wrong hostname or port configuration');
            }
            
            process.exit(1);
        }
    }
}

// Run the diagnostic
if (require.main === module) {
    const diagnostic = new MCPDiagnosticTool();
    diagnostic.runComprehensiveDiagnostic().catch(console.error);
}

module.exports = MCPDiagnosticTool;
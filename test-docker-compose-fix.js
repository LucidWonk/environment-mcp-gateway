#!/usr/bin/env node

const { spawn } = require('child_process');
const { join } = require('path');

/**
 * Test and fix the docker-compose issues
 */

async function testDockerComposeCommand(workingDir) {
    return new Promise((resolve) => {
        console.log(`\n🔍 Testing docker-compose ps from: ${workingDir}`);
        
        const process = spawn('docker-compose', ['ps', '--format', 'json'], {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                console.log('   ✅ SUCCESS: docker-compose command worked');
                try {
                    const parsed = JSON.parse(stdout);
                    console.log(`   📊 Found ${parsed.length} services`);
                    resolve({ success: true, data: parsed });
                } catch (error) {
                    console.log('   ❌ FAILED: JSON parsing error');
                    resolve({ success: false, error: 'JSON parse failed' });
                }
            } else {
                console.log(`   ❌ FAILED: Exit code ${code}`);
                console.log(`   Error: ${stderr}`);
                resolve({ success: false, error: stderr });
            }
        });
    });
}

async function testRestartService(workingDir, serviceName) {
    return new Promise((resolve) => {
        console.log(`\n🔄 Testing docker-compose restart ${serviceName} from: ${workingDir}`);
        
        const process = spawn('docker-compose', ['restart', serviceName], {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stderr = '';
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        // Set timeout to catch hanging
        const timeout = setTimeout(() => {
            process.kill('SIGTERM');
            console.log('   ⏰ TIMEOUT: Command took too long, killed process');
            resolve({ success: false, error: 'Timeout' });
        }, 5000);
        
        process.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                console.log('   ✅ SUCCESS: Service restart worked');
                resolve({ success: true });
            } else {
                console.log(`   ❌ FAILED: Exit code ${code}`);
                console.log(`   Error: ${stderr}`);
                resolve({ success: false, error: stderr });
            }
        });
    });
}

async function runDiagnostics() {
    console.log('🔧 DOCKER COMPOSE DIAGNOSTIC TESTS');
    console.log('===================================');
    
    // Test from different working directories
    const testDirs = [
        '/mnt/m/projects/lucidwonks',              // Correct parent directory  
        '/mnt/m/projects/lucidwonks/EnvironmentMCPGateway',  // MCP Gateway directory
        '/mnt/m/Projects/Lucidwonks'               // Case-sensitive path issue
    ];
    
    for (const dir of testDirs) {
        const result = await testDockerComposeCommand(dir);
        if (result.success) {
            console.log(`   ✅ WORKING DIRECTORY: ${dir}`);
            
            // Test restart with a valid service
            if (result.data && result.data.length > 0) {
                const serviceName = result.data[0].Service;
                console.log(`   🔄 Testing restart with service: ${serviceName}`);
                await testRestartService(dir, serviceName);
            }
            break;
        } else {
            console.log(`   ❌ FAILED DIRECTORY: ${dir} - ${result.error}`);
        }
    }
}

runDiagnostics();
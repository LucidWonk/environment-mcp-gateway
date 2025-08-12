#!/usr/bin/env node

/**
 * Docker health check script for Environment MCP Gateway
 * Performs comprehensive health validation including:
 * - HTTP endpoint availability
 * - Path resolution functionality  
 * - Rollback system status
 * - Timeout configuration validation
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');
const fs = require('fs');
const path = require('path');

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const MCP_SERVER_PORT = process.env.MCP_SERVER_PORT || 3001;
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/workspace';

async function performHealthCheck() {
    const checks = [];
    let allHealthy = true;
    
    console.log('🏥 Starting Environment MCP Gateway health check...');

    // 1. HTTP Endpoint Check
    try {
        const endpointHealthy = await checkHttpEndpoint();
        checks.push({ name: 'HTTP Endpoint', status: endpointHealthy ? '✅' : '❌', healthy: endpointHealthy });
        if (!endpointHealthy) allHealthy = false;
    } catch (error) {
        checks.push({ name: 'HTTP Endpoint', status: '❌', healthy: false, error: error.message });
        allHealthy = false;
    }

    // 2. Project Root Path Check
    try {
        const pathHealthy = await checkProjectRootPath();
        checks.push({ name: 'Project Root Access', status: pathHealthy ? '✅' : '❌', healthy: pathHealthy });
        if (!pathHealthy) allHealthy = false;
    } catch (error) {
        checks.push({ name: 'Project Root Access', status: '❌', healthy: false, error: error.message });
        allHealthy = false;
    }

    // 3. Data Directories Check
    try {
        const dataDirHealthy = await checkDataDirectories();
        checks.push({ name: 'Data Directories', status: dataDirHealthy ? '✅' : '❌', healthy: dataDirHealthy });
        if (!dataDirHealthy) allHealthy = false;
    } catch (error) {
        checks.push({ name: 'Data Directories', status: '❌', healthy: false, error: error.message });
        allHealthy = false;
    }

    // 4. Configuration Validation
    try {
        const configHealthy = await checkConfiguration();
        checks.push({ name: 'Configuration', status: configHealthy ? '✅' : '❌', healthy: configHealthy });
        if (!configHealthy) allHealthy = false;
    } catch (error) {
        checks.push({ name: 'Configuration', status: '❌', healthy: false, error: error.message });
        allHealthy = false;
    }

    // 5. Rollback System Check
    try {
        const rollbackHealthy = await checkRollbackSystem();
        checks.push({ name: 'Rollback System', status: rollbackHealthy ? '✅' : '❌', healthy: rollbackHealthy });
        if (!rollbackHealthy) allHealthy = false;
    } catch (error) {
        checks.push({ name: 'Rollback System', status: '❌', healthy: false, error: error.message });
        allHealthy = false;
    }

    // Output Results
    console.log('\n📋 Health Check Results:');
    for (const check of checks) {
        console.log(`  ${check.status} ${check.name}${check.error ? ` - ${check.error}` : ''}`);
    }

    console.log(`\n🎯 Overall Status: ${allHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`📊 Checks Passed: ${checks.filter(c => c.healthy).length}/${checks.length}`);
    
    if (allHealthy) {
        console.log('🚀 Environment MCP Gateway is ready for operations');
        process.exit(0);
    } else {
        console.log('⚠️  Environment MCP Gateway has health issues');
        process.exit(1);
    }
}

async function checkHttpEndpoint() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: MCP_SERVER_PORT,
            path: '/health',
            method: 'GET',
            timeout: HEALTH_CHECK_TIMEOUT
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(res.statusCode === 200 && response.status === 'healthy');
                } catch {
                    resolve(false);
                }
            });
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

async function checkProjectRootPath() {
    try {
        const stats = await fs.promises.stat(PROJECT_ROOT);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

async function checkDataDirectories() {
    const requiredDirs = [
        process.env.ATOMIC_OPS_DIR || '/app/.atomic-ops',
        process.env.HOLISTIC_ROLLBACK_DIR || '/app/.holistic-rollback',
        process.env.SEMANTIC_CACHE_DIR || '/app/.semantic-cache'
    ];

    for (const dir of requiredDirs) {
        try {
            const stats = await fs.promises.stat(dir);
            if (!stats.isDirectory()) return false;
        } catch {
            return false;
        }
    }
    
    return true;
}

async function checkConfiguration() {
    const requiredEnvVars = [
        'PROJECT_ROOT',
        'MCP_SERVER_PORT',
        'SEMANTIC_ANALYSIS_TIMEOUT',
        'DOMAIN_ANALYSIS_TIMEOUT',
        'CONTEXT_GENERATION_TIMEOUT'
    ];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.log(`❌ Missing required environment variable: ${envVar}`);
            return false;
        }
    }

    // Validate timeout values are reasonable
    const timeouts = {
        SEMANTIC_ANALYSIS_TIMEOUT: parseInt(process.env.SEMANTIC_ANALYSIS_TIMEOUT),
        DOMAIN_ANALYSIS_TIMEOUT: parseInt(process.env.DOMAIN_ANALYSIS_TIMEOUT),
        CONTEXT_GENERATION_TIMEOUT: parseInt(process.env.CONTEXT_GENERATION_TIMEOUT),
        FILE_OPERATIONS_TIMEOUT: parseInt(process.env.FILE_OPERATIONS_TIMEOUT || '45000'),
        FULL_REINDEX_TIMEOUT: parseInt(process.env.FULL_REINDEX_TIMEOUT || '600000')
    };

    for (const [name, timeout] of Object.entries(timeouts)) {
        if (isNaN(timeout) || timeout < 1000 || timeout > 3600000) { // 1s to 1h range
            console.log(`❌ Invalid timeout configuration for ${name}: ${timeout}ms`);
            return false;
        }
    }

    return true;
}

async function checkRollbackSystem() {
    const rollbackDir = process.env.HOLISTIC_ROLLBACK_DIR || '/app/.holistic-rollback';
    
    try {
        // Check if rollback directories exist and are accessible
        const stateDir = path.join(rollbackDir, 'state');
        const snapshotDir = path.join(rollbackDir, 'snapshots');
        
        await fs.promises.access(stateDir, fs.constants.R_OK | fs.constants.W_OK);
        await fs.promises.access(snapshotDir, fs.constants.R_OK | fs.constants.W_OK);
        
        // Check rollback configuration
        const maxAge = parseInt(process.env.ROLLBACK_MAX_AGE_HOURS || '24');
        const maxCount = parseInt(process.env.ROLLBACK_MAX_COUNT || '10');
        
        if (isNaN(maxAge) || maxAge < 1 || maxAge > 168) { // 1 hour to 1 week
            console.log(`❌ Invalid rollback max age: ${maxAge} hours`);
            return false;
        }
        
        if (isNaN(maxCount) || maxCount < 1 || maxCount > 100) {
            console.log(`❌ Invalid rollback max count: ${maxCount}`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Rollback system check failed: ${error.message}`);
        return false;
    }
}

// Run health check
performHealthCheck().catch(error => {
    console.error('❌ Health check failed with error:', error);
    process.exit(1);
});
#!/usr/bin/env node

// Test database integration by checking TimescaleDB health
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testDatabase() {
    try {
        console.log('🔍 Testing Database Integration...');
        
        // Test if we can connect to TimescaleDB
        const result = await execAsync('docker exec lucidwonks-timescaledb-1 psql -U postgres -d pricehistorydb -c "SELECT version();"');
        console.log('✅ Database connection successful');
        console.log('Database version:', result.stdout.split('\n')[2].trim());
        return true;
    } catch (error) {
        console.log('❌ Database integration failed:', error.message);
        return false;
    }
}

testDatabase();
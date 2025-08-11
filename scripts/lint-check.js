#!/usr/bin/env node

/**
 * Automated linting error detection and fixing script
 * Detects ESLint errors and attempts to fix them automatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class LintErrorDetector {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.srcDir = path.join(this.projectRoot, 'src');
    }

    /**
     * Run ESLint and capture output
     */
    runLint() {
        try {
            console.log('🔍 Running ESLint to detect errors...');
            const result = execSync('npm run lint', { 
                cwd: this.projectRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });
            console.log('✅ No linting errors found!');
            return { success: true, output: result };
        } catch (error) {
            console.log('❌ Linting errors detected:');
            console.log(error.stdout || error.message);
            return { success: false, output: error.stdout || error.message };
        }
    }

    /**
     * Parse ESLint output to extract errors
     */
    parseErrors(output) {
        const errors = [];
        const lines = output.split('\n');
        let currentFile = null;

        for (const line of lines) {
            // Detect file path
            if (line.includes('.ts') && !line.includes('error') && !line.includes('warning')) {
                currentFile = line.trim();
            }
            
            // Parse error lines
            const errorMatch = line.match(/^\s*(\d+):(\d+)\s+(error|warning)\s+(.+)\s+(.+)$/);
            if (errorMatch && currentFile) {
                errors.push({
                    file: currentFile,
                    line: parseInt(errorMatch[1]),
                    column: parseInt(errorMatch[2]),
                    type: errorMatch[3],
                    message: errorMatch[4].trim(),
                    rule: errorMatch[5].trim()
                });
            }
        }

        return errors;
    }

    /**
     * Attempt to fix linting errors automatically
     */
    async fixErrors() {
        console.log('🔧 Attempting to auto-fix linting errors...');
        try {
            const result = execSync('npm run lint -- --fix', {
                cwd: this.projectRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });
            console.log('✅ Auto-fix completed successfully!');
            return true;
        } catch (error) {
            console.log('⚠️  Auto-fix completed with remaining errors:');
            console.log(error.stdout || error.message);
            return false;
        }
    }

    /**
     * Run full detection and fixing cycle
     */
    async run() {
        console.log('🚀 Starting automated lint error detection and fixing...\n');
        
        // First pass - detect errors
        const initialResult = this.runLint();
        if (initialResult.success) {
            return;
        }

        const errors = this.parseErrors(initialResult.output);
        console.log(`\n📊 Found ${errors.length} linting errors\n`);

        // Attempt auto-fix
        const fixSuccessful = await this.fixErrors();
        
        // Second pass - check remaining errors
        console.log('\n🔍 Checking for remaining errors...');
        const finalResult = this.runLint();
        
        if (finalResult.success) {
            console.log('🎉 All linting errors have been fixed!');
        } else {
            console.log('⚠️  Some errors require manual intervention');
            const remainingErrors = this.parseErrors(finalResult.output);
            console.log(`📊 ${remainingErrors.length} errors remaining`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const detector = new LintErrorDetector();
    detector.run().catch(console.error);
}

module.exports = LintErrorDetector;
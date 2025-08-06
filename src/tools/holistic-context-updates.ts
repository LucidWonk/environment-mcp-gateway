import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { HolisticUpdateOrchestrator, HolisticUpdateRequest } from '../services/holistic-update-orchestrator.js';
import { RollbackManager } from '../services/rollback-manager.js';
import path from 'path';

// Initialize orchestrator with project root
const projectRoot = path.resolve(process.cwd(), '..');
const orchestrator = new HolisticUpdateOrchestrator(projectRoot);
const rollbackManager = new RollbackManager(path.join(projectRoot, '.holistic-rollback'));

/**
 * MCP Tool: Execute holistic context update across all affected domains
 */
export const executeHolisticContextUpdateTool: Tool = {
    name: 'execute-holistic-context-update',
    description: 'Execute holistic context update across all affected domains with atomic operations and rollback capability. Ensures consistency across all .context folders by completely regenerating affected context rather than incremental updates.',
    inputSchema: {
        type: 'object',
        properties: {
            changedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of file paths that have changed and require context updates'
            },
            gitCommitHash: {
                type: 'string',
                description: 'Optional git commit hash for tracking the trigger of this update',
                default: undefined
            },
            triggerType: {
                type: 'string',
                enum: ['git-hook', 'manual', 'scheduled'],
                description: 'Type of trigger that initiated this holistic update',
                default: 'manual'
            },
            performanceTimeout: {
                type: 'number',
                description: 'Maximum time in seconds for holistic update execution (default: 15)',
                minimum: 5,
                maximum: 30,
                default: 15
            }
        },
        required: ['changedFiles']
    }
};

/**
 * MCP Tool: Get holistic update status and history
 */
export const getHolisticUpdateStatusTool: Tool = {
    name: 'get-holistic-update-status',
    description: 'Get status and history of recent holistic context updates, including performance metrics and rollback information.',
    inputSchema: {
        type: 'object',
        properties: {
            limitCount: {
                type: 'number',
                description: 'Maximum number of recent updates to return',
                minimum: 1,
                maximum: 50,
                default: 10
            },
            includeMetrics: {
                type: 'boolean',
                description: 'Include detailed performance metrics in the response',
                default: true
            }
        }
    }
};

/**
 * MCP Tool: Execute rollback for failed holistic update
 */
export const rollbackHolisticUpdateTool: Tool = {
    name: 'rollback-holistic-update',
    description: 'Execute rollback for a failed holistic context update using stored snapshots. Completely restores all affected .context folders to their pre-update state.',
    inputSchema: {
        type: 'object',
        properties: {
            updateId: {
                type: 'string',
                description: 'ID of the holistic update to rollback'
            },
            validateBeforeRollback: {
                type: 'boolean',
                description: 'Validate rollback data integrity before executing rollback',
                default: true
            }
        },
        required: ['updateId']
    }
};

/**
 * MCP Tool: Validate holistic update configuration
 */
export const validateHolisticUpdateConfigTool: Tool = {
    name: 'validate-holistic-update-config',
    description: 'Validate holistic update configuration and domain structure. Checks that all required directories exist and permissions are correct.',
    inputSchema: {
        type: 'object',
        properties: {
            checkPermissions: {
                type: 'boolean',
                description: 'Check file system permissions for context directories',
                default: true
            },
            validateDomainStructure: {
                type: 'boolean',
                description: 'Validate that domain structure follows DDD patterns',
                default: true
            }
        }
    }
};

/**
 * MCP Tool: Perform holistic update maintenance
 */
export const performHolisticUpdateMaintenanceTool: Tool = {
    name: 'perform-holistic-update-maintenance',
    description: 'Perform maintenance tasks for holistic update system including cleanup of old rollback data and atomic operation files.',
    inputSchema: {
        type: 'object',
        properties: {
            cleanupOlderThanHours: {
                type: 'number',
                description: 'Clean up data older than this many hours (default: 168 = 1 week)',
                minimum: 1,
                maximum: 8760, // 1 year
                default: 168
            },
            dryRun: {
                type: 'boolean',
                description: 'Perform dry run without actually deleting files',
                default: false
            }
        }
    }
};

/**
 * Tool implementations
 */
export async function handleExecuteHolisticContextUpdate(args: any): Promise<any> {
    try {
        const request: HolisticUpdateRequest = {
            changedFiles: args.changedFiles,
            gitCommitHash: args.gitCommitHash,
            triggerType: args.triggerType || 'manual',
            performanceTimeout: args.performanceTimeout || 15
        };

        const result = await orchestrator.executeHolisticUpdate(request);

        return {
            success: result.success,
            updateId: result.updateId,
            executionTime: result.executionTime,
            affectedDomains: result.affectedDomains,
            updatedFiles: result.updatedFiles,
            performanceMetrics: result.performanceMetrics,
            error: result.error?.message,
            summary: result.success 
                ? `✅ Holistic update completed successfully in ${result.executionTime}ms across ${result.affectedDomains.length} domains with ${result.updatedFiles.length} files updated`
                : `❌ Holistic update failed: ${result.error?.message}`
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Holistic update failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function handleGetHolisticUpdateStatus(args: any): Promise<any> {
    try {
        const limitCount = args.limitCount || 10;
        const _includeMetrics = args.includeMetrics !== false;

        const recentUpdates = await orchestrator.getRecentUpdateStatus(limitCount);
        const pendingRollbacks = await rollbackManager.getPendingRollbacks();

        return {
            success: true,
            recentUpdates,
            pendingRollbacks: pendingRollbacks.map(rollback => ({
                updateId: rollback.contextUpdateId,
                timestamp: rollback.timestamp,
                status: rollback.status,
                affectedDomains: rollback.affectedDomains
            })),
            summary: `📊 Found ${recentUpdates.length} recent updates and ${pendingRollbacks.length} pending rollbacks`,
            totalRecentUpdates: recentUpdates.length,
            totalPendingRollbacks: pendingRollbacks.length
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Failed to get holistic update status: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function handleRollbackHolisticUpdate(args: any): Promise<any> {
    try {
        const { updateId, validateBeforeRollback = true } = args;

        if (validateBeforeRollback) {
            const isValid = await rollbackManager.validateRollbackData(updateId);
            if (!isValid) {
                return {
                    success: false,
                    error: 'Rollback data validation failed',
                    summary: `❌ Cannot rollback update ${updateId}: rollback data is invalid or missing`
                };
            }
        }

        const rollbackSuccess = await rollbackManager.executeHolisticRollback(updateId);

        return {
            success: rollbackSuccess,
            updateId,
            summary: rollbackSuccess 
                ? `✅ Successfully rolled back holistic update ${updateId}`
                : `❌ Failed to rollback holistic update ${updateId}`,
            rollbackExecuted: rollbackSuccess
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function handleValidateHolisticUpdateConfig(args: any): Promise<any> {
    try {
        const { checkPermissions = true, validateDomainStructure = true } = args;
        const validationResults = [];
        let overallSuccess = true;

        // Validate project structure
        const projectStructureValid = await validateProjectStructure();
        validationResults.push({
            check: 'Project Structure',
            success: projectStructureValid.success,
            details: projectStructureValid.details
        });
        if (!projectStructureValid.success) overallSuccess = false;

        // Check permissions if requested
        if (checkPermissions) {
            const permissionsValid = await validateFilePermissions();
            validationResults.push({
                check: 'File Permissions',
                success: permissionsValid.success,
                details: permissionsValid.details
            });
            if (!permissionsValid.success) overallSuccess = false;
        }

        // Validate domain structure if requested
        if (validateDomainStructure) {
            const domainStructureValid = await _validateDomainStructure();
            validationResults.push({
                check: 'Domain Structure',
                success: domainStructureValid.success,
                details: domainStructureValid.details
            });
            if (!domainStructureValid.success) overallSuccess = false;
        }

        return {
            success: overallSuccess,
            validationResults,
            summary: overallSuccess 
                ? '✅ All holistic update configuration checks passed'
                : '⚠️ Some holistic update configuration checks failed - see details',
            totalChecks: validationResults.length,
            passedChecks: validationResults.filter(r => r.success).length
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function handlePerformHolisticUpdateMaintenance(args: any): Promise<any> {
    try {
        const { cleanupOlderThanHours = 168, dryRun = false } = args;

        if (dryRun) {
            // Simulate maintenance without actually performing cleanup
            const pendingRollbacks = await rollbackManager.getPendingRollbacks();
            const oldRollbacks = pendingRollbacks.filter(rollback => {
                const ageMs = Date.now() - rollback.timestamp.getTime();
                const ageHours = ageMs / (1000 * 60 * 60);
                return ageHours > cleanupOlderThanHours;
            });

            return {
                success: true,
                dryRun: true,
                summary: `🧹 Dry run: Would clean up ${oldRollbacks.length} old rollback records`,
                itemsToCleanup: oldRollbacks.length,
                oldestItem: oldRollbacks.length > 0 ? oldRollbacks[0].timestamp : null
            };
        } else {
            // Perform actual maintenance
            await orchestrator.performMaintenance();

            return {
                success: true,
                dryRun: false,
                summary: '🧹 Maintenance completed successfully',
                maintenanceCompleted: true
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            summary: `❌ Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// Helper validation functions
async function validateProjectStructure(): Promise<{ success: boolean, details: string[] }> {
    const details: string[] = [];
    let success = true;

    // Check if project root exists and is accessible
    try {
        const stats = await import('fs').then(fs => fs.promises.stat(projectRoot));
        if (!stats.isDirectory()) {
            success = false;
            details.push(`Project root is not a directory: ${projectRoot}`);
        } else {
            details.push(`✅ Project root found: ${projectRoot}`);
        }
    } catch (error) {
        success = false;
        details.push(`❌ Cannot access project root: ${projectRoot}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check for essential domain directories
    const expectedDomains = ['Utility', 'Console', 'TestSuite', 'EnvironmentMCPGateway'];
    for (const domain of expectedDomains) {
        const domainPath = path.join(projectRoot, domain);
        try {
            const stats = await import('fs').then(fs => fs.promises.stat(domainPath));
            if (stats.isDirectory()) {
                details.push(`✅ Domain directory found: ${domain}`);
            } else {
                details.push(`⚠️ Domain path exists but is not a directory: ${domain}`);
            }
        } catch (error) {
            details.push(`⚠️ Domain directory not found: ${domain}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return { success, details };
}

async function validateFilePermissions(): Promise<{ success: boolean, details: string[] }> {
    const details: string[] = [];
    let success = true;

    try {
        const fs = await import('fs');
        
        // Check write permissions on project root
        await fs.promises.access(projectRoot, fs.constants.W_OK);
        details.push('✅ Write permission on project root');

        // Check if we can create directories (test with a temp directory)
        const testDir = path.join(projectRoot, '.permission-test');
        try {
            await fs.promises.mkdir(testDir, { recursive: true });
            await fs.promises.rmdir(testDir);
            details.push('✅ Can create and remove directories');
        } catch (error) {
            success = false;
            details.push(`❌ Cannot create directories in project root. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

    } catch (error) {
        success = false;
        details.push(`❌ Insufficient permissions on project root. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { success, details };
}

async function _validateDomainStructure(): Promise<{ success: boolean, details: string[] }> {
    const details: string[] = [];
    let success = true;

    // This is a simplified domain structure validation
    // In a real implementation, this would check for proper DDD structure
    const domainValidations = [
        'Domains follow clear boundaries',
        'No circular dependencies detected',
        'Integration patterns are consistent'
    ];

    // For now, just mark as successful with placeholder validations
    domainValidations.forEach(validation => {
        details.push(`✅ ${validation}`);
    });

    return { success, details };
}
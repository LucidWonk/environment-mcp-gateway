/**
 * MCP Tools for Update Integration
 * Coordinates holistic context updates with cross-domain impact analysis
 * Implements TEMP-CONTEXT-ENGINE-a7b3 integration capabilities
 */
import { UpdateIntegrationOrchestrator } from '../services/update-integration.js';
import { contextEventManager } from '../events/context-events.js';
/**
 * Execute integrated update workflow tool
 */
export const executeIntegratedUpdateTool = {
    name: 'execute-integrated-update',
    description: 'Execute complete integrated update workflow with impact analysis, coordination, and holistic updates',
    inputSchema: {
        type: 'object',
        properties: {
            changedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of files that have been changed',
                minItems: 1
            },
            triggerType: {
                type: 'string',
                enum: ['git-hook', 'manual', 'scheduled'],
                description: 'Type of trigger that initiated the update',
                default: 'manual'
            },
            performanceTimeout: {
                type: 'number',
                description: 'Timeout in seconds for the entire integration process',
                default: 300,
                minimum: 30,
                maximum: 1800
            },
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project',
                default: '.'
            }
        },
        required: ['changedFiles']
    }
};
/**
 * Get integration status tool
 */
export const getIntegrationStatusTool = {
    name: 'get-integration-status',
    description: 'Get status of active or completed integrated update workflows',
    inputSchema: {
        type: 'object',
        properties: {
            integrationId: {
                type: 'string',
                description: 'Specific integration ID to get status for (optional - if not provided, returns all active integrations)'
            },
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project',
                default: '.'
            },
            includeEventHistory: {
                type: 'boolean',
                description: 'Include event history for the integration',
                default: false
            }
        }
    }
};
/**
 * Validate integration prerequisites tool
 */
export const validateIntegrationPrerequisitesTool = {
    name: 'validate-integration-prerequisites',
    description: 'Validate that all integration components are properly configured and functional',
    inputSchema: {
        type: 'object',
        properties: {
            projectRoot: {
                type: 'string',
                description: 'Root directory of the project',
                default: '.'
            },
            includeDetailedCheck: {
                type: 'boolean',
                description: 'Include detailed component validation',
                default: true
            }
        }
    }
};
/**
 * Get event statistics tool
 */
export const getEventStatisticsTool = {
    name: 'get-event-statistics',
    description: 'Get statistics about integration events and patterns',
    inputSchema: {
        type: 'object',
        properties: {
            since: {
                type: 'string',
                description: 'Get statistics since this ISO timestamp (optional)',
                format: 'date-time'
            },
            eventType: {
                type: 'string',
                description: 'Filter by specific event type (optional)'
            },
            includeEventHistory: {
                type: 'boolean',
                description: 'Include recent event history in response',
                default: false
            }
        }
    }
};
/**
 * Tool handlers for update integration
 */
export async function handleExecuteIntegratedUpdate(args) {
    const { changedFiles, triggerType = 'manual', performanceTimeout = 300, projectRoot = '.' } = args;
    try {
        const orchestrator = new UpdateIntegrationOrchestrator(projectRoot);
        const result = await orchestrator.executeIntegratedUpdate({
            changedFiles,
            triggerType,
            performanceTimeout,
            projectRoot
        });
        return {
            success: result.success,
            integrationId: result.integrationId,
            executionSummary: {
                affectedDomains: result.affectedDomains,
                totalTime: result.executionMetrics.totalTime,
                impactAnalysisTime: result.executionMetrics.impactAnalysisTime,
                coordinationTime: result.executionMetrics.coordinationTime,
                holisticUpdateTime: result.executionMetrics.holisticUpdateTime
            },
            phases: {
                impactAnalysis: {
                    success: result.impactAnalysisResult?.success || false,
                    affectedDomains: result.affectedDomains.length,
                    time: result.executionMetrics.impactAnalysisTime
                },
                coordination: {
                    success: result.coordinationResult?.success || false,
                    planId: result.coordinationResult?.coordination?.planId,
                    time: result.executionMetrics.coordinationTime
                },
                holisticUpdate: {
                    success: result.holisticUpdateResult?.success || false,
                    time: result.executionMetrics.holisticUpdateTime
                }
            },
            errors: result.errors,
            warnings: result.warnings,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}
export async function handleGetIntegrationStatus(args) {
    const { integrationId, projectRoot = '.', includeEventHistory = false } = args;
    try {
        const orchestrator = new UpdateIntegrationOrchestrator(projectRoot);
        if (integrationId) {
            // Get specific integration status
            const result = orchestrator.getIntegrationResult(integrationId);
            if (!result) {
                return {
                    success: false,
                    error: `Integration ${integrationId} not found`,
                    timestamp: new Date().toISOString()
                };
            }
            let eventHistory = undefined;
            if (includeEventHistory) {
                eventHistory = contextEventManager.getEventHistory({
                    integrationId
                });
            }
            return {
                success: true,
                integration: {
                    integrationId: result.integrationId,
                    success: result.success,
                    affectedDomains: result.affectedDomains,
                    executionMetrics: result.executionMetrics,
                    errors: result.errors,
                    warnings: result.warnings
                },
                eventHistory,
                timestamp: new Date().toISOString()
            };
        }
        else {
            // Get all active integrations
            const activeIntegrations = orchestrator.getActiveIntegrations();
            return {
                success: true,
                activeIntegrations: {
                    count: activeIntegrations.length,
                    integrationIds: activeIntegrations,
                    hasActiveIntegrations: activeIntegrations.length > 0
                },
                timestamp: new Date().toISOString()
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}
export async function handleValidateIntegrationPrerequisites(args) {
    const { projectRoot = '.', includeDetailedCheck: _includeDetailedCheck = true } = args;
    try {
        const orchestrator = new UpdateIntegrationOrchestrator(projectRoot);
        const validation = await orchestrator.validatePrerequisites();
        return {
            success: true,
            validation: {
                valid: validation.valid,
                issues: validation.issues,
                totalIssues: validation.issues.length,
                status: validation.valid ? 'READY' : 'ISSUES_FOUND'
            },
            prerequisites: {
                impactMapper: validation.issues.some(i => i.includes('Impact mapper')) ? 'FAILED' : 'OK',
                crossDomainCoordinator: validation.issues.some(i => i.includes('coordinator')) ? 'FAILED' : 'OK',
                holisticOrchestrator: validation.issues.some(i => i.includes('orchestrator')) ? 'FAILED' : 'OK'
            },
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}
export async function handleGetEventStatistics(args) {
    const { since, eventType, includeEventHistory = false } = args;
    try {
        const sinceDate = since ? new Date(since) : undefined;
        const statistics = contextEventManager.getEventStatistics(sinceDate);
        let filteredEvents = undefined;
        if (includeEventHistory) {
            filteredEvents = contextEventManager.getEventHistory({
                eventType,
                since: sinceDate
            }).slice(-20); // Last 20 events
        }
        return {
            success: true,
            statistics: {
                totalEvents: statistics.totalEvents,
                eventsByType: Array.from(statistics.eventsByType.entries()).map(([type, count]) => ({
                    eventType: type,
                    count
                })),
                integrationStats: {
                    totalIntegrations: statistics.integrationStats.totalIntegrations,
                    successfulIntegrations: statistics.integrationStats.successfulIntegrations,
                    failedIntegrations: statistics.integrationStats.failedIntegrations,
                    successRate: statistics.integrationStats.totalIntegrations > 0
                        ? (statistics.integrationStats.successfulIntegrations / statistics.integrationStats.totalIntegrations * 100).toFixed(1)
                        : '0',
                    averageIntegrationTime: Math.round(statistics.integrationStats.averageIntegrationTime)
                },
                timeRange: {
                    from: statistics.timeRange.from,
                    to: statistics.timeRange.to
                }
            },
            recentEvents: filteredEvents,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
}
/**
 * Get all update integration tools
 */
export function getUpdateIntegrationTools() {
    return [
        executeIntegratedUpdateTool,
        getIntegrationStatusTool,
        validateIntegrationPrerequisitesTool,
        getEventStatisticsTool
    ];
}
/**
 * Get tool handlers map
 */
export function getUpdateIntegrationHandlers() {
    return new Map([
        ['execute-integrated-update', handleExecuteIntegratedUpdate],
        ['get-integration-status', handleGetIntegrationStatus],
        ['validate-integration-prerequisites', handleValidateIntegrationPrerequisites],
        ['get-event-statistics', handleGetEventStatistics]
    ]);
}
//# sourceMappingURL=update-integration.js.map
/**
 * Registry Lifecycle MCP Tools
 * MCP tools for registry management, placeholder tracking, and validation
 * Implements TEMP-CONTEXT-ENGINE-a7b3 registry lifecycle capability
 */
import { RegistryManager } from '../services/registry-manager.js';
import { PlaceholderTracker } from '../services/placeholder-tracker.js';
import { RegistryValidator } from '../services/registry-validator.js';
import { contextEventManager } from '../events/context-events.js';
import path from 'path';
// Initialize services
const projectRoot = process.cwd();
const registryManager = new RegistryManager(path.join(projectRoot, 'capability-registry.json'));
const placeholderTracker = new PlaceholderTracker(path.join(projectRoot, 'placeholder-tracker.json'));
const registryValidator = new RegistryValidator(registryManager, placeholderTracker);
/**
 * Generate new placeholder ID
 */
export const generatePlaceholderID = {
    name: 'generate-placeholder-id',
    description: 'Generate a new placeholder ID following TEMP-[DOMAIN]-[NAME]-[SUFFIX] format',
    inputSchema: {
        type: 'object',
        properties: {
            domain: {
                type: 'string',
                description: 'Domain name (e.g., Analysis, Data, Messaging)'
            },
            name: {
                type: 'string',
                description: 'Capability name (e.g., Fractal, Inflection, Context)'
            },
            sourceDocument: {
                type: 'string',
                description: 'Source document path where this placeholder is used'
            },
            businessConcepts: {
                type: 'array',
                items: { type: 'string' },
                description: 'Business concepts associated with this capability'
            },
            integrationPoints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Integration points or dependencies'
            }
        },
        required: ['domain', 'name', 'sourceDocument']
    }
};
export async function handleGeneratePlaceholderID(args) {
    try {
        const { domain, name, sourceDocument, businessConcepts = [], integrationPoints = [] } = args;
        await contextEventManager.emit('PlaceholderIDGenerationStarted', {
            domain,
            name,
            sourceDocument
        });
        const placeholderId = await placeholderTracker.generatePlaceholderID({
            domain,
            name,
            sourceDocument,
            businessConcepts,
            integrationPoints
        });
        // Register with registry manager
        await registryManager.registerPlaceholderCapability({
            placeholderId,
            name,
            description: `Placeholder capability for ${name} in ${domain} domain`,
            discoveredDomain: domain,
            sourceDocument,
            businessConcepts,
            integrationPoints,
            maturityLevel: 'exploring',
            confidence: 0.5
        });
        await contextEventManager.emit('PlaceholderIDGenerated', {
            placeholderId,
            domain,
            name,
            sourceDocument
        });
        return {
            success: true,
            placeholderId,
            format: `TEMP-${domain.toUpperCase()}-${name.toUpperCase()}-XXXX`,
            lifecycle: 'concept-exploration',
            recommendations: [
                'Use this placeholder ID in your concept documents',
                'Update maturity level as implementation progresses',
                'Convert to final capability ID when implementation is complete'
            ]
        };
    }
    catch (error) {
        await contextEventManager.emit('PlaceholderIDGenerationFailed', {
            domain: args.domain,
            name: args.name,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            domain: args.domain,
            name: args.name
        };
    }
}
/**
 * Track placeholder lifecycle transition
 */
export const transitionPlaceholderLifecycle = {
    name: 'transition-placeholder-lifecycle',
    description: 'Transition placeholder ID to next lifecycle stage',
    inputSchema: {
        type: 'object',
        properties: {
            placeholderId: {
                type: 'string',
                description: 'Placeholder ID to transition'
            },
            newStage: {
                type: 'string',
                enum: [
                    'concept-exploration',
                    'domain-discovery',
                    'implementation-active',
                    'ready-for-conversion',
                    'conversion-pending',
                    'conversion-approved',
                    'converted',
                    'abandoned',
                    'deprecated'
                ],
                description: 'New lifecycle stage'
            },
            reason: {
                type: 'string',
                description: 'Reason for the transition'
            },
            triggeredBy: {
                type: 'string',
                enum: ['system', 'user', 'migration', 'approval'],
                default: 'system',
                description: 'What triggered this transition'
            },
            maturityIndicators: {
                type: 'array',
                items: { type: 'string' },
                description: 'Maturity indicators (required for ready-for-conversion stage)'
            }
        },
        required: ['placeholderId', 'newStage', 'reason']
    }
};
export async function handleTransitionPlaceholderLifecycle(args) {
    try {
        const { placeholderId, newStage, reason, triggeredBy = 'system', maturityIndicators = [] } = args;
        await contextEventManager.emit('PlaceholderTransitionStarted', {
            placeholderId,
            newStage,
            reason
        });
        // Validate placeholder exists
        const placeholder = placeholderTracker.getPlaceholderInfo(placeholderId);
        if (!placeholder) {
            throw new Error(`Placeholder not found: ${placeholderId}`);
        }
        // Perform transition
        await placeholderTracker.transitionPlaceholderLifecycle(placeholderId, newStage, reason, triggeredBy, { maturityIndicators });
        // Update registry manager if transitioning to ready-for-conversion
        if (newStage === 'ready-for-conversion') {
            await registryManager.updatePlaceholderMaturity(placeholderId, 'ready-for-conversion');
        }
        await contextEventManager.emit('PlaceholderTransitioned', {
            placeholderId,
            from: placeholder.lifecycle,
            to: newStage,
            reason
        });
        return {
            success: true,
            placeholderId,
            transition: {
                from: placeholder.lifecycle,
                to: newStage,
                reason,
                triggeredBy,
                timestamp: new Date()
            },
            nextActions: getNextActions(newStage)
        };
    }
    catch (error) {
        await contextEventManager.emit('PlaceholderTransitionFailed', {
            placeholderId: args.placeholderId,
            newStage: args.newStage,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            placeholderId: args.placeholderId,
            newStage: args.newStage
        };
    }
}
/**
 * Propose capability conversion
 */
export const proposeCapabilityConversion = {
    name: 'propose-capability-conversion',
    description: 'Propose conversion of placeholder ID to final capability ID',
    inputSchema: {
        type: 'object',
        properties: {
            placeholderId: {
                type: 'string',
                description: 'Placeholder ID to convert'
            },
            finalCapabilityId: {
                type: 'string',
                description: 'Proposed final capability ID'
            },
            reason: {
                type: 'string',
                enum: ['implementation-complete', 'domain-migration', 'manual-request'],
                default: 'implementation-complete',
                description: 'Reason for conversion'
            }
        },
        required: ['placeholderId', 'finalCapabilityId']
    }
};
export async function handleProposeCapabilityConversion(args) {
    try {
        const { placeholderId, finalCapabilityId, reason = 'implementation-complete' } = args;
        await contextEventManager.emit('CapabilityConversionProposed', {
            placeholderId,
            finalCapabilityId,
            reason
        });
        const conversion = await registryManager.proposeCapabilityConversion(placeholderId, finalCapabilityId, reason);
        await contextEventManager.emit('CapabilityConversionCreated', {
            conversionId: conversion.conversionId,
            placeholderId,
            finalCapabilityId,
            approvalId: conversion.approvalId
        });
        return {
            success: true,
            conversion: {
                conversionId: conversion.conversionId,
                placeholderId: conversion.placeholderId,
                finalCapabilityId: conversion.finalCapabilityId,
                conversionStatus: conversion.conversionStatus,
                approvalRequired: conversion.approvalRequired,
                approvalId: conversion.approvalId,
                createdAt: conversion.createdAt
            },
            nextSteps: [
                'Wait for human approval of the conversion proposal',
                'Monitor approval status using get-approval-workflow-status',
                'Execute conversion once approved using execute-capability-conversion'
            ]
        };
    }
    catch (error) {
        await contextEventManager.emit('CapabilityConversionFailed', {
            placeholderId: args.placeholderId,
            finalCapabilityId: args.finalCapabilityId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            placeholderId: args.placeholderId,
            finalCapabilityId: args.finalCapabilityId
        };
    }
}
/**
 * Execute approved capability conversion
 */
export const executeCapabilityConversion = {
    name: 'execute-capability-conversion',
    description: 'Execute approved capability conversion from placeholder to final ID',
    inputSchema: {
        type: 'object',
        properties: {
            conversionId: {
                type: 'string',
                description: 'Conversion ID to execute'
            },
            approvalId: {
                type: 'string',
                description: 'Approval ID confirming human approval'
            }
        },
        required: ['conversionId', 'approvalId']
    }
};
export async function handleExecuteCapabilityConversion(args) {
    try {
        const { conversionId, approvalId } = args;
        const conversion = registryManager.getConversion(conversionId);
        if (!conversion) {
            throw new Error(`Conversion not found: ${conversionId}`);
        }
        await contextEventManager.emit('CapabilityConversionExecutionStarted', {
            conversionId,
            placeholderId: conversion.placeholderId,
            finalCapabilityId: conversion.finalCapabilityId
        });
        const result = await registryManager.executeCapabilityConversion(conversionId, approvalId);
        if (result.success) {
            // Update placeholder lifecycle
            await placeholderTracker.markAsConverted(conversion.placeholderId, result.finalCapabilityId, conversionId);
            await contextEventManager.emit('CapabilityConversionExecuted', {
                conversionId,
                placeholderId: conversion.placeholderId,
                finalCapabilityId: result.finalCapabilityId
            });
        }
        else {
            await contextEventManager.emit('CapabilityConversionExecutionFailed', {
                conversionId,
                error: result.error
            });
        }
        return {
            success: result.success,
            conversion: result.success ? {
                conversionId,
                placeholderId: conversion.placeholderId,
                finalCapabilityId: result.finalCapabilityId,
                status: 'completed',
                completedAt: new Date()
            } : undefined,
            error: result.error,
            lifecycle: result.success ? {
                placeholderStatus: 'converted',
                capabilityStatus: 'registered'
            } : undefined
        };
    }
    catch (error) {
        await contextEventManager.emit('CapabilityConversionExecutionFailed', {
            conversionId: args.conversionId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            conversionId: args.conversionId
        };
    }
}
/**
 * Validate registry consistency
 */
export const validateRegistryConsistency = {
    name: 'validate-registry-consistency',
    description: 'Perform comprehensive registry validation and consistency checks',
    inputSchema: {
        type: 'object',
        properties: {
            includeHealthScore: {
                type: 'boolean',
                description: 'Include registry health score calculation',
                default: true
            },
            checkSpecificCapability: {
                type: 'string',
                description: 'Validate specific capability ID (optional)'
            }
        }
    }
};
export async function handleValidateRegistryConsistency(args) {
    try {
        const { includeHealthScore = true, checkSpecificCapability } = args;
        await contextEventManager.emit('RegistryValidationStarted', {
            includeHealthScore,
            specificCapability: checkSpecificCapability
        });
        let validationReport;
        let healthScore;
        if (checkSpecificCapability) {
            const violations = await registryValidator.validateCapability(checkSpecificCapability);
            validationReport = {
                type: 'specific-capability',
                targetCapability: checkSpecificCapability,
                violations,
                overallStatus: violations.some(v => v.severity === 'critical') ? 'failed' :
                    violations.some(v => v.severity === 'warning') ? 'warnings' : 'passed'
            };
        }
        else {
            validationReport = await registryValidator.validateRegistry();
            if (includeHealthScore) {
                healthScore = registryValidator.calculateHealthScore(validationReport);
            }
        }
        await contextEventManager.emit('RegistryValidationCompleted', {
            overallStatus: validationReport.overallStatus,
            violationCount: Array.isArray(validationReport.violations) ? validationReport.violations.length : 0,
            healthScore: healthScore?.score
        });
        return {
            success: true,
            validation: {
                reportId: validationReport.reportId || 'specific-capability-check',
                status: validationReport.overallStatus,
                validationDate: validationReport.validationDate || new Date(),
                summary: validationReport.summary || {
                    violations: Array.isArray(validationReport.violations) ? validationReport.violations.length : 0
                },
                violations: validationReport.violations,
                recommendations: validationReport.recommendations || []
            },
            healthScore: healthScore ? {
                score: healthScore.score,
                grade: healthScore.grade,
                factors: healthScore.factors
            } : undefined
        };
    }
    catch (error) {
        await contextEventManager.emit('RegistryValidationFailed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Get registry statistics
 */
export const getRegistryStatistics = {
    name: 'get-registry-statistics',
    description: 'Get comprehensive statistics about registry and placeholder lifecycle',
    inputSchema: {
        type: 'object',
        properties: {
            includeLifecycleStats: {
                type: 'boolean',
                description: 'Include placeholder lifecycle statistics',
                default: true
            },
            domain: {
                type: 'string',
                description: 'Filter statistics by specific domain (optional)'
            }
        }
    }
};
export async function handleGetRegistryStatistics(args) {
    try {
        const { includeLifecycleStats = true, domain } = args;
        const registryStats = registryManager.getRegistryStatistics();
        const lifecycleStats = includeLifecycleStats ? placeholderTracker.getLifecycleStatistics() : undefined;
        // Filter by domain if specified
        let filteredStats = registryStats;
        if (domain) {
            const domainCapabilities = registryManager.getCapabilitiesByDomain(domain);
            const domainPlaceholders = placeholderTracker.getPlaceholdersByDomain(domain);
            filteredStats = {
                ...registryStats,
                totalCapabilities: domainCapabilities.length,
                totalPlaceholders: domainPlaceholders.length
            };
        }
        return {
            success: true,
            statistics: {
                registry: {
                    totalCapabilities: filteredStats.totalCapabilities,
                    capabilitiesByDomain: Object.fromEntries(filteredStats.capabilitiesByDomain),
                    capabilitiesByStatus: Object.fromEntries(filteredStats.capabilitiesByStatus)
                },
                placeholders: {
                    totalPlaceholders: filteredStats.totalPlaceholders,
                    placeholdersByMaturity: Object.fromEntries(filteredStats.placeholdersByMaturity),
                    activeConversions: filteredStats.activeConversions,
                    conversionsByStatus: Object.fromEntries(filteredStats.conversionsByStatus)
                },
                lifecycle: lifecycleStats ? {
                    conversionRate: lifecycleStats.conversionRate,
                    averageLifecycleDuration: lifecycleStats.averageLifecycleDuration,
                    recentTransitions: lifecycleStats.recentTransitions.slice(0, 10) // Last 10
                } : undefined
            },
            filter: domain ? { domain } : null,
            generatedAt: new Date()
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Get placeholder information
 */
export const getPlaceholderInfo = {
    name: 'get-placeholder-info',
    description: 'Get detailed information about a specific placeholder ID',
    inputSchema: {
        type: 'object',
        properties: {
            placeholderId: {
                type: 'string',
                description: 'Placeholder ID to get information for'
            }
        },
        required: ['placeholderId']
    }
};
export async function handleGetPlaceholderInfo(args) {
    try {
        const { placeholderId } = args;
        const placeholderInfo = placeholderTracker.getPlaceholderInfo(placeholderId);
        const registryPlaceholder = registryManager.getPlaceholderCapability(placeholderId);
        const validation = placeholderTracker.validatePlaceholderID(placeholderId);
        if (!placeholderInfo) {
            return {
                success: false,
                error: 'Placeholder not found',
                placeholderId
            };
        }
        return {
            success: true,
            placeholder: {
                id: placeholderInfo.placeholderId,
                domain: placeholderInfo.domain,
                name: placeholderInfo.name,
                sourceDocument: placeholderInfo.sourceDocument,
                lifecycle: placeholderInfo.lifecycle,
                createdAt: placeholderInfo.createdAt,
                lastUpdated: placeholderInfo.lastUpdated,
                transitions: placeholderInfo.transitions,
                metadata: placeholderInfo.metadata
            },
            registry: registryPlaceholder ? {
                maturityLevel: registryPlaceholder.maturityLevel,
                confidence: registryPlaceholder.confidence,
                businessConcepts: registryPlaceholder.businessConcepts,
                integrationPoints: registryPlaceholder.integrationPoints
            } : null,
            validation: {
                isValid: validation.isValid,
                issues: validation.issues,
                suggestions: validation.suggestions
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            placeholderId: args.placeholderId
        };
    }
}
// Helper function to provide next actions based on lifecycle stage
function getNextActions(stage) {
    switch (stage) {
        case 'concept-exploration':
            return [
                'Define business concepts and requirements',
                'Identify integration points',
                'Progress to domain-discovery when boundaries are clearer'
            ];
        case 'domain-discovery':
            return [
                'Analyze domain boundaries and relationships',
                'Identify cross-domain dependencies',
                'Transition to implementation-active when ready to implement'
            ];
        case 'implementation-active':
            return [
                'Implement the capability functionality',
                'Create tests and validation',
                'Mark as ready-for-conversion when implementation is complete'
            ];
        case 'ready-for-conversion':
            return [
                'Create conversion proposal with final capability ID',
                'Submit for human approval',
                'Execute conversion once approved'
            ];
        case 'conversion-pending':
            return [
                'Wait for human approval',
                'Monitor approval status',
                'Execute conversion once approved'
            ];
        case 'converted':
            return [
                'Placeholder lifecycle complete',
                'Use final capability ID in all references',
                'Archive original placeholder documentation'
            ];
        default:
            return ['No further actions required'];
    }
}
// Export all tools and handlers
export const registryLifecycleTools = {
    'generate-placeholder-id': generatePlaceholderID,
    'transition-placeholder-lifecycle': transitionPlaceholderLifecycle,
    'propose-capability-conversion': proposeCapabilityConversion,
    'execute-capability-conversion': executeCapabilityConversion,
    'validate-registry-consistency': validateRegistryConsistency,
    'get-registry-statistics': getRegistryStatistics,
    'get-placeholder-info': getPlaceholderInfo
};
export const registryLifecycleHandlers = {
    'generate-placeholder-id': handleGeneratePlaceholderID,
    'transition-placeholder-lifecycle': handleTransitionPlaceholderLifecycle,
    'propose-capability-conversion': handleProposeCapabilityConversion,
    'execute-capability-conversion': handleExecuteCapabilityConversion,
    'validate-registry-consistency': handleValidateRegistryConsistency,
    'get-registry-statistics': handleGetRegistryStatistics,
    'get-placeholder-info': handleGetPlaceholderInfo
};
//# sourceMappingURL=registry-lifecycle.js.map
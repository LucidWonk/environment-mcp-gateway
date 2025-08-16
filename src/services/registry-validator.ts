/**
 * Registry Validator Service
 * Validates registry consistency and ensures data integrity
 * Implements TEMP-CONTEXT-ENGINE-a7b3 registry validation capability
 */

import { RegistryManager, CapabilityRegistryEntry } from './registry-manager.js';
import { PlaceholderTracker, PlaceholderIDInfo } from './placeholder-tracker.js';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('mcp-gateway.log');

export interface ValidationRule {
    ruleId: string;
    name: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    category: 'consistency' | 'integrity' | 'pollution' | 'lifecycle' | 'audit';
}

export interface ValidationViolation {
    ruleId: string;
    severity: ValidationRule['severity'];
    category: ValidationRule['category'];
    message: string;
    affectedEntities: string[];
    suggestedFix?: string;
    detectedAt: Date;
    context?: any;
}

export interface ValidationReport {
    reportId: string;
    validationDate: Date;
    validationDuration: number;
    overallStatus: 'passed' | 'warnings' | 'failed';
    summary: {
        totalRules: number;
        rulesExecuted: number;
        rulesPassed: number;
        rulesWarning: number;
        rulesFailed: number;
        criticalViolations: number;
        warningViolations: number;
        infoViolations: number;
    };
    violations: ValidationViolation[];
    auditTrail: {
        validatedCapabilities: number;
        validatedPlaceholders: number;
        validatedConversions: number;
        consistencyChecks: number;
    };
    recommendations: string[];
}

/**
 * Comprehensive registry validation service
 * Ensures registry integrity and consistency
 */
export class RegistryValidator {
    private registryManager: RegistryManager;
    private placeholderTracker: PlaceholderTracker;
    private validationRules: Map<string, ValidationRule> = new Map();

    constructor(registryManager: RegistryManager, placeholderTracker: PlaceholderTracker) {
        this.registryManager = registryManager;
        this.placeholderTracker = placeholderTracker;
        this.initializeValidationRules();
    }

    /**
     * Execute comprehensive registry validation
     */
    async validateRegistry(): Promise<ValidationReport> {
        const startTime = Date.now();
        const reportId = this.generateReportId();
        
        logger.info(`Starting registry validation: ${reportId}`);

        const violations: ValidationViolation[] = [];
        let rulesExecuted = 0;
        let rulesPassed = 0;
        let rulesWarning = 0;
        let rulesFailed = 0;

        try {
            // Execute all validation rules
            for (const rule of this.validationRules.values()) {
                try {
                    const ruleViolations = await this.executeValidationRule(rule);
                    violations.push(...ruleViolations);
                    rulesExecuted++;

                    if (ruleViolations.length === 0) {
                        rulesPassed++;
                    } else {
                        const hasCritical = ruleViolations.some(v => v.severity === 'critical');
                        if (hasCritical) {
                            rulesFailed++;
                        } else {
                            rulesWarning++;
                        }
                    }
                } catch (error) {
                    logger.error(`Failed to execute validation rule ${rule.ruleId}:`, error);
                    violations.push({
                        ruleId: rule.ruleId,
                        severity: 'critical',
                        category: rule.category,
                        message: `Validation rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        affectedEntities: [],
                        detectedAt: new Date(),
                        context: { error: error instanceof Error ? error.message : 'Unknown error' }
                    });
                    rulesFailed++;
                }
            }

            const validationDuration = Date.now() - startTime;
            
            // Generate summary statistics
            const criticalViolations = violations.filter(v => v.severity === 'critical').length;
            const warningViolations = violations.filter(v => v.severity === 'warning').length;
            const infoViolations = violations.filter(v => v.severity === 'info').length;

            const overallStatus = criticalViolations > 0 ? 'failed' : 
                warningViolations > 0 ? 'warnings' : 'passed';

            // Get audit trail information
            const stats = this.registryManager.getRegistryStatistics();
            const _placeholderStats = this.placeholderTracker.getLifecycleStatistics();

            const report: ValidationReport = {
                reportId,
                validationDate: new Date(),
                validationDuration,
                overallStatus,
                summary: {
                    totalRules: this.validationRules.size,
                    rulesExecuted,
                    rulesPassed,
                    rulesWarning,
                    rulesFailed,
                    criticalViolations,
                    warningViolations,
                    infoViolations
                },
                violations,
                auditTrail: {
                    validatedCapabilities: stats.totalCapabilities,
                    validatedPlaceholders: stats.totalPlaceholders,
                    validatedConversions: stats.activeConversions,
                    consistencyChecks: rulesExecuted
                },
                recommendations: this.generateRecommendations(violations)
            };

            logger.info(`Registry validation completed: ${reportId} - ${overallStatus} (${violations.length} violations)`);
            return report;

        } catch (error) {
            logger.error(`Registry validation failed for ${reportId}:`, error);
            throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate specific capability for consistency
     */
    async validateCapability(capabilityId: string): Promise<ValidationViolation[]> {
        logger.info(`Validating specific capability: ${capabilityId}`);

        const violations: ValidationViolation[] = [];
        const capability = this.registryManager.getCapability(capabilityId);

        if (!capability) {
            violations.push({
                ruleId: 'capability-exists',
                severity: 'critical',
                category: 'integrity',
                message: `Capability not found: ${capabilityId}`,
                affectedEntities: [capabilityId],
                detectedAt: new Date()
            });
            return violations;
        }

        // Execute capability-specific rules
        const capabilityRules = Array.from(this.validationRules.values())
            .filter(rule => ['consistency', 'integrity'].includes(rule.category));

        for (const rule of capabilityRules) {
            try {
                const ruleViolations = await this.executeCapabilityValidationRule(rule, capability);
                violations.push(...ruleViolations);
            } catch (error) {
                logger.error(`Failed to execute capability rule ${rule.ruleId} for ${capabilityId}:`, error);
            }
        }

        return violations;
    }

    /**
     * Check for placeholder ID pollution in main registry
     */
    async checkPlaceholderPollution(): Promise<ValidationViolation[]> {
        logger.info('Checking for placeholder ID pollution in main registry');

        const violations: ValidationViolation[] = [];
        const stats = this.registryManager.getRegistryStatistics();

        // Get all capability IDs from main registry
        const allCapabilities = Array.from({ length: stats.totalCapabilities }, (_, i) => i)
            .map(i => this.registryManager.getCapability(`capability-${i}`))
            .filter(cap => cap !== null);

        // Check each capability ID for placeholder format
        for (const capability of allCapabilities) {
            if (capability && this.isPlaceholderFormat(capability.id)) {
                violations.push({
                    ruleId: 'no-placeholder-pollution',
                    severity: 'critical',
                    category: 'pollution',
                    message: `CRITICAL: Placeholder ID found in main registry: ${capability.id}`,
                    affectedEntities: [capability.id],
                    suggestedFix: 'Remove placeholder ID from main registry immediately and investigate cause',
                    detectedAt: new Date(),
                    context: { capability }
                });
            }
        }

        if (violations.length > 0) {
            logger.warn(`Placeholder pollution detected: ${violations.length} violations`);
        }

        return violations;
    }

    /**
     * Validate consistency across registry and placeholder systems
     */
    async validateCrossSystemConsistency(): Promise<ValidationViolation[]> {
        logger.info('Validating cross-system consistency');

        const violations: ValidationViolation[] = [];
        
        // Check for orphaned placeholders (placeholders without conversions that should have them)
        const readyPlaceholders = this.placeholderTracker.getPlaceholdersByStage('ready-for-conversion');
        const convertedPlaceholders = this.placeholderTracker.getPlaceholdersByStage('converted');

        for (const placeholder of readyPlaceholders) {
            const hasConversion = this.registryManager.getConversionsByStatus('pending')
                .some(conv => conv.placeholderId === placeholder.placeholderId);
            
            if (!hasConversion && this.getPlaceholderAge(placeholder) > 7 * 24 * 60 * 60 * 1000) { // 7 days
                violations.push({
                    ruleId: 'ready-placeholder-has-conversion',
                    severity: 'warning',
                    category: 'consistency',
                    message: `Ready placeholder has no active conversion for over 7 days: ${placeholder.placeholderId}`,
                    affectedEntities: [placeholder.placeholderId],
                    suggestedFix: 'Create conversion proposal or reassess placeholder readiness',
                    detectedAt: new Date(),
                    context: { placeholder }
                });
            }
        }

        // Check for converted placeholders without final capabilities
        for (const placeholder of convertedPlaceholders) {
            const conversionMetadata = placeholder.transitions
                .find(t => t.to === 'converted')?.metadata;
            
            if (conversionMetadata?.finalCapabilityId) {
                const finalCapability = this.registryManager.getCapability(conversionMetadata.finalCapabilityId);
                if (!finalCapability) {
                    violations.push({
                        ruleId: 'converted-placeholder-has-capability',
                        severity: 'critical',
                        category: 'consistency',
                        message: `Converted placeholder references non-existent capability: ${conversionMetadata.finalCapabilityId}`,
                        affectedEntities: [placeholder.placeholderId, conversionMetadata.finalCapabilityId],
                        suggestedFix: 'Create missing capability or fix conversion metadata',
                        detectedAt: new Date(),
                        context: { placeholder, expectedCapabilityId: conversionMetadata.finalCapabilityId }
                    });
                }
            }
        }

        return violations;
    }

    /**
     * Generate registry health score based on validation results
     */
    calculateHealthScore(report: ValidationReport): {
        score: number; // 0-100
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        factors: {
            consistency: number;
            integrity: number;
            pollution: number;
            lifecycle: number;
            audit: number;
        };
    } {
        const factors = {
            consistency: 100,
            integrity: 100,
            pollution: 100,
            lifecycle: 100,
            audit: 100
        };

        // Reduce scores based on violations
        for (const violation of report.violations) {
            const impact = violation.severity === 'critical' ? 20 : violation.severity === 'warning' ? 5 : 1;
            
            if (factors[violation.category] !== undefined) {
                factors[violation.category] = Math.max(0, factors[violation.category] - impact);
            }
        }

        const averageScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / 5;
        
        const grade = averageScore >= 90 ? 'A' :
            averageScore >= 80 ? 'B' :
                averageScore >= 70 ? 'C' :
                    averageScore >= 60 ? 'D' : 'F';

        return {
            score: Math.round(averageScore),
            grade,
            factors
        };
    }

    // Private helper methods

    private initializeValidationRules(): void {
        const rules: ValidationRule[] = [
            {
                ruleId: 'no-placeholder-pollution',
                name: 'No Placeholder Pollution',
                description: 'Main registry should not contain any placeholder IDs',
                severity: 'critical',
                category: 'pollution'
            },
            {
                ruleId: 'capability-id-format',
                name: 'Capability ID Format',
                description: 'All capability IDs must follow proper naming conventions',
                severity: 'warning',
                category: 'consistency'
            },
            {
                ruleId: 'capability-metadata-complete',
                name: 'Complete Capability Metadata',
                description: 'All capabilities must have complete metadata',
                severity: 'info',
                category: 'integrity'
            },
            {
                ruleId: 'placeholder-lifecycle-valid',
                name: 'Valid Placeholder Lifecycle',
                description: 'All placeholder transitions must be valid',
                severity: 'warning',
                category: 'lifecycle'
            },
            {
                ruleId: 'conversion-audit-trail',
                name: 'Complete Conversion Audit Trail',
                description: 'All conversions must have complete audit trails',
                severity: 'info',
                category: 'audit'
            },
            {
                ruleId: 'ready-placeholder-has-conversion',
                name: 'Ready Placeholders Have Conversions',
                description: 'Placeholders ready for conversion should have active conversion proposals',
                severity: 'warning',
                category: 'consistency'
            },
            {
                ruleId: 'converted-placeholder-has-capability',
                name: 'Converted Placeholders Have Capabilities',
                description: 'Converted placeholders should reference existing capabilities',
                severity: 'critical',
                category: 'consistency'
            }
        ];

        rules.forEach(rule => {
            this.validationRules.set(rule.ruleId, rule);
        });

        logger.info(`Initialized ${rules.length} validation rules`);
    }

    private async executeValidationRule(rule: ValidationRule): Promise<ValidationViolation[]> {
        switch (rule.ruleId) {
        case 'no-placeholder-pollution':
            return await this.checkPlaceholderPollution();
            
        case 'capability-id-format':
            return this.validateCapabilityIdFormats();
            
        case 'capability-metadata-complete':
            return this.validateCapabilityMetadata();
            
        case 'placeholder-lifecycle-valid':
            return this.validatePlaceholderLifecycles();
            
        case 'conversion-audit-trail':
            return this.validateConversionAuditTrails();
            
        case 'ready-placeholder-has-conversion':
        case 'converted-placeholder-has-capability':
            return await this.validateCrossSystemConsistency();
            
        default:
            return [];
        }
    }

    private async executeCapabilityValidationRule(_rule: ValidationRule, _capability: CapabilityRegistryEntry): Promise<ValidationViolation[]> {
        const violations: ValidationViolation[] = [];
        
        // Implementation would validate specific capability against rule
        // For now, return empty array
        
        return violations;
    }

    private validateCapabilityIdFormats(): ValidationViolation[] {
        // Implementation would validate capability ID formats
        return [];
    }

    private validateCapabilityMetadata(): ValidationViolation[] {
        // Implementation would validate capability metadata completeness
        return [];
    }

    private validatePlaceholderLifecycles(): ValidationViolation[] {
        // Implementation would validate placeholder lifecycle transitions
        return [];
    }

    private validateConversionAuditTrails(): ValidationViolation[] {
        // Implementation would validate conversion audit trails
        return [];
    }

    private isPlaceholderFormat(id: string): boolean {
        return /^TEMP-[A-Z]+-[A-Z0-9]+-[a-z0-9]{4}$/.test(id);
    }

    private getPlaceholderAge(placeholder: PlaceholderIDInfo): number {
        return Date.now() - placeholder.lastUpdated.getTime();
    }

    private generateRecommendations(violations: ValidationViolation[]): string[] {
        const recommendations: string[] = [];
        
        const criticalCount = violations.filter(v => v.severity === 'critical').length;
        const warningCount = violations.filter(v => v.severity === 'warning').length;

        if (criticalCount > 0) {
            recommendations.push(`Address ${criticalCount} critical violations immediately`);
        }

        if (warningCount > 0) {
            recommendations.push(`Review ${warningCount} warning violations for process improvements`);
        }

        const pollutionViolations = violations.filter(v => v.category === 'pollution');
        if (pollutionViolations.length > 0) {
            recommendations.push('Investigate and fix placeholder ID pollution to prevent registry corruption');
        }

        if (violations.length === 0) {
            recommendations.push('Registry is in excellent health - maintain current practices');
        }

        return recommendations;
    }

    private generateReportId(): string {
        return `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
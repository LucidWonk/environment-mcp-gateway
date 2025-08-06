/**
 * Registry Validator Service
 * Validates registry consistency and ensures data integrity
 * Implements TEMP-CONTEXT-ENGINE-a7b3 registry validation capability
 */
import { RegistryManager } from './registry-manager.js';
import { PlaceholderTracker } from './placeholder-tracker.js';
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
export declare class RegistryValidator {
    private registryManager;
    private placeholderTracker;
    private validationRules;
    constructor(registryManager: RegistryManager, placeholderTracker: PlaceholderTracker);
    /**
     * Execute comprehensive registry validation
     */
    validateRegistry(): Promise<ValidationReport>;
    /**
     * Validate specific capability for consistency
     */
    validateCapability(capabilityId: string): Promise<ValidationViolation[]>;
    /**
     * Check for placeholder ID pollution in main registry
     */
    checkPlaceholderPollution(): Promise<ValidationViolation[]>;
    /**
     * Validate consistency across registry and placeholder systems
     */
    validateCrossSystemConsistency(): Promise<ValidationViolation[]>;
    /**
     * Generate registry health score based on validation results
     */
    calculateHealthScore(report: ValidationReport): {
        score: number;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        factors: {
            consistency: number;
            integrity: number;
            pollution: number;
            lifecycle: number;
            audit: number;
        };
    };
    private initializeValidationRules;
    private executeValidationRule;
    private executeCapabilityValidationRule;
    private validateCapabilityIdFormats;
    private validateCapabilityMetadata;
    private validatePlaceholderLifecycles;
    private validateConversionAuditTrails;
    private isPlaceholderFormat;
    private getPlaceholderAge;
    private generateRecommendations;
    private generateReportId;
}
//# sourceMappingURL=registry-validator.d.ts.map
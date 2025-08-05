/**
 * Context Templates Service
 * Provides templates for generating enhanced .context files
 * Part of Context Engineering Enhancement system (TEMP-CONTEXT-ENGINE-a7b3)
 */
export interface ContextTemplate {
    name: string;
    description: string;
    template: string;
    variables: string[];
}
export declare class ContextTemplates {
    /**
     * Domain overview template for .context files
     * Business Rule: Must include business concepts, domain analysis, and confidence metrics
     */
    static getDomainOverviewTemplate(): ContextTemplate;
    /**
     * Current implementation template
     * Business Rule: Must reflect actual code state and recent changes
     */
    static getCurrentImplementationTemplate(): ContextTemplate;
    /**
     * Business rules template
     * Business Rule: Must include all extracted business rules with confidence levels
     */
    static getBusinessRulesTemplate(): ContextTemplate;
    /**
     * Integration points template
     * Business Rule: Must document cross-domain dependencies and interfaces
     */
    static getIntegrationPointsTemplate(): ContextTemplate;
    /**
     * Recent changes template
     * Business Rule: Must track all changes with impact analysis
     */
    static getRecentChangesTemplate(): ContextTemplate;
    /**
     * Get all available context templates
     */
    static getAllTemplates(): ContextTemplate[];
    /**
     * Get template by name
     */
    static getTemplate(name: string): ContextTemplate | undefined;
    /**
     * Simple template renderer (basic mustache-like syntax)
     * Business Rule: Template rendering must handle missing variables gracefully
     */
    static renderTemplate(template: string, data: Record<string, any>): string;
    /**
     * Validate template data against template requirements
     */
    static validateTemplateData(templateName: string, data: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=context-templates.d.ts.map
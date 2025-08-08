/**
 * Context Templates Service - Simplified Working Version
 * Provides templates for generating enhanced .context files
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
     */
    static getDomainOverviewTemplate(): ContextTemplate;
    /**
     * Current implementation template
     */
    static getCurrentImplementationTemplate(): ContextTemplate;
    /**
     * Business rules template
     */
    static getBusinessRulesTemplate(): ContextTemplate;
    /**
     * Integration points template
     */
    static getIntegrationPointsTemplate(): ContextTemplate;
    /**
     * Recent changes template
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
     * Simple template renderer
     */
    static renderTemplate(template: string, variables: Record<string, any>): string;
}
//# sourceMappingURL=context-templates.d.ts.map
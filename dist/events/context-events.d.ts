/**
 * Context Events System
 * Manages event coordination for context engineering operations
 * Implements TEMP-CONTEXT-ENGINE-a7b3 event coordination capability
 */
export type ContextEventType = 'IntegrationPhaseStarted' | 'CrossDomainImpactDetected' | 'MultiDomainUpdateTriggered' | 'IntegratedUpdateCompleted' | 'IntegratedUpdateFailed' | 'IntegrationRollbackStarted' | 'IntegrationRollbackCompleted' | 'IntegrationRollbackFailed' | 'SemanticAnalysisStarted' | 'SemanticAnalysisCompleted' | 'SemanticAnalysisFailed' | 'HolisticUpdateStarted' | 'HolisticUpdateCompleted' | 'HolisticUpdateFailed' | 'ContextFileGenerated' | 'ContextFileUpdated' | 'CoordinationPlanCreated' | 'CoordinationPhaseStarted' | 'CoordinationPhaseCompleted' | 'CoordinationFailed' | 'DomainBoundaryDetected' | 'DomainImpactAnalyzed' | 'DomainContextUpdated' | 'DocumentAnalysisStarted' | 'DocumentAnalysisCompleted' | 'DocumentAnalysisFailed' | 'MigrationProposalStarted' | 'MigrationProposalGenerated' | 'MigrationProposalFailed' | 'MigrationExecutionStarted' | 'MigrationExecutionCompleted' | 'MigrationExecutionFailed' | 'ApprovalRequested' | 'ApprovalResponseSubmitted' | 'PlaceholderIDGenerationStarted' | 'PlaceholderIDGenerated' | 'PlaceholderIDGenerationFailed' | 'PlaceholderTransitionStarted' | 'PlaceholderTransitioned' | 'PlaceholderTransitionFailed' | 'CapabilityConversionProposed' | 'CapabilityConversionCreated' | 'CapabilityConversionFailed' | 'CapabilityConversionExecutionStarted' | 'CapabilityConversionExecuted' | 'CapabilityConversionExecutionFailed' | 'RegistryValidationStarted' | 'RegistryValidationCompleted' | 'RegistryValidationFailed';
export interface ContextEvent {
    type: ContextEventType;
    timestamp: Date;
    integrationId?: string;
    planId?: string;
    data: any;
}
export interface EventHandler {
    (event: ContextEvent): Promise<void> | void;
}
/**
 * Event-driven coordination system for context engineering operations
 * Provides loose coupling between context update components
 */
export declare class ContextEventManager {
    private handlers;
    private eventHistory;
    private maxHistorySize;
    /**
     * Register event handler for specific event types
     */
    on(eventType: ContextEventType, handler: EventHandler): void;
    /**
     * Unregister event handler
     */
    off(eventType: ContextEventType, handler: EventHandler): void;
    /**
     * Emit event to all registered handlers
     */
    emit(eventType: ContextEventType, data: any, integrationId?: string, planId?: string): Promise<void>;
    /**
     * Get event history for analysis and debugging
     */
    getEventHistory(filter?: {
        eventType?: ContextEventType;
        integrationId?: string;
        planId?: string;
        since?: Date;
    }): ContextEvent[];
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Get statistics about event patterns
     */
    getEventStatistics(since?: Date): {
        totalEvents: number;
        eventsByType: Map<ContextEventType, number>;
        integrationStats: {
            totalIntegrations: number;
            successfulIntegrations: number;
            failedIntegrations: number;
            averageIntegrationTime: number;
        };
        timeRange: {
            from: Date | null;
            to: Date | null;
        };
    };
    /**
     * Setup default event handlers for common logging and monitoring
     */
    setupDefaultHandlers(): void;
}
/**
 * Global event manager instance for context engineering
 */
export declare const contextEventManager: ContextEventManager;
//# sourceMappingURL=context-events.d.ts.map
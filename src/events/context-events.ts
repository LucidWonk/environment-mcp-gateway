/**
 * Context Events System
 * Manages event coordination for context engineering operations
 * Implements TEMP-CONTEXT-ENGINE-a7b3 event coordination capability
 */

export type ContextEventType = 
    // Integration Events
    | 'IntegrationPhaseStarted'
    | 'CrossDomainImpactDetected' 
    | 'MultiDomainUpdateTriggered'
    | 'IntegratedUpdateCompleted'
    | 'IntegratedUpdateFailed'
    | 'IntegrationRollbackStarted'
    | 'IntegrationRollbackCompleted'
    | 'IntegrationRollbackFailed'
    // Analysis Events
    | 'SemanticAnalysisStarted'
    | 'SemanticAnalysisCompleted'
    | 'SemanticAnalysisFailed'
    // Update Events
    | 'HolisticUpdateStarted'
    | 'HolisticUpdateCompleted'
    | 'HolisticUpdateFailed'
    | 'ContextFileGenerated'
    | 'ContextFileUpdated'
    // Coordination Events
    | 'CoordinationPlanCreated'
    | 'CoordinationPhaseStarted'
    | 'CoordinationPhaseCompleted'
    | 'CoordinationFailed'
    // Domain Events
    | 'DomainBoundaryDetected'
    | 'DomainImpactAnalyzed'
    | 'DomainContextUpdated';

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
export class ContextEventManager {
    private handlers: Map<ContextEventType, EventHandler[]> = new Map();
    private eventHistory: ContextEvent[] = [];
    private maxHistorySize = 1000;

    /**
     * Register event handler for specific event types
     */
    on(eventType: ContextEventType, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }

    /**
     * Unregister event handler
     */
    off(eventType: ContextEventType, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to all registered handlers
     */
    async emit(eventType: ContextEventType, data: any, integrationId?: string, planId?: string): Promise<void> {
        const event: ContextEvent = {
            type: eventType,
            timestamp: new Date(),
            integrationId,
            planId,
            data
        };

        // Add to history
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // Notify handlers
        const handlers = this.handlers.get(eventType) || [];
        const promises = handlers.map(async (handler) => {
            try {
                await handler(event);
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
                // Don't re-throw to prevent one handler from affecting others
            }
        });

        await Promise.all(promises);
    }

    /**
     * Get event history for analysis and debugging
     */
    getEventHistory(filter?: {
        eventType?: ContextEventType;
        integrationId?: string;
        planId?: string;
        since?: Date;
    }): ContextEvent[] {
        let events = this.eventHistory;

        if (filter) {
            events = events.filter(event => {
                if (filter.eventType && event.type !== filter.eventType) {
                    return false;
                }
                if (filter.integrationId && event.integrationId !== filter.integrationId) {
                    return false;
                }
                if (filter.planId && event.planId !== filter.planId) {
                    return false;
                }
                if (filter.since && event.timestamp < filter.since) {
                    return false;
                }
                return true;
            });
        }

        return [...events]; // Return copy to prevent external modification
    }

    /**
     * Clear event history
     */
    clearHistory(): void {
        this.eventHistory = [];
    }

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
        timeRange: { from: Date | null; to: Date | null };
    } {
        let events = this.eventHistory;
        
        if (since) {
            events = events.filter(event => event.timestamp >= since);
        }

        const eventsByType = new Map<ContextEventType, number>();
        const integrationData = new Map<string, { started?: Date; completed?: Date; failed?: Date }>();

        // Process events
        for (const event of events) {
            // Count by type
            eventsByType.set(event.type, (eventsByType.get(event.type) || 0) + 1);

            // Track integration lifecycle
            if (event.integrationId) {
                if (!integrationData.has(event.integrationId)) {
                    integrationData.set(event.integrationId, {});
                }
                const integration = integrationData.get(event.integrationId)!;

                switch (event.type) {
                case 'IntegrationPhaseStarted':
                    if (!integration.started) {
                        integration.started = event.timestamp;
                    }
                    break;
                case 'IntegratedUpdateCompleted':
                    integration.completed = event.timestamp;
                    break;
                case 'IntegratedUpdateFailed':
                    integration.failed = event.timestamp;
                    break;
                }
            }
        }

        // Calculate integration statistics
        const completedIntegrations = Array.from(integrationData.values()).filter(i => i.completed);
        const failedIntegrations = Array.from(integrationData.values()).filter(i => i.failed);
        
        const avgTime = completedIntegrations.length > 0 
            ? completedIntegrations.reduce((sum, integration) => {
                const duration = integration.completed!.getTime() - integration.started!.getTime();
                return sum + duration;
            }, 0) / completedIntegrations.length
            : 0;

        return {
            totalEvents: events.length,
            eventsByType,
            integrationStats: {
                totalIntegrations: integrationData.size,
                successfulIntegrations: completedIntegrations.length,
                failedIntegrations: failedIntegrations.length,
                averageIntegrationTime: avgTime
            },
            timeRange: {
                from: events.length > 0 ? events[0].timestamp : null,
                to: events.length > 0 ? events[events.length - 1].timestamp : null
            }
        };
    }

    /**
     * Setup default event handlers for common logging and monitoring
     */
    setupDefaultHandlers(): void {
        // Log all integration events
        this.on('IntegrationPhaseStarted', (event) => {
            console.info(`Integration ${event.integrationId}: Started phase ${event.data.phase}`);
        });

        this.on('CrossDomainImpactDetected', (event) => {
            console.info(`Integration ${event.integrationId}: Cross-domain impact detected affecting ${event.data.affectedDomains.length} domains`);
        });

        this.on('MultiDomainUpdateTriggered', (event) => {
            console.info(`Integration ${event.integrationId}: Multi-domain update triggered with plan ${event.data.coordinationPlan.planId}`);
        });

        this.on('IntegratedUpdateCompleted', (event) => {
            console.info(`Integration ${event.integrationId}: Completed successfully in ${event.data.result.executionMetrics.totalTime}ms`);
        });

        this.on('IntegratedUpdateFailed', (event) => {
            console.error(`Integration ${event.integrationId}: Failed - ${event.data.error}`);
        });

        // Log rollback events
        this.on('IntegrationRollbackStarted', (event) => {
            console.warn(`Integration ${event.integrationId}: Rollback started`);
        });

        this.on('IntegrationRollbackCompleted', (event) => {
            console.info(`Integration ${event.integrationId}: Rollback completed successfully`);
        });

        this.on('IntegrationRollbackFailed', (event) => {
            console.error(`Integration ${event.integrationId}: Rollback failed - ${event.data.error}`);
        });
    }
}

/**
 * Global event manager instance for context engineering
 */
export const contextEventManager = new ContextEventManager();

// Setup default handlers
contextEventManager.setupDefaultHandlers();
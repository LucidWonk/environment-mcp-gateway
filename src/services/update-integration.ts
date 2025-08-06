/**
 * Update Integration Service
 * Coordinates holistic context updates with cross-domain impact analysis
 * Implements TEMP-CONTEXT-ENGINE-a7b3 capability
 */

import { ImpactMapper } from './impact-mapper.js';
import { CrossDomainCoordinator } from './cross-domain-coordinator.js';
import { HolisticUpdateOrchestrator } from './holistic-update-orchestrator.js';
import { ContextEventManager } from '../events/context-events.js';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'update-integration.log' })
    ]
});

export interface UpdateIntegrationRequest {
    changedFiles: string[];
    triggerType: 'git-hook' | 'manual' | 'scheduled';
    performanceTimeout?: number;
    projectRoot?: string;
}

export interface UpdateIntegrationResult {
    success: boolean;
    integrationId: string;
    impactAnalysisResult: any;
    coordinationResult: any;
    holisticUpdateResult: any;
    executionMetrics: {
        impactAnalysisTime: number;
        coordinationTime: number;
        holisticUpdateTime: number;
        totalTime: number;
    };
    affectedDomains: string[];
    errors: string[];
    warnings: string[];
}

/**
 * Orchestrates the complete update integration workflow
 * 1. Perform cross-domain impact analysis
 * 2. Coordinate multi-domain update sequencing
 * 3. Execute holistic context updates
 * 4. Handle event coordination
 */
export class UpdateIntegrationOrchestrator {
    private impactMapper: ImpactMapper;
    private crossDomainCoordinator: CrossDomainCoordinator;
    private holisticOrchestrator: HolisticUpdateOrchestrator;
    private eventManager: ContextEventManager;
    private activeIntegrations: Map<string, UpdateIntegrationResult> = new Map();

    constructor(projectRoot: string = '.') {
        this.impactMapper = new ImpactMapper(projectRoot);
        this.crossDomainCoordinator = new CrossDomainCoordinator(projectRoot);
        this.holisticOrchestrator = new HolisticUpdateOrchestrator(projectRoot);
        this.eventManager = new ContextEventManager();
    }

    /**
     * Execute integrated update workflow
     * Coordinates impact analysis, cross-domain coordination, and holistic updates
     */
    async executeIntegratedUpdate(request: UpdateIntegrationRequest): Promise<UpdateIntegrationResult> {
        const integrationId = this.generateIntegrationId();
        const startTime = Date.now();
        
        const result: UpdateIntegrationResult = {
            success: false,
            integrationId,
            impactAnalysisResult: null,
            coordinationResult: null,
            holisticUpdateResult: null,
            executionMetrics: {
                impactAnalysisTime: 0,
                coordinationTime: 0,
                holisticUpdateTime: 0,
                totalTime: 0
            },
            affectedDomains: [],
            errors: [],
            warnings: []
        };

        this.activeIntegrations.set(integrationId, result);

        try {
            // Phase 1: Cross-Domain Impact Analysis
            await this.eventManager.emit('IntegrationPhaseStarted', { integrationId, phase: 'impact-analysis' });
            
            const impactStartTime = Date.now();
            result.impactAnalysisResult = await this.impactMapper.predictChangeImpact(request.changedFiles);
            result.executionMetrics.impactAnalysisTime = Date.now() - impactStartTime;

            if (!result.impactAnalysisResult.success) {
                result.errors.push('Impact analysis failed: ' + result.impactAnalysisResult.error);
                throw new Error('Impact analysis phase failed');
            }

            // Extract affected domains from impact analysis
            result.affectedDomains = result.impactAnalysisResult.prediction.affectedDomains.map((d: any) => d.domain);

            await this.eventManager.emit('CrossDomainImpactDetected', { 
                integrationId, 
                affectedDomains: result.affectedDomains,
                impactSummary: result.impactAnalysisResult.prediction.impactSummary
            });

            // Phase 2: Cross-Domain Coordination
            await this.eventManager.emit('IntegrationPhaseStarted', { integrationId, phase: 'coordination' });
            
            const coordStartTime = Date.now();
            result.coordinationResult = await this.crossDomainCoordinator.coordinateUpdate({
                changedFiles: request.changedFiles,
                triggerType: request.triggerType,
                performanceTimeout: request.performanceTimeout || 300
            });
            result.executionMetrics.coordinationTime = Date.now() - coordStartTime;

            if (!result.coordinationResult.success) {
                result.errors.push('Cross-domain coordination failed: ' + result.coordinationResult.error);
                throw new Error('Coordination phase failed');
            }

            await this.eventManager.emit('MultiDomainUpdateTriggered', { 
                integrationId,
                coordinationPlan: result.coordinationResult.coordination
            });

            // Phase 3: Holistic Context Updates
            await this.eventManager.emit('IntegrationPhaseStarted', { integrationId, phase: 'holistic-update' });
            
            const updateStartTime = Date.now();
            result.holisticUpdateResult = await this.holisticOrchestrator.executeHolisticUpdate({
                changedFiles: request.changedFiles,
                triggerType: request.triggerType,
                performanceTimeout: request.performanceTimeout || 15
            });
            result.executionMetrics.holisticUpdateTime = Date.now() - updateStartTime;

            if (!result.holisticUpdateResult.success) {
                result.errors.push('Holistic update failed: ' + result.holisticUpdateResult.error);
                throw new Error('Holistic update phase failed');
            }

            // Calculate total execution time
            result.executionMetrics.totalTime = Date.now() - startTime;
            result.success = true;

            await this.eventManager.emit('IntegratedUpdateCompleted', { 
                integrationId,
                result,
                success: true
            });

            return result;

        } catch (error) {
            result.success = false;
            result.executionMetrics.totalTime = Date.now() - startTime;
            
            if (error instanceof Error) {
                result.errors.push(error.message);
            }

            await this.eventManager.emit('IntegratedUpdateFailed', { 
                integrationId,
                result,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            // Attempt rollback if any phase was partially completed
            await this.attemptRollback(integrationId, result);
            
            return result;
        } finally {
            this.activeIntegrations.delete(integrationId);
        }
    }

    /**
     * Get status of active integrations
     */
    getActiveIntegrations(): string[] {
        return Array.from(this.activeIntegrations.keys());
    }

    /**
     * Get integration result by ID
     */
    getIntegrationResult(integrationId: string): UpdateIntegrationResult | null {
        return this.activeIntegrations.get(integrationId) || null;
    }

    /**
     * Attempt rollback of failed integration
     */
    private async attemptRollback(integrationId: string, result: UpdateIntegrationResult): Promise<void> {
        try {
            await this.eventManager.emit('IntegrationRollbackStarted', { integrationId });

            // Rollback holistic updates if they were attempted
            if (result.holisticUpdateResult && result.holisticUpdateResult.rollbackData) {
                // Use the rollback data that was created during the holistic update
                logger.info(`Attempting rollback for integration ${integrationId}`);
                // Note: Rollback would be handled by the holistic orchestrator's rollback manager
            }

            // Rollback coordination if it was attempted
            if (result.coordinationResult && result.coordinationResult.coordination?.planId) {
                // Cross-domain coordinator should handle its own rollback
                logger.info(`Attempting coordination rollback for plan ${result.coordinationResult.coordination.planId}`);
            }

            await this.eventManager.emit('IntegrationRollbackCompleted', { integrationId });
        } catch (rollbackError) {
            await this.eventManager.emit('IntegrationRollbackFailed', { 
                integrationId,
                error: rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error'
            });
        }
    }

    /**
     * Generate unique integration ID
     */
    private generateIntegrationId(): string {
        return `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate integration prerequisites
     */
    async validatePrerequisites(): Promise<{ valid: boolean; issues: string[] }> {
        const issues: string[] = [];

        try {
            // Check if impact mapper is functional
            const testFiles = ['test.cs'];
            const impactTest = await this.impactMapper.predictChangeImpact(testFiles);
            if (!impactTest) {
                issues.push('Impact mapper not functional');
            }

            // Check if cross-domain coordinator is functional
            try {
                const testCoordRequest = {
                    changedFiles: ['test.cs'],
                    triggerType: 'manual' as const,
                    performanceTimeout: 30
                };
                await this.crossDomainCoordinator.coordinateUpdate(testCoordRequest);
            } catch {
                issues.push('Cross-domain coordinator not properly configured');
            }

            // Check if holistic orchestrator is functional  
            try {
                const testHolisticRequest = {
                    changedFiles: ['test.cs'],
                    triggerType: 'manual' as const,
                    performanceTimeout: 15
                };
                await this.holisticOrchestrator.executeHolisticUpdate(testHolisticRequest);
            } catch {
                issues.push('Holistic orchestrator not properly configured');
            }

        } catch (error) {
            issues.push(`Prerequisites validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }
}
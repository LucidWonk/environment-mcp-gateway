/**
 * NewConcepts Migration Orchestrator
 * Specialized workflow for migrating concepts from NewConcepts folder to mature domain structures
 * Implements TEMP-CONTEXT-ENGINE-a7b3 NewConcepts workflow capability
 */
import { LifecycleCoordinator } from '../services/lifecycle-coordinator.js';
import { PlaceholderTracker } from '../services/placeholder-tracker.js';
export interface NewConceptsMigrationRequest {
    conceptPath: string;
    conceptName: string;
    targetDomain: string;
    placeholderIds: string[];
    migrationReason: string;
    maturityIndicators: string[];
    businessJustification: string;
}
export interface MigrationAnalysis {
    analysisId: string;
    conceptPath: string;
    discoveredDomain: string;
    confidenceScore: number;
    placeholdersFound: string[];
    integrationPoints: string[];
    businessConcepts: string[];
    migrationComplexity: 'simple' | 'moderate' | 'complex';
    estimatedDuration: number;
    riskFactors: string[];
    recommendations: string[];
}
export interface MigrationWorkflow {
    workflowId: string;
    status: 'analyzing' | 'planning' | 'pending-approval' | 'executing' | 'completed' | 'failed' | 'cancelled';
    request: NewConceptsMigrationRequest;
    analysis: MigrationAnalysis;
    coordinationPlan: any;
    approvalId?: string;
    operationId?: string;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    progress: MigrationProgress;
}
export interface MigrationProgress {
    currentPhase: 'analysis' | 'planning' | 'approval' | 'placeholder-conversion' | 'document-migration' | 'validation' | 'completion';
    phasesCompleted: string[];
    totalSteps: number;
    completedSteps: number;
    lastUpdate: Date;
    details: string;
}
export interface NewConceptsDiscoveryResult {
    conceptPaths: string[];
    placeholderCandidates: string[];
    domainMappings: Map<string, string[]>;
    readinessCandidates: NewConceptsReadinessAssessment[];
}
export interface NewConceptsReadinessAssessment {
    conceptPath: string;
    conceptName: string;
    maturityLevel: 'exploratory' | 'developing' | 'ready' | 'mature';
    readinessScore: number;
    readinessFactors: {
        documentation: number;
        implementation: number;
        testing: number;
        integration: number;
        business_validation: number;
    };
    blockingFactors: string[];
    recommendations: string[];
}
/**
 * Orchestrates NewConcepts evolution into mature domain structures
 */
export declare class NewConceptsMigrationOrchestrator {
    private lifecycleCoordinator;
    private placeholderTracker;
    private projectRoot;
    private activeMigrations;
    private migrationHistory;
    constructor(lifecycleCoordinator: LifecycleCoordinator, placeholderTracker: PlaceholderTracker, projectRoot: string);
    /**
     * Discover NewConcepts ready for migration
     */
    discoverNewConcepts(): Promise<NewConceptsDiscoveryResult>;
    /**
     * Initiate NewConcepts migration workflow
     */
    initiateMigration(request: NewConceptsMigrationRequest): Promise<string>;
    /**
     * Get migration workflow status
     */
    getMigrationStatus(workflowId: string): MigrationWorkflow | null;
    /**
     * Get all active migrations
     */
    getActiveMigrations(): MigrationWorkflow[];
    /**
     * Cancel migration workflow
     */
    cancelMigration(workflowId: string, reason: string): Promise<boolean>;
    private executeMigrationWorkflow;
    private assessConceptReadiness;
    private analyzeConcept;
    private validateMigrationResult;
    private inferDomainFromPath;
    private generateWorkflowId;
}
//# sourceMappingURL=newconcepts-migration.d.ts.map
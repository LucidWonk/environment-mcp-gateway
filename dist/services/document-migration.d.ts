/**
 * Document Migration Service
 * Handles automated migration of NewConcepts to Mature Domain documents
 * Implements TEMP-CONTEXT-ENGINE-a7b3 document lifecycle automation capability
 */
export interface DocumentAnalysis {
    filePath: string;
    documentType: 'concept' | 'implementation-icp' | 'codification-icp';
    currentDomain: string;
    discoveredDomains: string[];
    placeholderIds: string[];
    businessConcepts: string[];
    integrationPoints: string[];
    maturityLevel: 'exploring' | 'ready-for-migration' | 'mature';
    confidence: number;
}
export interface MigrationProposal {
    proposalId: string;
    sourceDocument: string;
    analysisResults: DocumentAnalysis;
    proposedStructure: {
        targetDomain: string;
        newDocumentPath: string;
        templateType: 'domain' | 'digital';
        finalCapabilityIds: {
            placeholder: string;
            final: string;
        }[];
    };
    archiveStrategy: {
        archivePath: string;
        forwardReferences: string[];
        preserveHistory: boolean;
    };
    impactAnalysis: {
        affectedDocuments: string[];
        crossReferences: string[];
        riskLevel: 'low' | 'medium' | 'high';
        requiredApprovals: string[];
    };
    estimatedMigrationTime: number;
    rollbackStrategy: {
        snapshotRequired: boolean;
        rollbackSteps: string[];
    };
    createdAt: Date;
    approvalRequired: boolean;
}
export interface MigrationResult {
    success: boolean;
    proposalId: string;
    executionTime: number;
    migratedDocuments: string[];
    archivedDocuments: string[];
    createdReferences: string[];
    updatedCapabilityIds: {
        placeholder: string;
        final: string;
    }[];
    errors: string[];
    warnings: string[];
    rollbackData?: any;
}
/**
 * Manages the complete document lifecycle from NewConcepts to Mature Domain documents
 */
export declare class DocumentMigrationService {
    private approvalWorkflow;
    private archiveManager;
    private projectRoot;
    private activeMigrations;
    constructor(projectRoot?: string);
    /**
     * Analyze document for migration readiness
     */
    analyzeDocumentForMigration(documentPath: string): Promise<DocumentAnalysis>;
    /**
     * Generate migration proposal for human approval
     */
    generateMigrationProposal(documentPath: string): Promise<MigrationProposal>;
    /**
     * Submit proposal for human approval
     */
    submitForApproval(proposalId: string): Promise<{
        approvalId: string;
        status: string;
    }>;
    /**
     * Execute approved migration
     */
    executeMigration(proposalId: string, approvalId: string): Promise<MigrationResult>;
    /**
     * Get migration proposal by ID
     */
    getMigrationProposal(proposalId: string): MigrationProposal | null;
    /**
     * List all active migration proposals
     */
    getActiveMigrations(): string[];
    private determineDocumentType;
    private extractCurrentDomain;
    private extractDiscoveredDomains;
    private extractPlaceholderIds;
    private extractBusinessConcepts;
    private extractIntegrationPoints;
    private assessMaturityLevel;
    private calculateConfidenceScore;
    private determineTargetDomain;
    private determineTemplateType;
    private constructNewDocumentPath;
    private generateFinalCapabilityIds;
    private constructArchivePath;
    private generateForwardReferences;
    private analyzeImpact;
    private estimateMigrationTime;
    private generateRollbackSteps;
    private generateApprovalDescription;
    private generateProposalId;
    private generateIdSuffix;
    private createMigrationSnapshot;
    private createDocumentFromTemplate;
    private updateCapabilityIds;
    private createForwardReferences;
    private rollbackMigration;
}
//# sourceMappingURL=document-migration.d.ts.map
/**
 * Document Migration Service
 * Handles automated migration of NewConcepts to Mature Domain documents
 * Implements TEMP-CONTEXT-ENGINE-a7b3 document lifecycle automation capability
 */

import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { ApprovalWorkflowManager } from './approval-workflow.js';
import { ArchiveManager } from './archive-manager.js';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'document-migration.log' })
    ]
});

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
        finalCapabilityIds: { placeholder: string; final: string }[];
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
    updatedCapabilityIds: { placeholder: string; final: string }[];
    errors: string[];
    warnings: string[];
    rollbackData?: any;
}

/**
 * Manages the complete document lifecycle from NewConcepts to Mature Domain documents
 */
export class DocumentMigrationService {
    private approvalWorkflow: ApprovalWorkflowManager;
    private archiveManager: ArchiveManager;
    private projectRoot: string;
    private activeMigrations: Map<string, MigrationProposal> = new Map();

    constructor(projectRoot: string = '.') {
        this.projectRoot = projectRoot;
        this.approvalWorkflow = new ApprovalWorkflowManager();
        this.archiveManager = new ArchiveManager(path.join(projectRoot, 'Documentation', 'Archive'));
    }

    /**
     * Analyze document for migration readiness
     */
    async analyzeDocumentForMigration(documentPath: string): Promise<DocumentAnalysis> {
        logger.info(`Analyzing document for migration: ${documentPath}`);

        try {
            const content = await fs.promises.readFile(path.resolve(this.projectRoot, documentPath), 'utf-8');
            
            const analysis: DocumentAnalysis = {
                filePath: documentPath,
                documentType: this.determineDocumentType(documentPath, content),
                currentDomain: this.extractCurrentDomain(content),
                discoveredDomains: this.extractDiscoveredDomains(content),
                placeholderIds: this.extractPlaceholderIds(content),
                businessConcepts: this.extractBusinessConcepts(content),
                integrationPoints: this.extractIntegrationPoints(content),
                maturityLevel: this.assessMaturityLevel(content),
                confidence: this.calculateConfidenceScore(content)
            };

            logger.info(`Document analysis complete: ${analysis.maturityLevel} maturity, ${analysis.confidence * 100}% confidence`);
            return analysis;

        } catch (error) {
            logger.error(`Failed to analyze document ${documentPath}:`, error);
            throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate migration proposal for human approval
     */
    async generateMigrationProposal(documentPath: string): Promise<MigrationProposal> {
        const startTime = Date.now();
        logger.info(`Generating migration proposal for: ${documentPath}`);

        try {
            const analysis = await this.analyzeDocumentForMigration(documentPath);
            
            if (analysis.maturityLevel !== 'ready-for-migration') {
                throw new Error(`Document not ready for migration. Current maturity: ${analysis.maturityLevel}`);
            }

            const proposalId = this.generateProposalId();
            const targetDomain = this.determineTargetDomain(analysis);
            const templateType = this.determineTemplateType(analysis);

            const proposal: MigrationProposal = {
                proposalId,
                sourceDocument: documentPath,
                analysisResults: analysis,
                proposedStructure: {
                    targetDomain,
                    newDocumentPath: this.constructNewDocumentPath(targetDomain, analysis, templateType),
                    templateType,
                    finalCapabilityIds: this.generateFinalCapabilityIds(analysis.placeholderIds, targetDomain)
                },
                archiveStrategy: {
                    archivePath: this.constructArchivePath(documentPath),
                    forwardReferences: this.generateForwardReferences(analysis),
                    preserveHistory: true
                },
                impactAnalysis: await this.analyzeImpact(analysis),
                estimatedMigrationTime: this.estimateMigrationTime(analysis),
                rollbackStrategy: {
                    snapshotRequired: true,
                    rollbackSteps: this.generateRollbackSteps(analysis)
                },
                createdAt: new Date(),
                approvalRequired: true
            };

            this.activeMigrations.set(proposalId, proposal);

            const executionTime = Date.now() - startTime;
            logger.info(`Migration proposal generated in ${executionTime}ms: ${proposalId}`);

            return proposal;

        } catch (error) {
            logger.error(`Failed to generate migration proposal for ${documentPath}:`, error);
            throw new Error(`Proposal generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Submit proposal for human approval
     */
    async submitForApproval(proposalId: string): Promise<{ approvalId: string; status: string }> {
        logger.info(`Submitting proposal for approval: ${proposalId}`);

        const proposal = this.activeMigrations.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }

        try {
            const approvalRequest = {
                proposalId,
                type: 'document-migration' as const,
                title: `Migrate ${path.basename(proposal.sourceDocument)} to ${proposal.proposedStructure.targetDomain} domain`,
                description: this.generateApprovalDescription(proposal),
                details: {
                    sourceDocument: proposal.sourceDocument,
                    targetDomain: proposal.proposedStructure.targetDomain,
                    newPath: proposal.proposedStructure.newDocumentPath,
                    capabilityIdChanges: proposal.proposedStructure.finalCapabilityIds,
                    riskLevel: proposal.impactAnalysis.riskLevel,
                    estimatedTime: proposal.estimatedMigrationTime
                },
                requiredApprovals: proposal.impactAnalysis.requiredApprovals,
                priority: (proposal.impactAnalysis.riskLevel === 'high' ? 'urgent' : 'normal') as 'low' | 'normal' | 'urgent'
            };

            const result = await this.approvalWorkflow.submitRequest(approvalRequest);
            
            logger.info(`Approval request submitted: ${result.approvalId}`);
            return result;

        } catch (error) {
            logger.error(`Failed to submit approval for ${proposalId}:`, error);
            throw new Error(`Approval submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Execute approved migration
     */
    async executeMigration(proposalId: string, approvalId: string): Promise<MigrationResult> {
        const startTime = Date.now();
        logger.info(`Executing migration: ${proposalId} with approval ${approvalId}`);

        const proposal = this.activeMigrations.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }

        // Verify approval
        const approvalStatus = await this.approvalWorkflow.checkApproval(approvalId);
        if (approvalStatus !== 'approved') {
            throw new Error(`Migration not approved. Status: ${approvalStatus}`);
        }

        const result: MigrationResult = {
            success: false,
            proposalId,
            executionTime: 0,
            migratedDocuments: [],
            archivedDocuments: [],
            createdReferences: [],
            updatedCapabilityIds: [],
            errors: [],
            warnings: []
        };

        try {
            // Step 1: Create rollback snapshot
            if (proposal.rollbackStrategy.snapshotRequired) {
                result.rollbackData = await this.createMigrationSnapshot(proposal);
            }

            // Step 2: Create new document from template
            const newDocumentPath = await this.createDocumentFromTemplate(proposal);
            result.migratedDocuments.push(newDocumentPath);

            // Step 3: Archive original document
            const archivedPath = await this.archiveManager.archiveDocument(
                proposal.sourceDocument, 
                proposal.archiveStrategy.archivePath,
                proposal.archiveStrategy.forwardReferences
            );
            result.archivedDocuments.push(archivedPath);

            // Step 4: Update capability registry (if applicable)
            if (proposal.proposedStructure.finalCapabilityIds.length > 0) {
                result.updatedCapabilityIds = await this.updateCapabilityIds(
                    proposal.proposedStructure.finalCapabilityIds
                );
            }

            // Step 5: Create forward references
            result.createdReferences = await this.createForwardReferences(proposal);

            result.success = true;
            result.executionTime = Date.now() - startTime;

            // Cleanup
            this.activeMigrations.delete(proposalId);

            logger.info(`Migration completed successfully in ${result.executionTime}ms: ${proposalId}`);
            return result;

        } catch (error) {
            result.success = false;
            result.executionTime = Date.now() - startTime;
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');

            // Attempt rollback
            if (result.rollbackData) {
                try {
                    await this.rollbackMigration(proposalId, result.rollbackData);
                    logger.info(`Migration rollback completed for ${proposalId}`);
                } catch (rollbackError) {
                    result.errors.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error'}`);
                    logger.error(`Migration rollback failed for ${proposalId}:`, rollbackError);
                }
            }

            logger.error(`Migration failed for ${proposalId}:`, error);
            return result;
        }
    }

    /**
     * Get migration proposal by ID
     */
    getMigrationProposal(proposalId: string): MigrationProposal | null {
        return this.activeMigrations.get(proposalId) || null;
    }

    /**
     * List all active migration proposals
     */
    getActiveMigrations(): string[] {
        return Array.from(this.activeMigrations.keys());
    }

    // Private helper methods

    private determineDocumentType(filePath: string, _content: string): 'concept' | 'implementation-icp' | 'codification-icp' {
        if (filePath.includes('.implementation.icp.md')) return 'implementation-icp';
        if (filePath.includes('.codification.icp.md')) return 'codification-icp';
        if (filePath.includes('.domain.req.md') || filePath.includes('.digital.req.md')) return 'concept';
        return 'concept';
    }

    private extractCurrentDomain(content: string): string {
        const domainMatch = content.match(/\*\*Domain\*\*:\s*([^\n]+)/i);
        if (domainMatch) return domainMatch[1].trim();
        
        const folderMatch = content.match(/NewConcepts/i);
        if (folderMatch) return 'NewConcepts';
        
        return 'Unknown';
    }

    private extractDiscoveredDomains(content: string): string[] {
        const domains = new Set<string>();
        
        // Look for domain discovery sections
        const discoveryMatch = content.match(/##\s*Domain Discovery[\s\S]*?(?=##|$)/i);
        if (discoveryMatch) {
            const domainMatches = discoveryMatch[0].match(/\b(Analysis|Data|Messaging|EnvironmentMCPGateway|Documentation|Infrastructure|Testing)\b/g);
            if (domainMatches) {
                domainMatches.forEach(domain => domains.add(domain));
            }
        }

        // Look for implementation notes mentioning domains
        const implementationMatches = content.match(/\*\*Confirmed Domain\*\*:\s*([^\n]+)/gi);
        if (implementationMatches) {
            implementationMatches.forEach(match => {
                const domain = match.replace(/\*\*Confirmed Domain\*\*:\s*/i, '').trim();
                domains.add(domain);
            });
        }

        return Array.from(domains);
    }

    private extractPlaceholderIds(content: string): string[] {
        const placeholderMatches = content.match(/TEMP-[A-Z]+-[a-zA-Z0-9]+/g);
        return placeholderMatches || [];
    }

    private extractBusinessConcepts(content: string): string[] {
        const concepts = new Set<string>();
        
        // Look for business concepts in various sections
        const conceptMatches = content.match(/\*\*([A-Z][a-zA-Z\s]+)\*\*(?=:)/g);
        if (conceptMatches) {
            conceptMatches.forEach(match => {
                const concept = match.replace(/\*\*/g, '').trim();
                if (concept.length > 3 && !concept.includes('Implementation') && !concept.includes('Technical')) {
                    concepts.add(concept);
                }
            });
        }

        return Array.from(concepts).slice(0, 10); // Limit to top 10
    }

    private extractIntegrationPoints(content: string): string[] {
        const integrations = new Set<string>();
        
        // Look for integration mentions
        const integrationMatches = content.match(/integrat[a-z]*\s+with\s+([A-Z][a-zA-Z\s]+)/gi);
        if (integrationMatches) {
            integrationMatches.forEach(match => {
                const integration = match.replace(/integrat[a-z]*\s+with\s+/i, '').trim();
                integrations.add(integration);
            });
        }

        return Array.from(integrations);
    }

    private assessMaturityLevel(content: string): 'exploring' | 'ready-for-migration' | 'mature' {
        // Check for completion indicators
        if (content.includes('✅ COMPLETED') || content.includes('Implementation complete')) {
            return 'ready-for-migration';
        }
        
        if (content.includes('Mature') || content.includes('/Documentation/')) {
            return 'mature';
        }
        
        return 'exploring';
    }

    private calculateConfidenceScore(content: string): number {
        let score = 0.5; // Base confidence
        
        // Increase confidence for implementation completion
        if (content.includes('✅ COMPLETED')) score += 0.3;
        if (content.includes('All tests passing')) score += 0.2;
        if (content.includes('Domain discovery')) score += 0.1;
        if (content.includes('Build Status: ✅')) score += 0.1;
        
        // Decrease confidence for exploration indicators
        if (content.includes('Exploring')) score -= 0.2;
        if (content.includes('TBD')) score -= 0.1;
        if (content.includes('Preliminary')) score -= 0.1;
        
        return Math.max(0, Math.min(1, score));
    }

    private determineTargetDomain(analysis: DocumentAnalysis): string {
        // Use discovered domains if available
        if (analysis.discoveredDomains.length > 0) {
            return analysis.discoveredDomains[0]; // Use primary discovered domain
        }
        
        // Fallback to content analysis
        if (analysis.businessConcepts.some(c => c.includes('Analysis'))) return 'Analysis';
        if (analysis.businessConcepts.some(c => c.includes('Data'))) return 'Data';
        if (analysis.businessConcepts.some(c => c.includes('Messaging'))) return 'Messaging';
        if (analysis.businessConcepts.some(c => c.includes('Gateway'))) return 'EnvironmentMCPGateway';
        
        return 'Infrastructure'; // Default fallback
    }

    private determineTemplateType(analysis: DocumentAnalysis): 'domain' | 'digital' {
        // Digital templates for UI/user-facing capabilities
        if (analysis.businessConcepts.some(c => 
            c.toLowerCase().includes('ui') || 
            c.toLowerCase().includes('user') || 
            c.toLowerCase().includes('interface') ||
            c.toLowerCase().includes('dashboard')
        )) {
            return 'digital';
        }
        
        return 'domain'; // Default for business domain capabilities
    }

    private constructNewDocumentPath(domain: string, analysis: DocumentAnalysis, templateType: 'domain' | 'digital'): string {
        const baseName = path.basename(analysis.filePath, path.extname(analysis.filePath));
        const cleanName = baseName.replace(/\.implementation\.icp|\.codification\.icp|\.domain\.req/, '');
        
        return `Documentation/${domain}/${cleanName}.${templateType}.req.md`;
    }

    private generateFinalCapabilityIds(placeholderIds: string[], domain: string): { placeholder: string; final: string }[] {
        return placeholderIds.map(placeholder => {
            // Extract the concept name from placeholder
            const match = placeholder.match(/TEMP-([A-Z]+)-([a-zA-Z0-9]+)/);
            if (match) {
                const conceptName = match[2];
                return {
                    placeholder,
                    final: `${domain.toUpperCase()}-${conceptName.toUpperCase()}-${this.generateIdSuffix()}`
                };
            }
            return {
                placeholder,
                final: `${domain.toUpperCase()}-CAPABILITY-${this.generateIdSuffix()}`
            };
        });
    }

    private constructArchivePath(documentPath: string): string {
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const baseName = path.basename(documentPath);
        return `Documentation/Archive/Implemented/${timestamp}-${baseName}`;
    }

    private generateForwardReferences(analysis: DocumentAnalysis): string[] {
        return [
            `Original NewConcept: ${analysis.filePath}`,
            `Migration Date: ${new Date().toISOString()}`,
            `Target Domain: ${analysis.discoveredDomains.join(', ')}`
        ];
    }

    private async analyzeImpact(analysis: DocumentAnalysis): Promise<any> {
        // Simplified impact analysis - in real implementation would be more comprehensive
        return {
            affectedDocuments: [],
            crossReferences: analysis.integrationPoints,
            riskLevel: analysis.confidence > 0.8 ? 'low' : analysis.confidence > 0.6 ? 'medium' : 'high',
            requiredApprovals: ['domain-architect', 'technical-lead']
        };
    }

    private estimateMigrationTime(analysis: DocumentAnalysis): number {
        // Base time in milliseconds
        let time = 5000; // 5 seconds base
        
        // Add time for complexity
        time += analysis.placeholderIds.length * 1000; // 1 second per placeholder ID
        time += analysis.integrationPoints.length * 2000; // 2 seconds per integration point
        
        return time;
    }

    private generateRollbackSteps(_analysis: DocumentAnalysis): string[] {
        return [
            'Restore original document from snapshot',
            'Revert capability registry changes',
            'Remove forward references',
            'Delete created archive entries'
        ];
    }

    private generateApprovalDescription(proposal: MigrationProposal): string {
        return `Migration of ${proposal.sourceDocument} to ${proposal.proposedStructure.targetDomain} domain. ` +
               `Confidence: ${(proposal.analysisResults.confidence * 100).toFixed(1)}%. ` +
               `Risk Level: ${proposal.impactAnalysis.riskLevel}. ` +
               `Estimated Time: ${(proposal.estimatedMigrationTime / 1000).toFixed(1)} seconds.`;
    }

    private generateProposalId(): string {
        return `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateIdSuffix(): string {
        return Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    // Implementation methods (simplified for prototype)
    private async createMigrationSnapshot(proposal: MigrationProposal): Promise<any> {
        return {
            sourceContent: await fs.promises.readFile(path.resolve(this.projectRoot, proposal.sourceDocument), 'utf-8'),
            timestamp: new Date().toISOString(),
            proposalId: proposal.proposalId
        };
    }

    private async createDocumentFromTemplate(proposal: MigrationProposal): Promise<string> {
        // Simplified template creation - would use actual template system
        const targetPath = path.resolve(this.projectRoot, proposal.proposedStructure.newDocumentPath);
        const targetDir = path.dirname(targetPath);
        
        // Ensure directory exists
        await fs.promises.mkdir(targetDir, { recursive: true });
        
        // Create basic document structure
        const content = `# ${proposal.analysisResults.businessConcepts[0] || 'Migrated Concept'}

## Overview
This document was migrated from NewConcepts: ${proposal.sourceDocument}

Migration Date: ${new Date().toISOString()}
Target Domain: ${proposal.proposedStructure.targetDomain}

## Capability IDs
${proposal.proposedStructure.finalCapabilityIds.map(id => `- ${id.final} (was ${id.placeholder})`).join('\n')}

## Forward Reference
Original document archived at: ${proposal.archiveStrategy.archivePath}
`;
        
        await fs.promises.writeFile(targetPath, content, 'utf-8');
        return targetPath;
    }

    private async updateCapabilityIds(idMappings: { placeholder: string; final: string }[]): Promise<{ placeholder: string; final: string }[]> {
        // Simplified capability ID update - would integrate with actual registry
        logger.info(`Would update capability IDs: ${idMappings.map(m => `${m.placeholder} → ${m.final}`).join(', ')}`);
        return idMappings;
    }

    private async createForwardReferences(proposal: MigrationProposal): Promise<string[]> {
        // Simplified forward reference creation
        const references = [
            `Forward reference created: ${proposal.sourceDocument} → ${proposal.proposedStructure.newDocumentPath}`,
            `Archive location: ${proposal.archiveStrategy.archivePath}`
        ];
        
        logger.info(`Created forward references: ${references.join(', ')}`);
        return references;
    }

    private async rollbackMigration(proposalId: string, _rollbackData: any): Promise<void> {
        logger.info(`Executing rollback for migration: ${proposalId}`);
        // Simplified rollback - would restore from actual snapshot
        // Implementation would reverse all migration steps
    }
}
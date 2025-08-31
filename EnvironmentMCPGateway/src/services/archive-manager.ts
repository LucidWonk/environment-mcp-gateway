/**
 * Archive Manager Service
 * Manages document archiving, forward references, and historical preservation
 * Implements TEMP-CONTEXT-ENGINE-a7b3 archive management capability
 */

import * as fs from 'fs';
import * as path from 'path';
import { createMCPLogger } from '../utils/mcp-logger.js';

const logger = createMCPLogger('mcp-gateway.log');

export interface ArchiveMetadata {
    originalPath: string;
    archivedPath: string;
    archiveDate: Date;
    migrationId?: string;
    forwardReferences: string[];
    preserveHistory: boolean;
    archiveReason: 'implementation-complete' | 'domain-migration' | 'deprecated' | 'manual';
    tags: string[];
}

export interface ForwardReference {
    originalPath: string;
    newPath: string;
    referenceType: 'migration' | 'relocation' | 'restructuring';
    createdDate: Date;
    migrationId?: string;
    metadata: any;
}

export interface ArchiveSearchQuery {
    originalPath?: string;
    archivedPath?: string;
    archiveReason?: string;
    tags?: string[];
    dateRange?: {
        from: Date;
        to: Date;
    };
    migrationId?: string;
}

/**
 * Manages document archiving and forward reference tracking
 * Preserves document history while maintaining clean active documentation
 */
export class ArchiveManager {
    private archiveRoot: string;
    private forwardReferences: Map<string, ForwardReference[]> = new Map();
    private archiveIndex: Map<string, ArchiveMetadata> = new Map();

    constructor(archiveRoot: string) {
        this.archiveRoot = archiveRoot;
        this.initializeArchiveStructure();
        this.loadExistingIndex();
    }

    /**
     * Archive a document with forward reference tracking
     */
    async archiveDocument(
        sourcePath: string,
        targetArchivePath: string,
        forwardReferences: string[],
        options: {
            migrationId?: string;
            reason?: ArchiveMetadata['archiveReason'];
            tags?: string[];
            preserveHistory?: boolean;
        } = {}
    ): Promise<string> {
        logger.info(`Archiving document: ${sourcePath} -> ${targetArchivePath}`);

        try {
            const resolvedSourcePath = path.resolve(sourcePath);
            const fullTargetPath = path.resolve(this.archiveRoot, targetArchivePath);

            // Verify source exists
            if (!await this.fileExists(resolvedSourcePath)) {
                throw new Error(`Source document not found: ${sourcePath}`);
            }

            // Ensure target directory exists
            await fs.promises.mkdir(path.dirname(fullTargetPath), { recursive: true });

            // Read source content
            const content = await fs.promises.readFile(resolvedSourcePath, 'utf-8');

            // Create archive metadata
            const metadata: ArchiveMetadata = {
                originalPath: sourcePath,
                archivedPath: targetArchivePath,
                archiveDate: new Date(),
                migrationId: options.migrationId,
                forwardReferences,
                preserveHistory: options.preserveHistory ?? true,
                archiveReason: options.reason ?? 'implementation-complete',
                tags: options.tags ?? []
            };

            // Add archive metadata header to content
            const archivedContent = this.addArchiveHeader(content, metadata);

            // Write archived document
            await fs.promises.writeFile(fullTargetPath, archivedContent, 'utf-8');

            // Update archive index
            this.archiveIndex.set(sourcePath, metadata);

            // Create forward references
            if (forwardReferences.length > 0) {
                await this.createForwardReferences(sourcePath, forwardReferences, metadata);
            }

            // Remove original document if archiving for migration
            if (options.reason === 'domain-migration' || options.reason === 'implementation-complete') {
                await fs.promises.unlink(resolvedSourcePath);
                logger.info(`Original document removed: ${sourcePath}`);
            }

            logger.info(`Document archived successfully: ${fullTargetPath}`);
            return fullTargetPath;

        } catch (error) {
            logger.error(`Failed to archive document ${sourcePath}:`, error);
            throw new Error(`Archive operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create forward reference documents
     */
    async createForwardReferences(
        originalPath: string,
        references: string[],
        archiveMetadata: ArchiveMetadata
    ): Promise<void> {
        logger.info(`Creating ${references.length} forward references for ${originalPath}`);

        for (const referencePath of references) {
            try {
                const forwardRef: ForwardReference = {
                    originalPath,
                    newPath: referencePath,
                    referenceType: 'migration',
                    createdDate: new Date(),
                    migrationId: archiveMetadata.migrationId,
                    metadata: {
                        archiveReason: archiveMetadata.archiveReason,
                        archivedPath: archiveMetadata.archivedPath,
                        tags: archiveMetadata.tags
                    }
                };

                // Store forward reference
                if (!this.forwardReferences.has(originalPath)) {
                    this.forwardReferences.set(originalPath, []);
                }
                this.forwardReferences.get(originalPath)!.push(forwardRef);

                // Create forward reference file if path is provided
                if (await this.shouldCreateReferenceFile(referencePath)) {
                    await this.createForwardReferenceFile(forwardRef);
                }

            } catch (error) {
                logger.warn(`Failed to create forward reference ${referencePath}:`, error);
                // Continue with other references
            }
        }

        logger.info(`Forward references created for ${originalPath}`);
    }

    /**
     * Retrieve archived document
     */
    async retrieveArchivedDocument(originalPath: string): Promise<{ content: string; metadata: ArchiveMetadata } | null> {
        const metadata = this.archiveIndex.get(originalPath);
        if (!metadata) {
            return null;
        }

        try {
            const archivedPath = path.resolve(this.archiveRoot, metadata.archivedPath);
            const content = await fs.promises.readFile(archivedPath, 'utf-8');
            
            // Remove archive header from content
            const cleanContent = this.removeArchiveHeader(content);

            return {
                content: cleanContent,
                metadata
            };

        } catch (error) {
            logger.error(`Failed to retrieve archived document ${originalPath}:`, error);
            return null;
        }
    }

    /**
     * Search archived documents
     */
    searchArchive(query: ArchiveSearchQuery): ArchiveMetadata[] {
        let results = Array.from(this.archiveIndex.values());

        if (query.originalPath) {
            results = results.filter(metadata => 
                metadata.originalPath.includes(query.originalPath!)
            );
        }

        if (query.archivedPath) {
            results = results.filter(metadata => 
                metadata.archivedPath.includes(query.archivedPath!)
            );
        }

        if (query.archiveReason) {
            results = results.filter(metadata => 
                metadata.archiveReason === query.archiveReason
            );
        }

        if (query.tags && query.tags.length > 0) {
            results = results.filter(metadata => 
                query.tags!.some(tag => metadata.tags.includes(tag))
            );
        }

        if (query.dateRange) {
            results = results.filter(metadata => 
                metadata.archiveDate >= query.dateRange!.from &&
                metadata.archiveDate <= query.dateRange!.to
            );
        }

        if (query.migrationId) {
            results = results.filter(metadata => 
                metadata.migrationId === query.migrationId
            );
        }

        return results.sort((a, b) => b.archiveDate.getTime() - a.archiveDate.getTime());
    }

    /**
     * Get forward references for a document
     */
    getForwardReferences(originalPath: string): ForwardReference[] {
        return this.forwardReferences.get(originalPath) || [];
    }

    /**
     * Get archive statistics
     */
    getArchiveStatistics(): {
        totalArchived: number;
        byReason: Map<string, number>;
        byMonth: Map<string, number>;
        recentArchives: ArchiveMetadata[];
        totalForwardReferences: number;
        } {
        const metadata = Array.from(this.archiveIndex.values());
        
        const byReason = new Map<string, number>();
        const byMonth = new Map<string, number>();

        for (const item of metadata) {
            // Count by reason
            const reason = item.archiveReason;
            byReason.set(reason, (byReason.get(reason) || 0) + 1);

            // Count by month
            const month = item.archiveDate.toISOString().substr(0, 7); // YYYY-MM
            byMonth.set(month, (byMonth.get(month) || 0) + 1);
        }

        // Get recent archives (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentArchives = metadata
            .filter(item => item.archiveDate >= thirtyDaysAgo)
            .sort((a, b) => b.archiveDate.getTime() - a.archiveDate.getTime())
            .slice(0, 10);

        const totalForwardReferences = Array.from(this.forwardReferences.values())
            .reduce((sum, refs) => sum + refs.length, 0);

        return {
            totalArchived: metadata.length,
            byReason,
            byMonth,
            recentArchives,
            totalForwardReferences
        };
    }

    /**
     * Clean up old archives based on retention policy
     */
    async cleanupOldArchives(retentionDays: number = 365): Promise<{ removed: number; errors: string[] }> {
        logger.info(`Starting archive cleanup with ${retentionDays} day retention`);

        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const errors: string[] = [];
        let removed = 0;

        const oldArchives = Array.from(this.archiveIndex.entries())
            .filter(([_path, metadata]) => 
                metadata.archiveDate < cutoffDate && 
                !metadata.preserveHistory
            );

        for (const [originalPath, metadata] of oldArchives) {
            try {
                const archivedPath = path.resolve(this.archiveRoot, metadata.archivedPath);
                
                // Remove archived file
                if (await this.fileExists(archivedPath)) {
                    await fs.promises.unlink(archivedPath);
                }

                // Remove from index
                this.archiveIndex.delete(originalPath);

                // Remove forward references
                this.forwardReferences.delete(originalPath);

                removed++;
                logger.info(`Cleaned up old archive: ${metadata.archivedPath}`);

            } catch (error) {
                const errorMsg = `Failed to cleanup archive ${metadata.archivedPath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                logger.error(errorMsg);
            }
        }

        logger.info(`Archive cleanup completed: ${removed} removed, ${errors.length} errors`);
        
        return { removed, errors };
    }

    // Private helper methods

    private async initializeArchiveStructure(): Promise<void> {
        const requiredDirs = [
            'Implemented',      // For completed implementations
            'Migrated',         // For domain migrations
            'Deprecated',       // For deprecated concepts
            'ForwardRefs'       // For forward reference files
        ];

        for (const dir of requiredDirs) {
            const dirPath = path.join(this.archiveRoot, dir);
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }

    private async loadExistingIndex(): Promise<void> {
        // In a full implementation, this would load from persistent storage
        // For now, it's just initializing empty structures
        logger.info('Archive index initialized (in-memory only)');
    }

    private addArchiveHeader(content: string, metadata: ArchiveMetadata): string {
        const header = `<!-- ARCHIVE METADATA
Original Path: ${metadata.originalPath}
Archived Date: ${metadata.archiveDate.toISOString()}
Archive Reason: ${metadata.archiveReason}
Migration ID: ${metadata.migrationId || 'N/A'}
Preserve History: ${metadata.preserveHistory}
Tags: ${metadata.tags.join(', ')}
Forward References: ${metadata.forwardReferences.join(', ')}
-->

# ARCHIVED DOCUMENT

**⚠️ This document has been archived and is no longer active.**

**Original Location**: \`${metadata.originalPath}\`  
**Archived Date**: ${metadata.archiveDate.toISOString()}  
**Archive Reason**: ${metadata.archiveReason}  

${metadata.forwardReferences.length > 0 ? `**New Location(s)**: ${metadata.forwardReferences.map(ref => `\`${ref}\``).join(', ')}` : ''}

---

${content}`;

        return header;
    }

    private removeArchiveHeader(content: string): string {
        // Remove the archive header added by addArchiveHeader
        const headerEndIndex = content.indexOf('---\n');
        if (headerEndIndex > 0 && content.startsWith('<!-- ARCHIVE METADATA')) {
            return content.substring(headerEndIndex + 4);
        }
        return content;
    }

    private async shouldCreateReferenceFile(referencePath: string): Promise<boolean> {
        // Only create reference files for certain paths
        return referencePath.startsWith('Documentation/') && 
               (referencePath.endsWith('.md') || referencePath.endsWith('.txt'));
    }

    private async createForwardReferenceFile(forwardRef: ForwardReference): Promise<void> {
        const referenceContent = `# Forward Reference

This document has been moved/migrated.

**Original Location**: \`${forwardRef.originalPath}\`  
**New Location**: \`${forwardRef.newPath}\`  
**Migration Date**: ${forwardRef.createdDate.toISOString()}  
**Reference Type**: ${forwardRef.referenceType}  

${forwardRef.migrationId ? `**Migration ID**: ${forwardRef.migrationId}` : ''}

## Additional Information

${JSON.stringify(forwardRef.metadata, null, 2)}

---

*This is an automatically generated forward reference file.*
`;

        const referenceFilePath = path.join(
            this.archiveRoot, 
            'ForwardRefs', 
            `${path.basename(forwardRef.originalPath)}.ref.md`
        );

        await fs.promises.writeFile(referenceFilePath, referenceContent, 'utf-8');
        logger.info(`Forward reference file created: ${referenceFilePath}`);
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}
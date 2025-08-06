/**
 * Archive Manager Service
 * Manages document archiving, forward references, and historical preservation
 * Implements TEMP-CONTEXT-ENGINE-a7b3 archive management capability
 */
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
export declare class ArchiveManager {
    private archiveRoot;
    private forwardReferences;
    private archiveIndex;
    constructor(archiveRoot: string);
    /**
     * Archive a document with forward reference tracking
     */
    archiveDocument(sourcePath: string, targetArchivePath: string, forwardReferences: string[], options?: {
        migrationId?: string;
        reason?: ArchiveMetadata['archiveReason'];
        tags?: string[];
        preserveHistory?: boolean;
    }): Promise<string>;
    /**
     * Create forward reference documents
     */
    createForwardReferences(originalPath: string, references: string[], archiveMetadata: ArchiveMetadata): Promise<void>;
    /**
     * Retrieve archived document
     */
    retrieveArchivedDocument(originalPath: string): Promise<{
        content: string;
        metadata: ArchiveMetadata;
    } | null>;
    /**
     * Search archived documents
     */
    searchArchive(query: ArchiveSearchQuery): ArchiveMetadata[];
    /**
     * Get forward references for a document
     */
    getForwardReferences(originalPath: string): ForwardReference[];
    /**
     * Get archive statistics
     */
    getArchiveStatistics(): {
        totalArchived: number;
        byReason: Map<string, number>;
        byMonth: Map<string, number>;
        recentArchives: ArchiveMetadata[];
        totalForwardReferences: number;
    };
    /**
     * Clean up old archives based on retention policy
     */
    cleanupOldArchives(retentionDays?: number): Promise<{
        removed: number;
        errors: string[];
    }>;
    private initializeArchiveStructure;
    private loadExistingIndex;
    private addArchiveHeader;
    private removeArchiveHeader;
    private shouldCreateReferenceFile;
    private createForwardReferenceFile;
    private fileExists;
}
//# sourceMappingURL=archive-manager.d.ts.map
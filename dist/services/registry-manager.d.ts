/**
 * Registry Management Service
 * Manages capability registry lifecycle, placeholder ID conversion, and registry integrity
 * Implements TEMP-CONTEXT-ENGINE-a7b3 registry lifecycle management capability
 */
export interface CapabilityRegistryEntry {
    id: string;
    name: string;
    description: string;
    domain: string;
    status: 'concept' | 'in-progress' | 'implemented' | 'deprecated';
    createdAt: Date;
    updatedAt: Date;
    version: string;
    dependencies: string[];
    tags: string[];
    metadata: {
        sourceDocument?: string;
        implementationPath?: string;
        migrationId?: string;
        approvalId?: string;
    };
}
export interface PlaceholderCapability {
    placeholderId: string;
    name: string;
    description: string;
    discoveredDomain: string;
    sourceDocument: string;
    businessConcepts: string[];
    integrationPoints: string[];
    maturityLevel: 'exploring' | 'ready-for-conversion';
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CapabilityConversion {
    conversionId: string;
    placeholderId: string;
    finalCapabilityId: string;
    proposedEntry: CapabilityRegistryEntry;
    conversionReason: 'implementation-complete' | 'domain-migration' | 'manual-request';
    approvalRequired: boolean;
    approvalId?: string;
    conversionStatus: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
}
export interface RegistryUpdateOperation {
    operationId: string;
    operationType: 'create' | 'update' | 'convert' | 'deprecate';
    targetCapabilityId: string;
    changes: any;
    requestedBy: 'system' | 'user' | 'migration';
    approvalRequired: boolean;
    approvalId?: string;
    operationStatus: 'pending' | 'approved' | 'executed' | 'failed';
    executedAt?: Date;
    rollbackData?: any;
}
/**
 * Core registry management service for capability lifecycle management
 * Handles placeholder ID conversion and registry integrity
 */
export declare class RegistryManager {
    private approvalWorkflow;
    private registryPath;
    private capabilityRegistry;
    private placeholderCapabilities;
    private activeConversions;
    private pendingOperations;
    constructor(registryPath?: string);
    /**
     * Register a new placeholder capability during concept exploration
     */
    registerPlaceholderCapability(placeholderData: Omit<PlaceholderCapability, 'createdAt' | 'updatedAt'>): Promise<string>;
    /**
     * Propose conversion of placeholder ID to final capability ID
     */
    proposeCapabilityConversion(placeholderId: string, finalCapabilityId: string, reason?: CapabilityConversion['conversionReason']): Promise<CapabilityConversion>;
    /**
     * Execute approved capability conversion
     */
    executeCapabilityConversion(conversionId: string, approvalId: string): Promise<{
        success: boolean;
        finalCapabilityId?: string;
        error?: string;
    }>;
    /**
     * Get capability registry entry by ID
     */
    getCapability(capabilityId: string): CapabilityRegistryEntry | null;
    /**
     * Get placeholder capability by ID
     */
    getPlaceholderCapability(placeholderId: string): PlaceholderCapability | null;
    /**
     * Update placeholder capability maturity level
     */
    updatePlaceholderMaturity(placeholderId: string, maturityLevel: PlaceholderCapability['maturityLevel']): Promise<void>;
    /**
     * List all placeholder capabilities by maturity level
     */
    getPlaceholdersByMaturity(maturityLevel?: PlaceholderCapability['maturityLevel']): PlaceholderCapability[];
    /**
     * List all capabilities by domain
     */
    getCapabilitiesByDomain(domain: string): CapabilityRegistryEntry[];
    /**
     * Get conversion by ID
     */
    getConversion(conversionId: string): CapabilityConversion | null;
    /**
     * List active conversions by status
     */
    getConversionsByStatus(status?: CapabilityConversion['conversionStatus']): CapabilityConversion[];
    /**
     * Get registry statistics
     */
    getRegistryStatistics(): {
        totalCapabilities: number;
        capabilitiesByDomain: Map<string, number>;
        capabilitiesByStatus: Map<string, number>;
        totalPlaceholders: number;
        placeholdersByMaturity: Map<string, number>;
        activeConversions: number;
        conversionsByStatus: Map<string, number>;
    };
    private loadRegistryFromFile;
    private persistRegistryData;
    private persistPlaceholderData;
    private persistConversionData;
    private submitConversionForApproval;
    private generateConversionApprovalDescription;
    private generateConversionId;
    private extractMigrationId;
    private fileExists;
}
//# sourceMappingURL=registry-manager.d.ts.map
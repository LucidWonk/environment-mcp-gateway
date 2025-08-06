/**
 * Placeholder ID Tracker Service
 * Tracks placeholder ID lifecycle and prevents registry pollution
 * Implements TEMP-CONTEXT-ENGINE-a7b3 placeholder lifecycle management capability
 */
export interface PlaceholderIDInfo {
    placeholderId: string;
    domain: string;
    name: string;
    suffix: string;
    sourceDocument: string;
    lifecycle: PlaceholderLifecycleStage;
    createdAt: Date;
    lastUpdated: Date;
    transitions: PlaceholderTransition[];
    metadata: {
        businessConcepts?: string[];
        integrationPoints?: string[];
        maturityIndicators?: string[];
    };
}
export type PlaceholderLifecycleStage = 'concept-exploration' | 'domain-discovery' | 'implementation-active' | 'ready-for-conversion' | 'conversion-pending' | 'conversion-approved' | 'converted' | 'abandoned' | 'deprecated';
export interface PlaceholderTransition {
    from: PlaceholderLifecycleStage;
    to: PlaceholderLifecycleStage;
    timestamp: Date;
    reason: string;
    triggeredBy: 'system' | 'user' | 'migration' | 'approval';
    metadata?: any;
}
export interface PlaceholderGenerationRequest {
    domain: string;
    name: string;
    sourceDocument: string;
    businessConcepts?: string[];
    integrationPoints?: string[];
}
export interface PlaceholderValidationResult {
    isValid: boolean;
    placeholderId: string;
    format: 'TEMP-DOMAIN-NAME-SUFFIX';
    issues: string[];
    suggestions: string[];
}
/**
 * Manages placeholder ID lifecycle and prevents registry pollution
 * Ensures placeholder IDs never enter the main capability registry
 */
export declare class PlaceholderTracker {
    private placeholderRegistry;
    private trackerDataPath;
    private maxHistorySize;
    constructor(trackerDataPath?: string);
    /**
     * Generate a new placeholder ID following the TEMP-[DOMAIN]-[NAME]-[SUFFIX] format
     */
    generatePlaceholderID(request: PlaceholderGenerationRequest): Promise<string>;
    /**
     * Validate placeholder ID format and existence
     */
    validatePlaceholderID(placeholderId: string): PlaceholderValidationResult;
    /**
     * Transition placeholder to next lifecycle stage
     */
    transitionPlaceholderLifecycle(placeholderId: string, newStage: PlaceholderLifecycleStage, reason: string, triggeredBy?: PlaceholderTransition['triggeredBy'], metadata?: any): Promise<void>;
    /**
     * Get placeholder information by ID
     */
    getPlaceholderInfo(placeholderId: string): PlaceholderIDInfo | null;
    /**
     * List placeholders by lifecycle stage
     */
    getPlaceholdersByStage(stage: PlaceholderLifecycleStage): PlaceholderIDInfo[];
    /**
     * List placeholders by domain
     */
    getPlaceholdersByDomain(domain: string): PlaceholderIDInfo[];
    /**
     * Find placeholders by source document
     */
    getPlaceholdersByDocument(sourceDocument: string): PlaceholderIDInfo[];
    /**
     * Mark placeholder as ready for conversion
     */
    markReadyForConversion(placeholderId: string, maturityIndicators: string[]): Promise<void>;
    /**
     * Mark placeholder as converted and record final capability ID
     */
    markAsConverted(placeholderId: string, finalCapabilityId: string, conversionId: string): Promise<void>;
    /**
     * Get placeholder lifecycle statistics
     */
    getLifecycleStatistics(): {
        totalPlaceholders: number;
        byStage: Map<PlaceholderLifecycleStage, number>;
        byDomain: Map<string, number>;
        conversionRate: number;
        averageLifecycleDuration: number;
        recentTransitions: PlaceholderTransition[];
    };
    /**
     * Clean up old placeholder records to prevent memory bloat
     */
    cleanupOldPlaceholders(retentionDays?: number): Promise<{
        removed: number;
        retained: number;
    }>;
    private sanitizeDomainName;
    private sanitizeCapabilityName;
    private generateRandomSuffix;
    private isValidTransition;
    private checkRegistryPollution;
    private loadTrackerData;
    private persistTrackerData;
    private fileExists;
}
//# sourceMappingURL=placeholder-tracker.d.ts.map
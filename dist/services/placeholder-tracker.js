/**
 * Placeholder ID Tracker Service
 * Tracks placeholder ID lifecycle and prevents registry pollution
 * Implements TEMP-CONTEXT-ENGINE-a7b3 placeholder lifecycle management capability
 */
import * as fs from 'fs';
// import * as path from 'path';
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('mcp-gateway.log');
/**
 * Manages placeholder ID lifecycle and prevents registry pollution
 * Ensures placeholder IDs never enter the main capability registry
 */
export class PlaceholderTracker {
    placeholderRegistry = new Map();
    trackerDataPath;
    maxHistorySize = 10000; // Maximum number of placeholder records to keep
    constructor(trackerDataPath = './placeholder-tracker.json') {
        this.trackerDataPath = trackerDataPath;
        this.loadTrackerData();
    }
    /**
     * Generate a new placeholder ID following the TEMP-[DOMAIN]-[NAME]-[SUFFIX] format
     */
    async generatePlaceholderID(request) {
        logger.info(`Generating placeholder ID for ${request.domain}/${request.name}`);
        try {
            const cleanDomain = this.sanitizeDomainName(request.domain);
            const cleanName = this.sanitizeCapabilityName(request.name);
            const suffix = this.generateRandomSuffix();
            const placeholderId = `TEMP-${cleanDomain}-${cleanName}-${suffix}`;
            // Ensure uniqueness
            if (this.placeholderRegistry.has(placeholderId)) {
                // Regenerate with new suffix if collision occurs (very rare)
                return this.generatePlaceholderID(request);
            }
            // Create placeholder info
            const placeholderInfo = {
                placeholderId,
                domain: request.domain,
                name: request.name,
                suffix,
                sourceDocument: request.sourceDocument,
                lifecycle: 'concept-exploration',
                createdAt: new Date(),
                lastUpdated: new Date(),
                transitions: [{
                        from: 'concept-exploration', // Initial state
                        to: 'concept-exploration',
                        timestamp: new Date(),
                        reason: 'Initial placeholder creation',
                        triggeredBy: 'system'
                    }],
                metadata: {
                    businessConcepts: request.businessConcepts || [],
                    integrationPoints: request.integrationPoints || [],
                    maturityIndicators: []
                }
            };
            this.placeholderRegistry.set(placeholderId, placeholderInfo);
            await this.persistTrackerData();
            logger.info(`Placeholder ID generated: ${placeholderId}`);
            return placeholderId;
        }
        catch (error) {
            logger.error(`Failed to generate placeholder ID for ${request.domain}/${request.name}:`, error);
            throw new Error(`Placeholder generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate placeholder ID format and existence
     */
    validatePlaceholderID(placeholderId) {
        const result = {
            isValid: false,
            placeholderId,
            format: 'TEMP-DOMAIN-NAME-SUFFIX',
            issues: [],
            suggestions: []
        };
        // Format validation
        const formatRegex = /^TEMP-([A-Z]+)-([A-Z0-9]+)-([a-z0-9]{4})$/;
        const match = placeholderId.match(formatRegex);
        if (!match) {
            result.issues.push('Invalid format. Expected: TEMP-[DOMAIN]-[NAME]-[4-char-suffix]');
            result.suggestions.push('Ensure format follows TEMP-ANALYSIS-FRACTAL-a7b3 pattern');
            return result;
        }
        const [, domain, name, suffix] = match;
        // Validate components
        if (domain.length < 2 || domain.length > 20) {
            result.issues.push('Domain component must be 2-20 characters');
        }
        if (name.length < 2 || name.length > 30) {
            result.issues.push('Name component must be 2-30 characters');
        }
        if (suffix.length !== 4) {
            result.issues.push('Suffix must be exactly 4 characters');
        }
        // Check if exists in our registry
        const exists = this.placeholderRegistry.has(placeholderId);
        if (!exists) {
            result.issues.push('Placeholder ID not found in tracker registry');
            result.suggestions.push('Generate the placeholder ID through the tracker system');
        }
        // Check for main registry pollution (placeholder IDs should never be in main registry)
        const isPolluted = this.checkRegistryPollution(placeholderId);
        if (isPolluted) {
            result.issues.push('CRITICAL: Placeholder ID found in main capability registry (pollution detected)');
            result.suggestions.push('Remove from main registry immediately and investigate cause');
        }
        result.isValid = result.issues.length === 0;
        return result;
    }
    /**
     * Transition placeholder to next lifecycle stage
     */
    async transitionPlaceholderLifecycle(placeholderId, newStage, reason, triggeredBy = 'system', metadata) {
        logger.info(`Transitioning placeholder ${placeholderId} to ${newStage}`);
        const placeholder = this.placeholderRegistry.get(placeholderId);
        if (!placeholder) {
            throw new Error(`Placeholder not found: ${placeholderId}`);
        }
        const currentStage = placeholder.lifecycle;
        // Validate transition is allowed
        if (!this.isValidTransition(currentStage, newStage)) {
            throw new Error(`Invalid lifecycle transition: ${currentStage} -> ${newStage}`);
        }
        // Record transition
        const transition = {
            from: currentStage,
            to: newStage,
            timestamp: new Date(),
            reason,
            triggeredBy,
            metadata
        };
        placeholder.transitions.push(transition);
        placeholder.lifecycle = newStage;
        placeholder.lastUpdated = new Date();
        await this.persistTrackerData();
        logger.info(`Placeholder lifecycle transitioned: ${placeholderId} ${currentStage} -> ${newStage}`);
    }
    /**
     * Get placeholder information by ID
     */
    getPlaceholderInfo(placeholderId) {
        return this.placeholderRegistry.get(placeholderId) || null;
    }
    /**
     * List placeholders by lifecycle stage
     */
    getPlaceholdersByStage(stage) {
        return Array.from(this.placeholderRegistry.values())
            .filter(p => p.lifecycle === stage);
    }
    /**
     * List placeholders by domain
     */
    getPlaceholdersByDomain(domain) {
        return Array.from(this.placeholderRegistry.values())
            .filter(p => p.domain === domain);
    }
    /**
     * Find placeholders by source document
     */
    getPlaceholdersByDocument(sourceDocument) {
        return Array.from(this.placeholderRegistry.values())
            .filter(p => p.sourceDocument === sourceDocument);
    }
    /**
     * Mark placeholder as ready for conversion
     */
    async markReadyForConversion(placeholderId, maturityIndicators) {
        const placeholder = this.placeholderRegistry.get(placeholderId);
        if (!placeholder) {
            throw new Error(`Placeholder not found: ${placeholderId}`);
        }
        placeholder.metadata.maturityIndicators = maturityIndicators;
        await this.transitionPlaceholderLifecycle(placeholderId, 'ready-for-conversion', `Maturity indicators met: ${maturityIndicators.join(', ')}`, 'system', { maturityIndicators });
    }
    /**
     * Mark placeholder as converted and record final capability ID
     */
    async markAsConverted(placeholderId, finalCapabilityId, conversionId) {
        await this.transitionPlaceholderLifecycle(placeholderId, 'converted', `Converted to final capability: ${finalCapabilityId}`, 'system', { finalCapabilityId, conversionId });
    }
    /**
     * Get placeholder lifecycle statistics
     */
    getLifecycleStatistics() {
        const placeholders = Array.from(this.placeholderRegistry.values());
        const byStage = new Map();
        const byDomain = new Map();
        placeholders.forEach(placeholder => {
            byStage.set(placeholder.lifecycle, (byStage.get(placeholder.lifecycle) || 0) + 1);
            byDomain.set(placeholder.domain, (byDomain.get(placeholder.domain) || 0) + 1);
        });
        const convertedCount = byStage.get('converted') || 0;
        const conversionRate = placeholders.length > 0 ? convertedCount / placeholders.length : 0;
        // Calculate average lifecycle duration for converted placeholders
        const convertedPlaceholders = placeholders.filter(p => p.lifecycle === 'converted');
        const averageLifecycleDuration = convertedPlaceholders.length > 0
            ? convertedPlaceholders.reduce((sum, p) => {
                return sum + (p.lastUpdated.getTime() - p.createdAt.getTime());
            }, 0) / convertedPlaceholders.length
            : 0;
        // Get recent transitions (last 50)
        const allTransitions = placeholders
            .flatMap(p => p.transitions.map(t => ({ ...t, placeholderId: p.placeholderId })))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50);
        return {
            totalPlaceholders: placeholders.length,
            byStage,
            byDomain,
            conversionRate,
            averageLifecycleDuration,
            recentTransitions: allTransitions
        };
    }
    /**
     * Clean up old placeholder records to prevent memory bloat
     */
    async cleanupOldPlaceholders(retentionDays = 365) {
        logger.info(`Starting placeholder cleanup with ${retentionDays} day retention`);
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        let removed = 0;
        let retained = 0;
        for (const [placeholderId, placeholder] of this.placeholderRegistry.entries()) {
            // Only remove placeholders that are in final states and old enough
            const isFinalState = ['converted', 'abandoned', 'deprecated'].includes(placeholder.lifecycle);
            const isOldEnough = placeholder.lastUpdated < cutoffDate;
            if (isFinalState && isOldEnough) {
                this.placeholderRegistry.delete(placeholderId);
                removed++;
            }
            else {
                retained++;
            }
        }
        await this.persistTrackerData();
        logger.info(`Placeholder cleanup completed: ${removed} removed, ${retained} retained`);
        return { removed, retained };
    }
    // Private helper methods
    sanitizeDomainName(domain) {
        return domain
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 20);
    }
    sanitizeCapabilityName(name) {
        return name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 30);
    }
    generateRandomSuffix() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    isValidTransition(from, to) {
        const allowedTransitions = {
            'concept-exploration': ['domain-discovery', 'abandoned'],
            'domain-discovery': ['implementation-active', 'abandoned'],
            'implementation-active': ['ready-for-conversion', 'abandoned'],
            'ready-for-conversion': ['conversion-pending', 'implementation-active', 'abandoned'],
            'conversion-pending': ['conversion-approved', 'ready-for-conversion', 'abandoned'],
            'conversion-approved': ['converted', 'abandoned'],
            'converted': ['deprecated'],
            'abandoned': ['deprecated'],
            'deprecated': [] // Final state
        };
        return allowedTransitions[from]?.includes(to) || false;
    }
    checkRegistryPollution(_placeholderId) {
        // In a real implementation, this would check the main capability registry
        // For now, we simulate this check
        // This is critical - placeholder IDs should NEVER appear in the main registry
        return false;
    }
    async loadTrackerData() {
        try {
            if (await this.fileExists(this.trackerDataPath)) {
                const data = await fs.promises.readFile(this.trackerDataPath, 'utf-8');
                const trackerData = JSON.parse(data);
                if (trackerData.placeholders) {
                    Object.entries(trackerData.placeholders).forEach(([id, info]) => {
                        this.placeholderRegistry.set(id, {
                            ...info,
                            createdAt: new Date(info.createdAt),
                            lastUpdated: new Date(info.lastUpdated),
                            transitions: info.transitions.map((t) => ({
                                ...t,
                                timestamp: new Date(t.timestamp)
                            }))
                        });
                    });
                }
                logger.info(`Loaded ${this.placeholderRegistry.size} placeholder records from tracker data`);
            }
        }
        catch (error) {
            logger.warn('Failed to load placeholder tracker data:', error);
        }
    }
    async persistTrackerData() {
        try {
            const trackerData = {
                placeholders: Object.fromEntries(this.placeholderRegistry),
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    totalRecords: this.placeholderRegistry.size,
                    version: '1.0.0'
                }
            };
            await fs.promises.writeFile(this.trackerDataPath, JSON.stringify(trackerData, null, 2), 'utf-8');
        }
        catch (error) {
            logger.error('Failed to persist placeholder tracker data:', error);
            throw error;
        }
    }
    async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=placeholder-tracker.js.map
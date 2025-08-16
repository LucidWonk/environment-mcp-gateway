/**
 * Registry Management Service
 * Manages capability registry lifecycle, placeholder ID conversion, and registry integrity
 * Implements TEMP-CONTEXT-ENGINE-a7b3 registry lifecycle management capability
 */
import * as fs from 'fs';
// import * as path from 'path';
import { ApprovalWorkflowManager } from './approval-workflow.js';
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('mcp-gateway.log');
/**
 * Core registry management service for capability lifecycle management
 * Handles placeholder ID conversion and registry integrity
 */
export class RegistryManager {
    approvalWorkflow;
    registryPath;
    capabilityRegistry = new Map();
    placeholderCapabilities = new Map();
    activeConversions = new Map();
    pendingOperations = new Map();
    constructor(registryPath = './capability-registry.json') {
        this.registryPath = registryPath;
        this.approvalWorkflow = new ApprovalWorkflowManager();
        this.loadRegistryFromFile();
    }
    /**
     * Register a new placeholder capability during concept exploration
     */
    async registerPlaceholderCapability(placeholderData) {
        logger.info(`Registering placeholder capability: ${placeholderData.placeholderId}`);
        try {
            const placeholder = {
                ...placeholderData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.placeholderCapabilities.set(placeholderData.placeholderId, placeholder);
            await this.persistPlaceholderData();
            logger.info(`Placeholder capability registered: ${placeholderData.placeholderId}`);
            return placeholderData.placeholderId;
        }
        catch (error) {
            logger.error(`Failed to register placeholder capability ${placeholderData.placeholderId}:`, error);
            throw new Error(`Placeholder registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Propose conversion of placeholder ID to final capability ID
     */
    async proposeCapabilityConversion(placeholderId, finalCapabilityId, reason = 'implementation-complete') {
        logger.info(`Proposing capability conversion: ${placeholderId} -> ${finalCapabilityId}`);
        const placeholder = this.placeholderCapabilities.get(placeholderId);
        if (!placeholder) {
            throw new Error(`Placeholder capability not found: ${placeholderId}`);
        }
        if (placeholder.maturityLevel !== 'ready-for-conversion') {
            throw new Error(`Placeholder ${placeholderId} not ready for conversion. Current maturity: ${placeholder.maturityLevel}`);
        }
        try {
            const conversionId = this.generateConversionId();
            // Generate proposed registry entry
            const proposedEntry = {
                id: finalCapabilityId,
                name: placeholder.name,
                description: placeholder.description,
                domain: placeholder.discoveredDomain,
                status: 'implemented',
                createdAt: new Date(),
                updatedAt: new Date(),
                version: '1.0.0',
                dependencies: [],
                tags: placeholder.businessConcepts,
                metadata: {
                    sourceDocument: placeholder.sourceDocument,
                    migrationId: this.extractMigrationId(placeholder.sourceDocument)
                }
            };
            const conversion = {
                conversionId,
                placeholderId,
                finalCapabilityId,
                proposedEntry,
                conversionReason: reason,
                approvalRequired: true, // Always require approval for conversions
                conversionStatus: 'pending',
                createdAt: new Date()
            };
            this.activeConversions.set(conversionId, conversion);
            // Submit for approval if required
            if (conversion.approvalRequired) {
                const approvalResult = await this.submitConversionForApproval(conversion);
                conversion.approvalId = approvalResult.approvalId;
            }
            await this.persistConversionData();
            logger.info(`Capability conversion proposed: ${conversionId}`);
            return conversion;
        }
        catch (error) {
            logger.error(`Failed to propose capability conversion ${placeholderId}:`, error);
            throw new Error(`Conversion proposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Execute approved capability conversion
     */
    async executeCapabilityConversion(conversionId, approvalId) {
        logger.info(`Executing capability conversion: ${conversionId}`);
        const conversion = this.activeConversions.get(conversionId);
        if (!conversion) {
            throw new Error(`Conversion not found: ${conversionId}`);
        }
        try {
            // Verify approval
            const approvalStatus = await this.approvalWorkflow.checkApproval(approvalId);
            if (approvalStatus !== 'approved') {
                return {
                    success: false,
                    error: `Conversion not approved. Status: ${approvalStatus}`
                };
            }
            // Execute the conversion
            this.capabilityRegistry.set(conversion.finalCapabilityId, conversion.proposedEntry);
            // Update conversion status
            conversion.conversionStatus = 'completed';
            conversion.completedAt = new Date();
            // Clean up placeholder (but keep for audit trail)
            const placeholder = this.placeholderCapabilities.get(conversion.placeholderId);
            if (placeholder) {
                placeholder.maturityLevel = 'ready-for-conversion'; // Keep as audit record
                placeholder.updatedAt = new Date();
            }
            // Persist changes
            await this.persistRegistryData();
            await this.persistConversionData();
            logger.info(`Capability conversion completed: ${conversion.finalCapabilityId}`);
            return {
                success: true,
                finalCapabilityId: conversion.finalCapabilityId
            };
        }
        catch (error) {
            conversion.conversionStatus = 'failed';
            conversion.completedAt = new Date();
            logger.error(`Capability conversion failed for ${conversionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get capability registry entry by ID
     */
    getCapability(capabilityId) {
        return this.capabilityRegistry.get(capabilityId) || null;
    }
    /**
     * Get placeholder capability by ID
     */
    getPlaceholderCapability(placeholderId) {
        return this.placeholderCapabilities.get(placeholderId) || null;
    }
    /**
     * Update placeholder capability maturity level
     */
    async updatePlaceholderMaturity(placeholderId, maturityLevel) {
        const placeholder = this.placeholderCapabilities.get(placeholderId);
        if (!placeholder) {
            throw new Error(`Placeholder capability not found: ${placeholderId}`);
        }
        placeholder.maturityLevel = maturityLevel;
        placeholder.updatedAt = new Date();
        await this.persistPlaceholderData();
        logger.info(`Placeholder maturity updated: ${placeholderId} -> ${maturityLevel}`);
    }
    /**
     * List all placeholder capabilities by maturity level
     */
    getPlaceholdersByMaturity(maturityLevel) {
        const placeholders = Array.from(this.placeholderCapabilities.values());
        if (maturityLevel) {
            return placeholders.filter(p => p.maturityLevel === maturityLevel);
        }
        return placeholders;
    }
    /**
     * List all capabilities by domain
     */
    getCapabilitiesByDomain(domain) {
        return Array.from(this.capabilityRegistry.values())
            .filter(cap => cap.domain === domain);
    }
    /**
     * Get conversion by ID
     */
    getConversion(conversionId) {
        return this.activeConversions.get(conversionId) || null;
    }
    /**
     * List active conversions by status
     */
    getConversionsByStatus(status) {
        const conversions = Array.from(this.activeConversions.values());
        if (status) {
            return conversions.filter(c => c.conversionStatus === status);
        }
        return conversions;
    }
    /**
     * Get registry statistics
     */
    getRegistryStatistics() {
        const capabilities = Array.from(this.capabilityRegistry.values());
        const placeholders = Array.from(this.placeholderCapabilities.values());
        const conversions = Array.from(this.activeConversions.values());
        const capabilitiesByDomain = new Map();
        const capabilitiesByStatus = new Map();
        capabilities.forEach(cap => {
            capabilitiesByDomain.set(cap.domain, (capabilitiesByDomain.get(cap.domain) || 0) + 1);
            capabilitiesByStatus.set(cap.status, (capabilitiesByStatus.get(cap.status) || 0) + 1);
        });
        const placeholdersByMaturity = new Map();
        placeholders.forEach(placeholder => {
            placeholdersByMaturity.set(placeholder.maturityLevel, (placeholdersByMaturity.get(placeholder.maturityLevel) || 0) + 1);
        });
        const conversionsByStatus = new Map();
        conversions.forEach(conversion => {
            conversionsByStatus.set(conversion.conversionStatus, (conversionsByStatus.get(conversion.conversionStatus) || 0) + 1);
        });
        return {
            totalCapabilities: capabilities.length,
            capabilitiesByDomain,
            capabilitiesByStatus,
            totalPlaceholders: placeholders.length,
            placeholdersByMaturity,
            activeConversions: conversions.length,
            conversionsByStatus
        };
    }
    // Private helper methods
    async loadRegistryFromFile() {
        try {
            if (await this.fileExists(this.registryPath)) {
                const data = await fs.promises.readFile(this.registryPath, 'utf-8');
                const registryData = JSON.parse(data);
                if (registryData.capabilities) {
                    Object.entries(registryData.capabilities).forEach(([id, entry]) => {
                        this.capabilityRegistry.set(id, {
                            ...entry,
                            createdAt: new Date(entry.createdAt),
                            updatedAt: new Date(entry.updatedAt)
                        });
                    });
                }
                if (registryData.placeholders) {
                    Object.entries(registryData.placeholders).forEach(([id, placeholder]) => {
                        this.placeholderCapabilities.set(id, {
                            ...placeholder,
                            createdAt: new Date(placeholder.createdAt),
                            updatedAt: new Date(placeholder.updatedAt)
                        });
                    });
                }
                if (registryData.conversions) {
                    Object.entries(registryData.conversions).forEach(([id, conversion]) => {
                        this.activeConversions.set(id, {
                            ...conversion,
                            createdAt: new Date(conversion.createdAt),
                            completedAt: conversion.completedAt ? new Date(conversion.completedAt) : undefined
                        });
                    });
                }
                logger.info('Registry data loaded from file');
            }
        }
        catch (error) {
            logger.warn('Failed to load registry data from file:', error);
        }
    }
    async persistRegistryData() {
        try {
            const registryData = {
                capabilities: Object.fromEntries(this.capabilityRegistry),
                placeholders: Object.fromEntries(this.placeholderCapabilities),
                conversions: Object.fromEntries(this.activeConversions),
                lastUpdated: new Date().toISOString()
            };
            await fs.promises.writeFile(this.registryPath, JSON.stringify(registryData, null, 2), 'utf-8');
            logger.info('Registry data persisted to file');
        }
        catch (error) {
            logger.error('Failed to persist registry data:', error);
            throw error;
        }
    }
    async persistPlaceholderData() {
        await this.persistRegistryData();
    }
    async persistConversionData() {
        await this.persistRegistryData();
    }
    async submitConversionForApproval(conversion) {
        const approvalRequest = {
            proposalId: conversion.conversionId,
            type: 'capability-registry',
            title: `Convert ${conversion.placeholderId} to ${conversion.finalCapabilityId}`,
            description: this.generateConversionApprovalDescription(conversion),
            details: {
                placeholderId: conversion.placeholderId,
                finalCapabilityId: conversion.finalCapabilityId,
                domain: conversion.proposedEntry.domain,
                reason: conversion.conversionReason,
                proposedEntry: conversion.proposedEntry
            },
            requiredApprovals: ['registry-manager', 'domain-architect'],
            priority: 'normal'
        };
        return await this.approvalWorkflow.submitRequest(approvalRequest);
    }
    generateConversionApprovalDescription(conversion) {
        return `Conversion of placeholder capability ${conversion.placeholderId} to final registry entry ${conversion.finalCapabilityId}. ` +
            `Domain: ${conversion.proposedEntry.domain}. ` +
            `Reason: ${conversion.conversionReason}. ` +
            'This conversion will register the capability permanently in the registry.';
    }
    generateConversionId() {
        return `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    extractMigrationId(sourceDocument) {
        // Extract migration ID from source document path if available
        const migrationMatch = sourceDocument.match(/migration-(\d+-[a-z0-9]+)/);
        return migrationMatch ? migrationMatch[1] : undefined;
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
//# sourceMappingURL=registry-manager.js.map
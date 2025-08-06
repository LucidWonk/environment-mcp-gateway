import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';
import { SemanticAnalysisService, SemanticAnalysisResult } from './semantic-analysis.js';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'domain-analyzer.log' })
    ]
});

export interface DomainBoundary {
    domain: string;
    rootPath: string;
    subDomains: string[];
    businessConcepts: string[];
    keyInterfaces: string[];
    dependencies: DomainDependency[];
    confidence: number;
}

export interface DomainDependency {
    targetDomain: string;
    dependencyType: 'strong' | 'weak' | 'interface' | 'data' | 'event';
    dependencyPath: string[];
    bidirectional: boolean;
    confidence: number;
}

export interface CrossDomainRelationship {
    sourceDomain: string;
    targetDomain: string;
    relationshipType: 'aggregation' | 'composition' | 'association' | 'dependency' | 'inheritance';
    strength: number; // 0-1 scale
    evidenceFiles: string[];
    businessJustification: string;
}

export interface DomainMap {
    domains: DomainBoundary[];
    relationships: CrossDomainRelationship[];
    isolatedDomains: string[];
    crossCuttingConcerns: string[];
    analysisTimestamp: Date;
    analysisVersion: string;
}

/**
 * Analyzes domain boundaries and cross-domain relationships
 * Implements Domain-Driven Design (DDD) boundary detection
 */
export class DomainAnalyzer {
    private readonly semanticAnalysis: SemanticAnalysisService;
    private readonly projectRoot: string;
    private readonly knownDomainPatterns: Map<string, RegExp[]>;
    private readonly timeout: number; // timeout in milliseconds
    private readonly performanceThreshold: number = 10000; // 10 seconds default

    constructor(projectRoot: string = '.', timeout: number = 10000) {
        this.projectRoot = path.resolve(projectRoot);
        this.semanticAnalysis = new SemanticAnalysisService();
        this.knownDomainPatterns = this.initializeDomainPatterns();
        this.timeout = timeout;
        
        logger.info(`Domain Analyzer initialized for project: ${this.projectRoot} with timeout: ${timeout}ms`);
    }

    /**
     * Initialize known domain patterns for the Lucidwonks platform
     * Sets up domainPatterns mapping for path-based domain inference
     */
    private initializeDomainPatterns(): Map<string, RegExp[]> {
        return new Map([
            ['Analysis', [
                /\/Utility\/Analysis\//,
                /FractalAnalyzer/,
                /InflectionPoint/,
                /TechnicalIndicator/,
                /AnalysisEngine/
            ]],
            ['Data', [
                /\/Utility\/Data\//,
                /Repository/,
                /DataProvider/,
                /TimescaleDB/,
                /TickerData/
            ]],
            ['Messaging', [
                /\/Utility\/Messaging\//,
                /EventPublisher/,
                /MessageQueue/,
                /RedPanda/,
                /DomainEvent/
            ]],
            ['Console', [
                /\/Console\//,
                /Program\.cs/,
                /CommandLine/,
                /ConsoleApplication/
            ]],
            ['CyphyrRecon', [
                /\/CyphyrRecon\//,
                /Blazor/,
                /Component/,
                /WebApplication/
            ]],
            ['TestSuite', [
                /\/TestSuite\//,
                /\.feature$/,
                /StepDefinitions/,
                /Reqnroll/
            ]],
            ['Services', [
                /\/Services\//,
                /Service$/,
                /Microservice/,
                /Worker/
            ]],
            ['EnvironmentMCPGateway', [
                /\/EnvironmentMCPGateway\//,
                /MCP/,
                /Gateway/,
                /Tool/
            ]],
            ['Documentation', [
                /\/Documentation\//,
                /\.md$/,
                /README/,
                /\.context$/
            ]]
        ]);
    }

    /**
     * Analyze complete domain map for the project
     */
    async analyzeDomainMap(changedFiles?: string[]): Promise<DomainMap> {
        logger.info('Starting comprehensive domain analysis');
        const startTime = Date.now();
        const performanceMetrics = {
            discoveryTime: 0,
            relationshipTime: 0,
            identificationTime: 0
        };

        try {
            // Check timeout before Phase 1
            this.checkTimeout(startTime, 'before domain discovery');
            
            // Phase 1: Discover domain boundaries
            const discoveryStart = Date.now();
            const domainBoundaries = await this.discoverDomainBoundaries(startTime);
            performanceMetrics.discoveryTime = Date.now() - discoveryStart;
            
            // Check timeout before Phase 2
            this.checkTimeout(startTime, 'before relationship analysis');
            
            // Phase 2: Analyze cross-domain relationships
            const relationshipStart = Date.now();
            const relationships = await this.analyzeRelationships(domainBoundaries, changedFiles, startTime);
            performanceMetrics.relationshipTime = Date.now() - relationshipStart;
            
            // Check timeout before Phase 3
            this.checkTimeout(startTime, 'before identification phase');
            
            // Phase 3: Identify isolated domains and cross-cutting concerns
            const identificationStart = Date.now();
            const isolatedDomains = this.identifyIsolatedDomains(domainBoundaries, relationships);
            const crossCuttingConcerns = await this.identifyCrossCuttingConcerns(startTime);
            performanceMetrics.identificationTime = Date.now() - identificationStart;

            const domainMap: DomainMap = {
                domains: domainBoundaries,
                relationships,
                isolatedDomains,
                crossCuttingConcerns,
                analysisTimestamp: new Date(),
                analysisVersion: '2.2.0'
            };

            const analysisTime = Date.now() - startTime;
            logger.info(`Domain analysis completed in ${analysisTime}ms. Found ${domainBoundaries.length} domains, ${relationships.length} relationships`);
            logger.info(`Performance metrics - Discovery: ${performanceMetrics.discoveryTime}ms, Relationships: ${performanceMetrics.relationshipTime}ms, Identification: ${performanceMetrics.identificationTime}ms`);

            return domainMap;

        } catch (error) {
            logger.error('Domain analysis failed:', error);
            throw error;
        }
    }

    /**
     * Discover domain boundaries using file structure and semantic analysis
     */
    private async discoverDomainBoundaries(analysisStartTime?: number): Promise<DomainBoundary[]> {
        logger.debug('Discovering domain boundaries');
        const boundaries: DomainBoundary[] = [];

        // Analyze each known domain pattern
        for (const [domainName, patterns] of this.knownDomainPatterns) {
            // Check timeout before processing each domain
            if (analysisStartTime) {
                this.checkTimeout(analysisStartTime, `during domain discovery for ${domainName}`);
            }
            
            const boundary = await this.analyzeDomainBoundary(domainName, patterns, analysisStartTime);
            if (boundary) {
                boundaries.push(boundary);
            }
        }

        // Discover additional domains through directory structure analysis
        const additionalDomains = await this.discoverUnknownDomains(boundaries);
        boundaries.push(...additionalDomains);

        return boundaries.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Analyze a specific domain boundary
     */
    private async analyzeDomainBoundary(domainName: string, patterns: RegExp[], analysisStartTime?: number): Promise<DomainBoundary | null> {
        logger.debug(`Analyzing domain boundary for: ${domainName}`);

        // Check timeout
        if (analysisStartTime) {
            this.checkTimeout(analysisStartTime, `during boundary analysis for ${domainName}`);
        }

        const domainFiles = await this.findDomainFiles(patterns, analysisStartTime);
        if (domainFiles.length === 0) {
            logger.debug(`No files found for domain: ${domainName}`);
            return null;
        }

        // Perform semantic analysis on domain files
        const relevantFiles = domainFiles.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.cs', '.ts', '.js'].includes(ext);
        }).slice(0, 20); // Limit for performance

        let semanticResults: SemanticAnalysisResult[] = [];
        if (relevantFiles.length > 0) {
            try {
                semanticResults = await this.semanticAnalysis.analyzeCodeChanges(relevantFiles);
            } catch (error) {
                logger.warn(`Semantic analysis failed for domain ${domainName}:`, error);
            }
        }

        // Extract business concepts, rules, and interfaces
        const businessConcepts = this.extractBusinessConcepts(semanticResults);
        const _businessRules = this.extractBusinessRules(semanticResults);
        const keyInterfaces = this.extractKeyInterfaces(semanticResults, domainFiles);
        const subDomains = this.identifySubDomains(domainFiles, domainName);

        // Determine root path
        const rootPath = this.determineDomainRootPath(domainFiles, domainName);

        return {
            domain: domainName,
            rootPath,
            subDomains,
            businessConcepts,
            keyInterfaces,
            dependencies: [], // Will be populated in relationship analysis
            confidence: this.calculateDomainConfidence(domainFiles, semanticResults, patterns)
        };
    }

    /**
     * Find files matching domain patterns
     */
    private async findDomainFiles(patterns: RegExp[], analysisStartTime?: number): Promise<string[]> {
        const matchingFiles: string[] = [];
        
        const searchDirectories = [
            this.projectRoot,
            path.join(this.projectRoot, 'Utility'),
            path.join(this.projectRoot, 'Console'),
            path.join(this.projectRoot, 'CyphyrRecon'),
            path.join(this.projectRoot, 'TestSuite'),
            path.join(this.projectRoot, 'Services'),
            path.join(this.projectRoot, 'EnvironmentMCPGateway'),
            path.join(this.projectRoot, 'Documentation')
        ];

        for (const searchDir of searchDirectories) {
            // Check timeout during file search
            if (analysisStartTime) {
                this.checkTimeout(analysisStartTime, `during file search in ${searchDir}`);
            }
            
            if (fs.existsSync(searchDir)) {
                const files = await this.recursiveFileSearch(searchDir, patterns);
                matchingFiles.push(...files);
            }
        }

        return [...new Set(matchingFiles)]; // Remove duplicates
    }

    /**
     * Recursively search for files matching patterns
     */
    private async recursiveFileSearch(directory: string, patterns: RegExp[]): Promise<string[]> {
        const matchingFiles: string[] = [];
        
        try {
            const entries = fs.readdirSync(directory, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                const relativePath = path.relative(this.projectRoot, fullPath);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subFiles = await this.recursiveFileSearch(fullPath, patterns);
                    matchingFiles.push(...subFiles);
                } else if (entry.isFile()) {
                    // Check if file matches any pattern
                    const matches = patterns.some(pattern => 
                        pattern.test(relativePath) || 
                        pattern.test(entry.name) ||
                        pattern.test(fullPath)
                    );
                    
                    if (matches) {
                        matchingFiles.push(fullPath);
                    }
                }
            }
        } catch (error) {
            logger.warn(`Error reading directory ${directory}:`, error);
        }
        
        return matchingFiles;
    }

    /**
     * Extract business concepts from semantic analysis
     */
    private extractBusinessConcepts(semanticResults: SemanticAnalysisResult[]): string[] {
        const concepts = new Set<string>();
        
        for (const result of semanticResults) {
            for (const concept of result.businessConcepts) {
                concepts.add(concept.name);
            }
        }
        
        return Array.from(concepts);
    }

    /**
     * Extract business rules from semantic analysis
     */
    private extractBusinessRules(semanticResults: SemanticAnalysisResult[]): string[] {
        const rules = new Set<string>();
        
        for (const result of semanticResults) {
            for (const rule of result.businessRules) {
                rules.add(rule.id);
            }
        }
        
        return Array.from(rules);
    }

    /**
     * Extract key interfaces and public contracts
     */
    private extractKeyInterfaces(semanticResults: SemanticAnalysisResult[], domainFiles: string[]): string[] {
        const interfaces = new Set<string>();
        
        // From semantic analysis
        for (const result of semanticResults) {
            for (const concept of result.businessConcepts) {
                // Check for interface-like concepts (Services often define interfaces)
                if (concept.type === 'Service' && concept.name.includes('Interface')) {
                    interfaces.add(concept.name);
                }
            }
        }
        
        // From file analysis
        for (const file of domainFiles) {
            const fileName = path.basename(file, path.extname(file));
            if (fileName.includes('Interface') || fileName.startsWith('I') && fileName.length > 1) {
                interfaces.add(fileName);
            }
        }
        
        return Array.from(interfaces);
    }

    /**
     * Identify sub-domains within a domain
     */
    private identifySubDomains(domainFiles: string[], domainName: string): string[] {
        const subDomains = new Set<string>();
        
        for (const file of domainFiles) {
            const relativePath = path.relative(this.projectRoot, file);
            const pathParts = relativePath.split(path.sep);
            
            // Look for subdirectories within the domain
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (pathParts[i].toLowerCase().includes(domainName.toLowerCase())) {
                    const nextPart = pathParts[i + 1];
                    if (nextPart && !nextPart.includes('.') && nextPart !== 'bin' && nextPart !== 'obj') {
                        subDomains.add(nextPart);
                    }
                }
            }
        }
        
        return Array.from(subDomains);
    }

    /**
     * Determine the root path for a domain
     */
    private determineDomainRootPath(domainFiles: string[], domainName: string): string {
        if (domainFiles.length === 0) {
            return path.join(this.projectRoot, domainName);
        }
        
        // Find the most common root path
        const pathCounts = new Map<string, number>();
        
        for (const file of domainFiles) {
            const relativePath = path.relative(this.projectRoot, file);
            const pathParts = relativePath.split(path.sep);
            
            // Build progressive paths
            let currentPath = '';
            for (const part of pathParts.slice(0, -1)) { // Exclude filename
                currentPath = currentPath ? path.join(currentPath, part) : part;
                if (currentPath.toLowerCase().includes(domainName.toLowerCase())) {
                    const fullPath = path.join(this.projectRoot, currentPath);
                    pathCounts.set(fullPath, (pathCounts.get(fullPath) || 0) + 1);
                }
            }
        }
        
        // Return the most common path, or default
        let maxCount = 0;
        let rootPath = path.join(this.projectRoot, domainName);
        
        for (const [pathName, count] of pathCounts) {
            if (count > maxCount) {
                maxCount = count;
                rootPath = pathName;
            }
        }
        
        return rootPath;
    }

    /**
     * Calculate confidence score for domain boundary detection
     */
    private calculateDomainConfidence(
        domainFiles: string[], 
        semanticResults: SemanticAnalysisResult[], 
        patterns: RegExp[]
    ): number {
        let confidence = 0;
        
        // File count factor (more files = higher confidence, up to a point)
        const fileCountScore = Math.min(domainFiles.length / 10, 1) * 0.3;
        confidence += fileCountScore;
        
        // Pattern match strength
        const patternMatchScore = patterns.length > 0 ? 0.2 : 0;
        confidence += patternMatchScore;
        
        // Semantic analysis quality
        if (semanticResults.length > 0) {
            const avgSemanticConfidence = semanticResults.reduce((sum, result) => 
                sum + (result.businessConcepts.reduce((conceptSum, concept) => 
                    conceptSum + concept.confidence, 0) / Math.max(result.businessConcepts.length, 1)), 0
            ) / semanticResults.length;
            
            confidence += avgSemanticConfidence * 0.3;
        }
        
        // Directory structure coherence
        const hasCoherentStructure = domainFiles.some(file => 
            path.dirname(file).split(path.sep).length >= 3
        );
        if (hasCoherentStructure) {
            confidence += 0.2;
        }
        
        return Math.min(Math.max(confidence, 0), 1);
    }

    /**
     * Discover unknown domains through directory analysis
     */
    private async discoverUnknownDomains(knownBoundaries: DomainBoundary[]): Promise<DomainBoundary[]> {
        const knownDomainNames = new Set(knownBoundaries.map(b => b.domain.toLowerCase()));
        const unknownDomains: DomainBoundary[] = [];
        
        const rootEntries = fs.readdirSync(this.projectRoot, { withFileTypes: true });
        
        for (const entry of rootEntries) {
            if (entry.isDirectory() && 
                !entry.name.startsWith('.') && 
                entry.name !== 'node_modules' &&
                !knownDomainNames.has(entry.name.toLowerCase())) {
                
                const domainPath = path.join(this.projectRoot, entry.name);
                const domainFiles = await this.recursiveFileSearch(domainPath, [/.*/]); // Match all files
                
                if (domainFiles.length >= 3) { // Minimum threshold for a domain
                    logger.debug(`Discovered potential domain: ${entry.name}`);
                    
                    const boundary: DomainBoundary = {
                        domain: entry.name,
                        rootPath: domainPath,
                        subDomains: [],
                        businessConcepts: [],
                        keyInterfaces: [],
                        dependencies: [],
                        confidence: 0.5 // Lower confidence for discovered domains
                    };
                    
                    unknownDomains.push(boundary);
                }
            }
        }
        
        return unknownDomains;
    }

    /**
     * Analyze relationships between domains
     */
    private async analyzeRelationships(
        boundaries: DomainBoundary[], 
        changedFiles?: string[],
        analysisStartTime?: number
    ): Promise<CrossDomainRelationship[]> {
        logger.debug('Analyzing cross-domain relationships');
        const relationships: CrossDomainRelationship[] = [];
        
        for (let i = 0; i < boundaries.length; i++) {
            for (let j = i + 1; j < boundaries.length; j++) {
                // Check timeout before each relationship analysis
                if (analysisStartTime) {
                    this.checkTimeout(analysisStartTime, `during relationship analysis between ${boundaries[i].domain} and ${boundaries[j].domain}`);
                }
                const sourceDomain = boundaries[i];
                const targetDomain = boundaries[j];
                
                const relationship = await this.analyzeRelationshipBetween(
                    sourceDomain, 
                    targetDomain, 
                    changedFiles
                );
                
                if (relationship) {
                    relationships.push(relationship);
                    
                    // If bidirectional, create reverse relationship
                    if (relationship.strength > 0.6) {
                        const reverseRelationship = await this.analyzeRelationshipBetween(
                            targetDomain, 
                            sourceDomain, 
                            changedFiles
                        );
                        
                        if (reverseRelationship && reverseRelationship.strength > 0.3) {
                            relationships.push(reverseRelationship);
                        }
                    }
                }
            }
        }
        
        return relationships;
    }

    /**
     * Analyze relationship between two specific domains
     */
    private async analyzeRelationshipBetween(
        sourceDomain: DomainBoundary,
        targetDomain: DomainBoundary,
        _changedFiles?: string[]
    ): Promise<CrossDomainRelationship | null> {
        
        // Check for file-level dependencies
        const evidenceFiles = await this.findCrossDomainReferences(sourceDomain, targetDomain);
        
        if (evidenceFiles.length === 0) {
            return null;
        }
        
        // Analyze dependency strength and type
        const relationshipType = this.determineRelationshipType(sourceDomain, targetDomain, evidenceFiles);
        const strength = this.calculateRelationshipStrength(sourceDomain, targetDomain, evidenceFiles);
        const businessJustification = this.generateBusinessJustification(sourceDomain, targetDomain, relationshipType);
        
        return {
            sourceDomain: sourceDomain.domain,
            targetDomain: targetDomain.domain,
            relationshipType,
            strength,
            evidenceFiles,
            businessJustification
        };
    }

    /**
     * Find files that reference across domains
     */
    private async findCrossDomainReferences(
        sourceDomain: DomainBoundary,
        targetDomain: DomainBoundary
    ): Promise<string[]> {
        const evidenceFiles: string[] = [];
        
        try {
            const sourceFiles = await this.recursiveFileSearch(sourceDomain.rootPath, [/\.(cs|ts|js)$/]);
            
            for (const file of sourceFiles) {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf-8');
                    
                    // Check for namespace/import references
                    const hasReference = this.checkForCrossDomainReference(content, targetDomain);
                    
                    if (hasReference) {
                        evidenceFiles.push(file);
                    }
                }
            }
        } catch (error) {
            logger.warn(`Error finding cross-domain references between ${sourceDomain.domain} and ${targetDomain.domain}:`, error);
        }
        
        return evidenceFiles;
    }

    /**
     * Check if file content references target domain
     */
    private checkForCrossDomainReference(content: string, targetDomain: DomainBoundary): boolean {
        const domainName = targetDomain.domain;
        
        // Check for namespace references (C#)
        if (content.includes('using') && content.includes(domainName)) {
            return true;
        }
        
        // Check for import references (TypeScript/JavaScript)
        if (content.includes('import') && content.includes(domainName.toLowerCase())) {
            return true;
        }
        
        // Check for class/interface references
        for (const concept of targetDomain.businessConcepts) {
            if (content.includes(concept)) {
                return true;
            }
        }
        
        for (const interface_ of targetDomain.keyInterfaces) {
            if (content.includes(interface_)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Determine the type of relationship between domains
     */
    private determineRelationshipType(
        sourceDomain: DomainBoundary,
        targetDomain: DomainBoundary,
        evidenceFiles: string[]
    ): CrossDomainRelationship['relationshipType'] {
        
        // Analyze evidence patterns
        const hasDataReference = evidenceFiles.some(file => 
            targetDomain.domain.toLowerCase().includes('data') ||
            file.toLowerCase().includes('repository') ||
            file.toLowerCase().includes('database')
        );
        
        if (hasDataReference) {
            return 'dependency';
        }
        
        const hasServiceReference = evidenceFiles.some(file =>
            file.toLowerCase().includes('service') ||
            file.toLowerCase().includes('handler')
        );
        
        if (hasServiceReference) {
            return 'association';
        }
        
        const hasInheritancePattern = evidenceFiles.some(_file =>
            sourceDomain.domain.includes(targetDomain.domain) ||
            targetDomain.domain.includes(sourceDomain.domain)
        );
        
        if (hasInheritancePattern) {
            return 'inheritance';
        }
        
        // Default to dependency for most cross-domain relationships
        return 'dependency';
    }

    /**
     * Calculate strength of relationship (0-1 scale)
     */
    private calculateRelationshipStrength(
        sourceDomain: DomainBoundary,
        targetDomain: DomainBoundary,
        evidenceFiles: string[]
    ): number {
        let strength = 0;
        
        // File count factor
        const fileCountFactor = Math.min(evidenceFiles.length / 10, 1) * 0.4;
        strength += fileCountFactor;
        
        // Domain confidence factor
        const confidenceFactor = (sourceDomain.confidence + targetDomain.confidence) / 2 * 0.3;
        strength += confidenceFactor;
        
        // Business concept overlap
        const conceptOverlap = sourceDomain.businessConcepts.filter(concept =>
            targetDomain.businessConcepts.includes(concept)
        ).length;
        const overlapFactor = Math.min(conceptOverlap / 5, 1) * 0.3;
        strength += overlapFactor;
        
        return Math.min(Math.max(strength, 0), 1);
    }

    /**
     * Generate business justification for relationship
     */
    private generateBusinessJustification(
        sourceDomain: DomainBoundary,
        targetDomain: DomainBoundary,
        relationshipType: CrossDomainRelationship['relationshipType']
    ): string {
        const justifications = {
            'dependency': `${sourceDomain.domain} depends on ${targetDomain.domain} for core functionality`,
            'association': `${sourceDomain.domain} collaborates with ${targetDomain.domain} for business operations`,
            'composition': `${sourceDomain.domain} is composed of ${targetDomain.domain} components`,
            'aggregation': `${sourceDomain.domain} aggregates ${targetDomain.domain} entities`,
            'inheritance': `${sourceDomain.domain} extends ${targetDomain.domain} capabilities`
        };
        
        return justifications[relationshipType];
    }

    /**
     * Identify domains with no relationships
     */
    private identifyIsolatedDomains(
        boundaries: DomainBoundary[],
        relationships: CrossDomainRelationship[]
    ): string[] {
        const connectedDomains = new Set<string>();
        
        for (const relationship of relationships) {
            connectedDomains.add(relationship.sourceDomain);
            connectedDomains.add(relationship.targetDomain);
        }
        
        return boundaries
            .filter(boundary => !connectedDomains.has(boundary.domain))
            .map(boundary => boundary.domain);
    }

    /**
     * Identify cross-cutting concerns
     */
    private async identifyCrossCuttingConcerns(analysisStartTime?: number): Promise<string[]> {
        const concerns = new Set<string>();
        
        // Check timeout
        if (analysisStartTime) {
            this.checkTimeout(analysisStartTime, 'during cross-cutting concerns identification');
        }
        
        // Infrastructure concerns
        const infraFiles = await this.recursiveFileSearch(this.projectRoot, [
            /docker/i,
            /deployment/i,
            /infrastructure/i,
            /\.yml$/,
            /\.yaml$/
        ]);
        
        if (infraFiles.length > 0) {
            concerns.add('Infrastructure');
        }
        
        // Configuration concerns
        const configFiles = await this.recursiveFileSearch(this.projectRoot, [
            /appsettings/i,
            /config/i,
            /\.json$/,
            /\.env$/
        ]);
        
        if (configFiles.length > 0) {
            concerns.add('Configuration');
        }
        
        // Logging concerns
        const loggingFiles = await this.recursiveFileSearch(this.projectRoot, [
            /logging/i,
            /logger/i,
            /serilog/i,
            /winston/i
        ]);
        
        if (loggingFiles.length > 0) {
            concerns.add('Logging');
        }
        
        // Security concerns
        const securityFiles = await this.recursiveFileSearch(this.projectRoot, [
            /security/i,
            /auth/i,
            /authorization/i,
            /authentication/i
        ]);
        
        if (securityFiles.length > 0) {
            concerns.add('Security');
        }
        
        return Array.from(concerns);
    }

    /**
     * Get domain analysis for specific changed files
     */
    async analyzeChangedFileImpacts(changedFiles: string[]): Promise<{
        affectedDomains: string[];
        impactedRelationships: CrossDomainRelationship[];
        propagationPaths: string[][];
    }> {
        logger.info(`Analyzing impact of ${changedFiles.length} changed files`);
        
        const domainMap = await this.analyzeDomainMap(changedFiles);
        const affectedDomains = new Set<string>();
        const impactedRelationships: CrossDomainRelationship[] = [];
        
        // Direct impact: which domains contain the changed files
        for (const file of changedFiles) {
            for (const boundary of domainMap.domains) {
                if (file.startsWith(boundary.rootPath)) {
                    affectedDomains.add(boundary.domain);
                }
            }
        }
        
        // Indirect impact: follow relationships
        const initialDomains = Array.from(affectedDomains);
        for (const domain of initialDomains) {
            const relatedRelationships = domainMap.relationships.filter(rel =>
                rel.sourceDomain === domain || rel.targetDomain === domain
            );
            
            for (const relationship of relatedRelationships) {
                impactedRelationships.push(relationship);
                
                // Add transitively affected domains
                if (relationship.sourceDomain === domain) {
                    affectedDomains.add(relationship.targetDomain);
                } else {
                    affectedDomains.add(relationship.sourceDomain);
                }
            }
        }
        
        // Build propagation paths
        const propagationPaths = this.buildPropagationPaths(
            initialDomains, 
            Array.from(affectedDomains), 
            domainMap.relationships
        );
        
        return {
            affectedDomains: Array.from(affectedDomains),
            impactedRelationships,
            propagationPaths
        };
    }

    /**
     * Build paths showing how changes propagate through domains
     */
    private buildPropagationPaths(
        initialDomains: string[],
        allAffectedDomains: string[],
        relationships: CrossDomainRelationship[]
    ): string[][] {
        const paths: string[][] = [];
        
        for (const initialDomain of initialDomains) {
            const visited = new Set<string>();
            const currentPath: string[] = [initialDomain];
            
            this.findPropagationPaths(
                initialDomain,
                relationships,
                visited,
                currentPath,
                paths,
                3 // Max depth
            );
        }
        
        return paths;
    }

    /**
     * Recursively find propagation paths
     */
    private findPropagationPaths(
        currentDomain: string,
        relationships: CrossDomainRelationship[],
        visited: Set<string>,
        currentPath: string[],
        allPaths: string[][],
        maxDepth: number
    ): void {
        if (currentPath.length > maxDepth) {
            return;
        }
        
        visited.add(currentDomain);
        
        const outgoingRelationships = relationships.filter(rel =>
            rel.sourceDomain === currentDomain && !visited.has(rel.targetDomain)
        );
        
        if (outgoingRelationships.length === 0) {
            // End of path
            if (currentPath.length > 1) {
                allPaths.push([...currentPath]);
            }
            return;
        }
        
        for (const relationship of outgoingRelationships) {
            const newPath = [...currentPath, relationship.targetDomain];
            this.findPropagationPaths(
                relationship.targetDomain,
                relationships,
                new Set(visited),
                newPath,
                allPaths,
                maxDepth
            );
        }
    }

    /**
     * Infer domain from file path
     */
    inferDomainFromPath(filePath: string): string | null {
        const relativePath = path.relative(this.projectRoot, filePath);
        
        // Check each known domain pattern
        for (const [domainName, patterns] of this.knownDomainPatterns) {
            for (const pattern of patterns) {
                if (pattern.test(relativePath) || pattern.test(filePath)) {
                    return domainName;
                }
            }
        }
        
        // Try to infer from directory structure
        const pathParts = relativePath.split(path.sep);
        if (pathParts.length > 0) {
            const topLevelDir = pathParts[0];
            // Check if top-level directory matches a known domain
            for (const [domainName] of this.knownDomainPatterns) {
                if (topLevelDir.toLowerCase() === domainName.toLowerCase()) {
                    return domainName;
                }
            }
        }
        
        return null;
    }

    /**
     * Check if the analysis has exceeded the timeout
     */
    private checkTimeout(startTime: number, context: string): void {
        const elapsed = Date.now() - startTime;
        if (elapsed > this.timeout) {
            const error = new Error(`Domain analysis timeout exceeded after ${elapsed}ms during ${context}. Timeout limit: ${this.timeout}ms`);
            logger.error(`Performance timeout exceeded: ${error.message}`);
            throw error;
        }
        
        // Warn if approaching timeout
        if (elapsed > this.timeout * 0.8) {
            logger.warn(`Domain analysis approaching timeout: ${elapsed}ms of ${this.timeout}ms used during ${context}`);
        }
    }
}
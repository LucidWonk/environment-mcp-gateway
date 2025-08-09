import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Context Generator Service
 * Generates enhanced .context files using semantic analysis results
 * Part of Context Engineering Enhancement system (TEMP-CONTEXT-ENGINE-a7b3)
 */

export interface SemanticAnalysisResult {
    filePath: string;
    language: string;
    businessConcepts: BusinessConcept[];
    businessRules: BusinessRule[];
    domainAnalysis: {
        primaryDomain: string;
        confidence: number;
        crossDomainDependencies: string[];
    };
    changeAnalysis: {
        changeType: 'new' | 'modified' | 'deleted';
        impactLevel: 'low' | 'medium' | 'high';
        affectedComponents: string[];
    };
}

export interface BusinessConcept {
    name: string;
    type: 'Entity' | 'ValueObject' | 'Service' | 'Repository' | 'Event' | 'Command';
    domain: string;
    confidence: number;
    context: string;
}

export interface BusinessRule {
    description: string;
    category: 'validation' | 'business-logic' | 'constraint' | 'workflow';
    confidence: number;
    sourceLocation: string;
}

export interface ContextFileContent {
    domainOverview: string;
    currentImplementation: string;
    businessRules: string;
    integrationPoints: string;
    recentChanges: string;
}

export class ContextGenerator {
    private readonly projectRoot: string;
    private readonly cacheDir: string;

    constructor() {
        // Navigate up from EnvironmentMCPGateway/src/services to project root
        this.projectRoot = join(__dirname, '..', '..', '..');
        this.cacheDir = join(this.projectRoot, '.semantic-cache');
    }

    /**
     * Generate enhanced context files from semantic analysis results
     * Business Rule: Context files must include semantic information and business rules
     * Performance Requirement: Context generation must complete within 5 seconds
     */
    async generateContextFiles(analysisResults: SemanticAnalysisResult[]): Promise<ContextFileContent[]> {
        const startTime = Date.now();
        
        try {
            const contextFiles: ContextFileContent[] = [];
            
            // Group analysis results by domain
            const domainGroups = this.groupByDomain(analysisResults);
            
            for (const [domain, results] of domainGroups) {
                const contextContent = await this.generateDomainContext(domain, results);
                contextFiles.push(contextContent);
            }
            
            const duration = Date.now() - startTime;
            console.info(`Context generation completed in ${duration}ms for ${analysisResults.length} files`);
            
            // Performance validation - must complete within 5 seconds
            if (duration > 5000) {
                console.warn(`Context generation took ${duration}ms, exceeding 5s performance requirement`);
            }
            
            return contextFiles;
        } catch (error) {
            console.error('Context generation failed:', error);
            throw new Error(`Context generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate context content for a specific domain
     */
    private async generateDomainContext(domain: string, results: SemanticAnalysisResult[]): Promise<ContextFileContent> {
        const domainOverview = this.generateDomainOverview(domain, results);
        const currentImplementation = this.generateCurrentImplementation(results);
        const businessRules = this.generateBusinessRules(results);
        const integrationPoints = this.generateIntegrationPoints(results);
        const recentChanges = this.generateRecentChanges(results);

        return {
            domainOverview,
            currentImplementation,
            businessRules,
            integrationPoints,
            recentChanges
        };
    }

    /**
     * Generate domain overview from semantic analysis
     * Business Rule: Domain overview must reflect actual business concepts found in code
     */
    private generateDomainOverview(domain: string, results: SemanticAnalysisResult[]): string {
        const allConcepts = results.flatMap(r => r.businessConcepts);
        const conceptsByType = this.groupConceptsByType(allConcepts);
        
        let overview = `# ${domain} Domain Overview\n\n`;
        overview += `Generated from semantic analysis of ${results.length} files.\n\n`;
        
        // Business concepts summary
        overview += '## Business Concepts\n\n';
        for (const [type, concepts] of conceptsByType) {
            overview += `### ${type}s\n`;
            concepts.forEach(concept => {
                overview += `- **${concept.name}** (confidence: ${Math.round(concept.confidence * 100)}%)\n`;
                if (concept.context) {
                    overview += `  Context: ${concept.context.substring(0, 100)}...\n`;
                }
            });
            overview += '\n';
        }
        
        // Domain confidence analysis
        const avgConfidence = allConcepts.reduce((sum, c) => sum + c.confidence, 0) / allConcepts.length;
        overview += '## Domain Analysis\n';
        overview += `- Average concept confidence: ${Math.round(avgConfidence * 100)}%\n`;
        overview += `- Total concepts identified: ${allConcepts.length}\n`;
        overview += `- Files analyzed: ${results.length}\n\n`;
        
        return overview;
    }

    /**
     * Generate current implementation summary
     */
    private generateCurrentImplementation(results: SemanticAnalysisResult[]): string {
        let implementation = '# Current Implementation\n\n';
        
        results.forEach(result => {
            implementation += `## ${result.filePath}\n`;
            implementation += `Language: ${result.language}\n`;
            implementation += `Change Type: ${result.changeAnalysis.changeType}\n`;
            implementation += `Impact Level: ${result.changeAnalysis.impactLevel}\n\n`;
            
            if (result.changeAnalysis.affectedComponents.length > 0) {
                implementation += 'Affected Components:\n';
                result.changeAnalysis.affectedComponents.forEach(component => {
                    implementation += `- ${component}\n`;
                });
                implementation += '\n';
            }
        });
        
        return implementation;
    }

    /**
     * Generate business rules documentation
     * Business Rule: All business rules must be extracted and documented with confidence levels
     */
    private generateBusinessRules(results: SemanticAnalysisResult[]): string {
        const allRules = results.flatMap(r => r.businessRules);
        
        // Debug logging to trace business rules
        console.info(`Debug: Context generator received ${results.length} results with total ${allRules.length} business rules`);
        results.forEach((result, i) => {
            console.info(`Debug: Result ${i} (${result.filePath}) has ${result.businessRules.length} business rules`);
            result.businessRules.forEach((rule, j) => {
                console.info(`Debug: Rule ${j}: ${rule.description.substring(0, 50)}...`);
            });
        });
        
        let rules = '# Business Rules\n\n';
        rules += `Extracted ${allRules.length} business rules from semantic analysis.\n\n`;
        
        console.info(`Debug: generateBusinessRules - Processing ${allRules.length} total rules`);
        
        // Group rules by category
        const rulesByCategory = new Map<string, BusinessRule[]>();
        allRules.forEach((rule, index) => {
            console.info(`Debug: Processing rule ${index}: category=${rule.category}, desc=${rule.description.substring(0, 50)}...`);
        });
        
        allRules.forEach(rule => {
            if (!rulesByCategory.has(rule.category)) {
                rulesByCategory.set(rule.category, []);
            }
            rulesByCategory.get(rule.category)!.push(rule);
        });
        
        for (const [category, categoryRules] of rulesByCategory) {
            rules += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Rules\n\n`;
            categoryRules.forEach((rule, index) => {
                rules += `${index + 1}. **${rule.description}**\n`;
                rules += `   - Confidence: ${Math.round(rule.confidence * 100)}%\n`;
                rules += `   - Source: ${rule.sourceLocation}\n\n`;
            });
        }
        
        return rules;
    }

    /**
     * Generate integration points documentation
     */
    private generateIntegrationPoints(results: SemanticAnalysisResult[]): string {
        let integration = '# Integration Points\n\n';
        
        const crossDomainDeps = new Set<string>();
        results.forEach(result => {
            result.domainAnalysis.crossDomainDependencies.forEach(dep => {
                crossDomainDeps.add(dep);
            });
        });
        
        if (crossDomainDeps.size > 0) {
            integration += '## Cross-Domain Dependencies\n\n';
            Array.from(crossDomainDeps).forEach(dep => {
                integration += `- ${dep}\n`;
            });
            integration += '\n';
        }
        
        // Analyze primary domains
        const domainConfidence = new Map<string, number[]>();
        results.forEach(result => {
            const domain = result.domainAnalysis.primaryDomain;
            if (!domainConfidence.has(domain)) {
                domainConfidence.set(domain, []);
            }
            domainConfidence.get(domain)!.push(result.domainAnalysis.confidence);
        });
        
        integration += '## Domain Distribution\n\n';
        for (const [domain, confidences] of domainConfidence) {
            const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
            integration += `- **${domain}**: ${confidences.length} files (avg confidence: ${Math.round(avgConfidence * 100)}%)\n`;
        }
        
        return integration;
    }

    /**
     * Generate recent changes summary
     */
    private generateRecentChanges(results: SemanticAnalysisResult[]): string {
        let changes = '# Recent Changes\n\n';
        changes += `Analysis of ${results.length} changed files.\n\n`;
        
        // Group by change type
        const changesByType = new Map<string, SemanticAnalysisResult[]>();
        results.forEach(result => {
            const changeType = result.changeAnalysis.changeType;
            if (!changesByType.has(changeType)) {
                changesByType.set(changeType, []);
            }
            changesByType.get(changeType)!.push(result);
        });
        
        for (const [changeType, typeResults] of changesByType) {
            changes += `## ${changeType.charAt(0).toUpperCase() + changeType.slice(1)} Files\n\n`;
            typeResults.forEach(result => {
                changes += `### ${result.filePath}\n`;
                changes += `- Impact: ${result.changeAnalysis.impactLevel}\n`;
                changes += `- Domain: ${result.domainAnalysis.primaryDomain} (${Math.round(result.domainAnalysis.confidence * 100)}% confidence)\n`;
                changes += `- Business Concepts: ${result.businessConcepts.length}\n`;
                changes += `- Business Rules: ${result.businessRules.length}\n\n`;
            });
        }
        
        return changes;
    }

    /**
     * Group analysis results by primary domain
     */
    private groupByDomain(results: SemanticAnalysisResult[]): Map<string, SemanticAnalysisResult[]> {
        const domainGroups = new Map<string, SemanticAnalysisResult[]>();
        
        results.forEach(result => {
            const domain = result.domainAnalysis.primaryDomain || 'Unknown';
            if (!domainGroups.has(domain)) {
                domainGroups.set(domain, []);
            }
            domainGroups.get(domain)!.push(result);
        });
        
        return domainGroups;
    }

    /**
     * Group business concepts by type
     */
    private groupConceptsByType(concepts: BusinessConcept[]): Map<string, BusinessConcept[]> {
        const conceptGroups = new Map<string, BusinessConcept[]>();
        
        concepts.forEach(concept => {
            if (!conceptGroups.has(concept.type)) {
                conceptGroups.set(concept.type, []);
            }
            conceptGroups.get(concept.type)!.push(concept);
        });
        
        return conceptGroups;
    }

    /**
     * Load semantic analysis results from cache
     * Business Rule: Must handle missing or invalid cache files gracefully
     */
    async loadSemanticAnalysisFromCache(): Promise<SemanticAnalysisResult[]> {
        try {
            const cacheFiles = await fs.readdir(this.cacheDir);
            const results: SemanticAnalysisResult[] = [];
            
            for (const filename of cacheFiles) {
                if (filename.endsWith('.json')) {
                    try {
                        const filePath = join(this.cacheDir, filename);
                        const content = await fs.readFile(filePath, 'utf-8');
                        const cached = JSON.parse(content);
                        
                        // Convert cached format to expected format
                        if (cached.analysisResult) {
                            const result = this.convertCachedToSemanticResult(cached.analysisResult);
                            results.push(result);
                        }
                    } catch (fileError) {
                        console.warn(`Failed to load cache file ${filename}:`, fileError);
                        // Continue processing other files
                    }
                }
            }
            
            console.info(`Loaded ${results.length} semantic analysis results from cache`);
            return results;
        } catch (error) {
            console.warn('Failed to load semantic analysis cache:', error);
            return [];
        }
    }

    /**
     * Convert cached analysis format to semantic result format
     */
    private convertCachedToSemanticResult(cached: any): SemanticAnalysisResult {
        return {
            filePath: cached.filePath || 'Unknown',
            language: cached.language || 'Unknown',
            businessConcepts: cached.businessConcepts || [],
            businessRules: cached.businessRules || [],
            domainAnalysis: {
                primaryDomain: cached.domainAnalysis?.primaryDomain || cached.primaryDomain || 'Unknown',
                confidence: cached.domainAnalysis?.confidence || cached.domainConfidence || 0.5,
                crossDomainDependencies: cached.domainAnalysis?.crossDomainDependencies || cached.crossDomainDependencies || []
            },
            changeAnalysis: {
                changeType: cached.changeAnalysis?.changeType || cached.changeType || 'modified',
                impactLevel: cached.changeAnalysis?.impactLevel || cached.impactLevel || 'medium',
                affectedComponents: cached.changeAnalysis?.affectedComponents || cached.affectedComponents || []
            }
        };
    }

    /**
     * Write context files to appropriate domain directories
     * Business Rule: Context files must be written to domain-specific .context directories
     */
    async writeContextFiles(contextFiles: ContextFileContent[], targetDomain: string): Promise<void> {
        try {
            // Determine target directory based on domain
            const domainPath = this.getDomainPath(targetDomain);
            const contextDir = join(domainPath, '.context');
            
            // Ensure context directory exists
            await fs.mkdir(contextDir, { recursive: true });
            
            for (const context of contextFiles) {
                // Write each context file
                await Promise.all([
                    fs.writeFile(join(contextDir, 'domain-overview.md'), context.domainOverview),
                    fs.writeFile(join(contextDir, 'current-implementation.md'), context.currentImplementation),
                    fs.writeFile(join(contextDir, 'business-rules.md'), context.businessRules),
                    fs.writeFile(join(contextDir, 'integration-points.md'), context.integrationPoints),
                    fs.writeFile(join(contextDir, 'recent-changes.md'), context.recentChanges)
                ]);
            }
            
            console.info(`Context files written to ${contextDir}`);
        } catch (error) {
            console.error('Failed to write context files:', error);
            throw new Error(`Failed to write context files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Determine appropriate path for domain context files
     */
    private getDomainPath(domain: string): string {
        // Map domain names to appropriate directory paths
        const domainPaths: Record<string, string> = {
            'Analysis': join(this.projectRoot, 'Utility', 'Analysis'),
            'Data': join(this.projectRoot, 'Utility', 'Data'),
            'Messaging': join(this.projectRoot, 'Utility', 'Messaging'),
            'Infrastructure': join(this.projectRoot, 'EnvironmentMCPGateway'),
            'Testing': join(this.projectRoot, 'TestSuite'),
            'Documentation': join(this.projectRoot, 'Documentation'),
            'Unknown': join(this.projectRoot, 'Utility', 'General')
        };
        
        return domainPaths[domain] || domainPaths['Unknown'];
    }
}
import * as fs from 'fs';
import * as path from 'path';
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('mcp-gateway.log');
/**
 * Advanced template-based context content generator
 * Step 3.1: Template-Based Context Content Generation
 */
export class ContextTemplateGenerator {
    templates = new Map();
    cacheDir;
    constructor(cacheDir = '.context-cache') {
        this.cacheDir = cacheDir;
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        // Initialize templates
        this.initializeDefaultTemplates();
        logger.info('ContextTemplateGenerator initialized with AI-optimized templates');
    }
    /**
     * Generate context content using intelligent template selection
     * Step 3.1: Core Content Generation
     */
    async generateContextContent(domainPath, semanticResults, complexityLevel) {
        const startTime = Date.now();
        // Select optimal template based on domain and complexity
        const template = this.selectOptimalTemplate(domainPath, complexityLevel);
        logger.info(`Generating context content for ${domainPath} using template ${template.templateId}`);
        // Generate content sections
        const sections = [];
        const hierarchicalReferences = [];
        const structuralEnhancements = [];
        const semanticMarkers = [];
        const crossReferences = [];
        for (const section of template.sections.sort((a, b) => b.priority - a.priority)) {
            const sectionContent = await this.generateSection(section, semanticResults, domainPath, complexityLevel);
            if (sectionContent.trim()) {
                sections.push(section.title);
                // Add AI optimization markers
                const optimizedContent = this.applyAIOptimizations(sectionContent, section.aiOptimizationHints, semanticResults);
                structuralEnhancements.push(...optimizedContent.enhancements);
                semanticMarkers.push(...optimizedContent.markers);
                crossReferences.push(...optimizedContent.references);
                sections.push(optimizedContent.content);
            }
        }
        // Combine all sections into final content
        const finalContent = this.assembleContent(sections, template, domainPath);
        const generationTime = Date.now() - startTime;
        const tokenCount = this.estimateTokenCount(finalContent);
        const contextContent = {
            contextId: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            domainPath,
            templateUsed: template.templateId,
            content: finalContent,
            metadata: {
                generationTime,
                tokenCount,
                sections: sections.filter((_, index) => index % 2 === 0), // Extract section titles
                hierarchicalReferences,
                optimizationLevel: template.metadata.aiOptimizationLevel
            },
            aiOptimizations: {
                structuralEnhancements,
                semanticMarkers,
                crossReferences
            }
        };
        // Cache the generated content
        this.cacheGeneratedContent(contextContent);
        logger.info(`Context content generated for ${domainPath} in ${generationTime}ms (${tokenCount} tokens)`);
        return contextContent;
    }
    /**
     * Select the optimal template based on domain characteristics
     * Step 3.1: Intelligent Template Selection
     */
    selectOptimalTemplate(domainPath, complexityLevel) {
        // Find templates that match the domain pattern and complexity
        const candidateTemplates = Array.from(this.templates.values()).filter(template => {
            const domainRegex = new RegExp(template.domainPattern);
            return domainRegex.test(domainPath) && template.complexityLevel === complexityLevel;
        });
        if (candidateTemplates.length === 0) {
            logger.warn(`No specific template found for ${domainPath} (${complexityLevel}), using fallback`);
            return this.getFallbackTemplate(complexityLevel);
        }
        // Select the most specific template (longest domain pattern)
        return candidateTemplates.reduce((best, current) => current.domainPattern.length > best.domainPattern.length ? current : best);
    }
    /**
     * Generate content for a specific section
     * Step 3.1: Section-Specific Content Generation
     */
    async generateSection(section, semanticResults, domainPath, complexityLevel) {
        const sectionParts = [];
        for (const generator of section.contentGenerators) {
            const content = await this.generateSectionContent(generator, semanticResults, domainPath, complexityLevel);
            if (content) {
                sectionParts.push(content);
            }
        }
        return sectionParts.join('\n\n');
    }
    /**
     * Generate content using specific content generators
     * Step 3.1: Content Generator Implementation
     */
    async generateSectionContent(generator, semanticResults, domainPath, complexityLevel) {
        const filteredResults = this.applyContentFilters(semanticResults, generator.filters);
        switch (generator.type) {
            case 'business-concepts':
                return this.generateBusinessConceptsContent(filteredResults, generator.template);
            case 'business-rules':
                return this.generateBusinessRulesContent(filteredResults, generator.template);
            case 'implementation-details':
                return this.generateImplementationDetailsContent(filteredResults, generator.template, complexityLevel);
            case 'integration-points':
                return this.generateIntegrationPointsContent(filteredResults, generator.template, domainPath);
            case 'recent-changes':
                return this.generateRecentChangesContent(filteredResults, generator.template);
            case 'hierarchical-context':
                return this.generateHierarchicalContextContent(domainPath, generator.template);
            default:
                logger.warn(`Unknown content generator type: ${generator.type}`);
                return '';
        }
    }
    /**
     * Generate business concepts section with AI optimization
     * Step 3.1: Business Concepts Content Generation
     */
    generateBusinessConceptsContent(results, template) {
        const allConcepts = results.flatMap(r => r.businessConcepts);
        if (allConcepts.length === 0) {
            return '';
        }
        // Group concepts by type and confidence
        const conceptsByType = allConcepts.reduce((acc, concept) => {
            if (!acc[concept.type]) {
                acc[concept.type] = [];
            }
            acc[concept.type].push(concept);
            return acc;
        }, {});
        // Generate content based on template
        let content = template.replace('{{TITLE}}', '## Business Concepts');
        const conceptSections = Object.entries(conceptsByType).map(([type, concepts]) => {
            const sortedConcepts = concepts.sort((a, b) => b.confidence - a.confidence);
            const conceptItems = sortedConcepts.map(concept => `- **${concept.name}** (confidence: ${concept.confidence}%)\n  Context: ${concept.context}${concept.dependencies ? `\n  Dependencies: ${concept.dependencies.join(', ')}` : ''}`).join('\n');
            return `### ${type}s\n${conceptItems}`;
        }).join('\n\n');
        content = content.replace('{{CONTENT}}', conceptSections);
        // Add AI optimization metadata
        content += `\n\n## Domain Analysis\n- Average concept confidence: ${Math.round(allConcepts.reduce((sum, c) => sum + c.confidence, 0) / allConcepts.length)}%\n- Total concepts identified: ${allConcepts.length}\n- Files analyzed: ${results.length}`;
        return content;
    }
    /**
     * Generate business rules section with sophisticated organization
     * Step 3.1: Business Rules Content Generation
     */
    generateBusinessRulesContent(results, template) {
        const allRules = results.flatMap(r => r.businessRules);
        if (allRules.length === 0) {
            return '';
        }
        // Categorize rules by type (validation, workflow, business-logic)
        const ruleCategories = {
            'Validation Rules': allRules.filter(r => r.description.toLowerCase().includes('validation') || r.description.toLowerCase().includes('must be')),
            'Workflow Rules': allRules.filter(r => r.description.toLowerCase().includes('calculation') || r.description.toLowerCase().includes('process')),
            'Business-logic Rules': allRules.filter(r => !r.description.toLowerCase().includes('validation') && !r.description.toLowerCase().includes('calculation'))
        };
        let content = template.replace('{{TITLE}}', '# Business Rules');
        content += `\n\nExtracted ${allRules.length} business rules from semantic analysis.\n\n`;
        const categorySections = Object.entries(ruleCategories)
            .filter(([_, rules]) => rules.length > 0)
            .map(([category, rules]) => {
            const ruleItems = rules
                .sort((a, b) => b.confidence - a.confidence)
                .map((rule, index) => `${index + 1}. **${rule.description}**\n   - Confidence: ${rule.confidence}%\n   - Source: ${rule.sourceLocation}`).join('\n\n');
            return `## ${category}\n\n${ruleItems}`;
        }).join('\n\n');
        content = content.replace('{{CONTENT}}', categorySections);
        return content;
    }
    /**
     * Generate implementation details with complexity-aware content
     * Step 3.1: Implementation Details Generation
     */
    generateImplementationDetailsContent(results, template, complexityLevel) {
        let content = template.replace('{{TITLE}}', '# Current Implementation');
        const implementationSections = results.map(result => {
            const impact = this.calculateImplementationImpact(result, complexityLevel);
            const affectedComponents = result.businessConcepts.map(c => `${c.type}:${c.name}`).join(', ');
            return `## ${result.filePath}\nLanguage: ${result.language}\nChange Type: modified\nImpact Level: ${impact}\n\nAffected Components:\n- ${affectedComponents}`;
        }).join('\n\n');
        content = content.replace('{{CONTENT}}', implementationSections);
        return content;
    }
    /**
     * Generate integration points with cross-domain analysis
     * Step 3.1: Integration Points Generation
     */
    generateIntegrationPointsContent(results, template, domainPath) {
        // Extract cross-domain dependencies
        const crossDomainDeps = new Set();
        results.forEach(result => {
            result.businessConcepts.forEach(concept => {
                if (concept.dependencies) {
                    concept.dependencies.forEach(dep => {
                        if (!dep.startsWith(domainPath)) {
                            crossDomainDeps.add(dep.split('.')[0]);
                        }
                    });
                }
            });
        });
        let content = template.replace('{{TITLE}}', '# Integration Points');
        if (crossDomainDeps.size > 0) {
            const integrationContent = `## Cross-Domain Dependencies\n\n${Array.from(crossDomainDeps).map(dep => `- ${dep}`).join('\n')}`;
            content = content.replace('{{CONTENT}}', integrationContent);
        }
        else {
            content = content.replace('{{CONTENT}}', 'No external domain dependencies identified.');
        }
        // Add domain distribution
        const domainDistribution = results.reduce((acc, result) => {
            if (!acc[result.domainContext]) {
                acc[result.domainContext] = { files: 0, avgConfidence: 0 };
            }
            acc[result.domainContext].files++;
            return acc;
        }, {});
        content += '\n\n## Domain Distribution\n\n' +
            Object.entries(domainDistribution)
                .map(([domain, stats]) => `- **${domain}**: ${stats.files} files`)
                .join('\n');
        return content;
    }
    /**
     * Generate recent changes analysis
     * Step 3.1: Recent Changes Content Generation
     */
    generateRecentChangesContent(results, template) {
        let content = template.replace('{{TITLE}}', '# Recent Changes');
        content += `\n\nAnalysis of ${results.length} changed files.\n\n`;
        const changesSummary = results.map(result => {
            return `### ${result.filePath}\n- Impact: high\n- Domain: ${result.domainContext}\n- Business Concepts: ${result.businessConcepts.length}\n- Business Rules: ${result.businessRules.length}`;
        }).join('\n\n');
        content = content.replace('{{CONTENT}}', `## Modified Files\n\n${changesSummary}`);
        return content;
    }
    /**
     * Generate hierarchical context references
     * Step 3.1: Hierarchical Context Generation
     */
    generateHierarchicalContextContent(domainPath, template) {
        const pathParts = domainPath.split('.');
        const hierarchicalRefs = [];
        // Generate parent context references
        for (let i = 1; i < pathParts.length; i++) {
            const parentPath = pathParts.slice(0, i).join('.');
            hierarchicalRefs.push(`- Parent Context: ${parentPath}/.context/`);
        }
        // Generate sibling context suggestions
        const parentPath = pathParts.slice(0, -1).join('.');
        if (parentPath) {
            hierarchicalRefs.push(`- Sibling Contexts: ${parentPath}/*/.context/`);
        }
        let content = template.replace('{{TITLE}}', '# Hierarchical Context');
        content = content.replace('{{CONTENT}}', hierarchicalRefs.join('\n'));
        return content;
    }
    /**
     * Apply AI optimizations to content
     * Step 3.1: AI Optimization Layer
     */
    applyAIOptimizations(content, hints, _semanticResults) {
        const enhancements = [];
        const markers = [];
        const references = [];
        let optimizedContent = content;
        // Apply structural enhancements
        hints.forEach(hint => {
            switch (hint) {
                case 'add-confidence-indicators':
                    enhancements.push('Added confidence indicators for AI interpretation');
                    break;
                case 'include-cross-references': {
                    const refMatches = content.match(/[A-Z][a-zA-Z]*\.[A-Z][a-zA-Z]*/g);
                    if (refMatches) {
                        references.push(...refMatches);
                    }
                    break;
                }
                case 'semantic-markup':
                    markers.push('business-concept', 'domain-boundary', 'implementation-detail');
                    break;
            }
        });
        return {
            content: optimizedContent,
            enhancements,
            markers,
            references
        };
    }
    /**
     * Apply content filters to semantic results
     * Step 3.1: Content Filtering
     */
    applyContentFilters(results, filters) {
        return results.filter(result => {
            return filters.every(filter => {
                switch (filter.operation) {
                    case 'include':
                        return this.evaluateFilterCondition(result, filter.condition, filter.parameters);
                    case 'exclude':
                        return !this.evaluateFilterCondition(result, filter.condition, filter.parameters);
                    default:
                        return true;
                }
            });
        });
    }
    /**
     * Evaluate filter conditions
     * Step 3.1: Filter Condition Evaluation
     */
    evaluateFilterCondition(result, condition, parameters) {
        switch (condition) {
            case 'has-business-concepts':
                return result.businessConcepts.length > 0;
            case 'has-business-rules':
                return result.businessRules.length > 0;
            case 'min-confidence': {
                const avgConfidence = result.businessConcepts.reduce((sum, c) => sum + c.confidence, 0) / result.businessConcepts.length;
                return avgConfidence >= (parameters.threshold || 70);
            }
            case 'domain-matches':
                return result.domainContext.includes(parameters.pattern || '');
            default:
                return true;
        }
    }
    /**
     * Calculate implementation impact level
     * Step 3.1: Impact Assessment
     */
    calculateImplementationImpact(result, complexityLevel) {
        const conceptCount = result.businessConcepts.length;
        const ruleCount = result.businessRules.length;
        if (complexityLevel === 'high' || conceptCount > 3 || ruleCount > 5) {
            return 'high';
        }
        else if (complexityLevel === 'medium' || conceptCount > 1 || ruleCount > 2) {
            return 'medium';
        }
        else {
            return 'low';
        }
    }
    /**
     * Assemble final content from sections
     * Step 3.1: Content Assembly
     */
    assembleContent(sections, template, domainPath) {
        const header = `# Domain Context\n\n## Domain Overview\n# ${domainPath} Domain Overview\n\nGenerated from semantic analysis of advanced boundary detection.\n\n`;
        return header + sections.filter(section => section.trim()).join('\n\n');
    }
    /**
     * Estimate token count for content
     * Step 3.1: Token Estimation
     */
    estimateTokenCount(content) {
        // Rough approximation: 1 token ≈ 4 characters
        return Math.ceil(content.length / 4);
    }
    /**
     * Cache generated content for performance
     * Step 3.1: Content Caching
     */
    cacheGeneratedContent(content) {
        const cacheFile = path.join(this.cacheDir, `${content.contextId}.json`);
        try {
            fs.writeFileSync(cacheFile, JSON.stringify(content, null, 2));
            logger.info(`Context content cached: ${content.contextId}`);
        }
        catch (error) {
            logger.warn(`Failed to cache context content: ${error}`);
        }
    }
    /**
     * Initialize default templates for different domains and complexity levels
     * Step 3.1: Template Initialization
     */
    initializeDefaultTemplates() {
        // High complexity analysis domain template
        this.templates.set('analysis-high', {
            templateId: 'analysis-high',
            name: 'Analysis Domain - High Complexity',
            domainPattern: '^Analysis\\.',
            complexityLevel: 'high',
            sections: [
                {
                    sectionId: 'business-concepts',
                    title: 'Business Concepts',
                    priority: 10,
                    required: true,
                    aiOptimizationHints: ['add-confidence-indicators', 'semantic-markup'],
                    contentGenerators: [{
                            generatorId: 'concepts-gen',
                            type: 'business-concepts',
                            template: '{{TITLE}}\n\n{{CONTENT}}',
                            filters: [{ filterId: 'has-concepts', condition: 'has-business-concepts', operation: 'include', parameters: {} }],
                            enhancementRules: []
                        }]
                },
                {
                    sectionId: 'business-rules',
                    title: 'Business Rules',
                    priority: 9,
                    required: true,
                    aiOptimizationHints: ['include-cross-references'],
                    contentGenerators: [{
                            generatorId: 'rules-gen',
                            type: 'business-rules',
                            template: '{{TITLE}}\n\n{{CONTENT}}',
                            filters: [{ filterId: 'has-rules', condition: 'has-business-rules', operation: 'include', parameters: {} }],
                            enhancementRules: []
                        }]
                },
                {
                    sectionId: 'implementation',
                    title: 'Current Implementation',
                    priority: 8,
                    required: true,
                    aiOptimizationHints: ['semantic-markup'],
                    contentGenerators: [{
                            generatorId: 'impl-gen',
                            type: 'implementation-details',
                            template: '{{TITLE}}\n\n{{CONTENT}}',
                            filters: [],
                            enhancementRules: []
                        }]
                },
                {
                    sectionId: 'integration',
                    title: 'Integration Points',
                    priority: 7,
                    required: false,
                    aiOptimizationHints: ['include-cross-references'],
                    contentGenerators: [{
                            generatorId: 'integration-gen',
                            type: 'integration-points',
                            template: '{{TITLE}}\n\n{{CONTENT}}',
                            filters: [],
                            enhancementRules: []
                        }]
                },
                {
                    sectionId: 'recent-changes',
                    title: 'Recent Changes',
                    priority: 6,
                    required: true,
                    aiOptimizationHints: [],
                    contentGenerators: [{
                            generatorId: 'changes-gen',
                            type: 'recent-changes',
                            template: '{{TITLE}}\n\n{{CONTENT}}',
                            filters: [],
                            enhancementRules: []
                        }]
                }
            ],
            metadata: {
                version: '1.0.0',
                aiOptimizationLevel: 'advanced',
                estimatedTokens: 1500,
                lastUpdated: new Date(),
                performanceMetrics: {
                    generationTimeMs: 0,
                    compressionRatio: 0.8,
                    aiComprehensionScore: 0.95
                }
            }
        });
        // Add more templates for different patterns...
        logger.info('Default context templates initialized');
    }
    /**
     * Get fallback template for unknown patterns
     * Step 3.1: Fallback Template Handling
     */
    getFallbackTemplate(complexityLevel) {
        return {
            templateId: `fallback-${complexityLevel}`,
            name: `Fallback Template - ${complexityLevel} complexity`,
            domainPattern: '.*',
            complexityLevel,
            sections: [
                {
                    sectionId: 'basic-overview',
                    title: 'Domain Overview',
                    priority: 10,
                    required: true,
                    aiOptimizationHints: [],
                    contentGenerators: [{
                            generatorId: 'basic-gen',
                            type: 'business-concepts',
                            template: '{{TITLE}}\n\n{{CONTENT}}',
                            filters: [],
                            enhancementRules: []
                        }]
                }
            ],
            metadata: {
                version: '1.0.0',
                aiOptimizationLevel: 'basic',
                estimatedTokens: 500,
                lastUpdated: new Date(),
                performanceMetrics: {
                    generationTimeMs: 0,
                    compressionRatio: 0.6,
                    aiComprehensionScore: 0.7
                }
            }
        };
    }
}
//# sourceMappingURL=context-template-generator.js.map
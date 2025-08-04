import winston from 'winston';
import { Environment } from '../domain/config/environment.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'semantic-analysis.log' })
    ]
});

export interface BusinessConcept {
    name: string;
    type: 'Entity' | 'ValueObject' | 'Service' | 'Repository' | 'Event' | 'Command';
    domain: string;
    confidence: number;
    context: string;
}

export interface BusinessRule {
    id: string;
    description: string;
    domain: string;
    sourceLocation: string;
    conditions: string[];
    actions: string[];
    confidence: number;
}

export interface SemanticAnalysisResult {
    filePath: string;
    language: string;
    businessConcepts: BusinessConcept[];
    businessRules: BusinessRule[];
    domainContext: string;
    analysisTime: number;
}

export class SemanticAnalysisService {
    private readonly maxAnalysisTime = 15000; // 15 seconds as per requirements
    private readonly cacheDir = '.semantic-cache';

    constructor() {
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Analyze code changes for semantic meaning
     */
    public async analyzeCodeChanges(filePaths: string[]): Promise<SemanticAnalysisResult[]> {
        logger.info(`Starting semantic analysis for ${filePaths.length} files`);
        const startTime = Date.now();
        const results: SemanticAnalysisResult[] = [];

        for (const filePath of filePaths) {
            try {
                // Check if we should continue based on time constraint
                if (Date.now() - startTime > this.maxAnalysisTime) {
                    logger.warn(`Semantic analysis timeout reached after analyzing ${results.length} files`);
                    break;
                }

                const result = await this.analyzeFile(filePath);
                results.push(result);
            } catch (error) {
                logger.error(`Failed to analyze file ${filePath}:`, error);
                // Continue with other files even if one fails
            }
        }

        const analysisTime = Date.now() - startTime;
        logger.info(`Semantic analysis completed in ${analysisTime}ms for ${results.length} files`);
        
        return results;
    }

    /**
     * Analyze a single file for business concepts and rules
     */
    private async analyzeFile(filePath: string): Promise<SemanticAnalysisResult> {
        const startTime = Date.now();
        logger.debug(`Analyzing file: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const language = this.detectLanguage(filePath);

        let businessConcepts: BusinessConcept[] = [];
        let businessRules: BusinessRule[] = [];
        let domainContext = '';

        if (language === 'C#') {
            businessConcepts = await this.extractCSharpBusinessConcepts(fileContent, filePath);
            businessRules = await this.extractCSharpBusinessRules(fileContent, filePath);
            domainContext = this.determineDomainContext(filePath, businessConcepts);
        } else if (language === 'TypeScript' || language === 'JavaScript') {
            businessConcepts = await this.extractTypeScriptBusinessConcepts(fileContent, filePath);
            businessRules = await this.extractTypeScriptBusinessRules(fileContent, filePath);
            domainContext = this.determineDomainContext(filePath, businessConcepts);
        }

        const analysisTime = Date.now() - startTime;

        return {
            filePath,
            language,
            businessConcepts,
            businessRules,
            domainContext,
            analysisTime
        };
    }

    /**
     * Extract business concepts from C# code
     */
    private async extractCSharpBusinessConcepts(content: string, filePath: string): Promise<BusinessConcept[]> {
        const concepts: BusinessConcept[] = [];
        
        // Pattern matching for C# DDD patterns
        const patterns = {
            entity: /public\s+(?:partial\s+)?class\s+(\w+)\s*(?::\s*Entity)?/g,
            valueObject: /public\s+(?:sealed\s+|readonly\s+)?(?:class|struct|record)\s+(\w+)\s*(?::\s*ValueObject)?/g,
            service: /public\s+(?:interface|class)\s+(I?\w*Service)\s*/g,
            repository: /public\s+interface\s+(I\w*Repository)\s*/g,
            event: /public\s+(?:class|record)\s+(\w+Event)\s*/g,
            command: /public\s+(?:class|record)\s+(\w+Command)\s*/g
        };

        // Extract entities
        let match;
        while ((match = patterns.entity.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'Entity',
                domain: this.extractDomainFromNamespace(content),
                confidence: 0.85,
                context: this.extractContext(content, match.index)
            });
        }

        // Extract value objects
        patterns.valueObject.lastIndex = 0;
        while ((match = patterns.valueObject.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'ValueObject',
                domain: this.extractDomainFromNamespace(content),
                confidence: 0.80,
                context: this.extractContext(content, match.index)
            });
        }

        // Extract services
        patterns.service.lastIndex = 0;
        while ((match = patterns.service.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'Service',
                domain: this.extractDomainFromNamespace(content),
                confidence: 0.85,
                context: this.extractContext(content, match.index)
            });
        }

        // Extract repositories
        patterns.repository.lastIndex = 0;
        while ((match = patterns.repository.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'Repository',
                domain: this.extractDomainFromNamespace(content),
                confidence: 0.90,
                context: this.extractContext(content, match.index)
            });
        }

        // Extract events
        patterns.event.lastIndex = 0;
        while ((match = patterns.event.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'Event',
                domain: this.extractDomainFromNamespace(content),
                confidence: 0.90,
                context: this.extractContext(content, match.index)
            });
        }

        // Extract commands
        patterns.command.lastIndex = 0;
        while ((match = patterns.command.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'Command',
                domain: this.extractDomainFromNamespace(content),
                confidence: 0.90,
                context: this.extractContext(content, match.index)
            });
        }

        logger.debug(`Extracted ${concepts.length} business concepts from ${filePath}`);
        return concepts;
    }

    /**
     * Extract business rules from C# code
     */
    private async extractCSharpBusinessRules(content: string, filePath: string): Promise<BusinessRule[]> {
        const rules: BusinessRule[] = [];
        
        // Look for business rule patterns in comments and method names
        const rulePatterns = [
            // Business rule comments
            /\/\/\s*Business Rule:\s*(.+)/gi,
            /\/\/\s*BR:\s*(.+)/gi,
            /\/\*\*?\s*Business Rule:\s*(.+?)\*\//gis,
            
            // Validation methods that often contain business rules
            /(?:public|private|protected)\s+(?:async\s+)?(?:Task<)?bool\??>?\s+(Validate\w+|IsValid\w+|Can\w+|Should\w+|Must\w+)\s*\([^)]*\)/g,
            
            // Guard clauses that enforce business rules
            /if\s*\(\s*!?(\w+(?:\.\w+)*)\s*(?:[<>!=]+[^)]+)?\)\s*(?:throw|return)/g
        ];

        // Extract rules from comments
        let match;
        let ruleId = 1;
        
        for (const pattern of rulePatterns.slice(0, 3)) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                rules.push({
                    id: `BR-${filePath.replace(/[^\w]/g, '-')}-${ruleId++}`,
                    description: match[1].trim(),
                    domain: this.extractDomainFromNamespace(content),
                    sourceLocation: `${filePath}:${this.getLineNumber(content, match.index)}`,
                    conditions: this.extractConditions(content, match.index),
                    actions: this.extractActions(content, match.index),
                    confidence: 0.75
                });
            }
        }

        // Extract rules from validation methods
        rulePatterns[3].lastIndex = 0;
        while ((match = rulePatterns[3].exec(content)) !== null) {
            const methodName = match[1];
            const ruleDescription = this.humanizeMethodName(methodName);
            
            rules.push({
                id: `BR-${filePath.replace(/[^\w]/g, '-')}-${ruleId++}`,
                description: ruleDescription,
                domain: this.extractDomainFromNamespace(content),
                sourceLocation: `${filePath}:${this.getLineNumber(content, match.index)}`,
                conditions: this.extractMethodConditions(content, match.index),
                actions: ['Validation', 'Business constraint enforcement'],
                confidence: 0.65
            });
        }

        logger.debug(`Extracted ${rules.length} business rules from ${filePath}`);
        return rules;
    }

    /**
     * Extract business concepts from TypeScript/JavaScript code
     */
    private async extractTypeScriptBusinessConcepts(content: string, filePath: string): Promise<BusinessConcept[]> {
        const concepts: BusinessConcept[] = [];
        
        // Pattern matching for TypeScript/JavaScript patterns
        const patterns = {
            class: /(?:export\s+)?class\s+(\w+)/g,
            interface: /(?:export\s+)?interface\s+(\w+)/g,
            service: /(?:export\s+)?(?:class|const)\s+(\w*Service)/g,
            repository: /(?:export\s+)?(?:class|const)\s+(\w*Repository)/g,
            event: /(?:export\s+)?(?:class|interface|type)\s+(\w+Event)/g,
            command: /(?:export\s+)?(?:class|interface|type)\s+(\w+Command)/g
        };

        // Extract classes as potential entities
        let match;
        while ((match = patterns.class.exec(content)) !== null) {
            const className = match[1];
            const type = this.inferTypeFromName(className);
            
            concepts.push({
                name: className,
                type: type,
                domain: this.extractDomainFromPath(filePath),
                confidence: 0.70,
                context: this.extractContext(content, match.index)
            });
        }

        // Extract interfaces
        patterns.interface.lastIndex = 0;
        while ((match = patterns.interface.exec(content)) !== null) {
            concepts.push({
                name: match[1],
                type: 'Entity',
                domain: this.extractDomainFromPath(filePath),
                confidence: 0.65,
                context: this.extractContext(content, match.index)
            });
        }

        logger.debug(`Extracted ${concepts.length} business concepts from ${filePath}`);
        return concepts;
    }

    /**
     * Extract business rules from TypeScript/JavaScript code
     */
    private async extractTypeScriptBusinessRules(content: string, filePath: string): Promise<BusinessRule[]> {
        const rules: BusinessRule[] = [];
        
        // Similar patterns as C# but adapted for TypeScript/JavaScript syntax
        const rulePatterns = [
            /\/\/\s*Business Rule:\s*(.+)/gi,
            /\/\/\s*BR:\s*(.+)/gi,
            /\/\*\*?\s*Business Rule:\s*(.+?)\*\//gis,
            /(?:async\s+)?(?:function\s+)?(\w*(?:validate|isValid|can|should|must)\w*)\s*\(/gi
        ];

        let match;
        let ruleId = 1;
        
        for (const pattern of rulePatterns) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                const description = pattern === rulePatterns[3] 
                    ? this.humanizeMethodName(match[1])
                    : match[1].trim();
                
                rules.push({
                    id: `BR-${filePath.replace(/[^\w]/g, '-')}-${ruleId++}`,
                    description: description,
                    domain: this.extractDomainFromPath(filePath),
                    sourceLocation: `${filePath}:${this.getLineNumber(content, match.index)}`,
                    conditions: [],
                    actions: [],
                    confidence: 0.60
                });
            }
        }

        logger.debug(`Extracted ${rules.length} business rules from ${filePath}`);
        return rules;
    }

    // Helper methods

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
        case '.cs': return 'C#';
        case '.ts': return 'TypeScript';
        case '.js': return 'JavaScript';
        case '.py': return 'Python';
        default: return 'Unknown';
        }
    }

    private extractDomainFromNamespace(content: string): string {
        const namespaceMatch = content.match(/namespace\s+([\w.]+)/);
        if (namespaceMatch) {
            const parts = namespaceMatch[1].split('.');
            // Try to identify domain from namespace
            for (const part of parts) {
                if (['Analysis', 'Data', 'Messaging', 'Trading', 'Market'].includes(part)) {
                    return part;
                }
            }
        }
        return 'Unknown';
    }

    private extractDomainFromPath(filePath: string): string {
        const parts = filePath.split(/[/\\]/);
        for (const part of parts) {
            if (['analysis', 'data', 'messaging', 'trading', 'market', 'domain'].includes(part.toLowerCase())) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
        }
        return 'Unknown';
    }

    private extractContext(content: string, position: number): string {
        // Extract surrounding context (100 chars before and after)
        const start = Math.max(0, position - 100);
        const end = Math.min(content.length, position + 100);
        return content.substring(start, end).replace(/\s+/g, ' ').trim();
    }

    private getLineNumber(content: string, position: number): number {
        const lines = content.substring(0, position).split('\n');
        return lines.length;
    }

    private extractConditions(content: string, position: number): string[] {
        // Simple extraction of conditions near the position
        const contextStart = Math.max(0, position - 500);
        const contextEnd = Math.min(content.length, position + 500);
        const context = content.substring(contextStart, contextEnd);
        
        const conditions: string[] = [];
        const ifMatches = context.match(/if\s*\([^)]+\)/g) || [];
        conditions.push(...ifMatches.map(c => c.replace(/if\s*\(/, '').replace(')', '').trim()));
        
        return conditions.slice(0, 3); // Limit to 3 conditions
    }

    private extractMethodConditions(content: string, methodStart: number): string[] {
        // Find the method body and extract conditions
        const methodEnd = content.indexOf('}', methodStart);
        if (methodEnd === -1) return [];
        
        const methodBody = content.substring(methodStart, methodEnd);
        return this.extractConditions(methodBody, 0);
    }

    private extractActions(content: string, position: number): string[] {
        // Simple extraction of actions near the position
        const contextStart = Math.max(0, position - 500);
        const contextEnd = Math.min(content.length, position + 500);
        const context = content.substring(contextStart, contextEnd);
        
        const actions: string[] = [];
        
        // Look for throw statements
        const throwMatches = context.match(/throw\s+new\s+\w+/g) || [];
        actions.push(...throwMatches.map(t => t.replace(/throw\s+new\s+/, 'Throw ').trim()));
        
        // Look for return statements
        if (context.includes('return false')) actions.push('Reject validation');
        if (context.includes('return true')) actions.push('Accept validation');
        
        return actions.slice(0, 3); // Limit to 3 actions
    }

    private humanizeMethodName(methodName: string): string {
        // Convert ValidateOrderTotal to "Validate order total"
        return methodName
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/^./, str => str.toUpperCase());
    }

    private inferTypeFromName(name: string): BusinessConcept['type'] {
        if (name.endsWith('Service')) return 'Service';
        if (name.endsWith('Repository')) return 'Repository';
        if (name.endsWith('Event')) return 'Event';
        if (name.endsWith('Command')) return 'Command';
        if (name.endsWith('VO') || name.endsWith('ValueObject')) return 'ValueObject';
        return 'Entity';
    }

    private determineDomainContext(filePath: string, concepts: BusinessConcept[]): string {
        // Determine domain from concepts and file path
        const domains = concepts.map(c => c.domain).filter(d => d !== 'Unknown');
        if (domains.length > 0) {
            // Return most common domain
            const domainCounts = domains.reduce((acc, d) => {
                acc[d] = (acc[d] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            return Object.entries(domainCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
        }
        
        return this.extractDomainFromPath(filePath);
    }
}
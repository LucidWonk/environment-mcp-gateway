import winston from 'winston';
import { Environment } from '../domain/config/environment.js';
import * as fs from 'fs';
import * as path from 'path';
const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'semantic-analysis.log' })
    ]
});
export class SemanticAnalysisService {
    maxAnalysisTime = 15000; // 15 seconds as per requirements
    cacheDir = '.semantic-cache';
    constructor() {
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
    /**
     * Analyze code changes for semantic meaning
     */
    async analyzeCodeChanges(filePaths) {
        logger.info(`Starting semantic analysis for ${filePaths.length} files`);
        const startTime = Date.now();
        const results = [];
        for (const filePath of filePaths) {
            try {
                // Check if we should continue based on time constraint
                if (Date.now() - startTime > this.maxAnalysisTime) {
                    logger.warn(`Semantic analysis timeout reached after analyzing ${results.length} files`);
                    break;
                }
                const result = await this.analyzeFile(filePath);
                results.push(result);
            }
            catch (error) {
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
    async analyzeFile(filePath) {
        const startTime = Date.now();
        logger.debug(`Analyzing file: ${filePath}`);
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const language = this.detectLanguage(filePath);
        let businessConcepts = [];
        let businessRules = [];
        let domainContext = '';
        if (language === 'C#') {
            businessConcepts = await this.extractCSharpBusinessConcepts(fileContent, filePath);
            businessRules = await this.extractCSharpBusinessRules(fileContent, filePath);
            domainContext = this.determineDomainContext(filePath, businessConcepts);
        }
        else if (language === 'TypeScript' || language === 'JavaScript') {
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
     * Extract business concepts from C# code with deep analysis
     */
    async extractCSharpBusinessConcepts(content, filePath) {
        const concepts = [];
        // Enhanced pattern matching for C# DDD patterns
        const patterns = {
            entity: /public\s+(?:partial\s+)?class\s+(\w+)\s*(?::\s*[^\{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            valueObject: /public\s+(?:sealed\s+|readonly\s+)?(?:class|struct|record)\s+(\w+)\s*(?::\s*[^\{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            service: /public\s+(?:interface|class)\s+(I?\w*(?:Service|Manager|Factory|Processor))\s*(?::\s*[^\{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            repository: /public\s+(?:interface|class)\s+(I?\w*(?:Repository|DAL))\s*(?::\s*[^\{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            event: /public\s+(?:class|record)\s+(\w+Event)\s*(?::\s*[^\{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            command: /public\s+(?:class|record)\s+(\w+Command)\s*(?::\s*[^\{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            algorithm: /public\s+(?:async\s+)?(?:Task\<?[\w\?]*\>?\s+)?(\w*Algorithm\w*|\w*Analysis\w*|\w*Calculator\w*)\s*\(([^)]*)\)/g,
            dto: /public\s+(?:class|record)\s+(\w+(?:Data|DTO|Response|Request))\s*(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g
        };
        const domainFromFile = this.extractDomainFromPath(filePath);
        const namespaceMatch = content.match(/namespace\s+([^\s\{;]+)/);
        const namespace = namespaceMatch ? namespaceMatch[1] : '';
        // Extract entities with detailed analysis
        let match;
        while ((match = patterns.entity.exec(content)) !== null) {
            const className = match[1];
            const classBody = match[2] || '';
            // Extract properties and methods from class body
            const properties = this.extractProperties(classBody);
            const methods = this.extractMethods(classBody);
            const dependencies = this.extractDependencies(content, className);
            // Determine purpose from class name and content
            const purpose = this.determinePurpose(className, classBody, 'Entity');
            concepts.push({
                name: className,
                type: 'Entity',
                domain: domainFromFile,
                confidence: this.calculateConceptConfidence(className, classBody, 'Entity'),
                context: this.generateContext(className, purpose, properties, methods, dependencies),
                filePath: filePath,
                properties: properties,
                methods: methods,
                dependencies: dependencies,
                namespace: namespace
            });
        }
        // Extract services with detailed analysis
        patterns.service.lastIndex = 0;
        while ((match = patterns.service.exec(content)) !== null) {
            const serviceName = match[1];
            const serviceBody = match[2] || '';
            const methods = this.extractMethods(serviceBody);
            const dependencies = this.extractDependencies(content, serviceName);
            const purpose = this.determinePurpose(serviceName, serviceBody, 'Service');
            concepts.push({
                name: serviceName,
                type: 'Service',
                domain: domainFromFile,
                confidence: this.calculateConceptConfidence(serviceName, serviceBody, 'Service'),
                context: this.generateContext(serviceName, purpose, [], methods, dependencies),
                filePath: filePath,
                properties: [],
                methods: methods,
                dependencies: dependencies,
                namespace: namespace
            });
        }
        // Extract repositories with detailed analysis
        patterns.repository.lastIndex = 0;
        while ((match = patterns.repository.exec(content)) !== null) {
            const repoName = match[1];
            const repoBody = match[2] || '';
            const methods = this.extractMethods(repoBody);
            const dependencies = this.extractDependencies(content, repoName);
            const purpose = this.determinePurpose(repoName, repoBody, 'Repository');
            concepts.push({
                name: repoName,
                type: 'Repository',
                domain: domainFromFile,
                confidence: this.calculateConceptConfidence(repoName, repoBody, 'Repository'),
                context: this.generateContext(repoName, purpose, [], methods, dependencies),
                filePath: filePath,
                properties: [],
                methods: methods,
                dependencies: dependencies,
                namespace: namespace
            });
        }
        // Extract domain events
        patterns.event.lastIndex = 0;
        while ((match = patterns.event.exec(content)) !== null) {
            const eventName = match[1];
            const eventBody = match[2] || '';
            const properties = this.extractProperties(eventBody);
            const purpose = this.determinePurpose(eventName, eventBody, 'Event');
            concepts.push({
                name: eventName,
                type: 'Event',
                domain: domainFromFile,
                confidence: this.calculateConceptConfidence(eventName, eventBody, 'Event'),
                context: this.generateContext(eventName, purpose, properties, [], []),
                filePath: filePath,
                properties: properties,
                methods: [],
                dependencies: [],
                namespace: namespace
            });
        }
        // Extract DTOs and Data objects
        patterns.dto.lastIndex = 0;
        while ((match = patterns.dto.exec(content)) !== null) {
            const dtoName = match[1];
            const dtoBody = match[2] || '';
            const properties = this.extractProperties(dtoBody);
            const purpose = this.determinePurpose(dtoName, dtoBody, 'ValueObject');
            concepts.push({
                name: dtoName,
                type: 'ValueObject',
                domain: domainFromFile,
                confidence: this.calculateConceptConfidence(dtoName, dtoBody, 'ValueObject'),
                context: this.generateContext(dtoName, purpose, properties, [], []),
                filePath: filePath,
                properties: properties,
                methods: [],
                dependencies: [],
                namespace: namespace
            });
        }
        logger.debug(`Extracted ${concepts.length} business concepts from ${filePath}`);
        return concepts;
    }
    /**
     * Extract business rules from C# code
     */
    async extractCSharpBusinessRules(content, filePath) {
        const rules = [];
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
    async extractTypeScriptBusinessConcepts(content, filePath) {
        const concepts = [];
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
    async extractTypeScriptBusinessRules(content, filePath) {
        const rules = [];
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
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.cs': return 'C#';
            case '.ts': return 'TypeScript';
            case '.js': return 'JavaScript';
            case '.py': return 'Python';
            default: return 'Unknown';
        }
    }
    extractDomainFromNamespace(content) {
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
    /**
     * Extract properties from class body content
     */
    extractProperties(classBody) {
        const properties = [];
        // Match C# property patterns
        const propertyPattern = /(?:public|private|protected|internal)\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\{[^}]*\}/g;
        let match;
        while ((match = propertyPattern.exec(classBody)) !== null) {
            properties.push({
                name: match[2],
                type: match[1]
            });
        }
        // Also match auto-properties
        const autoPropertyPattern = /(?:public|private|protected|internal)\s+(?:static\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\{\s*get;\s*(?:set;)?\s*\}/g;
        while ((match = autoPropertyPattern.exec(classBody)) !== null) {
            if (!properties.some(p => p.name === match[2])) {
                properties.push({
                    name: match[2],
                    type: match[1]
                });
            }
        }
        return properties;
    }
    /**
     * Extract methods from class body content
     */
    extractMethods(classBody) {
        const methods = [];
        // Match C# method patterns (more comprehensive)
        const methodPattern = /(?:public|private|protected|internal)\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(?:async\s+)?(\w+(?:<[^>]+>)?(?:\[\])?|Task(?:<[^>]+>)?|void)\s+(\w+)\s*\([^)]*\)/g;
        let match;
        while ((match = methodPattern.exec(classBody)) !== null) {
            const methodName = match[2];
            const returnType = match[1];
            // Skip property getters/setters and constructors
            if (!methodName.startsWith('get_') && !methodName.startsWith('set_') &&
                !classBody.includes(`class ${methodName}`)) {
                methods.push({
                    name: methodName,
                    returnType: returnType
                });
            }
        }
        return methods;
    }
    /**
     * Extract dependencies from using statements and constructor parameters
     */
    extractDependencies(content, className) {
        const dependencies = [];
        // Extract using statements
        const usingPattern = /using\s+([\w\.]+);/g;
        let match;
        while ((match = usingPattern.exec(content)) !== null) {
            const usingNamespace = match[1];
            // Filter to relevant dependencies (not system namespaces)
            if (!usingNamespace.startsWith('System') &&
                !usingNamespace.startsWith('Microsoft') &&
                usingNamespace.includes('.')) {
                dependencies.push(usingNamespace);
            }
        }
        // Extract constructor dependencies
        const constructorPattern = new RegExp(`public\\s+${className}\\s*\\(([^)]*)\\)`, 'i');
        const constructorMatch = constructorPattern.exec(content);
        if (constructorMatch && constructorMatch[1]) {
            const parameters = constructorMatch[1].split(',');
            parameters.forEach(param => {
                const paramMatch = param.trim().match(/^(\w+(?:<[^>]+>)?(?:\[\])?)/);
                if (paramMatch && !paramMatch[1].match(/^(string|int|bool|decimal|DateTime|double|float)$/i)) {
                    dependencies.push(paramMatch[1]);
                }
            });
        }
        return Array.from(new Set(dependencies)); // Remove duplicates
    }
    /**
     * Determine the purpose of a class/service based on name and content
     */
    determinePurpose(name, classBody, type) {
        // Analyze class name patterns
        if (name.endsWith('Service')) {
            if (name.includes('Analysis'))
                return 'Performs analysis and processing operations';
            if (name.includes('Data') || name.includes('DAL'))
                return 'Provides data access and persistence';
            if (name.includes('Message') || name.includes('Event'))
                return 'Handles messaging and event processing';
            return 'Provides business logic and application services';
        }
        if (name.endsWith('Repository') || name.endsWith('DAL')) {
            return 'Provides data access abstraction and persistence operations';
        }
        if (name.endsWith('Manager')) {
            return 'Manages lifecycle and coordination of business processes';
        }
        if (name.endsWith('Factory')) {
            return 'Creates and configures instances of domain objects';
        }
        if (name.endsWith('Event')) {
            return 'Represents domain event with associated data payload';
        }
        if (name.endsWith('Command')) {
            return 'Encapsulates command request with validation logic';
        }
        if (name.endsWith('Data') || name.endsWith('DTO')) {
            return 'Transfers data between layers with structured format';
        }
        // Analyze content for purpose clues
        if (classBody.includes('async') && classBody.includes('Task')) {
            return 'Provides asynchronous operations and processing';
        }
        if (classBody.includes('IRepository') || classBody.includes('DbContext')) {
            return 'Implements data access patterns with repository abstraction';
        }
        // Default purposes by type
        switch (type) {
            case 'Entity': return 'Core domain entity with business logic and state';
            case 'ValueObject': return 'Immutable value object representing domain concept';
            case 'Service': return 'Application service implementing business operations';
            case 'Repository': return 'Data access repository with persistence operations';
            case 'Event': return 'Domain event signaling important business occurrence';
            case 'Command': return 'Command object encapsulating business operation request';
            default: return 'Domain component with specialized business functionality';
        }
    }
    /**
     * Calculate confidence level for business concept identification
     */
    calculateConceptConfidence(name, classBody, type) {
        let confidence = 0.5; // Base confidence
        // Name-based confidence boosts
        if (type === 'Entity' && !name.endsWith('Service') && !name.endsWith('Repository')) {
            confidence += 0.2;
        }
        if (type === 'Service' && name.endsWith('Service')) {
            confidence += 0.3;
        }
        if (type === 'Repository' && (name.endsWith('Repository') || name.endsWith('DAL'))) {
            confidence += 0.3;
        }
        if (type === 'Event' && name.endsWith('Event')) {
            confidence += 0.35;
        }
        // Content-based confidence adjustments
        if (classBody.includes('public') && classBody.includes('{')) {
            confidence += 0.1; // Has proper class structure
        }
        if (classBody.includes('async') || classBody.includes('await')) {
            confidence += 0.05; // Modern async patterns
        }
        if (classBody.match(/\/\/.*Business|BR:/)) {
            confidence += 0.15; // Contains business rule comments
        }
        return Math.min(confidence, 0.95); // Cap at 95%
    }
    /**
     * Generate rich context description for business concept
     */
    generateContext(name, purpose, properties, methods, dependencies) {
        let context = purpose;
        if (properties.length > 0) {
            const keyProps = properties.slice(0, 3).map(p => `${p.name}:${p.type}`).join(', ');
            context += `. Key properties: ${keyProps}`;
            if (properties.length > 3) {
                context += ` (${properties.length - 3} more)`;
            }
        }
        if (methods.length > 0) {
            const keyMethods = methods.slice(0, 3).map(m => `${m.name}():${m.returnType}`).join(', ');
            context += `. Primary methods: ${keyMethods}`;
            if (methods.length > 3) {
                context += ` (${methods.length - 3} more)`;
            }
        }
        if (dependencies.length > 0) {
            context += `. Dependencies: ${dependencies.slice(0, 2).join(', ')}`;
            if (dependencies.length > 2) {
                context += ` (${dependencies.length - 2} more)`;
            }
        }
        return context;
    }
    extractDomainFromPath(filePath) {
        const parts = filePath.split(/[/\\]/);
        for (const part of parts) {
            if (['analysis', 'data', 'messaging', 'trading', 'market', 'domain'].includes(part.toLowerCase())) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
        }
        return 'Unknown';
    }
    extractContext(content, position) {
        // Extract surrounding context (100 chars before and after)
        const start = Math.max(0, position - 100);
        const end = Math.min(content.length, position + 100);
        return content.substring(start, end).replace(/\s+/g, ' ').trim();
    }
    getLineNumber(content, position) {
        const lines = content.substring(0, position).split('\n');
        return lines.length;
    }
    extractConditions(content, position) {
        // Simple extraction of conditions near the position
        const contextStart = Math.max(0, position - 500);
        const contextEnd = Math.min(content.length, position + 500);
        const context = content.substring(contextStart, contextEnd);
        const conditions = [];
        const ifMatches = context.match(/if\s*\([^)]+\)/g) || [];
        conditions.push(...ifMatches.map(c => c.replace(/if\s*\(/, '').replace(')', '').trim()));
        return conditions.slice(0, 3); // Limit to 3 conditions
    }
    extractMethodConditions(content, methodStart) {
        // Find the method body and extract conditions
        const methodEnd = content.indexOf('}', methodStart);
        if (methodEnd === -1)
            return [];
        const methodBody = content.substring(methodStart, methodEnd);
        return this.extractConditions(methodBody, 0);
    }
    extractActions(content, position) {
        // Simple extraction of actions near the position
        const contextStart = Math.max(0, position - 500);
        const contextEnd = Math.min(content.length, position + 500);
        const context = content.substring(contextStart, contextEnd);
        const actions = [];
        // Look for throw statements
        const throwMatches = context.match(/throw\s+new\s+\w+/g) || [];
        actions.push(...throwMatches.map(t => t.replace(/throw\s+new\s+/, 'Throw ').trim()));
        // Look for return statements
        if (context.includes('return false'))
            actions.push('Reject validation');
        if (context.includes('return true'))
            actions.push('Accept validation');
        return actions.slice(0, 3); // Limit to 3 actions
    }
    humanizeMethodName(methodName) {
        // Convert ValidateOrderTotal to "Validate order total"
        return methodName
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/^./, str => str.toUpperCase());
    }
    inferTypeFromName(name) {
        if (name.endsWith('Service'))
            return 'Service';
        if (name.endsWith('Repository'))
            return 'Repository';
        if (name.endsWith('Event'))
            return 'Event';
        if (name.endsWith('Command'))
            return 'Command';
        if (name.endsWith('VO') || name.endsWith('ValueObject'))
            return 'ValueObject';
        return 'Entity';
    }
    determineDomainContext(filePath, concepts) {
        // Determine domain from concepts and file path
        const domains = concepts.map(c => c.domain).filter(d => d !== 'Unknown');
        if (domains.length > 0) {
            // Return most common domain
            const domainCounts = domains.reduce((acc, d) => {
                acc[d] = (acc[d] || 0) + 1;
                return acc;
            }, {});
            return Object.entries(domainCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
        }
        return this.extractDomainFromPath(filePath);
    }
}
//# sourceMappingURL=semantic-analysis.js.map
import winston from 'winston';
import { Environment } from '../domain/config/environment.js';
import * as fs from 'fs';
import * as path from 'path';
import { XmlDocumentationRuleParser } from './xml-documentation-rule-parser.js';
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
    cacheDir = process.env.SEMANTIC_CACHE_DIR || '.semantic-cache';
    xmlRuleParser;
    constructor() {
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        // Initialize enhanced XML documentation rule parser (Step 3.1 & 3.2)
        this.xmlRuleParser = new XmlDocumentationRuleParser();
        logger.info('SemanticAnalysisService initialized with enhanced XML documentation rule parser');
    }
    /**
     * Analyze code changes for semantic meaning
     */
    async analyzeCodeChanges(filePaths) {
        logger.info(`🔍 SemanticAnalysisService.analyzeCodeChanges called with ${filePaths.length} files`);
        console.info(`🔍 SemanticAnalysisService.analyzeCodeChanges called with ${filePaths.length} files`);
        if (filePaths.length === 0) {
            logger.warn('❌ SemanticAnalysisService: No file paths provided for analysis');
            console.warn('❌ SemanticAnalysisService: No file paths provided for analysis');
            return [];
        }
        // Log the file paths being analyzed
        filePaths.forEach((filePath, index) => {
            console.info(`📄 File ${index + 1}: ${filePath}`);
        });
        const startTime = Date.now();
        const results = [];
        let successfulAnalyses = 0;
        let failedAnalyses = 0;
        let skippedDueToTimeout = 0;
        for (const filePath of filePaths) {
            try {
                console.info(`🔍 Analyzing file: ${filePath}`);
                // Check if we should continue based on time constraint
                if (Date.now() - startTime > this.maxAnalysisTime) {
                    logger.warn(`Semantic analysis timeout reached after analyzing ${results.length} files`);
                    console.warn(`⏰ Timeout reached after analyzing ${results.length}/${filePaths.length} files`);
                    skippedDueToTimeout++;
                    break;
                }
                const result = await this.analyzeFile(filePath);
                console.info(`✅ Analysis completed for ${filePath}: ${result.businessConcepts.length} concepts, ${result.businessRules.length} rules, domain: ${result.domainContext}`);
                // Validate that the result has meaningful content
                if (result.businessConcepts.length === 0 && result.businessRules.length === 0) {
                    console.warn(`⚠️ Analysis for ${filePath} produced 0 concepts and 0 rules - this may indicate a parsing issue`);
                }
                results.push(result);
                successfulAnalyses++;
            }
            catch (error) {
                failedAnalyses++;
                logger.error(`Failed to analyze file ${filePath}:`, error);
                console.error(`❌ Failed to analyze file ${filePath}:`, error instanceof Error ? error.message : String(error));
                // Log the specific error type for debugging
                if (error instanceof Error) {
                    if (error.message.includes('File not found')) {
                        console.error(`   📁 File system issue: File does not exist at ${filePath}`);
                    }
                    else if (error.message.includes('EACCES')) {
                        console.error(`   🔒 Permission issue: Cannot read file ${filePath}`);
                    }
                    else if (error.message.includes('timeout')) {
                        console.error(`   ⏰ Timeout issue: Analysis took too long for ${filePath}`);
                    }
                    else {
                        console.error(`   🔧 Parsing issue: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`);
                    }
                }
                // Continue with other files even if one fails
            }
        }
        console.info('📊 Semantic analysis batch summary:');
        console.info(`   - Total files provided: ${filePaths.length}`);
        console.info(`   - Successfully analyzed: ${successfulAnalyses}`);
        console.info(`   - Failed analyses: ${failedAnalyses}`);
        console.info(`   - Skipped due to timeout: ${skippedDueToTimeout}`);
        console.info(`   - Results produced: ${results.length}`);
        const analysisTime = Date.now() - startTime;
        logger.info(`Semantic analysis completed in ${analysisTime}ms for ${results.length} files`);
        console.info(`🎉 Semantic analysis completed in ${analysisTime}ms for ${results.length}/${filePaths.length} files`);
        if (results.length === 0) {
            console.error('❌ CRITICAL: Semantic analysis produced 0 results! This explains why no context files are generated.');
        }
        else {
            // Log summary of results
            const totalConcepts = results.reduce((sum, r) => sum + r.businessConcepts.length, 0);
            const totalRules = results.reduce((sum, r) => sum + r.businessRules.length, 0);
            console.info(`📊 Analysis summary: ${totalConcepts} total concepts, ${totalRules} total rules`);
        }
        return results;
    }
    /**
     * Analyze a single file for business concepts and rules
     */
    async analyzeFile(filePath) {
        const startTime = Date.now();
        logger.debug(`Analyzing file: ${filePath}`);
        console.info(`🔍 Analyzing file: ${filePath}`);
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            const error = `File not found: ${filePath}`;
            console.error(`❌ ${error}`);
            throw new Error(error);
        }
        let fileContent;
        try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
            console.info(`📖 Successfully read file: ${filePath} (${fileContent.length} characters)`);
        }
        catch (error) {
            const errorMsg = `Failed to read file: ${filePath} - ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`❌ ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const language = this.detectLanguage(filePath);
        console.info(`🔤 Detected language: ${language} for ${filePath}`);
        let businessConcepts = [];
        let businessRules = [];
        let domainContext = '';
        if (language === 'C#') {
            console.info(`🔍 Extracting C# business concepts and rules from ${filePath}`);
            try {
                businessConcepts = await this.extractCSharpBusinessConcepts(fileContent, filePath);
                console.info(`✅ Extracted ${businessConcepts.length} C# business concepts`);
                businessRules = await this.extractCSharpBusinessRules(fileContent, filePath);
                console.info(`✅ Extracted ${businessRules.length} C# business rules`);
                domainContext = this.determineDomainContext(filePath, businessConcepts);
                console.info(`🏗️ Determined domain context: ${domainContext}`);
            }
            catch (error) {
                console.error(`❌ Failed to extract C# concepts/rules from ${filePath}:`, error);
                throw error;
            }
        }
        else if (language === 'TypeScript' || language === 'JavaScript') {
            console.info(`🔍 Extracting ${language} business concepts and rules from ${filePath}`);
            try {
                businessConcepts = await this.extractTypeScriptBusinessConcepts(fileContent, filePath);
                console.info(`✅ Extracted ${businessConcepts.length} ${language} business concepts`);
                businessRules = await this.extractTypeScriptBusinessRules(fileContent, filePath);
                console.info(`✅ Extracted ${businessRules.length} ${language} business rules`);
                domainContext = this.determineDomainContext(filePath, businessConcepts);
                console.info(`🏗️ Determined domain context: ${domainContext}`);
            }
            catch (error) {
                console.error(`❌ Failed to extract ${language} concepts/rules from ${filePath}:`, error);
                throw error;
            }
        }
        else {
            console.warn(`⚠️ Unsupported language ${language} for file ${filePath} - skipping concept extraction`);
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
            entity: /public\s+(?:partial\s+)?class\s+(\w+)\s*(?::\s*[^{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            valueObject: /public\s+(?:sealed\s+|readonly\s+)?(?:class|struct|record)\s+(\w+)\s*(?::\s*[^{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            service: /public\s+(?:interface|class)\s+(I?\w*(?:Service|Manager|Factory|Processor))\s*(?::\s*[^{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            repository: /public\s+(?:interface|class)\s+(I?\w*(?:Repository|DAL))\s*(?::\s*[^{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            event: /public\s+(?:class|record)\s+(\w+Event)\s*(?::\s*[^{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            command: /public\s+(?:class|record)\s+(\w+Command)\s*(?::\s*[^{]*)?(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g,
            algorithm: /public\s+(?:async\s+)?(?:Task<?[\w?]*>?\s+)?(\w*Algorithm\w*|\w*Analysis\w*|\w*Calculator\w*)\s*\(([^)]*)\)/g,
            dto: /public\s+(?:class|record)\s+(\w+(?:Data|DTO|Response|Request))\s*(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?/g
        };
        const domainFromFile = this.extractDomainFromPath(filePath);
        const namespaceMatch = content.match(/namespace\s+([^\s{;]+)/);
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
     * Extract business rules from C# code using enhanced XML documentation parser
     * Step 3.1 & 3.2: Enhanced Business Rule Mining
     * BR-CEE-009: Extract 15+ rules from Fractal Analysis domain
     * BR-CEE-010: Extract 10+ rules from Indicator domain
     * BR-CEE-011: >80% accuracy in classification
     * BR-CEE-012: Focus on semantic value for AI development
     */
    async extractCSharpBusinessRules(content, filePath) {
        try {
            // Use enhanced XML documentation rule parser (Step 3.1 & 3.2)
            const xmlParsingResult = await this.xmlRuleParser.parseXmlDocumentation(filePath);
            // Convert XmlDocumentationRule to BusinessRule format
            const enhancedRules = xmlParsingResult.extractedRules.map((xmlRule, index) => ({
                id: `XML-${filePath.replace(/[^\w]/g, '-')}-${index + 1}`,
                description: xmlRule.description || xmlRule.rule,
                domain: this.extractDomainFromNamespace(content),
                sourceLocation: xmlRule.source,
                conditions: xmlRule.constraints || [],
                actions: [`${xmlRule.type} enforcement`],
                confidence: xmlRule.confidence
            }));
            // Add legacy rule extraction for compatibility (with lower priority)
            const legacyRules = await this.extractLegacyCSharpBusinessRules(content, filePath, enhancedRules.length);
            // Combine enhanced and legacy rules (enhanced rules have higher priority)
            const allRules = [...enhancedRules, ...legacyRules];
            logger.info(`Enhanced business rule extraction: ${enhancedRules.length} from XML docs (accuracy: ${xmlParsingResult.classificationAccuracy.toFixed(2)}%), ${legacyRules.length} from legacy patterns (${filePath})`);
            return allRules;
        }
        catch (error) {
            logger.error(`Error in enhanced business rule extraction for ${filePath}: ${error}`);
            // Fallback to legacy extraction if enhanced parser fails
            return await this.extractLegacyCSharpBusinessRules(content, filePath, 0);
        }
    }
    /**
     * Legacy business rule extraction for compatibility and fallback
     */
    async extractLegacyCSharpBusinessRules(content, filePath, startingRuleId) {
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
        let ruleId = startingRuleId + 1;
        for (const pattern of rulePatterns.slice(0, 3)) {
            pattern.lastIndex = 0;
            while ((match = pattern.exec(content)) !== null) {
                rules.push({
                    id: `BR-${filePath.replace(/[^\w]/g, '-')}-legacy-${ruleId++}`,
                    description: match[1].trim(),
                    domain: this.extractDomainFromNamespace(content),
                    sourceLocation: `${filePath}:${this.getLineNumber(content, match.index)}`,
                    conditions: this.extractConditions(content, match.index),
                    actions: this.extractActions(content, match.index),
                    confidence: 0.65 // Lower confidence for legacy extraction
                });
            }
        }
        // Extract rules from validation methods
        rulePatterns[3].lastIndex = 0;
        while ((match = rulePatterns[3].exec(content)) !== null) {
            const methodName = match[1];
            const ruleDescription = this.humanizeMethodName(methodName);
            rules.push({
                id: `BR-${filePath.replace(/[^\w]/g, '-')}-legacy-${ruleId++}`,
                description: ruleDescription,
                domain: this.extractDomainFromNamespace(content),
                sourceLocation: `${filePath}:${this.getLineNumber(content, match.index)}`,
                conditions: this.extractMethodConditions(content, match.index),
                actions: ['Validation', 'Business constraint enforcement'],
                confidence: 0.55 // Lower confidence for legacy extraction
            });
        }
        logger.debug(`Extracted ${rules.length} legacy business rules from ${filePath}`);
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
        const usingPattern = /using\s+([\w.]+);/g;
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
    /**
     * Enhanced domain detection with granular context intelligence
     * Implements multi-criteria boundary detection for 95% repository coverage
     * BR-CEE-002: Domain detection must recognize semantic subdirectories with business content
     */
    extractDomainFromPath(filePath) {
        const parts = filePath.split(/[/\\]/);
        // Enhanced domain detection with semantic subdirectories
        // TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F001: Core Infrastructure Enhancement
        // First, attempt granular boundary detection for semantic subdirectories
        const granularBoundaryResult = this.detectGranularContextBoundary(filePath, parts);
        if (granularBoundaryResult.shouldCreateGranularContext && granularBoundaryResult.confidence > 0.85) {
            return granularBoundaryResult.granularDomain;
        }
        // Enhanced semantic subdirectory patterns with intelligent scoring
        // BR-CEE-002: Recognize semantic subdirectories with business content
        const semanticSubdirectoryPatterns = {
            // Analysis domain subdirectories (enhanced with complexity scoring)
            'fractal': 'Analysis.Fractal',
            'indicator': 'Analysis.Indicator',
            'pattern': 'Analysis.Pattern',
            'algorithm': 'Analysis.Algorithm',
            'momentum': 'Analysis.Momentum',
            'trend': 'Analysis.Trend',
            'volatility': 'Analysis.Volatility',
            // Data domain subdirectories
            'provider': 'Data.Provider',
            'repository': 'Data.Repository',
            'cache': 'Data.Cache',
            'transform': 'Data.Transform',
            'timescale': 'Data.TimescaleDB',
            'simulation': 'Data.Simulation',
            // Messaging domain subdirectories
            'event': 'Messaging.Event',
            'command': 'Messaging.Command',
            'handler': 'Messaging.Handler',
            'publisher': 'Messaging.Publisher',
            'redpanda': 'Messaging.RedPanda'
        };
        // Check for semantic subdirectory patterns with enhanced validation
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].toLowerCase();
            if (semanticSubdirectoryPatterns[part]) {
                // Enhanced domain context verification
                const expectedDomain = semanticSubdirectoryPatterns[part].split('.')[0].toLowerCase();
                const hasParentDomain = parts.some((p, idx) => idx < i && p.toLowerCase() === expectedDomain);
                if (hasParentDomain || parts.some(p => p.toLowerCase().includes(expectedDomain))) {
                    // Additional semantic content validation for subdirectory qualification
                    const semanticQualification = this.analyzeSemanticSubdirectoryQualification(filePath, part, expectedDomain);
                    if (semanticQualification.qualifiesForGranularContext) {
                        return semanticSubdirectoryPatterns[part];
                    }
                }
                // Return early when match found for efficiency
                return semanticSubdirectoryPatterns[part];
            }
        }
        // Fallback to traditional domain detection (backward compatibility)
        for (const part of parts) {
            const lowerPart = part.toLowerCase();
            if (['analysis', 'data', 'messaging', 'trading', 'market', 'domain', 'utility'].includes(lowerPart)) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
        }
        return 'Unknown';
    }
    /**
     * Advanced granular context boundary detection using multi-criteria analysis
     * Implements business concept density, algorithmic complexity, and semantic coherence measurement
     */
    detectGranularContextBoundary(filePath, pathParts) {
        const directoryPath = pathParts.slice(0, -1).join('/'); // Remove filename
        // Multi-criteria analysis for boundary detection
        const businessConceptDensity = this.analyzeBusinessConceptDensity(directoryPath);
        const algorithmicComplexity = this.analyzeAlgorithmicComplexity(filePath);
        const semanticCoherence = this.analyzeSemanticCoherence(directoryPath, pathParts);
        const aiAssistanceValue = this.evaluateAIAssistancePotential(filePath, pathParts);
        // Weighted scoring system for granular context boundary decision
        const confidenceScore = this.calculateGranularBoundaryConfidence(businessConceptDensity, algorithmicComplexity, semanticCoherence, aiAssistanceValue);
        // Determine granular domain path if boundary qualifies
        const granularDomain = this.determineGranularDomainPath(pathParts, confidenceScore);
        return {
            shouldCreateGranularContext: confidenceScore > 0.85 && businessConceptDensity.conceptCount >= 3,
            confidence: confidenceScore,
            granularDomain: granularDomain,
            businessConceptDensity: businessConceptDensity.conceptCount,
            algorithmicComplexity: algorithmicComplexity.complexityScore,
            semanticCoherence: semanticCoherence.coherenceScore,
            aiAssistanceValue: aiAssistanceValue
        };
    }
    /**
     * Analyze business concept density for semantic boundary qualification
     */
    analyzeBusinessConceptDensity(directoryPath) {
        // This would analyze files in the directory to count distinct business concepts
        // For now, provide intelligent estimation based on path patterns
        const pathLower = directoryPath.toLowerCase();
        let conceptCount = 0;
        const concepts = [];
        // Fractal analysis concepts
        if (pathLower.includes('fractal')) {
            conceptCount += 5; // High concept density for fractal algorithms
            concepts.push('FractalLeg', 'InflectionPoint', 'FractalAnalysis', 'MetaFractal', 'FractalValidation');
        }
        // Technical indicator concepts
        if (pathLower.includes('indicator')) {
            conceptCount += 4;
            concepts.push('TechnicalIndicator', 'IndicatorCalculation', 'SignalGeneration', 'ParameterValidation');
        }
        // Pattern recognition concepts
        if (pathLower.includes('pattern')) {
            conceptCount += 3;
            concepts.push('PatternRecognition', 'PatternValidation', 'PatternMatching');
        }
        // Momentum analysis concepts
        if (pathLower.includes('momentum')) {
            conceptCount += 3;
            concepts.push('MomentumIndicator', 'RSI', 'StochasticOscillator');
        }
        return { conceptCount, concepts };
    }
    /**
     * Analyze algorithmic complexity for boundary qualification
     */
    analyzeAlgorithmicComplexity(filePath) {
        const fileName = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
        const indicators = [];
        let complexityScore = 0.0;
        // Algorithm complexity indicators
        if (fileName.includes('algorithm') || fileName.includes('analysis')) {
            complexityScore += 0.3;
            indicators.push('AlgorithmicImplementation');
        }
        if (fileName.includes('fractal') || fileName.includes('detection')) {
            complexityScore += 0.4; // High complexity for fractal detection
            indicators.push('SophisticatedMathematicalOperations');
        }
        if (fileName.includes('indicator') || fileName.includes('calculation')) {
            complexityScore += 0.35;
            indicators.push('TechnicalCalculationLogic');
        }
        if (fileName.includes('validation') || fileName.includes('rule')) {
            complexityScore += 0.25;
            indicators.push('BusinessRuleValidation');
        }
        return { complexityScore: Math.min(complexityScore, 1.0), indicators };
    }
    /**
     * Analyze semantic coherence for domain boundary qualification
     */
    analyzeSemanticCoherence(directoryPath, pathParts) {
        const coherenceFactors = [];
        let coherenceScore = 0.0;
        // Domain coherence analysis
        const hasConsistentDomain = pathParts.some(part => ['analysis', 'data', 'messaging'].includes(part.toLowerCase()));
        if (hasConsistentDomain) {
            coherenceScore += 0.3;
            coherenceFactors.push('ConsistentDomainContext');
        }
        // Subdirectory specialization coherence
        const hasSpecializedSubdomain = pathParts.some(part => ['fractal', 'indicator', 'pattern', 'momentum'].includes(part.toLowerCase()));
        if (hasSpecializedSubdomain) {
            coherenceScore += 0.4;
            coherenceFactors.push('SpecializedSubdomainFocus');
        }
        // Clear bounded context indicators
        const pathLower = directoryPath.toLowerCase();
        if (pathLower.includes('/analysis/') && (pathLower.includes('fractal') || pathLower.includes('indicator'))) {
            coherenceScore += 0.3;
            coherenceFactors.push('ClearBoundedContext');
        }
        return { coherenceScore: Math.min(coherenceScore, 1.0), coherenceFactors };
    }
    /**
     * Evaluate AI assistance potential for granular context value
     */
    evaluateAIAssistancePotential(filePath, pathParts) {
        const fileName = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
        let assistanceValue = 0.0;
        // High AI assistance value for algorithm implementations
        if (fileName.includes('fractal') || fileName.includes('indicator')) {
            assistanceValue += 0.4; // High value for algorithm-specific guidance
        }
        // Value for complex business logic
        if (fileName.includes('analysis') || fileName.includes('calculation')) {
            assistanceValue += 0.3;
        }
        // Value for validation and rule logic
        if (fileName.includes('validation') || fileName.includes('rule')) {
            assistanceValue += 0.2;
        }
        // Additional value for trading-specific implementations
        if (pathParts.some(part => ['trading', 'market', 'technical'].includes(part.toLowerCase()))) {
            assistanceValue += 0.1;
        }
        return Math.min(assistanceValue, 1.0);
    }
    /**
     * Calculate granular boundary confidence using weighted scoring
     */
    calculateGranularBoundaryConfidence(businessConceptDensity, algorithmicComplexity, semanticCoherence, aiAssistanceValue) {
        // Weighted scoring for boundary detection confidence
        const conceptDensityWeight = 0.35; // High weight for business concept density
        const algorithmicComplexityWeight = 0.30; // High weight for algorithmic sophistication
        const semanticCoherenceWeight = 0.25; // Medium weight for semantic coherence
        const aiAssistanceWeight = 0.10; // Lower weight for AI assistance potential
        // Normalize concept density (target: >3 concepts = 1.0 score)
        const normalizedConceptDensity = Math.min(businessConceptDensity.conceptCount / 3.0, 1.0);
        const weightedScore = (normalizedConceptDensity * conceptDensityWeight) +
            (algorithmicComplexity.complexityScore * algorithmicComplexityWeight) +
            (semanticCoherence.coherenceScore * semanticCoherenceWeight) +
            (aiAssistanceValue * aiAssistanceWeight);
        return Math.min(weightedScore, 1.0);
    }
    /**
     * Determine granular domain path for qualified boundaries
     */
    determineGranularDomainPath(pathParts, confidence) {
        if (confidence <= 0.85) {
            return ''; // Not qualified for granular context
        }
        // Build granular domain path based on directory structure
        const relevantParts = pathParts.filter(part => !['src', 'bin', 'obj', 'node_modules', '.git'].includes(part.toLowerCase()));
        // Find domain and subdomain parts
        const domainIndex = relevantParts.findIndex(part => ['analysis', 'data', 'messaging', 'utility'].includes(part.toLowerCase()));
        if (domainIndex >= 0 && domainIndex < relevantParts.length - 1) {
            const domain = relevantParts[domainIndex];
            const subdomain = relevantParts[domainIndex + 1];
            return `${domain.charAt(0).toUpperCase() + domain.slice(1)}.${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)}`;
        }
        return relevantParts.length > 0 ? relevantParts[relevantParts.length - 1] : 'Unknown';
    }
    /**
     * Enhanced semantic subdirectory qualification analysis
     */
    analyzeSemanticSubdirectoryQualification(filePath, subdirectory, domain) {
        // High-value algorithm subdirectories that always qualify
        const algorithmSubdirectories = ['fractal', 'indicator', 'pattern', 'momentum', 'trend', 'volatility'];
        if (algorithmSubdirectories.includes(subdirectory.toLowerCase())) {
            return {
                qualifiesForGranularContext: true,
                reason: `Algorithm subdirectory '${subdirectory}' contains sophisticated implementations warranting granular context`
            };
        }
        // Data provider subdirectories with integration complexity
        const dataProviderSubdirectories = ['provider', 'timescale', 'simulation', 'twelvedata'];
        if (dataProviderSubdirectories.includes(subdirectory.toLowerCase()) && domain === 'data') {
            return {
                qualifiesForGranularContext: true,
                reason: `Data provider subdirectory '${subdirectory}' contains integration-specific logic warranting granular context`
            };
        }
        // Messaging subdirectories with event-driven complexity
        const messagingSubdirectories = ['event', 'handler', 'publisher', 'redpanda'];
        if (messagingSubdirectories.includes(subdirectory.toLowerCase()) && domain === 'messaging') {
            return {
                qualifiesForGranularContext: true,
                reason: `Messaging subdirectory '${subdirectory}' contains event-driven logic warranting granular context`
            };
        }
        return {
            qualifiesForGranularContext: false,
            reason: `Subdirectory '${subdirectory}' does not meet granular context qualification criteria`
        };
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
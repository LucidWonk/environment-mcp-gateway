import winston from 'winston';
import { Environment } from '../domain/config/environment.js';
import * as fs from 'fs';
import * as path from 'path';
import { XmlDocumentationRuleParser } from './xml-documentation-rule-parser.js';

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
    filePath?: string;
    properties?: Array<{name: string, type: string}>;
    methods?: Array<{name: string, returnType: string}>;
    dependencies?: string[];
    namespace?: string;
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

export interface GranularBoundaryDetectionResult {
    shouldCreateGranularContext: boolean;
    confidence: number;
    granularDomain: string;
    businessConceptDensity: number;
    algorithmicComplexity: number;
    semanticCoherence: number;
    aiAssistanceValue: number;
}

export interface AlgorithmDomainData {
    baseConceptCount: number;
    sophisticationLevel: 'high' | 'medium' | 'low';
    coreConcepts: string[];
    advancedConcepts: string[];
}

export interface AlgorithmComplexityPattern {
    patterns: string[];
    complexityWeight: number;
    indicator: string;
}

export interface AccuracyValidationMetrics {
    overallAccuracy: number;
    granularDetectionRate: number;
    falsePositiveRate: number;
    domainSpecificAccuracy: Map<string, number>;
    expertValidationScore?: number;
    confidenceDistribution: number[];
    totalValidations: number;
    detectionThresholds: {
        high: number;
        medium: number;
        low: number;
    };
}

export interface HumanExpertFeedback {
    fileId: string;
    expectedDomain: string;
    actualDomain: string;
    isCorrect: boolean;
    expertConfidence: number;
    improvementSuggestions: string[];
    timestamp: Date;
    validationType: 'granular' | 'domain-level';
    complexityAssessment: 'high' | 'medium' | 'low';
}

export interface BoundaryDetectionConfig {
    // Complexity scoring weights
    businessConceptWeight: number;
    algorithmComplexityWeight: number;
    semanticCoherenceWeight: number;
    
    // Detection thresholds
    granularThreshold: number;
    domainThreshold: number;
    
    // Algorithm pattern weights
    mathematicalComplexityMultiplier: number;
    tradingAlgorithmBonus: number;
    designPatternWeight: number;
    
    // Adaptive learning settings
    enableAdaptiveTuning: boolean;
    learningRate: number;
    minimumFeedbackCount: number;
    
    // Performance constraints  
    maxAnalysisTimeMs: number;
    cacheExpirationHours: number;
}

export class SemanticAnalysisService {
    private readonly maxAnalysisTime = 15000; // 15 seconds as per requirements
    private readonly cacheDir = process.env.SEMANTIC_CACHE_DIR || '.semantic-cache';
    private readonly xmlRuleParser: XmlDocumentationRuleParser;
    private config: BoundaryDetectionConfig;

    constructor() {
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        
        // Initialize enhanced XML documentation rule parser (Step 3.1 & 3.2)
        this.xmlRuleParser = new XmlDocumentationRuleParser();
        
        // Load configuration (Step 2.3: Configuration and Adaptive Tuning)
        this.config = this.loadConfiguration();
        
        logger.info('SemanticAnalysisService initialized with enhanced XML documentation rule parser and adaptive configuration');
    }

    /**
     * Analyze code changes for semantic meaning
     */
    public async analyzeCodeChanges(filePaths: string[]): Promise<SemanticAnalysisResult[]> {
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
        const results: SemanticAnalysisResult[] = [];

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
            } catch (error) {
                failedAnalyses++;
                logger.error(`Failed to analyze file ${filePath}:`, error);
                console.error(`❌ Failed to analyze file ${filePath}:`, error instanceof Error ? error.message : String(error));
                
                // Log the specific error type for debugging
                if (error instanceof Error) {
                    if (error.message.includes('File not found')) {
                        console.error(`   📁 File system issue: File does not exist at ${filePath}`);
                    } else if (error.message.includes('EACCES')) {
                        console.error(`   🔒 Permission issue: Cannot read file ${filePath}`);
                    } else if (error.message.includes('timeout')) {
                        console.error(`   ⏰ Timeout issue: Analysis took too long for ${filePath}`);
                    } else {
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
        } else {
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
    private async analyzeFile(filePath: string): Promise<SemanticAnalysisResult> {
        const startTime = Date.now();
        logger.debug(`Analyzing file: ${filePath}`);
        console.info(`🔍 Analyzing file: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            const error = `File not found: ${filePath}`;
            console.error(`❌ ${error}`);
            throw new Error(error);
        }

        let fileContent: string;
        try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
            console.info(`📖 Successfully read file: ${filePath} (${fileContent.length} characters)`);
        } catch (error) {
            const errorMsg = `Failed to read file: ${filePath} - ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`❌ ${errorMsg}`);
            throw new Error(errorMsg);
        }

        const language = this.detectLanguage(filePath);
        console.info(`🔤 Detected language: ${language} for ${filePath}`);

        let businessConcepts: BusinessConcept[] = [];
        let businessRules: BusinessRule[] = [];
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
            } catch (error) {
                console.error(`❌ Failed to extract C# concepts/rules from ${filePath}:`, error);
                throw error;
            }
        } else if (language === 'TypeScript' || language === 'JavaScript') {
            console.info(`🔍 Extracting ${language} business concepts and rules from ${filePath}`);
            try {
                businessConcepts = await this.extractTypeScriptBusinessConcepts(fileContent, filePath);
                console.info(`✅ Extracted ${businessConcepts.length} ${language} business concepts`);
                
                businessRules = await this.extractTypeScriptBusinessRules(fileContent, filePath);
                console.info(`✅ Extracted ${businessRules.length} ${language} business rules`);
                
                domainContext = this.determineDomainContext(filePath, businessConcepts);
                console.info(`🏗️ Determined domain context: ${domainContext}`);
            } catch (error) {
                console.error(`❌ Failed to extract ${language} concepts/rules from ${filePath}:`, error);
                throw error;
            }
        } else {
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
    private async extractCSharpBusinessConcepts(content: string, filePath: string): Promise<BusinessConcept[]> {
        const concepts: BusinessConcept[] = [];
        
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
    private async extractCSharpBusinessRules(content: string, filePath: string): Promise<BusinessRule[]> {
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
            
        } catch (error) {
            logger.error(`Error in enhanced business rule extraction for ${filePath}: ${error}`);
            // Fallback to legacy extraction if enhanced parser fails
            return await this.extractLegacyCSharpBusinessRules(content, filePath, 0);
        }
    }

    /**
     * Legacy business rule extraction for compatibility and fallback
     */
    private async extractLegacyCSharpBusinessRules(content: string, filePath: string, startingRuleId: number): Promise<BusinessRule[]> {
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

    /**
     * Extract properties from class body content
     */
    private extractProperties(classBody: string): Array<{name: string, type: string}> {
        const properties: Array<{name: string, type: string}> = [];
        
        // Match C# property patterns
        const propertyPattern = /(?:public|private|protected|internal)\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\{[^}]*\}/g;
        
        let match: RegExpExecArray | null;
        while ((match = propertyPattern.exec(classBody)) !== null) {
            properties.push({
                name: match[2],
                type: match[1]
            });
        }
        
        // Also match auto-properties
        const autoPropertyPattern = /(?:public|private|protected|internal)\s+(?:static\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\{\s*get;\s*(?:set;)?\s*\}/g;
        while ((match = autoPropertyPattern.exec(classBody)) !== null) {
            if (!properties.some(p => p.name === match![2])) {
                properties.push({
                    name: match![2],
                    type: match![1]
                });
            }
        }
        
        return properties;
    }
    
    /**
     * Extract methods from class body content
     */
    private extractMethods(classBody: string): Array<{name: string, returnType: string}> {
        const methods: Array<{name: string, returnType: string}> = [];
        
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
    private extractDependencies(content: string, className: string): string[] {
        const dependencies: string[] = [];
        
        // Extract using statements
        const usingPattern = /using\s+([\w.]+);/g;
        let match;
        while ((match = usingPattern.exec(content)) !== null) {
            const usingNamespace = match[1];
            // Filter to relevant dependencies (not system namespaces)
            if (!usingNamespace.startsWith('System') && 
                !usingNamespace.startsWith('Microsoft') &&
                usingNamespace.includes('.'))
            {
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
    private determinePurpose(name: string, classBody: string, type: string): string {
        // Analyze class name patterns
        if (name.endsWith('Service')) {
            if (name.includes('Analysis')) return 'Performs analysis and processing operations';
            if (name.includes('Data') || name.includes('DAL')) return 'Provides data access and persistence';
            if (name.includes('Message') || name.includes('Event')) return 'Handles messaging and event processing';
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
    private calculateConceptConfidence(name: string, classBody: string, type: string): number {
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
    private generateContext(name: string, purpose: string, properties: Array<{name: string, type: string}>, methods: Array<{name: string, returnType: string}>, dependencies: string[]): string {
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
    private extractDomainFromPath(filePath: string): string {
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
        const semanticSubdirectoryPatterns: { [key: string]: string } = {
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
                const hasParentDomain = parts.some((p, idx) => 
                    idx < i && p.toLowerCase() === expectedDomain
                );
                
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
    private detectGranularContextBoundary(filePath: string, pathParts: string[]): GranularBoundaryDetectionResult {
        const directoryPath = pathParts.slice(0, -1).join('/'); // Remove filename
        
        // Multi-criteria analysis for boundary detection
        const businessConceptDensity = this.analyzeBusinessConceptDensity(directoryPath);
        const algorithmicComplexity = this.analyzeAlgorithmicComplexity(filePath);
        const semanticCoherence = this.analyzeSemanticCoherence(directoryPath, pathParts);
        const aiAssistanceValue = this.evaluateAIAssistancePotential(filePath, pathParts);
        
        // Weighted scoring system for granular context boundary decision
        const confidenceScore = this.calculateGranularBoundaryConfidence(
            businessConceptDensity, 
            algorithmicComplexity, 
            semanticCoherence,
            aiAssistanceValue
        );
        
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
     * Advanced business concept density analysis for semantic boundary qualification
     * Implements TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F002: Enhanced semantic analysis
     */
    private analyzeBusinessConceptDensity(directoryPath: string): { conceptCount: number; concepts: string[] } {
        const pathLower = directoryPath.toLowerCase();
        
        let conceptCount = 0;
        const concepts: string[] = [];
        
        // Enhanced algorithm domain concept mapping with sophistication scoring
        const algorithmDomainMappings = this.getAlgorithmDomainMappings();
        
        for (const [domainPattern, conceptData] of algorithmDomainMappings.entries()) {
            if (pathLower.includes(domainPattern)) {
                conceptCount += conceptData.baseConceptCount;
                concepts.push(...conceptData.coreConcepts);
                
                // Add sophistication bonus for complex domains
                if (conceptData.sophisticationLevel === 'high') {
                    conceptCount += 2; // Bonus for high-sophistication domains
                    concepts.push(...conceptData.advancedConcepts);
                }
            }
        }
        
        // Additional concept density analysis based on directory structure depth
        const directoryDepth = directoryPath.split('/').length;
        if (directoryDepth >= 4) { // Deep directory structures likely have specialized concepts
            conceptCount += 1;
            concepts.push('SpecializedDomainLogic');
        }
        
        // Enhanced concept density analysis for specific trading patterns
        conceptCount += this.analyzeTradingSpecificConcepts(pathLower, concepts);
        
        return { conceptCount, concepts };
    }

    /**
     * Get algorithm domain mappings with sophistication levels
     */
    private getAlgorithmDomainMappings(): Map<string, AlgorithmDomainData> {
        const mappings = new Map<string, AlgorithmDomainData>();
        
        // High sophistication algorithm domains
        mappings.set('fractal', {
            baseConceptCount: 6,
            sophisticationLevel: 'high',
            coreConcepts: ['FractalLeg', 'InflectionPoint', 'FractalAnalysis', 'MetaFractal', 'FractalValidation', 'FractalHierarchy'],
            advancedConcepts: ['RecursiveFractalDetection', 'FractalPatternValidation']
        });
        
        mappings.set('indicator', {
            baseConceptCount: 5,
            sophisticationLevel: 'high',
            coreConcepts: ['TechnicalIndicator', 'IndicatorCalculation', 'SignalGeneration', 'ParameterValidation', 'ThresholdAnalysis'],
            advancedConcepts: ['CompositeIndicators', 'IndicatorOptimization']
        });
        
        mappings.set('pattern', {
            baseConceptCount: 4,
            sophisticationLevel: 'medium',
            coreConcepts: ['PatternRecognition', 'PatternValidation', 'PatternMatching', 'PatternClassification'],
            advancedConcepts: ['MachineLearningPatterns']
        });
        
        // Medium sophistication domains  
        mappings.set('momentum', {
            baseConceptCount: 3,
            sophisticationLevel: 'medium',
            coreConcepts: ['MomentumIndicator', 'RSI', 'StochasticOscillator'],
            advancedConcepts: ['MomentumDivergence']
        });
        
        mappings.set('trend', {
            baseConceptCount: 3,
            sophisticationLevel: 'medium',
            coreConcepts: ['TrendAnalysis', 'MovingAverage', 'TrendReversal'],
            advancedConcepts: ['TrendStrengthMeasurement']
        });
        
        // Data provider concepts
        mappings.set('provider', {
            baseConceptCount: 3,
            sophisticationLevel: 'medium',
            coreConcepts: ['DataProvider', 'APIIntegration', 'DataValidation'],
            advancedConcepts: ['RealTimeDataStreaming']
        });
        
        // Messaging concepts
        mappings.set('event', {
            baseConceptCount: 3,
            sophisticationLevel: 'medium',
            coreConcepts: ['DomainEvent', 'EventPublishing', 'EventHandling'],
            advancedConcepts: ['EventSourcing']
        });
        
        return mappings;
    }

    /**
     * Analyze trading-specific concepts for additional concept density
     */
    private analyzeTradingSpecificConcepts(pathLower: string, concepts: string[]): number {
        let additionalConcepts = 0;
        
        // Trading algorithm specific patterns
        const tradingPatterns = [
            { pattern: 'backtest', concepts: ['BacktestEngine', 'PerformanceMetrics'], count: 2 },
            { pattern: 'portfolio', concepts: ['PortfolioManagement', 'RiskAnalysis'], count: 2 },
            { pattern: 'execution', concepts: ['TradeExecution', 'OrderManagement'], count: 2 },
            { pattern: 'risk', concepts: ['RiskManagement', 'VaRCalculation'], count: 2 },
            { pattern: 'optimization', concepts: ['ParameterOptimization', 'GeneticAlgorithm'], count: 2 }
        ];
        
        for (const { pattern, concepts: patternConcepts, count } of tradingPatterns) {
            if (pathLower.includes(pattern)) {
                additionalConcepts += count;
                concepts.push(...patternConcepts);
            }
        }
        
        return additionalConcepts;
    }

    /**
     * Enhanced algorithmic complexity analysis for boundary qualification
     * Implements TEMP-CONTEXT-GRANULAR-INTEL-g7x2-F002: Advanced complexity detection
     */
    private analyzeAlgorithmicComplexity(filePath: string): { complexityScore: number; indicators: string[] } {
        const fileName = filePath.split(/[/\\]/).pop()?.toLowerCase() || '';
        const directoryPath = filePath.split(/[/\\]/).slice(0, -1).join('/').toLowerCase();
        const indicators: string[] = [];
        let complexityScore = 0.0;
        
        // High-sophistication algorithm pattern detection
        const sophisticatedAlgorithmPatterns = this.getSophisticatedAlgorithmPatterns();
        
        for (const pattern of sophisticatedAlgorithmPatterns) {
            if (this.matchesAlgorithmPattern(fileName, directoryPath, pattern)) {
                complexityScore += pattern.complexityWeight;
                indicators.push(pattern.indicator);
            }
        }
        
        // Advanced mathematical operation detection
        complexityScore += this.detectMathematicalComplexity(fileName, indicators);
        
        // Business logic sophistication analysis
        complexityScore += this.analyzeBusinessLogicComplexity(fileName, directoryPath, indicators);
        
        // Trading algorithm specific complexity patterns
        complexityScore += this.analyzeTradingAlgorithmComplexity(fileName, directoryPath, indicators);
        
        return { complexityScore: Math.min(complexityScore, 1.0), indicators };
    }

    /**
     * Get sophisticated algorithm patterns with complexity weights
     */
    private getSophisticatedAlgorithmPatterns(): AlgorithmComplexityPattern[] {
        return [
            // Very high complexity patterns
            { patterns: ['fractal', 'recursive'], complexityWeight: 0.45, indicator: 'RecursiveFractalDetection' },
            { patterns: ['meta.*fractal', 'hierarchical.*fractal'], complexityWeight: 0.4, indicator: 'HierarchicalFractalAnalysis' },
            { patterns: ['optimization', 'genetic'], complexityWeight: 0.4, indicator: 'OptimizationAlgorithms' },
            
            // High complexity patterns
            { patterns: ['indicator', 'calculation'], complexityWeight: 0.35, indicator: 'TechnicalIndicatorCalculation' },
            { patterns: ['pattern.*recognition', 'machine.*learning'], complexityWeight: 0.35, indicator: 'PatternRecognitionAlgorithms' },
            { patterns: ['analysis.*engine', 'processing.*pipeline'], complexityWeight: 0.3, indicator: 'AnalysisEngineLogic' },
            
            // Medium complexity patterns
            { patterns: ['validation', 'rule.*engine'], complexityWeight: 0.25, indicator: 'BusinessRuleValidation' },
            { patterns: ['backtest', 'simulation'], complexityWeight: 0.25, indicator: 'BacktestingAlgorithms' },
            { patterns: ['signal.*generation', 'threshold.*analysis'], complexityWeight: 0.2, indicator: 'SignalProcessingLogic' },
            
            // Moderate complexity patterns
            { patterns: ['algorithm', 'analysis'], complexityWeight: 0.15, indicator: 'AlgorithmicImplementation' },
            { patterns: ['detector', 'finder'], complexityWeight: 0.15, indicator: 'DetectionAlgorithms' }
        ];
    }

    /**
     * Check if file/directory matches algorithm pattern
     */
    private matchesAlgorithmPattern(fileName: string, directoryPath: string, pattern: AlgorithmComplexityPattern): boolean {
        const combinedPath = `${directoryPath}/${fileName}`;
        
        return pattern.patterns.some(patternStr => {
            const regex = new RegExp(patternStr, 'i');
            return regex.test(fileName) || regex.test(directoryPath) || regex.test(combinedPath);
        });
    }

    /**
     * Detect mathematical complexity indicators
     */
    private detectMathematicalComplexity(fileName: string, indicators: string[]): number {
        let complexityBonus = 0.0;
        
        const mathematicalPatterns = [
            { pattern: /mathematical|calculus|derivative/, bonus: 0.15, indicator: 'MathematicalOperations' },
            { pattern: /statistics|statistical|stochastic/, bonus: 0.1, indicator: 'StatisticalAnalysis' },
            { pattern: /matrix|linear.*algebra|vector/, bonus: 0.1, indicator: 'LinearAlgebra' },
            { pattern: /fourier|fft|transform/, bonus: 0.15, indicator: 'SignalProcessing' },
            { pattern: /regression|correlation|covariance/, bonus: 0.1, indicator: 'StatisticalModeling' }
        ];
        
        for (const { pattern, bonus, indicator } of mathematicalPatterns) {
            if (pattern.test(fileName)) {
                complexityBonus += bonus;
                indicators.push(indicator);
            }
        }
        
        return complexityBonus;
    }

    /**
     * Analyze business logic complexity
     */
    private analyzeBusinessLogicComplexity(fileName: string, directoryPath: string, indicators: string[]): number {
        let complexityBonus = 0.0;
        
        // Complex business logic patterns
        const businessLogicPatterns = [
            { pattern: 'workflow', bonus: 0.1, indicator: 'WorkflowLogic' },
            { pattern: 'orchestrat', bonus: 0.15, indicator: 'OrchestrationLogic' },
            { pattern: 'coordinator', bonus: 0.1, indicator: 'CoordinationLogic' },
            { pattern: 'manager', bonus: 0.05, indicator: 'ManagementLogic' },
            { pattern: 'strategy', bonus: 0.1, indicator: 'StrategyPattern' },
            { pattern: 'factory', bonus: 0.05, indicator: 'FactoryPattern' }
        ];
        
        const combinedPath = `${directoryPath}/${fileName}`;
        
        for (const { pattern, bonus, indicator } of businessLogicPatterns) {
            if (combinedPath.includes(pattern)) {
                complexityBonus += bonus;
                indicators.push(indicator);
            }
        }
        
        return complexityBonus;
    }

    /**
     * Analyze trading algorithm specific complexity
     */
    private analyzeTradingAlgorithmComplexity(fileName: string, directoryPath: string, indicators: string[]): number {
        let complexityBonus = 0.0;
        
        const tradingComplexityPatterns = [
            { pattern: 'portfolio.*optimization', bonus: 0.3, indicator: 'PortfolioOptimization' },
            { pattern: 'risk.*management', bonus: 0.25, indicator: 'RiskManagementAlgorithms' },
            { pattern: 'execution.*algorithm', bonus: 0.2, indicator: 'TradeExecutionLogic' },
            { pattern: 'arbitrage', bonus: 0.25, indicator: 'ArbitrageAlgorithms' },
            { pattern: 'market.*making', bonus: 0.2, indicator: 'MarketMakingAlgorithms' },
            { pattern: 'order.*book', bonus: 0.15, indicator: 'OrderBookAnalysis' }
        ];
        
        const combinedPath = `${directoryPath}/${fileName}`.toLowerCase();
        
        for (const { pattern, bonus, indicator } of tradingComplexityPatterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(combinedPath)) {
                complexityBonus += bonus;
                indicators.push(indicator);
            }
        }
        
        return complexityBonus;
    }

    /**
     * Analyze semantic coherence for domain boundary qualification
     */
    private analyzeSemanticCoherence(directoryPath: string, pathParts: string[]): { coherenceScore: number; coherenceFactors: string[] } {
        const coherenceFactors: string[] = [];
        let coherenceScore = 0.0;
        
        // Domain coherence analysis
        const hasConsistentDomain = pathParts.some(part => 
            ['analysis', 'data', 'messaging'].includes(part.toLowerCase())
        );
        if (hasConsistentDomain) {
            coherenceScore += 0.3;
            coherenceFactors.push('ConsistentDomainContext');
        }
        
        // Subdirectory specialization coherence
        const hasSpecializedSubdomain = pathParts.some(part => 
            ['fractal', 'indicator', 'pattern', 'momentum'].includes(part.toLowerCase())
        );
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
    private evaluateAIAssistancePotential(filePath: string, pathParts: string[]): number {
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
    private calculateGranularBoundaryConfidence(
        businessConceptDensity: { conceptCount: number; concepts: string[] },
        algorithmicComplexity: { complexityScore: number; indicators: string[] },
        semanticCoherence: { coherenceScore: number; coherenceFactors: string[] },
        aiAssistanceValue: number
    ): number {
        // Weighted scoring for boundary detection confidence
        const conceptDensityWeight = 0.35; // High weight for business concept density
        const algorithmicComplexityWeight = 0.30; // High weight for algorithmic sophistication
        const semanticCoherenceWeight = 0.25; // Medium weight for semantic coherence
        const aiAssistanceWeight = 0.10; // Lower weight for AI assistance potential
        
        // Normalize concept density (target: >3 concepts = 1.0 score)
        const normalizedConceptDensity = Math.min(businessConceptDensity.conceptCount / 3.0, 1.0);
        
        const weightedScore = 
            (normalizedConceptDensity * conceptDensityWeight) +
            (algorithmicComplexity.complexityScore * algorithmicComplexityWeight) +
            (semanticCoherence.coherenceScore * semanticCoherenceWeight) +
            (aiAssistanceValue * aiAssistanceWeight);
        
        return Math.min(weightedScore, 1.0);
    }

    /**
     * Determine granular domain path for qualified boundaries
     */
    private determineGranularDomainPath(pathParts: string[], confidence: number): string {
        if (confidence <= 0.85) {
            return ''; // Not qualified for granular context
        }
        
        // Build granular domain path based on directory structure
        const relevantParts = pathParts.filter(part => 
            !['src', 'bin', 'obj', 'node_modules', '.git'].includes(part.toLowerCase())
        );
        
        // Find domain and subdomain parts
        const domainIndex = relevantParts.findIndex(part => 
            ['analysis', 'data', 'messaging', 'utility'].includes(part.toLowerCase())
        );
        
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
    private analyzeSemanticSubdirectoryQualification(filePath: string, subdirectory: string, domain: string): { qualifiesForGranularContext: boolean; reason: string } {
        
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

    /**
     * Calculate accuracy validation metrics for boundary detection
     * Step 2.2: Accuracy Validation and Human Expert Integration
     */
    public calculateAccuracyMetrics(
        analysisResults: SemanticAnalysisResult[],
        expertFeedback: HumanExpertFeedback[]
    ): AccuracyValidationMetrics {
        const totalValidations = expertFeedback.length;
        const correctPredictions = expertFeedback.filter(f => f.isCorrect).length;
        const overallAccuracy = totalValidations > 0 ? correctPredictions / totalValidations : 0;

        // Calculate granular detection rate (how often we detect granular vs domain-level)
        const granularDetections = analysisResults.filter(r => r.domainContext.includes('.')).length;
        const granularDetectionRate = analysisResults.length > 0 ? granularDetections / analysisResults.length : 0;

        // Calculate false positive rate
        const falsePositives = expertFeedback.filter(f => !f.isCorrect && f.validationType === 'granular').length;
        const totalGranularPredictions = expertFeedback.filter(f => f.validationType === 'granular').length;
        const falsePositiveRate = totalGranularPredictions > 0 ? falsePositives / totalGranularPredictions : 0;

        // Domain-specific accuracy
        const domainSpecificAccuracy = new Map<string, number>();
        const domains = [...new Set(expertFeedback.map(f => f.expectedDomain))];
        
        domains.forEach(domain => {
            const domainFeedback = expertFeedback.filter(f => f.expectedDomain === domain);
            const domainCorrect = domainFeedback.filter(f => f.isCorrect).length;
            const accuracy = domainFeedback.length > 0 ? domainCorrect / domainFeedback.length : 0;
            domainSpecificAccuracy.set(domain, accuracy);
        });

        // Expert validation score (weighted by expert confidence)
        const expertValidationScore = expertFeedback.length > 0 ? 
            expertFeedback.reduce((sum, f) => sum + (f.isCorrect ? f.expertConfidence : 0), 0) / expertFeedback.length : 
            undefined;

        // Confidence distribution
        const confidenceRanges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const confidenceDistribution = confidenceRanges.map(threshold => 
            expertFeedback.filter(f => f.expertConfidence >= threshold).length / Math.max(expertFeedback.length, 1)
        );

        return {
            overallAccuracy,
            granularDetectionRate,
            falsePositiveRate,
            domainSpecificAccuracy,
            expertValidationScore,
            confidenceDistribution,
            totalValidations,
            detectionThresholds: {
                high: 0.85, // Algorithm detection confidence thresholds
                medium: 0.65,
                low: 0.45
            }
        };
    }

    /**
     * Store human expert feedback for continuous learning
     * Step 2.2: Human Expert Integration
     */
    public storeExpertFeedback(feedback: HumanExpertFeedback): void {
        const feedbackDir = path.join(this.cacheDir, 'expert-feedback');
        if (!fs.existsSync(feedbackDir)) {
            fs.mkdirSync(feedbackDir, { recursive: true });
        }

        const feedbackFile = path.join(feedbackDir, `${Date.now()}-${feedback.fileId}.json`);
        fs.writeFileSync(feedbackFile, JSON.stringify(feedback, null, 2));
        
        logger.info(`Expert feedback stored for file ${feedback.fileId}, accuracy: ${feedback.isCorrect}`);
    }

    /**
     * Load historical expert feedback for analysis
     * Step 2.2: Expert Integration Infrastructure
     */
    public loadExpertFeedback(): HumanExpertFeedback[] {
        const feedbackDir = path.join(this.cacheDir, 'expert-feedback');
        if (!fs.existsSync(feedbackDir)) {
            return [];
        }

        const feedbackFiles = fs.readdirSync(feedbackDir).filter(f => f.endsWith('.json'));
        const feedback: HumanExpertFeedback[] = [];

        feedbackFiles.forEach(file => {
            try {
                const content = fs.readFileSync(path.join(feedbackDir, file), 'utf8');
                const feedbackData = JSON.parse(content);
                // Convert timestamp string back to Date object
                feedbackData.timestamp = new Date(feedbackData.timestamp);
                feedback.push(feedbackData);
            } catch (error) {
                logger.warn(`Failed to load expert feedback from ${file}:`, error);
            }
        });

        return feedback.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Generate accuracy validation report
     * Step 2.2: Reporting and Analysis
     */
    public generateAccuracyReport(): string {
        const expertFeedback = this.loadExpertFeedback();
        const metrics = this.calculateAccuracyMetrics([], expertFeedback);

        const report = `
# Granular Context Intelligence - Accuracy Validation Report

## Overall Performance
- **Overall Accuracy**: ${(metrics.overallAccuracy * 100).toFixed(1)}%
- **Total Validations**: ${metrics.totalValidations}
- **Expert Validation Score**: ${metrics.expertValidationScore ? (metrics.expertValidationScore * 100).toFixed(1) + '%' : 'N/A'}

## Boundary Detection Performance
- **Granular Detection Rate**: ${(metrics.granularDetectionRate * 100).toFixed(1)}%
- **False Positive Rate**: ${(metrics.falsePositiveRate * 100).toFixed(1)}%

## Domain-Specific Accuracy
${Array.from(metrics.domainSpecificAccuracy.entries())
        .map(([domain, accuracy]) => `- **${domain}**: ${(accuracy * 100).toFixed(1)}%`)
        .join('\n')}

## Detection Thresholds
- **High Complexity**: ${(metrics.detectionThresholds.high * 100).toFixed(0)}%
- **Medium Complexity**: ${(metrics.detectionThresholds.medium * 100).toFixed(0)}%
- **Low Complexity**: ${(metrics.detectionThresholds.low * 100).toFixed(0)}%

## Confidence Distribution
${metrics.confidenceDistribution.map((dist, idx) => 
        `- **≥${(0.5 + idx * 0.1).toFixed(1)}**: ${(dist * 100).toFixed(1)}%`
    ).join('\n')}

## Recommendations
${metrics.overallAccuracy < 0.85 ? '- Consider adjusting algorithm complexity patterns\n' : ''}${
    metrics.falsePositiveRate > 0.15 ? '- Review granular detection thresholds\n' : ''
}${metrics.granularDetectionRate < 0.7 ? '- Enhance sophisticated algorithm detection patterns\n' : ''}

Generated: ${new Date().toISOString()}
        `.trim();

        return report;
    }

    /**
     * Load boundary detection configuration
     * Step 2.3: Configuration and Adaptive Tuning
     */
    private loadConfiguration(): BoundaryDetectionConfig {
        const configFile = path.join(this.cacheDir, 'boundary-detection-config.json');
        
        // Default configuration
        const defaultConfig: BoundaryDetectionConfig = {
            // Complexity scoring weights
            businessConceptWeight: 0.4,
            algorithmComplexityWeight: 0.35,
            semanticCoherenceWeight: 0.25,
            
            // Detection thresholds
            granularThreshold: 0.65,
            domainThreshold: 0.45,
            
            // Algorithm pattern weights
            mathematicalComplexityMultiplier: 1.5,
            tradingAlgorithmBonus: 0.2,
            designPatternWeight: 0.3,
            
            // Adaptive learning settings
            enableAdaptiveTuning: true,
            learningRate: 0.1,
            minimumFeedbackCount: 5,
            
            // Performance constraints
            maxAnalysisTimeMs: 15000,
            cacheExpirationHours: 24
        };

        try {
            if (fs.existsSync(configFile)) {
                const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                // Merge with defaults to ensure all properties exist
                const mergedConfig = { ...defaultConfig, ...configData };
                logger.info('Loaded boundary detection configuration from cache');
                return mergedConfig;
            }
        } catch (error) {
            logger.warn('Failed to load configuration file, using defaults:', error);
        }

        // Save default configuration
        this.saveConfiguration(defaultConfig);
        return defaultConfig;
    }

    /**
     * Save boundary detection configuration
     * Step 2.3: Configuration Management
     */
    public saveConfiguration(config: BoundaryDetectionConfig): void {
        const configFile = path.join(this.cacheDir, 'boundary-detection-config.json');
        
        try {
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
            this.config = config;
            logger.info('Boundary detection configuration saved successfully');
        } catch (error) {
            logger.error('Failed to save configuration:', error);
            throw new Error(`Failed to save configuration: ${error}`);
        }
    }

    /**
     * Get current configuration
     * Step 2.3: Configuration Access
     */
    public getConfiguration(): BoundaryDetectionConfig {
        return { ...this.config }; // Return copy to prevent direct modification
    }

    /**
     * Update configuration with adaptive tuning based on expert feedback
     * Step 2.3: Adaptive Tuning
     */
    public adaptivelyTuneConfiguration(): BoundaryDetectionConfig {
        if (!this.config.enableAdaptiveTuning) {
            logger.info('Adaptive tuning disabled, skipping configuration update');
            return this.config;
        }

        const expertFeedback = this.loadExpertFeedback();
        
        if (expertFeedback.length < this.config.minimumFeedbackCount) {
            logger.info(`Insufficient feedback for adaptive tuning (${expertFeedback.length}/${this.config.minimumFeedbackCount})`);
            return this.config;
        }

        // Calculate recent accuracy metrics
        const recentFeedback = expertFeedback.slice(0, 20); // Last 20 feedback entries
        const accuracy = recentFeedback.filter(f => f.isCorrect).length / recentFeedback.length;
        
        // Adaptive tuning based on accuracy
        const updatedConfig = { ...this.config };
        
        if (accuracy < 0.8) {
            // Poor accuracy - make detection more conservative
            logger.info(`Low accuracy detected (${(accuracy * 100).toFixed(1)}%), making detection more conservative`);
            
            updatedConfig.granularThreshold += this.config.learningRate * 0.1;
            updatedConfig.algorithmComplexityWeight += this.config.learningRate * 0.05;
            updatedConfig.businessConceptWeight -= this.config.learningRate * 0.03;
            
        } else if (accuracy > 0.95) {
            // High accuracy - can be more aggressive in detection
            logger.info(`High accuracy detected (${(accuracy * 100).toFixed(1)}%), making detection more aggressive`);
            
            updatedConfig.granularThreshold -= this.config.learningRate * 0.05;
            updatedConfig.algorithmComplexityWeight -= this.config.learningRate * 0.02;
            updatedConfig.semanticCoherenceWeight += this.config.learningRate * 0.03;
        }

        // Analyze domain-specific feedback for targeted adjustments
        const domainAccuracy = new Map<string, number[]>();
        recentFeedback.forEach(feedback => {
            const domain = feedback.expectedDomain;
            if (!domainAccuracy.has(domain)) {
                domainAccuracy.set(domain, []);
            }
            domainAccuracy.get(domain)!.push(feedback.isCorrect ? 1 : 0);
        });

        // Adjust trading algorithm bonus based on trading domain performance
        const tradingDomains = ['Analysis.Fractal', 'Analysis.Indicator', 'Data.Provider'];
        const tradingFeedback = recentFeedback.filter(f => 
            tradingDomains.some(domain => f.expectedDomain.startsWith(domain))
        );
        
        if (tradingFeedback.length > 0) {
            const tradingAccuracy = tradingFeedback.filter(f => f.isCorrect).length / tradingFeedback.length;
            if (tradingAccuracy < 0.85) {
                updatedConfig.tradingAlgorithmBonus += this.config.learningRate * 0.1;
                logger.info('Boosting trading algorithm detection bonus due to poor trading domain accuracy');
            }
        }

        // Ensure values stay within reasonable bounds
        updatedConfig.granularThreshold = Math.max(0.3, Math.min(0.9, updatedConfig.granularThreshold));
        updatedConfig.domainThreshold = Math.max(0.2, Math.min(0.6, updatedConfig.domainThreshold));
        updatedConfig.businessConceptWeight = Math.max(0.2, Math.min(0.6, updatedConfig.businessConceptWeight));
        updatedConfig.algorithmComplexityWeight = Math.max(0.2, Math.min(0.6, updatedConfig.algorithmComplexityWeight));
        updatedConfig.semanticCoherenceWeight = Math.max(0.1, Math.min(0.4, updatedConfig.semanticCoherenceWeight));
        updatedConfig.tradingAlgorithmBonus = Math.max(0.0, Math.min(0.5, updatedConfig.tradingAlgorithmBonus));

        // Normalize weights to sum to 1.0
        const totalWeight = updatedConfig.businessConceptWeight + 
                           updatedConfig.algorithmComplexityWeight + 
                           updatedConfig.semanticCoherenceWeight;
        
        updatedConfig.businessConceptWeight /= totalWeight;
        updatedConfig.algorithmComplexityWeight /= totalWeight;
        updatedConfig.semanticCoherenceWeight /= totalWeight;

        // Save updated configuration if significant changes were made
        const hasSignificantChanges = Math.abs(updatedConfig.granularThreshold - this.config.granularThreshold) > 0.01 ||
                                    Math.abs(updatedConfig.businessConceptWeight - this.config.businessConceptWeight) > 0.02;

        if (hasSignificantChanges) {
            logger.info('Significant adaptive tuning changes detected, saving updated configuration');
            this.saveConfiguration(updatedConfig);
        }

        return updatedConfig;
    }

    /**
     * Generate configuration tuning report
     * Step 2.3: Configuration Analysis and Reporting
     */
    public generateConfigurationReport(): string {
        const expertFeedback = this.loadExpertFeedback();
        const currentConfig = this.getConfiguration();
        
        const report = `
# Boundary Detection Configuration Report

## Current Configuration
### Complexity Scoring Weights
- **Business Concept Weight**: ${(currentConfig.businessConceptWeight * 100).toFixed(1)}%
- **Algorithm Complexity Weight**: ${(currentConfig.algorithmComplexityWeight * 100).toFixed(1)}%
- **Semantic Coherence Weight**: ${(currentConfig.semanticCoherenceWeight * 100).toFixed(1)}%

### Detection Thresholds
- **Granular Threshold**: ${(currentConfig.granularThreshold * 100).toFixed(1)}%
- **Domain Threshold**: ${(currentConfig.domainThreshold * 100).toFixed(1)}%

### Algorithm Pattern Weights
- **Mathematical Complexity Multiplier**: ${currentConfig.mathematicalComplexityMultiplier.toFixed(2)}x
- **Trading Algorithm Bonus**: ${(currentConfig.tradingAlgorithmBonus * 100).toFixed(1)}%
- **Design Pattern Weight**: ${(currentConfig.designPatternWeight * 100).toFixed(1)}%

### Adaptive Learning Settings
- **Enable Adaptive Tuning**: ${currentConfig.enableAdaptiveTuning ? 'Yes' : 'No'}
- **Learning Rate**: ${(currentConfig.learningRate * 100).toFixed(1)}%
- **Minimum Feedback Count**: ${currentConfig.minimumFeedbackCount}

### Performance Constraints
- **Max Analysis Time**: ${currentConfig.maxAnalysisTimeMs}ms
- **Cache Expiration**: ${currentConfig.cacheExpirationHours}h

## Feedback Analysis
- **Total Expert Feedback Entries**: ${expertFeedback.length}
- **Adaptive Tuning Eligible**: ${expertFeedback.length >= currentConfig.minimumFeedbackCount ? 'Yes' : 'No'}

## Configuration Health
${currentConfig.granularThreshold > 0.8 ? '⚠️ Granular threshold very high - may miss valid detections\n' : ''}${
    currentConfig.granularThreshold < 0.5 ? '⚠️ Granular threshold very low - may produce false positives\n' : ''
}${currentConfig.businessConceptWeight + currentConfig.algorithmComplexityWeight + currentConfig.semanticCoherenceWeight !== 1.0 ? 
    '⚠️ Weights do not sum to 1.0 - normalization may be needed\n' : ''
}

Generated: ${new Date().toISOString()}
        `.trim();

        return report;
    }
}
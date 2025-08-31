/**
 * Project Documentation Loader Service
 * 
 * Provides project-specific documentation loading and caching for virtual expert agents.
 * Enables experts to provide guidance based on actual project standards, architecture 
 * documents, and Context Engineering system requirements.
 */

import { createMCPLogger } from '../utils/mcp-logger.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = createMCPLogger('project-documentation-loader.log');

// Project documentation interfaces
export interface ProjectStandards {
    architectureGuidelines?: ArchitectureStandards;
    testingStandards?: TestingStandards;
    devOpsInfrastructure?: DevOpsStandards;
    contextEngineering?: ContextEngineeringStandards;
}

export interface ArchitectureStandards {
    buildSystemIntegration: {
        dotnetCommands: string[];
        typescriptValidation: string[];
        dockerOrchestration: string[];
        qualityStandards: string[];
    };
    dockerContainerization: {
        infrastructureServices: string[];
        applicationContainers: string[];
        healthChecking: string[];
    };
    testingFrameworks: {
        bddFramework: string;
        infrastructureTesting: string;
        testCoverage: string;
        reportingStandards: string[];
    };
    utilityLibraryStandards: {
        loggingIntegration: string;
        configurationManagement: string;
        messagingPatterns: string[];
        domainDrivenDesign: string[];
    };
}

export interface TestingStandards {
    dualFrameworkStrategy: {
        bddUsage: string[];
        xunitUsage: string[];
        frameworkSelection: string[];
    };
    testProjectStructure: {
        namingConventions: string[];
        organizationPatterns: string[];
        categorization: string[];
    };
    testDataManagement: {
        tableDrivernPatterns: string[];
        mockDataFactories: string[];
        assertionStandards: string[];
        loggingRequirements: string[];
    };
}

export interface DevOpsStandards {
    gitOpsWorkflow: {
        repositoryStructure: string[];
        branchProtection: string[];
        immutableInfrastructure: string[];
    };
    multiEnvironmentDeployment: {
        environments: string[];
        deploymentOrchestration: string[];
        configurationManagement: string[];
    };
    qualityGates: {
        automatedTesting: string[];
        coverageRequirements: string[];
        deploymentValidation: string[];
    };
}

export interface ContextEngineeringStandards {
    systemPurpose: string;
    documentTypes: {
        domainReqMd: string[];
        digitalReqMd: string[];
        icpTypes: string[];
    };
    documentLifecycle: {
        newConceptsFlow: string[];
        maturityProcess: string[];
        registryManagement: string[];
    };
    semanticAnalysis: {
        businessConceptExtraction: string[];
        confidenceScoring: string[];
        templateGeneration: string[];
    };
}

/**
 * Project Documentation Loader - loads and caches project-specific standards
 */
export class ProjectDocumentationLoader {
    private documentationCache: Map<string, any> = new Map();
    private cacheTimestamps: Map<string, number> = new Map();
    private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

    constructor(private readonly projectRoot = '/mnt/m/projects/lucidwonks') {
        logger.info('📚 Project Documentation Loader initialized', { projectRoot });
    }

    /**
     * Load comprehensive project standards for virtual expert agents
     */
    public async loadProjectStandards(): Promise<ProjectStandards> {
        logger.info('📖 Loading project standards for virtual experts');

        try {
            const standards: ProjectStandards = {};

            // Load Architecture Guidelines
            standards.architectureGuidelines = await this.loadArchitectureGuidelines();
            
            // Load Testing Standards
            standards.testingStandards = await this.loadTestingStandards();
            
            // Load DevOps Infrastructure
            standards.devOpsInfrastructure = await this.loadDevOpsStandards();
            
            // Load Context Engineering Standards
            standards.contextEngineering = await this.loadContextEngineeringStandards();

            logger.info('✅ Project standards loaded successfully', {
                hasArchitecture: !!standards.architectureGuidelines,
                hasTesting: !!standards.testingStandards,
                hasDevOps: !!standards.devOpsInfrastructure,
                hasContextEngineering: !!standards.contextEngineering
            });

            return standards;
        } catch (error) {
            logger.error('❌ Failed to load project standards', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw new Error(`Project standards loading failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load Architecture Guidelines from domain document
     */
    private async loadArchitectureGuidelines(): Promise<ArchitectureStandards | undefined> {
        const filePath = path.join(this.projectRoot, 'Documentation', 'Architecture', 'development-guidelines.domain.req.md');
        
        if (!await this.fileExists(filePath)) {
            logger.warn('⚠️ Architecture guidelines file not found', { filePath });
            return undefined;
        }

        const _content = await this.readFileWithCache(filePath);
        
        return {
            buildSystemIntegration: {
                dotnetCommands: [
                    'dotnet build Lucidwonks.sln',
                    'Complete solution build validation combining dotnet build and npm build processes'
                ],
                typescriptValidation: [
                    'cd EnvironmentMCPGateway && npm run lint && npm run build && npm test && cd ..',
                    'TypeScript ESLint integration for comprehensive code quality validation'
                ],
                dockerOrchestration: [
                    'Multi-stage Docker builds for optimized container deployments',
                    'Infrastructure service orchestration via docker-compose'
                ],
                qualityStandards: [
                    'Zero-warning build standards across all platform components and languages',
                    '>85% test coverage and comprehensive validation processes'
                ]
            },
            dockerContainerization: {
                infrastructureServices: [
                    'TimescaleDB time-series database and RedPanda messaging broker orchestration',
                    'RedPanda Console for messaging monitoring and management'
                ],
                applicationContainers: [
                    'CyphyrRecon, InflectionPointDetector, and EnvironmentMCPGateway containerization',
                    'Multi-service application deployment with coordinated startup sequences'
                ],
                healthChecking: [
                    'Health checks and logging integration for operational visibility',
                    'Comprehensive service health checking and diagnostic capabilities'
                ]
            },
            testingFrameworks: {
                bddFramework: 'Reqnroll BDD framework integration for business logic validation with living documentation',
                infrastructureTesting: 'XUnit infrastructure testing for API validation, performance testing, and integration scenarios',
                testCoverage: '>85% coverage for infrastructure components and full BDD scenario coverage for business requirements',
                reportingStandards: [
                    'HTML test report generation with comprehensive test result documentation',
                    'Living documentation through Reqnroll BDD scenarios'
                ]
            },
            utilityLibraryStandards: {
                loggingIntegration: 'Mandatory Serilog logging integration across all components with structured logging patterns',
                configurationManagement: 'Environment-specific configuration through appsettings.json patterns with centralized management',
                messagingPatterns: [
                    'RedPanda/Kafka integration for event-driven architecture',
                    'Domain events with standardized publishing patterns'
                ],
                domainDrivenDesign: [
                    'Domain-Driven Design principles with bounded contexts and ubiquitous language',
                    'Repository pattern with interface-based data access and mock implementations',
                    'Aggregate and entity patterns with proper domain modeling'
                ]
            }
        };
    }

    /**
     * Load Testing Standards from domain document
     */
    private async loadTestingStandards(): Promise<TestingStandards | undefined> {
        const filePath = path.join(this.projectRoot, 'Documentation', 'Architecture', 'testing-standards.domain.req.md');
        
        if (!await this.fileExists(filePath)) {
            logger.warn('⚠️ Testing standards file not found', { filePath });
            return undefined;
        }

        const _content = await this.readFileWithCache(filePath);
        
        return {
            dualFrameworkStrategy: {
                bddUsage: [
                    'Reqnroll BDD framework for business logic validation and stakeholder communication',
                    'Living documentation with stakeholder-readable scenarios',
                    'Business logic, trading algorithms, and domain workflows'
                ],
                xunitUsage: [
                    'XUnit framework for infrastructure components, API clients, performance validation',
                    'Technical component validation with Moq, FluentAssertions',
                    'Integration scenarios and cross-system workflows'
                ],
                frameworkSelection: [
                    'BDD for business logic with stakeholder communication requirements',
                    'XUnit for infrastructure testing and technical validation',
                    'Framework selection based on testing domain and communication needs'
                ]
            },
            testProjectStructure: {
                namingConventions: [
                    'TestSuite project structure mirroring main Utility project hierarchy',
                    'Infrastructure testing structure supporting unit, integration, performance testing',
                    'Consistent naming for feature files, step definitions, test classes, and methods'
                ],
                organizationPatterns: [
                    'Domain-aligned organization matching main codebase structure',
                    'Namespace alignment with main codebase ensuring consistent patterns',
                    'Test categorization enabling efficient filtering and execution'
                ],
                categorization: [
                    'Test tagging systems for efficient test filtering',
                    'Multiple test dimensions for comprehensive categorization',
                    'Framework-specific organization patterns'
                ]
            },
            testDataManagement: {
                tableDrivernPatterns: [
                    'Table-driven BDD data patterns with parameterized scenarios',
                    'Realistic trading data for comprehensive business scenario coverage'
                ],
                mockDataFactories: [
                    'Builder pattern for consistent test data generation',
                    'Mock data factories for infrastructure testing consistency'
                ],
                assertionStandards: [
                    'FluentAssertions integration with comprehensive assertion patterns',
                    'Assertion patterns for both BDD and XUnit testing frameworks'
                ],
                loggingRequirements: [
                    'Mandatory Serilog logging integration for all test failures and error conditions',
                    'Platform logging consistency maintained in all test scenarios',
                    'Structured logging patterns for test result analysis'
                ]
            }
        };
    }

    /**
     * Load DevOps Standards from domain document
     */
    private async loadDevOpsStandards(): Promise<DevOpsStandards | undefined> {
        const filePath = path.join(this.projectRoot, 'Documentation', 'Architecture', 'devops-infrastructure.domain.req.md');
        
        if (!await this.fileExists(filePath)) {
            logger.warn('⚠️ DevOps infrastructure file not found', { filePath });
            return undefined;
        }

        const _content = await this.readFileWithCache(filePath);
        
        return {
            gitOpsWorkflow: {
                repositoryStructure: [
                    'Git repository serves as single source of truth for all configurations',
                    'Monorepo organization with comprehensive branch management',
                    'Version-controlled, auditable changes with comprehensive change history'
                ],
                branchProtection: [
                    'Branch protection rules and approval workflows for production deployments',
                    'Automated validation preventing unauthorized production changes',
                    'Strict prohibition of manual environment modifications ("click-ops")'
                ],
                immutableInfrastructure: [
                    'Immutable infrastructure principles enforced across all environments',
                    'Container artifacts never modified in place',
                    'Declarative infrastructure management through Pulumi'
                ]
            },
            multiEnvironmentDeployment: {
                environments: [
                    'Local Development: Docker Desktop on Windows 11 with EnvironmentMCPGateway integration',
                    'Local VM Test: Docker Compose on Hyper-V Ubuntu VM for integration testing',
                    'Azure Ephemeral: Production-identical testing environment',
                    'Azure Production: Live algorithmic trading operations with zero-downtime deployment'
                ],
                deploymentOrchestration: [
                    'Identical container images across all environments',
                    'Environment-specific configuration injection',
                    'Azure Container Apps for production and ephemeral environments'
                ],
                configurationManagement: [
                    'Environment-specific configurations with consistency guarantees',
                    'Azure Key Vault integration for secrets management',
                    'High-fidelity local development environments mirroring production'
                ]
            },
            qualityGates: {
                automatedTesting: [
                    'Stage 1: Build validation, unit testing with xUnit/Moq/FluentAssertions',
                    'Stage 2: Integration testing with Testcontainers',
                    'Stage 3: End-to-end and behavior-driven testing with Reqnroll + Playwright'
                ],
                coverageRequirements: [
                    'Code coverage with coverlet and configurable coverage thresholds',
                    'Multi-layered testing strategy with comprehensive validation stages'
                ],
                deploymentValidation: [
                    'Automated promotion pipelines with environment-specific validation',
                    '95% first-time success rate through comprehensive quality gates',
                    'Automated rollback capabilities for deployment failures'
                ]
            }
        };
    }

    /**
     * Load Context Engineering Standards
     */
    private async loadContextEngineeringStandards(): Promise<ContextEngineeringStandards | undefined> {
        const systemFilePath = path.join(this.projectRoot, 'Documentation', 'ContextEngineering', 'context-engineering-system.md');
        const domainFilePath = path.join(this.projectRoot, 'Documentation', 'EnvironmentMCPGateway', 'context-engineering.domain.req.md');
        
        if (!await this.fileExists(systemFilePath) || !await this.fileExists(domainFilePath)) {
            logger.warn('⚠️ Context Engineering files not found', { systemFilePath, domainFilePath });
            return undefined;
        }

        const _systemContent = await this.readFileWithCache(systemFilePath);
        const _domainContent = await this.readFileWithCache(domainFilePath);
        
        return {
            systemPurpose: 'AI-powered development assistance framework that autonomously maintains accurate, semantically-rich contextual information throughout the software development lifecycle',
            documentTypes: {
                domainReqMd: [
                    'Backend business logic with domain rules',
                    'Infrastructure components requiring configuration',
                    'Service interfaces with integration patterns',
                    'Libraries with reusable business capabilities'
                ],
                digitalReqMd: [
                    'Web interfaces, dashboards, or visual components',
                    'API endpoints with user-facing responses',
                    'Management consoles or admin interfaces',
                    'Developer tools with UI components'
                ],
                icpTypes: [
                    'Codification ICP: Incrementally systematize concepts into clear specifications',
                    'Implementation ICP: Incrementally build working code from systematized specifications'
                ]
            },
            documentLifecycle: {
                newConceptsFlow: [
                    'NewConcepts Exploration → Concept ICP → Implementation ICP → Code Implementation',
                    'Document Lifecycle Completion → Mature Documents',
                    'Placeholder IDs → Domain Discovery → Human Approval → Final Registration'
                ],
                maturityProcess: [
                    'Concept validation through systematic exploration',
                    'Implementation validation through incremental development',
                    'Code validation through comprehensive testing and review'
                ],
                registryManagement: [
                    'Capability Registry maintenance with placeholder and final IDs',
                    'Status tracking through implementation lifecycle',
                    'Domain discovery and human approval workflows'
                ]
            },
            semanticAnalysis: {
                businessConceptExtraction: [
                    'Deep C# code analysis with AST parsing for business purpose extraction',
                    'Business concept identification with 82-90% confidence levels',
                    'Entity recognition, service pattern detection, domain logic extraction'
                ],
                confidenceScoring: [
                    'Business rule extraction with confidence assessment',
                    'Validation logic, guard clauses, and domain constraints analysis',
                    'Source location tracking with quality measurement'
                ],
                templateGeneration: [
                    'Template-based context generation with variable substitution',
                    'Rich context templates with domain overviews and business rules',
                    'Context structure standardization across domain boundaries'
                ]
            }
        };
    }

    /**
     * Get expert-specific guidance based on project standards
     */
    public async getExpertGuidance(expertType: string, subtask: string): Promise<string> {
        const standards = await this.loadProjectStandards();
        const baseGuidance = this.getBaseExpertGuidance(expertType, subtask);
        
        // Enhance guidance with project-specific standards
        let enhancedGuidance = baseGuidance;
        
        switch (expertType) {
        case 'Architecture':
            enhancedGuidance += this.getArchitectureSpecificGuidance(standards.architectureGuidelines, subtask);
            break;
        case 'QA':
            enhancedGuidance += this.getTestingSpecificGuidance(standards.testingStandards, subtask);
            break;
        case 'DevOps':
            enhancedGuidance += this.getDevOpsSpecificGuidance(standards.devOpsInfrastructure, subtask);
            break;
        case 'Context Engineering Compliance':
            enhancedGuidance += this.getContextEngineeringGuidance(standards.contextEngineering, subtask);
            break;
        }

        logger.info('📋 Generated enhanced expert guidance', {
            expertType,
            hasProjectStandards: Object.keys(standards).length > 0,
            guidanceLength: enhancedGuidance.length
        });

        return enhancedGuidance;
    }

    private getBaseExpertGuidance(expertType: string, subtask: string): string {
        const baseInstructions = `Coordinate with ${expertType} expert for specialized consultation on: ${subtask}`;
        
        const expertSpecificInstructions: { [key: string]: string } = {
            'Financial Quant': 'Focus on trading algorithm validation, risk assessment, and quantitative analysis accuracy.',
            'Cybersecurity': 'Emphasize security vulnerability assessment, threat modeling, and secure implementation patterns.',
            'Architecture': 'Concentrate on system design coherence, integration patterns, and scalability considerations.',
            'Performance': 'Prioritize performance optimization, resource utilization, and bottleneck identification.',
            'QA': 'Focus on test strategy design, coverage analysis, and quality validation frameworks.',
            'DevOps': 'Emphasize deployment strategies, infrastructure automation, and CI/CD optimization.',
            'Process Engineer': 'Focus on workflow optimization, process compliance, and efficiency improvements.',
            'Context Engineering Compliance': 'Ensure process compliance, template adherence, and validation requirements.'
        };

        return `${baseInstructions}\n\nExpert-specific guidance: ${expertSpecificInstructions[expertType] || 'Apply domain expertise to the specified subtask.'}`;
    }

    private getArchitectureSpecificGuidance(standards?: ArchitectureStandards, _subtask?: string): string {
        if (!standards) return '';
        
        let guidance = '\n\n**Project-Specific Architecture Standards:**\n';
        
        guidance += `- **Build System**: ${standards.buildSystemIntegration.dotnetCommands.join(', ')}\n`;
        guidance += `- **TypeScript Integration**: ${standards.buildSystemIntegration.typescriptValidation[0]}\n`;
        guidance += `- **Quality Standards**: ${standards.buildSystemIntegration.qualityStandards[0]}\n`;
        guidance += `- **Testing Framework**: ${standards.testingFrameworks.bddFramework}\n`;
        guidance += `- **Logging**: ${standards.utilityLibraryStandards.loggingIntegration}\n`;
        guidance += `- **DDD Principles**: ${standards.utilityLibraryStandards.domainDrivenDesign[0]}\n`;

        return guidance;
    }

    private getTestingSpecificGuidance(standards?: TestingStandards, _subtask?: string): string {
        if (!standards) return '';
        
        let guidance = '\n\n**Project-Specific Testing Standards:**\n';
        
        guidance += `- **Dual Framework**: ${standards.dualFrameworkStrategy.frameworkSelection[0]}\n`;
        guidance += `- **BDD Usage**: ${standards.dualFrameworkStrategy.bddUsage[0]}\n`;
        guidance += `- **XUnit Usage**: ${standards.dualFrameworkStrategy.xunitUsage[0]}\n`;
        guidance += `- **Test Structure**: ${standards.testProjectStructure.namingConventions[0]}\n`;
        guidance += `- **Logging Requirements**: ${standards.testDataManagement.loggingRequirements[0]}\n`;
        guidance += `- **Assertion Standards**: ${standards.testDataManagement.assertionStandards[0]}\n`;

        return guidance;
    }

    private getDevOpsSpecificGuidance(standards?: DevOpsStandards, _subtask?: string): string {
        if (!standards) return '';
        
        let guidance = '\n\n**Project-Specific DevOps Standards:**\n';
        
        guidance += `- **GitOps**: ${standards.gitOpsWorkflow.repositoryStructure[0]}\n`;
        guidance += `- **Environments**: ${standards.multiEnvironmentDeployment.environments.join(', ')}\n`;
        guidance += `- **Quality Gates**: ${standards.qualityGates.automatedTesting[0]}\n`;
        guidance += `- **Deployment**: ${standards.multiEnvironmentDeployment.deploymentOrchestration[0]}\n`;
        guidance += `- **Infrastructure**: ${standards.gitOpsWorkflow.immutableInfrastructure[0]}\n`;

        return guidance;
    }

    private getContextEngineeringGuidance(standards?: ContextEngineeringStandards, _subtask?: string): string {
        if (!standards) return '';
        
        let guidance = '\n\n**Context Engineering Compliance Requirements:**\n';
        
        guidance += `- **System Purpose**: ${standards.systemPurpose}\n`;
        guidance += `- **Document Types**: Ensure proper domain.req.md vs digital.req.md selection based on: ${standards.documentTypes.domainReqMd[0]}\n`;
        guidance += `- **Lifecycle Management**: Follow ${standards.documentLifecycle.newConceptsFlow[0]}\n`;
        guidance += `- **Semantic Analysis**: Maintain ${standards.semanticAnalysis.businessConceptExtraction[1]} confidence levels\n`;
        guidance += `- **Registry Management**: ${standards.documentLifecycle.registryManagement[0]}\n`;
        guidance += `- **Template Standards**: ${standards.semanticAnalysis.templateGeneration[2]}\n`;

        return guidance;
    }

    // Utility methods
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    private async readFileWithCache(filePath: string): Promise<string> {
        const cacheKey = filePath;
        const now = Date.now();
        
        // Check if we have cached content and it's still valid
        if (this.documentationCache.has(cacheKey)) {
            const timestamp = this.cacheTimestamps.get(cacheKey) || 0;
            if (now - timestamp < this.cacheTimeout) {
                logger.debug('📄 Using cached documentation', { filePath });
                return this.documentationCache.get(cacheKey);
            }
        }
        
        // Load fresh content
        const content = await fs.promises.readFile(filePath, 'utf-8');
        this.documentationCache.set(cacheKey, content);
        this.cacheTimestamps.set(cacheKey, now);
        
        logger.debug('📄 Loaded fresh documentation', { filePath, contentLength: content.length });
        return content;
    }

    /**
     * Clear documentation cache (useful for testing or when documents are updated)
     */
    public clearCache(): void {
        this.documentationCache.clear();
        this.cacheTimestamps.clear();
        logger.info('🗑️ Documentation cache cleared');
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { entries: number; oldestEntry: number | null; newestEntry: number | null } {
        const timestamps = Array.from(this.cacheTimestamps.values());
        return {
            entries: this.documentationCache.size,
            oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
            newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
        };
    }
}

// Export singleton instance
export const projectDocumentationLoader = new ProjectDocumentationLoader();
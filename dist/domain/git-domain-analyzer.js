export var TradingDomain;
(function (TradingDomain) {
    TradingDomain["ANALYSIS"] = "Analysis";
    TradingDomain["DATA"] = "Data";
    TradingDomain["MESSAGING"] = "Messaging";
    TradingDomain["UI"] = "UI";
    TradingDomain["TESTS"] = "Tests";
    TradingDomain["INFRASTRUCTURE"] = "Infrastructure";
    TradingDomain["UNKNOWN"] = "Unknown";
})(TradingDomain || (TradingDomain = {}));
export class GitDomainAnalyzer {
    static DOMAIN_MAPPINGS = [
        {
            domain: TradingDomain.ANALYSIS,
            pathPatterns: [
                'Utility/Analysis/',
                'Utility/Visitors/',
                'Utility/TechnicalIndicators/',
                'Services/InflectionPointDetector/',
                'Services/FractalAnalyzer/',
                '**/Fractal*.cs',
                '**/Inflection*.cs',
                '**/Technical*.cs',
                '**/Analysis*.cs'
            ],
            projectPatterns: [
                'Utility',
                'InflectionPointDetector',
                'FractalAnalyzer'
            ],
            description: 'Fractal analysis algorithms, technical indicators, market structure analysis'
        },
        {
            domain: TradingDomain.DATA,
            pathPatterns: [
                'Utility/Data/',
                'Utility/DataLayer/',
                'Utility/Providers/',
                'Services/TickerBarQueueToDatabase/',
                'Services/DataIngestion/',
                '**/DataAccess*.cs',
                '**/Repository*.cs',
                '**/Provider*.cs',
                '**/DAL*.cs',
                '**/Database*.cs',
                '**/TimescaleDB*.cs'
            ],
            projectPatterns: [
                'TickerBarQueueToDatabase',
                'DataIngestion',
                'DataProvider'
            ],
            description: 'TimescaleDB operations, data providers, price history management'
        },
        {
            domain: TradingDomain.MESSAGING,
            pathPatterns: [
                'Utility/Messaging/',
                'Utility/Events/',
                'Services/MessageQueue/',
                'Services/EventProcessor/',
                '**/Event*.cs',
                '**/Message*.cs',
                '**/Queue*.cs',
                '**/Publisher*.cs',
                '**/Subscriber*.cs',
                '**/RedPanda*.cs',
                '**/Kafka*.cs'
            ],
            projectPatterns: [
                'MessageQueue',
                'EventProcessor',
                'MessagingService'
            ],
            description: 'RedPanda integration, event-driven architecture, real-time messaging'
        },
        {
            domain: TradingDomain.UI,
            pathPatterns: [
                'CyphyrRecon/',
                'Console/',
                '**/Pages/',
                '**/Components/',
                '**/Views/',
                '**/*.razor',
                '**/*.cshtml',
                '**/wwwroot/',
                '**/UI*.cs'
            ],
            projectPatterns: [
                'CyphyrRecon',
                'Console',
                'WebUI'
            ],
            description: 'Blazor web application, console interface, user interaction'
        },
        {
            domain: TradingDomain.TESTS,
            pathPatterns: [
                'TestSuite/',
                'Tests/',
                '**/Tests/',
                '**/*.feature',
                '**/*Test.cs',
                '**/*Tests.cs',
                '**/*Spec.cs',
                '**/Mock*.cs',
                '**/TestData/',
                '**/Fixtures/'
            ],
            projectPatterns: [
                'TestSuite',
                'Tests',
                'IntegrationTests',
                'UnitTests'
            ],
            description: 'BDD tests, unit tests, integration tests, test data'
        },
        {
            domain: TradingDomain.INFRASTRUCTURE,
            pathPatterns: [
                'docker-compose.yml',
                'Dockerfile',
                'docker/',
                '.github/',
                'Scripts/',
                'Documentation/',
                'EnvironmentMCPGateway/',
                '**/*.md',
                '**/*.yml',
                '**/*.yaml',
                '**/*.json',
                '**/appsettings*.json',
                '**/Directory.Packages.props',
                '**/*.sln',
                '**/*.csproj'
            ],
            projectPatterns: [
                'EnvironmentMCPGateway',
                'Scripts',
                'Documentation'
            ],
            description: 'Infrastructure, configuration, deployment, documentation'
        }
    ];
    static PROJECT_MAPPINGS = [
        {
            projectName: 'Utility',
            domain: TradingDomain.ANALYSIS,
            description: 'Core shared library with analysis engine and domain objects',
            keyFiles: ['Analysis/', 'TechnicalIndicators/', 'Visitors/']
        },
        {
            projectName: 'InflectionPointDetector',
            domain: TradingDomain.ANALYSIS,
            description: 'Microservice for detecting market inflection points',
            keyFiles: ['InflectionPointDetector.cs', 'Program.cs']
        },
        {
            projectName: 'TickerBarQueueToDatabase',
            domain: TradingDomain.DATA,
            description: 'Service for processing ticker data from queue to database',
            keyFiles: ['TickerBarProcessor.cs', 'DatabaseWriter.cs']
        },
        {
            projectName: 'CyphyrRecon',
            domain: TradingDomain.UI,
            description: 'Blazor web application for monitoring and visualization',
            keyFiles: ['Pages/', 'Components/', 'wwwroot/']
        },
        {
            projectName: 'Console',
            domain: TradingDomain.UI,
            description: 'Command-line interface for data processing and analysis',
            keyFiles: ['Program.cs', 'Commands/']
        },
        {
            projectName: 'TestSuite',
            domain: TradingDomain.TESTS,
            description: 'Comprehensive BDD test suite using Reqnroll',
            keyFiles: ['Features/', 'Steps/', 'Hooks/']
        }
    ];
    static mapFileToDomain(filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        for (const mapping of this.DOMAIN_MAPPINGS) {
            for (const pattern of mapping.pathPatterns) {
                if (this.matchesPattern(normalizedPath, pattern)) {
                    return mapping.domain;
                }
            }
        }
        return TradingDomain.UNKNOWN;
    }
    static mapProjectToDomain(projectName) {
        const projectMapping = this.PROJECT_MAPPINGS.find(p => p.projectName === projectName);
        if (projectMapping) {
            return projectMapping.domain;
        }
        for (const mapping of this.DOMAIN_MAPPINGS) {
            for (const pattern of mapping.projectPatterns) {
                if (this.matchesPattern(projectName, pattern)) {
                    return mapping.domain;
                }
            }
        }
        return TradingDomain.UNKNOWN;
    }
    static matchesPattern(text, pattern) {
        // Simple glob pattern matching
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
            return regex.test(text);
        }
        return text.toLowerCase().includes(pattern.toLowerCase());
    }
    static analyzeCommitDomainImpact(commit) {
        const domainsSet = new Set();
        const projectsSet = new Set();
        // Analyze each file in the commit
        for (const file of commit.files) {
            const domain = this.mapFileToDomain(file.path);
            if (domain !== TradingDomain.UNKNOWN) {
                domainsSet.add(domain);
                file.domain = domain;
            }
            // Extract project name from path
            const projectName = this.extractProjectName(file.path);
            if (projectName) {
                projectsSet.add(projectName);
            }
        }
        const domains = Array.from(domainsSet);
        const affectedProjects = Array.from(projectsSet);
        const crossDomainImpact = domains.length > 1;
        // Determine primary domain
        let primaryDomain = domains[0] || TradingDomain.UNKNOWN;
        if (domains.length > 1) {
            // Priority: Analysis > Data > Messaging > UI > Tests > Infrastructure
            const priority = [
                TradingDomain.ANALYSIS,
                TradingDomain.DATA,
                TradingDomain.MESSAGING,
                TradingDomain.UI,
                TradingDomain.TESTS,
                TradingDomain.INFRASTRUCTURE
            ];
            for (const domain of priority) {
                if (domains.includes(domain)) {
                    primaryDomain = domain;
                    break;
                }
            }
        }
        // Assess business impact
        const businessImpact = this.assessBusinessImpact(domains, affectedProjects, commit);
        // Determine risk level
        const riskLevel = this.assessRiskLevel(domains, affectedProjects, commit);
        // Update commit with domain impact
        commit.domainImpact = {
            analysis: domains.includes(TradingDomain.ANALYSIS),
            data: domains.includes(TradingDomain.DATA),
            messaging: domains.includes(TradingDomain.MESSAGING),
            crossDomain: crossDomainImpact,
            affectedProjects
        };
        return {
            domains,
            primaryDomain,
            crossDomainImpact,
            affectedProjects,
            businessImpact,
            riskLevel
        };
    }
    static extractProjectName(filePath) {
        const pathParts = filePath.split('/');
        // Look for known project names
        for (const part of pathParts) {
            const projectMapping = this.PROJECT_MAPPINGS.find(p => p.projectName === part);
            if (projectMapping) {
                return part;
            }
        }
        // Return first directory as project name
        return pathParts[0] || null;
    }
    static assessBusinessImpact(domains, _projects, _commit) {
        if (domains.includes(TradingDomain.ANALYSIS)) {
            return 'High - Core trading algorithm changes may affect strategy performance';
        }
        if (domains.includes(TradingDomain.DATA)) {
            return 'Medium - Data layer changes may impact market data processing';
        }
        if (domains.includes(TradingDomain.MESSAGING)) {
            return 'Medium - Messaging changes may affect real-time processing';
        }
        if (domains.includes(TradingDomain.UI)) {
            return 'Low - UI changes affect user experience but not trading logic';
        }
        if (domains.includes(TradingDomain.TESTS)) {
            return 'Low - Test changes improve quality but don\'t affect runtime';
        }
        if (domains.includes(TradingDomain.INFRASTRUCTURE)) {
            return 'Medium - Infrastructure changes may affect deployment and operations';
        }
        return 'Unknown - Unable to assess business impact';
    }
    static assessRiskLevel(domains, _projects, _commit) {
        // Cross-domain changes are higher risk
        if (domains.length > 2) {
            return 'high';
        }
        // Analysis domain changes are higher risk
        if (domains.includes(TradingDomain.ANALYSIS)) {
            return domains.length > 1 ? 'high' : 'medium';
        }
        // Data or messaging changes with multiple files
        if ((domains.includes(TradingDomain.DATA) || domains.includes(TradingDomain.MESSAGING)) &&
            _commit.files.length > 5) {
            return 'medium';
        }
        // Multiple project changes
        if (_projects.length > 2) {
            return 'medium';
        }
        return 'low';
    }
    static analyzeBranchDomainContext(branch) {
        const contexts = [];
        // Analyze branch name for domain hints
        const branchName = branch.name.toLowerCase();
        if (branchName.includes('analysis') || branchName.includes('fractal') || branchName.includes('inflection')) {
            contexts.push('Analysis Engine Development');
        }
        if (branchName.includes('data') || branchName.includes('database') || branchName.includes('timescale')) {
            contexts.push('Data Layer Enhancement');
        }
        if (branchName.includes('messaging') || branchName.includes('redpanda') || branchName.includes('kafka')) {
            contexts.push('Messaging System Integration');
        }
        if (branchName.includes('ui') || branchName.includes('blazor') || branchName.includes('console')) {
            contexts.push('User Interface Development');
        }
        if (branchName.includes('test') || branchName.includes('spec') || branchName.includes('bdd')) {
            contexts.push('Test Suite Enhancement');
        }
        if (branchName.includes('docker') || branchName.includes('deploy') || branchName.includes('infra')) {
            contexts.push('Infrastructure Management');
        }
        // If no specific context found, try to infer from commit message
        if (contexts.length === 0) {
            const commitMessage = branch.lastCommit.message.toLowerCase();
            if (commitMessage.includes('fractal') || commitMessage.includes('analysis')) {
                contexts.push('Analysis Engine Work');
            }
            else if (commitMessage.includes('data') || commitMessage.includes('database')) {
                contexts.push('Data Processing');
            }
            else if (commitMessage.includes('test')) {
                contexts.push('Testing');
            }
            else {
                contexts.push('General Development');
            }
        }
        return contexts;
    }
    static getProjectDomainMappings() {
        return this.PROJECT_MAPPINGS;
    }
    static getDomainMappingRules() {
        return this.DOMAIN_MAPPINGS;
    }
    static getDomainDescription(domain) {
        const mapping = this.DOMAIN_MAPPINGS.find(m => m.domain === domain);
        return mapping?.description || 'Unknown domain';
    }
    static analyzeCodeImpact(filePaths) {
        const domainBreakdown = new Map();
        const crossDomainFiles = [];
        // Analyze each file
        for (const filePath of filePaths) {
            const domain = this.mapFileToDomain(filePath);
            domainBreakdown.set(domain, (domainBreakdown.get(domain) || 0) + 1);
            // Check if file affects multiple domains (e.g., shared utilities)
            if (filePath.includes('Utility/') && !filePath.includes('Tests/')) {
                crossDomainFiles.push(filePath);
            }
        }
        // Generate risk assessment
        const affectedDomains = Array.from(domainBreakdown.keys()).filter(d => d !== TradingDomain.UNKNOWN);
        let riskAssessment = 'Low risk';
        if (affectedDomains.length > 2) {
            riskAssessment = 'High risk - Multiple domains affected';
        }
        else if (affectedDomains.includes(TradingDomain.ANALYSIS)) {
            riskAssessment = 'Medium-High risk - Core analysis logic affected';
        }
        else if (crossDomainFiles.length > 0) {
            riskAssessment = 'Medium risk - Shared utilities affected';
        }
        // Generate recommendations
        const recommendations = [];
        if (affectedDomains.includes(TradingDomain.ANALYSIS)) {
            recommendations.push('Run comprehensive analysis tests before deployment');
            recommendations.push('Validate fractal and inflection point detection accuracy');
        }
        if (affectedDomains.includes(TradingDomain.DATA)) {
            recommendations.push('Test database migrations and data integrity');
            recommendations.push('Verify TimescaleDB performance is not degraded');
        }
        if (affectedDomains.includes(TradingDomain.MESSAGING)) {
            recommendations.push('Test message queue reliability and throughput');
            recommendations.push('Verify event publishing and subscription patterns');
        }
        if (crossDomainFiles.length > 0) {
            recommendations.push('Run full integration test suite');
            recommendations.push('Review impact on dependent projects');
        }
        return {
            domainBreakdown,
            crossDomainFiles,
            riskAssessment,
            recommendations
        };
    }
}
//# sourceMappingURL=git-domain-analyzer.js.map
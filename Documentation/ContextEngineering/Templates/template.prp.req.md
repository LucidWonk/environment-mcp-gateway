# PRP: [System Component Title - Clear Capability Description]

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL PRP)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.prp.req.md
TEMPLATE_VERSION: 5.0.0
TEMPLATE_DESCRIPTION: Major v5.0 upgrade for Sonnet 4.5 optimization: Template instruction separation, version alignment with Context Engineering System v5.0
═══════════════════════════════════════════════════════════════════════════

TEMPLATE UPDATE INSTRUCTIONS FOR AI (DO NOT INCLUDE IN FINAL DOCUMENTS)
═══════════════════════════════════════════════════════════════════════════
When updating this template, the AI MUST follow these instructions:

1. VERSION INCREMENTATION:
   - Major (x.0.0): Fundamental changes to template structure or execution model
   - Minor (x.y.0): Significant enhancements like new sections or validation requirements
   - Patch (x.y.z): Minor tweaks, typo fixes, or small clarifications
   - ALWAYS increment version when making ANY change
   - UPDATE TEMPLATE_DESCRIPTION to reflect changes

   VERSION 5.0.0 MAJOR ENHANCEMENTS:
   - Template instruction separation (maintenance guidance → TEMPLATE-MAINTENANCE.md)
   - Version alignment with Context Engineering System v5.0.0

2. TIME REFERENCE REMOVAL:
   - NEVER include time estimates (minutes, hours, days) in any section
   - Use complexity indicators instead: "Simple task", "Complex implementation", "Multiple components"
   - Use dependency counts: "3 files to modify", "5 test cases required", "2 integrations needed"
   - Use completion metrics: "Until all tests pass", "Until build succeeds", "Until validation complete"

3. PRIORITY AND ORDERING:
   - Base ALL priorities on technical build dependencies, NOT business value
   - Sequence features by: "Must complete X before Y can begin"
   - Use dependency-driven language: "Requires foundation components", "Depends on Feature X completion"
   - Avoid value judgments: "Important", "Critical", "High-priority" unless referring to technical blocking

4. TEMPLATE INSTRUCTION HANDLING:
   - These "TEMPLATE UPDATE INSTRUCTIONS" sections are for AI template maintenance only
   - NEVER copy these sections to documents created from templates
   - Only copy content between the template instruction blocks to final documents
   - Remove ALL template instruction comments from generated documents

5. INSTRUCTION PROPAGATION RULES:
   - Template instructions (marked with "DO NOT INCLUDE IN FINAL") stay in templates only
   - Content instructions (for document creation) get copied to generated documents
   - Metadata fields (TEMPLATE_FILE, TEMPLATE_VERSION) get copied for traceability

FAILURE TO FOLLOW THESE RULES WILL RESULT IN CORRUPTED TEMPLATE SYSTEM.
═══════════════════════════════════════════════════════════════════════════

TEMPLATE USAGE INSTRUCTIONS FOR AI (DO NOT INCLUDE IN FINAL PRP)
═══════════════════════════════════════════════════════════════════════════
When creating a PRP from this template:
1. Remove all sections marked with <!-- TEMPLATE INSTRUCTION -->
2. Replace all [bracketed placeholders] with actual content
3. Use the TEMPLATE_FILE and TEMPLATE_VERSION defined above for metadata fields:
   - "Generated From Template" field: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
   - "Template Version" field: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
4. Fill in all metadata fields with actual values, not placeholders
═══════════════════════════════════════════════════════════════════════════
-->

**📋 v5.0 TEMPLATE FEATURES**:
- **Template Version**: 5.0.0 (Context Engineering System v5.0 aligned)
- **Template Instruction Separation**: Maintenance guidance in TEMPLATE-MAINTENANCE.md
- **Version Alignment**: All Context Engineering templates aligned to v5.0.0

## **CAPABILITY OVERVIEW**
[Single-sentence description of the capability this component provides to the system]

**System Context**: [2-3 paragraphs explaining how this capability fits within the broader system architecture and why it exists]

**Business Value:**
- [Quantifiable business outcome #1 with specific metrics]
- [Quantifiable business outcome #2 with specific metrics]
- [Quantifiable business outcome #3 with specific metrics]

## **SYSTEM INTEGRATION MATRIX**

### **Capability Dependencies**
| Depends On | Type | Status | Reference Document |
|------------|------|--------|-------------------|
| [Capability Name] | Hard Dependency | [ ] Available [ ] Pending | [Document Title](filename.extension.md) |
| [Capability Name] | Soft Dependency | [ ] Available [ ] Pending | [Document Title](filename.extension.md) |

### **Capability Consumers** 
| Consumed By | Integration Type | Reference Document |
|-------------|------------------|-------------------|
| [Consumer Capability] | [API/Event/Data] | [Document Title](filename.extension.md) |
| [Consumer Capability] | [API/Event/Data] | [Document Title](filename.extension.md) |

### **Shared System Elements**
- **Technology Stack**: References [Tech Stack Document](filename.extension.md)
- **Architecture Patterns**: References [Architecture Document](filename.extension.md)
- **Security Model**: References [Security Document](filename.extension.md)
- **Data Model**: References [Data Architecture Document](filename.extension.md)

## **CAPABILITY SPECIFICATION**

### **Core Responsibilities**
**Primary Responsibility:** [Single-sentence statement of core responsibility]

**Secondary Responsibilities:**
- [Specific responsibility #1 with clear boundaries]
- [Specific responsibility #2 with clear boundaries]
- [Specific responsibility #3 with clear boundaries]

### **Capability Boundaries**
**In Scope:**
- [Specific functionality that belongs to this capability]
- [Data ownership and management areas]
- [Integration points this capability owns]

**Out of Scope:**
- [Functionality explicitly NOT part of this capability]
- [Data or processes owned by other capabilities]
- [Integration responsibilities of other capabilities]

### **Quality Attributes**
| Attribute | Requirement | Measurement | Target |
|-----------|-------------|-------------|--------|
| Performance | Response time | 95th percentile | < 200ms |
| Availability | Uptime | Monthly | 99.9% |
| Scalability | Concurrent users | Peak load | 10,000 |
| Security | Data protection | Compliance | SOX/PCI DSS |

## **FEATURE SPECIFICATIONS**

### Feature Implementation Overview
- **Total Features**: [Number] features specified
- **Implementation Status**: [X] Not Implemented, [Y] In Progress, [Z] Implemented
- **Build Sequence**: Features organized by technical dependencies, not business priority
- **Last Updated**: [Date]

### Feature Detailed Specifications

#### **Feature [Build Order]: [Feature Name]**
**Implementation Status**: [ ] Not Implemented | [ ] In Progress | [x] Implemented
**Implementation ICP**: [ICP-Handle] or "Pending"
**Completed Date**: [Date] or "-"

**Business Description:**
[Detailed description of what business capability this feature provides and why it's valuable to users/stakeholders]

**Technical Scope:**
[Specific technical work required to implement this feature, including components to be created/modified]

**Technical Dependencies:**
- **Internal Dependencies**: [Other features that must be completed first]
  - Feature [X]: [Reason for dependency]
  - [Component/Service]: [What's needed from this dependency]
- **External Dependencies**: [External systems/services required]
  - [External API/Service]: [What's needed and version requirements]
  - [Infrastructure Component]: [Platform requirements]

**Integration Requirements:**
- **Data Integration**: [Data sources, schemas, persistence requirements]
- **API Integration**: [External APIs consumed or endpoints exposed]
- **Event Integration**: [Events published or consumed]
- **UI Integration**: [Frontend components or user interface requirements]

**Quality Requirements:**
- **Performance**: [Response time, throughput, scalability requirements]
- **Security**: [Authentication, authorization, data protection requirements]
- **Reliability**: [Uptime, error handling, recovery requirements]
- **Compliance**: [Regulatory or organizational requirements]

**Acceptance Criteria:**
- [ ] [Specific, testable criterion #1]
- [ ] [Specific, testable criterion #2]
- [ ] [Specific, testable criterion #3]

**Implementation Notes:**
[Any additional implementation guidance, gotchas, or architectural considerations]

**Design References:**
- **UI/UX Design**: [Links to design assets, Figma frames, component library references]
- **Architecture Diagrams**: [Links to system architecture, data flow, or integration diagrams]
- **API Specifications**: [Links to OpenAPI specs, interface definitions]

---

#### **Feature [Build Order]: [Next Feature Name]**
[Same structure repeated for each feature...]

## **DOMAIN MODEL**

### **Core Domain Concepts**
```csharp
// IMPLEMENTATION STATUS: Not Implemented
// IMPLEMENTING ICP: [ICP-Handle that will implement this]
// Primary Aggregate Root
public class [PrimaryAggregateRoot] : AggregateRoot<[PrimaryAggregateRoot]Id>
{
    // Core business properties with validation rules
    public [BusinessConcept] Property { get; private set; }
    // RULE: [Specific business rule that governs this property]
    // VALIDATION: [How this rule is enforced in code]
    
    // Business operations with detailed specifications
    public [BusinessResult] PerformCoreOperation([Parameters] parameters)
    {
        // IMPLEMENTATION REQUIREMENTS:
        // 1. [Specific requirement #1]
        // 2. [Specific requirement #2]
        // 3. [Specific requirement #3]
        
        // ERROR HANDLING REQUIREMENTS:
        // - [Exception Type]: [When to throw and why]
        // - [Exception Type]: [Conditions that trigger this exception]
    }
}

// Supporting Entities with detailed specifications
public class [SupportingEntity] : Entity<[SupportingEntity]Id>
{
    // IMPLEMENTATION STATUS: Not Implemented
    // IMPLEMENTING ICP: [ICP-Handle]
    // Entity-specific properties and behaviors with business rules
}

// Value Objects with validation specifications
public record [ValueObject]([Type] Value)
{
    // IMPLEMENTATION STATUS: Not Implemented
    // IMPLEMENTING ICP: [ICP-Handle]
    // Value object validation and behavior requirements
}
```

### **Domain Services**
```csharp
// IMPLEMENTATION STATUS: Not Implemented
// IMPLEMENTING ICP: [ICP-Handle]
public class [DomainService] : IDomainService
{
    public async Task<[Result]> PerformComplexBusinessLogicAsync([Parameters] parameters)
    {
        // IMPLEMENTATION REQUIREMENTS:
        // 1. [Specific business logic requirement]
        // 2. [Integration requirement with other services]
        // 3. [Performance requirement and optimization approach]
        
        // ERROR HANDLING:
        // - [Exception scenarios and handling approach]
    }
    
    public [ValidationResult] ValidateBusinessRules([Parameters] parameters)
    {
        // BUSINESS RULE VALIDATION REQUIREMENTS:
        // - [Rule #1]: [How to validate and what error to return]
        // - [Rule #2]: [Validation approach and error handling]
    }
}
```

### **Integration Contracts**
```csharp
// IMPLEMENTATION STATUS: Not Implemented
// IMPLEMENTING ICP: [ICP-Handle]
// Events published by this capability
public record [CapabilityEvent] : DomainEvent
{
    public [EventData] Data { get; init; }
    public DateTime OccurredAt { get; init; }
    
    // PUBLISHING REQUIREMENTS:
    // - When: [Conditions that trigger this event]
    // - Consumers: [Who consumes this event and why]
    // - Payload: [Required data in event payload]
}

// Commands accepted by this capability
public record [CapabilityCommand] : ICommand
{
    public [CommandData] Data { get; init; }
    
    // VALIDATION REQUIREMENTS:
    // - [Validation rule #1]
    // - [Validation rule #2]
    // - [Authorization requirement]
}

// Queries supported by this capability
public record [CapabilityQuery] : IQuery<[QueryResult]>
{
    public [QueryParameters] Parameters { get; init; }
    
    // PERFORMANCE REQUIREMENTS:
    // - Response time: [Target response time]
    // - Caching strategy: [How results should be cached]
    // - Authorization: [Access control requirements]
}
```

## **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation**
**Objective**: Establish core domain model and basic operations

**Detailed Steps:**
**Step 1.1: Domain Model Implementation**
- **What**: Implement core aggregates, entities, and value objects
- **Why**: Establish foundation for all business operations
- **Dependencies**: None (foundation layer)
- **Deliverables**: Complete domain model with business rule enforcement
- **Success Criteria**:
  - [ ] All aggregates implement specified business rules
  - [ ] Value objects include proper validation logic
  - [ ] Domain events defined for all state changes
- **AI Execution Instructions**:
  - Implement domain model first, focusing on business rules
  - Create comprehensive unit tests for all business logic
  - Establish clear boundaries with other system components
  - Validate domain model against capability requirements
- **Validation Commands**:
  ```bash
  dotnet test src/[Domain].Domain.Tests --logger trx --collect:"XPlat Code Coverage"
  # Coverage must be >95%
  ```

**Step 1.2: Repository and Infrastructure Setup**
- **What**: Implement repository patterns and basic infrastructure
- **Why**: Enable persistence and data access for domain operations
- **Dependencies**: Completed domain model
- **Deliverables**: Repository implementations and infrastructure setup
- **Success Criteria**:
  - [ ] Repository contracts support all required business queries
  - [ ] Infrastructure supports domain event publishing
  - [ ] Performance targets met for data operations
- **AI Execution Instructions**:
  - Focus on business-oriented query capabilities
  - Implement defensive patterns for data access failures
  - Establish comprehensive integration tests
  - Validate repository performance under load
- **Validation Commands**:
  ```bash
  dotnet test src/[Domain].Infrastructure.Tests --logger trx
  dotnet run --project src/[Domain].PerformanceTests
  ```

### **Phase 2: Integration**
**Objective**: Implement integration with dependent capabilities

**Detailed Steps:**
**Step 2.1: API Layer Implementation**
- **What**: Implement REST/GraphQL APIs and external interfaces
- **Why**: Enable external systems to consume this capability
- **Dependencies**: Domain model and repository implementation
- **Deliverables**: Complete API layer with proper error handling
- **Success Criteria**:
  - [ ] All API endpoints function correctly
  - [ ] Error handling covers all failure scenarios
  - [ ] API documentation complete and accurate
- **AI Execution Instructions**:
  - Reference dependency documents for integration contracts
  - Implement defensive patterns for external service failures
  - Create comprehensive integration tests
  - Establish monitoring and observability
- **Validation Commands**:
  ```bash
  dotnet test src/[Domain].API.Tests --logger trx
  dotnet run --project src/[Domain].IntegrationTests
  ```

**Step 2.2: Event Integration**
- **What**: Implement event publishing and subscription
- **Why**: Enable loose coupling with other capabilities
- **Dependencies**: API layer and message infrastructure
- **Deliverables**: Event integration with proper error handling
- **Success Criteria**:
  - [ ] All domain events published correctly
  - [ ] Event consumers handle all scenarios
  - [ ] Event ordering and idempotency guaranteed
- **AI Execution Instructions**:
  - Implement exactly the events specified in integration contracts
  - Handle event publishing failures gracefully
  - Ensure event payload contains all required business context
  - Test event integration with real message infrastructure
- **Validation Commands**:
  ```bash
  dotnet test src/[Domain].Events.Tests --logger trx
  ```

### **Phase 3: Optimization and Readiness**
**Objective**: Performance optimization and production readiness

**Detailed Steps:**
**Step 3.1: Performance Optimization**
- **What**: Optimize critical performance paths and resource usage
- **Why**: Ensure system meets performance requirements under load
- **Dependencies**: Complete functional implementation
- **Deliverables**: Optimized system meeting all performance targets
- **Success Criteria**:
  - [ ] All performance targets exceeded
  - [ ] Resource utilization within acceptable limits
  - [ ] System stable under sustained load
- **AI Execution Instructions**:
  - Profile and optimize critical performance paths
  - Implement caching strategies where appropriate
  - Optimize database queries and data access patterns
  - Validate performance improvements through measurement
- **Validation Commands**:
  ```bash
  dotnet run --project src/[Domain].PerformanceTests --configuration Release
  ```

**Step 3.2: Production Readiness**
- **What**: Final hardening, monitoring, and operational procedures
- **Why**: Ensure system ready for production deployment
- **Dependencies**: Performance optimization complete
- **Deliverables**: Production-ready system with full observability
- **Success Criteria**:
  - [ ] All monitoring and alerting configured
  - [ ] Security requirements validated
  - [ ] Operational procedures documented
- **AI Execution Instructions**:
  - Implement comprehensive observability
  - Validate all security and compliance requirements
  - Create operational documentation
  - Perform final integration testing
- **Validation Commands**:
  ```bash
  dotnet test src/[Domain].E2ETests --logger trx
  dotnet run --project tools/SecurityScanner
  ```

## **USER-REQUESTED ROLLBACK PROCEDURES**

### **Rollback Triggers**
Rollback procedures are executed **only when explicitly requested by the user**, not automatically. Users may request rollback for various reasons including:
- Implementation approach changes during development
- Discovery of better technical solutions
- Stakeholder feedback requiring different direction
- Integration conflicts discovered during implementation

### **Rollback Procedures by Scope**

#### **Step-Level Rollback**
**When User Requests**: "Please roll back Step [X.Y]"

**Rollback Actions:**
1. **Code Reversion**:
   - Revert all code changes made in the specified step
   - Remove any new files or components created
   - Restore previous version of modified files
   - Update feature status to reflect rollback

2. **Test and Documentation Cleanup**:
   - Remove tests created for rolled-back functionality
   - Revert documentation changes related to the step
   - Update build and deployment scripts if modified

3. **Dependency Impact Assessment**:
   - Identify any subsequent steps that depended on rolled-back work
   - Mark dependent steps as "Pending Prerequisites"
   - Update overall phase timeline if needed

4. **Build Validation**:
   - Ensure entire solution builds correctly after rollback
   - Run full test suite to confirm no regressions
   - Validate that system returns to stable state

#### **Phase-Level Rollback**
**When User Requests**: "Please roll back Phase [N]"

**Rollback Actions:**
1. **Complete Phase Reversion**:
   - Revert all code changes made during the entire phase
   - Remove all components and features added in the phase
   - Restore codebase to pre-phase state
   - Reset all feature implementation statuses for the phase

2. **Infrastructure and Configuration Rollback**:
   - Revert database schema changes if any
   - Restore configuration files to previous state
   - Remove any new infrastructure components
   - Reset integration configurations

3. **Phase Status Reset**:
   - Mark phase as "Not Started"
   - Clear all phase deliverables and success criteria
   - Reset step completion status within the phase
   - Update PRP document to reflect rollback

4. **Forward Impact Analysis**:
   - Assess impact on subsequent phases
   - Update overall implementation timeline
   - Identify any external dependencies that may be affected

#### **Feature-Level Rollback**
**When User Requests**: "Please roll back Feature [N]"

**Rollback Actions:**
1. **Feature Implementation Reversion**:
   - Remove all code implementing the specific feature
   - Revert any database schema changes for the feature
   - Remove feature-specific tests and documentation
   - Update feature status to "Not Implemented"

2. **Integration Point Cleanup**:
   - Remove any API endpoints specific to the feature
   - Revert event definitions and handlers for the feature
   - Clean up any feature-specific configuration
   - Remove feature from user interface if applicable

3. **Dependency Chain Analysis**:
   - Identify features that depend on the rolled-back feature
   - Mark dependent features as "Blocked" until dependencies resolved
   - Update build order if necessary
   - Communicate impact to stakeholders

### **Post-Rollback Validation**
After any rollback:
1. **Build Verification**: Ensure entire solution builds without errors
2. **Test Validation**: Run full test suite to confirm system stability
3. **Integration Check**: Verify all remaining integrations function correctly
4. **Documentation Update**: Update PRP document to reflect current state
5. **Dependency Verification**: Ensure no broken dependencies remain

## **SUCCESS CRITERIA**

### **Functional Requirements**
- [ ] [Specific, testable functional requirement with clear acceptance criteria]
- [ ] [Another functional requirement with measurable outcome]
- [ ] [Performance requirement with specific measurable threshold]

### **Non-Functional Requirements**
- [ ] **Performance**: Response time < [X] seconds for [specific operations]
- [ ] **Scalability**: Handles [X] concurrent users without degradation
- [ ] **Reliability**: [99.X]% uptime with [X] second recovery time
- [ ] **Security**: Passes security scan with 0 critical and <[X] medium issues

### **Business Metrics**
- [ ] **Business Outcome**: [X]% improvement in [specific business metric]
- [ ] **User Satisfaction**: [X]% satisfaction rating in user feedback
- [ ] **Cost Impact**: [X]% reduction in [specific operational costs]
- [ ] **Efficiency Gain**: [X]% improvement in [specific process efficiency]

### **Integration Requirements**
- [ ] **System Integration**: Seamless integration with [specific systems]
- [ ] **Data Consistency**: Maintains consistency across [data boundaries]
- [ ] **API Compatibility**: Backward compatible with existing [API versions]

## **VALIDATION COMMANDS**

### **Testing Commands with Implementation Status**
```bash
# Unit Tests - Implementation Status: Not Implemented
# Implementation ICP: [ICP-Handle]
# Coverage Requirement: >95%
dotnet test src/[Domain].Domain.Tests --logger trx --collect:"XPlat Code Coverage"

# Integration Tests - Implementation Status: Not Implemented
# Implementation ICP: [ICP-Handle]
# Requirement: All integration points tested
dotnet test src/[Domain].Integration.Tests --logger trx

# Performance Tests - Implementation Status: Not Implemented
# Implementation ICP: [ICP-Handle]
# Requirement: Meets performance benchmarks
dotnet run --project src/[Domain].PerformanceTests

# Security Tests - Implementation Status: Not Implemented
# Implementation ICP: [ICP-Handle]
# Requirement: Passes security scan
dotnet run --project tools/SecurityScanner

# End-to-End Tests - Implementation Status: Not Implemented
# Implementation ICP: [ICP-Handle]
# Requirement: Complete user journey validation
dotnet test src/[Domain].E2ETests --logger trx
```

### **Quality Gates**
- [ ] **Unit Test Coverage**: >95% coverage with meaningful tests
- [ ] **Integration Test Coverage**: All external integrations tested
- [ ] **Performance Benchmarks**: All performance requirements met
- [ ] **Security Validation**: Security scan passed with acceptable risk level
- [ ] **Code Quality**: Static analysis passed with defined quality standards

## **INTEGRATION POINTS**

### **System Integration Requirements**
- **[System/Component Title]** ([filename.extension.md]): [Integration approach and requirements]
- **[System/Component Title]** ([filename.extension.md]): [Data exchange patterns and protocols]
- **[External System]**: [Integration specifications and constraints]

### **Data Integration Patterns**
- [ ] **Event-Driven Integration**: [Event types and handling approach]
- [ ] **API Integration**: [REST/GraphQL specifications and versioning]
- [ ] **Database Integration**: [Shared data access patterns and consistency]

### **Cross-Cutting Concerns**
- [ ] **Logging and Monitoring**: [Observability requirements and implementation]
- [ ] **Security and Authorization**: [Security model and access control]
- [ ] **Configuration Management**: [Configuration approach and environment handling]

---

**Document Metadata**
- **PRP Title**: [Descriptive title]
- **Template Version**: 2.0
- **Created Date**: [Creation date]
- **Last Updated**: [Last update date]
- **Status**: [ ] Draft | [ ] Review | [ ] Approved | [ ] Active | [ ] Deprecated
- **Related PRPs**: [Links to related PRP titles and filenames]
- **Implementation ICPs**: [Links to ICPs that implement features from this PRP]

**Change History**
| Version | Date | Changes | Related ICP |
|---------|------|---------|-------------|
| 1.0 | [Date] | Initial PRP creation | [Concept ICP Handle] |
| [Version] | [Date] | [Description of changes] | [Related ICP Handle] |

---

**AI Implementation Guidance**
When implementing this capability:
1. **Follow build sequence** - Implement features in dependency order, not business value order
2. **Establish dependencies first** - Ensure all technical prerequisites are available before starting feature implementation
3. **Validate integration contracts** - Test integration points as soon as dependencies are available
4. **Implement incrementally** - Complete each build phase fully before moving to the next phase
5. **Maintain capability boundaries** - Ensure implementation preserves the specified capability boundaries and responsibilities

**Human Review Focus Areas**
- **Business accuracy**: Do specifications correctly represent business needs and capabilities?
- **Implementation clarity**: Can an AI successfully implement from these specifications?
- **Integration coherence**: Do cross-capability integrations make business and technical sense?
- **Completeness**: Are all necessary specifications present for successful implementation?

---

**Document Metadata**
- **PRP Name**: [System Component Name]
- **Generated From Template**: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
- **Template Version**: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
- **Created Date**: [Date]
- **Last Updated**: [Date]
- **Status**: [ ] Draft | [ ] Approved | [ ] Active | [ ] Evolving | [ ] Deprecated
- **Related Domains**: [List of related bounded context documents]

**Implementation Tracking**
- **Overall Implementation Status**: [X]% Complete
- **Critical Dependencies**: [List of blocking dependencies]
- **Next Implementation Phase**: [Description of next major implementation milestone]

**Change History**
| Version | Date | Changes | Related ICP |
|---------|------|---------|-------------|
| 1.0 | [Date] | Initial PRP creation | [Concept ICP Handle] |
| [Version] | [Date] | [Description of changes] | [Related ICP Handle] |
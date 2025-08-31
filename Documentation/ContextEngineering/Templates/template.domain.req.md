# Domain Capability Template: [Bounded Context Name - Core Business Capability]

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL DOCUMENT)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.domain.req.md
TEMPLATE_VERSION: 1.2.0
TEMPLATE_DESCRIPTION: Enhanced with dependency-based prioritization and template update instructions
═══════════════════════════════════════════════════════════════════════════

DOCUMENT CREATION DECISION MATRIX (DO NOT INCLUDE IN FINAL DOCUMENTS)
═══════════════════════════════════════════════════════════════════════════
USE THIS TEMPLATE (template.domain.req.md) WHEN:
✅ Backend business logic with domain rules
✅ Infrastructure components requiring configuration  
✅ Service interfaces with integration patterns
✅ Libraries with reusable business capabilities
❌ DON'T USE for: UI components, dashboards, user interfaces (use template.digital.req.md)
❌ DON'T USE for: Simple utilities, generated code, experimental features

Examples: fractal-analysis.domain.req.md, messaging-infrastructure.domain.req.md

FULL-STACK FEATURES: Create BOTH domain.req.md (backend) AND digital.req.md (frontend)
═══════════════════════════════════════════════════════════════════════════

TEMPLATE UPDATE INSTRUCTIONS FOR AI (DO NOT INCLUDE IN FINAL DOCUMENTS)
═══════════════════════════════════════════════════════════════════════════
When updating this template, the AI MUST follow these instructions:

1. VERSION INCREMENTATION:
   - Major (x.0.0): Fundamental changes to template structure or execution model
   - Minor (x.y.0): Significant enhancements like new sections or validation requirements  
   - Patch (x.y.z): Minor tweaks, typo fixes, or small clarifications
   - ALWAYS increment version when making ANY change
   - Update TEMPLATE_DESCRIPTION to reflect the changes made

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

TEMPLATE USAGE INSTRUCTIONS (DO NOT INCLUDE IN FINAL DOCUMENT)
═══════════════════════════════════════════════════════════════════════════
This template defines ONE business domain capability (deployable artifact).

CAPABILITY ID GENERATION AND REGISTRY:
1. Generate unique ID: [DOMAIN]-[NAME]-[4-random-chars]
   Example: TRADE-FRACTAL-a7b3
2. Check /Documentation/ContextEngineering/capability-registry.md for conflicts
3. ADD new capability to registry with:
   - Status: "Not Started"
   - Created Date: Today's date
   - Implementation ICP: "TBD"
   - Document: This file's name

CRITICAL: Domain documents describe BUSINESS capabilities (logic, rules, processes)
Different from Digital documents which describe USER-FACING capabilities.

FEATURE TRACKING:
- Each feature gets ID: [CAPABILITY-ID]-F[###]
- Track implementation status and ICP references
- Update feature status when ICPs implement them

DEPENDENCIES:
- List other domain/digital capabilities this depends on
- Use capability IDs from the registry
- Specify dependency type (Data, API, Event, etc.)

IMPORTANT: This is a specification document. Implementation happens through ICPs.

TEMPLATE VERSIONING:
When creating documents from this template, ensure:
1. Use the TEMPLATE_FILE and TEMPLATE_VERSION defined above for metadata fields:
   - "Generated From Template" field: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
   - "Template Version" field: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
2. Fill in all metadata fields with actual values, not placeholders
═══════════════════════════════════════════════════════════════════════════
-->

## **TEMPLATE USAGE**
This template creates domain capability documents using pattern: `[capability-name].domain.md`

**Example Usage:**
- File: `fractal-analysis.domain.md`
- Title: `# Domain Capability: Fractal Analysis - Market Pattern Recognition`

## **CAPABILITY DEFINITION**
**Capability ID**: [DOMAIN-NAME-4chars] (Must be unique - check registry)
**Capability Name**: [Human-readable name]
**Domain Type**: Business Logic Domain
**Deployment Unit**: [Service/Library/Agent/etc.]

## **CAPABILITY REGISTRY MAINTENANCE**
<!-- CRITICAL: These instructions MUST remain in generated domain documents -->

**Registry Update Requirements:**
When creating this domain document, the AI MUST:

**During Document Creation:**
1. Generate unique capability ID: [DOMAIN]-[NAME]-[4-random-chars]
2. Check `/Documentation/ContextEngineering/capability-registry.md` for conflicts
3. ADD new capability entry to registry with:
   - Status: "Not Started"
   - Created Date: Today's date
   - Implementation ICP: "TBD"
   - Document: This document's filename

**During Feature Updates:**
When ICPs implement features from this domain:
1. Update feature status in this document's feature table
2. Update "Implementation ICP" column with actual ICP reference
3. Update "Completed Date" when feature implementation finishes

**Registry Interaction Pattern:**
- **CREATE** new capability entry when this document is first created
- **REFERENCE** this capability ID in all future ICPs and cross-references
- **MAINTAIN** feature status alignment between this document and registry

## **CAPABILITY OVERVIEW**
[2-3 paragraphs describing the business capability this bounded context provides to the enterprise. Focus on the business problem it solves and why it exists as a separate domain.]

**Core Business Responsibility:** [Single sentence capturing the essential business purpose]

**Business Value Delivered:**
- [Specific business outcome #1 with measurable impact]
- [Specific business outcome #2 with measurable impact]
- [Specific business outcome #3 with measurable impact]

## **CAPABILITY DEPENDENCIES**
<!-- List capabilities this domain depends on -->

### **Build Dependencies**
<!-- Must exist before this capability can be built -->
| Capability ID | Capability Name | Type | Document | Why Needed |
|---------------|-----------------|------|----------|------------|
| [CAPABILITY-ID] | [Name] | Data/API/Event | [filename.domain.md] | [Reason] |

### **Runtime Dependencies**
<!-- Required at runtime but not for build -->
| Capability ID | Capability Name | Type | Document | Why Needed |
|---------------|-----------------|------|----------|------------|
| [CAPABILITY-ID] | [Name] | API/Event | [filename.digital.md] | [Reason] |

### **Consumers**
<!-- Capabilities that depend on this one -->
| Capability ID | Capability Name | What They Use |
|---------------|-----------------|---------------|
| [CAPABILITY-ID] | [Name] | [APIs/Events this provides] |

## **DOMAIN BOUNDARIES AND CONTEXT**

### **Bounded Context Definition**
**Domain Boundaries (Critical DDD Principle):**
Define clear ownership to prevent model corruption and maintain domain autonomy.

**What This Domain Owns (Complete Responsibility):**
- [Core Aggregate #1]: [Business entity] with [invariant rules] and [lifecycle management]
- [Core Aggregate #2]: [Business entity] with [invariant rules] and [lifecycle management]
- [Domain Process #1]: [Complete business workflow] from [trigger] to [completion]
- [Domain Events]: [Event #1], [Event #2] that communicate state changes to other contexts

**What This Domain Does NOT Own (Explicit Exclusions):**
- [External Concept]: Owned by [Domain Name] - we consume via [Integration Pattern]
- [Shared Process]: Orchestrated by [Domain Name] - we participate via [Event/API]
- [Reference Data]: Maintained by [Domain Name] - we cache/reference only

**Boundary Violations to Avoid:**
- DO NOT directly modify entities owned by other domains
- DO NOT implement business rules that belong to other domains
- DO NOT create dependencies that bypass published domain interfaces

### **Ubiquitous Language**
**DDD Principle:** The same terms used by business experts must be used in code, tests, and all communication.

| Domain Term | Business Definition | Code Representation | Usage Rules |
|-------------|--------------------|--------------------|-------------|
| [Core Entity] | [Precise business meaning with business rules] | `class [EntityName]` | Used by: Business, Developers, Tests. NOT used outside this domain |
| [Value Object] | [Immutable business concept with validation] | `record [ValueName]` | Validated at creation, immutable, expresses business constraint |
| [Domain Event] | [Significant business occurrence] | `[EventName]Event` | Past tense, business-meaningful, published when [business condition] |
| [Domain Service] | [Business logic not belonging to entity] | `I[ServiceName]Service` | Stateless, coordinates between aggregates or external systems |

**Language Consistency Rules:**
- All code classes/methods MUST use exact business terminology
- Tests MUST use business language in scenario names  
- API endpoints MUST reflect business operations (not CRUD)
- Database table/column names MUST match domain terms
- Cross-team communication MUST use these exact terms

**Terms to Avoid (Anti-Patterns):**
- Technical jargon that business doesn't understand
- Generic terms like "Data", "Info", "Manager", "Handler"
- CRUD operations instead of business operations
- Database/framework terminology bleeding into domain model

### **Context Map Integration**
**DDD Context Relationships:** Define how this domain interacts with others to prevent model corruption.

| Related Domain | DDD Relationship | Integration Pattern | Dependency Direction | Reference Document |
|----------------|------------------|-------------------|---------------------|-------------------|
| [Domain Name] | **Customer/Supplier** | [API/Event] | We depend on them | [Document Title](filename.domain.md) |
| [Domain Name] | **Supplier/Customer** | [Event/API] | They depend on us | [Document Title](filename.domain.md) |
| [Domain Name] | **Conformist** | [Their API] | We adapt to their model | [Document Title](filename.domain.md) |
| [Domain Name] | **Anti-Corruption Layer** | [Adapter/Translator] | We protect our model | [Document Title](filename.domain.md) |
| [Domain Name] | **Partnership** | [Shared Events] | Mutual dependency | [Document Title](filename.domain.md) |
| [Domain Name] | **Shared Kernel** | [Shared Library] | Common code/model | [Document Title](filename.domain.md) |

**DDD Relationship Definitions:**
- **Customer/Supplier**: Supplier provides interface, Customer adapts. Clear upstream/downstream.
- **Conformist**: We accept supplier's model as-is. Used when we can't influence upstream.
- **Anti-Corruption Layer**: We translate external model to protect our domain model integrity.
- **Partnership**: Mutual dependency with coordinated development. Higher coordination cost.
- **Shared Kernel**: Shared code that requires tight coordination. Use sparingly.

**Integration Anti-Patterns to Avoid:**
- Direct database access between domains
- Shared mutable state
- Synchronous coupling for non-critical operations
- Bypassing published domain interfaces

## **DOMAIN FEATURES**

### **Feature Summary**
| Feature ID | Feature Name | Status | Build Order | Dependencies | Implementation ICP |
|------------|--------------|--------|-------------|--------------|-------------------|
| [CAPABILITY-ID]-F001 | [Feature Name] | Not Implemented | 1 | None | TBD |
| [CAPABILITY-ID]-F002 | [Feature Name] | Not Implemented | 2 | F001 | TBD |

### **Feature Implementation Overview**
- **Total Features**: [Number] features specified
- **Implementation Status**: [X] Not Implemented, [Y] In Progress, [Z] Implemented
- **Build Sequence**: Features organized by technical dependencies, not business priority
- **Last Updated**: [Date]

### **Feature Detailed Specifications**

#### **Feature: [CAPABILITY-ID]-F001**
**Name**: [Feature Name]
**Status**: [ ] Not Implemented | [ ] In Progress | [x] Implemented
**Implementation ICP**: TBD or ICP-IMPL-[###]
**Build Order**: [Number] (dependency sequence)
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

**Domain Model Concepts:**
- **[Aggregate Root]:** [Business concept and key behaviors]
- **[Entity 1]:** [Business concept and relationship to aggregate]
- **[Value Object 1]:** [Immutable business concept and validation rules]

**Integration Requirements:**
- **Events Published:** [Event Name] when [business condition occurs]
- **Events Consumed:** [Event Name] from [Source Domain] to [business action]
- **API Contracts:** [External interfaces exposed or consumed]
- **Data Integration:** [Repository patterns and data access requirements]

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

---

#### **Feature [Build Order]: [Next Feature Name]**
[Same structure repeated for each feature...]

## **DOMAIN MODEL ARCHITECTURE**

### **Core Domain Patterns**
**Primary Aggregates (DDD Consistency Boundaries):**
Each aggregate maintains business invariants and controls transactional boundaries.

**[Aggregate Root Name]:**
- **Business Purpose**: [Core business concept this aggregate represents]
- **Invariants Protected**: [Business rules that must ALWAYS be true]
- **Entities Contained**: [Child entities within this boundary]
- **Value Objects**: [Immutable concepts used by this aggregate]
- **Business Operations**: [Domain methods exposed, NOT CRUD]
  - `[BusinessOperation]()`: [What business rule it enforces]
  - `[BusinessOperation]()`: [What business rule it enforces]
- **Domain Events Published**: [Events when business state changes]
- **External Dependencies**: [What this aggregate needs from outside]

**Domain Services (Cross-Aggregate Logic):**
For business logic that doesn't fit within a single aggregate.

**[Domain Service Name]:**
- **Business Purpose**: [Complex business logic this service implements]
- **Aggregates Coordinated**: [Which aggregates this service works with]
- **Business Rules Enforced**: [Cross-aggregate invariants maintained]
- **External Integration**: [How it interacts with other domains]

**Repository Patterns:**
- **[Repository Interface]:** Provides [business-oriented query capabilities] for [Aggregate]
- **[Repository Interface]:** Supports [business workflow requirements] for [use cases]

### **Key Domain Events**
**DDD Events:** Represent significant business occurrences that other domains need to know about.

| Event Name | Aggregate Source | Business Trigger | Event Data | Consuming Domains | Business Impact |
|------------|------------------|-----------------|------------|-------------------|-----------------|
| **[EventName]Event** | [Aggregate] | [Specific business condition] | [Business-relevant data only] | [Domain1], [Domain2] | [What business processes are triggered] |
| **[EventName]Event** | [Aggregate] | [Specific business condition] | [Business-relevant data only] | [Domain1], [Domain2] | [What business processes are triggered] |

**Domain Event Design Principles:**
- **Past Tense Naming**: Events represent something that has already happened
- **Business Language**: Use terms business stakeholders understand
- **Minimal Data**: Include only data needed by consumers
- **Immutable**: Events cannot be changed once published
- **Autonomous Processing**: Consumers should be able to process independently

**Event Publishing Strategy:**
- **Immediate**: Published as part of aggregate transaction
- **Eventual**: Published after transaction commits (for performance)
- **Reliable**: Ensure events are delivered (outbox pattern if needed)

**Event Versioning:**
- **Additive Changes**: Add new fields, don't remove existing
- **Breaking Changes**: Create new event version, maintain compatibility period
- **Consumer Resilience**: Consumers must handle missing optional fields

## **DESIGN REFERENCES**

### **Architecture Design Assets**
- **Domain Model Diagrams**: [Link to domain model documentation]
- **Context Map Diagrams**: [Link to context mapping documentation]
- **Event Storming Results**: [Link to event storming sessions]
- **API Design Specifications**: [OpenAPI/Swagger links]

### **Implementation Architecture**
| Architecture Element | Design Reference | Implementation Status |
|---------------------|------------------|---------------------|
| [Domain Model] | [Domain Model Diagram v2.1](link) | [ ] Not Implemented |
| [API Contracts] | [OpenAPI: Domain API v1.3](link) | [ ] Not Implemented |
| [Event Schemas] | [Event Schema: Domain Events](link) | [ ] Not Implemented |

## **IMPLEMENTATION GUIDANCE**

### **Domain-Driven Implementation Approach**
**DDD Implementation Principles:** Business logic drives technical decisions, not the reverse.

**1. Start With Business Conversations:**
- Conduct Event Storming sessions with domain experts
- Identify core business events, commands, and aggregates
- Establish ubiquitous language before writing any code
- Map out domain boundaries and integration points

**2. Model Business Concepts First:**
- Focus on business invariants and rules before persistence
- Use domain experts' language directly in code
- Design aggregates around business transactions, not data relationships
- Implement business operations, not CRUD operations

**3. Preserve Domain Integrity:**
- Keep business logic inside domain objects (aggregates, entities, value objects)
- Don't let infrastructure concerns leak into domain model
- Use domain services only for cross-aggregate business logic
- Maintain aggregate boundaries strictly (no direct references)

**4. Implement Domain-Centric Architecture:**
- Domain layer has no dependencies on infrastructure
- Application services orchestrate domain operations
- Infrastructure adapts to domain interfaces
- Tests use business scenarios, not technical test cases

**5. Design for Business Evolution:**
- Structure code to accommodate business rule changes
- Version domain events for backward compatibility
- Use anti-corruption layers for external system integration
- Keep domain model focused on current business needs

### **Integration Implementation Strategy**
**Event-First Integration:**
Design domain events to communicate business state changes rather than technical data synchronization.

**Defensive Integration:**
Implement integration points with error handling and fallback behavior to maintain domain autonomy.

**Contract Evolution:**
Plan for integration contract changes by versioning events and APIs from the beginning.

### **Common Implementation Patterns**
**Repository Pattern Implementation:**
```csharp
// Focus on business-meaningful queries
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(OrderId id);
    Task<IEnumerable<Order>> GetPendingOrdersForCustomerAsync(CustomerId customerId);
    Task<IEnumerable<Order>> GetOrdersRequiringApprovalAsync();
    Task SaveAsync(Order order);
}
```

**Domain Event Implementation:**
```csharp
// Events express business facts, not technical operations
public record OrderSubmittedEvent(
    OrderId OrderId,
    CustomerId CustomerId,
    DateTime SubmittedAt,
    OrderValue TotalValue
) : DomainEvent;
```

## **ERROR RECOVERY AND ROLLBACK PROCEDURES**

### **User-Requested Rollback Process**
When a user requests rollback of a completed step or phase:

**Step Rollback Procedure:**
1. **Impact Assessment**:
   - Identify all code changes made in the step
   - List all dependent features that may be affected
   - Check for database schema changes or data modifications
   - Review integration points that may be impacted

2. **Rollback Execution**:
   - Revert all code changes using Git to last stable commit before step
   - Rollback database migrations if schema changes were made
   - Update feature status from current state back to previous state
   - Remove any configuration changes made during step

3. **Validation After Rollback**:
   - Run all existing tests to ensure system stability
   - Verify integration points still function correctly
   - Confirm dependent features still work as expected
   - Update documentation to reflect rollback

**Phase Rollback Procedure:**
1. **Comprehensive Impact Assessment**:
   - List all features implemented in the phase
   - Identify all system components modified
   - Map all integration points affected
   - Assess impact on dependent capabilities

2. **Rollback Execution**:
   - Revert all code changes made during the entire phase
   - Rollback all database changes made during phase
   - Remove all configuration and infrastructure changes
   - Update all feature statuses to pre-phase state

3. **System Validation**:
   - Full regression testing to ensure system integrity
   - Integration testing with all dependent systems
   - Performance testing to confirm no degradation
   - User acceptance testing if user-facing changes were reverted

### **Post-Rollback Requirements**
**Documentation Updates:**
- [ ] All feature statuses updated to reflect rollback
- [ ] Implementation ICP updated with rollback details
- [ ] Reason for rollback documented for future reference
- [ ] Lessons learned captured for process improvement

**Communication Requirements:**
- [ ] Stakeholders notified of rollback completion
- [ ] Dependent teams informed of any impacts
- [ ] Timeline and planning adjustments communicated
- [ ] Next steps and alternative approaches discussed

## **QUALITY AND GOVERNANCE**

### **Business Rule Validation**
**Critical Business Rules:**
- [Rule #1]: [How this rule is validated and enforced]
- [Rule #2]: [How this rule is validated and enforced]
- [Rule #3]: [How this rule is validated and enforced]

**Cross-Domain Consistency:**
- [Consistency requirement #1]: [How consistency is maintained across domain boundaries]
- [Consistency requirement #2]: [How eventual consistency is handled]

### **Domain Model Quality Gates**
**Business Alignment Validation:**
- [ ] Domain model accurately reflects business stakeholder mental models
- [ ] Ubiquitous language is consistently used throughout implementation
- [ ] Business rules are correctly enforced by domain objects

**Technical Quality Validation:**
- [ ] Aggregate boundaries maintain proper consistency boundaries
- [ ] Domain events capture all significant business state changes
- [ ] Repository interfaces support business use cases effectively

### **Integration Quality Gates**
**Contract Compliance:**
- [ ] All published events include required business context
- [ ] API contracts match documented integration patterns
- [ ] Error handling preserves business invariants

**Performance and Reliability:**
- [ ] Integration points handle failure scenarios gracefully
- [ ] Business operations complete within acceptable timeframes
- [ ] Domain maintains autonomy despite integration failures

## **EVOLUTION AND MAINTENANCE**

### **Domain Evolution Strategy**
**Business Rule Changes:**
Document how business rule changes will be accommodated without breaking existing functionality or integration contracts.

**Model Evolution:**
Plan for domain model evolution as business understanding deepens and new requirements emerge.

**Integration Evolution:**
Establish patterns for evolving integration contracts while maintaining backward compatibility with consuming domains.

### **Knowledge Capture and Sharing**
**Domain Expertise Documentation:**
Maintain clear documentation of business rules, edge cases, and stakeholder decisions that inform the domain model.

**Cross-Team Communication:**
Establish regular communication patterns with teams responsible for related domains to maintain context map accuracy.

### **Continuous Improvement**
**Domain Model Refinement:**
Regularly review domain model accuracy with business stakeholders and refine based on new insights.

**Integration Pattern Evolution:**
Evolve integration patterns based on operational experience and changing business requirements.

---

**Document Metadata**
- **Domain Name**: [Bounded Context Name]
- **Generated From Template**: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
- **Template Version**: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
- **Filename Pattern**: `[domain_name].domain.md`
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
| 1.0 | [Date] | Initial domain specification | [ICP Handle] |

---

**AI Implementation Guidance**
When implementing this domain:
1. **Follow build sequence** - Implement features in dependency order, not business value order
2. **Establish dependencies first** - Ensure all technical prerequisites are available before starting feature implementation
3. **Validate integration contracts** - Test integration points as soon as dependencies are available
4. **Implement incrementally** - Complete each build phase fully before moving to the next phase
5. **Maintain domain boundaries** - Ensure implementation preserves the specified domain boundaries and responsibilities

**Human Review Focus Areas**
- **Business accuracy**: Does the domain model correctly represent business concepts and rules?
- **Boundary clarity**: Are domain boundaries clear and appropriate?
- **Integration design**: Do integration patterns support business workflows effectively?
- **Evolution planning**: Is the domain designed to accommodate likely business changes?
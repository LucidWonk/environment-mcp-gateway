# Implementation ICP Template: [Feature/Component Name - Brief Description]

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL ICP)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.implementation.icp.md
TEMPLATE_VERSION: 5.0.0
TEMPLATE_DESCRIPTION: Major v5.0 upgrade for Sonnet 4.5 optimization (ADDITIVE to v4.0): State persistence blocks for context rollover resilience, 3x3 execution structure (Preparation/Execution/Finalization), bunker-style stop gates with visual barriers, self-validation framework with PASS/FAIL checkpoints, phase-specific tool restrictions, context rollover protocol, decentralized capability tracking. Maintains all v4.0 Virtual Expert Team features.
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
   
   VERSION 5.0.0 MAJOR ENHANCEMENTS:
   <!-- RATIONALE: Sonnet 4.5 has enhanced instruction-following; these features leverage that capability
        while addressing v4.0 pain points: 20% stop gate violations, unpredictable context rollovers,
        frequently skipped D/E/F subtasks, capability-registry.md maintenance overhead -->
   - State persistence blocks for context rollover resilience (100% recovery target)
   - 3x3 execution block structure: Preparation → Execution → Finalization (replaces linear A-I)
   - Bunker-style stop gates with visual barriers (0% violation target vs 20% in v4.0)
   - Self-validation framework with PASS/FAIL checkpoints (prevents skipped validation)
   - Phase-specific tool restrictions ALLOWED/PROHIBITED lists (prevents phase boundary violations)
   - Context rollover protocol Level 1 + Level 2 (systematic recovery procedure)
   - Eliminated centralized capability-registry.md (tracking moved to domain/digital req files)
   - Template instruction separation to TEMPLATE-MAINTENANCE.md (clearer maintenance guidance)
   - Three-tier instruction architecture self-contained templates (no external refs needed during execution)

   VERSION 4.0.0 MAJOR ENHANCEMENTS:
   - Virtual Expert Team integration with template orchestration
   - Expert coordination patterns for template execution guidance
   - Enhanced human approval gates with expert recommendation context
   - Template-expert integration with maintaining template authority
   - Expert selection, coordination, and validation workflows
   - Context synchronization between template execution and expert guidance

2. TIME REFERENCE REMOVAL:
   - NEVER include time estimates (minutes, hours, days) in any section
   - Use complexity indicators instead: "Simple task", "Complex implementation", "Multiple components"
   - Use dependency counts: "3 files to modify", "5 test cases required", "2 integrations needed"
   - Use completion metrics: "Until all tests pass", "Until build succeeds", "Until validation complete"

3. PRIORITY AND ORDERING:
   - Base ALL priorities on technical build dependencies, NOT business value
   - Sequence steps by: "Must complete X before Y can begin"
   - Use dependency-driven language: "Requires foundation components", "Depends on Step X.Y completion"
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

**FOR AI UPDATING TEMPLATES**: See template-maintenance.md in Templates/ folder for:
- Template versioning guidelines
- Template modification procedures
- Quality assurance requirements
- When to increment version numbers
═══════════════════════════════════════════════════════════════════════════

TEMPLATE USAGE INSTRUCTIONS FOR AI (DO NOT INCLUDE IN FINAL ICP)
═══════════════════════════════════════════════════════════════════════════
<!-- RATIONALE: Template MAINTENANCE vs USAGE instructions separated to TEMPLATE-MAINTENANCE.md
     to reduce confusion - this section is purely for creating ICPs from the template -->

IMPORTANT: Implementation ICPs are typically generated as the final output of
Concept ICP execution (Phase 4) to ensure perfect alignment with refined requirements.

If creating this ICP independently:
1. Validate that it aligns with the most current concept specifications
2. Ensure all requirement documents referenced are up-to-date
3. Consider whether a Concept ICP should be executed first

When creating an ICP from this template:
1. Remove all sections marked with <!-- TEMPLATE INSTRUCTION -->
2. Replace all [bracketed placeholders] with actual content
3. Fill in state persistence block at top with initial values (enables context rollover recovery)
4. Ensure each Phase has 3-5 Steps maximum for manageable execution
5. Each Step must follow 3x3 execution block structure: Preparation → Execution → Finalization
6. Include ALLOWED/PROHIBITED tool lists for each phase (prevents phase boundary violations)
7. Use bunker-style stop gates with visual barriers between steps (0% violation target)
8. Include PASS/FAIL validation checkpoints in Finalization Block (prevents skipped validation)
9. Include specific file paths and code snippets where helpful
10. Reference actual requirement documents that exist in the codebase
11. Maintain the STRICT execution sequence for each step

<!-- RATIONALE: Three-Tier Architecture - templates are self-contained (Tier 1) so AI doesn't need
     to reference kickstarter (Tier 2) or system overview (Tier 3) during normal execution.
     External refs only needed for context rollover recovery or conceptual "why" questions. -->

IMPORTANT: Do NOT reference ANY timeframes or duration estimates.
Instead use: complexity levels, component counts, dependency chains, or completion criteria.

<!-- RATIONALE: capability-registry.md is REMOVED in v5.0. "Never works properly" - creator observation.
     Central registry gets out of sync with req files. Decentralized tracking in domain.req.md and
     digital.req.md files eliminates maintenance overhead while maintaining traceability. -->

CAPABILITY TRACKING (v5.0 - DECENTRALIZED):
Capability tracking is now maintained in requirement documents, NOT in a central registry.

DURING ICP CREATION:
1. Look up capability IDs from domain.req.md and digital.req.md files (PRIMARY source)
2. Reference these IDs when describing what this ICP implements
3. Validate all required capabilities are documented in their respective req files

DURING ICP EXECUTION:
1. Update status in domain.req.md: "Not Implemented" → "In Development" at start
2. Update status in digital.req.md: "Not Implemented" → "In Development" at start
3. Add this ICP's reference to the capability tracking section in req files
4. At completion: Update status to "Implemented" in domain.req.md and digital.req.md
5. Add completion date to capability entries in req files

🛑 MANDATORY STOP PROTOCOL 🛑
CRITICAL SYSTEM REQUIREMENT: The ICP must enforce this execution pattern for EVERY step:
- Implement code first
- Write comprehensive tests
- Validate build and test pass
- Update documentation
- 🛑 FULL STOP for human review - DO NOT CONTINUE without explicit "continue" command

The AI executing this ICP MUST STOP after each step. Continuing without human approval will break the Context Engineering System and require manual rollback

TEMPLATE VERSIONING:
When creating ICPs from this template, ensure:
1. Use the TEMPLATE_FILE and TEMPLATE_VERSION defined above for metadata fields:
   - "Generated From Template" field: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
   - "Template Version" field: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
2. Fill in all metadata fields with actual values, not placeholders
═══════════════════════════════════════════════════════════════════════════
-->

<!-- ═══════════════════════════════════════════════════════════════════════════
STATE PERSISTENCE BLOCK
═══════════════════════════════════════════════════════════════════════════
RATIONALE: Context window rollovers cause unpredictable failures in long implementations (v4.0).
AI loses track of execution position. This live state tracker enables 100% recovery.
AI must update this block after EVERY action to maintain accurate state.
═══════════════════════════════════════════════════════════════════════════ -->

╔══════════════════════════════════════════════════════════════════════════════════╗
║                         📍 EXECUTION STATE TRACKER                               ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  CURRENT PHASE: [Not Started]                                                   ║
║  CURRENT STEP: [None]                                                           ║
║  CURRENT BLOCK: [None - Preparation / Execution / Finalization]                 ║
║                                                                                  ║
║  LAST ACTION COMPLETED:                                                          ║
║  • [None - ICP execution not yet started]                                       ║
║                                                                                  ║
║  NEXT ACTION:                                                                    ║
║  • Read this entire ICP document                                                ║
║  • Verify prerequisites are met                                                 ║
║  • Begin Phase 1, Step 1.1, Preparation Block                                   ║
║                                                                                  ║
║  FILES MODIFIED THIS SESSION: 0                                                  ║
║  • [None yet]                                                                    ║
║                                                                                  ║
║  VALIDATION STATUS:                                                              ║
║  • Last checkpoint: [None - not yet started]                                    ║
║  • Last self-validation: [None]                                                 ║
║                                                                                  ║
║  BUILD STATUS: ⚠️ Not yet validated                                              ║
║  TEST STATUS: ⚠️ Not yet validated                                               ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

<!-- ═══════════════════════════════════════════════════════════════════════════
CONTEXT ROLLOVER RECOVERY PROTOCOL
═══════════════════════════════════════════════════════════════════════════
RATIONALE: Two-level protocol balances safety and efficiency. Level 1 (state block) is fast
and handles 95% of rollovers. Level 2 (re-grounding docs) for uncertain cases. Provides
systematic recovery vs unpredictable failures in v4.0.
═══════════════════════════════════════════════════════════════════════════ -->

**🔄 CONTEXT ROLLOVER PROTOCOL**:
If you're resuming after context window refresh, follow this protocol:

**LEVEL 1 (ALWAYS EXECUTE)**:
1. Read the state tracker block above (current phase/step/block)
2. Verify understanding of your current position in execution
3. Confirm last action completed and next action to take
4. Assess your confidence: HIGH / MEDIUM / LOW

**LEVEL 2 (EXECUTE IF CONFIDENCE < HIGH)**:
1. If uncertain about workflow, read: `/Documentation/ContextEngineering/Kickstarters/context-engineering-kickstarter.md` (Tier 2 - workflow guidance)
2. If uncertain about "why", read: `/Documentation/ContextEngineering/context-engineering-system.md` (Tier 3 - conceptual context)
3. Return to this template for execution instructions (Tier 1 - execution authority)

<!-- RATIONALE: Three-Tier Architecture makes this template self-contained. AI shouldn't need
     external docs during normal execution - only for rollover recovery or conceptual questions. -->

---

## **ICP OVERVIEW**
[2-3 paragraphs describing what will be implemented, why it's needed, and the approach being taken. Focus on the technical implementation and expected outcomes.]

### **🛑 IMPLEMENTATION ICP PREREQUISITES 🛑**
**MANDATORY PREREQUISITE**: Approved codification ICP with human review complete
- **Codification ICP**: [Reference to completed codification.icp.md file]
- **Human Approval**: Explicit human authorization to proceed with implementation
- **Expert Specifications**: Technical specifications from virtual expert team coordination
- **Architecture Approval**: Human-approved technical approach and design decisions

**🛑 CRITICAL**: This implementation ICP may ONLY proceed after:**
1. Codification ICP completed with expert specifications
2. Human review and approval of all expert recommendations
3. Explicit human authorization: "proceed with implementation"
4. Technical approach and architecture decisions approved by human

**ICP Type**: [x] Implementation (Code & Tests Only) | ❌ NO SPECIFICATION CHANGES ALLOWED ❌
**CRITICAL**: This is an IMPLEMENTATION ICP - CODE EXECUTION ONLY based on approved specifications
**Implementation Scope**: [ ] New Feature | [ ] Enhancement | [ ] Refactoring | [ ] Infrastructure
**Complexity**: [ ] Simple (1-3 components) | [ ] Moderate (4-10 components) | [ ] Complex (10+ components)
**Risk Level**: [ ] Low | [ ] Medium | [ ] High
**Template Version**: 5.0.0 (Sonnet 4.5 optimized)
**Expert Coordination**: [x] Enabled (v4.0.0) | [ ] Disabled
**Expert Coordination Level**: [ ] Minimal | [x] Standard | [ ] Comprehensive

<!-- ═══════════════════════════════════════════════════════════════════════════
v5.0 FEATURES IN THIS TEMPLATE (Sonnet 4.5 Optimized)
═══════════════════════════════════════════════════════════════════════════
RATIONALE: Each feature addresses specific v4.0 pain point observed in production use.

✅ State Persistence Block → Fixes unpredictable context rollover failures
✅ 3x3 Execution Blocks → Prevents frequently skipped D/E/F subtasks (testing/validation)
✅ Bunker-Style Stop Gates → Reduces ~20% violation rate to 0% target
✅ Self-Validation Framework → Forces validation before proceeding (no more "I'll fix later")
✅ Tool Restrictions per Phase → Prevents code during codification, spec changes during implementation
✅ Rollover Protocol → Systematic recovery procedure (Level 1 + Level 2)
✅ Decentralized Tracking → Eliminates capability-registry.md maintenance overhead
✅ Instruction Separation → TEMPLATE-MAINTENANCE.md for clearer maintenance guidance
✅ Three-Tier Architecture → Self-contained templates (no external refs during execution)

All v4.0 Virtual Expert Team features are maintained (backward compatible).
═══════════════════════════════════════════════════════════════════════════ -->

## **VIRTUAL EXPERT TEAM COORDINATION (v4.0.0)**
<!-- NEW IN v4.0.0: Expert coordination integration with template execution -->

### **Expert Coordination Configuration**
**Expert Selection Criteria**:
- [ ] **Architecture Expert**: Required for complex integrations, cross-domain work, system design
- [ ] **Cybersecurity Expert**: Required for security-sensitive implementations, data handling
- [ ] **Performance Expert**: Required for performance-critical components, optimization
- [ ] **Financial Quant Expert**: Required for trading algorithm implementations, risk calculations
- [ ] **DevOps Expert**: Required for deployment, infrastructure, CI/CD changes
- [ ] **Process Engineer**: Required for workflow optimization, quality assurance
- [ ] **QA Expert**: Required for comprehensive testing strategies, quality validation
- [x] **Context Engineering Compliance Agent**: MANDATORY for all implementations

**Expert Coordination Patterns**:
- [x] **Template Authority Maintained**: Template execution has final authority
- [x] **Expert Guidance Integration**: Expert recommendations integrated into execution
- [ ] **Expert-Led Execution**: Experts drive execution decisions
- [x] **Consensus-Driven Validation**: Expert consensus required for major decisions
- [x] **Hierarchical Escalation**: Conflicts escalated through expert hierarchy

**Human Approval Gates Enhanced**:
- [x] **Expert Context in Approvals**: Rich expert recommendations provided to human approvers
- [x] **Risk Assessment Integration**: Expert risk analysis included in approval context
- [x] **Consensus Visualization**: Expert agreement levels displayed to approvers
- [x] **Alternative Approach Presentation**: Expert-suggested alternatives provided
- [x] **Compliance Validation Context**: Expert compliance assessments included

### **Expert Coordination Workflow**
**Phase-Level Expert Integration**:
1. **Pre-Phase Expert Selection**: Automated expert selection based on phase characteristics
2. **Expert Coordination Initiation**: Multi-agent conversation setup with relevant experts
3. **Context Synchronization**: Template context shared with expert team
4. **Expert Guidance Generation**: Experts provide recommendations and validation
5. **Human Approval with Expert Context**: Enhanced approval gates with expert insights
6. **Template Execution with Expert Guidance**: Template authority maintained with expert input
7. **Post-Phase Expert Validation**: Expert review of implementation results
8. **Context Integration**: Expert insights integrated into ongoing template context

**Expert Performance Targets (v4.0.0)**:
- Expert Selection Time: < 30 seconds
- Expert Response Time: < 2 minutes
- Coordination Overhead: < 10% of total execution time
- Context Integrity: > 95%
- Expert Consensus Achievement: > 80%
- Human Approval Enhancement: Rich context provided in < 15 seconds

### **Expert Coordination Quality Gates**
**Mandatory Quality Checkpoints**:
- [ ] **Expert Selection Accuracy**: ≥ 95% appropriate expert selection for workflow type
- [ ] **Context Transfer Integrity**: ≥ 95% context integrity maintained during expert coordination
- [ ] **Expert Consensus Achievement**: ≥ 80% consensus level for major decisions
- [ ] **Template Authority Preservation**: Template execution authority maintained throughout
- [ ] **Human Approval Enhancement**: Expert context successfully integrated into approval workflows
- [ ] **Performance Target Achievement**: All expert coordination performance targets met

**Expert Coordination Fallback Strategies**:
- **Expert Unavailable**: Continue with template-only execution, log expert unavailability
- **Expert Conflict Unresolved**: Escalate to human decision with full context
- **Coordination Timeout**: Proceed with template execution, cache expert input for future
- **Context Sync Failure**: Continue with last known good context, alert for manual sync
- **Performance Target Miss**: Continue execution, optimize coordination for next phase

## **RELATED DOCUMENTATION**
<!-- List all requirement documents this ICP implements -->

<!-- ═══════════════════════════════════════════════════════════════════════════
THREE-TIER INSTRUCTION ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════
RATIONALE: v4.0 had competing instructions across 9 documents causing AI confusion.
Clear hierarchy eliminates conflicts:

TIER 1 (Execution Authority - THIS TEMPLATE):
  - Imperative "how to execute" instructions
  - Self-contained, no external refs needed during normal execution
  - Highest authority for execution decisions

TIER 2 (Workflow Guidance - Kickstarter):
  - "When and which" workflow patterns and decision trees
  - Referenced only during context rollover if confidence < HIGH

TIER 3 (Conceptual Context - System Overview):
  - "Why" philosophy and principles
  - Referenced only for conceptual questions if confidence < HIGH

REQUIREMENTS DOCS (Business Rules - domain.req.md / digital.req.md):
  - Always consulted in Preparation Block of each step
  - Provide business rules, constraints, integration patterns
═══════════════════════════════════════════════════════════════════════════ -->

**Requirements Being Implemented:**
- Domain Specification: [Domain-Name.domain.md](../Architecture/Domain-Name.domain.md)
- Digital Capability: [Capability-Name.digital.md](../Architecture/Capability-Name.digital.md)
- **Testing Standards: [testing-standards.domain.req.md](../Architecture/testing-standards.domain.req.md)**
- Development Guidelines: [Development-Guidelines.md](../Overview/Development-Guidelines.md)
- Claude Integration: [CLAUDE.md](../../CLAUDE.md)

**CRITICAL IMPLEMENTATION NOTE:**
The *.domain.md and *.digital.md files contain the detailed business requirements, nuances, and capabilities that MUST be referenced during implementation (in Preparation Block). The testing-standards.domain.req.md file contains MANDATORY testing framework selection criteria, coverage requirements, and quality gates. These documents specify:
- Business rules and constraints
- Integration patterns and contracts
- Feature behaviors and edge cases
- Domain-specific terminology and concepts
- Quality attributes and performance requirements
- **Testing framework selection criteria (BDD vs XUnit)**
- **Minimum coverage requirements (100% BDD scenarios OR >85% XUnit coverage)**
- **Mandatory Serilog logging integration for all test failures**

The AI MUST consult these documents before and during each implementation step (specifically in the Preparation Block of each step). The testing standards are EQUALLY important as business requirements - testing is a core deliverable, not an afterthought.

**Documents to Update After Implementation:**
- [ ] Update domain.md with implementation status
- [ ] Update digital.md with completed features
- [ ] Update CLAUDE.md if new commands/projects added
- [ ] Update this ICP with completion status

## **IMPLEMENTATION DESIGN**

### **Technical Architecture**
[Describe the technical approach, patterns, and architecture decisions]

### **Component Integration**
[Explain how new components integrate with existing system]

### **Testing Strategy**
**CRITICAL**: Testing is NOT optional - it's a core deliverable equal to code implementation.

**Framework Selection (MANDATORY):**
Consult `/Documentation/Architecture/testing-standards.domain.req.md` for complete dual framework strategy.

- [ ] **BDD Testing (Reqnroll)**: Required for business logic, trading algorithms, domain workflows
  - **Location**: `TestSuite/` project with `.feature` files
  - **Use for**: Business rule validation, stakeholder communication, trading scenarios
  - **Coverage**: 100% of business scenarios must have BDD coverage
  - **When to use**: Component implements business logic, trading rules, or requires stakeholder-readable documentation

- [ ] **XUnit Testing**: Required for infrastructure, API clients, integration scenarios
  - **Location**: `[ComponentName].Tests/` projects with `*Tests.cs` files
  - **Use for**: Technical validation, performance benchmarks, infrastructure components
  - **Coverage**: >85% code coverage target (enforced by quality gates)
  - **When to use**: Component is infrastructure, API client, data access, or technical utility
  - **SPECIAL CASE - TypeScript/Node.js Infrastructure**:
    - TypeScript infrastructure (e.g., MCP servers, Node.js services) is tested via **C# XUnit integration tests**
    - Tests simulate external contract (e.g., MCP tool invocations) and validate responses
    - NO TypeScript unit tests required - integration tests provide sufficient coverage
    - Example: `EnvironmentMCPGateway.Tests/Integration/*V51IntegrationTests.cs`
    - Rationale: Maintains single testing framework (XUnit), tests actual usage contract

**PROHIBITED Testing Frameworks:**
- ❌ Jest (JavaScript/TypeScript unit testing)
- ❌ NUnit (C# alternative to XUnit)
- ❌ MSTest (C# alternative to XUnit)
- ❌ Mocha/Chai (JavaScript alternatives)
- ❌ xunit.ts (TypeScript XUnit port - unnecessary, use C# XUnit integration tests instead)
- **Why prohibited**: Platform standardizes on BDD (Reqnroll) + XUnit (C#) to prevent framework proliferation

**Test-First Mindset:**
- Tests are written IN PARALLEL with code (Subtask E), not after
- Test failures are build failures - equally blocking
- Coverage targets are quality gates - not suggestions
- Serilog logging integration is MANDATORY for all test failures (via Utility.Output.LoggerConfig)

**Quality Gates (Enforced):**
- BDD Testing: 100% scenario coverage for all business rules
- XUnit Testing: Minimum 85% code coverage (configurable threshold)
- All tests must pass - zero tolerance for failures
- All test failures must use Serilog logging - no Console.WriteLine or alternatives

**Reference**: `/Documentation/Architecture/testing-standards.domain.req.md` for complete dual framework strategy and standards.

### **Rollback Strategy**
[Describe how to safely rollback if issues occur]

## **NEWCONCEPTS HANDLING** 
<!-- If this ICP implements a NewConcept, include this section -->

### **Source Concept Information**
**Original NewConcept Document**: [Path to NewConcepts requirement document, e.g., `/Documentation/ContextEngineering/NewConcepts/concept-name.domain.md`]
**Placeholder Capability IDs**: [List all TEMP-[DOMAIN]-[NAME]-#### IDs referenced]
**Domain Certainty at Start**: [ ] Single Domain Expected | [x] Multi-Domain Expected | [ ] Unknown

### **Domain Discovery Process**
**CRITICAL**: As you implement, analyze which actual domains this concept affects:

**During Implementation - Document Your Discoveries:**
- [ ] **Analysis Domain**: [Features/components that belong here and why]
- [ ] **Data Domain**: [Features/components that belong here and why] 
- [ ] **Messaging Domain**: [Features/components that belong here and why]
- [ ] **UI Domain**: [Features/components that belong here and why]
- [ ] **Infrastructure Domain**: [Features/components that belong here and why]
- [ ] **Other Domain**: [Specify domain and reasoning]

**Integration Points Discovered:**
- [Domain A] ↔ [Domain B]: [Integration pattern and reason]
- [Domain B] ↔ [Domain C]: [Integration pattern and reason]

### **Document Restructuring Proposal**
**MANDATORY HUMAN APPROVAL GATE**

At implementation completion, generate this proposal for human approval:

```markdown
## NewConcept Implementation Completion - Approval Required

### Original Concept
- **Source**: /Documentation/ContextEngineering/NewConcepts/[concept-name].domain.md
- **Implementation ICP**: [This ICP name]
- **Timestamp for Archive**: [YYYYMMDD-HHMM format]

### Discovered Domain Distribution
Based on implementation, this concept actually spans:

#### Domain 1: [Domain Name]
- **Features Implemented**: [List features that belong to this domain]
- **Proposed Document**: /Documentation/[Domain]/[new-document-name].domain.md
- **Proposed Capability ID**: [DOMAIN]-[NAME]-[4chars]
- **Registry Action**: [ ] Create New [ ] Update Existing
- **Integration Points**: [APIs/Events exposed to other domains]

#### Domain 2: [Domain Name] 
- **Features Implemented**: [List features that belong to this domain]
- **Proposed Document**: /Documentation/[Domain]/[new-document-name].domain.md
- **Proposed Capability ID**: [DOMAIN]-[NAME]-[4chars]
- **Registry Action**: [ ] Create New [ ] Update Existing
- **Integration Points**: [APIs/Events exposed to other domains]

### Archive Plan
- **Move Original To**: /Documentation/ContextEngineering/NewConcepts/Implemented/[YYYYMMDD-HHMM]-[concept-name].domain.md
- **Add Forward References**: Links to all resulting mature domain documents
- **Implementation Summary**: Brief description of what was actually built vs originally conceived

### Registry Updates Required
- **Remove Placeholder IDs**: [List TEMP-* IDs to remove/ignore]
- **Add Final Capability IDs**: [List final IDs to register]
- **Update Status**: Set all new capabilities to "Implemented" with completion date

**Approve this restructuring? [Require human Y/N response]**
```

### **Post-Approval Execution**
**ONLY execute after human approval:**

1. **Create Mature Domain Documents**: Use standard domain-template.domain.md for each resulting document
2. **Update Capability Registry**: Add final capability IDs and set status to "Implemented"
3. **Archive Original Document**: Move to Implemented/ folder with timestamp and forward references
4. **Update Cross-References**: Update any documents that referenced the original NewConcept

## **CAPABILITY TRACKING (v5.0 - DECENTRALIZED)**
<!-- CRITICAL: These instructions MUST remain in generated ICPs for execution -->

<!-- RATIONALE: v5.0 removes capability-registry.md (central registry "never works properly").
     Tracking is now DECENTRALIZED to domain.req.md and digital.req.md files where capabilities
     are defined. This eliminates sync overhead while maintaining full traceability. -->

**Tracking Update Requirements:**
Capability status tracking differs based on ICP source type:

### **For Standard ICPs (Mature Domain Requirements):**
**At Implementation Start (Preparation Block - Subtask C):**
1. Open `[Domain].domain.req.md` for this component's domain
2. Locate capability/feature section for this component
3. Update status from "Not Implemented" to "In Development"
4. Add this ICP's handle and step number as reference
5. Add start date to notes/comments

**At Implementation Completion (Finalization Block - Subtask H):**
1. Update status from "In Development" to "Implemented"
2. Add completion date
3. Update notes with final test coverage and key implementation details
4. If applicable: Update `[Capability].digital.req.md` with same completion info

### **For NewConcepts ICPs (Exploratory Requirements):**
**At Implementation Start:**
1. **DO NOT** update req files yet (placeholder concepts may not have final domain assignment)
2. Note all placeholder capability IDs referenced (format: TEMP-[DOMAIN]-[NAME]-####)
3. Document domain discovery during implementation

**During Implementation - Domain Discovery:**
1. Analyze actual domain boundaries as implementation progresses
2. Identify which placeholder concepts map to which actual domains
3. Prepare final capability and domain assignments for human approval

**At Implementation Completion - Human Approval Required:**
1. **STOP** - Generate domain restructuring proposal:
   - Original NewConcept document path
   - Proposed mature domain.req.md and digital.req.md locations
   - Placeholder → Final capability assignments
   - Requirement document sections to create/update
2. **WAIT** for human approval of restructuring proposal
3. **ONLY AFTER APPROVAL** - Execute req file updates and document migrations

**Tracking Interaction Pattern:**
- **Standard ICPs**: UPDATE status in existing domain.req.md and digital.req.md files
- **NewConcepts ICPs**: CREATE capability entries in req files after human approval
- **VALIDATE** all dependencies exist before starting
- **NO CENTRAL REGISTRY** - All tracking is in requirement documents

## **AI EXECUTION REQUIREMENTS**
<!-- CRITICAL SECTION - These instructions MUST be followed by AI -->

<!-- ═══════════════════════════════════════════════════════════════════════════
3x3 EXECUTION BLOCK STRUCTURE
═══════════════════════════════════════════════════════════════════════════
RATIONALE: v4.0 used linear A-I subtasks. Subtasks D, E, F (testing/validation) were frequently
skipped. 3x3 blocks force completion of all tasks within each block before proceeding. Clear
boundaries: Preparation (understand), Execution (build), Finalization (validate/document).
═══════════════════════════════════════════════════════════════════════════ -->

### **MANDATORY 3x3 Execution Structure for EVERY Step**
The AI executing this ICP MUST follow this structure for each step:

#### **🔷 PREPARATION BLOCK**
**PURPOSE**: Understand requirements, validate dependencies, coordinate with experts
**COMPLETION CRITERIA**: ALL preparation tasks complete before proceeding to Execution Block

1. **SUBTASK A: REVIEW REQUIREMENTS** (Complete analysis phase)
   ```bash
   # ACTION: Open and read the referenced documents
   ```
   - [ ] Read relevant sections of *.domain.md files
   - [ ] Read relevant sections of *.digital.md files
   - [ ] Extract business rules that apply to this step
   - [ ] Note integration requirements for this component
   - [ ] Document any unclear requirements to ask human
   **PROGRESS UPDATE**: "Completed requirements review for Step X.Y"

2. **SUBTASK B: EXPERT COORDINATION INITIATION** (v4.0.0 - Expert team setup)
   ```bash
   # ACTION: Initiate Virtual Expert Team coordination for this step
   ```
   - [ ] Analyze step complexity and domain characteristics for expert selection
   - [ ] Invoke expert-select-workflow MCP tool with step context
   - [ ] Initiate agent-coordinate-handoff for selected experts
   - [ ] Establish multi-agent conversation for step coordination
   - [ ] Sync template context with expert team using context-sync workflows
   - [ ] Validate expert selection accuracy (target: ≥95%)
   **PROGRESS UPDATE**: "Expert coordination initiated with [X] experts for Step X.Y"

3. **SUBTASK C: UPDATE TRACKING STATUS** (First step only - Update requirement docs)
   ```bash
   # ACTION: Edit domain.req.md and digital.req.md files
   ```
   <!-- RATIONALE: Decentralized tracking - capability-registry.md removed in v5.0 -->
   - [ ] Open domain.req.md file for this domain
   - [ ] Find capability/feature entries for this ICP
   - [ ] Change status from "Not Implemented" to "In Development"
   - [ ] Open digital.req.md file (if applicable)
   - [ ] Update capability status to "In Development"
   - [ ] Add this ICP's reference to tracking sections
   - [ ] Add start date to tracking entries
   **PROGRESS UPDATE**: "Updated tracking status in requirement documents"

**✅ PREPARATION CHECKPOINT**:
Before proceeding to Execution Block, verify:
- [ ] All requirements from domain.md and digital.req.md reviewed and understood
- [ ] Expert coordination initiated and team assembled (if enabled)
- [ ] Tracking status updated in requirement documents
- [ ] Implementation approach clear and validated
- [ ] All dependencies confirmed available

**PROCEED TO EXECUTION BLOCK** →

---

#### **🔷 EXECUTION BLOCK**
**PURPOSE**: Implement code, write tests, validate builds
**COMPLETION CRITERIA**: ALL execution tasks complete AND all validations pass

<!-- RATIONALE: This block contains the core implementation work. Forcing completion of ALL tasks
     including testing and validation before proceeding prevents "I'll test later" pattern that
     causes D/E/F subtask skipping in v4.0. -->

4. **SUBTASK D: EXPERT-GUIDED IMPLEMENTATION** (Implementation phase with expert guidance)
   ```bash
   # ACTION: Create/modify files with expert guidance
   ```
   - [ ] Gather expert recommendations from coordinated expert team
   - [ ] Create new files if needed (check paths first with expert input)
   - [ ] Implement business rules from domain.md (with expert validation)
   - [ ] Implement capabilities from digital.req.md (incorporating expert insights)
   - [ ] Follow existing code patterns in the project (expert-verified approach)
   - [ ] Add appropriate error handling (expert-recommended patterns)
   - [ ] Validate implementation against expert recommendations
   - [ ] Achieve expert consensus on implementation approach (≥80%)
   **PROGRESS UPDATE**: "Implemented [component name] with expert guidance - [X] lines of code"

5. **SUBTASK E: EXPERT-VALIDATED TESTING** (Test creation with expert validation)
   ```bash
   # ACTION: Create test files in appropriate test project
   # CRITICAL: Determine BDD vs XUnit framework FIRST based on testing-standards.domain.req.md
   ```

   **STEP 1: Framework Selection (MANDATORY)**
   - [ ] Review component type: Business logic → BDD | Infrastructure → XUnit
   - [ ] Consult testing-standards.domain.req.md Section "Dual Framework Strategy"
   - [ ] Determine test location: TestSuite/ (BDD) or [Component].Tests/ (XUnit)
   - [ ] Validate framework selection with expert team (if enabled)

   **STEP 2A: BDD Testing (if business logic component)**
   - [ ] Create .feature file with stakeholder-readable scenarios in TestSuite/[Domain]/
   - [ ] Write scenarios covering all business rules from domain.req.md
   - [ ] Implement step definitions in TestSuite/StepDefinitions/[Domain]/
   - [ ] Use realistic trading data in scenario examples
   - [ ] Add Serilog logging in all step definitions via LoggerConfig (MANDATORY)
   - [ ] Use FluentAssertions for all validations with descriptive messages
   - [ ] Ensure 100% business scenario coverage
   - [ ] Validate scenarios are readable by non-technical stakeholders

   **STEP 2B: XUnit Testing (if infrastructure component)**
   - [ ] Create test class in [ComponentName].Tests/ with [Trait] categorization
   - [ ] Initialize Serilog via LoggerConfig in constructor (MANDATORY)
   - [ ] Write happy path tests with FluentAssertions and descriptive messages
   - [ ] Write error handling tests (MANDATORY - testing-standards.domain.req.md Section 5)
   - [ ] Write edge case tests with [Theory] and [InlineData] for boundary conditions
   - [ ] Add structured Serilog logging for all test execution and failures (MANDATORY)
   - [ ] Implement IDisposable for proper test cleanup
   - [ ] Achieve >85% code coverage (quality gate requirement - will be validated)
   - [ ] Use mock data factories for consistent test data generation

   **STEP 3: Expert Validation of Test Quality**
   - [ ] Consult expert team for testing strategy recommendations
   - [ ] Present test coverage analysis to expert team
   - [ ] Validate test completeness covers all business rules or technical scenarios
   - [ ] Verify assertion patterns follow FluentAssertions best practices
   - [ ] Confirm Serilog logging integration for all failure scenarios
   - [ ] Validate framework selection aligns with component domain
   - [ ] Achieve ≥90% expert approval of test quality

   **PROGRESS UPDATE**: "Created [X] [BDD scenarios | XUnit tests] for [component] with [Y]% coverage using [framework]"

6. **SUBTASK F: EXPERT CONSENSUS VALIDATION** (Expert approval of implementation)
   ```bash
   # ACTION: Validate implementation with expert team
   ```
   - [ ] Present implementation to expert team for final validation
   - [ ] Address any expert concerns or recommendations
   - [ ] Achieve expert consensus on implementation quality (≥80%)
   - [ ] Document expert validation results and any remaining recommendations
   - [ ] Update expert coordination metrics (response time, consensus level)
   **PROGRESS UPDATE**: "Expert consensus achieved for Step X.Y implementation"

7. **SUBTASK G: COMPREHENSIVE SOLUTION VALIDATION** (Full solution build and test validation)
   ```bash
   # MANDATORY COMMANDS - Run these EXACTLY:
   echo "Starting validation for Step X.Y"
   
   # a) Build ENTIRE SOLUTION (MANDATORY - ALL PROJECTS MUST BUILD)
   echo "Building entire solution..."
   dotnet build Lucidwonks.sln
   if [ $? -ne 0 ]; then
       echo "❌ BUILD FAILED - MUST FIX BEFORE CONTINUING"
       echo "ACTION REQUIRED: Fix build errors and re-run validation"
       # STOP HERE AND FIX THE BUILD ERRORS
       exit 1
   fi
   echo "✅ Solution build successful"
   
   # b) Run ALL TESTS (MANDATORY - ALL TESTS MUST PASS)
   echo "Running all tests..."
   dotnet test Lucidwonks.sln --filter "Category!=LongRunning"
   if [ $? -ne 0 ]; then
       echo "❌ TESTS FAILED - MUST FIX BEFORE CONTINUING"
       echo "ACTION REQUIRED: Fix failing tests and re-run validation"
       # STOP HERE AND FIX THE TEST FAILURES
       exit 1
   fi
   echo "✅ All tests passing"
   
   # c) Check for warnings (SHOULD NOT INTRODUCE NEW WARNINGS)
   echo "Checking for build warnings..."
   dotnet build Lucidwonks.sln --warnaserror
   if [ $? -ne 0 ]; then
       echo "⚠️ BUILD WARNINGS FOUND - SHOULD FIX"
       echo "ACTION: Review and fix warnings if possible"
   fi
   
   # d) Run specific component tests for detailed results
   echo "Running detailed component tests..."
   dotnet test --filter "FullyQualifiedName~[ComponentName]" --logger "console;verbosity=detailed"
   ```
   - [ ] ✅ ENTIRE SOLUTION BUILDS (dotnet build Lucidwonks.sln)
   - [ ] ✅ ALL TESTS PASS (dotnet test Lucidwonks.sln)
   - [ ] ✅ Component tests pass with details
   - [ ] ⚠️ No new warnings (preferred)
   - [ ] 🔧 All build/test failures FIXED before proceeding
   **PROGRESS UPDATE**: "Validation complete: Solution Build ✅, All Tests ✅ ([X]/[Y] passing)"
   
   **IF BUILD OR TESTS FAIL - MANDATORY FIX PROTOCOL:**
   1. **STOP** - Do not proceed to next subtask
   2. **ANALYZE** - Read error messages carefully
   3. **FIX** - Modify code to resolve issues
   4. **RE-VALIDATE** - Run validation again
   5. **REPEAT** until all builds and tests pass

**✅ EXECUTION CHECKPOINT**:
Before proceeding to Finalization Block, verify:
- [ ] Code implemented per specifications from domain.md and digital.req.md
- [ ] Expert consensus achieved on implementation approach (if enabled)
- [ ] **Testing framework correctly selected (BDD for business logic, XUnit for infrastructure)**
- [ ] **Tests follow testing-standards.domain.req.md requirements and patterns**
- [ ] **BDD: 100% scenario coverage OR XUnit: >85% code coverage achieved**
- [ ] **Serilog logging integrated in ALL test failures (via LoggerConfig - MANDATORY)**
- [ ] All tests written and passing (>80% coverage target)
- [ ] ENTIRE solution builds successfully (no errors)
- [ ] ALL tests pass (no failures)
- [ ] Build and test output clean (no unexpected errors)
- [ ] **Test quality validated by expert team (if enabled)**

**PROCEED TO FINALIZATION BLOCK** →

---

#### **🔷 FINALIZATION BLOCK**
**PURPOSE**: Update documentation, validate completion, prepare for human review
**COMPLETION CRITERIA**: ALL finalization tasks complete AND self-validation PASS

<!-- RATIONALE: This block ensures nothing is forgotten before stop gate. State tracker update
     (NEW in v5.0) enables context rollover recovery. Self-validation (NEW in v5.0) forces
     explicit PASS/FAIL check before proceeding - prevents "I'll fix it later" pattern. -->

8. **SUBTASK H: UPDATE DOCUMENTATION** (Documentation update phase)
   ```bash
   # ACTION: Update relevant documentation files
   ```
   - [ ] Update CLAUDE.md if new commands added
   - [ ] Update this ICP step status to "In Progress"
   - [ ] Update feature status in domain.md to "In Development"
   - [ ] Update feature status in digital.md if applicable
   - [ ] Add any new configuration to relevant docs
   - [ ] Document expert coordination outcomes and metrics
   **PROGRESS UPDATE**: "Updated documentation in [X] files with expert coordination results"

9. **SUBTASK I: VERIFY LOGS** (Log verification phase)
   ```bash
   # ACTION: Check application logs
   ls -la /Utility/Output/LoggerConfig/
   # If log files exist, check for errors:
   # tail -n 100 [latest-log-file] | grep -i error
   ```
   - [ ] No new errors in application logs
   - [ ] No unexpected warnings in test output
   - [ ] Console output clean during test runs
   **PROGRESS UPDATE**: "Log verification complete - no issues found"

10. **SUBTASK J: EXPERT COORDINATION COMPLETION** (v4.0.0 - Expert coordination finalization)
   ```bash
   # ACTION: Complete expert coordination for this step
   ```
   - [ ] Generate expert coordination summary and metrics
   - [ ] Document expert recommendations and consensus achieved
   - [ ] Update expert coordination performance metrics
   - [ ] Archive expert conversation context for future reference
   - [ ] Validate expert coordination targets met (selection accuracy ≥95%, consensus ≥80%)
   **PROGRESS UPDATE**: "Expert coordination completed with [X]% consensus and [Y] recommendations"

11. **SUBTASK K: UPDATE STATE TRACKER** (v5.0 - NEW)
   ```bash
   # ACTION: Update state persistence block at top of document
   ```
   <!-- RATIONALE: Enables context rollover recovery - critical for long implementations.
        After completing all work, update the live state tracker so context rollover can
        resume from exact position. 100% recovery target vs unpredictable failures in v4.0. -->
   - [ ] Scroll to top of document to state persistence block
   - [ ] Update CURRENT PHASE: [Phase X]
   - [ ] Update CURRENT STEP: [Step X.Y COMPLETE]
   - [ ] Update CURRENT BLOCK: Finalization
   - [ ] Update LAST ACTION COMPLETED: "Step X.Y finalization complete"
   - [ ] Update NEXT ACTION: "Await human approval, then proceed to Step X.Y+1"
   - [ ] Update FILES MODIFIED: [List all files created/modified this step]
   - [ ] Update VALIDATION STATUS: "All checks PASS"
   - [ ] Update BUILD STATUS: ✅ Validated
   - [ ] Update TEST STATUS: ✅ All passing
   **PROGRESS UPDATE**: "State tracker updated with current execution position"

12. **SUBTASK L: SELF-VALIDATION CHECKPOINT** (v5.0 - NEW)
   <!-- RATIONALE: Mandatory PASS/FAIL forces explicit validation before stop gate.
        Prevents "I'll fix it later" - must validate NOW. 0% skipped validation target.
        In v4.0, validation was often deferred. This checkpoint forces completion verification. -->

   Execute mandatory self-validation against acceptance criteria:

   **SELF-VALIDATION CHECKPOINT**

   | Criterion | Status | Evidence |
   |-----------|--------|----------|
   | Requirements from domain.req.md implemented | [ ] PASS / [ ] FAIL | [Specific sections] |
   | Capabilities from digital.req.md implemented | [ ] PASS / [ ] FAIL | [Specific capabilities] |
   | **Testing framework correctly selected** | [ ] PASS / [ ] FAIL | **BDD (business) OR XUnit (infrastructure)** |
   | **Testing standards compliance verified** | [ ] PASS / [ ] FAIL | **Consulted testing-standards.domain.req.md** |
   | Code follows project patterns | [ ] PASS / [ ] FAIL | [Pattern references] |
   | **Tests created using correct framework** | [ ] PASS / [ ] FAIL | **TestSuite/ (BDD) OR *.Tests/ (XUnit)** |
   | **BDD scenarios cover all business rules** | [ ] PASS / [ ] FAIL / [ ] N/A | **100% scenario coverage** |
   | **XUnit coverage >85%** | [ ] PASS / [ ] FAIL / [ ] N/A | **[Z]% achieved (quality gate)** |
   | **Serilog logging in all test failures** | [ ] PASS / [ ] FAIL | **LoggerConfig.ConfigureLogger used** |
   | Tests written and passing | [ ] PASS / [ ] FAIL | [X]/[Y] tests, [Z]% coverage |
   | Build succeeds | [ ] PASS / [ ] FAIL | Build output clean |
   | No new errors in logs | [ ] PASS / [ ] FAIL | Log verification clean |
   | Documentation updated | [ ] PASS / [ ] FAIL | [List updated docs] |
   | State tracker updated | [ ] PASS / [ ] FAIL | State block current |
   | Expert coordination complete (if enabled) | [ ] PASS / [ ] FAIL / [ ] N/A | [Consensus achieved] |

   **VALIDATION RESULT**: [ ] ALL PASS - Proceed to stop gate
                           [ ] ANY FAIL - Fix before stop gate

   **CRITICAL**: You CANNOT proceed to stop gate with ANY failure status.
   If any criterion shows FAIL, you MUST fix it before continuing.

   **PROGRESS UPDATE**: "Self-validation complete - all criteria PASS"

**✅ FINALIZATION CHECKPOINT**:
Before proceeding to stop gate, verify:
- [ ] Documentation updates complete (implementation notes, expert outcomes)
- [ ] Logs generated with diagnostic context
- [ ] Expert coordination completed and archived (if enabled)
- [ ] State tracker updated with current execution position
- [ ] Self-validation table shows ALL PASS (no FAIL entries)
- [ ] Todo list updated - current step marked "completed"

<!-- RATIONALE: This checkpoint ensures NOTHING is forgotten before human review.
     All finalization tasks MUST complete. Self-validation MUST show ALL PASS.
     Forces explicit verification vs implicit assumption. -->

### **Platform-Specific Validation**
<!-- Account for Windows IDE vs WSL differences -->
- **Windows/Visual Studio**: Ensure solution builds in IDE
- **WSL/Linux**: Ensure `dotnet build` succeeds
- **Cross-Platform**: Verify path separators and line endings

### **Step Completion Criteria**
Before marking ANY step complete, AI MUST verify:
- [ ] Requirements from domain.md and digital.md have been reviewed and understood
- [ ] Registry status updated appropriately (In Progress for first step, Implemented for final step)
- [ ] Code implemented correctly reflects business capabilities specified
- [ ] Code follows patterns in `/Documentation/Overview/`
- [ ] Tests written and passing (aim for >80% coverage)
- [ ] Build succeeds in both IDE and command line
- [ ] No new warnings or errors in logs
- [ ] Documentation updated where needed
- [ ] Feature statuses updated in requirement documents
- [ ] Implementation aligns with domain rules and digital capabilities
- [ ] Summary generated for human review

## **IMPLEMENTATION PHASES**

<!--
TEMPLATE INSTRUCTION:
- Each Phase should represent a major milestone
- Phases should have 3-5 Steps maximum
- Each Step should be one logical unit of work
- Steps must be ordered by technical dependencies
- Size steps by complexity, not time
-->

### **Phase 1: [Foundation/Infrastructure Setup]**
**Objective**: [What this phase accomplishes]
**Scope**: [Number of components/files to create or modify]
**Dependencies**: [What must exist before starting]

<!-- ═══════════════════════════════════════════════════════════════════════════
PHASE-SPECIFIC TOOL RESTRICTIONS
═══════════════════════════════════════════════════════════════════════════
RATIONALE: Prevents phase boundary violations (e.g., writing code during codification phase,
changing specs during implementation). Explicit ALLOWED/PROHIBITED lists eliminate ambiguity.
═══════════════════════════════════════════════════════════════════════════ -->

**🔧 ALLOWED TOOLS FOR THIS PHASE**:
- ✅ Read - Understanding existing code and requirements
- ✅ Grep - Searching for patterns and dependencies
- ✅ Glob - Finding files to modify
- ✅ Write - Creating new implementation files
- ✅ Edit - Modifying existing files
- ✅ Bash - Build, test, and validation commands

**❌ PROHIBITED TOOLS FOR THIS PHASE**:
- ❌ Git commits - Only commit when human explicitly requests
- ❌ Specification changes - No modifying domain/digital req files during implementation

**ENFORCEMENT**: If you attempt prohibited tools, STOP and explain the attempted violation.

#### **Step 1.1: [Specific Implementation Task]**
**What**: [Exactly what will be implemented]
**Why**: [Business/technical reason for this step]
**Dependencies**: [Prerequisites from previous steps or external]
**Estimated Subtasks**: 9 subtasks (~45-60 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 1.1 Execution Roadmap
<!-- v5.0: 3x3 block structure replaces linear A-I subtasks -->

**🔷 PREPARATION BLOCK** (3 tasks)
1. Subtask A: Review requirements from domain.req.md and digital.req.md
2. Subtask B: Initiate expert coordination (if enabled)
3. Subtask C: Update tracking status in requirement documents
   ✅ Preparation Checkpoint

**🔷 EXECUTION BLOCK** (4 tasks)
4. Subtask D: Implement code per specifications
5. Subtask E: Write comprehensive tests
6. Subtask F: Expert validation of implementation (if enabled)
7. Subtask G: Execute comprehensive validation (build + tests)
   ✅ Execution Checkpoint

**🔷 FINALIZATION BLOCK** (4 tasks)
8. Subtask H: Update documentation and logs
9. Subtask I: Complete expert coordination (if enabled)
10. Subtask J: Update state tracker (v5.0 - NEW)
11. Subtask K: Self-validation checkpoint (v5.0 - NEW)
   ✅ Finalization Checkpoint

Total: 11 subtasks organized in 3 blocks (Preparation → Execution → Finalization)
```

**Requirements to Review:**
Before implementing, the AI MUST review these sections from the referenced documents:
- `[Domain].domain.md` - Section X.Y: [Specific business rules for this component]
- `[Capability].digital.md` - Section A.B: [User journey and capability details]
- Look for: Business constraints, validation rules, integration contracts, edge cases

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Requirements Analysis**
```bash
# Commands to execute:
echo "[Step 1.1] Starting requirements review"
# Open and read the domain.md file
# Extract relevant business rules
# Document understanding in comments
```
- [ ] Read domain.md Section X.Y
- [ ] Extract business rules
- [ ] Read digital.md Section A.B  
- [ ] Note integration requirements
- [ ] **LOG**: "Requirements reviewed: [list key rules]"

**SUBTASK B: Initiate Expert Coordination** (if enabled)
<!-- v5.0: Expert coordination moved to Subtask B per 3x3 structure -->
```bash
# Commands to execute:
echo "[Step 1.1] Initiating expert coordination"
# Activate Virtual Expert Team if needed
```
- [ ] Review requirement complexity and determine if expert coordination needed
- [ ] If enabled: Initiate expert team selection per ICP instructions
- [ ] If enabled: Brief experts on implementation objectives
- [ ] **LOG**: "Expert coordination initiated: [X] experts selected" OR "Expert coordination: N/A"

**SUBTASK C: Update Tracking Status**
<!-- v5.0: Decentralized tracking - capability-registry.md REMOVED -->
```bash
# Commands to execute:
echo "[Step 1.1] Updating capability tracking in requirement documents"
# Edit domain.req.md and digital.req.md
# Update capability status to "In Development"
```
- [ ] Open [Domain].domain.req.md
- [ ] Locate capability section for this component
- [ ] Change status from "Not Implemented" to "In Development"
- [ ] Add ICP reference and step number
- [ ] Open [Capability].digital.req.md (if applicable)
- [ ] Update capability status to "In Development"
- [ ] **LOG**: "Tracking updated: capability status now In Development in req files"

**✅ PREPARATION CHECKPOINT**: Verify all preparation tasks complete before proceeding

**SUBTASK D: Code Implementation**
```bash
# Commands to execute:
echo "[Step 1.1] Implementing [Component]"
# Create directory if needed
mkdir -p /Path/To/Component
# Create main implementation file
```

**Implementation Details:**
```csharp
// Example code structure or configuration
// MUST reflect business rules from domain.req.md
// MUST implement capabilities from digital.req.md
public class ExampleComponent
{
    // RATIONALE: [Brief explanation of design decision]
    // REF: [Domain].domain.req.md Section X.Y

    // TODO: Implement constructor
    // TODO: Implement business rule from domain.req.md Section X.Y
    // TODO: Add validation per digital.req.md requirements
    // TODO: Add error handling
    // TODO: Add logging
}
```

<!-- RATIONALE: v5.0 - Implementation rationale comments preserve design context for future AI sessions.
     Prevents regressions where AI "fixes" intentional design choices. Permanent comments optimize for
     AI-heavy development where context rollovers and new sessions need to understand "why" quickly. -->

**Implementation Rationale Comments (v5.0 - NEW):**
Add `// RATIONALE:` comments for:
- ✅ Non-obvious design decisions or trade-offs
- ✅ Deviations from standard patterns
- ✅ Performance/security considerations
- ✅ Complex business logic implementation choices
- ✅ Surprising code (where reader might ask "why not do X instead?")

**Format:**
```csharp
// RATIONALE: [1-2 sentence explanation of WHY this approach vs alternatives]
// REF: [Domain].domain.req.md Section X.Y [or digital.req.md Section A.B]
```

**Example:**
```csharp
// RATIONALE: Using linear search instead of hash lookup because dataset is
// always <10 items and simplicity > optimization. Avoids premature complexity.
// REF: trading.domain.req.md Section 3.4 (Performance Requirements)
public Account FindAccount(string id)
{
    return accounts.FirstOrDefault(a => a.Id == id);
}
```

**NOT needed for:**
- ❌ Obvious code that's self-explanatory
- ❌ Standard CRUD operations
- ❌ Simple getters/setters
- ❌ Boilerplate patterns

**Implementation Checklist:**
- [ ] Create file: `/Path/To/File.cs`
- [ ] Implement constructor and fields
- [ ] Implement main business logic
- [ ] Add validation rules per req specifications
- [ ] Add error handling
- [ ] **Add rationale comments for non-obvious design decisions with req references**
- [ ] **LOG**: "Implemented [Component] with [X] methods and [Y] rationale comments"

**SUBTASK E: Test Implementation**
<!-- v5.0: Test writing is Execution Block task, not Preparation -->
<!-- CRITICAL: Framework selection MUST align with testing-standards.domain.req.md -->
```bash
# Commands to execute:
echo "[Step 1.1] Writing tests for [Component]"
echo "Framework selection: [BDD for business logic | XUnit for infrastructure]"
# Create test file in appropriate test project
```

**Framework Selection Decision:**
- [ ] **If business logic/trading algorithms/domain rules** → Use BDD (Reqnroll)
- [ ] **If infrastructure/API/data access/utilities** → Use XUnit

**Option A: BDD Testing (Business Logic Components)**

**File**: `TestSuite/[Domain]/[Component].feature`
```gherkin
Feature: [Component Name] - [Business Capability Description]
  As a [trader/system/stakeholder]
  I want to [capability]
  So that [business value delivered]

Scenario: [Primary happy path business scenario]
  Given the system has [precondition with specific test data]
  And [additional context or setup]
  When [business action occurs]
  Then [measurable business outcome]
  And [system should exhibit specific behavior]
  And logs should contain "[expected diagnostic message]"

Scenario: [Error handling business scenario]
  Given the system encounters [error condition]
  When [business action attempted]
  Then the system should [graceful failure behavior]
  And error should be logged with Serilog
  And [compensating action or recovery]

Scenario Outline: [Parameterized business scenarios with realistic data]
  Given a trading scenario with <parameter>
  When [action with parameter]
  Then the result should be <expected>
  And performance should be within <threshold>

  Examples: Realistic trading data scenarios
    | parameter | expected | threshold |
    | value1    | result1  | 100ms     |
    | value2    | result2  | 100ms     |
```

**File**: `TestSuite/StepDefinitions/[Domain]/[Component]Steps.cs`
```csharp
using Reqnroll;
using FluentAssertions;
using Lucidwonks.Utility.Output;
using Serilog;

namespace Lucidwonks.TestSuite.StepDefinitions.[Domain];

[Binding]
[Scope(Feature = "[Component Name]")]
public class [Component]Steps
{
    private readonly ILogger _logger;
    private [ComponentType] _component;
    private [ResultType] _result;
    private Exception _caughtException;

    public [Component]Steps()
    {
        // MANDATORY: Serilog initialization for BDD scenarios
        LoggerConfig.ConfigureLogger("BDDTests");
        _logger = Log.ForContext<[Component]Steps>();
    }

    [Given(@"the system has (.*)")]
    public void GivenSystemHasPrecondition(string precondition)
    {
        _logger.Information("Setting up precondition: {Precondition}", precondition);
        _component = new [ComponentType]();
        // Setup realistic test data
    }

    [When(@"(.*) occurs")]
    public void WhenBusinessActionOccurs(string action)
    {
        _logger.Information("Executing business action: {Action}", action);
        try
        {
            _result = _component.PerformBusinessAction();
        }
        catch (Exception ex)
        {
            _caughtException = ex;
            _logger.Warning(ex, "Business action failed (expected for error scenarios)");
        }
    }

    [Then(@"(.*) should (.*)")]
    public void ThenOutcomeShouldBeValidated(string outcome, string expected)
    {
        _logger.Information("Validating outcome: {Outcome} = {Expected}", outcome, expected);

        // MANDATORY: FluentAssertions for BDD validation
        _result.Should().NotBeNull("business outcome must be populated");
        _result.Should().Match<[ResultType]>(r => r.[Property] == expected);

        _logger.Information("Scenario validation passed");
    }
}
```

**BDD Test Checklist:**
- [ ] Create `.feature` file with stakeholder-readable scenarios in `TestSuite/[Domain]/`
- [ ] Write scenarios covering all business rules from domain.req.md
- [ ] Implement step definitions in `TestSuite/StepDefinitions/[Domain]/`
- [ ] Use realistic trading data in scenario examples
- [ ] Add Serilog logging in all step definitions (MANDATORY)
- [ ] Use FluentAssertions for all validations with descriptive messages
- [ ] Ensure 100% business scenario coverage
- [ ] Validate scenarios are readable by non-technical stakeholders

**Option B: XUnit Testing (Infrastructure Components)**

**File**: `[ComponentName].Tests/[ComponentName]Tests.cs`
```csharp
using Xunit;
using FluentAssertions;
using Lucidwonks.Utility.Output;
using Serilog;
using Moq; // For mocking dependencies

namespace Lucidwonks.[Domain].[Component].Tests;

[Trait("Category", "Unit")] // Use "Integration", "Performance" as appropriate
public class [ComponentName]Tests : IDisposable
{
    private readonly ILogger _logger;
    private readonly [ComponentName] _sut; // System Under Test
    private readonly Mock<IDependency> _mockDependency;

    public [ComponentName]Tests()
    {
        // MANDATORY: Serilog initialization via platform standard
        LoggerConfig.ConfigureLogger("InfrastructureTests");
        _logger = Log.ForContext<[ComponentName]Tests>();

        // Setup mocks and SUT
        _mockDependency = new Mock<IDependency>();
        _sut = new [ComponentName](_mockDependency.Object);

        _logger.Information("Test fixture initialized for {Component}", nameof([ComponentName]));
    }

    [Fact]
    public void Should_PerformExpectedBehavior_When_HappyPath()
    {
        // Arrange
        _logger.Information("Test: Happy path scenario starting");
        var input = CreateValidInput();
        _mockDependency.Setup(d => d.Method()).Returns(expectedValue);

        // Act
        var result = _sut.MethodUnderTest(input);

        // Assert
        result.Should().NotBeNull("valid input should produce result");
        result.Should().BeOfType<ExpectedType>();
        result.Property.Should().Be(expectedValue, "business rule should be applied");

        _mockDependency.Verify(d => d.Method(), Times.Once());
        _logger.Information("Test passed: {Result}", result);
    }

    [Fact]
    public void Should_ThrowException_When_InvalidInput()
    {
        // MANDATORY: Error handling test per testing-standards.domain.req.md Section 5
        _logger.Information("Test: Error scenario - invalid input");
        var invalidInput = CreateInvalidInput();

        // Act
        Action act = () => _sut.MethodUnderTest(invalidInput);

        // Assert
        act.Should().Throw<ArgumentException>()
           .WithMessage("*expected validation message*");

        _logger.Warning("Error scenario validated successfully");
    }

    [Theory]
    [InlineData(null, "null input edge case")]
    [InlineData("", "empty string edge case")]
    [InlineData("   ", "whitespace edge case")]
    public void Should_HandleEdgeCases_When_BoundaryConditions(string input, string scenario)
    {
        // MANDATORY: Edge case testing per testing standards
        _logger.Information("Test: Edge case - {Scenario}", scenario);

        // Act & Assert based on expected behavior
        var result = _sut.MethodUnderTest(input);

        result.Should().NotBeNull($"{scenario} should handle gracefully");
        _logger.Information("Edge case passed: {Scenario}", scenario);
    }

    [Fact]
    [Trait("Category", "Performance")]
    public void Should_CompleteWithinThreshold_When_PerformanceValidation()
    {
        // Performance testing when component is performance-critical
        _logger.Information("Test: Performance validation starting");
        var input = CreateRealisticInput();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = _sut.MethodUnderTest(input);
        stopwatch.Stop();

        // Assert
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(100,
            "operation must complete within performance threshold");
        _logger.Information("Performance test passed: {Duration}ms", stopwatch.ElapsedMilliseconds);
    }

    public void Dispose()
    {
        // Cleanup resources
        _logger.Information("Test fixture disposing");
        _sut?.Dispose();
    }

    // Helper methods
    private ValidInput CreateValidInput() { /* realistic test data */ }
    private InvalidInput CreateInvalidInput() { /* test data for error scenarios */ }
    private RealisticInput CreateRealisticInput() { /* production-like test data */ }
}
```

**XUnit Test Checklist:**
- [ ] Create test class in `[ComponentName].Tests/` project
- [ ] Add [Trait("Category", "Unit|Integration|Performance")] attributes
- [ ] Initialize Serilog via LoggerConfig in constructor (MANDATORY)
- [ ] Write happy path test with FluentAssertions
- [ ] Write validation/error handling test (MANDATORY)
- [ ] Write edge case tests using [Theory] and [InlineData]
- [ ] Write performance test if component is performance-critical
- [ ] Add Serilog logging for all test execution and failures (MANDATORY)
- [ ] Use Moq for dependency mocking with proper verification
- [ ] Implement IDisposable for proper cleanup
- [ ] Achieve >85% code coverage (will be validated in Subtask G)

**PROGRESS UPDATE**:
- [ ] "Created [X] [BDD scenarios | XUnit tests] for [component]"
- [ ] "Using [Reqnroll BDD | XUnit] framework per testing-standards.domain.req.md"
- [ ] "Target coverage: [100% scenarios | >85% code] with Serilog logging integration"
- [ ] **LOG**: "Created [X] tests with [Y]% coverage target using [framework]"

**SUBTASK F: Expert Validation** (if enabled)
<!-- v5.0: Expert validation in Execution Block ensures implementation quality before comprehensive validation -->
```bash
# Commands to execute:
echo "[Step 1.1] Requesting expert validation of implementation"
# Engage Virtual Expert Team for implementation review
```
- [ ] If expert coordination enabled: Present implementation to expert team
- [ ] If enabled: Request expert review of code quality, patterns, business logic
- [ ] If enabled: Document expert feedback and recommendations
- [ ] If enabled: Apply critical expert suggestions before proceeding
- [ ] **LOG**: "Expert validation complete: [consensus %], [recommendations applied]" OR "Expert validation: N/A"

**SUBTASK G: Comprehensive Validation** (MANDATORY - ALL MUST PASS)
<!-- v5.0: Renamed from "Validation Execution" for clarity. This is the comprehensive validation step. -->
```bash
# THESE COMMANDS MUST BE RUN EXACTLY AS SHOWN:
echo "[Step 1.1] Starting validation"

# 1. BUILD ENTIRE SOLUTION (MANDATORY)
echo "Building entire solution..."
dotnet build Lucidwonks.sln
if [ $? -eq 0 ]; then 
    echo "✅ Solution build PASSED"
else 
    echo "❌ Solution build FAILED - MUST FIX"
    echo "Attempting to identify and fix build errors..."
    # AI MUST: Read error output, fix the code, then retry
    # DO NOT PROCEED until build passes
    exit 1
fi

# 2. RUN ALL TESTS (MANDATORY)
echo "Running ALL tests in solution..."
dotnet test Lucidwonks.sln --filter "Category!=LongRunning"
if [ $? -eq 0 ]; then 
    echo "✅ All tests PASSED"
else 
    echo "❌ Tests FAILED - MUST FIX"
    echo "Identifying failing tests..."
    dotnet test Lucidwonks.sln --filter "Category!=LongRunning" --logger "console;verbosity=detailed"
    # AI MUST: Read test failures, fix the issues, then retry
    # DO NOT PROCEED until all tests pass
    exit 1
fi

# 3. Component-specific tests for coverage
echo "Running component tests with coverage..."
dotnet test TestProject/TestProject.csproj --filter "FullyQualifiedName~ExampleComponent" --collect:"XPlat Code Coverage"
if [ $? -eq 0 ]; then 
    echo "✅ Component tests PASSED"
else 
    echo "❌ Component tests FAILED - MUST FIX"
    exit 1
fi

# 4. Check for warnings (SHOULD fix but not blocking)
echo "Checking for warnings..."
dotnet build Lucidwonks.sln --warnaserror
if [ $? -eq 0 ]; then 
    echo "✅ No warnings"
else 
    echo "⚠️ Warnings found - should fix if possible"
fi

# 5. Final validation summary
echo "========================================"
echo "VALIDATION SUMMARY:"
echo "✅ Solution Build: PASSED"
echo "✅ All Tests: PASSED"
echo "✅ Component Tests: PASSED"
echo "Coverage: [X]% (target: >80%)"
echo "========================================"
```

**VALIDATION REQUIREMENTS (MANDATORY):**
- [ ] ✅ ENTIRE SOLUTION BUILDS (Lucidwonks.sln)
- [ ] ✅ ALL TESTS PASS (no exceptions)
- [ ] ✅ Component tests pass with coverage >80%
- [ ] ⚠️ No warnings (preferred, fix if possible)
- [ ] 🔧 All failures FIXED before proceeding

**ERROR HANDLING PROTOCOL:**
If ANY validation fails:
1. **STOP** - Do not continue to next subtask
2. **READ** - Carefully read all error messages
3. **DIAGNOSE** - Identify root cause of failure
4. **FIX** - Modify code/tests to resolve
5. **RE-RUN** - Execute validation again
6. **REPEAT** until all validations pass
7. **LOG**: "Fixed [issue]: [what was done]"

**COMMON FIXES:**
- **Build errors**: Check namespaces, missing references, syntax errors
- **Test failures**: Verify logic, check test data, fix assertions
- **Coverage low**: Add more test cases for uncovered code paths

**LOG**: "Validation complete: Solution Build ✅, All Tests ✅ ([X]/[Y] passing, [Z]% coverage)"

**✅ EXECUTION CHECKPOINT**: Verify all execution tasks complete before proceeding to Finalization
- [ ] Code implemented per specifications from domain.req.md and digital.req.md
- [ ] Expert consensus achieved on implementation approach (if enabled)
- [ ] All tests written and passing (>80% coverage target)
- [ ] ENTIRE solution builds successfully (no errors)
- [ ] ALL tests pass (no failures)

**SUBTASK H: Documentation Updates**
<!-- v5.0: Documentation is Finalization Block task, relabeled from F to H -->
```bash
# Commands to execute:
echo "[Step 1.1] Updating documentation"
# Update multiple documentation files and implementation notes
```
- [ ] Update `[Domain].domain.req.md` section X.Y with implementation notes
- [ ] Update `[Capability].digital.req.md` (if applicable) with completion details
- [ ] Add new CLI commands to `CLAUDE.md` if applicable
- [ ] Update this ICP step status to "In Progress"
- [ ] Document any deviations from original spec or learnings
- [ ] **LOG**: "Updated [X] documentation files"

**SUBTASK I: Complete Expert Coordination** (if enabled)
<!-- v5.0: Expert completion is Finalization Block task -->
```bash
# Commands to execute:
echo "[Step 1.1] Completing expert coordination"
# Finalize expert team engagement
```
- [ ] If expert coordination enabled: Gather final expert recommendations
- [ ] If enabled: Update expert coordination performance metrics
- [ ] If enabled: Archive expert conversation context for future reference
- [ ] If enabled: Validate expert coordination targets met (selection accuracy ≥95%, consensus ≥80%)
- [ ] **LOG**: "Expert coordination completed with [X]% consensus and [Y] recommendations" OR "Expert coordination: N/A"

**SUBTASK J: Update State Tracker** (v5.0 - NEW)
<!-- v5.0: State persistence enables 100% context rollover recovery -->
```bash
# ACTION: Update state persistence block at top of document
```
- [ ] Scroll to top of document to state persistence block
- [ ] Update CURRENT PHASE: [Phase X]
- [ ] Update CURRENT STEP: [Step 1.1 COMPLETE]
- [ ] Update CURRENT BLOCK: Finalization
- [ ] Update LAST ACTION COMPLETED: "Step 1.1 finalization complete"
- [ ] Update NEXT ACTION: "Await human approval, then proceed to Step 1.2"
- [ ] Update FILES MODIFIED: [List all files created/modified this step]
- [ ] Update VALIDATION STATUS: "All checks PASS"
- [ ] Update BUILD STATUS: ✅ Validated
- [ ] Update TEST STATUS: ✅ All passing
- [ ] **LOG**: "State tracker updated with current execution position"

**SUBTASK K: Self-Validation Checkpoint** (v5.0 - NEW)
<!-- v5.0: Mandatory PASS/FAIL checkpoint forces explicit validation. 0% skipped validation target. -->

Execute mandatory self-validation against acceptance criteria:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Requirements from domain.req.md implemented | [ ] PASS / [ ] FAIL | [Specific sections] |
| Capabilities from digital.req.md implemented | [ ] PASS / [ ] FAIL | [Specific capabilities] |
| Code follows project patterns | [ ] PASS / [ ] FAIL | [Pattern references] |
| Tests written and passing | [ ] PASS / [ ] FAIL | [X]/[Y] tests, [Z]% coverage |
| Build succeeds | [ ] PASS / [ ] FAIL | Build output clean |
| No new errors in logs | [ ] PASS / [ ] FAIL | Log verification clean |
| Documentation updated | [ ] PASS / [ ] FAIL | [List updated docs] |
| State tracker updated | [ ] PASS / [ ] FAIL | State block current |
| Expert coordination complete (if enabled) | [ ] PASS / [ ] FAIL / [ ] N/A | [Consensus achieved] |

**VALIDATION RESULT**: [ ] ALL PASS - Proceed to stop gate
                        [ ] ANY FAIL - Fix before stop gate

**CRITICAL**: You CANNOT proceed to stop gate with ANY failure status.
If any criterion shows FAIL, you MUST fix it before continuing.

- [ ] **LOG**: "Self-validation complete - all criteria PASS"

**✅ FINALIZATION CHECKPOINT**: Verify all finalization tasks complete
- [ ] Documentation updates complete (implementation notes, expert outcomes)
- [ ] Expert coordination completed and archived (if enabled)
- [ ] State tracker updated with current execution position
- [ ] Self-validation table shows ALL PASS (no FAIL entries)
- [ ] Todo list updated - current step marked "completed"

**Human Review Gate:**
```markdown
## Step 1.1 Completion Summary
**Step Status**: COMPLETE ✅
**Subtasks Completed**: 16/16

### What Was Implemented
**Component**: [Component name]
**Business Rules**: [List rules implemented]
**Capabilities**: [List capabilities added]

### Validation Results  
**Build Status**: ✅ Passing
**Test Results**: [X]/[Y] tests passing
**Coverage**: [X]% (target: 80%)
**Warnings**: None

### Files Modified
**Created**:
- `/Path/To/File.cs` ([X] lines)
- `/Path/To/Test.cs` ([Y] tests)

**Updated**:
- `domain.md` - Section X.Y (status: In Development)
- `capability-registry.md` - [CAPABILITY-ID] (status: In Progress)
- This ICP - Step 1.1 (status: Complete)

### Next Step
**Step 1.2**: [Next task name]
**Dependencies**: Step 1.1 complete ✅

**Ready for review. Please verify and commit before continuing.**

<!-- RATIONALE: Bunker-style visual barrier stop gate addresses v4.0's ~20% violation rate.
     Visual box creates psychological barrier. ZERO content after gate prevents accidental
     reading of next step. Target: 0% violations vs 20% in v4.0. -->

╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║                            🛑 MANDATORY STOP GATE 🛑                             ║
║                                                                                  ║
║  CURRENT STATE: Step 1.1 Complete                                               ║
║  AWAITING: Human approval to continue to Step 1.2                               ║
║                                                                                  ║
║  COMPLETED:                                                                      ║
║  ✅ Preparation Block (3/3 tasks)                                                ║
║  ✅ Execution Block (4/4 tasks)                                                  ║
║  ✅ Finalization Block (4/4 tasks)                                               ║
║  ✅ Self-Validation (9/9 criteria PASS)                                          ║
║                                                                                  ║
║  PROHIBITED ACTIONS:                                                             ║
║  ❌ Do NOT read Step 1.2 instructions                                            ║
║  ❌ Do NOT begin Step 1.2 work                                                   ║
║  ❌ Do NOT modify additional files                                               ║
║  ❌ Do NOT continue execution                                                    ║
║                                                                                  ║
║  TO CONTINUE: Human must explicitly say "continue"                               ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

<!-- ZERO CONTENT AFTER STOP GATE - Prevents accidental continuation -->

---
---
---

```

#### **Step 1.2: [Next Implementation Task]**
<!-- Repeat same structure for each step -->

### **Phase 2: [Core Feature Implementation]**
**Objective**: [What this phase accomplishes]
**Scope**: [Number of components/features to implement]
**Dependencies**: Phase 1 completion

<!-- RATIONALE: Phase 2 continues implementation work with same tool restrictions as Phase 1.
     Prevents premature commits and specification changes during active implementation. -->

**🔧 ALLOWED TOOLS FOR PHASE 2**:
- ✅ Read - Understanding existing code and requirements
- ✅ Grep - Searching for patterns and dependencies
- ✅ Glob - Finding files to modify
- ✅ Write - Creating new implementation files
- ✅ Edit - Modifying existing files
- ✅ Bash - Build, test, and validation commands

**❌ PROHIBITED TOOLS FOR PHASE 2**:
- ❌ Git commits - Only commit when human explicitly requests
- ❌ Specification changes - No modifying domain/digital req files during implementation

#### **Step 2.1: [Specific Feature Component]**
<!-- Follow same detailed structure as Step 1.1 -->

## **TESTING VERIFICATION**

### **Test Coverage Requirements**
Each phase must maintain:
- Unit Test Coverage: >80%
- Integration Test Coverage: All public APIs
- BDD Scenarios: Key user workflows

### **Test Execution Matrix**
| Component | Unit Tests | Integration Tests | BDD Tests | Min Coverage |
|-----------|------------|------------------|-----------|--------------|
| [Component 1] | Required | Required | Optional | 85% |
| [Component 2] | Required | Optional | Required | 80% |

### **Standard Test Patterns**
<!-- Reference the patterns that should be followed -->
```csharp
// Follow patterns from /Documentation/Overview/Testing-Standards.md
// Use mocking patterns from existing tests
// Implement IDisposable for test cleanup
```

## **CONTINUOUS VALIDATION**

### **After EVERY Code Change**
The AI MUST run these checks after any code modification:
```bash
# Quick validation suite (MANDATORY)
echo "Running quick validation after code change..."
dotnet build Lucidwonks.sln --no-restore
if [ $? -ne 0 ]; then
    echo "❌ Build broken - MUST FIX IMMEDIATELY"
    # Fix the build error before continuing
    exit 1
fi

dotnet test Lucidwonks.sln --no-build --filter "Category!=LongRunning"
if [ $? -ne 0 ]; then
    echo "❌ Tests broken - MUST FIX IMMEDIATELY"
    # Fix the test failures before continuing
    exit 1
fi
echo "✅ Quick validation passed"
```

### **After EVERY Step Completion**
```bash
# Full validation suite (MANDATORY - ALL MUST PASS)
echo "Running full validation for step completion..."
dotnet clean
dotnet restore
dotnet build Lucidwonks.sln --configuration Release
if [ $? -ne 0 ]; then
    echo "❌ Release build FAILED - CANNOT COMPLETE STEP"
    echo "ACTION: Fix all build errors before marking step complete"
    exit 1
fi

dotnet test Lucidwonks.sln --configuration Release --collect:"XPlat Code Coverage"
if [ $? -ne 0 ]; then
    echo "❌ Release tests FAILED - CANNOT COMPLETE STEP"
    echo "ACTION: Fix all test failures before marking step complete"
    exit 1
fi

echo "✅ Step validation complete - ALL TESTS PASSING"
```

### **Before Phase Completion**
```bash
# Comprehensive validation (MANDATORY - ZERO TOLERANCE FOR FAILURES)
echo "Running comprehensive phase validation..."

# 1. Full solution build
dotnet build Lucidwonks.sln
if [ $? -ne 0 ]; then
    echo "❌ PHASE CANNOT BE COMPLETED - BUILD FAILURES EXIST"
    echo "ACTION REQUIRED: Fix all build errors"
    exit 1
fi

# 2. All tests must pass
dotnet test Lucidwonks.sln
if [ $? -ne 0 ]; then
    echo "❌ PHASE CANNOT BE COMPLETED - TEST FAILURES EXIST"
    echo "ACTION REQUIRED: Fix all failing tests"
    exit 1
fi

# 3. Check for incomplete work
grep -r "TODO\|FIXME" --include="*.cs" .
if [ $? -eq 0 ]; then
    echo "⚠️ WARNING: TODO/FIXME comments found"
    echo "Review these before phase completion:"
    grep -r "TODO\|FIXME" --include="*.cs" . | head -10
fi

echo "========================================"
echo "PHASE VALIDATION SUMMARY:"
echo "✅ Full Solution Build: PASSED"
echo "✅ All Tests: PASSED"
echo "✅ Ready for phase completion"
echo "========================================"
```

**VALIDATION ENFORCEMENT RULES:**
1. **NO EXCEPTIONS**: Build and tests MUST pass for step/phase completion
2. **FIX IMMEDIATELY**: Any failure must be fixed before proceeding
3. **LOG ALL FIXES**: Document what was broken and how it was fixed
4. **VERIFY FIXES**: Re-run full validation after any fix
5. **ESCALATE IF STUCK**: If unable to fix after 3 attempts, ask for human help

## **ROLLBACK PROCEDURES**

### **Step-Level Rollback**
If a step fails validation:
1. Identify the failing component
2. Revert changes using git
3. Document failure reason
4. Adjust approach and retry

### **Phase-Level Rollback**
If a phase cannot be completed:
1. Create branch for incomplete work
2. Revert to last stable phase
3. Document blockers
4. Create new ICP for alternative approach

## **PROGRESS TRACKING**

### **Phase 1: [Name]** 
- [ ] Step 1.1: [Name] - Status: [ ] Not Started | [ ] In Progress | [ ] Complete
- [ ] Step 1.2: [Name] - Status: [ ] Not Started | [ ] In Progress | [ ] Complete
- [ ] Step 1.3: [Name] - Status: [ ] Not Started | [ ] In Progress | [ ] Complete
- [ ] Phase 1 Testing: [ ] Unit | [ ] Integration | [ ] BDD
- [ ] Phase 1 Documentation: [ ] Updated | [ ] Reviewed

### **Phase 2: [Name]**
- [ ] Step 2.1: [Name] - Status: [ ] Not Started | [ ] In Progress | [ ] Complete
<!-- Continue for all phases -->

## **COMPLETION CRITERIA**

### **Implementation Complete When:**
- [ ] All phases and steps completed
- [ ] All tests passing with required coverage
- [ ] Build successful in both IDE and CLI
- [ ] No errors or warnings in logs
- [ ] Documentation fully updated
- [ ] Code review completed
- [ ] Requirement documents updated with implementation status

### **Definition of Done:**
- [ ] Feature works as specified in requirements
- [ ] Tests provide confidence in implementation
- [ ] Documentation enables future maintenance
- [ ] Code follows project standards and patterns
- [ ] Performance meets requirements
- [ ] Security considerations addressed

## **GITHUB COMMIT SUMMARY TEMPLATE**
<!-- AI should generate this after each step for human to use in commits -->
```markdown
feat(component): Implement [feature/component name]

## Changes
- Implemented [main functionality]
- Added [number] unit tests for [component]
- Added [number] integration tests
- Updated documentation in [files]

## Testing
- All tests passing ([X]/[Y])
- Coverage: [percentage]%
- Build status: ✅ Success

## Next Steps
- [ ] [Next step description]

Related: #[issue-number]
ICP: [ICP-handle]
```

---

**Document Metadata**
- **ICP Handle**: [ICP-IMPLEMENTATION-XXXX]
- **Generated From Template**: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
- **Template Version**: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
- **Generated By**: [ ] Manual Creation | [x] Concept ICP Phase 4 | [ ] Other
- **Source Concept ICP**: [Path to Concept ICP that generated this, if applicable]
- **Related Domain**: [Domain name from requirements]
- **Related Requirements**: [List of .domain.md and .digital.md files]
- **Created Date**: [Date]
- **Status**: [ ] Draft | [ ] Approved | [ ] In Progress | [ ] Completed | [ ] Blocked
- **Total Steps**: [Number of implementation steps]
- **Components Affected**: [Number of components to create/modify]
- **Assigned To**: [Developer/AI Agent]
- **Reviewed By**: [Reviewer name]

**Change History**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | [Date] | Initial draft | [Author] |

---

## **AI EXECUTION SUMMARY INSTRUCTIONS**
<!-- This section is MANDATORY for AI to follow -->

### **🛑 STOP PROTOCOL - THIS IS NOT OPTIONAL 🛑**

**SYSTEM CRITICAL**: Failure to stop at each gate will corrupt the Context Engineering System and require manual intervention to fix.

**AFTER EACH AND EVERY step, the AI MUST:**
1. **🛑 STOP EXECUTION IMMEDIATELY 🛑**
2. **Generate a summary** using the template above
3. **🛑 STOP HERE - Wait for "continue" before proceeding to next step 🛑**
4. **Only continue** when human EXPLICITLY types "continue" or "proceed to next step"
5. **If unsure whether to stop** - ALWAYS STOP AND ASK

**The AI should NEVER:**
- Skip steps or phases
- Continue without test validation
- Proceed past failures
- Assume build success without verification
- Move to next step without human approval

**The AI should ALWAYS:**
- Follow the exact sequence: Review Requirements → Update Registry → Implement → Test → Validate → Document → Update Registry → Pause
- Reference domain.md and digital.md files for implementation details
- **Reference testing-standards.domain.req.md for mandatory framework selection and coverage requirements**
- **Select correct testing framework FIRST: BDD (Reqnroll) for business logic, XUnit for infrastructure**
- **Implement comprehensive tests with >85% XUnit coverage OR 100% BDD scenario coverage - NOT OPTIONAL**
- **Use Serilog logging via LoggerConfig for ALL test failures - no Console.WriteLine or alternatives**
- Update capability-registry.md status at start and completion
- Update feature statuses in requirement documents
- Check both IDE and CLI build compatibility
- Update CLAUDE.md when adding new projects/commands
- Verify implementation matches business capability specifications
- **Treat test failures as build failures - equally blocking and requiring immediate fix**
- Generate helpful commit summaries

## **FINAL IMPLEMENTATION PHASE**

### **Phase N+1: Implementation Lifecycle Completion**
**Objective**: Complete implementation documentation updates and properly archive implementation artifacts
**CRITICAL**: This phase ensures implementation completion is properly documented and tracked

**Detailed Steps:**

#### **Step N+1.1: Implementation Documentation Finalization**
**What**: Update all requirement documents with final implementation status
**Why**: Ensure documentation reflects completed implementation state
**Dependencies**: All previous implementation phases complete
**Estimated Subtasks**: 5 subtasks (~20-25 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step N+1.1 Execution Roadmap
<!-- v5.0: Updated for decentralized tracking (req files, not registry) -->
1. Subtask A: Update domain.req.md files with implementation status
2. Subtask B: Update digital.req.md files with implementation status
3. Subtask C: Verify requirement document tracking complete (no central registry in v5.0)
4. Subtask D: Update cross-references and integration documentation
5. Subtask E: Generate implementation completion summary
Total: 5 subtasks to complete implementation documentation
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Update Domain Requirement Document Implementation Status**
<!-- v5.0: domain.md → domain.req.md (decentralized tracking) -->
```bash
echo "[Step N+1.1] Updating domain.req.md files with implementation status"
# Update all referenced domain requirement documents
```
- [ ] Open each referenced `*.domain.req.md` file
- [ ] Update feature status from "In Development" to "Implemented"
- [ ] Add implementation completion date
- [ ] Add references to this Implementation ICP
- [ ] Note any implementation discoveries or deviations
- [ ] **LOG**: "Updated [X] domain requirement documents with implementation status"

**SUBTASK B: Update Digital Requirement Document Implementation Status**
<!-- v5.0: digital.md → digital.req.md (decentralized tracking) -->
```bash
echo "[Step N+1.1] Updating digital.req.md files with implementation status"
# Update all referenced digital requirement documents
```
- [ ] Open each referenced `*.digital.req.md` file
- [ ] Update capability status from "In Development" to "Implemented"
- [ ] Add implementation completion date
- [ ] Document any UI/UX implementation notes
- [ ] Update user journey status if applicable
- [ ] **LOG**: "Updated [X] digital requirement documents with implementation status"

**SUBTASK C: Verify Requirement Document Tracking Complete**
<!-- v5.0: capability-registry.md REMOVED - tracking is now in req files (Subtasks A & B above) -->
```bash
echo "[Step N+1.1] Verifying requirement document tracking complete"
# No central registry in v5.0 - verify decentralized tracking complete
```
- [ ] Verify all domain.req.md files updated with "Implemented" status
- [ ] Verify all digital.req.md files updated with "Implemented" status
- [ ] Confirm implementation dates and ICP references added
- [ ] Confirm test coverage percentages documented in req files
- [ ] **LOG**: "Requirement document tracking verified complete"

**SUBTASK D: Update Cross-References and Integration Documentation**
```bash
echo "[Step N+1.1] Updating cross-references and integration docs"
# Ensure all related documentation is consistent
```
- [ ] Update `/Documentation/Index.md` if new capabilities added
- [ ] Update CLAUDE.md if new commands/projects were added
- [ ] Update any integration documentation with new capabilities
- [ ] Verify all cross-references to implemented features are accurate
- [ ] **LOG**: "Updated cross-references and integration documentation"

**SUBTASK E: Generate Implementation Completion Summary**
- [ ] Count total features implemented
- [ ] List all modified/created files
- [ ] Document test coverage achieved
- [ ] Note any implementation lessons learned
- [ ] Prepare summary for archival documentation
- [ ] Update todo list - mark this step as "completed"
- [ ] **LOG**: "Implementation completion summary generated"

#### **Step N+1.2: Implementation Artifact Archival**
**What**: Archive implementation ICP and related artifacts for historical record
**Why**: Maintain implementation history and clean up active workspace
**Dependencies**: Step N+1.1 completion
**Estimated Subtasks**: 4 subtasks (~15-20 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step N+1.2 Execution Roadmap
1. Subtask A: Generate timestamp for archival
2. Subtask B: Archive implementation ICP with timestamp
3. Subtask C: Update archival index with implementation summary
4. Subtask D: Validate archival and generate completion report
Total: 4 subtasks to complete implementation archival
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Generate Timestamp for Archival**
```bash
echo "[Step N+1.2] Generating timestamp for implementation archival"
# Create timestamp for archival process
```
- [ ] Generate current timestamp: `YYYYMMDD-HHMM` format
- [ ] Verify `/Documentation/ContextEngineering/NewConcepts/Implemented/` folder exists
- [ ] Document timestamp for use in archival filenames
- [ ] **LOG**: "Archival timestamp generated: [YYYYMMDD-HHMM]"

**SUBTASK B: Archive Implementation ICP**
```bash
echo "[Step N+1.2] Archiving implementation ICP document"
# Move/copy this ICP to archival location
```
- [ ] For NewConcepts: Move to `Implemented/[YYYYMMDD-HHMM]-[name].implementation.icp.md`
- [ ] For Standard ICPs: Update status to "Complete" in current location
- [ ] Add completion date and final status to metadata
- [ ] Update document status field to "Completed"
- [ ] **LOG**: "Implementation ICP archived: [filename/location]"

**SUBTASK C: Update Archival Index**
```bash
echo "[Step N+1.2] Updating archival index with implementation summary"
# Update the archival tracking documents
```
- [ ] Open `Implemented/README.md` if NewConcepts archival
- [ ] Add entry with implementation summary
- [ ] Include final test coverage, files modified, capabilities implemented
- [ ] Add cross-references to archived concept and codification ICPs if applicable
- [ ] **LOG**: "Archival index updated with implementation completion"

**SUBTASK D: Validate Archival and Generate Completion Report**
```bash
echo "[Step N+1.2] Validating archival and generating final report"
# Ensure archival process completed successfully
```
- [ ] Verify archived ICP is accessible and complete
- [ ] Confirm all requirement documents reflect implementation completion
- [ ] Validate capability registry consistency
- [ ] Generate final implementation completion report
- [ ] Update todo list - mark Phase N+1 as "completed"
- [ ] **LOG**: "Implementation lifecycle completion validated"

**Human Review Gate:**
```markdown
## Phase N+1: Implementation Lifecycle Completion Summary
**Phase Status**: COMPLETE ✅
**Total Subtasks Completed**: 9/9

### Implementation Documentation Updates (Step N+1.1)
**Domain Documents Updated**: [X] files with implementation status
**Digital Documents Updated**: [X] files with capability status  
**Capability Registry**: [X] capabilities marked "Implemented"
**Cross-References Updated**: [X] documentation files updated

### Implementation Archival Results (Step N+1.2)
**Implementation ICP**: ✅ Archived with timestamp [YYYYMMDD-HHMM]
**Archival Location**: [Path to archived ICP]
**Archival Index**: ✅ Updated with implementation summary

### Implementation Completion Metrics
**Total Features Implemented**: [X] features
**Test Coverage Achieved**: [X]% (target: >80%)
**Files Created/Modified**: [X] total files
**Capabilities Registered**: [X] new/updated capabilities

### System State Post-Implementation
**Build Status**: ✅ All builds passing
**Test Status**: ✅ All tests passing
**Documentation**: ✅ All references updated and consistent
**Registry**: ✅ All capabilities properly tracked

**Implementation lifecycle complete. All deliverables finalized and archived.**

🛑 STOP HERE - Implementation completion confirmed 🛑
```

### **🏁 ENHANCED ICP COMPLETION PROTOCOL 🏁**

**AFTER Phase N+1 Completion:**
The implementation lifecycle is now complete. All implementation artifacts are properly documented, all requirement documents reflect completed implementation status, and the capability registry is fully updated. The Context Engineering System maintains complete implementation traceability.
- Stop and ask for help if requirements are unclear or contradictory
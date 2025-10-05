# ICP-CONCEPT: [Descriptive Handle - Brief Concept Description]

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL ICP)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.codification.icp.md
TEMPLATE_VERSION: 5.0.1
TEMPLATE_DESCRIPTION: Streamlined single-approval-gate workflow: Single comprehensive stop after planning phase presents all changes before execution, Three-tier instruction architecture (self-contained templates), state persistence blocks, continuous execution after approval, self-validation framework, phase-specific tool restrictions, context rollover protocol, decentralized capability tracking, template instruction separation
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

   VERSION 5.0.1 MINOR ENHANCEMENTS:
   - Streamlined to single comprehensive approval gate after planning phase
   - Removed multiple stop gates throughout execution for improved workflow efficiency
   - Single stop presents complete change plan before any document modifications
   - Continuous execution after approval with progress tracking
   - Simplified AI execution instructions for clearer workflow
   - Retained completion summaries as informational checkpoints (not hard stops)

   VERSION 5.0.0 MAJOR ENHANCEMENTS:
   - Three-tier instruction architecture (templates are Tier 1 - execution authority)
   - Bunker-style stop gates with visual barriers
   - State persistence blocks for context rollover resilience
   - 3x3 execution block structure (Preparation/Execution/Finalization)
   - Self-validation framework with PASS/FAIL checkpoints
   - Phase-specific tool restrictions (ALLOWED/PROHIBITED lists)
   - Context rollover protocol (Level 1 + Level 2)
   - Decentralized capability tracking (in req files, not central registry)
   - Template instruction separation (maintenance → TEMPLATE-MAINTENANCE.md)
   
   VERSION 4.0.0 MAJOR ENHANCEMENTS:
   - Virtual Expert Team integration for concept specification and documentation
   - Expert coordination patterns for architectural and domain concept validation
   - Enhanced human approval gates with expert recommendation context
   - Template-expert integration while maintaining human approval authority
   - Expert selection, coordination, and validation workflows for concept work
   - Context synchronization between documentation work and expert guidance

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
When creating a Concept ICP from this template:
1. Remove all sections marked with <!-- TEMPLATE INSTRUCTION -->
2. Replace all [bracketed placeholders] with actual content
3. This template is for DOCUMENTATION ONLY - no code implementation
4. Focus on clear business capability specifications
5. Ensure features are marked as "Not Implemented" with future ICP references
6. Each documentation phase should cover one logical documentation area

IMPORTANT: Do NOT reference ANY timeframes or duration estimates.
Instead use: document sections, feature counts, specification completeness, or dependency chains.

CRITICAL: Concept ICPs update documentation to specify future work.
They do NOT implement code. Implementation ICPs will reference these specs.

CAPABILITY REGISTRY INTERACTION:
When creating Concept ICPs:
1. If specifying NEW capabilities not yet documented:
   - Generate unique ID: [DOMAIN]-[NAME]-[4-random-chars]
   - Check /Documentation/ContextEngineering/capability-registry.md for conflicts
   - ADD new capability to registry with status "Not Started"
2. If updating existing capabilities:
   - Reference existing capability IDs from registry
   - Do NOT change registry status (concepts don't implement)
3. Always use capability IDs when referencing capabilities in documentation

TEMPLATE VERSIONING:
When creating ICPs from this template, ensure:
1. Use the TEMPLATE_FILE and TEMPLATE_VERSION defined above for metadata fields:
   - "Generated From Template" field: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
   - "Template Version" field: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
2. Fill in all metadata fields with actual values, not placeholders
═══════════════════════════════════════════════════════════════════════════
-->

## **CONCEPT OVERVIEW**
[1-2 paragraphs describing the conceptual changes being specified for future implementation. Focus on business capability gaps or architectural enhancements requiring technical specifications.]

**🛑 CODIFICATION PURPOSE**: This document provides SPECIFICATIONS AND REQUIREMENTS for future implementation - NO code changes should occur during this phase.

**ICP Type**: [x] Codification (Specifications Only) | ❌ NO IMPLEMENTATION ALLOWED ❌
**CRITICAL**: This is a CODIFICATION ICP - DOCUMENTATION AND SPECIFICATION ONLY
**PROHIBITED**: Code implementation, file modifications, system deployment, test execution
**Concept Scope**: [ ] New Capability Specification | [ ] Capability Enhancement | [ ] Cross-Capability Integration | [ ] Architectural Enhancement
**Documentation Impact**: [ ] Single Document | [ ] Multiple Related Documents | [ ] New Document Creation | [ ] Enterprise Standards Update
**Build Dependencies**: [ ] No Prerequisites | [ ] Requires Foundation Docs | [ ] Requires Core Specifications | [ ] Requires Integration Specs
**Complexity**: [ ] Simple | [ ] Moderate | [ ] Complex
**Template Version**: 5.0.1 (Streamlined single-approval-gate workflow - see TEMPLATE_DESCRIPTION for v5.0.1 features)
**Expert Coordination**: [x] Enabled (v4.0.0) | [ ] Disabled
**Expert Coordination Level**: [ ] Minimal | [x] Standard | [ ] Comprehensive

**📋 v5.0.1 TEMPLATE FEATURES**:
This template follows Context Engineering v5.0.1 principles:
- **Single Approval Gate**: One comprehensive stop after planning presents all changes before execution
- **Streamlined Workflow**: Continuous execution after approval with progress tracking
- **Three-Tier Architecture**: Self-contained execution instructions (no external references needed)
- **State Persistence**: Track execution state for context rollover resilience
- **Self-Validation**: Mandatory checkpoints throughout execution with progress logging
- **Tool Restrictions**: Clear ALLOWED/PROHIBITED lists per phase (codification = docs only)
- **Rollover Protocol**: Level 1 (state block) + Level 2 (re-grounding) recovery procedures
- **Decentralized Tracking**: Capability tracking in req files (no central registry)

## **VIRTUAL EXPERT TEAM COORDINATION (v4.0.0)**
<!-- NEW IN v4.0.0: Expert coordination integration for concept specification -->

### **Expert Coordination Configuration**
**Expert Selection Criteria**:
- [ ] **Architecture Expert**: Required for complex architectural concepts, system design specifications
- [ ] **Context Engineering Compliance Expert**: Required for Context Engineering system modifications, approval gate preservation
- [ ] **Process Engineer**: Required for workflow specifications, collaborative development patterns
- [ ] **QA Expert**: Required for comprehensive validation, cross-document consistency
- [ ] **Cybersecurity Expert**: Required for security-sensitive concept specifications
- [ ] **Performance Expert**: Required for performance-critical architectural concepts
- [ ] **Financial Quant**: Required for trading platform domain specifications
- [ ] **DevOps Expert**: Required for infrastructure and deployment concept specifications

**Expert Coordination Scope**:
- [ ] **Phase-Level Coordination**: Expert teams assembled per documentation phase
- [x] **Feature-Level Coordination**: Expert consultation per feature specification (RECOMMENDED)
- [ ] **Document-Level Coordination**: Expert validation for entire document enhancement

**Expert Integration Pattern**:
- [x] **Consultative Mode**: Experts provide recommendations, human retains approval authority (STANDARD)
- [ ] **Collaborative Mode**: Experts participate directly in documentation creation
- [ ] **Validation Mode**: Experts validate completed specifications only

### **Expert Coordination Workflow**
**Phase-Level Expert Integration**:
1. **Pre-Phase Expert Selection**: Automated expert selection based on concept characteristics
2. **Expert Coordination Initiation**: Multi-agent conversation setup with relevant experts
3. **Context Synchronization**: Concept context shared with expert team
4. **Expert Guidance Generation**: Experts provide architectural and domain validation recommendations
5. **Human Approval with Expert Context**: Human approval gates enhanced with expert insights
6. **Documentation Integration**: Expert recommendations integrated into concept specifications
7. **Expert Validation**: Post-specification validation by expert team
8. **Context Integration**: Expert insights preserved in concept documentation

**Expert Performance Targets (v4.0.0)**:
- Expert Selection Time: < 30 seconds for concept analysis
- Expert Response Time: < 2 minutes for specification review
- Coordination Overhead: < 10% of total documentation time
- Context Integrity: > 95% during expert coordination
- Expert Consensus: ≥ 80% for architectural and domain decisions

### **Expert Coordination Quality Gates**
**Mandatory Quality Checkpoints**:
- [ ] **Expert Selection Accuracy**: ≥ 95% appropriate expert selection for concept type
- [ ] **Context Transfer Integrity**: ≥ 95% context integrity maintained during expert coordination
- [ ] **Expert Consensus Achievement**: ≥ 80% consensus level for major architectural decisions
- [ ] **Human Authority Preservation**: Human approval authority maintained throughout coordination
- [ ] **Concept Specification Quality**: Expert-validated specifications meet architecture and domain standards
- [ ] **Documentation Consistency**: Expert coordination maintains cross-document consistency

## **STATE PERSISTENCE & CONTEXT ROLLOVER (v5.0)**

<!-- RATIONALE: Context window rollovers cause unpredictable failures in long documentation sessions.
     AI loses track of which phase/step is current. This live state tracker enables 100% recovery.
     AI must update this block after EVERY action to maintain accurate state. -->

╔══════════════════════════════════════════════════════════════════════════════════╗
║                         📍 EXECUTION STATE TRACKER                               ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  CURRENT PHASE: [Not Started]                                                   ║
║  CURRENT STEP: [None]                                                           ║
║  CURRENT BLOCK: [None - Preparation / Execution / Finalization]                 ║
║  LAST ACTION COMPLETED: [None - ICP execution not yet started]                  ║
║  NEXT ACTION: [Read this entire ICP document]                                   ║
║  DOCUMENTS MODIFIED THIS SESSION: 0                                             ║
║  VALIDATION STATUS: [Last checkpoint: None]                                     ║
║  EXPERT CONSENSUS: ⚠️ Not yet initiated                                          ║
║  APPROVAL STATUS: ⚠️ Awaiting human approval                                     ║
╚══════════════════════════════════════════════════════════════════════════════════╝

<!-- RATIONALE: Two-level protocol balances safety and efficiency. Level 1 (state block) is fast
     and handles 95% of rollovers. Level 2 (re-grounding docs) for uncertain cases. Provides
     systematic recovery vs unpredictable failures. -->

**🔄 CONTEXT ROLLOVER PROTOCOL**:

**LEVEL 1 (ALWAYS EXECUTE)**:
1. Read the state tracker block above (current phase/step/block)
2. Verify understanding of your current position in execution
3. Confirm last action completed and next action to take
4. Assess your confidence: HIGH / MEDIUM / LOW

**LEVEL 2 (EXECUTE IF CONFIDENCE < HIGH)**:
1. If uncertain about workflow, read: `.../context-engineering-kickstarter.md` (Tier 2 - Workflow patterns)
2. If uncertain about "why", read: `.../context-engineering-system.md` (Tier 3 - System concepts)
3. Return to this template for execution instructions (Tier 1 - Execution authority)

**IMPORTANT**: This template is Tier 1 (execution authority) - it contains all necessary instructions
for normal execution. Only reference Tier 2/3 if context rollover creates uncertainty.

## **CAPABILITY TRACKING (v5.0 - DECENTRALIZED)**
<!-- CRITICAL: These instructions MUST remain in generated Concept ICPs -->

<!-- RATIONALE: v5.0 removes capability-registry.md (central registry "never works properly").
     Tracking is now DECENTRALIZED to domain.req.md and digital.req.md files where capabilities
     are defined. This eliminates sync overhead while maintaining full traceability.
     Codification ICPs SPECIFY new capabilities in req files (status: "Not Implemented").
     Implementation ICPs IMPLEMENT capabilities (status: "Not Implemented" → "Implemented"). -->

**Tracking Update Requirements:**
Capability specification tracking differs based on ICP source type:

### **For Standard Concept ICPs (Mature Domain Documentation):**

**For NEW Capabilities Being Specified:**
1. Open target `[Domain].domain.req.md` file
2. Add new capability section with:
   - Capability Name: [Clear descriptive name]
   - Status: "Not Implemented"
   - Created Date: Today's date
   - Implementation ICP: "TBD - awaiting implementation"
   - Specifications: [Detailed requirements]
3. If UI/UX related, also add to `[Capability].digital.req.md` with:
   - Status: "Not Implemented"
   - User journey specifications
   - Interface requirements

**For EXISTING Capabilities Being Enhanced:**
1. Open existing `[Domain].domain.req.md` file
2. Locate capability section
3. UPDATE specifications with enhancements
4. Do NOT change status (Codification ICPs specify, they don't implement)
5. Add "Last Updated" date and this ICP reference
6. If applicable: Update corresponding `[Capability].digital.req.md`

### **For NewConcepts Concept ICPs (Exploratory Documentation):**
**IMPORTANT**: NewConcepts create initial req files that will be moved to mature domains later.

**When Creating NewConcept Requirements:**
1. Create `/Documentation/ContextEngineering/NewConcepts/[concept-name].concept.req.md`
2. Specify all capabilities with status: "Not Implemented"
3. Use placeholder format for capability IDs: TEMP-[DOMAIN]-[NAME]-####
4. Document domain discovery notes (which mature domain this might belong to)
5. **NOTE**: Final domain.req.md placement happens after human approval

**When Working with Existing NewConcept Requirements:**
1. Update existing `/Documentation/ContextEngineering/NewConcepts/*.concept.req.md`
2. Maintain placeholder ID consistency
3. Track which mature domains capabilities might map to
4. Prepare domain assignment proposal for human approval

**Tracking Interaction Pattern:**
- **Standard Concepts**: ADD or UPDATE capability specs in domain.req.md and digital.req.md files
- **NewConcepts**: CREATE concept.req.md, propose domain assignment to human
- **NO CENTRAL REGISTRY** - All tracking is in requirement documents
- **VALIDATE**: Ensure all capability references have corresponding req file entries

## **CURRENT CAPABILITY STATE**
**Business Capability Gap:** [Clear description of what business capability is missing, unclear, or inadequately specified in current documentation]

**Current Documentation Status:**
[Assessment of how the capability or enhancement is currently documented, including gaps and inconsistencies]

**Existing Documentation to Analyze:**
The AI MUST review these documents to understand current state:
- **Domain Documents** (*.domain.md): Contains business rules, bounded contexts, and domain logic
- **Digital Documents** (*.digital.md): Contains user journeys, UI/UX requirements, and capability specifications
- Look for gaps in: Business rules, integration patterns, user journeys, capability definitions

**Specification Pain Points:**
- [Documentation gap #1 that prevents clear implementation]
- [Specification inconsistency #2 that causes confusion]
- [Missing integration pattern #3 that blocks implementation]

**Business Impact:**
- **Capability Development**: [How specification gaps affect new capability development]
- **Integration Clarity**: [How unclear specifications affect system integration]
- **Implementation Efficiency**: [How documentation quality affects development velocity]

## **DESIRED SPECIFICATION STATE**
**Capability Specification Objective:** [Clear statement of what the enhanced documentation will enable]

**Documentation Enhancement Goals:**
- [ ] [Specific specification improvement #1 with measurable outcome]
- [ ] [Clear integration pattern #2 with defined interfaces]
- [ ] [Business rule clarification #3 with implementation guidance]

**Business Capability Improvements:**
[How these specification enhancements will improve business capability delivery and system integration]

**Implementation Enablement:**
[How the improved specifications will accelerate and clarify implementation efforts]

## **FEATURE SPECIFICATIONS TO BE ADDED**

### Feature Implementation Overview
- **Total New Features**: [Number] features to be added to documentation
- **Documentation Impact**: [Number] documents to be enhanced/created
- **Build Sequence**: Features organized by technical dependencies, not business priority
- **Target Completion**: [Date]

### Feature Detailed Specifications

#### **Feature [Build Order]: [Feature Name]**
**Implementation Status**: [x] Not Implemented (Will be marked as such in target document)
**Target Document**: [Document Title](filename.domain.req.md) - Section [X.Y]
**Document Format**: MUST follow domain.req.md template structure
**Future Implementation ICP**: "Pending" (To be created later)

**Business Description:**
[Detailed description of what business capability this feature will provide and why it's valuable to users/stakeholders]

**Source Requirements:**
The AI MUST reference these documents when specifying this feature:
- **Domain Rules**: [Specific sections in domain.md that define business rules]
- **Digital Capabilities**: [Specific sections in digital.md that define user capabilities]
- **Integration Points**: [Related features in other domains that this connects to]

**Technical Scope:**
[Specific technical work that will be required to implement this feature when an implementation ICP is created]

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
[Same structure repeated for each new feature...]

## **DOCUMENT FORMAT REQUIREMENTS**

**CRITICAL**: Codification ICPs MUST create or enhance documents following Context Engineering templates.

### **Required Document Formats**
- **Domain Requirements**: All architecture and business specifications MUST use `filename.domain.req.md` format
- **Digital Capabilities**: User-facing workflows MUST use `filename.digital.req.md` format  
- **Platform Requirements**: Cross-cutting standards MUST use `filename.prp.md` format
- **Template Compliance**: ALL documents MUST follow their respective template structure exactly

### **Document Creation Rules**
1. **Check Template**: Always read appropriate template before creating documents
2. **Follow Structure**: Maintain exact template section structure and format
3. **Business Rules**: Include complete business rules section with implementation status
4. **Integration Points**: Specify all system integration requirements
5. **Validation**: Each document must pass template compliance validation

### **Template Locations**
- Domain Requirements: `Documentation/ContextEngineering/Templates/template.domain.req.md`
- Digital Capabilities: `Documentation/ContextEngineering/Templates/template.digital.req.md`
- Platform Requirements: `Documentation/ContextEngineering/Templates/template.prp.md`

## **DOCUMENTATION ENHANCEMENT STRATEGY**

### **Document Modification Approach**
[High-level approach for enhancing documentation - systematic capability analysis, cross-domain integration clarification, new architectural pattern introduction]

### **Document Enhancement Breakdown**

#### **Documents to be Enhanced:**

**[Document Title 1]** ([filename.extension.md])
- **Enhancement Type**: [Capability Extension | Integration Clarification | Architectural Update]
- **Sections Affected**: [Specific sections requiring modification]
- **Enhancement Description**: [Business capability improvements being documented]
- **New Features to Add**: [List of features from above that will be added to this document]
- [ ] **Completed**

**[Document Title 2]** ([filename.extension.md])  
- **Enhancement Type**: [Type of enhancement]
- **Sections Affected**: [Sections being modified]
- **Enhancement Description**: [Capability improvements]
- **New Features to Add**: [Features for implementation tracking]
- [ ] **Completed**

#### **New Documents to be Created:**

**[New Document Title]** ([filename.extension.md])
- **Document Type**: [Domain Capability | Digital Capability | PRP]
- **Business Purpose**: [What business capability this document will specify]
- **Scope and Boundaries**: [Clear boundaries of what this capability includes/excludes]
- **Key Integration Points**: [How this connects to existing capabilities]
- **Features to Include**: [List of features from above that will be specified in this new document]
- [ ] **Created**

## **CROSS-DOCUMENT CONSISTENCY**

### **Terminology and Language Alignment**
**Ubiquitous Language Updates:**
- Standardize [Business Term 1] usage across [List of affected documents]
- Align [Business Concept 2] definitions between [Domain A] and [Domain B]
- Establish consistent [Integration Pattern] terminology

**Cross-Reference Updates:**
- Update references from [Old Document Structure] to [New Document Structure]
- Add cross-references between [Capability 1] and [Capability 2] for [Business Process]
- Establish reference patterns for [Integration Type] across all affected documents

### **Integration Pattern Consistency**
**Event Contract Standardization:**
- Ensure [Event Type] follows enterprise event schema across all domains
- Standardize [Business Process] event patterns between [Domain A] and [Domain B]

**API Pattern Alignment:**
- Align [API Pattern] implementation across [Frontend Journey] and [Backend Domain]
- Standardize [Data Exchange Pattern] for [Business Capability]

## **DOCUMENTATION ENHANCEMENT PHASES**

<!-- 
TEMPLATE INSTRUCTION:
- Documentation phases should be smaller than implementation phases
- Each phase should cover one logical area of documentation
- Steps should focus on specific documentation sections
- Size by content scope, not time
-->

### **AI EXECUTION REQUIREMENTS FOR DOCUMENTATION**
<!-- CRITICAL: AI must follow this sequence for EVERY documentation step -->

#### **📋 STREAMLINED WORKFLOW PROTOCOL (v5.0.1)**

**SINGLE APPROVAL GATE**: This template uses ONE comprehensive approval gate after planning, then continuous execution with progress tracking.

#### **Phase 1: Analysis & Planning (Complete Together)**
The AI will complete both analysis and planning before the single approval gate:

**ANALYSIS ACTIVITIES**:
- Read all referenced *.domain.md and *.digital.md files completely
- Note all existing feature specifications
- Identify gaps and inconsistencies
- Map cross-references between documents

**PLANNING ACTIVITIES**:
- List missing business rules to add
- List incomplete capabilities to expand
- List integration patterns to clarify
- Identify sections needing updates
- Plan cross-reference updates
- Generate complete change plan with specific file modifications

**OUTPUT**: Comprehensive change plan showing exactly what will be modified in which documents

#### **🛑 SINGLE APPROVAL GATE 🛑**
After planning is complete, AI MUST present comprehensive change plan and STOP for approval:
- Show all documents that will be modified
- Show specific sections and changes for each document
- Show features that will be added
- Show cross-references that will be updated
- Wait for explicit human approval to proceed

#### **Phase 2: Continuous Execution (After Approval)**
After receiving approval, AI executes all planned changes with progress logging:

**EXECUTION ACTIVITIES** (continuous, no stops between steps):
- Update all planned documents
- Add business rules to domain.md files
- Add capability details to digital.md files
- Mark features as "Not Implemented"
- Add ICP references for future work
- Update all cross-references

**VALIDATION ACTIVITIES** (continuous):
- Verify all cross-references resolve correctly
- Confirm terminology consistency
- Ensure features properly marked with status
- Validate integration patterns align
- Check for contradictions

**PROGRESS LOGGING** (required throughout):
- Log after each document modified
- Log after each validation check
- Update todo list with progress
- Track completion percentage

#### **Documentation Quality Checks**
Before marking any documentation step complete:
- [ ] All features include complete specifications
- [ ] Build order dependencies are logical
- [ ] Integration requirements are clear
- [ ] Cross-references are valid
- [ ] Terminology is consistent
- [ ] No contradictions with existing docs

### **Phase 1: Document Analysis and Planning**
**Objective**: Analyze current documentation and plan enhancements
**Scope**: [Number of documents to review and sections to analyze]
**Review Focus**: Understanding current state and planning changes

<!-- RATIONALE: Codification phase is DOCUMENTATION ONLY. Tool restrictions prevent accidental
     code implementation or premature commits. Phase boundary violations in v4.0 caused
     implementation work during specification phase. Explicit ALLOWED/PROHIBITED lists eliminate ambiguity. -->

**🔧 ALLOWED TOOLS FOR PHASE 1 (Documentation Analysis)**:
- ✅ Read - Reading existing requirement documents
- ✅ Grep - Searching for patterns in documentation
- ✅ Glob - Finding documentation files
- ✅ Write - Creating new requirement document sections
- ✅ Edit - Modifying existing requirement documents

**❌ PROHIBITED TOOLS FOR PHASE 1**:
- ❌ Code implementation (any Write/Edit in code directories)
- ❌ Test execution (Bash commands that run tests)
- ❌ Build commands (dotnet build, etc.)
- ❌ Git commits - Only commit when human explicitly requests
- ❌ Deployment operations

**Step 1.1: Document Review**
- **What**: Review all documents listed in enhancement breakdown
- **Why**: Understand current state and identify specific enhancement points
- **Dependencies**: Access to all current documentation
- **Estimated Subtasks**: 7 subtasks (includes expert coordination initiation)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 1.1 Execution Roadmap
1. Subtask A: Domain document analysis
2. Subtask B: Expert coordination initiation (v4.0.0)
3. Subtask C: Digital document analysis
4. Subtask D: Gap identification
5. Subtask E: Cross-reference mapping
6. Subtask F: Analysis report generation
7. Subtask G: Validation checklist
Total: 7 subtasks to complete for this step
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Domain Document Analysis**
```bash
echo "[Step 1.1] Starting domain document analysis"
# Open each domain.md file and read completely
```
- [ ] Open [Document1.domain.md]
- [ ] Read all sections, note existing features
- [ ] Identify missing business rules
- [ ] Document gaps in domain coverage
- [ ] **LOG**: "Analyzed domain.md: [X] features found, [Y] gaps identified"

**SUBTASK B: EXPERT COORDINATION INITIATION** (v4.0.0 - Expert team setup)
```bash
# ACTION: Initiate Virtual Expert Team coordination for this step
```
- [ ] Analyze step complexity and concept characteristics for expert selection
- [ ] Invoke expert-select-workflow MCP tool with concept specification context
- [ ] Initiate agent-coordinate-handoff for selected experts based on concept type
- [ ] Establish multi-agent conversation for concept validation coordination
- [ ] Sync concept context with expert team using context-sync workflows
- [ ] Validate expert selection accuracy (target: ≥95%)
**PROGRESS UPDATE**: "Expert coordination initiated with [X] experts for concept specification"

**SUBTASK C: Digital Document Analysis**
```bash
echo "[Step 1.1] Analyzing digital capability documents"
# Open each digital.md file and read completely
```
- [ ] Open [Document2.digital.md]
- [ ] Read all capability specifications
- [ ] Note incomplete user journeys
- [ ] Identify missing UI/UX details
- [ ] **LOG**: "Analyzed digital.md: [X] capabilities documented, [Y] incomplete"

**SUBTASK D: Gap Identification**
```bash
echo "[Step 1.1] Identifying documentation gaps"
# Compare requirements against current documentation
```
- [ ] List all missing business rules
- [ ] List all incomplete capabilities
- [ ] List unclear integration points
- [ ] Prioritize gaps by importance
- [ ] **LOG**: "Identified [X] critical gaps, [Y] minor gaps"

**SUBTASK E: Cross-Reference Mapping**
```bash
echo "[Step 1.1] Mapping cross-references"
# Trace all document interconnections
```
- [ ] Map domain → digital references
- [ ] Map digital → domain references
- [ ] Identify broken references
- [ ] Note terminology inconsistencies
- [ ] **LOG**: "Mapped [X] cross-references, [Y] broken"

**SUBTASK F: Analysis Report Generation**
```bash
echo "[Step 1.1] Generating analysis report"
# Compile findings into structured report
```
- [ ] Summarize gaps by category
- [ ] List sections needing updates
- [ ] Create enhancement priority list
- [ ] Document quick wins vs complex changes
- [ ] **LOG**: "Report complete: [X] enhancements planned"

**SUBTASK G: Validation Checklist**
- [ ] All target documents analyzed
- [ ] All gaps documented
- [ ] Cross-reference map complete
- [ ] Enhancement plan created
- [ ] Ready for human review

**AI Execution Checklist (MUST COMPLETE ALL):**
- [ ] ✅ Read each target document completely
- [ ] ✅ Identified exact sections needing modification
- [ ] ✅ Mapped all cross-references between documents
- [ ] ✅ Documented current terminology patterns
- [ ] ✅ Listed all features to be added
- [ ] ✅ Created priority-ordered enhancement plan
- [ ] ✅ All progress updates logged
- [ ] ✅ Todo list updated
- [ ] ✅ Expert coordination completed with recommendations (v4.0.0)
- [ ] ✅ Expert consensus achieved for concept specifications (≥80% target)
- [ ] ✅ **PROCEED TO STEP 1.2** - Continue to enhancement planning (no stop here)

**Step 1.1 Analysis Summary:**
```markdown
## Step 1.1 Document Analysis Complete
**Step Status**: COMPLETE ✅
**Subtasks Completed**: 10/10
**Note**: Proceeding directly to Step 1.2 (no stop between steps)

### Documents Analyzed
**Domain Documents**: [List with sections]
**Digital Documents**: [List with sections]
**Related Documents**: [List]

### Gaps Identified
**Critical Gaps**: [X] items
- [Gap 1]: [Description and impact]
- [Gap 2]: [Description and impact]

**Minor Gaps**: [Y] items
- [List key minor gaps]

### Enhancement Plan
**Sections to Update**: [X] sections across [Y] documents
**New Features to Document**: [Count and brief list]
**Cross-References to Fix**: [Count]
**Terminology to Standardize**: [List key terms]

### Expert Recommendations (v4.0.0)
**Expert Consensus Level**: [X]% (Target: ≥80%)
**Primary Expert Insights**: [Brief summary of key expert recommendations]
**Architecture Considerations**: [Expert guidance on architectural aspects]
**Domain Compliance**: [Context Engineering or other domain expert validation]
**Risk Assessment**: [Expert-identified risks and mitigation recommendations]

### Next Step
**Step 1.2**: Enhancement Planning (proceed directly - no stop)
**Dependencies**: Step 1.1 complete ✅
```

**Step 1.2: Enhancement Planning**
- **What**: Create detailed plan for each document enhancement
- **Why**: Ensure systematic and complete enhancement of specifications
- **Dependencies**: Completed document analysis
- **Deliverables**: Detailed enhancement plan with specific changes per document
- **Success Criteria**:
  - [ ] Enhancement plan covers all identified gaps
  - [ ] New features properly specify dependencies and build order
  - [ ] Integration patterns maintain consistency across documents
  - [ ] Business rules and digital capabilities are fully specified
- **AI Execution Instructions**:
  - Plan exact text additions/modifications for each document
  - Ensure domain.md updates include all business rules and constraints
  - Ensure digital.md updates include complete capability specifications
  - Ensure new features include all required specification elements
  - Verify build order logic prevents circular dependencies
  - Map which business rules affect which capabilities
- **Validation Commands**:
  - Review enhancement plan for completeness
  - Validate that all cross-references will remain accurate
  - Ensure domain and digital documents will remain aligned

**Phase 1 Completion - Present Complete Change Plan:**

<!-- RATIONALE: Single comprehensive approval gate (v5.0.1) - AI presents complete change plan
     showing ALL documents to be modified and ALL changes to be made. This replaces multiple
     stop gates with one efficient approval point. Human reviews entire plan before any
     execution begins. -->

╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║                  🛑 COMPREHENSIVE CHANGE PLAN - APPROVAL REQUIRED 🛑             ║
║                                                                                  ║
║  ANALYSIS & PLANNING COMPLETE - Ready for your review                           ║
║                                                                                  ║
║  COMPLETED ACTIVITIES:                                                           ║
║  ✅ Document Analysis ([X] documents reviewed)                                   ║
║  ✅ Expert Coordination (consensus: [X]% - if enabled)                           ║
║  ✅ Gap Identification ([Y] gaps documented)                                     ║
║  ✅ Enhancement Planning (complete change plan ready below)                      ║
║                                                                                  ║
║  📋 COMPLETE CHANGE PLAN (Review Below):                                         ║
║  • Documents to be modified: [List all files]                                   ║
║  • Sections to be updated: [List all sections]                                  ║
║  • Features to be added: [Count] total features                                 ║
║  • Cross-references to update: [Count] references                               ║
║  • Business rules to add: [Count] rules                                         ║
║  • Digital capabilities to enhance: [Count] capabilities                        ║
║                                                                                  ║
║  AFTER APPROVAL, AI WILL:                                                        ║
║  → Execute all planned document updates (continuous, with progress logging)     ║
║  → Validate all changes for consistency                                         ║
║  → Generate Implementation ICP                                                  ║
║  → Complete document lifecycle                                                  ║
║                                                                                  ║
║  ⚠️ IMPORTANT: Review the detailed change plan below before approving            ║
║                                                                                  ║
║  TO APPROVE AND PROCEED: Type "continue" or "approved"                          ║
║  TO MODIFY PLAN: Provide feedback and AI will revise                            ║
║  TO CANCEL: Type "cancel" or "stop"                                             ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

**DETAILED CHANGE PLAN FOR REVIEW:**

### Documents to be Modified
1. **[Document1.domain.req.md]**
   - **Section X.Y**: Add [specific content]
   - **Section X.Z**: Update [specific content]
   - **New Features**: [List feature names and IDs]
   - **Cross-References**: Update references to [other documents]

2. **[Document2.digital.req.md]**
   - **Section A.B**: Add [specific content]
   - **New Capabilities**: [List capability names]
   - **Integration Updates**: [List integration changes]

[Continue for all documents...]

### New Features Being Specified
- Feature 1: [Name] - Status: Not Implemented - Location: [Document Section]
- Feature 2: [Name] - Status: Not Implemented - Location: [Document Section]
[Continue for all features...]

### Cross-Reference Updates
- Update references from [Old] to [New]
- Add new cross-references between [Doc A] and [Doc B]
[Continue for all cross-reference changes...]

### Expert Recommendations (if enabled)
- [Key expert insights being incorporated]
- [Architectural considerations]
- [Risk mitigation strategies]

---

**🛑 WAITING FOR YOUR APPROVAL TO PROCEED 🛑**

Type "continue" to approve this plan and begin execution, or provide feedback to revise.

---
---
---

### **Phase 2: Document Enhancement Execution**
**Objective**: Execute planned enhancements to target documents
**Execution Mode**: Continuous execution with progress logging (no stops until complete)

**AI Execution Protocol**:
- Execute all steps continuously after receiving approval from Phase 1
- Log progress after each document modification
- Update todo list to track completion
- NO stops between steps - proceed systematically through all planned changes

**Detailed Steps:**
**Step 2.1: Primary Document Updates**
- **What**: Update main target documents with new features and enhancements
- **Why**: Add specified business capabilities to documentation
- **Dependencies**: Completed enhancement planning
- **Deliverables**: Updated documents with new feature specifications
- **Success Criteria**:
  - [ ] All planned features added with complete specifications
  - [ ] Build order logic maintains dependency relationships
  - [ ] Integration requirements clearly specified
- **AI Execution Instructions**:
  - Add each new feature using the detailed specification format
  - Ensure all features marked "Not Implemented" 
  - Maintain consistent terminology throughout updates
  - Preserve existing document structure and formatting
- **Validation Commands**:
  - Verify all new features include required specification elements
  - Check that build order numbers are logical and dependency-based

**Step 2.2: Cross-Reference Updates**
- **What**: Update all cross-references across affected documents
- **Why**: Maintain referential integrity across the entire documentation system
- **Dependencies**: Completed primary document updates
- **Deliverables**: All cross-references updated and validated
- **Success Criteria**:
  - [ ] All cross-references point to correct documents and sections
  - [ ] Integration pattern references remain consistent
  - [ ] No broken or outdated references exist
- **AI Execution Instructions**:
  - Scan ALL documents that reference modified sections
  - Update cross-references to maintain accuracy
  - Verify terminology consistency across related documents
  - Check integration pattern alignment across capabilities
- **Validation Commands**:
  - Validate all cross-references resolve correctly
  - Confirm integration patterns align across document boundaries

### **Phase 3: Validation and Finalization**
**Objective**: Validate enhancements and ensure system consistency
**Execution Mode**: Continuous validation with comprehensive final review

**AI Execution Protocol**:
- Continue systematic validation after Phase 2 completion
- No stops - validate all changes for consistency
- Generate comprehensive completion summary
- Prepare for Phase 4 (Implementation ICP generation)

**Detailed Steps:**
**Step 3.1: Consistency Validation**
- **What**: Comprehensive validation of documentation consistency
- **Why**: Ensure the enhanced documentation forms a coherent system
- **Dependencies**: Completed cross-reference updates
- **Deliverables**: Validation report confirming documentation consistency
- **Success Criteria**:
  - [ ] All terminology usage consistent across documents
  - [ ] Integration patterns align across capability boundaries
  - [ ] Build sequences logical and free of circular dependencies
- **AI Execution Instructions**:
  - Verify feature numbering sequences remain logical
  - Check that integration contracts align across documents
  - Validate that new features include proper dependency specifications
  - Ensure all new features marked "Not Implemented" with build order
- **Validation Commands**:
  - Run comprehensive cross-reference validation
  - Verify integration pattern consistency

**Step 3.2: Final Documentation Review**
- **What**: Final review and cleanup of all enhanced documentation
- **Why**: Ensure professional quality and completeness
- **Dependencies**: Completed consistency validation
- **Deliverables**: Final, publication-ready enhanced documentation
- **Success Criteria**:
  - [ ] All enhancements completed according to plan
  - [ ] Documentation meets quality standards
  - [ ] All cross-references and integration patterns validated
- **AI Execution Instructions**:
  - Review all modified documents for quality and completeness
  - Ensure consistent formatting and structure
  - Verify all enhancement objectives have been met
  - Update document metadata and change history
- **Validation Commands**:
  - Final quality review of all enhanced documents
  - Confirmation that all planned enhancements are complete

### **Phase 4: Implementation ICP Generation**
**Objective**: Generate detailed Implementation ICP based on refined concept specifications

**CRITICAL**: This phase is MANDATORY for all Concept ICPs to ensure perfect alignment between concept evolution and implementation planning.

**Detailed Steps:**
**Step 4.1: Implementation Requirements Analysis**
- **What**: Analyze final concept specifications to determine implementation approach
- **Why**: Ensure Implementation ICP reflects all concept refinements and discoveries
- **Dependencies**: Completed concept documentation validation
- **Deliverables**: Implementation requirements analysis and technical approach specification
- **Success Criteria**:
  - [ ] All concept specifications translated to implementation requirements
  - [ ] Technical approach identified for each major concept component
  - [ ] Integration points and dependencies clearly defined
  - [ ] Implementation phases logically sequenced
- **AI Execution Instructions**:
  - Review all concept documentation created/modified during this ICP
  - Extract technical implementation requirements from business specifications
  - Identify cross-domain integration points requiring coordination
  - Determine appropriate implementation phases based on technical dependencies
  - Consider NewConcepts domain discovery requirements if applicable
- **Analysis Questions**:
  - What technical components need to be built to realize this concept?
  - Which existing systems need integration or enhancement?
  - What are the critical technical dependencies between components?
  - How should implementation be phased to manage risk and validate assumptions?

**Step 4.2: Implementation ICP Generation**
- **What**: Create complete Implementation ICP document using implementation-icp-template.icp.md
- **Why**: Provide detailed, actionable implementation plan perfectly aligned with refined concept
- **Dependencies**: Completed implementation requirements analysis
- **Deliverables**: Complete Implementation ICP ready for human review and execution

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Template Preparation**
```bash
echo "[Step 4.2] Preparing Implementation ICP template"
# Copy template and prepare for customization
```
- [ ] Copy implementation-icp-template.icp.md
- [ ] Remove all template instructions
- [ ] Set up document metadata
- [ ] Create file with appropriate name
- [ ] **LOG**: "Template prepared: [filename]"

**SUBTASK B: Header and Overview Creation**
```bash
echo "[Step 4.2] Creating ICP overview"
# Fill in overview and metadata sections
```
- [ ] Write ICP overview (2-3 paragraphs)
- [ ] Set implementation scope and complexity
- [ ] List all related documentation
- [ ] Add capability registry references
- [ ] **LOG**: "Overview complete with [X] document references"

**SUBTASK C: Phase and Step Generation**
```bash
echo "[Step 4.2] Generating implementation phases"
# Create detailed implementation phases
```
- [ ] Create Phase 1 with 3-5 steps
- [ ] Add pre-digested execution plans for each step
- [ ] Include specific validation commands
- [ ] Add error handling protocols
- [ ] Create remaining phases (2-4 total)
- [ ] **LOG**: "Generated [X] phases with [Y] total steps"

**SUBTASK D: Testing Strategy Definition**
```bash
echo "[Step 4.2] Defining testing strategy"
# Create comprehensive test approach
```
- [ ] Define unit test requirements (>80% coverage)
- [ ] Specify integration test scenarios
- [ ] Add BDD test cases if applicable
- [ ] Include validation commands for each
- [ ] **LOG**: "Testing strategy includes [X] test types"

**SUBTASK E: Special Sections Addition**
```bash
echo "[Step 4.2] Adding special sections"
# Add NewConcepts or other special handling
```
- [ ] Add NewConcepts section if applicable
- [ ] Include domain discovery process
- [ ] Add human approval gates
- [ ] Include rollback procedures
- [ ] **LOG**: "Added [list special sections]"

**SUBTASK F: Final Validation**
```bash
echo "[Step 4.2] Validating Implementation ICP"
# Ensure ICP is complete and executable
```
- [ ] All placeholders replaced
- [ ] All steps have validation criteria
- [ ] Build/test commands are specific
- [ ] Registry instructions are clear
- [ ] Stop points are clearly marked
- [ ] **LOG**: "ICP validation complete - ready for review"

**Success Criteria Checklist:**
- [ ] ✅ Implementation ICP created using standard template format
- [ ] ✅ All phases have pre-digested execution plans
- [ ] ✅ Each step includes error handling for build/test failures
- [ ] ✅ Registry handling correctly specified
- [ ] ✅ Cross-references to concept docs accurate
- [ ] ✅ Testing requires full solution build/test pass
- [ ] ✅ Human approval gates appropriately placed
- [ ] ✅ Todo list tracking integrated
- [ ] 🛑 **STOP HERE** - ICP ready for human review

**Template Customization Checklist:**
- [ ] **ICP Title**: "[Concept Name] - Implementation"
- [ ] **Related Documentation**: All concept documents referenced
- [ ] **Technical Architecture**: Based on Step 4.1 analysis
- [ ] **Implementation Phases**: Logical dependency order
- [ ] **Testing Strategy**: Comprehensive coverage
- [ ] **Validation**: All tests must pass, no exceptions

**Step 4.3: Implementation ICP Validation and Handoff**
- **What**: Validate generated Implementation ICP and prepare for human approval
- **Why**: Ensure Implementation ICP is complete, accurate, and ready for execution
- **Dependencies**: Completed Implementation ICP generation
- **Deliverables**: Validated Implementation ICP with handoff summary for human review
- **Success Criteria**:
  - [ ] Implementation ICP passes completeness validation
  - [ ] All concept requirements are addressed in implementation plan
  - [ ] Implementation phases are logical and achievable
  - [ ] Human approval requirements are clearly specified
- **AI Execution Instructions**:
  - Review generated Implementation ICP for completeness against concept specifications
  - Validate that all technical components identified in analysis are included
  - Ensure implementation phases follow logical dependency order
  - Verify that testing and validation steps are comprehensive
  - Check that registry and documentation update instructions are correct
- **Validation Commands**:
  - Cross-check Implementation ICP against all concept documentation
  - Verify all placeholders have been replaced with specific content
  - Confirm implementation phases align with technical dependencies
- **Handoff Summary Template**:
```markdown
## Concept ICP Completion - Implementation Ready

### Concept Work Completed
- **Concept Documentation**: [List all documents created/modified]
- **Registry Updates**: [List capability additions/changes]
- **Key Concept Refinements**: [Major changes from original concept]

### Generated Implementation ICP
- **File**: [Path to generated Implementation ICP]
- **Implementation Phases**: [Number of phases and brief description]
- **Estimated Complexity**: [ ] Simple | [ ] Moderate | [ ] Complex
- **Key Technical Dependencies**: [List major dependencies]
- **Domain Scope**: [Single domain vs Multi-domain implementation]

### Ready for Implementation
- [ ] Implementation ICP is complete and validated
- [ ] All concept specifications are addressed
- [ ] Implementation approach is technically sound
- [ ] Human approval gates are appropriately placed

**Next Step**: Human review and approval of Implementation ICP, then execution.
```

### **Phase 5: Document Lifecycle Completion**
**Objective**: Systematically archive completed documents and properly place resulting domain/digital documents
**CRITICAL**: This phase ensures proper document lifecycle management and prevents documentation fragmentation

**Detailed Steps:**

#### **Step 5.1: Document Archival with Timestamping**
**What**: Archive all completed concept documents with proper timestamping
**Why**: Maintain historical record and clean up active workspace
**Dependencies**: Phase 4 completion and human approval
**Estimated Subtasks**: 6 subtasks (~25-30 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 5.1 Execution Roadmap
1. Subtask A: Generate timestamp and prepare archival folders
2. Subtask B: Archive source concept.req document
3. Subtask C: Archive this codification.icp document
4. Subtask D: Update archival index and cross-references
5. Subtask E: Validate archival integrity
6. Subtask F: Generate archival summary
Total: 6 subtasks to complete for document archival
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Timestamp Generation and Folder Preparation**
```bash
echo "[Step 5.1] Generating timestamp and preparing archival folders"
# Generate current timestamp in YYYYMMDD-HHMM format
```
- [ ] Generate current timestamp: `YYYYMMDD-HHMM` format
- [ ] Create `/Documentation/ContextEngineering/NewConcepts/Implemented/` folder if it doesn't exist
- [ ] Verify folder permissions and accessibility
- [ ] Document timestamp for use in filenames
- [ ] **LOG**: "Timestamp generated: [YYYYMMDD-HHMM], archival folder ready"

**SUBTASK B: Archive Source Concept Document**
```bash
echo "[Step 5.1] Archiving source concept.req document"
# Move the original concept.req file to Implemented folder with timestamp
```
- [ ] Locate source concept.req document: `[concept-name].concept.req.md`
- [ ] Move to: `Implemented/[YYYYMMDD-HHMM]-[concept-name].concept.req.md`
- [ ] Verify file integrity after move
- [ ] Update any references pointing to original location
- [ ] **LOG**: "Concept.req archived: [filename]"

**SUBTASK C: Archive This Codification ICP Document**
```bash
echo "[Step 5.1] Archiving codification.icp document"
# Move this ICP file to Implemented folder with timestamp
```
- [ ] Move this file to: `Implemented/[YYYYMMDD-HHMM]-[concept-name].codification.icp.md`
- [ ] Add completion status and date to archived file metadata
- [ ] Update status field to "Complete" in archived file
- [ ] Verify file integrity after move
- [ ] **LOG**: "Codification.icp archived: [filename]"

**SUBTASK D: Update Archival Index and References**
```bash
echo "[Step 5.1] Updating archival index and cross-references"
# Update the Implemented/README.md with new entries
```
- [ ] Open `Implemented/README.md`
- [ ] Add entry for archived concept.req with completion summary
- [ ] Add entry for archived codification.icp with Phase 4 summary
- [ ] Update any cross-references from other documents
- [ ] Add forward references to resulting domain/digital documents
- [ ] **LOG**: "Archival index updated with [X] new entries"

**SUBTASK E: Archival Integrity Validation**
```bash
echo "[Step 5.1] Validating archival integrity"
# Verify all archived files are accessible and properly formatted
```
- [ ] Verify archived concept.req is readable and complete
- [ ] Verify archived codification.icp is readable and complete
- [ ] Check that all cross-references resolve correctly
- [ ] Ensure no broken links remain
- [ ] Confirm original files are no longer in active workspace
- [ ] **LOG**: "Archival validation complete - all files accessible"

**SUBTASK F: Generate Archival Summary**
- [ ] Count total documents archived
- [ ] List archived filenames with timestamps
- [ ] Note any issues encountered during archival
- [ ] Update todo list - mark this step as "completed"
- [ ] Prepare summary for human confirmation
- [ ] **LOG**: "Archival summary generated - [X] documents archived"

#### **Step 5.2: Domain Document Placement Analysis**
**What**: Analyze project structure and determine optimal placement for resulting domain/digital documents
**Why**: Ensure documents are placed in locations that align with code namespaces and existing documentation
**Dependencies**: Step 5.1 completion
**Estimated Subtasks**: 8 subtasks (~35-45 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 5.2 Execution Roadmap
1. Subtask A: Analyze project structure and namespaces
2. Subtask B: Scan for existing related documentation
3. Subtask C: Perform merge vs create analysis
4. Subtask D: Generate placement proposal
5. Subtask E: Present proposal for human approval
6. Subtask F: Execute approved placement strategy
7. Subtask G: Validate document accessibility
8. Subtask H: Update cross-references and indexes
Total: 8 subtasks to complete for document placement
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Project Structure Analysis**
```bash
echo "[Step 5.2] Analyzing project structure and namespaces"
# Scan solution and project files to understand namespace organization
```
- [ ] Scan `/mnt/m/projects/lucidwonks/Lucidwonks.sln` for project structure
- [ ] Identify primary project/namespace affected by this concept
- [ ] Map namespace to Documentation directory structure
- [ ] Note existing `/Documentation/[Project]/[Namespace]/` patterns
- [ ] **LOG**: "Project analysis complete - primary namespace: [namespace]"

**SUBTASK B: Existing Documentation Scan**
```bash
echo "[Step 5.2] Scanning for existing related documentation"
# Find existing domain.md and digital.md files that might be related
```
- [ ] Search for existing `*.domain.md` files in target area
- [ ] Search for existing `*.digital.md` files in target area
- [ ] Analyze content for conceptual overlap using keyword matching
- [ ] Identify documents with >70% conceptual similarity
- [ ] **LOG**: "Documentation scan complete - found [X] potentially related documents"

**SUBTASK C: Merge vs Create Analysis**
```bash
echo "[Step 5.2] Performing merge vs create analysis"
# Determine whether to merge with existing docs or create new ones
```
- [ ] For each related document, calculate conceptual overlap percentage
- [ ] Apply decision rules:
  - >70% overlap → MERGE (enhance existing document)
  - 30-70% overlap → EVALUATE (case-by-case decision)
  - <30% overlap → CREATE NEW (separate document)
- [ ] Document reasoning for each decision
- [ ] Identify backup strategies for each option
- [ ] **LOG**: "Analysis complete - [X] merge opportunities, [Y] new documents needed"

**SUBTASK D: Generate Placement Proposal**
```bash
echo "[Step 5.2] Generating placement proposal"
# Create detailed proposal for human review
```
- [ ] Create structured proposal document
- [ ] List all resulting domain.req and digital.req documents
- [ ] Specify target locations based on namespace analysis
- [ ] Define merge strategies for existing documents
- [ ] Identify new directories that need creation
- [ ] **LOG**: "Placement proposal generated for human review"

**SUBTASK E: Present Proposal for Human Approval**
```markdown
## Document Placement Proposal - Approval Required

### Analysis Summary
**Primary Namespace Affected**: [Detected namespace]
**Target Documentation Area**: `/Documentation/[Project]/[Namespace]/`
**Documents to Place**: [Count] domain.req + [Count] digital.req files

### Existing Documents Analysis
[For each existing document found:]
**[existing-document.domain.md]**:
- **Location**: `/Documentation/[Path]/[file].md`
- **Conceptual Overlap**: [X]% with [concept aspects]
- **Recommended Action**: [ ] Merge | [ ] Keep Separate
- **Merge Strategy**: [If merging: how concepts will be integrated]
- **Backup Plan**: Original saved as `[file].backup.[timestamp].md`

### New Documents to Create
[For each new document needed:]
**[new-document.domain.md]**:
- **Target Location**: `/Documentation/[Path]/[file].md`
- **Justification**: [Why new document needed vs merging]
- **Content Scope**: [What will be documented]

### Directory Creation Required
- [ ] Directory exists: `/Documentation/[Path]/`
- [ ] Need to create: [List new directories]
- [ ] Parent directories: [Verify parent structure]

### Integration Strategy
- **Cross-References**: [How new/merged docs will reference existing docs]
- **Index Updates**: [Which index files need updating]
- **Terminology Alignment**: [Key terms to standardize across documents]

**Approve this placement strategy? [Wait for human Y/N response]**
```

**SUBTASK F: Execute Approved Placement Strategy**
```bash
echo "[Step 5.2] Executing approved placement strategy"
# Only execute after receiving human approval
```
- [ ] Create required directories if approved
- [ ] Execute merge operations as approved:
  - Backup original files with timestamp
  - Intelligently merge concepts into existing documents
  - Maintain existing capability IDs and references
  - Update cross-references for consistency
- [ ] Create new documents as approved:
  - Apply appropriate templates (domain.req or digital.req)
  - Place in approved locations
  - Establish cross-references to related documents
- [ ] **LOG**: "Placement execution complete - [X] documents placed/merged"

**SUBTASK G: Document Accessibility Validation**
```bash
echo "[Step 5.2] Validating document accessibility"
# Ensure all placed documents are properly accessible
```
- [ ] Verify all new/merged documents are readable
- [ ] Test all cross-references resolve correctly
- [ ] Confirm directory structure is logical and navigable
- [ ] Validate file permissions are appropriate
- [ ] **LOG**: "Accessibility validation complete - all documents accessible"

**SUBTASK H: Update Cross-References and Indexes**
```bash
echo "[Step 5.2] Updating cross-references and indexes"
# Update all related documentation to maintain consistency
```
- [ ] Update `/Documentation/Index.md` if applicable
- [ ] Update parent directory README files
- [ ] Update capability registry with final document locations
- [ ] Scan for and update any broken cross-references
- [ ] Verify terminology consistency across affected documents
- [ ] **LOG**: "Cross-reference updates complete - documentation system consistent"

#### **Step 5.3: Lifecycle Completion Validation**
**What**: Final validation that document lifecycle completion was successful
**Why**: Ensure the context engineering system maintains integrity
**Dependencies**: Steps 5.1 and 5.2 completion
**Estimated Subtasks**: 4 subtasks (~15-20 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 5.3 Execution Roadmap
1. Subtask A: Comprehensive archival validation
2. Subtask B: Document placement verification
3. Subtask C: System consistency check
4. Subtask D: Generate completion report
Total: 4 subtasks to complete lifecycle validation
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Comprehensive Archival Validation**
```bash
echo "[Step 5.3] Performing comprehensive archival validation"
# Verify the archival process completed successfully
```
- [ ] Confirm all concept documents properly archived with timestamps
- [ ] Verify archival index is complete and accurate
- [ ] Check that original documents are no longer in active workspace
- [ ] Validate that archived documents maintain full content integrity
- [ ] **LOG**: "Archival validation successful - [X] documents properly archived"

**SUBTASK B: Document Placement Verification**
```bash
echo "[Step 5.3] Verifying document placement success"
# Ensure all domain/digital documents are properly placed
```
- [ ] Verify all domain.req files are in correct namespace-aligned locations
- [ ] Verify all digital.req files are in correct locations
- [ ] Confirm merge operations preserved existing content appropriately
- [ ] Validate new documents follow template standards
- [ ] **LOG**: "Document placement verified - [X] documents correctly positioned"

**SUBTASK C: System Consistency Check**
```bash
echo "[Step 5.3] Performing system consistency check"
# Ensure the entire documentation system remains coherent
```
- [ ] Check all cross-references resolve correctly
- [ ] Verify capability registry consistency with placed documents
- [ ] Confirm terminology usage is consistent across affected documents
- [ ] Validate that no orphaned references exist
- [ ] **LOG**: "System consistency verified - documentation system coherent"

**SUBTASK D: Generate Completion Report**
- [ ] Count total documents processed (archived + placed)
- [ ] List all archived documents with timestamps
- [ ] List all placed/merged documents with locations
- [ ] Note any issues resolved during completion
- [ ] Document lessons learned for future ICPs
- [ ] Update todo list - mark Phase 5 as "completed"
- [ ] Generate final completion summary for human
- [ ] **LOG**: "Document lifecycle completion successful - [X] total documents processed"

**Phase 5 Completion Summary:**
```markdown
## Phase 5: Document Lifecycle Completion
**Phase Status**: COMPLETE ✅
**Total Subtasks Completed**: 18/18

### Archival Results (Step 5.1)
**Documents Archived**: [X] total
- **Concept.req**: `Implemented/[timestamp]-[name].concept.req.md`
- **Codification.icp**: `Implemented/[timestamp]-[name].codification.icp.md`
**Archival Index**: Updated with completion entries

### Document Placement Results (Step 5.2)
**Documents Placed**: [X] total
- **Domain Documents**: [List with locations]
- **Digital Documents**: [List with locations]
**Merge Operations**: [X] successful merges with backups created
**New Directories Created**: [List if any]

### System Validation Results (Step 5.3)
**Cross-References**: [X] verified functional
**Capability Tracking**: Updated in domain.req.md and digital.req.md files
**Documentation Consistency**: Verified across [X] related documents

### Document Lifecycle Status
**Concept Phase**: ✅ Complete and Archived
**Implementation Phase**: ✅ Ready (Implementation ICP generated in Phase 4)
**Documentation System**: ✅ Consistent and Accessible

**Proceeding to final completion summary...**
```

## **✅ CODIFICATION ICP COMPLETION SUMMARY**

### **CODIFICATION WORK COMPLETE**
**This codification ICP has successfully delivered:**
- ✅ Complete technical specifications (with expert coordination if enabled)
- ✅ Architecture design and requirements documentation
- ✅ Feature specifications marked "Not Implemented"
- ✅ Implementation ICP generated and ready for execution
- ✅ Document lifecycle completed (archival and placement)
- ✅ All cross-references updated and validated

### **📋 COMPLETION STATISTICS**
- **Documents Modified**: [X] total
- **Features Specified**: [Y] total (all marked "Not Implemented")
- **Cross-References Updated**: [Z] total
- **Expert Consensus**: [N]% (if expert coordination enabled)
- **Implementation ICP**: Generated and ready at [file path]

### **NEXT PHASE: IMPLEMENTATION**
**The generated Implementation ICP is ready for execution when you are ready:**
- Location: [Path to implementation.icp.md]
- Contains: Detailed implementation steps with test requirements
- Approval Model: Will use same single-approval-gate model (v5.0.1)
- Execution: Will implement code based on specifications in this ICP

### **📌 REMINDER: CODIFICATION vs IMPLEMENTATION**
**This Codification ICP (completed):**
- ✅ Created/updated requirement documents (*.req.md)
- ✅ Specified features and capabilities (not implemented)
- ✅ Provided architectural guidance
- ❌ Did NOT write code or modify system files

**The Implementation ICP (ready for execution):**
- Will implement the features specified in this ICP
- Will write actual code and tests
- Will modify system files and configuration
- Will require human approval for the implementation plan

### **🏁 ICP LIFECYCLE STATUS**

**Codification Phase**: ✅ Complete
The document lifecycle is now complete. All concept documents are properly archived with timestamps, and all resulting domain/digital documents are placed in appropriate namespace-aligned locations. The Context Engineering System maintains full integrity and consistency.

## **USER-REQUESTED ROLLBACK PROCEDURES**

### **Rollback Triggers**
Rollback procedures are executed **only when explicitly requested by the user**, not automatically. Users may request rollback for various reasons including:
- Specification changes during review
- Discovery of better approaches
- Stakeholder feedback requiring different direction
- Integration conflicts discovered during enhancement

### **Rollback Procedures by Scope**

#### **Step-Level Rollback**
**When User Requests**: "Please roll back Step [X.Y]"

**Rollback Actions:**
1. **Document State Reversion**:
   - Revert all document changes made in the specified step
   - Restore previous version of affected sections
   - Remove any new features added in that step
   - Restore original cross-references

2. **Work Product Cleanup**:
   - Remove any deliverables created in the rolled-back step
   - Update completion status to reflect rollback
   - Document rollback reason and timestamp

3. **Dependency Impact Assessment**:
   - Identify any subsequent steps that depended on rolled-back work
   - Mark dependent steps as "Pending Prerequisites"
   - Update overall phase timeline if needed

#### **Phase-Level Rollback**
**When User Requests**: "Please roll back Phase [N]"

**Rollback Actions:**
1. **Complete Phase Reversion**:
   - Revert all document changes made during the entire phase
   - Restore documents to pre-phase state
   - Remove all features and enhancements added in the phase
   - Restore all original cross-references and integration patterns

2. **Phase Status Reset**:
   - Mark phase as "Not Started"
   - Clear all phase deliverables and success criteria
   - Reset step completion status within the phase

3. **Forward Impact Analysis**:
   - Assess impact on subsequent phases
   - Update overall ICP timeline and dependencies
   - Communicate rollback implications to stakeholders

#### **Full ICP Rollback**
**When User Requests**: "Please roll back this entire ICP"

**Rollback Actions:**
1. **Complete Documentation Reversion**:
   - Revert ALL documents to their pre-ICP state
   - Remove ALL features and enhancements added by this ICP
   - Restore ALL original cross-references and terminology
   - Remove any new documents created by this ICP

2. **ICP Status Reset**:
   - Mark ICP as "Cancelled" with rollback reason
   - Archive all work products with rollback documentation
   - Update related ICPs that may have depended on this work

3. **System Consistency Restoration**:
   - Ensure all documentation returns to consistent state
   - Validate all cross-references function correctly
   - Confirm integration patterns remain coherent

### **Post-Rollback Validation**
After any rollback:
1. **Consistency Check**: Verify all documentation remains consistent
2. **Reference Validation**: Confirm all cross-references function correctly  
3. **Integration Verification**: Ensure integration patterns remain coherent
4. **Dependency Update**: Update any dependent work items or ICPs

## **QUALITY ASSURANCE**

### **Specification Review Strategy**
**Business Alignment Review**: [Process for validating business stakeholder understanding and agreement]
**Technical Consistency Review**: [Approach for ensuring technical implementation clarity]
**Integration Coherence Review**: [Validation that cross-capability integrations are well-specified]
**Implementation Readiness Review**: [Assessment that specifications enable clear implementation]

### **Documentation Quality Criteria**
- [ ] Business capabilities clearly specified with measurable value
- [ ] Domain boundaries and responsibilities unambiguous
- [ ] Integration patterns specified with clear contracts
- [ ] User journeys mapped to supporting domain capabilities
- [ ] Implementation guidance sufficient for AI execution
- [ ] Cross-document references accurate and consistent

### **AI Execution Completion Checklist**
- [ ] All specified documents modified according to enhancement plan
- [ ] Cross-references updated across ALL affected documents
- [ ] Integration patterns consistent across capability boundaries
- [ ] New features properly specified with dependencies and build order
- [ ] Terminology usage consistent across entire document set
- [ ] No circular dependencies introduced in feature build sequences
- [ ] All document statuses properly updated

## **EXECUTION TRACKING**

### **Enhancement Progress Tracking**
- [ ] **Business Capability Specification**: All business capabilities clearly documented
- [ ] **Technical Integration Specification**: All integration patterns clearly defined
- [ ] **Implementation Guidance**: All features ready for implementation with clear guidance
- [ ] **Cross-Document Consistency**: All terminology and references aligned
- [ ] **Stakeholder Approval**: All required approvals obtained

### **Feature Readiness Status**
**Features Ready for Implementation:**
- [Feature Name]: Fully specified in [Document](filename.md) Section [X.Y]
- [Feature Name]: Fully specified in [Document](filename.md) Section [X.Z]

**Features Pending Dependencies:**
- [Feature Name]: Waiting for [Dependency] completion
- [Feature Name]: Requires [External System] availability

**Features Needing Further Specification:**
- [Feature Name]: [Specific gaps in specification]

---

**Document Metadata**
- **Concept Handle**: [Descriptive handle for this concept work]
- **Generated From Template**: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
- **Template Version**: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
- **Business Domain**: [Primary business domain affected]
- **Created Date**: [Date]
- **Last Updated**: [Date]
- **Status**: [ ] Draft | [ ] Review | [ ] Approved | [ ] Complete | [ ] Superseded
- **Affected Documents**: [List of documents being enhanced or created]
- **Implementation ICPs**: [Generated in Phase 4 of this ICP execution]

**Change History**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | [Date] | Initial concept specification |

---

## **AI EXECUTION SUMMARY INSTRUCTIONS**
<!-- This section is MANDATORY for AI to follow -->

### **📋 STREAMLINED WORKFLOW PROTOCOL (v5.0.1)**

**SINGLE-STOP MODEL**: This template uses ONE comprehensive approval gate after planning, then continuous execution.

### **Phase 1: Analysis & Planning (Complete Before Stop)**

**AI MUST complete ALL of the following before stopping:**
1. **Document Analysis**:
   - Read all referenced *.domain.md and *.digital.md files completely
   - Note all existing feature specifications
   - Identify gaps and inconsistencies
   - Map cross-references between documents

2. **Expert Coordination** (v4.0.0 - if enabled):
   - Initiate expert coordination using VET MCP tools when enabled
   - Incorporate expert recommendations into planning
   - Achieve ≥80% expert consensus for architectural and complex concepts
   - Document expert insights for the change plan

3. **Enhancement Planning**:
   - List missing business rules to add
   - List incomplete capabilities to expand
   - List integration patterns to clarify
   - Identify sections needing updates
   - Plan cross-reference updates
   - Create detailed change plan for each document

4. **🛑 SINGLE COMPREHENSIVE STOP 🛑**:
   - Present complete change plan showing:
     - ALL documents to be modified
     - ALL sections to be updated
     - ALL features to be added
     - ALL cross-references to update
     - Expert recommendations (if enabled)
   - **STOP HERE and wait for human approval**
   - Only proceed when human types "continue" or "approved"

### **Phase 2-5: Continuous Execution (After Approval)**

**After receiving approval, AI executes continuously with progress logging:**

**Execution Activities** (no stops between these):
- Execute all planned document updates systematically
- Add business rules to domain.md files
- Add capability details to digital.md files
- Mark all features as "Not Implemented" with future ICP references
- Update all cross-references as planned
- Validate consistency across all modified documents
- Generate Implementation ICP (Phase 4)
- Complete document lifecycle (Phase 5)

**Progress Logging Requirements** (continuous throughout):
- Log after each document modified
- Log after each phase completed
- Update todo list regularly
- Track completion percentage
- Generate final completion summary

### **🛑 CODIFICATION ICP - PROHIBITED ACTIONS 🛑**
Throughout ALL phases:
- **❌ ABSOLUTELY PROHIBITED**: Code implementation or system file modifications
- **❌ ABSOLUTELY PROHIBITED**: Building or executing tests
- **❌ ABSOLUTELY PROHIBITED**: System deployment or configuration changes
- **❌ ABSOLUTELY PROHIBITED**: Any action that changes actual system state
- **✅ ALLOWED ONLY**: Documentation file modifications (*.req.md, *.icp.md)

### **AI Must ALWAYS:**
- Follow sequence: Analyze → Expert Coordinate → Plan → **STOP** → Execute → Validate → Complete
- Complete full analysis AND planning before the single stop
- Thoroughly review *.domain.md and *.digital.md files for context
- Use decentralized capability tracking (in req files, not central registry)
- Maintain consistent terminology across domain and digital documents
- Mark features as "Not Implemented" with future ICP reference
- Update cross-references across all affected documents
- Ensure domain rules align with digital capabilities
- Log progress continuously during execution phase
- Update todo list to track completion
- Generate comprehensive summaries at planning and completion stages

### **AI Must NEVER:**
- Stop during analysis or planning (complete both before stopping)
- Stop during execution after approval (execute continuously with logging)
- Skip documentation review steps
- Make changes without understanding context
- Skip expert coordination when enabled (v4.0.0)
- Skip progress updates or todo list updates
- Proceed past the single approval gate without explicit human approval

### **GitHub Commit Summary Template for Documentation**
```markdown
docs(domain): Update [domain/capability] specifications

## Changes
- Added [X] new feature specifications to [document]
- Updated [sections] in [document]
- Fixed [X] cross-references
- Aligned terminology for [concepts]

## Features Added (Not Implemented)
- Feature [X]: [Brief description] (ICP: Pending)
- Feature [Y]: [Brief description] (ICP: Pending)

## Expert Coordination (v4.0.0)
- Expert Consensus: [X]% (Target: ≥80%)
- Primary Experts: [List expert types involved]
- Key Recommendations: [Brief summary of expert guidance]

## Documents Updated
- [Document1.md]: Sections X.Y, X.Z
- [Document2.md]: Sections A.B

## Next Steps
- [ ] Step [X.Y]: [Description]

Related: #[issue-number]
ICP: [ICP-CONCEPT-handle]
```

**AI Execution Guidance**
When enhancing documentation:
1. **Focus on business value** - Ensure all specifications clearly connect to business capabilities
2. **Leverage expert guidance** (v4.0.0) - Use VET MCP tools for architectural and domain validation
3. **Maintain domain boundaries** - Keep clear separation between different business domains
4. **Specify integration clearly** - Define precise contracts for cross-capability integration
5. **Achieve expert consensus** - Target ≥80% consensus for complex architectural concepts
6. **Enable implementation** - Provide sufficient detail for AI implementation without over-specifying
7. **Preserve human readability** - Use clear paragraphs and organized sections for human review

**Human Review Priorities**
- **Business accuracy**: Do specifications correctly represent business needs and capabilities?
- **Implementation clarity**: Can an AI successfully implement from these specifications?
- **Integration coherence**: Do cross-capability integrations make business and technical sense?
- **Completeness**: Are all necessary specifications present for successful implementation?
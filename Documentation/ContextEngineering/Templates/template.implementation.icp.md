# Implementation ICP Template: [Feature/Component Name - Brief Description]

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL ICP)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.implementation.icp.md
TEMPLATE_VERSION: 4.0.0
TEMPLATE_DESCRIPTION: Major enhancement: Integrated Virtual Expert Team coordination with template orchestration, enhanced human approval gates with expert context, and comprehensive expert-guided execution patterns
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
═══════════════════════════════════════════════════════════════════════════

TEMPLATE USAGE INSTRUCTIONS FOR AI (DO NOT INCLUDE IN FINAL ICP)
═══════════════════════════════════════════════════════════════════════════
IMPORTANT: Implementation ICPs are typically generated as the final output of 
Concept ICP execution (Phase 4) to ensure perfect alignment with refined requirements.

If creating this ICP independently:
1. Validate that it aligns with the most current concept specifications
2. Ensure all requirement documents referenced are up-to-date
3. Consider whether a Concept ICP should be executed first

When creating an ICP from this template:
1. Remove all sections marked with <!-- TEMPLATE INSTRUCTION -->
2. Replace all [bracketed placeholders] with actual content
3. Ensure each Phase has 3-5 Steps maximum for manageable execution
4. Each Step should be a single logical unit of work (one component, feature, or integration)
5. Include specific file paths and code snippets where helpful
6. Reference actual requirement documents that exist in the codebase
7. Maintain the STRICT execution sequence for each step

IMPORTANT: Do NOT reference ANY timeframes or duration estimates.
Instead use: complexity levels, component counts, dependency chains, or completion criteria.

CAPABILITY REGISTRY INTERACTION:
Implementation ICPs have TWO phases of registry interaction:

DURING ICP CREATION:
1. REFERENCE ONLY - Do not add new capabilities
2. Look up capability IDs from /Documentation/ContextEngineering/capability-registry.md
3. Use these IDs when referencing capabilities in the ICP
4. Validate that all required capabilities exist in registry

DURING ICP EXECUTION:
1. Update registry status: "Not Started" → "In Progress" at start
2. Add this ICP's ID to the "Implementation ICP" column
3. Update feature statuses in requirement documents
4. Update registry status: "In Progress" → "Implemented" when complete
5. Add completion date to registry

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
**Expert Coordination**: [x] Enabled (v4.0.0) | [ ] Disabled
**Expert Coordination Level**: [ ] Minimal | [x] Standard | [ ] Comprehensive

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
**Requirements Being Implemented:**
- Domain Specification: [Domain-Name.domain.md](../Architecture/Domain-Name.domain.md)
- Digital Capability: [Capability-Name.digital.md](../Architecture/Capability-Name.digital.md)
- Testing Standards: [Testing-Standards.md](../Overview/Testing-Standards.md)
- Development Guidelines: [Development-Guidelines.md](../Overview/Development-Guidelines.md)
- Claude Integration: [CLAUDE.md](../../CLAUDE.md)

**CRITICAL IMPLEMENTATION NOTE:**
The *.domain.md and *.digital.md files contain the detailed business requirements, nuances, and capabilities that MUST be referenced during implementation. These documents specify:
- Business rules and constraints
- Integration patterns and contracts
- Feature behaviors and edge cases
- Domain-specific terminology and concepts
- Quality attributes and performance requirements

The AI MUST consult these documents before and during each implementation step.

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
[Define the testing approach: unit, integration, BDD scenarios]

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

## **CAPABILITY REGISTRY MAINTENANCE**
<!-- CRITICAL: These instructions MUST remain in generated ICPs for execution -->

**Registry Update Requirements:**
Registry updates differ based on ICP source type:

### **For Standard ICPs (Mature Domain Requirements):**
**At Implementation Start:**
1. Open `/Documentation/ContextEngineering/capability-registry.md`
2. Find capability entries referenced in this ICP
3. Update status from "Not Started" to "In Progress"
4. Add this ICP's handle to the "Implementation ICP" column
5. Add start date to "Notes" column

**At Implementation Completion:**
1. Update status from "In Progress" to "Implemented"
2. Add completion date to "Completed Date" column
3. Update "Notes" with final test coverage and key implementation details

### **For NewConcepts ICPs (Exploratory Requirements):**
**At Implementation Start:**
1. **DO NOT** update registry yet (placeholder IDs are not registered)
2. Note all placeholder capability IDs referenced (format: TEMP-[DOMAIN]-[NAME]-####)
3. Document domain discovery during implementation

**During Implementation - Domain Discovery:**
1. Analyze actual domain boundaries as implementation progresses
2. Identify which placeholder concepts map to which actual domains
3. Prepare final capability ID proposals for human approval

**At Implementation Completion - Human Approval Required:**
1. **STOP** - Generate domain restructuring proposal:
   - Original NewConcept document path
   - Proposed mature domain documents and locations
   - Placeholder → Final capability ID mapping
   - Registry entries to create/update
2. **WAIT** for human approval of restructuring proposal
3. **ONLY AFTER APPROVAL** - Execute registry updates and document migrations

**Registry Interaction Pattern:**
- **Standard ICPs**: REFERENCE existing IDs, UPDATE status only
- **NewConcepts ICPs**: CREATE final capability IDs after human approval
- **VALIDATE** all dependencies exist before starting

## **AI EXECUTION REQUIREMENTS**
<!-- CRITICAL SECTION - These instructions MUST be followed by AI -->

### **MANDATORY Execution Sequence for EVERY Step**
The AI executing this ICP MUST follow this EXACT sequence for each step:

#### **PRE-EXECUTION CHECKLIST** (MANDATORY - Complete before starting)
- [ ] Read this entire step including all subsections
- [ ] Identify all files that will be created/modified
- [ ] Review the pre-digested execution plan below
- [ ] Confirm all dependencies from previous steps are complete
- [ ] Update todo list with this step marked as "in_progress"

#### **EXECUTION PLAN** (Follow these subtasks IN ORDER)

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

3. **SUBTASK C: UPDATE REGISTRY STATUS** (First step only - Registry modification)
   ```bash
   # ACTION: Edit /Documentation/ContextEngineering/capability-registry.md
   ```
   - [ ] Open capability-registry.md
   - [ ] Find capability entries for this ICP
   - [ ] Change status from "Not Started" to "In Progress"
   - [ ] Add this ICP's handle to "Implementation ICP" column
   - [ ] Add today's date to "Notes" column
   **PROGRESS UPDATE**: "Updated registry status to In Progress"

4. **SUBTASK D: EXPERT-GUIDED IMPLEMENTATION** (Implementation phase with expert guidance)
   ```bash
   # ACTION: Create/modify files with expert guidance
   ```
   - [ ] Gather expert recommendations from coordinated expert team
   - [ ] Create new files if needed (check paths first with expert input)
   - [ ] Implement business rules from domain.md (with expert validation)
   - [ ] Implement capabilities from digital.md (incorporating expert insights)
   - [ ] Follow existing code patterns in the project (expert-verified approach)
   - [ ] Add appropriate error handling (expert-recommended patterns)
   - [ ] Validate implementation against expert recommendations
   - [ ] Achieve expert consensus on implementation approach (≥80%)
   **PROGRESS UPDATE**: "Implemented [component name] with expert guidance - [X] lines of code"

5. **SUBTASK E: EXPERT-VALIDATED TESTING** (Test creation with expert validation)
   ```bash
   # ACTION: Create test files in test project
   ```
   - [ ] Consult expert team for testing strategy recommendations
   - [ ] Create unit test file with proper naming (expert-verified patterns)
   - [ ] Write test for happy path scenario (expert-validated scenarios)
   - [ ] Write test for error conditions (expert-identified edge cases)
   - [ ] Write test for expert-recommended additional test cases
   - [ ] Aim for >80% code coverage (expert-validated coverage requirements)
   - [ ] Validate test quality with expert team (target: ≥90% expert approval)
   **PROGRESS UPDATE**: "Created [X] expert-validated tests for [component]"

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

11. **SUBTASK K: FINAL REGISTRY UPDATE** (Final step only - Registry completion)
   ```bash
   # ACTION: Edit /Documentation/ContextEngineering/capability-registry.md
   ```
   - [ ] Change status from "In Progress" to "Implemented"
   - [ ] Add completion date
   - [ ] Update notes with test coverage percentage and expert coordination results
   - [ ] Verify all capability IDs are correct
   **PROGRESS UPDATE**: "Updated registry - capability marked as Implemented with expert validation"

12. **SUBTASK L: GENERATE ENHANCED SUMMARY** (Summary generation with expert context)
   - [ ] Count files created/modified
   - [ ] Count tests written and passing
   - [ ] Note any issues encountered
   - [ ] List what was implemented
   - [ ] Document expert coordination outcomes and value added
   - [ ] Update todo list - mark this step as "completed"
   - [ ] Generate enhanced commit message with expert coordination context
   **PROGRESS UPDATE**: "Enhanced summary generated with expert coordination results - ready for human review"

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

#### **Step 1.1: [Specific Implementation Task]**
**What**: [Exactly what will be implemented]
**Why**: [Business/technical reason for this step]
**Dependencies**: [Prerequisites from previous steps or external]
**Estimated Subtasks**: 9 subtasks (~45-60 minutes if executed without stops)

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 1.1 Execution Roadmap
1. Subtask A: Review requirements 
2. Subtask B: Update registry status
3. Subtask C: Implement code
4. Subtask D: Write tests
5. Subtask E: Execute validation
6. Subtask F: Update documentation
7. Subtask G: Verify logs
8. Subtask H: Final registry update
9. Subtask I: Generate summary
Total: 9 subtasks to complete for this step
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

**SUBTASK B: Registry Update**
```bash
# Commands to execute:
echo "[Step 1.1] Updating capability registry"
# Edit capability-registry.md
# Find capability ID: [CAPABILITY-ID]
# Update status to "In Progress"
```
- [ ] Open capability-registry.md
- [ ] Update status for capability [ID]
- [ ] Add ICP reference
- [ ] **LOG**: "Registry updated: [CAPABILITY-ID] now In Progress"

**SUBTASK C: Code Implementation**
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
// MUST reflect business rules from domain.md
// MUST implement capabilities from digital.md
public class ExampleComponent
{
    // TODO: Implement constructor
    // TODO: Implement business rule from domain.md Section X.Y
    // TODO: Add validation per digital.md requirements
    // TODO: Add error handling
    // TODO: Add logging
}
```
- [ ] Create file: `/Path/To/File.cs`
- [ ] Implement constructor and fields
- [ ] Implement main business logic
- [ ] Add validation rules
- [ ] Add error handling
- [ ] **LOG**: "Implemented [Component] with [X] methods"

**SUBTASK D: Test Implementation**
```bash
# Commands to execute:
echo "[Step 1.1] Writing tests for [Component]"
# Create test file in test project
```

**Test Requirements:**
```csharp
[TestClass]
public class ExampleComponentTests
{
    // TODO: Test happy path
    [TestMethod]
    public void Should_PerformExpectedBehavior()
    {
        // Arrange
        // Act
        // Assert
    }
    
    // TODO: Test validation
    [TestMethod]
    public void Should_ValidateInput()
    {
        // Test implementation
    }
    
    // TODO: Test error handling
    [TestMethod]
    public void Should_HandleErrors()
    {
        // Test implementation
    }
}
```
- [ ] Create test file
- [ ] Write happy path test
- [ ] Write validation test
- [ ] Write error handling test
- [ ] Write edge case tests
- [ ] **LOG**: "Created [X] tests with [Y]% coverage target"

**SUBTASK E: Validation Execution (MANDATORY - ALL MUST PASS)**
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

**SUBTASK F: Documentation Updates**
```bash
# Commands to execute:
echo "[Step 1.1] Updating documentation"
# Update multiple documentation files
```
- [ ] Update `[Domain].domain.md` section X.Y with "In Development"
- [ ] Add new CLI commands to `CLAUDE.md` if applicable
- [ ] Update this ICP step status to "In Progress"
- [ ] Update feature status in requirements
- [ ] **LOG**: "Updated [X] documentation files"

**SUBTASK G: Final Checklist Validation**
- [ ] All subtasks A-F completed
- [ ] All checkboxes marked
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Documentation updated
- [ ] Registry updated
- [ ] Ready for summary generation

**AI Execution Checklist (MUST COMPLETE ALL):**
- [ ] ✅ Reviewed relevant domain.md sections for business rules
- [ ] ✅ Reviewed relevant digital.md sections for capability details
- [ ] ✅ Updated capability registry status
- [ ] ✅ Code implemented following domain specifications
- [ ] ✅ Business rules and constraints properly enforced
- [ ] ✅ Tests written with >80% coverage target
- [ ] ✅ Build passes: `dotnet build`
- [ ] ✅ Tests pass: `dotnet test`
- [ ] ✅ No errors in LoggerConfig output
- [ ] ✅ Documentation updated in all required files
- [ ] ✅ Implementation matches capability specifications
- [ ] ✅ All progress updates logged
- [ ] ✅ Todo list updated
- [ ] 🛑 **STOP HERE** - Generate summary for human review

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

🛑 STOP HERE - Wait for "continue" before proceeding to Step 1.2 🛑
```

#### **Step 1.2: [Next Implementation Task]**
<!-- Repeat same structure for each step -->

### **Phase 2: [Core Feature Implementation]**
**Objective**: [What this phase accomplishes]
**Scope**: [Number of components/features to implement]
**Dependencies**: Phase 1 completion

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
- Update capability-registry.md status at start and completion
- Update feature statuses in requirement documents
- Check both IDE and CLI build compatibility
- Update CLAUDE.md when adding new projects/commands
- Verify implementation matches business capability specifications
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
1. Subtask A: Update domain.md files with implementation status
2. Subtask B: Update digital.md files with implementation status
3. Subtask C: Finalize capability registry entries
4. Subtask D: Update cross-references and integration documentation
5. Subtask E: Generate implementation completion summary
Total: 5 subtasks to complete implementation documentation
```

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Update Domain Document Implementation Status**
```bash
echo "[Step N+1.1] Updating domain.md files with implementation status"
# Update all referenced domain documents
```
- [ ] Open each referenced `*.domain.md` file
- [ ] Update feature status from "Not Implemented" to "Implemented"
- [ ] Add implementation completion date
- [ ] Add references to this Implementation ICP
- [ ] Note any implementation discoveries or deviations
- [ ] **LOG**: "Updated [X] domain documents with implementation status"

**SUBTASK B: Update Digital Document Implementation Status**
```bash
echo "[Step N+1.1] Updating digital.md files with implementation status"
# Update all referenced digital documents
```
- [ ] Open each referenced `*.digital.md` file  
- [ ] Update capability status to "Implemented"
- [ ] Add implementation completion date
- [ ] Document any UI/UX implementation notes
- [ ] Update user journey status if applicable
- [ ] **LOG**: "Updated [X] digital documents with implementation status"

**SUBTASK C: Finalize Capability Registry Entries**
```bash
echo "[Step N+1.1] Finalizing capability registry entries"
# Complete all registry updates
```
- [ ] Open `/Documentation/ContextEngineering/capability-registry.md`
- [ ] Update all related capability statuses to "Implemented"
- [ ] Add final completion date
- [ ] Add test coverage percentage to notes
- [ ] Add this ICP reference to Implementation ICP column
- [ ] **LOG**: "Finalized [X] capability registry entries"

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
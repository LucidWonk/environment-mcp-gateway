# NewConcept Domain Template: [Concept Name - Core Business Purpose]

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL DOCUMENT)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.concept.req.md
TEMPLATE_VERSION: 1.1.0
TEMPLATE_DESCRIPTION: Enhanced with dependency-based prioritization and template update instructions
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

NEWCONCEPT TEMPLATE USAGE INSTRUCTIONS (DO NOT INCLUDE IN FINAL DOCUMENT)
═══════════════════════════════════════════════════════════════════════════
This template is for EXPLORATORY business domain concepts that haven't found 
their final domain/namespace home yet.

KEY DIFFERENCES from standard domain template:
1. Uses PLACEHOLDER capability IDs (TEMP-[DOMAIN]-[NAME]-####)
2. SKIPS capability registry registration during concept phase
3. Includes lifecycle status tracking for concept evolution
4. Will be SPLIT/MOVED to proper domain locations during implementation

IMPORTANT LIFECYCLE:
- This document stays in /Documentation/ContextEngineering/NewConcepts/ during exploration
- During implementation, may be split across multiple actual domains
- Final mature documents will use standard domain-template.domain.md
- This original will move to /NewConcepts/Implemented/ with forward references

CAPABILITY ID FORMAT:
- Use: TEMP-[DOMAIN]-[NAME]-[4-random-chars]
- Example: TEMP-ANALYSIS-SIGNALS-a7b3
- DO NOT add to capability-registry.md during NewConcepts phase

TEMPLATE VERSIONING:
When creating documents from this template, ensure:
1. Use the TEMPLATE_FILE and TEMPLATE_VERSION defined above for metadata fields:
   - "Generated From Template" field: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
   - "Template Version" field: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
2. Fill in all metadata fields with actual values, not placeholders
═══════════════════════════════════════════════════════════════════════════
-->

## **TEMPLATE USAGE**
This template creates exploratory domain concepts using pattern: `[concept-name].domain.md`

**Example Usage:**
- File: `ai-trading-signals.domain.md`
- Title: `# NewConcept Domain: AI Trading Signals - Intelligent Market Analysis`

## **CONCEPT LIFECYCLE STATUS**
**Current Phase**: [ ] Exploring | [ ] Implementing | [ ] Implemented
**Domain Certainty**: [ ] Unknown | [ ] Single Domain | [ ] Multi-Domain
**Implementation ICP**: TBD (will be created when ready to implement)

**Evolution Tracking:**
- **Original Concept**: This document
- **Resulting Documents**: (Populated after implementation)
  - TBD: Will be determined during domain discovery

## **CAPABILITY DEFINITION**
**Placeholder Capability ID**: TEMP-[DOMAIN]-[NAME]-[4chars] (Temporary - do not register)
**Concept Name**: [Human-readable name]
**Domain Type**: Business Logic Domain (Exploratory)
**Potential Deployment**: [Service/Library/Agent/etc. - may change during implementation]

## **CAPABILITY REGISTRY INTERACTION (NewConcepts)**
**IMPORTANT**: NewConcepts use placeholder IDs to avoid registry pollution.

**During NewConcepts Phase:**
1. Generate placeholder ID: TEMP-[DOMAIN]-[NAME]-[4-random-chars]
2. Do NOT add to capability-registry.md
3. Note: Final IDs will be generated during implementation

**After Implementation:**
1. AI will propose final capability IDs and registry entries
2. Human approves domain placement and final IDs
3. Mature documents use standard registry interaction patterns

**Registry Interaction Pattern:**
- **PLACEHOLDER ONLY** during concept phase
- **AVOID REGISTRATION** to prevent cleanup complexity
- **FINAL REGISTRATION** happens during implementation completion

## **CONCEPT OVERVIEW**
[2-3 paragraphs describing the business concept being explored. Focus on the business problem and potential value, but acknowledge this is exploratory and may evolve during implementation.]

**Core Business Purpose:** [Single sentence capturing the essential business value being explored]

**Potential Business Value:**
- [Potential business outcome #1 with estimated impact]
- [Potential business outcome #2 with estimated impact]
- [Potential business outcome #3 with estimated impact]

**Exploration Questions:**
- [Key question #1 about business viability]
- [Key question #2 about technical feasibility]
- [Key question #3 about domain boundaries]

## **CONCEPT BOUNDARIES (Exploratory)**
**IMPORTANT**: These boundaries are preliminary and may change during implementation.

### **Potential Domain Ownership**
**What This Concept Might Own:**
- [Potential business concept #1 and rules]
- [Potential business concept #2 and rules]
- [Potential business process #1]

**What This Concept Likely Does NOT Own:**
- [Business concept clearly owned by existing domain]
- [Process that this concept participates in but doesn't orchestrate]

**Boundary Uncertainty:**
- [Area where domain ownership is unclear]
- [Potential overlap with existing domains that needs resolution]
- [Cross-cutting concerns that may require coordination]

### **Ubiquitous Language (Preliminary)**
**NOTE**: This language may evolve as domain boundaries are discovered.

| Concept Term | Business Definition | Potential Code Representation | Status |
|--------------|-------------------|------------------------------|---------|
| [Core Concept 1] | [Business meaning being explored] | [Potential technical model] | [ ] Confirmed [ ] Evolving |
| [Core Concept 2] | [Business meaning being explored] | [Potential technical model] | [ ] Confirmed [ ] Evolving |

**Language Evolution Notes:**
- [Terms that may conflict with existing domains]
- [Concepts that may need renaming for consistency]
- [Areas where business stakeholder input is needed]

## **POTENTIAL DEPENDENCIES**
<!-- Relationships with existing or other NewConcept capabilities -->

### **Likely Build Dependencies**
| Capability ID | Capability Name | Type | Document | Confidence Level |
|---------------|-----------------|------|----------|------------------|
| [EXISTING-ID] | [Name] | Data/API/Event | [filename.domain.md] | [ ] High [ ] Medium [ ] Low |
| [TEMP-ID] | [NewConcept Name] | API/Event | [newconcept.domain.md] | [ ] High [ ] Medium [ ] Low |

### **Potential Runtime Dependencies**
| Capability ID | Capability Name | Type | Document | Confidence Level |
|---------------|-----------------|------|----------|------------------|
| [EXISTING-ID] | [Name] | API/Event | [filename.digital.md] | [ ] High [ ] Medium [ ] Low |

### **Potential Consumers**
| Capability ID | Capability Name | What They Might Use | Confidence Level |
|---------------|-----------------|-------------------|------------------|
| [EXISTING-ID] | [Name] | [APIs/Events this might provide] | [ ] High [ ] Medium [ ] Low |

## **EXPLORATORY FEATURES**

### **Feature Summary**
| Feature ID | Feature Name | Status | Confidence | Dependencies | Implementation ICP |
|------------|--------------|--------|------------|--------------|-------------------|
| [PLACEHOLDER-ID]-F001 | [Feature Name] | Exploring | [ ] High [ ] Medium [ ] Low | TBD | TBD |
| [PLACEHOLDER-ID]-F002 | [Feature Name] | Exploring | [ ] High [ ] Medium [ ] Low | TBD | TBD |

### **Feature Implementation Overview**
- **Total Features**: [Number] features being explored
- **Confidence Level**: [X] High Confidence, [Y] Medium Confidence, [Z] Low Confidence
- **Domain Uncertainty**: Features may be distributed across multiple domains during implementation
- **Last Updated**: [Date]

### **Feature Detailed Exploration**

#### **Feature: [PLACEHOLDER-ID]-F001**
**Name**: [Exploratory Feature Name]
**Status**: [ ] Exploring | [ ] Validating | [ ] Ready for Implementation
**Confidence Level**: [ ] High | [ ] Medium | [ ] Low
**Domain Assignment**: [ ] Unknown | [ ] Single Domain | [ ] Multi-Domain

**Business Value Hypothesis:**
[Description of potential business value this feature might provide and why it's worth exploring]

**Exploration Questions:**
- [Key question about business need]
- [Key question about technical feasibility]
- [Key question about user adoption]

**Potential Technical Scope:**
[Rough idea of technical work that might be required, acknowledging uncertainty]

**Potential Dependencies:**
- **Internal**: [Other features or concepts this might depend on]
- **External**: [External systems or services that might be needed]

**Domain Model Speculation:**
- **Potential Aggregates**: [Business concepts that might need modeling]
- **Potential Events**: [Business events this feature might publish/consume]
- **Potential Services**: [Cross-aggregate logic that might be needed]

**Risk Assessment:**
- **Technical Risk**: [ ] Low | [ ] Medium | [ ] High - [Risk description]
- **Business Risk**: [ ] Low | [ ] Medium | [ ] High - [Risk description]
- **Integration Risk**: [ ] Low | [ ] Medium | [ ] High - [Risk description]

**Success Criteria (Preliminary):**
- [ ] [Testable criterion #1 that would validate this feature]
- [ ] [Testable criterion #2 that would validate this feature]
- [ ] [Testable criterion #3 that would validate this feature]

**Implementation Notes:**
[Any additional thoughts, constraints, or considerations discovered during exploration]

---

#### **Feature [Next]: [Next Exploratory Feature Name]**
[Same structure repeated for each feature...]

## **CONCEPT VALIDATION APPROACH**

### **Business Validation**
**Stakeholder Validation:**
- [Business stakeholder group to validate need]
- [User group to validate value proposition]
- [Technical stakeholder to validate feasibility]

**Market Validation:**
- [How to validate market need for this concept]
- [Competitive analysis needed]
- [Regulatory considerations]

### **Technical Validation**
**Proof of Concept Approach:**
- [Technical experiments needed to validate feasibility]
- [Integration tests with existing systems]
- [Performance/scalability validation approach]

**Architecture Validation:**
- [How to validate domain boundary decisions]
- [Integration pattern validation]
- [Scalability assumption validation]

## **IMPLEMENTATION STRATEGY (Preliminary)**

### **Concept-to-Domain Evolution**
**Single Domain Scenario:**
If this concept fits within one domain:
- Move to `/Documentation/[Domain]/[concept-name].domain.md`
- Use standard domain template format
- Register standard capability ID

**Multi-Domain Scenario:**
If this concept spans multiple domains:
- Split into multiple domain documents
- Each gets standard domain template format
- Coordinate integration patterns between domains
- Register multiple capability IDs

**Cross-Cutting Scenario:**
If this concept is truly cross-cutting:
- Consider architectural refactoring
- May require new domain creation
- Extensive integration pattern design

### **Risk Mitigation Strategy**
**High-Risk Elements:**
- [Element #1]: [Mitigation approach]
- [Element #2]: [Mitigation approach]

**Validation Gates:**
- [Gate #1]: [Criteria that must be met before proceeding]
- [Gate #2]: [Criteria that must be met before implementation]

## **SUCCESS MEASUREMENT**

### **Concept Success Criteria**
**Business Success:**
- [Measurable business outcome #1]
- [Measurable business outcome #2]

**Technical Success:**
- [Technical performance criterion #1]
- [Integration success criterion #2]

**User Success:**
- [User adoption criterion #1]
- [User satisfaction criterion #2]

### **Implementation Success Criteria**
**Domain Alignment:**
- [ ] Final domain placement is logical and maintainable
- [ ] Integration patterns are clear and consistent
- [ ] No architectural violations introduced

**Quality Gates:**
- [ ] All features meet acceptance criteria
- [ ] Performance requirements satisfied
- [ ] Security requirements addressed

## **CONCEPT EVOLUTION TRACKING**

### **Decision Log**
| Date | Decision | Rationale | Impact |
|------|----------|-----------|---------|
| [Date] | [Decision made] | [Why this decision] | [What changed] |

### **Assumption Log**
| Assumption | Status | Validation Approach | Outcome |
|------------|--------|-------------------|---------|
| [Business assumption] | [ ] Unvalidated [ ] Validating [ ] Validated [ ] Invalidated | [How to test] | [Result] |
| [Technical assumption] | [ ] Unvalidated [ ] Validating [ ] Validated [ ] Invalidated | [How to test] | [Result] |

---

**Document Metadata**
- **Concept Name**: [Concept Name]
- **Generated From Template**: [TEMPLATE_FILE] v[TEMPLATE_VERSION]
- **Template Version**: [TEMPLATE_VERSION] ([TEMPLATE_DESCRIPTION])
- **Filename Pattern**: `[concept_name].domain.md`
- **Created Date**: [Date]
- **Last Updated**: [Date]
- **Status**: [ ] Exploring | [ ] Validating | [ ] Ready for Implementation | [ ] Implemented
- **Domain Uncertainty**: [ ] High | [ ] Medium | [ ] Low

**Implementation Tracking**
- **Confidence Level**: [X]% Confident in approach
- **Risk Level**: [ ] Low | [ ] Medium | [ ] High
- **Next Steps**: [Description of immediate next actions needed]

**Change History**
| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | [Date] | Initial concept exploration | [Author] |

---

**AI Implementation Guidance for NewConcepts**
When implementing concepts from this document:
1. **Expect Domain Discovery** - Be prepared to split this across multiple domains
2. **Validate Assumptions** - Test all assumptions during implementation
3. **Maintain Flexibility** - Domain boundaries may shift as understanding improves
4. **Document Evolution** - Track how the concept evolves during implementation
5. **Seek Human Input** - Flag unclear domain boundaries for human decision

**Human Review Focus Areas**
- **Business Value**: Does this concept solve a real business problem?
- **Domain Boundaries**: Are the proposed domain boundaries logical?
- **Technical Feasibility**: Are the technical assumptions realistic?
- **Integration Impact**: How will this affect existing system architecture?
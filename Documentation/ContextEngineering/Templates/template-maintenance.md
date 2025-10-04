# Context Engineering Template Maintenance Guide

**Version**: 5.0.0
**Last Updated**: 2025-10-04
**Status**: Active
**Purpose**: Template versioning, update protocols, and maintenance guidance

## **Overview**

This document provides comprehensive guidance for maintaining and updating Context Engineering System templates. It separates template maintenance instructions from template usage instructions, ensuring clarity for both AI systems and human maintainers.

**Important**: This document is for template MAINTENANCE only. For template USAGE instructions, see the individual template files themselves.

## **Template Version Alignment Strategy (v5.0)**

### **Version Alignment Rule**

All Context Engineering templates align their major version with the Context Engineering System version:

```
Context Engineering System v5.0.0
    ↓
All Templates → v5.0.x
```

**Key Principles**:
- **Major Version Sync**: When the Context Engineering System upgrades to v6.0, ALL templates upgrade to v6.0.0
- **Independent Patches**: Individual templates can have patch versions (v5.0.1, v5.0.2) for template-specific fixes
- **Never Go Backwards**: Version numbers only increase, never decrease

### **Version Numbering Scheme**

```
MAJOR.MINOR.PATCH

Major (x.0.0):
  - Aligned with Context Engineering System major version
  - Fundamental changes to template structure or execution model
  - Breaking changes requiring user adaptation

Minor (x.y.0):
  - Significant enhancements like new sections or validation requirements
  - New features that don't break existing usage
  - Backward-compatible additions

Patch (x.y.z):
  - Minor tweaks, typo fixes, or small clarifications
  - Bug fixes in template instructions
  - Clarification improvements
```

## **Template Update Instructions for AI**

### **When Updating Templates**

The AI MUST follow these instructions when updating any template:

#### **1. Version Incrementation**

**ALWAYS increment version when making ANY change**:

1. Determine change type (Major/Minor/Patch)
2. Increment appropriate version number
3. Update TEMPLATE_VERSION in template header
4. Update TEMPLATE_DESCRIPTION to reflect changes
5. Add entry to VERSION X.Y.Z MAJOR/MINOR/PATCH ENHANCEMENTS section

**Example v5.0.0 Update**:
```markdown
TEMPLATE_VERSION: 5.0.0
TEMPLATE_DESCRIPTION: Major v5.0 upgrade for Sonnet 4.5 optimization: [list all changes]

VERSION 5.0.0 MAJOR ENHANCEMENTS:
- Three-tier instruction architecture (templates are Tier 1 - execution authority)
- Bunker-style stop gates with visual barriers
- State persistence blocks for context rollover resilience
- [etc.]
```

#### **2. Time Reference Removal**

**NEVER include time estimates** (minutes, hours, days) in any section.

**Use instead**:
- Complexity indicators: "Simple task", "Complex implementation", "Multiple components"
- Dependency counts: "3 files to modify", "5 test cases required", "2 integrations needed"
- Completion metrics: "Until all tests pass", "Until build succeeds", "Until validation complete"

#### **3. Priority and Ordering**

**Base ALL priorities on technical build dependencies, NOT business value**:

- Sequence by: "Must complete X before Y can begin"
- Use dependency language: "Requires foundation components", "Depends on Feature X completion"
- Avoid value judgments: "Important", "Critical", "High-priority" (unless technical blocking)

#### **4. Template Instruction Handling**

**Template instruction sections are for AI maintenance only**:

- Sections marked "DO NOT INCLUDE IN FINAL DOCUMENT" stay in templates
- These sections guide AI on HOW to maintain templates
- NEVER copy these sections to documents created FROM templates
- Only content between instruction blocks gets copied to final documents

#### **5. Template Instruction Markers**

**Use XML-style comments for clear separation**:

```markdown
<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE UPDATE INSTRUCTIONS FOR AI (DO NOT INCLUDE IN FINAL DOCUMENTS)
═══════════════════════════════════════════════════════════════════════════
[Instructions for maintaining the template]
═══════════════════════════════════════════════════════════════════════════
-->

[Actual template content that gets copied to generated documents]
```

## **Template Versioning History**

### **v5.0.0 (2025-10-04) - Sonnet 4.5 Optimization**

**Major System-Wide Upgrade**:

All templates updated to v5.0.0 with these enhancements:

**ICP Templates** (codification, implementation, setup):
- Three-tier instruction architecture (self-contained execution authority)
- Bunker-style stop gates with visual barriers
- State persistence blocks for context rollover resilience
- 3x3 execution block structure (Preparation/Execution/Finalization)
- Self-validation framework with PASS/FAIL checkpoints
- Phase-specific tool restrictions (ALLOWED/PROHIBITED lists)
- Context rollover protocol (Level 1 + Level 2)
- Decentralized capability tracking
- Template instruction separation

**Requirements Templates** (concept, domain, digital, PRP):
- Decentralized capability tracking (in-document, not central registry)
- Template instruction separation (maintenance → TEMPLATE-MAINTENANCE.md)
- Version alignment with Context Engineering System v5.0.0
- Capability/feature tracking sections (domain/digital)

**Affected Files**:
- template.codification.icp.md: v4.0.0 → v5.0.0
- template.implementation.icp.md: v4.0.0 → v5.0.0
- template.setup.icp.md: v1.0.0 → v5.0.0
- template.concept.req.md: v1.1.0 → v5.0.0
- template.domain.req.md: v1.2.0 → v5.0.0
- template.digital.req.md: v1.2.0 → v5.0.0
- template.prp.req.md: v1.2.0 → v5.0.0

### **v4.0.0 - Virtual Expert Team Integration**

**ICP Templates**:
- Virtual Expert Team coordination integration
- Enhanced human approval gates with expert context
- Expert-guided execution patterns

**Affected Files**:
- template.codification.icp.md: v3.0.0 → v4.0.0
- template.implementation.icp.md: v3.0.0 → v4.0.0

### **v3.0.0 and Earlier**

See template-version-history.md for complete historical changelog.

## **Template Maintenance Workflows**

### **Workflow 1: Single Template Update**

**When**: Fixing a bug or clarifying a single template

**Steps**:
1. Read the template file completely
2. Identify the change needed
3. Determine version increment (usually Patch)
4. Update TEMPLATE_VERSION
5. Update TEMPLATE_DESCRIPTION
6. Add entry to VERSION X.Y.Z section
7. Make the actual content changes
8. Update template-version-history.md
9. Validate template still follows standards

### **Workflow 2: System-Wide Template Update**

**When**: Major Context Engineering System upgrade (like v5.0 → v6.0)

**Steps**:
1. Identify which templates need updates
2. Determine major version (align with system version)
3. Plan consistent changes across all templates
4. Update each template:
   - Increment to new major version (e.g., v6.0.0)
   - Update TEMPLATE_DESCRIPTION consistently
   - Add VERSION X.0.0 MAJOR ENHANCEMENTS section
   - Make content changes
5. Update TEMPLATE-MAINTENANCE.md with v6.0.0 entry
6. Update template-version-history.md with all changes
7. Validate consistency across all templates

### **Workflow 3: New Template Creation**

**When**: Creating a new template type

**Steps**:
1. Start with TEMPLATE_VERSION: 1.0.0
2. Include all standard template instruction sections
3. Add appropriate "DO NOT INCLUDE" markers
4. Define template purpose and usage clearly
5. Add v5.0 features note (or current version)
6. Document in TEMPLATE-MAINTENANCE.md
7. Add entry to template-version-history.md

## **Template Quality Standards**

### **Required Template Sections**

Every template MUST include:

1. **Version Definition Block**:
   ```markdown
   <!--
   TEMPLATE_FILE: template.name.md
   TEMPLATE_VERSION: X.Y.Z
   TEMPLATE_DESCRIPTION: [Clear description]
   -->
   ```

2. **Template Update Instructions** (for AI maintenance)
3. **Template Usage Instructions** (for document creation)
4. **v5.0 Features Note** (in template body)
5. **Actual Template Content** (what gets copied to generated docs)

### **Version Consistency Requirements**

- [ ] TEMPLATE_VERSION matches across header and description
- [ ] VERSION X.Y.Z section exists in update instructions
- [ ] v5.0 (or current) features note in template body
- [ ] All version references use same number

### **Instruction Clarity Requirements**

- [ ] Clear separation between maintenance and usage instructions
- [ ] XML-style comment markers properly formatted
- [ ] "DO NOT INCLUDE" warnings present
- [ ] Template instructions are for AI, not document creators

## **Template Removal Protocol**

When a template is no longer needed:

1. **DO NOT DELETE** - Move to `/Templates/Archived/`
2. Add DEPRECATED marker to template header
3. Document deprecation reason in TEMPLATE-MAINTENANCE.md
4. Add forward reference to replacement template (if any)
5. Update template-version-history.md with deprecation
6. Notify users through Context Engineering System documentation

## **Validation Checklist**

Before committing template changes:

- [ ] Version incremented appropriately
- [ ] TEMPLATE_DESCRIPTION updated
- [ ] VERSION X.Y.Z section added to update instructions
- [ ] Changes documented in TEMPLATE-MAINTENANCE.md
- [ ] template-version-history.md updated
- [ ] All XML comment markers properly formatted
- [ ] No maintenance instructions in document body
- [ ] v5.0 features note present (or current version)
- [ ] Cross-references to other templates still valid
- [ ] Template follows three-tier architecture principles

## **Common Template Maintenance Tasks**

### **Adding a New Feature to Templates**

1. Determine which templates affected (ICP vs Requirements vs All)
2. Decide version increment (Minor or Patch)
3. Update each affected template consistently
4. Add feature description to v5.0 features notes
5. Document in VERSION X.Y.Z sections
6. Update TEMPLATE-MAINTENANCE.md
7. Update template-version-history.md

### **Fixing a Template Bug**

1. Identify affected template(s)
2. Increment patch version
3. Fix the bug
4. Update TEMPLATE_DESCRIPTION
5. Add VERSION X.Y.Z PATCH entry
6. Document fix in template-version-history.md

### **Clarifying Template Instructions**

1. Identify unclear section
2. Increment patch version
3. Improve clarity
4. Update version metadata
5. Document improvement in version history

## **Related Documentation**

- [Context Engineering System Overview](../context-engineering-system.md) - v5.0.0 system architecture
- [Context Engineering Kickstarter](../Kickstarters/context-engineering-kickstarter.md) - v5.0.0 workflow guidance
- [Template Version History](template-version-history.md) - Complete version changelog

---

**Document Metadata**
- **Document Type**: Template Maintenance Guide (Tier 2)
- **Version**: 5.0.0
- **Created**: 2025-10-04
- **Last Updated**: 2025-10-04
- **Status**: Active
- **Scope**: All Context Engineering Templates
- **Target Audience**: AI systems maintaining templates, Human template administrators

This document ensures consistent, high-quality template maintenance across the Context Engineering System v5.0.

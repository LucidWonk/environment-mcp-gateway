# Context Engineering System Fix Plan: Document Type Specification

## Problem Identified

**Issue**: Codification ICP template lacks clear guidance on document types and formats
**Impact**: Created wrong file types (generic .md instead of .domain.req.md)
**Root Cause**: Template ambiguity about what documents codification ICPs should create/enhance

## Specific Problems Found

### 1. Template Guidance Missing
**Location**: `template.codification.icp.md`
**Problem**: No clear specification that codification ICPs should create/enhance `.domain.req.md` files
**Evidence**: Template mentions "target documents" but doesn't specify format or template compliance

### 2. Kickstarter Guidance Unclear  
**Location**: `context-engineering-kickstarter.md`
**Problem**: Doesn't emphasize domain.req template compliance for codification outputs
**Evidence**: General guidance but no specific document format requirements

### 3. Document Creation Execution Error
**Location**: My codification ICP execution
**Problem**: Created generic architecture docs instead of domain.req compliant files
**Files Created Wrong**:
- `http-transport-architecture.md` → Should be `http-transport.domain.req.md`
- `multi-client-collaboration.md` → Should be `multi-client-collaboration.domain.req.md`
- `README.md` → Should enhance existing domain documentation
- `implementation-readiness.md` → Should be part of domain.req spec

## Fix Strategy

### Phase 1: Template and System Fixes
1. **Update Codification ICP Template**:
   - Add explicit section: "Document Format Requirements"
   - Specify that codification creates/enhances `.domain.req.md` files
   - Reference domain.req template for format compliance
   - Add validation checklist for proper file formats

2. **Update Context Engineering Kickstarter**:
   - Add section on document format compliance
   - Clarify codification → domain.req.md relationship
   - Add examples of proper document creation

3. **Create Validation Checklist**:
   - Pre-execution: Check target document format requirements
   - During-execution: Validate template compliance
   - Post-execution: Verify proper domain.req format

### Phase 2: Fix Current Files
1. **Convert Created Files to Domain.req Format**:
   - `http-transport-architecture.md` → `http-transport.domain.req.md`
   - `multi-client-collaboration.md` → `multi-client-collaboration.domain.req.md`
   - Follow proper domain.req template structure
   - Add business rules, implementation status, integration points

2. **Consolidate Content Properly**:
   - Merge README and implementation-readiness content into domain.req files
   - Follow domain.req sections: Business Rules, Implementation Status, etc.
   - Remove redundant standalone files

## Implementation Plan

### Step 1: Fix Templates
- Update `template.codification.icp.md` with document format guidance
- Update `context-engineering-kickstarter.md` with format requirements
- Add validation checklist to both

### Step 2: Fix Created Files  
- Convert to proper domain.req format using template
- Ensure all business rules and implementation status properly specified
- Validate integration points and cross-references

### Step 3: Validate System
- Test that updated templates produce correct file formats
- Verify domain.req compliance across all created documents
- Ensure Context Engineering system integrity maintained
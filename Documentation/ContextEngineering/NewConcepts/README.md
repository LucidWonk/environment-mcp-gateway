# NewConcepts Documentation

## Purpose
This folder contains exploratory requirements and ICPs for concepts that haven't yet found their proper domain/namespace home in the system architecture.

## Lifecycle
1. **NewConcepts/** - Active exploration and implementation
2. **NewConcepts/Implemented/** - Completed concepts with forward references to mature documents

## Document Types
- **Requirements**: `concept-name.domain.req.md` (exploratory domain concepts)
- **Codification ICPs**: `concept-name.codification.icp.md` (systematizing concepts into specs)
- **Implementation ICPs**: `concept-name.implementation.icp.md` (building code from specs)

## Template Usage
- Use `template.concept.req.md` for exploratory concepts with unclear domain boundaries
- Use `template.codification.icp.md` for systematizing concepts into clear specifications
- Use `template.implementation.icp.md` for implementing systematized specifications

## New Template Taxonomy
**Clean Progression**: Concept → Codification → Implementation
- **Concept**: Explore unclear domain boundaries using `template.concept.req.md`
- **Codification**: Systematize concepts using `template.codification.icp.md` 
- **Implementation**: Build working code using `template.implementation.icp.md`

## Key Principles
- **Placeholder IDs**: Use `TEMP-[DOMAIN]-[NAME]-####` format
- **No Registry**: Don't register capabilities during exploration
- **Domain Discovery**: Expect concepts to span multiple domains during implementation
- **Human Approval**: All document restructuring requires approval

## Migration Process
During implementation, concepts may be split across multiple mature domains:
- Original document moves to `Implemented/` with timestamp and forward references
- New mature documents created in proper namespace locations
- Registry updated with final capability IDs and domain assignments

## Team Usage
- Create concepts here when domain boundaries are unclear
- Use existing domain folders when you know where concept belongs
- Review `Implemented/` folder for lessons learned from previous concepts
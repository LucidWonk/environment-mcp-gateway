# Template: Software Setup and Installation Instructions (ICP)

<!--
═══════════════════════════════════════════════════════════════════════════
TEMPLATE VERSION DEFINITION (DO NOT INCLUDE IN FINAL DOCUMENT)
═══════════════════════════════════════════════════════════════════════════
TEMPLATE_FILE: template.setup.icp.md
TEMPLATE_VERSION: 1.0.0
TEMPLATE_DESCRIPTION: Initial standardized setup and installation template
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
-->

> **Template Purpose**: This template provides a standardized format for creating comprehensive setup and installation instructions for software components. It ensures consistent, human-readable documentation that enables both technical and non-technical users to successfully install and configure software systems.

## Template Structure

### 1. Header and Overview
```markdown
# [Software Name] Setup and Installation Guide

## Overview
Brief description of what the software does and its purpose within the larger system.

## Prerequisites
- System requirements (OS, hardware, dependencies)
- Required software versions
- Access permissions needed
- Network requirements
```

### 2. Interactive Configuration and Installation Steps
```markdown
## Configuration Options

### Default Configuration
The following settings will be used unless you specify otherwise:

**Core Settings:**
- Setting 1: `default_value` (description)
- Setting 2: `default_value` (description) 
- Setting 3: `default_value` (description)

**Optional Components:**
- [ ] Component A: Brief description and impact
- [ ] Component B: Brief description and impact
- [ ] Component C: Brief description and impact

> **Customization**: Review these defaults and modify the configuration section below if needed.

### Configuration Selection
```bash
# Interactive configuration (choose your options)
./configure --interactive

# Or use defaults with specific overrides
./configure --component-a=enabled --setting-1=custom_value
```

## Installation Steps

### Step 1: Environment Preparation
- [ ] Environment setup actions
- [ ] System configuration changes  
- [ ] Dependency installation

### Step 2: Software Installation
- [ ] Download/clone instructions
- [ ] Build process (if applicable)
- [ ] Apply selected configuration options

### Step 3: Optional Component Installation
Based on your configuration selections:
- [ ] If Component A selected: installation steps
- [ ] If Component B selected: installation steps
- [ ] If Component C selected: installation steps

### Step 4: Final Configuration and Integration
- [ ] Apply final configuration settings
- [ ] Set up integration points
- [ ] Security configuration
```

### 3. Verification and Testing
```markdown
## Verification Steps

### Quick Health Check
Commands or actions to verify basic functionality

### Comprehensive Testing
- [ ] Feature validation steps
- [ ] Integration testing procedures
- [ ] Performance verification

### Common Issues and Solutions
Known issues with their resolutions
```

### 4. Usage Instructions
```markdown
## Basic Usage

### Getting Started
Initial usage instructions for new users

### Common Operations
Frequently performed tasks and their procedures

### Advanced Features
Optional advanced configuration and usage patterns
```

### 5. Maintenance and Support
```markdown
## Maintenance

### Regular Tasks
- Monitoring procedures
- Update processes
- Backup requirements

### Troubleshooting
- Log locations
- Diagnostic commands
- Support channels
```

## Template Usage Guidelines

### For AI Assistants
When creating setup instructions using this template:

1. **Be Specific**: Include exact commands, file paths, and configuration values
2. **Test-Oriented**: Provide verification steps for each major installation phase
3. **Error-Aware**: Include common failure scenarios and their solutions
4. **Cross-Platform**: Note differences between operating systems when applicable
5. **Security-Conscious**: Highlight security considerations and best practices

### For Human Users
When following setup instructions:

1. **Check Prerequisites**: Verify all requirements before starting
2. **Follow Sequentially**: Complete steps in order unless specifically noted otherwise
3. **Verify Each Step**: Use provided verification commands to ensure success
4. **Document Issues**: Note any deviations or problems for future reference

## Template Customization

### Required Sections
- Overview and Prerequisites
- Step-by-step installation
- Verification procedures
- Basic usage instructions

### Optional Sections (add as needed)
- Architecture diagrams
- Integration with other systems
- Performance tuning
- Development setup vs. production deployment
- Automated installation scripts

### Formatting Standards
- Use checkbox lists for actionable steps
- Include code blocks for commands
- Provide clear section headers
- Use consistent terminology
- Include screenshots for complex UI steps

## Version Control

- **Template Version**: 1.0
- **Last Updated**: [Date]
- **Maintained By**: [Team/Role]
- **Review Schedule**: [Frequency]

---

**Note**: This template should be customized for each specific software component while maintaining the core structure and principles outlined above.
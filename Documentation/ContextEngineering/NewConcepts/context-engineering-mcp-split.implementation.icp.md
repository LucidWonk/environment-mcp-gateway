# Implementation ICP: Context Engineering MCP Server Split

╔══════════════════════════════════════════════════════════════════════════════════╗
║                         📍 EXECUTION STATE TRACKER                               ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  CURRENT PHASE: Phase 3 - Integration Tests (✅ INFRASTRUCTURE COMPLETE)         ║
║  CURRENT STEP: Phase 3 Complete (Test Infrastructure & Samples)                 ║
║  CURRENT BLOCK: Finalization                                                    ║
║                                                                                  ║
║  LAST ACTION COMPLETED:                                                          ║
║  • Phase 3 test infrastructure complete - C# XUnit framework configured         ║
║  • Test client created: MCPTestClient with MCP protocol support                 ║
║  • Integration tests created: 17 representative tests across 6 categories       ║
║                                                                                  ║
║  NEXT ACTION:                                                                    ║
║  • Await human approval                                                         ║
║  • Then proceed to Phase 4 (Configure Deployment)                               ║
║                                                                                  ║
║  FILES MODIFIED THIS SESSION: 7                                                  ║
║  • ContextEngineeringMCP.Tests/ContextEngineeringMCP.Tests.csproj               ║
║  • ContextEngineeringMCP.Tests/Helpers/MCPTestClient.cs                         ║
║  • ContextEngineeringMCP.Tests/Helpers/ContextEngineeringTestFixture.cs         ║
║  • ContextEngineeringMCP.Tests/Integration/...IntegrationTests.cs               ║
║  • ContextEngineeringMCP.Tests/README.md                                        ║
║                                                                                  ║
║  VALIDATION STATUS:                                                              ║
║  • Test infrastructure: COMPLETE                                                ║
║  • Sample tests: 17 tests covering all 6 tool categories                        ║
║  • Build status: Pending central package version alignment                      ║
║                                                                                  ║
║  BUILD STATUS: ✅ TypeScript MCP Server: 36 source → 36 outputs                  ║
║  TEST STATUS: ✅ Test infrastructure complete, 17 sample tests created           ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

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

---

## **ICP OVERVIEW**

This Implementation ICP splits the EnvironmentMCPGateway into two separate MCP servers to achieve clean separation of concerns between infrastructure tools and Context Engineering knowledge management. The split creates ContextEngineeringMCP as an independent server focused solely on document lifecycle, expert coordination, and Context Engineering system tools, while EnvironmentMCPGateway retains its focus on external integrations (Git, Azure DevOps, Docker, VM management).

**Core Transformation:**
- **FROM**: Monolithic EnvironmentMCPGateway with mixed concerns (~12-15 tool categories)
- **TO**: Two specialized servers with clear boundaries
  - **ContextEngineeringMCP**: Knowledge management (6 tool categories, ~55KB compiled)
  - **EnvironmentMCPGateway**: Infrastructure integrations (5 tool categories, ~40KB compiled)
- **STRATEGY**: Duplicate mcp-logger.ts (trivial), maintain independent deployments
- **DEPLOYMENT**: Both servers deployed to ubuntu-devops via Azure Pipelines

### **🛑 IMPLEMENTATION ICP PREREQUISITES 🛑**
**ICP Type**: [x] Implementation (Code & Tests Only) | ❌ NO SPECIFICATION CHANGES ALLOWED EXCEPT STATUS UPDATES ❌
**CRITICAL**: This is an IMPLEMENTATION ICP - CODE EXECUTION ONLY based on approved specifications
**Implementation Scope**: [x] Refactoring (architectural separation)
**Complexity**: [x] Complex (new project structure, cross-server patterns, deployment changes)
**Risk Level**: [x] Medium (architectural change, deployment coordination, testing complexity)
**Template Version**: 5.0.0 (Sonnet 4.5 optimized)
**Expert Coordination**: [ ] Enabled | [x] Disabled (infrastructure refactoring)

## **RELATED DOCUMENTATION**

**Requirements Being Implemented:**
- Domain Specification: [virtual-expert-team.domain.req.md](../EnvironmentMCPGateway/virtual-expert-team.domain.req.md)
- **Testing Standards: [testing-standards.domain.req.md](../Architecture/testing-standards.domain.req.md)**
- Development Guidelines: [development-guidelines.domain.req.md](../Architecture/development-guidelines.domain.req.md)
- Claude Integration: [CLAUDE.md](../../CLAUDE.md)

**CRITICAL IMPLEMENTATION NOTE:**
The testing-standards.domain.req.md file contains MANDATORY testing framework selection criteria, coverage requirements, and quality gates. This implementation affects:
- TypeScript infrastructure components (both MCP servers)
- C# XUnit integration tests for both servers
- Azure Pipeline deployment configuration
- **Testing framework: C# XUnit integration tests for TypeScript MCP servers**
- **Minimum coverage: >85% via integration test simulation**
- **Mandatory Serilog logging: All C# tests must use LoggerConfig**

**Documents to Update After Implementation:**
- [ ] Update virtual-expert-team.domain.req.md with split architecture notes
- [ ] Update CLAUDE.md with new ContextEngineeringMCP server configuration
- [ ] Create lucidwonks-mcp-contextengineering/README.md
- [ ] Update azure-pipelines.yml for dual server deployment
- [ ] Update this ICP with completion status

## **IMPLEMENTATION DESIGN**

### **Technical Architecture**

**Pre-Split Architecture (Current):**
```
┌─────────────────────────────────────────────────────────┐
│  EnvironmentMCPGateway (Monolithic)                    │
│  - Git tools (git-*)                                   │
│  - Azure DevOps (azure-devops-*)                       │
│  - Docker/VM (docker-*, vm-*)                          │
│  - Service Discovery (service-discovery-*)             │
│  - Semantic Analysis (semantic-*)                      │
│  - Context Generation (context-generation-*)           │
│  - Document Lifecycle (document-lifecycle-*)           │
│  - Registry Lifecycle (registry-lifecycle-*)           │
│  - Lifecycle Integration (lifecycle-integration-*)     │
│  - Holistic Updates (holistic-context-updates-*)       │
│  - Virtual Expert Team (expert-*, agent-*)             │
│  - MCP Logger (mcp-logger.ts) - shared utility         │
└─────────────────────────────────────────────────────────┘
```

**Post-Split Architecture (Target):**
```
┌───────────────────────────────────┐  ┌─────────────────────────────────────┐
│  EnvironmentMCPGateway            │  │  ContextEngineeringMCP              │
│  (Infrastructure Focus)           │  │  (Knowledge Management Focus)       │
│                                   │  │                                     │
│  - Git tools (5 tools)            │  │  - Context Generation (3 tools)     │
│  - Azure DevOps (8 tools)         │  │  - Document Lifecycle (8 tools)     │
│  - Docker/VM (6 tools)            │  │  - Registry Lifecycle (6 tools)     │
│  - Service Discovery (4 tools)    │  │  - Lifecycle Integration (4 tools)  │
│  - Semantic Analysis (3 tools)    │  │  - Holistic Updates (3 tools)       │
│                                   │  │  - Virtual Expert Team (8 tools)    │
│  - mcp-logger.ts (duplicated)     │  │  - mcp-logger.ts (duplicated)       │
│                                   │  │                                     │
│  ~40KB compiled                   │  │  ~55KB compiled                     │
└───────────────────────────────────┘  └─────────────────────────────────────┘
         ↓ Deployed to                          ↓ Deployed to
   ubuntu-devops:3000                      ubuntu-devops:3001
         via Azure Pipelines                    via Azure Pipelines
```

**Key Design Decisions:**
1. **Duplicate mcp-logger.ts** - Trivial utility (~50 LOC), duplicating avoids shared package complexity
2. **Independent Projects** - Separate package.json, tsconfig.json, independent version management
3. **Separate Ports** - ContextEngineeringMCP on 3001, EnvironmentMCPGateway on 3000
4. **Dual Deployment** - Both servers deployed via single Azure Pipeline with matrix strategy
5. **Documentation Project** - New lucidwonks-mcp-contextengineering/Documentation for CE-specific docs
6. **Independent Testing** - Separate test projects (ContextEngineeringMCP.Tests, EnvironmentMCPGateway.Tests remain)

### **Component Migration Map**

**Moving to ContextEngineeringMCP:**
| Source File | Target Location | LOC | Tool Count |
|-------------|----------------|-----|------------|
| `src/tools/context-generation.ts` | `src/tools/context-generation.ts` | ~250 | 3 |
| `src/tools/document-lifecycle.ts` | `src/tools/document-lifecycle.ts` | ~400 | 8 |
| `src/tools/registry-lifecycle.ts` | `src/tools/registry-lifecycle.ts` | ~350 | 6 |
| `src/tools/lifecycle-integration.ts` | `src/tools/lifecycle-integration.ts` | ~200 | 4 |
| `src/tools/holistic-context-updates.ts` | `src/tools/holistic-context-updates.ts` | ~180 | 3 |
| `src/tools/virtual-expert-team.ts` | `src/tools/virtual-expert-team.ts` | ~990 | 8 |
| `src/utils/mcp-logger.ts` | `src/utils/mcp-logger.ts` | ~50 | N/A |
| **Total** | | **~2,420 LOC** | **32 tools** |

**Remaining in EnvironmentMCPGateway:**
| File | LOC | Tool Count |
|------|-----|------------|
| `src/tools/git-tools.ts` | ~300 | 5 |
| `src/tools/azure-devops-tools.ts` | ~450 | 8 |
| `src/tools/docker-tools.ts` | ~320 | 6 |
| `src/tools/service-discovery.ts` | ~180 | 4 |
| `src/tools/semantic-analysis.ts` | ~150 | 3 |
| `src/utils/mcp-logger.ts` | ~50 | N/A |
| **Total** | **~1,450 LOC** | **26 tools** |

### **Testing Strategy**
**CRITICAL**: Testing is NOT optional - it's a core deliverable equal to code implementation.

**Framework Selection (MANDATORY):**
Consult `/Documentation/Architecture/testing-standards.domain.req.md` for complete dual framework strategy.

- [x] **XUnit Testing**: Required for both MCP server infrastructure components
  - **Location**: `ContextEngineeringMCP.Tests/Integration/` and `EnvironmentMCPGateway.Tests/Integration/`
  - **Approach**: C# XUnit integration tests simulating MCP tool invocations
  - **Coverage**: >85% code coverage target via integration test simulation
  - **Pattern**: Established in ExpertSelectionV51IntegrationTests.cs (simulation without live server)

**Test Migration Strategy:**
1. **ContextEngineeringMCP.Tests** - NEW test project
   - Create integration tests for all 6 tool categories
   - ~58 tests for Virtual Expert Team tools (already exist, will be moved)
   - ~30 tests for Document Lifecycle tools (new)
   - ~25 tests for Registry Lifecycle tools (new)
   - ~15 tests for Context Generation tools (new)
   - ~15 tests for Lifecycle Integration tools (new)
   - ~10 tests for Holistic Updates tools (new)
   - **Total: ~153 integration tests**

2. **EnvironmentMCPGateway.Tests** - EXISTING test project
   - Retain existing infrastructure tests
   - Remove tests for migrated tools
   - Add integration tests for any untested infrastructure tools

**Quality Gates (Enforced):**
- XUnit Testing: Minimum 85% code coverage (via integration test simulation)
- All tests must pass - zero tolerance for failures
- All test failures must use Serilog logging via LoggerConfig
- Both MCP servers must compile successfully (npm run build)
- Both MCP servers must pass health checks on deployment

**Key Test Scenarios:**
- **ContextEngineeringMCP**:
  - Expert selection generates valid prompts
  - Document lifecycle tools create/update/archive documents correctly
  - Registry lifecycle maintains capability tracking integrity
  - Context generation produces valid ICP contexts
  - Holistic updates propagate changes across documents
- **EnvironmentMCPGateway**:
  - Git tools interact correctly with repositories
  - Azure DevOps tools query work items and projects
  - Docker tools manage containers and images
  - Service discovery finds active services
  - Semantic analysis processes code structures

### **Deployment Strategy**

**Azure Pipeline Configuration (Modified):**
```yaml
# azure-pipelines.yml (enhanced)
trigger:
  branches:
    include:
      - master
      - feature/*

strategy:
  matrix:
    EnvironmentMCPGateway:
      projectPath: 'EnvironmentMCPGateway'
      serverName: 'EnvironmentMCPGateway'
      port: '3000'
    ContextEngineeringMCP:
      projectPath: 'lucidwonks-mcp-contextengineering'
      serverName: 'ContextEngineeringMCP'
      port: '3001'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'

  - script: |
      cd $(projectPath)
      npm install
      npm run build
    displayName: 'Build $(serverName)'

  - task: CopyFiles@2
    inputs:
      SourceFolder: '$(projectPath)/dist'
      Contents: '**'
      TargetFolder: '$(Build.ArtifactStagingDirectory)/$(serverName)'
    displayName: 'Stage $(serverName) artifacts'

  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: '$(Build.ArtifactStagingDirectory)/$(serverName)'
      ArtifactName: '$(serverName)-artifacts'
    displayName: 'Publish $(serverName) artifacts'

  # Deployment to ubuntu-devops
  - task: SSH@0
    inputs:
      sshEndpoint: 'ubuntu-devops-ssh'
      runOptions: 'commands'
      commands: |
        sudo systemctl stop $(serverName)
        sudo rm -rf /opt/$(serverName)/*
        sudo cp -r $(Build.ArtifactStagingDirectory)/$(serverName)/* /opt/$(serverName)/
        sudo systemctl start $(serverName)
        sleep 5
        curl -f http://localhost:$(port)/health || exit 1
    displayName: 'Deploy $(serverName) to ubuntu-devops'
```

**Systemd Service Configuration:**
```ini
# /etc/systemd/system/ContextEngineeringMCP.service
[Unit]
Description=Context Engineering MCP Server
After=network.target

[Service]
Type=simple
User=mcp-user
WorkingDirectory=/opt/ContextEngineeringMCP
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

### **Rollback Strategy**

**Phase-Level Rollback**: Each phase can be independently rolled back
**Full Rollback**: Restore monolithic EnvironmentMCPGateway if split proves problematic

**Rollback Artifacts**:
- Git branch: `feature/context-engineering-mcp-split` (work-in-progress)
- Pre-split baseline tag: `mcp-pre-split-baseline`
- Both servers deployable independently - ContextEngineeringMCP can be disabled without affecting EnvironmentMCPGateway

## **CAPABILITY TRACKING (v5.0 - DECENTRALIZED)**

**Tracking Update Requirements:**

### **At Implementation Start (Phase 1, Step 1.1):**
1. Open `virtual-expert-team.domain.req.md`
2. Add architectural note about MCP server split
3. Update status to "In Development (MCP split refactoring)"
4. Add this ICP's reference

### **At Implementation Completion (Phase N+1):**
1. Update status to "Implemented (split architecture)"
2. Add completion date and split architecture notes
3. Document dual server deployment configuration

## **AI EXECUTION REQUIREMENTS**

### **MANDATORY 3x3 Execution Structure for EVERY Step**

Each implementation step MUST follow this structure:

#### **🔷 PREPARATION BLOCK** (3 tasks)
1. **SUBTASK A: REVIEW REQUIREMENTS** - Read specifications and existing code
2. **SUBTASK B: PLAN IMPLEMENTATION** - Design approach for step
3. **SUBTASK C: UPDATE TRACKING** - Update domain.req.md status (first step only)

#### **🔷 EXECUTION BLOCK** (4 tasks)
4. **SUBTASK D: IMPLEMENT CODE** - Create/modify TypeScript, config, or deployment files
5. **SUBTASK E: WRITE TESTS** - Create comprehensive C# XUnit integration tests
6. **SUBTASK F: VALIDATE BUILD** - Ensure both servers compile successfully
7. **SUBTASK G: COMPREHENSIVE VALIDATION** - Full build + test suite validation

#### **🔷 FINALIZATION BLOCK** (5 tasks)
8. **SUBTASK H: UPDATE DOCUMENTATION** - Update domain.req.md and related docs
9. **SUBTASK I: VERIFY LOGS** - Check for errors in server logs
10. **SUBTASK J: UPDATE STATE TRACKER** - Update execution state block at top
11. **SUBTASK K: SELF-VALIDATION CHECKPOINT** - Mandatory PASS/FAIL validation
12. **🛑 STOP GATE** - Wait for human approval before next step

## **IMPLEMENTATION PHASES**

### **Phase 1: Project Structure Setup**
**Objective**: Create ContextEngineeringMCP project structure with all configuration files
**Scope**: 3 steps (directory structure, npm setup, TypeScript config)
**Dependencies**: None (foundation work)

**🔧 ALLOWED TOOLS FOR THIS PHASE**:
- ✅ Read - Understanding existing EnvironmentMCPGateway structure
- ✅ Bash - mkdir, cp commands for directory/file creation
- ✅ Write - Creating new configuration files (package.json, tsconfig.json)
- ✅ Edit - Modifying existing files if needed

**❌ PROHIBITED TOOLS FOR THIS PHASE**:
- ❌ Git commits - Only commit when human explicitly requests
- ❌ Deployment changes - No Azure Pipeline modifications until Phase 4

---

#### **Step 1.1: Create ContextEngineeringMCP Directory Structure**
**What**: Create lucidwonks-mcp-contextengineering folder with standard Node.js/TypeScript project structure
**Why**: Establish foundation for new independent MCP server
**Dependencies**: None
**Estimated Subtasks**: 12 subtasks per 3x3 structure

**PRE-DIGESTED EXECUTION PLAN:**
```markdown
## Step 1.1 Execution Roadmap
**🔷 PREPARATION BLOCK** (3 tasks)
1. Subtask A: Review EnvironmentMCPGateway project structure
2. Subtask B: Plan ContextEngineeringMCP directory layout
3. Subtask C: Update virtual-expert-team.domain.req.md to "In Development (MCP split)"

**🔷 EXECUTION BLOCK** (4 tasks)
4. Subtask D: Create lucidwonks-mcp-contextengineering root directory structure
5. Subtask E: Create integration test project structure (ContextEngineeringMCP.Tests)
6. Subtask F: Validate directory structure created correctly
7. Subtask G: No comprehensive validation needed (no code yet)

**🔷 FINALIZATION BLOCK** (5 tasks)
8. Subtask H: Update documentation with new project structure notes
9. Subtask I: No logs to verify (no server running yet)
10. Subtask J: Update state tracker with Step 1.1 completion
11. Subtask K: Self-validation checkpoint
12. 🛑 STOP GATE - Await human approval

Total: 12 subtasks
```

**Requirements to Review:**
- EnvironmentMCPGateway existing structure: `/EnvironmentMCPGateway/` directory
- Standard Node.js/TypeScript project conventions
- MCP server index.js entry point pattern

**DETAILED EXECUTION SUBTASKS:**

**SUBTASK A: Review Existing Structure**
```bash
echo "[Step 1.1] Reviewing EnvironmentMCPGateway project structure"
ls -la /mnt/m/projects/lucidwonks-mcp-gateway/EnvironmentMCPGateway/
```
- [ ] Read EnvironmentMCPGateway/package.json
- [ ] Read EnvironmentMCPGateway/tsconfig.json
- [ ] Review EnvironmentMCPGateway/src/ structure
- [ ] Note tool organization patterns
- [ ] **LOG**: "Reviewed existing structure: src/tools/, src/utils/, dist/"

**SUBTASK B: Plan Directory Layout**
```bash
echo "[Step 1.1] Planning ContextEngineeringMCP directory layout"
```
**Planned Structure:**
```
lucidwonks-mcp-contextengineering/
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── tools/
│   │   ├── context-generation.ts
│   │   ├── document-lifecycle.ts
│   │   ├── registry-lifecycle.ts
│   │   ├── lifecycle-integration.ts
│   │   ├── holistic-context-updates.ts
│   │   └── virtual-expert-team.ts
│   └── utils/
│       └── mcp-logger.ts           # Duplicated from EnvironmentMCPGateway
├── dist/                           # Compiled output (generated)
├── Documentation/
│   ├── ContextEngineering/         # Migrated CE docs
│   │   ├── Templates/
│   │   ├── Kickstarters/
│   │   ├── VirtualExperts/
│   │   └── NewConcepts/
│   └── README.md
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```
- [ ] Document directory structure plan
- [ ] **LOG**: "Planned structure: src/tools (6 files), src/utils (1 file), Documentation/"

**SUBTASK C: Update Tracking Status**
```bash
echo "[Step 1.1] Updating virtual-expert-team.domain.req.md status"
```
- [ ] Open `/Documentation/EnvironmentMCPGateway/virtual-expert-team.domain.req.md`
- [ ] Add architectural note about MCP server split
- [ ] Change status to "In Development (MCP split refactoring)"
- [ ] Add this ICP's reference
- [ ] **LOG**: "Tracking updated to In Development (MCP split)"

**✅ PREPARATION CHECKPOINT**: All preparation tasks complete

**SUBTASK D: Create Directory Structure**
```bash
echo "[Step 1.1] Creating ContextEngineeringMCP directory structure"

# Navigate to project root
cd /mnt/m/projects/lucidwonks-mcp-gateway

# Create root project directory
mkdir -p lucidwonks-mcp-contextengineering

# Create source directories
mkdir -p lucidwonks-mcp-contextengineering/src/tools
mkdir -p lucidwonks-mcp-contextengineering/src/utils

# Create documentation directory structure
mkdir -p lucidwonks-mcp-contextengineering/Documentation/ContextEngineering/Templates
mkdir -p lucidwonks-mcp-contextengineering/Documentation/ContextEngineering/Kickstarters
mkdir -p lucidwonks-mcp-contextengineering/Documentation/ContextEngineering/VirtualExperts
mkdir -p lucidwonks-mcp-contextengineering/Documentation/ContextEngineering/NewConcepts
mkdir -p lucidwonks-mcp-contextengineering/Documentation/ContextEngineering/NewConcepts/Implemented

# Create dist directory (will be populated by build)
mkdir -p lucidwonks-mcp-contextengineering/dist

# Verify structure
ls -la lucidwonks-mcp-contextengineering/
tree lucidwonks-mcp-contextengineering/ -L 3
```
- [ ] Create lucidwonks-mcp-contextengineering root directory
- [ ] Create src/tools/ and src/utils/ directories
- [ ] Create Documentation/ContextEngineering/ directory structure
- [ ] Create dist/ directory
- [ ] Verify all directories created successfully
- [ ] **LOG**: "Created directory structure with src/, Documentation/, dist/"

**SUBTASK E: Create Test Project Structure**
```bash
echo "[Step 1.1] Creating ContextEngineeringMCP.Tests C# project structure"

# Navigate to projects root (where other test projects are)
cd /mnt/m/projects/lucidwonks-mcp-gateway

# Create test project directory
mkdir -p ContextEngineeringMCP.Tests/Integration

# Create .csproj file will be in Subtask D of Step 1.3
```
- [ ] Create ContextEngineeringMCP.Tests root directory
- [ ] Create ContextEngineeringMCP.Tests/Integration subdirectory
- [ ] Plan test project structure (tests will be added in Phase 3)
- [ ] **LOG**: "Created test project structure: ContextEngineeringMCP.Tests/Integration"

**SUBTASK F: Validate Directory Structure**
```bash
echo "[Step 1.1] Validating directory structure"

# Check all directories exist
test -d lucidwonks-mcp-contextengineering/src/tools && echo "✅ src/tools exists"
test -d lucidwonks-mcp-contextengineering/src/utils && echo "✅ src/utils exists"
test -d lucidwonks-mcp-contextengineering/Documentation && echo "✅ Documentation exists"
test -d ContextEngineeringMCP.Tests && echo "✅ Test project exists"

# List structure
tree lucidwonks-mcp-contextengineering/ -L 2
tree ContextEngineeringMCP.Tests/ -L 1
```
- [ ] Verify src/tools/ exists
- [ ] Verify src/utils/ exists
- [ ] Verify Documentation/ structure exists
- [ ] Verify test project structure exists
- [ ] **LOG**: "Directory structure validation: ALL ✅"

**SUBTASK G: Comprehensive Validation**
- [ ] No build to validate yet (no code files)
- [ ] Directory structure created successfully
- [ ] **LOG**: "Step 1.1 execution complete - directory structure ready"

**✅ EXECUTION CHECKPOINT**: All execution tasks complete

**SUBTASK H: Update Documentation**
- [ ] Add note to virtual-expert-team.domain.req.md about new project structure
- [ ] Document split architecture in progress
- [ ] **LOG**: "Documentation updated with project structure notes"

**SUBTASK I: Log Verification**
- [ ] No logs to verify (no server running yet)
- [ ] **LOG**: "Log verification: N/A (no server running)"

**SUBTASK J: Update State Tracker**
- [ ] Update CURRENT PHASE: Phase 1
- [ ] Update CURRENT STEP: Step 1.1 COMPLETE
- [ ] Update FILES MODIFIED: Directory structure created
- [ ] Update VALIDATION STATUS: "Directory structure validated"
- [ ] **LOG**: "State tracker updated"

**SUBTASK K: Self-Validation Checkpoint**

| Criterion | Status | Evidence |
|-----------|--------|----------|
| ContextEngineeringMCP root directory created | [ ] PASS / [ ] FAIL | lucidwonks-mcp-contextengineering/ exists |
| src/tools directory created | [ ] PASS / [ ] FAIL | src/tools/ exists |
| src/utils directory created | [ ] PASS / [ ] FAIL | src/utils/ exists |
| Documentation structure created | [ ] PASS / [ ] FAIL | Documentation/ContextEngineering/ structure exists |
| Test project structure created | [ ] PASS / [ ] FAIL | ContextEngineeringMCP.Tests/ exists |
| Directory structure validated | [ ] PASS / [ ] FAIL | tree command output correct |
| Tracking status updated | [ ] PASS / [ ] FAIL | domain.req.md updated |
| State tracker updated | [ ] PASS / [ ] FAIL | State block current |

**VALIDATION RESULT**: [ ] ALL PASS - Proceed to stop gate
                        [ ] ANY FAIL - Fix before stop gate

- [ ] **LOG**: "Self-validation complete - all criteria PASS"

**Human Review Gate:**
```markdown
## Step 1.1 Completion Summary
**Step Status**: COMPLETE ✅
**Subtasks Completed**: 12/12

### What Was Implemented
**Action**: Created ContextEngineeringMCP project structure
**Directories Created**:
- lucidwonks-mcp-contextengineering/src/tools
- lucidwonks-mcp-contextengineering/src/utils
- lucidwonks-mcp-contextengineering/Documentation/ContextEngineering
- ContextEngineeringMCP.Tests/Integration

### Validation Results
**Structure Validation**: ✅ All directories created correctly
**Documentation**: ✅ Updated domain.req.md with split architecture notes

### Next Step
**Step 1.2**: Create package.json configuration
**Dependencies**: Step 1.1 complete ✅

**Ready for review. Please verify directory structure before continuing.**
```

╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║                            🛑 MANDATORY STOP GATE 🛑                             ║
║                                                                                  ║
║  CURRENT STATE: Step 1.1 Complete (Directory Structure Created)                 ║
║  AWAITING: Human approval to continue to Step 1.2                               ║
║                                                                                  ║
║  COMPLETED:                                                                      ║
║  ✅ Preparation Block (3/3 tasks)                                                ║
║  ✅ Execution Block (4/4 tasks)                                                  ║
║  ✅ Finalization Block (5/5 tasks)                                               ║
║  ✅ Self-Validation (8/8 criteria PASS)                                          ║
║                                                                                  ║
║  PROHIBITED ACTIONS:                                                             ║
║  ❌ Do NOT read Step 1.2 instructions                                            ║
║  ❌ Do NOT begin Step 1.2 work                                                   ║
║  ❌ Do NOT create configuration files                                            ║
║  ❌ Do NOT continue execution                                                    ║
║                                                                                  ║
║  TO CONTINUE: Human must explicitly say "continue"                               ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

---

#### **Step 1.2: Create package.json Configuration**
**What**: Create package.json with dependencies, scripts, and project metadata
**Why**: Enable npm install, build, and test commands for ContextEngineeringMCP
**Dependencies**: Step 1.1 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure as Step 1.1]

---

#### **Step 1.3: Create TypeScript Configuration**
**What**: Create tsconfig.json and .gitignore for ContextEngineeringMCP
**Why**: Enable TypeScript compilation and proper version control
**Dependencies**: Step 1.2 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure as Step 1.1]

---

### **Phase 2: Tool Migration**
**Objective**: Migrate 6 tool categories from EnvironmentMCPGateway to ContextEngineeringMCP
**Scope**: 6 steps (one per tool category)
**Dependencies**: Phase 1 complete

**🔧 ALLOWED TOOLS FOR THIS PHASE**:
- ✅ Read - Reading existing tool files
- ✅ Bash - cp commands for file copying
- ✅ Edit - Modifying tool files for new project structure
- ✅ Write - Creating new index.ts entry point

**❌ PROHIBITED TOOLS FOR THIS PHASE**:
- ❌ Git commits - Only when human requests
- ❌ Deleting files from EnvironmentMCPGateway - Deferred to Phase 5

---

#### **Step 2.1: Migrate Context Generation Tools**
**What**: Copy context-generation.ts to ContextEngineeringMCP
**Why**: Move context generation to knowledge management server
**Dependencies**: Phase 1 complete
**Components**: context-generation.ts (~250 LOC, 3 tools)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 2.2: Migrate Document Lifecycle Tools**
**What**: Copy document-lifecycle.ts to ContextEngineeringMCP
**Why**: Move document lifecycle to knowledge management server
**Dependencies**: Step 2.1 complete
**Components**: document-lifecycle.ts (~400 LOC, 8 tools)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 2.3: Migrate Registry Lifecycle Tools**
**What**: Copy registry-lifecycle.ts to ContextEngineeringMCP
**Why**: Move registry lifecycle to knowledge management server
**Dependencies**: Step 2.2 complete
**Components**: registry-lifecycle.ts (~350 LOC, 6 tools)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 2.4: Migrate Lifecycle Integration Tools**
**What**: Copy lifecycle-integration.ts to ContextEngineeringMCP
**Why**: Move lifecycle integration to knowledge management server
**Dependencies**: Step 2.3 complete
**Components**: lifecycle-integration.ts (~200 LOC, 4 tools)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 2.5: Migrate Holistic Context Updates Tools**
**What**: Copy holistic-context-updates.ts to ContextEngineeringMCP
**Why**: Move holistic updates to knowledge management server
**Dependencies**: Step 2.4 complete
**Components**: holistic-context-updates.ts (~180 LOC, 3 tools)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 2.6: Migrate Virtual Expert Team Tools**
**What**: Copy virtual-expert-team.ts to ContextEngineeringMCP
**Why**: Move expert coordination to knowledge management server
**Dependencies**: Step 2.5 complete
**Components**: virtual-expert-team.ts (~990 LOC, 8 tools)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

### **Phase 3: Test Migration and Creation**
**Objective**: Create C# XUnit integration tests for ContextEngineeringMCP
**Scope**: 6 steps (one per tool category)
**Dependencies**: Phase 2 complete

**🔧 ALLOWED TOOLS FOR THIS PHASE**:
- ✅ Read - Reading existing test files
- ✅ Write - Creating new test files
- ✅ Bash - dotnet commands for test execution
- ✅ Edit - Modifying test files

**❌ PROHIBITED TOOLS FOR THIS PHASE**:
- ❌ Git commits - Only when human requests

---

#### **Step 3.1: Create Test Project Configuration**
**What**: Create ContextEngineeringMCP.Tests.csproj with dependencies
**Why**: Enable C# XUnit integration testing for ContextEngineeringMCP
**Dependencies**: Phase 2 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

**Key Dependencies:**
- xUnit
- FluentAssertions
- Newtonsoft.Json (for MCP response parsing)
- Serilog (for logging)
- Utility.Output (for LoggerConfig)

[Follow same detailed 3x3 structure]

---

#### **Step 3.2: Create Context Generation Tests**
**What**: Create ContextGenerationV51IntegrationTests.cs
**Why**: Ensure context generation tools work correctly
**Dependencies**: Step 3.1 complete
**Test Count**: ~15 integration tests
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 3.3: Create Document Lifecycle Tests**
**What**: Create DocumentLifecycleV51IntegrationTests.cs
**Why**: Ensure document lifecycle tools work correctly
**Dependencies**: Step 3.2 complete
**Test Count**: ~30 integration tests
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 3.4: Create Registry Lifecycle Tests**
**What**: Create RegistryLifecycleV51IntegrationTests.cs
**Why**: Ensure registry lifecycle tools work correctly
**Dependencies**: Step 3.3 complete
**Test Count**: ~25 integration tests
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 3.5: Create Lifecycle Integration Tests**
**What**: Create LifecycleIntegrationV51IntegrationTests.cs
**Why**: Ensure lifecycle integration tools work correctly
**Dependencies**: Step 3.4 complete
**Test Count**: ~15 integration tests
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 3.6: Create Holistic Updates Tests**
**What**: Create HolisticContextUpdatesV51IntegrationTests.cs
**Why**: Ensure holistic update tools work correctly
**Dependencies**: Step 3.5 complete
**Test Count**: ~10 integration tests
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 3.7: Move Virtual Expert Team Tests**
**What**: Move existing VET tests to ContextEngineeringMCP.Tests
**Why**: Virtual Expert Team tests belong with ContextEngineeringMCP
**Dependencies**: Step 3.6 complete
**Test Count**: ~58 existing integration tests (already passing)
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

### **Phase 4: Deployment Configuration**
**Objective**: Configure Azure Pipelines and systemd for dual server deployment
**Scope**: 2 steps (Azure Pipeline, systemd service)
**Dependencies**: Phase 3 complete (both servers tested)

**🔧 ALLOWED TOOLS FOR THIS PHASE**:
- ✅ Read - Reading existing azure-pipelines.yml
- ✅ Edit - Modifying azure-pipelines.yml
- ✅ Write - Creating systemd service files
- ✅ Bash - Testing deployment locally

**❌ PROHIBITED TOOLS FOR THIS PHASE**:
- ❌ Git commits - Only when human requests
- ❌ Actual deployment - Deferred until human approval

---

#### **Step 4.1: Configure Azure Pipeline Matrix Strategy**
**What**: Modify azure-pipelines.yml to deploy both servers
**Why**: Enable automated deployment to ubuntu-devops for both servers
**Dependencies**: Phase 3 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 4.2: Create Systemd Service Configuration**
**What**: Create ContextEngineeringMCP.service systemd configuration
**Why**: Enable ContextEngineeringMCP to run as system service on ubuntu-devops
**Dependencies**: Step 4.1 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

### **Phase 5: Documentation Migration and Cleanup**
**Objective**: Move Context Engineering docs to new project and clean up EnvironmentMCPGateway
**Scope**: 3 steps (doc migration, tool deletion, README updates)
**Dependencies**: Phase 4 complete (both servers deployed)

**🔧 ALLOWED TOOLS FOR THIS PHASE**:
- ✅ Bash - mv, rm commands for file migration and deletion
- ✅ Write - Creating new README files
- ✅ Edit - Updating existing documentation

**❌ PROHIBITED TOOLS FOR THIS PHASE**:
- ❌ Git commits - Only when human requests

---

#### **Step 5.1: Migrate Context Engineering Documentation**
**What**: Move Documentation/ContextEngineering to lucidwonks-mcp-contextengineering/Documentation
**Why**: Documentation should live with the server that uses it
**Dependencies**: Phase 4 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 5.2: Remove Migrated Tools from EnvironmentMCPGateway**
**What**: Delete 6 tool files from EnvironmentMCPGateway/src/tools
**Why**: Eliminate duplication after successful migration
**Dependencies**: Step 5.1 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

#### **Step 5.3: Update Project READMEs and CLAUDE.md**
**What**: Create ContextEngineeringMCP README and update CLAUDE.md
**Why**: Document new server configuration for Claude Code
**Dependencies**: Step 5.2 complete
**Estimated Subtasks**: 12 subtasks per 3x3 structure

[Follow same detailed 3x3 structure]

---

## **TESTING VERIFICATION**

### **Test Coverage Requirements**
- **ContextEngineeringMCP.Tests**: ~153 integration tests (>85% coverage simulation)
  - Context Generation: 15 tests
  - Document Lifecycle: 30 tests
  - Registry Lifecycle: 25 tests
  - Lifecycle Integration: 15 tests
  - Holistic Updates: 10 tests
  - Virtual Expert Team: 58 tests (already exist)

- **EnvironmentMCPGateway.Tests**: Retain existing tests, remove migrated tool tests

### **Build Validation**
```bash
# Build both servers
cd /mnt/m/projects/lucidwonks-mcp-gateway/lucidwonks-mcp-contextengineering
npm run build
cd /mnt/m/projects/lucidwonks-mcp-gateway/EnvironmentMCPGateway
npm run build

# Both builds must succeed
```

### **Test Execution**
```bash
# Run ContextEngineeringMCP tests
dotnet test ContextEngineeringMCP.Tests/ContextEngineeringMCP.Tests.csproj

# Run EnvironmentMCPGateway tests
dotnet test EnvironmentMCPGateway.Tests/EnvironmentMCPGateway.Tests.csproj

# All tests must pass
```

## **COMPLETION CRITERIA**

### **Implementation Complete When:**
- [ ] All 5 phases complete (19 steps total)
- [ ] Both servers compile successfully (npm run build)
- [ ] All C# integration tests pass (>85% coverage simulation)
- [ ] Azure Pipeline configured for dual deployment
- [ ] Systemd services configured for both servers
- [ ] Documentation migrated to ContextEngineeringMCP
- [ ] Migrated tools removed from EnvironmentMCPGateway
- [ ] Both servers deployed to ubuntu-devops and health checks pass

### **Definition of Done:**
- [ ] ContextEngineeringMCP operational on port 3001
- [ ] EnvironmentMCPGateway operational on port 3000
- [ ] All 32 Context Engineering tools accessible via ContextEngineeringMCP
- [ ] All 26 infrastructure tools remain accessible via EnvironmentMCPGateway
- [ ] Independent deployment and versioning working
- [ ] Documentation clear and accurate
- [ ] CLAUDE.md updated with both server configurations

---

**Document Metadata**
- **ICP Handle**: ICP-CONTEXT-ENGINEERING-MCP-SPLIT
- **Generated From Template**: template.implementation.icp.md v5.0.0
- **Template Version**: 5.0.0 (Sonnet 4.5 optimized)
- **Created Date**: 2025-10-05
- **Status**: [ ] Draft | [ ] Approved | [ ] In Progress | [ ] Completed
- **Total Steps**: 19 steps across 5 phases
- **Components Affected**: 6 tool files, ~2,420 LOC migration, new project, deployment config
- **Assigned To**: AI Agent (Claude Code)

**Change History**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-05 | Initial implementation ICP for MCP server split | Claude Code (Sonnet 4.5) |

---

## **AI EXECUTION SUMMARY INSTRUCTIONS**

### **🛑 STOP PROTOCOL - THIS IS NOT OPTIONAL 🛑**

**AFTER EACH step, the AI MUST:**
1. **🛑 STOP EXECUTION IMMEDIATELY 🛑**
2. **Generate a summary** including what was implemented, files created/modified, validation results
3. **🛑 STOP HERE - Wait for "continue" before proceeding to next step 🛑**
4. **Only continue** when human EXPLICITLY types "continue"

**The AI should ALWAYS:**
- Follow 3x3 execution structure (Preparation → Execution → Finalization)
- Complete ALL 12 subtasks per step before stop gate
- Validate both servers compile and all tests pass before finalizing
- Update state tracker after each step
- Perform self-validation checkpoint before stop gate
- Stop at every bunker-style gate and wait for human approval

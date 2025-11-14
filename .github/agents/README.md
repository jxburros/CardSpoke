# CardSpoke Agents Directory
# Version: 2.0
# Updated: 2025-11-14

## Overview

This directory contains all custom agents for the CardSpoke project. Agents are specialized AI assistants that handle specific aspects of development: feature implementation, bug fixing, documentation, planning, and coordination.

---

## Agent Inventory

### Execution Agents (Do Work)

#### **Constructor** ✅ v2.0
- **Purpose:** Implements features from TODO lists
- **Workflow:** plan → build → test → PR
- **Use for:** New features, enhancements, structured work
- **Status:** Standardized with protocols

#### **Insect-Enthusiast** ✅ v2.0
- **Purpose:** Diagnoses and fixes bugs
- **Workflow:** reproduce → isolate → patch → test
- **Use for:** Bug fixes, test failures, regressions
- **Status:** Standardized with protocols

### Planning & Coordination Agents

#### **Showrunner** v1.0
- **Purpose:** Orchestrates full development loop
- **Workflow:** plan → coordinate agents → integrate → validate
- **Use for:** Campaign coordination, multi-agent workflows
- **Status:** Needs standardization

#### **Mega-Showrunner** v1.0
- **Purpose:** Complete development pass using all agents
- **Workflow:** Full-cycle automation with fallbacks
- **Use for:** Comprehensive feature builds
- **Status:** Needs standardization

#### **Middle-Manager** v1.0
- **Purpose:** Creates right-sized TODO lists
- **Workflow:** progress report → prioritize → create TODO
- **Use for:** Task planning, prioritization
- **Status:** Needs standardization

#### **Corporate-Clipboard** v1.0
- **Purpose:** Generates progress reports against roadmap
- **Workflow:** check roadmap → find evidence → report status
- **Use for:** Progress tracking, status updates
- **Status:** Needs standardization

### Documentation Agents

#### **Librarian** v1.0
- **Purpose:** Syncs docs with main branch
- **Workflow:** pull main → compare → update → PR
- **Use for:** Documentation updates, README maintenance
- **Status:** Needs standardization

### Maintenance Agents

#### **Bulldozer** v1.0
- **Purpose:** Repository cleanup and reorganization
- **Workflow:** dry-run → approval → safe cleanup
- **Use for:** Branch cleanup, archive management
- **Status:** Needs standardization

### Knowledge & Advisory Agents

#### **Cardspoke-Guru** v1.0
- **Purpose:** Expert on CardSpoke architecture and patterns
- **Workflow:** query → search knowledge → provide guidance
- **Use for:** Architecture questions, pattern guidance
- **Status:** Needs enhancement with query patterns

#### **Creative-Director** v1.0
- **Purpose:** Maintains development vibe and themes
- **Workflow:** assess → propose theme → set tone
- **Use for:** Campaign themes, naming, messaging
- **Status:** Needs standardization

---

## New Infrastructure (v2.0)

### Protocols

Located in `.github/agents/protocols/`:

#### **agent-result.schema.yaml**
Standardized format for agent task results. All agents must produce results in this format.

**Key fields:**
- `status`: success | failure | partial | blocked
- `artifacts`: Files created/modified
- `tests`: Pass/fail counts
- `blockers`: What prevented completion
- `confidence`: 0.0-1.0 quality assessment

#### **agent-messaging.protocol.yaml**
Inter-agent communication system. Agents coordinate via messages.

**Message types:**
- `REQUEST`: Ask for information/action
- `RESPONSE`: Provide requested info
- `STATUS`: Progress update
- `ERROR`: Report failure
- `HANDOFF`: Pass to next agent
- `QUERY`: Ask for clarification

#### **pre-flight-checklist.yaml**
Validation system run before agent execution.

**Standard checks:**
- Git status clean
- Tests passing
- Dependencies met
- No file conflicts
- Branch up to date

### Training Library

Located in `.github/agents/training/`:

#### **best-practices.md** (14KB)
Proven patterns for effective agent execution.

**Topics:**
- Core principles (understand, plan, minimal changes)
- Workflow patterns (TDD, spike-then-implement)
- Code quality standards
- Performance guidelines
- Collaboration best practices

#### **common-pitfalls.md** (17KB)
Frequent mistakes and how to avoid them.

**Categories:**
- Environment & setup errors
- Testing & validation issues
- Code quality problems
- Dependency & coordination failures
- Documentation gaps
- Performance mistakes

#### **error-recovery.md** (17KB)
Strategies for recovering from errors.

**Scenarios:**
- Test failures
- Build errors
- Merge conflicts
- Dependency blockers
- Performance issues
- Data corruption

#### **workflow-examples.md** (17KB)
Real examples from successful campaigns.

**Examples:**
- Tags API implementation (v0.10.5)
- Bug fix workflows
- Multi-agent coordination
- Recovery from failures

---

## Using the Agents

### For Single Tasks

**Step 1: Choose Agent**
```
Feature work → Constructor
Bug fix → Insect-Enthusiast
Documentation → Librarian
Cleanup → Bulldozer
```

**Step 2: Provide Context**
```yaml
task: "N1-tagging-infrastructure"
context:
  description: "Implement tag API"
  acceptanceCriteria: [...]
  dependencies: []
```

**Step 3: Agent Executes**
- Runs pre-flight checks
- Performs work
- Validates results
- Produces agent result

**Step 4: Review Result**
```yaml
agentResult:
  status: "success"
  artifacts: [...]
  tests: { passed: 127, failed: 0 }
  confidence: 0.95
```

### For Campaigns (Multi-Agent)

**Option 1: Use Showrunner**
```
1. Showrunner reads objectives
2. Requests progress report (Corporate-Clipboard)
3. Creates TODO list (Middle-Manager)
4. Assigns tasks to Constructor/Insect-Enthusiast
5. Coordinates documentation (Librarian)
6. Validates completion
```

**Option 2: Use Mega-Showrunner**
```
1. Mega-Showrunner orchestrates all agents
2. Runs full cycle: plan → build → test → integrate → document
3. Includes cleanup and creative cohesion
4. Produces comprehensive release
```

---

## Agent Coordination Patterns

### Pattern 1: Linear Sequential (with Delegation)
```
Constructor (consults guru) → Tests Pass → Librarian (docs) → Done
  └─> If tests fail: Insect-Enthusiast (consults guru) → Constructor
```
**When:** Simple features with clear dependencies
**Key:** Each agent delegates to specialists rather than doing everything

### Pattern 2: Parallel Independent (with Smart Routing)
```
Orchestrator analyzes TODO →
  ├─> Constructor (Task 1, consults guru)
  ├─> Constructor (Task 2, consults guru)  
  └─> Insect-Enthusiast (Bug 1, consults guru)
       ↓
  All complete → Librarian → Done
```
**When:** Tasks have no dependencies
**Key:** Orchestrator routes, agents delegate to guru

### Pattern 3: Validated Cascade (Full Delegation Chain)
```
Showrunner plans
  ↓
Corporate-Clipboard reports (evidence-based)
  ↓
Middle-Manager creates TODO (consults guru for feasibility)
  ↓
Orchestrator routes tasks
  ├─> Constructor builds (consults guru for patterns)
  ├─> Insect-Enthusiast fixes (consults guru for behavior)
  └─> Bulldozer cleans (consults guru for safety)
       ↓
Librarian documents (validates with guru)
  ↓
Done
```
**When:** Need coordination and validation gates
**Key:** Every agent delegates to specialists, no agent does everything alone

### Pattern 4: Bug Fix with Feature Discovery
```
Issue reported →
Orchestrator → Insect-Enthusiast
  ↓
Insect-Enthusiast reproduces and isolates
  ↓
Consults Cardspoke-Guru: "How should this work?"
  ↓
Guru reveals: "Needs new validation API"
  ↓
Insect-Enthusiast → HANDOFF → Constructor
  ↓
Constructor implements feature (consults guru)
  ↓
Constructor → HANDOFF back → Insect-Enthusiast
  ↓
Insect-Enthusiast verifies bug fixed
  ↓
Librarian updates docs → Done
```
**When:** Bug reveals missing functionality
**Key:** Proper handoffs between specialists

---

## Communication Protocol

### Status Updates
Agents send STATUS messages during work:
```yaml
message:
  type: "STATUS"
  payload:
    phase: "implementation"
    progress: 65  # percentage
    currentTask: "Writing tests"
```

### Handoffs
Agents pass work to next agent:
```yaml
message:
  type: "HANDOFF"
  payload:
    completedTasks: ["N1"]
    nextAgent: "constructor"
    context: { apiLocation: "..." }
```

### Errors
Agents report blockers immediately:
```yaml
message:
  type: "ERROR"
  payload:
    severity: "error"
    errorCode: "DEPENDENCY_INCOMPLETE"
    recovery: { options: [...] }
```

---

## Agent Collaboration Best Practices

### Golden Rules

1. **Delegate to Specialists**: Never do work that another agent specializes in
2. **Consult Cardspoke-Guru First**: Before implementing any feature or fix
3. **Use Orchestrator for Routing**: Let it assign tasks optimally
4. **Hand Off, Don't Try**: If stuck >15 minutes, hand off to specialist
5. **Always Provide Context**: Include full context in HANDOFF messages

### Common Delegation Patterns

**Before Implementation (Constructor/Insect-Enthusiast):**
```yaml
# Always consult guru first!
Constructor → REQUEST → Cardspoke-Guru
  "What's the pattern for implementing tag editing?"
  
Response includes:
  - Exact file locations
  - Code examples
  - Edge cases to handle
  - Tests to write
```

**When Tests Fail (Constructor):**
```yaml
# Don't debug yourself - hand off!
Constructor → HANDOFF → Insect-Enthusiast
  completedTasks: ["N1-partial"]
  context:
    issue: "Tag validation tests failing"
    files: ["www/app.js", "tests/tags-api.test.js"]
    error: "Expected empty string rejection"
```

**Documentation Updates (Constructor/Insect-Enthusiast):**
```yaml
# If docs are substantial (>20 lines), delegate
Constructor → HANDOFF → Librarian
  completedTasks: ["N1-tagging-infrastructure"]
  context:
    newAPIs: ["getTags", "addTag", "removeTag"]
    docsToUpdate: ["README.md", "AI_DEVELOPER_GUIDE.md"]
```

**Progress-Based Planning (Middle-Manager):**
```yaml
# Always get fresh progress first!
Middle-Manager → REQUEST → Corporate-Clipboard
  "Generate current roadmap progress"
  
Corporate-Clipboard → RESPONSE + HANDOFF → Middle-Manager
  progressData: { complete: 85%, inProgress: 3 }
  
Middle-Manager creates TODO → HANDOFF → Orchestrator
Orchestrator routes tasks → Constructor/Insect-Enthusiast
```

### Anti-Patterns (What NOT to Do)

❌ **Constructor debugging for hours**: Hand off to Insect-Enthusiast after 15 min  
❌ **Insect-Enthusiast implementing features**: Hand off to Constructor  
❌ **Any agent writing docs manually**: Hand off substantial docs to Librarian  
❌ **Showrunner implementing code**: Showrunner only coordinates  
❌ **Skipping Cardspoke-Guru consultation**: Always consult before implementing  
❌ **Middle-Manager creating TODO without progress**: Always get Corporate-Clipboard report first  
❌ **Agents working in isolation**: Use messaging protocol to coordinate  

### Collaboration Metrics

Track these to measure collaboration effectiveness:

- **Delegation rate**: % of tasks where agent delegates to specialist (target: >60%)
- **Guru consultation rate**: % of features that consulted guru (target: 100%)
- **Average handoffs per task**: More handoffs = better specialization (target: 2-4)
- **Time to delegate decision**: How fast agents recognize need to delegate (target: <15 min)

---

## Success Metrics

### Target Performance (v2.0)
- **Agent success rate:** ≥90% (up from ~65%)
- **Human intervention:** <20% of tasks (down from ~40%)
- **Development velocity:** 25-40% faster
- **Error recovery:** Automatic for 80% of issues

### Agent-Specific Targets
| Agent | Success Rate | Avg Duration | Test Pass Rate |
|-------|-------------|--------------|----------------|
| Constructor | ≥90% | 1-3h | 100% |
| Insect-Enthusiast | ≥90% | 30-60m | 100% |
| Librarian | ≥95% | 10-30m | N/A |
| Bulldozer | ≥95% | 15-45m | N/A |

---

## Standardization Status

### Phase 1: Infrastructure (Complete ✅)
- [x] Agent result protocol
- [x] Messaging protocol
- [x] Pre-flight checklist system
- [x] Training library (4 guides)
- [x] Template for agent prompts

### Phase 2: Agent Updates (In Progress)
- [x] Constructor v2.0
- [x] Insect-Enthusiast v2.0
- [ ] Showrunner v2.0
- [ ] Mega-Showrunner v2.0
- [ ] Middle-Manager v2.0
- [ ] Corporate-Clipboard v2.0
- [ ] Librarian v2.0
- [ ] Bulldozer v2.0
- [ ] Cardspoke-Guru v2.0 (enhanced)
- [ ] Creative-Director v2.0

### Phase 3: Integration (Planned)
- [ ] Orchestrator agent (dependency management)
- [ ] Agent communication bus
- [ ] Health monitoring dashboard
- [ ] Automatic retry/recovery system

---

## Quick Reference

### Starting a Task
```bash
# 1. Check if agent is standardized (v2.0)
# 2. Provide clear task and context
# 3. Agent runs pre-flight checks
# 4. Agent executes workflow
# 5. Review agent result
```

### When Agent Fails
```bash
# 1. Check agent result for blockers
# 2. Read error messages carefully
# 3. Consult error-recovery.md
# 4. Resolve blockers
# 5. Re-run agent
```

### Common Questions
- **Q:** Which agent for my task?
  - **A:** See "Agent Inventory" above or consult cardspoke-guru

- **Q:** Agent is blocked, what now?
  - **A:** Check `blockers` in agent result, resolve dependencies

- **Q:** How do agents communicate?
  - **A:** Via messaging protocol (see protocols/agent-messaging.protocol.yaml)

- **Q:** Where are agent results stored?
  - **A:** `reports/agent-results/{agent}-{task}-{timestamp}.yaml`

---

## Resources

### For Users
- **README.md** (this file) - Overview and quick reference
- **TEMPLATE.agent.md** - Standardized agent structure

### For Agents
- **protocols/** - Result format, messaging, pre-flight checks
- **training/** - Best practices, pitfalls, recovery, examples

### For Development
- **AI_DEVELOPER_GUIDE.md** - Architecture and patterns
- **TODO.generated.md** - Current task backlog
- **Road Map V2.md** - Feature planning

---

## Version History

### v2.0 (2025-11-14)
- Added agent result protocol
- Added messaging protocol
- Added pre-flight checklist system
- Created training library (4 guides)
- Standardized Constructor and Insect-Enthusiast
- Created agent template

### v1.0 (Previous)
- Initial agent definitions
- Basic coordination patterns
- Individual agent prompts

---

## Contributing

When creating or updating an agent:

1. Use `TEMPLATE.agent.md` as starting point
2. Follow standardized structure
3. Integrate all three protocols
4. Link to training resources
5. Include examples and error handling
6. Test with real tasks
7. Update this README

---

**Maintained By:** CardSpoke development team  
**Last Updated:** 2025-11-14  
**Version:** 2.0

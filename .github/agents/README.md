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

### Pattern 1: Linear Sequential
```
Constructor → Insect-Enthusiast → Librarian → Done
```
**When:** Simple features with clear dependencies

### Pattern 2: Parallel Independent
```
Constructor (Task 1) ⎤
Constructor (Task 2) ⎥→ Merge → Librarian → Done
Constructor (Task 3) ⎦
```
**When:** Tasks have no dependencies

### Pattern 3: Validated Cascade
```
Showrunner plans
  ↓
Corporate-Clipboard reports
  ↓
Middle-Manager creates TODO
  ↓
Constructor builds
  ↓
Insect-Enthusiast validates
  ↓
Librarian documents
```
**When:** Need coordination and validation gates

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

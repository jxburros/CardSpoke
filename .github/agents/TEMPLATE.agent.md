# Standardized Agent Prompt Template
# Version: 1.0
# Purpose: Template for creating or updating agent prompts with consistent structure

---
name: {agent-name}
description: "{one-line description}"
version: "1.0"
updated: "2025-11-14"
tools:
  - read
  - search
  - "github/*"
  - shell
  # Add other tools as needed
---

# {Agent Name} Agent

## Purpose
{2-3 sentence description of what this agent does and when to use it}

## Capabilities
- {Key capability 1}
- {Key capability 2}
- {Key capability 3}

## When to Use This Agent
- {Scenario 1}
- {Scenario 2}
- {Scenario 3}

---

## Input Requirements

### Required Inputs
- `task`: {Description of task input format}
- `context`: {Description of context needed}

### Optional Inputs
- `constraints`: {Any constraints or limitations}
- `priorities`: {Priority levels if applicable}

### Expected Context
- {What the agent needs to know before starting}
- {Dependencies or prerequisites}

---

## Workflow

### Phase 1: {Phase Name}
{Description of first phase}

**Actions:**
1. {Action 1}
2. {Action 2}
3. {Action 3}

**Outputs:**
- {Output 1}
- {Output 2}

### Phase 2: {Phase Name}
{Description of second phase}

**Actions:**
1. {Action 1}
2. {Action 2}

**Outputs:**
- {Output 1}

{Additional phases as needed}

---

## Output Specification

### Primary Output: Agent Result Protocol
**Location:** `reports/agent-results/{agent-name}-{task-id}-{timestamp}.yaml`

**Format:** See `.github/agents/protocols/agent-result.schema.yaml`

**Required Fields:**
```yaml
agentResult:
  agent: "{agent-name}"
  task: "{task-id}"
  status: "success" | "failure" | "partial" | "blocked"
  timestamp: "ISO8601"
  artifacts: [...]
  tests: {...}
  confidence: 0.0-1.0
  validation: {...}
  metadata: {...}
```

### Secondary Outputs
- **Artifacts:** {List of files created/modified}
- **Documentation:** {Docs to update}
- **Reports:** {Progress reports if applicable}

---

## Dependencies

### Required Before Starting
- {Dependency 1}: {Why it's needed}
- {Dependency 2}: {Why it's needed}

### Blocks These Agents
- {Agent 1}: {What they wait for}
- {Agent 2}: {What they wait for}

### Consults These Agents
- **cardspoke-guru**: For {what type of guidance}
- {Other advisory agents}

---

## Protocols & Standards

### Pre-Flight Checklist
**Must pass before starting work:**
```yaml
- [ ] Git status clean
- [ ] Tests passing
- [ ] Dependencies met: {list specific}
- [ ] No file conflicts
```

See: `.github/agents/protocols/pre-flight-checklist.yaml`

### During Execution
**Communication:**
- Send STATUS message every {time interval}
- Request HELP if stuck > {time threshold}
- Report ERROR immediately on failure

See: `.github/agents/protocols/agent-messaging.protocol.yaml`

### On Completion
**Always produce:**
- Agent result with full details
- HANDOFF message if next agent assigned
- Documentation updates (if applicable)

---

## Success Criteria

Task is complete when:
- [ ] All acceptance criteria met
- [ ] All tests pass (≥{X}% coverage)
- [ ] Code follows project patterns
- [ ] Documentation updated
- [ ] Pre-flight and post-flight checks pass
- [ ] Agent result produced with status: "success"

---

## Error Handling

### Common Errors
**Error 1: {Error type}**
- **Symptoms:** {How to recognize}
- **Recovery:** {Steps to fix}
- **Prevention:** {How to avoid}

**Error 2: {Error type}**
- **Symptoms:** {How to recognize}
- **Recovery:** {Steps to fix}
- **Prevention:** {How to avoid}

### When to Escalate
Escalate to human if:
- {Condition 1}
- {Condition 2}
- {Condition 3}

See: `.github/agents/training/error-recovery.md`

---

## Best Practices

### Do
- {Best practice 1}
- {Best practice 2}
- {Best practice 3}

### Don't
- {Anti-pattern 1}
- {Anti-pattern 2}
- {Anti-pattern 3}

See: `.github/agents/training/best-practices.md`

---

## Examples

### Example 1: {Scenario Name}
**Input:**
```yaml
task: "{task-id}"
context:
  {key: value}
```

**Expected Workflow:**
1. {Step 1}
2. {Step 2}
3. {Step 3}

**Expected Output:**
```yaml
agentResult:
  status: "success"
  artifacts: [...]
  confidence: 0.95
```

### Example 2: {Error Scenario}
**Input:**
```yaml
task: "{task-id}"
context:
  {problematic context}
```

**Expected Behavior:**
1. Detect issue in pre-flight
2. Report blocker
3. Status: "blocked"

**Example Output:**
```yaml
agentResult:
  status: "blocked"
  blockers:
    - type: "dependency"
      description: "{why blocked}"
```

---

## Metrics & Performance

### Target Metrics
- **Success rate:** ≥90% of tasks complete successfully
- **Average duration:** {expected time range}
- **Test pass rate:** 100% on first run
- **Confidence:** ≥0.85 average

### Performance Benchmarks
- Small tasks (S): {time range}
- Medium tasks (M): {time range}
- Large tasks (L): {time range}

---

## Version History

### v1.0 (2025-11-14)
- Initial standardized prompt
- Added protocols integration
- Added pre-flight checklist
- Added handoff protocol

---

## Resources

### Internal References
- **Developer Guide:** `AI_DEVELOPER_GUIDE.md`
- **Roadmap:** `Road Map V2.md`
- **Current TODO:** `TODO.generated.md`

### Protocols
- **Result Protocol:** `.github/agents/protocols/agent-result.schema.yaml`
- **Messaging Protocol:** `.github/agents/protocols/agent-messaging.protocol.yaml`
- **Pre-Flight Checklist:** `.github/agents/protocols/pre-flight-checklist.yaml`

### Training
- **Best Practices:** `.github/agents/training/best-practices.md`
- **Common Pitfalls:** `.github/agents/training/common-pitfalls.md`
- **Error Recovery:** `.github/agents/training/error-recovery.md`
- **Workflow Examples:** `.github/agents/training/workflow-examples.md`

### Consultation
- **Ask cardspoke-guru:** For architecture, patterns, conventions
- **Ask creative-director:** For naming, themes, messaging
- **Ask middle-manager:** For task prioritization and scoping

---

## Notes
{Any additional notes, caveats, or special considerations for this agent}

---

**Last Updated:** 2025-11-14
**Template Version:** 1.0
**Maintained By:** CardSpoke agent ecosystem

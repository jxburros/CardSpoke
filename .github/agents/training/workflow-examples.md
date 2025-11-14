# Successful Workflow Examples for Agents
# Version: 1.0
# Purpose: Real examples of successful agent campaigns and patterns

# Introduction
This document showcases successful agent workflows from actual CardSpoke development. Each example includes the complete workflow, challenges encountered, and lessons learned.

---

# Example 1: Tags API Implementation (v0.10.5)

## Task Overview
- **Task ID:** N1-tagging-infrastructure
- **Agent:** Constructor
- **Size:** Medium (1-2 days)
- **Priority:** P1 (High)
- **Complexity:** Moderate

## Workflow

### Phase 1: Planning (10 minutes)
```yaml
- Reviewed task requirements from middle-manager plan
- Consulted AI_DEVELOPER_GUIDE for schema patterns
- Identified similar code: bookmark management
- Created mental plan:
  * Add tags array to card schema
  * Implement 5 API functions
  * Write comprehensive tests
  * Update exports to include tags
```

### Phase 2: Schema Update (5 minutes)
```javascript
// www/app.js - Card creation
function createCard(title = '', body = '', parentId = null) {
  const card = {
    id: generateId(),
    title,
    body,
    parentId,
    children: [],
    tags: [],  // ← Added this
    // ...
  };
}
```

### Phase 3: API Implementation (30 minutes)
```javascript
// getTags - Get all tags for a card
function getTags(cardId) {
  const card = store.cards[cardId];
  if (!card) return [];
  return card.tags || [];
}

// addTag - Add tag with normalization and duplicate prevention
function addTag(cardId, tag, skipSave = false) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  // Normalize: lowercase, trim, remove # prefix
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  if (!normalizedTag) return false;
  
  // Initialize array if needed
  if (!card.tags) card.tags = [];
  
  // Prevent duplicates (case-insensitive)
  if (card.tags.some(t => t.toLowerCase() === normalizedTag)) {
    return false;
  }
  
  card.tags.push(normalizedTag);
  
  if (!skipSave) {
    dirty = true;
    save();
  }
  
  return true;
}

// Similar implementations for removeTag, setTags, getAllTags
```

### Phase 4: Test Writing (40 minutes)
```javascript
// tests/tags-api.test.js
test('getTags returns empty array for non-existent card', () => {
  const tags = getTags('non-existent');
  assert.equal(tags.length, 0);
});

test('addTag normalizes tag to lowercase', () => {
  const card = createCard('Test', 'Body');
  addTag(card.id, 'JavaScript');
  const tags = getTags(card.id);
  assert.equal(tags[0], 'javascript');
});

test('addTag prevents duplicate tags', () => {
  const card = createCard('Test', 'Body');
  addTag(card.id, 'test');
  addTag(card.id, 'TEST');  // Different case
  addTag(card.id, 'test');  // Exact duplicate
  const tags = getTags(card.id);
  assert.equal(tags.length, 1);  // Only one tag
});

// 16 more tests covering edge cases...
```

### Phase 5: Export Integration (15 minutes)
```javascript
// Update exportToJSON to include tags
function exportToJSON() {
  return JSON.stringify({
    cards: store.cards,  // Already includes tags
    // ...
  });
}

// Update exportToMarkdown to show tags
function exportToMarkdown(cardId) {
  let markdown = `# ${card.title}\n\n`;
  if (card.tags && card.tags.length > 0) {
    markdown += `**Tags:** ${card.tags.map(t => `#${t}`).join(', ')}\n\n`;
  }
  markdown += card.body;
  return markdown;
}
```

### Phase 6: Validation (10 minutes)
```bash
# Run tests
$ npm test
127 tests, 127 passed ✓

# Check git status
$ git status
Modified: www/app.js
New: tests/tags-api.test.js

# Review changes
$ git diff www/app.js
# Confirmed: minimal changes, only tag functionality
```

### Phase 7: Documentation (10 minutes)
```markdown
# AI_DEVELOPER_GUIDE.md - Added section:
### Managing Tags
```javascript
// Get all tags for a card
function getTags(cardId) { ... }

// Add a tag to a card
function addTag(cardId, tag) { ... }
// etc.
```

### Phase 8: Completion (5 minutes)
```yaml
agentResult:
  agent: "constructor"
  task: "N1-tagging-infrastructure"
  status: "success"
  timestamp: "2025-11-14T06:30:00Z"
  artifacts:
    - path: "www/app.js"
      changes: "+45 lines"
      type: "modified"
    - path: "tests/tags-api.test.js"
      changes: "+60 lines"
      type: "created"
    - path: "AI_DEVELOPER_GUIDE.md"
      changes: "+30 lines"
      type: "modified"
  tests:
    passed: 127
    failed: 0
    duration: "13ms"
  confidence: 0.95
  validation:
    preFlightChecks: true
    testsRun: true
    lintPassed: true
  metadata:
    duration: "2h 5m"
    branch: "feature/tagging-infrastructure"
  nextSteps: ["N2-tag-management-ui"]
```

## Challenges & Solutions

**Challenge 1: Case-Insensitive Duplicate Detection**
- Problem: Should 'JavaScript' and 'javascript' be treated as same tag?
- Solution: Normalize to lowercase, compare with .toLowerCase()
- Lesson: Always consider case sensitivity for user input

**Challenge 2: Tag Format Validation**
- Problem: What format should tags use? With or without # prefix?
- Solution: Accept both, normalize by removing # prefix
- Lesson: Be flexible with input, strict with storage

**Challenge 3: Export Format**
- Problem: How to represent tags in Markdown export?
- Solution: Use format: `**Tags:** #tag1, #tag2`
- Lesson: Check how similar apps handle exports

## Success Factors
1. **Clear requirements** - Well-defined acceptance criteria
2. **Existing patterns** - Followed bookmark management pattern
3. **Test-first approach** - Wrote tests alongside implementation
4. **Incremental commits** - Could rollback easily if needed
5. **Good documentation** - Made API easy for next agent to use

## Metrics
- **Estimated:** 1 day
- **Actual:** 2 hours 5 minutes (3x faster!)
- **Tests:** 19 new tests, all passing
- **Code quality:** High (followed patterns, well-tested)
- **Follow-up issues:** 0

---

# Example 2: Bug Fix - Tag Validation (v0.10.5)

## Task Overview
- **Task ID:** Bug report - empty tags allowed
- **Agent:** Insect-Enthusiast
- **Size:** Small (<1 day)
- **Priority:** P1 (High)
- **Complexity:** Low

## Workflow

### Phase 1: Reproduction (5 minutes)
```javascript
// Reproduce bug manually
const card = createCard('Test', 'Body');
const result = addTag(card.id, '   ');  // Empty after trim
console.log(result);  // true (BUG: should be false)
console.log(getTags(card.id));  // [''] (BUG: empty string stored)
```

### Phase 2: Test Creation (10 minutes)
```javascript
// tests/tags-api.test.js - Add failing test
test('addTag should reject empty string', () => {
  const card = createCard('Test', 'Body');
  const result = addTag(card.id, '   ');  // Only whitespace
  assert.equal(result, false, 'Should reject empty tag');
  assert.equal(getTags(card.id).length, 0, 'No tags should be stored');
});

// Run test
$ npm test
✗ addTag should reject empty string
Expected false but got true
```

### Phase 3: Root Cause Analysis (5 minutes)
```javascript
// Current implementation:
function addTag(cardId, tag, skipSave = false) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  // ↓ Missing validation here! Goes straight to push
  card.tags.push(normalizedTag);  // BUG: pushes empty string
  // ...
}

// Root cause: No validation after normalization
```

### Phase 4: Minimal Fix (2 minutes)
```javascript
// Add validation check
function addTag(cardId, tag, skipSave = false) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  if (!normalizedTag) return false;  // ← Added this line
  
  if (!card.tags) card.tags = [];
  // ... rest of implementation
}
```

### Phase 5: Validation (5 minutes)
```bash
# Run failing test
$ npm test -- tags-api.test.js
✓ addTag should reject empty string

# Run full test suite
$ npm test
127 tests, 127 passed ✓
```

### Phase 6: Related Tests (10 minutes)
```javascript
// Add more edge cases while we're here
test('addTag should reject only whitespace', () => {
  const card = createCard('Test', 'Body');
  assert.equal(addTag(card.id, '   '), false);
  assert.equal(addTag(card.id, '\t\n'), false);
});

test('addTag should trim whitespace from valid tags', () => {
  const card = createCard('Test', 'Body');
  addTag(card.id, '  javascript  ');
  const tags = getTags(card.id);
  assert.equal(tags[0], 'javascript');  // Trimmed
});
```

### Phase 7: Completion (5 minutes)
```yaml
agentResult:
  agent: "insect-enthusiast"
  task: "Bug fix - empty tag validation"
  status: "success"
  artifacts:
    - path: "www/app.js"
      changes: "+1 line"
      type: "modified"
    - path: "tests/tags-api.test.js"
      changes: "+10 lines"
      type: "modified"
  tests:
    passed: 130
    failed: 0
    duration: "13ms"
  confidence: 0.98
  metadata:
    duration: "42 minutes"
    branch: "fix/empty-tag-validation"
  notes: "Minimal one-line fix, added regression tests"
```

## Success Factors
1. **Reproduction first** - Confirmed bug before fixing
2. **Test-driven fix** - Wrote failing test, then fixed
3. **Minimal change** - One line fix, surgical precision
4. **Related tests** - Added edge cases to prevent similar bugs
5. **Fast turnaround** - 42 minutes from bug report to PR

## Metrics
- **Reproduction time:** 5 minutes
- **Fix time:** 2 minutes
- **Total time:** 42 minutes
- **Code changed:** 1 line
- **Tests added:** 3
- **Regression risk:** Very low (minimal change, well-tested)

---

# Example 3: Coordinated Multi-Agent Campaign (v0.10.5)

## Campaign Overview
- **Goal:** Complete tag management feature (N1 + N2)
- **Agents:** Showrunner → Constructor (N1) → Constructor (N2) → Librarian
- **Duration:** 2 days
- **Complexity:** High (coordination required)

## Workflow

### Phase 1: Planning (Showrunner, 30 minutes)
```yaml
# Showrunner creates campaign plan
campaign:
  name: "Tag Management Implementation"
  goal: "Complete tagging infrastructure and UI"
  phases:
    - Infrastructure (N1)
    - UI Implementation (N2)
    - Documentation (Librarian)
  agents:
    constructor: [N1, N2]
    librarian: [docs]
  timeline: "2 days"
```

### Phase 2: Infrastructure (Constructor, 2 hours)
```yaml
# N1-tagging-infrastructure (see Example 1 above)
result:
  status: "success"
  artifacts: [app.js, tags-api.test.js]
  
# Showrunner receives HANDOFF message
handoff:
  from: "constructor"
  nextAgent: "constructor"
  nextTask: "N2-tag-management-ui"
  context:
    completedTasks: ["N1-tagging-infrastructure"]
    apiDocumentation: "AI_DEVELOPER_GUIDE.md lines 400-486"
    testExamples: "tests/tags-api.test.js"
```

### Phase 3: UI Implementation (Constructor, 4 hours)
```yaml
# N2-tag-management-ui
# Constructor receives handoff context, knows:
# - API is ready (getTags, addTag, etc.)
# - Tests are comprehensive
# - Documentation available

workflow:
  1. Display tags in card list/detail (1h)
  2. Add tag input component (1.5h)
  3. Implement autocomplete (1h)
  4. Wire up delete functionality (0.5h)

result:
  status: "success"
  artifacts:
    - www/app.js (+80 lines)
    - www/styles.css (+40 lines)
```

### Phase 4: Documentation (Librarian, 30 minutes)
```yaml
# Librarian receives handoff
handoff:
  from: "constructor"
  context:
    feature: "Tag Management"
    userFacingChanges:
      - "Add tags to cards using input field"
      - "Autocomplete from existing tags"
      - "View tags in card list and detail"
      - "Remove tags with delete button"
    version: "0.10.5"

workflow:
  1. Pull latest from main
  2. Update README with tag features
  3. Update version history
  4. Create PR

result:
  status: "success"
  artifacts:
    - README.md (+25 lines)
    - AI_DEVELOPER_GUIDE.md (updated tag section)
```

### Phase 5: Integration (Showrunner, 15 minutes)
```yaml
# Showrunner validates campaign completion
validation:
  - All tasks complete: ✓
  - All tests passing: ✓
  - Documentation updated: ✓
  - No merge conflicts: ✓
  - PRs created: ✓

# Creates release
release:
  version: "0.10.5"
  title: "Tag Management System"
  features:
    - "Complete tag API"
    - "Tag management UI"
    - "Autocomplete from existing tags"
  tests: "130 total (19 new)"
```

## Communication Flow

### Message 1: Constructor → Showrunner (N1 Complete)
```yaml
message:
  type: "HANDOFF"
  payload:
    completedTasks: ["N1-tagging-infrastructure"]
    result: { status: "success", confidence: 0.95 }
    nextAgent: "constructor"
    nextTask: "N2-tag-management-ui"
    context:
      apiReady: true
      testsComplete: true
      docsUpdated: true
```

### Message 2: Showrunner → Constructor (N2 Assignment)
```yaml
message:
  type: "REQUEST"
  payload:
    task: "N2-tag-management-ui"
    dependencies:
      - N1: "complete" ✓
    context:
      apiLocation: "www/app.js lines 1200-1300"
      testExamples: "tests/tags-api.test.js"
      guidelines: "Follow bookmark UI pattern"
```

### Message 3: Constructor → Showrunner (N2 Complete)
```yaml
message:
  type: "HANDOFF"
  payload:
    completedTasks: ["N1", "N2"]
    result: { status: "success", confidence: 0.92 }
    nextAgent: "librarian"
    context:
      userFacingChanges: [list of features]
      version: "0.10.5"
```

### Message 4: Showrunner → Librarian (Doc Request)
```yaml
message:
  type: "REQUEST"
  payload:
    task: "update-docs-for-tag-management"
    context:
      version: "0.10.5"
      features: [from N2 handoff]
      mainBranch: "main"
```

## Success Factors
1. **Clear handoffs** - Each agent knew what to do next
2. **Context preservation** - Information flowed between agents
3. **Validation gates** - Showrunner checked completion at each phase
4. **Communication** - Agents reported status regularly
5. **Coordination** - Orchestrator prevented conflicts

## Metrics
- **Total time:** 2 days (as estimated)
- **Agent switches:** 4 (smooth transitions)
- **Merge conflicts:** 0
- **Rework required:** 0
- **Tests added:** 19
- **User satisfaction:** High

---

# Example 4: Recovery from Failure

## Scenario
Constructor attempts N4-extensions-page but encounters blocker

## Initial Workflow (Failed)

### Attempt 1 (Constructor, 30 minutes)
```yaml
task: "N4-extensions-page"
preFlightCheck:
  - Git status clean: ✓
  - Tests passing: ✓
  - Dependencies: ✗ N3-extend-store-mods incomplete

status: "blocked"
blockers:
  - type: "dependency"
    description: "N3 store.mods structure not defined"
```

### Recovery (Constructor, 15 minutes)
```yaml
# Constructor sends ERROR message
message:
  type: "ERROR"
  payload:
    severity: "error"
    errorCode: "DEPENDENCY_INCOMPLETE"
    message: "Cannot proceed with N4 - N3 blocked"
    recovery:
      options:
        1: "Wait for N3 completion"
        2: "Complete N3 myself (15min estimated)"
        3: "Mock N3 structure for N4 development"

# Showrunner responds
response:
  decision: "Complete N3 first"
  rationale: "N3 is small, unblocks N4 and future work"
```

### Revised Workflow (Success)

### Attempt 2a: N3 First (Constructor, 20 minutes)
```yaml
task: "N3-extend-store-mods"
workflow:
  1. Define mods metadata structure
  2. Update store initialization
  3. Update save/load functions
  4. Add tests

result:
  status: "success"
  duration: "20 minutes"
  nextTask: "N4-extensions-page"
```

### Attempt 2b: N4 Now (Constructor, 3 hours)
```yaml
task: "N4-extensions-page"
preFlightCheck:
  - Dependencies: ✓ N3 complete

workflow:
  1. Create extensions modal UI
  2. List installed extensions
  3. Enable/disable toggles
  4. Delete functionality

result:
  status: "success"
  duration: "3 hours"
  notes: "Smooth implementation after N3 unblocked"
```

## Lessons Learned
1. **Pre-flight catches blockers early** - Saved wasted effort
2. **Clear communication** - Agent reported blocker immediately
3. **Flexible planning** - Showrunner adjusted plan
4. **Small tasks unblock big tasks** - N3 was quick win
5. **No time wasted** - Total time same as if planned correctly

---

# Workflow Patterns Summary

## Pattern 1: Linear Sequential
```
Constructor → Insect-Enthusiast → Librarian → Done
```
**When:** Simple features, clear dependencies
**Example:** N1 → N2 → Docs

## Pattern 2: Parallel Independent
```
Constructor (N1)
Constructor (N3)  → Merge → Librarian → Done
Constructor (N5)
```
**When:** Tasks have no dependencies
**Example:** Multiple small fixes

## Pattern 3: Iterative Refinement
```
Constructor → Tests fail → Insect-Enthusiast → Tests pass → Done
```
**When:** Complex features, edge cases emerge
**Example:** Fuzzy search algorithm

## Pattern 4: Coordinated Campaign
```
Showrunner plans → Constructor builds → Librarian docs → Showrunner validates
```
**When:** Multi-task features, coordination needed
**Example:** Full feature implementation

---

# Anti-Patterns to Avoid

## Anti-Pattern 1: Work Without Planning
```
Constructor jumps in → realizes dependencies → stops → plans → restarts
= Wasted time
```

## Anti-Pattern 2: Silent Failure
```
Constructor hits error → doesn't report → works around → broken code merged
= Technical debt
```

## Anti-Pattern 3: Scope Creep
```
Constructor assigned N1 → also does N2, N3, N4 → over-engineers → delays release
= Schedule slip
```

---

# Resources

**Related Guides:**
- Best Practices: `.github/agents/training/best-practices.md`
- Common Pitfalls: `.github/agents/training/common-pitfalls.md`
- Error Recovery: `.github/agents/training/error-recovery.md`

**Protocols:**
- Agent Result: `.github/agents/protocols/agent-result.schema.yaml`
- Messaging: `.github/agents/protocols/agent-messaging.protocol.yaml`
- Pre-Flight: `.github/agents/protocols/pre-flight-checklist.yaml`

**Last Updated:** 2025-11-14
**Version:** 1.0
**Based On:** Real v0.10.5 development workflows

# Common Pitfalls for Agents
# Version: 1.0
# Purpose: Document frequent mistakes and how to avoid them

# Introduction
This document catalogs common mistakes agents make during execution, with real examples, root causes, and prevention strategies. Learning from these pitfalls improves agent success rates and reduces wasted effort.

---

# Environment & Setup Pitfalls

## Pitfall 1: Starting Without Clean Git State
**What happens:**
- Agent makes changes on top of uncommitted work
- Unclear what changes belong to current task vs previous work
- Difficult to create clean PR
- Risk of including unintended changes

**Example:**
```
Constructor started N1-tagging-infrastructure with:
- 3 uncommitted files from previous experiment
- Result: PR included experimental code
- Had to manually separate changes
```

**Root cause:** Skipped pre-flight check for clean git status

**Prevention:**
- Always run pre-flight checklist
- Require "Git Status Clean" check to pass
- Consider: `git stash` if needed to save WIP

**Detection:** Pre-flight check: `git status --porcelain` returns non-empty

---

## Pitfall 2: Working on Wrong Branch
**What happens:**
- Changes committed to main instead of feature branch
- Other agents blocked from merging
- Requires force push or complicated fixes

**Example:**
```
Constructor implemented N2 on main branch:
- Blocked other PRs from merging
- Had to create new branch and cherry-pick commits
- 30 minutes wasted
```

**Root cause:** Didn't verify current branch before starting

**Prevention:**
- Check branch before starting: `git branch --show-current`
- Use branch naming convention: `feature/task-description`
- Pre-flight check for correct branch

**Detection:** Pre-flight check branch matches expected pattern

---

## Pitfall 3: Stale Dependencies
**What happens:**
- Code depends on outdated node_modules
- Tests fail with cryptic errors
- Build fails unexpectedly

**Example:**
```
Constructor on N4-extensions-page:
- Tests failed with "uvu: command not found"
- Root cause: node_modules not installed
- Fix: npm install
```

**Root cause:** Assumed dependencies were installed

**Prevention:**
- Pre-flight check: `npm ci --dry-run`
- Run `npm install` if needed
- Include in setup documentation

**Detection:** Check for node_modules/ directory and package-lock.json consistency

---

# Testing & Validation Pitfalls

## Pitfall 4: Not Running Tests Before Committing
**What happens:**
- Commit code with failing tests
- Breaks CI/CD pipeline
- Blocks other developers
- Requires fix commit

**Example:**
```
Constructor completed N1-tagging-infrastructure:
- Committed without running tests
- 2 tests failed due to typo in function name
- CI failed, PR blocked
- Quick fix commit required
```

**Root cause:** Assumed code was correct, didn't validate

**Prevention:**
- Always run `npm test` before committing
- Make it part of pre-flight and post-flight checks
- Consider git pre-commit hook

**Detection:** Pre-flight check: `npm test` exit code 0

---

## Pitfall 5: Writing Tests After Implementation
**What happens:**
- Tests written to pass current implementation
- Miss edge cases and bugs
- Tests don't catch regressions
- Lower test quality

**Example:**
```
Constructor on tag validation:
- Implemented addTag() without tests
- Wrote tests after to match implementation
- Missed edge case: empty string after trim
- Bug discovered in production use
```

**Root cause:** Didn't follow TDD approach

**Prevention:**
- Write tests first (or alongside) implementation
- Test expected behavior, not current implementation
- Include edge cases in test plan

**Best practice:** Red-Green-Refactor cycle

---

## Pitfall 6: Ignoring Test Failures
**What happens:**
- Agent marks task as success despite failing tests
- Broken code merged to codebase
- Other agents blocked by broken functionality

**Example:**
```
Constructor on N2-tag-ui:
- 2 tests failed for autocomplete
- Agent marked status: "partial" but said "complete"
- Next agent (insect-enthusiast) had to fix
```

**Root cause:** Misunderstood task completion criteria

**Prevention:**
- Define success criteria clearly: all tests must pass
- Agent result status: "success" only if tests pass
- Mark as "partial" or "failure" if tests fail

**Detection:** Parse test output, check exit code

---

# Code Quality Pitfalls

## Pitfall 7: Over-Engineering
**What happens:**
- Agent implements more than required
- Added complexity not in scope
- Longer development time
- More bugs and edge cases

**Example:**
```
Constructor on "add tag input field":
- Also added: tag color picker, tag icons, tag categories
- Took 3x longer than estimated
- Introduced 5 new bugs
- Most features not requested
```

**Root cause:** Misunderstood "minimal changes" principle

**Prevention:**
- Focus on acceptance criteria only
- Don't add "nice to have" features
- Propose enhancements separately
- Follow YAGNI (You Aren't Gonna Need It)

**Detection:** Review diff size vs expected changes

---

## Pitfall 8: Not Following Existing Patterns
**What happens:**
- Inconsistent code style
- Confusing for maintenance
- Harder to review
- May break expectations

**Example:**
```
Constructor implementing new API:
- Used different naming convention (snake_case vs camelCase)
- Different error handling pattern
- Different return value structure
- Required refactor to match codebase
```

**Root cause:** Didn't study existing code first

**Prevention:**
- Find similar code before implementing
- Follow established patterns
- Consult cardspoke-guru for conventions
- Review AI_DEVELOPER_GUIDE.md

**Detection:** Code review catches inconsistencies

---

## Pitfall 9: Leaving Debug Code
**What happens:**
- console.log() statements everywhere
- Commented-out code blocks
- Temporary variables and functions
- Cluttered, unprofessional code

**Example:**
```javascript
// Constructor's debug code in production:
function addTag(cardId, tag) {
  console.log('addTag called', cardId, tag);  // ← forgot to remove
  console.log('store before:', store.cards[cardId]);
  const result = // ...
  console.log('result:', result);  // ← forgot to remove
  return result;
}
```

**Root cause:** Didn't clean up before committing

**Prevention:**
- Remove all console.log() before commit
- Delete commented-out code
- Use debugger or proper logging for development
- Post-flight check for console.log

**Detection:** grep for console.log, check for commented blocks

---

## Pitfall 10: Magic Numbers and Strings
**What happens:**
- Hard-coded values scattered in code
- Difficult to change configuration
- Unclear meaning
- Harder to test

**Example:**
```javascript
// Bad: magic numbers
if (results.length > 100) { ... }
setTimeout(fn, 3000);

// Good: named constants
const MAX_SEARCH_RESULTS = 100;
const TOAST_DURATION_MS = 3000;
if (results.length > MAX_SEARCH_RESULTS) { ... }
setTimeout(fn, TOAST_DURATION_MS);
```

**Root cause:** Quick coding without considering maintainability

**Prevention:**
- Extract constants for configurable values
- Use named constants for clarity
- Document why specific values are chosen

**Detection:** Code review, linting rules

---

# Dependency & Coordination Pitfalls

## Pitfall 11: Starting Without Dependencies
**What happens:**
- Agent works on N2 before N1 is complete
- Builds on unstable foundation
- Has to redo work when dependency changes

**Example:**
```
Constructor started N2-tag-management-ui:
- N1-tagging-infrastructure was status: "partial"
- Built UI using incomplete API
- N1 API changed after completion
- Had to refactor N2 completely
```

**Root cause:** Didn't check dependency status

**Prevention:**
- Pre-flight check: verify dependencies complete
- Check agent results for dependency status
- Wait for status: "success" before proceeding
- Coordinate via messaging protocol

**Detection:** Parse dependency agent results

---

## Pitfall 12: Merge Conflicts
**What happens:**
- Two agents modify same files simultaneously
- Git merge conflicts on merge
- Manual resolution required
- Development slowed

**Example:**
```
Constructor and Bulldozer both edited app.js:
- Constructor: added tag functions
- Bulldozer: cleaned up old code
- Merge conflict in same section
- Required human intervention
```

**Root cause:** No coordination between agents

**Prevention:**
- Check for file locks before starting
- Send STATUS messages about what files you're editing
- Coordinate via messaging protocol
- Use orchestrator to sequence work

**Detection:** Check message bus for file ownership

---

## Pitfall 13: Not Communicating Progress
**What happens:**
- Agent works silently for 30+ minutes
- Orchestrator doesn't know if stuck or working
- Can't provide help if needed
- Wastes time if on wrong track

**Example:**
```
Constructor on N4-extensions-page:
- No STATUS message for 45 minutes
- Was actually stuck on CSS layout
- Could have asked for help
- Eventually gave up, marked as "blocked"
```

**Root cause:** Didn't follow messaging protocol

**Prevention:**
- Send STATUS every 5-10 minutes
- Request help when stuck >15 minutes
- Report blockers immediately
- Use messaging for coordination

**Detection:** Monitor time since last STATUS message

---

# Documentation Pitfalls

## Pitfall 14: Outdated Comments
**What happens:**
- Code changes but comments don't
- Comments mislead future developers
- Confusion about intent

**Example:**
```javascript
// Returns array of tags (lowercase)  ← outdated comment
function getTags(cardId) {
  const card = store.cards[cardId];
  return card.tags || [];  // Actually returns as-stored, not lowercase
}
```

**Root cause:** Updated code but forgot to update comment

**Prevention:**
- Update comments when changing code
- Remove comments that become incorrect
- Prefer self-documenting code over comments

**Detection:** Review comments during code review

---

## Pitfall 15: Missing Documentation Updates
**What happens:**
- New features not documented
- README out of date
- Users don't discover features
- Support burden increases

**Example:**
```
Constructor added tag API in v0.10.5:
- Didn't update README
- Didn't update AI_DEVELOPER_GUIDE
- Other agents didn't know API existed
- Functionality re-implemented multiple times
```

**Root cause:** Focused only on code, not docs

**Prevention:**
- Update README for user-facing changes
- Update AI_DEVELOPER_GUIDE for dev-facing changes
- Include doc updates in task scope
- Librarian agent can help

**Detection:** Check if docs mention new features

---

## Pitfall 16: Vague Commit Messages
**What happens:**
- Hard to understand what changed
- Difficult to find specific changes
- Git history not useful

**Example:**
```
Bad commit messages:
- "fix bug"
- "update code"
- "changes"
- "wip"

Good commit messages:
- "Fix tag validation to reject empty strings"
- "Add tag autocomplete with datalist"
- "Update README with Tag API documentation"
```

**Root cause:** Not thinking about git history

**Prevention:**
- Write descriptive commit messages
- Include task ID: "N1: Implement tag API"
- Explain what and why, not how
- Use conventional commit format

**Format:** `<type>: <description>`
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructuring
- test: Test changes

---

# Performance Pitfalls

## Pitfall 17: Premature Optimization
**What happens:**
- Agent optimizes before measuring
- Adds complexity for negligible gain
- Harder to maintain

**Example:**
```
Constructor on search feature:
- Implemented complex caching system
- Added memoization everywhere
- Search was already fast (<50ms)
- Added 200 lines of complexity
```

**Root cause:** Assumed performance would be issue

**Prevention:**
- Measure first, optimize later
- Focus on correctness first
- Optimize only if needed
- Profile to find real bottlenecks

**Rule:** Premature optimization is the root of all evil

---

## Pitfall 18: Inefficient Algorithms
**What happens:**
- Agent uses O(n²) when O(n) exists
- Performance degrades with scale
- Becomes problem in production

**Example:**
```javascript
// Bad: O(n²)
function findDuplicateTags(cards) {
  const duplicates = [];
  for (const card1 of cards) {
    for (const card2 of cards) {
      if (card1.tags.some(t => card2.tags.includes(t))) {
        duplicates.push(card1.id);
      }
    }
  }
  return duplicates;
}

// Good: O(n)
function findDuplicateTags(cards) {
  const seen = new Set();
  const duplicates = [];
  for (const card of cards) {
    for (const tag of card.tags) {
      if (seen.has(tag)) {
        duplicates.push(card.id);
      }
      seen.add(tag);
    }
  }
  return duplicates;
}
```

**Root cause:** Not considering algorithmic complexity

**Prevention:**
- Consider Big O notation
- Use appropriate data structures
- Profile with realistic data sizes
- Consult algorithms for common problems

---

# Error Handling Pitfalls

## Pitfall 19: Silent Failures
**What happens:**
- Errors caught but not logged or reported
- User sees nothing wrong but feature broken
- Difficult to debug

**Example:**
```javascript
// Bad: silent failure
function addTag(cardId, tag) {
  try {
    // ... implementation
  } catch (err) {
    return false;  // Silently fails, no logging
  }
}

// Good: reported failure
function addTag(cardId, tag) {
  try {
    // ... implementation
  } catch (err) {
    console.error('Failed to add tag:', err);
    showToast(`Failed to add tag: ${err.message}`, 'error');
    return false;
  }
}
```

**Root cause:** Catch-all error handling without reporting

**Prevention:**
- Always log errors (at minimum)
- Show user-facing errors when appropriate
- Include error context for debugging
- Don't swallow exceptions silently

---

## Pitfall 20: Overly Broad Try-Catch
**What happens:**
- Catches unexpected errors
- Hides real bugs
- Makes debugging harder

**Example:**
```javascript
// Bad: catches everything
try {
  const card = store.cards[cardId];
  const normalizedTag = tag.trim().toLowerCase();
  card.tags.push(normalizedTag);  // Might throw if card is undefined
  save();
} catch (err) {
  return false;  // Catches typos, logic errors, everything
}

// Good: specific error handling
const card = store.cards[cardId];
if (!card) {
  console.error('Card not found:', cardId);
  return false;
}

try {
  const normalizedTag = tag.trim().toLowerCase();
  card.tags.push(normalizedTag);
  save();
} catch (err) {
  console.error('Failed to save tag:', err);
  throw err;  // Re-throw unexpected errors
}
```

**Root cause:** Defensive programming without specificity

**Prevention:**
- Catch specific expected errors only
- Validate before risky operations
- Let unexpected errors bubble up
- Don't use try-catch for control flow

---

# Estimation & Planning Pitfalls

## Pitfall 21: Underestimating Complexity
**What happens:**
- Agent marks task as "Small (S)" when it's actually "Large (L)"
- Takes 3x longer than expected
- Impacts downstream planning

**Example:**
```
Task: "Add tag management UI" - marked S (½ day)
Reality:
- Input component: 2 hours
- Autocomplete: 3 hours
- Chip display: 2 hours
- Delete functionality: 1 hour
- Tests: 2 hours
- Total: 10 hours (2 days) - actually M/L size
```

**Root cause:** Didn't break down task fully before estimating

**Prevention:**
- List all subtasks before estimating
- Consider: implementation, tests, docs, edge cases
- Add buffer for unknowns (1.5x estimate)
- Err on side of larger estimate

---

## Pitfall 22: Working on Multiple Tasks Simultaneously
**What happens:**
- Context switching overhead
- Incomplete work on multiple tasks
- Harder to track progress
- Lower quality

**Example:**
```
Constructor:
- Started N1-tagging-infrastructure
- Got blocked, started N2-tag-ui in parallel
- Got blocked on N2, started N3-store-mods
- All three tasks incomplete, confused state
```

**Root cause:** Trying to maximize throughput

**Prevention:**
- Complete one task fully before starting next
- If blocked, report blocker and wait/escalate
- Don't start parallel work unless truly independent
- Focus on depth over breadth

---

# Recovery Strategies

When you make a mistake:

1. **Acknowledge it:** Don't hide errors or continue blindly
2. **Assess impact:** How bad is it? Can it be fixed quickly?
3. **Report it:** Send ERROR message with details
4. **Fix or rollback:** Either fix the issue or revert changes
5. **Document it:** Add to this pitfall list to help others
6. **Learn from it:** Understand root cause, prevent recurrence

---

# Checklist to Avoid Pitfalls

Before starting task:
- [ ] Run pre-flight checklist
- [ ] Verify dependencies complete
- [ ] Check for similar code patterns
- [ ] Consult cardspoke-guru if unsure

During task:
- [ ] Write tests first or alongside code
- [ ] Follow existing patterns
- [ ] Make minimal changes
- [ ] Send STATUS updates
- [ ] Run tests frequently

Before completing:
- [ ] Run all tests
- [ ] Remove debug code
- [ ] Update documentation
- [ ] Clean commit message
- [ ] Run post-flight checklist

---

# Statistics (As of 2025-11-14)

Most common pitfalls in CardSpoke agents:
1. Not running tests before commit (35% of failures)
2. Starting without dependencies (20%)
3. Over-engineering solutions (15%)
4. Not following patterns (12%)
5. Leaving debug code (10%)
6. Others (8%)

Target: Reduce pitfall occurrences by 50% in next quarter

---

**Resources:**
- Best Practices: `.github/agents/training/best-practices.md`
- Error Recovery: `.github/agents/training/error-recovery.md`
- Protocols: `.github/agents/protocols/`

**Last Updated:** 2025-11-14
**Version:** 1.0
**Contributors:** Lessons learned from all agents

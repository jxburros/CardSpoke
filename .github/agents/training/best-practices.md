# Agent Best Practices
# Version: 1.0
# Purpose: Proven patterns and approaches for effective agent execution

# Core Principles

## 1. Start with Understanding
**Before making any changes:**
- Read the full task description and acceptance criteria
- Understand the context and motivation
- Identify dependencies and relationships
- Check for similar code patterns in the codebase
- Consult cardspoke-guru for guidance on patterns

**Why:** Prevents rework, ensures alignment with project goals

**Example Success:**
Constructor agent on N1-tagging-infrastructure:
- Consulted guru for tag API patterns
- Found similar pattern in bookmark management
- Reused normalization approach
- Completed in 18 minutes with 19 passing tests

## 2. Plan Before Coding
**Create a mental (or written) plan:**
- What files need to be changed?
- What tests need to be written?
- What edge cases need handling?
- What could go wrong?

**Why:** Reduces mistakes, makes code review easier

**Example Success:**
Constructor on N2-tag-management-ui:
- Planned: input component, chip display, autocomplete
- Identified edge cases: empty tags, duplicates, special chars
- Wrote tests first for each component
- Implementation was straightforward following plan

## 3. Make Minimal Changes
**Change only what's necessary:**
- Avoid refactoring unrelated code
- Don't "improve" things not in scope
- Keep diffs focused and reviewable
- Preserve existing patterns and style

**Why:** Easier to review, less risky, faster to merge

**Example Success:**
Librarian on README updates:
- Changed only version numbers and feature descriptions
- Didn't reformat entire document
- 5-minute PR review and merge

**Example Failure:**
Constructor "improving" code style while adding feature:
- Changed 200 lines across 5 files
- Made feature change hard to spot
- PR review took hours
- Had to split into two PRs

## 4. Test Early and Often
**Testing strategy:**
- Write tests before or alongside code
- Run tests after every significant change
- Don't wait until "done" to run tests
- Test edge cases and error conditions

**Why:** Catches bugs early, validates approach, builds confidence

**Example Success:**
Insect-Enthusiast on tag validation bug:
- Wrote failing test reproducing bug
- Fixed code until test passed
- Added tests for related edge cases
- Prevented regression

## 5. Document as You Go
**Documentation standards:**
- Update inline comments for complex logic
- Update README for user-facing changes
- Add JSDoc for new functions
- Keep AI_DEVELOPER_GUIDE in sync

**Why:** Future agents (and humans) understand your work

**Example Success:**
Constructor documenting Tag API:
- Added JSDoc for all 5 tag functions
- Updated AI_DEVELOPER_GUIDE with API section
- Created examples in comments
- Made it easy for next agent to use

## 6. Communicate Proactively
**When to communicate:**
- Send STATUS messages during long work (every 5-10 min)
- REQUEST guidance when uncertain
- Report ERRORS immediately when stuck
- HANDOFF with context when passing to next agent

**Why:** Enables coordination, gets help faster, prevents bottlenecks

**Example Success:**
Constructor on complex feature:
- Sent STATUS at 25%, 50%, 75% progress
- Requested clarification on ambiguous requirement
- Got response in 2 minutes, saved potential rework

## 7. Handle Errors Gracefully
**Error handling:**
- Catch expected errors and provide helpful messages
- Don't let exceptions crash the application
- Log enough context for debugging
- Suggest recovery actions

**Why:** Improves user experience, easier debugging

**Example Success:**
Constructor implementing tag input:
```javascript
try {
  addTag(cardId, tag);
  showToast('Tag added successfully');
} catch (err) {
  console.error('Failed to add tag:', err);
  showToast(`Failed to add tag: ${err.message}`, 'error');
}
```

## 8. Clean Up After Yourself
**Before completing:**
- Remove console.log() debugging statements
- Delete commented-out code
- Remove unused imports/variables
- Clean up test files and fixtures

**Why:** Professional code, easier maintenance

**Example Failure:**
Constructor left 15 console.log() statements:
- Cluttered browser console
- Made real errors hard to spot
- Required cleanup commit

## 9. Validate Your Work
**Pre-completion checklist:**
- All tests pass
- No linter errors
- Code follows project patterns
- Documentation updated
- No TODOs added without issue links

**Why:** Quality gate, prevents broken code from merging

**Example Success:**
Constructor using pre-flight and post-flight checks:
- Caught version number mismatch before commit
- Fixed linting errors
- Updated package.json
- Smooth PR review

## 10. Learn from Failures
**When something goes wrong:**
- Document what happened
- Understand root cause
- Share learnings with other agents
- Update protocols/checklists to prevent recurrence

**Why:** Continuous improvement, prevents repeated mistakes

**Example Success:**
After constructor broke tests 3 times:
- Added "run tests before commit" to pre-flight checklist
- Made tests required gate
- No test breaks in next 10 PRs

# Workflow Patterns

## Pattern: Test-Driven Development
```
1. Write failing test for desired behavior
2. Run test to confirm it fails
3. Implement minimal code to make test pass
4. Run test to confirm it passes
5. Refactor if needed
6. Run test again to ensure still passes
7. Move to next test
```

**When to use:** New features, bug fixes
**Benefits:** Confidence in correctness, regression prevention
**Example:** All tag API development in v0.10.5

## Pattern: Spike Then Implement
```
1. Create spike branch for experimentation
2. Try approach quickly without tests
3. Evaluate if approach works
4. Delete spike branch
5. Implement properly with tests on feature branch
```

**When to use:** Uncertain approaches, learning new patterns
**Benefits:** Fail fast, learn before committing
**Example:** Testing fuzzy search algorithms before full implementation

## Pattern: Incremental Enhancement
```
1. Implement basic version first
2. Ensure tests pass
3. Commit and push
4. Add enhancements one at a time
5. Test after each enhancement
6. Commit frequently
```

**When to use:** Large features, complex changes
**Benefits:** Always have working version, easier to debug
**Example:** Tag management UI (first display, then input, then autocomplete)

## Pattern: Copy and Modify
```
1. Find similar existing code
2. Copy structure and patterns
3. Modify for new use case
4. Ensure consistency with original
5. Test thoroughly
```

**When to use:** Similar features, maintaining consistency
**Benefits:** Proven patterns, consistent codebase
**Example:** Card duplication following card creation pattern

## Pattern: Consult Then Execute
```
1. Identify uncertainty or complexity
2. Send REQUEST to cardspoke-guru
3. Wait for guidance (or timeout)
4. Apply guidance to implementation
5. Validate results match guidance
```

**When to use:** Unfamiliar patterns, best practices questions
**Benefits:** Leverage existing knowledge, avoid mistakes
**Example:** Constructor asking about naming conventions

# Common Scenarios

## Scenario: Tests Failing After Implementation
**What to do:**
1. Read test failure messages carefully
2. Identify which test(s) are failing
3. Reproduce failure locally
4. Check if:
   - Test expectations are correct
   - Implementation has bug
   - Test fixtures need updating
5. Fix issue (code or test)
6. Re-run all tests
7. If still failing, ask for help

**Example:**
```
Test: "Tag input should reject empty strings"
Error: Expected addTag to return false, got true

Analysis:
- Test expectation is correct (empty tags should be rejected)
- Implementation missing validation

Fix:
function addTag(cardId, tag) {
  const normalizedTag = tag.trim().toLowerCase();
  if (!normalizedTag) return false;  // ← Added validation
  // ... rest of implementation
}
```

## Scenario: Merge Conflict
**What to do:**
1. Don't panic - conflicts are normal
2. Pull latest from main: `git pull origin main`
3. Review conflicts carefully
4. Decide which changes to keep:
   - Your changes (if yours are newer/better)
   - Their changes (if theirs are correct)
   - Combination (most common)
5. Mark conflict as resolved
6. Test thoroughly (conflicts can break logic)
7. Commit resolution

**Prevention:**
- Pull from main frequently
- Coordinate with other agents via messages
- Keep changes focused (less overlap = fewer conflicts)

## Scenario: Unclear Requirements
**What to do:**
1. Don't guess and implement wrong thing
2. Send QUERY message to showrunner or middle-manager
3. Include:
   - What's unclear
   - Multiple interpretations
   - Your recommendation
4. Wait for clarification (with reasonable timeout)
5. If timeout, implement most conservative interpretation
6. Document assumption in code/commit

**Example:**
```
QUERY:
"N2 says 'tag management UI' but doesn't specify:
- Should it be inline in card editor or separate panel?
- Should it support bulk tag operations?

Options:
1. Inline with basic add/remove (simple)
2. Separate panel with bulk ops (complex)

Recommendation: Start with option 1, expand later if needed"
```

## Scenario: Performance Issue
**What to do:**
1. Measure first (don't optimize prematurely)
2. Identify bottleneck with profiling
3. Consider:
   - Algorithmic improvement
   - Caching
   - Lazy loading
   - Pagination
4. Implement optimization
5. Measure again to confirm improvement
6. Ensure tests still pass

**Example:**
```
Problem: Search takes 500ms on 1000 cards

Profile:
- 400ms: iterating all cards
- 80ms: string operations
- 20ms: rendering

Solution: Early exit optimization
- Stop after 100 results
- Result: 50ms average (10x faster)
```

## Scenario: Breaking Change Needed
**What to do:**
1. Assess if truly necessary
2. Document why breaking change is needed
3. Create migration path for existing data
4. Bump version appropriately (major)
5. Update all affected code
6. Provide clear upgrade instructions
7. Test migration thoroughly

**Example:**
```
Change: Rename card.tags to card.labels

Why: Avoid confusion with HTML tags

Migration:
function migrateSchema_v4_to_v5(store) {
  for (const id in store.cards) {
    if (store.cards[id].tags) {
      store.cards[id].labels = store.cards[id].tags;
      delete store.cards[id].tags;
    }
  }
  store.schemaVersion = 5;
}
```

# Code Quality Standards

## Naming Conventions
- **Functions:** camelCase, verb first (`addTag`, `removeCard`)
- **Variables:** camelCase, descriptive (`cardId`, not `c`)
- **Constants:** UPPER_SNAKE_CASE (`APP_VERSION`, `MAX_RESULTS`)
- **CSS Classes:** kebab-case (`card-header`, `btn-primary`)

## Function Size
- **Ideal:** ≤50 lines
- **Maximum:** ≤100 lines
- **If longer:** extract helper functions

## Comment Guidelines
- **Do comment:**
  - Complex algorithms
  - Non-obvious decisions
  - Public APIs (JSDoc)
  - TODOs with issue links
- **Don't comment:**
  - Obvious code (`i++; // increment i`)
  - Redundant descriptions
  - Commented-out code (delete it)

## Test Coverage
- **Required:** Core functionality
- **Recommended:** Edge cases
- **Optional:** Trivial getters/setters
- **Target:** >80% coverage for new code

# Performance Guidelines

## When to Optimize
- When measured performance is unacceptable
- When anticipated scale will cause issues
- When optimization is simple and clear

## When NOT to Optimize
- Before measuring ("premature optimization")
- When performance is already acceptable
- When optimization adds significant complexity

## Optimization Techniques
1. **Algorithmic:** Better algorithm (O(n²) → O(n log n))
2. **Caching:** Store computed results
3. **Lazy Loading:** Load data on demand
4. **Pagination:** Process data in chunks
5. **Debouncing:** Delay rapid repeated calls

# Security Considerations

## Never Do
- Store credentials in code
- Commit secrets to git
- Trust user input without validation
- Use eval() or Function() with user data
- Expose sensitive data in logs

## Always Do
- Validate and sanitize inputs
- Use parameterized queries (if applicable)
- Escape user content in HTML
- Check for injection vulnerabilities
- Review dependencies for security issues

# Collaboration Best Practices

## Working with Other Agents
- Check for messages before starting work
- Send STATUS updates during long tasks
- HANDOFF with complete context
- Don't block others unnecessarily

## Working with Humans
- Provide clear, honest status reports
- Ask for help when truly stuck
- Document decisions and rationale
- Make PRs easy to review

## Knowledge Sharing
- Update training library with learnings
- Share successful patterns
- Document failures to prevent repeats
- Contribute to cardspoke-guru knowledge base

# Continuous Improvement

## After Each Task
- What went well?
- What could be improved?
- Were there unexpected challenges?
- What would you do differently?

## Monthly Review
- Which patterns are most effective?
- Which checks catch the most issues?
- Are protocols being followed?
- What new patterns should be added?

# Success Metrics

## Good Performance
- ≥90% of tasks complete successfully first try
- Tests pass on first run ≥80% of time
- <2 rounds of code review per PR
- No production bugs from your changes

## Areas for Improvement
- Multiple test failures before passing
- Frequent merge conflicts
- PRs require major revision
- Patterns not followed consistently

# Resources

**For More Information:**
- Agent Result Protocol: `.github/agents/protocols/agent-result.schema.yaml`
- Messaging Protocol: `.github/agents/protocols/agent-messaging.protocol.yaml`
- Pre-Flight Checklist: `.github/agents/protocols/pre-flight-checklist.yaml`
- Developer Guide: `AI_DEVELOPER_GUIDE.md`
- Cardspoke Guru: Query `cardspoke-guru` agent for guidance

**Training Library:**
- Common Pitfalls: `.github/agents/training/common-pitfalls.md`
- Workflow Examples: `.github/agents/training/workflow-examples.md`
- Error Recovery: `.github/agents/training/error-recovery.md`

---

**Remember:** These are guidelines, not rigid rules. Use judgment, adapt to context, and prioritize delivering value.

**Last Updated:** 2025-11-14
**Version:** 1.0
**Maintainers:** CardSpoke agent ecosystem

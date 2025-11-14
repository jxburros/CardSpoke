# Error Recovery Patterns for Agents
# Version: 1.0
# Purpose: Strategies for recovering from common error scenarios

# Introduction
Errors are inevitable during agent execution. This guide provides systematic approaches to diagnose and recover from common error scenarios, minimizing downtime and preserving work.

---

# General Recovery Framework

## Step-by-Step Recovery Process

1. **Detect:** Recognize that an error has occurred
2. **Assess:** Understand the scope and severity
3. **Report:** Communicate the error appropriately
4. **Contain:** Prevent error from spreading
5. **Resolve:** Fix the root cause
6. **Validate:** Confirm resolution
7. **Document:** Record for future prevention

---

# Test Failure Recovery

## Scenario: Tests Fail After Implementation

### Detection
```bash
$ npm test
...
✗ Tag input should reject empty strings
✗ Tag autocomplete should show suggestions
127 tests, 2 failed
```

### Assessment
- **Severity:** High (blocks PR)
- **Scope:** 2 tests failing
- **Impact:** Feature partially broken

### Recovery Steps

**Step 1: Read Error Messages Carefully**
```bash
# Get detailed output
npm test -- --verbose

Error: AssertionError: Expected false but got true
  at addTag (app.js:1234)
  at test (tags-api.test.js:45)
```

**Step 2: Reproduce Locally**
```javascript
// Run failing test in isolation
npm test -- tags-api.test.js

// Or run specific test
npm test -- --grep "reject empty strings"
```

**Step 3: Understand Expected vs Actual**
```javascript
// Test expectation:
const result = addTag('card-1', '   ');  // Empty after trim
expect(result).toBe(false);  // Should reject

// Current behavior:
// Returns true (doesn't validate)
```

**Step 4: Determine Fix Location**
```javascript
// Location: www/app.js, addTag function
function addTag(cardId, tag, skipSave = false) {
  const card = store.cards[cardId];
  if (!card) return false;
  
  const normalizedTag = tag.replace(/^#/, '').toLowerCase().trim();
  // ↓ Missing validation here
  if (!normalizedTag) return false;  // ← Add this check
  
  if (!card.tags) card.tags = [];
  // ...
}
```

**Step 5: Apply Fix**
```bash
# Edit file
vim www/app.js

# Add validation check
# Save file
```

**Step 6: Verify Fix**
```bash
# Run failing tests again
npm test -- tags-api.test.js

# All tests should pass
127 tests passed
```

**Step 7: Run Full Test Suite**
```bash
# Ensure no regressions
npm test

# All 127 tests should pass
```

**Step 8: Report Resolution**
```yaml
agent: "constructor"
status: "success"
blockers: []
notes: "Fixed tag validation - added empty string check"
```

### Prevention
- Write tests before implementation (TDD)
- Test edge cases explicitly
- Run tests after each significant change

---

## Scenario: Tests Pass Locally But Fail in CI

### Detection
```
PR status: ❌ Tests failed in CI
Local: ✅ All tests pass
```

### Assessment
- **Severity:** High (blocks merge)
- **Scope:** Environment-specific
- **Possible Causes:**
  - Different Node version
  - Missing dependencies
  - Timing issues
  - File path differences

### Recovery Steps

**Step 1: Get CI Logs**
```bash
# GitHub Actions
gh run view --log
```

**Step 2: Identify Differences**
```
CI environment:
- Node: 18.x
- OS: Ubuntu 22.04
- npm: 9.x

Local:
- Node: 20.x
- OS: macOS
- npm: 10.x
```

**Step 3: Reproduce CI Environment**
```bash
# Use Docker or nvm
nvm install 18
nvm use 18

# Clean install
rm -rf node_modules package-lock.json
npm install

# Run tests
npm test
```

**Step 4: Fix Environment-Specific Issue**
Common fixes:
- Update package-lock.json
- Fix file path case sensitivity
- Add timeouts for async tests
- Mock time-dependent functionality

**Step 5: Push Fix**
```bash
git add .
git commit -m "Fix CI test failures - update dependencies"
git push
```

### Prevention
- Test in CI-like environment before pushing
- Use Docker for consistent environments
- Pin dependency versions
- Avoid platform-specific code

---

# Build & Compilation Errors

## Scenario: Build Fails After Changes

### Detection
```bash
$ npm run build
Error: Cannot find module 'new-dependency'
Build failed
```

### Assessment
- **Severity:** Critical (nothing works)
- **Scope:** Entire build process
- **Cause:** Missing dependency

### Recovery Steps

**Step 1: Identify Missing Dependency**
```bash
# Error shows: Cannot find module 'new-dependency'
```

**Step 2: Check If Dependency Should Exist**
```javascript
// Did I add new import?
import { something } from 'new-dependency';  // Yes, added this

// Did I install it?
grep new-dependency package.json  // Not found
```

**Step 3: Install Missing Dependency**
```bash
npm install new-dependency

# Or if it's a dev dependency
npm install --save-dev new-dependency
```

**Step 4: Commit package.json and package-lock.json**
```bash
git add package.json package-lock.json
git commit -m "Add missing dependency: new-dependency"
```

**Step 5: Rebuild**
```bash
npm run build
# Should succeed now
```

### Prevention
- Install dependencies before using them
- Check package.json before pushing
- Pre-flight check for dependency consistency

---

# Merge Conflict Recovery

## Scenario: Pull/Merge Results in Conflicts

### Detection
```bash
$ git pull origin main
Auto-merging www/app.js
CONFLICT (content): Merge conflict in www/app.js
Automatic merge failed; fix conflicts and then commit the result.
```

### Assessment
- **Severity:** Medium (blocks progress)
- **Scope:** Specific files
- **Cause:** Overlapping changes

### Recovery Steps

**Step 1: Identify Conflicted Files**
```bash
git status
# Shows: both modified: www/app.js
```

**Step 2: Open Conflicted File**
```javascript
// www/app.js
<<<<<<< HEAD (your changes)
function addTag(cardId, tag) {
  // Your new implementation
  const normalizedTag = tag.trim().toLowerCase();
  // ...
}
=======
function addTag(cardId, tag) {
  // Their new implementation
  const cleanTag = tag.replace(/\s+/g, '').toLowerCase();
  // ...
}
>>>>>>> origin/main (their changes)
```

**Step 3: Understand Both Changes**
- **Your changes:** Use trim() for normalization
- **Their changes:** Remove all whitespace with regex
- **Decision needed:** Which approach is correct?

**Step 4: Resolve Conflict**
```javascript
// Choose best approach or combine
function addTag(cardId, tag) {
  // Use their more robust normalization
  const normalizedTag = tag.replace(/\s+/g, '').toLowerCase();
  // But keep your other improvements
  if (!normalizedTag) return false;
  // ...
}

// Remove conflict markers
// Keep only resolved code
```

**Step 5: Mark as Resolved**
```bash
git add www/app.js
```

**Step 6: Test After Resolution**
```bash
# Conflicts can break logic!
npm test
```

**Step 7: Complete Merge**
```bash
git commit -m "Merge main, resolve addTag conflict"
```

### Prevention
- Pull from main frequently
- Coordinate with other agents (messaging)
- Keep changes focused (less overlap)
- Use orchestrator to sequence work

---

# Dependency & Blocker Recovery

## Scenario: Blocked by Incomplete Dependency

### Detection
```
Task: N2-tag-management-ui
Dependency: N1-tagging-infrastructure
Status: N1 is "partial" (not complete)
```

### Assessment
- **Severity:** High (can't proceed)
- **Scope:** Current task blocked
- **Cause:** Dependency not ready

### Recovery Options

**Option 1: Wait for Dependency (Recommended)**
```yaml
message:
  from: "constructor"
  to: "orchestrator"
  type: "ERROR"
  payload:
    severity: "error"
    errorCode: "DEPENDENCY_INCOMPLETE"
    message: "Cannot proceed with N2 - N1 not complete"
    recovery:
      recommended: "Wait for N1 completion"

agentResult:
  status: "blocked"
  blockers:
    - type: "dependency"
      description: "N1-tagging-infrastructure status is 'partial'"
      resolution: "Wait for N1 to reach 'success' status"
```

**Option 2: Complete Dependency First**
```yaml
# If you have capability to complete dependency:
message:
  from: "constructor"
  to: "orchestrator"
  type: "QUERY"
  payload:
    question: "Should I complete N1 before starting N2?"
    context:
      situation: "N1 is 90% complete, just needs tests"
      estimate: "15 minutes to finish N1"
      alternative: "Wait for other agent"

# If approved, switch tasks:
agentResult:
  task: "N1-tagging-infrastructure"
  status: "success"
  notes: "Completed N1 to unblock N2"
```

**Option 3: Reduce Scope (Last Resort)**
```yaml
# If deadline is critical and dependency will take long:
message:
  from: "constructor"
  to: "orchestrator"
  type: "QUERY"
  payload:
    question: "Can we reduce scope of N2 to work without N1?"
    context:
      proposal: "Implement basic tag UI without API integration"
      tradeoffs: "Will need refactor when N1 complete"

# Only if approved:
agentResult:
  task: "N2-tag-management-ui-basic"
  status: "success"
  notes: "Implemented UI shell, pending N1 for full functionality"
  nextSteps: ["Integrate with N1 when available"]
```

### Prevention
- Check dependency status in pre-flight
- Coordinate with orchestrator on scheduling
- Don't start tasks with incomplete dependencies

---

# Performance Issue Recovery

## Scenario: Feature Too Slow

### Detection
```
User reports: "Search takes 5 seconds on large dataset"
Expected: <500ms
Actual: 5000ms (10x slower)
```

### Assessment
- **Severity:** Medium (works but poor UX)
- **Scope:** Search functionality
- **Cause:** Unknown (need profiling)

### Recovery Steps

**Step 1: Measure Performance**
```javascript
// Add timing
console.time('search');
const results = searchCards(query);
console.timeEnd('search');
// Output: search: 5234ms
```

**Step 2: Profile to Find Bottleneck**
```javascript
// Break down into stages
console.time('iterate-cards');
for (const id in store.cards) {
  // ...
}
console.timeEnd('iterate-cards');  // 4800ms - BOTTLENECK!

console.time('filter-results');
// filtering logic
console.timeEnd('filter-results');  // 200ms - OK

console.time('sort-results');
// sorting logic
console.timeEnd('sort-results');  // 234ms - OK
```

**Step 3: Identify Root Cause**
```javascript
// Found: Iterating all 10,000 cards every search
// Problem: O(n) iteration of entire dataset
```

**Step 4: Implement Optimization**
```javascript
// Option A: Early exit after N results
const MAX_RESULTS = 100;
let count = 0;
for (const id in store.cards) {
  if (count >= MAX_RESULTS) break;  // Stop early
  // ... check match
  if (matches) {
    results.push(card);
    count++;
  }
}

// Option B: Index tags for faster lookup
// Option C: Debounce search input
```

**Step 5: Measure Improvement**
```bash
Before: 5234ms
After: 187ms (28x faster)
```

**Step 6: Validate Correctness**
```bash
# Ensure optimization didn't break functionality
npm test
# All tests pass
```

### Prevention
- Profile before optimizing (no premature optimization)
- Consider performance for scale during design
- Test with realistic data sizes
- Set performance budgets

---

# Data Corruption Recovery

## Scenario: User Data Corrupted

### Detection
```
Error: Cannot read property 'tags' of undefined
Store validation: 3 cards missing 'children' array
```

### Assessment
- **Severity:** Critical (data loss risk)
- **Scope:** Multiple cards affected
- **Cause:** Schema migration bug or corrupt save

### Recovery Steps

**Step 1: Stop Further Damage**
```javascript
// Prevent auto-save
dirty = false;
clearTimeout(saveTimer);
console.error('DATA CORRUPTION DETECTED - Auto-save disabled');
```

**Step 2: Backup Current State**
```javascript
// Save current (corrupted) state for analysis
localStorage.setItem('backup-corrupted-' + Date.now(), 
  localStorage.getItem(instanceKey));
```

**Step 3: Attempt Automatic Repair**
```javascript
function repairStore(store) {
  let repaired = false;
  
  // Fix missing children arrays
  for (const id in store.cards) {
    const card = store.cards[id];
    if (!Array.isArray(card.children)) {
      card.children = [];
      repaired = true;
    }
    if (!Array.isArray(card.tags)) {
      card.tags = [];
      repaired = true;
    }
  }
  
  return { repaired, store };
}

const result = repairStore(store);
if (result.repaired) {
  console.log('Store repaired automatically');
  save();
}
```

**Step 4: If Automatic Repair Fails, Restore from Backup**
```javascript
// Load last known good state
const backupKeys = Object.keys(localStorage)
  .filter(k => k.startsWith('backup-'))
  .sort()
  .reverse();

if (backupKeys.length > 0) {
  const backup = localStorage.getItem(backupKeys[0]);
  store = JSON.parse(backup);
  console.log('Restored from backup:', backupKeys[0]);
  save();
}
```

**Step 5: Report Issue**
```yaml
message:
  type: "ERROR"
  payload:
    severity: "critical"
    errorCode: "DATA_CORRUPTION"
    message: "Store corrupted, repaired automatically"
    stack: "Cards missing required fields: children, tags"
    recovery:
      action: "Automatic repair applied"
      backupCreated: "backup-corrupted-1700000000000"
      affectedCards: 3
```

**Step 6: Validate Repair**
```javascript
function validateStore(store) {
  for (const id in store.cards) {
    const card = store.cards[id];
    assert(card.id, 'Card missing id');
    assert(card.title !== undefined, 'Card missing title');
    assert(Array.isArray(card.children), 'Card missing children array');
    assert(Array.isArray(card.tags), 'Card missing tags array');
  }
  return true;
}

try {
  validateStore(store);
  console.log('Store validation passed');
} catch (err) {
  console.error('Store still invalid:', err);
}
```

### Prevention
- Validate schema on load
- Test migrations thoroughly
- Create backups before modifications
- Implement schema version checks
- Add data validation layer

---

# Network & API Error Recovery

## Scenario: External API Call Fails

### Detection
```javascript
fetch('https://api.example.com/data')
  .then(r => r.json())
  .catch(err => {
    // Network error or API down
    console.error('API call failed:', err);
  });
```

### Assessment
- **Severity:** Medium (feature degraded)
- **Scope:** External dependency
- **Cause:** Network issue or API downtime

### Recovery Options

**Option 1: Retry with Exponential Backoff**
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      console.log(`Retry attempt ${attempt + 1} failed, retrying...`);
    }
  }
}
```

**Option 2: Fallback to Cached Data**
```javascript
async function fetchData(url) {
  try {
    const data = await fetch(url).then(r => r.json());
    // Cache successful result
    localStorage.setItem('cache-' + url, JSON.stringify(data));
    return data;
  } catch (err) {
    // Use cached data if available
    const cached = localStorage.getItem('cache-' + url);
    if (cached) {
      console.log('Using cached data due to network error');
      return JSON.parse(cached);
    }
    throw err;  // No cache, can't recover
  }
}
```

**Option 3: Graceful Degradation**
```javascript
async function loadEnhancedData() {
  try {
    const enhanced = await fetchData('https://api.example.com/enhanced');
    return { ...basicData, ...enhanced };
  } catch (err) {
    console.log('Enhanced data unavailable, using basic data');
    return basicData;  // Feature still works, just less info
  }
}
```

### Prevention
- Expect network failures
- Always have fallback strategy
- Cache when possible
- Test offline scenarios
- Set reasonable timeouts

---

# Recovery Checklist

When encountering an error:

- [ ] **Don't panic** - errors are normal and recoverable
- [ ] **Save work** - commit or stash before attempting fixes
- [ ] **Read error carefully** - understand what failed
- [ ] **Reproduce** - confirm error is consistent
- [ ] **Isolate** - narrow down to specific cause
- [ ] **Search** - check if similar error documented
- [ ] **Report** - send ERROR message with details
- [ ] **Attempt recovery** - try automated fixes first
- [ ] **Validate** - confirm fix works
- [ ] **Document** - add to this guide if novel

---

# When to Escalate

Escalate to human if:
- Error persists after multiple recovery attempts
- Data loss risk is high
- Security implications
- Requires design decision
- Outside agent's expertise
- Time investment exceeds task estimate

---

# Resources

**Related Guides:**
- Best Practices: `.github/agents/training/best-practices.md`
- Common Pitfalls: `.github/agents/training/common-pitfalls.md`
- Pre-Flight Checklist: `.github/agents/protocols/pre-flight-checklist.yaml`

**Tools:**
- Test suite: `npm test`
- Profiling: Chrome DevTools, Node --inspect
- Git: `git reflog` for recovery
- Logging: `console.error()` with context

**Last Updated:** 2025-11-14
**Version:** 1.0
**Contributors:** Lessons from real error scenarios

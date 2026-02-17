# CardSpoke Plugin System - Fixes for Critical Issues

## 1. PERMISSIONS SYSTEM IS NOT ENFORCED

### Problem
Plugins declare permissions but the system doesn't check them. A plugin can make network requests, override core functions, or access filesystems regardless of declared permissions.

---

### Fix Option 1: Quick - Permission Checks at API Boundary (RECOMMENDED for near-term)

**Implementation:** Add permission validation before granting API access.

```javascript
// In plugin-api.js - wrap each API with permission check

const PluginAPI = {
  ui: {
    inject(selector, element, position) {
      if (!hasPermission(ctx.modId, 'ui-override')) {
        throw new Error('Plugin does not have ui-override permission');
      }
      // ... existing code
    },

    registerComponent(name, component) {
      if (!hasPermission(ctx.modId, 'ui-override')) {
        throw new Error('Plugin does not have ui-override permission');
      }
      // ... existing code
    }
  },

  data: {
    createCard(data) {
      if (!hasPermission(ctx.modId, 'data-modify')) {
        throw new Error('Plugin does not have data-modify permission');
      }
      // ... existing code
    },

    updateCard(id, updates) {
      if (!hasPermission(ctx.modId, 'data-modify')) {
        throw new Error('Plugin does not have data-modify permission');
      }
      // ... existing code
    }
  },

  storage: {
    async set(key, value) {
      if (!hasPermission(ctx.modId, 'storage')) {
        throw new Error('Plugin does not have storage permission');
      }
      // ... existing code
    }
  }
};

// Helper function
function hasPermission(pluginId, permission) {
  return window.CardSpoke.Permissions.hasPermission(pluginId, permission);
}
```

**Effort:** 2-3 hours | **Risk:** Low | **Security Gain:** Medium

**Pros:**
- Simple to implement
- Minimal performance impact
- Can be added incrementally

**Cons:**
- Plugins can still execute arbitrary JS in their context
- Doesn't prevent middleware manipulation
- Doesn't prevent CSS-based attacks

---

### Fix Option 2: Medium - Restricted API Contexts Based on Permissions (BETTER)

**Implementation:** Return different API objects based on permissions granted.

```javascript
// In plugin-api.js - create permission-filtered API

function createRestrictedAPI(pluginId) {
  const permissions = window.CardSpoke.Permissions.listPermissions(pluginId);
  const api = {};

  // UI API - only if permission granted
  if (permissions.includes('ui-override')) {
    api.ui = {
      inject: (s, e, p) => realUI.inject(s, e, p),
      replace: (s, e) => realUI.replace(s, e),
      registerComponent: (n, c) => realUI.registerComponent(n, c),
      showToast: (m, t, d) => realUI.showToast(m, t, d)
    };
  } else {
    api.ui = null; // Plugin can't access UI
  }

  // Data API - check per operation
  api.data = {
    getCard: (id) => realData.getCard(id), // Always allowed

    createCard: (data) => {
      if (!permissions.includes('data-modify')) {
        throw new Error('data-modify permission required');
      }
      return realData.createCard(data);
    },

    updateCard: (id, updates) => {
      if (!permissions.includes('data-modify')) {
        throw new Error('data-modify permission required');
      }
      return realData.updateCard(id, updates);
    },

    deleteCard: (id) => {
      if (!permissions.includes('data-modify')) {
        throw new Error('data-modify permission required');
      }
      return realData.deleteCard(id);
    }
  };

  // Storage API - only if permission granted
  if (permissions.includes('storage')) {
    api.storage = realStorage;
  } else {
    api.storage = {
      get: () => Promise.reject('storage permission required'),
      set: () => Promise.reject('storage permission required'),
      remove: () => Promise.reject('storage permission required')
    };
  }

  // Events API - always allowed (plugin-scoped)
  api.events = realEvents;

  return api;
}
```

**Effort:** 4-6 hours | **Risk:** Medium | **Security Gain:** High

**Pros:**
- Enforces permissions consistently
- Plugins get null/error for disallowed APIs
- Clear separation of capabilities

**Cons:**
- Plugins can still execute arbitrary JS
- Middleware can still bypass checks
- No protection against CSS attacks

---

### Fix Option 3: Comprehensive - Separate Execution Context (BEST but complex)

**Implementation:** Run plugins in isolated context (worker/iframe) with message passing.

```javascript
// Plugin loads in worker/iframe with restricted scope
// Host app uses message passing to grant APIs

// In worker context - minimal API surface
self.onmessage = async (e) => {
  const { operation, args, apiRequest } = e.data;

  // Only respond to permitted operations
  if (apiRequest && !isPermitted(apiRequest.operation)) {
    self.postMessage({ error: 'Permission denied' });
    return;
  }

  // Execute plugin code with limited context
  try {
    const result = await executePluginOperation(operation, args);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};

// In main thread - full permission control
class PluginWorker {
  constructor(plugin) {
    this.worker = new Worker('plugin-worker.js');
    this.permissions = getPluginPermissions(plugin.id);
  }

  async callAPI(operation, args) {
    if (!this.permissions.includes(operation)) {
      throw new Error('Permission denied');
    }
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ apiRequest: { operation }, args });
      this.worker.onmessage = (e) => {
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.result);
      };
    });
  }
}
```

**Effort:** 2-3 weeks | **Risk:** High | **Security Gain:** Critical

**Pros:**
- Complete isolation
- No way for plugin to escape sandbox
- Crash isolation
- Permissions fully enforced

**Cons:**
- Significant architectural change
- Performance overhead (message passing)
- Complex debugging
- Breaks synchronous API access

---

## 2. NO INPUT VALIDATION

### Problem
Plugins can inject arbitrary CSS, HTML, and JS. No validation of manifest format or content.

---

### Fix Option 1: Quick - Basic Content Sanitization (RECOMMENDED for near-term)

**Implementation:** Use DOMPurify for HTML and validate CSS strings.

```javascript
// npm install dompurify

// In plugin loading code (www/src/02-storage-and-plugins.js)

function validatePluginContent(plugin) {
  const errors = [];

  // 1. Validate manifest structure
  if (!plugin.manifest || !plugin.manifest.name) {
    errors.push('Missing manifest.name');
  }
  if (!['theme', 'feature', 'app'].includes(plugin.manifest.layer)) {
    errors.push('Invalid manifest.layer - must be theme, feature, or app');
  }

  // 2. Sanitize CSS
  if (plugin.css) {
    const sanitizedCSS = sanitizeCSS(plugin.css);
    if (sanitizedCSS !== plugin.css) {
      console.warn(`Plugin ${plugin.id} had unsafe CSS removed`);
    }
    plugin.css = sanitizedCSS;
  }

  // 3. Validate JS (basic checks)
  if (plugin.js) {
    if (plugin.js.includes('eval(') || plugin.js.includes('Function(')) {
      errors.push('Plugin contains eval() or Function() - not allowed');
    }
  }

  // 4. Sanitize injected HTML (if any)
  if (plugin.overrides && plugin.overrides.html) {
    plugin.overrides.html = DOMPurify.sanitize(plugin.overrides.html);
  }

  if (errors.length > 0) {
    throw new Error(`Plugin validation failed: ${errors.join('; ')}`);
  }
}

function sanitizeCSS(cssString) {
  // Remove dangerous at-rules and properties
  const dangerousPatterns = [
    /@import/gi,      // External resource loading
    /@font-face/gi,   // Font face loading
    /javascript:/gi,  // JS protocol
    /behavior:/gi,    // IE behavior
    /\-moz-binding/gi, // Mozilla binding
    /expression\(/gi  // IE expressions
  ];

  let sanitized = cssString;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '/* removed */');
  });

  return sanitized;
}

// Usage in register()
register(plugin) {
  try {
    validatePluginContent(plugin);
    // ... proceed with registration
  } catch (err) {
    console.error('Plugin validation error:', err);
    return false;
  }
}
```

**Effort:** 4-6 hours | **Risk:** Low | **Security Gain:** Medium

**Pros:**
- Simple to implement
- DOMPurify is battle-tested
- Works with existing plugin system

**Cons:**
- Plugins might intentionally bypass (CSS can have other attack vectors)
- Not comprehensive XSS protection
- Sanitization might break legitimate plugins

---

### Fix Option 2: Medium - JSON Schema Validation + Content Security Policy (BETTER)

**Implementation:** Define strict schema and validate all inputs.

```javascript
// npm install ajv

import Ajv from 'ajv';

const pluginSchema = {
  type: 'object',
  required: ['id', 'manifest', 'config'],
  properties: {
    id: { type: 'string', pattern: '^[a-z0-9-]+$' },
    manifest: {
      type: 'object',
      required: ['name', 'version', 'layer'],
      properties: {
        name: { type: 'string', maxLength: 100 },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        layer: { enum: ['theme', 'feature', 'app'] },
        author: { type: 'string', maxLength: 200 },
        description: { type: 'string', maxLength: 500 },
        compatibility: { type: 'string' },
        permissions: {
          type: 'array',
          items: { enum: ['ui-override', 'storage', 'network', 'filesystem', 'core-override'] }
        }
      }
    },
    config: { type: 'object' },
    css: { type: 'string', maxLength: 100000 }, // Limit CSS size
    js: { type: 'string', maxLength: 500000 },   // Limit JS size
    overrides: { type: 'object' },
    enabled: { type: 'boolean' }
  }
};

const ajv = new Ajv({
  removeAdditional: 'all', // Remove unknown properties
  useDefaults: true
});

function validatePlugin(plugin) {
  const validate = ajv.compile(pluginSchema);
  const valid = validate(plugin);

  if (!valid) {
    const errors = validate.errors.map(e => `${e.dataPath} ${e.message}`).join('; ');
    throw new Error(`Plugin validation failed: ${errors}`);
  }

  return plugin;
}

// Also add Content Security Policy header
// In index.html:
// <meta http-equiv="Content-Security-Policy"
//   content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">

// This limits what plugins can do even if they inject code
```

**Effort:** 6-8 hours | **Risk:** Medium | **Security Gain:** High

**Pros:**
- Comprehensive validation
- Schema-driven
- Catches malformed plugins early
- CSP provides defense-in-depth

**Cons:**
- Requires schema maintenance
- CSP can break legitimate plugins
- Still doesn't prevent all attacks

---

### Fix Option 3: Comprehensive - Linting + AST Analysis (BEST but overkill)

**Implementation:** Parse and analyze plugin code before execution.

```javascript
// npm install eslint @babel/parser

import parser from '@babel/parser';
import traverse from '@babel/traverse';

function analyzePluginCode(jsCode) {
  const issues = [];

  try {
    const ast = parser.parse(jsCode, {
      sourceType: 'module',
      errorRecovery: true
    });

    traverse.default(ast, {
      // Detect eval calls
      CallExpression(path) {
        if (path.node.callee.name === 'eval') {
          issues.push('Plugin uses eval() - not allowed');
          path.remove();
        }
        if (path.node.callee.name === 'Function') {
          issues.push('Plugin uses Function() - not allowed');
          path.remove();
        }
      },

      // Detect dangerous globals
      Identifier(path) {
        if (['eval', 'Function', 'setTimeout', 'setInterval'].includes(path.node.name)) {
          if (path.isReferencedIdentifier()) {
            issues.push(`Plugin references ${path.node.name} - review for safety`);
          }
        }
      },

      // Detect network calls (flag for review)
      CallExpression(path) {
        const callee = path.get('callee');
        if (callee.isIdentifier() && ['fetch', 'XMLHttpRequest'].includes(callee.node.name)) {
          issues.push('Plugin makes network requests - verify network permission');
        }
      }
    });

  } catch (err) {
    issues.push(`Plugin code parse error: ${err.message}`);
  }

  return {
    valid: issues.length === 0,
    warnings: issues,
    sanitized: issues.length === 0 ? jsCode : null
  };
}
```

**Effort:** 1-2 weeks | **Risk:** Medium | **Security Gain:** High

**Pros:**
- Detects dangerous patterns
- Can remove/transform unsafe code
- Comprehensive analysis

**Cons:**
- Complex to maintain
- Can have false positives
- Performance overhead
- Over-engineered for most use cases

---

## 3. NO ERROR ISOLATION

### Problem
If a plugin crashes or throws an error, it propagates and can break the entire app.

---

### Fix Option 1: Quick - Wrap Middleware in Try-Catch (RECOMMENDED for near-term)

**Implementation:** Add error handling around middleware execution.

```javascript
// In middleware.js - modify execute()

async execute(operation, args) {
  const ctx = new MiddlewareContextImpl(operation, args);
  const matching = this._getMiddlewaresForOperation(operation);

  if (matching.length === 0) {
    return;
  }

  let index = 0;

  const next = async () => {
    if (ctx.prevented) return;
    if (ctx.stopped) return;
    if (index >= matching.length) return;

    const middleware = matching[index++];

    // WRAP IN TRY-CATCH
    try {
      await middleware.handler(ctx, next);
    } catch (error) {
      console.error(
        `[Middleware] Error in "${middleware.name}" (priority: ${middleware.priority}):`,
        error
      );

      // Store error in context
      ctx._error = error;
      ctx._errorMiddleware = middleware.name;

      // Don't re-throw - continue to next middleware
      // unless it's the operation handler itself
      if (middleware.name !== 'core-operation') {
        return;
      }
    }
  };

  await next();

  if (ctx._error) {
    console.warn(`Operation "${operation}" had middleware errors but continued`);
  }
}

// Also add error handler for plugin API calls
function createSafePluginAPI(ctx) {
  return {
    data: {
      createCard: safeAPICall(ctx, () => realAPI.data.createCard),
      updateCard: safeAPICall(ctx, () => realAPI.data.updateCard),
      // ... etc
    }
  };
}

function safeAPICall(ctx, apiFn) {
  return async function(...args) {
    try {
      return await apiFn()(...args);
    } catch (error) {
      console.error(`[Plugin ${ctx.modId}] API error:`, error);
      throw error; // Re-throw so plugin knows about error
    }
  };
}
```

**Effort:** 2-3 hours | **Risk:** Low | **Security Gain:** Low-Medium

**Pros:**
- Simple to implement
- Prevents middleware errors from cascading
- Minimal performance impact

**Cons:**
- Doesn't isolate plugin JS execution
- Plugins can still have errors
- Doesn't prevent hung/infinite-loop plugins

---

### Fix Option 2: Medium - Error Boundaries Per Plugin (BETTER)

**Implementation:** Create error boundary wrapper for each plugin context.

```javascript
class PluginErrorBoundary {
  constructor(pluginId, pluginName) {
    this.pluginId = pluginId;
    this.pluginName = pluginName;
    this.errors = [];
    this.isActive = true;
    this.errorThreshold = 5; // Max errors before disabling plugin
  }

  capture(operation, fn) {
    return async (...args) => {
      if (!this.isActive) {
        throw new Error(`Plugin ${this.pluginName} is disabled due to errors`);
      }

      try {
        return await fn(...args);
      } catch (error) {
        this.recordError(operation, error);

        if (this.errors.length >= this.errorThreshold) {
          this.disable();
          this.notifyUser();
          throw new Error(
            `Plugin ${this.pluginName} crashed ${this.errorThreshold} times and has been disabled`
          );
        }

        throw error; // Still throw so caller knows
      }
    };
  }

  recordError(operation, error) {
    this.errors.push({
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });

    console.error(
      `[Plugin ${this.pluginName}] Error #${this.errors.length} in ${operation}:`,
      error
    );
  }

  disable() {
    this.isActive = false;
    window.CardSpoke.Plugin.disable(this.pluginId);
    console.warn(`[Plugin] ${this.pluginName} has been automatically disabled`);
  }

  notifyUser() {
    // Show toast/modal to user
    window.CardSpoke.UI?.showToast?.(
      `Plugin "${this.pluginName}" crashed repeatedly and was disabled`,
      'error',
      5000
    );
  }

  getErrorReport() {
    return {
      pluginId: this.pluginId,
      pluginName: this.pluginName,
      errorCount: this.errors.length,
      recentErrors: this.errors.slice(-3),
      isActive: this.isActive
    };
  }
}

// Usage in plugin runtime
function enablePlugin(plugin) {
  const boundary = new PluginErrorBoundary(plugin.id, plugin.manifest.name);

  // Wrap plugin functions
  const wrappedAPI = {
    data: {
      createCard: boundary.capture('data.createCard', () => realAPI.createCard),
      updateCard: boundary.capture('data.updateCard', () => realAPI.updateCard),
      // ... etc
    },
    ui: {
      inject: boundary.capture('ui.inject', () => realUI.inject),
      // ... etc
    }
  };

  // Store boundary for later inspection
  window.CardSpoke._pluginBoundaries = window.CardSpoke._pluginBoundaries || {};
  window.CardSpoke._pluginBoundaries[plugin.id] = boundary;

  return wrappedAPI;
}
```

**Effort:** 6-8 hours | **Risk:** Low | **Security Gain:** Medium-High

**Pros:**
- Plugins can crash without breaking app
- Auto-disables broken plugins
- Error tracking per plugin
- User gets feedback

**Cons:**
- Doesn't prevent hung/infinite-loop plugins
- Adds overhead to every API call
- Complexity in error handling

---

### Fix Option 3: Comprehensive - Worker Threads / Execution Timeout (BEST but complex)

**Implementation:** Run plugins with execution timeout and worker isolation.

```javascript
// Run plugin code in web worker with timeout

class PluginSandbox {
  constructor(plugin) {
    this.plugin = plugin;
    this.worker = new Worker('plugin-sandbox-worker.js');
    this.timeout = 30000; // 30 second timeout per operation
    this.pending = new Map();
  }

  async executeOperation(operation, args) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);

      // Set timeout
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.worker.terminate();
        reject(new Error(`Plugin operation timed out: ${operation}`));
      }, this.timeout);

      // Send message to worker
      this.worker.postMessage({
        id,
        operation,
        args,
        pluginCode: this.plugin.js
      });

      // Handle response
      this.worker.onmessage = (e) => {
        if (e.data.id === id) {
          clearTimeout(timer);
          this.pending.delete(id);

          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };

      // Handle worker error
      this.worker.onerror = (err) => {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error(`Plugin worker error: ${err.message}`));
      };

      this.pending.set(id, { timer, resolve, reject });
    });
  }

  terminate() {
    this.worker.terminate();
    this.pending.forEach(({ timer }) => clearTimeout(timer));
    this.pending.clear();
  }
}

// In plugin-sandbox-worker.js:
self.onmessage = async (e) => {
  const { id, operation, args, pluginCode } = e.data;

  try {
    // Create isolated context
    const context = {
      console: {
        log: (...args) => self.postMessage({ id, log: args }),
        warn: (...args) => self.postMessage({ id, warn: args }),
        error: (...args) => self.postMessage({ id, error: args })
      },
      api: createRestrictedAPI(), // Only permitted APIs
      require: undefined,
      eval: undefined,
      Function: undefined
    };

    // Execute plugin code in context
    const fn = new Function(...Object.keys(context), pluginCode);
    const result = await fn(...Object.values(context));

    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
```

**Effort:** 2-3 weeks | **Risk:** High | **Security Gain:** Critical

**Pros:**
- Complete execution isolation
- Automatic timeout for hung plugins
- Crash isolation
- No way for plugin to break app

**Cons:**
- Significant complexity
- Performance overhead (worker creation)
- Synchronous API calls not possible
- Debugging harder

---

## 4. UNDOCUMENTED OPERATION NAMES

### Problem
Plugins must reverse-engineer what operations exist (e.g., `card.save`, `card.render`) and their signatures. No official documentation.

---

### Fix Option 1: Quick - Create Operations Registry (RECOMMENDED for near-term)

**Implementation:** Define all available operations in one centralized place.

```javascript
// New file: www/src/core/operations-registry.js

const OperationsRegistry = {
  operations: {
    'card.create': {
      description: 'Create a new card',
      args: ['cardData'],
      returns: 'Card',
      example: `
        await ctx.operation.execute('card.create', {
          title: 'My Card',
          body: 'Card content'
        });
      `
    },

    'card.update': {
      description: 'Update an existing card',
      args: ['cardId', 'updates'],
      returns: 'Card',
      example: `
        await ctx.operation.execute('card.update', 'card-123', {
          title: 'Updated Title'
        });
      `
    },

    'card.delete': {
      description: 'Delete a card (soft delete to trash)',
      args: ['cardId'],
      returns: 'void',
      example: `
        await ctx.operation.execute('card.delete', 'card-123');
      `
    },

    'card.save': {
      description: 'Save card changes to storage',
      args: ['cardId'],
      returns: 'boolean',
      example: `
        const saved = await ctx.operation.execute('card.save', 'card-123');
      `
    },

    'card.render': {
      description: 'Re-render a card in the UI',
      args: ['cardId'],
      returns: 'void',
      example: `
        await ctx.operation.execute('card.render', 'card-123');
      `
    },

    'search.execute': {
      description: 'Execute a search query',
      args: ['query', 'options'],
      returns: 'Card[]',
      example: `
        const results = await ctx.operation.execute('search.execute', 'my query', {
          limit: 50,
          fuzzy: true
        });
      `
    },

    'tag.add': {
      description: 'Add a tag to a card',
      args: ['cardId', 'tagName'],
      returns: 'void',
      example: `
        await ctx.operation.execute('tag.add', 'card-123', 'important');
      `
    }

    // ... add all other operations
  },

  register(operationName, spec) {
    if (this.operations[operationName]) {
      console.warn(`Operation ${operationName} already registered`);
      return;
    }
    this.operations[operationName] = spec;
  },

  get(operationName) {
    return this.operations[operationName];
  },

  list() {
    return Object.entries(this.operations).map(([name, spec]) => ({
      name,
      ...spec
    }));
  },

  getDocumentation() {
    // Generate markdown documentation
    let docs = '# CardSpoke Operations Reference\n\n';

    for (const [name, spec] of Object.entries(this.operations)) {
      docs += `## ${name}\n`;
      docs += `${spec.description}\n\n`;
      docs += `**Arguments:** ${spec.args.join(', ')}\n\n`;
      docs += `**Returns:** ${spec.returns}\n\n`;
      docs += `**Example:**\n\`\`\`javascript\n${spec.example}\n\`\`\`\n\n`;
    }

    return docs;
  }
};

// Export to window
if (!window.CardSpoke) window.CardSpoke = {};
window.CardSpoke.OperationsRegistry = OperationsRegistry;
```

**Effort:** 4-6 hours | **Risk:** Low | **Security Gain:** None (documentation only)

**Pros:**
- Simple to implement
- Can be auto-generated into docs
- Plugins can query operations at runtime

**Cons:**
- Must keep registry in sync with implementation
- Doesn't enforce contract

---

### Fix Option 2: Medium - Auto-Generated Docs + TypeScript Definitions (BETTER)

**Implementation:** Generate docs and type definitions from registry.

```javascript
// Create TypeScript definitions for plugins
// types/cardspoke-plugin.d.ts

declare global {
  interface CardSpokePlugin {
    api: {
      data: {
        createCard(data: CardData): Promise<Card>;
        updateCard(id: string, updates: Partial<Card>): Promise<Card>;
        deleteCard(id: string): Promise<void>;
        getCard(id: string): Promise<Card | null>;
        listCards(): Promise<Card[]>;
        getTags(cardId: string): Promise<string[]>;
        addTag(cardId: string, tag: string): Promise<void>;
        removeTag(cardId: string, tag: string): Promise<void>;
      };
      operations: {
        execute(name: string, ...args: any[]): Promise<any>;
        list(): Array<{ name: string; description: string; args: string[] }>;
        on(name: string, handler: Function): void;
      };
      // ... etc
    };
  }
}

// In plugin-api.js - provide typed operations API
const ctx = {
  api: {
    operations: {
      execute(name, ...args) {
        const spec = window.CardSpoke.OperationsRegistry.get(name);
        if (!spec) {
          throw new Error(`Unknown operation: ${name}`);
        }
        // Validate args match spec.args length
        if (args.length !== spec.args.length) {
          throw new Error(
            `Operation ${name} expects ${spec.args.length} args but got ${args.length}`
          );
        }
        // Execute operation...
      },
      list() {
        return window.CardSpoke.OperationsRegistry.list();
      }
    }
  }
};

// Generate docs from registry
const docGenerator = {
  generateMarkdown() {
    const registry = window.CardSpoke.OperationsRegistry;
    return registry.getDocumentation();
  },

  generateJSON() {
    const registry = window.CardSpoke.OperationsRegistry;
    return JSON.stringify(registry.list(), null, 2);
  }
};
```

**Effort:** 8-10 hours | **Risk:** Low | **Security Gain:** None (documentation only)

**Pros:**
- Type-safe plugin development
- Auto-complete in IDEs
- Generated docs always in sync

**Cons:**
- Requires TypeScript setup
- More maintenance

---

### Fix Option 3: Comprehensive - Operation Explorer UI (BEST for UX)

**Implementation:** Built-in UI for plugins to discover operations at runtime.

```javascript
// In plugin-api.js - add operations discovery API

const ctx = {
  api: {
    operations: {
      // List all available operations
      list() {
        return window.CardSpoke.OperationsRegistry.list();
      },

      // Get details about specific operation
      describe(operationName) {
        const spec = window.CardSpoke.OperationsRegistry.get(operationName);
        if (!spec) {
          throw new Error(`Unknown operation: ${operationName}`);
        }
        return {
          name: operationName,
          ...spec
        };
      },

      // Execute operation with validation
      async execute(operationName, ...args) {
        const spec = this.describe(operationName);

        // Validate arg count
        if (args.length !== spec.args.length) {
          throw new Error(
            `${operationName} expects ${spec.args.length} args, got ${args.length}`
          );
        }

        // Execute with error handling
        try {
          const result = await window.CardSpoke.Middleware.executeOperation(
            operationName,
            args
          );
          return result;
        } catch (error) {
          throw new Error(`Operation ${operationName} failed: ${error.message}`);
        }
      },

      // Search operations by keyword
      search(keyword) {
        const all = this.list();
        return all.filter(op =>
          op.name.includes(keyword) ||
          op.description.toLowerCase().includes(keyword.toLowerCase())
        );
      }
    },

    // UI for exploring operations
    ui: {
      showOperationExplorer() {
        const operations = ctx.api.operations.list();
        const html = `
          <div class="operation-explorer">
            <h2>Available Operations</h2>
            <input type="text" id="op-search" placeholder="Search operations...">
            <div id="op-list">
              ${operations.map(op => `
                <div class="operation-item">
                  <code>${op.name}</code>
                  <p>${op.description}</p>
                  <small>Args: ${op.args.join(', ')}</small>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        return html;
      }
    }
  }
};
```

**Effort:** 6-8 hours | **Risk:** Low | **Security Gain:** None (UI only)

**Pros:**
- Plugins can discover operations interactively
- Reduces trial-and-error
- Helpful for debugging

**Cons:**
- UI overhead
- Still requires manual checking

---

## 5. COMPONENT INTERFACE UNDEFINED

### Problem
Component registry accepts any object. No specification of what methods plugins must implement or what interface is expected.

---

### Fix Option 1: Quick - Document Component Interface (RECOMMENDED for near-term)

**Implementation:** Define and document component spec.

```javascript
// New file: www/src/core/component-spec.js

const ComponentSpec = {
  /**
   * Standard component interface
   * All UI components should implement this interface
   */
  StandardComponent: {
    /**
     * Render the component
     * @param {Object} props - Component properties
     * @returns {HTMLElement|Promise<HTMLElement>} Rendered DOM element
     */
    render: null, // Function placeholder

    /**
     * Called when component is mounted to DOM
     * Optional - for setup/initialization
     */
    onMount: null, // Function placeholder

    /**
     * Called when component is unmounted from DOM
     * Optional - for cleanup
     */
    onUnmount: null, // Function placeholder

    /**
     * Called when props change
     * Optional - for re-rendering
     */
    onPropsChange: null, // Function placeholder

    /**
     * Metadata about the component
     */
    metadata: {
      name: null,        // Human-readable name
      version: null,     // Version string
      description: null, // What the component does

      // Which standard components this can replace
      canReplace: []     // e.g., ['CardDisplay', 'Sidebar']
    },

    // Priority for component resolution
    priority: 0
  },

  /**
   * Predefined component types and their required properties
   */
  ComponentTypes: {
    'CardDisplay': {
      description: 'Renders a single card',
      required: ['render'],
      props: ['card', 'isSelected', 'isActive'],
      example: `
        {
          render(props) {
            const { card, isSelected } = props;
            const el = document.createElement('div');
            el.className = 'card' + (isSelected ? ' selected' : '');
            el.textContent = card.title;
            return el;
          },
          metadata: { name: 'Custom Card Display' }
        }
      `
    },

    'Sidebar': {
      description: 'Renders the left sidebar',
      required: ['render'],
      props: ['cards', 'selectedCardId'],
      example: `
        {
          render(props) {
            const { cards } = props;
            const el = document.createElement('aside');
            cards.forEach(card => {
              const item = document.createElement('div');
              item.textContent = card.title;
              el.appendChild(item);
            });
            return el;
          }
        }
      `
    },

    'SearchBar': {
      description: 'Renders the search input',
      required: ['render'],
      props: ['placeholder', 'onSearch'],
      example: `
        {
          render(props) {
            const input = document.createElement('input');
            input.placeholder = props.placeholder;
            input.addEventListener('input', (e) => {
              props.onSearch(e.target.value);
            });
            return input;
          }
        }
      `
    }
  },

  /**
   * Validate that a component implements the interface
   */
  validate(componentName, component) {
    const errors = [];

    // Check required render method
    if (typeof component.render !== 'function') {
      errors.push(`Component must have a render() function`);
    }

    // Check if component is registered to replace a known type
    const componentType = this.ComponentTypes[componentName];
    if (componentType && componentType.required) {
      componentType.required.forEach(prop => {
        if (!(prop in component)) {
          errors.push(`Component must have ${prop}`);
        }
      });
    }

    // Validate metadata if present
    if (component.metadata) {
      if (typeof component.metadata !== 'object') {
        errors.push(`Component.metadata must be an object`);
      }
    }

    // Validate priority if present
    if (component.priority && typeof component.priority !== 'number') {
      errors.push(`Component.priority must be a number`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  getDocumentation() {
    let docs = '# CardSpoke Component Interface\n\n';
    docs += '## Standard Component Interface\n\n';
    docs += '```javascript\n{\n';
    docs += '  render(props) { /* return HTMLElement */ },\n';
    docs += '  onMount?() { /* called when mounted */ },\n';
    docs += '  onUnmount?() { /* called when unmounted */ },\n';
    docs += '  onPropsChange?(oldProps, newProps) { /* called on prop changes */ },\n';
    docs += '  metadata?: { name, version, description },\n';
    docs += '  priority?: number\n}\n```\n\n';

    docs += '## Available Component Types\n\n';
    for (const [name, spec] of Object.entries(this.ComponentTypes)) {
      docs += `### ${name}\n`;
      docs += `${spec.description}\n\n`;
      docs += `**Props:** ${spec.props.join(', ')}\n\n`;
      docs += `**Example:**\n\`\`\`javascript\n${spec.example}\n\`\`\`\n\n`;
    }

    return docs;
  }
};

if (!window.CardSpoke) window.CardSpoke = {};
window.CardSpoke.ComponentSpec = ComponentSpec;
```

**Effort:** 3-4 hours | **Risk:** Low | **Security Gain:** None (documentation only)

**Pros:**
- Clear specification for plugin developers
- Easy to document in markdown
- Plugins know what to implement

**Cons:**
- Documentation still needs to be maintained
- No enforcement

---

### Fix Option 2: Medium - Validation at Registration (BETTER)

**Implementation:** Validate components against spec when registered.

```javascript
// In component-registry.js - add validation

register: function(name, component, priority) {
  if (!name || !component) {
    throw new Error('Component name and definition are required');
  }

  // VALIDATE COMPONENT
  const validation = window.CardSpoke.ComponentSpec.validate(name, component);
  if (!validation.valid) {
    throw new Error(
      `Component registration failed: ${validation.errors.join('; ')}`
    );
  }

  // Component is valid, proceed
  priority = priority !== undefined ? priority : (component.priority || 0);

  const existing = components.get(name);
  if (existing && componentPriorities.get(name) > priority) {
    console.warn('[ComponentRegistry] Component', name, 'not overridden (lower priority)');
    return;
  }

  // Call onMount if defined
  if (typeof component.onMount === 'function') {
    try {
      component.onMount();
    } catch (err) {
      console.warn(`Component ${name} onMount hook failed:`, err);
    }
  }

  components.set(name, component);
  componentPriorities.set(name, priority);

  console.log('[ComponentRegistry] Registered:', name, 'priority:', priority);
},

unregister: function(name) {
  if (components.has(name)) {
    const component = components.get(name);

    // Call onUnmount if defined
    if (typeof component.onUnmount === 'function') {
      try {
        component.onUnmount();
      } catch (err) {
        console.warn(`Component ${name} onUnmount hook failed:`, err);
      }
    }

    components.delete(name);
    componentPriorities.delete(name);
    console.log('[ComponentRegistry] Unregistered:', name);
  }
}
```

**Effort:** 4-6 hours | **Risk:** Low | **Security Gain:** None

**Pros:**
- Catches bad components early
- Plugins get feedback on errors
- Lifecycle hooks (mount/unmount) supported

**Cons:**
- Still doesn't define how components are actually used
- Might reject legitimate components

---

### Fix Option 3: Comprehensive - Component System with Lifecycle Management (BEST)

**Implementation:** Full component system with hooks and rendering.

```javascript
// www/src/core/component-system.js

class ComponentSystem {
  constructor() {
    this.components = new Map();
    this.instances = new Map(); // Mounted component instances
    this.roots = new Map();     // DOM roots for components
  }

  /**
   * Register a component factory
   */
  register(name, factory, priority = 0) {
    if (typeof factory !== 'function' && typeof factory.render !== 'function') {
      throw new Error('Component must be a function or have render()');
    }

    this.components.set(name, { factory, priority });
  }

  /**
   * Mount a component to a DOM element
   */
  async mount(name, element, props = {}) {
    if (!this.components.has(name)) {
      throw new Error(`Component not found: ${name}`);
    }

    const { factory } = this.components.get(name);

    // Create component instance
    const instance = typeof factory === 'function'
      ? factory(props)
      : { ...factory, props };

    // Store instance
    const instanceId = `${name}-${Date.now()}`;
    this.instances.set(instanceId, instance);
    this.roots.set(instanceId, element);

    // Call onMount hook
    if (typeof instance.onMount === 'function') {
      await instance.onMount({ props, element });
    }

    // Render component
    const rendered = await instance.render(props);
    element.appendChild(rendered);

    instance._instanceId = instanceId;
    instance._rendered = rendered;

    return instanceId;
  }

  /**
   * Unmount a component
   */
  async unmount(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    // Call onUnmount hook
    if (typeof instance.onUnmount === 'function') {
      await instance.onUnmount();
    }

    // Remove DOM
    const element = this.roots.get(instanceId);
    if (element && instance._rendered) {
      element.removeChild(instance._rendered);
    }

    // Clean up
    this.instances.delete(instanceId);
    this.roots.delete(instanceId);
  }

  /**
   * Update component props
   */
  async update(instanceId, newProps) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const oldProps = instance.props || {};
    instance.props = newProps;

    // Call onPropsChange hook
    if (typeof instance.onPropsChange === 'function') {
      await instance.onPropsChange(oldProps, newProps);
    }

    // Re-render if needed
    const element = this.roots.get(instanceId);
    if (element && instance._rendered) {
      element.removeChild(instance._rendered);
    }

    const rendered = await instance.render(newProps);
    if (element) {
      element.appendChild(rendered);
    }

    instance._rendered = rendered;
  }
}

// Export to window
if (!window.CardSpoke) window.CardSpoke = {};
window.CardSpoke.ComponentSystem = new ComponentSystem();

// Update plugin API to use component system
ctx.api.ui.registerComponent = function(name, component) {
  window.CardSpoke.ComponentSystem.register(name, component);
};
```

**Effort:** 1-2 weeks | **Risk:** Medium | **Security Gain:** None

**Pros:**
- Full lifecycle management
- Clear component interface
- Proper mount/unmount
- Props change handling

**Cons:**
- Significant refactoring
- Breaking change for existing plugins
- More complex

---

## 6. WEAK DATA ISOLATION

### Problem
Plugin storage uses string prefix for namespacing. Plugins could potentially forge keys and access other plugins' data.

---

### Fix Option 1: Quick - HMAC Signature Verification (RECOMMENDED for near-term)

**Implementation:** Sign storage keys so plugins can't forge them.

```javascript
// In plugin-api.js - add HMAC verification

class StorageNamespace {
  constructor(pluginId, masterSecret) {
    this.pluginId = pluginId;
    this.masterSecret = masterSecret || window.CardSpoke._storageSecret;
  }

  /**
   * Generate signed key
   * Plugins can't forge keys without the master secret
   */
  getSignedKey(userKey) {
    // Generate HMAC signature
    const hmac = this._generateHMAC(`${this.pluginId}:${userKey}`);
    return `plugin_${this.pluginId}_${userKey}_${hmac}`;
  }

  /**
   * Verify that a key belongs to this plugin
   */
  verifyKey(storageKey) {
    const parts = storageKey.split('_');
    if (parts[0] !== 'plugin' || parts[1] !== this.pluginId) {
      return false; // Wrong plugin
    }

    // Verify HMAC
    const expectedHmac = parts[parts.length - 1];
    const userKey = parts.slice(2, -1).join('_');
    const actualHmac = this._generateHMAC(`${this.pluginId}:${userKey}`);

    return expectedHmac === actualHmac;
  }

  /**
   * Simple HMAC-SHA256 (in production, use crypto library)
   */
  _generateHMAC(data) {
    // This is simplified - in production use crypto.subtle.sign()
    return btoa(data + this.masterSecret).substring(0, 16);
  }

  async get(key) {
    const signedKey = this.getSignedKey(key);
    const value = localStorage.getItem(signedKey);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value) {
    const signedKey = this.getSignedKey(key);
    localStorage.setItem(signedKey, JSON.stringify(value));
  }

  async remove(key) {
    const signedKey = this.getSignedKey(key);
    localStorage.removeItem(signedKey);
  }

  async list(prefix) {
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`plugin_${this.pluginId}_`) && key.includes(prefix)) {
        // Verify HMAC
        if (this.verifyKey(key)) {
          results.push(key);
        } else {
          // Tampered key - remove it
          console.warn(`Detected tampered storage key: ${key}`);
          localStorage.removeItem(key);
        }
      }
    }
    return results;
  }
}

// Usage in plugin context
ctx.api.storage = new StorageNamespace(ctx.modId);

// Initialize master secret on app boot
window.CardSpoke._storageSecret = window.CardSpoke._storageSecret ||
  btoa(Math.random().toString()).substring(0, 32);
```

**Effort:** 3-4 hours | **Risk:** Low | **Security Gain:** Medium

**Pros:**
- Simple to implement
- Detects tampering
- Minimal overhead

**Cons:**
- Master secret must be protected
- Still localStorage (not secure)
- Doesn't prevent legitimate cross-plugin reads

---

### Fix Option 2: Medium - Prefix-Based Access Control (BETTER)

**Implementation:** Enforce strict prefix validation.

```javascript
// In plugin-api.js - strict access control

class StorageAPI {
  constructor(pluginId) {
    this.pluginId = pluginId;
    this.allowedPrefix = `plugin_${pluginId}`;
    this.keyBlacklist = new Set([
      'plugin_', // Root prefix
      'app_',    // App data
      'user_',   // User data
      'system_'  // System data
    ]);
  }

  /**
   * Validate that key is safe for this plugin to access
   */
  validateKey(key) {
    // Check blacklist
    for (const banned of this.keyBlacklist) {
      if (key.startsWith(banned)) {
        throw new Error(
          `Plugin cannot access keys starting with "${banned}"`
        );
      }
    }

    return true;
  }

  getFullKey(key) {
    this.validateKey(key);
    return `${this.allowedPrefix}_${key}`;
  }

  async get(key) {
    const fullKey = this.getFullKey(key);
    const value = localStorage.getItem(fullKey);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value) {
    const fullKey = this.getFullKey(key);
    localStorage.setItem(fullKey, JSON.stringify(value));
  }

  async remove(key) {
    const fullKey = this.getFullKey(key);
    localStorage.removeItem(fullKey);
  }

  async list(prefix) {
    const results = [];
    const fullPrefix = `${this.allowedPrefix}_${prefix}`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(fullPrefix)) {
        // Extract user-facing key
        results.push(key.substring(this.allowedPrefix.length + 1));
      }
    }

    return results;
  }
}

// Usage
ctx.api.storage = new StorageAPI(ctx.modId);

// Plugin tries to access another plugin's data:
// await ctx.api.storage.get('plugin_other-plugin_secret')
// -> Throws: "Plugin cannot access keys starting with 'plugin_'"
```

**Effort:** 2-3 hours | **Risk:** Low | **Security Gain:** Medium

**Pros:**
- Simple and clear
- No cryptography needed
- Easy to understand

**Cons:**
- Determined plugin could still brute-force keys
- Doesn't prevent legitimate data sharing between plugins

---

### Fix Option 3: Comprehensive - Separate Storage Contexts per Plugin (BEST)

**Implementation:** Each plugin gets isolated storage (separate IndexedDB object store).

```javascript
// New file: www/src/core/isolated-storage.js

class IsolatedStorage {
  constructor(pluginId) {
    this.pluginId = pluginId;
    this.dbName = `cardspoke-plugins`;
    this.storeName = `plugin_${pluginId}`;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async list(prefix) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allKeys = request.result;
        const filtered = allKeys.filter(k => k.startsWith(prefix));
        resolve(filtered);
      };
    });
  }

  /**
   * Delete all data for this plugin (on uninstall)
   */
  async deleteAll() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Plugin API uses isolated storage
ctx.api.storage = new IsolatedStorage(ctx.modId);

// No other plugin can access this storage - it's in a separate IndexedDB object store
```

**Effort:** 6-8 hours | **Risk:** Medium | **Security Gain:** Critical

**Pros:**
- Complete isolation
- No possibility of cross-plugin data access
- Scales well (IndexedDB quota per origin, not per plugin)
- Can delete all plugin data on uninstall

**Cons:**
- Requires IndexedDB (not all browsers/environments support it)
- More complex
- Async API only (some plugins might expect sync)
- Migration needed for existing plugins

---

## Summary Table

| Issue | Option 1 (Quick) | Option 2 (Medium) | Option 3 (Comprehensive) |
|-------|------------------|------------------|-------------------------|
| **Permissions** | API boundary checks | Restricted contexts | Worker isolation |
| **Input Validation** | DOMPurify + regex | JSON Schema + CSP | AST analysis |
| **Error Isolation** | Try-catch middleware | Error boundaries | Worker timeouts |
| **Operation Names** | Registry + docs | Typed definitions | Operation explorer UI |
| **Component Interface** | Document spec | Validation | Lifecycle system |
| **Data Isolation** | HMAC signing | Prefix access control | IndexedDB isolation |

---

## Implementation Priority Recommendation

**Phase 1 (Immediate - 1-2 weeks):**
1. Permissions enforcement (Option 1)
2. Input validation (Option 1)
3. Error boundaries (Option 1)
4. Operations registry (Option 1)
5. Component documentation (Option 1)

**Phase 2 (Medium-term - 3-4 weeks):**
1. Restricted API contexts (Option 2)
2. JSON Schema validation (Option 2)
3. Typed definitions (Option 2)
4. Component validation (Option 2)

**Phase 3 (Long-term - 8+ weeks):**
1. Worker isolation (Option 3)
2. CSP implementation (Option 3)
3. Isolated storage (Option 3)
4. Full component system (Option 3)

This approach balances security improvements with implementation complexity, allowing gradual hardening of the plugin system.

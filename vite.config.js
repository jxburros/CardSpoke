/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

/**
 * Vite plugin: flatten-app-scope
 *
 * The application source layer (metadata.js, storage.js, data.js,
 * rendering.js, systems.js, state.js, kernel.js) was originally designed to
 * be concatenated into one file that runs in a single shared scope.  When
 * those files were given ESM `import`/`export` statements Rollup began
 * treating them as isolated modules.  That caused two problems:
 *
 *   1. Cross-module function calls (e.g. systems.js calling render() from
 *      rendering.js) became "free variable" references that Rollup left
 *      unresolved, and the minifier renamed the definitions (render → render$1)
 *      so they no longer matched the call sites — producing a broken bundle.
 *
 *   2. Rollup's tree-shaker removed "unreferenced" functions even with
 *      treeshake:false because the renaming made them appear unused.
 *
 * This plugin fuses all app-layer source files into one virtual module so
 * that Rollup sees a single flat scope (exactly like the original cat build)
 * while the ESM core/ submodules (middleware, permissions, plugin-api, …)
 * are left fully intact.
 *
 * The virtual module strips all intra-layer import/export declarations, and
 * converts aliased imports (e.g. `import { cloneCard as kernelCloneCard }`)
 * into `const` alias declarations so no call sites need to change.
 */
function flattenAppScope() {
  const VIRTUAL_ID = '\0cardspoke-app-layer';
  const norm = p => p.replace(/\\/g, '/');

  // App-layer files that must share one flat scope, in dependency order.
  const LAYER_RELATIVE = [
    'www/src/state.js',
    'www/src/kernel.js',
    'www/src/metadata.js',
    'www/src/storage.js',
    'www/src/data.js',
    'www/src/rendering.js',
    'www/src/systems.js'
  ];

  /**
   * Remove placeholder `/* DUPLICATE:name *\/ function _dup_…() { … }` blocks
   * produced by the deduplication pass above.  Uses a brace counter to find
   * the matching closing `}` so multi-line function bodies are handled.
   */
  function removeDuplicatePlaceholders(code) {
    const MARKER = '/* DUPLICATE:';
    let out = '';
    let i = 0;
    while (i < code.length) {
      const markerPos = code.indexOf(MARKER, i);
      if (markerPos === -1) { out += code.slice(i); break; }
      out += code.slice(i, markerPos);
      const bracePos = code.indexOf('{', markerPos);
      if (bracePos === -1) { i = code.length; break; }
      let depth = 0;
      let j = bracePos;
      while (j < code.length) {
        if (code[j] === '{') depth++;
        else if (code[j] === '}') { depth--; if (depth === 0) { j++; break; } }
        j++;
      }
      if (j < code.length && code[j] === '\n') j++;
      i = j;
    }
    return out;
  }

  /**
   * Strip ESM import declarations for intra-layer files and return
   * (a) the code with those imports removed, and
   * (b) a list of `const alias = original;` lines for aliased imports.
   */
  function stripLayerImports(code) {
    const aliasLines = [];
    // Match: import { name1, name2 as alias2, ... } from './xxx.js';
    // where xxx.js is one of the intra-layer files.
    const LAYER_FILES = ['state\\.js', 'kernel\\.js'];
    const importRe = new RegExp(
      `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]\\./(?:${LAYER_FILES.join('|')})['"]\\s*;?\\s*\\n?`,
      'g'
    );
    const cleaned = code.replace(importRe, (_, specifiers) => {
      // Parse specifiers to find aliases
      specifiers.split(',').forEach(spec => {
        const m = spec.trim().match(/^(\w+)\s+as\s+(\w+)$/);
        if (m) {
          // e.g. `cloneCard as kernelCloneCard` → `const kernelCloneCard = cloneCard;`
          aliasLines.push(`const ${m[2]} = ${m[1]};`);
        }
        // Non-aliased specifiers (`store`, `setStore`, …) are already in
        // the shared scope via state.js / kernel.js — no declaration needed.
      });
      return ''; // remove the import statement
    });
    return { cleaned, aliasLines };
  }

  return {
    name: 'flatten-app-scope',

    resolveId(id) {
      if (id === VIRTUAL_ID) return VIRTUAL_ID;
      return null;
    },

    load(id) {
      if (id !== VIRTUAL_ID) return null;

      const ROOT = resolve(__dirname);
      let combined = '"use strict";\n';
      // Track top-level function/variable names already emitted so we can
      // skip re-declarations (e.g. uid() and cloneCard() appear in both
      // kernel.js and metadata.js with identical bodies).
      const emittedNames = new Set();

      for (const rel of LAYER_RELATIVE) {
        const filePath = resolve(ROOT, rel);
        let src = fs.readFileSync(filePath, 'utf8');

        // Strip intra-layer import declarations and collect alias var lines
        const { cleaned, aliasLines } = stripLayerImports(src);
        src = cleaned;

        // Inject alias const declarations right after the stripped import block
        if (aliasLines.length) {
          src = aliasLines.join('\n') + '\n' + src;
        }

        // Strip `export` keyword from top-level declarations so the names
        // remain local to the IIFE scope (no Rollup export bookkeeping).
        src = src.replace(
          /^export\s+((?:async\s+)?(?:default\s+)?(?:const|let|var|function|class))\s+/gm,
          '$1 '
        );
        // Remove named export lists: `export { a, b, c };`
        src = src.replace(/^export\s+\{[^}]*\}\s*;?\n?/gm, '');

        // Remove duplicate top-level function declarations already emitted by
        // an earlier file.  This handles the case where kernel.js and
        // metadata.js both define uid() and cloneCard(), and where data.js
        // defines thin wrapper functions for kernel utility names.
        // The regex must handle both unindented (kernel.js) and indented
        // (data.js, metadata.js) function declarations.
        src = src.replace(
          /^([ \t]*)(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/gm,
          (match, indent, asyncKw, name) => {
            if (emittedNames.has(name)) {
              // Replace the opening line with a placeholder marker; the
              // removeDuplicatePlaceholders() pass below removes the full body.
              return `${indent}/* DUPLICATE:${name} */ function _dup_${name}() {`;
            }
            emittedNames.add(name);
            return match;
          }
        );
        // Remove the placeholder functions we just inserted (they're just
        // `/* DUPLICATE:name */ function _dup_…() { … }`).
        // We do a simple brace-counting pass per line to handle multi-line bodies.
        src = removeDuplicatePlaceholders(src);

        combined += '\n// ─── ' + rel.split('/').pop() + ' ──────────────────────\n';
        combined += src;
      }

      return combined;
    },

    /**
     * Rewrite main.js at build time: replace all individual side-effect
     * imports for app-layer files with a single import of the virtual module.
     */
    transform(code, id) {
      if (!norm(id).endsWith('/www/src/main.js')) return null;

      let out = code;
      for (const rel of LAYER_RELATIVE) {
        const name = rel.split('/').pop();
        // Remove `import './state.js'`, `import './metadata.js'` etc.
        out = out.replace(
          new RegExp(`^import\\s+['"]\\./` + name.replace('.', '\\.') + `['"]\\s*;?\\s*\\n?`, 'gm'),
          ''
        );
      }
      // Prepend a single import to the fused virtual module.
      out = `import '${VIRTUAL_ID}';\n` + out;
      return { code: out, map: null };
    }
  };
}

export default defineConfig({
  // Serve from www/ where index.html lives
  root: 'www',

  // Build configuration — produces a single IIFE bundle at www/app.js
  build: {
    outDir: resolve(__dirname, 'www'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'www/src/main.js'),
      output: {
        // Bundle everything into a single self-executing IIFE
        format: 'iife',
        // The IIFE name is the isolated internal namespace (not the public API)
        name: 'CardSpokeCore',
        // Output directly to www/app.js (same path as the legacy cat build)
        entryFileNames: 'app.js'
      },
      // treeshake:false is still needed: even in the fused virtual module,
      // functions called as forward references (before their definition in
      // script order) are considered "dead" by Rollup's side-effect analysis.
      treeshake: false
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: 'es2020'
  },

  // Development server configuration
  server: {
    port: 3000,
    open: false,
    cors: true
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'www/src'),
      '@core': resolve(__dirname, 'www/src/core'),
      '@types': resolve(__dirname, 'types')
    }
  },

  // Plugin configuration
  plugins: [
    // Fuse the app layer into one shared-scope virtual module.
    flattenAppScope(),
    {
      // app.js is a pre-built IIFE bundle whose srcdoc template literal
      // contains raw HTML that confuses vite:import-analysis (es-module-lexer
      // trips on the `<` characters as if they were JSX).  Serve it directly
      // through the dev-server middleware so Vite never runs its transform
      // pipeline on it.
      name: 'serve-prebuilt-bundle',
      configureServer(server) {
        server.middlewares.use('/app.js', (_req, res) => {
          const bundlePath = resolve(__dirname, 'www/app.js');
          res.setHeader('Content-Type', 'application/javascript');
          res.end(fs.readFileSync(bundlePath, 'utf-8'));
        });
      }
    }
  ],

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify('0.17.0'),
    __SCHEMA_VERSION__: 4
  }
});

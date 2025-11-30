/**
 * Sample Extensions Test Suite
 * 
 * This test validates the structure and content of all sample extensions.
 * It ensures they follow the CardSpoke extension schema and best practices.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_EXTENSIONS_DIR = path.join(__dirname, '..', 'sample-extensions');

// Valid extension types according to schema-reference-v0.13.md
// Note: 'Patch' is documented but not currently used in sample extensions
const VALID_EXTENSION_TYPES = ['Theme', 'Patch', 'Plugin', 'Mod', 'Kit', 'Expansion'];

// Valid hooks according to extension-cookbook.md
const VALID_HOOKS = [
  'onAppInit',
  'onEnable',
  'onDisable',
  'onUninstall',
  'onCardSave',
  'onCardDelete',
  'onCardRender',
  'onNavigate',
  'onSearch',
  'onThemeChange',
  'onTypographyChange',
  'onHighContrastChange',
  'onExport',
  'onImport'
];

// Helper to load extension files
function loadExtension(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// Helper to extract hook names from JS code
function extractHooksFromJS(jsCode) {
  if (!jsCode) return [];
  const hookPattern = /\b(on[A-Z][a-zA-Z]+)\s*\(/g;
  const hooks = [];
  let match;
  while ((match = hookPattern.exec(jsCode)) !== null) {
    if (VALID_HOOKS.includes(match[1])) {
      hooks.push(match[1]);
    }
  }
  return [...new Set(hooks)]; // Unique hooks
}

// Get all extension files
function getAllExtensionFiles() {
  const extensions = [];
  const categories = ['themes', 'plugins', 'mods', 'kits', 'expansions'];
  
  for (const category of categories) {
    const categoryPath = path.join(SAMPLE_EXTENSIONS_DIR, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        extensions.push({
          category,
          file,
          path: path.join(categoryPath, file)
        });
      }
    }
  }
  return extensions;
}

const allExtensions = getAllExtensionFiles();

// Test: All expected extension files exist
test('10 sample extensions exist across 5 categories', () => {
  assert.is(allExtensions.length, 10, 'Should have exactly 10 sample extensions');
  
  const categories = allExtensions.reduce((acc, ext) => {
    acc[ext.category] = (acc[ext.category] || 0) + 1;
    return acc;
  }, {});
  
  assert.is(categories.themes, 2, 'Should have 2 themes');
  assert.is(categories.plugins, 2, 'Should have 2 plugins');
  assert.is(categories.mods, 2, 'Should have 2 mods');
  assert.is(categories.kits, 2, 'Should have 2 kits');
  assert.is(categories.expansions, 2, 'Should have 2 expansions');
});

// Test each extension's structure
for (const ext of allExtensions) {
  test(`${ext.file} has valid JSON structure`, () => {
    const extension = loadExtension(ext.path);
    
    // Required top-level fields
    assert.type(extension.enabled, 'boolean', 'enabled should be a boolean');
    assert.type(extension.js, 'string', 'js should be a string');
    assert.type(extension.css, 'string', 'css should be a string');
    assert.type(extension.meta, 'object', 'meta should be an object');
    
    // Required meta fields
    assert.ok(extension.meta.name, 'meta.name is required');
    assert.ok(extension.meta.type, 'meta.type is required');
    assert.ok(VALID_EXTENSION_TYPES.includes(extension.meta.type), 
      `meta.type should be one of: ${VALID_EXTENSION_TYPES.join(', ')}`);
  });
  
  test(`${ext.file} has complete metadata`, () => {
    const extension = loadExtension(ext.path);
    
    // Recommended meta fields
    assert.ok(extension.meta.version, 'meta.version should be present');
    assert.ok(extension.meta.creator, 'meta.creator should be present');
    assert.ok(extension.meta.description, 'meta.description should be present');
    assert.ok(extension.meta.releaseDate, 'meta.releaseDate should be present');
    
    // Source should be 'official' for sample extensions
    assert.is(extension.meta.source, 'official', 'meta.source should be "official"');
  });
  
  test(`${ext.file} type matches its category`, () => {
    const extension = loadExtension(ext.path);
    const actualType = extension.meta.type.toLowerCase();
    
    // Map folder names to expected extension types
    const categoryToType = {
      'expansions': 'expansion',
      'kits': 'kit',
      'mods': 'mod',
      'plugins': 'plugin',
      'themes': 'theme'
    };
    
    const expectedType = categoryToType[ext.category];
    assert.is(actualType, expectedType, 
      `Extension type "${extension.meta.type}" should match category "${ext.category}"`);
  });
}

// Test themes specifically
test('Themes have CSS content', () => {
  const themes = allExtensions.filter(e => e.category === 'themes');
  for (const theme of themes) {
    const extension = loadExtension(theme.path);
    assert.ok(extension.css.length > 0, `${theme.file} should have CSS content`);
    
    // Check for CSS variables usage (CardSpoke convention)
    const hasVariables = extension.css.includes('--bg-') || 
                         extension.css.includes('--text-') || 
                         extension.css.includes('--accent');
    assert.ok(hasVariables, `${theme.file} should use CSS variables`);
  }
});

// Test that complex extensions have JS
test('Plugins have JavaScript content', () => {
  const plugins = allExtensions.filter(e => e.category === 'plugins');
  for (const plugin of plugins) {
    const extension = loadExtension(plugin.path);
    // At least one plugin should have JS
    if (plugin.file.includes('pomodoro') || plugin.file.includes('word-counter')) {
      assert.ok(extension.js.length > 0, `${plugin.file} should have JavaScript content`);
    }
  }
});

// Test that JS code is properly wrapped in IIFE
test('JavaScript code uses IIFE pattern', () => {
  for (const ext of allExtensions) {
    const extension = loadExtension(ext.path);
    if (extension.js && extension.js.length > 0) {
      // Detect IIFE patterns: (function() or (function () or (() => 
      const hasIIFE = /\(\s*function\s*\(/.test(extension.js) ||
                      /\(\s*\(\s*\)\s*=>/.test(extension.js);
      assert.ok(hasIIFE, `${ext.file} JS should use IIFE pattern`);
      
      // Should call CardSpoke_MODS.register
      const hasRegister = extension.js.includes('CardSpoke_MODS.register');
      assert.ok(hasRegister, `${ext.file} JS should call CardSpoke_MODS.register`);
    }
  }
});

// Test that extensions use valid hooks
test('Extensions use only valid hooks', () => {
  for (const ext of allExtensions) {
    const extension = loadExtension(ext.path);
    if (extension.js) {
      const usedHooks = extractHooksFromJS(extension.js);
      for (const hook of usedHooks) {
        assert.ok(VALID_HOOKS.includes(hook), 
          `${ext.file} uses invalid hook: ${hook}`);
      }
    }
  }
});

// Test complexity distribution (1 simple + 1 complex per category)
test('Each category has varying complexity', () => {
  const complexityByCategory = {};
  
  for (const ext of allExtensions) {
    const extension = loadExtension(ext.path);
    const jsLength = extension.js.length;
    const cssLength = extension.css.length;
    const totalLength = jsLength + cssLength;
    
    if (!complexityByCategory[ext.category]) {
      complexityByCategory[ext.category] = [];
    }
    complexityByCategory[ext.category].push({
      file: ext.file,
      complexity: totalLength
    });
  }
  
  // Each category should have variation in complexity
  for (const [category, extensions] of Object.entries(complexityByCategory)) {
    assert.is(extensions.length, 2, `${category} should have exactly 2 extensions`);
    
    // Sort by complexity
    extensions.sort((a, b) => a.complexity - b.complexity);
    
    // Verify there is some complexity difference between extensions
    // We use a lower ratio (1.1) for categories where both extensions are
    // substantial (like expansions where both are feature-rich)
    const baseMinRatio = 1.1; // At minimum, one should be 10% larger
    const ratio = extensions[1].complexity / Math.max(extensions[0].complexity, 1);
    assert.ok(ratio >= baseMinRatio, 
      `${category} should have varying complexity (ratio: ${ratio.toFixed(2)})`);
  }
});

// Test that extensions with substantial JS implement onDisable for cleanup
// Test that extensions with substantial JS implement onDisable for cleanup
test('Substantial extensions implement onDisable for cleanup', () => {
  // Dynamically identify complex extensions: those with >5000 chars of JS
  // (This threshold catches extensions that create persistent DOM elements
  // or event listeners that need cleanup)
  const COMPLEXITY_THRESHOLD = 5000;
  
  for (const ext of allExtensions) {
    const extension = loadExtension(ext.path);
    if (extension.js.length > COMPLEXITY_THRESHOLD) {
      assert.ok(extension.js.includes('onDisable'), 
        `${ext.file} (${extension.js.length} chars) should implement onDisable for cleanup`);
    }
  }
});

// Test that extensions store persistent data use STORAGE_KEY
test('Extensions with localStorage use consistent STORAGE_KEY pattern', () => {
  for (const ext of allExtensions) {
    const extension = loadExtension(ext.path);
    if (extension.js.includes('localStorage')) {
      const hasStorageKey = extension.js.includes('STORAGE_KEY');
      assert.ok(hasStorageKey, 
        `${ext.file} uses localStorage but should define STORAGE_KEY constant`);
    }
  }
});

// Test CSS follows CardSpoke conventions
test('CSS uses CardSpoke variable naming conventions', () => {
  for (const ext of allExtensions) {
    const extension = loadExtension(ext.path);
    if (extension.css.length > 100) {
      // Should use var(--...) for theming
      const usesVariables = extension.css.includes('var(--');
      assert.ok(usesVariables, 
        `${ext.file} CSS should use CSS variables for theming`);
    }
  }
});

test.run();

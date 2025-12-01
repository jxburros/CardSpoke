import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appPath = join(__dirname, '..', 'www', 'app.js');

test('menu handlers are correctly scoped (not nested)', () => {
  const appCode = readFileSync(appPath, 'utf8');
  
  // List of menu handler assignments that should each be at their own scope
  // Updated for v0.12.3: consolidated menu structure
  const handlers = [
    'menu.recentCards.onclick',
    'menu.dataHub.onclick',
    'menu.clearAll.onclick',
    'menu.extensionsHub.onclick',
    'menu.appearance.onclick'
  ];
  
  // Check that each handler definition ends with '};' before the next one
  for (let i = 0; i < handlers.length - 1; i++) {
    const currentPos = appCode.indexOf(handlers[i]);
    const nextPos = appCode.indexOf(handlers[i + 1]);
    
    assert.ok(currentPos > -1, `Handler ${handlers[i]} should exist`);
    assert.ok(nextPos > -1, `Handler ${handlers[i + 1]} should exist`);
    
    const between = appCode.substring(currentPos, nextPos);
    
    // Verify there's a closing '};' between handlers
    const closingCount = (between.match(/};/g) || []).length;
    assert.ok(closingCount >= 1, `Handler ${handlers[i]} should close with '};\' before ${handlers[i + 1]}. Found ${closingCount} closings.`);
  }
});

test('File format is valid (ES Module, IIFE, or standalone script)', () => {
  const appCode = readFileSync(appPath, 'utf8');
  const lines = appCode.trim().split('\n');
  const lastLine = lines[lines.length - 1].trim();
  const firstNonEmptyLine = lines.find(line => line.trim().length > 0)?.trim() || '';
  
  // Check if it's an ES Module (has import statements) or IIFE (wrapped in function)
  const isESModule = appCode.includes('import {') || appCode.includes("import '");
  const isIIFE = firstNonEmptyLine.startsWith('(function()') || firstNonEmptyLine === '(function() {';
  // Standalone script: starts with comments or 'use strict' and has function definitions
  const isStandaloneScript = (firstNonEmptyLine.startsWith('//') || firstNonEmptyLine === "'use strict';") 
    && appCode.includes('function ') 
    && !isESModule 
    && !isIIFE;
  
  assert.ok(isESModule || isIIFE || isStandaloneScript, 'File should be either an ES Module, IIFE, or standalone script');
  
  // If it's an IIFE, check that it closes correctly
  if (isIIFE && !isESModule) {
    assert.is(lastLine, '})();', 'IIFE should end with })();');
  }
  
  // ES Module format is valid - no additional checks needed
  // Standalone script format is valid - self-contained for file:// compatibility
});

test.run();

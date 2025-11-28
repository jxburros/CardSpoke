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

test('IIFE closes correctly at end of file', () => {
  const appCode = readFileSync(appPath, 'utf8');
  
  // The file should end with })(); not }})(); 
  // (one closing brace for the IIFE, not two)
  const lines = appCode.trim().split('\n');
  const lastLine = lines[lines.length - 1].trim();
  
  assert.is(lastLine, '})();', 'File should end with })(); (single closing brace for IIFE)');
});

test.run();

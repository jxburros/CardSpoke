/**
 * Audit Regression Suite (2026-07-09 comprehensive audit)
 *
 * Locks in the fixes for the release-blocking findings:
 *   CS-001  PIN-protected datasets destroyed on reload
 *   CS-002  plugin permissions bypassable — full-trust consent model
 *   CS-003  every save falsely reported as failed (scheduleCloudSync)
 *   CS-004  corrupt storage overwritten with an empty store
 *   CS-005  incomplete instance backup / broken plugin restore
 *   NEW-1   dialog primitives nested inside showToast (ReferenceError)
 *   NEW-2/4 dataset enumeration and switching
 *
 * Behavior is tested directly where the code is a real module
 * (dataset-crypto, permissions); invariants of the fused app layer are
 * asserted against the built bundle (www/app.js), which is the artifact
 * that actually ships.
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  encryptStorePayload,
  decryptStorePayload,
  isEncryptedEnvelope,
  toBase64,
  fromBase64
} from '../www/src/core/dataset-crypto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(__dirname, '..', 'www', 'app.js'), 'utf8');

// ── CS-001: envelope encryption behavior ──────────────────────────────────

test('CS-001: encrypt → decrypt round-trips the exact payload', async () => {
  const payload = JSON.stringify({ cards: { a: { id: 'a', title: 'Secret' } }, rootOrder: ['a'] });
  const envelope = await encryptStorePayload(payload, '1234');
  const decrypted = await decryptStorePayload(envelope, '1234');
  assert.is(decrypted, payload);
});

test('CS-001: the envelope never contains the PIN or plaintext', async () => {
  const pin = 'hunter2-pin';
  const payload = JSON.stringify({ cards: {}, marker: 'PLAINTEXT_MARKER' });
  const envelope = await encryptStorePayload(payload, pin);
  assert.not.ok(envelope.includes(pin), 'PIN must not appear in the stored envelope');
  assert.not.ok(envelope.includes('PLAINTEXT_MARKER'), 'payload must actually be encrypted');
  const parsed = JSON.parse(envelope);
  assert.is(parsed.encrypted, true);
  assert.is(parsed.kdf, 'PBKDF2');
  assert.is(parsed.cipher, 'AES-GCM');
  assert.type(parsed.salt, 'string');
  assert.type(parsed.iv, 'string');
  assert.type(parsed.iterations, 'number');
});

test('CS-001: a wrong PIN rejects instead of yielding garbage', async () => {
  const envelope = await encryptStorePayload('{"cards":{}}', 'correct');
  let failed = false;
  try {
    await decryptStorePayload(envelope, 'wrong');
  } catch (_err) {
    failed = true;
  }
  assert.ok(failed, 'AES-GCM auth must fail on a wrong PIN');
});

test('CS-001: tampered ciphertext rejects', async () => {
  const envelope = JSON.parse(await encryptStorePayload('{"cards":{}}', '1234'));
  const bytes = fromBase64(envelope.payload);
  bytes[0] = bytes[0] ^ 0xff;
  envelope.payload = toBase64(bytes);
  let failed = false;
  try {
    await decryptStorePayload(JSON.stringify(envelope), '1234');
  } catch (_err) {
    failed = true;
  }
  assert.ok(failed, 'tampered payload must not decrypt');
});

test('CS-001: isEncryptedEnvelope detects envelopes and nothing else', async () => {
  const envelope = JSON.parse(await encryptStorePayload('{}', '1'));
  assert.ok(isEncryptedEnvelope(envelope));
  assert.not.ok(isEncryptedEnvelope(null));
  assert.not.ok(isEncryptedEnvelope({}));
  assert.not.ok(isEncryptedEnvelope({ cards: {}, rootOrder: [] }), 'a normal store is not an envelope');
  assert.not.ok(isEncryptedEnvelope({ encrypted: true }), 'must require payload/salt/iv');
  assert.not.ok(isEncryptedEnvelope('string'));
});

// ── CS-001/CS-004: load() safety invariants in the shipped bundle ─────────

test('CS-001: load() probes for the envelope before parsing a store', () => {
  const loadSrc = bundle.slice(bundle.indexOf('async function load()'));
  const probeIdx = loadSrc.indexOf('isEncryptedEnvelope');
  const storeParseIdx = loadSrc.indexOf('rootOrder: parsed.rootOrder');
  assert.ok(probeIdx > -1, 'load() checks for the encrypted envelope');
  assert.ok(storeParseIdx > -1, 'load() still parses normal stores');
  assert.ok(probeIdx < storeParseIdx, 'envelope detection happens BEFORE store parsing');
});

test('CS-001: declining unlock locks writes instead of overwriting', () => {
  const loadSrc = bundle.slice(bundle.indexOf('async function load()'));
  assert.ok(loadSrc.includes('storageWriteLock = true'), 'load() can lock writes');
  assert.ok(bundle.includes('showDatasetLockScreen'), 'lock screen exists');
});

test('CS-001: the PIN is never persisted (no metadata.pin writes)', () => {
  assert.not.ok(/pin:\s*pin\s*\|\|\s*null/.test(bundle), 'dataset creation must not store the PIN');
  assert.ok(bundle.includes('stripLegacyPinMetadata'), 'legacy PINs are migrated out of metadata');
});

test('CS-003: saveNow() no longer calls removed scheduleCloudSync()', () => {
  assert.not.ok(/\bscheduleCloudSync\s*\(/.test(bundle));
});

test('CS-004: corrupt data is quarantined, never auto-saved over', () => {
  const loadSrc = bundle.slice(bundle.indexOf('async function load()'));
  const catchIdx = loadSrc.indexOf('.corrupt.');
  assert.ok(catchIdx > -1, 'quarantine key is written');
  const catchBlock = loadSrc.slice(catchIdx, catchIdx + 900);
  assert.ok(catchBlock.includes('storageWriteLock = true'), 'writes locked after corruption');
  assert.ok(catchBlock.includes('showCorruptDataRecovery'), 'recovery UI offered');
  assert.not.ok(/setStore\(createDefaultStore\(\)\);\s*(?:try\s*\{\s*)?save\(\)/.test(catchBlock),
    'the old reset-and-save path must be gone');
});

// ── CS-005: versioned backup format ───────────────────────────────────────

test('CS-005: instance export includes every user-owned field', () => {
  const exportIdx = bundle.indexOf('function buildInstanceExport()');
  assert.ok(exportIdx > -1, 'buildInstanceExport exists');
  const src = bundle.slice(exportIdx, exportIdx + 1600);
  for (const field of ['formatVersion', 'schemaVersion', 'cards', 'rootIds', 'plugins',
    'bookmarks', 'recentCards', 'viewMode', 'activeTheme', 'metadata']) {
    assert.ok(src.includes(field), `export includes ${field}`);
  }
  assert.ok(src.includes('delete metadata.pin'), 'export strips the legacy PIN field');
});

test('CS-005: import preserves the modern plugin persistence shape', () => {
  const importIdx = bundle.indexOf('async function importJSON');
  const src = bundle.slice(importIdx, bundle.indexOf('function importTXT'));
  assert.ok(src.includes('definition: plugin.definition'), 'modern {definition, enabled} kept as-is');
  assert.ok(src.includes('syncFromStore'), 'imported plugins are registered with the runtime');
  assert.not.ok(/js:\s*plugin\.js\s*\|\|\s*''/.test(src), 'legacy lossy conversion removed');
});

// ── CS-002: full-trust consent model ──────────────────────────────────────

test('CS-002: enabling package-sourced JS requires full-trust consent', async () => {
  const { Permissions } = await import('../www/src/core/permissions.js');
  const { Plugin, resetForTesting } = await import('../www/src/core/plugin-api.js');

  resetForTesting();
  Permissions.clearAll();

  // Minimal window/store host bridge; the document stub deliberately lacks
  // body/createElement/addEventListener, so no consent dialog can be shown
  // and requestFullTrust must deny by default.
  global.window = { store: { plugins: {} } };
  global.document = { querySelector: () => null, getElementById: () => null };

  const id = await Plugin.install({
    manifest: { id: 'trust-probe', name: 'Trust Probe', version: '1.0.0', author: 't', layer: 'feature' },
    js: "globalThis.__trustProbeRan = true;"
  });

  assert.is(Plugin.get(id).enabled, false, 'JS plugin must not run without consent');
  assert.not.ok(globalThis.__trustProbeRan, 'setup must not have executed');

  // Consent recorded (the dialog's Allow path) → enable proceeds.
  Permissions.grantFullTrust(id);
  await Plugin.enable(id);
  assert.is(Plugin.get(id).enabled, true, 'enabled after consent');
  assert.ok(globalThis.__trustProbeRan, 'setup ran after consent');

  // Deleting the plugin revokes consent.
  await Plugin.unregister(id);
  assert.not.ok(Permissions.hasFullTrust(id), 'trust revoked on delete');

  delete globalThis.__trustProbeRan;
  resetForTesting();
  Permissions.clearAll();
});

test('CS-002: CSS-only themes still enable without a trust prompt', async () => {
  const { Permissions } = await import('../www/src/core/permissions.js');
  const { Plugin, resetForTesting } = await import('../www/src/core/plugin-api.js');

  resetForTesting();
  Permissions.clearAll();

  const head = { children: [], appendChild(el) { this.children.push(el); return el; } };
  global.document = {
    head,
    body: { appendChild() {} },
    createElement: (tag) => ({ tag, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, set textContent(v) { this._t = v; }, get textContent() { return this._t; } }),
    querySelector: () => null,
    getElementById: () => null
  };
  global.window = { store: { plugins: {} } };

  const id = await Plugin.install({
    manifest: { id: 'pure-theme', name: 'Pure Theme', version: '1.0.0', author: 't', layer: 'theme' },
    css: ':root { --bg: #123456; }'
  });

  assert.is(Plugin.get(id).enabled, true, 'CSS-only theme auto-enables (no JS runs)');
  assert.not.ok(Permissions.hasFullTrust(id), 'no trust grant needed for CSS-only');

  await Plugin.unregister(id);
  resetForTesting();
  Permissions.clearAll();
});

// ── NEW findings ──────────────────────────────────────────────────────────

test('NEW-1: dialog primitives are top-level in the bundle (not nested in showToast)', () => {
  // At IIFE top level the fused bundle indents function declarations with
  // exactly two spaces; the broken nesting had them at six.
  for (const fn of ['showModalDialog', 'showConfirmDialog', 'showChoiceDialog', 'showPromptDialog']) {
    const re = new RegExp('\\n  function ' + fn + '\\(');
    assert.ok(re.test(bundle), fn + ' must be a top-level declaration');
  }
  // And every call site refers to the same (unrenamed) identifiers.
  assert.not.ok(bundle.includes('showConfirmDialog2('), 'no Rollup-renamed orphan definitions');
});

test('NEW-2/NEW-4: dataset manager enumerates both key shapes and switch awaits load', () => {
  assert.ok(bundle.includes('function getAllDatasetKeys()'), 'shared dataset key enumeration exists');
  assert.ok(/startsWith\(['"]cards_['"]\)/.test(bundle), 'cards_* keys included');
  assert.not.ok(/if \(!safeMode\) \{\s*\}/.test(bundle), 'out-of-scope safeMode block removed');
  assert.ok(bundle.includes('reconcilePluginsAfterDatasetSwitch'), 'plugins reconcile on switch');
});

test.run();

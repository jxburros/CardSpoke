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

/**
 * Typed-Card Migration Layer (CardSpoke Core)
 *
 * Migration rules (see docs/architecture/TYPED_CARDS.md):
 *   - Migrations must be idempotent.
 *   - Unknown card kinds must be preserved.
 *   - Unknown metadata fields must be preserved.
 *   - Failed migrations must not delete data and must leave cards readable.
 *
 * Per-kind versioned upgrades are registered via registerKindMigration();
 * the structural fill-in (defaults, payload shape) lives in typed-cards.js.
 */

import { migrateTypedCard as structuralMigrate, isKnownKind } from './typed-cards.js';

/**
 * Registered per-kind data migration steps.
 * Map of kind -> { [fromVersion]: (data) => newData } upgrading one version.
 */
const kindMigrations = {};

/**
 * Register a data migration step for a kind.
 * @param {string} kind
 * @param {number} fromVersion - The step upgrades fromVersion -> fromVersion + 1.
 * @param {Function} migrate - (data) => newData. Must not throw on valid input.
 */
export function registerKindMigration(kind, fromVersion, migrate) {
  if (!kind || typeof migrate !== 'function') return;
  if (!kindMigrations[kind]) kindMigrations[kind] = {};
  kindMigrations[kind][fromVersion] = migrate;
}

/** Remove all registered kind migrations (test helper). */
export function clearKindMigrations() {
  for (const key of Object.keys(kindMigrations)) delete kindMigrations[key];
}

/**
 * Upgrade a kind payload from one schema version to another by applying
 * registered per-version steps. Missing steps are skipped (data passes
 * through unchanged) so gaps never destroy data.
 * @param {string} kind
 * @param {Object} data
 * @param {number} fromVersion
 * @param {number} toVersion
 * @returns {Object} The migrated data.
 */
export function migrateKindData(kind, data, fromVersion, toVersion) {
  let current = data;
  for (let v = fromVersion; v < toVersion; v++) {
    const step = kindMigrations[kind] && kindMigrations[kind][v];
    if (typeof step === 'function') {
      const next = step(current);
      if (next && typeof next === 'object') current = next;
    }
  }
  return current;
}

/**
 * Migrate a single card's typed metadata (structure + versioned data).
 * Legacy and unknown-kind cards pass through untouched.
 * @param {Object} card
 * @returns {{ card: Object, changed: boolean, warnings: string[] }}
 */
export function migrateTypedCard(card) {
  return structuralMigrate(card, { migrateKindData });
}

/**
 * Migrate one card: ensures baseline card fields exist, then migrates
 * typed metadata. Never removes fields.
 * @param {Object} card
 * @returns {{ card: Object, changed: boolean, warnings: string[] }}
 */
export function migrateCard(card) {
  if (!card || typeof card !== 'object') return { card, changed: false, warnings: [] };
  let changed = false;
  if (!Array.isArray(card.children)) { card.children = []; changed = true; }
  if (!Array.isArray(card.tags)) { card.tags = []; changed = true; }
  if (card.modsData == null || typeof card.modsData !== 'object') {
    card.modsData = {};
    changed = true;
  }
  const typed = migrateTypedCard(card);
  return { card, changed: changed || typed.changed, warnings: typed.warnings };
}

/**
 * Migrate every card in a store. Idempotent: running twice produces no
 * further changes. Failures on individual cards are collected as warnings
 * and never delete data.
 * @param {{cards: Object}} store
 * @returns {{ store: Object, changed: boolean, migratedCount: number, warnings: string[] }}
 */
export function migrateStore(store) {
  const warnings = [];
  let changed = false;
  let migratedCount = 0;
  if (!store || !store.cards || typeof store.cards !== 'object') {
    return { store, changed, migratedCount, warnings };
  }
  for (const [id, card] of Object.entries(store.cards)) {
    try {
      const result = migrateCard(card);
      if (result.changed) {
        changed = true;
        migratedCount++;
      }
      for (const w of result.warnings) warnings.push(`[${id}] ${w}`);
    } catch (err) {
      // A failed migration leaves the card exactly as it was — readable.
      warnings.push(`[${id}] Migration failed: ${err && err.message}`);
    }
  }
  return { store, changed, migratedCount, warnings };
}

export { isKnownKind };

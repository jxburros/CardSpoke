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
 * CardSpoke Core — reusable, DOM-free object engine.
 *
 * This is the core-only import path: everything exported here runs in
 * Node.js, tests, and future shells (lite / OS) without any browser UI.
 * It is also the entry for the standalone `dist/cardspoke-core.js` build
 * (`npm run build:core`).
 *
 * Layers re-exported here:
 *   - Kernel: card CRUD, hierarchy, tags, links (kernel.js)
 *   - Typed cards: kinds, validation, migration (typed-cards.js)
 *   - Queries: kind/tag/due filters, collections (queries.js)
 *   - Migrations: store/card migration layer (migrations.js)
 *   - Actions: shared action registry (actions.js)
 *   - Conversions: kind transformation helpers (conversions.js)
 *   - App modes: mode registry + built-in stubs (app-modes.js)
 *   - Profiles: full/lite/os feature flags (profiles.js)
 *   - Import/Export: filterable pure transforms (import-export.js)
 */

export {
  Kernel,
  uid,
  cloneCard,
  normalizeCardName,
  parseCardLinks,
  hasCardLink,
  extractTags
} from '../kernel.js';

export {
  GENERIC_KIND,
  KIND_DEFINITIONS,
  CARD_KINDS,
  isKnownKind,
  getKindPayloadKey,
  getCardKind,
  isCardKind,
  setCardKind,
  getKindData,
  updateKindData,
  validateTypedCard,
  listCardsByKind,
  listChildrenByKind,
  createTypedModsData
} from './typed-cards.js';

export {
  listRootCardsByKind,
  findCardsByKindAndTag,
  findDueReminders,
  findTasksDueToday,
  findPlantsWithTrackingEnabled,
  evaluateCollection
} from './queries.js';

export {
  registerKindMigration,
  clearKindMigrations,
  migrateKindData,
  migrateTypedCard,
  migrateCard,
  migrateStore
} from './migrations.js';

export {
  registerAction,
  unregisterAction,
  getAction,
  listActions,
  getActionsForCard,
  runAction,
  clearActions,
  registerCoreCardActions,
  registerTypedCardActions
} from './actions.js';

export {
  convertCardKind,
  convertNoteToTask,
  convertNoteToSlide,
  createDeckFromOutline,
  createSlidesFromChildren,
  createProjectFromOutline,
  createReminderForCard,
  revertCardKind
} from './conversions.js';

export {
  DEFAULT_MODE_ID,
  registerAppMode,
  unregisterAppMode,
  getAppMode,
  listAppModes,
  getModesForCard,
  setActiveMode,
  getActiveMode,
  getActiveModeId,
  filterCardsForMode,
  clearAppModes,
  registerBuiltInModes
} from './app-modes.js';

export {
  PROFILES,
  DEFAULT_PROFILE,
  FEATURE_FLAGS,
  PROFILE_FEATURES,
  resolveProfile,
  getFeatureFlags,
  setActiveProfile,
  getActiveProfile,
  isFeatureEnabled,
  detectProfile,
  initProfile
} from './profiles.js';

export {
  EXPORT_FORMATS,
  collectSubtree,
  selectCardsForExport,
  exportCards,
  prepareImportCards
} from './import-export.js';

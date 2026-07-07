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
 * CardSpoke Application Entry Point
 *
 * This module is the Vite IIFE build entry point. Module ordering here is a
 * STABILITY CONTRACT (see docs/PLUGIN_INVARIANTS.md):
 *
 *   1. `core/global-api.js` initializes the plugin runtime and attaches the
 *      public `window.CardSpoke` surface. It MUST run before any app-layer
 *      module, because the app layer's boot sequence (systems.js) and Plugin
 *      Manager UI (data.js) call into `window.CardSpoke.*`.
 *   2. The app-layer modules are fused into a single flat-scope module by
 *      the flattenAppScope plugin in vite.config.js (which also prepends the
 *      global-api import to the fused module, guaranteeing order even
 *      though Rollup hoists imports).
 */

// ── Plugin runtime + public window.CardSpoke surface (must be first) ────────
import './core/global-api.js';
import { registerBuiltInModes } from './core/app-modes.js';

// ── Shared application state (ESM live bindings) ─────────────────────────────
import './state.js';

// ── Layer 0: Kernel (pure data engine — no browser deps) ─────────────────────
// Imported by data.js; listed here for build-order documentation.
import './kernel.js';

// ── App layers (loaded in dependency order) ──────────────────────────────────
// Each module imports the specific state bindings it needs from state.js.
import './metadata.js';
import './storage.js';
import './data.js';
import './rendering.js';
import './systems.js';

// ── App mode registry (OS preparation) ──────────────────────────────────────
// Registers the built-in stub modes (cardspoke, repository, notes, projects,
// decks, contacts, plants). The default "cardspoke" mode preserves current
// behavior; the others filter cards by kind for future lightweight shells.
registerBuiltInModes();

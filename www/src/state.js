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
 * Shared application state module
 *
 * All mutable cross-module state lives here as named ESM exports.
 * Variables that are re-assigned by consuming modules (store, navState,
 * instanceKey, …) are paired with a setter function — because ESM only
 * permits the *declaring* module to reassign a live export.
 *
 * Arrays that are only ever mutated in-place (undoStack, redoStack,
 * trashBin) are exported as plain `const` references.
 *
 * Read-only constants and the `createDefaultStore` factory are also
 * exported here so every module has a single source of truth.
 */

// ── App metadata constants ────────────────────────────────────────────────────
export const APP_CREATOR = 'Jeffrey from GX Generations Software';
export const APP_VERSION = '0.17.0';
export const APP_RELEASE_DATE = '2026-02-17';
export const APP_UPDATER = 'Claude Code (Sonnet 4.5)';
export const SCHEMA_VERSION = 4;

// ── Undo / trash size limits ──────────────────────────────────────────────────
export const MAX_UNDO_STACK = 50;
export const MAX_TRASH_SIZE = 100;

// ── Store factory ─────────────────────────────────────────────────────────────
/**
 * Return a fresh store object with default values.
 * @returns {Object} Default store shape
 */
export function createDefaultStore() {
  return {
    rootOrder: [],
    cards: {},
    plugins: {},
    bookmarks: [],
    recentCards: [],
    viewMode: 'normal',
    activeTheme: 'light',
    richTextEnabled: false
  };
}

// ── Mutable application state ─────────────────────────────────────────────────
// Each `let` export is paired with a setter so that importing modules can
// trigger a full reassignment (e.g. store = parsedPayload).

export let store = createDefaultStore();
/** Replace the entire store object (e.g. after a fresh load from storage). */
export function setStore(s) { store = s; }

export let navState = {
  mode: 'cardspoke',
  page: 'list',
  cardId: null,
  parentId: null,
  searchQuery: ''
};
/** Replace the navigation state object. */
export function setNavState(s) { navState = s; }

export let navHistory = [];
/** Replace the navigation history array. */
export function setNavHistory(h) { navHistory = h; }

// instanceKey is read from localStorage at startup (browser-only).
export let instanceKey =
  (typeof localStorage !== 'undefined' ? localStorage.getItem('activeInstance') : null) ||
  'nested_cards_store';
/** Update the active localStorage key used for the current dataset. */
export function setInstanceKey(k) { instanceKey = k; }

export let dirty = false;
/** Mark whether the store has unsaved changes. */
export function setDirty(d) { dirty = d; }

export let searchResultsState = {
  items: [],
  elements: [],
  selectedIndex: 0
};
/** Replace the fuzzy-search results snapshot. */
export function setSearchResultsState(s) { searchResultsState = s; }

export let draggedCardId = null;
/** Track which card is currently being dragged. */
export function setDraggedCardId(id) { draggedCardId = id; }

export let dragOverCardId = null;
/** Track which card the drag target is hovering over. */
export function setDragOverCardId(id) { dragOverCardId = id; }

// ── Mutable arrays (mutated in-place; no setter needed) ──────────────────────

/** Undo history stack — entries are pushed/shifted, never reassigned. */
export const undoStack = [];

/** Redo history stack — entries are pushed/popped, never reassigned. */
export const redoStack = [];

/** Soft-deleted cards awaiting permanent deletion or restore. */
export const trashBin = [];

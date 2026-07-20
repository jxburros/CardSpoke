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
 * CardSpoke Core Type Definitions
 * @version 0.17.0
 * @module @cardspoke/core
 */

export interface Card {
  id: string;
  title: string;
  body: string;
  tags: string[];
  parentId: string | null;
  children: string[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface Store {
  cards: Record<string, Card>;
  rootOrder: string[];
  bookmarks: string[];
  recentCards: string[];
  /** Persisted installed plugins, keyed by id. See PersistedPlugin. */
  plugins: Record<string, PersistedPlugin>;
  schemaVersion: number;
  metadata?: Record<string, any>;
}

/**
 * A plugin as stored in the dataset payload. Pure JSON — the js/teardownJs
 * source strings are the canonical executable form, reconstructed by
 * Plugin.syncFromStore() on load. Entries without `definition` are legacy
 * (pre-v2) plugins the current runtime does not execute.
 */
export interface PersistedPlugin {
  definition?: {
    manifest: ModManifest;
    css?: string;
    js?: string;
    teardownJs?: string;
  };
  enabled: boolean;
}

export type ModLayer = 'theme' | 'feature' | 'app';
export type PermissionType = 'ui-override' | 'storage' | 'network' | 'filesystem' | 'core-override' | 'data-modify';

export interface ModManifest {
  id?: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  layer: ModLayer;
  compatibility?: string;
  permissions?: PermissionType[];
  /** User-configurable settings; surfaced as ctx.config and a settings panel. */
  config?: Record<string, any>;
  /** App-layer host overrides (currently implemented: appName). */
  overrides?: ModOverrides;
  /** Plugin ids that must already be installed. */
  dependencies?: string[];
}

export interface ModPackage {
  id?: string;
  manifest: ModManifest;
  config?: Record<string, any>;
  css?: string;
  /** Setup-function BODY (receives `ctx`); the persisted, canonical form. */
  js?: string;
  /** Teardown-function body (extra cleanup). */
  teardownJs?: string;
  overrides?: ModOverrides;
  /** Persisted enabled/suspended state (set by the runtime). */
  enabled?: boolean;
}

export interface ModOverrides {
  appName?: string;
  hideMenuItems?: string[];
  customMenuItems?: Array<{
    id: string;
    label: string;
    section?: string;
  }>;
  customPages?: Array<{
    id: string;
    title: string;
    render: string;
  }>;
  disableFeatures?: string[];
}

export interface PluginContext {
  modId: string;
  appVersion: string;
  schemaVersion: number;
  /** Present when the manifest declares `config`; the settings panel writes here. */
  config?: Record<string, any>;
  api: PluginAPI;
  utils: PluginUtils;
  logger: Logger;
}

export interface Logger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface PluginAPI {
  ui: UIApi;
  data: DataApi;
  storage: StorageApi;
  events: EventApi;
  middleware: MiddlewareApi;
  network: NetworkApi;
  filesystem: FilesystemApi;
}

export interface MiddlewareApi {
  /** Register a tracked, per-plugin-namespaced middleware. Returns an unregister function. */
  register(middleware: Middleware): () => void;
  unregister(name: string): void;
}

export interface NetworkApi {
  fetch(url: string, options?: any): Promise<Response>;
  xhr(): XMLHttpRequest;
}

export interface FilesystemApi {
  readFile(path: string, options?: any): Promise<any>;
  writeFile(path: string, data: any, options?: any): Promise<any>;
}

export interface UIApi {
  inject(selector: string, element: HTMLElement, position?: 'before' | 'after' | 'append' | 'prepend'): () => void;
  replace(selector: string, element: HTMLElement): () => void;
  registerComponent(name: string, component: Component): void;
  unregisterComponent(name: string): void;
  showToast(message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number): void;
}

export interface DataApi {
  onUpdate(callback: (event: DataUpdateEvent) => void): () => void;
  getCard(id: string): Card | undefined;
  listCards(): Card[];
  createCard(data: Partial<Card>): string;
  updateCard(id: string, updates: Partial<Card>): Card;
  deleteCard(id: string): boolean;
  getTags(cardId: string): string[];
  addTag(cardId: string, tag: string): boolean;
  removeTag(cardId: string, tag: string): boolean;
  setTags(cardId: string, tags: string[]): boolean;
  getAllTags(): string[];
}

export interface StorageApi {
  getNamespace(): string;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

export interface EventApi {
  on(event: string, callback: (...args: any[]) => void): () => void;
  emit(event: string, ...args: any[]): void;
  once(event: string, callback: (...args: any[]) => void): () => void;
  off(event: string, callback: (...args: any[]) => void): void;
}

export interface DataUpdateEvent {
  type: 'card.create' | 'card.update' | 'card.delete';
  cardId: string;
  card?: Card;
}

export interface Component {
  render(props: any): HTMLElement | string;
  priority?: number;
  onMount?(): void;
  onUnmount?(): void;
  onPropsChange?(oldProps: any, newProps: any): void;
  metadata?: ComponentMetadata;
}

export interface ComponentMetadata {
  name?: string;
  version?: string;
  description?: string;
  canReplace?: string[];
}

/** Props passed to a registered Card component */
export interface CardComponentProps {
  card: Card;
  isSelected: boolean;
  opts: Record<string, any>;
  onSelect: () => void;
}

/** Props passed to a registered Sidebar component */
export interface SidebarComponentProps {
  cards: Card[];
  selectedCardId: string | null;
}

export interface MiddlewareContext {
  operation: string;
  args: any[];
  result?: any;
  error?: Error;
  /** Read-only flag indicating whether stopPropagation() was called */
  stopped: boolean;
  /** Read-only flag indicating whether preventDefault() was called */
  prevented: boolean;
  stopPropagation(): void;
  preventDefault(): void;
}

export type MiddlewareFunction = (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;

export interface Middleware {
  name: string;
  priority: number;
  operations: string[];
  handler: MiddlewareFunction;
}

export interface PluginUtils {
  uid(): string;
  debounce(func: Function, wait: number): Function;
  escapeHtml(str: string): string;
  normalizeTagInput(raw: string): string;
  cloneCard(card: Card): Card;
  highlightText(text: string, query: string): string;
}

export interface StorageDriver {
  init(config?: any): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  getSize(): Promise<number>;
  getKind(): string;
}

export interface NavigationState {
  page: string;
  opts?: Record<string, any>;
}

// --- Validation Types (Tier 3) ---

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: any | null;
}

export interface PluginValidatorClass {
  validate(plugin: { id: string; manifest: ModManifest; css?: string; js?: string }): ValidationResult;
  validateManifest(manifest: ModManifest): { errors: string[]; warnings: string[] };
  validateCSS(css: string): { errors: string[]; warnings: string[]; sanitized: string };
  validateJS(js: string): { errors: string[]; warnings: string[] };
}

// --- Permissions Types ---

export interface PermissionsClass {
  hasPermission(pluginId: string, permission: PermissionType): boolean;
  hasAllPermissions(pluginId: string, permissions: PermissionType[]): boolean;
  grantPermissions(pluginId: string, permissions: PermissionType[]): void;
  revokePermissions(pluginId: string, permissions?: PermissionType[]): void;
  getPermissions(pluginId: string): PermissionType[];
  requestPermissions(pluginId: string, pluginName: string, permissions: PermissionType[]): Promise<boolean>;
  clearAll(): void;
}

// --- Global Window Declaration ---

declare global {
  interface Window {
    /**
     * Public plugin surface, assembled and frozen by
     * www/src/core/global-api.js before any app-layer code runs.
     * Shape is a stability contract — see docs/architecture/PLUGIN_INVARIANTS.md.
     */
    CardSpoke: {
      /** Register AND enable a plugin (session-only; not persisted). */
      registerPlugin(id: string, definition: PluginDefinition): Promise<string>;
      /** Persistent install of a plugin package (alias of Plugin.install). */
      installPlugin(pkg: ModPackage): Promise<string>;
      requestPermissions(pluginId: string, pluginName: string, permissions: PermissionType[]): Promise<boolean>;
      Plugin: PluginClass;
      PluginSandbox: { createFunction(code: string): (ctx: PluginContext) => any };
      Middleware: MiddlewareManager;
      ComponentRegistry: ComponentRegistryClass;
      StorageDriverRegistry: StorageDriverRegistryClass;
      Permissions: PermissionsClass;
      PluginValidator: PluginValidatorClass;
      utils: PluginUtils;
    };
  }
}

export interface PluginClass {
  /** Validate, register, persist, and auto-enable (SAFE/LOW) a package. Returns the id. */
  install(pkg: ModPackage): Promise<string>;
  register(id: string, plugin: PluginDefinition): void;
  unregister(id: string): Promise<void>;
  get(id: string): PluginInstance | undefined;
  list(): PluginInstance[];
  listAll(): PluginInstance[];
  enable(id: string): Promise<void>;
  disable(id: string): Promise<void>;
  assessModRisk(pkg: ModPackage): 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';
  /** Boot-time restore of persisted plugins. Idempotent. */
  syncFromStore(safeMode?: boolean): Promise<void>;
  notifyDataUpdate(event: DataUpdateEvent): void;
  buildSettingsPanel(id: string): HTMLElement | null;
}

export interface PluginDefinition {
  manifest: ModManifest;
  /** Session-only function form. Only string js/teardownJs persist across reloads. */
  setup?(ctx: PluginContext): void | Promise<void>;
  teardown?(ctx: PluginContext): void | Promise<void>;
  css?: string;
  js?: string;
  teardownJs?: string;
  overrides?: ModOverrides;
}

export interface PluginInstance {
  id: string;
  definition: PluginDefinition;
  context: PluginContext;
  enabled: boolean;
  resources: Set<any>;
}

export interface MiddlewareManager {
  register(middleware: Middleware): void;
  unregister(name: string): void;
  run(operation: string, args: any[]): Promise<{ context: MiddlewareContext; prevented: boolean }>;
  list(): Array<{ name: string; priority: number; operations: string[] }>;
  clear(): void;
}

export interface ComponentRegistryClass {
  register(name: string, component: Component, priority?: number): void;
  unregister(name: string): void;
  get(name: string): Component | undefined;
  resolve(name: string): Component | undefined;
  has(name: string): boolean;
  list(): Array<{ name: string; priority: number }>;
  clear(): void;
}

export interface StorageDriverRegistryClass {
  register(name: string, driver: StorageDriver): void;
  unregister(name: string): void;
  get(name: string): StorageDriver | undefined;
  setActive(name: string): Promise<void>;
  getActive(): StorageDriver;
}

/** Semantic DOM selector anchors available for plugin targeting */
export type PluginAnchor =
  | 'header'
  | 'header-inner'
  | 'brand'
  | 'save-status'
  | 'btn-undo'
  | 'btn-home'
  | 'btn-theme-toggle'
  | 'btn-menu'
  | 'menu-overlay'
  | 'menu-panel'
  | 'menu-new-card'
  | 'menu-plugin-manager'
  | 'breadcrumbs'
  | 'main-content'
  | 'search-container'
  | 'search-input'
  | 'toast-container'
  | 'footer';

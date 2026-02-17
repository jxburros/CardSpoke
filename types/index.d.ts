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
  plugins: Record<string, ModPackage>;
  schemaVersion: number;
  metadata?: Record<string, any>;
}

export type ModLayer = 'theme' | 'feature' | 'app';
export type PermissionType = 'ui-override' | 'storage' | 'network' | 'filesystem' | 'core-override' | 'data-modify';

export interface ModManifest {
  name: string;
  version: string;
  author: string;
  description?: string;
  layer: ModLayer;
  compatibility?: string;
  permissions?: PermissionType[];
}

export interface ModPackage {
  id: string;
  manifest: ModManifest;
  config?: Record<string, any>;
  css?: string;
  js?: string;
  overrides?: ModOverrides;
  enabled: boolean;
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
  type: 'create' | 'update' | 'delete';
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
  grantPermission(pluginId: string, permission: PermissionType): void;
  revokePermission(pluginId: string, permission: PermissionType): void;
  listPermissions(pluginId: string): PermissionType[];
}

// --- Global Window Declaration ---

declare global {
  interface Window {
    CardSpoke: {
      version: string;
      schema: number;
      Plugin: PluginClass;
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
  register(id: string, plugin: PluginDefinition): void;
  unregister(id: string): void;
  get(id: string): PluginInstance | undefined;
  list(): PluginInstance[];
  enable(id: string): Promise<void>;
  disable(id: string): Promise<void>;
  notifyDataUpdate(event: DataUpdateEvent): void;
}

export interface PluginDefinition {
  manifest: ModManifest;
  setup?(ctx: PluginContext): void | Promise<void>;
  teardown?(ctx: PluginContext): void | Promise<void>;
  css?: string;
  js?: string;
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

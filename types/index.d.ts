/**
 * CardSpoke Core Type Definitions
 * @version 0.16.0
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
  plugins: Record<string, PluginPackage>;
  schemaVersion: number;
  metadata?: Record<string, any>;
}

export type PluginLayer = 'theme' | 'feature' | 'app';
export type PermissionType = 'ui-override' | 'storage' | 'network' | 'filesystem' | 'core-override';

export interface PluginManifest {
  name: string;
  version: string;
  author: string;
  description?: string;
  layer: PluginLayer;
  compatibility?: string;
  permissions?: PermissionType[];
}

export interface PluginPackage {
  id: string;
  manifest: PluginManifest;
  config?: Record<string, any>;
  css?: string;
  js?: string;
  overrides?: PluginOverrides;
  enabled: boolean;
}

export interface PluginOverrides {
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
  pluginId: string;
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
}

export interface DataUpdateEvent {
  type: 'create' | 'update' | 'delete';
  cardId: string;
  card?: Card;
}

export interface Component {
  render(props: any): HTMLElement | string;
  priority?: number;
}

export interface MiddlewareContext {
  operation: string;
  args: any[];
  result?: any;
  error?: Error;
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

declare global {
  interface Window {
    CardSpoke: {
      version: string;
      schema: number;
      Plugin: PluginClass;
      Middleware: MiddlewareManager;
      ComponentRegistry: ComponentRegistryClass;
      StorageDriverRegistry: StorageDriverRegistryClass;
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
}

export interface PluginDefinition {
  manifest: PluginManifest;
  setup?(ctx: PluginContext): void | Promise<void>;
  teardown?(ctx: PluginContext): void | Promise<void>;
  css?: string;
  overrides?: PluginOverrides;
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
  run(operation: string, args: any[]): Promise<any>;
}

export interface ComponentRegistryClass {
  register(name: string, component: Component, priority?: number): void;
  unregister(name: string): void;
  get(name: string): Component | undefined;
  resolve(name: string): Component | undefined;
}

export interface StorageDriverRegistryClass {
  register(name: string, driver: StorageDriver): void;
  unregister(name: string): void;
  get(name: string): StorageDriver | undefined;
  setActive(name: string): Promise<void>;
  getActive(): StorageDriver;
}

/**
 * TypeScript definitions for CardSpoke Extension System
 * @version 0.16.0
 * @author CardSpoke Team
 */

declare namespace CardSpoke {
  // ============================================================================
  // CARD TYPES
  // ============================================================================

  interface Card {
    id: string;
    title: string;
    body: string;
    parentId: string | null;
    children: string[];
    tags: string[];
    createdAt: number;
    updatedAt: number;
    isRichText?: boolean;
    modsData?: Record<string, any>;
  }

  interface SaveInfo {
    isNew: boolean;
    source: string;
    previousData?: Partial<Card>;
  }

  interface CreateCardData {
    title: string;
    body?: string;
    parentId?: string | null;
    tags?: string[];
  }

  interface UpdateCardData {
    title?: string;
    body?: string;
    tags?: string[];
    parentId?: string | null;
  }

  // ============================================================================
  // NAVIGATION TYPES
  // ============================================================================

  interface NavState {
    page: string;
    cardId?: string | null;
    parentId?: string | null;
    searchQuery?: string;
  }

  // ============================================================================
  // ACCESSIBILITY TYPES
  // ============================================================================

  type Theme = 'light' | 'dark';
  type TypographyPreset = 'default' | 'comfortable' | 'compact' | 'dyslexia';

  interface AccessibilitySettings {
    theme: Theme;
    typography: TypographyPreset;
    highContrast: boolean;
    reducedMotion: boolean;
  }

  interface ThemeVariables {
    [key: string]: string;
  }

  // ============================================================================
  // EXTENSION METADATA
  // ============================================================================

  type ExtensionType = 'Theme' | 'Patch' | 'Plugin' | 'Mod' | 'Expansion' | 'Kit';
  type ExtensionSource = 'official' | 'community';

  interface ExtensionMeta {
    name: string;
    type: ExtensionType;
    version: string;
    creator?: string;
    description?: string;
    releaseDate?: string;
    source?: ExtensionSource;
    ai_assistants?: string;
    capabilities?: string[];
  }

  interface ExtensionInfo {
    id: string;
    enabled: boolean;
    meta: ExtensionMeta;
  }

  // ============================================================================
  // LOGGER
  // ============================================================================

  interface Logger {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
  }

  // ============================================================================
  // STORE API
  // ============================================================================

  interface DatasetMeta {
    name: string;
    cardCount: number;
    rootCardCount: number;
    bookmarkCount: number;
    recentCount: number;
    modCount: number;
    schemaVersion: number;
    appVersion: string;
  }

  interface StoreAPI {
    getAppInfo(): { appVersion: string; schemaVersion: number };
    getCard(id: string): Card | undefined;
    listCards(): Card[];
    listRootIds(): string[];
    getNavState(): NavState;
    navigate(page: string, opts?: any): void;
    goBack(): void;
    showToast(message: string, type?: 'success' | 'info' | 'warning' | 'error'): void;
    markDirty(): void;
    createCard(data: CreateCardData): string;
    updateCard(id: string, updates: UpdateCardData): Card | undefined;
    deleteCard(id: string): boolean;
    getTags(cardId: string): string[];
    addTag(cardId: string, tag: string): boolean;
    removeTag(cardId: string, tag: string): boolean;
    setTags(cardId: string, tags: string[]): boolean;
    getAllTags(): string[];
    getDatasetMeta(): DatasetMeta;
    logger: Logger;
    utils(): Utils;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    info(...args: any[]): void;
  }

  // ============================================================================
  // PUBLIC UTILS API
  // ============================================================================

  interface Utils {
    // Card Management
    createCard(data: CreateCardData): Promise<{ id: string; card: Card }>;
    updateCard(cardId: string, changes: UpdateCardData): Promise<boolean>;
    getCard(cardId: string): Promise<Card | null>;
    searchCards(query: string): Promise<Card[]>;

    // Tag Management
    getTags(cardId: string): Promise<string[]>;
    addTag(cardId: string, tag: string): Promise<boolean>;
    removeTag(cardId: string, tag: string): Promise<boolean>;
    setTags(cardId: string, tags: string[]): Promise<boolean>;
    getAllTags(): Promise<string[]>;

    // UI & Notifications
    showToast(
      message: string,
      type?: 'success' | 'info' | 'warning' | 'error',
      duration?: number
    ): Promise<void>;

    // Accessibility & Theme API
    getAccessibilitySettings(): Promise<AccessibilitySettings>;
    setTheme(theme: Theme): Promise<void>;
    getTheme(): Promise<Theme>;
    setTypography(preset: TypographyPreset): Promise<void>;
    getTypography(): Promise<TypographyPreset>;
    setHighContrast(enabled: boolean): Promise<void>;
    isHighContrast(): Promise<boolean>;
    prefersReducedMotion(): Promise<boolean>;
    onThemeChange(callback: (theme: Theme) => void): void;
    getThemeVariables(): Promise<ThemeVariables>;

    // Dataset Information
    getDatasetMeta(): Promise<DatasetMeta>;
  }

  // ============================================================================
  // EXTENSION CONTEXT
  // ============================================================================

  interface ModContext {
    modId: string;
    appVersion: string;
    schemaVersion: number;
    api: StoreAPI;
    utils: Utils;
    logger: Logger;
  }

  // ============================================================================
  // EXTENSION HOOKS
  // ============================================================================

  interface ExtensionHooks {
    /**
     * Called when the extension is first loaded or when app initializes
     */
    onAppInit?(ctx: ModContext): void | Promise<void>;

    /**
     * Called when the extension is enabled
     */
    onEnable?(ctx: ModContext): void | Promise<void>;

    /**
     * Called when the extension is disabled (use for cleanup)
     */
    onDisable?(ctx: ModContext): void | Promise<void>;

    /**
     * Called before the extension is uninstalled (use for final cleanup)
     */
    onUninstall?(ctx: ModContext): void | Promise<void>;

    /**
     * Called when a card is saved (created or updated)
     */
    onCardSave?(ctx: ModContext, card: Card, saveInfo: SaveInfo): void | Promise<void>;

    /**
     * Called when a card is deleted
     */
    onCardDelete?(ctx: ModContext, card: Card): void | Promise<void>;

    /**
     * Called when a card is rendered in the DOM
     */
    onCardRender?(ctx: ModContext, card: Card, element: HTMLElement): void | Promise<void>;

    /**
     * Called when the theme changes (light/dark mode)
     */
    onThemeChange?(ctx: ModContext, theme: Theme): void | Promise<void>;

    /**
     * Called when the typography preset changes
     */
    onTypographyChange?(ctx: ModContext, preset: TypographyPreset): void | Promise<void>;

    /**
     * Called when high contrast mode is toggled
     */
    onHighContrastChange?(ctx: ModContext, enabled: boolean): void | Promise<void>;

    /**
     * Called before data export
     */
    onExport?(ctx: ModContext, data: any): void | Promise<void>;

    /**
     * Called after data import
     */
    onImport?(ctx: ModContext, info: any): void | Promise<void>;

    /**
     * Called when navigation changes
     */
    onNavigate?(ctx: ModContext, navState: NavState): void | Promise<void>;

    /**
     * Called when a search completes
     */
    onSearch?(ctx: ModContext, query: string, results: Card[]): void | Promise<void>;
  }

  // ============================================================================
  // EXTENSION DEFINITION
  // ============================================================================

  interface ExtensionDefinition extends ExtensionHooks {
    meta?: ExtensionMeta;
  }

  // ============================================================================
  // HOOK STATISTICS
  // ============================================================================

  interface HookStats {
    modId: string;
    hookName: string;
    executions: number;
    failures: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  }

  interface ExtensionError {
    modId: string;
    hookName: string;
    error: string;
    stack?: string;
    timestamp: number;
    errorCount: number;
  }

  // ============================================================================
  // DEVELOPER TOOLS
  // ============================================================================

  interface DevTools {
    inspectMod(modId: string): {
      id: string;
      hooks: string[];
      meta: ExtensionMeta;
      loaded: boolean;
      initialized: boolean;
      error?: any;
      errorCount: number;
      enabled: boolean;
    } | null;
    listAllMods(): Array<ReturnType<DevTools['inspectMod']>>;
    getHookStats(modId?: string): Record<string, HookStats>;
    getErrorLog(): ExtensionError[];
    clearErrorLog(): void;
    testHook(modId: string, hookName: string, ...args: any[]): void;
    getEventListeners(): Record<string, number>;
  }

  // ============================================================================
  // EVENT BUS
  // ============================================================================

  interface EventBus {
    on(eventName: string, callback: (data: any) => void): void;
    off(eventName: string, callback: (data: any) => void): void;
    emit(eventName: string, data: any): void;
    clear(eventName?: string): void;
  }

  // ============================================================================
  // EXTENSION SYSTEM
  // ============================================================================

  interface ExtensionSystem {
    /**
     * Registry of all loaded extensions
     */
    registry: Record<string, any>;

    /**
     * Register an extension with hooks
     */
    register(modId: string, definition: ExtensionDefinition): any;

    /**
     * Unregister an extension
     */
    unregister(modId: string): void;

    /**
     * Enable an extension
     */
    enable(modId: string): boolean;

    /**
     * Disable an extension
     */
    disable(modId: string): boolean;

    /**
     * Sync extensions from store
     */
    syncFromStore(): void;

    /**
     * Run a hook across all enabled extensions
     */
    runHook(hookName: string, ...args: any[]): Promise<void>;

    /**
     * Run a hook for a specific extension
     */
    runHookForMod(modId: string, hookName: string, ...args: any[]): void;

    /**
     * List all installed extensions
     */
    listMods(): ExtensionInfo[];

    /**
     * Hot reload an extension
     */
    reload(modId: string): boolean;

    /**
     * Event bus for extension communication
     */
    events: EventBus;

    /**
     * Developer tools for debugging extensions
     */
    devTools: DevTools;
  }
}

// ============================================================================
// GLOBAL DECLARATIONS
// ============================================================================

declare const CardSpoke_MODS: CardSpoke.ExtensionSystem;

declare global {
  interface Window {
    CardSpoke: {
      utils: CardSpoke.Utils;
      mods: CardSpoke.ExtensionSystem;
    };
    CardSpoke_MODS: CardSpoke.ExtensionSystem;
    _extErrors?: CardSpoke.ExtensionError[];
    // Legacy CIB compatibility
    CIB?: {
      utils: CardSpoke.Utils;
    };
    CIB_MODS?: CardSpoke.ExtensionSystem;
  }
}

export {};

import { APP_VERSION, SCHEMA_VERSION, cloneCard } from "./store";
import { Card, ModData, ModMeta, NavState, PageName, StoreShape } from "./types";

export type ModHookName = "onAppInit" | "onCardRender" | "onCardSave" | "onCardDelete";

export interface ModRuntimeDeps {
  getStore: () => StoreShape;
  getNavState: () => NavState;
  navigate: (page: PageName, options?: Partial<NavState>) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  markDirty?: () => void;
}

interface ModRegistryEntry {
  id: string;
  hooks: Partial<Record<ModHookName, (...args: any[]) => void>>;
  meta: ModMeta;
  __loaded?: boolean;
  __error?: unknown;
}

interface ModRuntime {
  registry: Record<string, ModRegistryEntry>;
  _registry: Record<string, ModRegistryEntry>;
  register: (modId: string, definition?: Partial<Record<ModHookName, (...args: any[]) => void>> & { meta?: ModMeta }) => ModRegistryEntry;
  enable: (modId: string, modData: ModData) => boolean;
  disable: (modId: string) => boolean;
  syncFromStore: (store: StoreShape) => void;
  runHook: (name: ModHookName, ...args: any[]) => void;
}

export function createModRuntime(deps: ModRuntimeDeps): ModRuntime {
  const registry: Record<string, ModRegistryEntry> = {};
  const styleTags: Record<string, HTMLStyleElement> = {};
  const initializedMods = new Set<string>();

  const ensureStyle = (modId: string, css: string | undefined) => {
    if (!css || styleTags[modId]) return;
    const tag = document.createElement("style");
    tag.setAttribute("data-mod-style", modId);
    tag.textContent = css;
    document.head.appendChild(tag);
    styleTags[modId] = tag;
  };

  const removeStyle = (modId: string) => {
    const tag = styleTags[modId];
    if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
    delete styleTags[modId];
  };

  const createStoreAPI = (modId: string) => {
    return {
      getAppInfo() {
        return { appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION };
      },
      getCard(id: string) {
        const store = deps.getStore();
        return cloneCard(store.cards[id]);
      },
      listCards() {
        const store = deps.getStore();
        return Object.values(store.cards).map((card) => cloneCard(card));
      },
      listRootIds() {
        const store = deps.getStore();
        return [...store.rootOrder];
      },
      getNavState() {
        return { ...deps.getNavState() };
      },
      navigate(page: PageName, options: Partial<NavState> = {}) {
        deps.navigate(page, options);
      },
      showToast(message: string, type: "success" | "error" = "success") {
        deps.showToast(message, type);
      },
      markDirty() {
        deps.markDirty?.();
      }
    };
  };

  const buildContext = (modId: string) => {
    return {
      modId,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      api: createStoreAPI(modId)
    };
  };

  const ensureRegistered = (modId: string, modData: ModData): ModRegistryEntry | null => {
    if (registry[modId]?.__loaded) {
      return registry[modId];
    }
    try {
      registry[modId] = registry[modId] || { id: modId, hooks: {}, meta: {} };
      const sourceURL = `\n//# sourceURL=${modId}.mod.js`;
      const runner = new Function("window", "document", "CIB_MODS", "storeAPI", "console", (modData.js || "") + sourceURL);
      const storeAPI = createStoreAPI(modId);
      runner(window, document, runtime, storeAPI, console);
      if (modData.meta) {
        registry[modId].meta = { ...modData.meta };
      }
      registry[modId].__loaded = true;
      return registry[modId];
    } catch (err) {
      console.error(`[Mods] Failed to evaluate ${modId}:`, err);
      registry[modId] = registry[modId] || { id: modId, hooks: {}, meta: modData?.meta || {} };
      registry[modId].__loaded = false;
      registry[modId].__error = err;
      return null;
    }
  };

  const runtime: ModRuntime = {
    registry,
    _registry: registry,
    register(modId, definition = {}) {
      if (!modId) throw new Error("CIB_MODS.register requires a mod id");
      const entry = registry[modId] || { id: modId, hooks: {}, meta: {} };
      entry.hooks = {
        onAppInit: typeof definition.onAppInit === "function" ? definition.onAppInit : entry.hooks.onAppInit,
        onCardRender: typeof definition.onCardRender === "function" ? definition.onCardRender : entry.hooks.onCardRender,
        onCardSave: typeof definition.onCardSave === "function" ? definition.onCardSave : entry.hooks.onCardSave,
        onCardDelete: typeof definition.onCardDelete === "function" ? definition.onCardDelete : entry.hooks.onCardDelete
      };
      if (definition.meta) {
        entry.meta = { ...definition.meta };
      }
      registry[modId] = entry;
      entry.__loaded = true;
      return entry;
    },
    enable(modId, modData) {
      if (!modData) return false;
      ensureStyle(modId, modData.css);
      const entry = ensureRegistered(modId, modData);
      if (!entry) return false;
      initializedMods.delete(modId);
      return true;
    },
    disable(modId) {
      removeStyle(modId);
      initializedMods.delete(modId);
      return true;
    },
    syncFromStore(store) {
      Object.keys(registry).forEach((modId) => {
        if (!store.mods[modId]) {
          removeStyle(modId);
          initializedMods.delete(modId);
          delete registry[modId];
        }
      });
      Object.entries(store.mods).forEach(([modId, modData]) => {
        if (!modData) return;
        if (modData.enabled) {
          ensureStyle(modId, modData.css);
          ensureRegistered(modId, modData);
        } else {
          removeStyle(modId);
        }
      });
    },
    runHook(name, ...args) {
      const store = deps.getStore();
      Object.entries(store.mods).forEach(([modId, modData]) => {
        if (!modData?.enabled) return;
        const entry = ensureRegistered(modId, modData);
        if (!entry) return;
        if (name === "onAppInit" && initializedMods.has(modId)) return;
        const fn = entry.hooks?.[name];
        if (typeof fn === "function") {
          try {
            const context = buildContext(modId);
            fn(...args, context);
            if (name === "onAppInit") {
              initializedMods.add(modId);
            }
          } catch (err) {
            console.error(`[Mods] ${modId} ${name} hook failed:`, err);
          }
        }
      });
    }
  };

  if (typeof window !== "undefined") {
    (window as any).CIB_MODS = runtime;
  }

  return runtime;
}

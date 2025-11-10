import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { CardListView, SortOption } from "./views/CardListView";
import { CardDetailView } from "./views/CardDetailView";
import { CardFormView, CardFormPayload } from "./views/CardFormView";
import { SearchResultsView } from "./views/SearchResultsView";
import { UploadModal } from "./components/UploadModal";
import { ManageModsModal } from "./components/ManageModsModal";
import {
  AppendTXTResult,
  Card,
  CardID,
  NavState,
  PageName,
  StoreShape
} from "./lib/types";
import {
  cloneCard,
  cloneStore,
  createCard,
  createEmptyStore,
  deleteCard,
  getInstanceNames,
  importJSON,
  importTXTOutline,
  installModPackage,
  loadStore,
  removeMod,
  saveStore,
  searchCards,
  setInstanceNames,
  toggleMod,
  updateCard,
  validateImport,
  appendTXTToDetails,
  buildPackage,
  exportTXT,
  getModSummary
} from "./lib/store";
import { downloadJSON, downloadTXT } from "./lib/download";
import { createModRuntime } from "./lib/modRuntime";

const APP_EXPORT_VERSION = "0.7";

const initialNav: NavState = {
  page: "list",
  cardId: null,
  parentId: null,
  searchQuery: ""
};

const sanitizeFilename = (value: string) =>
  value
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)
    .toLowerCase();

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("nested_cards_theme") as 'light' | 'dark') || "light";
  });
  const [styleMode, setStyleMode] = useState<'classic' | 'minimal'>(() => {
    if (typeof window === "undefined") return "minimal";
    return (localStorage.getItem("nested_cards_style") as 'classic' | 'minimal') || "minimal";
  });
  const [store, setStore] = useState<StoreShape>(createEmptyStore());
  const [instanceName, setInstanceName] = useState<string>("default");
  const [instanceKey, setInstanceKey] = useState<string>("");
  const [navState, setNavState] = useState<NavState>(initialNav);
  const [sortOrder, setSortOrder] = useState<SortOption>("alpha");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLocation, setUploadLocation] = useState<CardID | "root">("root");
  const [modsOpen, setModsOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const historyRef = useRef<NavState[]>([]);
  const storeRef = useRef(store);
  const navRef = useRef(navState);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);
  useEffect(() => {
    navRef.current = navState;
  }, [navState]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("nested_cards_theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("minimal", styleMode === "minimal");
    root.classList.toggle("classic", styleMode === "classic");
    localStorage.setItem("nested_cards_style", styleMode);
  }, [styleMode]);

  useEffect(() => {
    const instances = getInstanceNames();
    let selected = instances[0] || "default";
    if (!instances.includes(selected)) {
      setInstanceNames([...instances, selected]);
    }
    setInstanceName(selected);
    const key = selected ? `nested_cards_store__${selected}` : "nested_cards_store";
    setInstanceKey(key);
    const loaded = cloneStore(loadStore(key));
    setStore(loaded);
    historyRef.current = [];
    setNavState(initialNav);
  }, []);

  useEffect(() => {
    if (dirty && instanceKey) {
      saveStore(store, instanceKey);
      setDirty(false);
    }
  }, [store, dirty, instanceKey]);

  const goTo = useCallback(
    (page: PageName, options: Partial<NavState> = {}, extra: { pushHistory?: boolean } = {}) => {
      setNavState((prev) => {
        if (extra.pushHistory !== false) {
          historyRef.current.push(prev);
        }
        const next: NavState = {
          page,
          cardId: prev.cardId,
          parentId: prev.parentId,
          searchQuery: prev.searchQuery
        };
        if (page === "list") {
          next.cardId = options.cardId ?? null;
          next.parentId = options.cardId ?? null;
          next.searchQuery = "";
        } else if (page === "read") {
          const targetId = options.cardId ?? prev.cardId ?? null;
          next.cardId = targetId;
          const card = targetId ? storeRef.current.cards[targetId] : null;
          next.parentId = options.parentId ?? card?.parentId ?? null;
          next.searchQuery = "";
        } else if (page === "edit") {
          next.cardId = options.cardId ?? null;
          if (options.parentId !== undefined) {
            next.parentId = options.parentId;
          } else if (options.cardId) {
            const card = storeRef.current.cards[options.cardId];
            next.parentId = card?.parentId ?? null;
          } else {
            next.parentId = options.parentId ?? null;
          }
          next.searchQuery = "";
        } else if (page === "search") {
          next.cardId = null;
          next.parentId = null;
          next.searchQuery = options.searchQuery ?? prev.searchQuery;
        }
        return next;
      });
    },
    []
  );

  const goBack = useCallback(() => {
    setNavState((prev) => {
      const history = historyRef.current;
      if (history.length === 0) return prev;
      const next = history.pop();
      return next ?? prev;
    });
  }, []);

  const runtimeRef = useRef(
    createModRuntime({
      getStore: () => storeRef.current,
      getNavState: () => navRef.current,
      navigate: (page: PageName, options: Partial<NavState> = {}) => goTo(page, options),
      showToast: (message: string, type: "success" | "error" = "success") => {
        if (type === "error") toast.error(message);
        else toast.success(message);
      },
      markDirty: () => setDirty(true)
    })
  );

  useEffect(() => {
    runtimeRef.current.syncFromStore(store);
    runtimeRef.current.runHook("onAppInit");
  }, [store]);

  const chooseInstance = useCallback(() => {
    const existing = getInstanceNames();
    const defaultName = instanceName || existing[0] || "default";
    const promptValue = typeof window !== "undefined" ? window.prompt(
      existing.length
        ? `Enter a data instance name (existing: ${existing.join(", ")}) or type a new one:`
        : "Enter a name for your data instance:",
      defaultName
    ) : null;
    if (promptValue === null) return;
    const selected = (promptValue.trim() || "default").toLowerCase();
    if (!existing.includes(selected)) {
      setInstanceNames([...existing, selected]);
    }
    const key = `nested_cards_store__${selected}`;
    setInstanceName(selected);
    setInstanceKey(key);
    const loaded = cloneStore(loadStore(key));
    setStore(loaded);
    historyRef.current = [];
    setNavState(initialNav);
    runtimeRef.current.syncFromStore(loaded);
    runtimeRef.current.runHook("onAppInit");
    toast.success(`Switched to instance ${selected}.`);
  }, [instanceName]);

  const handleCardRender = useCallback((cardId: CardID, element: HTMLElement | null) => {
    if (!cardId) return;
    const card = cloneCard(storeRef.current.cards[cardId]);
    if (!card) return;
    runtimeRef.current.runHook("onCardRender", card, element);
  }, []);

  const handleCardFormSubmit = useCallback(
    (payload: CardFormPayload) => {
      const editingId = navRef.current.cardId;
      const cardsToNotify: { card: Card; context: Record<string, unknown> }[] = [];
      if (navRef.current.page === "edit" && editingId) {
        setStore((prev) => {
          const next = cloneStore(prev);
          const updated = updateCard(next, editingId, {
            title: payload.title,
            body: payload.body,
            parentId: payload.parentId
          });
          if (updated) {
            payload.removedChildren.forEach((childId) => {
              const removed = cloneCard(next.cards[childId]);
              if (removed) {
                runtimeRef.current.runHook("onCardDelete", removed, { source: "edit" });
              }
              deleteCard(next, childId);
            });
            Object.entries(payload.renamedChildren).forEach(([childId, title]) => {
              if (!payload.removedChildren.includes(childId) && next.cards[childId]) {
                updateCard(next, childId, { title });
              }
            });
            payload.newChildren.forEach((title) => {
              const child = createCard(next, title, "", editingId);
              const cloned = cloneCard(next.cards[child.id]);
              if (cloned) {
                cardsToNotify.push({ card: cloned, context: { isNew: true, source: "addChild" } });
              }
            });
            const finalCard = cloneCard(next.cards[editingId]);
            if (finalCard) {
              cardsToNotify.push({ card: finalCard, context: { isNew: false, source: "updateCard" } });
            }
          }
          setDirty(true);
          return next;
        });
        cardsToNotify.forEach(({ card, context }) => runtimeRef.current.runHook("onCardSave", card, context));
        toast.success("Card updated.");
        goTo("read", { cardId: editingId }, { pushHistory: false });
      } else {
        let createdId: CardID | null = null;
        setStore((prev) => {
          const next = cloneStore(prev);
          const created = createCard(next, payload.title, payload.body, payload.parentId);
          createdId = created.id;
          const main = cloneCard(next.cards[created.id]);
          if (main) {
            cardsToNotify.push({ card: main, context: { isNew: true, source: "createCard" } });
          }
          payload.newChildren.forEach((title) => {
            const child = createCard(next, title, "", created.id);
            const cloned = cloneCard(next.cards[child.id]);
            if (cloned) {
              cardsToNotify.push({ card: cloned, context: { isNew: true, source: "addChild" } });
            }
          });
          setDirty(true);
          return next;
        });
        cardsToNotify.forEach(({ card, context }) => runtimeRef.current.runHook("onCardSave", card, context));
        if (createdId) {
          toast.success("Card created.");
          goTo("read", { cardId: createdId }, { pushHistory: false });
        } else {
          toast.error("Unable to create card.");
        }
      }
    },
    [goTo]
  );

  const handleDeleteCard = useCallback(
    (cardId: CardID) => {
      const card = cloneCard(storeRef.current.cards[cardId]);
      if (!card) return;
      if (typeof window !== "undefined" && !window.confirm("Delete this card and all its children?")) {
        return;
      }
      setStore((prev) => {
        const next = cloneStore(prev);
        deleteCard(next, cardId);
        setDirty(true);
        return next;
      });
      runtimeRef.current.runHook("onCardDelete", card, { source: "deleteCard" });
      toast.success("Card deleted.");
      goTo("list", { cardId: card.parentId ?? null }, { pushHistory: false });
    },
    [goTo]
  );

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchQuery("");
        setNavState(initialNav);
        return;
      }
      setSearchQuery(trimmed);
      goTo("search", { searchQuery: trimmed });
    },
    [goTo]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery) return [] as Card[];
    return searchCards(store, searchQuery);
  }, [store, searchQuery]);

  const handleExport = useCallback(
    (exportType: string, cardId?: CardID | null) => {
      if (exportType === "mods-json") {
        const activeMods: Record<string, unknown> = {};
        Object.entries(store.mods || {}).forEach(([modId, modData]) => {
          if (modData?.enabled) {
            activeMods[modId] = {
              js: modData.js || "",
              css: modData.css || "",
              meta: modData.meta ? { ...modData.meta } : {}
            };
          }
        });
        const filename = `active-mods-${new Date().toISOString().split("T")[0]}.json`;
        downloadJSON(filename, activeMods);
        toast.success("Exported active extensions.");
        return;
      }

      let rootIds: CardID[] = [];
      let filename = "";
      if (exportType.startsWith("instance")) {
        rootIds = store.rootOrder;
        const date = new Date().toISOString().split("T")[0];
        filename = exportType.endsWith("txt")
          ? `card-info-base-instance-${date}.txt`
          : `card-info-base-instance-${date}.json`;
      } else if (cardId) {
        const card = store.cards[cardId];
        const slug = sanitizeFilename(card?.title || "card");
        rootIds = [cardId];
        filename = exportType.endsWith("txt")
          ? `${slug}-${exportType.startsWith("subtree") ? "subtree" : "card"}.txt`
          : `${slug}-${exportType.startsWith("subtree") ? "subtree" : "card"}.json`;
      } else {
        toast.error("Please select a card to export.");
        return;
      }

      if (exportType.endsWith("txt")) {
        const text = exportTXT(store, exportType.startsWith("instance") ? store.rootOrder : rootIds);
        downloadTXT(filename, text);
      } else {
        const pkg = buildPackage(store, rootIds, exportType.startsWith("instance") ? "instance" : exportType.startsWith("subtree") ? "subtree" : "card");
        pkg.version = APP_EXPORT_VERSION;
        downloadJSON(filename, pkg);
      }
      toast.success("Download started.");
    },
    [store]
  );

  const readFileText = (file: File) => file.text();

  const handleImportJSON = useCallback(
    async (file: File, location: CardID | "root") => {
      try {
        const raw = await readFileText(file);
        const pkg = JSON.parse(raw);
        const validation = validateImport(pkg);
        if (!validation.valid) {
          toast.error(validation.error || "Invalid package");
          return;
        }
        const placements: { card: Card; context: Record<string, unknown> }[] = [];
        setStore((prev) => {
          const next = cloneStore(prev);
          const result = importJSON(next, pkg, location === "root" ? "root" : location);
          result.importedIds.forEach((id) => {
            const cloned = cloneCard(next.cards[id]);
            if (cloned) {
              placements.push({ card: cloned, context: { isNew: true, source: "importJSON", exportType: pkg.exportType } });
            }
          });
          setDirty(true);
          return next;
        });
        placements.forEach(({ card, context }) => runtimeRef.current.runHook("onCardSave", card, context));
        toast.success(`Imported ${placements.length} cards.`);
        if (location === "root") {
          goTo("list", { cardId: null }, { pushHistory: false });
        } else {
          goTo("list", { cardId: location }, { pushHistory: false });
        }
        setUploadOpen(false);
      } catch (error: any) {
        toast.error(`Import failed: ${error?.message || error}`);
      }
    },
    [goTo]
  );

  const handleImportTXT = useCallback(
    async (file: File, mode: "outline" | "append", location: CardID | "root") => {
      try {
        const text = await readFileText(file);
        if (mode === "outline") {
          const parent = location === "root" ? null : location;
          const created: Card[] = [];
          setStore((prev) => {
            const next = cloneStore(prev);
            const result = importTXTOutline(next, text, parent);
            result.rootIds.forEach((id) => {
              const cloned = cloneCard(next.cards[id]);
              if (cloned) {
                created.push(cloned);
              }
            });
            setDirty(true);
            return next;
          });
          created.forEach((card) => runtimeRef.current.runHook("onCardSave", card, { isNew: true, source: "importTXT" }));
          toast.success(`Imported ${created.length} cards.`);
          goTo("list", { cardId: parent }, { pushHistory: false });
        } else {
          if (location === "root") {
            toast.error("Select a specific card to append text to.");
            return;
          }
          let result: AppendTXTResult | null = null;
          setStore((prev) => {
            const next = cloneStore(prev);
            result = appendTXTToDetails(next, location, text);
            if (result.success) {
              setDirty(true);
            }
            return next;
          });
          if (result?.success) {
            const updated = cloneCard(storeRef.current.cards[location]);
            if (updated) {
              runtimeRef.current.runHook("onCardSave", updated, { isNew: false, source: "appendTXT" });
            }
            toast.success("Text appended to card.");
            goTo("read", { cardId: location }, { pushHistory: false });
          } else {
            toast.error(result?.error || "Unable to append text.");
          }
        }
        setUploadOpen(false);
      } catch (error: any) {
        toast.error(`Import failed: ${error?.message || error}`);
      }
    },
    [goTo]
  );

  const handleInstallModFile = useCallback(
    async (file: File) => {
      try {
        const raw = await readFileText(file);
        const pkg = JSON.parse(raw);
        const preview = cloneStore(storeRef.current);
        const result = installModPackage(preview, pkg, "upload");
        if (!result.success) {
          if (!result.cancelled) toast.error(result.error || "Failed to install extension");
          return;
        }
        setStore(preview);
        setDirty(true);
        setUploadOpen(false);
        toast.success(`Installed extension ${result.modId}.`);
        setModsOpen(true);
      } catch (error: any) {
        toast.error(`Failed to install extension: ${error?.message || error}`);
      }
    },
    []
  );

  const handleInstallModCode = useCallback(
    (payload: { modId: string; name: string; version: string; author: string; js: string; css: string; enabled: boolean }) => {
      if (!payload.modId || !payload.js.trim()) {
        toast.error("Extension ID and JavaScript are required.");
        return;
      }
      const modPackage = {
        id: payload.modId,
        meta: {
          name: payload.name,
          version: payload.version,
          author: payload.author
        },
        js: payload.js,
        css: payload.css,
        enabled: payload.enabled
      };
      const preview = cloneStore(storeRef.current);
      const result = installModPackage(preview, modPackage, "manual");
      if (!result.success) {
        if (!result.cancelled) toast.error(result.error || "Failed to install extension");
        return;
      }
      setStore(preview);
      setDirty(true);
      setUploadOpen(false);
      toast.success(`Installed extension ${payload.modId}.`);
      setModsOpen(true);
    },
    []
  );

  const handleToggleMod = useCallback(
    (modId: string) => {
      setStore((prev) => {
        const next = cloneStore(prev);
        const mod = toggleMod(next, modId);
        if (mod) {
          const summary = getModSummary(modId, mod);
          toast.success(`${summary.title} ${mod.enabled ? "enabled" : "disabled"}.`);
          setDirty(true);
        }
        return next;
      });
    },
    []
  );

  const handleRemoveMod = useCallback((modId: string) => {
    if (typeof window !== "undefined" && !window.confirm("Remove this extension permanently?")) {
      return;
    }
    setStore((prev) => {
      const next = cloneStore(prev);
      const summary = getModSummary(modId, next.mods[modId]);
      if (removeMod(next, modId)) {
        toast.success(`${summary.title} removed.`);
        setDirty(true);
      }
      return next;
    });
  }, []);

  const breadcrumbTarget = useMemo(() => {
    if (navState.page === "list") return navState.cardId;
    if (navState.page === "read" || navState.page === "edit") return navState.cardId;
    return null;
  }, [navState]);

  return (
    <div className="min-h-screen bg-background text-foreground" data-style-mode={styleMode}>
      <Toaster />
      <Header
        theme={theme}
        styleMode={styleMode}
        onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
        onStyleToggle={() => setStyleMode((prev) => (prev === "classic" ? "minimal" : "classic"))}
        onHome={() => goTo("list", { cardId: null })}
        onBack={goBack}
        onAddCard={() => goTo("edit", { cardId: null, parentId: null })}
        onUpload={() => {
          setUploadLocation(navState.page === "read" && navState.cardId ? navState.cardId : "root");
          setUploadOpen(true);
        }}
        onManageMods={() => setModsOpen(true)}
        onInstance={chooseInstance}
        onExport={(type) => handleExport(type)}
      />

      <main className="mx-auto max-w-6xl px-6 pb-32 md:px-16">
        <Breadcrumbs
          store={store}
          currentCardId={breadcrumbTarget}
          onNavigate={(cardId) => goTo("list", { cardId })}
        />

        {navState.page === "list" && (
          <CardListView
            store={store}
            parentId={navState.cardId}
            sort={sortOrder}
            onSortChange={setSortOrder}
            onOpenCard={(id) => goTo("read", { cardId: id })}
            onViewChildren={(id) => goTo("list", { cardId: id })}
            onAddCardHere={(parent) => goTo("edit", { cardId: null, parentId: parent })}
            onAddChild={(id) => goTo("edit", { cardId: null, parentId: id })}
            onExport={(id, type) => handleExport(type, id)}
            onCardRender={handleCardRender}
          />
        )}

        {navState.page === "read" && navState.cardId && (
          <CardDetailView
            store={store}
            cardId={navState.cardId}
            onEdit={(id) => goTo("edit", { cardId: id })}
            onAddChild={(id) => goTo("edit", { cardId: null, parentId: id })}
            onViewChildren={(id) => goTo("list", { cardId: id })}
            onViewParent={(id) => goTo("list", { cardId: id })}
            onOpenCard={(id) => goTo("read", { cardId: id })}
            onExport={(id, type) => handleExport(type, id)}
            onUploadToCard={(id) => {
              setUploadLocation(id);
              setUploadOpen(true);
            }}
            onCardRender={handleCardRender}
          />
        )}

        {navState.page === "edit" && (
          <CardFormView
            store={store}
            cardId={navState.cardId}
            parentId={navState.parentId}
            onSubmit={handleCardFormSubmit}
            onCancel={() => goBack()}
            onDelete={navState.cardId ? handleDeleteCard : undefined}
          />
        )}

        {navState.page === "search" && (
          <SearchResultsView
            query={searchQuery}
            results={searchResults}
            onOpenCard={(id) => goTo("read", { cardId: id })}
            onCardRender={handleCardRender}
          />
        )}

        <section className="mt-24 space-y-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch(searchInput);
            }}
          >
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search cards, tags, or content..."
            />
          </form>
          <div className="flex gap-3">
            <button
              type="button"
              className="text-sm text-muted-foreground/80 underline"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setNavState(initialNav);
              }}
            >
              Clear Search
            </button>
          </div>
        </section>
      </main>

      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        store={store}
        initialLocation={uploadLocation}
        onImportJSON={handleImportJSON}
        onImportTXT={handleImportTXT}
        onInstallModFile={handleInstallModFile}
        onInstallModCode={handleInstallModCode}
      />

      <ManageModsModal
        open={modsOpen}
        onOpenChange={setModsOpen}
        store={store}
        onToggleMod={handleToggleMod}
        onRemoveMod={handleRemoveMod}
      />
    </div>
  );
}

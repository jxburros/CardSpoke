import {
  AppendTXTResult,
  Card,
  CardID,
  ExportPackage,
  InstallModResult,
  ModData,
  ModSummary,
  NormalizedModPackage,
  StoreShape,
  TXTImportResult
} from "./types";

export const APP_VERSION = "0.6.9.13";
export const SCHEMA_VERSION = 3;

export const DEFAULT_STORE: StoreShape = {
  rootOrder: [],
  cards: {},
  mods: {}
};

export function createEmptyStore(): StoreShape {
  return {
    rootOrder: [],
    cards: {},
    mods: {}
  };
}

export function cloneCard(card: Card | undefined | null): Card | null {
  if (!card) return null;
  let modsData: Record<string, unknown> = {};
  if (card.modsData) {
    try {
      modsData = JSON.parse(JSON.stringify(card.modsData));
    } catch {
      modsData = { ...card.modsData };
    }
  }

  return {
    ...card,
    children: Array.isArray(card.children) ? [...card.children] : [],
    modsData
  };
}

export function cloneStore(store: StoreShape): StoreShape {
  const cards: Record<CardID, Card> = {};
  Object.entries(store.cards).forEach(([id, card]) => {
    cards[id] = {
      ...card,
      children: [...(card.children || [])],
      modsData: card.modsData ? JSON.parse(JSON.stringify(card.modsData)) : {}
    };
  });

  const mods: Record<string, ModData> = {};
  Object.entries(store.mods || {}).forEach(([id, mod]) => {
    mods[id] = {
      enabled: !!mod.enabled,
      js: mod.js,
      css: mod.css,
      meta: { ...(mod.meta || {}) }
    };
  });

  return {
    rootOrder: [...store.rootOrder],
    cards,
    mods
  };
}

export function loadStore(instanceKey: string | null): StoreShape {
  const key = instanceKey || "nested_cards_store";
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return createEmptyStore();
    }
    const parsed = JSON.parse(raw);
    return {
      rootOrder: Array.isArray(parsed.rootOrder) ? parsed.rootOrder : [],
      cards: parsed.cards ?? {},
      mods: parsed.mods ?? {}
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveStore(store: StoreShape, instanceKey: string | null) {
  const key = instanceKey || "nested_cards_store";
  localStorage.setItem(key, JSON.stringify(store));
}

export function getInstanceNames(): string[] {
  try {
    const raw = localStorage.getItem("cib_instances");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function setInstanceNames(names: string[]) {
  localStorage.setItem("cib_instances", JSON.stringify(names));
}

export function createCard(store: StoreShape, title: string, body: string, parentId: CardID | null): Card {
  const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const card: Card = {
    id,
    title: title || "(Untitled)",
    body: body || "",
    parentId: parentId || null,
    children: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    modsData: {}
  };

  store.cards[id] = card;
  if (parentId) {
    const parent = store.cards[parentId];
    if (parent) {
      parent.children.push(id);
    }
  } else {
    store.rootOrder.push(id);
  }

  return card;
}

export function updateCard(store: StoreShape, id: CardID, updates: Partial<Omit<Card, "id" | "children">> & { children?: CardID[] })
: Card | null {
  const card = store.cards[id];
  if (!card) return null;
  const oldParent = card.parentId;
  Object.assign(card, updates, { updatedAt: Date.now() });
  const newParent = card.parentId;

  if (updates.children) {
    card.children = [...updates.children];
  }

  if (oldParent !== newParent) {
    if (oldParent) {
      const parent = store.cards[oldParent];
      if (parent) {
        parent.children = parent.children.filter((cid) => cid !== id);
      }
    } else {
      store.rootOrder = store.rootOrder.filter((cid) => cid !== id);
    }

    if (newParent) {
      const parent = store.cards[newParent];
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    } else if (!store.rootOrder.includes(id)) {
      store.rootOrder.push(id);
    }
  }

  return card;
}

export function deleteCard(store: StoreShape, id: CardID) {
  const card = store.cards[id];
  if (!card) return;
  const children = [...card.children];
  children.forEach((childId) => deleteCard(store, childId));

  if (card.parentId) {
    const parent = store.cards[card.parentId];
    if (parent) {
      parent.children = parent.children.filter((cid) => cid !== id);
    }
  } else {
    store.rootOrder = store.rootOrder.filter((cid) => cid !== id);
  }

  delete store.cards[id];
}

export function cardPath(store: StoreShape, cardId: CardID | null): CardID[] {
  const path: CardID[] = [];
  let current = cardId;
  while (current) {
    path.unshift(current);
    const card = store.cards[current];
    current = card?.parentId ?? null;
  }
  return path;
}

export function buildPackage(store: StoreShape, rootIds: CardID[], exportType: ExportPackage["exportType"]): ExportPackage {
  const cards: Record<CardID, Card> = {};
  const walk = (id: CardID) => {
    const card = store.cards[id];
    if (!card || cards[id]) return;
    cards[id] = cloneCard(card)!;
    card.children.forEach(walk);
  };
  rootIds.forEach(walk);

  const pkg: ExportPackage = {
    version: APP_VERSION,
    exportType,
    rootIds: [...rootIds],
    cards
  };

  if (exportType === "instance") {
    pkg.mods = JSON.parse(JSON.stringify(store.mods || {}));
  }

  return pkg;
}

export function exportTXT(store: StoreShape, rootIds: CardID[]): string {
  const sortByTitle = (ids: CardID[]) => {
    return [...ids].sort((a, b) => {
      const cardA = store.cards[a];
      const cardB = store.cards[b];
      const titleA = (cardA?.title || "").toLowerCase();
      const titleB = (cardB?.title || "").toLowerCase();
      return titleA.localeCompare(titleB);
    });
  };

  const blockForCard = (id: CardID, depth = 0): string => {
    const card = store.cards[id];
    if (!card) return "";
    const pad = " ".repeat(depth * 2);
    const pad2 = " ".repeat((depth + 1) * 2);
    let out = `${pad}Card: ${card.title || "(Untitled)"}\n`;
    out += `${pad}Details:\n`;
    if (!card.body) {
      out += `${pad2}(none)\n`;
    } else {
      const bodyLines = card.body.split("\n");
      if (bodyLines.length === 0) {
        out += `${pad2}(none)\n`;
      } else {
        bodyLines.forEach((line) => {
          out += `${pad2}${line}\n`;
        });
      }
    }

    const children = sortByTitle(card.children || []);
    out += `${pad}Children:\n`;
    if (children.length === 0) {
      out += `${pad2}(none)\n`;
    } else {
      children.forEach((childId) => {
        out += `${pad2}- Card: ${(store.cards[childId]?.title || "(Untitled)")}\n`;
        out += blockForCard(childId, depth + 2);
      });
    }
    return out;
  };

  const lines: string[] = [];
  const rootsSorted = sortByTitle(rootIds);
  rootsSorted.forEach((rid, idx) => {
    const block = blockForCard(rid, 0).trimEnd();
    if (block) lines.push(block);
    if (idx < rootsSorted.length - 1) {
      lines.push("\n");
    }
  });

  return lines.join("\n");
}

export interface ParsedTXTCard {
  title: string;
  body: string;
  children: ParsedTXTCard[];
  depth: number;
}

export function parseTXT(text: string): ParsedTXTCard[] {
  const lines = text.split("\n");
  const cards: ParsedTXTCard[] = [];
  const stack: ParsedTXTCard[] = [];

  let currentCard: ParsedTXTCard | null = null;
  let currentSection: "title" | "details" | "children" | null = null;
  let detailsBuffer: string[] = [];

  const flushDetails = () => {
    if (currentCard && detailsBuffer.length > 0) {
      currentCard.body = detailsBuffer.join("\n").trim();
      detailsBuffer = [];
    }
  };

  lines.forEach((line) => {
    if (!line.trim()) {
      if (currentSection === "details" && detailsBuffer.length > 0) {
        detailsBuffer.push("");
      }
      return;
    }

    const indent = line.search(/\S/);
    const depth = Math.floor(indent / 2);
    const content = line.trim();

    if (content.startsWith("Card:") || content.startsWith("- Card:")) {
      flushDetails();
      const title = content.replace(/^-?\s*Card:\s*/, "").trim();
      currentCard = {
        title: title || "(Imported)",
        body: "",
        children: [],
        depth
      };

      if (depth === 0) {
        cards.push(currentCard);
      } else {
        while (stack.length > depth) {
          stack.pop();
        }
        const parent = stack[stack.length - 1];
        if (parent) {
          parent.children.push(currentCard);
        }
      }

      while (stack.length > depth) {
        stack.pop();
      }
      stack.push(currentCard);
      currentSection = "title";
      return;
    }

    if (content === "Details:") {
      currentSection = "details";
      detailsBuffer = [];
      return;
    }

    if (content === "Children:") {
      flushDetails();
      currentSection = "children";
      return;
    }

    if (currentSection === "details") {
      detailsBuffer.push(content);
    }
  });

  flushDetails();
  return cards;
}

export function importTXTOutline(store: StoreShape, text: string, parentId: CardID | null): TXTImportResult {
  const parsedCards = parseTXT(text);
  const createdIds: CardID[] = [];

  const createRecursive = (cardData: ParsedTXTCard, parent: CardID | null) => {
    const card = createCard(store, cardData.title, cardData.body, parent);
    createdIds.push(card.id);
    cardData.children.forEach((child) => createRecursive(child, card.id));
  };

  parsedCards.forEach((card) => createRecursive(card, parentId));

  return {
    success: true,
    cardCount: createdIds.length,
    rootIds: createdIds
  };
}

export function appendTXTToDetails(store: StoreShape, cardId: CardID, text: string): AppendTXTResult {
  const card = store.cards[cardId];
  if (!card) {
    return { success: false, error: "Card not found" };
  }
  card.body = card.body ? `${card.body}\n\n${text}` : text;
  card.updatedAt = Date.now();
  return { success: true, cardId };
}

export function validateImport(pkg: ExportPackage | any): { valid: boolean; error: string | null } {
  if (!pkg || typeof pkg !== "object") {
    return { valid: false, error: "Invalid JSON structure" };
  }
  if (!pkg.version) {
    return { valid: false, error: "Missing version field" };
  }
  if (!pkg.exportType || !["card", "subtree", "instance"].includes(pkg.exportType)) {
    return { valid: false, error: "Invalid or missing exportType" };
  }
  if (!pkg.cards || typeof pkg.cards !== "object") {
    return { valid: false, error: "Missing or invalid cards object" };
  }
  if (!pkg.rootIds || !Array.isArray(pkg.rootIds)) {
    return { valid: false, error: "Missing or invalid rootIds array" };
  }
  if (Object.keys(pkg.cards).length === 0) {
    return { valid: false, error: "No cards found in import" };
  }
  for (const [cardId, card] of Object.entries(pkg.cards as Record<string, Card>)) {
    if (!(card as Card).id) {
      return { valid: false, error: `Card missing id field: ${cardId}` };
    }
    if ((card as Card).title === undefined) {
      return { valid: false, error: `Card missing title field: ${cardId}` };
    }
    if (!Array.isArray((card as Card).children)) {
      return { valid: false, error: `Card has invalid children array: ${cardId}` };
    }
  }
  return { valid: true, error: null };
}

export function remapIds(pkg: ExportPackage) {
  const idMap: Record<string, CardID> = {};
  Object.keys(pkg.cards).forEach((oldId) => {
    idMap[oldId] = `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  });

  const newCards: Record<CardID, Card> = {};
  Object.entries(pkg.cards).forEach(([oldId, card]) => {
    const newId = idMap[oldId];
    const remappedChildren = (card.children || []).map((childId) => idMap[childId]).filter(Boolean);
    newCards[newId] = {
      ...card,
      id: newId,
      parentId: card.parentId ? idMap[card.parentId] || null : null,
      children: remappedChildren,
      createdAt: card.createdAt || Date.now(),
      updatedAt: Date.now(),
      modsData: card.modsData || {}
    };
  });

  const newRootIds = pkg.rootIds.map((oldId) => idMap[oldId]).filter(Boolean);

  return {
    ...pkg,
    cards: newCards,
    rootIds: newRootIds,
    idMap
  };
}

export function importJSON(
  store: StoreShape,
  pkg: ExportPackage,
  mode: "root" | CardID
): { success: boolean; cardCount: number; importedIds: CardID[]; rootIds: CardID[] } {
  const remapped = remapIds(pkg);
  const importedIds = Object.keys(remapped.cards);

  Object.entries(remapped.cards).forEach(([cardId, card]) => {
    store.cards[cardId] = card;
  });

  if (mode === "root") {
    remapped.rootIds.forEach((cardId) => {
      if (store.cards[cardId] && !store.rootOrder.includes(cardId)) {
        store.rootOrder.push(cardId);
      }
    });
  } else {
    const parent = store.cards[mode];
    if (parent) {
      remapped.rootIds.forEach((cardId) => {
        const card = store.cards[cardId];
        if (card) {
          card.parentId = mode;
          if (!parent.children.includes(cardId)) {
            parent.children.push(cardId);
          }
        }
      });
    }
  }

  if (pkg.exportType === "instance" && pkg.mods) {
    Object.entries(pkg.mods).forEach(([modId, mod]) => {
      if (!store.mods[modId]) {
        store.mods[modId] = {
          enabled: !!mod.enabled,
          js: mod.js || "",
          css: mod.css || "",
          meta: mod.meta ? { ...mod.meta } : {}
        };
      }
    });
  }

  return {
    success: true,
    cardCount: importedIds.length,
    importedIds,
    rootIds: remapped.rootIds
  };
}

export function normalizeModPackage(raw: unknown):
  | { success: true; pkg: NormalizedModPackage }
  | { success: false; error: string } {
  const toStr = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  if (!raw || typeof raw !== "object") {
    return { success: false, error: "Invalid mod package structure" };
  }
  const source = raw as Record<string, unknown>;
  const modId = toStr(source.id) || toStr(source.modId);
  if (!modId) {
    return { success: false, error: "Extension package is missing an id" };
  }
  const js = toStr(source.js);
  if (!js.trim()) {
    return { success: false, error: "Extension package must include JavaScript" };
  }
  const css = toStr(source.css);
  const enabled = source.enabled === undefined ? true : !!source.enabled;
  const metaSource = typeof source.meta === "object" && source.meta !== null ? (source.meta as Record<string, unknown>) : {};
  const meta = {
    name: toStr(metaSource.name) || toStr(source.name),
    version: toStr(metaSource.version) || toStr(source.version),
    author: toStr(metaSource.author) || toStr(source.author),
    description: toStr(metaSource.description) || toStr(source.description)
  };
  return {
    success: true,
    pkg: {
      modId,
      js,
      css,
      enabled,
      meta
    }
  };
}

export function installModPackage(store: StoreShape, raw: unknown, source: string = "upload"): InstallModResult {
  const normalized = normalizeModPackage(raw);
  if (!normalized.success) {
    return { success: false, error: normalized.error };
  }

  const { modId, js, css, enabled, meta } = normalized.pkg;
  if (store.mods[modId]) {
    const proceed = typeof window !== "undefined" ? window.confirm(`Extension "${modId}" already exists. Replace it?`) : true;
    if (!proceed) {
      return { success: false, cancelled: true };
    }
  }

  store.mods[modId] = {
    enabled: !!enabled,
    js,
    css,
    meta: { ...meta }
  };

  return { success: true, modId, source };
}

export function getModSummary(modId: string, modData: ModData | undefined): ModSummary {
  const meta = modData?.meta || {};
  const parts: string[] = [];
  if (meta.version) parts.push(`v${meta.version}`);
  if (meta.author) parts.push(meta.author);
  return {
    title: meta.name ? `${meta.name}` : modId,
    subtitle: parts.join(" • "),
    description: meta.description || ""
  };
}

export function toggleMod(store: StoreShape, modId: string): ModData | null {
  const mod = store.mods[modId];
  if (!mod) return null;
  mod.enabled = !mod.enabled;
  return mod;
}

export function removeMod(store: StoreShape, modId: string): boolean {
  if (!store.mods[modId]) return false;
  delete store.mods[modId];
  return true;
}

export function searchCards(store: StoreShape, query: string): Card[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return Object.values(store.cards)
    .filter((card) => (card.title + " " + card.body).toLowerCase().includes(normalized))
    .sort((a, b) => (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase()));
}

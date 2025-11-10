export type CardID = string;

export interface Card {
  id: CardID;
  title: string;
  body: string;
  parentId: CardID | null;
  children: CardID[];
  createdAt: number;
  updatedAt: number;
  modsData?: Record<string, unknown>;
}

export interface ModMeta {
  name?: string;
  version?: string;
  author?: string;
  description?: string;
}

export interface ModData {
  enabled: boolean;
  js: string;
  css: string;
  meta: ModMeta;
}

export interface StoreShape {
  rootOrder: CardID[];
  cards: Record<CardID, Card>;
  mods: Record<string, ModData>;
}

export type PageName = "list" | "read" | "edit" | "search";

export interface NavState {
  page: PageName;
  cardId: CardID | null;
  parentId: CardID | null;
  searchQuery: string;
}

export interface ExportPackage {
  version: string;
  exportType: "card" | "subtree" | "instance";
  rootIds: CardID[];
  cards: Record<CardID, Card>;
  mods?: Record<string, ModData>;
}

export interface TXTImportResult {
  success: boolean;
  cardCount: number;
  rootIds: CardID[];
}

export interface AppendTXTResult {
  success: boolean;
  error?: string;
  cardId?: CardID;
}

export interface InstallModResult {
  success: boolean;
  modId?: string;
  error?: string;
  cancelled?: boolean;
  source?: string;
}

export interface ModSummary {
  title: string;
  subtitle: string;
  description: string;
}

export interface NormalizedModPackage {
  modId: string;
  js: string;
  css: string;
  enabled: boolean;
  meta: ModMeta;
}

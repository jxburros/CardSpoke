import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { CardID, StoreShape } from "../lib/types";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreShape;
  initialLocation?: CardID | "root";
  onImportJSON: (file: File, location: CardID | "root") => void;
  onImportTXT: (file: File, mode: "outline" | "append", location: CardID | "root") => void;
  onInstallModFile: (file: File) => void;
  onInstallModCode: (payload: {
    modId: string;
    name: string;
    version: string;
    author: string;
    js: string;
    css: string;
    enabled: boolean;
  }) => void;
}

type TabKey = "json" | "txt" | "mods";

export function UploadModal({
  open,
  onOpenChange,
  store,
  initialLocation = "root",
  onImportJSON,
  onImportTXT,
  onInstallModFile,
  onInstallModCode
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("json");
  const [jsonLocation, setJsonLocation] = useState<CardID | "root">("root");
  const [txtLocation, setTxtLocation] = useState<CardID | "root">("root");
  const [txtMode, setTxtMode] = useState<"outline" | "append">("outline");
  const [modEnabled, setModEnabled] = useState(true);
  const [modForm, setModForm] = useState({
    modId: "",
    name: "",
    version: "",
    author: "",
    js: "",
    css: ""
  });

  const cards = useMemo(
    () => Object.values(store.cards).sort((a, b) => (a.title || "").localeCompare(b.title || "")),
    [store.cards]
  );

  const reset = () => {
    setActiveTab("json");
    setJsonLocation("root");
    setTxtLocation("root");
    setTxtMode("outline");
    setModEnabled(true);
    setModForm({ modId: "", name: "", version: "", author: "", js: "", css: "" });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (open) {
      setJsonLocation(initialLocation);
      setTxtLocation(initialLocation);
    }
  }, [open, initialLocation]);

  return (
    <Modal open={open} onOpenChange={handleClose} title="Import Content">
      <div className="space-y-6">
        <div className="flex items-center gap-2 rounded-full bg-muted/30 p-1">
          {(
            [
              { value: "json" as const, label: "JSON" },
              { value: "txt" as const, label: "TXT" },
              { value: "mods" as const, label: "Extensions" }
            ] satisfies { value: TabKey; label: string }[]
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={
                tab.value === activeTab
                  ? "flex-1 rounded-full bg-background px-5 py-2 text-sm font-medium text-foreground shadow-sm"
                  : "flex-1 rounded-full px-5 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "json" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Select location</label>
              <select
                className="w-full rounded-full border border-transparent bg-muted/25 px-5 py-3 text-base text-foreground transition focus:border-foreground/20 focus:bg-muted/35 focus:outline-none"
                value={jsonLocation}
                onChange={(event) => setJsonLocation(event.target.value as CardID | "root")}
              >
                <option value="root">Import at top level</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.title || "(Untitled)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 rounded-[28px] bg-muted/20 p-10 text-center">
              <p className="text-muted-foreground">Upload a JSON package exported from CardSpoke.</p>
              <Input
                type="file"
                accept=".json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImportJSON(file, jsonLocation);
                    event.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "txt" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Import mode</label>
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="txtMode"
                    checked={txtMode === "outline"}
                    onChange={() => setTxtMode("outline")}
                  />
                  Create cards from outline
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="txtMode"
                    checked={txtMode === "append"}
                    onChange={() => setTxtMode("append")}
                  />
                  Append to card details
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Select location</label>
              <select
                className="w-full rounded-full border border-transparent bg-muted/25 px-5 py-3 text-base text-foreground transition focus:border-foreground/20 focus:bg-muted/35 focus:outline-none"
                value={txtLocation}
                onChange={(event) => setTxtLocation(event.target.value as CardID | "root")}
              >
                <option value="root" disabled={txtMode === "append"}>
                  Import at top level
                </option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.title || "(Untitled)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 rounded-[28px] bg-muted/20 p-10 text-center">
              <p className="text-muted-foreground">Upload a TXT outline exported from CardSpoke or another tool.</p>
              <Input
                type="file"
                accept=".txt"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImportTXT(file, txtMode, txtLocation);
                    event.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "mods" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Install from file</label>
              <Input
                type="file"
                accept=".json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onInstallModFile(file);
                    event.target.value = "";
                  }
                }}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Install from code</label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="modId">
                    Extension ID
                  </label>
                  <Input
                    id="modId"
                    placeholder="unique-id"
                    value={modForm.modId}
                    onChange={(event) => setModForm((prev) => ({ ...prev, modId: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="modName">
                    Name
                  </label>
                  <Input
                    id="modName"
                    placeholder="Display name"
                    value={modForm.name}
                    onChange={(event) => setModForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="modVersion">
                    Version
                  </label>
                  <Input
                    id="modVersion"
                    placeholder="1.0.0"
                    value={modForm.version}
                    onChange={(event) => setModForm((prev) => ({ ...prev, version: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="modAuthor">
                    Author
                  </label>
                  <Input
                    id="modAuthor"
                    placeholder="Your name"
                    value={modForm.author}
                    onChange={(event) => setModForm((prev) => ({ ...prev, author: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="modJs">
                  JavaScript
                </label>
                <Textarea
                  id="modJs"
                  rows={8}
                  placeholder="window.CIB_MODS.register('my-mod', {...});"
                  value={modForm.js}
                  onChange={(event) => setModForm((prev) => ({ ...prev, js: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="modCss">
                  CSS (optional)
                </label>
                <Textarea
                  id="modCss"
                  rows={4}
                  placeholder=".my-extension { color: inherit; }"
                  value={modForm.css}
                  onChange={(event) => setModForm((prev) => ({ ...prev, css: event.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={modEnabled}
                  onChange={(event) => setModEnabled(event.target.checked)}
                />
                Enable extension immediately
              </label>

              <Button
                type="button"
                onClick={() => {
                  onInstallModCode({
                    modId: modForm.modId,
                    name: modForm.name,
                    version: modForm.version,
                    author: modForm.author,
                    js: modForm.js,
                    css: modForm.css,
                    enabled: modEnabled
                  });
                }}
              >
                Install Extension
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

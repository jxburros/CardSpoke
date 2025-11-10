import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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

  const cards = useMemo(() => Object.values(store.cards).sort((a, b) => (a.title || "").localeCompare(b.title || "")), [store.cards]);

  const reset = () => {
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl rounded-[36px] bg-card p-10 [box-shadow:var(--shadow-strong)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Import Content</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="json" className="mt-6">
          <TabsList className="grid grid-cols-3 rounded-full bg-foreground/5 p-1">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="txt">TXT</TabsTrigger>
            <TabsTrigger value="mods">Extensions</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label>Select location</Label>
              <select
                className="w-full rounded-full border-0 bg-card px-6 py-3 text-base text-foreground outline-none [box-shadow:var(--shadow-soft)] focus:[box-shadow:var(--shadow-strong)]"
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

            <div className="space-y-4 rounded-[32px] bg-card p-10 text-center [box-shadow:var(--shadow-soft)]">
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
          </TabsContent>

          <TabsContent value="txt" className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label>Import mode</Label>
              <div className="flex gap-4 text-sm">
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
              <Label>Select location</Label>
              <select
                className="w-full rounded-full border-0 bg-card px-6 py-3 text-base text-foreground outline-none [box-shadow:var(--shadow-soft)] focus:[box-shadow:var(--shadow-strong)]"
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

            <div className="space-y-4 rounded-[32px] bg-card p-10 text-center [box-shadow:var(--shadow-soft)]">
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
          </TabsContent>

          <TabsContent value="mods" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Install from file</Label>
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
                <Label>Install from code</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modId">Extension ID</Label>
                    <Input
                      id="modId"
                      placeholder="unique-id"
                      value={modForm.modId}
                      onChange={(event) => setModForm((prev) => ({ ...prev, modId: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modName">Name</Label>
                    <Input
                      id="modName"
                      placeholder="Display name"
                      value={modForm.name}
                      onChange={(event) => setModForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modVersion">Version</Label>
                    <Input
                      id="modVersion"
                      placeholder="1.0.0"
                      value={modForm.version}
                      onChange={(event) => setModForm((prev) => ({ ...prev, version: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modAuthor">Author</Label>
                    <Input
                      id="modAuthor"
                      placeholder="Your name"
                      value={modForm.author}
                      onChange={(event) => setModForm((prev) => ({ ...prev, author: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modJs">JavaScript</Label>
                  <Textarea
                    id="modJs"
                    rows={8}
                    placeholder="window.CIB_MODS.register('my-mod', {...});"
                    value={modForm.js}
                    onChange={(event) => setModForm((prev) => ({ ...prev, js: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modCss">CSS (optional)</Label>
                  <Textarea
                    id="modCss"
                    rows={4}
                    placeholder=".my-extension { color: inherit; }"
                    value={modForm.css}
                    onChange={(event) => setModForm((prev) => ({ ...prev, css: event.target.value }))}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground/80">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

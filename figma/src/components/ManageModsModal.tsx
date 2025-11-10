import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { StoreShape } from "../lib/types";
import { getModSummary } from "../lib/store";

interface ManageModsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreShape;
  onToggleMod: (modId: string) => void;
  onRemoveMod: (modId: string) => void;
}

export function ManageModsModal({ open, onOpenChange, store, onToggleMod, onRemoveMod }: ManageModsModalProps) {
  const mods = Object.entries(store.mods || {}).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl rounded-[40px] border-0 p-10"
        style={{ background: "var(--panel-surface)", boxShadow: "var(--panel-shadow)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Manage Extensions</DialogTitle>
        </DialogHeader>

        {mods.length === 0 ? (
          <div className="rounded-[36px] bg-foreground/[0.04] px-8 py-16 text-center text-muted-foreground">
            No extensions installed yet.
          </div>
        ) : (
          <div className="space-y-4">
            {mods.map(([modId, mod]) => {
              const summary = getModSummary(modId, mod);
              return (
                <div
                  key={modId}
                  className={`flex items-center justify-between gap-4 rounded-[36px] p-6 transition ${
                    mod.enabled ? "" : "opacity-60"
                  }`}
                  style={{ background: "var(--panel-surface)", boxShadow: "var(--panel-shadow)" }}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{summary.title}</div>
                    {summary.subtitle && <div className="text-xs uppercase tracking-wide text-muted-foreground">{summary.subtitle}</div>}
                    {summary.description && <div className="text-sm text-muted-foreground">{summary.description}</div>}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => onToggleMod(modId)}>
                      {mod.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="destructive" onClick={() => onRemoveMod(modId)}>
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
      <DialogContent className="max-w-2xl rounded-[32px] bg-background/95 p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Manage Extensions</DialogTitle>
        </DialogHeader>

        {mods.length === 0 ? (
          <div className="rounded-[28px] bg-muted/25 px-8 py-16 text-center text-muted-foreground">
            No extensions installed yet.
          </div>
        ) : (
          <div className="space-y-4">
            {mods.map(([modId, mod]) => {
              const summary = getModSummary(modId, mod);
              return (
                <div
                  key={modId}
                  className={`flex items-center justify-between gap-4 rounded-[28px] bg-muted/20 p-6 shadow-[0_24px_60px_rgba(17,17,17,0.08)] ${
                    mod.enabled ? "" : "opacity-60"
                  }`}
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

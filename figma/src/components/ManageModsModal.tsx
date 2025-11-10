import { Modal } from "./Modal";
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
    <Modal open={open} onOpenChange={onOpenChange} title="Manage Extensions" className="max-w-2xl">
      {mods.length === 0 ? (
        <div className="rounded-[28px] bg-muted/20 px-8 py-16 text-center text-muted-foreground">
          No extensions installed yet.
        </div>
      ) : (
        <div className="space-y-4">
          {mods.map(([modId, mod]) => {
            const summary = getModSummary(modId, mod);
            return (
              <div
                key={modId}
                className={
                  "flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-muted/15 p-6 shadow-[0_24px_60px_rgba(17,17,17,0.08)]"
                }
                style={{ opacity: mod.enabled ? 1 : 0.6 }}
              >
                <div className="space-y-1">
                  <div className="text-base font-medium text-foreground">{summary.title}</div>
                  {summary.subtitle && (
                    <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{summary.subtitle}</div>
                  )}
                  {summary.description && (
                    <div className="text-sm leading-relaxed text-muted-foreground">{summary.description}</div>
                  )}
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
    </Modal>
  );
}

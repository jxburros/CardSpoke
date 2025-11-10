import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { CardID, StoreShape } from "../lib/types";

export interface CardFormPayload {
  title: string;
  body: string;
  parentId: CardID | null;
  renamedChildren: Record<CardID, string>;
  removedChildren: CardID[];
  newChildren: string[];
}

interface CardFormViewProps {
  store: StoreShape;
  cardId: CardID | null;
  parentId: CardID | null;
  onSubmit: (payload: CardFormPayload) => void;
  onCancel: () => void;
  onDelete?: (cardId: CardID) => void;
}

export function CardFormView({ store, cardId, parentId, onSubmit, onCancel, onDelete }: CardFormViewProps) {
  const editing = !!cardId;
  const card = editing ? store.cards[cardId!] : null;

  const [title, setTitle] = useState(card?.title || "");
  const [body, setBody] = useState(card?.body || "");
  const [selectedParent, setSelectedParent] = useState<CardID | "" | null>(card?.parentId ?? parentId ?? null);
  const [renamedChildren, setRenamedChildren] = useState<Record<CardID, string>>({});
  const [removedChildren, setRemovedChildren] = useState<CardID[]>([]);
  const [newChildren, setNewChildren] = useState<string[]>([""]);

  const availableParents = useMemo(() => {
    const entries = Object.values(store.cards);
    if (!editing || !card) {
      return entries;
    }

    const isDescendant = (potentialParent: CardID): boolean => {
      if (potentialParent === card.id) return true;
      const target = store.cards[potentialParent];
      if (!target) return false;
      if (target.children.includes(card.id)) return true;
      return target.children.some((childId) => isDescendant(childId));
    };

    return entries.filter((candidate) => candidate.id !== card.id && !isDescendant(candidate.id));
  }, [store.cards, editing, card]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      title: title.trim() || "(Untitled)",
      body: body.trim(),
      parentId: selectedParent ? (selectedParent === "" ? null : selectedParent) : null,
      renamedChildren,
      removedChildren,
      newChildren: newChildren.map((entry) => entry.trim()).filter(Boolean)
    });
  };

  const toggleRemoveChild = (childId: CardID) => {
    setRemovedChildren((current) =>
      current.includes(childId) ? current.filter((id) => id !== childId) : [...current, childId]
    );
  };

  const heading = editing ? "Edit Card" : "Create Card";

  return (
    <section className="space-y-8 max-w-3xl">
      <header>
        <h2 className="text-foreground text-4xl font-semibold">{heading}</h2>
        <p className="text-muted-foreground mt-2">
          {editing ? "Update the details and structure of this card." : "Define the top-level information for your new card."}
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Card title" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Details</label>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add your notes, context, or reference material here."
            rows={10}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Parent Card</label>
          <select
            className="w-full rounded-full border-0 bg-muted/25 px-5 py-3 text-base text-foreground transition focus:bg-muted/35 focus:outline-none"
            value={selectedParent ?? ""}
            onChange={(event) => {
              const value = event.target.value as CardID | "";
              setSelectedParent(value === "" ? null : value);
            }}
          >
            <option value="">No parent (top-level)</option>
            {availableParents
              .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title || "(Untitled)"}
                </option>
              ))}
          </select>
        </div>

        {editing && card && card.children.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Existing Children</h3>
            <div className="space-y-3">
              {card.children.map((childId) => {
                const child = store.cards[childId];
                if (!child) return null;
                const markedForRemoval = removedChildren.includes(childId);
                return (
                  <div key={childId} className="flex items-center gap-3">
                    <Input
                      value={renamedChildren[childId] ?? child.title ?? ""}
                      onChange={(event) =>
                        setRenamedChildren((current) => ({ ...current, [childId]: event.target.value }))
                      }
                      disabled={markedForRemoval}
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={markedForRemoval}
                        onChange={() => toggleRemoveChild(childId)}
                      />
                      Remove
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add New Children</h3>
          <div className="space-y-3">
            {newChildren.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={value}
                  onChange={(event) => {
                    const next = [...newChildren];
                    next[index] = event.target.value;
                    setNewChildren(next);
                  }}
                  placeholder="Child title"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewChildren((current) => current.filter((_, idx) => idx !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setNewChildren((current) => [...current, ""])}
          >
            + Add Another Child
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Button type="submit">Save Card</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          {editing && card && onDelete && (
            <Button type="button" variant="destructive" onClick={() => onDelete(card.id)}>
              Delete Card
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

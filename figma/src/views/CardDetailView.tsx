import { CardID, StoreShape } from "../lib/types";
import { formatDate, bodyPreview } from "../lib/format";
import { Button } from "../components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { SimpleMenu } from "../components/SimpleMenu";

interface CardDetailViewProps {
  store: StoreShape;
  cardId: CardID;
  onEdit: (cardId: CardID) => void;
  onAddChild: (cardId: CardID) => void;
  onViewChildren: (cardId: CardID) => void;
  onViewParent: (cardId: CardID | null) => void;
  onOpenCard: (cardId: CardID) => void;
  onExport: (cardId: CardID, exportType: "card-json" | "card-txt" | "subtree-json" | "subtree-txt") => void;
  onUploadToCard: (cardId: CardID) => void;
  onCardRender: (cardId: CardID, element: HTMLElement | null) => void;
}

export function CardDetailView({
  store,
  cardId,
  onEdit,
  onAddChild,
  onViewChildren,
  onViewParent,
  onOpenCard,
  onExport,
  onUploadToCard,
  onCardRender
}: CardDetailViewProps) {
  const card = store.cards[cardId];
  if (!card) {
    return <div className="text-muted-foreground">Card not found.</div>;
  }

  const parent = card.parentId ? store.cards[card.parentId] : null;
  const children = card.children.map((childId) => store.cards[childId]).filter(Boolean);

  return (
    <section className="space-y-16" ref={(el) => onCardRender(card.id, el)}>
      <header className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-foreground text-4xl font-semibold md:text-5xl">{card.title || "(Untitled)"}</h2>
          {parent && (
            <button
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70 underline-offset-4 hover:underline"
              onClick={() => onViewParent(parent.id)}
            >
              Parent · {parent.title || "(Untitled)"}
            </button>
          )}
        </div>

        <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/75">
          {card.body || "No details available yet."}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onEdit(card.id)} className="h-11 rounded-full px-6 text-sm">
              Edit Card
            </Button>
            <Button variant="outline" onClick={() => onAddChild(card.id)} className="h-11 rounded-full px-6 text-sm">
              + Add Child
            </Button>
            <Button variant="ghost" onClick={() => onUploadToCard(card.id)} className="h-11 rounded-full px-6 text-sm">
              Upload to Card
            </Button>
            <div
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              role="presentation"
            >
              <SimpleMenu
                triggerIcon={<MoreHorizontal className="h-4 w-4" />}
                triggerLabel="Card export menu"
                triggerClassName="h-11 w-11 rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
                items={[
                  { label: "Download Card (JSON)", onSelect: () => onExport(card.id, "card-json") },
                  { label: "Download Card (TXT)", onSelect: () => onExport(card.id, "card-txt") },
                  { label: "Download Card + Children (JSON)", onSelect: () => onExport(card.id, "subtree-json") },
                  { label: "Download Card + Children (TXT)", onSelect: () => onExport(card.id, "subtree-txt") }
                ]}
                menuClassName="w-72"
              />
            </div>
            <Button variant="ghost" onClick={() => onViewChildren(card.id)} className="h-11 rounded-full px-6 text-sm">
              View All Children
            </Button>
            <Button
              variant="ghost"
              onClick={() => onViewParent(card.parentId ?? null)}
              className="h-11 rounded-full px-6 text-sm"
            >
              View Siblings
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Metadata</h3>
          <dl className="grid gap-3 text-sm text-foreground/80">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground/70">Created</dt>
              <dd>{formatDate(card.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground/70">Updated</dt>
              <dd>{formatDate(card.updatedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground/70">Children</dt>
              <dd>{card.children.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Children</h3>
          <Button variant="outline" onClick={() => onAddChild(card.id)} className="h-11 rounded-full px-6 text-sm">
            + Add Child
          </Button>
        </div>
        {children.length === 0 ? (
          <div className="rounded-[36px] bg-foreground/[0.04] px-8 py-12 text-center text-muted-foreground">
            No children yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <button
                key={child!.id}
                className="rounded-[36px] px-8 py-6 text-left text-foreground transition hover:bg-foreground/[0.05]"
                style={{ background: "var(--panel-surface)", boxShadow: "var(--panel-shadow)" }}
                onClick={() => onOpenCard(child!.id)}
                ref={(el) => onCardRender(child!.id, el)}
              >
                <div className="text-base font-medium">{child!.title || "(Untitled)"}</div>
                <div className="mt-2 text-sm text-foreground/70">{bodyPreview(child!.body, 120)}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

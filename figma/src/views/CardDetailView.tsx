import { CardID, StoreShape } from "../lib/types";
import { formatDate, bodyPreview } from "../lib/format";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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
    <section className="space-y-8" ref={(el) => onCardRender(card.id, el)}>
      <header className="space-y-4">
        <h2 className="text-foreground text-4xl md:text-5xl font-semibold">{card.title || "(Untitled)"}</h2>
        {parent && (
          <p className="text-muted-foreground">
            Parent: {" "}
            <button className="underline" onClick={() => onViewParent(parent.id)}>
              {parent.title || "(Untitled)"}
            </button>
          </p>
        )}
        <p className="text-muted-foreground whitespace-pre-wrap leading-7 bg-muted/20 border border-border rounded-2xl p-6">
          {card.body || "No details available yet."}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="uppercase tracking-wide text-xs text-muted-foreground">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onEdit(card.id)}>Edit Card</Button>
            <Button variant="outline" onClick={() => onAddChild(card.id)}>
              + Add Child
            </Button>
            <Button variant="ghost" onClick={() => onUploadToCard(card.id)}>
              Upload to Card
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onExport(card.id, "card-json")}>Download Card (JSON)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(card.id, "card-txt")}>Download Card (TXT)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(card.id, "subtree-json")}>
                  Download Card + Children (JSON)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(card.id, "subtree-txt")}>
                  Download Card + Children (TXT)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" onClick={() => onViewChildren(card.id)}>
              View All Children
            </Button>
            <Button variant="ghost" onClick={() => onViewParent(card.parentId ?? null)}>
              View Siblings
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="uppercase tracking-wide text-xs text-muted-foreground">Metadata</h3>
          <div className="rounded-2xl border border-border p-5 bg-card/50">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDate(card.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{formatDate(card.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Children</dt>
                <dd>{card.children.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Children</h3>
          <Button variant="outline" onClick={() => onAddChild(card.id)}>
            + Add Child
          </Button>
        </div>
        {children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-muted-foreground">
            No children yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <button
                key={child!.id}
                className="text-left rounded-2xl border border-border p-5 bg-card/40 hover:border-foreground transition"
                onClick={() => onOpenCard(child!.id)}
                ref={(el) => onCardRender(child!.id, el)}
              >
                <div className="font-medium text-foreground">{child!.title || "(Untitled)"}</div>
                <div className="text-sm text-muted-foreground mt-2">{bodyPreview(child!.body, 120)}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

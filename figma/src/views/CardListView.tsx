import { CardID, StoreShape } from "../lib/types";
import { InfoCard } from "../components/InfoCard";
import { bodyPreview, formatDate } from "../lib/format";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useCallback } from "react";

export type SortOption = "alpha" | "updated" | "created";

interface CardListViewProps {
  store: StoreShape;
  parentId: CardID | null;
  sort: SortOption;
  onSortChange: (option: SortOption) => void;
  onOpenCard: (cardId: CardID) => void;
  onViewChildren: (cardId: CardID) => void;
  onAddCardHere: (parentId: CardID | null) => void;
  onAddChild: (cardId: CardID) => void;
  onExport: (cardId: CardID, exportType: "card-json" | "card-txt" | "subtree-json" | "subtree-txt") => void;
  onCardRender: (cardId: CardID, element: HTMLElement | null) => void;
}

export function CardListView({
  store,
  parentId,
  sort,
  onSortChange,
  onOpenCard,
  onViewChildren,
  onAddCardHere,
  onAddChild,
  onExport,
  onCardRender
}: CardListViewProps) {
  const cards = useMemo(() => {
    if (!parentId) {
      return store.rootOrder.map((id) => store.cards[id]).filter(Boolean);
    }
    const parent = store.cards[parentId];
    if (!parent) return [];
    return parent.children.map((id) => store.cards[id]).filter(Boolean);
  }, [store, parentId]);

  const sortedCards = useMemo(() => {
    const list = [...cards];
    if (sort === "alpha") {
      list.sort((a, b) => (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase()));
    } else if (sort === "updated") {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (sort === "created") {
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return list;
  }, [cards, sort]);

  const heading = parentId ? store.cards[parentId]?.title || "Children" : "Top Level Cards";

  const createRef = useCallback(
    (cardId: CardID) => (element: HTMLElement | null) => {
      onCardRender(cardId, element);
    },
    [onCardRender]
  );

  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-foreground text-4xl md:text-5xl font-medium">{heading}</h2>
          {parentId && (
            <p className="text-muted-foreground mt-2">Showing {sortedCards.length} cards nested under this topic.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Sort</label>
          <select
            className="bg-transparent border border-border rounded-full px-4 py-2 text-sm"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
          >
            <option value="alpha">Alphabetical</option>
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {sortedCards.map((card) => (
          <InfoCard
            key={card!.id}
            title={card!.title}
            preview={bodyPreview(card!.body)}
            subtitle={`Updated ${formatDate(card!.updatedAt)}`}
            childrenCount={card!.children.length}
            onClick={() => onOpenCard(card!.id)}
            ref={createRef(card!.id)}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={(event) => { event.stopPropagation(); onOpenCard(card!.id); }}>
                  Open Card
                </Button>
                <Button variant="outline" onClick={(event) => { event.stopPropagation(); onAddChild(card!.id); }}>
                  + Add Child
                </Button>
                <Button variant="ghost" onClick={(event) => { event.stopPropagation(); onViewChildren(card!.id); }}>
                  View Children
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onExport(card!.id, "card-json")}>Download Card (JSON)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(card!.id, "card-txt")}>Download Card (TXT)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(card!.id, "subtree-json")}>
                      Download Card + Children (JSON)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(card!.id, "subtree-txt")}>
                      Download Card + Children (TXT)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />
        ))}

        {sortedCards.length === 0 && (
          <div className="rounded-xl border border-dashed border-border px-8 py-12 text-center text-muted-foreground">
            No cards yet. Start by creating one below.
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button onClick={() => onAddCardHere(parentId)} size="lg">
          + Add Card Here
        </Button>
      </div>
    </section>
  );
}

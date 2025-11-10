import { CardID, StoreShape } from "../lib/types";
import { InfoCard } from "../components/InfoCard";
import { bodyPreview, formatDate } from "../lib/format";
import { Button } from "../components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useCallback } from "react";
import { SimpleMenu } from "../components/SimpleMenu";

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
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-4xl md:text-5xl font-medium tracking-tight">{heading}</h2>
          {parentId && (
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Showing {sortedCards.length} cards nested under this topic.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Sort</label>
          <select
            className="rounded-full bg-muted/40 px-5 py-2 text-sm text-foreground shadow-none outline-none transition focus:bg-muted/60"
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
                <Button
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenCard(card!.id);
                  }}
                >
                  Open Card
                </Button>
                <Button
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddChild(card!.id);
                  }}
                >
                  + Add Child
                </Button>
                <Button
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewChildren(card!.id);
                  }}
                >
                  View Children
                </Button>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                  role="presentation"
                >
                  <SimpleMenu
                    triggerIcon={<MoreHorizontal className="h-4 w-4" />}
                    triggerLabel="Card export menu"
                    triggerClassName="h-10 w-10 rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
                    items={[
                      { label: "Download Card (JSON)", onSelect: () => onExport(card!.id, "card-json") },
                      { label: "Download Card (TXT)", onSelect: () => onExport(card!.id, "card-txt") },
                      { label: "Download Card + Children (JSON)", onSelect: () => onExport(card!.id, "subtree-json") },
                      { label: "Download Card + Children (TXT)", onSelect: () => onExport(card!.id, "subtree-txt") }
                    ]}
                    menuClassName="w-72"
                  />
                </div>
              </div>
            }
          />
        ))}

        {sortedCards.length === 0 && (
          <div className="rounded-3xl bg-muted/30 px-10 py-16 text-center text-muted-foreground">
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

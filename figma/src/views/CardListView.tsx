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
    <section className="space-y-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <h2 className="text-5xl font-semibold tracking-tight text-foreground">{heading}</h2>
          {parentId && (
            <p className="max-w-xl text-base text-muted-foreground">
              Showing {sortedCards.length} cards nested under this topic.
            </p>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <span className="uppercase tracking-[0.3em]">Sort</span>
          <select
            className="w-full rounded-full border border-transparent bg-muted/25 px-5 py-3 text-sm text-foreground transition focus:border-foreground/20 focus:bg-muted/35 focus:outline-none md:w-auto"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
          >
            <option value="alpha">Alphabetical</option>
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
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
                  variant="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenCard(card!.id);
                  }}
                >
                  Open Card
                </Button>
                <Button
                  variant="secondary"
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
          <div className="rounded-[32px] bg-muted/20 px-10 py-16 text-center text-muted-foreground">
            No cards yet. Start by creating one below.
          </div>
        )}
      </div>

      <div className="pt-6">
        <Button onClick={() => onAddCardHere(parentId)} size="lg" variant="secondary">
          + Add Card Here
        </Button>
      </div>
    </section>
  );
}

import { Fragment } from "react";
import { CardID, StoreShape } from "../lib/types";
import { cardPath } from "../lib/store";

interface BreadcrumbsProps {
  store: StoreShape;
  currentCardId: CardID | null;
  onNavigate: (cardId: CardID | null) => void;
}

export function Breadcrumbs({ store, currentCardId, onNavigate }: BreadcrumbsProps) {
  const path = cardPath(store, currentCardId);
  const items = path.map((id) => store.cards[id]).filter(Boolean);

  return (
    <nav className="text-sm text-muted-foreground mb-10" aria-label="Breadcrumb">
      <button
        type="button"
        className="hover:text-foreground transition-colors"
        onClick={() => onNavigate(null)}
      >
        Home
      </button>
      {items.map((card, index) => (
        <Fragment key={card!.id}>
          <span className="mx-2 text-muted-foreground">/</span>
          <button
            type="button"
            onClick={() => onNavigate(card!.id)}
            className={`transition-colors ${index === items.length - 1 ? "text-foreground" : "hover:text-foreground"}`}
          >
            {card!.title || "(Untitled)"}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}

import { Card, CardID } from "../lib/types";
import { InfoCard } from "../components/InfoCard";
import { bodyPreview, formatDate } from "../lib/format";

interface SearchResultsViewProps {
  query: string;
  results: Card[];
  onOpenCard: (cardId: CardID) => void;
  onCardRender: (cardId: CardID, element: HTMLElement | null) => void;
}

export function SearchResultsView({ query, results, onOpenCard, onCardRender }: SearchResultsViewProps) {
  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <h2 className="text-foreground text-[44px] font-semibold leading-[1.05]">Search</h2>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Results for “{query}” ({results.length})
        </p>
      </header>

      {results.length === 0 ? (
        <p className="text-muted-foreground/80">No cards matched your search.</p>
      ) : (
        <div className="space-y-12">
          {results.map((card) => (
            <InfoCard
              key={card.id}
              title={card.title}
              preview={bodyPreview(card.body)}
              subtitle={`Updated ${formatDate(card.updatedAt)}`}
              childrenCount={card.children.length}
              onClick={() => onOpenCard(card.id)}
              ref={(element) => onCardRender(card.id, element)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

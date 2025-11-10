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
    <section className="space-y-8">
      <header>
        <h2 className="text-foreground text-4xl font-semibold">Search</h2>
        <p className="text-muted-foreground mt-2">Results for “{query}” ({results.length})</p>
      </header>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
          No cards matched your search.
        </div>
      ) : (
        <div className="space-y-6">
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

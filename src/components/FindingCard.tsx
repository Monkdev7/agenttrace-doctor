import type { NormalizedTrace } from "../lib/normalize";
import type { Finding } from "../lib/findings";
import { eventPreview } from "../lib/preview";

/**
 * One finding card. The four parts are rendered as separate, labeled blocks so
 * an interpretation can never be mistaken for a fact (prd.md > Finding cards):
 *   fact · evidence · explanation · fix.
 * The certainty label (confirmed vs. possible) uses an explicit text label +
 * icon + color, never color alone.
 */
export function FindingCard({
  finding,
  trace,
  selected,
  onSelect,
  onGoToEvent,
}: {
  finding: Finding;
  trace: NormalizedTrace;
  selected: boolean;
  onSelect: () => void;
  onGoToEvent: (index: number) => void;
}) {
  const confirmed = finding.certainty === "confirmed";
  const certaintyClass = confirmed ? "certainty--confirmed" : "certainty--possible";
  const certaintyLabel = confirmed ? "Confirmed error" : "Possible loop";
  const icon = confirmed ? "⚠" : "↻";

  return (
    <article
      className={"finding-card" + (selected ? " finding-card--selected" : "")}
      onClick={onSelect}
    >
      <header className="finding-card__head">
        <span className="finding-card__title">{finding.title}</span>
        <span className={"certainty " + certaintyClass}>
          <span aria-hidden="true">{icon}</span> {certaintyLabel}
        </span>
      </header>

      <div className="finding-part finding-part--fact">
        <span className="finding-part__label">Observed fact</span>
        <p>{finding.fact}</p>
      </div>

      <div className="finding-part finding-part--evidence">
        <span className="finding-part__label">Supporting evidence</span>
        <ul className="evidence-list">
          {finding.eventIndices.map((index) => {
            const event = trace.events[index];
            return (
              <li key={index}>
                <button
                  type="button"
                  className="evidence-ref"
                  onClick={(e) => {
                    e.stopPropagation(); // don't double-fire the card's onSelect
                    onGoToEvent(index);
                  }}
                  title="Jump to this event on the timeline"
                >
                  {event ? event.id : `#${index}`}
                </button>
                {event && <span className="evidence-preview">{eventPreview(event)}</span>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="finding-part finding-part--explanation">
        <span className="finding-part__label">Potential explanation</span>
        <p>{finding.explanation}</p>
      </div>

      <div className="finding-part finding-part--fix">
        <span className="finding-part__label">Suggested fix</span>
        <p>{finding.fix}</p>
      </div>

      <footer className="finding-card__rule">
        <span className="finding-part__label">Rule</span> {finding.rule}
      </footer>
    </article>
  );
}

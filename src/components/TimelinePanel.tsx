import type { NormalizedTrace } from "../lib/normalize";
import { EventRow } from "./EventRow";

/**
 * The left panel: the agent run as an ordered timeline. Receives the derived
 * highlight set and current event selection from App; it owns no selection
 * state itself. (spec.md > Components: TimelinePanel)
 */
export function TimelinePanel({
  trace,
  highlighted,
  selectedEventIndex,
  onSelectEvent,
}: {
  trace: NormalizedTrace;
  highlighted: Set<number>;
  selectedEventIndex: number | null;
  onSelectEvent: (index: number) => void;
}) {
  return (
    <div className="timeline">
      <h2 className="panel__heading">Execution timeline</h2>
      {trace.events.map((event) => (
        <EventRow
          key={event.index}
          event={event}
          highlighted={highlighted.has(event.index)}
          selected={selectedEventIndex === event.index}
          onSelect={() => onSelectEvent(event.index)}
        />
      ))}
    </div>
  );
}

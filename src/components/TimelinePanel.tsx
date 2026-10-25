import type { Trace } from "../lib/schema";
import { EventRow } from "./EventRow";

/**
 * The left panel: the agent run as an ordered, top-to-bottom timeline.
 * (spec.md > Components: TimelinePanel; prd.md > Execution timeline)
 */
export function TimelinePanel({ trace }: { trace: Trace }) {
  return (
    <div className="timeline">
      <h2 className="timeline__heading">Execution timeline</h2>
      {trace.events.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </div>
  );
}

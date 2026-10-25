import type { TraceEvent } from "../lib/schema";

/**
 * One row in the execution timeline: event ID, type, tool name, and a status
 * indicator. Status only applies to tool_result events; tool_call rows show a
 * neutral marker. (spec.md > Components: EventRow; prd.md > Execution timeline)
 */
export function EventRow({ event }: { event: TraceEvent }) {
  const typeLabel = event.type === "tool_call" ? "tool call" : "tool result";

  // Status badge: ok/error for results, neutral for calls.
  let statusClass = "event-row__status";
  let statusText = "call";
  if (event.type === "tool_result") {
    statusClass += event.status === "error" ? " status--error" : " status--ok";
    statusText = event.status;
  }

  return (
    <div className="event-row">
      <span className="event-row__id">{event.id}</span>
      <span className="event-row__type">{typeLabel}</span>
      <span className="event-row__tool">{event.tool_name}</span>
      <span className={statusClass}>
        <span className="status-dot" />
        {statusText}
      </span>
    </div>
  );
}

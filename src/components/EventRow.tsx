import { useState } from "react";
import type { NormalizedEvent } from "../lib/normalize";

/**
 * One timeline row. Shows id, type, tool, status; expands on click to reveal
 * full args / error. The `highlighted` class is kept VISUALLY DISTINCT from the
 * status classes: highlight is a cyan ring/background (selection), while status
 * is the green/amber badge (execution outcome). A clean event that is selected
 * must not look like an error. (prd.md > Execution timeline)
 */
export function EventRow({
  event,
  highlighted,
  selected,
  onSelect,
}: {
  event: NormalizedEvent;
  highlighted: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = event.type === "tool_call" ? "tool call" : "tool result";

  let statusClass = "event-row__status";
  let statusText = "call";
  if (event.type === "tool_result") {
    statusClass += event.status === "error" ? " status--error" : " status--ok";
    statusText = event.status;
  }

  const rowClass =
    "event-row" +
    (highlighted ? " event-row--highlighted" : "") +
    (selected ? " event-row--selected" : "");

  // Node marker color follows the event's own kind/status, giving the timeline
  // rail a readable rhythm. (Selection highlight stays separate, on the card.)
  const nodeClass =
    "timeline__node" +
    (event.type === "tool_result"
      ? event.status === "error"
        ? " timeline__node--error"
        : " timeline__node--ok"
      : " timeline__node--call");

  return (
    <div className="timeline__item">
      <div className="timeline__rail" aria-hidden="true">
        <span className={nodeClass} />
      </div>
      <div
        className={rowClass}
        data-event-index={event.index}
        onClick={() => {
          setExpanded((v) => !v);
          onSelect();
        }}
      >
        <div className="event-row__main">
          <span className="event-row__id">{event.id}</span>
          <span className="event-row__type">{typeLabel}</span>
          <span className="event-row__tool">{event.tool_name}</span>
          <span className={statusClass}>
            <span className="status-dot" />
            {statusText}
          </span>
          <span className={"event-row__chevron" + (expanded ? " is-open" : "")} aria-hidden="true">
            ›
          </span>
        </div>
        {expanded && <pre className="event-row__detail">{renderDetail(event)}</pre>}
      </div>
    </div>
  );
}

function renderDetail(event: NormalizedEvent): string {
  if (event.type === "tool_call") {
    return JSON.stringify(event.args, null, 2);
  }
  const lines = [`status: ${event.status}`];
  if (event.error) lines.push(`error: ${event.error}`);
  if (event.call_id) lines.push(`call_id: ${event.call_id}`);
  return lines.join("\n");
}

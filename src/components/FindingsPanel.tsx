import type { NormalizedTrace } from "../lib/normalize";
import type { Finding } from "../lib/findings";
import { type Selection, findingsCitingEvent } from "../lib/selection";
import { FindingCard } from "./FindingCard";
import { EmptyFindings } from "./EmptyFindings";

/**
 * The right panel: a detector summary, then finding cards. When an EVENT is
 * selected, a small banner names which findings cite it (the event→findings
 * direction of the bidirectional link). (spec.md > Components: FindingsPanel)
 */
export function FindingsPanel({
  trace,
  findings,
  selection,
  onSelectFinding,
  onGoToEvent,
}: {
  trace: NormalizedTrace;
  findings: Finding[];
  selection: Selection;
  onSelectFinding: (id: number) => void;
  onGoToEvent: (index: number) => void;
}) {
  const loops = findings.filter((f) => f.detector === "repeated_calls").length;
  const errors = findings.filter((f) => f.detector === "tool_error").length;

  // When an event is selected, surface the findings that reference it.
  const citing =
    selection.kind === "event"
      ? findingsCitingEvent(selection.index, findings)
      : [];

  return (
    <div className="findings">
      <h2 className="panel__heading">Findings</h2>

      <div className="findings__summary">
        {findings.length === 0 ? (
          <span>No findings</span>
        ) : (
          <>
            <span className="summary-chip summary-chip--loop">{loops} possible loop{loops === 1 ? "" : "s"}</span>
            <span className="summary-chip summary-chip--error">{errors} confirmed error{errors === 1 ? "" : "s"}</span>
          </>
        )}
      </div>

      {selection.kind === "event" && (
        <div className="event-link-note">
          {citing.length > 0
            ? `Selected event is cited by ${citing.length} finding${citing.length === 1 ? "" : "s"} (highlighted below).`
            : "Selected event is not cited by any finding."}
        </div>
      )}

      {findings.length === 0 ? (
        <EmptyFindings trace={trace} />
      ) : (
        <div className="findings__list">
          {findings.map((finding, id) => {
            const selectedByFinding =
              selection.kind === "finding" && selection.findingId === id;
            const selectedByEvent =
              selection.kind === "event" && citing.includes(finding);
            return (
              <FindingCard
                key={id}
                finding={finding}
                trace={trace}
                selected={selectedByFinding || selectedByEvent}
                onSelect={() => onSelectFinding(id)}
                onGoToEvent={onGoToEvent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

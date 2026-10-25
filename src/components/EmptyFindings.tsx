import type { NormalizedTrace } from "../lib/normalize";

/**
 * Shown when the current trace produces no findings (the Clean Run case). This
 * is a deliberate result, not an error or a loading state. It states what was
 * analyzed and is explicit that "no issues" means the implemented rules found
 * none — NOT that the trace is guaranteed correct. We never fabricate a finding
 * to fill the panel. (prd.md > States and Boundaries)
 */
export function EmptyFindings({ trace }: { trace: NormalizedTrace }) {
  return (
    <div className="empty-findings">
      <p className="empty-findings__headline">No issues detected by the current detectors.</p>
      <p className="empty-findings__stats">
        Analyzed {trace.events.length} event{trace.events.length === 1 ? "" : "s"}
        {" across "}
        {trace.toolCount} distinct tool{trace.toolCount === 1 ? "" : "s"}.
      </p>
      <p className="empty-findings__caveat">
        This means the implemented rules (repeated tool calls and explicit tool
        errors) found nothing — not that the run is guaranteed to be correct.
      </p>
    </div>
  );
}

import type { Finding } from "./findings";

/**
 * Selection state for the workspace. At most ONE of these is set at a time —
 * that invariant is what prevents misleading stale selections (prd.md >
 * States and Boundaries). We model it as a discriminated union rather than two
 * independent nullable fields, so "a finding and an event both selected" is
 * simply unrepresentable.
 */
export type Selection =
  | { kind: "none" }
  | { kind: "finding"; findingId: number }
  | { kind: "event"; index: number };

export const NO_SELECTION: Selection = { kind: "none" };

/** Clicking a finding: select it, clearing any event selection by construction. */
export function selectFinding(findingId: number): Selection {
  return { kind: "finding", findingId };
}

/** Clicking an event: select it, clearing any finding selection by construction. */
export function selectEvent(index: number): Selection {
  return { kind: "event", index };
}

/**
 * The set of event indices that should be highlighted for the current
 * selection. Highlight is derived from selection, never stored separately, so
 * it can never drift out of sync.
 */
export function highlightedIndices(
  selection: Selection,
  findings: Finding[],
): Set<number> {
  if (selection.kind === "finding") {
    const f = findings[selection.findingId];
    return new Set(f ? f.eventIndices : []);
  }
  if (selection.kind === "event") {
    return new Set([selection.index]);
  }
  return new Set();
}

/** Findings that cite a given event index — used when an event is selected. */
export function findingsCitingEvent(
  index: number,
  findings: Finding[],
): Finding[] {
  return findings.filter((f) => f.eventIndices.includes(index));
}

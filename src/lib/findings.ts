/**
 * A Finding is what a detector emits: a single evidence-backed observation.
 *
 * The four parts are kept as distinct fields so the UI can render them visually
 * separated and never let an interpretation read as a fact
 * (prd.md > Finding cards):
 *   - `fact`        — what was observed, stated plainly.
 *   - `rule`        — the deterministic rule that matched (the "why this fired").
 *   - `explanation` — the interpretation, framed by `certainty`.
 *   - `fix`         — a practical suggested corrective action.
 *
 * `certainty` distinguishes a confirmed fact-from-the-trace (an error the trace
 * reported) from a "possible" inference (a repeated call MIGHT be a loop).
 *
 * `eventIndices` are the internal array indices of the supporting events — the
 * reliable positional join key. The UI shows the original ids but highlights by
 * index.
 */
export type Detector = "repeated_calls" | "tool_error";
export type Certainty = "possible" | "confirmed";

export interface Finding {
  detector: Detector;
  certainty: Certainty;
  title: string;
  fact: string;
  rule: string;
  explanation: string;
  fix: string;
  eventIndices: number[];
}

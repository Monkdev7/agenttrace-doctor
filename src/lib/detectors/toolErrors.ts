import type { NormalizedTrace } from "../normalize";
import type { Finding } from "../findings";

/**
 * Detector 2 — Explicit tool errors (confirmed).
 *
 * Rule (spec.md > Algorithms): for every tool_result with status "error", emit
 * a finding. Unlike Detector 1, this reports a CONFIRMED fact — the trace
 * itself says the tool failed — so certainty is "confirmed". We report the
 * error the trace stated and never invent a deeper root cause.
 *
 * Evidence linking: if the result's call_id resolves to a known call (its
 * `linkedCallIndex` was set during normalization), we cite BOTH the result and
 * the originating call, so the evidence shows WHAT was being attempted. If it
 * doesn't resolve, we still emit the finding citing the result alone — analysis
 * never crashes on an unmatched call_id.
 */
export function detectToolErrors(trace: NormalizedTrace): Finding[] {
  const findings: Finding[] = [];

  for (const event of trace.events) {
    if (event.type !== "tool_result" || event.status !== "error") continue;

    const indices = [event.index];
    if (event.linkedCallIndex !== undefined) {
      indices.push(event.linkedCallIndex);
    }

    const message = event.error ?? "(no error message was included in the trace)";
    const tool = event.tool_name;

    findings.push({
      detector: "tool_error",
      certainty: "confirmed",
      title: `Tool error: ${tool}`,
      fact: `The "${tool}" tool reported an error: ${message}`,
      rule: 'A tool_result with status "error" is a failure the trace reported directly.',
      explanation:
        "This error is confirmed by the trace itself. The trace does not say WHY the tool failed, so any deeper root cause is not established here, only that this call failed.",
      fix: "Inspect the failing tool's inputs and the error message, add handling or a retry/fallback for this failure, and confirm the tool's preconditions were met.",
      eventIndices: indices,
    });
  }

  return findings;
}

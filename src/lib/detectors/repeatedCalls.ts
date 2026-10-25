import type { NormalizedTrace, NormalizedEvent } from "../normalize";
import type { Finding } from "../findings";

const MIN_RUN = 3;

/**
 * Detector 1 — Repeated tool calls (possible loop).
 *
 * Resolved rule (prd.md > Resolved Decisions; spec.md > Algorithms):
 *   - Consider tool_call events in execution order.
 *   - tool_result events are NOT part of the sequence and do NOT break a run.
 *   - Extend a run only when BOTH tool_name AND the precomputed argsKey match.
 *   - A different tool_name OR different args ends the run.
 *   - Emit a finding only for a run of >= 3 matching calls (2 emits nothing).
 *   - Two separate qualifying runs (split by a different call) => two findings.
 *
 * We reuse `argsKey` computed during normalization, so this detector never
 * re-stringifies or re-normalizes anything.
 */
export function detectRepeatedCalls(trace: NormalizedTrace): Finding[] {
  // Only the calls, in order. Filtering out results here is exactly what makes
  // interleaved result events unable to break a run.
  const calls = trace.events.filter(
    (e): e is NormalizedEvent & { type: "tool_call" } => e.type === "tool_call",
  );

  const findings: Finding[] = [];
  let run: typeof calls = [];
  let runKey: string | null = null; // tool_name + argsKey identity of the run

  const flush = () => {
    if (run.length >= MIN_RUN) findings.push(makeFinding(run));
  };

  for (const call of calls) {
    const key = call.tool_name + "\u0000" + (call.argsKey ?? "");
    if (runKey !== null && key === runKey) {
      run.push(call); // extend
    } else {
      flush(); // close the previous run (emits only if it qualified)
      run = [call]; // reset on different tool OR different args
      runKey = key;
    }
  }
  flush(); // close the trailing run

  return findings;
}

function makeFinding(run: { index: number; tool_name: string }[]): Finding {
  const tool = run[0].tool_name;
  const n = run.length;
  const indices = run.map((c) => c.index);
  return {
    detector: "repeated_calls",
    certainty: "possible",
    title: `Repeated tool calls: ${tool}`,
    fact: `The "${tool}" tool was called ${n} times in a row with identical arguments.`,
    rule: `A tool called ${MIN_RUN}+ times consecutively with exactly identical arguments (ignoring interleaved results) is flagged as a possible loop.`,
    explanation:
      "This is a possible loop — the agent may be repeating the same action without making progress. Identical repeated calls are worth investigating, but do not by themselves prove a bug.",
    fix: "Add a guard that stops repeating an unchanged call, vary the arguments, or check why the earlier results did not advance the agent's plan.",
    eventIndices: indices,
  };
}

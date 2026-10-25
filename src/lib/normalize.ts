import type { Trace, TraceEvent } from "./schema";

/**
 * Recursive stable JSON serialization.
 *
 * Two argument objects that differ only in key ORDER must compare as identical
 * ({a:1,b:2} === {b:2,a:1}), because key order is not semantically meaningful.
 * Array order IS meaningful, so arrays are preserved as-is. We intentionally do
 * NOT strip or simplify any values (timestamps, nonces all count) — exact
 * normalized equality is the agreed rule for the MVP (spec.md > Algorithms).
 *
 * Implementation: walk the value; for objects, sort keys and recurse; for
 * arrays, keep order and recurse each element; for primitives, JSON-encode.
 * The result is a canonical string; equal strings ⇒ identical args.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => stableStringify(item)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map(
    (key) => JSON.stringify(key) + ":" + stableStringify(obj[key]),
  );
  return "{" + parts.join(",") + "}";
}

/**
 * A normalized event is the original event plus:
 * - `index`: its position in the array. This is the RELIABLE positional join
 *   key used for selection/evidence; the original `id` is still kept and shown.
 * - `argsKey`: the stable-stringified args (tool_call only), used by Detector 1.
 * - `linkedCallIndex`: for a tool_result, the index of the tool_call its
 *   `call_id` points at — or undefined when it doesn't resolve (we never crash).
 */
export type NormalizedEvent = TraceEvent & {
  index: number;
  argsKey?: string;
  linkedCallIndex?: number;
};

export interface NormalizedTrace {
  events: NormalizedEvent[];
  toolCount: number;
  source: string;
}

/**
 * Build the normalized model the detectors and UI run on. Pure function:
 * takes a validated Trace, returns a NormalizedTrace. No React, no I/O.
 */
export function normalizeTrace(trace: Trace, source: string): NormalizedTrace {
  // First pass: map each call's original id → its array index, so results can
  // resolve their call_id to a positional index in the second pass.
  const callIdToIndex = new Map<string, number>();
  trace.events.forEach((event, index) => {
    if (event.type === "tool_call") {
      callIdToIndex.set(event.id, index);
    }
  });

  const toolNames = new Set<string>();

  const events: NormalizedEvent[] = trace.events.map((event, index) => {
    toolNames.add(event.tool_name);

    if (event.type === "tool_call") {
      return { ...event, index, argsKey: stableStringify(event.args) };
    }

    // tool_result: resolve call_id to an index if the referenced call exists.
    const linkedCallIndex =
      event.call_id !== undefined ? callIdToIndex.get(event.call_id) : undefined;
    return { ...event, index, linkedCallIndex };
  });

  return { events, toolCount: toolNames.size, source };
}

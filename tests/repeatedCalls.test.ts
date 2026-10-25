import { describe, it, expect } from "vitest";
import { detectRepeatedCalls } from "../src/lib/detectors/repeatedCalls";
import { normalizeTrace } from "../src/lib/normalize";
import type { Trace, TraceEvent } from "../src/lib/schema";

// Helpers to build traces concisely.
let n = 0;
const call = (tool: string, args: Record<string, unknown>): TraceEvent => ({
  id: `c${n++}`,
  type: "tool_call",
  tool_name: tool,
  args,
});
const result = (tool: string): TraceEvent => ({
  id: `r${n++}`,
  type: "tool_result",
  tool_name: tool,
  status: "ok",
});
const run = (events: TraceEvent[]) => {
  const trace: Trace = { events };
  return detectRepeatedCalls(normalizeTrace(trace, "test"));
};

describe("detectRepeatedCalls", () => {
  it("two identical calls produce no finding", () => {
    const f = run([call("search", { q: "x" }), call("search", { q: "x" })]);
    expect(f).toHaveLength(0);
  });

  it("three identical calls produce one finding", () => {
    const f = run([
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].detector).toBe("repeated_calls");
    expect(f[0].certainty).toBe("possible");
  });

  it("four identical calls produce one finding citing all four", () => {
    const f = run([
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].eventIndices).toHaveLength(4);
  });

  it("interleaved result events do not break a run", () => {
    const f = run([
      call("search", { q: "x" }),
      result("search"),
      call("search", { q: "x" }),
      result("search"),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(1);
    // Cites the three CALL indices (0, 2, 4), not the interleaved results.
    expect(f[0].eventIndices).toEqual([0, 2, 4]);
  });

  it("different arguments break a run", () => {
    const f = run([
      call("search", { q: "x" }),
      call("search", { q: "y" }),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(0);
  });

  it("a different tool call breaks a run", () => {
    const f = run([
      call("search", { q: "x" }),
      call("fetch", { q: "x" }),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(0);
  });

  it("two qualifying runs separated by a different tool produce two findings", () => {
    const f = run([
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("fetch", { q: "z" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(2);
    expect(f[0].eventIndices).toEqual([0, 1, 2]);
    expect(f[1].eventIndices).toEqual([4, 5, 6]);
  });

  it("matches calls whose args differ only in key order", () => {
    const f = run([
      call("search", { a: 1, b: 2 }),
      call("search", { b: 2, a: 1 }),
      call("search", { a: 1, b: 2 }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].eventIndices).toEqual([0, 1, 2]);
  });

  it("cites the correct original event indices", () => {
    // A non-matching lead call at index 0 shifts the qualifying run to 1,2,3.
    const f = run([
      call("fetch", { u: "a" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
      call("search", { q: "x" }),
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].eventIndices).toEqual([1, 2, 3]);
  });
});

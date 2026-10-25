import { describe, it, expect } from "vitest";
import { detectToolErrors } from "../src/lib/detectors/toolErrors";
import { runDetectors } from "../src/lib/detectors";
import { normalizeTrace } from "../src/lib/normalize";
import type { Trace } from "../src/lib/schema";

const detect = (events: Trace["events"]) =>
  detectToolErrors(normalizeTrace({ events }, "test"));

describe("detectToolErrors", () => {
  it("emits a finding for an explicit tool error", () => {
    const f = detect([
      { id: "c1", type: "tool_call", tool_name: "fetch", args: { u: "x" } },
      { id: "r1", type: "tool_result", tool_name: "fetch", status: "error", error: "HTTP 500", call_id: "c1" },
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].detector).toBe("tool_error");
    expect(f[0].certainty).toBe("confirmed");
  });

  it("emits no finding for a successful result", () => {
    const f = detect([
      { id: "c1", type: "tool_call", tool_name: "fetch", args: {} },
      { id: "r1", type: "tool_result", tool_name: "fetch", status: "ok", call_id: "c1" },
    ]);
    expect(f).toHaveLength(0);
  });

  it("emits separate findings for multiple error results", () => {
    const f = detect([
      { id: "r1", type: "tool_result", tool_name: "a", status: "error", error: "boom1" },
      { id: "r2", type: "tool_result", tool_name: "b", status: "error", error: "boom2" },
    ]);
    expect(f).toHaveLength(2);
  });

  it("cites the linked call index when call_id resolves", () => {
    const f = detect([
      { id: "c1", type: "tool_call", tool_name: "fetch", args: {} },
      { id: "r1", type: "tool_result", tool_name: "fetch", status: "error", error: "x", call_id: "c1" },
    ]);
    // result is index 1, linked call is index 0.
    expect(f[0].eventIndices).toContain(1);
    expect(f[0].eventIndices).toContain(0);
  });

  it("does not crash and still emits when call_id is unresolved", () => {
    const f = detect([
      { id: "r1", type: "tool_result", tool_name: "fetch", status: "error", error: "x", call_id: "ghost" },
    ]);
    expect(f).toHaveLength(1);
    // Only the result event (index 0) is cited; no phantom index added.
    expect(f[0].eventIndices).toEqual([0]);
  });

  it("does not crash and still emits when call_id is absent", () => {
    const f = detect([
      { id: "r1", type: "tool_result", tool_name: "fetch", status: "error", error: "x" },
    ]);
    expect(f).toHaveLength(1);
    expect(f[0].eventIndices).toEqual([0]);
  });

  it("preserves the actual error message in the fact", () => {
    const f = detect([
      { id: "r1", type: "tool_result", tool_name: "db", status: "error", error: "connection refused" },
    ]);
    expect(f[0].fact).toContain("connection refused");
  });

  it("distinguishes an observed error from an unconfirmed root cause", () => {
    const f = detect([
      { id: "r1", type: "tool_result", tool_name: "db", status: "error", error: "boom" },
    ]);
    // Fact asserts the confirmed error; explanation disclaims a deeper cause.
    expect(f[0].certainty).toBe("confirmed");
    expect(f[0].explanation.toLowerCase()).toMatch(/root cause is not established|does not say why/);
  });

  it("runDetectors returns both repeated-call and error findings together", () => {
    const f = runDetectors(
      normalizeTrace(
        {
          events: [
            { id: "1", type: "tool_call", tool_name: "s", args: { q: "x" } },
            { id: "2", type: "tool_call", tool_name: "s", args: { q: "x" } },
            { id: "3", type: "tool_call", tool_name: "s", args: { q: "x" } },
            { id: "4", type: "tool_result", tool_name: "s", status: "error", error: "boom", call_id: "3" },
          ],
        },
        "test",
      ),
    );
    expect(f.some((x) => x.detector === "repeated_calls")).toBe(true);
    expect(f.some((x) => x.detector === "tool_error")).toBe(true);
  });
});

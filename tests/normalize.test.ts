import { describe, it, expect } from "vitest";
import { normalizeTrace, stableStringify } from "../src/lib/normalize";
import type { Trace } from "../src/lib/schema";

describe("stableStringify", () => {
  it("is independent of object key order", () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });

  it("is sensitive to array order", () => {
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });

  it("preserves all values, including timestamps/nonces", () => {
    const a = stableStringify({ q: "x", ts: 1000, nonce: "abc" });
    const b = stableStringify({ q: "x", ts: 1001, nonce: "abc" });
    // Differing timestamp must produce a DIFFERENT key — nothing is stripped.
    expect(a).not.toBe(b);
  });

  it("sorts nested object keys recursively", () => {
    expect(stableStringify({ outer: { a: 1, b: 2 } })).toBe(
      stableStringify({ outer: { b: 2, a: 1 } }),
    );
  });
});

describe("normalizeTrace", () => {
  it("assigns array indices while keeping original ids", () => {
    const trace: Trace = {
      events: [
        { id: "x1", type: "tool_call", tool_name: "s", args: {} },
        { id: "x2", type: "tool_result", tool_name: "s", status: "ok", call_id: "x1" },
      ],
    };
    const n = normalizeTrace(trace, "test");
    expect(n.events[0].index).toBe(0);
    expect(n.events[0].id).toBe("x1");
    expect(n.events[1].index).toBe(1);
  });

  it("links a tool_result to its originating call via call_id", () => {
    const trace: Trace = {
      events: [
        { id: "c1", type: "tool_call", tool_name: "s", args: {} },
        { id: "r1", type: "tool_result", tool_name: "s", status: "ok", call_id: "c1" },
      ],
    };
    const n = normalizeTrace(trace, "test");
    expect(n.events[1].type === "tool_result" && n.events[1].linkedCallIndex).toBe(0);
  });

  it("does not crash and leaves linkedCallIndex undefined for an unresolved call_id", () => {
    const trace: Trace = {
      events: [
        { id: "r1", type: "tool_result", tool_name: "s", status: "error", error: "boom", call_id: "missing" },
      ],
    };
    const n = normalizeTrace(trace, "test");
    expect(n.events[0].linkedCallIndex).toBeUndefined();
  });

  it("counts distinct tools", () => {
    const trace: Trace = {
      events: [
        { id: "1", type: "tool_call", tool_name: "search", args: {} },
        { id: "2", type: "tool_call", tool_name: "fetch", args: {} },
        { id: "3", type: "tool_call", tool_name: "search", args: {} },
      ],
    };
    expect(normalizeTrace(trace, "test").toolCount).toBe(2);
  });
});

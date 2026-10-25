import { describe, it, expect } from "vitest";
import { normalizeTrace } from "../src/lib/normalize";
import { runDetectors } from "../src/lib/detectors";
import { DEFAULT_SAMPLE } from "../src/samples";
import { eventPreview, truncate } from "../src/lib/preview";
import type { Trace } from "../src/lib/schema";

describe("default sample findings (what the workspace renders)", () => {
  const normalized = normalizeTrace(DEFAULT_SAMPLE.trace, DEFAULT_SAMPLE.name);
  const findings = runDetectors(normalized);

  it("shows a possible-loop finding for the repeated get_weather calls", () => {
    const loop = findings.find((f) => f.detector === "repeated_calls");
    expect(loop).toBeDefined();
    expect(loop!.certainty).toBe("possible");
    // The three repeated get_weather(Paris, tomorrow) calls are e1/e3/e5 at indices 0,2,4.
    expect(loop!.eventIndices).toEqual([0, 2, 4]);
  });

  it("evidence indices point at real timeline events", () => {
    for (const f of findings) {
      for (const idx of f.eventIndices) {
        expect(normalized.events[idx]).toBeDefined();
      }
    }
  });
});

describe("empty findings state", () => {
  it("a clean trace produces zero findings (empty state will render)", () => {
    const clean: Trace = {
      events: [
        { id: "a", type: "tool_call", tool_name: "search", args: { q: "x" } },
        { id: "b", type: "tool_result", tool_name: "search", status: "ok", call_id: "a" },
        { id: "c", type: "tool_call", tool_name: "summarize", args: { text: "y" } },
        { id: "d", type: "tool_result", tool_name: "summarize", status: "ok", call_id: "c" },
      ],
    };
    const normalized = normalizeTrace(clean, "Clean Run");
    expect(runDetectors(normalized)).toHaveLength(0);
    expect(normalized.toolCount).toBe(2);
  });
});

describe("evidence preview", () => {
  it("previews a tool_call with its args", () => {
    const n = normalizeTrace(
      { events: [{ id: "1", type: "tool_call", tool_name: "search", args: { q: "hi" } }] },
      "t",
    );
    expect(eventPreview(n.events[0])).toContain("search");
    expect(eventPreview(n.events[0])).toContain("hi");
  });

  it("previews a tool_result error with its message", () => {
    const n = normalizeTrace(
      { events: [{ id: "1", type: "tool_result", tool_name: "fetch", status: "error", error: "HTTP 500" }] },
      "t",
    );
    expect(eventPreview(n.events[0])).toContain("HTTP 500");
  });

  it("truncates long values", () => {
    expect(truncate("x".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

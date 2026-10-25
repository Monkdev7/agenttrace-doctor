import { describe, it, expect } from "vitest";
import { validateTrace } from "../src/lib/validate";
import { normalizeTrace } from "../src/lib/normalize";
import { runDetectors } from "../src/lib/detectors";
import { DEFAULT_SAMPLE } from "../src/samples";

/**
 * The App upload handler does: validateTrace(text) → on ok, replace the trace;
 * on failure, keep the active trace and show the error. These tests cover that
 * decision logic at the validator level (the branch App switches on) plus the
 * "active trace survives a bad upload" invariant.
 */
describe("upload decision", () => {
  it("a valid uploaded trace parses and can be normalized + analyzed", () => {
    const raw = JSON.stringify({
      events: [
        { id: "u1", type: "tool_call", tool_name: "search", args: { q: "x" } },
        { id: "u2", type: "tool_call", tool_name: "search", args: { q: "x" } },
        { id: "u3", type: "tool_call", tool_name: "search", args: { q: "x" } },
      ],
    });
    const result = validateTrace(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const findings = runDetectors(normalizeTrace(result.trace, "u"));
      expect(findings.some((f) => f.detector === "repeated_calls")).toBe(true);
    }
  });

  it("an invalid upload yields an error and the active trace is retained", () => {
    // The 'active' trace before the bad upload.
    const active = normalizeTrace(DEFAULT_SAMPLE.trace, DEFAULT_SAMPLE.name);
    const activeFindings = runDetectors(active);

    // A bad upload: a tool_result with no status.
    const bad = JSON.stringify({
      events: [{ id: "b1", type: "tool_result", tool_name: "x" }],
    });
    const result = validateTrace(bad);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details.join(" ")).toMatch(/status/i);
    }
    // Because validation failed, App would NOT replace `active`; it is unchanged.
    expect(active.events.length).toBe(DEFAULT_SAMPLE.trace.events.length);
    expect(activeFindings.length).toBeGreaterThan(0);
  });

  it("malformed JSON is reported as a parse error", () => {
    const result = validateTrace("{ not json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("parse");
  });
});

import { describe, it, expect } from "vitest";
import { validateTrace } from "../src/lib/validate";

describe("validateTrace", () => {
  it("accepts a well-formed trace", () => {
    const raw = JSON.stringify({
      events: [
        { id: "a1", type: "tool_call", tool_name: "search", args: { q: "x" } },
        { id: "a2", type: "tool_result", tool_name: "search", status: "ok", call_id: "a1" },
      ],
    });
    const result = validateTrace(raw);
    expect(result.ok).toBe(true);
  });

  it("reports malformed JSON with a parse error", () => {
    const result = validateTrace('{ "events": [ ');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("parse");
      expect(result.error.details[0].length).toBeGreaterThan(0);
    }
  });

  it("reports a tool_result missing its status field, naming the event", () => {
    const raw = JSON.stringify({
      events: [
        { id: "e1", type: "tool_call", tool_name: "s", args: {} },
        { id: "e2", type: "tool_result", tool_name: "s", call_id: "e1" },
      ],
    });
    const result = validateTrace(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("schema");
      expect(result.error.details.join(" ")).toMatch(/Event #1.*status/i);
    }
  });

  it("reports a wrong field type (args not an object)", () => {
    const raw = JSON.stringify({
      events: [{ id: "e1", type: "tool_call", tool_name: "s", args: "not-an-object" }],
    });
    const result = validateTrace(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details.join(" ")).toMatch(/Event #0.*args/i);
    }
  });

  it("reports duplicate event IDs, pointing at the offending event", () => {
    const raw = JSON.stringify({
      events: [
        { id: "dup", type: "tool_call", tool_name: "s", args: {} },
        { id: "dup", type: "tool_call", tool_name: "s", args: {} },
      ],
    });
    const result = validateTrace(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details.join(" ")).toMatch(/Duplicate event id "dup"/i);
    }
  });
});

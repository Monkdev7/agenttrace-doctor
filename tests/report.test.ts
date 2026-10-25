import { describe, it, expect } from "vitest";
import {
  generateReport,
  reportFilename,
  sanitizeSource,
  formatTimestamp,
  escapeMd,
} from "../src/lib/report";
import { normalizeTrace } from "../src/lib/normalize";
import { runDetectors } from "../src/lib/detectors";
import type { Trace } from "../src/lib/schema";

const fixed = new Date(2026, 9, 24, 9, 5, 3); // 2026-10-24 09:05:03 local

describe("report filename", () => {
  it("follows agenttrace-report-<source>-<timestamp>.md", () => {
    expect(reportFilename("Repeated Tool Calls", fixed)).toBe(
      "agenttrace-report-repeated-tool-calls-20261024-090503.md",
    );
  });

  it("sanitizes an unsafe source name", () => {
    expect(sanitizeSource("My Trace!! (v2).json")).toBe("my-trace-v2-json");
  });

  it("falls back to 'trace' for an empty source", () => {
    expect(sanitizeSource("   ")).toBe("trace");
  });

  it("formats a stable timestamp", () => {
    expect(formatTimestamp(fixed)).toBe("20261024-090503");
  });
});

describe("escapeMd", () => {
  it("neutralizes markdown control characters", () => {
    // The '#' is backslash-escaped so it can't act as a heading marker.
    expect(escapeMd("# heading")).toBe("\\# heading");
    expect(escapeMd("a|b")).toBe("a\\|b");
  });

  it("flattens newlines so content cannot break structure", () => {
    expect(escapeMd("line1\nline2")).toBe("line1 line2");
  });
});

describe("generateReport", () => {
  const withFindings = normalizeTrace(
    {
      events: [
        { id: "x1", type: "tool_call", tool_name: "search", args: { q: "a" } },
        { id: "x2", type: "tool_call", tool_name: "search", args: { q: "a" } },
        { id: "x3", type: "tool_call", tool_name: "search", args: { q: "a" } },
        { id: "x4", type: "tool_result", tool_name: "db", status: "error", error: "boom" },
      ],
    },
    "demo",
  );

  it("includes header, counts, detector summary, and limitations", () => {
    const md = generateReport(withFindings, runDetectors(withFindings), fixed);
    expect(md).toContain("# AgentTrace Doctor report");
    expect(md).toContain("Events analyzed: 4");
    expect(md).toContain("## Detector summary");
    expect(md).toContain("## Limitations");
    expect(md).toContain("does not prove the run is correct");
  });

  it("includes only cited events as evidence, not the whole trace", () => {
    const md = generateReport(withFindings, runDetectors(withFindings), fixed);
    // The loop cites x1,x2,x3; the error cites x4. All four happen to be cited
    // here, but the result event x4's ok sibling style is not dumped as raw trace.
    expect(md).toContain("`x1`");
    expect(md).toContain("`x4`");
    // No raw JSON array of the full trace.
    expect(md).not.toContain('"events"');
  });

  it("escapes trace-derived content so it cannot corrupt structure", () => {
    const trace: Trace = {
      events: [
        { id: "r1", type: "tool_result", tool_name: "# not a heading", status: "error", error: "pipe | and *stars*" },
      ],
    };
    const n = normalizeTrace(trace, "t");
    const md = generateReport(n, runDetectors(n), fixed);
    // The dangerous tool name must be escaped, not left as a literal heading.
    expect(md).toContain("\\# not a heading");
    expect(md).toContain("pipe \\| and \\*stars\\*");
  });

  it("states no issues for a clean trace", () => {
    const clean = normalizeTrace(
      {
        events: [
          { id: "a", type: "tool_call", tool_name: "s", args: {} },
          { id: "b", type: "tool_result", tool_name: "s", status: "ok", call_id: "a" },
        ],
      },
      "clean",
    );
    const md = generateReport(clean, runDetectors(clean), fixed);
    expect(md).toContain("No issues were detected");
  });
});

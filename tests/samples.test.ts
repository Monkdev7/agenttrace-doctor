import { describe, it, expect } from "vitest";
import { SAMPLES, DEFAULT_SAMPLE } from "../src/samples";
import { normalizeTrace } from "../src/lib/normalize";
import { runDetectors } from "../src/lib/detectors";

describe("bundled samples", () => {
  it("provides exactly the three approved samples", () => {
    expect(SAMPLES.map((s) => s.name)).toEqual([
      "Repeated Tool Calls",
      "Tool Failure",
      "Clean Run",
    ]);
  });

  it("defaults to Repeated Tool Calls", () => {
    expect(DEFAULT_SAMPLE.name).toBe("Repeated Tool Calls");
  });

  it("Repeated Tool Calls produces a possible-loop finding", () => {
    const f = runDetectors(normalizeTrace(SAMPLES[0].trace, SAMPLES[0].name));
    expect(f.some((x) => x.detector === "repeated_calls")).toBe(true);
  });

  it("Tool Failure produces a confirmed-error finding", () => {
    const f = runDetectors(normalizeTrace(SAMPLES[1].trace, SAMPLES[1].name));
    expect(f.some((x) => x.detector === "tool_error" && x.certainty === "confirmed")).toBe(true);
  });

  it("Clean Run produces no findings", () => {
    const f = runDetectors(normalizeTrace(SAMPLES[2].trace, SAMPLES[2].name));
    expect(f).toHaveLength(0);
  });
});

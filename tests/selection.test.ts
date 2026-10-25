import { describe, it, expect } from "vitest";
import {
  NO_SELECTION,
  selectFinding,
  selectEvent,
  highlightedIndices,
  findingsCitingEvent,
} from "../src/lib/selection";
import type { Finding } from "../src/lib/findings";

const findings: Finding[] = [
  {
    detector: "repeated_calls",
    certainty: "possible",
    title: "loop",
    fact: "f",
    rule: "r",
    explanation: "e",
    fix: "x",
    eventIndices: [0, 2, 4],
  },
  {
    detector: "tool_error",
    certainty: "confirmed",
    title: "err",
    fact: "f",
    rule: "r",
    explanation: "e",
    fix: "x",
    eventIndices: [5, 4],
  },
];

describe("selection", () => {
  it("selecting a finding clears any event selection (union cannot hold both)", () => {
    const afterEvent = selectEvent(3);
    expect(afterEvent.kind).toBe("event");
    const afterFinding = selectFinding(0);
    // The new selection is a finding; there is no residual event field at all.
    expect(afterFinding.kind).toBe("finding");
    expect("index" in afterFinding).toBe(false);
  });

  it("selecting an event clears any finding selection", () => {
    const afterFinding = selectFinding(1);
    expect(afterFinding.kind).toBe("finding");
    const afterEvent = selectEvent(7);
    expect(afterEvent.kind).toBe("event");
    expect("findingId" in afterEvent).toBe(false);
  });

  it("highlights a finding's supporting events when a finding is selected", () => {
    const h = highlightedIndices(selectFinding(0), findings);
    expect([...h].sort((a, b) => a - b)).toEqual([0, 2, 4]);
  });

  it("highlights only the selected event when an event is selected", () => {
    const h = highlightedIndices(selectEvent(5), findings);
    expect([...h]).toEqual([5]);
  });

  it("highlights nothing with no selection", () => {
    expect(highlightedIndices(NO_SELECTION, findings).size).toBe(0);
  });

  it("finds all findings citing a given event index", () => {
    // Index 4 is cited by BOTH findings.
    expect(findingsCitingEvent(4, findings)).toHaveLength(2);
    // Index 2 only by the first.
    expect(findingsCitingEvent(2, findings)).toHaveLength(1);
    // Index 99 by none.
    expect(findingsCitingEvent(99, findings)).toHaveLength(0);
  });
});

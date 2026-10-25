import { describe, it, expect } from "vitest";
import { traceSchema } from "../src/lib/schema";
import { repeatedToolCallsSample } from "../src/samples/repeated-tool-calls";

/**
 * Slice 1 smoke test: confirms Vitest runs and that the bundled sample is a
 * valid trace under the Zod schema (so the timeline is rendering real, typed
 * data). Real validation/normalization/detector tests arrive in slices 2-4.
 */
describe("trace schema", () => {
  it("accepts the bundled repeated-tool-calls sample", () => {
    const result = traceSchema.safeParse(repeatedToolCallsSample);
    expect(result.success).toBe(true);
  });
});

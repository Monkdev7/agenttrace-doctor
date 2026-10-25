import { describe, it, expect } from "vitest";
import { traceSchema } from "../src/lib/schema";
import { DEFAULT_SAMPLE } from "../src/samples";

/**
 * Smoke test: confirms Vitest runs and that the default bundled sample is a
 * valid trace under the Zod schema (so the timeline renders real, typed data).
 */
describe("trace schema", () => {
  it("accepts the default bundled sample", () => {
    const result = traceSchema.safeParse(DEFAULT_SAMPLE.trace);
    expect(result.success).toBe(true);
  });
});

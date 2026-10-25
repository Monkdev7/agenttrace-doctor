import { traceSchema, type Trace } from "../lib/schema";
import repeatedRaw from "./repeated-tool-calls.json";
import failureRaw from "./tool-failure.json";
import cleanRaw from "./clean-run.json";

/**
 * The three bundled samples. Each raw JSON is parsed through the schema at
 * module load, so a malformed sample is caught immediately (by tests and at
 * startup) rather than rendering broken. The default is the first entry.
 */
export interface Sample {
  id: string;
  name: string;
  trace: Trace;
}

function load(name: string, raw: unknown): Trace {
  const result = traceSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Bundled sample "${name}" is invalid: ${result.error.message}`);
  }
  return result.data;
}

export const SAMPLES: Sample[] = [
  { id: "repeated", name: "Repeated Tool Calls", trace: load("Repeated Tool Calls", repeatedRaw) },
  { id: "failure", name: "Tool Failure", trace: load("Tool Failure", failureRaw) },
  { id: "clean", name: "Clean Run", trace: load("Clean Run", cleanRaw) },
];

export const DEFAULT_SAMPLE = SAMPLES[0];

import type { NormalizedTrace } from "../normalize";
import type { Finding } from "../findings";
import { detectRepeatedCalls } from "./repeatedCalls";
import { detectToolErrors } from "./toolErrors";

/**
 * Run all mandatory detectors over the normalized model and return every
 * finding. This is the single entry point the UI (slice 5) calls; adding the
 * stretch Detector 3 later means adding one line here, nothing else.
 */
export function runDetectors(trace: NormalizedTrace): Finding[] {
  return [...detectRepeatedCalls(trace), ...detectToolErrors(trace)];
}

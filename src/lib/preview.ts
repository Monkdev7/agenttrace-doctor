import type { NormalizedEvent } from "./normalize";

const MAX = 80;

/** Truncate a string for a compact inline preview, with an ellipsis. */
export function truncate(text: string, max = MAX): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/**
 * A one-line evidence preview for a cited event, so a finding card is readable
 * without jumping to the timeline (prd.md > Finding cards):
 *   - tool_call  → tool name + compact args
 *   - tool_result→ ok, or the error message
 * Long args/messages are truncated; the full value lives on the timeline row.
 */
export function eventPreview(event: NormalizedEvent): string {
  if (event.type === "tool_call") {
    return `${event.tool_name}(${truncate(JSON.stringify(event.args))})`;
  }
  if (event.status === "error") {
    return `${event.tool_name} → error: ${truncate(event.error ?? "(no message)")}`;
  }
  return `${event.tool_name} → ok`;
}

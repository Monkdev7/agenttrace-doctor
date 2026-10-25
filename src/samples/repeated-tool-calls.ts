import type { Trace } from "../lib/schema";

/**
 * Default sample: an agent stuck calling `search` with identical arguments.
 * Slice 1 uses this to prove the timeline renders a real trace.
 * (The full three bundled JSON samples arrive in slice 6.)
 */
export const repeatedToolCallsSample: Trace = {
  events: [
    { id: "e1", type: "tool_call", tool_name: "search", args: { query: "best pizza near me" } },
    { id: "e2", type: "tool_result", tool_name: "search", status: "ok", call_id: "e1" },
    { id: "e3", type: "tool_call", tool_name: "search", args: { query: "weather tomorrow" } },
    { id: "e4", type: "tool_result", tool_name: "search", status: "ok", call_id: "e3" },
    { id: "e5", type: "tool_call", tool_name: "search", args: { query: "weather tomorrow" } },
    { id: "e6", type: "tool_result", tool_name: "search", status: "ok", call_id: "e5" },
    { id: "e7", type: "tool_call", tool_name: "search", args: { query: "weather tomorrow" } },
    { id: "e8", type: "tool_result", tool_name: "search", status: "ok", call_id: "e7" },
    { id: "e9", type: "tool_call", tool_name: "fetch_url", args: { url: "https://example.com" } },
    { id: "e10", type: "tool_result", tool_name: "fetch_url", status: "error", error: "HTTP 503 Service Unavailable", call_id: "e9" },
  ],
};

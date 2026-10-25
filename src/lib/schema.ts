import { z } from "zod";

/**
 * The owned, minimal trace format for AgentTrace Doctor.
 *
 * This Zod schema is the SINGLE SOURCE OF TRUTH for the trace format:
 * - At runtime it validates untrusted input (uploaded JSON).
 * - At compile time we derive the TypeScript types from it with z.infer,
 *   so the types can never drift out of sync with the validation rules.
 *
 * A trace is an ordered list of events. Fields are conditional on `type`,
 * which we express with a Zod *discriminated union*: Zod reads `type` first,
 * then applies the matching shape. That is what lets us say "a tool_result
 * must have a status, a tool_call must have args" in one declaration.
 */

// A tool_call: the agent invoked a tool with some arguments.
export const toolCallSchema = z.object({
  id: z.string().min(1),
  type: z.literal("tool_call"),
  tool_name: z.string().min(1),
  // args is an arbitrary JSON object; we compare it later via stable stringify.
  args: z.record(z.unknown()),
});

// A tool_result: a tool reported back, either ok or error.
export const toolResultSchema = z.object({
  id: z.string().min(1),
  type: z.literal("tool_result"),
  tool_name: z.string().min(1),
  status: z.enum(["ok", "error"]),
  error: z.string().optional(),
  // Links this result back to the originating call's id, when present.
  call_id: z.string().optional(),
});

export const traceEventSchema = z.discriminatedUnion("type", [
  toolCallSchema,
  toolResultSchema,
]);

export const traceSchema = z.object({
  events: z.array(traceEventSchema),
});

// Types derived from the schema — never hand-written, always in sync.
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ToolResult = z.infer<typeof toolResultSchema>;
export type TraceEvent = z.infer<typeof traceEventSchema>;
export type Trace = z.infer<typeof traceSchema>;

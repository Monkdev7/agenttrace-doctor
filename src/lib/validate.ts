import { z } from "zod";
import { traceSchema, type Trace } from "./schema";

/**
 * Result of validating raw text. A discriminated union so callers must handle
 * both branches: on success they get the typed Trace; on failure a structured,
 * human-readable error they can show inline without the app ever throwing.
 * (spec.md > Components: validate.ts; prd.md > Trace upload and validation)
 */
export type ValidationResult =
  | { ok: true; trace: Trace }
  | { ok: false; error: ValidationError };

export interface ValidationError {
  kind: "parse" | "schema";
  /** Short headline for the error region. */
  summary: string;
  /** One readable line per problem, each naming the event and field. */
  details: string[];
}

/**
 * Stage 1: JSON.parse, capturing malformed-JSON errors (with line/column when
 * the engine provides a position) instead of letting them throw into the UI.
 */
function parseJson(
  raw: string,
): { ok: true; value: unknown } | { ok: false; error: ValidationError } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const lineCol = locateJsonError(raw, message);
    return {
      ok: false,
      error: {
        kind: "parse",
        summary: "This file isn't valid JSON.",
        details: [lineCol ? `${message} (${lineCol})` : message],
      },
    };
  }
}

/** Translate a "position N" in a JSON parse error into line/column. */
function locateJsonError(raw: string, message: string): string | null {
  const match = /position (\d+)/i.exec(message);
  if (!match) return null;
  const pos = Number(match[1]);
  const upto = raw.slice(0, pos);
  const line = upto.split("\n").length;
  const column = pos - upto.lastIndexOf("\n");
  return `line ${line}, column ${column}`;
}

/**
 * Stage 2: Zod validation + the custom error-formatting layer. Zod's default
 * messages are generic ("Invalid input"), so we translate each issue into a
 * message that names the event (by index AND its id when we can read it), the
 * field, and what was expected — modeling the same evidence-first clarity the
 * findings use. (prd.md > Trace upload and validation)
 */
export function validateTrace(raw: string): ValidationResult {
  const parsed = parseJson(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const result = traceSchema.safeParse(parsed.value);
  if (result.success) return { ok: true, trace: result.data };

  const rootEvents = (parsed.value as { events?: unknown })?.events;
  const details = result.error.issues.map((issue) =>
    formatIssue(issue, Array.isArray(rootEvents) ? rootEvents : undefined),
  );

  return {
    ok: false,
    error: {
      kind: "schema",
      summary: "This trace doesn't match the AgentTrace Doctor format.",
      details: dedupe(details),
    },
  };
}

function formatIssue(issue: z.ZodIssue, events?: unknown[]): string {
  const path = issue.path;

  // Issues on an event look like ["events", <index>, <field>].
  if (path[0] === "events" && typeof path[1] === "number") {
    const index = path[1];
    const field = path[2];
    const where = eventLabel(index, events);

    if (field === "status") {
      return `${where} is a tool_result but has no valid "status" field (expected "ok" or "error").`;
    }
    if (field === "args") {
      return `${where} is a tool_call but its "args" is missing or not an object.`;
    }
    if (field === "id") {
      // Duplicate-id custom issue carries its own full message.
      return `${where}: ${issue.message}`;
    }
    if (field === "type") {
      return `${where} has a missing or unknown "type" (expected "tool_call" or "tool_result").`;
    }
    if (field === "tool_name") {
      return `${where} has a missing or empty "tool_name".`;
    }
    if (field !== undefined) {
      return `${where}: field "${String(field)}" ${issue.message.toLowerCase()}.`;
    }
    return `${where}: ${issue.message}.`;
  }

  if (path[0] === "events" && path.length === 1) {
    return `The "events" field must be an array of events.`;
  }
  if (path.length === 0) {
    return `The trace must be an object with an "events" array.`;
  }
  return `${path.join(".")}: ${issue.message}`;
}

/** "Event #3 (id "e4")" when the id is readable, else "Event #3". */
function eventLabel(index: number, events?: unknown[]): string {
  const raw = events?.[index];
  const id =
    raw && typeof raw === "object" && "id" in raw
      ? (raw as { id?: unknown }).id
      : undefined;
  return typeof id === "string" && id.length > 0
    ? `Event #${index} (id "${id}")`
    : `Event #${index}`;
}

function dedupe(lines: string[]): string[] {
  return Array.from(new Set(lines));
}

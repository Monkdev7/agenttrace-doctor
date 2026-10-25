import type { NormalizedTrace } from "./normalize";
import type { Finding } from "./findings";
import { eventPreview } from "./preview";

/**
 * Markdown report generator (spec.md > Components: report.ts).
 *
 * Contents: title + timestamp, source/counts, a detector summary, one section
 * per finding (fact, cited events, explanation, rule, fix), a no-findings
 * statement, and a limitations note. Only the events CITED by findings are
 * included as evidence — never the whole raw trace.
 *
 * Safety: all trace-derived text is escaped so it cannot break the report's
 * Markdown structure (a tool name like "# danger" must not become a heading,
 * and a pipe must not split a notional table). Pure function, no I/O.
 */

/** Escape Markdown control characters and neutralize newlines in inline text. */
export function escapeMd(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/([`*_{}[\]()#+\-.!|>~])/g, "\\$1")
    .replace(/\r?\n/g, " ");
}

/** A stable, filesystem-safe timestamp: YYYYMMDD-HHMMSS (local time). */
export function formatTimestamp(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

/** Sanitize a source label into a filename-safe slug. */
export function sanitizeSource(source: string): string {
  const slug = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "trace";
}

/** agenttrace-report-<sanitized-source>-<timestamp>.md */
export function reportFilename(source: string, date: Date): string {
  return `agenttrace-report-${sanitizeSource(source)}-${formatTimestamp(date)}.md`;
}

export function generateReport(
  trace: NormalizedTrace,
  findings: Finding[],
  date: Date,
): string {
  const lines: string[] = [];
  const loops = findings.filter((f) => f.detector === "repeated_calls").length;
  const errors = findings.filter((f) => f.detector === "tool_error").length;

  lines.push(`# AgentTrace Doctor report`);
  lines.push("");
  lines.push(`- Generated: ${date.toISOString()}`);
  lines.push(`- Source: ${escapeMd(trace.source)}`);
  lines.push(`- Events analyzed: ${trace.events.length}`);
  lines.push(`- Distinct tools: ${trace.toolCount}`);
  lines.push("");
  lines.push(`## Detector summary`);
  lines.push("");
  lines.push(`- Repeated tool calls (possible loops): ${loops}`);
  lines.push(`- Explicit tool errors (confirmed): ${errors}`);
  lines.push("");

  if (findings.length === 0) {
    lines.push(`## Findings`);
    lines.push("");
    lines.push(`No issues were detected by the current detectors.`);
    lines.push("");
  } else {
    lines.push(`## Findings`);
    lines.push("");
    findings.forEach((f, i) => {
      const label = f.certainty === "confirmed" ? "Confirmed error" : "Possible loop";
      lines.push(`### ${i + 1}. ${escapeMd(f.title)} — ${label}`);
      lines.push("");
      lines.push(`**Observed fact:** ${escapeMd(f.fact)}`);
      lines.push("");
      lines.push(`**Supporting evidence:**`);
      for (const index of f.eventIndices) {
        const event = trace.events[index];
        const id = event ? event.id : `#${index}`;
        const preview = event ? eventPreview(event) : "(event not found)";
        lines.push(`- \`${escapeMd(id)}\` — ${escapeMd(preview)}`);
      }
      lines.push("");
      lines.push(`**Potential explanation:** ${escapeMd(f.explanation)}`);
      lines.push("");
      lines.push(`**Triggering rule:** ${escapeMd(f.rule)}`);
      lines.push("");
      lines.push(`**Suggested fix:** ${escapeMd(f.fix)}`);
      lines.push("");
    });
  }

  lines.push(`## Limitations`);
  lines.push("");
  lines.push(
    `These findings come from deterministic rules (repeated tool calls and ` +
      `explicit tool errors). Absence of findings means the implemented rules ` +
      `found no issues — it does not prove the run is correct.`,
  );
  lines.push("");

  return lines.join("\n");
}

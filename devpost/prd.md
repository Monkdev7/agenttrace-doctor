---
doc: prd
status: approved
---

# AgentTrace Doctor — Product Requirements

One line: a local, evidence-first debugging tool for students and independent developers that loads an AI agent's execution trace, detects suspicious patterns with deterministic rules, and explains each finding with a direct link to the exact events that triggered it.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

> This PRD stays inside the approved POC boundary in `scope.md > The POC Boundary (In)`. Mandatory detectors (repeated identical tool calls, explicit tool errors), the owned minimal JSON trace schema, Markdown-only export, no LLM, and no backend are carried forward unchanged.

## The Core Journey
Develops `scope.md > The Core Loop` and `scope.md > What "Working" Looks Like`.

1. The user opens AgentTrace Doctor. It loads **directly into a preloaded sample trace** (the "Repeated Tool Calls" sample, selected by default) — the execution timeline and findings are already populated, so the value is visible in the first seconds. It reads as opening a debugging instrument, not a welcome page.
2. A compact **sample selector** and a clear **JSON upload** action sit in the header. Three named samples are available: **Repeated Tool Calls**, **Tool Failure**, and **Clean Run**.
3. The workspace is a **two-panel layout**: the **execution timeline** on the left, the **findings panel** on the right.
4. The user reads the run top-to-bottom on the timeline, then reads the detected findings on the right. Each finding shows four visually separated parts: observed fact, supporting event evidence, potential explanation, suggested fix.
5. The user **clicks a finding** → its supporting events highlight on the timeline. The user **clicks a timeline event** → its details reveal and it becomes clear which finding (if any) references it. Switching between panels never loses the user's place or scroll position.
6. The user optionally **uploads their own JSON trace**. Valid traces replace the workspace; invalid ones show a readable inline error and preserve the current trace.
7. The user **exports a Markdown debugging report** (download primary, copy secondary) containing the findings and their cited evidence.
8. **Success:** on the Repeated Tool Calls and Tool Failure samples, the right diagnosis appears with cited events; on the Clean Run sample, the findings panel explicitly reports no issues without inventing any. The entire path runs locally with no account, API key, or network call.

## Screens and Layout
Develops `scope.md > The POC Boundary (In)` (Timeline view, Findings with evidence, Finding → timeline linking).

**Single workspace screen**, composed of:

- **Header (persistent):** product name; a compact **sample selector** (Repeated Tool Calls · Tool Failure · Clean Run, first selected by default); a clear **Upload JSON** action; the **Export report** action (download primary, copy secondary).
- **Left panel — Execution Timeline:** an ordered list of events. Each row shows event ID, event type (`tool_call` / `tool_result`), tool name, and a status indicator. Rows expand to reveal full detail. Supports highlighting a finding's supporting events, distinct from the event's own execution status.
- **Right panel — Findings:** a short summary of detected issues (counts per detector), then a list of finding cards.
- **Validation error region:** appears inline (near the upload action / top of workspace) when an upload fails; dismissable; never replaces the workspace.

**Responsiveness:** on narrow screens the two panels stack or switch via a toggle, without hiding important evidence. A finding's evidence and an event's status must remain reachable on small screens.

## Look and Feel
Develops `scope.md > Inspiration & Identity`.

Overall impression: a **polished diagnostic instrument for developers** — information-dense but not cluttered, purposeful highlights, clear event hierarchy, minimal decoration. Closer to a stack-trace viewer or test-runner failure report than an AI dashboard.

- **Theme:** dark. Deep navy or charcoal surfaces, subtle borders, readable foreground text.
- **Typography:** system **sans-serif** for interface/UI text; system **monospace** for event IDs, JSON arguments, error messages, and technical detail. No external font downloads for the PoC.
- **Accent palette (restrained):**
  - **Primary — cool cyan / blue:** interactive elements, selection/highlight, and the "possible loop / watch" marker.
  - **Success — muted green:** successful (`ok`) results.
  - **Error — muted amber / orange:** explicit reported tool errors, always paired with a clear text label and icon. **No decorative red; red is not used as a general accent.**
  - **Neutral:** surfaces, borders, body text.
- **Color independence:** the four finding sections and all status differences must be understandable through layout, labels, spacing, and typography — not color alone. Highlight state is visually distinct from execution status.

## Features and Behavior

### First screen and samples
Develops `scope.md > What "Working" Looks Like`.

- App opens into the **Repeated Tool Calls** sample, fully analyzed, timeline + findings populated.
- Header sample selector switches instantly between the three bundled samples.
- Samples are realistic but small enough to understand at a glance:
  - **Repeated Tool Calls** — the same tool called multiple times with identical arguments; the repeated-call detector fires and the relevant events are highlightable.
  - **Tool Failure** — an explicit tool error with its error evidence and a suggested corrective action.
  - **Clean Run** — a successful execution that produces **no findings**, demonstrating the tool does not invent problems.

### Execution timeline
Develops `scope.md` acceptance criteria 1 and 7.

- Each event row shows: **event ID**, **event type**, **tool name**, and a **status indicator**.
- **Tool calls:** concise inline summary of arguments; expandable to full JSON args.
- **Successful results:** compact **`OK`** indicator; show an optional brief result summary **only if present in the input** (the schema has no result-body field — none is added, and none is invented).
- **Errors:** error status plus a short inline **error-message preview** (important diagnostic evidence); expandable to the full message.
- **Missing/empty fields:** handled gracefully — no confusing blank sections.
- Selecting a row reveals its details **in place**, without navigating away or losing scroll position.
- **Status indicators:**
  - Successful results → restrained neutral / subtle success treatment.
  - Explicit tool errors → clear error indicator + amber error accent, reserved for actual reported failures.
  - Repeated tool calls → separate, non-alarming **"Watch" / "Possible loop"** marker in the primary accent — never styled as an error.
  - Unrelated events → normal appearance.
- When a finding is selected, its supporting events are **highlighted** with enough surrounding context to understand the sequence; the highlight is **distinct from execution status**.

### Finding cards
Develops `scope.md > The Unique Kernel` and acceptance criteria 5 and 6.

Each finding card contains, visually separated:
1. **Title + certainty/status label.**
2. **Observed fact** — a plain statement of what happened (e.g. "The `search` tool was called 4 times with identical arguments").
3. **Supporting evidence** — the cited event IDs, each with a **compact inline preview** (tool name + args, or the error message). Long args/errors are truncated with a way to expand. Clicking an event reference **navigates to and highlights** that event on the timeline.
4. **Potential explanation** — clearly separated and labeled as interpretation.
5. **Suggested fix** — a practical corrective action.

**Certainty language (fact vs. inference):**
- **Explicit tool errors** → labeled as **confirmed errors reported by the trace**. Show the actual error message and event IDs. Do not claim a deeper root cause the trace doesn't support.
- **Repeated tool calls** → state the observed fact, label the interpretation as **"Possible loop" / "Worth investigating."** Repeated calls alone do not prove a bug.
- Distinctions are carried by **clear text labels and restrained visual treatment**, not color alone.
- The user can understand a finding's basic evidence from the card itself, without navigating away.

### Trace upload and validation
Develops `scope.md` acceptance criterion 2.

- Upload a JSON file; it is parsed and validated against the owned schema before anything changes.
- **A failed upload never wipes the current trace or blocks the workspace.** On first open, an invalid upload leaves the default sample intact.
- On failure, a **readable, dismissable inline error region** explains why, showing where possible: the **event ID/index**, the **field** missing or invalid, the **expected value/format**, and a concise **how-to-fix**.
  - Malformed JSON → show the parsing error with line/column when available.
  - Schema error → specific message, e.g. "Event #4 is a `tool_result` but has no `status` field."
  - Avoid dumping raw parser exceptions.
- The workspace is replaced **only after** a file parses and validates successfully.
- The user can dismiss the message and try another file.

### Markdown report export
Develops `scope.md` acceptance criterion 8.

- **Contents, in order:**
  1. Report title + generation timestamp.
  2. Trace source/filename, total event count, distinct tool count (where available).
  3. Short **detector summary** — which detectors ran and how many findings each produced.
  4. One **section per finding**: title, observed fact, supporting event IDs, compact evidence preview, potential explanation, triggering rule, suggested corrective action.
  5. A clear **no-findings statement** when there are none.
  6. A brief **limitations note** — reminds that absence of findings is not proof the execution is correct.
- **Only the events cited by findings** are included as compact evidence excerpts; the full raw trace is **not** included.
- Event content is **escaped/formatted safely** so trace data cannot corrupt the Markdown structure.
- **Delivery:** **Download `.md`** is the primary action; **Copy report** is secondary; both produce identical content. Copy gives clear success/failure feedback. Export works fully locally.

## States and Boundaries

- **First use** — opens into the Repeated Tool Calls sample, analyzed and populated; no setup, no prompt.
- **Normal use** — a valid trace (sample or uploaded) is loaded; timeline + findings shown; selection syncs both ways.
- **Empty findings (Clean Run)** — findings panel shows an explicit message, e.g. "No issues detected by the current detectors," including events-analyzed and distinct-tool counts where computable, and clarifying this means *no issues were detected by the implemented rules*, not that the run is guaranteed correct.
- **Upload validation error** — inline, readable, dismissable; previous trace/timeline/findings preserved.
- **Event with missing/optional fields** — rendered gracefully, no blank or broken sections.
- **Persistence** — none. The tool is stateless by design; nothing is stored between sessions. Reload returns to the default sample. (Carried from `scope.md > Explicitly Cut`.)
- **Boundaries** — no account, no API key, no network call anywhere in the primary workflow.

## Product Decisions

- **Open into a preloaded sample (option a), first sample selected by default** — a diagnostics tool should demonstrate value immediately, not gate it behind a landing page.
- **Three named samples (Repeated Tool Calls, Tool Failure, Clean Run)** — cover both mandatory detectors plus the trust-defining no-findings case.
- **Two-panel layout, timeline left / findings right, bi-directional selection, preserve place** — matches the "click finding ↔ see events" core interaction.
- **Responsive stack/switch on narrow screens without hiding evidence** — usable in a demo on any screen.
- **Certainty is explicit per detector** — confirmed errors vs. "possible loop" — to keep the tool honest and protect the kernel.
- **Inline evidence preview + clickable event refs** — basic evidence is readable without leaving the card.
- **Compact-with-expand for timeline event detail** — scannable timeline, full JSON on demand.
- **Status colors are semantic and restrained; repeated calls are never error-colored; amber (not red) for errors; legible without color** — distinctive, accessible, on-identity.
- **Validation preserves the last valid trace; errors are specific and dismissable** — never strand the user on a blank app; input errors also model the evidence-first ethos.
- **Report includes cited events only, escaped safely; download primary + copy secondary** — useful, shareable, structurally safe, fully local.
- **System sans + system monospace; dark navy/charcoal; cyan primary, green success, amber error** — legitimate developer-tool feel with zero external font/network dependency.
- **Assumption:** successful `tool_result` events rarely carry a human-readable summary (the schema has no result body), so most `ok` rows render as a clean `OK`. No result-body field is added.

## What We're Building
Everything required for a complete PoC (all inside `scope.md > The POC Boundary (In)`):

- Single dark two-panel workspace: header (samples + upload + export), timeline (left), findings (right).
- Three bundled sample traces: Repeated Tool Calls, Tool Failure, Clean Run; first loaded by default.
- Owned minimal JSON schema parsing + validation into a normalized internal representation; stable JSON normalization of `args`.
- **Detector 1 (mandatory):** repeated identical tool calls → "possible loop," exact repeats only, cited events.
- **Detector 2 (mandatory):** explicit tool errors → confirmed error with error evidence and cited events.
- Execution timeline with compact/expandable event detail, semantic status indicators, graceful empty-field handling.
- Finding cards with four visually separated parts and explicit certainty language.
- Bi-directional finding↔event selection and highlighting; place/scroll preserved.
- Upload with specific, readable, non-destructive validation errors.
- Explicit empty-findings (Clean Run) state.
- Markdown report: cited-events-only, safely escaped; download primary + copy secondary; fully local.
- Responsive layout for narrow screens.

## Deferred From the POC
Named so none slip into the build (from `scope.md > Later`):

- **Detector 3 — repeated failure (same tool errors N+ times)** — stretch only; additive; must not delay or compromise detectors 1 and 2. If built, it uses the same citation and fact/explanation separation.
- **PDF / non-Markdown export** — Markdown is the only MVP export.
- **Format adapters (LangSmith, OpenTelemetry GenAI spans, OpenAI tool-call logs)** — the parsing layer leaves a seam, but no adapter ships now.
- **Persistence / saved reports across sessions** — stateless by design for the PoC.

## Possible Later Enhancements
- Optional LLM narration of findings — strictly additive, never required for the core workflow.
- General cycle / repeating-subsequence detection (beyond the simple "same tool keeps failing" stretch).
- A result-body field in the schema to support richer success summaries.
- Deployment (optional for submission).

## Non-Goals
Carried from `scope.md > Explicitly Cut`, plus build-time temptations:

- **No LLM-based diagnosis** — it is the generic-chatbot failure mode the kernel exists to avoid, and it is non-reproducible.
- **No general cycle detection in the MVP** — ambiguous to define reliably; false-positive risk undermines trust.
- **No real third-party trace-format ingestion** — a full real-schema parser would consume the whole budget.
- **No accounts, API keys, backend, or persistence** — local and stateless by design.
- **No red as a decorative color** — strong error color is reserved for actual reported failures.
- **No invented result data** — the UI never fabricates a success summary the trace doesn't contain.

## Resolved Decisions (carried into `4-spec`)
- **Detector 1 — repeated-call rule (resolved):** flag a *possible loop* when the same tool is called **at least 3 consecutive times** with **exactly identical arguments after stable JSON normalization**. Calls are evaluated in **execution order**, **ignoring their `tool_result` events** when deciding whether matching calls are consecutive. A **different tool call resets** the sequence. Timestamps, nonces, and other argument values are **not** normalized away — exact normalized equality is intentional for the MVP. The finding describes the observed repetition and labels the loop interpretation as **possible, not confirmed**.
- **Report filename (resolved):** `agenttrace-report-<source>-<timestamp>.md`. The `<source>` name is **sanitized**; for bundled samples it is the **sample name**; the `<timestamp>` uses a **consistent format**.

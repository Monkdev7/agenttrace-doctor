---
doc: scope
status: approved
---

# AgentTrace Doctor

One line: an evidence-first debugging tool that loads an AI agent's execution trace, detects suspicious patterns with deterministic rules, and explains each finding with a direct link to the exact events that triggered it.

## The Unique Kernel
Every finding is backed by evidence, not by a model's opinion. A deterministic rule fires on concrete events in the trace, and the UI shows the triggering event IDs, the observed fact, the rule that matched, why it might matter, and a suggested fix — while keeping **observed facts visibly separate from potential explanations**. No LLM, no API key, no network. The evidence is the product. Delete the evidence linking and the facts/explanation separation and this becomes just another chatbot — so that is the thing to protect.

## Who It's For
A student or independent developer building an AI agent who just watched it get stuck — it looped on the same tool call, or a tool kept erroring — and can't quickly see *why* from raw logs. Today they scroll through a wall of JSON or print statements trying to spot the repeat by eye. AgentTrace Doctor gives them a readable timeline and names the problem with receipts.

## The Core Loop
They open the app, load a bundled sample trace or upload their own JSON trace, and see the run as a clear step-by-step timeline. The app runs its detectors and lists findings; each finding links back to the exact events on the timeline. They read the evidence, the explanation, and the suggested fix, then export a debugging report. They come back whenever an agent run misbehaves and they want a fast, trustworthy read on what went wrong.

## Inspiration & Identity
Should feel like a focused diagnostic instrument — calm, precise, trustworthy — not a flashy AI assistant. Closest in spirit to a stack-trace viewer or a test runner's failure report: it states facts plainly and cites its sources. Polished and readable over clever. (Design specifics deferred to `3-prd > Look and Feel`.)

## Why This Matters to the Learner
This hackathon is the learner's chance to practice a full plan-first workflow and to get better at directing AI agents — breaking work into tasks, making deliberate technical decisions, reviewing and testing, and understanding the architecture well enough to explain and maintain it. A deterministic, no-API-key tool is something they can fully reason about and own, which is exactly the point. In their words, the goal is a working proof of concept that stands out "through evidence-backed explanations rather than being another generic AI chatbot."

## What "Working" Looks Like
A reviewer opens the app, loads a bundled sample trace that contains a loop and a failing tool, and immediately sees a timeline of the run. The findings panel shows, for example, "Tool `search` called 4 times with identical arguments (events #3, #5, #7, #9) — possible loop," clearly labeled as an observed fact with a separate, tentative explanation and a suggested corrective action. Clicking the finding highlights those exact events on the timeline. They export a debugging report and the same evidence is in it. The whole thing runs locally with no account or key.

**The "oh, that's cool" beat:** clicking a finding and watching it light up the precise events that justify it — the explanation is never hand-wavy, it always points at the receipts.

## The POC Boundary (In)
- **Owned minimal trace format**: a documented JSON schema of ordered events, each with `id`, `type` (`tool_call` | `tool_result`), `tool_name`, `args` (object, on calls), `status` (`ok` | `error`, on results), optional `error` message, and optional `call_id` linking a result to its originating call. Fields are conditional on `type`.
- **Upload + bundled samples**: load one of a few realistic bundled sample traces, or upload a JSON file. Uploads are validated against the schema with clear, understandable error messages.
- **Parsing layer**: parse/validate into a normalized internal representation that the detectors run on. Structured so additional format adapters *could* be added later, but only the owned format ships now.
- **Stable JSON normalization** of `args` so object-key order never causes a false mismatch.
- **Detector 1 — Repeated identical tool calls (guaranteed):** same `tool_name` called repeatedly with deep-equal normalized `args`; flagged as a possible loop. Detects *exact* repeats only, and says so.
- **Detector 2 — Explicit tool errors (guaranteed):** `tool_result` with `status: error`; surfaces the error evidence.
- **Timeline view**: the run rendered as a clear, ordered step-by-step timeline.
- **Findings with evidence**: each finding shows triggering event IDs/indices, the observed evidence, the rule that matched, why it may matter, and a suggested corrective action — with observed facts visually separated from potential explanations.
- **Finding → timeline linking**: selecting a finding highlights its supporting events.
- **Export debugging report (Markdown)**: export the findings and their evidence as a Markdown report. Markdown is the only export format in the MVP.
- **Runs fully locally**: no sign-up, no API key, no network dependency.

## Later
- **Detector 3 — Repeated failure (stretch, only if time allows):** the same tool erroring N+ times. Deliberately scoped as "same tool keeps failing," *not* general recurring-sequence/cycle detection. This is additive only and must not delay or compromise the guaranteed core (detectors 1 and 2).
- **PDF and other export formats** — deferred; Markdown is the MVP export.
- Format adapters (LangSmith, OpenTelemetry GenAI spans, OpenAI tool-call logs) via the pluggable parsing layer.
- Optional LLM narration of findings, strictly additive and never required for the core workflow.
- General cycle / repeating-subsequence detection.
- Deployment (optional for submission).

## Explicitly Cut
- **LLM-based diagnosis** — it is the "generic chatbot" failure mode the kernel exists to avoid, and it is non-reproducible. Not required anywhere in the main workflow.
- **General cycle detection** — ambiguous to define reliably (window size, repeat count, interleaving) and a false-positive risk that would undermine the trust-first promise. Reframed to the crisp "same tool keeps failing" stretch instead.
- **Real third-party trace-format ingestion** — a full parser for any real schema would consume the whole time budget; the pluggable layer leaves the door open without paying the cost now.
- **Accounts, API keys, persistence/back end** — the tool is local and stateless by design.

## Assumptions
- Users can provide or will use a trace in AgentTrace Doctor's documented JSON format; bundled samples guarantee the demo works even if a user has no trace handy.
- A repeated identical tool call is a *possible* problem, not a certain bug — the UI must frame it as an observation with a tentative explanation.
- The target is 2–4 hours of active work, a short demo video, and a public GitHub repo; deployment is optional.

## Acceptance Criteria

**Guaranteed core (mandatory for MVP):**
1. The app loads a bundled sample trace and renders it as a clear, ordered **execution timeline** of steps.
2. A user can upload a JSON trace; invalid uploads are rejected with a clear, human-readable validation error that explains what's wrong.
3. **Detector 1 (mandatory)** flags 2+ identical tool calls (same `tool_name`, deep-equal normalized `args`) and cites the exact event IDs.
4. **Detector 2 (mandatory)** flags every `tool_result` with `status: error` and shows the associated error message as evidence.
5. **Trustworthiness — every finding** cites its supporting event IDs, states the observed fact, names/explains the rule that triggered it, and distinguishes observed facts from possible interpretations.
6. **Visual differentiation (explicit):** each finding visually separates four parts — (a) observed facts, (b) the supporting event evidence, (c) the potential explanation, and (d) the suggested fix — so a reader can never mistake an interpretation for a fact.
7. Selecting a finding highlights its supporting events on the execution timeline.
8. The user can export a **Markdown** debugging report containing the findings and their evidence.
9. **Primary demo path runs fully locally** with no account, API key, or network call — from loading a sample trace, through viewing the diagnosis, to exporting the report.

**Stretch (must not delay the core):**
10. Detector 3 flags the same tool erroring N+ times, with the same citation and facts/explanation separation as the mandatory detectors.

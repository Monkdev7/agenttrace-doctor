---
doc: spec
status: approved
---

# AgentTrace Doctor — Technical Spec

## How This Works, In Plain Language

AgentTrace Doctor is a **single-page web app that runs entirely in your browser**. There is no server, no database, no AI model, and no network call in the main workflow — everything happens locally on your machine.

Here's the shape of it. The app holds a few **sample traces** baked in at build time, and it opens showing one of them. A trace is just a JSON list of things an AI agent did: it called a tool, a tool returned a result, and so on. When you load a trace (a bundled sample or a file you upload), the app runs it through a short assembly line:

1. **Parse** — turn the raw text into JSON.
2. **Validate** — check it matches our trace format, using a library called **Zod**; if it doesn't, we show a plain-English message saying exactly which event and field is wrong.
3. **Normalize** — build a tidy internal copy where every event knows its position and its arguments are written in a consistent way.
4. **Detect** — run two rule-based checks over that copy: one for the same tool being called 3+ times in a row with identical arguments (a possible loop), and one for tools that reported an error.
5. **Render** — draw the run as a **timeline** on the left and the **findings** on the right.

Each stage is a separate, plain function, so each can be tested on its own and none of them has to redo another's work. The detectors never guess — every finding points at the exact events that triggered it, and the explanation is clearly marked as an interpretation, separate from the observed fact.

Why this shape? A browser-only app is the simplest thing that satisfies "runs fully locally, no key, no backend" — there is literally no server to call, so the no-network promise holds by construction. React + TypeScript lets the trace format be a **typed model** the whole app shares, which makes the detectors safer to write and easier to reason about.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Open** → the app loads the bundled **Repeated Tool Calls** sample through the full pipeline and renders timeline + findings. (`prd.md > First screen and samples`)
2. **Switch sample** → selecting another sample in the header re-runs the pipeline on that sample's JSON; findings recompute; stale selections and expanded rows clear. (`prd.md > First screen and samples`)
3. **Read the run** → the left panel shows events in order; each row shows ID, type, tool name, status; rows expand for full JSON. (`prd.md > Execution timeline`)
4. **Read findings** → the right panel shows a detector summary and finding cards, each with fact · evidence · explanation · fix. (`prd.md > Finding cards`)
5. **Click a finding** → `selectedFinding` set, `selectedEvent` cleared, its `eventIndices` highlighted on the timeline (highlight distinct from status). (`prd.md > States and Boundaries`)
6. **Click an event** → `selectedEvent` set, previous finding selection cleared, the details view shows that event plus every finding that references it. (`prd.md > Execution timeline`)
7. **Upload a trace** → parse → validate; on success the workspace is replaced and findings recompute; on failure an inline, dismissable error appears and the previous trace/findings are preserved. (`prd.md > Trace upload and validation`)
8. **Export** → generate a Markdown report of the findings and their cited events; download `.md` (primary) or copy (secondary). (`prd.md > Markdown report export`)

## Stack

- **Language:** TypeScript (~5.x). Typed trace model shared across pipeline and UI.
- **Framework:** React 18 + Vite 5. Docs: https://react.dev · https://vite.dev
- **Validation:** Zod (~3.x) for runtime schema validation + inferred types, with a custom error-formatting layer for readable per-event messages. Runs entirely locally. Docs: https://zod.dev
- **Styling:** Plain CSS with CSS custom properties (variables); no UI framework, no external fonts. System sans for UI, system monospace for data.
- **Testing:** Vitest (~1.x/2.x), unit-testing the pure pipeline functions. Docs: https://vitest.dev
- **Package manager:** pnpm. Docs: https://pnpm.io

Rationale (learner-selected): React/Vite/TS is already familiar, so effort goes into the detectors, not the stack; Zod gives schema + types from one source, with the custom layer owning the evidence-first error wording; plain CSS keeps the dependency surface tiny and avoids the "generic AI dashboard" pull of a component library; Vitest is the native fit for Vite. Accepted tradeoff: a build step and `node_modules` versus a zero-dependency vanilla approach, judged worth it for the typed model and familiar tooling.

Version note: exact minor/patch versions are resolved by `pnpm install` at build time — pin them in `package.json` and verify `pnpm build` and `pnpm test` run clean early in `5-build`. No dependency requires an account, key, or network at runtime.

## Where It Runs and How Someone Tries It

- **Runtime:** a modern browser. No environment variables, no API keys, no backend.
- **Install:** `pnpm install`
- **Develop / demo:** `pnpm dev`, then open the printed local URL (Vite default `http://localhost:5173`). This is sufficient to record the required demo video.
- **Build:** `pnpm build` → static assets in `dist/`. **Test:** `pnpm test`.
- **Submission:** a short demo video **and** a public GitHub repository are required. A local run recording satisfies the video; reviewers do not need to clone to see the proof.
- **Optional deployment:** because the build is a static bundle, it can later be published to any static host (e.g. GitHub Pages / Netlify) as a final step **only after** all mandatory acceptance tests pass. Optional; never a substitute for the video; must not delay the MVP.

## Look and Feel
Carried from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`. A polished developer diagnostic instrument — information-dense, minimal decoration.

- **Theme:** dark. Deep navy / charcoal surfaces, subtle borders, readable foreground text. Defined as CSS variables in one `theme.css` / `:root` block.
- **Typography:** system sans (`-apple-system, Segoe UI, Roboto, …`) for UI; system monospace (`ui-monospace, SFMono-Regular, Menlo, Consolas`) for event IDs, JSON args, error messages.
- **Accent variables:** `--primary` cool cyan/blue (selection, highlight, "Watch"/possible-loop marker); `--success` muted green (`ok` results); `--error` muted amber/orange (actual reported errors, always with a text label + icon); neutral surfaces/borders/text. **No decorative red.**
- **Color independence:** the four finding parts and all statuses are distinguishable via layout, labels, spacing, and typography, not color alone. Selection highlight is visually distinct from execution status.

## Components

### `App`
Top-level workspace. Owns in-memory state (see Data Model), wires the header, timeline, and findings panels, and runs the pipeline when the trace source changes.
PRD ref: `prd.md > Screens and Layout`.

### `Header`
Product title; sample selector (Repeated Tool Calls · Tool Failure · Clean Run); Upload JSON action; Export (download primary, copy secondary).
PRD ref: `prd.md > Screens and Layout`, `prd.md > First screen and samples`.

### `TimelinePanel` + `EventRow`
Left panel. Renders normalized events in order. `EventRow` shows ID, type, tool name, status indicator; compact inline arg/error summary; expandable full JSON; graceful handling of missing/optional fields. Applies the "selected/highlighted" visual (distinct from status) when the event is in the active finding's `eventIndices` or is `selectedEvent`.
PRD ref: `prd.md > Execution timeline`.

### `FindingsPanel` + `FindingCard`
Right panel. Detector summary (which detectors ran, counts). `FindingCard` renders the four separated parts (fact · evidence · explanation · fix), the certainty label (confirmed error vs. possible loop), inline evidence previews with truncation/expand, and clickable event references that select+highlight the cited event.
PRD ref: `prd.md > Finding cards`.

### `ValidationError`
Inline, dismissable error region shown on a failed upload; never replaces the workspace.
PRD ref: `prd.md > Trace upload and validation`.

### `EmptyFindings`
Clean-Run message: "No issues detected by the current detectors," with events-analyzed and distinct-tool counts, and the "not a proof of correctness" note.
PRD ref: `prd.md > States and Boundaries`.

### Pipeline modules (pure, non-React, independently testable)

#### `lib/schema.ts` — Zod schema + inferred types
Declares the trace/event schema (fields conditional on `type`) and exports the inferred TS types. Single source of truth for the trace format.

#### `lib/validate.ts` — parse + validate + format errors
`JSON.parse` wrapped for parse errors (with line/column when available); Zod `safeParse`; a custom formatter turning Zod issues into messages naming the event index/ID, the field, the expected value/format, and a correction hint. Returns either a validated trace or a structured, human-readable error. Never throws into the UI.

#### `lib/normalize.ts` — normalized model builder
Assigns each event its array **index** (positional key) while keeping its original **`id`**; computes `argsKey = stableStringify(args)` for calls; links each `tool_result` to its originating `tool_call` via `call_id` when it resolves. `stableStringify` recursively sorts object keys and serializes, **preserving array order and every value** (timestamps, nonces included — nothing stripped).

#### `lib/detectors/repeatedCalls.ts` — Detector 1
See Algorithms below.

#### `lib/detectors/toolErrors.ts` — Detector 2
See Algorithms below.

#### `lib/report.ts` — Markdown report generator
Builds the report string from findings + their cited events only; escapes/fences event content safely; produces the `agenttrace-report-<source>-<timestamp>.md` filename.

## Algorithms

### Stable JSON normalization
`stableStringify(value)`:
- object → serialize keys in **sorted** order, each value recursively stable-stringified;
- array → preserve element order, each element recursively stable-stringified;
- primitive → standard JSON serialization.
No value is removed or simplified. Result is a canonical string; two arg objects are "identical" iff their `stableStringify` outputs are equal.

### Detector 1 — Repeated tool calls (mandatory)
Implements `prd.md > Resolved Decisions` (repeated-call rule) and `prd.md > Finding cards`.
```
input: normalized events (with indices)
calls = events where type == "tool_call", in execution order
        (tool_result events are NOT included and do NOT break a run)
run = empty
for each call c in calls:
    key = (c.tool_name, c.argsKey)
    if run not empty AND key == run.key:
        run.push(c)                      # extend
    else:
        if run.length >= 3: emit(run)    # flush qualifying run
        run = [c] with run.key = key     # reset on different tool OR different args
if run.length >= 3: emit(run)            # flush trailing run
```
- A run of exactly 2 emits **nothing**.
- Each emitted finding cites **every** call in the run (its `eventIndices`).
- Two qualifying runs of the same tool+args separated by a different call → **two** findings.
- **Fact:** "`<tool>` was called `<n>` times in a row with identical arguments." **Explanation:** labeled *possible loop / worth investigating* — never confirmed. **Fix:** add a repeat guard / vary inputs / check why results aren't advancing.

### Detector 2 — Explicit tool errors (mandatory)
Implements `prd.md > Finding cards` (confirmed-error framing).
```
for each event e where type == "tool_result" AND status == "error":
    indices = [e.index]
    if e.call_id resolves to a known tool_call k: indices.push(k.index)
    emit finding(indices, message = e.error)
```
- If `call_id` does **not** resolve, the finding is still emitted citing only the result event — analysis never fails on an unmatched `call_id`.
- **Fact:** confirmed error reported by the trace, showing the actual `error` message. No invented root cause.
- Repeated-failure aggregation (same tool erroring N+×) is the **stretch** Detector 3; it must not delay or alter Detectors 1 and 2.

## Data Model

### Trace schema (owned, minimal) — `lib/schema.ts`
An object with an ordered `events` array. Each event:

| Field | On `tool_call` | On `tool_result` | Notes |
|---|---|---|---|
| `id` | required, unique | required, unique | original identifier shown to the user |
| `type` | `"tool_call"` | `"tool_result"` | discriminant |
| `tool_name` | required | required | |
| `args` | required (object) | — | normalized for comparison |
| `status` | — | required (`"ok"` \| `"error"`) | |
| `error` | — | optional (string) | present with `status: "error"` |
| `call_id` | — | optional | references a `tool_call` `id` |

Fields are conditional on `type` (Zod discriminated union). IDs are required and unique by schema; the internal **index** is still the reliable positional join key.

### Normalized model (internal)
```
NormalizedEvent = original fields + { index: number, argsKey?: string, linkedCallIndex?: number }
NormalizedTrace = { events: NormalizedEvent[], toolCount: number, source: string }
Finding = {
  detector: "repeated_calls" | "tool_error",
  certainty: "possible" | "confirmed",
  title, fact, explanation, fix: string,
  eventIndices: number[]            # supporting events (join on index; IDs shown in UI)
}
```

### Where data lives / lifecycle
- All state is **in-memory React state**, held at `App` (no persistence library, no storage). Reload returns to the default sample.
- `currentTrace: NormalizedTrace` and `findings: Finding[]` (derived once per load).
- `selectedFinding`, `selectedEvent`, `expandedEvents`, `validationError`.
- **Selection transitions (no stale selections):**
  - Click finding → set `selectedFinding`, **clear** `selectedEvent`, highlight its `eventIndices`.
  - Click event → set `selectedEvent`, **clear** `selectedFinding`, details view shows that event + all findings referencing its index (these linked findings are preserved in the details view).
  - Highlight is always visually distinct from execution status.
  - Failed upload → preserve `currentTrace` + `findings`; show `validationError` only.
  - Switch sample / successful upload → recompute `currentTrace` + `findings`, **clear** `selectedFinding`, `selectedEvent`, `expandedEvents`, and any `validationError`.

## File Structure
```
agenttrace-doctor/
├── src/
│   ├── main.tsx                      # React entry
│   ├── App.tsx                       # workspace + in-memory state + pipeline wiring
│   ├── components/
│   │   ├── Header.tsx                # sample selector · upload · export
│   │   ├── TimelinePanel.tsx         # left: ordered events
│   │   ├── EventRow.tsx              # one event: id/type/tool/status, expand
│   │   ├── FindingsPanel.tsx         # right: detector summary + cards
│   │   ├── FindingCard.tsx           # fact · evidence · explanation · fix
│   │   ├── ValidationError.tsx       # inline, dismissable upload error
│   │   └── EmptyFindings.tsx         # Clean-Run message
│   ├── lib/
│   │   ├── schema.ts                 # Zod schema + inferred types
│   │   ├── validate.ts               # parse + validate + format errors
│   │   ├── normalize.ts              # normalized model + stableStringify + call linking
│   │   ├── report.ts                 # Markdown report generator
│   │   └── detectors/
│   │       ├── index.ts              # run all detectors over normalized model
│   │       ├── repeatedCalls.ts      # Detector 1
│   │       └── toolErrors.ts         # Detector 2
│   ├── samples/
│   │   ├── repeated-tool-calls.json  # default sample (loop)
│   │   ├── tool-failure.json         # error sample
│   │   └── clean-run.json            # no-findings sample
│   └── styles/
│       ├── theme.css                 # :root CSS variables (palette, fonts)
│       └── app.css                   # layout + component styles
├── tests/                            # Vitest unit tests (pure functions)
│   ├── normalize.test.ts
│   ├── repeatedCalls.test.ts
│   ├── toolErrors.test.ts
│   ├── validate.test.ts
│   └── report.test.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── devpost/                          # Devpost learning workspace (planning docs)
└── README.md
```

## External Services and Dependencies
**None at runtime.** No APIs, no database, no hosting required for the core workflow. Build-time dev dependencies only (React, Vite, Zod, Vitest, TypeScript), all installed locally via pnpm. No keys, no rate limits, no cost.

## Important Failure Modes
- **Malformed JSON uploaded** → inline error with the parse message (line/column when available); current trace preserved.
- **Schema-invalid upload** (e.g. a `tool_result` missing `status`) → inline error naming the event index/ID, the field, the expected value, and a fix hint; current trace preserved.
- **`call_id` on an error result doesn't resolve** → Detector 2 still emits the finding citing the result event only; detection never crashes.
- **Event with missing/optional fields** → rendered gracefully, no blank/broken sections.
- **Empty or all-clean trace** → `EmptyFindings` message (not an error), with counts and the correctness caveat.

## What Was Simplified and Why
- **Browser-only, no backend** instead of any client/server split — the data is small, user-provided, and analyzed locally; a server would add infrastructure that proves nothing about the kernel.
- **Owned minimal schema + bundled samples** instead of real third-party trace ingestion — a full real-schema parser would consume the whole budget. The pipeline (`validate` → `normalize`) leaves a clean seam where a future adapter could map a foreign format into the owned schema. Samples are clearly labeled sample data; the kernel (evidence-first detection) is real, not faked.
- **In-memory state, no persistence** instead of storage — stateless by design per the PRD; nothing to save.
- **Markdown-only export** instead of PDF — the only format in the MVP.
- **Detector 3 deferred** — the two mandatory detectors prove the kernel; the stretch detector is purely additive.

## Decisions and Open Issues

**Learner decisions (with accepted tradeoffs):**
- React + Vite + TypeScript, pnpm — familiar stack; effort goes to detectors. Tradeoff: build step + node_modules vs. vanilla.
- Zod + custom error formatter — schema and types from one source; the formatter owns the evidence-first error wording. Tradeoff: Zod's default messages are generic, so a small translation layer is required (accepted).
- Plain CSS, no UI framework/fonts — restrained instrument look, tiny dependency surface. Tradeoff: hand-written styles vs. prebuilt components.
- Internal **index** as the selection/evidence join key (IDs still shown) — robust even though IDs are schema-unique.
- Detector 1: ≥3 consecutive, tool_results ignored for sequencing, reset on different tool/args, two runs → two findings. Repeats labeled *possible*, never confirmed.
- Detector 2: cite result + linked call when `call_id` resolves; retain finding citing the result alone when it doesn't.
- Selection transitions defined to forbid stale selections; failed upload preserves the last valid trace; sample switch / successful load clears selections + expanded state + validation error.
- Vitest on the pure functions; UI verified via a manual demo checklist in `5-build`.
- Optional static deployment only after mandatory acceptance tests pass; never delays the MVP.

**One genuine learner uncertainty discussed:** how the resolved repeated-call rule translates into code — specifically that `tool_result` events must be skipped for *sequencing* but still cited as context elsewhere, and that a 2-run emits nothing. Clarified via the explicit pseudocode in Algorithms and locked in as dedicated Vitest cases (≥3 boundary, reset-on-different-tool, results-skipped, two-separate-runs, 2-is-not-enough). Evidence it works will be those passing tests, reviewed during `5-build`.

**Test coverage to implement (from the agreed strategy):**
- `normalize`: key-order independence; array-order sensitivity; no value stripped.
- `repeatedCalls`: ≥3 fires; exactly 2 does not; different tool resets; different args resets; `tool_result` interleaving does not break a run; two separate qualifying runs → two findings.
- `toolErrors`: each `status:"error"` → one finding; `call_id` resolves → cites call+result; unmatched `call_id` → cites result only, no crash.
- `validate`: malformed JSON message; missing-`status` message; wrong-type message; valid trace passes.
- `report`: cited-events-only; safe escaping/fencing of event content; filename format.
- Guard cases: unmatched `call_id` doesn't crash detection; a failed upload does not replace the active trace.

**Open issues / blockers:** none. All consequential decisions are resolved; scope and PRD are fully honored; no unverified external dependency exists (there are no runtime services to verify). Exact dependency minor/patch versions resolve at `pnpm install` and are confirmed by a clean `pnpm build` + `pnpm test` early in `5-build`.

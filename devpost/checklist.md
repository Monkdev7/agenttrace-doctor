---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. The app runs and shows a trace's events as a timeline**
  Becomes usable: A running React+Vite+TS app that loads one hardcoded sample trace through the typed schema and renders its events as an ordered timeline (ID · type · tool · status). Proves the whole path end to end — scaffold, typed model, render — on the first slice.
  Why now: Bootstrapping must live in slice one, and getting a real trace onto the screen immediately gives every later slice (detectors, findings, upload) somewhere concrete to land. Also flushes out setup/build/test problems before any feature logic.
  PRD ref: `prd.md > The Core Journey` (steps 1, 3), `prd.md > Execution timeline`
  Spec ref: `spec.md > Stack`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > File Structure`, `spec.md > Data Model` (trace schema), `spec.md > Components` (TimelinePanel, EventRow)
  Build: Scaffold React+Vite+TS with pnpm; add Vitest config; install deps. Create `lib/schema.ts` (Zod trace/event schema + inferred types). Create one inline sample trace, render `App` → `TimelinePanel` → `EventRow` showing event ID/type/tool/status. Apply the dark theme CSS variables (`styles/theme.css`).
  Verify (mechanical): `pnpm install` succeeds; `pnpm build` compiles with no TS errors; `pnpm test` runs (even with a trivial passing test); `pnpm dev` starts with no console errors and the timeline shows the sample's events in order.
  Learner check: Open the app in the browser and confirm you see the sample agent run as an ordered list of events, in the dark instrument styling.
  Commit: `Scaffold app and render trace timeline`

- [x] **2. Validation turns raw JSON into a trusted, normalized model with readable errors**
  Becomes usable: Any JSON (sample or arbitrary) runs through parse → Zod validate → normalize; valid traces render, invalid ones produce specific, human-readable messages (event index/ID, field, expected value, fix). Args are normalized with stable key-sorted stringification.
  Why now: This is the trust foundation — every detector and the report depend on a correct normalized model, and the evidence-first error wording is part of the kernel's honesty. Building and testing it before the detectors means they run on verified data.
  PRD ref: `prd.md > Trace upload and validation`
  Spec ref: `spec.md > Components` (schema.ts, validate.ts, normalize.ts), `spec.md > Algorithms` (Stable JSON normalization), `spec.md > Data Model`
  Build: Implement `lib/validate.ts` (JSON.parse with parse-error capture incl. line/col where available; Zod safeParse; custom error-formatting layer producing per-event messages). Implement `lib/normalize.ts` (assign `index`, keep `id`, compute `argsKey = stableStringify(args)` with recursive key sort / preserved array order / nothing stripped, link results to calls via `call_id`).
  Verify (mechanical): `pnpm test` passes new `tests/validate.test.ts` (malformed JSON message; missing-`status` message; wrong-type message; valid trace passes) and `tests/normalize.test.ts` (key-order independence; array-order sensitivity; no value stripped; call linking).
  Learner check: Not applicable alone (internal); exercised visibly in slice 6 via upload.
  Commit: `Add Zod validation, readable errors, and stable normalization`

- [x] **3. The repeated-tool-call detector (Detector 1) finds possible loops, with tests**
  Becomes usable: Given a normalized trace, Detector 1 emits findings for runs of 3+ consecutive identical tool calls, each citing its event indices, framed as a possible loop (never confirmed).
  Why now: This is half the kernel — the signature "evidence-first loop detection." Pure function first, with its exact resolved rule locked in by tests, before any UI wiring.
  PRD ref: `prd.md > Finding cards`, `prd.md > Resolved Decisions` (repeated-call rule)
  Spec ref: `spec.md > Algorithms` (Detector 1), `spec.md > Data Model` (Finding), `spec.md > Components` (detectors/repeatedCalls.ts)
  Build: Implement `lib/detectors/repeatedCalls.ts` exactly per the resolved rule: consider tool_calls in order, skip tool_results for sequencing, extend run on matching tool_name + argsKey, reset on different tool/args, emit on run length ≥3 (2 emits nothing), two separate runs → two findings. Produce fact/explanation(possible)/fix + eventIndices.
  Verify (mechanical): `pnpm test` passes `tests/repeatedCalls.test.ts`: ≥3 fires; exactly 2 does not; different tool resets; different args resets; interleaved tool_results do not break a run; two separate qualifying runs → two findings.
  Learner check: Not applicable alone (internal); visible in slice 5 findings panel.
  Commit: `Add repeated-tool-call detector with tests`

- [x] **4. The explicit-error detector (Detector 2) finds reported failures, with tests**
  Becomes usable: Detector 2 emits a confirmed-error finding for each `tool_result` with `status: "error"`, citing the result event plus its linked call when `call_id` resolves, and never crashing when it doesn't.
  Why now: Completes the mandatory detector pair — the second half of the kernel. Pure function with guard-case tests before UI.
  PRD ref: `prd.md > Finding cards`
  Spec ref: `spec.md > Algorithms` (Detector 2), `spec.md > Components` (detectors/toolErrors.ts, detectors/index.ts)
  Build: Implement `lib/detectors/toolErrors.ts` (confirmed-error finding, actual message, no invented root cause; cite result + linked call when resolvable, else result only). Implement `lib/detectors/index.ts` to run both detectors over the normalized model.
  Verify (mechanical): `pnpm test` passes `tests/toolErrors.test.ts`: each error result → one finding; resolvable `call_id` cites call+result; unmatched `call_id` cites result only and does not crash.
  Learner check: Not applicable alone (internal); visible in slice 5 findings panel.
  Commit: `Add explicit-error detector with tests`

- [x] **5. Findings appear in the workspace and link to their events**
  Becomes usable: A two-panel workspace — timeline left, findings right. Each finding card shows the four separated parts (fact · evidence · explanation · fix) with certainty labels; clicking a finding highlights its events (distinct from status); clicking an event shows its detail and which findings cite it; a Clean-Run trace shows the explicit empty-findings message.
  Why now: Wires the kernel to the UI — this is the "oh, that's cool" beat (click a finding → it lights up the receipts). The core journey becomes demonstrable here.
  PRD ref: `prd.md > The Core Journey` (steps 4-6), `prd.md > Finding cards`, `prd.md > Execution timeline`, `prd.md > States and Boundaries` (empty findings, selection transitions)
  Spec ref: `spec.md > Components` (FindingsPanel, FindingCard, EmptyFindings, TimelinePanel), `spec.md > Data Model` (selection transitions), `spec.md > Look and Feel`
  Build: Build `FindingsPanel` + `FindingCard` (four parts, certainty labels, inline evidence preview w/ truncate-expand, clickable event refs) and `EmptyFindings`. Add in-memory selection state in `App` with the no-stale-selection transitions; implement highlight (distinct from execution status) and event→findings detail. Expandable event rows in `EventRow`.
  Verify (mechanical): `pnpm build` clean; `pnpm dev` — selecting a finding highlights exactly its cited events; selecting an event lists the findings citing it; the Clean-Run sample shows the empty-findings message with counts; highlight is visually distinct from status.
  Learner check: Open the app, click the repeated-calls finding and watch its events highlight on the timeline; click an error event and see which finding references it; switch to the Clean Run sample and confirm it clearly reports no issues.
  Commit: `Add findings panel, event linking, and empty state`

- [x] **6. Upload, export, the three samples, and responsive polish complete the workflow**
  Becomes usable: The full PoC — header sample selector (Repeated Tool Calls default · Tool Failure · Clean Run), JSON upload with non-destructive inline validation errors, Markdown report export (download primary + copy secondary, cited events only, safely escaped), and a layout that stacks/switches on narrow screens.
  Why now: Closes the end-to-end journey (load → diagnose → export) and brings in the real bundled samples and upload. Last so it builds on a proven detector+findings core.
  PRD ref: `prd.md > The Core Journey` (steps 1-2, 7-8), `prd.md > First screen and samples`, `prd.md > Trace upload and validation`, `prd.md > Markdown report export`, `prd.md > Screens and Layout` (responsiveness)
  Spec ref: `spec.md > Components` (Header, ValidationError, report.ts), `spec.md > Algorithms`, `spec.md > Data Model` (lifecycle: switch sample / valid upload clears selections+expanded+error), `spec.md > Look and Feel`
  Build: Create the three `samples/*.json`; wire the header sample selector (default Repeated Tool Calls). Add upload → parse/validate → replace-only-on-success with `ValidationError` (preserve last valid trace on failure, dismissable). Implement `lib/report.ts` (title+timestamp, source/counts, detector summary, per-finding sections with cited events only, safe escaping, `agenttrace-report-<sanitized-source>-<timestamp>.md`) with download + copy. Add responsive CSS (stack/switch panels without hiding evidence).
  Verify (mechanical): `pnpm test` passes `tests/report.test.ts` (cited-events-only; safe escaping; filename format) and the guard test (a failed upload does not replace the active trace); `pnpm build` clean; `pnpm dev` — switch all three samples (selections/expanded clear); upload an invalid file and confirm the current trace survives with a specific error; upload a valid trace and confirm it replaces the workspace; export downloads a `.md` and copy puts identical content on the clipboard; narrow the window and confirm panels remain usable.
  Learner check: Run the full demo yourself: start on Repeated Tool Calls, read a finding, switch to Tool Failure and Clean Run, upload a bad file (see the trace survive + readable error), then export and open the Markdown report. Confirm nothing required an account, key, or network.
  Commit: `Add samples, upload, Markdown export, and responsive layout`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 5. Learner reviewed the running workspace (two panels, finding cards, bidirectional event linking, empty state) and confirmed the visual design matches the approved PRD; no changes requested.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 6

## Manual Demo Checklist (slice 6)

Agent-verified (via tests / dev server / real report output):
- [x] Three samples load; default is Repeated Tool Calls (`samples.test.ts`).
- [x] Repeated Tool Calls → possible-loop finding; Tool Failure → confirmed-error finding; Clean Run → zero findings / empty state (`samples.test.ts`, `workspace.test.ts`).
- [x] Valid uploaded JSON is accepted and analyzed; malformed JSON → parse error; schema-invalid → specific per-event error; the active trace is retained on failure (`upload.test.ts`, `validate.test.ts`).
- [x] Report content: title, timestamp, source/counts, detector summary, per-finding four parts, cited-events-only, limitations note; safe Markdown escaping; filename `agenttrace-report-<source>-<timestamp>.md` (`report.test.ts` + real Tool Failure report inspected).
- [x] `pnpm build` clean; `pnpm test` 62/62 pass; dev server serves the app with no runtime/network dependency.

Needs the learner's eyes in the browser (visual/interaction):
- [ ] Switch all three samples via the header selector; selections/expanded rows clear on switch.
- [ ] Click a finding → its events highlight (cyan, distinct from status); click an evidence chip → timeline scrolls/selects; click an event → shows citing findings.
- [ ] Download report produces a `.md` file; Copy report shows "Copied!" and yields identical content.
- [ ] Upload a deliberately broken JSON → readable inline error appears, current trace survives; dismiss works.
- [ ] Narrow the window → panels stack without clipping; each panel scrolls independently at wide widths.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded]
Route and stops: [to be recorded]
Edit outcome: [to be recorded]
Reflection: [to be recorded]
Activity mode: [to be recorded]

## Revisions

# AgentTrace Doctor

An evidence-first debugging tool for AI agent execution traces. Load a trace, see
it as a timeline, and get deterministic findings — each one linked to the exact
events that triggered it. No LLM, no API key, no backend, no network: everything
runs locally in the browser.

Built as a proof of concept for the Devpost **Build With AI: Basics** learning
hackathon.

## What it does

- **Loads a trace** — three bundled sample traces, or upload your own JSON. Uploads
  are validated with specific, readable error messages.
- **Shows an execution timeline** — tool calls and results in order, with status
  indicators and expandable detail.
- **Runs two deterministic detectors:**
  - **Repeated tool calls** — flags a *possible loop* when the same tool is called
    3+ times in a row with identical arguments.
  - **Explicit tool errors** — flags a *confirmed error* for any tool result the
    trace reports as failed.
- **Explains every finding with evidence** — each finding separates the observed
  fact, the supporting event IDs, a potential explanation, and a suggested fix.
  Selecting a finding highlights its events on the timeline, and vice versa.
- **Exports a Markdown report** — download or copy, containing the findings and
  their cited events.

An important design choice: findings distinguish **confirmed** facts (a reported
error) from **possible** interpretations (a repeated call *might* be a loop), and
an empty result says so explicitly rather than inventing problems.

## Trace format

A trace is a JSON object with an ordered `events` array. Each event is one of two
types:

```json
{
  "events": [
    { "id": "e1", "type": "tool_call", "tool_name": "get_weather", "args": { "city": "Paris" } },
    { "id": "e2", "type": "tool_result", "tool_name": "get_weather", "status": "ok", "call_id": "e1" },
    { "id": "e3", "type": "tool_result", "tool_name": "book_flight", "status": "error", "error": "PaymentDeclined", "call_id": "e-prev" }
  ]
}
```

| Field | `tool_call` | `tool_result` |
| --- | --- | --- |
| `id` | required, unique | required, unique |
| `type` | `"tool_call"` | `"tool_result"` |
| `tool_name` | required | required |
| `args` | required (object) | — |
| `status` | — | `"ok"` or `"error"` |
| `error` | — | optional message |
| `call_id` | — | optional; references a call's `id` |

## Run it locally

Requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```bash
pnpm install     # install dependencies
pnpm dev         # start the dev server, then open the printed localhost URL
pnpm test        # run the unit test suite
pnpm build       # type-check and produce a production build in dist/
```

No accounts, API keys, or environment variables are needed.

## How it's built

- **React 18 + Vite + TypeScript**, styled with plain CSS variables (no UI
  framework, no external fonts).
- **Zod** for runtime trace validation and type inference from a single schema.
- **Vitest** unit tests covering the pure processing functions (validation,
  normalization, both detectors, report generation, selection).

The processing pipeline is a chain of pure functions, independent of the UI:

```
raw JSON → parse → validate (Zod) → normalize → detect → render
```

```
src/
├── App.tsx              workspace + in-memory state + pipeline wiring
├── components/          Header, TimelinePanel, EventRow, FindingsPanel,
│                        FindingCard, ValidationError, EmptyFindings
├── lib/
│   ├── schema.ts        Zod trace schema + inferred types
│   ├── validate.ts      parse + validate + readable errors
│   ├── normalize.ts     normalized model + stable arg stringify + call linking
│   ├── report.ts        Markdown report generation
│   ├── selection.ts     finding/event selection + highlight derivation
│   └── detectors/       repeatedCalls, toolErrors, index (aggregator)
└── samples/             three bundled sample traces
```

The planning documents for this project (scope, product requirements, technical
spec, build checklist, and an app map) live in [`devpost/`](./devpost).

## License

MIT

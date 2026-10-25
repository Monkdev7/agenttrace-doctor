import { useMemo, useRef, useState } from "react";
import { TimelinePanel } from "./components/TimelinePanel";
import { FindingsPanel } from "./components/FindingsPanel";
import { repeatedToolCallsSample } from "./samples/repeated-tool-calls";
import { normalizeTrace } from "./lib/normalize";
import { runDetectors } from "./lib/detectors";
import {
  NO_SELECTION,
  selectEvent,
  selectFinding,
  highlightedIndices,
  type Selection,
} from "./lib/selection";

/**
 * Top-level workspace. Owns the only mutable state:
 *   - the current trace source (slice 6 will let the user change it)
 *   - the current selection (one finding OR one event, never both)
 *
 * The normalized model, findings, and the highlighted-index set are all DERIVED
 * from those via useMemo, so they can never drift out of sync with the source.
 * (spec.md > Components: App; spec.md > Data Model)
 */
export function App() {
  // In slice 5 the source is fixed to the default sample; slice 6 adds the
  // sample selector and upload. Kept as state now so that wiring is a small step.
  const [trace] = useState(repeatedToolCallsSample);
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);

  const normalized = useMemo(() => normalizeTrace(trace, "Repeated Tool Calls"), [trace]);
  const findings = useMemo(() => runDetectors(normalized), [normalized]);
  const highlighted = useMemo(
    () => highlightedIndices(selection, findings),
    [selection, findings],
  );

  const timelineRef = useRef<HTMLDivElement>(null);

  // Clicking an evidence event id jumps the timeline to that row and selects it.
  function goToEvent(index: number) {
    setSelection(selectEvent(index));
    const row = timelineRef.current?.querySelector<HTMLElement>(
      `[data-event-index="${index}"]`,
    );
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">AgentTrace Doctor</h1>
        <span className="app__subtitle">evidence-first agent trace debugging</span>
      </header>
      <main className="app__workspace">
        <section className="app__panel app__panel--timeline" ref={timelineRef}>
          <TimelinePanel
            trace={normalized}
            highlighted={highlighted}
            selectedEventIndex={selection.kind === "event" ? selection.index : null}
            onSelectEvent={(index) => setSelection(selectEvent(index))}
          />
        </section>
        <section className="app__panel app__panel--findings">
          <FindingsPanel
            trace={normalized}
            findings={findings}
            selection={selection}
            onSelectFinding={(id) => setSelection(selectFinding(id))}
            onGoToEvent={goToEvent}
          />
        </section>
      </main>
    </div>
  );
}

import { useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { TimelinePanel } from "./components/TimelinePanel";
import { FindingsPanel } from "./components/FindingsPanel";
import { ValidationError } from "./components/ValidationError";
import { SAMPLES, DEFAULT_SAMPLE } from "./samples";
import { normalizeTrace, type NormalizedTrace } from "./lib/normalize";
import { runDetectors } from "./lib/detectors";
import { validateTrace, type ValidationError as ValidationErrorData } from "./lib/validate";
import { generateReport, reportFilename } from "./lib/report";
import { downloadTextFile, copyToClipboard } from "./lib/download";
import {
  NO_SELECTION,
  selectEvent,
  selectFinding,
  highlightedIndices,
  type Selection,
} from "./lib/selection";

/**
 * Top-level workspace and the single owner of mutable state:
 *   - `normalized`: the active trace (a sample or a successful upload)
 *   - `activeSampleId`: which sample is selected, or null after an upload
 *   - `selection`: one finding OR one event, never both
 *   - `validationError`: an inline upload error, shown WITHOUT replacing the trace
 *
 * findings and the highlight set are derived from `normalized`/`selection`.
 * Loading a new trace (sample switch or valid upload) clears selection and any
 * error; a FAILED upload changes none of the trace state.
 * (spec.md > Data Model: lifecycle)
 */
export function App() {
  const [normalized, setNormalized] = useState<NormalizedTrace>(() =>
    normalizeTrace(DEFAULT_SAMPLE.trace, DEFAULT_SAMPLE.name),
  );
  const [activeSampleId, setActiveSampleId] = useState<string | null>(DEFAULT_SAMPLE.id);
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const [validationError, setValidationError] = useState<ValidationErrorData | null>(null);

  const findings = useMemo(() => runDetectors(normalized), [normalized]);
  const highlighted = useMemo(
    () => highlightedIndices(selection, findings),
    [selection, findings],
  );

  const timelineRef = useRef<HTMLDivElement>(null);

  // Loading a new trace resets selection + clears any error. Used by both
  // sample-switch and successful-upload paths.
  function loadTrace(trace: NormalizedTrace, sampleId: string | null) {
    setNormalized(trace);
    setActiveSampleId(sampleId);
    setSelection(NO_SELECTION);
    setValidationError(null);
  }

  function selectSample(id: string) {
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    loadTrace(normalizeTrace(sample.trace, sample.name), sample.id);
  }

  async function uploadFile(file: File) {
    const text = await file.text();
    const result = validateTrace(text);
    if (!result.ok) {
      // Failed upload: show the error, preserve the active trace + findings.
      setValidationError(result.error);
      return;
    }
    const source = file.name.replace(/\.json$/i, "") || "uploaded-trace";
    loadTrace(normalizeTrace(result.trace, source), null);
  }

  function goToEvent(index: number) {
    setSelection(selectEvent(index));
    timelineRef.current
      ?.querySelector<HTMLElement>(`[data-event-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function reportText() {
    return generateReport(normalized, findings, new Date());
  }

  function downloadReport() {
    downloadTextFile(reportText(), reportFilename(normalized.source, new Date()));
  }

  return (
    <div className="app">
      <Header
        activeSampleId={activeSampleId}
        onSelectSample={selectSample}
        onUploadFile={uploadFile}
        onDownloadReport={downloadReport}
        onCopyReport={() => copyToClipboard(reportText())}
      />
      {validationError && (
        <ValidationError error={validationError} onDismiss={() => setValidationError(null)} />
      )}
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

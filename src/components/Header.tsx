import { useRef, useState } from "react";
import { SAMPLES } from "../samples";

/**
 * The header: product title, sample selector, Upload JSON, and Export (download
 * primary + copy secondary). It owns no app state; it reports user intent up to
 * App via callbacks. (spec.md > Components: Header)
 */
export function Header({
  activeSampleId,
  onSelectSample,
  onUploadFile,
  onDownloadReport,
  onCopyReport,
}: {
  activeSampleId: string | null;
  onSelectSample: (id: string) => void;
  onUploadFile: (file: File) => void;
  onDownloadReport: () => void;
  onCopyReport: () => Promise<boolean>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");

  async function handleCopy() {
    const ok = await onCopyReport();
    setCopyState(ok ? "ok" : "fail");
    setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <header className="app__header">
      <div className="app__brand">
        <span className="app__mark" aria-hidden="true">
          {/* Compact product mark: a pulse/trace line inside a rounded tile. */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 13h3.2l2-6 3.4 11 2.6-7 1.5 2h5.3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="app__brandtext">
          <h1 className="app__title">AgentTrace Doctor</h1>
          <span className="app__subtitle">evidence-first agent trace debugging</span>
        </div>
        <span className="app__trust" title="All analysis runs locally in your browser">
          Local analysis · No API key
        </span>
      </div>

      <div className="app__controls">
        <label className="control">
          <span className="control__label">Sample</span>
          <select
            className="control__select"
            value={activeSampleId ?? ""}
            onChange={(e) => onSelectSample(e.target.value)}
          >
            {SAMPLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {activeSampleId === null && <option value="">Uploaded trace</option>}
          </select>
        </label>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
            e.target.value = ""; // allow re-uploading the same filename
          }}
        />
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Upload JSON
        </button>

        <span className="app__controls-divider" aria-hidden="true" />

        <button type="button" className="btn btn--primary" onClick={onDownloadReport}>
          Download report
        </button>
        <button type="button" className="btn" onClick={handleCopy}>
          {copyState === "ok" ? "Copied!" : copyState === "fail" ? "Copy failed" : "Copy report"}
        </button>
      </div>
    </header>
  );
}

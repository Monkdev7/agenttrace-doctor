import { TimelinePanel } from "./components/TimelinePanel";
import { repeatedToolCallsSample } from "./samples/repeated-tool-calls";

/**
 * Top-level workspace. For slice 1 it simply renders the default sample trace
 * as a timeline. Later slices add validation, detectors, findings, and upload.
 * (spec.md > Components: App)
 */
export function App() {
  const trace = repeatedToolCallsSample;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">AgentTrace Doctor</h1>
        <span className="app__subtitle">evidence-first agent trace debugging</span>
      </header>
      <main className="app__body">
        <TimelinePanel trace={trace} />
      </main>
    </div>
  );
}

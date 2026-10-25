/**
 * Browser-side side effects for export. Kept separate from the pure report
 * generator so the report CONTENT stays unit-testable without a DOM. Both
 * actions use the identical report string. No network, no backend.
 */

/** Trigger a local file download of `content` as `filename`. */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Copy `content` to the clipboard; resolves to whether it succeeded. */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}

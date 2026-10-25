import type { ValidationError as ValidationErrorData } from "../lib/validate";

/**
 * Inline, dismissable error region shown when an upload fails. It NEVER replaces
 * the workspace — the previously valid trace and findings remain visible behind
 * it. Lists the specific per-event problems from the validator.
 * (prd.md > Trace upload and validation)
 */
export function ValidationError({
  error,
  onDismiss,
}: {
  error: ValidationErrorData;
  onDismiss: () => void;
}) {
  return (
    <div className="validation-error" role="alert">
      <div className="validation-error__head">
        <span className="validation-error__summary">{error.summary}</span>
        <button type="button" className="validation-error__close" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
      <ul className="validation-error__details">
        {error.details.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      <p className="validation-error__note">Your current trace is unchanged.</p>
    </div>
  );
}

import { useId } from 'react';

export function Input({ label, hint, error, id, className = '', ...props }) {
  const generatedId = useId();
  const inputId = id || props.name || `field-${generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${className}`.trim()}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        className={`text-input ${error ? 'input-error' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? <span className="field-error" id={errorId} role="alert">{error}</span> : hint ? <span className="field-hint" id={hintId}>{hint}</span> : null}
    </div>
  );
}

export function Select({ label, hint, id, options = [], className = '', ...props }) {
  const generatedId = useId();
  const selectId = id || props.name || `select-${generatedId}`;
  const hintId = `${selectId}-hint`;

  return (
    <div className={`field ${className}`.trim()}>
      {label && <label htmlFor={selectId}>{label}</label>}
      <select id={selectId} className="select-input" aria-describedby={hint ? hintId : undefined} {...props}>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
    </div>
  );
}

/**
 * components/ui/Field.jsx — labelled form controls.
 *
 * Every control wires up its own label, description, and error message via
 * `aria-describedby` / `aria-invalid`, so validation errors are announced rather
 * than only shown in red (design.md § 1 — accessibility).
 */
import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

function FieldShell({ id, label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="hh-label">
          {label}
          {required && (
            <span className="ml-0.5 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id, { error, hint }) =>
  [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(' ') ||
  undefined;

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required,
    className = '',
    wrapperClassName = '',
    id: providedId,
    endAdornment,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className={endAdornment ? 'relative' : undefined}>
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className={`hh-input ${endAdornment ? 'pr-11' : ''} ${error ? 'border-error focus:border-error focus:ring-error/30' : ''} ${className}`}
          {...props}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</span>
        )}
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    required,
    rows = 4,
    className = '',
    wrapperClassName = '',
    id: providedId,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, { error, hint })}
        className={`hh-input resize-y leading-relaxed ${error ? 'border-error focus:border-error focus:ring-error/30' : ''} ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required,
    options = [],
    placeholder,
    className = '',
    wrapperClassName = '',
    id: providedId,
    children,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className={`hh-input hh-select appearance-none pr-10 transition-shadow hover:border-line-strong focus:shadow-[0_0_0_4px_rgb(var(--color-primary-glow)/0.12)] ${error ? 'border-error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle transition-colors"
          strokeWidth={2}
        />
      </div>
    </FieldShell>
  );
});

export const Checkbox = forwardRef(function Checkbox(
  { label, hint, error, className = '', id: providedId, ...props },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-describedby={describedBy(id, { error, hint })}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-2 focus:ring-primary/40"
          {...props}
        />
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="ml-6.5 mt-1 pl-0.5 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;

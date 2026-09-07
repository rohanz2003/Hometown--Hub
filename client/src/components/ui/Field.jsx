/**
 * components/ui/Field.jsx — labelled form controls.
 *
 * Every control wires up its own label, description, and error message via
 * `aria-describedby` / `aria-invalid`, so validation errors are announced rather
 * than only shown in red (design.md § 1 — accessibility).
 */
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
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
  const menuRef = useRef(null);
  const initialValue = props.value ?? props.defaultValue ?? '';
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const displayLabel = selectedOption?.label || placeholder || 'Select an option';

  useEffect(() => {
    if (props.value !== undefined) setSelectedValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const chooseOption = (value) => {
    setSelectedValue(value);
    setOpen(false);
    props.onChange?.({ target: { name: props.name, value } });
  };

  const { value, defaultValue, onChange, onBlur, name, disabled, ...selectProps } = props;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div ref={menuRef} className="relative">
        <select
          ref={ref}
          id={id}
          name={name}
          value={selectedValue}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, { error, hint })}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          {...selectProps}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <button
          type="button"
          id={`${id}-trigger`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          className={`hh-input hh-select flex items-center justify-between gap-3 text-left transition-shadow hover:border-line-strong focus:shadow-[0_0_0_4px_rgb(var(--color-primary-glow)/0.12)] ${!selectedOption ? 'text-ink-subtle' : ''} ${error ? 'border-error' : ''} ${className}`}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-ink-subtle transition-transform ${open ? 'rotate-180 text-primary' : ''}`}
            strokeWidth={2}
          />
        </button>
        {open && (
          <div
            id={`${id}-options`}
            role="listbox"
            aria-label={label || 'Options'}
            className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop-lg animate-scale-in hh-scroll-thin"
          >
            {placeholder && (
              <button
                type="button"
                role="option"
                aria-selected={selectedValue === ''}
                onClick={() => chooseOption('')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary-soft ${selectedValue === '' ? 'bg-primary-soft font-medium text-primary' : 'text-ink-muted'}`}
              >
                {placeholder}
                {selectedValue === '' && <span aria-hidden="true">✓</span>}
              </button>
            )}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedValue === option.value}
                onClick={() => chooseOption(option.value)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary-soft ${selectedValue === option.value ? 'bg-primary-soft font-medium text-primary' : 'text-ink-muted'}`}
              >
                <span className="truncate">{option.label}</span>
                {selectedValue === option.value && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}
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

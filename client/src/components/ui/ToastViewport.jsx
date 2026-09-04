/**
 * components/ui/ToastViewport.jsx — renders the toast stack.
 *
 * Uses an aria-live region so messages are announced without stealing focus.
 */
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';

const TONES = {
  info: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-error',
};

const ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '⚠️' };

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-lg border border-line border-l-4 bg-surface px-4 py-3 shadow-pop ${
            TONES[toast.tone] || TONES.info
          }`}
        >
          <span aria-hidden="true" className="mt-0.5 text-base">
            {ICONS[toast.tone] || ICONS.info}
          </span>
          <div className="min-w-0 flex-1">
            {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
            <p className="text-sm text-ink-muted">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="-mr-1 -mt-1 rounded p-1 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

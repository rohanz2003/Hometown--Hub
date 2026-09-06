/**
 * components/ui/ToastViewport.jsx — renders the toast stack with professional icons.
 *
 * Uses an aria-live region so messages are announced without stealing focus.
 */
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';

const TONES = {
  info: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-error',
};

const ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const ICON_COLORS = {
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:items-end"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone] || ICONS.info;
        const iconColor = ICON_COLORS[toast.tone] || ICON_COLORS.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-lg border border-line border-l-4 bg-surface px-4 py-3 shadow-pop ${
              TONES[toast.tone] || TONES.info
            }`}
          >
            <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`} strokeWidth={2} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {toast.title && <p className="text-sm font-semibold text-ink">{toast.title}</p>}
              <p className="text-sm text-ink-muted">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 rounded p-1 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
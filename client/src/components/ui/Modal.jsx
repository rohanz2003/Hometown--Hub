/**
 * components/ui/Modal.jsx — accessible dialog with professional styling.
 *
 * Traps focus, closes on Escape or backdrop click, restores focus to whatever
 * opened it, and locks background scrolling.
 */
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[90vw]' };

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  closeOnBackdrop = true,
  className = '',
}) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      // Keep Tab cycling inside the dialog.
      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog once it has rendered.
    const timer = setTimeout(() => {
      const target = panelRef.current?.querySelector(FOCUSABLE) || panelRef.current;
      target?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-0 animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
        className={`hh-card-elevated w-full animate-scale-in rounded-card shadow-modal ${SIZES[size] || SIZES.md} ${className}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 hh-scroll-thin sm:px-5">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
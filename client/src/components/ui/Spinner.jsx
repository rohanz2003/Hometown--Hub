/**
 * components/ui/Spinner.jsx — inline loading indicator.
 */
const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-9 w-9 border-[3px]' };

export default function Spinner({ size = 'md', className = '', label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        SIZES[size] || SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

/** Full-panel loading state for a page or card body. */
export function LoadingPanel({ label = 'Loading', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-ink-subtle ${className}`}
    >
      <Spinner size="lg" label={label} />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

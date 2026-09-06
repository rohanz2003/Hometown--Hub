/**
 * components/ui/Spinner.jsx — inline loading indicator with professional styling.
 */
const SIZES = {
  xs: 'h-3 w-3 border-1.5',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-3',
};

export default function Spinner({ size = 'md', className = '', label = 'Loading', color = 'primary' }) {
  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    accent: 'border-accent border-t-transparent',
    white: 'border-white border-t-transparent',
    ink: 'border-ink border-t-transparent',
  };

  return (
    <span
      role="status"
      aria-label={label}
      className={[
        'inline-block animate-spin rounded-full',
        colorClasses[color] || colorClasses.primary,
        SIZES[size] || SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

/** Full-panel loading state for a page or card body. */
export function LoadingPanel({ label = 'Loading', className = '', size = 'md' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-ink-muted ${className}`}
    >
      <Spinner size={size} label={label} />
      <p className="text-sm font-medium">{label}…</p>
    </div>
  );
}

/** Skeleton loader for content placeholders */
export function Skeleton({ className = '', variant = 'text', width, height }) {
  const baseClasses = 'animate-pulse bg-surface-muted rounded';
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.text} ${className}`}
      style={{ width, height }}
    />
  );
}

/** Skeleton text lines */
export function SkeletonText({ lines = 3, className = '', lineHeight = 'h-4' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} variant="text" className={lineHeight} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
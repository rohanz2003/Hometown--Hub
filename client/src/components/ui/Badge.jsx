/**
 * components/ui/Badge.jsx — small status/label pill with professional styling.
 */
const TONES = {
  muted: 'bg-surface-muted text-ink-muted border border-line',
  primary: 'bg-primary-soft text-primary border border-primary/20',
  secondary: 'bg-secondary-soft text-secondary border border-secondary/20',
  accent: 'bg-accent-soft text-accent border border-accent/20',
  success: 'bg-success-soft text-success border border-success/20',
  warning: 'bg-warning-soft text-warning border border-warning/20',
  error: 'bg-error-soft text-error border border-error/20',
  outline: 'bg-transparent text-ink-muted border border-line hover:bg-surface-hover',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1',
  lg: 'px-3 py-1 text-sm gap-1.5',
};

export default function Badge({
  tone = 'muted',
  size = 'md',
  className = '',
  children,
  dot = false,
  dotColor,
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full transition-colors',
        TONES[tone] || TONES.muted,
        SIZES[size] || SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={dotColor ? { backgroundColor: dotColor } : {}}
        />
      )}
      {children}
    </span>
  );
}
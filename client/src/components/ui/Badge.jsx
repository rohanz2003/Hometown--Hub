/**
 * components/ui/Badge.jsx — small status/label pill.
 */
const TONES = {
  muted: 'bg-surface-muted text-ink-muted',
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-[rgb(var(--color-text))]',
  error: 'bg-error-soft text-error',
};

export default function Badge({ tone = 'muted', className = '', children, ...props }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone] || TONES.muted,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * components/ui/StatCard.jsx — single-number KPI tile.
 *
 * A lone count is a headline, not a chart. The number wears a text token (never a
 * series colour); the small icon beside it carries the category.
 */
import { Link } from 'react-router-dom';
import { formatCount } from '../../utils/format';

const ACCENTS = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  accent: 'bg-accent-soft text-accent',
  muted: 'bg-surface-muted text-ink-muted',
};

export default function StatCard({
  label,
  value,
  icon,
  hint,
  to,
  accent = 'primary',
  className = '',
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {icon && (
          <span
            aria-hidden="true"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base ${ACCENTS[accent] || ACCENTS.primary}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{formatCount(value)}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`hh-card block px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-surface-muted ${className}`}
      >
        {body}
      </Link>
    );
  }

  return <div className={`hh-card px-4 py-3.5 ${className}`}>{body}</div>;
}

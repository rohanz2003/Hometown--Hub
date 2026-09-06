/**
 * components/ui/StatCard.jsx — single-number KPI tile with professional icons.
 *
 * A lone count is a headline, not a chart. The number wears a text token (never a
 * series colour); the small icon beside it carries the category.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCount } from '../../utils/format';

const ACCENTS = {
  primary: 'bg-primary-soft text-primary',
  secondary: 'bg-secondary-soft text-secondary',
  accent: 'bg-accent-soft text-accent',
  muted: 'bg-surface-muted text-ink-muted',
};

function IconWrapper({ icon, accent }) {
  if (!icon) return null;
  const Icon = icon;
  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base ${ACCENTS[accent] || ACCENTS.primary}`}
    >
      {React.isValidElement(icon) ? icon : <Icon className="h-5 w-5" strokeWidth={2} />}
    </span>
  );
}

export default function StatCard({
  label,
  value,
  icon,
  hint,
  to,
  accent = 'primary',
  className = '',
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <IconWrapper icon={icon} accent={accent} />
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
        {content}
      </Link>
    );
  }

  return <div className={`hh-card px-4 py-3.5 ${className}`}>{content}</div>;
}
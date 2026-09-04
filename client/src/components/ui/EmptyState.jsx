/**
 * components/ui/EmptyState.jsx — placeholder for an empty list.
 *
 * An empty list always explains itself and offers the next action, rather than
 * leaving a blank panel (rules.md § Error handling).
 */
import Button from './Button';

export default function EmptyState({ icon = '🏘️', title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <span className="mb-3 text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Error counterpart with a retry affordance. */
export function ErrorState({ error, onRetry, className = '' }) {
  const message = error?.message || 'Something went wrong.';
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <span className="mb-3 text-4xl" aria-hidden="true">
        ⚠️
      </span>
      <h3 className="text-lg font-semibold">We couldn&apos;t load this</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

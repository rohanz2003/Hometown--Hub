/**
 * components/ui/EmptyState.jsx — placeholder for an empty list with professional icons.
 *
 * An empty list always explains itself and offers the next action, rather than
 * leaving a blank panel.
 */
import Button from './Button';
import { Users, Search, Calendar, Bell, FileText, MessageSquare, Shield, User, Settings, BarChart2 } from 'lucide-react';

const ICON_MAP = {
  users: Users,
  search: Search,
  calendar: Calendar,
  bell: Bell,
  file: FileText,
  message: MessageSquare,
  shield: Shield,
  user: User,
  settings: Settings,
  chart: BarChart2,
};

export default function EmptyState({
  icon = 'users',
  title,
  description,
  action,
  className = '',
  iconSize = 'xl',
}) {
  const Icon = ICON_MAP[icon] || ICON_MAP.users;
  const sizeMap = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16', xl: 'h-20 w-20' };

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <Icon
        aria-hidden="true"
        className={`mb-4 text-surface-muted/60 ${sizeMap[iconSize] || sizeMap.xl}`}
        strokeWidth={1.5}
      />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
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
      <AlertTriangle
        aria-hidden="true"
        className="mb-4 h-16 w-16 text-warning/60"
        strokeWidth={1.5}
      />
      <h3 className="text-lg font-semibold text-ink">We couldn&apos;t load this</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
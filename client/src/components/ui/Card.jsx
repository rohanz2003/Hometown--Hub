/**
 * components/ui/Card.jsx — the surface every panel in the app sits on.
 * Professional card with refined shadows and borders.
 */
export default function Card({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={`hh-card ${className}`} {...props}>
      {children}
    </Component>
  );
}

/** Optional header row with a title, description, and trailing actions. */
export function CardHeader({ title, description, actions, className = '', children }) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5 ${className}`}
    >
      <div className="min-w-0">
        {title && <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>}
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`px-4 py-4 sm:px-5 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 sm:px-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** Elevated card for modals, dropdowns, popovers */
export function ElevatedCard({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={`hh-card-elevated ${className}`} {...props}>
      {children}
    </Component>
  );
}
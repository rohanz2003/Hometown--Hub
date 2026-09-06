/**
 * components/ui/Avatar.jsx — user avatar with an initials fallback.
 * Professional styling with better fallbacks and status indicators.
 */
import { initials, mediaUrl } from '../../utils/format';

const SIZES = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-xl',
};

const RING_SIZES = {
  xs: 'ring-1.5',
  sm: 'ring-2',
  md: 'ring-2',
  lg: 'ring-2',
  xl: 'ring-2',
  '2xl': 'ring-2',
};

export default function Avatar({
  name = '',
  src = '',
  size = 'md',
  className = '',
  status, // 'online' | 'offline' | 'busy' | 'away'
  ring = false,
  ...props
}) {
  const classes = [
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    'bg-primary-soft font-semibold text-primary',
    SIZES[size] || SIZES.md,
    ring && 'ring ring-surface',
    RING_SIZES[size] || RING_SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-surface-muted',
    busy: 'bg-error',
    away: 'bg-warning',
  };

  const statusSizes = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
    xl: 'h-4 w-4',
    '2xl': 'h-5 w-5',
  };

  if (src) {
    return (
      <span className="relative inline-flex" {...props}>
        <img
          src={mediaUrl(src)}
          alt={name ? `${name}'s profile photo` : 'Profile photo'}
          loading="lazy"
          className={classes}
        />
        {status && (
          <span
            className={[
              'absolute bottom-0 right-0 rounded-full border-2 border-surface',
              statusColors[status] || statusColors.offline,
              statusSizes[size] || statusSizes.md,
            ].join(' ')}
            aria-label={status}
          />
        )}
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden="true" title={name || undefined} {...props}>
      {initials(name)}
    </span>
  );
}

/** Avatar group for stacked avatars */
export function AvatarGroup({ children, max = 4, size = 'md', className = '', ...props }) {
  const kids = Array.isArray(children) ? children : [children];
  const visible = kids.slice(0, max);
  const remaining = kids.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`} {...props}>
      {visible.map((child, index) => (
        <span key={child?.key ?? child?.props?.key ?? index} className="relative z-[auto]">
          {child}
        </span>
      ))}
      {remaining > 0 && (
        <span
          className={[
            'inline-flex shrink-0 items-center justify-center rounded-full',
            'bg-surface-muted text-ink-muted font-medium border-2 border-surface',
            SIZES[size] || SIZES.md,
          ].join(' ')}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

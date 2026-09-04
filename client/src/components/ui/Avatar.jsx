/**
 * components/ui/Avatar.jsx — user avatar with an initials fallback.
 */
import { initials, mediaUrl } from '../../utils/format';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export default function Avatar({ name = '', src = '', size = 'md', className = '' }) {
  const classes = [
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    'bg-primary-soft font-semibold text-primary',
    SIZES[size] || SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (src) {
    return (
      <img
        src={mediaUrl(src)}
        // The name is the meaningful description of a profile photo.
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        loading="lazy"
        className={classes}
      />
    );
  }

  return (
    <span className={classes} aria-hidden="true" title={name || undefined}>
      {initials(name)}
    </span>
  );
}

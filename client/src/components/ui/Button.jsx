/**
 * components/ui/Button.jsx — the one button used everywhere.
 *
 * Reusing this instead of ad-hoc classes keeps focus rings, disabled states, and
 * touch targets consistent. Professional variants with refined styling.
 */
import { forwardRef } from 'react';
import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-primary-glow text-white hover:bg-primary-glow/90 active:bg-primary-glow/80 shadow-sm',
  secondary:
    'bg-secondary-glow text-white hover:bg-secondary-glow/90 active:bg-secondary-glow/80 shadow-sm',
  accent: 'bg-accent-glow text-white hover:bg-accent-glow/90 active:bg-accent-glow/80 shadow-sm',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-hover active:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-hover hover:text-ink active:bg-surface-muted',
  danger: 'bg-error-glow text-white hover:bg-error-glow/90 active:bg-error-glow/80 shadow-sm',
  soft: 'bg-primary-soft text-primary hover:bg-primary-soft/80 active:bg-primary-soft',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-lg gap-2',
  icon: 'h-10 w-10 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
  'icon-lg': 'h-12 w-12 justify-center',
};

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    children,
    type,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  const loadingLabel = isLoading
    ? typeof children === 'string'
      ? children
      : 'Loading'
    : undefined;

  return (
    <Component
      ref={ref}
      // Only real <button> elements take a type or the disabled attribute.
      {...(Component === 'button' ? { type: type || 'button', disabled: isDisabled } : {})}
      aria-busy={isLoading || undefined}
      aria-disabled={isDisabled || undefined}
      aria-label={loadingLabel}
      className={[
        'inline-flex items-center justify-center rounded-button font-medium transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-primary-glow focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'active:scale-[0.98]',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="shrink-0" />}
      {!isLoading && children}
    </Component>
  );
});

export default Button;

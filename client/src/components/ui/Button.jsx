/**
 * components/ui/Button.jsx — the one button used everywhere.
 *
 * Reusing this instead of ad-hoc classes keeps focus rings, disabled states, and
 * touch targets consistent (design.md § 1).
 */
import { forwardRef } from 'react';
import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary: 'bg-secondary text-white hover:brightness-95 shadow-sm',
  accent: 'bg-accent text-white hover:brightness-95 shadow-sm',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger: 'bg-error text-white hover:brightness-95 shadow-sm',
  soft: 'bg-primary-soft text-primary hover:brightness-95',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-lg gap-2',
  icon: 'h-10 w-10 justify-center',
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

  return (
    <Component
      ref={ref}
      // Only real <button> elements take a type or the disabled attribute.
      {...(Component === 'button' ? { type: type || 'button', disabled: isDisabled } : {})}
      aria-busy={isLoading || undefined}
      aria-disabled={isDisabled || undefined}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:opacity-60',
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
      {children}
    </Component>
  );
});

export default Button;

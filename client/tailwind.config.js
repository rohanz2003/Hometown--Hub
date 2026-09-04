/**
 * tailwind.config.js — the design system from design.md, expressed as tokens.
 *
 * Colors resolve to CSS variables (defined in `src/styles/index.css`) so light
 * and dark themes are a single class on <html> rather than two sets of classes.
 */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withAlpha('--color-primary'),
          hover: withAlpha('--color-primary-hover'),
          soft: withAlpha('--color-primary-soft'),
        },
        secondary: {
          DEFAULT: withAlpha('--color-secondary'),
          soft: withAlpha('--color-secondary-soft'),
        },
        accent: {
          DEFAULT: withAlpha('--color-accent'),
          soft: withAlpha('--color-accent-soft'),
        },
        canvas: withAlpha('--color-background'),
        surface: {
          DEFAULT: withAlpha('--color-surface'),
          muted: withAlpha('--color-surface-muted'),
        },
        ink: {
          DEFAULT: withAlpha('--color-text'),
          muted: withAlpha('--color-text-muted'),
          subtle: withAlpha('--color-text-subtle'),
        },
        line: withAlpha('--color-border'),
        success: { DEFAULT: withAlpha('--color-success'), soft: withAlpha('--color-success-soft') },
        warning: { DEFAULT: withAlpha('--color-warning'), soft: withAlpha('--color-warning-soft') },
        error: { DEFAULT: withAlpha('--color-error'), soft: withAlpha('--color-error-soft') },
        // Chart series — validated per theme, see src/styles/index.css
        chart: {
          1: withAlpha('--color-chart-1'),
          2: withAlpha('--color-chart-2'),
          grid: withAlpha('--color-chart-grid'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Mobile-first type scale: 15px body with a 1.5 line height (design.md § 3)
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.8125rem', { lineHeight: '1.5' }],
        base: ['0.9375rem', { lineHeight: '1.6' }],
        lg: ['1.0625rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
      },
      borderRadius: { card: '0.875rem' },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.05)',
        pop: '0 8px 30px rgb(15 23 42 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 180ms ease-out',
      },
    },
  },
  plugins: [],
};

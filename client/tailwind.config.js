/**
 * tailwind.config.js — the professional design system expressed as tokens.
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
          glow: withAlpha('--color-primary-glow'),
        },
        secondary: {
          DEFAULT: withAlpha('--color-secondary'),
          soft: withAlpha('--color-secondary-soft'),
          glow: withAlpha('--color-secondary-glow'),
        },
        accent: {
          DEFAULT: withAlpha('--color-accent'),
          soft: withAlpha('--color-accent-soft'),
          glow: withAlpha('--color-accent-glow'),
        },
        canvas: withAlpha('--color-background'),
        surface: {
          DEFAULT: withAlpha('--color-surface'),
          muted: withAlpha('--color-surface-muted'),
          hover: withAlpha('--color-surface-hover'),
        },
        ink: {
          DEFAULT: withAlpha('--color-text'),
          muted: withAlpha('--color-text-muted'),
          subtle: withAlpha('--color-text-subtle'),
          inverse: withAlpha('--color-text-inverse'),
        },
        line: withAlpha('--color-border'),
        'line-strong': withAlpha('--color-border-strong'),
        success: { DEFAULT: withAlpha('--color-success'), soft: withAlpha('--color-success-soft') },
        warning: { DEFAULT: withAlpha('--color-warning'), soft: withAlpha('--color-warning-soft') },
        error: {
          DEFAULT: withAlpha('--color-error'),
          soft: withAlpha('--color-error-soft'),
          glow: withAlpha('--color-error-glow'),
        },
        chart: {
          1: withAlpha('--color-chart-1'),
          2: withAlpha('--color-chart-2'),
          grid: withAlpha('--color-chart-grid'),
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // Mobile-first type scale with improved hierarchy
        '2xs': ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        xs: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        sm: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        base: ['0.9375rem', { lineHeight: '1.6', letterSpacing: '0' }],
        lg: ['1.0625rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        card: '0.75rem', // 12px
        'card-lg': '1rem', // 16px
        input: '0.625rem', // 10px
        button: '0.5rem', // 8px
      },
      spacing: {
        18: '4.5rem', // 72px
        22: '5.5rem', // 88px
        30: '7.5rem', // 120px
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.03), 0 1px 3px 1px rgb(15 23 42 / 0.05)',
        'card-hover': '0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        pop: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04)',
        'pop-lg': '0 20px 25px -5px rgb(15 23 42 / 0.1), 0 8px 10px -6px rgb(15 23 42 / 0.04)',
        modal: '0 25px 50px -12px rgb(15 23 42 / 0.15)',
        glow: '0 0 20px rgb(59 130 246 / 0.15)',
        'glow-lg': '0 0 40px rgb(59 130 246 / 0.1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 180ms ease-out',
        'slide-down': 'slide-down 180ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        shimmer: 'shimmer 2s infinite linear',
      },
      transitionDuration: {
        0: '0ms',
        75: '75ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

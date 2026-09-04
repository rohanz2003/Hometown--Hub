/**
 * components/ui/Tabs.jsx — keyboard-navigable tab strip.
 *
 * Implements the ARIA tabs pattern: only the selected tab is in the tab order,
 * arrow keys move between tabs, and Home/End jump to the ends.
 */
import { useRef } from 'react';

export default function Tabs({ tabs, value, onChange, className = '', label = 'Sections' }) {
  const refs = useRef([]);

  const handleKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    const keys = { ArrowRight: 1, ArrowLeft: -1 };

    let next = null;
    if (event.key in keys) next = (index + keys[event.key] + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;

    event.preventDefault();
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex gap-1 overflow-x-auto border-b border-line hh-scroll-thin ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.value}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={handleKeyDown}
            className={[
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:border-line hover:text-ink',
            ].join(' ')}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-xs text-ink-muted">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Panel that pairs with a tab of the same `value`. */
export function TabPanel({ value, active, children, className = '' }) {
  if (value !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}

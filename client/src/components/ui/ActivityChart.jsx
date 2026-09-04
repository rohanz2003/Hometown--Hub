/**
 * components/ui/ActivityChart.jsx — 14-day community activity (Phase 2).
 *
 * Grouped bars: counts in discrete daily buckets, and the point of the panel is
 * comparing posts against events, so grouping beats stacking.
 *
 * Colour: blue + orange, not the brand blue + green — the blue/green pair scores
 * ΔE 7 under tritanopia while blue/orange scores 29.7. Both themes' steps were
 * validated separately (see `src/styles/index.css`).
 *
 * Identity is never carried by colour alone: a legend is always present, each bar
 * has a hover/focus tooltip naming its series, and a table view holds the values.
 */
import { useId, useMemo, useState } from 'react';

const SERIES = [
  { key: 'posts', label: 'Posts', className: 'fill-chart-1' },
  { key: 'events', label: 'Events', className: 'fill-chart-2' },
];

/** Nice round axis maximum so gridlines land on whole numbers. */
function axisMax(values) {
  const peak = Math.max(1, ...values);
  const step = peak <= 5 ? 1 : peak <= 20 ? 5 : peak <= 50 ? 10 : 25;
  return Math.ceil(peak / step) * step;
}

const weekdayLabel = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });

const fullDateLabel = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

export default function ActivityChart({ data = [], className = '' }) {
  const [showTable, setShowTable] = useState(false);
  const [hovered, setHovered] = useState(null);
  const titleId = useId();

  const max = useMemo(() => axisMax(data.flatMap((d) => [d.posts, d.events])), [data]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.posts + d.events, 0), [data]);

  if (data.length === 0) return null;

  // Geometry in a fixed viewBox; the SVG scales to its container.
  const width = 100;
  const height = 34;
  const groupWidth = width / data.length;
  const gap = 0.55; // 2px-equivalent surface gap between the paired bars
  const barWidth = Math.max(1.4, groupWidth / 2 - gap);

  return (
    <figure className={`m-0 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <figcaption id={titleId} className="text-sm font-medium text-ink">
          Activity in your communities
          <span className="ml-2 font-normal text-ink-subtle">last 14 days</span>
        </figcaption>

        {/* Legend — always present for two series. */}
        <div className="flex items-center gap-3">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5 text-xs text-ink-muted">
              <svg viewBox="0 0 8 8" className="h-2 w-2" aria-hidden="true">
                <rect width="8" height="8" rx="2" className={series.className} />
              </svg>
              {series.label}
            </span>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-ink-subtle">
          No posts or events yet — this chart fills in as your communities get going.
        </p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-32 w-full overflow-visible"
            preserveAspectRatio="none"
            role="img"
            aria-labelledby={titleId}
          >
            {/* Recessive gridlines at the axis quarters. */}
            {[0.25, 0.5, 0.75, 1].map((fraction) => (
              <line
                key={fraction}
                x1="0"
                x2={width}
                y1={height - height * fraction}
                y2={height - height * fraction}
                className="stroke-chart-grid"
                strokeWidth="0.15"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {data.map((point, index) =>
              SERIES.map((series, seriesIndex) => {
                const value = point[series.key] || 0;
                const barHeight = (value / max) * height;
                const x = index * groupWidth + seriesIndex * (barWidth + gap) + gap / 2;
                const isActive = hovered === `${point.date}-${series.key}`;

                return (
                  <rect
                    key={`${point.date}-${series.key}`}
                    x={x}
                    // Zero-height bars still get a 0.4 stub so the day reads as present.
                    y={height - Math.max(barHeight, value > 0 ? 0.6 : 0.25)}
                    width={barWidth}
                    height={Math.max(barHeight, value > 0 ? 0.6 : 0.25)}
                    rx="0.5"
                    className={`${value > 0 ? series.className : 'fill-chart-grid'} transition-opacity`}
                    opacity={hovered && !isActive ? 0.45 : 1}
                    tabIndex={0}
                    role="graphics-symbol"
                    aria-label={`${fullDateLabel(point.date)}: ${value} ${value === 1 ? series.label.slice(0, -1).toLowerCase() : series.label.toLowerCase()}`}
                    onMouseEnter={() => setHovered(`${point.date}-${series.key}`)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(`${point.date}-${series.key}`)}
                    onBlur={() => setHovered(null)}
                  />
                );
              }),
            )}
          </svg>

          {/* Selective tick labels: every third day, so they never collide. */}
          <div className="mt-1.5 flex text-[10px] text-ink-subtle">
            {data.map((point, index) => (
              <span key={point.date} className="flex-1 text-center">
                {index % 3 === 0 ? weekdayLabel(point.date) : ' '}
              </span>
            ))}
          </div>

          {hovered && <HoverReadout data={data} hovered={hovered} />}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowTable((current) => !current)}
        aria-expanded={showTable}
        className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        {showTable ? 'Hide the numbers' : 'Show the numbers'}
      </button>

      {showTable && <ActivityTable data={data} />}
    </figure>
  );
}

/** Tooltip content for the hovered/focused bar. */
function HoverReadout({ data, hovered }) {
  const [date, key] = [hovered.slice(0, 10), hovered.slice(11)];
  const point = data.find((d) => d.date === date);
  if (!point) return null;

  return (
    <div
      role="status"
      className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-pop"
    >
      <span className="font-medium text-ink">{fullDateLabel(date)}</span>
      <span className="ml-2 text-ink-muted">
        {point.posts} {point.posts === 1 ? 'post' : 'posts'} · {point.events}{' '}
        {point.events === 1 ? 'event' : 'events'}
      </span>
      <span className="sr-only"> ({key === 'posts' ? 'posts' : 'events'} bar focused)</span>
    </div>
  );
}

/** Accessible table alternative to the chart. */
function ActivityTable({ data }) {
  return (
    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-line hh-scroll-thin">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">Posts and events per day over the last 14 days</caption>
        <thead className="sticky top-0 bg-surface-muted text-ink-muted">
          <tr>
            <th scope="col" className="px-3 py-1.5 font-medium">
              Day
            </th>
            <th scope="col" className="px-3 py-1.5 text-right font-medium">
              Posts
            </th>
            <th scope="col" className="px-3 py-1.5 text-right font-medium">
              Events
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date} className="border-t border-line">
              <th scope="row" className="px-3 py-1.5 font-normal text-ink-muted">
                {fullDateLabel(point.date)}
              </th>
              <td className="px-3 py-1.5 text-right tabular-nums">{point.posts}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{point.events}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

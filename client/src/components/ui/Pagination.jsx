/**
 * components/ui/Pagination.jsx — page controls for every paginated list.
 */
import Button from './Button';

/** Builds a compact page list: 1 … 4 5 6 … 12 */
function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return sorted.reduce((acc, current, index) => {
    if (index > 0 && current - sorted[index - 1] > 1) acc.push('gap');
    acc.push(current);
    return acc;
  }, []);
}

export default function Pagination({ meta, page, onChange, className = '' }) {
  if (!meta || meta.totalPages <= 1) return null;

  const { totalPages, total, hasNextPage, hasPrevPage } = meta;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 ${className}`}
    >
      <p className="text-xs text-ink-subtle">
        Page {page} of {totalPages} · {total} {total === 1 ? 'result' : 'results'}
      </p>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(page - 1)}
          disabled={!hasPrevPage}
        >
          Previous
        </Button>

        <ul className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((entry, index) =>
            entry === 'gap' ? (
              // eslint-disable-next-line react/no-array-index-key -- gaps have no stable id
              <li key={`gap-${index}`} className="px-1 text-ink-subtle" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => onChange(entry)}
                  aria-current={entry === page ? 'page' : undefined}
                  className={[
                    'min-w-8 rounded-lg px-2 py-1 text-sm transition-colors',
                    entry === page
                      ? 'bg-primary font-semibold text-white'
                      : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                  ].join(' ')}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ul>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(page + 1)}
          disabled={!hasNextPage}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

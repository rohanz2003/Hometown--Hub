/**
 * pages/moderation.jsx — the report queue for community moderators.
 *
 * The API scopes what is returned: community moderators see reports from their own
 * communities, platform admins see every report.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Textarea } from '../components/ui/Field';
import { LoadingPanel } from '../components/ui/Spinner';
import Tabs from '../components/ui/Tabs';
import { useToast } from '../context/ToastContext';
import usePaginatedList from '../hooks/usePaginatedList';
import * as adminService from '../services/adminService';
import { formatRelative, truncate } from '../utils/format';

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const TARGET_LABELS = { post: 'Post', comment: 'Comment', user: 'Member' };

export default function ModerationPage() {
  const toast = useToast();
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState('');

  const list = usePaginatedList((query) => adminService.listReports(query), {
    initialFilters: { status: 'open' },
  });

  const close = async (status) => {
    try {
      await adminService.resolveReport(resolving._id, status, note);
      list.removeItem(resolving._id);
      toast.success(status === 'resolved' ? 'Report resolved' : 'Report dismissed');
      setResolving(null);
      setNote('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Moderation</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Reports raised by members of the communities you moderate.
        </p>
      </header>

      <Tabs
        tabs={TABS}
        value={list.filters.status}
        onChange={(status) => list.applyFilters({ status })}
        label="Report statuses"
      />

      <Card className="overflow-hidden">
        {list.isLoading && <LoadingPanel label="Loading reports" />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

        {list.isEmpty && (
          <EmptyState
            icon="🛡️"
            title={
              list.filters.status === 'open'
                ? 'Nothing to review'
                : `No ${list.filters.status} reports`
            }
            description={
              list.filters.status === 'open'
                ? 'Your communities are quiet. Reports from members will appear here.'
                : 'Nothing in this list yet.'
            }
          />
        )}

        <ul className="divide-y divide-line">
          {list.items.map((report) => (
            <li key={report._id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">
                      {TARGET_LABELS[report.targetType] || report.targetType}
                    </Badge>
                    {report.community?.name && (
                      <Link
                        to={`/communities/${report.community.slug}`}
                        className="truncate text-sm font-medium text-primary hover:underline"
                      >
                        {report.community.name}
                      </Link>
                    )}
                    <span className="text-xs text-ink-subtle">
                      {formatRelative(report.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-ink">
                    <span className="text-ink-subtle">Reason: </span>
                    {report.reason}
                  </p>

                  {report.target?.preview && (
                    <blockquote className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
                      “{truncate(report.target.preview, 200)}”
                      {report.target.author?.name && (
                        <footer className="mt-1 text-xs text-ink-subtle">
                          — {report.target.author.name}
                        </footer>
                      )}
                    </blockquote>
                  )}

                  <p className="mt-1.5 text-xs text-ink-subtle">
                    Reported by {report.reporter?.name || 'a member'}
                    {report.resolvedBy?.name && ` · closed by ${report.resolvedBy.name}`}
                  </p>

                  {report.resolutionNote && (
                    <p className="mt-1 text-xs text-ink-muted">Note: {report.resolutionNote}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  {report.targetType === 'post' && (
                    <Button as={Link} to={`/posts/${report.targetId}`} size="sm" variant="outline">
                      View post
                    </Button>
                  )}
                  {report.status === 'open' && (
                    <Button size="sm" onClick={() => setResolving(report)}>
                      Review
                    </Button>
                  )}
                  {report.status !== 'open' && (
                    <Badge tone={report.status === 'resolved' ? 'success' : 'muted'}>
                      {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                    </Badge>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Pagination meta={list.meta} page={list.page} onChange={list.setPage} />
      </Card>

      <Modal
        isOpen={Boolean(resolving)}
        onClose={() => setResolving(null)}
        title="Close this report"
        description="Resolve it if you acted on it, or dismiss it if no action was needed. The reporter is notified either way."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close('dismissed')}>
              Dismiss
            </Button>
            <Button onClick={() => close('resolved')}>Mark resolved</Button>
          </>
        }
      >
        <Textarea
          label="Note (optional)"
          placeholder="What did you do about it?"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Modal>
    </div>
  );
}

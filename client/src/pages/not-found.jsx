/**
 * pages/not-found.jsx — 404 fallback.
 */
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span aria-hidden="true" className="text-5xl">
        🧭
      </span>
      <h1 className="mt-4 text-2xl font-bold">We can&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        The link may be out of date, or the post, event, or community may have been removed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/dashboard">
          Go to dashboard
        </Button>
        <Button as={Link} to="/communities" variant="outline">
          Browse communities
        </Button>
      </div>
    </div>
  );
}

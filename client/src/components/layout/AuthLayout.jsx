/**
 * components/layout/AuthLayout.jsx — shell for the sign-in and sign-up screens.
 *
 * Single-column and centred on mobile; on wide screens a short value proposition
 * sits beside the form.
 */
import { Link, Outlet } from 'react-router-dom';
import { FeedIcon as NewsIcon, EventsIcon, SparklesIcon as CultureIcon } from '../../components/ui/icons';

const HIGHLIGHTS = [
  { icon: NewsIcon, title: 'One place for local news', body: 'No more scattered group chats.' },
  { icon: EventsIcon, title: 'Organise real gatherings', body: 'Create events and see who is coming.' },
  { icon: CultureIcon, title: 'Keep traditions alive', body: 'Share the stories and photos that matter.' },
];

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <div className="hidden flex-1 flex-col justify-center bg-primary px-12 py-16 text-white dark:bg-slate-900 dark:text-white lg:flex">
        <Link to="/" className="mb-10 inline-flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 dark:bg-black/20 text-sm font-bold"
          >
            HH
          </span>
          <span className="text-lg font-semibold">Hometown Hub</span>
        </Link>

        <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
          Your city or village, in one place.
        </h1>
        <p className="mt-3 max-w-md text-white/80">
          Connect with the people from your hometown — share updates, organise events, and keep
          local culture alive.
        </p>

        <ul className="mt-10 space-y-5">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex max-w-md gap-3">
              <item.icon
                aria-hidden="true"
                className="h-6 w-6 text-white/70 flex-shrink-0"
                strokeWidth={2}
              />
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-sm text-white/75">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-white"
            >
              HH
            </span>
            <span className="text-lg font-semibold">Hometown Hub</span>
          </Link>

          <Outlet />
        </div>
      </main>
    </div>
  );
}

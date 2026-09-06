/**
 * pages/landing.jsx — the public front page.
 */
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import {
  CommentIcon as ChatIcon,
  MegaphoneIcon as AnnounceIcon,
  SuitcaseIcon as MoveIcon,
  CommunityIcon,
  FeedIcon as NewsIcon,
  EventsIcon,
  ModerationIcon,
  SparklesIcon as CultureIcon,
  NotificationBellIcon as NotificationIcon,
  LightThemeIcon,
  DarkThemeIcon,
} from '../components/ui/icons';

const PROBLEMS = [
  {
    icon: ChatIcon,
    title: 'Scattered group chats',
    body: 'Local news lives across a dozen WhatsApp groups with no structure and no history.',
  },
  {
    icon: AnnounceIcon,
    title: 'Nowhere central to announce',
    body: 'Festivals, water cuts, and working parties get missed by the people they affect.',
  },
  {
    icon: MoveIcon,
    title: 'Losing touch after moving',
    body: 'People who move away drift away from the place that raised them.',
  },
];

const FEATURES = [
  { icon: CommunityIcon, title: 'One community per place', body: 'A single home for your city or village.' },
  {
    icon: NewsIcon,
    title: 'Structured updates',
    body: 'Announcements, alerts, local news, and help requests.',
  },
  { icon: EventsIcon, title: 'Events with RSVPs', body: 'Plan gatherings and see who is coming.' },
  {
    icon: ModerationIcon,
    title: 'Moderated by neighbours',
    body: 'Local moderators approve members and keep it civil.',
  },
  {
    icon: CultureIcon,
    title: 'Culture kept alive',
    body: 'Collect the stories, photos, and traditions of home.',
  },
  {
    icon: NotificationIcon,
    title: 'Notifications that matter',
    body: 'Only the things happening where you are from.',
  },
];

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white dark:bg-slate-900"
            >
              HH
            </span>
            <span className="font-semibold text-ink dark:text-white">Hometown Hub</span>
          </span>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <LightThemeIcon className="h-5 w-5" strokeWidth={2} /> : <DarkThemeIcon className="h-5 w-5" strokeWidth={2} />}
            </Button>
            <Button as={Link} to="/login" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button as={Link} to="/register" size="sm">
              Get started
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            A hyperlocal community platform
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-[2.75rem]">
            Your city or village deserves better than a dozen group chats.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
            Hometown Hub gives the people of one place a single home online — to share updates,
            organise events, and keep local culture alive, wherever they live now.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button as={Link} to="/register" size="lg">
              Create your account
            </Button>
            <Button as={Link} to="/login" variant="outline" size="lg">
              I already have one
            </Button>
          </div>
        </section>

        <section className="border-y border-line bg-surface py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold">The problem we set out to fix</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {PROBLEMS.map((item) => (
                <li key={item.title} className="text-center">
                  <item.icon
                    aria-hidden="true"
                    className="mx-auto h-10 w-10 text-primary/70"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold">What you get</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="hh-card px-4 py-4">
                <feature.icon
                  aria-hidden="true"
                  className="h-8 w-8 text-primary/70"
                  strokeWidth={1.5}
                />
                <h3 className="mt-2 text-base font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-line bg-primary py-14 text-center text-white dark:bg-slate-900 dark:text-white">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold text-white dark:text-primary">Start your hometown&apos;s community</h2>
            <p className="mt-2 text-white/85 dark:text-ink-muted">
              Create it in a minute. A platform admin reviews new communities before they go live,
              so the directory stays trustworthy.
            </p>
            <Button
              as={Link}
              to="/register"
              variant="outline"
              size="lg"
              className="mt-6 border-white/40 bg-white/10 text-white hover:bg-white/20 dark:border-primary/40 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20"
            >
              Get started — it&apos;s free
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface py-6">
        <p className="text-center text-xs text-ink-subtle">
          Hometown Hub — a hyperlocal community platform. Built with React, Express, and MongoDB.
        </p>
      </footer>
    </div>
  );
}

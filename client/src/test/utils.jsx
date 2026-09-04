/**
 * test/utils.jsx — render helpers that wrap a component in the app's providers.
 */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import ToastViewport from '../components/ui/ToastViewport';

/**
 * Renders inside a router, the toast provider, and the toast viewport, so tests
 * can assert on the error messages a real user would actually see.
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ToastProvider>
        {ui}
        <ToastViewport />
      </ToastProvider>
    </MemoryRouter>,
  );
}

/** A minimal post fixture matching the shape the API returns. */
export const makePost = (overrides = {}) => ({
  _id: 'post-1',
  title: 'Temple festival dates confirmed',
  body: 'The annual festival runs from the 12th to the 15th.',
  type: 'announcement',
  tags: ['festival'],
  author: { _id: 'user-1', name: 'Asha Menon', avatarUrl: '' },
  community: {
    _id: 'community-1',
    name: 'Kollengode Village Circle',
    slug: 'kollengode-village-circle',
  },
  createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
  likeCount: 3,
  commentCount: 2,
  shareCount: 1,
  isLiked: false,
  isAuthor: false,
  canModerate: false,
  canInteract: true,
  isPinned: false,
  ...overrides,
});

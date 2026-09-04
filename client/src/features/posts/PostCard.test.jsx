/**
 * features/posts/PostCard.test.jsx
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostCard from './PostCard';
import { makePost, renderWithProviders } from '../../test/utils';
import * as postService from '../../services/postService';

jest.mock('../../services/postService');

describe('PostCard', () => {
  it('shows the post, its author, community, and type', () => {
    renderWithProviders(<PostCard post={makePost()} />);

    expect(
      screen.getByRole('heading', { name: /Temple festival dates confirmed/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Asha Menon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kollengode Village Circle' })).toBeInTheDocument();
    expect(screen.getByText('Announcement')).toBeInTheDocument();
  });

  it('marks a pinned post', () => {
    renderWithProviders(<PostCard post={makePost({ isPinned: true })} />);
    expect(screen.getByText(/Pinned/)).toBeInTheDocument();
  });

  it('updates the like count optimistically then reconciles with the server', async () => {
    postService.toggleLike.mockResolvedValue({ isLiked: true, likeCount: 4 });
    const onPatch = jest.fn();

    renderWithProviders(<PostCard post={makePost()} onPatch={onPatch} />);
    await userEvent.click(screen.getByRole('button', { name: /like this post/i }));

    // First call is the optimistic flip, second is the server's answer.
    expect(onPatch).toHaveBeenNthCalledWith(1, 'post-1', { isLiked: true, likeCount: 4 });
    await waitFor(() => expect(postService.toggleLike).toHaveBeenCalledWith('post-1'));
  });

  it('rolls the like back when the request fails', async () => {
    postService.toggleLike.mockRejectedValue(new Error('Network unreachable'));
    const onPatch = jest.fn();

    renderWithProviders(<PostCard post={makePost()} onPatch={onPatch} />);
    await userEvent.click(screen.getByRole('button', { name: /like this post/i }));

    await waitFor(() =>
      expect(onPatch).toHaveBeenLastCalledWith('post-1', { isLiked: false, likeCount: 3 }),
    );
    expect(await screen.findByText('Network unreachable')).toBeInTheDocument();
  });

  it('disables liking for someone who has not joined the community', () => {
    renderWithProviders(<PostCard post={makePost({ canInteract: false })} />);
    expect(screen.getByRole('button', { name: /like this post/i })).toBeDisabled();
  });

  it('offers moderator actions only to moderators', async () => {
    renderWithProviders(<PostCard post={makePost({ canModerate: true })} />);
    await userEvent.click(screen.getByRole('button', { name: /more actions/i }));

    expect(screen.getByRole('menuitem', { name: /pin post/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /hide from community/i })).toBeInTheDocument();
  });

  it('hides moderator actions from an ordinary member but offers reporting', async () => {
    renderWithProviders(<PostCard post={makePost()} />);
    await userEvent.click(screen.getByRole('button', { name: /more actions/i }));

    expect(screen.queryByRole('menuitem', { name: /pin post/i })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /report post/i })).toBeInTheDocument();
  });

  it('lets the author edit and delete, and does not offer them a report link', async () => {
    renderWithProviders(<PostCard post={makePost({ isAuthor: true })} />);
    await userEvent.click(screen.getByRole('button', { name: /more actions/i }));

    expect(screen.getByRole('menuitem', { name: /edit post/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete post/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /report post/i })).not.toBeInTheDocument();
  });

  it('asks for confirmation before deleting', async () => {
    postService.deletePost.mockResolvedValue({});
    const onRemove = jest.fn();

    renderWithProviders(<PostCard post={makePost({ isAuthor: true })} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /more actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete post/i }));

    expect(screen.getByRole('dialog', { name: /delete this post/i })).toBeInTheDocument();
    expect(postService.deletePost).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete post' }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('post-1'));
  });

  it('truncates a long body in the feed and links to the full post', () => {
    const longBody = 'x'.repeat(400);
    renderWithProviders(<PostCard post={makePost({ body: longBody })} />);

    expect(screen.getByRole('link', { name: /read more/i })).toBeInTheDocument();
    expect(screen.queryByText(longBody)).not.toBeInTheDocument();
  });

  it('shows the full body on the detail view', () => {
    const longBody = 'y'.repeat(400);
    renderWithProviders(<PostCard post={makePost({ body: longBody })} isDetail />);

    expect(screen.getByText(longBody)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /read more/i })).not.toBeInTheDocument();
  });
});

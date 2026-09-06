/**
 * features/posts/PostCard.jsx — one post in a feed or community list.
 *
 * Handles its own like/share/moderation actions optimistically and reports the
 * result upward via `onPatch` / `onRemove` so the list never has to refetch.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ReportDialog from './ReportDialog';
import PostActions from './PostActions';
import { useToast } from '../../context/ToastContext';
import * as postService from '../../services/postService';
import { formatRelative, mediaUrl, truncate } from '../../utils/format';
import { POST_TYPE_LABELS, POST_TYPE_TONE } from '../../utils/constants';
import { PinIcon } from '../../components/ui/icons';

export default function PostCard({
  post,
  onPatch,
  onRemove,
  showCommunity = true,
  isDetail = false,
}) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const patch = (changes) => onPatch?.(post._id, changes);

  const handleLike = async () => {
    // Optimistic: flip immediately, roll back if the server disagrees.
    const previous = { isLiked: post.isLiked, likeCount: post.likeCount };
    patch({ isLiked: !post.isLiked, likeCount: post.likeCount + (post.isLiked ? -1 : 1) });
    try {
      patch(await postService.toggleLike(post._id));
    } catch (error) {
      patch(previous);
      toast.error(error.message);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post._id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title || 'Hometown Hub post', url });
      else await navigator.clipboard.writeText(url);
      const result = await postService.sharePost(post._id);
      patch({ shareCount: result.shareCount });
      if (!navigator.share) toast.success('Link copied to your clipboard');
    } catch (error) {
      // A cancelled native share is not a failure worth reporting.
      if (error?.name !== 'AbortError') toast.error('That could not be shared');
    }
  };

  const handlePin = async () => {
    setIsBusy(true);
    try {
      const result = await postService.setPinned(post._id, !post.isPinned);
      patch({ isPinned: result.isPinned });
      toast.success(result.isPinned ? 'Pinned to the top of the feed' : 'Unpinned');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleHide = async () => {
    setIsBusy(true);
    try {
      await postService.moderatePost(post._id, 'hidden', 'Hidden by a moderator');
      onRemove?.(post._id);
      toast.success('Post hidden from the community');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      await postService.deletePost(post._id);
      onRemove?.(post._id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const author = post.author || {};
  const community = post.community || {};
  const body = isDetail ? post.body : truncate(post.body, 320);

  return (
    <article className="hh-card overflow-hidden">
      <header className="flex items-start gap-3 px-4 pt-4">
        <Avatar name={author.name} src={author.avatarUrl} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
            <span className="font-medium text-ink">{author.name || 'Someone'}</span>
            {showCommunity && community.name && (
              <>
                <span className="text-ink-subtle" aria-hidden="true">
                  ·
                </span>
                <Link
                  to={`/communities/${community.slug || community._id}`}
                  className="truncate text-primary hover:underline"
                >
                  {community.name}
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-ink-subtle">
            <time dateTime={post.createdAt}>{formatRelative(post.createdAt)}</time>
            {post.editedAt && <span> · edited</span>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {post.isPinned && <Badge tone="primary"><PinIcon className="h-3 w-3 mr-1" strokeWidth={2} /> Pinned</Badge>}
          {post.type && post.type !== 'discussion' && (
            <Badge tone={POST_TYPE_TONE[post.type] || 'muted'}>{POST_TYPE_LABELS[post.type]}</Badge>
          )}
        </div>
      </header>

      <div className="px-4 pt-3">
        {post.title && (
          <h3 className="mb-1 text-lg font-semibold">
            {isDetail ? (
              post.title
            ) : (
              <Link to={`/posts/${post._id}`} className="hover:text-primary hover:underline">
                {post.title}
              </Link>
            )}
          </h3>
        )}

        <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-ink-muted">
          {body}
        </p>

        {!isDetail && post.body.length > 320 && (
          <Link
            to={`/posts/${post._id}`}
            className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
          >
            Read more
          </Link>
        )}

        {post.imageUrl && (
          <img
            src={mediaUrl(post.imageUrl)}
            alt={post.imageAlt || `Image shared with the post "${post.title || 'untitled'}"`}
            loading="lazy"
            className="mt-3 max-h-96 w-full rounded-lg border border-line object-cover"
          />
        )}

        {post.tags?.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Badge>#{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PostActions
        post={post}
        isBusy={isBusy}
        onLike={handleLike}
        onShare={handleShare}
        onPin={handlePin}
        onHide={handleHide}
        onDelete={() => setConfirmDelete(true)}
        onReport={() => setReporting(true)}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this post?"
        message="The post and its comments will be removed for everyone. This cannot be undone."
        confirmLabel="Delete post"
      />

      <ReportDialog
        isOpen={reporting}
        onClose={() => setReporting(false)}
        targetType="post"
        targetId={post._id}
      />
    </article>
  );
}

/**
 * features/posts/PostActions.jsx — the like / comment / share row on a post,
 * plus the overflow menu for author and moderator actions.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCount } from '../../utils/format';
import {
  LikeIcon as HeartIcon,
  UnlikeIcon as HeartOffIcon,
  CommentIcon,
  ShareIcon,
  MoreIcon,
  EditIcon,
  PinIcon,
  UnpinIcon as PinOffIcon,
  HideIcon,
  ReportIcon as FlagIcon,
  DeleteIcon,
} from '../../components/ui/icons';

function ActionButton({
  Icon,
  label,
  count,
  isActive,
  onClick,
  disabled,
  title,
  as: Component = 'button',
  ...props
}) {
  return (
    <Component
      {...(Component === 'button' ? { type: 'button', onClick, disabled } : props)}
      title={title}
      className={[
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
        disabled ? 'cursor-not-allowed text-ink-subtle' : 'hover:bg-surface-muted hover:text-ink',
        isActive ? 'text-primary' : 'text-ink-muted',
      ].join(' ')}
    >
      <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="tabular-nums">{formatCount(count)}</span>
      <span className="sr-only">{label}</span>
    </Component>
  );
}

export default function PostActions({
  post,
  isBusy,
  onLike,
  onShare,
  onPin,
  onHide,
  onDelete,
  onReport,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => event.key === 'Escape' && setMenuOpen(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const canEdit = post.isAuthor;
  const canDelete = post.isAuthor || post.canModerate;

  return (
    <footer className="mt-3 flex items-center gap-1 border-t border-line px-2 py-1.5">
      <ActionButton
        Icon={post.isLiked ? HeartIcon : HeartOffIcon}
        label={post.isLiked ? 'Unlike this post' : 'Like this post'}
        count={post.likeCount}
        isActive={post.isLiked}
        onClick={onLike}
        disabled={post.canInteract === false}
        title={post.canInteract === false ? 'Join this community to like posts' : undefined}
      />
      <ActionButton
        Icon={CommentIcon}
        as={Link}
        to={`/posts/${post._id}`}
        label="View comments"
        count={post.commentCount}
      />
      <ActionButton Icon={ShareIcon} label="Share this post" count={post.shareCount} onClick={onShare} />

      <div ref={menuRef} className="relative ml-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={isBusy}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
        >
          <MoreIcon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">More actions for this post</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute bottom-full right-0 z-10 mb-1 w-48 animate-slide-up overflow-hidden rounded-card border border-line bg-surface py-1 shadow-pop"
          >
            {canEdit && (
              <Link
                to={`/posts/${post._id}?edit=1`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <EditIcon className="h-5 w-5" strokeWidth={2} />
                Edit post
              </Link>
            )}

            {post.canModerate && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onPin();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
                >
                  {post.isPinned ? <PinOffIcon className="h-5 w-5" strokeWidth={2} /> : <PinIcon className="h-5 w-5" strokeWidth={2} />}
                  {post.isPinned ? 'Unpin post' : 'Pin post'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onHide();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
                >
                  <HideIcon className="h-5 w-5" strokeWidth={2} />
                  Hide from community
                </button>
              </>
            )}

            {!post.isAuthor && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onReport();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <FlagIcon className="h-5 w-5" strokeWidth={2} />
                Report post
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-sm text-error hover:bg-error-soft"
              >
                <DeleteIcon className="h-5 w-5" strokeWidth={2} />
                Delete post
              </button>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
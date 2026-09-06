/**
 * features/posts/CommentSection.jsx — comment list, composer, and replies.
 *
 * Comments arrive as a flat list carrying `parent`, and are grouped into one
 * level of replies here.
 */
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import { LoadingPanel } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import useAsync from '../../hooks/useAsync';
import * as postService from '../../services/postService';
import { formatRelative } from '../../utils/format';
import { commentSchema } from '../../utils/validators';
import {
  LikeIcon as HeartIcon,
  UnlikeIcon as HeartOffIcon,
  CommentIcon,
} from '../../components/ui/icons';

export default function CommentSection({ post, canComment, canModerate, onCountChange }) {
  const toast = useToast();
  const { data, error, isLoading, setData, reload } = useAsync(
    () => postService.listComments(post._id, { limit: 50 }),
    [post._id],
  );

  const [replyTo, setReplyTo] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Stable identity so the grouping below only recomputes on a real change.
  const comments = useMemo(() => data?.items || [], [data]);

  /** Groups the flat list into top-level comments each carrying its replies. */
  const threads = useMemo(() => {
    const roots = comments.filter((c) => !c.parent);
    const repliesByParent = comments.reduce((acc, c) => {
      if (!c.parent) return acc;
      const key = String(c.parent);
      acc[key] = [...(acc[key] || []), c];
      return acc;
    }, {});
    return roots.map((root) => ({ ...root, replies: repliesByParent[String(root._id)] || [] }));
  }, [comments]);

  const addComment = (comment) => {
    setData((current) => ({ ...current, items: [...(current?.items || []), comment] }));
    onCountChange?.(1);
  };

  const patchComment = (id, changes) => {
    setData((current) => ({
      ...current,
      items: (current?.items || []).map((c) =>
        String(c._id) === String(id) ? { ...c, ...changes } : c,
      ),
    }));
  };

  const handleDelete = async () => {
    const comment = pendingDelete;
    try {
      await postService.deleteComment(comment._id);
      const removedReplies = comments.filter(
        (c) => String(c.parent) === String(comment._id),
      ).length;
      setData((current) => ({
        ...current,
        items: (current?.items || []).filter(
          (c) => String(c._id) !== String(comment._id) && String(c.parent) !== String(comment._id),
        ),
      }));
      onCountChange?.(-(1 + removedReplies));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section aria-labelledby="comments-heading" className="hh-card">
      <h2 id="comments-heading" className="border-b border-line px-4 py-3 text-base font-semibold">
        {post.commentCount === 1 ? '1 comment' : `${post.commentCount} comments`}
      </h2>

      {canComment ? (
        <div className="border-b border-line px-4 py-3">
          <CommentForm
            onSubmit={(body) => postService.addComment(post._id, body).then(addComment)}
          />
        </div>
      ) : (
        <p className="border-b border-line px-4 py-3 text-sm text-ink-subtle">
          Join this community to join the conversation.
        </p>
      )}

      {isLoading && <LoadingPanel label="Loading comments" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!isLoading && !error && threads.length === 0 && (
        <EmptyState
          icon="message-square"
          title="No comments yet"
          description={
            canComment ? 'Be the first to reply.' : 'Nobody has replied to this post yet.'
          }
        />
      )}

      <ul className="divide-y divide-line">
        {threads.map((thread) => (
          <li key={thread._id} className="px-4 py-3">
            <Comment
              comment={thread}
              canModerate={canModerate}
              canReply={canComment}
              onReply={() => setReplyTo(replyTo === thread._id ? null : thread._id)}
              onDelete={() => setPendingDelete(thread)}
              onPatch={patchComment}
            />

            {thread.replies.length > 0 && (
              <ul className="mt-3 space-y-3 border-l-2 border-line pl-4">
                {thread.replies.map((reply) => (
                  <li key={reply._id}>
                    <Comment
                      comment={reply}
                      canModerate={canModerate}
                      onDelete={() => setPendingDelete(reply)}
                      onPatch={patchComment}
                    />
                  </li>
                ))}
              </ul>
            )}

            {replyTo === thread._id && canComment && (
              <div className="mt-3 border-l-2 border-primary/30 pl-4">
                <CommentForm
                  placeholder={`Reply to ${thread.author?.name || 'this comment'}…`}
                  submitLabel="Reply"
                  onSubmit={(body) =>
                    postService.addComment(post._id, body, thread._id).then((created) => {
                      addComment(created);
                      setReplyTo(null);
                    })
                  }
                  onCancel={() => setReplyTo(null)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete this comment?"
        message="It will be removed for everyone, along with any replies to it."
        confirmLabel="Delete comment"
      />
    </section>
  );
}

/** A single comment with its like/reply/delete controls. */
function Comment({ comment, canModerate, canReply, onReply, onDelete, onPatch }) {
  const toast = useToast();
  const author = comment.author || {};

  const handleLike = async () => {
    const previous = { isLiked: comment.isLiked, likeCount: comment.likeCount };
    onPatch(comment._id, {
      isLiked: !comment.isLiked,
      likeCount: comment.likeCount + (comment.isLiked ? -1 : 1),
    });
    try {
      onPatch(comment._id, await postService.toggleCommentLike(comment._id));
    } catch (error) {
      onPatch(comment._id, previous);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar name={author.name} src={author.avatarUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium text-ink">{author.name || 'Someone'}</span>
          <span className="ml-1.5 text-xs text-ink-subtle">
            <time dateTime={comment.createdAt}>{formatRelative(comment.createdAt)}</time>
            {comment.editedAt && ' · edited'}
          </span>
        </p>

        <p className="mt-0.5 whitespace-pre-wrap break-words text-base text-ink-muted">
          {comment.body}
        </p>

        <div className="mt-1.5 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleLike}
            className={`font-medium transition-colors ${comment.isLiked ? 'text-primary' : 'text-ink-subtle hover:text-ink'}`}
          >
            {comment.isLiked ? (
              <HeartIcon className="h-4 w-4 inline mr-0.5" strokeWidth={2} />
            ) : (
              <HeartOffIcon className="h-4 w-4 inline mr-0.5" strokeWidth={2} />
            )}
            {comment.likeCount || 0}
            <span className="sr-only">{comment.isLiked ? 'Unlike' : 'Like'} this comment</span>
          </button>

          {canReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className="font-medium text-ink-subtle hover:text-ink"
            >
              Reply
            </button>
          )}

          {(comment.isAuthor || canModerate) && (
            <button
              type="button"
              onClick={onDelete}
              className="font-medium text-ink-subtle hover:text-error"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Comment/reply input. Clears itself after a successful submit. */
function CommentForm({
  onSubmit,
  placeholder = 'Add a comment…',
  submitLabel = 'Comment',
  onCancel,
}) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(commentSchema), defaultValues: { body: '' } });

  const submit = async ({ body }) => {
    try {
      await onSubmit(body);
      reset({ body: '' });
    } catch (error) {
      if (error.fieldErrors?.body) setError('body', { message: error.fieldErrors.body });
      else toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Textarea
        label={submitLabel === 'Reply' ? 'Your reply' : 'Your comment'}
        wrapperClassName="[&_label]:sr-only"
        placeholder={placeholder}
        rows={2}
        error={errors.body?.message}
        {...register('body')}
      />
      <div className="mt-2 flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button size="sm" type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

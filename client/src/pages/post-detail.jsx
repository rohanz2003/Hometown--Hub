/**
 * pages/post-detail.jsx — a single post with its full comment thread.
 *
 * `?edit=1` opens the composer in edit mode, which is how the post overflow menu
 * links here.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingPanel } from '../components/ui/Spinner';
import CommentSection from '../features/posts/CommentSection';
import PostCard from '../features/posts/PostCard';
import PostComposer from '../features/posts/PostComposer';
import useAsync from '../hooks/useAsync';
import * as dashboardService from '../services/dashboardService';
import * as postService from '../services/postService';

export default function PostDetailPage() {
  const { postId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(params.get('edit') === '1');
  const {
    data: post,
    error,
    isLoading,
    setData,
    reload,
  } = useAsync(() => postService.getPost(postId), [postId]);
  const { data: categories } = useAsync(() => dashboardService.listCategories(), []);

  if (isLoading) return <LoadingPanel label="Loading post" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const closeEditor = () => {
    setIsEditing(false);
    setParams({}, { replace: true });
  };

  const community = post.community || {};
  // The API tells us whether this viewer is a member of the post's community.
  const canComment = Boolean(post.canInteract);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        {community.name && (
          <Link
            to={`/communities/${community.slug || community._id}`}
            className="truncate text-sm font-medium text-primary hover:underline"
          >
            {community.name}
          </Link>
        )}
      </div>

      {isEditing ? (
        <PostComposer
          post={post}
          communityId={community._id}
          communityName={community.name}
          categories={categories || []}
          onUpdated={(updated) => {
            setData(updated);
            closeEditor();
          }}
          onCancel={closeEditor}
        />
      ) : (
        <PostCard
          post={post}
          isDetail
          onPatch={(id, changes) => setData((current) => ({ ...current, ...changes }))}
          onRemove={() =>
            navigate(community.slug ? `/communities/${community.slug}` : '/feed', { replace: true })
          }
        />
      )}

      <CommentSection
        post={post}
        canComment={canComment}
        canModerate={Boolean(post.canModerate)}
        onCountChange={(delta) =>
          setData((current) => ({
            ...current,
            commentCount: Math.max(0, current.commentCount + delta),
          }))
        }
      />

      {!canComment && (
        <Card className="px-4 py-3 text-sm text-ink-muted">
          Join{' '}
          <Link
            to={`/communities/${community.slug || community._id}`}
            className="font-medium text-primary hover:underline"
          >
            {community.name}
          </Link>{' '}
          to like and comment on its posts.
        </Card>
      )}
    </div>
  );
}

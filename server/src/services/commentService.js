/**
 * services/commentService.js — comments on posts.
 *
 * Returns a flat, chronological list carrying `parent`, so the client can render
 * either a flat or a single-level threaded view (phases.doc.md Phase 3).
 */
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const { notify } = require('./notificationService');
const { NOTIFICATION_TYPES, POST_STATUS } = require('../utils/constants');

const AUTHOR_FIELDS = 'name avatarUrl hometown.city';

function decorate(comments, userId) {
  return comments.map((c) => ({
    ...c,
    isLiked: userId ? (c.likes || []).some((id) => String(id) === String(userId)) : false,
    isAuthor: userId ? String(c.author?._id || c.author) === String(userId) : false,
    likes: undefined,
  }));
}

async function listByPost({ postId, query = {}, userId }) {
  const { page, limit, skip } = parsePagination({ limit: 50, ...query });
  const filter = { post: postId, status: POST_STATUS.PUBLISHED };

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Comment.countDocuments(filter),
  ]);

  return { items: decorate(items, userId), meta: buildPageMeta({ page, limit, total }) };
}

/** Adds a comment and notifies the post author (and the parent commenter). */
async function createComment({ post, author, body, parent = null }) {
  if (post.status !== POST_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This post is closed for new comments');
  }

  if (parent) {
    const parentComment = await Comment.findOne({ _id: parent, post: post._id });
    if (!parentComment) throw ApiError.badRequest('That comment no longer exists');
    // Keep threads one level deep so the mobile view stays readable.
    if (parentComment.parent) throw ApiError.badRequest('Replies can only be one level deep');
  }

  const comment = await Comment.create({
    post: post._id,
    community: post.community,
    author: author._id,
    parent,
    body,
  });

  await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });
  await comment.populate('author', AUTHOR_FIELDS);

  await notify({
    recipient: post.author,
    actor: author._id,
    community: post.community,
    post: post._id,
    comment: comment._id,
    type: NOTIFICATION_TYPES.POST_COMMENT,
    message: `${author.name} commented on your post`,
    link: `/posts/${post._id}`,
  });

  return decorate([comment.toObject()], author._id)[0];
}

async function updateComment({ comment, body, user }) {
  if (String(comment.author) !== String(user._id)) {
    throw ApiError.forbidden('Only the author can edit this comment');
  }
  comment.body = body;
  comment.editedAt = new Date();
  await comment.save();
  await comment.populate('author', AUTHOR_FIELDS);
  return decorate([comment.toObject()], user._id)[0];
}

/** Authors delete their own comments; moderators may delete any comment. */
async function deleteComment({ comment, user, canModerate }) {
  const isAuthor = String(comment.author) === String(user._id);
  if (!isAuthor && !canModerate)
    throw ApiError.forbidden('Only the author can delete this comment');

  // Remove one-level replies along with their parent.
  const replies = await Comment.countDocuments({ parent: comment._id });
  await Comment.deleteMany({ parent: comment._id });
  await comment.deleteOne();
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -(1 + replies) } });

  if (!isAuthor) {
    await notify({
      recipient: comment.author,
      actor: user._id,
      community: comment.community,
      post: comment.post,
      type: NOTIFICATION_TYPES.CONTENT_REMOVED,
      message: 'A moderator removed one of your comments',
      link: `/posts/${comment.post}`,
    });
  }
}

async function toggleLike({ comment, user }) {
  const liked = comment.likes.some((id) => String(id) === String(user._id));
  comment.likes = liked
    ? comment.likes.filter((id) => String(id) !== String(user._id))
    : [...comment.likes, user._id];
  await comment.save();
  return { isLiked: !liked, likeCount: comment.likeCount };
}

/** Hides or restores a comment. Moderator action with an audit trail. */
async function moderateComment({ comment, status, reason = '', user }) {
  comment.status = status;
  comment.moderation = { actionBy: user._id, actionAt: new Date(), reason };
  await comment.save();
  return comment;
}

module.exports = {
  listByPost,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  moderateComment,
};

/**
 * services/postService.js — posts, likes, shares, pinning, and moderation.
 *
 * Every list is paginated and sorted deterministically: pinned posts first, then
 * by the requested sort (recent / popular / oldest).
 */
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const { escapeRegex } = require('./communityService');
const { notify, notifyCommunity } = require('./notificationService');
const {
  COMMUNITY_ROLES,
  COMMUNITY_ROLE_RANK,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  POST_STATUS,
  POST_TYPES,
  SORT_OPTIONS,
} = require('../utils/constants');

const AUTHOR_FIELDS = 'name avatarUrl hometown.city';
const COMMUNITY_FIELDS = 'name slug location.city';

const SORTS = {
  [SORT_OPTIONS.RECENT]: { isPinned: -1, createdAt: -1 },
  [SORT_OPTIONS.POPULAR]: { isPinned: -1, likeCount: -1, commentCount: -1, createdAt: -1 },
  [SORT_OPTIONS.OLDEST]: { isPinned: -1, createdAt: 1 },
};

/**
 * Adds viewer-specific flags without extra round trips.
 * `memberOf` is either `true` (the caller is known to be a member of every
 * community in the list) or a Set of community ids they belong to.
 */
function decorate(posts, { userId, moderatorOf = new Set(), memberOf = new Set() } = {}) {
  const isMemberOf = (communityId) =>
    memberOf === true || moderatorOf.has(String(communityId)) || memberOf.has(String(communityId));

  return posts.map((post) => {
    const communityId = String(post.community?._id || post.community);
    return {
      ...post,
      likeCount: post.likeCount ?? (post.likes || []).length,
      isLiked: userId ? (post.likes || []).some((id) => String(id) === String(userId)) : false,
      isAuthor: userId ? String(post.author?._id || post.author) === String(userId) : false,
      canModerate: moderatorOf.has(communityId),
      /** True when the viewer may like, comment on, and share this post. */
      canInteract: Boolean(userId) && isMemberOf(communityId),
      likes: undefined,
    };
  });
}

/** Communities where the user is at least a moderator — drives `canModerate`. */
async function moderatorCommunityIds(userId) {
  if (!userId) return new Set();
  const rows = await Membership.find({
    user: userId,
    status: MEMBERSHIP_STATUS.APPROVED,
    role: { $in: [COMMUNITY_ROLES.MODERATOR, COMMUNITY_ROLES.ADMIN] },
  })
    .select('community')
    .lean();
  return new Set(rows.map((r) => String(r.community)));
}

function buildFilter(query, base = {}) {
  const filter = { status: POST_STATUS.PUBLISHED, ...base };
  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = String(query.tag).toLowerCase();
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { body: rx }, { tags: rx }];
  }
  return filter;
}

/** Posts inside one community. */
async function listByCommunity({ community, query = {}, userId, isMember = false }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilter(query, { community: community._id });

  const [items, total, moderatorOf] = await Promise.all([
    Post.find(filter)
      .sort(SORTS[query.sort] || SORTS[SORT_OPTIONS.RECENT])
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .populate('community', COMMUNITY_FIELDS)
      .populate('category', 'name slug')
      .lean(),
    Post.countDocuments(filter),
    moderatorCommunityIds(userId),
  ]);

  return {
    items: decorate(items, { userId, moderatorOf, memberOf: isMember ? true : new Set() }),
    meta: buildPageMeta({ page, limit, total }),
  };
}

/** Personal feed: posts from every community the user has joined. */
async function personalFeed({ userId, query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const memberships = await Membership.find({ user: userId, status: MEMBERSHIP_STATUS.APPROVED })
    .select('community role')
    .lean();

  const communityIds = memberships.map((m) => m.community);
  if (communityIds.length === 0) {
    return { items: [], meta: buildPageMeta({ page, limit, total: 0 }) };
  }

  const scope = query.community ? [query.community] : communityIds;
  const filter = buildFilter(query, { community: { $in: scope } });

  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort(SORTS[query.sort] || SORTS[SORT_OPTIONS.RECENT])
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .populate('community', COMMUNITY_FIELDS)
      .populate('category', 'name slug')
      .lean(),
    Post.countDocuments(filter),
  ]);

  const moderatorOf = new Set(
    memberships
      .filter((m) => (COMMUNITY_ROLE_RANK[m.role] || 0) >= COMMUNITY_ROLE_RANK.moderator)
      .map((m) => String(m.community)),
  );

  return {
    items: decorate(items, { userId, moderatorOf, memberOf: true }),
    meta: buildPageMeta({ page, limit, total }),
  };
}

async function createPost({ community, author, data }) {
  const post = await Post.create({
    community: community._id,
    author: author._id,
    title: data.title || '',
    body: data.body,
    type: data.type || POST_TYPES.DISCUSSION,
    category: data.category || null,
    tags: data.tags || [],
    imageUrl: data.imageUrl || '',
    imageAlt: data.imageAlt || '',
  });

  await Community.findByIdAndUpdate(community._id, { $inc: { postCount: 1 } });
  await post.populate([
    { path: 'author', select: AUTHOR_FIELDS },
    { path: 'community', select: COMMUNITY_FIELDS },
  ]);

  if (post.type === POST_TYPES.ANNOUNCEMENT || post.type === POST_TYPES.ALERT) {
    await notifyCommunity({
      community: community._id,
      actor: author._id,
      post: post._id,
      type: NOTIFICATION_TYPES.ANNOUNCEMENT_PINNED,
      message: `${community.name}: ${post.title || 'New announcement'}`,
      link: `/posts/${post._id}`,
    });
  }

  return decorate([post.toObject()], { userId: author._id, memberOf: true })[0];
}

/** Single post. Hidden/removed posts are only visible to moderators. */
async function getPost({ postId, userId, canModerate = false, isMember = false }) {
  const post = await Post.findById(postId)
    .populate('author', AUTHOR_FIELDS)
    .populate('community', COMMUNITY_FIELDS)
    .populate('category', 'name slug')
    .lean();

  if (!post) throw ApiError.notFound('That post no longer exists');
  if (post.status !== POST_STATUS.PUBLISHED && !canModerate) {
    throw ApiError.notFound('That post no longer exists');
  }

  const communityId = String(post.community?._id || post.community);
  const moderatorOf = canModerate ? new Set([communityId]) : new Set();
  return decorate([post], { userId, moderatorOf, memberOf: isMember ? true : new Set() })[0];
}

const EDITABLE = ['title', 'body', 'type', 'category', 'tags', 'imageUrl', 'imageAlt'];

/** Only the author may edit content; moderators remove rather than rewrite. */
async function updatePost({ post, data, user }) {
  if (String(post.author) !== String(user._id)) {
    throw ApiError.forbidden('Only the author can edit this post');
  }
  EDITABLE.forEach((field) => {
    if (data[field] !== undefined) post[field] = data[field];
  });
  post.editedAt = new Date();
  await post.save();
  await post.populate([
    { path: 'author', select: AUTHOR_FIELDS },
    { path: 'community', select: COMMUNITY_FIELDS },
  ]);
  return decorate([post.toObject()], { userId: user._id, memberOf: true })[0];
}

/** Authors delete their own posts; moderators may delete any post. */
async function deletePost({ post, user, canModerate }) {
  const isAuthor = String(post.author) === String(user._id);
  if (!isAuthor && !canModerate) throw ApiError.forbidden('Only the author can delete this post');

  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  await Community.findByIdAndUpdate(post.community, { $inc: { postCount: -1 } });

  if (!isAuthor) {
    await notify({
      recipient: post.author,
      actor: user._id,
      community: post.community,
      type: NOTIFICATION_TYPES.CONTENT_REMOVED,
      message: 'A moderator removed one of your posts',
      link: '/feed',
    });
  }
}

/** Idempotent like toggle; returns the new state for the caller. */
async function toggleLike({ post, user }) {
  const alreadyLiked = post.isLikedBy(user._id);
  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => String(id) !== String(user._id));
  } else {
    post.likes.push(user._id);
  }
  await post.save();

  if (!alreadyLiked) {
    await notify({
      recipient: post.author,
      actor: user._id,
      community: post.community,
      post: post._id,
      type: NOTIFICATION_TYPES.POST_LIKE,
      message: `${user.name} liked your post`,
      link: `/posts/${post._id}`,
    });
  }

  return { isLiked: !alreadyLiked, likeCount: post.likeCount };
}

/** Counts a share. The share target itself is handled client-side. */
async function recordShare({ post }) {
  post.shareCount += 1;
  await post.save();
  return { shareCount: post.shareCount };
}

/** Pins or unpins an announcement. Moderator action. */
async function setPinned({ post, pinned, user, community }) {
  post.isPinned = pinned;
  post.pinnedAt = pinned ? new Date() : null;
  post.pinnedBy = pinned ? user._id : null;
  await post.save();

  if (pinned) {
    await notifyCommunity({
      community: post.community,
      actor: user._id,
      post: post._id,
      type: NOTIFICATION_TYPES.ANNOUNCEMENT_PINNED,
      message: `Pinned in ${community.name}: ${post.title || 'an announcement'}`,
      link: `/posts/${post._id}`,
    });
  }
  return post;
}

/** Hides, removes, or restores a post. Moderator action with an audit trail. */
async function moderatePost({ post, status, reason = '', user }) {
  post.status = status;
  post.moderation = { actionBy: user._id, actionAt: new Date(), reason };
  await post.save();

  if (status !== POST_STATUS.PUBLISHED) {
    await notify({
      recipient: post.author,
      actor: user._id,
      community: post.community,
      post: post._id,
      type: NOTIFICATION_TYPES.CONTENT_REMOVED,
      message: reason
        ? `A moderator hid your post: ${reason}`
        : 'A moderator hid one of your posts',
      link: `/posts/${post._id}`,
    });
  }
  return post;
}

module.exports = {
  listByCommunity,
  personalFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  recordShare,
  setPinned,
  moderatePost,
  moderatorCommunityIds,
  decorate,
};

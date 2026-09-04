/**
 * controllers/postController.js — post, like, share, pin, and moderation endpoints.
 */
const postService = require('../services/postService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

/** Personal feed across every joined community. */
const feed = asyncHandler(async (req, res) => {
  const { items, meta } = await postService.personalFeed({
    userId: req.user._id,
    query: req.query,
  });
  return sendSuccess(res, items, { meta });
});

const listByCommunity = asyncHandler(async (req, res) => {
  const { items, meta } = await postService.listByCommunity({
    community: req.community,
    query: req.query,
    userId: req.user?._id,
    isMember: Boolean(req.communityRole),
  });
  return sendSuccess(res, items, { meta });
});

const create = asyncHandler(async (req, res) => {
  // An uploaded file wins over a supplied URL.
  const body = { ...req.body };
  if (req.uploadedImageUrl) body.imageUrl = req.uploadedImageUrl;

  const post = await postService.createPost({
    community: req.community,
    author: req.user,
    data: body,
  });
  return sendSuccess(res, post, { status: 201 });
});

const detail = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await postService.getPost({
      postId: req.params.postId,
      userId: req.user?._id,
      canModerate: Boolean(req.canModerate),
      isMember: Boolean(req.communityRole),
    }),
  ),
);

const update = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.uploadedImageUrl) body.imageUrl = req.uploadedImageUrl;
  return sendSuccess(
    res,
    await postService.updatePost({ post: req.post, data: body, user: req.user }),
  );
});

const remove = asyncHandler(async (req, res) => {
  await postService.deletePost({ post: req.post, user: req.user, canModerate: req.canModerate });
  return sendSuccess(res, { message: 'Post deleted' });
});

const toggleLike = asyncHandler(async (req, res) =>
  sendSuccess(res, await postService.toggleLike({ post: req.post, user: req.user })),
);

const share = asyncHandler(async (req, res) =>
  sendSuccess(res, await postService.recordShare({ post: req.post })),
);

const setPinned = asyncHandler(async (req, res) => {
  const post = await postService.setPinned({
    post: req.post,
    pinned: req.body.pinned,
    user: req.user,
    community: req.community,
  });
  return sendSuccess(res, { isPinned: post.isPinned });
});

const moderate = asyncHandler(async (req, res) => {
  const post = await postService.moderatePost({
    post: req.post,
    status: req.body.status,
    reason: req.body.reason,
    user: req.user,
  });
  return sendSuccess(res, { status: post.status });
});

module.exports = {
  feed,
  listByCommunity,
  create,
  detail,
  update,
  remove,
  toggleLike,
  share,
  setPinned,
  moderate,
};

/**
 * tests/comment.test.js — Phase 3 comment CRUD and threading rules.
 */
const { api, registerUser, createApprovedCommunity, addMember, createPost } = require('./helpers');
const Post = require('../src/models/Post');

async function setup() {
  const owner = await registerUser({ name: 'Community Admin' });
  const member = await registerUser({ name: 'Commenter' });
  const community = await createApprovedCommunity({ owner });
  await addMember(community, member);
  const post = await createPost(community, owner);
  return { owner, member, community, post };
}

describe('POST /api/v1/posts/:postId/comments', () => {
  it('adds a comment and bumps the post comment count', async () => {
    const { member, post } = await setup();
    const res = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Happy to help with this.' })
      .expect(201);

    expect(res.body.data.body).toBe('Happy to help with this.');
    expect(res.body.data.author.name).toBe('Commenter');

    const refreshed = await Post.findById(post._id);
    expect(refreshed.commentCount).toBe(1);
  });

  it('rejects an empty comment', async () => {
    const { member, post } = await setup();
    await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: '' })
      .expect(400);
  });

  it('refuses a comment from a non-member', async () => {
    const { post } = await setup();
    const outsider = await registerUser();
    await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...outsider.auth)
      .send({ body: 'Hello' })
      .expect(403);
  });

  it('allows a one-level reply but not a reply to a reply', async () => {
    const { member, post } = await setup();
    const parent = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Top-level comment' })
      .expect(201);

    const reply = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'A reply', parent: parent.body.data._id })
      .expect(201);

    const res = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Reply to the reply', parent: reply.body.data._id })
      .expect(400);

    expect(res.body.error.message).toMatch(/one level deep/i);
  });
});

describe('GET /api/v1/posts/:postId/comments', () => {
  it('lists comments oldest first with viewer state', async () => {
    const { owner, member, post } = await setup();
    await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...owner.auth)
      .send({ body: 'First' })
      .expect(201);
    await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Second' })
      .expect(201);

    const res = await api()
      .get(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .expect(200);
    expect(res.body.data.map((c) => c.body)).toEqual(['First', 'Second']);
    expect(res.body.data[1].isAuthor).toBe(true);
    expect(res.body.data[0].isAuthor).toBe(false);
  });
});

describe('editing, deleting, liking', () => {
  it('lets the author edit their comment', async () => {
    const { member, post } = await setup();
    const created = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Original' })
      .expect(201);

    const res = await api()
      .patch(`/api/v1/comments/${created.body.data._id}`)
      .set(...member.auth)
      .send({ body: 'Corrected' })
      .expect(200);

    expect(res.body.data.body).toBe('Corrected');
  });

  it('refuses an edit by someone else', async () => {
    const { owner, member, post } = await setup();
    const created = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Original' })
      .expect(201);

    await api()
      .patch(`/api/v1/comments/${created.body.data._id}`)
      .set(...owner.auth)
      .send({ body: 'Hijacked' })
      .expect(403);
  });

  it('lets a moderator delete a comment and fixes the count', async () => {
    const { owner, member, post } = await setup();
    const created = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'To be removed' })
      .expect(201);

    await api()
      .delete(`/api/v1/comments/${created.body.data._id}`)
      .set(...owner.auth)
      .expect(200);

    const refreshed = await Post.findById(post._id);
    expect(refreshed.commentCount).toBe(0);
  });

  it('toggles a like on a comment', async () => {
    const { owner, member, post } = await setup();
    const created = await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...owner.auth)
      .send({ body: 'Like me' })
      .expect(201);

    const liked = await api()
      .post(`/api/v1/comments/${created.body.data._id}/like`)
      .set(...member.auth)
      .expect(200);
    expect(liked.body.data).toEqual({ isLiked: true, likeCount: 1 });
  });
});

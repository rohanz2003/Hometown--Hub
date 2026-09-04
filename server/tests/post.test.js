/**
 * tests/post.test.js — Phase 3 post CRUD + Phase 4 likes, shares, and moderation.
 */
const { api, registerUser, createApprovedCommunity, addMember, createPost } = require('./helpers');
const Post = require('../src/models/Post');

async function setup() {
  const owner = await registerUser({ name: 'Community Admin' });
  const member = await registerUser({ name: 'Ordinary Member' });
  const outsider = await registerUser({ name: 'Passer By' });
  const community = await createApprovedCommunity({ owner });
  await addMember(community, member);
  return { owner, member, outsider, community };
}

describe('POST /api/v1/communities/:id/posts', () => {
  it('creates a post as a member', async () => {
    const { member, community } = await setup();
    const res = await api()
      .post(`/api/v1/communities/${community._id}/posts`)
      .set(...member.auth)
      .send({ title: 'Road repairs', body: 'The lane near the school is being resurfaced.' })
      .expect(201);

    expect(res.body.data.title).toBe('Road repairs');
    expect(res.body.data.author.name).toBe('Ordinary Member');
    expect(res.body.data.likeCount).toBe(0);
  });

  it('refuses a post from someone who has not joined', async () => {
    const { outsider, community } = await setup();
    const res = await api()
      .post(`/api/v1/communities/${community._id}/posts`)
      .set(...outsider.auth)
      .send({ body: 'Hello from outside' })
      .expect(403);

    expect(res.body.error.message).toMatch(/Join this community/i);
  });

  it('rejects an empty body', async () => {
    const { member, community } = await setup();
    const res = await api()
      .post(`/api/v1/communities/${community._id}/posts`)
      .set(...member.auth)
      .send({ body: '   ' })
      .expect(400);

    expect(res.body.error.details.some((d) => d.field === 'body')).toBe(true);
  });
});

describe('GET post lists', () => {
  it('lists community posts with pinned entries first', async () => {
    const { owner, member, community } = await setup();
    await createPost(community, member, { title: 'Ordinary post', body: 'Just a note' });
    const pinned = await createPost(community, owner, { title: 'Announcement', body: 'Important' });

    await api()
      .patch(`/api/v1/posts/${pinned._id}/pin`)
      .set(...owner.auth)
      .send({ pinned: true })
      .expect(200);

    const res = await api()
      .get(`/api/v1/communities/${community._id}/posts`)
      .set(...member.auth)
      .expect(200);

    expect(res.body.data[0].title).toBe('Announcement');
    expect(res.body.data[0].isPinned).toBe(true);
  });

  it('returns a personal feed from joined communities only', async () => {
    const { member, community } = await setup();
    const otherOwner = await registerUser();
    const otherCommunity = await createApprovedCommunity({
      owner: otherOwner,
      name: 'Elsewhere Circle',
    });

    await createPost(community, member, { title: 'Mine', body: 'In my community' });
    await createPost(otherCommunity, otherOwner, { title: 'Theirs', body: 'Somewhere else' });

    const res = await api()
      .get('/api/v1/posts/feed')
      .set(...member.auth)
      .expect(200);
    const titles = res.body.data.map((p) => p.title);
    expect(titles).toContain('Mine');
    expect(titles).not.toContain('Theirs');
  });

  it('filters posts by search term', async () => {
    const { member, community } = await setup();
    await createPost(community, member, { title: 'Water supply', body: 'Shut off on Friday' });
    await createPost(community, member, { title: 'Festival', body: 'Dates confirmed' });

    const res = await api()
      .get(`/api/v1/communities/${community._id}/posts?q=festival`)
      .set(...member.auth)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Festival');
  });
});

describe('editing and deleting', () => {
  it('lets the author edit their own post', async () => {
    const { member, community } = await setup();
    const post = await createPost(community, member);

    const res = await api()
      .patch(`/api/v1/posts/${post._id}`)
      .set(...member.auth)
      .send({ body: 'Edited body' })
      .expect(200);

    expect(res.body.data.body).toBe('Edited body');
    expect(res.body.data.editedAt).toBeTruthy();
  });

  it('stops another member from editing someone else’s post', async () => {
    const { owner, member, community } = await setup();
    const post = await createPost(community, member);

    const res = await api()
      .patch(`/api/v1/posts/${post._id}`)
      .set(...owner.auth)
      .send({ body: 'Not mine to edit' })
      .expect(403);

    expect(res.body.error.message).toMatch(/Only the author/i);
  });

  it('lets a moderator delete any post', async () => {
    const { owner, member, community } = await setup();
    const post = await createPost(community, member);

    await api()
      .delete(`/api/v1/posts/${post._id}`)
      .set(...owner.auth)
      .expect(200);
    expect(await Post.findById(post._id)).toBeNull();
  });

  it('stops a plain member deleting another member’s post', async () => {
    const { member, community } = await setup();
    const other = await registerUser();
    await addMember(community, other);
    const post = await createPost(community, member);

    await api()
      .delete(`/api/v1/posts/${post._id}`)
      .set(...other.auth)
      .expect(403);
  });
});

describe('likes and shares', () => {
  it('toggles a like on and off', async () => {
    const { owner, member, community } = await setup();
    const post = await createPost(community, owner);

    const liked = await api()
      .post(`/api/v1/posts/${post._id}/like`)
      .set(...member.auth)
      .expect(200);
    expect(liked.body.data).toEqual({ isLiked: true, likeCount: 1 });

    const unliked = await api()
      .post(`/api/v1/posts/${post._id}/like`)
      .set(...member.auth)
      .expect(200);
    expect(unliked.body.data).toEqual({ isLiked: false, likeCount: 0 });
  });

  it('counts a share', async () => {
    const { member, community } = await setup();
    const post = await createPost(community, member);

    const res = await api()
      .post(`/api/v1/posts/${post._id}/share`)
      .set(...member.auth)
      .expect(200);
    expect(res.body.data.shareCount).toBe(1);
  });
});

describe('moderation', () => {
  it('lets a moderator hide a post, removing it from the list', async () => {
    const { owner, member, community } = await setup();
    const post = await createPost(community, member);

    await api()
      .patch(`/api/v1/posts/${post._id}/moderate`)
      .set(...owner.auth)
      .send({ status: 'hidden', reason: 'Off topic' })
      .expect(200);

    const list = await api()
      .get(`/api/v1/communities/${community._id}/posts`)
      .set(...member.auth)
      .expect(200);
    expect(list.body.data).toHaveLength(0);

    // The author can no longer open it, but a moderator still can.
    await api()
      .get(`/api/v1/posts/${post._id}`)
      .set(...member.auth)
      .expect(404);
    await api()
      .get(`/api/v1/posts/${post._id}`)
      .set(...owner.auth)
      .expect(200);
  });

  it('refuses pinning by a plain member', async () => {
    const { member, community } = await setup();
    const post = await createPost(community, member);

    await api()
      .patch(`/api/v1/posts/${post._id}/pin`)
      .set(...member.auth)
      .send({ pinned: true })
      .expect(403);
  });
});

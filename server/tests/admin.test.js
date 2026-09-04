/**
 * tests/admin.test.js — Phase 4 platform-admin tools, reports, notifications,
 * and the Phase 2 dashboard summary.
 */
const {
  api,
  registerUser,
  makePlatformAdmin,
  createApprovedCommunity,
  addMember,
  createPost,
} = require('./helpers');

describe('platform admin authorization', () => {
  it('refuses admin endpoints to ordinary users', async () => {
    const user = await registerUser();
    await api()
      .get('/api/v1/admin/stats')
      .set(...user.auth)
      .expect(403);
    await api()
      .get('/api/v1/admin/users')
      .set(...user.auth)
      .expect(403);
  });

  it('serves platform stats to a platform admin', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    const res = await api()
      .get('/api/v1/admin/stats')
      .set(...admin.auth)
      .expect(200);

    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('pendingCommunities');
    expect(res.body.data).toHaveProperty('engagementRate');
  });
});

describe('community approval queue', () => {
  it('approves a pending community, making it publicly visible', async () => {
    const owner = await registerUser();
    const admin = await makePlatformAdmin(await registerUser());

    const created = await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send({ name: 'Queue Test Circle', location: { city: 'Queueville' } })
      .expect(201);
    const communityId = created.body.data.community._id;

    const pending = await api()
      .get('/api/v1/admin/communities?status=pending')
      .set(...admin.auth)
      .expect(200);
    expect(pending.body.data.map((c) => c._id)).toContain(communityId);

    await api()
      .patch(`/api/v1/admin/communities/${communityId}/review`)
      .set(...admin.auth)
      .send({ action: 'approve' })
      .expect(200);

    const publicList = await api()
      .get('/api/v1/communities')
      .set(...owner.auth)
      .expect(200);
    expect(publicList.body.data.map((c) => c._id)).toContain(communityId);
  });

  it('notifies the creator when their community is approved', async () => {
    const owner = await registerUser();
    const admin = await makePlatformAdmin(await registerUser());

    const created = await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send({ name: 'Notify Circle', location: { city: 'Notifyville' } })
      .expect(201);

    await api()
      .patch(`/api/v1/admin/communities/${created.body.data.community._id}/review`)
      .set(...admin.auth)
      .send({ action: 'approve' })
      .expect(200);

    const notifications = await api()
      .get('/api/v1/notifications')
      .set(...owner.auth)
      .expect(200);
    expect(notifications.body.data.some((n) => n.type === 'community_approved')).toBe(true);
  });

  it('rejects an unknown review action', async () => {
    const owner = await registerUser();
    const admin = await makePlatformAdmin(await registerUser());
    const community = await createApprovedCommunity({ owner });

    await api()
      .patch(`/api/v1/admin/communities/${community._id}/review`)
      .set(...admin.auth)
      .send({ action: 'obliterate' })
      .expect(400);
  });
});

describe('user management', () => {
  it('lists users with community counts', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    const owner = await registerUser();
    await createApprovedCommunity({ owner });

    const res = await api()
      .get('/api/v1/admin/users')
      .set(...admin.auth)
      .expect(200);
    const row = res.body.data.find((u) => u.id === owner.user.id);
    expect(row.communityCount).toBe(1);
  });

  it('deactivates an account and blocks its sessions', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    const target = await registerUser();

    await api()
      .patch(`/api/v1/admin/users/${target.user.id}/active`)
      .set(...admin.auth)
      .send({ isActive: false })
      .expect(200);

    // A deactivated account is rejected as forbidden, and cannot sign back in.
    await api()
      .get('/api/v1/auth/me')
      .set(...target.auth)
      .expect(403);
    await api()
      .post('/api/v1/auth/login')
      .send({ email: target.email, password: target.password })
      .expect(403);
  });

  it('stops an admin from deactivating their own account', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    await api()
      .patch(`/api/v1/admin/users/${admin.user.id}/active`)
      .set(...admin.auth)
      .send({ isActive: false })
      .expect(400);
  });

  it('stops demoting the last platform admin', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    const other = await makePlatformAdmin(await registerUser());

    // Two admins exist, so this one can be demoted…
    await api()
      .patch(`/api/v1/admin/users/${other.user.id}/role`)
      .set(...admin.auth)
      .send({ role: 'user' })
      .expect(200);

    // …but now only one remains, and it cannot demote itself.
    await api()
      .patch(`/api/v1/admin/users/${admin.user.id}/role`)
      .set(...admin.auth)
      .send({ role: 'user' })
      .expect(400);
  });
});

describe('categories', () => {
  it('creates a category and exposes it to members', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    const user = await registerUser();

    await api()
      .post('/api/v1/admin/categories')
      .set(...admin.auth)
      .send({ name: 'Festivals & Culture' })
      .expect(201);

    const res = await api()
      .get('/api/v1/categories')
      .set(...user.auth)
      .expect(200);
    expect(res.body.data.map((c) => c.name)).toContain('Festivals & Culture');
  });

  it('rejects a duplicate category', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    await api()
      .post('/api/v1/admin/categories')
      .set(...admin.auth)
      .send({ name: 'Sports' })
      .expect(201);
    await api()
      .post('/api/v1/admin/categories')
      .set(...admin.auth)
      .send({ name: 'Sports' })
      .expect(409);
  });

  it('deactivates a category instead of deleting it', async () => {
    const admin = await makePlatformAdmin(await registerUser());
    const user = await registerUser();
    const created = await api()
      .post('/api/v1/admin/categories')
      .set(...admin.auth)
      .send({ name: 'Retired Topic' })
      .expect(201);

    await api()
      .delete(`/api/v1/admin/categories/${created.body.data._id}`)
      .set(...admin.auth)
      .expect(200);

    const active = await api()
      .get('/api/v1/categories')
      .set(...user.auth)
      .expect(200);
    expect(active.body.data.map((c) => c.name)).not.toContain('Retired Topic');

    const all = await api()
      .get('/api/v1/admin/categories')
      .set(...admin.auth)
      .expect(200);
    expect(all.body.data.map((c) => c.name)).toContain('Retired Topic');
  });
});

describe('abuse reports', () => {
  it('lets a member report a post and a moderator resolve it', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner });
    await addMember(community, member);
    const post = await createPost(community, owner, { title: 'Something objectionable' });

    await api()
      .post('/api/v1/users/reports')
      .set(...member.auth)
      .send({ targetType: 'post', targetId: post._id, reason: 'This breaks the community rules' })
      .expect(201);

    const queue = await api()
      .get('/api/v1/admin/reports')
      .set(...owner.auth)
      .expect(200);
    expect(queue.body.data).toHaveLength(1);
    expect(queue.body.data[0].target.preview).toContain('Something objectionable');

    await api()
      .patch(`/api/v1/admin/reports/${queue.body.data[0]._id}`)
      .set(...owner.auth)
      .send({ status: 'resolved', resolutionNote: 'Post removed' })
      .expect(200);
  });

  it('refuses a duplicate report from the same member', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner });
    await addMember(community, member);
    const post = await createPost(community, owner);

    const payload = { targetType: 'post', targetId: post._id, reason: 'Reported once already' };
    await api()
      .post('/api/v1/users/reports')
      .set(...member.auth)
      .send(payload)
      .expect(201);
    await api()
      .post('/api/v1/users/reports')
      .set(...member.auth)
      .send(payload)
      .expect(409);
  });

  it('stops a member reporting their own post', async () => {
    const owner = await registerUser();
    const community = await createApprovedCommunity({ owner });
    const post = await createPost(community, owner);

    await api()
      .post('/api/v1/users/reports')
      .set(...owner.auth)
      .send({ targetType: 'post', targetId: post._id, reason: 'Reporting myself' })
      .expect(400);
  });
});

describe('notifications', () => {
  it('notifies a post author about a new comment and marks it read', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner });
    await addMember(community, member);
    const post = await createPost(community, owner);

    await api()
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(...member.auth)
      .send({ body: 'Nice post' })
      .expect(201);

    const list = await api()
      .get('/api/v1/notifications')
      .set(...owner.auth)
      .expect(200);
    const comment = list.body.data.find((n) => n.type === 'post_comment');
    expect(comment).toBeTruthy();
    expect(list.body.meta.unreadCount).toBeGreaterThan(0);

    await api()
      .patch(`/api/v1/notifications/${comment._id}/read`)
      .set(...owner.auth)
      .expect(200);
    const after = await api()
      .get('/api/v1/notifications/unread-count')
      .set(...owner.auth)
      .expect(200);
    expect(after.body.data.unreadCount).toBe(0);
  });

  it('does not notify you about your own actions', async () => {
    const owner = await registerUser();
    const community = await createApprovedCommunity({ owner });
    const post = await createPost(community, owner);

    await api()
      .post(`/api/v1/posts/${post._id}/like`)
      .set(...owner.auth)
      .expect(200);
    const res = await api()
      .get('/api/v1/notifications')
      .set(...owner.auth)
      .expect(200);
    expect(res.body.data.filter((n) => n.type === 'post_like')).toHaveLength(0);
  });
});

describe('GET /api/v1/dashboard/summary', () => {
  it('returns stats, communities, events, notifications, and an activity series', async () => {
    const owner = await registerUser();
    const community = await createApprovedCommunity({ owner });
    await createPost(community, owner);

    const res = await api()
      .get('/api/v1/dashboard/summary')
      .set(...owner.auth)
      .expect(200);

    expect(res.body.data.stats.communities).toBe(1);
    expect(res.body.data.stats.myPosts).toBe(1);
    expect(res.body.data.communities).toHaveLength(1);
    expect(res.body.data.activity).toHaveLength(14);
    expect(res.body.data.activity.at(-1)).toHaveProperty('posts');
  });

  it('requires authentication', async () => {
    await api().get('/api/v1/dashboard/summary').expect(401);
  });
});

describe('profile and preferences', () => {
  it('persists UI preferences on the user profile', async () => {
    const user = await registerUser();
    const res = await api()
      .patch('/api/v1/users/me/preferences')
      .set(...user.auth)
      .send({ theme: 'dark', feedView: 'grid', sidebarCollapsed: true })
      .expect(200);

    expect(res.body.data).toMatchObject({
      theme: 'dark',
      feedView: 'grid',
      sidebarCollapsed: true,
    });

    const me = await api()
      .get('/api/v1/users/me')
      .set(...user.auth)
      .expect(200);
    expect(me.body.data.preferences.theme).toBe('dark');
  });

  it('rejects an unknown theme value', async () => {
    const user = await registerUser();
    await api()
      .patch('/api/v1/users/me/preferences')
      .set(...user.auth)
      .send({ theme: 'neon' })
      .expect(400);
  });

  it('updates hometown details without wiping the rest', async () => {
    const user = await registerUser({ city: 'Oldtown' });
    const res = await api()
      .patch('/api/v1/users/me')
      .set(...user.auth)
      .send({ bio: 'Moved away, still connected', hometown: { currentCity: 'Newcity' } })
      .expect(200);

    expect(res.body.data.hometown.city).toBe('Oldtown');
    expect(res.body.data.hometown.currentCity).toBe('Newcity');
    expect(res.body.data.bio).toBe('Moved away, still connected');
  });
});

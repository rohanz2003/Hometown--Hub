/**
 * tests/community.test.js — Phase 3 community CRUD + Phase 4 moderator tools.
 */
const {
  api,
  registerUser,
  makePlatformAdmin,
  createApprovedCommunity,
  addMember,
} = require('./helpers');
const Community = require('../src/models/Community');

const newCommunityPayload = (overrides = {}) => ({
  name: 'Riverside Village Circle',
  description: 'Neighbours along the river',
  location: { city: 'Riverside', state: 'TS', country: 'Testland' },
  tags: ['village'],
  ...overrides,
});

describe('POST /api/v1/communities', () => {
  it('creates a community pending admin approval and makes the creator its admin', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send(newCommunityPayload())
      .expect(201);

    expect(res.body.data.community.status).toBe('pending');
    expect(res.body.data.community.slug).toBe('riverside-village-circle');

    const detail = await api()
      .get(`/api/v1/communities/${res.body.data.community._id}`)
      .set(...owner.auth)
      .expect(200);
    expect(detail.body.data.myRole).toBe('admin');
  });

  it('rejects a community with no city', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send(newCommunityPayload({ location: {} }))
      .expect(400);

    expect(res.body.error.details.some((d) => d.field === 'location.city')).toBe(true);
  });

  it('requires authentication', async () => {
    await api().post('/api/v1/communities').send(newCommunityPayload()).expect(401);
  });

  it('gives a second community with the same name a unique slug', async () => {
    const owner = await registerUser();
    const first = await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send(newCommunityPayload())
      .expect(201);
    const second = await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send(newCommunityPayload())
      .expect(201);

    expect(second.body.data.community.slug).not.toBe(first.body.data.community.slug);
    expect(second.body.data.community.slug).toMatch(/-2$/);
  });
});

describe('GET /api/v1/communities', () => {
  it('lists only approved communities to ordinary users', async () => {
    const owner = await registerUser();
    await createApprovedCommunity({ owner, name: 'Approved Circle' });
    await api()
      .post('/api/v1/communities')
      .set(...owner.auth)
      .send(newCommunityPayload())
      .expect(201);

    const res = await api()
      .get('/api/v1/communities')
      .set(...owner.auth)
      .expect(200);
    const names = res.body.data.map((c) => c.name);
    expect(names).toContain('Approved Circle');
    expect(names).not.toContain('Riverside Village Circle');
  });

  it('filters by city and search term', async () => {
    const owner = await registerUser();
    await createApprovedCommunity({
      owner,
      name: 'Coastal Circle',
      location: { city: 'Seaside', state: 'TS' },
    });
    await createApprovedCommunity({
      owner,
      name: 'Hilltop Circle',
      location: { city: 'Highland', state: 'TS' },
    });

    const byCity = await api()
      .get('/api/v1/communities?city=Seaside')
      .set(...owner.auth)
      .expect(200);
    expect(byCity.body.data).toHaveLength(1);
    expect(byCity.body.data[0].name).toBe('Coastal Circle');

    const bySearch = await api()
      .get('/api/v1/communities?q=hilltop')
      .set(...owner.auth)
      .expect(200);
    expect(bySearch.body.data).toHaveLength(1);
  });

  it('paginates with meta', async () => {
    const owner = await registerUser();
    await createApprovedCommunity({ owner, name: 'One Circle' });
    await createApprovedCommunity({ owner, name: 'Two Circle' });
    await createApprovedCommunity({ owner, name: 'Three Circle' });

    const res = await api()
      .get('/api/v1/communities?limit=2&page=1')
      .set(...owner.auth)
      .expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
    });
  });
});

describe('joining and leaving', () => {
  it('joins an open community immediately', async () => {
    const owner = await registerUser();
    const joiner = await registerUser();
    const community = await createApprovedCommunity({ owner });

    const res = await api()
      .post(`/api/v1/communities/${community._id}/join`)
      .set(...joiner.auth)
      .send({})
      .expect(201);

    expect(res.body.data.status).toBe('approved');
    const refreshed = await Community.findById(community._id);
    expect(refreshed.memberCount).toBe(2);
  });

  it('queues a join request when the community requires approval', async () => {
    const owner = await registerUser();
    const joiner = await registerUser();
    const community = await createApprovedCommunity({ owner, requiresApproval: true });

    const res = await api()
      .post(`/api/v1/communities/${community._id}/join`)
      .set(...joiner.auth)
      .send({ joinMessage: 'My family is from here' })
      .expect(201);

    expect(res.body.data.status).toBe('pending');
  });

  it('rejects joining twice', async () => {
    const owner = await registerUser();
    const joiner = await registerUser();
    const community = await createApprovedCommunity({ owner });

    await api()
      .post(`/api/v1/communities/${community._id}/join`)
      .set(...joiner.auth)
      .send({})
      .expect(201);
    const res = await api()
      .post(`/api/v1/communities/${community._id}/join`)
      .set(...joiner.auth)
      .send({})
      .expect(409);
    expect(res.body.error.message).toMatch(/already a member/i);
  });

  it('stops the last admin from leaving', async () => {
    const owner = await registerUser();
    const community = await createApprovedCommunity({ owner });

    const res = await api()
      .delete(`/api/v1/communities/${community._id}/leave`)
      .set(...owner.auth)
      .expect(400);
    expect(res.body.error.message).toMatch(/Promote another admin/i);
  });

  it('lets an ordinary member leave', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner });
    await addMember(community, member);

    await api()
      .delete(`/api/v1/communities/${community._id}/leave`)
      .set(...member.auth)
      .expect(200);
    const refreshed = await Community.findById(community._id);
    expect(refreshed.memberCount).toBe(1);
  });
});

describe('moderator member management', () => {
  it('approves a pending join request', async () => {
    const owner = await registerUser();
    const joiner = await registerUser();
    const community = await createApprovedCommunity({ owner, requiresApproval: true });

    await api()
      .post(`/api/v1/communities/${community._id}/join`)
      .set(...joiner.auth)
      .send({})
      .expect(201);

    const pending = await api()
      .get(`/api/v1/communities/${community._id}/members?status=pending`)
      .set(...owner.auth)
      .expect(200);
    expect(pending.body.data).toHaveLength(1);

    const membershipId = pending.body.data[0]._id;
    const res = await api()
      .patch(`/api/v1/communities/${community._id}/members/${membershipId}/review`)
      .set(...owner.auth)
      .send({ action: 'approve' })
      .expect(200);

    expect(res.body.data.status).toBe('approved');
  });

  it('refuses member management to an ordinary member', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner, requiresApproval: true });
    await addMember(community, member);

    const joiner = await registerUser();
    await api()
      .post(`/api/v1/communities/${community._id}/join`)
      .set(...joiner.auth)
      .send({})
      .expect(201);
    const pending = await api()
      .get(`/api/v1/communities/${community._id}/members?status=pending`)
      .set(...member.auth)
      .expect(200);

    await api()
      .patch(`/api/v1/communities/${community._id}/members/${pending.body.data[0]._id}/review`)
      .set(...member.auth)
      .send({ action: 'approve' })
      .expect(403);
  });

  it('promotes a member to moderator', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner });
    const membership = await addMember(community, member);

    const res = await api()
      .patch(`/api/v1/communities/${community._id}/members/${membership._id}/role`)
      .set(...owner.auth)
      .send({ role: 'moderator' })
      .expect(200);

    expect(res.body.data.role).toBe('moderator');
  });

  it('stops an admin from changing their own role', async () => {
    const owner = await registerUser();
    const community = await createApprovedCommunity({ owner });
    const members = await api()
      .get(`/api/v1/communities/${community._id}/members`)
      .set(...owner.auth)
      .expect(200);
    const own = members.body.data.find((m) => m.user._id === owner.user.id);

    await api()
      .patch(`/api/v1/communities/${community._id}/members/${own._id}/role`)
      .set(...owner.auth)
      .send({ role: 'member' })
      .expect(400);
  });
});

describe('PATCH /api/v1/communities/:id', () => {
  it('lets a community admin edit details', async () => {
    const owner = await registerUser();
    const community = await createApprovedCommunity({ owner });

    const res = await api()
      .patch(`/api/v1/communities/${community._id}`)
      .set(...owner.auth)
      .send({ description: 'Updated description' })
      .expect(200);

    expect(res.body.data.description).toBe('Updated description');
  });

  it('refuses edits from a plain member', async () => {
    const owner = await registerUser();
    const member = await registerUser();
    const community = await createApprovedCommunity({ owner });
    await addMember(community, member);

    await api()
      .patch(`/api/v1/communities/${community._id}`)
      .set(...member.auth)
      .send({ description: 'Nope' })
      .expect(403);
  });

  it('lets a platform admin edit any community', async () => {
    const owner = await registerUser();
    const admin = await makePlatformAdmin(await registerUser());
    const community = await createApprovedCommunity({ owner });

    await api()
      .patch(`/api/v1/communities/${community._id}`)
      .set(...admin.auth)
      .send({ description: 'Admin override' })
      .expect(200);
  });
});

describe('private community visibility', () => {
  it('hides posts from non-members', async () => {
    const owner = await registerUser();
    const outsider = await registerUser();
    const community = await createApprovedCommunity({ owner, visibility: 'private' });

    const res = await api()
      .get(`/api/v1/communities/${community._id}/posts`)
      .set(...outsider.auth)
      .expect(403);
    expect(res.body.error.message).toMatch(/private/i);
  });
});

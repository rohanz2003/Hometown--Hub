/**
 * tests/helpers.js — fixtures and small helpers shared by the test suites.
 *
 * All fixture data is obviously fake so it can never be mistaken for real
 * community content.
 */
const request = require('supertest');
const createApp = require('../src/app');
const Community = require('../src/models/Community');
const Membership = require('../src/models/Membership');
const { COMMUNITY_ROLES, COMMUNITY_STATUS, MEMBERSHIP_STATUS } = require('../src/utils/constants');

const app = createApp();
const api = () => request(app);

const PASSWORD = 'TestPass123';

let counter = 0;
const uniqueEmail = (prefix = 'user') => {
  counter += 1;
  return `${prefix}${counter}.${Date.now()}@test.local`;
};

/** Registers a user and returns `{ user, accessToken, refreshCookie, auth }`. */
async function registerUser(overrides = {}) {
  const payload = {
    name: overrides.name || 'Test Neighbour',
    email: overrides.email || uniqueEmail(),
    password: overrides.password || PASSWORD,
    hometown: { city: overrides.city || 'Testville', state: 'TS', country: 'Testland' },
    ...(overrides.phone ? { phone: overrides.phone } : {}),
  };

  const res = await api().post('/api/v1/auth/register').send(payload).expect(201);
  const cookies = res.headers['set-cookie'] || [];

  return {
    user: res.body.data.user,
    accessToken: res.body.data.accessToken,
    refreshCookie: cookies.find((c) => c.startsWith('hh_refresh=')) || '',
    password: payload.password,
    email: payload.email,
    /** Convenience: `.set(...auth)` style header tuple. */
    auth: ['Authorization', `Bearer ${res.body.data.accessToken}`],
  };
}

/** Promotes an existing account to platform admin and re-authenticates it. */
async function makePlatformAdmin(session) {
  const User = require('../src/models/User');
  await User.findByIdAndUpdate(session.user.id, {
    role: 'platform_admin',
    $inc: { tokenVersion: 1 },
  });
  const res = await api()
    .post('/api/v1/auth/login')
    .send({ email: session.email, password: session.password })
    .expect(200);
  return {
    ...session,
    user: res.body.data.user,
    accessToken: res.body.data.accessToken,
    auth: ['Authorization', `Bearer ${res.body.data.accessToken}`],
  };
}

/**
 * Creates a community directly in the database, already approved, with `owner`
 * as its community admin — skips the approval round trip in unrelated tests.
 */
async function createApprovedCommunity({ owner, name = 'Test Village Circle', ...overrides }) {
  const community = await Community.create({
    name,
    slug: `${Community.toSlug(name)}-${Date.now()}`,
    description: 'Fixture community',
    location: { city: 'Testville', state: 'TS', country: 'Testland' },
    createdBy: owner.user.id,
    status: COMMUNITY_STATUS.APPROVED,
    memberCount: 1,
    ...overrides,
  });

  await Membership.create({
    user: owner.user.id,
    community: community._id,
    role: COMMUNITY_ROLES.ADMIN,
    status: MEMBERSHIP_STATUS.APPROVED,
  });

  return community;
}

/** Adds a user to a community with the given role. */
async function addMember(community, session, role = COMMUNITY_ROLES.MEMBER) {
  const membership = await Membership.create({
    user: session.user.id,
    community: community._id,
    role,
    status: MEMBERSHIP_STATUS.APPROVED,
  });
  await Community.findByIdAndUpdate(community._id, { $inc: { memberCount: 1 } });
  return membership;
}

/** Creates a post via the API so counters and notifications behave realistically. */
async function createPost(community, session, overrides = {}) {
  const res = await api()
    .post(`/api/v1/communities/${community._id}/posts`)
    .set(...session.auth)
    .send({ title: 'Fixture post', body: 'Fixture post body', ...overrides })
    .expect(201);
  return res.body.data;
}

module.exports = {
  app,
  api,
  PASSWORD,
  uniqueEmail,
  registerUser,
  makePlatformAdmin,
  createApprovedCommunity,
  addMember,
  createPost,
};

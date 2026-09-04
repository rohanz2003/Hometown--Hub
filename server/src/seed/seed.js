/**
 * seed/seed.js — populates the database with clearly-labeled demo data.
 *
 * Everything created here is marked "[DEMO]" in its description so seeded rows
 * can never be mistaken for real community activity (rules.md § Boundaries of AI).
 *
 * Usage:  npm run seed --workspace server        (add `-- --fresh` to wipe first)
 */
const env = require('../config/env');
const logger = require('../utils/logger');
const { connectDb, disconnectDb, mongoose } = require('../config/db');
const { User, Community, Membership, Post, Comment, Event, Category } = require('../models');
const {
  COMMUNITY_ROLES,
  COMMUNITY_STATUS,
  MEMBERSHIP_STATUS,
  POST_TYPES,
  RSVP_STATUS,
} = require('../utils/constants');

const DEMO_PASSWORD = 'Hometown123';

const USERS = [
  {
    name: 'Asha Menon',
    email: 'asha@example.com',
    city: 'Kollengode',
    state: 'Kerala',
    role: 'platform_admin',
  },
  { name: 'Ravi Kulkarni', email: 'ravi@example.com', city: 'Kollengode', state: 'Kerala' },
  { name: 'Priya Nair', email: 'priya@example.com', city: 'Kollengode', state: 'Kerala' },
  { name: 'Sam Okafor', email: 'sam@example.com', city: 'Ilesa', state: 'Osun' },
  { name: 'Meera Iyer', email: 'meera@example.com', city: 'Thanjavur', state: 'Tamil Nadu' },
];

const CATEGORIES = [
  { name: 'Announcements', appliesTo: ['post'] },
  { name: 'Festivals & Culture', appliesTo: ['post', 'event'] },
  { name: 'Civic & Infrastructure', appliesTo: ['post'] },
  { name: 'Help & Support', appliesTo: ['post'] },
  { name: 'Sports', appliesTo: ['event'] },
];

const COMMUNITIES = [
  {
    name: 'Kollengode Village Circle',
    city: 'Kollengode',
    state: 'Kerala',
    status: COMMUNITY_STATUS.APPROVED,
    description: '[DEMO] Neighbours of Kollengode sharing news, festivals, and help requests.',
    tags: ['village', 'kerala', 'culture'],
  },
  {
    name: 'Thanjavur Town Forum',
    city: 'Thanjavur',
    state: 'Tamil Nadu',
    status: COMMUNITY_STATUS.APPROVED,
    description: '[DEMO] Civic updates and cultural events for Thanjavur residents.',
    tags: ['town', 'civic'],
  },
  {
    name: 'Ilesa Hometown Network',
    city: 'Ilesa',
    state: 'Osun',
    status: COMMUNITY_STATUS.PENDING,
    description: '[DEMO] Awaiting platform review — demonstrates the approval queue.',
    tags: ['diaspora'],
  },
];

const POSTS = [
  {
    type: POST_TYPES.ANNOUNCEMENT,
    title: 'Temple festival dates confirmed',
    body: '[DEMO] The annual festival runs from the 12th to the 15th. Volunteers needed for the evening procession — reply here if you can help.',
    pinned: true,
  },
  {
    type: POST_TYPES.CULTURE,
    title: 'Collecting old photographs of the village square',
    body: '[DEMO] We are putting together an archive of photos from before the 1990s. If your family has any, we can scan and return them the same day.',
  },
  {
    type: POST_TYPES.ALERT,
    title: 'Water supply interruption on Friday',
    body: '[DEMO] The main line will be shut for repairs from 9am to 4pm. Please store water in advance.',
  },
  {
    type: POST_TYPES.HELP,
    title: 'Looking for a tutor for 8th standard maths',
    body: '[DEMO] Evenings preferred, twice a week. Happy to pay the going rate — please message me.',
  },
];

async function seed({ fresh = false } = {}) {
  await connectDb();

  if (fresh) {
    logger.info('Clearing existing collections');
    await Promise.all(
      [User, Community, Membership, Post, Comment, Event, Category].map((m) => m.deleteMany({})),
    );
  }

  const existing = await User.countDocuments({});
  if (existing > 0 && !fresh) {
    logger.info('Database already has users — pass --fresh to reseed from scratch');
    await disconnectDb();
    return;
  }

  /* Users ------------------------------------------------------------------ */
  const users = [];
  for (const spec of USERS) {
    const user = new User({
      name: spec.name,
      email: spec.email,
      role: spec.role || 'user',
      hometown: { city: spec.city, state: spec.state, country: 'India' },
      bio: `[DEMO] Seeded account from ${spec.city}.`,
    });
    user.password = DEMO_PASSWORD;
    // eslint-disable-next-line no-await-in-loop -- small fixed list, order kept for readable logs
    await user.save();
    users.push(user);
  }
  const [admin, ravi, priya, sam, meera] = users;

  /* Categories ------------------------------------------------------------- */
  const categories = await Category.insertMany(
    CATEGORIES.map((c) => ({
      ...c,
      slug: Category.toSlug(c.name),
      description: '[DEMO] Seeded category',
      createdBy: admin._id,
    })),
  );

  /* Communities + memberships --------------------------------------------- */
  const communities = [];
  for (const spec of COMMUNITIES) {
    // eslint-disable-next-line no-await-in-loop
    const community = await Community.create({
      name: spec.name,
      slug: Community.toSlug(spec.name),
      description: spec.description,
      location: { city: spec.city, state: spec.state, country: 'India' },
      tags: spec.tags,
      createdBy: admin._id,
      status: spec.status,
      reviewedBy: spec.status === COMMUNITY_STATUS.APPROVED ? admin._id : null,
      reviewedAt: spec.status === COMMUNITY_STATUS.APPROVED ? new Date() : null,
      rules: [
        { title: 'Be neighbourly', body: '[DEMO] Disagree without being unkind.' },
        { title: 'Keep it local', body: '[DEMO] Posts should matter to people here.' },
      ],
    });
    communities.push(community);
  }
  const [kollengode, thanjavur, ilesa] = communities;

  const memberships = [
    { user: admin, community: kollengode, role: COMMUNITY_ROLES.ADMIN },
    { user: ravi, community: kollengode, role: COMMUNITY_ROLES.MODERATOR },
    { user: priya, community: kollengode, role: COMMUNITY_ROLES.MEMBER },
    { user: meera, community: kollengode, role: COMMUNITY_ROLES.MEMBER },
    { user: admin, community: thanjavur, role: COMMUNITY_ROLES.ADMIN },
    { user: meera, community: thanjavur, role: COMMUNITY_ROLES.MODERATOR },
    { user: admin, community: ilesa, role: COMMUNITY_ROLES.ADMIN },
    { user: sam, community: ilesa, role: COMMUNITY_ROLES.MEMBER },
  ];

  await Membership.insertMany(
    memberships.map((m) => ({
      user: m.user._id,
      community: m.community._id,
      role: m.role,
      status: MEMBERSHIP_STATUS.APPROVED,
    })),
  );

  // One pending request so the moderator queue is not empty.
  await Membership.create({
    user: sam._id,
    community: kollengode._id,
    role: COMMUNITY_ROLES.MEMBER,
    status: MEMBERSHIP_STATUS.PENDING,
    joinMessage: '[DEMO] My family is from here — would love to join.',
  });

  await Promise.all(
    communities.map(async (community) => {
      const memberCount = await Membership.countDocuments({
        community: community._id,
        status: MEMBERSHIP_STATUS.APPROVED,
      });
      await Community.findByIdAndUpdate(community._id, { memberCount });
    }),
  );

  /* Posts + comments ------------------------------------------------------- */
  const authors = [admin, ravi, priya, meera];
  const posts = [];
  for (let i = 0; i < POSTS.length; i += 1) {
    const spec = POSTS[i];
    const author = authors[i % authors.length];
    // eslint-disable-next-line no-await-in-loop
    const post = await Post.create({
      community: kollengode._id,
      author: author._id,
      title: spec.title,
      body: spec.body,
      type: spec.type,
      category: categories[i % categories.length]._id,
      tags: ['demo'],
      isPinned: Boolean(spec.pinned),
      pinnedAt: spec.pinned ? new Date() : null,
      pinnedBy: spec.pinned ? admin._id : null,
      likes: [priya._id, meera._id].slice(0, (i % 2) + 1),
    });
    posts.push(post);
  }

  await Comment.insertMany([
    {
      post: posts[0]._id,
      community: kollengode._id,
      author: priya._id,
      body: '[DEMO] I can help with the evening procession.',
    },
    {
      post: posts[0]._id,
      community: kollengode._id,
      author: meera._id,
      body: '[DEMO] Adding this to our family calendar.',
    },
    {
      post: posts[2]._id,
      community: kollengode._id,
      author: ravi._id,
      body: '[DEMO] Thanks for the heads-up.',
    },
  ]);

  await Promise.all(
    posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ post: post._id });
      await Post.findByIdAndUpdate(post._id, { commentCount });
    }),
  );
  await Community.findByIdAndUpdate(kollengode._id, { postCount: posts.length });

  /* Events ----------------------------------------------------------------- */
  const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const events = await Event.create([
    {
      community: kollengode._id,
      organizer: admin._id,
      title: '[DEMO] Village clean-up morning',
      description: 'Meet at the school gate with gloves. Tea provided afterwards.',
      startsAt: inDays(4),
      endsAt: inDays(4.2),
      location: { venue: 'Government School ground', city: 'Kollengode' },
      capacity: 40,
      attendees: [
        { user: admin._id, status: RSVP_STATUS.GOING },
        { user: priya._id, status: RSVP_STATUS.GOING },
        { user: meera._id, status: RSVP_STATUS.INTERESTED },
      ],
    },
    {
      community: kollengode._id,
      organizer: ravi._id,
      title: '[DEMO] Storytelling evening with village elders',
      description: 'Recording oral histories for the community archive.',
      startsAt: inDays(11),
      location: { venue: 'Community hall', city: 'Kollengode' },
      attendees: [{ user: ravi._id, status: RSVP_STATUS.GOING }],
    },
    {
      community: thanjavur._id,
      organizer: meera._id,
      title: '[DEMO] Neighbourhood cricket friendly',
      description: 'Two teams, twenty overs, everyone welcome to watch.',
      startsAt: inDays(6),
      category: categories[4]._id,
      location: { venue: 'Riverside ground', city: 'Thanjavur' },
      attendees: [{ user: meera._id, status: RSVP_STATUS.GOING }],
    },
  ]);

  await Community.findByIdAndUpdate(kollengode._id, { eventCount: 2 });
  await Community.findByIdAndUpdate(thanjavur._id, { eventCount: 1 });

  logger.info('Seed complete', {
    users: users.length,
    communities: communities.length,
    posts: posts.length,
    events: events.length,
    categories: categories.length,
  });

  /* eslint-disable no-console -- the seed script is a CLI tool; this is its output. */
  console.log('\n  Demo accounts (all use the same password):');
  console.log(`  password: ${DEMO_PASSWORD}`);
  USERS.forEach((u) => console.log(`  - ${u.email.padEnd(22)} ${u.role || 'user'}`));
  console.log(`\n  Database: ${mongoose.connection.name} (${env.NODE_ENV})\n`);
  /* eslint-enable no-console */

  await disconnectDb();
}

if (require.main === module) {
  seed({ fresh: process.argv.includes('--fresh') }).catch(async (err) => {
    logger.error('Seed failed', { error: err.message, stack: err.stack });
    await disconnectDb();
    process.exit(1);
  });
}

module.exports = seed;

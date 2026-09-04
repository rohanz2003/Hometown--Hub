/**
 * tests/event.test.js — Phase 3 event CRUD and RSVP behaviour.
 */
const { api, registerUser, createApprovedCommunity, addMember } = require('./helpers');

const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString();

async function setup() {
  const owner = await registerUser({ name: 'Organizer' });
  const member = await registerUser({ name: 'Attendee' });
  const community = await createApprovedCommunity({ owner });
  await addMember(community, member);
  return { owner, member, community };
}

async function createEvent(community, session, overrides = {}) {
  const res = await api()
    .post(`/api/v1/communities/${community._id}/events`)
    .set(...session.auth)
    .send({
      title: 'Village clean-up morning',
      description: 'Meet at the school gate',
      startsAt: inDays(5),
      location: { venue: 'School ground', city: 'Testville' },
      ...overrides,
    });
  return res;
}

describe('POST /api/v1/communities/:id/events', () => {
  it('creates an event with the organizer already going', async () => {
    const { owner, community } = await setup();
    const res = await createEvent(community, owner);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Village clean-up morning');
    expect(res.body.data.goingCount).toBe(1);
    expect(res.body.data.myRsvp).toBe('going');
  });

  it('rejects an end time before the start time', async () => {
    const { owner, community } = await setup();
    const res = await createEvent(community, owner, { startsAt: inDays(5), endsAt: inDays(4) });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/end time must be after/i);
  });

  it('rejects a missing start date', async () => {
    const { owner, community } = await setup();
    const res = await api()
      .post(`/api/v1/communities/${community._id}/events`)
      .set(...owner.auth)
      .send({ title: 'No date event' })
      .expect(400);

    expect(res.body.error.details.some((d) => d.field === 'startsAt')).toBe(true);
  });

  it('refuses event creation by a non-member', async () => {
    const { community } = await setup();
    const outsider = await registerUser();
    const res = await createEvent(community, outsider);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/events', () => {
  it('lists upcoming events from joined communities', async () => {
    const { owner, member, community } = await setup();
    await createEvent(community, owner, { title: 'Upcoming meetup', startsAt: inDays(3) });

    const res = await api()
      .get('/api/v1/events')
      .set(...member.auth)
      .expect(200);
    expect(res.body.data.map((e) => e.title)).toContain('Upcoming meetup');
  });

  it('excludes past events from the upcoming view', async () => {
    const { owner, member, community } = await setup();
    // Past events cannot be created through the API, so seed one directly.
    const Event = require('../src/models/Event');
    await Event.create({
      community: community._id,
      organizer: owner.user.id,
      title: 'Last year’s fair',
      startsAt: new Date(Date.now() - 30 * 86400000),
    });

    const upcoming = await api()
      .get('/api/v1/events')
      .set(...member.auth)
      .expect(200);
    expect(upcoming.body.data.map((e) => e.title)).not.toContain('Last year’s fair');

    const past = await api()
      .get('/api/v1/events?when=past')
      .set(...member.auth)
      .expect(200);
    expect(past.body.data.map((e) => e.title)).toContain('Last year’s fair');
  });
});

describe('RSVP', () => {
  it('records and updates an RSVP', async () => {
    const { owner, member, community } = await setup();
    const event = (await createEvent(community, owner)).body.data;

    const going = await api()
      .post(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .send({ status: 'going' })
      .expect(200);
    expect(going.body.data).toMatchObject({ myRsvp: 'going', goingCount: 2 });

    const interested = await api()
      .post(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .send({ status: 'interested' })
      .expect(200);
    expect(interested.body.data).toMatchObject({
      myRsvp: 'interested',
      goingCount: 1,
      interestedCount: 1,
    });
  });

  it('withdraws an RSVP', async () => {
    const { owner, member, community } = await setup();
    const event = (await createEvent(community, owner)).body.data;

    await api()
      .post(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .send({ status: 'going' })
      .expect(200);
    const res = await api()
      .delete(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .expect(200);
    expect(res.body.data).toMatchObject({ myRsvp: null, goingCount: 1 });
  });

  it('refuses an RSVP once capacity is reached', async () => {
    const { owner, member, community } = await setup();
    const event = (await createEvent(community, owner, { capacity: 1 })).body.data;

    const res = await api()
      .post(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .send({ status: 'going' })
      .expect(400);

    expect(res.body.error.message).toMatch(/fully booked/i);
  });

  it('rejects an invalid RSVP status', async () => {
    const { owner, member, community } = await setup();
    const event = (await createEvent(community, owner)).body.data;

    await api()
      .post(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .send({ status: 'maybe-later' })
      .expect(400);
  });
});

describe('editing and cancelling', () => {
  it('lets the organizer edit their event', async () => {
    const { owner, community } = await setup();
    const event = (await createEvent(community, owner)).body.data;

    const res = await api()
      .patch(`/api/v1/events/${event._id}`)
      .set(...owner.auth)
      .send({ title: 'Village clean-up (new time)' })
      .expect(200);

    expect(res.body.data.title).toBe('Village clean-up (new time)');
  });

  it('refuses an edit by another member', async () => {
    const { owner, member, community } = await setup();
    const event = (await createEvent(community, owner)).body.data;

    await api()
      .patch(`/api/v1/events/${event._id}`)
      .set(...member.auth)
      .send({ title: 'Hijacked' })
      .expect(403);
  });

  it('cancels an event and blocks further RSVPs', async () => {
    const { owner, member, community } = await setup();
    const event = (await createEvent(community, owner)).body.data;

    const cancelled = await api()
      .post(`/api/v1/events/${event._id}/cancel`)
      .set(...owner.auth)
      .send({ reason: 'Heavy rain forecast' })
      .expect(200);
    expect(cancelled.body.data.status).toBe('cancelled');

    const res = await api()
      .post(`/api/v1/events/${event._id}/rsvp`)
      .set(...member.auth)
      .send({ status: 'going' })
      .expect(400);
    expect(res.body.error.message).toMatch(/cancelled/i);
  });
});

/**
 * services/eventService.js — community events and RSVPs.
 *
 * Listing defaults to upcoming events in date order, which is what both the
 * dashboard cards and the events page need.
 */
const Event = require('../models/Event');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const { escapeRegex } = require('./communityService');
const { notify, notifyCommunity } = require('./notificationService');
const {
  EVENT_STATUS,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  RSVP_STATUS,
} = require('../utils/constants');

const ORGANIZER_FIELDS = 'name avatarUrl';
const COMMUNITY_FIELDS = 'name slug location.city';

function decorate(events, userId) {
  return events.map((event) => ({
    ...event,
    myRsvp: userId
      ? (event.attendees || []).find((a) => String(a.user) === String(userId))?.status || null
      : null,
    isOrganizer: userId
      ? String(event.organizer?._id || event.organizer) === String(userId)
      : false,
    attendees: undefined,
  }));
}

/** Builds the date window: upcoming (default), past, or all. */
function timeFilter(when) {
  const now = new Date();
  if (when === 'past') return { startsAt: { $lt: now } };
  if (when === 'all') return {};
  return { startsAt: { $gte: now } };
}

async function listEvents({ query = {}, userId, communityId = null, joinedOnly = false }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ...timeFilter(query.when) };

  if (communityId) {
    filter.community = communityId;
  } else if (joinedOnly && userId) {
    const rows = await Membership.find({ user: userId, status: MEMBERSHIP_STATUS.APPROVED })
      .select('community')
      .lean();
    if (rows.length === 0) return { items: [], meta: buildPageMeta({ page, limit, total: 0 }) };
    filter.community = { $in: rows.map((r) => r.community) };
  }

  filter.status = query.status || { $ne: null };
  if (query.city) filter['location.city'] = new RegExp(`^${escapeRegex(query.city)}`, 'i');
  if (query.category) filter.category = query.category;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { 'location.venue': rx }];
  }

  const sort = query.when === 'past' ? { startsAt: -1 } : { startsAt: 1 };

  const [items, total] = await Promise.all([
    Event.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('organizer', ORGANIZER_FIELDS)
      .populate('community', COMMUNITY_FIELDS)
      .populate('category', 'name slug')
      .lean(),
    Event.countDocuments(filter),
  ]);

  return { items: decorate(items, userId), meta: buildPageMeta({ page, limit, total }) };
}

function assertValidWindow({ startsAt, endsAt }) {
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
    throw ApiError.badRequest('The end time must be after the start time');
  }
}

/** Creates an event and announces it to the community. */
async function createEvent({ community, organizer, data }) {
  assertValidWindow(data);

  const event = await Event.create({
    ...data,
    community: community._id,
    organizer: organizer._id,
    // The organizer is automatically the first attendee.
    attendees: [{ user: organizer._id, status: RSVP_STATUS.GOING }],
  });

  await Community.findByIdAndUpdate(community._id, { $inc: { eventCount: 1 } });
  await event.populate([
    { path: 'organizer', select: ORGANIZER_FIELDS },
    { path: 'community', select: COMMUNITY_FIELDS },
  ]);

  await notifyCommunity({
    community: community._id,
    actor: organizer._id,
    event: event._id,
    type: NOTIFICATION_TYPES.EVENT_CREATED,
    message: `New event in ${community.name}: ${event.title}`,
    link: `/events/${event._id}`,
  });

  return decorate([event.toObject()], organizer._id)[0];
}

async function getEvent({ eventId, userId }) {
  const event = await Event.findById(eventId)
    .populate('organizer', ORGANIZER_FIELDS)
    .populate('community', COMMUNITY_FIELDS)
    .populate('category', 'name slug')
    .populate('attendees.user', 'name avatarUrl')
    .lean();

  if (!event) throw ApiError.notFound('That event no longer exists');

  const [decorated] = decorate([event], userId);
  // The attendee list is useful on the detail view — keep it here only.
  return { ...decorated, attendees: event.attendees };
}

const EDITABLE = [
  'title',
  'description',
  'category',
  'startsAt',
  'endsAt',
  'isAllDay',
  'location',
  'coverImageUrl',
  'capacity',
];

/** Organizers edit their own events; community moderators may edit any. */
async function updateEvent({ event, data, user, canModerate }) {
  if (String(event.organizer) !== String(user._id) && !canModerate) {
    throw ApiError.forbidden('Only the organizer can edit this event');
  }
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw ApiError.badRequest('This event has been cancelled and can no longer be edited');
  }

  EDITABLE.forEach((field) => {
    if (data[field] !== undefined) event[field] = data[field];
  });
  assertValidWindow({ startsAt: event.startsAt, endsAt: event.endsAt });
  await event.save();
  await event.populate([
    { path: 'organizer', select: ORGANIZER_FIELDS },
    { path: 'community', select: COMMUNITY_FIELDS },
  ]);
  return decorate([event.toObject()], user._id)[0];
}

/** Cancels an event and tells everyone who said they were going. */
async function cancelEvent({ event, reason = '', user, canModerate }) {
  if (String(event.organizer) !== String(user._id) && !canModerate) {
    throw ApiError.forbidden('Only the organizer can cancel this event');
  }
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw ApiError.badRequest('This event is already cancelled');
  }

  event.status = EVENT_STATUS.CANCELLED;
  event.cancelReason = reason;
  await event.save();

  const recipients = event.attendees.map((a) => a.user);
  await Promise.all(
    recipients.map((recipient) =>
      notify({
        recipient,
        actor: user._id,
        community: event.community,
        event: event._id,
        type: NOTIFICATION_TYPES.EVENT_CANCELLED,
        message: `"${event.title}" has been cancelled${reason ? `: ${reason}` : ''}`,
        link: `/events/${event._id}`,
      }),
    ),
  );

  return event;
}

/** Records or updates an RSVP. Capacity only limits "going". */
async function rsvp({ event, user, status }) {
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw ApiError.badRequest('This event has been cancelled');
  }
  if (event.isPast) throw ApiError.badRequest('This event has already taken place');

  const existing = event.attendees.find((a) => String(a.user) === String(user._id));
  const wasGoing = existing && existing.status === RSVP_STATUS.GOING;

  if (status === RSVP_STATUS.GOING && !wasGoing && event.isFull()) {
    throw ApiError.badRequest('This event is fully booked');
  }

  if (existing) {
    existing.status = status;
    existing.respondedAt = new Date();
    event.markModified('attendees');
  } else {
    event.attendees.push({ user: user._id, status });
  }

  await event.save();
  return { myRsvp: status, goingCount: event.goingCount, interestedCount: event.interestedCount };
}

/** Removes the caller's RSVP entirely. */
async function withdrawRsvp({ event, user }) {
  event.attendees = event.attendees.filter((a) => String(a.user) !== String(user._id));
  await event.save();
  return { myRsvp: null, goingCount: event.goingCount, interestedCount: event.interestedCount };
}

async function deleteEvent({ event, user, canModerate }) {
  if (String(event.organizer) !== String(user._id) && !canModerate) {
    throw ApiError.forbidden('Only the organizer can delete this event');
  }
  await event.deleteOne();
  await Community.findByIdAndUpdate(event.community, { $inc: { eventCount: -1 } });
}

module.exports = {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  rsvp,
  withdrawRsvp,
};

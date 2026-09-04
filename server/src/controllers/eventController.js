/**
 * controllers/eventController.js — event and RSVP endpoints.
 */
const eventService = require('../services/eventService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

/** Events across the user's communities (`?scope=all` widens to the platform). */
const list = asyncHandler(async (req, res) => {
  const { items, meta } = await eventService.listEvents({
    query: req.query,
    userId: req.user?._id,
    joinedOnly: req.query.scope !== 'all' && Boolean(req.user),
  });
  return sendSuccess(res, items, { meta });
});

const listByCommunity = asyncHandler(async (req, res) => {
  const { items, meta } = await eventService.listEvents({
    query: req.query,
    userId: req.user?._id,
    communityId: req.community._id,
  });
  return sendSuccess(res, items, { meta });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.uploadedImageUrl) data.coverImageUrl = req.uploadedImageUrl;

  const event = await eventService.createEvent({
    community: req.community,
    organizer: req.user,
    data,
  });
  return sendSuccess(res, event, { status: 201 });
});

const detail = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await eventService.getEvent({ eventId: req.params.eventId, userId: req.user?._id }),
  ),
);

const update = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.uploadedImageUrl) data.coverImageUrl = req.uploadedImageUrl;
  return sendSuccess(
    res,
    await eventService.updateEvent({
      event: req.event,
      data,
      user: req.user,
      canModerate: req.canModerate,
    }),
  );
});

const cancel = asyncHandler(async (req, res) => {
  const event = await eventService.cancelEvent({
    event: req.event,
    reason: req.body.reason,
    user: req.user,
    canModerate: req.canModerate,
  });
  return sendSuccess(res, { status: event.status });
});

const remove = asyncHandler(async (req, res) => {
  await eventService.deleteEvent({
    event: req.event,
    user: req.user,
    canModerate: req.canModerate,
  });
  return sendSuccess(res, { message: 'Event deleted' });
});

const rsvp = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await eventService.rsvp({ event: req.event, user: req.user, status: req.body.status }),
  ),
);

const withdrawRsvp = asyncHandler(async (req, res) =>
  sendSuccess(res, await eventService.withdrawRsvp({ event: req.event, user: req.user })),
);

module.exports = {
  list,
  listByCommunity,
  create,
  detail,
  update,
  cancel,
  remove,
  rsvp,
  withdrawRsvp,
};

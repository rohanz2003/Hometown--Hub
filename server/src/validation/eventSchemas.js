/**
 * validation/eventSchemas.js — event and RSVP request schemas.
 */
const { z } = require('zod');
const { objectId, idOrSlug, pagination, text } = require('./common');
const { EVENT_STATUS, RSVP_STATUS } = require('../utils/constants');

const eventLocationSchema = z.object({
  venue: z.string().trim().max(200).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  isOnline: z.coerce.boolean().optional().default(false),
  meetingUrl: z.string().trim().max(500).optional().default(''),
});

const createEventSchema = z.object({
  title: text(3, 160, 'Event title'),
  description: z.string().trim().max(3000).optional().default(''),
  category: objectId.optional().nullable(),
  startsAt: z.coerce.date({ invalid_type_error: 'Enter a valid start date and time' }),
  endsAt: z.coerce.date().optional().nullable(),
  isAllDay: z.coerce.boolean().optional().default(false),
  location: eventLocationSchema.optional().default({}),
  coverImageUrl: z.string().trim().max(500).optional().default(''),
  capacity: z.coerce.number().int().min(0).max(100000).optional().default(0),
});

const updateEventSchema = createEventSchema.partial();

const listEventsSchema = pagination.extend({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  category: objectId.optional(),
  status: z.enum(Object.values(EVENT_STATUS)).optional(),
  when: z.enum(['upcoming', 'past', 'all']).optional().default('upcoming'),
  scope: z.enum(['joined', 'all']).optional().default('joined'),
});

const eventParamsSchema = z.object({ eventId: objectId });
const communityEventParamsSchema = z.object({ communityId: idOrSlug });

const rsvpSchema = z.object({ status: z.enum(Object.values(RSVP_STATUS)) });

const cancelEventSchema = z.object({ reason: z.string().trim().max(300).optional().default('') });

module.exports = {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  eventParamsSchema,
  communityEventParamsSchema,
  rsvpSchema,
  cancelEventSchema,
};

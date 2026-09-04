/**
 * models/Event.js — a community gathering with RSVPs.
 *
 * Attendees are embedded because an event's guest list is small and is almost
 * always read together with the event itself.
 */
const mongoose = require('mongoose');
const { EVENT_STATUS, RSVP_STATUS } = require('../utils/constants');

const attendeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(RSVP_STATUS), default: RSVP_STATUS.GOING },
    respondedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    startsAt: { type: Date, required: [true, 'Start date is required'], index: true },
    endsAt: { type: Date, default: null },
    isAllDay: { type: Boolean, default: false },
    location: {
      venue: { type: String, trim: true, maxlength: 200, default: '' },
      address: { type: String, trim: true, maxlength: 300, default: '' },
      city: { type: String, trim: true, maxlength: 120, default: '' },
      isOnline: { type: Boolean, default: false },
      meetingUrl: { type: String, trim: true, default: '' },
    },
    coverImageUrl: { type: String, trim: true, default: '' },
    capacity: { type: Number, min: 0, default: 0 }, // 0 = unlimited
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.SCHEDULED,
      index: true,
    },
    cancelReason: { type: String, trim: true, maxlength: 300, default: '' },
    attendees: { type: [attendeeSchema], default: [] },
    goingCount: { type: Number, default: 0, min: 0 },
    interestedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

eventSchema.index({ community: 1, status: 1, startsAt: 1 });
eventSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

/** Recomputes RSVP counters whenever the attendee list changes. */
eventSchema.pre('save', function syncRsvpCounts(next) {
  if (this.isModified('attendees')) {
    this.goingCount = this.attendees.filter((a) => a.status === RSVP_STATUS.GOING).length;
    this.interestedCount = this.attendees.filter((a) => a.status === RSVP_STATUS.INTERESTED).length;
  }
  next();
});

eventSchema.methods.rsvpOf = function rsvpOf(userId) {
  if (!userId) return null;
  const found = this.attendees.find((a) => String(a.user) === String(userId));
  return found ? found.status : null;
};

eventSchema.methods.isFull = function isFull() {
  return this.capacity > 0 && this.goingCount >= this.capacity;
};

eventSchema.virtual('isPast').get(function isPast() {
  const end = this.endsAt || this.startsAt;
  return end ? end.getTime() < Date.now() : false;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);

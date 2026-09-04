/**
 * services/dashboardService.js — data for the Phase 2 dashboard.
 *
 * Returns everything the overview screen needs in one round trip: the user's
 * communities, upcoming events, recent notifications, and a 14-day activity
 * series for the small bar chart.
 */
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { MEMBERSHIP_STATUS, EVENT_STATUS, POST_STATUS } = require('../utils/constants');

const ACTIVITY_DAYS = 14;

/** `YYYY-MM-DD` in UTC — the bucket key shared by the chart series. */
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

/** Builds a zero-filled series so the chart never has gaps. */
function emptySeries(days = ACTIVITY_DAYS) {
  const series = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    series.push({ date: dayKey(d), posts: 0, events: 0 });
  }
  return series;
}

/** Counts posts and events per day across the user's communities. */
async function activitySeries(communityIds) {
  const series = emptySeries();
  if (communityIds.length === 0) return series;

  const since = new Date(`${series[0].date}T00:00:00.000Z`);
  const byDate = new Map(series.map((point) => [point.date, point]));

  const [posts, events] = await Promise.all([
    Post.aggregate([
      {
        $match: {
          community: { $in: communityIds },
          status: POST_STATUS.PUBLISHED,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Event.aggregate([
      { $match: { community: { $in: communityIds }, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  posts.forEach((row) => {
    const point = byDate.get(row._id);
    if (point) point.posts = row.count;
  });
  events.forEach((row) => {
    const point = byDate.get(row._id);
    if (point) point.events = row.count;
  });

  return series;
}

async function getSummary(userId) {
  const memberships = await Membership.find({ user: userId, status: MEMBERSHIP_STATUS.APPROVED })
    .select('community role')
    .lean();
  const communityIds = memberships.map((m) => m.community);
  const roleByCommunity = new Map(memberships.map((m) => [String(m.community), m.role]));

  const [
    communities,
    upcomingEvents,
    notifications,
    unreadCount,
    myPostCount,
    myCommentCount,
    likesReceived,
  ] = await Promise.all([
    Community.find({ _id: { $in: communityIds } })
      .sort({ memberCount: -1 })
      .limit(6)
      .select('name slug location memberCount postCount eventCount coverImageUrl status')
      .lean(),
    Event.find({
      community: { $in: communityIds },
      status: EVENT_STATUS.SCHEDULED,
      startsAt: { $gte: new Date() },
    })
      .sort({ startsAt: 1 })
      .limit(5)
      .populate('community', 'name slug')
      .select('title startsAt endsAt location goingCount community coverImageUrl')
      .lean(),
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('actor', 'name avatarUrl')
      .lean(),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Post.countDocuments({ author: userId, status: POST_STATUS.PUBLISHED }),
    Comment.countDocuments({ author: userId, status: POST_STATUS.PUBLISHED }),
    Post.aggregate([
      { $match: { author: userId } },
      { $group: { _id: null, total: { $sum: '$likeCount' } } },
    ]),
  ]);

  return {
    stats: {
      communities: communityIds.length,
      moderatorOf: memberships.filter((m) => m.role !== 'member').length,
      upcomingEvents: upcomingEvents.length,
      unreadNotifications: unreadCount,
      myPosts: myPostCount,
      myComments: myCommentCount,
      likesReceived: likesReceived[0]?.total || 0,
    },
    communities: communities.map((c) => ({
      ...c,
      myRole: roleByCommunity.get(String(c._id)) || null,
    })),
    upcomingEvents,
    notifications,
    activity: await activitySeries(communityIds),
  };
}

module.exports = { getSummary, activitySeries, emptySeries, ACTIVITY_DAYS };

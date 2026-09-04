/**
 * models/index.js — single import point for every Mongoose model.
 */
module.exports = {
  User: require('./User'),
  Community: require('./Community'),
  Membership: require('./Membership'),
  Post: require('./Post'),
  Comment: require('./Comment'),
  Event: require('./Event'),
  Notification: require('./Notification'),
  Report: require('./Report'),
  Category: require('./Category'),
};

/**
 * config/db.js — MongoDB connection lifecycle (Mongoose).
 *
 * A single shared connection is used for the whole process. Tests reuse the
 * same helpers against the dedicated test database from `env.mongoUri`.
 */
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

// Fail fast rather than buffering commands forever when Mongo is unreachable.
const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 20,
};

async function connectDb(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(uri, CONNECT_OPTIONS);
  if (!env.isTest) {
    logger.info(`MongoDB connected → ${mongoose.connection.name}`);
  }
  return mongoose.connection;
}

async function disconnectDb() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
}

/** Drops every document in every collection. Test-only guard rail. */
async function clearDb() {
  if (!env.isTest) {
    throw new Error('clearDb() is only allowed when NODE_ENV=test');
  }
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { connectDb, disconnectDb, clearDb, mongoose };

/**
 * tests/setup.js — shared Jest lifecycle for backend tests.
 *
 * Connects once to the dedicated test database, wipes every collection between
 * tests so cases stay independent, and closes the connection at the end.
 */
process.env.NODE_ENV = 'test';

const { connectDb, disconnectDb, clearDb } = require('../src/config/db');

beforeAll(async () => {
  await connectDb();
});

afterEach(async () => {
  await clearDb();
});

afterAll(async () => {
  await disconnectDb();
});

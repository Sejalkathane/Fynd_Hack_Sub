require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

async function connectTestDB() {
  const uri = process.env.MONGODB_URI_TEST;
  // Safety: never run tests (which wipe collections) against the real database
  if (!uri || !uri.includes('_test')) {
    throw new Error('MONGODB_URI_TEST must be set and point to a database ending in _test');
  }
  await mongoose.connect(uri);
}

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

async function disconnectTestDB() {
  await mongoose.disconnect();
}

module.exports = { connectTestDB, clearDB, disconnectTestDB };
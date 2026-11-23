const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, disconnectTestDB } = require('./setup');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

test('health endpoint works', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
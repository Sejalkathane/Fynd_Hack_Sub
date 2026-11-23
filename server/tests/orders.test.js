const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

// Helper: make a product directly in the test database
function makeProduct(name, stock, priceCents = 100000) {
  return Product.create({ name, sku: name.toUpperCase(), priceCents, stock });
}

// Helper: place an order through the API
function placeOrderVia(productId, quantity) {
  return request(app)
    .post('/api/orders')
    .send({ items: [{ productId: productId.toString(), quantity }] });
}

// Helper: change an order's status through the API
function setStatus(ref, status) {
  return request(app).patch(`/api/orders/${ref}/status`).send({ status });
}

test('successful placement: 201, stock reduced, order stored', async () => {
  const a = await makeProduct('A', 5, 100000);

  const res = await request(app)
    .post('/api/orders')
    .send({ items: [{ productId: a._id.toString(), quantity: 2 }] });

  expect(res.status).toBe(201);
  expect(res.body.status).toBe('PLACED');
  expect(res.body.totalCents).toBe(200000);

  // Check the DATABASE, not just the response
  const updatedA = await Product.findById(a._id);
  expect(updatedA.stock).toBe(3);
  expect(await Order.countDocuments()).toBe(1);
});

test('insufficient stock: 409, no stock change, no order created', async () => {
  const a = await makeProduct('A', 5);
  const b = await makeProduct('B', 0);

  const res = await request(app)
    .post('/api/orders')
    .send({
      items: [
        { productId: a._id.toString(), quantity: 2 },
        { productId: b._id.toString(), quantity: 1 },
      ],
    });

  expect(res.status).toBe(409);
  expect(res.body.error).toBe('INSUFFICIENT_STOCK');
  expect(res.body.details[0].name).toBe('B');

  // The all-or-nothing proof
  const updatedA = await Product.findById(a._id);
  expect(updatedA.stock).toBe(5);
  expect(await Order.countDocuments()).toBe(0);
});

test('invalid transition PLACED -> SHIPPED: 409, status unchanged', async () => {
  const a = await makeProduct('A', 5);
  const placed = await placeOrderVia(a._id, 1);
  const ref = placed.body.reference;

  const res = await setStatus(ref, 'SHIPPED');

  expect(res.status).toBe(409);
  expect(res.body.error).toBe('INVALID_TRANSITION');

  const order = await Order.findOne({ reference: ref });
  expect(order.status).toBe('PLACED');
});

test('cancel restores stock exactly once', async () => {
  const a = await makeProduct('A', 5);
  const placed = await placeOrderVia(a._id, 2);
  const ref = placed.body.reference;

  expect((await Product.findById(a._id)).stock).toBe(3);

  const first = await setStatus(ref, 'CANCELLED');
  expect(first.status).toBe(200);
  expect((await Product.findById(a._id)).stock).toBe(5);

  // Repeat the cancel: must be rejected and must NOT add stock again
  const second = await setStatus(ref, 'CANCELLED');
  expect(second.status).toBe(409);
  expect((await Product.findById(a._id)).stock).toBe(5);
});

test('shipped order cannot be cancelled', async () => {
  const a = await makeProduct('A', 5);
  const placed = await placeOrderVia(a._id, 1);
  const ref = placed.body.reference;

  await setStatus(ref, 'PACKED');
  await setStatus(ref, 'SHIPPED');

  const res = await setStatus(ref, 'CANCELLED');
  expect(res.status).toBe(409);

  const order = await Order.findOne({ reference: ref });
  expect(order.status).toBe('SHIPPED');
  expect((await Product.findById(a._id)).stock).toBe(4); // stock not given back
});

test('validation: empty items and bad quantity give 400, nothing is created', async () => {
  const a = await makeProduct('A', 5);

  const empty = await request(app).post('/api/orders').send({ items: [] });
  expect(empty.status).toBe(400);

  const zero = await placeOrderVia(a._id, 0);
  expect(zero.status).toBe(400);

  const decimal = await placeOrderVia(a._id, 1.5);
  expect(decimal.status).toBe(400);

  expect(await Order.countDocuments()).toBe(0);
  expect((await Product.findById(a._id)).stock).toBe(5);
});

test('search by reference and filter by status', async () => {
  const a = await makeProduct('A', 10);
  const first = await placeOrderVia(a._id, 1);
  const second = await placeOrderVia(a._id, 1);
  await setStatus(second.body.reference, 'PACKED');

  // search (case-insensitive, partial)
  const bySearch = await request(app).get(`/api/orders?search=${first.body.reference.toLowerCase()}`);
  expect(bySearch.status).toBe(200);
  expect(bySearch.body).toHaveLength(1);
  expect(bySearch.body[0].reference).toBe(first.body.reference);

  // filter by status
  const packed = await request(app).get('/api/orders?status=PACKED');
  expect(packed.body).toHaveLength(1);
  expect(packed.body[0].reference).toBe(second.body.reference);

  // unknown order gives 404
  const missing = await request(app).get('/api/orders/ORD-9999');
  expect(missing.status).toBe(404);
});

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
  const placed = await request(app)
    .post('/api/orders')
    .send({ items: [{ productId: a._id.toString(), quantity: 1 }] });
  const ref = placed.body.reference;

  const res = await request(app)
    .patch(`/api/orders/${ref}/status`)
    .send({ status: 'SHIPPED' });

  expect(res.status).toBe(409);
  expect(res.body.error).toBe('INVALID_TRANSITION');

  const order = await Order.findOne({ reference: ref });
  expect(order.status).toBe('PLACED');
});
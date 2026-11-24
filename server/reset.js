require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/db/connect');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Counter = require('./src/models/Counter');

const products = [
  { name: 'Keyboard',   sku: 'KB-001', priceCents: 150000, stock: 5 },
  { name: 'Mouse',      sku: 'MS-001', priceCents: 50000,  stock: 10 },
  { name: 'Monitor',    sku: 'MN-001', priceCents: 900000, stock: 3 },
  { name: 'USB Cable',  sku: 'UC-001', priceCents: 20000,  stock: 20 },
  { name: 'Headphones', sku: 'HP-001', priceCents: 200000, stock: 8 },
  { name: 'Webcam',     sku: 'WC-001', priceCents: 250000, stock: 0 },
];

async function reset() {
  try {
    await connectDB(process.env.MONGODB_URI);

    await Order.deleteMany({});    // remove all orders
    await Counter.deleteMany({});  // next order is ORD-0001 again
    await Product.deleteMany({});  // remove products
    await Product.insertMany(products);

    console.log('Reset done: 6 products, 0 orders');
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

reset();
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/db/connect');
const Product = require('./src/models/Product');

const products = [
  { name: 'Keyboard',   sku: 'KB-001', priceCents: 150000, stock: 5 },
  { name: 'Mouse',      sku: 'MS-001', priceCents: 50000,  stock: 10 },
  { name: 'Monitor',    sku: 'MN-001', priceCents: 900000, stock: 3 },
  { name: 'USB Cable',  sku: 'UC-001', priceCents: 20000,  stock: 20 },
  { name: 'Headphones', sku: 'HP-001', priceCents: 200000, stock: 8 },
  { name: 'Webcam',     sku: 'WC-001', priceCents: 250000, stock: 0 },
];

async function seed() {
  try {
    await connectDB(process.env.MONGODB_URI);

    for (const p of products) {
      // Only insert if this SKU does not exist yet
      const result = await Product.updateOne(
        { sku: p.sku },
        { $setOnInsert: p },
        { upsert: true }
      );
      console.log(result.upsertedCount ? `Added ${p.name}` : `Skipped ${p.name} (already exists)`);
    }

    console.log('Seeding done');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
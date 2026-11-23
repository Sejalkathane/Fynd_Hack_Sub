const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const { AppError } = require('../utils/errors');

// The whole status rulebook in one place
const ALLOWED_MOVES = {
  PLACED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: [],
  CANCELLED: [],
};

function validateAndMergeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'INVALID_INPUT', 'Order must contain at least one item');
  }

  const merged = new Map(); // productId -> total quantity

  for (const item of items) {
    const id = item && String(item.productId);

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      throw new AppError(400, 'INVALID_INPUT', 'Each item needs a valid productId');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new AppError(400, 'INVALID_INPUT', 'Quantity must be a whole number of at least 1');
    }

    merged.set(id, (merged.get(id) || 0) + item.quantity);
  }

  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

async function placeOrder(items) {
  const merged = validateAndMergeItems(items);
  const session = await mongoose.startSession();

  try {
    let order;

    await session.withTransaction(async () => {
      const lines = [];
      const problems = [];

      for (const { productId, quantity } of merged) {
        // Deduct stock ONLY IF enough is available (check + deduct in one step)
        const product = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { returnDocument: 'after', session }
        );

        if (product) {
          lines.push({
            productId: product._id,
            name: product.name,
            unitPriceCents: product.priceCents, // price comes from the DB, not the client
            quantity,
          });
        } else {
          // Not enough stock (or product doesn't exist): find out why
          const current = await Product.findById(productId).session(session);
          problems.push({
            productId,
            name: current ? current.name : 'Unknown product',
            requested: quantity,
            available: current ? current.stock : 0,
          });
        }
      }

      // Any problem means the whole order fails, and the transaction rolls back
      if (problems.length > 0) {
        throw new AppError(409, 'INSUFFICIENT_STOCK', 'Some items are unavailable', problems);
      }

      // Next order number: ORD-0001, ORD-0002, ...
      const counter = await Counter.findOneAndUpdate(
        { _id: 'order' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after', session }
      );
      const reference = 'ORD-' + String(counter.seq).padStart(4, '0');

      const totalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

      const [created] = await Order.create(
        [{ reference, status: 'PLACED', items: lines, totalCents, history: [{ status: 'PLACED' }] }],
        { session }
      );
      order = created;
    });

    return order;
  } finally {
    session.endSession();
  }
}

async function changeStatus(reference, nextStatus) {
  nextStatus = String(nextStatus || '').toUpperCase();

  if (!Object.keys(ALLOWED_MOVES).includes(nextStatus)) {
    throw new AppError(400, 'INVALID_STATUS', 'Status must be PACKED, SHIPPED or CANCELLED');
  }

  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      const order = await Order.findOne({ reference: String(reference).toUpperCase() }).session(session);
      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');

      if (!ALLOWED_MOVES[order.status].includes(nextStatus)) {
        throw new AppError(
          409,
          'INVALID_TRANSITION',
          `Cannot change order from ${order.status} to ${nextStatus}`
        );
      }

      // Compare-and-set: only succeeds if the status is still what we just read
      updated = await Order.findOneAndUpdate(
        { _id: order._id, status: order.status },
        { $set: { status: nextStatus }, $push: { history: { status: nextStatus } } },
        { returnDocument: 'after', session }
      );
      if (!updated) {
        throw new AppError(409, 'INVALID_TRANSITION', 'Order was changed by someone else, please retry');
      }

      // Give the stock back, only when cancelling (same transaction)
      if (nextStatus === 'CANCELLED') {
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }
    });

    return updated;
  } finally {
    session.endSession();
  }
}

module.exports = { validateAndMergeItems, placeOrder, changeStatus };

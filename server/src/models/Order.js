const mongoose = require('mongoose');

const STATUSES = ['PLACED', 'PACKED', 'SHIPPED', 'CANCELLED'];

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unitPriceCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: STATUSES, default: 'PLACED' },
    items: { type: [itemSchema], required: true },
    totalCents: { type: Number, required: true, min: 0 },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.STATUSES = STATUSES;
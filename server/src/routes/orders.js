const express = require('express');
const orderService = require('../services/orderService');
const Order = require('../models/Order');
const { AppError } = require('../utils/errors');

const router = express.Router();

// POST /api/orders -> place a new order
router.post('/', async (req, res, next) => {
  try {
    const order = await orderService.placeOrder(req.body.items);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});


// GET /api/orders?search=ORD-00&status=PACKED
router.get('/', async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = String(req.query.status).toUpperCase();
    }

    if (req.query.search) {
      // escape special characters so users can't break the regex
      const safe = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.reference = { $regex: safe, $options: 'i' };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/ORD-0001
router.get('/:reference', async (req, res, next) => {
  try {
    const order = await Order.findOne({ reference: req.params.reference.toUpperCase() });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    res.json(order);
  } catch (err) {
    next(err);
  }
});




// PATCH /api/orders/ORD-0001/status   body: { "status": "PACKED" }
router.patch('/:reference/status', async (req, res, next) => {
  try {
    const order = await orderService.changeStatus(req.params.reference, req.body.status);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
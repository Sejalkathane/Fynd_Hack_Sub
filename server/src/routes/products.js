const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products -> list all products
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
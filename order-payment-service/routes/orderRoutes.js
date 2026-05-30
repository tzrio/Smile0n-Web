const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');

// POST / - Create a new custom design order
router.post('/', createOrder);

// GET /user/:userId - Get order history for a specific user
router.get('/user/:userId', getOrdersByUser);

// GET / - Admin: Get all orders
router.get('/', getAllOrders);

// GET /:id - Get order detail by id
router.get('/:id', getOrderById);

// PUT /:id/status - Admin: Update order status
router.put('/:id/status', updateOrderStatus);

module.exports = router;

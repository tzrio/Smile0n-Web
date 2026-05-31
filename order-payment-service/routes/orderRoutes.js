/**
 * Order Routes - Definisi Endpoint Pesanan
 * 
 * File ini mendefinisikan semua URL endpoint yang berhubungan dengan pesanan.
 * Setiap endpoint dihubungkan ke fungsi controller yang sesuai.
 * 
 * Endpoint yang tersedia:
 * - POST /orders          → Membuat pesanan baru
 * - GET /orders/user/:id  → Melihat riwayat pesanan user tertentu
 * - GET /orders           → Admin melihat semua pesanan
 * - GET /orders/:id       → Melihat detail satu pesanan
 * - PUT /orders/:id/status → Admin mengubah status pesanan
 */

const express = require('express');
const router = express.Router();

// Import semua fungsi controller pesanan
const {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');

// POST / → Membuat pesanan desain custom baru
router.post('/', createOrder);

// GET /user/:userId → Melihat riwayat pesanan milik user tertentu
router.get('/user/:userId', getOrdersByUser);

// GET / → Admin: melihat semua pesanan beserta info user
router.get('/', getAllOrders);

// GET /:id → Melihat detail lengkap satu pesanan berdasarkan ID
router.get('/:id', getOrderById);

// PUT /:id/status → Admin: mengubah status pesanan (misal: diproses, selesai)
router.put('/:id/status', updateOrderStatus);

module.exports = router;

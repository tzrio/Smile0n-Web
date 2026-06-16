/**
 * Payment Routes - Definisi Endpoint Pembayaran
 * Owner: Roihan
 *
 * Endpoint yang tersedia:
 * - POST /payments/upload       → User upload bukti pembayaran (multipart/form-data)
 * - PUT /payments/:id/verify    → Admin verifikasi/tolak pembayaran
 * - GET /payments/order/:orderId → Melihat pembayaran berdasarkan pesanan
 * - GET /payments               → Admin melihat semua data pembayaran
 */

const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');

const {
  uploadPayment,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments
} = require('../controllers/paymentController');

// POST /upload → User mengunggah bukti pembayaran
router.post('/upload', upload.single('bukti_pembayaran'), uploadPayment);

// PUT /:id/verify → Admin memverifikasi atau menolak pembayaran
router.put('/:id/verify', verifyPayment);

// GET /order/:orderId → Melihat data pembayaran untuk pesanan tertentu
router.get('/order/:orderId', getPaymentByOrder);

// GET / → Admin: melihat semua data pembayaran
router.get('/', getAllPayments);

module.exports = router;

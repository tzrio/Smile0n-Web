const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadPayment,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments
} = require('../controllers/paymentController');

// POST /upload - Upload payment proof with file
router.post('/upload', upload.single('bukti_pembayaran'), uploadPayment);

// PUT /:id/verify - Admin: Verify or reject payment
router.put('/:id/verify', verifyPayment);

// GET /order/:orderId - Get payment for a specific order
router.get('/order/:orderId', getPaymentByOrder);

// GET / - Admin: Get all payments
router.get('/', getAllPayments);

module.exports = router;

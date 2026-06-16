/**
 * Payment Service - SmileOn Lab
 * Owner: Roihan
 *
 * Entry point untuk Payment Service.
 * Service ini menangani:
 * - Upload bukti pembayaran
 * - Verifikasi pembayaran oleh admin
 * - Riwayat pembayaran
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// PERSIAPAN FOLDER UPLOAD
// ============================================
const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(uploadDir, { recursive: true });

// ============================================
// ROUTING
// ============================================
const paymentRoutes = require('./routes/paymentRoutes');

// Semua request ke /payments ditangani oleh paymentRoutes
app.use('/payments', paymentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'payment-service', status: 'running' });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Payment Service berjalan di port ${PORT}`);
  });
}

module.exports = app;

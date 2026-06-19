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

// ============================================
// AUTO INITIALISASI TABEL (idempotent)
// ============================================
const pool = require('./config/db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        metode_pembayaran VARCHAR(100),
        jumlah DECIMAL(12, 2),
        bukti_pembayaran VARCHAR(255),
        status_verifikasi ENUM('menunggu_verifikasi', 'terverifikasi', 'ditolak') DEFAULT 'menunggu_verifikasi',
        tanggal_pembayaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL
      )
    `);
    await pool.query(`CREATE INDEX idx_order_id ON payments(order_id)`);
    await pool.query(`CREATE INDEX idx_user_id ON payments(user_id)`);
    console.log('[Payment DB] Tabel payments siap');
  } catch (err) {
    console.error('[Payment DB] Gagal inisialisasi tabel:', err.message);
  }
})();

// Semua request ke /payments ditangani oleh paymentRoutes
app.use('/payments', paymentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'payment-service', status: 'running' });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
const PORT = process.env.PORT || 3004;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Payment Service berjalan di port ${PORT}`);
  });
}

module.exports = app;

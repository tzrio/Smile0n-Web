/**
 * Order Service - SmileOn Lab
 * Owner: Roihan
 *
 * Entry point untuk Order Service.
 * Service ini menangani:
 * - Pembuatan pesanan desain custom
 * - Riwayat pesanan user
 * - Update status pesanan
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// ROUTING
// ============================================
const orderRoutes = require('./routes/orderRoutes');

// ============================================
// AUTO INITIALISASI TABEL (idempotent)
// ============================================
const pool = require('./config/db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_id INT NULL,
        jenis_desain VARCHAR(100) NOT NULL,
        konsep TEXT,
        warna VARCHAR(100),
        ukuran VARCHAR(100),
        referensi TEXT,
        catatan TEXT,
        file_pendukung VARCHAR(255),
        estimasi_pengerjaan VARCHAR(50),
        total_harga DECIMAL(12, 2) DEFAULT 0,
        status ENUM('menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'revisi', 'selesai', 'dibatalkan') DEFAULT 'menunggu_pembayaran',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX idx_user_id ON orders(user_id)`);
    console.log('[Order DB] Tabel orders siap');
  } catch (err) {
    console.error('[Order DB] Gagal inisialisasi tabel:', err.message);
  }
})();

// Semua request ke /orders ditangani oleh orderRoutes
app.use('/orders', orderRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'order-service', status: 'running' });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
const PORT = process.env.PORT || 3003;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Order Service berjalan di port ${PORT}`);
  });
}

module.exports = app;

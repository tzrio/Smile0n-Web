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

// Semua request ke /orders ditangani oleh orderRoutes
app.use('/orders', orderRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'order-service', status: 'running' });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Order Service berjalan di port ${PORT}`);
  });
}

module.exports = app;

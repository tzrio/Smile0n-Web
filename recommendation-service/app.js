/**
 * Recommendation Service - SmileOn Lab
 * Owner: Roihan
 *
 * Entry point untuk Recommendation Service.
 * Service ini menangani rekomendasi produk untuk user berdasarkan
 * riwayat pesanan dan preferensi.
 *
 * Port  : 3003
 * DB    : recommendation_db
 * Routes: /recommendations
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
const recommendationRoutes = require('./routes/recommendationRoutes');

// Semua request ke /recommendations ditangani oleh recommendationRoutes
app.use('/recommendations', recommendationRoutes);

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({ service: 'recommendation-service', status: 'running', port: 3003 });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
const PORT = process.env.PORT || 3005;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Recommendation Service berjalan di port ${PORT}`);
  });
}

module.exports = app;

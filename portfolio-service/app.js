/**
 * Portfolio Service - SmileOn Lab
 * Owner: Rakha
 *
 * Entry point untuk Portfolio Service.
 * Service ini menangani data portofolio desain SmileOn Lab.
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

// Health check
app.get('/', (req, res) => {
  res.json({ service: 'portfolio-service', status: 'running' });
});

// Placeholder endpoint - akan dikembangkan lebih lanjut
app.get('/portfolio', (req, res) => {
  res.json({
    message: 'Portfolio Service - Coming Soon',
    portfolios: []
  });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
const PORT = process.env.PORT || 3004;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Portfolio Service berjalan di port ${PORT}`);
  });
}

module.exports = app;

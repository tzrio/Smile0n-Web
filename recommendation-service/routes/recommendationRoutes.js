/**
 * Recommendation Routes - Definisi Endpoint Rekomendasi
 * Owner: Roihan
 *
 * Endpoint yang tersedia:
 * - GET /recommendations              → Semua rekomendasi (admin)
 * - GET /recommendations/user/:userId → Rekomendasi untuk user tertentu
 * - POST /recommendations             → Tambah rekomendasi baru
 * - DELETE /recommendations/:id       → Hapus rekomendasi
 */

const express = require('express');
const router = express.Router();

const {
  getAllRecommendations,
  getRecommendationsByUser,
  createRecommendation,
  deleteRecommendation
} = require('../controllers/recommendationController');

// GET / → Semua rekomendasi (untuk admin/debug)
router.get('/', getAllRecommendations);

// GET /user/:userId → Rekomendasi produk untuk user tertentu
router.get('/user/:userId', getRecommendationsByUser);

// POST / → Tambah rekomendasi baru
router.post('/', createRecommendation);

// DELETE /:id → Hapus rekomendasi berdasarkan ID
router.delete('/:id', deleteRecommendation);

module.exports = router;

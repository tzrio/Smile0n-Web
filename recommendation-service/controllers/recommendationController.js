/**
 * Recommendation Controller - Logika Bisnis Rekomendasi
 * Owner: Roihan
 *
 * File ini berisi semua fungsi yang menangani logika rekomendasi produk:
 * - Melihat semua rekomendasi
 * - Melihat rekomendasi berdasarkan user
 * - Membuat rekomendasi baru
 * - Menghapus rekomendasi
 *
 * Rekomendasi disimpan di tabel recommendations pada database recommendation_db.
 * Setiap rekomendasi memiliki score (0-100) yang menunjukkan tingkat relevansi.
 */

const pool = require('../config/db.js');

/**
 * Melihat semua rekomendasi
 * Endpoint: GET /recommendations
 *
 * Mengembalikan semua rekomendasi di sistem.
 * Diurutkan berdasarkan score tertinggi.
 */
const getAllRecommendations = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM recommendations ORDER BY score DESC, created_at DESC'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil semua rekomendasi:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Melihat rekomendasi untuk user tertentu
 * Endpoint: GET /recommendations/user/:userId
 *
 * Mengembalikan daftar rekomendasi produk untuk user tertentu,
 * diurutkan berdasarkan score tertinggi.
 * Jika tidak ada rekomendasi, kembalikan array kosong.
 */
const getRecommendationsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM recommendations WHERE user_id = ? ORDER BY score DESC, created_at DESC',
      [userId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil rekomendasi user:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Membuat rekomendasi baru
 * Endpoint: POST /recommendations
 *
 * Body yang diperlukan:
 * - user_id   : ID user yang mendapat rekomendasi (wajib)
 * - product_id: ID produk yang direkomendasikan (wajib)
 * - score     : Skor relevansi 0-100 (opsional, default 50)
 * - reason    : Alasan rekomendasi (opsional)
 */
const createRecommendation = async (req, res) => {
  const { user_id, product_id, score, reason } = req.body;

  // Validasi field wajib
  if (!user_id || !product_id) {
    return res.status(400).json({ message: 'Field user_id dan product_id wajib diisi' });
  }

  // Validasi score jika diberikan
  const validScore = score !== undefined ? parseFloat(score) : 50.00;
  if (isNaN(validScore) || validScore < 0 || validScore > 100) {
    return res.status(400).json({ message: 'Score harus berupa angka antara 0 dan 100' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO recommendations (user_id, product_id, score, reason) VALUES (?, ?, ?, ?)',
      [user_id, product_id, validScore, reason || null]
    );

    return res.status(201).json({
      recommendation_id: result.insertId,
      message: 'Rekomendasi berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error membuat rekomendasi:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Menghapus rekomendasi
 * Endpoint: DELETE /recommendations/:id
 *
 * Menghapus rekomendasi berdasarkan ID.
 * Kembalikan 404 jika rekomendasi tidak ditemukan.
 */
const deleteRecommendation = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah rekomendasi ada
    const [rows] = await pool.query('SELECT id FROM recommendations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rekomendasi tidak ditemukan' });
    }

    await pool.query('DELETE FROM recommendations WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Rekomendasi berhasil dihapus' });
  } catch (error) {
    console.error('Error menghapus rekomendasi:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  getAllRecommendations,
  getRecommendationsByUser,
  createRecommendation,
  deleteRecommendation
};

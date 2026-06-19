/**
 * Payment Controller - Logika Bisnis Pembayaran
 * Owner: Roihan
 *
 * File ini berisi semua fungsi yang menangani logika pembayaran:
 * - Upload bukti pembayaran oleh user
 * - Verifikasi pembayaran oleh admin
 * - Melihat pembayaran berdasarkan pesanan
 * - Admin melihat semua pembayaran
 *
 * Alur pembayaran:
 * 1. User membuat pesanan → status "menunggu_pembayaran"
 * 2. User upload bukti → status berubah ke "menunggu_verifikasi"
 * 3. Admin verifikasi → jika valid, status pesanan berubah ke "diproses"
 *
 * ARSITEKTUR: Database Per Service
 * Controller ini HANYA mengakses tabel `payments` di payment_db.
 * Komunikasi dengan order-service dilakukan via HTTP API (axios).
 * Tidak ada query langsung ke tabel orders.
 */

const pool = require('../config/db.js');
const axios = require('axios');

// URL untuk order-service (fallback chain: ORDER_SERVICE_URL -> API_GATEWAY -> default)
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || process.env.API_GATEWAY || 'http://order-service:3003';

/**
 * Upload bukti pembayaran
 * Endpoint: POST /payments/upload (multipart/form-data)
 *
 * Alur:
 * 1. Validasi file upload
 * 2. Verifikasi order_id ada di order-service (via HTTP)
 * 3. Simpan data pembayaran ke tabel payments
 * 4. Update status pesanan ke "menunggu_verifikasi" (via HTTP ke order-service)
 */
const uploadPayment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Bukti pembayaran wajib diunggah' });
  }

  const { order_id, user_id, metode_pembayaran, jumlah } = req.body;

  try {
    // Cek apakah pesanan dengan order_id tersebut ada (via HTTP ke order-service)
    try {
      await axios.get(`${ORDER_SERVICE_URL}/orders/${order_id}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(400).json({ message: 'Pesanan tidak ditemukan' });
      }
      throw err;
    }

    const bukti_pembayaran = req.file.filename;

    // Simpan data pembayaran ke tabel payments
    const [result] = await pool.query(
      'INSERT INTO payments (order_id, user_id, metode_pembayaran, jumlah, bukti_pembayaran) VALUES (?, ?, ?, ?, ?)',
      [order_id, user_id, metode_pembayaran || null, jumlah || null, bukti_pembayaran]
    );

    // Ubah status pesanan menjadi "menunggu_verifikasi" via HTTP ke order-service
    try {
      await axios.put(`${ORDER_SERVICE_URL}/orders/${order_id}/status`, {
        status: 'menunggu_verifikasi'
      });
    } catch (err) {
      console.error('Gagal update status pesanan via order-service:', err.message);
      // Payment tetap berhasil disimpan, status pesanan bisa di-retry
    }

    return res.status(201).json({
      payment_id: result.insertId,
      status: 'menunggu_verifikasi',
      bukti_pembayaran: bukti_pembayaran
    });
  } catch (error) {
    console.error('Error upload pembayaran:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Admin: verifikasi atau tolak pembayaran
 * Endpoint: PUT /payments/:id/verify
 *
 * Alur:
 * 1. Validasi status_verifikasi
 * 2. Cek apakah pembayaran ada
 * 3. Update status pembayaran
 * 4. Jika terverifikasi, update status pesanan ke "diproses" via HTTP ke order-service
 */
const verifyPayment = async (req, res) => {
  const allowedStatuses = ['terverifikasi', 'ditolak'];

  const { id } = req.params;
  const { status_verifikasi } = req.body;

  if (!allowedStatuses.includes(status_verifikasi)) {
    return res.status(400).json({ message: 'Status verifikasi tidak valid' });
  }

  try {
    const [payments] = await pool.query('SELECT id, order_id FROM payments WHERE id = ?', [id]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    const payment = payments[0];

    if (status_verifikasi === 'terverifikasi') {
      await pool.query(
        'UPDATE payments SET status_verifikasi = ?, verified_at = NOW() WHERE id = ?',
        [status_verifikasi, id]
      );

      // Ubah status pesanan terkait menjadi "diproses" via HTTP ke order-service
      try {
        await axios.put(`${ORDER_SERVICE_URL}/orders/${payment.order_id}/status`, {
          status: 'diproses'
        });
      } catch (err) {
        console.error('Gagal update status pesanan via order-service:', err.message);
      }
    } else {
      await pool.query(
        'UPDATE payments SET status_verifikasi = ? WHERE id = ?',
        [status_verifikasi, id]
      );
    }

    return res.status(200).json({
      message: 'Status verifikasi pembayaran berhasil diperbarui',
      status_verifikasi: status_verifikasi
    });
  } catch (error) {
    console.error('Error verifikasi pembayaran:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Melihat data pembayaran berdasarkan pesanan
 * Endpoint: GET /payments/order/:orderId
 */
const getPaymentByOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil pembayaran:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Admin: melihat semua data pembayaran
 * Endpoint: GET /payments
 *
 * ARSITEKTUR: Database Per Service
 * Tidak melakukan JOIN dengan tabel orders (milik order-service).
 * Mengembalikan data pembayaran saja. Frontend dapat mengambil
 * info pesanan secara terpisah via order-service jika diperlukan.
 */
const getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payments ORDER BY tanggal_pembayaran DESC'
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil semua pembayaran:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  uploadPayment,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments
};

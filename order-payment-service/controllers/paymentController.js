/**
 * Payment Controller - Logika Bisnis Pembayaran
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
 */

const pool = require('../config/db.js');

/**
 * Upload bukti pembayaran
 * Endpoint: POST /payments/upload (multipart/form-data)
 * 
 * Alur:
 * 1. Cek apakah file bukti pembayaran ada di request
 * 2. Cek apakah order_id valid (pesanan ada di database)
 * 3. Simpan data pembayaran ke tabel payments
 * 4. Ubah status pesanan menjadi "menunggu_verifikasi"
 * 5. Kembalikan payment_id dan nama file yang tersimpan
 */
const uploadPayment = async (req, res) => {
  // Validasi: file bukti pembayaran wajib ada
  if (!req.file) {
    return res.status(400).json({ message: 'Bukti pembayaran wajib diunggah' });
  }

  const { order_id, user_id, metode_pembayaran, jumlah } = req.body;

  try {
    // Cek apakah pesanan dengan order_id tersebut ada
    const [orders] = await pool.query('SELECT id FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(400).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Simpan nama file yang sudah diproses oleh Multer
    const bukti_pembayaran = req.file.filename;

    // Simpan data pembayaran ke tabel payments
    const [result] = await pool.query(
      'INSERT INTO payments (order_id, user_id, metode_pembayaran, jumlah, bukti_pembayaran) VALUES (?, ?, ?, ?, ?)',
      [order_id, user_id, metode_pembayaran || null, jumlah || null, bukti_pembayaran]
    );

    // Ubah status pesanan menjadi "menunggu_verifikasi"
    // (menandakan bukti sudah diupload, tinggal dicek admin)
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['menunggu_verifikasi', order_id]);

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
 * 1. Validasi status_verifikasi (hanya "terverifikasi" atau "ditolak")
 * 2. Cek apakah pembayaran ada di database
 * 3. Jika "terverifikasi": set verified_at dan ubah status pesanan ke "diproses"
 * 4. Jika "ditolak": hanya ubah status pembayaran
 */
const verifyPayment = async (req, res) => {
  // Hanya dua status yang diizinkan untuk verifikasi
  const allowedStatuses = ['terverifikasi', 'ditolak'];

  const { id } = req.params;
  const { status_verifikasi } = req.body;

  // Validasi: status harus "terverifikasi" atau "ditolak"
  if (!allowedStatuses.includes(status_verifikasi)) {
    return res.status(400).json({ message: 'Status verifikasi tidak valid' });
  }

  try {
    // Cek apakah pembayaran ada dan ambil order_id-nya
    const [payments] = await pool.query('SELECT id, order_id FROM payments WHERE id = ?', [id]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    const payment = payments[0];

    if (status_verifikasi === 'terverifikasi') {
      // Pembayaran diterima: set waktu verifikasi dan ubah status
      await pool.query(
        'UPDATE payments SET status_verifikasi = ?, verified_at = NOW() WHERE id = ?',
        [status_verifikasi, id]
      );

      // Ubah status pesanan terkait menjadi "diproses"
      // (menandakan pembayaran valid, desain mulai dikerjakan)
      await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['diproses', payment.order_id]
      );
    } else {
      // Pembayaran ditolak: hanya ubah status pembayaran
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
 * 
 * Mengembalikan data pembayaran untuk pesanan tertentu.
 * Jika belum ada pembayaran, kembalikan 404.
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
 * Menggabungkan data pembayaran dengan info pesanan (jenis desain, status pesanan)
 * agar admin bisa melihat konteks pembayaran.
 */
const getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT payments.*, orders.jenis_desain, orders.status AS order_status FROM payments JOIN orders ON payments.order_id = orders.id'
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil semua pembayaran:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Export semua fungsi agar bisa digunakan oleh routes
module.exports = {
  uploadPayment,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments
};

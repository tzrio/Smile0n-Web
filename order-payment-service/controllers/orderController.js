/**
 * Order Controller - Logika Bisnis Pesanan
 * 
 * File ini berisi semua fungsi yang menangani logika pesanan:
 * - Membuat pesanan baru
 * - Melihat riwayat pesanan user
 * - Admin melihat semua pesanan
 * - Melihat detail pesanan
 * - Admin mengubah status pesanan
 * 
 * Setiap fungsi menerima request (req) dan mengirim response (res).
 * Semua query database menggunakan pool dari config/db.js.
 */

const pool = require('../config/db.js');

/**
 * Membuat pesanan desain custom baru
 * Endpoint: POST /orders
 * 
 * Alur:
 * 1. Validasi field wajib (jenis_desain)
 * 2. Cek apakah user_id valid (ada di tabel users)
 * 3. Simpan pesanan ke database dengan status awal "menunggu_pembayaran"
 * 4. Kembalikan order_id dan status
 */
const createOrder = async (req, res) => {
  const { user_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, product_id, estimasi_pengerjaan } = req.body;

  // Validasi: jenis_desain wajib diisi
  if (!jenis_desain) {
    return res.status(400).json({ message: 'Field jenis_desain wajib diisi' });
  }

  try {
    // Cek apakah user dengan ID tersebut ada di database
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User tidak ditemukan' });
    }

    // Simpan pesanan baru ke tabel orders
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, product_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, estimasi_pengerjaan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, product_id || null, jenis_desain, konsep || null, warna || null, ukuran || null, referensi || null, catatan || null, estimasi_pengerjaan || null, 'menunggu_pembayaran']
    );

    // Berhasil: kembalikan ID pesanan dan status awal
    return res.status(201).json({
      order_id: result.insertId,
      status: 'menunggu_pembayaran',
      message: 'Pesanan berhasil dibuat'
    });
  } catch (error) {
    console.error('Error membuat pesanan:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Melihat riwayat pesanan milik user tertentu
 * Endpoint: GET /orders/user/:userId
 * 
 * Mengembalikan daftar pesanan user, diurutkan dari yang terbaru.
 * Jika user belum punya pesanan, kembalikan array kosong.
 */
const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Query pesanan berdasarkan user_id, urutkan dari terbaru
    const [orders] = await pool.query(
      'SELECT id, jenis_desain, status, estimasi_pengerjaan, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error mengambil pesanan user:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Admin: melihat semua pesanan beserta info user
 * Endpoint: GET /orders
 * 
 * Menggabungkan data pesanan dengan data user (nama, email)
 * menggunakan JOIN agar admin bisa tahu siapa yang memesan.
 */
const getAllOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT orders.*, users.nama, users.email FROM orders JOIN users ON orders.user_id = users.id'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error mengambil semua pesanan:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Melihat detail lengkap satu pesanan
 * Endpoint: GET /orders/:id
 * 
 * Mengembalikan semua field pesanan berdasarkan ID.
 * Jika ID tidak ditemukan, kembalikan 404.
 */
const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error mengambil detail pesanan:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Admin: mengubah status pesanan
 * Endpoint: PUT /orders/:id/status
 * 
 * Status yang diizinkan:
 * - menunggu_pembayaran (awal, setelah pesanan dibuat)
 * - menunggu_verifikasi (setelah bukti pembayaran diupload)
 * - diproses (setelah pembayaran diverifikasi admin)
 * - revisi (jika desain perlu diperbaiki)
 * - selesai (pesanan selesai dikerjakan)
 * - dibatalkan (pesanan dibatalkan)
 */
const updateOrderStatus = async (req, res) => {
  // Daftar status yang diizinkan
  const allowedStatuses = [
    'menunggu_pembayaran',
    'menunggu_verifikasi',
    'diproses',
    'revisi',
    'selesai',
    'dibatalkan'
  ];

  const { id } = req.params;
  const { status } = req.body;

  // Validasi: status harus salah satu dari daftar yang diizinkan
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    // Cek apakah pesanan dengan ID tersebut ada
    const [rows] = await pool.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Update status pesanan di database
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    return res.status(200).json({
      message: 'Status pesanan berhasil diperbarui',
      status: status
    });
  } catch (error) {
    console.error('Error mengubah status pesanan:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Export semua fungsi agar bisa digunakan oleh routes
module.exports = {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};

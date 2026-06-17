/**
 * Order Controller - Logika Bisnis Pesanan
 * Owner: Roihan
 *
 * File ini berisi semua fungsi yang menangani logika pesanan:
 * - Membuat pesanan baru
 * - Melihat riwayat pesanan user
 * - Admin melihat semua pesanan
 * - Melihat detail pesanan
 * - Admin mengubah status pesanan
 *
 * ARSITEKTUR: Database Per Service
 * Controller ini HANYA mengakses tabel `orders` di order_db.
 * Tidak ada query ke tabel dari service lain (users, products, dll).
 * Validasi user dilakukan di API Gateway / auth middleware.
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
 * 1. Validasi field wajib (user_id, jenis_desain)
 * 2. Simpan pesanan ke database dengan status awal "menunggu_pembayaran"
 * 3. Kembalikan order_id dan status
 *
 * CATATAN: Validasi apakah user_id valid dilakukan oleh API Gateway
 * atau auth middleware sebelum request sampai ke sini.
 */
const createOrder = async (req, res) => {
  const { user_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, product_id, estimasi_pengerjaan } = req.body;

  // Validasi: user_id wajib diisi
  if (!user_id) {
    return res.status(400).json({ message: 'Field user_id wajib diisi' });
  }

  // Validasi: jenis_desain wajib diisi
  if (!jenis_desain) {
    return res.status(400).json({ message: 'Field jenis_desain wajib diisi' });
  }

  try {
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
 */
const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

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
 * Admin: melihat semua pesanan
 * Endpoint: GET /orders
 *
 * ARSITEKTUR: Database Per Service
 * Tidak melakukan JOIN dengan tabel users (milik auth-service).
 * Mengembalikan data pesanan saja. Frontend dapat mengambil
 * info user secara terpisah via auth-service jika diperlukan.
 */
const getAllOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
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
 * - menunggu_pembayaran, menunggu_verifikasi, diproses, revisi, selesai, dibatalkan
 */
const updateOrderStatus = async (req, res) => {
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

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

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

module.exports = {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};

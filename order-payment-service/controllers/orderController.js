const pool = require('../config/db.js');

/**
 * Create a new custom design order
 * POST /orders
 */
const createOrder = async (req, res) => {
  const { user_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, product_id, estimasi_pengerjaan } = req.body;

  // Validate required field
  if (!jenis_desain) {
    return res.status(400).json({ message: 'Field jenis_desain wajib diisi' });
  }

  try {
    // Validate user exists
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User tidak ditemukan' });
    }

    // Insert order
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, product_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, estimasi_pengerjaan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, product_id || null, jenis_desain, konsep || null, warna || null, ukuran || null, referensi || null, catatan || null, estimasi_pengerjaan || null, 'menunggu_pembayaran']
    );

    return res.status(201).json({
      order_id: result.insertId,
      status: 'menunggu_pembayaran',
      message: 'Pesanan berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating order:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Get order history for a specific user
 * GET /orders/user/:userId
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
    console.error('Error fetching orders by user:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Get all orders with user info (Admin)
 * GET /orders
 */
const getAllOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT orders.*, users.nama, users.email FROM orders JOIN users ON orders.user_id = users.id'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching all orders:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Get order detail by id
 * GET /orders/:id
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
    console.error('Error fetching order by id:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Update order status (Admin)
 * PUT /orders/:id/status
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

  // Validate status against allowed set
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    // Check order exists
    const [rows] = await pool.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Update order status
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    return res.status(200).json({
      message: 'Status pesanan berhasil diperbarui',
      status: status
    });
  } catch (error) {
    console.error('Error updating order status:', error.message);
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

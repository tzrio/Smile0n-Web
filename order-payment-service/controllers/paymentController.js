const pool = require('../config/db.js');

/**
 * Upload payment proof
 * POST /payments/upload
 */
const uploadPayment = async (req, res) => {
  // Validate file is present
  if (!req.file) {
    return res.status(400).json({ message: 'Bukti pembayaran wajib diunggah' });
  }

  const { order_id, user_id, metode_pembayaran, jumlah } = req.body;

  try {
    // Validate order exists
    const [orders] = await pool.query('SELECT id FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(400).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Insert payment record
    const bukti_pembayaran = req.file.filename;
    const [result] = await pool.query(
      'INSERT INTO payments (order_id, user_id, metode_pembayaran, jumlah, bukti_pembayaran) VALUES (?, ?, ?, ?, ?)',
      [order_id, user_id, metode_pembayaran || null, jumlah || null, bukti_pembayaran]
    );

    // Update order status to menunggu_verifikasi
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['menunggu_verifikasi', order_id]);

    return res.status(201).json({
      payment_id: result.insertId,
      status: 'menunggu_verifikasi',
      bukti_pembayaran: bukti_pembayaran
    });
  } catch (error) {
    console.error('Error uploading payment:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Verify or reject a payment (Admin)
 * PUT /payments/:id/verify
 */
const verifyPayment = async (req, res) => {
  const allowedStatuses = ['terverifikasi', 'ditolak'];

  const { id } = req.params;
  const { status_verifikasi } = req.body;

  // Validate status_verifikasi against allowed set
  if (!allowedStatuses.includes(status_verifikasi)) {
    return res.status(400).json({ message: 'Status verifikasi tidak valid' });
  }

  try {
    // Check payment exists
    const [payments] = await pool.query('SELECT id, order_id FROM payments WHERE id = ?', [id]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan' });
    }

    const payment = payments[0];

    // Update payment status
    if (status_verifikasi === 'terverifikasi') {
      // Set verified_at and update payment status
      await pool.query(
        'UPDATE payments SET status_verifikasi = ?, verified_at = NOW() WHERE id = ?',
        [status_verifikasi, id]
      );

      // Update associated order status to "diproses"
      await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['diproses', payment.order_id]
      );
    } else {
      // Just update payment status (ditolak)
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
    console.error('Error verifying payment:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Get payment for a specific order
 * GET /payments/order/:orderId
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
    console.error('Error fetching payment by order:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Get all payments with order info (Admin)
 * GET /payments
 */
const getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT payments.*, orders.jenis_desain, orders.status AS order_status FROM payments JOIN orders ON payments.order_id = orders.id'
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching all payments:', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  uploadPayment,
  verifyPayment,
  getPaymentByOrder,
  getAllPayments
};

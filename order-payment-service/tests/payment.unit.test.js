const request = require('supertest');
const path = require('path');

// Mock the database pool before requiring the app
jest.mock('../config/db.js', () => {
  const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({
      release: jest.fn()
    })
  };
  return mockPool;
});

const app = require('../app');
const pool = require('../config/db.js');

describe('Payment Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── uploadPayment ─────────────────────────────────────────────────────────

  describe('POST /payments/upload - uploadPayment', () => {
    it('should return 201 with payment_id when valid file and data are provided', async () => {
      // Mock: order exists
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: insert payment
      pool.query.mockResolvedValueOnce([{ insertId: 5 }]);
      // Mock: update order status
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .post('/payments/upload')
        .field('order_id', '1')
        .field('user_id', '1')
        .field('metode_pembayaran', 'Transfer Bank')
        .field('jumlah', '150000')
        .attach('bukti_pembayaran', Buffer.from('fake-image-data'), {
          filename: 'payment.png',
          contentType: 'image/png'
        });

      expect(res.status).toBe(201);
      expect(res.body.payment_id).toBe(5);
      expect(res.body.status).toBe('menunggu_verifikasi');
      expect(res.body.bukti_pembayaran).toBeDefined();
    });

    it('should return 400 when no file is attached', async () => {
      const res = await request(app)
        .post('/payments/upload')
        .field('order_id', '1')
        .field('user_id', '1')
        .field('metode_pembayaran', 'Transfer Bank')
        .field('jumlah', '150000');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Bukti pembayaran wajib diunggah');
    });

    it('should return 400 when order_id does not exist', async () => {
      // Mock: order not found
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/payments/upload')
        .field('order_id', '999')
        .field('user_id', '1')
        .field('metode_pembayaran', 'QRIS')
        .field('jumlah', '200000')
        .attach('bukti_pembayaran', Buffer.from('fake-image-data'), {
          filename: 'proof.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Pesanan tidak ditemukan');
    });
  });

  // ─── verifyPayment ─────────────────────────────────────────────────────────

  describe('PUT /payments/:id/verify - verifyPayment', () => {
    it('should return 200 and set verified_at when status is "terverifikasi"', async () => {
      // Mock: payment exists
      pool.query.mockResolvedValueOnce([[{ id: 1, order_id: 10 }]]);
      // Mock: update payment with verified_at
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: update order status to diproses
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .put('/payments/1/verify')
        .send({ status_verifikasi: 'terverifikasi' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Status verifikasi pembayaran berhasil diperbarui');
      expect(res.body.status_verifikasi).toBe('terverifikasi');

      // Verify that verified_at = NOW() was included in the update query
      const updateCall = pool.query.mock.calls[1];
      expect(updateCall[0]).toContain('verified_at');
      expect(updateCall[0]).toContain('NOW()');

      // Verify order status was updated to diproses
      const orderUpdateCall = pool.query.mock.calls[2];
      expect(orderUpdateCall[1]).toContain('diproses');
    });

    it('should return 200 when status is "ditolak"', async () => {
      // Mock: payment exists
      pool.query.mockResolvedValueOnce([[{ id: 2, order_id: 11 }]]);
      // Mock: update payment status
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .put('/payments/2/verify')
        .send({ status_verifikasi: 'ditolak' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Status verifikasi pembayaran berhasil diperbarui');
      expect(res.body.status_verifikasi).toBe('ditolak');

      // Verify order status was NOT updated (only 2 queries: select + update payment)
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 400 when status_verifikasi is invalid', async () => {
      const res = await request(app)
        .put('/payments/1/verify')
        .send({ status_verifikasi: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Status verifikasi tidak valid');
    });

    it('should return 404 when payment does not exist', async () => {
      // Mock: payment not found
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .put('/payments/999/verify')
        .send({ status_verifikasi: 'terverifikasi' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Pembayaran tidak ditemukan');
    });
  });

  // ─── getPaymentByOrder ─────────────────────────────────────────────────────

  describe('GET /payments/order/:orderId - getPaymentByOrder', () => {
    it('should return 200 with payment record when order has a payment', async () => {
      const mockPayment = {
        id: 1,
        order_id: 10,
        user_id: 1,
        metode_pembayaran: 'Transfer Bank',
        jumlah: 150000,
        bukti_pembayaran: '1700000000-proof.png',
        status_verifikasi: 'menunggu_verifikasi',
        tanggal_pembayaran: '2024-01-15T10:00:00.000Z',
        verified_at: null
      };

      pool.query.mockResolvedValueOnce([[mockPayment]]);

      const res = await request(app).get('/payments/order/10');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPayment);
      expect(res.body.order_id).toBe(10);
      expect(res.body.bukti_pembayaran).toBeDefined();
    });

    it('should return 404 when no payment exists for the order', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/payments/order/999');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Pembayaran tidak ditemukan');
    });
  });
});

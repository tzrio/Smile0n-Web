const request = require('supertest');
const path = require('path');
const fs = require('fs');

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

describe('Integration Tests - Order-Payment Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Test 1: Order creation → payment upload → status becomes "menunggu_verifikasi" ───

  describe('Order creation → Payment upload → Status "menunggu_verifikasi"', () => {
    it('should transition order status to "menunggu_verifikasi" after payment upload', async () => {
      // Step 1: Create order
      // Mock: user exists
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: insert order
      pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const createRes = await request(app)
        .post('/orders')
        .send({
          user_id: 1,
          jenis_desain: 'Logo',
          konsep: 'Modern minimalist',
          warna: 'Biru',
          ukuran: '500x500',
          referensi: 'https://example.com',
          catatan: 'Tolong cepat',
          estimasi_pengerjaan: '3 hari'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.order_id).toBe(1);
      expect(createRes.body.status).toBe('menunggu_pembayaran');

      // Step 2: Upload payment proof for the created order
      // Mock: order exists
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: insert payment
      pool.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // Mock: update order status to menunggu_verifikasi
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const uploadRes = await request(app)
        .post('/payments/upload')
        .field('order_id', '1')
        .field('user_id', '1')
        .field('metode_pembayaran', 'Transfer Bank')
        .field('jumlah', '150000')
        .attach('bukti_pembayaran', Buffer.from('fake-image-data'), {
          filename: 'payment-proof.png',
          contentType: 'image/png'
        });

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.payment_id).toBe(1);
      expect(uploadRes.body.status).toBe('menunggu_verifikasi');
      expect(uploadRes.body.bukti_pembayaran).toBeDefined();

      // Verify the order status update query was called with 'menunggu_verifikasi'
      const orderUpdateCall = pool.query.mock.calls[4]; // 5th call: update order status
      expect(orderUpdateCall[0]).toContain('UPDATE orders SET status');
      expect(orderUpdateCall[1]).toContain('menunggu_verifikasi');
    });
  });

  // ─── Test 2: Payment verification → order status becomes "diproses" ───

  describe('Payment verification → Status "diproses"', () => {
    it('should transition order status to "diproses" after payment is verified', async () => {
      // Mock: payment exists with order_id
      pool.query.mockResolvedValueOnce([[{ id: 1, order_id: 1 }]]);
      // Mock: update payment status with verified_at
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: update order status to diproses
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const verifyRes = await request(app)
        .put('/payments/1/verify')
        .send({ status_verifikasi: 'terverifikasi' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe('Status verifikasi pembayaran berhasil diperbarui');
      expect(verifyRes.body.status_verifikasi).toBe('terverifikasi');

      // Verify payment update includes verified_at = NOW()
      const paymentUpdateCall = pool.query.mock.calls[1];
      expect(paymentUpdateCall[0]).toContain('verified_at');
      expect(paymentUpdateCall[0]).toContain('NOW()');

      // Verify order status was updated to 'diproses'
      const orderUpdateCall = pool.query.mock.calls[2];
      expect(orderUpdateCall[0]).toContain('UPDATE orders SET status');
      expect(orderUpdateCall[1]).toContain('diproses');
    });
  });

  // ─── Test 3: Full lifecycle: create → upload → verify → update to "selesai" ───

  describe('Full lifecycle: create → upload → verify → update to "selesai"', () => {
    it('should complete the full order-payment lifecycle', async () => {
      // ── Step 1: Create order ──
      // Mock: user exists
      pool.query.mockResolvedValueOnce([[{ id: 2 }]]);
      // Mock: insert order
      pool.query.mockResolvedValueOnce([{ insertId: 5 }]);

      const createRes = await request(app)
        .post('/orders')
        .send({
          user_id: 2,
          jenis_desain: 'Banner',
          konsep: 'Event promotion',
          warna: 'Merah dan Putih',
          ukuran: '1920x1080',
          referensi: 'https://ref.example.com',
          catatan: 'Untuk acara 17 Agustus',
          estimasi_pengerjaan: '5 hari'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.order_id).toBe(5);
      expect(createRes.body.status).toBe('menunggu_pembayaran');

      // ── Step 2: Upload payment proof ──
      // Mock: order exists
      pool.query.mockResolvedValueOnce([[{ id: 5 }]]);
      // Mock: insert payment
      pool.query.mockResolvedValueOnce([{ insertId: 3 }]);
      // Mock: update order status to menunggu_verifikasi
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const uploadRes = await request(app)
        .post('/payments/upload')
        .field('order_id', '5')
        .field('user_id', '2')
        .field('metode_pembayaran', 'QRIS')
        .field('jumlah', '250000')
        .attach('bukti_pembayaran', Buffer.from('fake-image-data'), {
          filename: 'bukti-transfer.png',
          contentType: 'image/png'
        });

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.payment_id).toBe(3);
      expect(uploadRes.body.status).toBe('menunggu_verifikasi');

      // ── Step 3: Verify payment ──
      // Mock: payment exists
      pool.query.mockResolvedValueOnce([[{ id: 3, order_id: 5 }]]);
      // Mock: update payment with verified_at
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: update order status to diproses
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const verifyRes = await request(app)
        .put('/payments/3/verify')
        .send({ status_verifikasi: 'terverifikasi' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.status_verifikasi).toBe('terverifikasi');

      // Verify order was updated to diproses
      const diprosesCall = pool.query.mock.calls[7]; // 8th call
      expect(diprosesCall[1]).toContain('diproses');

      // ── Step 4: Admin updates order to "selesai" ──
      // Mock: order exists
      pool.query.mockResolvedValueOnce([[{ id: 5 }]]);
      // Mock: update order status
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const statusRes = await request(app)
        .put('/orders/5/status')
        .send({ status: 'selesai' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.message).toBe('Status pesanan berhasil diperbarui');
      expect(statusRes.body.status).toBe('selesai');

      // Verify the final status update query
      const selesaiCall = pool.query.mock.calls[9]; // 10th call
      expect(selesaiCall[1]).toContain('selesai');
    });
  });

  // ─── Test 4: Uploaded file exists at stored path ───

  describe('File upload creates file in uploads directory', () => {
    it('should create a file in the uploads directory when payment proof is uploaded', async () => {
      // Mock: order exists
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: insert payment
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]);
      // Mock: update order status
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const uploadRes = await request(app)
        .post('/payments/upload')
        .field('order_id', '1')
        .field('user_id', '1')
        .field('metode_pembayaran', 'Transfer Bank')
        .field('jumlah', '100000')
        .attach('bukti_pembayaran', Buffer.from('fake-image-content-for-test'), {
          filename: 'test-upload-proof.png',
          contentType: 'image/png'
        });

      expect(uploadRes.status).toBe(201);

      // Verify the file was actually written to the uploads directory
      const uploadedFilename = uploadRes.body.bukti_pembayaran;
      expect(uploadedFilename).toBeDefined();
      expect(uploadedFilename).toContain('test-upload-proof.png');

      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filePath = path.join(uploadDir, uploadedFilename);
      const fileExists = fs.existsSync(filePath);

      expect(fileExists).toBe(true);

      // Clean up the test file
      if (fileExists) {
        fs.unlinkSync(filePath);
      }
    });
  });

  // ─── Test 5: Database foreign key constraints are enforced ───

  describe('Database foreign key constraints enforcement', () => {
    it('should reject payment upload for non-existent order (FK constraint on order_id)', async () => {
      // Mock: order does NOT exist
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/payments/upload')
        .field('order_id', '9999')
        .field('user_id', '1')
        .field('metode_pembayaran', 'Transfer Bank')
        .field('jumlah', '100000')
        .attach('bukti_pembayaran', Buffer.from('fake-image-data'), {
          filename: 'proof.png',
          contentType: 'image/png'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Pesanan tidak ditemukan');
    });

    it('should reject order creation for non-existent user (FK constraint on user_id)', async () => {
      // Mock: user does NOT exist
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/orders')
        .send({
          user_id: 9999,
          jenis_desain: 'Logo'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User tidak ditemukan');
    });

    it('should handle database FK violation error gracefully', async () => {
      // Mock: user exists
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: insert fails with FK constraint error
      pool.query.mockRejectedValueOnce(new Error('Cannot add or update a child row: a foreign key constraint fails'));

      const res = await request(app)
        .post('/orders')
        .send({
          user_id: 1,
          jenis_desain: 'Logo',
          product_id: 9999 // non-existent product
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Terjadi kesalahan server');
    });
  });
});

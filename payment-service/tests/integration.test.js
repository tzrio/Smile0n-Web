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

// Mock axios for inter-service HTTP calls
jest.mock('axios');

const app = require('../app');
const pool = require('../config/db.js');
const axios = require('axios');

describe('Integration Tests - Payment Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Test 1: Payment upload → status becomes "menunggu_verifikasi" ───

  describe('Payment upload → Status "menunggu_verifikasi"', () => {
    it('should transition order status to "menunggu_verifikasi" after payment upload', async () => {
      // Mock: order exists (via HTTP)
      axios.get.mockResolvedValueOnce({ data: { id: 1, status: 'menunggu_pembayaran' } });
      // Mock: insert payment
      pool.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // Mock: update order status (via HTTP)
      axios.put.mockResolvedValueOnce({ data: { status: 'menunggu_verifikasi' } });

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

      // Verify HTTP call to order-service for status update
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1/status'),
        { status: 'menunggu_verifikasi' }
      );
    });
  });

  // ─── Test 2: Payment verification → order status becomes "diproses" ───

  describe('Payment verification → Status "diproses"', () => {
    it('should transition order status to "diproses" after payment is verified', async () => {
      // Mock: payment exists with order_id
      pool.query.mockResolvedValueOnce([[{ id: 1, order_id: 1 }]]);
      // Mock: update payment status with verified_at
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: update order status (via HTTP)
      axios.put.mockResolvedValueOnce({ data: { status: 'diproses' } });

      const verifyRes = await request(app)
        .put('/payments/1/verify')
        .send({ status_verifikasi: 'terverifikasi' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.message).toBe('Status verifikasi pembayaran berhasil diperbarui');
      expect(verifyRes.body.status_verifikasi).toBe('terverifikasi');

      const paymentUpdateCall = pool.query.mock.calls[1];
      expect(paymentUpdateCall[0]).toContain('verified_at');
      expect(paymentUpdateCall[0]).toContain('NOW()');

      // Verify HTTP call to order-service for status update
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1/status'),
        { status: 'diproses' }
      );
    });
  });

  // ─── Test 3: File upload creates file in uploads directory ───

  describe('File upload creates file in uploads directory', () => {
    it('should create a file in the uploads directory when payment proof is uploaded', async () => {
      // Mock: order exists (via HTTP)
      axios.get.mockResolvedValueOnce({ data: { id: 1, status: 'menunggu_pembayaran' } });
      // Mock: insert payment
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]);
      // Mock: update order status (via HTTP)
      axios.put.mockResolvedValueOnce({ data: { status: 'menunggu_verifikasi' } });

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

      const uploadedFilename = uploadRes.body.bukti_pembayaran;
      expect(uploadedFilename).toBeDefined();
      expect(uploadedFilename).toContain('test-upload-proof.png');

      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filePath = path.join(uploadDir, uploadedFilename);
      const fileExists = fs.existsSync(filePath);

      expect(fileExists).toBe(true);

      if (fileExists) {
        fs.unlinkSync(filePath);
      }
    });
  });

  // ─── Test 4: FK constraint enforcement ───

  describe('Database foreign key constraints enforcement', () => {
    it('should reject payment upload for non-existent order', async () => {
      // Mock: order does NOT exist (via HTTP 404)
      axios.get.mockRejectedValueOnce({ response: { status: 404 } });

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
  });
});

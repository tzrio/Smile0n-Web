const request = require('supertest');

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

describe('Order Controller - Unit Tests', () => {
  let server;

  beforeAll(() => {
    // Prevent app.listen from conflicting; supertest handles its own server
  });

  afterAll((done) => {
    if (app.close) {
      app.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createOrder ───────────────────────────────────────────────────────────

  describe('POST /orders - createOrder', () => {
    it('should return 201 with order_id when valid data is provided', async () => {
      // Mock: insert order
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

      const res = await request(app)
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

      expect(res.status).toBe(201);
      expect(res.body.order_id).toBe(10);
      expect(res.body.status).toBe('menunggu_pembayaran');
      expect(res.body.message).toBe('Pesanan berhasil dibuat');
    });

    it('should return 400 when jenis_desain is missing', async () => {
      const res = await request(app)
        .post('/orders')
        .send({
          user_id: 1,
          konsep: 'Modern minimalist'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Field jenis_desain wajib diisi');
    });

    it('should return 400 when user_id is missing', async () => {
      const res = await request(app)
        .post('/orders')
        .send({
          jenis_desain: 'Banner'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Field user_id wajib diisi');
    });
  });

  // ─── getOrderById ──────────────────────────────────────────────────────────

  describe('GET /orders/:id - getOrderById', () => {
    it('should return 200 with full order when id is valid', async () => {
      const mockOrder = {
        id: 1,
        user_id: 1,
        product_id: null,
        jenis_desain: 'Logo',
        konsep: 'Modern',
        warna: 'Merah',
        ukuran: '1000x1000',
        referensi: null,
        catatan: 'Urgent',
        file_pendukung: null,
        estimasi_pengerjaan: '5 hari',
        status: 'menunggu_pembayaran',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: null
      };

      pool.query.mockResolvedValueOnce([[mockOrder]]);

      const res = await request(app).get('/orders/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockOrder);
      expect(res.body.id).toBe(1);
      expect(res.body.jenis_desain).toBe('Logo');
      expect(res.body.status).toBe('menunggu_pembayaran');
    });

    it('should return 404 when order id does not exist', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/orders/999');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Pesanan tidak ditemukan');
    });
  });

  // ─── updateOrderStatus ─────────────────────────────────────────────────────

  describe('PUT /orders/:id/status - updateOrderStatus', () => {
    it('should return 200 when status is valid and order exists', async () => {
      // Mock: order exists
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: update succeeds
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .put('/orders/1/status')
        .send({ status: 'diproses' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Status pesanan berhasil diperbarui');
      expect(res.body.status).toBe('diproses');
    });

    it('should return 400 when status is invalid', async () => {
      const res = await request(app)
        .put('/orders/1/status')
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Status tidak valid');
    });

    it('should return 404 when order does not exist', async () => {
      // Mock: order not found
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .put('/orders/999/status')
        .send({ status: 'selesai' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Pesanan tidak ditemukan');
    });
  });

  // ─── getOrdersByUser ───────────────────────────────────────────────────────

  describe('GET /orders/user/:userId - getOrdersByUser', () => {
    it('should return 200 with empty array for user with no orders', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/orders/user/5');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── getAllOrders ──────────────────────────────────────────────────────────

  describe('GET /orders - getAllOrders', () => {
    it('should return 200 with all orders (no user JOIN)', async () => {
      const mockOrders = [
        { id: 1, user_id: 1, jenis_desain: 'Logo', status: 'menunggu_pembayaran' },
        { id: 2, user_id: 2, jenis_desain: 'Banner', status: 'diproses' }
      ];

      pool.query.mockResolvedValueOnce([mockOrders]);

      const res = await request(app).get('/orders');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });
});

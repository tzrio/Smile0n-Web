/**
 * Recommendation Controller - Unit Tests
 * Owner: Roihan
 *
 * Tests menggunakan Jest + Supertest dengan database di-mock.
 * Tidak memerlukan koneksi MySQL untuk menjalankan tests ini.
 */

const request = require('supertest');

// Mock database pool sebelum require app
jest.mock('../config/db.js', () => {
  const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
  };
  return mockPool;
});

const app = require('../app');
const pool = require('../config/db.js');

describe('Recommendation Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /recommendations ───────────────────────────────────────────────────

  describe('GET /recommendations - getAllRecommendations', () => {
    it('harus mengembalikan 200 dengan daftar rekomendasi', async () => {
      const mockData = [
        { id: 1, user_id: 2, product_id: 1, score: '92.50', reason: 'Populer', created_at: '2024-01-01' },
        { id: 2, user_id: 2, product_id: 2, score: '85.00', reason: 'Relevan', created_at: '2024-01-01' }
      ];

      pool.query.mockResolvedValueOnce([mockData]);

      const res = await request(app).get('/recommendations');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('harus mengembalikan 200 dengan array kosong jika tidak ada data', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/recommendations');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('harus mengembalikan 500 jika database error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/recommendations');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Terjadi kesalahan server');
    });
  });

  // ─── GET /recommendations/user/:userId ──────────────────────────────────────

  describe('GET /recommendations/user/:userId - getRecommendationsByUser', () => {
    it('harus mengembalikan 200 dengan rekomendasi untuk user tertentu', async () => {
      const mockData = [
        { id: 1, user_id: 2, product_id: 1, score: '92.50', reason: 'Populer' }
      ];

      pool.query.mockResolvedValueOnce([mockData]);

      const res = await request(app).get('/recommendations/user/2');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].user_id).toBe(2);
    });

    it('harus mengembalikan 200 dengan array kosong untuk user tanpa rekomendasi', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/recommendations/user/999');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ─── POST /recommendations ──────────────────────────────────────────────────

  describe('POST /recommendations - createRecommendation', () => {
    it('harus mengembalikan 201 jika data valid', async () => {
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

      const res = await request(app)
        .post('/recommendations')
        .send({ user_id: 2, product_id: 1, score: 90.0, reason: 'Populer' });

      expect(res.status).toBe(201);
      expect(res.body.recommendation_id).toBe(10);
      expect(res.body.message).toBe('Rekomendasi berhasil ditambahkan');
    });

    it('harus mengembalikan 201 dengan score default 50 jika score tidak diisi', async () => {
      pool.query.mockResolvedValueOnce([{ insertId: 11 }]);

      const res = await request(app)
        .post('/recommendations')
        .send({ user_id: 2, product_id: 2 });

      expect(res.status).toBe(201);
      expect(res.body.recommendation_id).toBe(11);
    });

    it('harus mengembalikan 400 jika user_id tidak diisi', async () => {
      const res = await request(app)
        .post('/recommendations')
        .send({ product_id: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Field user_id dan product_id wajib diisi');
    });

    it('harus mengembalikan 400 jika product_id tidak diisi', async () => {
      const res = await request(app)
        .post('/recommendations')
        .send({ user_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Field user_id dan product_id wajib diisi');
    });

    it('harus mengembalikan 400 jika score di luar range 0-100', async () => {
      const res = await request(app)
        .post('/recommendations')
        .send({ user_id: 2, product_id: 1, score: 150 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Score harus berupa angka antara 0 dan 100');
    });

    it('harus mengembalikan 400 jika score negatif', async () => {
      const res = await request(app)
        .post('/recommendations')
        .send({ user_id: 2, product_id: 1, score: -10 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Score harus berupa angka antara 0 dan 100');
    });
  });

  // ─── DELETE /recommendations/:id ────────────────────────────────────────────

  describe('DELETE /recommendations/:id - deleteRecommendation', () => {
    it('harus mengembalikan 200 jika rekomendasi ditemukan dan berhasil dihapus', async () => {
      // Mock: rekomendasi ada
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      // Mock: delete berhasil
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete('/recommendations/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Rekomendasi berhasil dihapus');
    });

    it('harus mengembalikan 404 jika rekomendasi tidak ditemukan', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).delete('/recommendations/999');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Rekomendasi tidak ditemukan');
    });
  });

  // ─── Health check ────────────────────────────────────────────────────────────

  describe('GET / - health check', () => {
    it('harus mengembalikan status running', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.service).toBe('recommendation-service');
      expect(res.body.status).toBe('running');
    });
  });
});

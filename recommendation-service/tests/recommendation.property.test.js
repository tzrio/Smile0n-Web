/**
 * Property-Based Tests for Recommendation Module
 * Owner: Roihan
 *
 * Uses fast-check for property-based testing, jest as test runner,
 * and supertest for HTTP requests against the Express app.
 * Database is mocked via jest.mock('../config/db.js').
 *
 * ARSITEKTUR: Database Per Service
 * Tests memverifikasi bahwa recommendation-service HANYA berinteraksi
 * dengan tabel recommendations di recommendation_db.
 */

process.env.NODE_ENV = 'test';

const fc = require('fast-check');
const request = require('supertest');

jest.mock('../config/db.js', () => {
  const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
  };
  return mockPool;
});

const app = require('../app');
const pool = require('../config/db.js');

describe('Property 1: Score validation invariant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects any score outside 0-100 range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 101, max: 10000, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (invalidScore, userId, productId) => {
          const res = await request(app)
            .post('/recommendations')
            .send({ user_id: userId, product_id: productId, score: invalidScore });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Score harus berupa angka antara 0 dan 100');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects negative scores', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: -10000, max: -0.01, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (negativeScore, userId, productId) => {
          const res = await request(app)
            .post('/recommendations')
            .send({ user_id: userId, product_id: productId, score: negativeScore });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Score harus berupa angka antara 0 dan 100');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Valid score acceptance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts any score in 0-100 range and creates recommendation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (validScore, userId, productId) => {
          pool.query.mockResolvedValueOnce([{ insertId: 42 }]);

          const res = await request(app)
            .post('/recommendations')
            .send({ user_id: userId, product_id: productId, score: validScore });

          expect(res.status).toBe(201);
          expect(res.body.recommendation_id).toBe(42);
          expect(res.body.message).toBe('Rekomendasi berhasil ditambahkan');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Default score when not provided', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses default score of 50 when score is not provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (userId, productId) => {
          let insertedScore = null;

          pool.query.mockImplementation((sql, params) => {
            if (sql.includes('INSERT INTO recommendations')) {
              insertedScore = params[2]; // score is 3rd param
              return Promise.resolve([{ insertId: 1 }]);
            }
            return Promise.resolve([[]]);
          });

          const res = await request(app)
            .post('/recommendations')
            .send({ user_id: userId, product_id: productId });

          expect(res.status).toBe(201);
          expect(insertedScore).toBe(50.00);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: Required fields validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when user_id is missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (productId) => {
          const res = await request(app)
            .post('/recommendations')
            .send({ product_id: productId });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Field user_id dan product_id wajib diisi');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('rejects when product_id is missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (userId) => {
          const res = await request(app)
            .post('/recommendations')
            .send({ user_id: userId });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Field user_id dan product_id wajib diisi');
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 5: Recommendations sorted by score DESC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('all recommendations for a user are sorted by score descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 5 }),
        async (userId, count) => {
          const recs = [];
          for (let i = 0; i < count; i++) {
            recs.push({
              id: i + 1,
              user_id: userId,
              product_id: i + 1,
              score: (100 - i * 10).toFixed(2),
              reason: `Reason ${i}`,
              created_at: new Date().toISOString()
            });
          }

          pool.query.mockResolvedValueOnce([recs]);

          const res = await request(app)
            .get(`/recommendations/user/${userId}`);

          expect(res.status).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);

          for (let i = 1; i < res.body.length; i++) {
            expect(parseFloat(res.body[i - 1].score))
              .toBeGreaterThanOrEqual(parseFloat(res.body[i].score));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Delete non-existent recommendation returns 404', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for any non-existent recommendation ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100000 }),
        async (id) => {
          pool.query.mockResolvedValueOnce([[]]);

          const res = await request(app).delete(`/recommendations/${id}`);

          expect(res.status).toBe(404);
          expect(res.body.message).toBe('Rekomendasi tidak ditemukan');
        }
      ),
      { numRuns: 100 }
    );
  });
});

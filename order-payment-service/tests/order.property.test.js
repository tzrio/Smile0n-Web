/**
 * Property-Based Tests for Order Module
 * 
 * Uses fast-check for property-based testing, jest as test runner,
 * and supertest for HTTP requests against the Express app.
 * Database is mocked via jest.mock('../config/db.js').
 * 
 * Validates: Requirements 1.1, 1.4, 1.5, 2.1, 5.1, 5.2, 10.1, 10.2
 */

process.env.NODE_ENV = 'test';

const fc = require('fast-check');
const request = require('supertest');

// Mock the database pool before requiring the app
jest.mock('../config/db.js', () => {
  const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
  };
  return mockPool;
});

const app = require('../app');
const pool = require('../config/db.js');

// Allowed order statuses
const ALLOWED_STATUSES = [
  'menunggu_pembayaran',
  'menunggu_verifikasi',
  'diproses',
  'revisi',
  'selesai',
  'dibatalkan'
];

// Helper: arbitrary for non-empty strings (for jenis_desain)
const arbNonEmptyString = () =>
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

// Helper: arbitrary for optional text fields (including unicode and special chars)
const arbOptionalText = () =>
  fc.oneof(
    fc.constant(undefined),
    fc.constant(null),
    fc.string({ minLength: 0, maxLength: 200 }),
    fc.unicode({ minLength: 1, maxLength: 100 })
  );

describe('Property 1: Initial order status invariant', () => {
  /**
   * Validates: Requirements 1.1, 1.5, 10.2
   * 
   * For any valid order creation request (with a valid user_id and non-empty jenis_desain),
   * the created order SHALL always have status "menunggu_pembayaran" regardless of other field values.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('created order always has status "menunggu_pembayaran"', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbNonEmptyString(),
        arbOptionalText(),
        arbOptionalText(),
        arbOptionalText(),
        arbOptionalText(),
        arbOptionalText(),
        async (jenis_desain, konsep, warna, ukuran, referensi, catatan) => {
          // Mock: user exists
          pool.query.mockImplementation((sql) => {
            if (sql.includes('SELECT id FROM users')) {
              return Promise.resolve([[{ id: 1 }]]);
            }
            if (sql.includes('INSERT INTO orders')) {
              return Promise.resolve([{ insertId: 42 }]);
            }
            return Promise.resolve([[]]);
          });

          const payload = { user_id: 1, jenis_desain };
          if (konsep !== undefined && konsep !== null) payload.konsep = konsep;
          if (warna !== undefined && warna !== null) payload.warna = warna;
          if (ukuran !== undefined && ukuran !== null) payload.ukuran = ukuran;
          if (referensi !== undefined && referensi !== null) payload.referensi = referensi;
          if (catatan !== undefined && catatan !== null) payload.catatan = catatan;

          const res = await request(app)
            .post('/orders')
            .send(payload);

          expect(res.status).toBe(201);
          expect(res.body.status).toBe('menunggu_pembayaran');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Order data persistence round-trip', () => {
  /**
   * Validates: Requirements 1.4
   * 
   * For any valid order with arbitrary values for jenis_desain, konsep, warna, ukuran,
   * referensi, catatan, and estimasi_pengerjaan, creating the order and then retrieving
   * it by id SHALL return all the same field values that were submitted.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('all submitted fields match returned values after create and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbNonEmptyString(),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        async (jenis_desain, konsep, warna, ukuran, referensi, catatan, estimasi_pengerjaan) => {
          const orderId = Math.floor(Math.random() * 10000) + 1;

          // Store what was inserted to verify on retrieval
          let insertedValues = null;

          pool.query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT id FROM users')) {
              return Promise.resolve([[{ id: 1 }]]);
            }
            if (sql.includes('INSERT INTO orders')) {
              insertedValues = params;
              return Promise.resolve([{ insertId: orderId }]);
            }
            if (sql.includes('SELECT * FROM orders WHERE id')) {
              // Return the order with the same values that were inserted
              return Promise.resolve([[{
                id: orderId,
                user_id: insertedValues[0],
                product_id: insertedValues[1],
                jenis_desain: insertedValues[2],
                konsep: insertedValues[3],
                warna: insertedValues[4],
                ukuran: insertedValues[5],
                referensi: insertedValues[6],
                catatan: insertedValues[7],
                estimasi_pengerjaan: insertedValues[8],
                status: 'menunggu_pembayaran',
                created_at: new Date().toISOString()
              }]]);
            }
            return Promise.resolve([[]]);
          });

          const payload = {
            user_id: 1,
            jenis_desain,
            konsep,
            warna,
            ukuran,
            referensi,
            catatan,
            estimasi_pengerjaan
          };

          // Create order
          const createRes = await request(app)
            .post('/orders')
            .send(payload);

          expect(createRes.status).toBe(201);

          // Retrieve order
          const getRes = await request(app)
            .get(`/orders/${orderId}`);

          expect(getRes.status).toBe(200);
          expect(getRes.body.jenis_desain).toBe(jenis_desain);
          expect(getRes.body.konsep).toBe(konsep || null);
          expect(getRes.body.warna).toBe(warna || null);
          expect(getRes.body.ukuran).toBe(ukuran || null);
          expect(getRes.body.referensi).toBe(referensi || null);
          expect(getRes.body.catatan).toBe(catatan || null);
          expect(getRes.body.estimasi_pengerjaan).toBe(estimasi_pengerjaan || null);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Order history belongs to user and is sorted', () => {
  /**
   * Validates: Requirements 2.1
   * 
   * For any user with one or more orders, retrieving the order history for that user
   * SHALL return only orders belonging to that user, and the list SHALL be sorted
   * by creation date (descending).
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('all returned orders belong to user and are sorted by created_at DESC', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 5 }),
        async (userId, orderCount) => {
          // Generate N orders for this user with descending timestamps
          const orders = [];
          const baseTime = Date.now();
          for (let i = 0; i < orderCount; i++) {
            orders.push({
              id: i + 1,
              user_id: userId,
              jenis_desain: `Design ${i}`,
              status: 'menunggu_pembayaran',
              estimasi_pengerjaan: '3 hari',
              created_at: new Date(baseTime - i * 60000).toISOString()
            });
          }

          pool.query.mockImplementation((sql, params) => {
            if (sql.includes('SELECT id, jenis_desain, status, estimasi_pengerjaan, created_at FROM orders WHERE user_id')) {
              return Promise.resolve([orders]);
            }
            return Promise.resolve([[]]);
          });

          const res = await request(app)
            .get(`/orders/user/${userId}`);

          expect(res.status).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(orderCount);

          // Verify all orders belong to the user
          for (const order of res.body) {
            expect(order.user_id).toBe(userId);
          }

          // Verify sorted by created_at DESC
          for (let i = 1; i < res.body.length; i++) {
            const prev = new Date(res.body[i - 1].created_at).getTime();
            const curr = new Date(res.body[i].created_at).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: Valid status update is reflected', () => {
  /**
   * Validates: Requirements 5.1
   * 
   * For any existing order and any status value from the allowed set,
   * updating the order status SHALL succeed and the order's status SHALL
   * equal the new value when retrieved.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updating with a valid status succeeds and is reflected on retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALLOWED_STATUSES),
        fc.integer({ min: 1, max: 10000 }),
        async (newStatus, orderId) => {
          let currentStatus = 'menunggu_pembayaran';

          pool.query.mockImplementation((sql, params) => {
            if (sql.includes('UPDATE orders SET status')) {
              currentStatus = params[0];
              return Promise.resolve([{ affectedRows: 1 }]);
            }
            if (sql.includes('SELECT * FROM orders WHERE id')) {
              return Promise.resolve([[{
                id: orderId,
                status: currentStatus
              }]]);
            }
            if (sql.includes('SELECT id FROM orders WHERE id')) {
              return Promise.resolve([[{ id: orderId }]]);
            }
            return Promise.resolve([[]]);
          });

          // Update status
          const updateRes = await request(app)
            .put(`/orders/${orderId}/status`)
            .send({ status: newStatus });

          expect(updateRes.status).toBe(200);
          expect(updateRes.body.status).toBe(newStatus);

          // Retrieve and verify
          const getRes = await request(app)
            .get(`/orders/${orderId}`);

          expect(getRes.status).toBe(200);
          expect(getRes.body.status).toBe(newStatus);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Invalid order status rejection', () => {
  /**
   * Validates: Requirements 5.2, 10.1
   * 
   * For any string that is NOT one of the allowed statuses,
   * attempting to update an order's status with that string SHALL be rejected with a 400 error.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects any status string not in the allowed set with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(
          s => !ALLOWED_STATUSES.includes(s)
        ),
        fc.integer({ min: 1, max: 10000 }),
        async (invalidStatus, orderId) => {
          // The controller should reject before even checking the DB
          pool.query.mockImplementation((sql) => {
            if (sql.includes('SELECT id FROM orders WHERE id')) {
              return Promise.resolve([[{ id: orderId }]]);
            }
            return Promise.resolve([[]]);
          });

          const res = await request(app)
            .put(`/orders/${orderId}/status`)
            .send({ status: invalidStatus });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Status tidak valid');
        }
      ),
      { numRuns: 100 }
    );
  });
});

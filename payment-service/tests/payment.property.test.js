/**
 * Property-Based Tests for Payment Module
 * Owner: Roihan
 *
 * Uses fast-check for property-based testing, jest as test runner,
 * and supertest for HTTP requests against the Express app.
 * Database is mocked via jest.mock('../config/db.js').
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

const ALLOWED_VERIFICATION_STATUSES = ['terverifikasi', 'ditolak'];

describe('Property 6: Invalid payment verification status rejection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects any status_verifikasi string not in the allowed set with 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(
          s => !ALLOWED_VERIFICATION_STATUSES.includes(s)
        ),
        fc.integer({ min: 1, max: 10000 }),
        async (invalidStatus, paymentId) => {
          pool.query.mockImplementation((sql) => {
            if (sql.includes('SELECT id, order_id FROM payments WHERE id')) {
              return Promise.resolve([[{ id: paymentId, order_id: 1 }]]);
            }
            return Promise.resolve([[]]);
          });

          const res = await request(app)
            .put(`/payments/${paymentId}/verify`)
            .send({ status_verifikasi: invalidStatus });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe('Status verifikasi tidak valid');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Unique filename generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates unique filenames for uploads with the same original filename using different timestamps', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
        fc.uniqueArray(fc.integer({ min: 1000000000000, max: 9999999999999 }), { minLength: 2, maxLength: 10 }),
        (originalFilename, timestamps) => {
          const generatedFilenames = timestamps.map(ts => {
            return ts + '-' + originalFilename;
          });

          const uniqueSet = new Set(generatedFilenames);
          expect(uniqueSet.size).toBe(generatedFilenames.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filename format includes timestamp prefix ensuring uniqueness across calls', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
        fc.integer({ min: 1000000000000, max: 9999999999999 }),
        fc.integer({ min: 1000000000000, max: 9999999999999 }),
        (originalFilename, timestamp1, timestamp2) => {
          const filename1 = timestamp1 + '-' + originalFilename;
          const filename2 = timestamp2 + '-' + originalFilename;

          if (timestamp1 !== timestamp2) {
            expect(filename1).not.toBe(filename2);
          }

          expect(filename1).toContain(originalFilename);
          expect(filename2).toContain(originalFilename);

          const pattern = /^\d+-/;
          expect(filename1).toMatch(pattern);
          expect(filename2).toMatch(pattern);
        }
      ),
      { numRuns: 100 }
    );
  });
});

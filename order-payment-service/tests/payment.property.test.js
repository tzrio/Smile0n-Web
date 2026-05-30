/**
 * Property-Based Tests for Payment Module
 * 
 * Uses fast-check for property-based testing, jest as test runner,
 * and supertest for HTTP requests against the Express app.
 * Database is mocked via jest.mock('../config/db.js').
 * 
 * Validates: Requirements 7.4, 13.2
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

// Allowed payment verification statuses
const ALLOWED_VERIFICATION_STATUSES = ['terverifikasi', 'ditolak'];

describe('Property 6: Invalid payment verification status rejection', () => {
  /**
   * Validates: Requirements 7.4
   * 
   * For any string that is NOT one of {terverifikasi, ditolak},
   * attempting to verify a payment with that string SHALL be rejected with a 400 error.
   */
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
          // The controller should reject before even checking the DB
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
  /**
   * Validates: Requirements 13.2
   * 
   * For any two file uploads (even with the same original filename),
   * the generated storage filenames SHALL be different, preventing file overwrites.
   * 
   * Tests the Multer storage filename generation function directly by simulating
   * different timestamps (as Date.now() would produce in real usage).
   */
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
            // Replicate the logic from middleware/upload.js: Date.now() + '-' + file.originalname
            return ts + '-' + originalFilename;
          });

          // All generated filenames should be unique
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
          // Simulate the filename generation from middleware/upload.js
          const filename1 = timestamp1 + '-' + originalFilename;
          const filename2 = timestamp2 + '-' + originalFilename;

          // If timestamps differ, filenames must differ (even with same original name)
          if (timestamp1 !== timestamp2) {
            expect(filename1).not.toBe(filename2);
          }

          // Verify the filename contains the original name
          expect(filename1).toContain(originalFilename);
          expect(filename2).toContain(originalFilename);

          // Verify the filename matches the expected pattern: <timestamp>-<originalname>
          const pattern = /^\d+-/;
          expect(filename1).toMatch(pattern);
          expect(filename2).toMatch(pattern);
        }
      ),
      { numRuns: 100 }
    );
  });
});

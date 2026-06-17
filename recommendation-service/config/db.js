/**
 * Konfigurasi Koneksi Database - Recommendation Service
 * Owner: Roihan
 *
 * Environment variable yang digunakan:
 * - DB_HOST: alamat server MySQL (di Kubernetes: "mysql-recommendation")
 * - DB_PORT: port MySQL (default: 3306)
 * - DB_USER: username database (default: "root")
 * - DB_PASSWORD: password database
 * - DB_NAME: nama database (default: "recommendation_db")
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'recommendation_db',
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection()
  .then((connection) => {
    console.log('Koneksi database recommendation berhasil');
    connection.release();
  })
  .catch((err) => {
    console.error('Koneksi database recommendation gagal:', err.message);
    process.exit(1);
  });

module.exports = pool;

/**
 * Konfigurasi Koneksi Database - Order-Payment Service
 * 
 * File ini membuat connection pool ke MySQL menggunakan mysql2/promise.
 * Connection pool memungkinkan beberapa query berjalan bersamaan
 * tanpa harus membuka/menutup koneksi setiap kali.
 * 
 * Environment variable yang digunakan:
 * - DB_HOST: alamat server MySQL (di Kubernetes: "mysql-service")
 * - DB_PORT: port MySQL (default: 3306)
 * - DB_USER: username database (default: "root")
 * - DB_PASSWORD: password database
 * - DB_NAME: nama database (default: "smileon_db")
 */

const mysql = require('mysql2/promise');

// Membuat connection pool ke MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // Alamat host database
  port: process.env.DB_PORT,         // Port database
  user: process.env.DB_USER,         // Username database
  password: process.env.DB_PASSWORD, // Password database
  database: process.env.DB_NAME,     // Nama database yang digunakan
  waitForConnections: true,          // Tunggu jika semua koneksi sedang dipakai
  connectionLimit: 10                // Maksimal 10 koneksi bersamaan
});

// Tes koneksi saat service pertama kali dijalankan
// Jika gagal konek, service akan berhenti (exit code 1)
pool.getConnection()
  .then((connection) => {
    console.log('Koneksi database berhasil');
    connection.release(); // Kembalikan koneksi ke pool
  })
  .catch((err) => {
    console.error('Koneksi database gagal:', err.message);
    process.exit(1); // Hentikan service jika database tidak bisa diakses
  });

// Export pool agar bisa digunakan oleh controller
module.exports = pool;

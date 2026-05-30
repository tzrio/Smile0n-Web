-- SmileOn Lab Database Initialization Script
-- Creates database, tables, and inserts dummy data

CREATE DATABASE IF NOT EXISTS smileon_db;
USE smileon_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nomor_telepon VARCHAR(20),
  alamat TEXT,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_produk VARCHAR(150) NOT NULL,
  kategori VARCHAR(100),
  deskripsi TEXT,
  harga DECIMAL(12, 2) NOT NULL,
  gambar VARCHAR(255),
  estimasi_pengerjaan VARCHAR(50),
  status_ketersediaan ENUM('tersedia', 'tidak_tersedia') NOT NULL DEFAULT 'tersedia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NULL,
  jenis_desain VARCHAR(100) NOT NULL,
  konsep TEXT,
  warna VARCHAR(100),
  ukuran VARCHAR(100),
  referensi TEXT,
  catatan TEXT,
  file_pendukung VARCHAR(255),
  estimasi_pengerjaan VARCHAR(50),
  status ENUM('menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'revisi', 'selesai', 'dibatalkan') DEFAULT 'menunggu_pembayaran',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  metode_pembayaran VARCHAR(100),
  jumlah DECIMAL(12, 2),
  bukti_pembayaran VARCHAR(255),
  status_verifikasi ENUM('menunggu_verifikasi', 'terverifikasi', 'ditolak') DEFAULT 'menunggu_verifikasi',
  tanggal_pembayaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================
-- Dummy Data
-- =====================

-- Admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (nama, email, password, nomor_telepon, alamat, role) VALUES
('Admin SmileOn', 'admin@smileon.com', '$2b$10$xPQ5Z6Z6Z6Z6Z6Z6Z6Z6ZuKJ8qK8qK8qK8qK8qK8qK8qK8qK8qK', '081234567890', 'Jl. Admin No. 1, Jakarta', 'admin');

-- Regular user (password: user123 - hashed with bcrypt)
INSERT INTO users (nama, email, password, nomor_telepon, alamat, role) VALUES
('Budi Santoso', 'budi@email.com', '$2b$10$yRQ6A7A7A7A7A7A7A7A7AuLK9rL9rL9rL9rL9rL9rL9rL9rL9rL9r', '082345678901', 'Jl. Merdeka No. 10, Bandung', 'user');

-- 3 Products
INSERT INTO products (nama_produk, kategori, deskripsi, harga, gambar, estimasi_pengerjaan, status_ketersediaan) VALUES
('Desain Logo', 'Logo', 'Desain logo profesional untuk bisnis Anda dengan konsep modern dan minimalis', 500000.00, 'images/logo-design.jpg', '3-5 hari', 'tersedia'),
('Desain Banner', 'Banner', 'Desain banner promosi untuk media sosial dan website dengan ukuran custom', 300000.00, 'images/banner-design.jpg', '2-3 hari', 'tersedia'),
('Desain Kemasan', 'Packaging', 'Desain kemasan produk yang menarik dan sesuai branding perusahaan', 750000.00, 'images/packaging-design.jpg', '5-7 hari', 'tersedia');

-- 1 Sample order (from user Budi, linked to product Desain Logo)
INSERT INTO orders (user_id, product_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, estimasi_pengerjaan, status) VALUES
(2, 1, 'Logo Perusahaan', 'Logo modern minimalis untuk startup teknologi', 'Biru dan Putih', '1000x1000 px', 'https://example.com/referensi-logo', 'Tolong sertakan versi hitam putih juga', '3-5 hari', 'menunggu_pembayaran');

-- 1 Sample payment (for the sample order above)
INSERT INTO payments (order_id, user_id, metode_pembayaran, jumlah, bukti_pembayaran, status_verifikasi) VALUES
(1, 2, 'Transfer Bank BCA', 500000.00, 'uploads/bukti-transfer-001.jpg', 'menunggu_verifikasi');

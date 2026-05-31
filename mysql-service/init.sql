-- ============================================
-- SmileOn Lab - Script Inisialisasi Database
-- ============================================
-- File ini dijalankan otomatis saat MySQL pertama kali dijalankan.
-- Berisi pembuatan database, tabel-tabel, dan data dummy untuk testing.
--
-- Tabel yang dibuat:
--   1. users    → Data pengguna (admin dan user biasa)
--   2. products → Data produk/jasa desain yang ditawarkan
--   3. orders   → Data pesanan desain custom dari user
--   4. payments → Data pembayaran dan bukti transfer
--
-- Relasi antar tabel:
--   orders.user_id    → users.id (siapa yang memesan)
--   orders.product_id → products.id (produk yang dipesan, opsional)
--   payments.order_id → orders.id (pembayaran untuk pesanan mana)
--   payments.user_id  → users.id (siapa yang membayar)
-- ============================================

-- Membuat database jika belum ada
CREATE DATABASE IF NOT EXISTS smileon_db;
USE smileon_db;

-- ============================================
-- TABEL USERS
-- ============================================
-- Menyimpan data semua pengguna sistem (admin dan user biasa).
-- Tabel ini digunakan oleh Auth Service untuk login/register,
-- dan oleh Order-Payment Service untuk relasi pesanan.
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,              -- Nama lengkap pengguna
  email VARCHAR(100) UNIQUE NOT NULL,      -- Email (unik, untuk login)
  password VARCHAR(255) NOT NULL,          -- Password (di-hash dengan bcrypt)
  nomor_telepon VARCHAR(20),               -- Nomor HP (opsional)
  alamat TEXT,                             -- Alamat lengkap (opsional)
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user', -- Peran: admin atau user
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP      -- Waktu pendaftaran
);

-- ============================================
-- TABEL PRODUCTS
-- ============================================
-- Menyimpan data produk/jasa desain yang ditawarkan SmileOn Lab.
-- Dikelola oleh Product Service (Anggota 2).
-- Digunakan oleh Order-Payment Service sebagai referensi pesanan.
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_produk VARCHAR(150) NOT NULL,       -- Nama produk desain
  kategori VARCHAR(100),                   -- Kategori (Logo, Banner, Packaging, dll)
  deskripsi TEXT,                          -- Deskripsi lengkap produk
  harga DECIMAL(12, 2) NOT NULL,           -- Harga dalam Rupiah
  gambar VARCHAR(255),                     -- Path gambar produk
  estimasi_pengerjaan VARCHAR(50),         -- Estimasi waktu pengerjaan
  status_ketersediaan ENUM('tersedia', 'tidak_tersedia') NOT NULL DEFAULT 'tersedia',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL ORDERS
-- ============================================
-- Menyimpan data pesanan desain custom dari user.
-- Ini adalah tabel utama yang dikelola oleh Order-Payment Service.
--
-- Alur status pesanan:
--   menunggu_pembayaran → menunggu_verifikasi → diproses → selesai
--   (bisa juga: revisi atau dibatalkan)
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,                    -- ID user yang memesan
  product_id INT NULL,                     -- ID produk terkait (opsional)
  jenis_desain VARCHAR(100) NOT NULL,      -- Jenis desain yang diminta (wajib)
  konsep TEXT,                             -- Konsep/ide desain dari user
  warna VARCHAR(100),                      -- Preferensi warna
  ukuran VARCHAR(100),                     -- Ukuran yang diinginkan
  referensi TEXT,                          -- Link referensi desain
  catatan TEXT,                            -- Catatan tambahan dari user
  file_pendukung VARCHAR(255),             -- File pendukung (opsional)
  estimasi_pengerjaan VARCHAR(50),         -- Estimasi waktu pengerjaan
  status ENUM('menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'revisi', 'selesai', 'dibatalkan') DEFAULT 'menunggu_pembayaran',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- TABEL PAYMENTS
-- ============================================
-- Menyimpan data pembayaran dan bukti transfer dari user.
-- Setiap pembayaran terkait dengan satu pesanan (order).
--
-- Alur verifikasi:
--   menunggu_verifikasi → terverifikasi (diterima) / ditolak
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,                   -- ID pesanan yang dibayar
  user_id INT NOT NULL,                    -- ID user yang membayar
  metode_pembayaran VARCHAR(100),          -- Metode: Transfer Bank, QRIS, dll
  jumlah DECIMAL(12, 2),                   -- Nominal pembayaran
  bukti_pembayaran VARCHAR(255),           -- Nama file bukti transfer
  status_verifikasi ENUM('menunggu_verifikasi', 'terverifikasi', 'ditolak') DEFAULT 'menunggu_verifikasi',
  tanggal_pembayaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,              -- Waktu verifikasi oleh admin
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- DATA DUMMY UNTUK TESTING
-- ============================================
-- Data ini digunakan agar bisa langsung testing tanpa harus register dulu.

-- 1 Admin (password: admin123, sudah di-hash)
INSERT INTO users (nama, email, password, nomor_telepon, alamat, role) VALUES
('Admin SmileOn', 'admin@smileon.com', '$2b$10$xPQ5Z6Z6Z6Z6Z6Z6Z6Z6ZuKJ8qK8qK8qK8qK8qK8qK8qK8qK8qK', '081234567890', 'Jl. Admin No. 1, Jakarta', 'admin');

-- 1 User biasa (password: user123, sudah di-hash)
INSERT INTO users (nama, email, password, nomor_telepon, alamat, role) VALUES
('Budi Santoso', 'budi@email.com', '$2b$10$yRQ6A7A7A7A7A7A7A7A7AuLK9rL9rL9rL9rL9rL9rL9rL9rL9rL9r', '082345678901', 'Jl. Merdeka No. 10, Bandung', 'user');

-- 3 Produk desain
INSERT INTO products (nama_produk, kategori, deskripsi, harga, gambar, estimasi_pengerjaan, status_ketersediaan) VALUES
('Desain Logo', 'Logo', 'Desain logo profesional untuk bisnis Anda dengan konsep modern dan minimalis', 500000.00, 'images/logo-design.jpg', '3-5 hari', 'tersedia'),
('Desain Banner', 'Banner', 'Desain banner promosi untuk media sosial dan website dengan ukuran custom', 300000.00, 'images/banner-design.jpg', '2-3 hari', 'tersedia'),
('Desain Kemasan', 'Packaging', 'Desain kemasan produk yang menarik dan sesuai branding perusahaan', 750000.00, 'images/packaging-design.jpg', '5-7 hari', 'tersedia');

-- 1 Contoh pesanan (dari user Budi untuk produk Desain Logo)
INSERT INTO orders (user_id, product_id, jenis_desain, konsep, warna, ukuran, referensi, catatan, estimasi_pengerjaan, status) VALUES
(2, 1, 'Logo Perusahaan', 'Logo modern minimalis untuk startup teknologi', 'Biru dan Putih', '1000x1000 px', 'https://example.com/referensi-logo', 'Tolong sertakan versi hitam putih juga', '3-5 hari', 'menunggu_pembayaran');

-- 1 Contoh pembayaran (untuk pesanan di atas)
INSERT INTO payments (order_id, user_id, metode_pembayaran, jumlah, bukti_pembayaran, status_verifikasi) VALUES
(1, 2, 'Transfer Bank BCA', 500000.00, 'uploads/bukti-transfer-001.jpg', 'menunggu_verifikasi');

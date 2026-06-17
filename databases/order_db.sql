-- ============================================
-- Order Service Database - Owner: Roihan
-- Database untuk menyimpan data pesanan desain custom SmileOn Lab
--
-- ARSITEKTUR: Database Per Service
-- Database ini HANYA dimiliki oleh order-service.
-- Tidak ada tabel dari service lain (no shared database).
-- user_id dan product_id disimpan sebagai referensi ID saja.
-- Validasi user dilakukan di API Gateway / auth middleware.
-- ============================================

CREATE DATABASE IF NOT EXISTS order_db;
USE order_db;

-- ============================================
-- TABEL ORDERS: data pesanan desain custom
-- ============================================
-- user_id mereferensi user di auth-service (via HTTP/gateway, bukan FK)
-- product_id mereferensi produk di product-service (via HTTP, bukan FK)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- DATA DUMMY UNTUK TESTING
-- ============================================

INSERT INTO orders (user_id, product_id, jenis_desain, konsep, warna, ukuran, estimasi_pengerjaan, status) VALUES
(1, 1, 'Logo Perusahaan', 'Logo modern minimalis', 'Biru dan Putih', '1000x1000 px', '3-5 hari', 'menunggu_pembayaran');

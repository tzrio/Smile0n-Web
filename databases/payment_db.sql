-- ============================================
-- Payment Service Database - Owner: Roihan
-- Database untuk menyimpan data pembayaran dan bukti transfer
--
-- ARSITEKTUR: Database Per Service
-- Database ini HANYA dimiliki oleh payment-service.
-- Tidak ada tabel dari service lain (no shared database).
-- Komunikasi dengan order-service dilakukan via HTTP API.
-- ============================================

CREATE DATABASE IF NOT EXISTS payment_db;
USE payment_db;

-- ============================================
-- TABEL PAYMENTS: data pembayaran dan bukti transfer
-- ============================================
-- order_id mereferensi pesanan di order-service (via HTTP, bukan FK)
-- user_id mereferensi user di auth-service (via HTTP, bukan FK)
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  metode_pembayaran VARCHAR(100),
  jumlah DECIMAL(12, 2),
  bukti_pembayaran VARCHAR(255),
  status_verifikasi ENUM('menunggu_verifikasi', 'terverifikasi', 'ditolak') DEFAULT 'menunggu_verifikasi',
  tanggal_pembayaran TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL
);

-- ============================================
-- DATA DUMMY UNTUK TESTING
-- ============================================

INSERT INTO payments (order_id, user_id, metode_pembayaran, jumlah, bukti_pembayaran, status_verifikasi) VALUES
(1, 1, 'Transfer Bank BCA', 500000.00, 'uploads/bukti-transfer-001.jpg', 'menunggu_verifikasi');

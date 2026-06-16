-- ============================================
-- Product Service Database - Owner: Rakha
-- ============================================

CREATE DATABASE IF NOT EXISTS product_db;
USE product_db;

-- ============================================
-- TABEL PRODUCTS
-- ============================================
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

-- ============================================
-- DATA DUMMY UNTUK TESTING
-- ============================================

INSERT INTO products (nama_produk, kategori, deskripsi, harga, gambar, estimasi_pengerjaan, status_ketersediaan) VALUES
('Desain Logo', 'Logo', 'Desain logo profesional', 500000.00, 'images/logo-design.jpg', '3-5 hari', 'tersedia'),
('Desain Banner', 'Banner', 'Desain banner promosi', 300000.00, 'images/banner-design.jpg', '2-3 hari', 'tersedia'),
('Desain Kemasan', 'Packaging', 'Desain kemasan produk', 750000.00, 'images/packaging-design.jpg', '5-7 hari', 'tersedia');

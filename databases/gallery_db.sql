-- ============================================
-- Portfolio Service Database - Owner: Rakha
-- ============================================

CREATE DATABASE IF NOT EXISTS gallery_db;
USE gallery_db;

-- ============================================
-- TABEL PORTFOLIOS
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  judul VARCHAR(200) NOT NULL,
  kategori VARCHAR(100),
  deskripsi TEXT,
  gambar VARCHAR(255),
  tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

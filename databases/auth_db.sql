-- ============================================
-- Auth Service Database - Owner: Rakha
-- ============================================

CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- ============================================
-- TABEL USERS
-- ============================================
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

-- ============================================
-- DATA DUMMY UNTUK TESTING
-- ============================================

INSERT INTO users (nama, email, password, nomor_telepon, alamat, role) VALUES
('Admin SmileOn', 'admin@smileon.com', '$2b$10$xPQ5Z6Z6Z6Z6Z6Z6Z6Z6ZuKJ8qK8qK8qK8qK8qK8qK8qK8qK8qK', '081234567890', 'Jl. Admin No. 1, Jakarta', 'admin');

INSERT INTO users (nama, email, password, nomor_telepon, alamat, role) VALUES
('Budi Santoso', 'budi@email.com', '$2b$10$yRQ6A7A7A7A7A7A7A7A7AuLK9rL9rL9rL9rL9rL9rL9rL9rL9rL9r', '082345678901', 'Jl. Merdeka No. 10, Bandung', 'user');

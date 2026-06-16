-- ============================================
-- Recommendation Service Database - Owner: Roihan
-- Database untuk menyimpan data rekomendasi produk per user
--
-- Tabel:
--   recommendations → rekomendasi produk untuk user
--
-- Setiap rekomendasi memiliki score (0-100) yang menunjukkan
-- seberapa relevan produk tersebut bagi user.
-- ============================================

CREATE DATABASE IF NOT EXISTS recommendation_db;
USE recommendation_db;

-- ============================================
-- TABEL RECOMMENDATIONS
-- ============================================
-- Menyimpan rekomendasi produk untuk setiap user.
-- user_id    : ID user yang menerima rekomendasi (referensi ke auth_db.users)
-- product_id : ID produk yang direkomendasikan (referensi ke product_db.products)
-- score      : Skor relevansi 0.00-100.00 (semakin tinggi semakin relevan)
-- reason     : Alasan rekomendasi (misal: "Populer di kategori Logo")
CREATE TABLE IF NOT EXISTS recommendations (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  score      DECIMAL(5, 2) DEFAULT 50.00,
  reason     VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DATA DUMMY UNTUK TESTING
-- ============================================
-- user_id 1 = Admin, user_id 2 = Budi Santoso (dari auth_db)
-- product_id 1 = Desain Logo, product_id 2 = Desain Banner (dari product_db)
INSERT INTO recommendations (user_id, product_id, score, reason) VALUES
(2, 1, 92.50, 'Produk terpopuler di kategori Logo'),
(2, 2, 85.00, 'Cocok untuk kebutuhan promosi media sosial'),
(2, 3, 78.50, 'Rekomendasi berdasarkan pesanan sebelumnya');

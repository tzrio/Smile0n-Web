/**
 * Order-Payment Service - SmileOn Lab
 * 
 * File ini adalah entry point utama untuk service pesanan dan pembayaran.
 * Service ini menangani:
 * - Pembuatan pesanan desain custom
 * - Upload bukti pembayaran
 * - Verifikasi pembayaran oleh admin
 * - Update status pesanan
 * - Riwayat pesanan user
 * 
 * Dikerjakan oleh Anggota 3.
 */

// Memuat environment variable dari file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Mengizinkan akses API dari frontend/gateway (Cross-Origin Resource Sharing)
app.use(cors());
// Parsing body request dalam format JSON
app.use(express.json());

// ============================================
// PERSIAPAN FOLDER UPLOAD
// ============================================

// Membuat folder upload jika belum ada saat service pertama kali dijalankan
// UPLOAD_DIR: lokasi penyimpanan file bukti pembayaran
const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(uploadDir, { recursive: true });

// ============================================
// ROUTING (PENGHUBUNG URL KE CONTROLLER)
// ============================================

// Import file route untuk pesanan dan pembayaran
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Semua request ke /orders akan ditangani oleh orderRoutes
app.use('/orders', orderRoutes);
// Semua request ke /payments akan ditangani oleh paymentRoutes
app.use('/payments', paymentRoutes);

// ============================================
// MENJALANKAN SERVER
// ============================================

// PORT: port yang digunakan service ini (default 3000)
const PORT = process.env.PORT || 3000;

// Hanya jalankan server jika bukan dalam mode testing
// (saat testing, supertest yang mengelola server)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Order-Payment Service berjalan di port ${PORT}`);
  });
}

// Export app agar bisa digunakan oleh supertest untuk testing
module.exports = app;

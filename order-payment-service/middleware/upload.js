/**
 * Middleware Upload File - Konfigurasi Multer
 * 
 * File ini mengatur bagaimana file yang diupload user akan disimpan.
 * Digunakan khusus untuk menerima bukti pembayaran dalam format gambar.
 * 
 * Aturan upload:
 * - Hanya menerima file gambar (JPEG, JPG, PNG)
 * - Maksimal ukuran file: 5MB
 * - File disimpan di folder yang ditentukan oleh UPLOAD_DIR
 * - Nama file dibuat unik menggunakan timestamp agar tidak tertimpa
 */

const multer = require('multer');

// Lokasi penyimpanan file (dari environment variable atau default './uploads')
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  // Menentukan folder tujuan penyimpanan
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Membuat nama file unik: timestamp + nama asli file
  // Contoh: 1700000000000-bukti-transfer.png
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// Filter file: hanya izinkan format gambar tertentu
const fileFilter = function (req, file, cb) {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // File diterima
  } else {
    cb(new Error('Format file tidak didukung'), false); // File ditolak
  }
};

// Membuat instance Multer dengan semua konfigurasi
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batas ukuran: 5MB (dalam bytes)
  }
});

module.exports = upload;

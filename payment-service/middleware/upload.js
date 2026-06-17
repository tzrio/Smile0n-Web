/**
 * Middleware Upload File - Konfigurasi Multer
 * Owner: Roihan
 *
 * Aturan upload:
 * - Hanya menerima file gambar (JPEG, JPG, PNG)
 * - Maksimal ukuran file: 5MB
 * - File disimpan di folder yang ditentukan oleh UPLOAD_DIR
 * - Nama file dibuat unik menggunakan timestamp
 */

const multer = require('multer');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;

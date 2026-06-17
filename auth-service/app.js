/**
 * Auth Service - SmileOn Lab
 * Owner: Rakha
 *
 * File ini adalah entry point untuk service autentikasi.
 * Service ini menangani register, login, dan manajemen role user/admin.
 */

const express = require('express');
const cors = require('cors');
const app = express();

// PORT: port yang digunakan service ini (default 3000)
const PORT = process.env.PORT || 3000;

// Middleware: mengizinkan akses dari service/frontend lain (CORS)
app.use(cors());
// Middleware: parsing body request dalam format JSON
app.use(express.json());

// Route utama - cek apakah service berjalan
app.get('/', (req, res) => {
  res.json({ message: 'SmileOn Lab - Auth Service' });
});

// Menjalankan server pada port yang ditentukan
app.listen(PORT, () => {
  console.log(`Auth Service berjalan di port ${PORT}`);
});

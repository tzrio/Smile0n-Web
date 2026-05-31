/**
 * Frontend Service - SmileOn Lab
 * 
 * File ini adalah entry point untuk service frontend.
 * Service ini menyajikan tampilan website SmileOn Lab kepada pengguna.
 * Dikerjakan oleh Anggota 1.
 */

const express = require('express');
const app = express();

// PORT: port yang digunakan service ini (default 3000)
const PORT = process.env.PORT || 3000;

// Route utama - menampilkan halaman depan
app.get('/', (req, res) => {
  res.send('SmileOn Lab - Frontend Service');
});

// Menjalankan server pada port yang ditentukan
app.listen(PORT, () => {
  console.log(`Frontend Service berjalan di port ${PORT}`);
});

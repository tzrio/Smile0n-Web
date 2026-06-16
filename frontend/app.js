/**
 * Frontend - SmileOn Lab
 * Owner: Bagus
 *
 * File ini adalah entry point untuk frontend.
 * Frontend menyajikan tampilan website SmileOn Lab kepada pengguna.
 * Frontend BUKAN microservice.
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

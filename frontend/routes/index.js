/**
 * SmileOn Lab - Route Handlers
 * Owner: Bagus (Frontend Integration)
 * 
 * File ini menghubungkan halaman frontend dengan backend microservice
 * melalui Nginx API Gateway (http://api-gateway).
 * 
 * SETIAP ROUTE:
 * - GET  : Menyajikan halaman (render EJS)
 * - POST : Menerima data form, panggil API backend, redirect
 * 
 * BACKEND API ENDPOINTS (via Gateway):
 *   Auth Service   : /api/auth/register, /api/auth/login, /api/auth/profile
 *   Product Service: /api/products
 *   Order Service  : /api/orders
 *   Payment Service: /api/payments/upload
 *   Gallery Service: /api/gallery
 *   Recommendation : /api/recommendations
 */

const axios = require('axios');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const router = express.Router();

// ============================================
// KONFIGURASI
// ============================================

// URL API Gateway (di K8s: http://api-gateway, di local: http://localhost)
const API_GATEWAY = process.env.API_GATEWAY_URL || 'http://api-gateway';

// Konfigurasi multer untuk upload file bukti pembayaran
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// ============================================
// HELPER: Decode JWT tanpa library (ambil payload)
// ============================================
function decodeJwtPayload(token) {
    try {
        const base64Payload = token.split('.')[1];
        const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch (e) {
        return null;
    }
}

// ============================================
// HELPER: Cek apakah user sudah login
// ============================================
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Silakan login terlebih dahulu');
    return res.redirect('/login');
}

// ============================================
// HALAMAN UTAMA
// ============================================

// GET / - Halaman beranda (statis, tidak perlu data backend)
router.get('/', (req, res) => {
    res.render('home');
});

// ============================================
// AUTHENTICATION
// ============================================

// GET /login - Tampilkan halaman login
router.get('/login', (req, res) => {
    // Jika sudah login, langsung redirect ke home
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login');
});

// POST /login - Proses login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Panggil auth-service untuk login
        const response = await axios.post(`${API_GATEWAY}/api/auth/login`, {
            email,
            password
        });

        const { token } = response.data;

        // Decode JWT untuk mendapatkan data user
        const decoded = decodeJwtPayload(token);
        if (!decoded) {
            req.flash('error_msg', 'Gagal memproses token autentikasi');
            return res.redirect('/login');
        }

        // Simpan data user ke session
        req.session.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            token: token
        };

        req.flash('success_msg', 'Login berhasil! Selamat datang.');
        return res.redirect('/');
    } catch (error) {
        let errorMessage = 'Terjadi kesalahan saat login';

        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 404) {
                errorMessage = data.message || 'Email tidak ditemukan';
            } else if (status === 401) {
                errorMessage = data.message || 'Password salah';
            } else {
                errorMessage = data.message || errorMessage;
            }
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Service autentikasi tidak tersedia. Pastikan semua service sudah jalan.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Koneksi ke server timeout. Coba lagi.';
        }

        req.flash('error_msg', errorMessage);
        return res.redirect('/login');
    }
});

// GET /register - Tampilkan halaman registrasi
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register');
});

// POST /register - Proses registrasi user baru
router.post('/register', async (req, res) => {
    const { nama, email, password, nomor_telepon, alamat } = req.body;

    // Validasi: password minimal 6 karakter
    if (!password || password.length < 6) {
        req.flash('error_msg', 'Password minimal 6 karakter');
        return res.redirect('/register');
    }

    try {
        // Panggil auth-service untuk registrasi
        await axios.post(`${API_GATEWAY}/api/auth/register`, {
            nama,
            email,
            password,
            nomor_telepon,
            alamat,
            role: 'user'
        });

        req.flash('success_msg', 'Registrasi berhasil! Silakan login.');
        return res.redirect('/login');
    } catch (error) {
        let errorMessage = 'Terjadi kesalahan saat registrasi';

        if (error.response) {
            errorMessage = error.response.data.message || errorMessage;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Service autentikasi tidak tersedia. Pastikan semua service sudah jalan.';
        }

        req.flash('error_msg', errorMessage);
        return res.redirect('/register');
    }
});

// GET /logout - Hapus session user
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Gagal menghapus session:', err.message);
        }
        return res.redirect('/');
    });
});

// ============================================
// PRODUK
// ============================================

// GET /products - Tampilkan daftar produk dari product-service
router.get('/products', async (req, res) => {
    try {
        const response = await axios.get(`${API_GATEWAY}/api/products`);
        return res.render('products', { products: response.data });
    } catch (error) {
        console.error('[Products] Gagal fetch data:', error.message);
        // Fallback: render dengan array kosong (template punya konten hardcoded)
        return res.render('products', { products: [] });
    }
});

// ============================================
// PESANAN (ORDER)
// ============================================

// GET /order - Tampilkan halaman order
router.get('/order', (req, res) => {
    res.render('order');
});

// POST /order - Buat pesanan baru via order-service
router.post('/order', async (req, res) => {
    // Ambil user_id dari session (wajib login untuk order)
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) {
        req.flash('error_msg', 'Silakan login terlebih dahulu untuk membuat pesanan');
        return res.redirect('/login');
    }

    const {
        jenis_desain,
        konsep,
        warna,
        ukuran,
        referensi,
        catatan,
        estimasi_pengerjaan
    } = req.body;

    try {
        const response = await axios.post(`${API_GATEWAY}/api/orders`, {
            user_id: userId,
            jenis_desain,
            konsep,
            warna,
            ukuran,
            referensi,
            catatan,
            estimasi_pengerjaan
        });

        const { order_id } = response.data;

        req.flash('success_msg', 'Pesanan berhasil dibuat! Silakan lakukan pembayaran.');
        return res.redirect(`/payment?order_id=${order_id}`);
    } catch (error) {
        let errorMessage = 'Gagal membuat pesanan';

        if (error.response) {
            errorMessage = error.response.data.message || errorMessage;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Service pesanan tidak tersedia. Pastikan semua service sudah jalan.';
        }

        req.flash('error_msg', errorMessage);
        return res.redirect('/order');
    }
});

// ============================================
// PEMBAYARAN
// ============================================

// GET /payment - Tampilkan halaman pembayaran dengan detail order
router.get('/payment', async (req, res) => {
    const { order_id } = req.query;

    if (!order_id) {
        req.flash('error_msg', 'ID pesanan tidak ditemukan');
        return res.redirect('/order');
    }

    try {
        // Ambil detail pesanan dari order-service
        const orderResponse = await axios.get(`${API_GATEWAY}/api/orders/${order_id}`);
        const order = orderResponse.data;

        return res.render('payment', { order, order_id });
    } catch (error) {
        console.error('[Payment] Gagal fetch order:', error.message);
        // Jika order-service error, render dengan data minimal
        return res.render('payment', { order: null, order_id });
    }
});

// POST /payment - Upload bukti pembayaran
router.post('/payment', upload.single('bukti_pembayaran'), async (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) {
        req.flash('error_msg', 'Silakan login terlebih dahulu');
        return res.redirect('/login');
    }

    const { order_id, metode_pembayaran, jumlah } = req.body;

    // Validasi: file bukti pembayaran wajib
    if (!req.file) {
        req.flash('error_msg', 'Bukti pembayaran wajib diunggah');
        return res.redirect(`/payment?order_id=${order_id}`);
    }

    try {
        // Baca file yang diupload dan kirim ke payment-service via FormData
        const formData = new FormData();

        // Lampirkan file bukti pembayaran
        formData.append('bukti_pembayaran', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Data pendukung
        formData.append('order_id', order_id);
        formData.append('user_id', String(userId));
        formData.append('metode_pembayaran', metode_pembayaran || '');
        formData.append('jumlah', jumlah || '');

        // Kirim ke payment-service via API Gateway
        await axios.post(`${API_GATEWAY}/api/payments/upload`, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Hapus file temporary setelah terkirim
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('[Payment] Gagal hapus temp file:', err.message);
        });

        req.flash('success_msg', 'Bukti pembayaran berhasil diupload! Tim kami akan memverifikasinya.');
        return res.redirect('/');
    } catch (error) {
        let errorMessage = 'Gagal upload bukti pembayaran';

        if (error.response) {
            errorMessage = error.response.data.message || errorMessage;
        }

        req.flash('error_msg', errorMessage);
        return res.redirect(`/payment?order_id=${order_id}`);
    }
});

// ============================================
// GALERI (PORTFOLIO)
// ============================================

// GET /gallery - Tampilkan galeri portofolio dari gallery-service
router.get('/gallery', async (req, res) => {
    try {
        const response = await axios.get(`${API_GATEWAY}/api/gallery`);
        return res.render('gallery', { galleryItems: response.data });
    } catch (error) {
        console.error('[Gallery] Gagal fetch data:', error.message);
        return res.render('gallery', { galleryItems: [] });
    }
});

// ============================================
// REKOMENDASI
// ============================================

// GET /recommendation - Tampilkan halaman rekomendasi paket
router.get('/recommendation', async (req, res) => {
    try {
        // Coba ambil rekomendasi dari recommendation-service
        const response = await axios.get(`${API_GATEWAY}/api/recommendations`);
        return res.render('recommendation', { recommendations: response.data });
    } catch (error) {
        console.error('[Recommendation] Gagal fetch data:', error.message);
        return res.render('recommendation', { recommendations: [] });
    }
});

module.exports = router;

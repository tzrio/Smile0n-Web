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

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const { API_GATEWAY, apiClient } = require('../config/api');

const router = express.Router();

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

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error_msg', 'You do not have admin privileges');
    return res.redirect('/');
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
        const response = await apiClient.post('/api/auth/login', {
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
        await apiClient.post('/api/auth/register', {
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
        const response = await apiClient.get('/api/products');
        return res.render('products', { products: response.data });
    } catch (error) {
        console.error('[Products] Gagal fetch data:', error.message);
        // Fallback: render dengan array kosong (template punya konten hardcoded)
        return res.render('products', { products: [] });
    }
});

// GET /products/:id - Detail produk
router.get('/products/:id', async (req, res) => {
    try {
        const response = await apiClient.get(`/api/products/${req.params.id}`);
        return res.render('product-detail', { product: response.data });
    } catch (error) {
        console.error('[Product Detail] Gagal fetch produk:', error.message);
        req.flash('error_msg', 'Gagal memuat detail produk. Produk mungkin tidak tersedia.');
        return res.redirect('/products');
    }
});

// ============================================
// PESANAN (ORDER)
// ============================================

// GET /orders - Riwayat pesanan user yang login
router.get('/orders', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const response = await apiClient.get(`/api/orders/user/${userId}`);
        return res.render('orders', { orders: response.data.orders || response.data || [] });
    } catch (error) {
        console.error('[Orders] Gagal fetch riwayat:', error.message);
        req.flash('error_msg', 'Gagal memuat riwayat pesanan. Service tidak tersedia.');
        return res.render('orders', { orders: [] });
    }
});

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
        const response = await apiClient.post('/api/orders', {
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
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
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
        const orderResponse = await apiClient.get(`/api/orders/${order_id}`);
        const order = orderResponse.data;

        return res.render('payment', { order, order_id });
    } catch (error) {
        console.error('[Payment] Gagal fetch order:', error.message);
        // Jika order-service error, render dengan data minimal
        return res.render('payment', { order: null, order_id });
    }
});

// GET /payments - Track payment status
router.get('/payments', async (req, res) => {
    const { order_id } = req.query;

    if (!order_id) {
        return res.render('payments', { payment: null, order_id: null });
    }

    try {
        const response = await apiClient.get(`/api/payments/order/${order_id}`);
        return res.render('payments', { payment: response.data, order_id });
    } catch (error) {
        console.error('[Payments] Gagal fetch payment:', error.message);
        return res.render('payments', { payment: null, order_id });
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
        await apiClient.post('/api/payments/upload', formData, {
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
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            errorMessage = 'Service pembayaran tidak tersedia. Pastikan semua service sudah jalan.';
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
        const response = await apiClient.get('/api/gallery');
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
        const response = await apiClient.get('/api/recommendations');
        return res.render('recommendation', { recommendations: response.data });
    } catch (error) {
        console.error('[Recommendation] Gagal fetch data:', error.message);
        return res.render('recommendation', { recommendations: [] });
    }
});

// ============================================
// ADMIN
// ============================================

// GET /admin/orders - Admin dashboard: lihat semua pesanan
router.get('/admin/orders', isAdmin, async (req, res) => {
    try {
        const response = await apiClient.get('/api/orders');
        let orders = response.data || [];
        // Normalize if backend returns an object with orders array
        if (orders.orders) orders = orders.orders;

        // Fetch payments summary for each order for quick verification cues
        let paymentsMap = {};
        try {
            const paymentsRes = await apiClient.get('/api/payments');
            let payments = paymentsRes.data || [];
            if (payments.payments) payments = payments.payments;
            payments.forEach(p => { paymentsMap[p.order_id] = p; });
        } catch (e) {
            // gracefully ignore payment fetch errors
        }

        return res.render('admin-orders', { orders, paymentsMap });
    } catch (error) {
        console.error('[Admin Orders] Error:', error.message);
        req.flash('error_msg', 'Failed to load orders dashboard');
        return res.redirect('/');
    }
});

// POST /admin/orders/:id/status - Admin update order status
router.post('/admin/orders/:id/status', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await apiClient.put(`/api/orders/${id}/status`, { status });
        req.flash('success_msg', `Order #${id} status updated to ${status}`);
    } catch (error) {
        console.error(`[Admin Order Status] Error updating order ${req.params.id}:`, error.message);
        req.flash('error_msg', `Failed to update order #${req.params.id} status`);
    }
    return res.redirect('/admin/orders');
});

// POST /admin/payments/:id/verify - Admin verify payment
router.post('/admin/payments/:id/verify', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await apiClient.put(`/api/payments/${id}/verify`);
        req.flash('success_msg', `Payment #${id} has been verified successfully`);
    } catch (error) {
        console.error(`[Admin Payment Verify] Error verifying payment ${req.params.id}:`, error.message);
        req.flash('error_msg', `Failed to verify payment #${req.params.id}`);
    }
    return res.redirect('/admin/orders');
});

module.exports = router;

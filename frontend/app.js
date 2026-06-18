/**
 * SmileOn Lab - Frontend Service
 * Owner: Bagus
 * 
 * Entry point untuk frontend Express + EJS.
 * Meng-handle session, flash messages, dan routing ke seluruh halaman.
 * 
 * Alur komunikasi:
 *   Browser -> Frontend (port 3000) -> API Gateway (api-gateway:80) -> Backend Service
 * 
 * Semua panggilan API ke backend melalui Nginx API Gateway.
 * URL gateway dikonfigurasi lewat env var API_GATEWAY_URL (default: http://api-gateway).
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

// Middleware untuk parsing body request (JSON & URL-encoded)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware untuk menyajikan file statis (CSS, JS, gambar)
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi session - menyimpan data login user
app.use(session({
    secret: process.env.SESSION_SECRET || 'smileon-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // Session berlaku 1 jam
}));

// Middleware flash messages - untuk notifikasi sukses/error
app.use(flash());

// Middleware global - menyediakan data user & flash messages ke semua template
app.use((req, res, next) => {
    // Data user dari session (tersedia di semua halaman sebagai `user`)
    res.locals.user = req.session.user || null;
    // Flash messages untuk notifikasi
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Konfigurasi view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount semua route dari routes/index.js
app.use('/', require('./routes/index'));

// Port server (bisa dikonfigurasi via env, default 3000)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Frontend] Server berjalan di http://localhost:${PORT}`);
    console.log(`[Frontend] API Gateway: ${process.env.API_GATEWAY_URL || 'http://api-gateway'}`);
});

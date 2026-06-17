# requirements.md — SmileOn Lab Requirements

## Functional Requirements

### FR-01: User Authentication (auth-service — Rakha)
- Pengguna dapat mendaftar (register) dengan nama, email, password
- Pengguna dapat login menggunakan email dan password
- Sistem mendukung dua role: `admin` dan `user`
- Admin memiliki akses ke fitur manajemen (verifikasi, CRUD)

### FR-02: Product Management (product-service — Rakha)
- Admin dapat menambah, mengubah, dan menghapus produk desain
- Pengguna dapat melihat daftar produk dan detail produk
- Setiap produk memiliki: nama, kategori, deskripsi, harga, gambar, estimasi pengerjaan

### FR-03: Order Management (order-service — Roihan)
- Pengguna dapat membuat pesanan desain custom
- Pengguna dapat melihat riwayat pesanan miliknya
- Admin dapat melihat semua pesanan
- Admin dapat mengubah status pesanan
- Status pesanan: `menunggu_pembayaran` → `menunggu_verifikasi` → `diproses` → `revisi` / `selesai` / `dibatalkan`
- Setiap pesanan memiliki: jenis desain, konsep, warna, ukuran, referensi, catatan, estimasi pengerjaan

### FR-04: Payment Management (payment-service — Roihan)
- Pengguna dapat mengunggah bukti pembayaran (gambar: JPEG, PNG, max 5MB)
- Admin dapat memverifikasi atau menolak pembayaran
- Upload bukti pembayaran otomatis mengubah status pesanan ke `menunggu_verifikasi`
- Verifikasi berhasil otomatis mengubah status pesanan ke `diproses`
- Komunikasi dengan order-service dilakukan via HTTP API

### FR-05: Recommendation System (recommendation-service — Roihan)
- Sistem dapat memberikan rekomendasi produk untuk setiap user
- Rekomendasi memiliki score (0-100) yang menunjukkan tingkat relevansi
- Admin dapat menambah dan menghapus rekomendasi
- Rekomendasi diurutkan berdasarkan score tertinggi

### FR-06: Portfolio Display (portfolio-service — Rakha)
- Pengguna dapat melihat portofolio karya desain SmileOn Lab
- Setiap portfolio memiliki: judul, kategori, deskripsi, gambar, tags

### FR-07: Frontend (frontend — Bagus)
- Menampilkan halaman utama SmileOn Lab
- Client-side routing untuk navigasi antar halaman
- Konsumsi API dari semua microservice melalui API Gateway
- UI untuk: autentikasi, browsing produk, manajemen pesanan, pembayaran, rekomendasi, portofolio

### FR-08: API Gateway (api-gateway — Bagus)
- Routing request dari client ke microservice yang sesuai berdasarkan URL path
- Semua API diakses melalui prefix `/api/`

---

## Non-Functional Requirements

### NFR-01: Database Per Service
- Setiap microservice memiliki database MySQL sendiri
- Tidak ada shared database antar service
- Komunikasi antar service menggunakan HTTP API (RESTful)

### NFR-02: Containerization
- Setiap service dikemas dalam Docker container
- Base image: `node:18-alpine` (untuk Node.js services)
- Base image: `nginx:alpine` (untuk API Gateway)

### NFR-03: Orchestration
- Deployment menggunakan Kubernetes
- Setiap service memiliki Deployment, Service, dan (untuk microservices) MySQL pod sendiri
- Persistent storage menggunakan PVC untuk data MySQL

### NFR-04: Testing
- Unit testing menggunakan Jest + Supertest
- Property-based testing menggunakan fast-check
- Database di-mock dalam testing (tidak memerlukan koneksi MySQL)

### NFR-05: File Upload
- Bukti pembayaran disimpan secara lokal di folder `uploads/`
- Format yang didukung: JPEG, JPG, PNG
- Maksimal ukuran file: 5MB
- Nama file dibuat unik menggunakan timestamp

### NFR-06: Security (Baseline)
- CORS diaktifkan di semua service
- Validasi input di setiap endpoint
- Password di-hash menggunakan bcrypt (auth-service)

---

## Frontend Responsibilities (Bagus)

Frontend BUKAN microservice. Tanggung jawab frontend:

| Area | Deskripsi |
|------|-----------|
| User Interface | Tampilan website yang responsif dan user-friendly |
| Client-side Routing | Navigasi antar halaman tanpa reload |
| API Consumption | Memanggil API melalui API Gateway |
| Authentication UI | Form login dan register |
| Product Browsing | Halaman daftar dan detail produk |
| Order Management UI | Form pembuatan pesanan dan riwayat pesanan |
| Payment UI | Form upload bukti pembayaran |
| Recommendation Display | Menampilkan rekomendasi produk |
| Portfolio Display | Menampilkan portofolio karya |

---

## API Gateway Responsibilities (Bagus)

API Gateway BUKAN microservice. Tanggung jawab API Gateway:

| Area | Deskripsi |
|------|-----------|
| Request Routing | Meneruskan request ke service backend berdasarkan URL path |
| Authentication Middleware | Validasi token/session sebelum meneruskan ke backend (opsional) |
| Service Aggregation | Menggabungkan response dari beberapa service jika diperlukan |
| API Entry Point | Satu titik masuk untuk semua API (`localhost:80`) |
| Rate Limiting | Membatasi jumlah request per client (opsional) |

### Routing Rules

| Path | Target |
|------|--------|
| `/` | frontend:3000 |
| `/api/auth/` | auth-service:3000 |
| `/api/products/` | product-service:3000 |
| `/api/orders/` | order-service:3001 |
| `/api/payments/` | payment-service:3002 |
| `/api/recommendations/` | recommendation-service:3003 |
| `/api/portfolio/` | portfolio-service:3004 |

---

## Microservice Responsibilities

Hanya 6 service yang dianggap **microservice**:

| Microservice | Owner | Database | Tanggung Jawab Utama |
|-------------|-------|----------|---------------------|
| auth-service | Rakha | auth_db | Autentikasi dan otorisasi |
| product-service | Rakha | product_db | Manajemen produk |
| portfolio-service | Rakha | portfolio_db | Portofolio karya |
| order-service | Roihan | order_db | Manajemen pesanan |
| payment-service | Roihan | payment_db | Manajemen pembayaran |
| recommendation-service | Roihan | recommendation_db | Rekomendasi produk |

---

## Database Ownership

| Database | Tabel | Pemilik |
|----------|-------|---------|
| auth_db | users | Rakha |
| product_db | products | Rakha |
| portfolio_db | portfolios | Rakha |
| order_db | orders | Roihan |
| payment_db | payments | Roihan |
| recommendation_db | recommendations | Roihan |

### Aturan Database:
- Setiap database HANYA diakses oleh service pemiliknya
- Tidak ada foreign key antar database
- Referensi ke data service lain menggunakan ID saja
- Validasi data lintas service dilakukan via HTTP API

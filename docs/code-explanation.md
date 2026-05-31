# Penjelasan Kode - SmileOn Lab Microservices

## Gambaran Umum Proyek

SmileOn Lab adalah platform jasa desain digital yang dibangun menggunakan arsitektur **microservices**. Setiap bagian sistem dipisahkan menjadi service independen yang berjalan di container Docker dan diorkestrasi menggunakan Kubernetes.

**Teknologi yang digunakan:**
- Backend: Node.js + Express.js
- Database: MySQL 8.0
- Container: Docker
- Orchestration: Kubernetes (Minikube untuk lokal)
- API Gateway: Nginx
- Testing: Postman

---

## Struktur Folder

```
Smile0n-Web/
│
├── frontend-service/     → Tampilan website (Anggota 1)
├── gateway-service/      → API Gateway Nginx (Anggota 1)
├── auth-service/         → Login & Register (Anggota 2)
├── product-service/      → Daftar & CRUD Produk (Anggota 2)
├── order-payment-service/ → Pesanan & Pembayaran (Anggota 3)
├── mysql-service/        → Script inisialisasi database (Anggota 3)
└── k8s/                  → Semua manifest Kubernetes
```

---

## Cara Kerja Setiap Service

### 1. Frontend Service
- **Fungsi:** Menyajikan halaman website kepada pengguna
- **Port:** 3000
- **Dikerjakan oleh:** Anggota 1

### 2. Gateway Service (Nginx)
- **Fungsi:** Menerima semua request dari user dan meneruskannya ke service yang tepat
- **Port:** 80
- **Routing:**
  - `/` → frontend-service
  - `/api/auth/` → auth-service
  - `/api/products/` → product-service
  - `/api/orders/` → order-payment-service
  - `/api/payments/` → order-payment-service
- **Dikerjakan oleh:** Anggota 1

### 3. Auth Service
- **Fungsi:** Menangani register, login, dan manajemen role
- **Port:** 3000
- **Dikerjakan oleh:** Anggota 2

### 4. Product Service
- **Fungsi:** Menangani daftar produk, detail produk, CRUD produk
- **Port:** 3000
- **Dikerjakan oleh:** Anggota 2

### 5. Order-Payment Service
- **Fungsi:** Menangani pesanan desain dan pembayaran
- **Port:** 3000
- **Dikerjakan oleh:** Anggota 3
- **Detail lengkap:** Lihat bagian "Order-Payment Service" di bawah

### 6. MySQL Service
- **Fungsi:** Database utama untuk semua service
- **Port:** 3306
- **File penting:** `mysql-service/init.sql` (script pembuatan tabel)

---

## Bagaimana Service Saling Terhubung

```
User/Browser
     │
     ▼
Gateway (Nginx:80)
     │
     ├── /           → Frontend Service (:3000)
     ├── /api/auth/  → Auth Service (:3000)
     ├── /api/products/ → Product Service (:3000)
     └── /api/orders/ & /api/payments/ → Order-Payment Service (:3000)
                                              │
                                              ▼
                                        MySQL (:3306)
```

Semua backend service (auth, product, order-payment) terhubung ke MySQL menggunakan environment variable `DB_HOST=mysql-service`.

---

## Order-Payment Service (Detail)

### Struktur Internal

```
order-payment-service/
├── app.js              → Entry point, setup Express & middleware
├── config/db.js        → Koneksi ke MySQL (connection pool)
├── routes/
│   ├── orderRoutes.js  → Definisi URL endpoint pesanan
│   └── paymentRoutes.js → Definisi URL endpoint pembayaran
├── controllers/
│   ├── orderController.js  → Logika bisnis pesanan
│   └── paymentController.js → Logika bisnis pembayaran
├── middleware/
│   └── upload.js       → Konfigurasi Multer (upload file)
├── uploads/            → Folder penyimpanan bukti pembayaran
├── tests/              → Unit test dan property test
├── .env.example        → Contoh environment variable
├── Dockerfile          → Instruksi build Docker image
└── package.json        → Dependencies dan scripts
```

### Cara Pesanan Dibuat

1. User mengirim POST request ke `/orders` dengan data desain
2. Controller memvalidasi field wajib (`jenis_desain`)
3. Controller mengecek apakah `user_id` valid
4. Data pesanan disimpan ke tabel `orders` dengan status `menunggu_pembayaran`
5. Response dikembalikan dengan `order_id`

### Cara Bukti Pembayaran Disimpan

1. User mengirim POST request ke `/payments/upload` (multipart/form-data)
2. Middleware Multer menerima file gambar (JPEG/PNG, maks 5MB)
3. File disimpan di folder `uploads/` dengan nama unik (timestamp + nama asli)
4. Data pembayaran disimpan ke tabel `payments`
5. Status pesanan diubah menjadi `menunggu_verifikasi`

### Cara Verifikasi Pembayaran

1. Admin mengirim PUT request ke `/payments/:id/verify`
2. Controller memvalidasi status (hanya `terverifikasi` atau `ditolak`)
3. Jika `terverifikasi`:
   - Status pembayaran diubah, `verified_at` dicatat
   - Status pesanan diubah menjadi `diproses`
4. Jika `ditolak`:
   - Hanya status pembayaran yang diubah

### Cara Status Pesanan Diubah

1. Admin mengirim PUT request ke `/orders/:id/status`
2. Controller memvalidasi status terhadap daftar yang diizinkan
3. Status pesanan di-update di database

### Koneksi ke MySQL

- File `config/db.js` membuat connection pool menggunakan `mysql2/promise`
- Koneksi menggunakan environment variable (DB_HOST, DB_PORT, dll)
- Di Kubernetes, `DB_HOST` diisi `mysql-service` (nama Kubernetes Service)
- Jika koneksi gagal, service akan berhenti (exit code 1)

### Tabel Database yang Digunakan

| Tabel | Fungsi |
|-------|--------|
| `users` | Data pengguna (untuk validasi user_id) |
| `products` | Data produk (untuk relasi product_id) |
| `orders` | Data pesanan desain custom |
| `payments` | Data pembayaran dan bukti transfer |

---

## Alur API Utama

### Endpoint Pesanan (Order)

| Method | URL | Fungsi |
|--------|-----|--------|
| POST | `/orders` | Membuat pesanan baru |
| GET | `/orders/user/:userId` | Riwayat pesanan user |
| GET | `/orders` | Admin: semua pesanan |
| GET | `/orders/:id` | Detail satu pesanan |
| PUT | `/orders/:id/status` | Admin: ubah status |

### Endpoint Pembayaran (Payment)

| Method | URL | Fungsi |
|--------|-----|--------|
| POST | `/payments/upload` | Upload bukti pembayaran |
| PUT | `/payments/:id/verify` | Admin: verifikasi |
| GET | `/payments/order/:orderId` | Pembayaran per pesanan |
| GET | `/payments` | Admin: semua pembayaran |

---

## Alur Database

```
init.sql dijalankan saat MySQL pertama kali start
     │
     ▼
Membuat database: smileon_db
     │
     ▼
Membuat tabel: users → products → orders → payments
     │
     ▼
Memasukkan data dummy untuk testing
```

---

## Alur Docker

```
1. Build image untuk setiap service:
   docker build -t smileon-order-payment-service ./order-payment-service

2. Run container (untuk testing lokal):
   docker run -p 3003:3000 --env-file .env smileon-order-payment-service

3. Container berjalan → Express server start di port 3000
```

---

## Alur Kubernetes

```
1. Apply semua manifest:
   kubectl apply -f k8s/

2. Kubernetes membuat:
   - Pod MySQL + PVC + ConfigMap (init.sql)
   - Pod order-payment-service
   - Pod auth-service, product-service, frontend-service
   - Pod gateway-service (Nginx)
   - Service untuk setiap pod (agar bisa saling akses)

3. Cek status:
   kubectl get pods
   kubectl get services
   kubectl get deployments
```

---

## Alur Pengguna (User Flow)

### Alur Lengkap:

1. **User membuka website** → Request masuk ke Gateway → diteruskan ke Frontend
2. **User register/login** → Frontend kirim request ke `/api/auth/` → Auth Service
3. **User melihat produk** → Frontend kirim request ke `/api/products/` → Product Service
4. **User membuat pesanan** → Frontend kirim POST ke `/api/orders/` → Order-Payment Service
   - Status awal: `menunggu_pembayaran`
5. **User upload bukti pembayaran** → POST ke `/api/payments/upload` dengan file gambar
   - Status berubah: `menunggu_verifikasi`
6. **Admin verifikasi pembayaran** → PUT ke `/api/payments/:id/verify`
   - Jika valid: status pesanan berubah ke `diproses`
7. **Admin update status pesanan** → PUT ke `/api/orders/:id/status`
   - Bisa diubah ke: `revisi`, `selesai`, atau `dibatalkan`
8. **User melihat status terbaru** → GET ke `/api/orders/user/:userId`

### Diagram Status Pesanan:

```
[Pesanan Dibuat]
      │
      ▼
menunggu_pembayaran
      │ (user upload bukti)
      ▼
menunggu_verifikasi
      │ (admin verifikasi)
      ▼
   diproses ──────→ revisi ──→ diproses (kembali)
      │
      ▼
   selesai

* Dari status manapun bisa ke: dibatalkan
```

---

## Cara Testing

### Testing Lokal (Tanpa Docker/Kubernetes)

```bash
cd order-payment-service
npm install
node app.js
```

Lalu test dengan Postman di `http://localhost:3000`

### Testing dengan Docker

```bash
docker build -t smileon-order-payment-service ./order-payment-service
docker run -p 3003:3000 --env-file ./order-payment-service/.env smileon-order-payment-service
```

### Testing dengan Kubernetes

```bash
kubectl apply -f k8s/
kubectl get pods          # Pastikan semua Running
kubectl get services      # Lihat NodePort untuk akses
minikube service order-payment-service  # Buka di browser
```

### Testing Unit (Jest)

```bash
cd order-payment-service
npm test
```

---

## Error Umum dan Cara Debug

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Database connection failed` | MySQL belum jalan atau env salah | Cek DB_HOST, pastikan MySQL pod Running |
| `Field jenis_desain wajib diisi` | Request body tidak lengkap | Tambahkan field `jenis_desain` di body |
| `User tidak ditemukan` | user_id tidak ada di tabel users | Pastikan user sudah terdaftar |
| `Format file tidak didukung` | File bukan JPEG/PNG | Upload file gambar yang benar |
| `Pesanan tidak ditemukan` | order_id salah | Cek ID pesanan yang benar |
| Pod CrashLoopBackOff | Service gagal start | `kubectl logs <pod-name>` untuk lihat error |
| ImagePullBackOff | Docker image belum di-build | Build image dulu dengan `docker build` |

---

## Yang Harus Dibaca Pertama

Jika kamu baru memulai, baca file-file ini secara berurutan:

1. **`projects.md`** → Memahami batasan tugas dan scope
2. **`docs/code-explanation.md`** → File ini (gambaran besar)
3. **`mysql-service/init.sql`** → Memahami struktur database
4. **`order-payment-service/app.js`** → Entry point service utama
5. **`order-payment-service/routes/orderRoutes.js`** → Endpoint apa saja yang ada
6. **`order-payment-service/controllers/orderController.js`** → Logika bisnis pesanan
7. **`order-payment-service/controllers/paymentController.js`** → Logika bisnis pembayaran
8. **`k8s/order-payment-deployment.yaml`** → Cara deploy ke Kubernetes

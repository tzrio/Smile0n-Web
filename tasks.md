# tasks.md — SmileOn Lab Task Breakdown

## Bagus

### Scope
- Frontend (UI Website)
- API Gateway (Nginx)

### Deliverables

| Task | Status | Deskripsi |
|------|--------|-----------|
| Frontend UI | 🔧 In Progress | Membangun halaman website SmileOn Lab |
| Client-side Routing | 🔧 In Progress | Navigasi antar halaman |
| API Consumption | 🔧 In Progress | Integrasi dengan semua microservice via API Gateway |
| Authentication UI | 🔧 In Progress | Form login dan register |
| Product Browsing UI | 🔧 In Progress | Halaman daftar dan detail produk |
| Order Management UI | 🔧 In Progress | Form pesanan dan riwayat pesanan |
| Payment UI | 🔧 In Progress | Form upload bukti pembayaran |
| Recommendation Display | 🔧 In Progress | Menampilkan rekomendasi produk |
| Gallery Display | 🔧 In Progress | Menampilkan galeri karya |
| API Gateway Config | ✅ Done | Konfigurasi Nginx routing ke semua service |

### Integration Dependencies
- Semua microservice harus sudah memiliki API endpoint yang aktif
- API Gateway harus routing ke semua service dengan benar

### Kubernetes Responsibilities
- `kubernetes/frontend/` — Deployment dan Service untuk frontend
- `kubernetes/gateway/` — Deployment dan Service untuk API Gateway

### Database Responsibilities
- Tidak ada (frontend dan API Gateway tidak memiliki database)

---

## Rakha

### Scope
- Auth Service
- Product Service
- Gallery Service

### Deliverables

| Task | Status | Deskripsi |
|------|--------|-----------|
| Auth: Register endpoint | 🔧 In Progress | POST /auth/register |
| Auth: Login endpoint | 🔧 In Progress | POST /auth/login |
| Auth: Role management | 🔧 In Progress | Admin vs User role |
| Auth: Password hashing | 🔧 In Progress | bcrypt integration |
| Product: CRUD endpoints | 🔧 In Progress | GET/POST/PUT/DELETE /products |
| Product: Product listing | 🔧 In Progress | GET /products dengan filter |
| Product: Product detail | 🔧 In Progress | GET /products/:id |
| Gallery: CRUD endpoints | 🔧 In Progress | GET/POST/PUT/DELETE /gallery |
| Gallery: Gallery listing | 🔧 In Progress | GET /gallery |
| Auth: Unit tests | 🔧 In Progress | Jest + Supertest |
| Product: Unit tests | 🔧 In Progress | Jest + Supertest |
| Gallery: Unit tests | 🔧 In Progress | Jest + Supertest |

### Integration Dependencies
- auth-service harus siap agar service lain bisa validasi user
- product-service harus siap agar order-service dan recommendation-service bisa referensi produk

### Kubernetes Responsibilities
- `kubernetes/auth/` — Deployment, Service, MySQL, PVC, ConfigMap untuk auth-service
- `kubernetes/product/` — Deployment, Service, MySQL, PVC, ConfigMap untuk product-service
- `kubernetes/gallery/` — Deployment, Service, MySQL, PVC, ConfigMap untuk gallery-service

### Database Responsibilities
- `databases/auth_db.sql` — Schema tabel `users`
- `databases/product_db.sql` — Schema tabel `products`
- `databases/gallery_db.sql` — Schema tabel `portfolios`

---

## Roihan

### Scope
- Order Service
- Payment Service
- Recommendation Service

### Deliverables

| Task | Status | Deskripsi |
|------|--------|-----------|
| Order: Create order | ✅ Done | POST /orders |
| Order: Get orders by user | ✅ Done | GET /orders/user/:userId |
| Order: Get all orders (admin) | ✅ Done | GET /orders |
| Order: Get order by ID | ✅ Done | GET /orders/:id |
| Order: Update status | ✅ Done | PUT /orders/:id/status |
| Order: Unit tests | ✅ Done | 8 tests (Jest + Supertest) |
| Order: Property tests | ✅ Done | 5 properties (fast-check) |
| Order: Dockerfile | ✅ Done | node:18-alpine, port 3001 |
| Order: K8s manifests | ✅ Done | Deployment, Service, MySQL, PVC |
| Payment: Upload proof | ✅ Done | POST /payments/upload (multipart) |
| Payment: Verify payment | ✅ Done | PUT /payments/:id/verify |
| Payment: Get by order | ✅ Done | GET /payments/order/:orderId |
| Payment: Get all (admin) | ✅ Done | GET /payments |
| Payment: Multer middleware | ✅ Done | File filter, 5MB limit |
| Payment: Unit tests | ✅ Done | 9 tests (Jest + Supertest) |
| Payment: Property tests | ✅ Done | 2 properties (fast-check) |
| Payment: Integration tests | ✅ Done | 4 lifecycle tests |
| Payment: HTTP inter-service | ✅ Done | Axios calls to order-service |
| Payment: Dockerfile | ✅ Done | node:18-alpine, port 3002, uploads dir |
| Payment: K8s manifests | ✅ Done | Deployment, Service, MySQL, PVC |
| Recommendation: CRUD | ✅ Done | GET/POST/DELETE /recommendations |
| Recommendation: User recs | ✅ Done | GET /recommendations/user/:userId |
| Recommendation: Score validation | ✅ Done | 0-100 range, default 50 |
| Recommendation: Unit tests | ✅ Done | 9 tests (Jest + Supertest) |
| Recommendation: Property tests | ✅ Done | 6 properties (fast-check) |
| Recommendation: Dockerfile | ✅ Done | node:18-alpine, port 3003 |
| Recommendation: K8s manifests | ✅ Done | Deployment, Service, MySQL, PVC |
| Database-per-service compliance | ✅ Done | No shadow tables, HTTP inter-service |
| Documentation | ✅ Done | project.md, requirements.md, design.md, tasks.md |

### Integration Dependencies
- payment-service → order-service (HTTP API untuk verifikasi pesanan dan update status)
- recommendation-service → product_id reference (dari product-service)
- order-service → user_id reference (dari auth-service, validasi di API Gateway)

### Kubernetes Responsibilities
- `kubernetes/order/` — Deployment, Service, MySQL (mysql-order), PVC, ConfigMap
- `kubernetes/payment/` — Deployment, Service, MySQL (mysql-payment), PVC, ConfigMap
- `kubernetes/recommendation/` — Deployment, Service, MySQL (mysql-recommendation), PVC, ConfigMap

### Database Responsibilities
- `databases/order_db.sql` — Schema tabel `orders` (HANYA orders, tanpa shadow users)
- `databases/payment_db.sql` — Schema tabel `payments` (HANYA payments, tanpa shadow orders)
- `databases/recommendation_db.sql` — Schema tabel `recommendations`

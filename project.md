# project.md — SmileOn Lab Microservices Platform

## Gambaran Proyek

**SmileOn Lab** adalah platform digital untuk jasa desain custom (Logo, Banner, Kemasan, dll).
Sistem dibangun menggunakan arsitektur **microservices** dengan Docker dan Kubernetes.

---

## Arsitektur

SmileOn Lab menggunakan arsitektur microservices dengan prinsip berikut:

1. **Database Per Service** — Setiap microservice memiliki database MySQL-nya sendiri. Tidak ada shared database antar service.
2. **Inter-Service Communication** — Komunikasi antar service dilakukan via HTTP API (RESTful), bukan via query database langsung.
3. **API Gateway** — Semua request dari client diterima oleh API Gateway (Nginx) yang meneruskan ke service backend yang sesuai.
4. **Frontend Terpisah** — Frontend adalah aplikasi terpisah yang mengkonsumsi API, bukan microservice.

### Komponen Non-Microservice

| Komponen | Peran |
|----------|-------|
| **frontend/** | User interface, client-side routing, API consumption |
| **api-gateway/** | Request routing via Nginx, authentication middleware, service aggregation |

### Microservices

| Service | Database | Port | Deskripsi |
|---------|----------|------|-----------|
| auth-service | auth_db | 3000 | Login, register, manajemen role user/admin |
| product-service | product_db | 3001 | Daftar produk, detail produk, CRUD produk |
| order-service | order_db | 3003 | Pembuatan pesanan, riwayat pesanan, update status |
| payment-service | payment_db | 3004 | Upload bukti pembayaran, verifikasi pembayaran |
| recommendation-service | recommendation_db | 3005 | Rekomendasi produk berdasarkan preferensi user |
| gallery-service | gallery_db | 3002 | Data galeri karya desain SmileOn Lab |

---

## Tim dan Kepemilikan

| Anggota | Service | Kubernetes | Database |
|---------|---------|------------|----------|
| **Bagus** | `frontend/`, `api-gateway/` | `kubernetes/frontend/`, `kubernetes/gateway/` | — |
| **Rakha** | `auth-service/`, `product-service/`, `gallery-service/` | `kubernetes/auth/`, `kubernetes/product/`, `kubernetes/gallery/` | `auth_db`, `product_db`, `gallery_db` |
| **Roihan** | `order-service/`, `payment-service/`, `recommendation-service/` | `kubernetes/order/`, `kubernetes/payment/`, `kubernetes/recommendation/` | `order_db`, `payment_db`, `recommendation_db` |

---

## Struktur Repository

```
Smile0n-Web/
│
├── frontend/                   ← UI website (Bagus)
├── api-gateway/                ← Nginx API Gateway (Bagus)
│
├── auth-service/               ← Login & Register (Rakha)
├── product-service/            ← Produk & CRUD (Rakha)
├── gallery-service/            ← Galeri karya (Rakha)
│
├── order-service/              ← Manajemen Pesanan (Roihan)
├── payment-service/            ← Pembayaran & Upload Bukti (Roihan)
├── recommendation-service/     ← Rekomendasi Produk (Roihan)
│
├── databases/
│   ├── auth_db.sql             ← Schema DB autentikasi (Rakha)
│   ├── product_db.sql          ← Schema DB produk (Rakha)
│   ├── gallery_db.sql          ← Schema DB galeri (Rakha)
│   ├── order_db.sql            ← Schema DB pesanan (Roihan)
│   ├── payment_db.sql          ← Schema DB pembayaran (Roihan)
│   └── recommendation_db.sql   ← Schema DB rekomendasi (Roihan)
│
└── kubernetes/
    ├── frontend/               ← K8s manifests frontend (Bagus)
    ├── gateway/                ← K8s manifests gateway (Bagus)
    ├── auth/                   ← K8s manifests auth (Rakha)
    ├── product/                ← K8s manifests product (Rakha)
    ├── gallery/                ← K8s manifests galeri (Rakha)
    ├── order/                  ← K8s manifests order (Roihan)
    ├── payment/                ← K8s manifests payment (Roihan)
    └── recommendation/         ← K8s manifests recommendation (Roihan)
```

---

## Database Per Service

Prinsip utama arsitektur microservices ini adalah **setiap service memiliki database-nya sendiri**.

| Service | Database | Pemilik |
|---------|----------|---------|
| auth-service | auth_db | Rakha |
| product-service | product_db | Rakha |
| gallery-service | gallery_db | Rakha |
| order-service | order_db | Roihan |
| payment-service | payment_db | Roihan |
| recommendation-service | recommendation_db | Roihan |

### Aturan:
- Tidak boleh ada shared database antar service
- Setiap service HANYA mengakses tabel di database-nya sendiri
- Referensi ke data service lain menggunakan ID saja (bukan FK langsung)
- Komunikasi antar service menggunakan HTTP API

---

## Service Boundaries

### auth-service (Rakha)
- **Memiliki**: Tabel `users` di `auth_db`
- **Tanggung jawab**: Register, login, manajemen role, validasi user

### product-service (Rakha)
- **Memiliki**: Tabel `products` di `product_db`
- **Tanggung jawab**: CRUD produk, daftar produk, detail produk

### gallery-service (Rakha)
- **Memiliki**: Tabel `portfolios` di `gallery_db`
- **Tanggung jawab**: Data galeri karya desain

### order-service (Roihan)
- **Memiliki**: Tabel `orders` di `order_db`
- **Tanggung jawab**: Pembuatan pesanan, riwayat pesanan, update status pesanan
- **Tergantung pada**: auth-service (validasi user via API Gateway)

### payment-service (Roihan)
- **Memiliki**: Tabel `payments` di `payment_db`
- **Tanggung jawab**: Upload bukti pembayaran, verifikasi pembayaran
- **Tergantung pada**: order-service (verifikasi pesanan dan update status via HTTP)

### recommendation-service (Roihan)
- **Memiliki**: Tabel `recommendations` di `recommendation_db`
- **Tanggung jawab**: Rekomendasi produk berdasarkan preferensi user

---

## Deployment

### Stack Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Node.js + Express (placeholder) |
| API Gateway | Nginx |
| Microservices | Node.js + Express |
| Database | MySQL 8.0 (satu instance per service) |
| File Upload | Multer (payment-service) |
| Container | Docker (node:18-alpine) |
| Orchestration | Kubernetes (Minikube untuk lokal) |
| Testing | Jest + Supertest + fast-check |

### Build Docker Images

```bash
# Semua service (contoh)
docker build -t smileon-order-service ./order-service
docker build -t smileon-payment-service ./payment-service
docker build -t smileon-recommendation-service ./recommendation-service
docker build -t smileon-auth-service ./auth-service
docker build -t smileon-product-service ./product-service
docker build -t smileon-gallery-service ./gallery-service
docker build -t smileon-frontend ./frontend
docker build -t smileon-api-gateway ./api-gateway
```

### Deploy ke Kubernetes

```bash
# Apply semua manifest
kubectl apply -f kubernetes/auth/
kubectl apply -f kubernetes/product/
kubectl apply -f kubernetes/gallery/
kubectl apply -f kubernetes/order/
kubectl apply -f kubernetes/payment/
kubectl apply -f kubernetes/recommendation/
kubectl apply -f kubernetes/frontend/
kubectl apply -f kubernetes/gateway/
```

### Port Service

| Service | Port |
|---------|------|
| api-gateway (Nginx) | 80 |
| frontend | 3000 |
| auth-service | 3000 |
| product-service | 3000 |
| order-service | 3001 |
| payment-service | 3002 |
| recommendation-service | 3003 |
| gallery-service | 3002 |

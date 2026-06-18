# Audit Konfigurasi Microservice — SmileOn Lab

## Ringkasan Status
✅ **SEMUA kritis sudah diperbaiki.** Konfigurasi microservice sekarang sinkron dan konsisten.

---

## ✅  Port Tetap (Dikonfirmasi & Sudah Diterapkan)

| Service | Port | Nginx Upstream | K8s Service | Dockerfile | .env | App Fallback |
|---------|------|----------------|-------------|------------|------|--------------|
| frontend | 3000 (ClusterIP) | — | 3000 | — | — | — |
| api-gateway | 80 | — | 80 | 80 | — | — |
| auth-service | 3000 | ✅ 3000 | ✅ 3000 | ✅ 3000 | ✅ 3000 | env PORT |
| product-service | 3001 | ✅ 3001 | ✅ 3001 | ✅ 3001 | ✅ 3001 | env PORT |
| gallery-service | 3002 | ✅ 3002 | ✅ 3002 | ✅ 3002 | ✅ 3002 | env PORT \|\| 3002 |
| order-service | 3003 | ✅ 3003 | ✅ 3003 | ✅ 3003 | ✅ 3003 | env PORT \|\| 3003 |
| payment-service | 3004 | ✅ 3004 | ✅ 3004 | ✅ 3004 | ✅ 3004 | env PORT \|\| 3004 |
| recommendation-service | 3005 | ✅ 3005 | ✅ 3005 | ✅ 3005 | ✅ 3005 | env PORT \|\| 3005 |

---

## ✅  Daftar Perubahan yang Sudah Dilakukan

### 1. Sinkronisasi Port
- **`api-gateway/nginx.conf`** — upstream port semua service sudah sync
- **`order-service/app.js`** — fallback `|| 3001` → `|| 3003`
- **`payment-service/app.js`** — fallback `|| 3002` → `|| 3004`
- **`recommendation-service/app.js`** — fallback `|| 3003` → `|| 3005`
- **`gallery-service/app.js`** — hardcoded `app.listen(3002)` → `app.listen(process.env.PORT \|\| 3002)`
- **`order-service/Dockerfile`** — comment port fix
- **`payment-service/Dockerfile`** — comment port fix
- **`recommendation-service/Dockerfile`** — comment port fix

### 2. Portfolio → Gallery Rename
- **`api-gateway/nginx.conf`** — upstream `portfolio` → `gallery`, location `/api/gallery/`, proxy_pass ke `gallery-service:3002`
- **`gallery-service/.env`** — `DB_NAME=portfolio_db` → `DB_NAME=gallery_db`
- **`databases/gallery_db.sql`** — `CREATE DATABASE portfolio_db` → `CREATE DATABASE gallery_db`
- **`payment-service/.env`** — `ORDER_SERVICE_URL` port 3001 → 3003
- **`payment-service/controllers/paymentController.js`** — hardcoded URL port 3001 → 3003
- **`frontend/routes/index.js`** — route `/portfolio` → `/gallery`, render `gallery`
- **`frontend/views/portfolio.ejs`** → rename ke **`gallery.ejs`**
- Semua `href="/portfolio"` di frontend views → `href="/gallery"`

### 3. Fix Nginx proxy_pass Routing
| Service | Sebelumnya | Sesudah |
|---------|-----------|---------|
| auth | `proxy_pass http://auth/;` | `proxy_pass http://auth/auth/;` |
| product | `proxy_pass http://product/;` | `proxy_pass http://product/products/;` |

> Perbaikan ini memastikan path mapping konsisten dengan order/payment/recommendation/gallery.

### 4. Update Dokumentasi
| File | Perubahan |
|------|-----------|
| `requirements.md` | Routing rules, microservice table, DB ownership — portfolio→gallery |
| `project.md` | Struktur repo, port table, team ownership — portfolio→gallery |
| `design.md` | Diagram port, routing flow, service table — portfolio→gallery |
| `tasks.md` | Task name, K8s path, DB path — portfolio→gallery |
| `README.md` | Port table, DB arch, API Gateway flow — portfolio→gallery |

---

## 📋  Temuan Non-Kritis yang Sengaja Tidak Diubah

| # | Temuan | Alasan Tidak Diubah |
|---|--------|---------------------|
| 1 | Tidak ada `docker-compose.yml` | User instruksikan "biarin aja" |
| 2 | Tidak ada `.dockerignore` | User instruksikan "biarin aja" |
| 3 | `product-service/.env` tidak ada di repo (hanya `.env.example`) | User konfirmasi sudah ada di lokal |
| 4 | CSS class name `.portfolio-*` dan JS variable `portfolioItems` di frontend | Hanya styling/functionality internal, bukan config |
| 5 | Tabel nama `portfolios` di `gallery_db` | User hanya minta rename DB name, bukan table name |
| 6 | Dokumen lama di `.kimchi/docs/microservice-config-audit.md` pertama | File audit historis |

---

## 💡  Rekomendasi Opsional (Jika Diperlukan Nanti)

| # | Rekomendasi |
|---|-------------|
| 1 | Buat `docker-compose.yml` supaya dev lokal lebih mudah (`docker compose up`) |
| 2 | Tambahkan `.dockerignore` di setiap service agar image lebih kecil |
| 3 | Pertimbangkan rename tabel `portfolios` → `galleries` di `databases/gallery_db.sql` |
| 4 | Update CSS class name dan JS variable di frontend kalau ingin DOM selector juga konsisten |
| 5 | Buat Kubernetes Ingress untuk production (saat ini semua pakai NodePort) |

# design.md — SmileOn Lab Technical Design

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER / BROWSER                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP Request
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Nginx:80)                        │
│                       Owner: Bagus                              │
│                                                                 │
│  /              → frontend:3000                                 │
│  /api/auth/     → auth-service:3000                             │
│  /api/products/ → product-service:3000                          │
│  /api/orders/   → order-service:3001                            │
│  /api/payments/ → payment-service:3002                          │
│  /api/recommendations/ → recommendation-service:3003            │
│  /api/portfolio/ → portfolio-service:3004                       │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬────────────────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Front-││Auth  ││Prod- ││Order ││Pay-  ││Reco- ││Port- │
│end   ││Svc   ││uct   ││Svc   ││ment  ││mmend ││folio │
│:3000 ││:3000 ││Svc   ││:3001 ││Svc   ││Svc   ││Svc   │
│      ││      ││:3000 ││      ││:3002 ││:3003 ││:3004 │
│Bagus ││Rakha ││Rakha ││Roihan││Roihan││Roihan││Rakha │
└──────┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──────┘└──┬───┘
           │       │       │       │                │
           ▼       ▼       ▼       ▼                ▼
        ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
        │auth  ││prod- ││order ││pay-  ││reco- ││port- │
        │_db   ││uct_db││_db   ││ment  ││mmend ││folio │
        │      ││      ││      ││_db   ││_db   ││_db   │
        │MySQL ││MySQL ││MySQL ││MySQL ││MySQL ││MySQL │
        └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

---

## Service Interaction Flow

### Alur Pemesanan & Pembayaran

```
User → Frontend → API Gateway → order-service
                                    │
                                    ▼
                              Buat pesanan
                              Status: "menunggu_pembayaran"
                                    │
                                    ▼
User → Frontend → API Gateway → payment-service
                                    │
                                    ├── Upload bukti pembayaran
                                    ├── Simpan ke payment_db (payments)
                                    └── HTTP PUT → order-service
                                          │
                                          ▼
                                    Update status: "menunggu_verifikasi"
                                          │
                                          ▼
Admin → Frontend → API Gateway → payment-service
                                    │
                                    ├── Verifikasi pembayaran
                                    ├── Update payment_db (verified_at)
                                    └── HTTP PUT → order-service
                                          │
                                          ▼
                                    Update status: "diproses"
```

### Inter-Service Communication

| Source | Target | Method | Endpoint | Deskripsi |
|--------|--------|--------|----------|-----------|
| payment-service | order-service | GET | `/orders/:id` | Verifikasi pesanan ada |
| payment-service | order-service | PUT | `/orders/:id/status` | Update status pesanan |

> **Catatan**: Semua komunikasi antar service menggunakan HTTP REST API.
> Tidak ada query database langsung ke service lain.

---

## Database Architecture

### Prinsip: Database Per Service

Setiap microservice memiliki instance MySQL sendiri di Kubernetes.
Tidak ada shared database.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  mysql-auth      │     │  mysql-product   │     │  mysql-portfolio │
│  ┌─────────────┐│     │  ┌─────────────┐│     │  ┌─────────────┐│
│  │  auth_db    ││     │  │ product_db   ││     │  │portfolio_db ││
│  │  - users    ││     │  │ - products   ││     │  │- portfolios ││
│  └─────────────┘│     │  └─────────────┘│     │  └─────────────┘│
│     Rakha        │     │     Rakha        │     │     Rakha        │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  mysql-order     │     │  mysql-payment   │     │ mysql-recommend  │
│  ┌─────────────┐│     │  ┌─────────────┐│     │  ┌─────────────┐│
│  │  order_db   ││     │  │ payment_db   ││     │  │recommend_db ││
│  │  - orders   ││     │  │ - payments   ││     │  │- recommends ││
│  └─────────────┘│     │  └─────────────┘│     │  └─────────────┘│
│     Roihan       │     │     Roihan       │     │     Roihan       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Schema Details

#### order_db (Roihan)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT PK AUTO_INCREMENT | ID pesanan |
| user_id | INT NOT NULL | Referensi ke auth-service |
| product_id | INT NULL | Referensi ke product-service |
| jenis_desain | VARCHAR(100) NOT NULL | Jenis desain yang dipesan |
| konsep | TEXT | Konsep desain |
| warna | VARCHAR(100) | Preferensi warna |
| ukuran | VARCHAR(100) | Ukuran desain |
| referensi | TEXT | Referensi visual |
| catatan | TEXT | Catatan tambahan |
| file_pendukung | VARCHAR(255) | File pendukung |
| estimasi_pengerjaan | VARCHAR(50) | Estimasi waktu |
| status | ENUM | Status pesanan |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

#### payment_db (Roihan)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT PK AUTO_INCREMENT | ID pembayaran |
| order_id | INT NOT NULL | Referensi ke order-service |
| user_id | INT NOT NULL | Referensi ke auth-service |
| metode_pembayaran | VARCHAR(100) | Metode pembayaran |
| jumlah | DECIMAL(12,2) | Jumlah pembayaran |
| bukti_pembayaran | VARCHAR(255) | Filename bukti |
| status_verifikasi | ENUM | Status verifikasi |
| tanggal_pembayaran | TIMESTAMP | Waktu pembayaran |
| verified_at | TIMESTAMP NULL | Waktu verifikasi |

#### recommendation_db (Roihan)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT PK AUTO_INCREMENT | ID rekomendasi |
| user_id | INT NOT NULL | Referensi ke auth-service |
| product_id | INT NOT NULL | Referensi ke product-service |
| score | DECIMAL(5,2) DEFAULT 50.00 | Skor relevansi (0-100) |
| reason | VARCHAR(255) | Alasan rekomendasi |
| created_at | TIMESTAMP | Waktu dibuat |

---

## API Gateway Routing Flow

```
Client Request
      │
      ▼
┌─────────────────────────────────┐
│       Nginx API Gateway         │
│         (Port 80)               │
│                                 │
│  1. Terima request              │
│  2. Match location block        │
│  3. Proxy ke upstream service   │
│  4. Forward headers             │
│     (Host, X-Real-IP)           │
│  5. Return response ke client   │
└─────────────────────────────────┘
      │
      ├── /              → upstream frontend   (frontend:3000)
      ├── /api/auth/     → upstream auth       (auth-service:3000)
      ├── /api/products/ → upstream product    (product-service:3000)
      ├── /api/orders/   → upstream order      (order-service:3001/orders/)
      ├── /api/payments/ → upstream payment    (payment-service:3002/payments/)
      ├── /api/recommendations/ → upstream recommendation (recommendation-service:3003/recommendations/)
      └── /api/portfolio/ → upstream portfolio  (portfolio-service:3004/portfolio/)
```

---

## Docker Design

### Base Images

| Komponen | Base Image | Alasan |
|----------|-----------|--------|
| Microservices | `node:18-alpine` | Ringan, Node.js LTS |
| API Gateway | `nginx:alpine` | Ringan, Nginx official |
| Database | `mysql:8.0` | MySQL LTS |

### Dockerfile Pattern (Microservices)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE <PORT>
CMD ["node", "app.js"]
```

### Docker Image Names

| Service | Image Name |
|---------|-----------|
| frontend | smileon-frontend |
| api-gateway | smileon-api-gateway |
| auth-service | smileon-auth-service |
| product-service | smileon-product-service |
| order-service | smileon-order-service |
| payment-service | smileon-payment-service |
| recommendation-service | smileon-recommendation-service |
| portfolio-service | smileon-portfolio-service |

---

## Kubernetes Deployment Design

### Resource per Microservice

Setiap microservice memiliki 5 Kubernetes resources:

| Resource | File | Deskripsi |
|----------|------|-----------|
| Deployment | `deployment.yaml` | Menjalankan pod service |
| Service | `service.yaml` | Expose service dalam cluster |
| ConfigMap | `mysql-deployment.yaml` | Init SQL untuk database |
| MySQL Deployment | `mysql-deployment.yaml` | Menjalankan pod MySQL |
| MySQL Service | `mysql-service.yaml` | Expose MySQL dalam cluster |
| PVC | `mysql-pvc.yaml` | Persistent storage untuk MySQL |

### Resource per Non-Microservice

Frontend dan API Gateway hanya memiliki 2 resources:

| Resource | File | Deskripsi |
|----------|------|-----------|
| Deployment | `deployment.yaml` | Menjalankan pod |
| Service | `service.yaml` | Expose dalam cluster |

### Service Types

| Service | K8s Service Type | Alasan |
|---------|-----------------|--------|
| api-gateway | NodePort | Diakses dari luar cluster |
| order-service | NodePort | Debug/testing dari luar |
| payment-service | NodePort | Debug/testing dari luar |
| frontend | ClusterIP | Diakses via gateway |
| auth-service | ClusterIP | Internal cluster only |
| product-service | ClusterIP | Internal cluster only |
| portfolio-service | ClusterIP | Internal cluster only |
| recommendation-service | ClusterIP | Internal cluster only |
| mysql-* | ClusterIP | Internal cluster only |

### Resource Limits

| Komponen | Memory Request | Memory Limit | CPU Request | CPU Limit |
|----------|---------------|-------------|-------------|-----------|
| Microservices | 128Mi | 256Mi | 100m | 500m |
| Frontend | 64Mi | 128Mi | 50m | 200m |
| API Gateway | 64Mi | 128Mi | 50m | 200m |
| MySQL pods | 256Mi | 512Mi | 200m | 1000m |

### Persistent Storage

Setiap MySQL pod menggunakan PVC (PersistentVolumeClaim) sebesar **1Gi** untuk menyimpan data database agar tidak hilang saat pod restart.
